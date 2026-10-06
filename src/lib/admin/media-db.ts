import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";

export type MediaSection = "episodes" | "juris" | "archive";
export type MediaCatalogRow = {
  id: string;
  section: MediaSection;
  slug: string | null;
  title: string;
  description: string | null;
  durationSeconds: number | null;
  mediaType: "audio" | "video";
  provider: string;
  storageKey: string | null;
  streamPath: string | null;
  accessTier: string;
  dossierSlug: string | null;
  status: string;
};

function sqlUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório.");
  return url;
}

function mapRow(row: Record<string, unknown>): MediaCatalogRow {
  return {
    id: row.id as string,
    section: row.section as MediaSection,
    slug: (row.slug as string) ?? null,
    title: row.title as string,
    description: (row.description as string) ?? null,
    durationSeconds: (row.duration_seconds as number) ?? null,
    mediaType: row.media_type as "audio" | "video",
    provider: row.provider as string,
    storageKey: (row.storage_key as string) ?? null,
    streamPath: (row.stream_path as string) ?? null,
    accessTier: row.access_tier as string,
    dossierSlug: (row.dossier_slug as string) ?? null,
    status: row.status as string,
  };
}

export async function listMemberMedia(section?: MediaSection): Promise<MediaCatalogRow[]> {
  const sql = neon(sqlUrl());
  const rows = section
    ? await sql`SELECT * FROM member_media_catalog WHERE section = ${section} ORDER BY updated_at DESC`
    : await sql`SELECT * FROM member_media_catalog ORDER BY section, updated_at DESC`;
  return rows.map((r) => mapRow(r as Record<string, unknown>));
}

export async function upsertMemberMedia(input: Omit<MediaCatalogRow, "id"> & { id?: string }): Promise<MediaCatalogRow> {
  const sql = neon(sqlUrl());
  const id = input.id ?? randomUUID();
  await sql`
    INSERT INTO member_media_catalog (
      id, section, slug, title, description, duration_seconds, media_type, provider,
      storage_key, stream_path, access_tier, dossier_slug, status, updated_at
    ) VALUES (
      ${id}, ${input.section}, ${input.slug}, ${input.title}, ${input.description},
      ${input.durationSeconds}, ${input.mediaType}, ${input.provider},
      ${input.storageKey}, ${input.streamPath}, ${input.accessTier}, ${input.dossierSlug},
      ${input.status}, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      section = EXCLUDED.section,
      slug = EXCLUDED.slug,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      duration_seconds = EXCLUDED.duration_seconds,
      media_type = EXCLUDED.media_type,
      provider = EXCLUDED.provider,
      storage_key = EXCLUDED.storage_key,
      stream_path = EXCLUDED.stream_path,
      access_tier = EXCLUDED.access_tier,
      dossier_slug = EXCLUDED.dossier_slug,
      status = EXCLUDED.status,
      updated_at = NOW()
  `;
  const rows = await sql`SELECT * FROM member_media_catalog WHERE id = ${id}`;
  return mapRow(rows[0] as Record<string, unknown>);
}

export async function deleteMemberMedia(id: string): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`DELETE FROM member_media_catalog WHERE id = ${id}`;
}
