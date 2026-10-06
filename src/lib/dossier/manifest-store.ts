import fs from "node:fs";
import path from "node:path";
import type { ProcessedDossierManifest } from "@/lib/dossier/types";
import { readPublishedManifest, readDraftManifest } from "@/lib/dossier/db";

const PROCESSED_ROOT = path.join(process.cwd(), "private", "dossiers", "processed");

function hasPostgres(): boolean {
  return Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);
}

function manifestPathForSlug(slug: string): string {
  return path.join(PROCESSED_ROOT, slug, "manifest.json");
}

function readProcessedManifestFile(slug: string): ProcessedDossierManifest | null {
  const filePath = manifestPathForSlug(slug);
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as ProcessedDossierManifest;
  } catch {
    return null;
  }
}

/** Manifesto publicado para membros (tier + sessão). */
export async function readProcessedManifest(slug: string): Promise<ProcessedDossierManifest | null> {
  if (hasPostgres()) {
    try {
      const pub = await readPublishedManifest(slug);
      if (pub) return pub;
    } catch {
      /* fallback file dev */
    }
  }
  const file = readProcessedManifestFile(slug);
  if (file?.status === "ready") return file;
  return null;
}

/** Rascunho ou publicado para admin. */
export async function readAdminManifest(slug: string): Promise<ProcessedDossierManifest | null> {
  if (hasPostgres()) {
    try {
      const draft = await readDraftManifest(slug);
      if (draft) return draft;
      return await readPublishedManifest(slug);
    } catch {
      /* file fallback */
    }
  }
  return readProcessedManifestFile(slug);
}

export function writeProcessedManifestFile(slug: string, manifest: ProcessedDossierManifest): void {
  const dir = path.dirname(manifestPathForSlug(slug));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(manifestPathForSlug(slug), `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
}

export function pickVariantWidth(requested: number): 640 | 960 | 1440 {
  if (requested <= 720) return 640;
  if (requested <= 1200) return 960;
  return 1440;
}
