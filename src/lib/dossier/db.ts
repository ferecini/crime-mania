import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import type { ProcessedDossierManifest } from "@/lib/dossier/types";
import type { DossierJobRecord } from "@/lib/dossier/jobs-types";

function sqlUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório para dossiês em produção.");
  return url;
}

function mapJob(row: Record<string, unknown>): DossierJobRecord {
  return {
    id: row.id as string,
    slug: row.slug as string,
    status: row.status as DossierJobRecord["status"],
    sourcePdfStorageKey: row.blob_path as string,
    sha256: row.sha256 as string,
    version: row.version as number,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
    requestedBy: (row.requested_by as string) ?? undefined,
    error: (row.error as string) ?? undefined,
    attempts: (row.attempts as number) ?? 0,
    progress: (row.progress as string) ?? undefined,
  };
}

export async function createDossierJob(input: {
  slug: string;
  blobPath: string;
  sha256: string;
  version: number;
  requestedBy?: string;
}): Promise<DossierJobRecord> {
  const sql = neon(sqlUrl());
  const id = randomUUID();
  const existing = await sql`
    SELECT id, status FROM dossier_jobs WHERE slug = ${input.slug} AND sha256 = ${input.sha256} LIMIT 1
  `;
  if (existing[0]) {
    const full = await sql`SELECT * FROM dossier_jobs WHERE id = ${existing[0].id as string}`;
    return mapJob(full[0] as Record<string, unknown>);
  }
  await sql`
    INSERT INTO dossier_jobs (id, slug, status, blob_path, sha256, version, requested_by)
    VALUES (${id}, ${input.slug}, 'uploaded', ${input.blobPath}, ${input.sha256}, ${input.version}, ${input.requestedBy ?? null})
  `;
  const rows = await sql`SELECT * FROM dossier_jobs WHERE id = ${id}`;
  return mapJob(rows[0] as Record<string, unknown>);
}

export async function claimNextDossierJob(workerId: string): Promise<DossierJobRecord | null> {
  const sql = neon(sqlUrl());
  const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const rows = await sql`
    SELECT * FROM dossier_jobs
    WHERE status IN ('uploaded', 'failed')
      AND attempts < max_attempts
      AND (locked_until IS NULL OR locked_until < NOW())
    ORDER BY created_at ASC
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const job = rows[0] as Record<string, unknown>;
  const updated = await sql`
    UPDATE dossier_jobs
    SET status = 'processing', attempts = attempts + 1, locked_until = ${lockUntil}::timestamptz,
        progress = 'claimed', updated_at = NOW()
    WHERE id = ${job.id as string} AND status IN ('uploaded', 'failed')
    RETURNING *
  `;
  if (!updated[0]) return null;
  void workerId;
  return mapJob(updated[0] as Record<string, unknown>);
}

export async function updateDossierJob(
  id: string,
  patch: Partial<Pick<DossierJobRecord, "status" | "error" | "progress">>,
): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`
    UPDATE dossier_jobs
    SET status = COALESCE(${patch.status ?? null}, status),
        error = COALESCE(${patch.error ?? null}, error),
        progress = COALESCE(${patch.progress ?? null}, progress),
        locked_until = NULL,
        updated_at = NOW()
    WHERE id = ${id}
  `;
}

export async function saveDraftManifest(slug: string, manifest: ProcessedDossierManifest): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`
    INSERT INTO dossier_manifests (slug, draft, updated_at)
    VALUES (${slug}, ${JSON.stringify(manifest)}::jsonb, NOW())
    ON CONFLICT (slug) DO UPDATE SET draft = EXCLUDED.draft, updated_at = NOW()
  `;
}

export async function publishManifest(slug: string, manifest: ProcessedDossierManifest): Promise<void> {
  const sql = neon(sqlUrl());
  const published = { ...manifest, status: "ready" as const, publishedAt: new Date().toISOString().slice(0, 10) };
  const draftReady = { ...published, status: "ready" as const };
  await sql`
    INSERT INTO dossier_manifests (slug, draft, published, updated_at)
    VALUES (${slug}, ${JSON.stringify(draftReady)}::jsonb, ${JSON.stringify(published)}::jsonb, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      published = EXCLUDED.published,
      draft = ${JSON.stringify(draftReady)}::jsonb,
      updated_at = NOW()
  `;
}

export async function unpublishManifest(slug: string): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`
    UPDATE dossier_manifests SET published = NULL, updated_at = NOW() WHERE slug = ${slug}
  `;
}

export async function getLatestDossierVersion(slug: string): Promise<number> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT draft, published FROM dossier_manifests WHERE slug = ${slug}`;
  if (!rows[0]) return 0;
  const draft = rows[0].draft as ProcessedDossierManifest | null;
  const published = rows[0].published as ProcessedDossierManifest | null;
  return Math.max(draft?.version ?? 0, published?.version ?? 0);
}

export async function readDraftManifest(slug: string): Promise<ProcessedDossierManifest | null> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT draft FROM dossier_manifests WHERE slug = ${slug}`;
  if (!rows[0]?.draft) return null;
  return rows[0].draft as ProcessedDossierManifest;
}

export async function readPublishedManifest(slug: string): Promise<ProcessedDossierManifest | null> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT published, draft FROM dossier_manifests WHERE slug = ${slug}`;
  if (rows[0]?.published) return rows[0].published as ProcessedDossierManifest;
  return null;
}

export async function writeAdminAudit(input: {
  actorId: string;
  action: string;
  slug?: string;
  detail?: unknown;
}): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`
    INSERT INTO dossier_admin_audit (id, actor_id, action, slug, detail)
    VALUES (${randomUUID()}, ${input.actorId}, ${input.action}, ${input.slug ?? null}, ${JSON.stringify(input.detail ?? null)}::jsonb)
  `;
}
