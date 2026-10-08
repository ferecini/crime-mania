import type { CommercialPlanId } from "@/lib/billing/config";
import type { SubscriptionTier } from "@/lib/plans";

export type SubscriptionStatus =
  | "pending"
  | "active"
  | "past_due"
  | "canceled"
  | "expired"
  | "refunded"
  | "chargeback";

export interface BillingCustomerRow {
  user_id: string;
  provider: string;
  customer_id: string;
  email: string;
}

export interface BillingSubscriptionRow {
  id: string;
  user_id: string;
  plan_id: CommercialPlanId;
  billing_cycle: string;
  status: SubscriptionStatus;
  provider_subscription_id: string | null;
  provider_customer_id: string;
  payment_id: string | null;
  price_cents: number;
  currency: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  past_due_since: string | null;
}

export interface CheckoutSessionResult {
  mode: "hosted" | "simulated" | "tokenized";
  checkoutUrl: string;
  subscriptionId: string;
  providerSubscriptionId?: string;
  customerId: string;
  message?: string;
}

export interface BillingProvider {
  createCustomer(input: {
    userId: string;
    email: string;
    name: string;
  }): Promise<{ customerId: string }>;

  startCheckout(input: {
    userId: string;
    email: string;
    name: string;
    planId: CommercialPlanId;
    priceCents: number;
    existingCustomerId?: string;
    subscriptionId: string;
  }): Promise<CheckoutSessionResult>;

  cancelSubscription(providerSubscriptionId: string): Promise<void>;

  updatePaymentMethodStub?(): { message: string };
}

export interface WebhookContext {
  eventId: string;
  eventType: string;
  paymentId?: string;
  subscriptionId?: string;
  customerId?: string;
  status?: string;
  valueCents?: number;
  dueDate?: string;
  confirmedDate?: string;
}

export interface TierResolution {
  tier: SubscriptionTier;
  status: SubscriptionStatus | "none";
  blocked: boolean;
  reason?: string;
}
