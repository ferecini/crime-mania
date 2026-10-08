import type { PlanId } from "@/lib/plans";

/** Servidor — cobrança real só quando true. */
export function isServerBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === "true";
}

export function billingProviderName(): "asaas" | "fake" {
  const raw = (process.env.BILLING_PROVIDER ?? "asaas").trim().toLowerCase();
  if (!isServerBillingEnabled()) return "fake";
  return raw === "asaas" ? "asaas" : "fake";
}

export function asaasEnvironment(): "sandbox" | "production" {
  return process.env.ASAAS_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function asaasApiBaseUrl(): string {
  return asaasEnvironment() === "production"
    ? "https://api.asaas.com/v3"
    : "https://api-sandbox.asaas.com/v3";
}

export function appBaseUrl(): string {
  const base = process.env.APP_BASE_URL?.trim();
  if (base) return base.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const PAST_DUE_GRACE_DAYS = 5;

export type CommercialPlanId =
  | "tier1-monthly"
  | "tier2-monthly"
  | "tier1-yearly"
  | "tier2-yearly";

export interface CommercialPlan {
  id: CommercialPlanId;
  tier: "tier1" | "tier2";
  billingCycle: "monthly" | "yearly";
  priceCents: number;
  /** Preço de catálogo para novos cadastros após cancelamento */
  catalogPriceCents: number;
  asaasCycle: "MONTHLY" | "YEARLY";
}

export const COMMERCIAL_PLANS: Record<CommercialPlanId, CommercialPlan> = {
  "tier1-monthly": {
    id: "tier1-monthly",
    tier: "tier1",
    billingCycle: "monthly",
    priceCents: 900,
    catalogPriceCents: 900,
    asaasCycle: "MONTHLY",
  },
  "tier2-monthly": {
    id: "tier2-monthly",
    tier: "tier2",
    billingCycle: "monthly",
    priceCents: 2900,
    catalogPriceCents: 2900,
    asaasCycle: "MONTHLY",
  },
  "tier1-yearly": {
    id: "tier1-yearly",
    tier: "tier1",
    billingCycle: "yearly",
    priceCents: 9900,
    catalogPriceCents: 9900,
    asaasCycle: "YEARLY",
  },
  "tier2-yearly": {
    id: "tier2-yearly",
    tier: "tier2",
    billingCycle: "yearly",
    priceCents: 15900,
    catalogPriceCents: 15900,
    asaasCycle: "YEARLY",
  },
};

/** Lançamento Tier 2 anual — exibição only */
export const TIER2_YEARLY_LAUNCH = {
  wasPriceCents: 34800,
  saveCents: 18900,
  renewPriceCents: 15900,
} as const;

export function isCommercialPlanId(id: string): id is CommercialPlanId {
  return id in COMMERCIAL_PLANS;
}

export function planIdFromLegacy(id: string): PlanId {
  if (id === "tier2-annual") return "tier2-yearly";
  return id as PlanId;
}

export const ASAAS_WEBHOOK_EVENTS_ALLOWLIST = new Set([
  "PAYMENT_CREATED",
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_OVERDUE",
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_CHARGEBACK_REQUESTED",
  "PAYMENT_CHARGEBACK_DISPUTE",
  "SUBSCRIPTION_CREATED",
  "SUBSCRIPTION_UPDATED",
  "SUBSCRIPTION_INACTIVATED",
  "SUBSCRIPTION_DELETED",
]);
