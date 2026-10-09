import { COMMERCIAL_PLANS } from "@/lib/billing/config";
import { billingCheckoutEnabled } from "@/lib/features";
import { getLatestSubscriptionForUser } from "@/lib/billing/db";
import { getBillingProvider } from "@/lib/billing/provider-factory";
import type { SessionUser } from "@/lib/auth/session";

export async function getAccountBillingSummary(session: SessionUser) {
  if (session.isTestUser) {
    return {
      qa: true as const,
      message: "Conta de QA — tier gerenciado pelo seed, sem cobrança.",
      billingEnabled: billingCheckoutEnabled(),
      subscription: null,
    };
  }

  try {
    const sub = await getLatestSubscriptionForUser(session.id);
    const provider = getBillingProvider();
    const paymentMethodUpdate = provider.updatePaymentMethodStub?.();

    if (!sub) {
      return {
        qa: false as const,
        billingEnabled: billingCheckoutEnabled(),
        subscription: null,
        paymentMethodUpdate,
      };
    }

    const plan = COMMERCIAL_PLANS[sub.plan_id];
    return {
      qa: false as const,
      billingEnabled: billingCheckoutEnabled(),
      paymentMethodUpdate,
      subscription: {
        planId: sub.plan_id,
        planName: plan
          ? plan.tier === "tier2"
            ? "Tier 2"
            : "Tier 1"
          : sub.plan_id,
        billingCycle: sub.billing_cycle,
        status: sub.status,
        priceLabel: plan
          ? (plan.priceCents / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : null,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        nextDue: sub.current_period_end,
      },
    };
  } catch {
    return {
      qa: false as const,
      billingEnabled: billingCheckoutEnabled(),
      subscription: null,
      dbUnavailable: true as const,
    };
  }
}
