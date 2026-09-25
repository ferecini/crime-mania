import type { SessionUser } from "@/lib/auth/session";
import {
  minTierForFeature,
  tierHasFeature,
  type FeatureKey,
  type SubscriptionTier,
} from "@/lib/plans";

export interface PaywallState {
  allowed: boolean;
  reason: "guest" | "registered" | "upgrade" | null;
  message: string;
  ctaHref: string;
  ctaLabel: string;
  requiredTier: SubscriptionTier;
}

export function evaluateAccess(
  user: SessionUser | null,
  feature: FeatureKey,
): PaywallState {
  const requiredTier = minTierForFeature(feature);
  const tier = user?.tier ?? "none";

  if (tierHasFeature(tier, feature)) {
    return {
      allowed: true,
      reason: null,
      message: "",
      ctaHref: "",
      ctaLabel: "",
      requiredTier,
    };
  }

  if (!user) {
    return {
      allowed: false,
      reason: "guest",
      message: "Entre ou crie sua conta para acessar este conteúdo.",
      ctaHref: `/entrar?next=${encodeURIComponent("/membro")}`,
      ctaLabel: "Entrar",
      requiredTier,
    };
  }

  if (user.tier === "none") {
    return {
      allowed: false,
      reason: "registered",
      message: "Conheça os planos e escolha a assinatura ideal para você.",
      ctaHref: "/membro/planos",
      ctaLabel: "Ver planos",
      requiredTier,
    };
  }

  return {
    allowed: false,
    reason: "upgrade",
    message: "Disponível no Tier 2 — faça upgrade para desbloquear.",
    ctaHref: "/membro/planos",
    ctaLabel: "Fazer upgrade",
    requiredTier,
  };
}
