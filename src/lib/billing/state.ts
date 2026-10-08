import { COMMERCIAL_PLANS, PAST_DUE_GRACE_DAYS } from "@/lib/billing/config";
import type { BillingSubscriptionRow, SubscriptionStatus, TierResolution } from "@/lib/billing/types";
import type { SubscriptionTier } from "@/lib/plans";

export function tierForPlanId(planId: string): SubscriptionTier {
  const plan = COMMERCIAL_PLANS[planId as keyof typeof COMMERCIAL_PLANS];
  return plan?.tier ?? "none";
}

export function addDays(iso: string, days: number): Date {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

export function resolveTierFromSubscription(
  sub: BillingSubscriptionRow | null,
  now = new Date(),
): TierResolution {
  if (!sub) {
    return { tier: "none", status: "none", blocked: false };
  }

  const planTier = tierForPlanId(sub.plan_id);
  const status = sub.status;

  if (status === "active" || status === "pending") {
    if (sub.cancel_at_period_end && sub.current_period_end) {
      const end = new Date(sub.current_period_end);
      if (now > end) {
        return { tier: "none", status: "expired", blocked: false, reason: "period_ended" };
      }
    }
    if (status === "pending") {
      return { tier: "none", status: "pending", blocked: true, reason: "awaiting_payment" };
    }
    return { tier: planTier, status, blocked: false };
  }

  if (status === "past_due") {
    const since = sub.past_due_since ? new Date(sub.past_due_since) : now;
    const graceEnd = addDays(since.toISOString(), PAST_DUE_GRACE_DAYS);
    if (now <= graceEnd) {
      return { tier: planTier, status, blocked: false, reason: "grace_period" };
    }
    return { tier: "none", status, blocked: true, reason: "past_due_grace_exceeded" };
  }

  if (status === "canceled") {
    if (sub.current_period_end) {
      const end = new Date(sub.current_period_end);
      if (now <= end) {
        return { tier: planTier, status, blocked: false, reason: "cancel_at_period_end" };
      }
    }
    return { tier: "none", status: "expired", blocked: false };
  }

  if (status === "expired" || status === "refunded" || status === "chargeback") {
    return { tier: "none", status, blocked: true, reason: status };
  }

  return { tier: "none", status, blocked: true };
}

export function nextStatusOnPaymentConfirmed(
  current: SubscriptionStatus,
): SubscriptionStatus {
  if (current === "refunded" || current === "chargeback") return current;
  return "active";
}

export function nextStatusOnPaymentOverdue(): SubscriptionStatus {
  return "past_due";
}

export function nextStatusOnRefund(): SubscriptionStatus {
  return "refunded";
}

export function nextStatusOnChargeback(): SubscriptionStatus {
  return "chargeback";
}

export function periodEndFromCycle(start: Date, cycle: "monthly" | "yearly"): Date {
  const end = new Date(start);
  if (cycle === "yearly") {
    end.setUTCFullYear(end.getUTCFullYear() + 1);
  } else {
    end.setUTCMonth(end.getUTCMonth() + 1);
  }
  return end;
}
