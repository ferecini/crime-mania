import type { SubscriptionTier } from "@/lib/plans";

/**
 * IDs de entitlement cadastrados no Spotify for Podcasters.
 * Padrão: "tier1" / "tier2" (sobrescreva com SPOTIFY_SOA_ENTITLEMENT_TIER1 / TIER2).
 * Tier 2 NÃO inclui automaticamente o ID do Tier 1 — configure os shows no Spotify de acordo.
 */
export function tierToEntitlements(tier: SubscriptionTier): string[] {
  if (tier === "tier1") {
    return [process.env.SPOTIFY_SOA_ENTITLEMENT_TIER1?.trim() || "tier1"];
  }
  if (tier === "tier2") {
    return [process.env.SPOTIFY_SOA_ENTITLEMENT_TIER2?.trim() || "tier2"];
  }
  return [];
}

export function isSoaEligibleTier(tier: SubscriptionTier): boolean {
  return tier === "tier1" || tier === "tier2";
}
