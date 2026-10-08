import { neon } from "@neondatabase/serverless";
import type { CommercialPlanId } from "@/lib/billing/config";
import type {
  BillingCustomerRow,
  BillingSubscriptionRow,
  SubscriptionStatus,
} from "@/lib/billing/types";

function sqlUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório para billing.");
  return url;
}

function getSql() {
  return neon(sqlUrl());
}

export async function getBillingCustomerByUserId(
  userId: string,
): Promise<BillingCustomerRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT user_id, provider, customer_id, email
    FROM billing_customers WHERE user_id = ${userId}
  `;
  return (rows[0] as BillingCustomerRow | undefined) ?? null;
}

export async function upsertBillingCustomer(input: {
  userId: string;
  customerId: string;
  email: string;
  provider?: string;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO billing_customers (user_id, provider, customer_id, email, updated_at)
    VALUES (${input.userId}, ${input.provider ?? "asaas"}, ${input.customerId}, ${input.email}, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
      customer_id = EXCLUDED.customer_id,
      email = EXCLUDED.email,
      updated_at = NOW()
  `;
}

export async function getLatestSubscriptionForUser(
  userId: string,
): Promise<BillingSubscriptionRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT *
    FROM billing_subscriptions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return (rows[0] as BillingSubscriptionRow | undefined) ?? null;
}

export async function getSubscriptionById(id: string): Promise<BillingSubscriptionRow | null> {
  const sql = getSql();
  const rows = await sql`SELECT * FROM billing_subscriptions WHERE id = ${id}`;
  return (rows[0] as BillingSubscriptionRow | undefined) ?? null;
}

export async function getSubscriptionByProviderId(
  providerSubscriptionId: string,
): Promise<BillingSubscriptionRow | null> {
  const sql = getSql();
  const rows = await sql`
    SELECT * FROM billing_subscriptions
    WHERE provider_subscription_id = ${providerSubscriptionId}
    LIMIT 1
  `;
  return (rows[0] as BillingSubscriptionRow | undefined) ?? null;
}

export async function insertSubscription(input: {
  id: string;
  userId: string;
  planId: CommercialPlanId;
  billingCycle: string;
  status: SubscriptionStatus;
  providerSubscriptionId?: string | null;
  providerCustomerId: string;
  paymentId?: string | null;
  priceCents: number;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
}): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO billing_subscriptions (
      id, user_id, plan_id, billing_cycle, status,
      provider_subscription_id, provider_customer_id, payment_id,
      price_cents, current_period_start, current_period_end, updated_at
    ) VALUES (
      ${input.id},
      ${input.userId},
      ${input.planId},
      ${input.billingCycle},
      ${input.status},
      ${input.providerSubscriptionId ?? null},
      ${input.providerCustomerId},
      ${input.paymentId ?? null},
      ${input.priceCents},
      ${input.currentPeriodStart?.toISOString() ?? null},
      ${input.currentPeriodEnd?.toISOString() ?? null},
      NOW()
    )
  `;
}

export async function updateSubscriptionFields(
  id: string,
  patch: Partial<{
    status: SubscriptionStatus;
    provider_subscription_id: string | null;
    payment_id: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    past_due_since: string | null;
    price_cents: number;
  }>,
): Promise<void> {
  const sql = getSql();
  const sub = await getSubscriptionById(id);
  if (!sub) return;

  const status = patch.status ?? sub.status;
  const providerSubId =
    patch.provider_subscription_id !== undefined
      ? patch.provider_subscription_id
      : sub.provider_subscription_id;
  const paymentId = patch.payment_id !== undefined ? patch.payment_id : sub.payment_id;
  const periodStart =
    patch.current_period_start !== undefined
      ? patch.current_period_start
      : sub.current_period_start;
  const periodEnd =
    patch.current_period_end !== undefined ? patch.current_period_end : sub.current_period_end;
  const cancelAtEnd =
    patch.cancel_at_period_end !== undefined ? patch.cancel_at_period_end : sub.cancel_at_period_end;
  const canceledAt = patch.canceled_at !== undefined ? patch.canceled_at : sub.canceled_at;
  const pastDueSince =
    patch.past_due_since !== undefined ? patch.past_due_since : sub.past_due_since;
  const priceCents = patch.price_cents ?? sub.price_cents;

  await sql`
    UPDATE billing_subscriptions SET
      status = ${status},
      provider_subscription_id = ${providerSubId},
      payment_id = ${paymentId},
      current_period_start = ${periodStart},
      current_period_end = ${periodEnd},
      cancel_at_period_end = ${cancelAtEnd},
      canceled_at = ${canceledAt},
      past_due_since = ${pastDueSince},
      price_cents = ${priceCents},
      updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function recordBillingEvent(input: {
  id: string;
  eventType: string;
  subscriptionId?: string | null;
  paymentId?: string | null;
  payload: unknown;
  provider?: string;
}): Promise<boolean> {
  const sql = getSql();
  const existing = await sql`SELECT id FROM billing_events WHERE id = ${input.id}`;
  if (existing.length > 0) return false;

  await sql`
    INSERT INTO billing_events (id, provider, event_type, subscription_id, payment_id, payload)
    VALUES (
      ${input.id},
      ${input.provider ?? "asaas"},
      ${input.eventType},
      ${input.subscriptionId ?? null},
      ${input.paymentId ?? null},
      ${JSON.stringify(input.payload)}::jsonb
    )
  `;
  return true;
}
