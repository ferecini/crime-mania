import { QA_USER_IDS } from "@/lib/auth/qa-users";
import { COMMERCIAL_PLANS, type CommercialPlanId } from "@/lib/billing/config";

const FIXED_QA_IDS = new Set(Object.values(QA_USER_IDS));

export function canUseBillingQaTest(input: {
  userId: string;
  isTestUser?: boolean;
}): boolean {
  return input.isTestUser === true && FIXED_QA_IDS.has(input.userId);
}

export function makeBillingQaResult(planId: CommercialPlanId) {
  const plan = COMMERCIAL_PLANS[planId];
  return {
    ok: true as const,
    simulated: true as const,
    status: "approved_simulation" as const,
    reference: `qa_${crypto.randomUUID()}`,
    planId,
    tier: plan.tier,
    billingCycle: plan.billingCycle,
    priceCents: plan.priceCents,
    priceLabel: (plan.priceCents / 100).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
    message:
      "Teste concluído sem cobrança. Nenhuma assinatura ou permissão foi alterada.",
  };
}
