import type { SessionUser } from "@/lib/auth/session";
import type { ProcessedDossierManifest } from "@/lib/dossier/types";
import type { DossierDocument } from "@/lib/dossier/document-types";
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

export function canAccessPublishedDocument(
  session: SessionUser | null,
  document: DossierDocument,
  dossier: DossierRecord,
): boolean {
  if (document.status !== "ready") return false;
  return canAccessDossierDocument(session, dossier);
}

/** Leitor legado por recortes — apenas com flag explícita. */
export function legacyCropReaderEnabled(): boolean {
  return process.env.DOSSIER_LEGACY_CROP_READER === "1";
}
