import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { COMMERCIAL_PLANS } from "@/lib/billing/config";
import { getLatestSubscriptionForUser } from "@/lib/billing/db";
import { resolveTierFromSubscription } from "@/lib/billing/state";
import { getBillingProvider } from "@/lib/billing/provider-factory";
import { billingCheckoutEnabled } from "@/lib/features";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Autenticação necessária." }, { status: 401 });
  }

  if (session.isTestUser) {
    return NextResponse.json({
      qa: true,
      tier: session.tier,
      message: "Conta QA — tier gerenciado pelo seed, sem cobrança.",
    });
  }

  try {
    const sub = await getLatestSubscriptionForUser(session.id);
    if (!sub) {
      return NextResponse.json({ subscription: null, tier: session.tier });
    }
    const plan = COMMERCIAL_PLANS[sub.plan_id];
    const access = resolveTierFromSubscription(sub);
    const provider = getBillingProvider();
    const paymentMethod =
      provider.updatePaymentMethodStub?.() ??
      ({ message: "Indisponível." } as { message: string });

    return NextResponse.json({
      subscription: {
        id: sub.id,
        planId: sub.plan_id,
        planName: plan ? `Tier ${plan.tier === "tier2" ? "2" : "1"}` : sub.plan_id,
        billingCycle: sub.billing_cycle,
        status: sub.status,
        priceCents: sub.price_cents,
        priceLabel: plan
          ? (plan.priceCents / 100).toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })
          : null,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        nextDue: sub.current_period_end,
      },
      access,
      billingEnabled: billingCheckoutEnabled(),
      paymentMethodUpdate: paymentMethod,
    });
  } catch {
    return NextResponse.json({
      subscription: null,
      tier: session.tier,
      billingEnabled: billingCheckoutEnabled(),
      dbUnavailable: true,
    });
  }
}
