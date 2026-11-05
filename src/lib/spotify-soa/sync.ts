import { getUserById } from "@/lib/auth/users-store";
import { QA_USER_IDS } from "@/lib/auth/qa-users";
import { getBillingEffectiveTier } from "@/lib/billing/tier-sync";
import { replaceEntitlements } from "@/lib/spotify-soa/client";
import { isSpotifySoaReady } from "@/lib/spotify-soa/config";
import { hasSpotifySoaLink, recordSpotifySoaSync } from "@/lib/spotify-soa/db";
import { tierToEntitlements } from "@/lib/spotify-soa/entitlements";

const QA_IDS = new Set<string>(Object.values(QA_USER_IDS));

export type SpotifySoaSyncResult =
  | { synced: false; reason: "disabled" | "qa_user" | "not_linked" }
  | { synced: true; entitlements: string[] };

/**
 * Reenvia entitlements do usuário ao Spotify (replace-entitlements).
 * No-op se SOA desligado/mal configurado, usuário de QA ou usuário nunca vinculou Spotify.
 * Lança em caso de falha da API — chamadores devem capturar (ver syncSpotifyEntitlementsSafe).
 */
export async function syncSpotifyEntitlementsForUser(userId: string): Promise<SpotifySoaSyncResult> {
  if (!isSpotifySoaReady()) return { synced: false, reason: "disabled" };
  if (QA_IDS.has(userId) || getUserById(userId)?.isTestUser) {
    return { synced: false, reason: "qa_user" };
  }

  // Sem linha na auditoria = usuário nunca concluiu o fluxo de link.
  // Falha de DB/migration: não chama Spotify (evita 404 em massa no webhook).
  const linked = await hasSpotifySoaLink(userId).catch(() => false);
  if (!linked) return { synced: false, reason: "not_linked" };

  // pending => tier "none" => entitlements vazios (sem acesso até pagamento confirmado).
  const tier = await getBillingEffectiveTier(userId, false);
  const entitlements = tierToEntitlements(tier);
  await replaceEntitlements(userId, entitlements);
  await recordSpotifySoaSync(userId, entitlements).catch(() => undefined);
  return { synced: true, entitlements };
}

/** Wrapper seguro para webhooks: nunca lança. */
export async function syncSpotifyEntitlementsSafe(userId: string): Promise<void> {
  try {
    await syncSpotifyEntitlementsForUser(userId);
  } catch (err) {
    console.error(
      "[spotify-soa] sync falhou:",
      userId,
      err instanceof Error ? err.message : err,
    );
  }
}
