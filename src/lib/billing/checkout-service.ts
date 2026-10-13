import { COMMERCIAL_PLANS, isCommercialPlanId, isServerBillingEnabled } from "@/lib/billing/config";
import {
  deleteSubscriptionById,
  getBillingCustomerByUserId,
  getLatestSubscriptionForUser,
  insertSubscription,
  upsertBillingCustomer,
  updateSubscriptionFields,
} from "@/lib/billing/db";
import { checkAsaasConnection } from "@/lib/billing/asaas-provider";
import { getBillingProvider } from "@/lib/billing/provider-factory";
import type { CheckoutSessionResult } from "@/lib/billing/types";
import { assertBillingAccountAllowed, type BillingSessionContext } from "@/lib/billing/billing-account";

export async function startBillingCheckout(input: {
  userId: string;
  email: string;
  displayName: string;
  planId: string;
  session?: BillingSessionContext | null;
}): Promise<CheckoutSessionResult> {
  assertBillingAccountAllowed(input.userId, {
    isTestUser: input.session?.isTestUser,
    email: input.email,
  });
  if (!isCommercialPlanId(input.planId)) {
    throw new Error("Plano inválido.");
  }

  const plan = COMMERCIAL_PLANS[input.planId];
  const existing = await getLatestSubscriptionForUser(input.userId);
  if (existing?.status === "active") {
    throw new Error("Já existe uma assinatura ativa. Gerencie em Minha conta.");
  }
  if (existing?.status === "pending") {
    throw new Error(
      "Há um checkout pendente. Em Minha conta, cancele a tentativa ou conclua o pagamento.",
    );
  }

  if (isServerBillingEnabled()) {
    try {
      const asaas = await checkAsaasConnection();
      if (!asaas.ok) {
        throw new Error(
          asaas.status === 401
            ? "Pagamento indisponível: chave Asaas inválida ou ausente. A equipe precisa configurar ASAAS_API_KEY na Vercel."
            : "Pagamento indisponível: não foi possível conectar ao Asaas. Tente mais tarde.",
        );
      }
    } catch (err) {
      if (err instanceof Error && /ASAAS_API_KEY/i.test(err.message)) {
        throw new Error(
          "Pagamento indisponível: chave Asaas inválida ou ausente. A equipe precisa configurar ASAAS_API_KEY na Vercel.",
        );
      }
      throw err;
    }
  }

  const subscriptionId = crypto.randomUUID();
  const provider = getBillingProvider();
  let customer = await getBillingCustomerByUserId(input.userId);
  if (!customer) {
    const created = await provider.createCustomer({
      userId: input.userId,
      email: input.email,
      name: input.displayName,
    });
    await upsertBillingCustomer({
      userId: input.userId,
      customerId: created.customerId,
      email: input.email,
    });
    customer = {
      user_id: input.userId,
      provider: isServerBillingEnabled() ? "asaas" : "fake",
      customer_id: created.customerId,
      email: input.email,
    };
  }

  let session: CheckoutSessionResult;
  try {
    session = await provider.startCheckout({
      userId: input.userId,
      email: input.email,
      name: input.displayName,
      planId: input.planId,
      priceCents: plan.priceCents,
      existingCustomerId: customer.customer_id,
      subscriptionId,
    });
  } catch (err) {
    throw err instanceof Error ? err : new Error("Checkout indisponível.");
  }

  if (isServerBillingEnabled()) {
    if (session.mode === "simulated") {
      throw new Error(
        "Checkout simulado não permitido com cobrança real. Verifique BILLING_PROVIDER e ASAAS_API_KEY.",
      );
    }
    if (session.mode !== "hosted" || !session.checkoutUrl?.startsWith("http")) {
      throw new Error("Asaas não retornou link de pagamento válido.");
    }
  }

  try {
    await insertSubscription({
      id: subscriptionId,
      userId: input.userId,
      planId: input.planId,
      billingCycle: plan.billingCycle,
      status: "pending",
      providerCustomerId: customer.customer_id,
      providerSubscriptionId: session.providerSubscriptionId ?? null,
      priceCents: plan.priceCents,
    });
  } catch (err) {
    if (session.providerSubscriptionId && isServerBillingEnabled()) {
      await provider.cancelSubscription(session.providerSubscriptionId).catch(() => undefined);
    }
    throw err instanceof Error ? err : new Error("Não foi possível registrar a assinatura.");
  }

  return { ...session, subscriptionId };
}

export async function abandonPendingCheckout(
  userId: string,
  session?: BillingSessionContext | null,
): Promise<void> {
  assertBillingAccountAllowed(userId, session);
  const sub = await getLatestSubscriptionForUser(userId);
  if (!sub || sub.status !== "pending") {
    throw new Error("Nenhum checkout pendente para cancelar.");
  }

  const provider = getBillingProvider();
  if (sub.provider_subscription_id && isServerBillingEnabled()) {
    await provider.cancelSubscription(sub.provider_subscription_id);
  }

  await deleteSubscriptionById(sub.id);
}

export async function cancelBillingAtPeriodEnd(
  userId: string,
  session?: BillingSessionContext | null,
): Promise<void> {
  assertBillingAccountAllowed(userId, session);
  const sub = await getLatestSubscriptionForUser(userId);
  if (!sub || sub.status !== "active") {
    throw new Error("Nenhuma assinatura ativa para cancelar.");
  }
  if (sub.cancel_at_period_end) {
    throw new Error("Cancelamento já agendado para o fim do período.");
  }

  const provider = getBillingProvider();
  if (sub.provider_subscription_id && isServerBillingEnabled()) {
    await provider.cancelSubscription(sub.provider_subscription_id);
  }

  await updateSubscriptionFields(sub.id, {
    cancel_at_period_end: true,
    canceled_at: new Date().toISOString(),
  });
}
