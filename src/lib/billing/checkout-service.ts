import { COMMERCIAL_PLANS, isCommercialPlanId, isServerBillingEnabled } from "@/lib/billing/config";
import {
  getBillingCustomerByUserId,
  getLatestSubscriptionForUser,
  insertSubscription,
  upsertBillingCustomer,
  updateSubscriptionFields,
} from "@/lib/billing/db";
import { getBillingProvider } from "@/lib/billing/provider-factory";
import type { CheckoutSessionResult } from "@/lib/billing/types";
import { getUserById } from "@/lib/auth/users-store";

export async function startBillingCheckout(input: {
  userId: string;
  email: string;
  displayName: string;
  planId: string;
}): Promise<CheckoutSessionResult> {
  const user = getUserById(input.userId);
  if (!user) throw new Error("Conta não encontrada.");
  if (user.isTestUser) {
    throw new Error("Contas de QA não usam checkout de cobrança.");
  }
  if (!isCommercialPlanId(input.planId)) {
    throw new Error("Plano inválido.");
  }

  const plan = COMMERCIAL_PLANS[input.planId];
  const existing = await getLatestSubscriptionForUser(input.userId);
  if (existing && (existing.status === "active" || existing.status === "pending")) {
    throw new Error("Já existe uma assinatura em andamento. Gerencie em Minha conta.");
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

  await insertSubscription({
    id: subscriptionId,
    userId: input.userId,
    planId: input.planId,
    billingCycle: plan.billingCycle,
    status: "pending",
    providerCustomerId: customer.customer_id,
    priceCents: plan.priceCents,
  });

  const session = await provider.startCheckout({
    userId: input.userId,
    email: input.email,
    name: input.displayName,
    planId: input.planId,
    priceCents: plan.priceCents,
    existingCustomerId: customer.customer_id,
    subscriptionId,
  });

  if (session.providerSubscriptionId) {
    await updateSubscriptionFields(subscriptionId, {
      provider_subscription_id: session.providerSubscriptionId,
    });
  }

  return { ...session, subscriptionId };
}

export async function cancelBillingAtPeriodEnd(userId: string): Promise<void> {
  const user = getUserById(userId);
  if (!user || user.isTestUser) {
    throw new Error("Cancelamento indisponível para esta conta.");
  }
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
