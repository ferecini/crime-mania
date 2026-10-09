import { getLatestSubscriptionForUser } from "@/lib/billing/db";
import { isServerBillingEnabled } from "@/lib/billing/config";
import { resolveTierFromSubscription } from "@/lib/billing/state";
import { getUserById, setUserTier, setUserTierAdmin } from "@/lib/auth/users-store";
import type { SubscriptionTier } from "@/lib/plans";

/** Sincroniza tier do users-store a partir da assinatura (somente após webhook / job). */
export async function syncUserTierFromBilling(userId: string): Promise<SubscriptionTier> {
  const user = getUserById(userId);
  if (!user || user.isTestUser) {
    return user?.tier ?? "none";
  }

  if (!isServerBillingEnabled()) {
    return user.tier;
  }

  let sub = null;
  try {
    sub = await getLatestSubscriptionForUser(userId);
  } catch {
    return user.tier;
  }

  const { tier } = resolveTierFromSubscription(sub);
  if (user.tier !== tier) {
    setUserTier(userId, tier);
  }
  return tier;
}

export async function getBillingEffectiveTier(userId: string, isTestUser?: boolean): Promise<SubscriptionTier> {
  if (isTestUser) {
    return getUserById(userId)?.tier ?? "none";
  }
  if (!isServerBillingEnabled()) {
    return getUserById(userId)?.tier ?? "none";
  }
  try {
    const sub = await getLatestSubscriptionForUser(userId);
    return resolveTierFromSubscription(sub).tier;
  } catch {
    return getUserById(userId)?.tier ?? "none";
  }
}

/** Apenas QA seed — não usar em produção */
export function forceTestUserTier(userId: string, tier: SubscriptionTier): void {
  setUserTierAdmin(userId, tier);
}
