import type { SessionUser } from "@/lib/auth/session";
import type { ProcessedDossierManifest } from "@/lib/dossier/types";
import type { DossierRecord } from "@/data/dossiers";
import { tierHasFeature } from "@/lib/plans";

export function canAccessDossierDocument(
  session: SessionUser | null,
  dossier: DossierRecord,
): boolean {
  const tier = session?.tier ?? "none";
  if (!tierHasFeature(tier, "dossierSummary")) return false;
  if (dossier.accessTier === "tier1") return tier === "tier1" || tier === "tier2";
  return tier === "tier2";
}

export function canAccessProcessedManifest(
  session: SessionUser | null,
  manifest: ProcessedDossierManifest,
  dossier: DossierRecord,
): boolean {
  if (manifest.status !== "ready") return false;
  return canAccessDossierDocument(session, dossier);
}
