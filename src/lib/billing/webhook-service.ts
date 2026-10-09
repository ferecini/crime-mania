import {
  ASAAS_WEBHOOK_EVENTS_ALLOWLIST,
  COMMERCIAL_PLANS,
  isCommercialPlanId,
} from "@/lib/billing/config";
import {
  getSubscriptionById,
  getSubscriptionByProviderId,
  recordBillingEvent,
  updateSubscriptionFields,
} from "@/lib/billing/db";
import {
  nextStatusOnChargeback,
  nextStatusOnPaymentConfirmed,
  nextStatusOnPaymentOverdue,
  nextStatusOnRefund,
  periodEndFromCycle,
  tierForPlanId,
} from "@/lib/billing/state";
import { syncUserTierFromBilling } from "@/lib/billing/tier-sync";
import type { WebhookContext } from "@/lib/billing/types";

export function parseAsaasWebhookBody(body: unknown): WebhookContext | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;
  const event = (root.event as string | undefined) ?? (root.type as string | undefined);
  if (!event) return null;

  const payment = (root.payment ?? root.data) as Record<string, unknown> | undefined;
  const subscription = root.subscription as Record<string, unknown> | undefined;

  const eventId =
    (root.id as string | undefined) ??
    (payment?.id as string | undefined) ??
    `${event}_${Date.now()}`;

  return {
    eventId: String(eventId),
    eventType: event,
    paymentId: payment?.id ? String(payment.id) : undefined,
    subscriptionId:
      (subscription?.id as string | undefined) ??
      (payment?.subscription as string | undefined),
    customerId: payment?.customer
      ? String(payment.customer)
      : subscription?.customer
        ? String(subscription.customer)
        : undefined,
    status: payment?.status ? String(payment.status) : undefined,
    valueCents: payment?.value ? Math.round(Number(payment.value) * 100) : undefined,
    dueDate: payment?.dueDate ? String(payment.dueDate) : undefined,
    confirmedDate: payment?.confirmedDate ? String(payment.confirmedDate) : undefined,
  };
}

export function isWebhookEventAllowed(eventType: string): boolean {
  return ASAAS_WEBHOOK_EVENTS_ALLOWLIST.has(eventType);
}

export async function processAsaasWebhook(
  body: unknown,
): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  const ctx = parseAsaasWebhookBody(body);
  if (!ctx) return { ok: false, error: "payload_invalid" };
  if (!isWebhookEventAllowed(ctx.eventType)) {
    return { ok: true };
  }

  const inserted = await recordBillingEvent({
    id: ctx.eventId,
    eventType: ctx.eventType,
    paymentId: ctx.paymentId,
    payload: body,
  });
  if (!inserted) {
    return { ok: true, duplicate: true };
  }

  let sub =
    ctx.subscriptionId != null
      ? await getSubscriptionByProviderId(ctx.subscriptionId)
      : null;

  if (!sub && body && typeof body === "object") {
    const ext = (body as Record<string, unknown>).payment as Record<string, unknown> | undefined;
    const extRef = ext?.externalReference ?? (body as Record<string, unknown>).externalReference;
    if (typeof extRef === "string") {
      sub = await getSubscriptionById(extRef);
    }
  }

  if (!sub) {
    return { ok: true };
  }

  await applyWebhookToSubscription(sub.id, ctx);
  await syncUserTierFromBilling(sub.user_id);
  return { ok: true };
}

export async function applyWebhookToSubscription(
  subscriptionRowId: string,
  ctx: WebhookContext,
): Promise<void> {
  const sub = await getSubscriptionById(subscriptionRowId);
  if (!sub) return;

  const plan = isCommercialPlanId(sub.plan_id) ? COMMERCIAL_PLANS[sub.plan_id] : null;
  const cycle = plan?.billingCycle ?? "monthly";

  switch (ctx.eventType) {
    case "PAYMENT_CONFIRMED":
    case "PAYMENT_RECEIVED": {
      const start = ctx.confirmedDate ? new Date(ctx.confirmedDate) : new Date();
      const end = periodEndFromCycle(start, cycle);
      await updateSubscriptionFields(sub.id, {
        status: nextStatusOnPaymentConfirmed(sub.status),
        payment_id: ctx.paymentId ?? sub.payment_id,
        current_period_start: start.toISOString(),
        current_period_end: end.toISOString(),
        past_due_since: null,
        provider_subscription_id: ctx.subscriptionId ?? sub.provider_subscription_id,
      });
      break;
    }
    case "PAYMENT_OVERDUE": {
      await updateSubscriptionFields(sub.id, {
        status: nextStatusOnPaymentOverdue(),
        past_due_since: sub.past_due_since ?? new Date().toISOString(),
        payment_id: ctx.paymentId ?? sub.payment_id,
      });
      break;
    }
    case "PAYMENT_REFUNDED": {
      await updateSubscriptionFields(sub.id, {
        status: nextStatusOnRefund(),
      });
      break;
    }
    case "PAYMENT_CHARGEBACK_REQUESTED":
    case "PAYMENT_CHARGEBACK_DISPUTE": {
      await updateSubscriptionFields(sub.id, {
        status: nextStatusOnChargeback(),
      });
      break;
    }
    case "SUBSCRIPTION_INACTIVATED":
    case "SUBSCRIPTION_DELETED": {
      await updateSubscriptionFields(sub.id, {
        status: "expired",
      });
      break;
    }
    default:
      break;
  }

  void tierForPlanId(sub.plan_id);
}

/** Simula confirmação de pagamento (testes / modo fake). */
export async function simulatePaymentConfirmedForSubscription(
  subscriptionRowId: string,
): Promise<void> {
  const sub = await getSubscriptionById(subscriptionRowId);
  if (!sub) throw new Error("subscription_not_found");
  const plan = COMMERCIAL_PLANS[sub.plan_id];
  const start = new Date();
  const end = periodEndFromCycle(start, plan.billingCycle);
  await updateSubscriptionFields(sub.id, {
    status: "active",
    current_period_start: start.toISOString(),
    current_period_end: end.toISOString(),
    past_due_since: null,
  });
  await syncUserTierFromBilling(sub.user_id);
}
