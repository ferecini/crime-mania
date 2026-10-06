import { neon } from "@neondatabase/serverless";
import type { GalleryManifest } from "@/lib/gallery/types";

function sqlUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório.");
  return url;
}

export async function readPublishedGallery(slug: string): Promise<GalleryManifest | null> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT published FROM dossier_gallery_manifests WHERE dossier_slug = ${slug}`;
  if (!rows[0]?.published) return null;
  return rows[0].published as GalleryManifest;
}

export async function readDraftGallery(slug: string): Promise<GalleryManifest | null> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT draft FROM dossier_gallery_manifests WHERE dossier_slug = ${slug}`;
  if (!rows[0]?.draft) return null;
  return rows[0].draft as GalleryManifest;
}

export async function readAdminGallery(slug: string): Promise<GalleryManifest | null> {
  const draft = await readDraftGallery(slug);
  if (draft?.items?.length) return draft;
  return readPublishedGallery(slug);
}

export async function saveDraftGallery(slug: string, manifest: GalleryManifest): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`
    INSERT INTO dossier_gallery_manifests (dossier_slug, draft, updated_at)
    VALUES (${slug}, ${JSON.stringify(manifest)}::jsonb, NOW())
    ON CONFLICT (dossier_slug) DO UPDATE SET draft = EXCLUDED.draft, updated_at = NOW()
  `;
}

export async function publishGallery(slug: string, manifest: GalleryManifest): Promise<void> {
  const sql = neon(sqlUrl());
  const published = { ...manifest, publishedAt: new Date().toISOString().slice(0, 10) };
  await sql`
    INSERT INTO dossier_gallery_manifests (dossier_slug, draft, published, updated_at)
    VALUES (${slug}, ${JSON.stringify(published)}::jsonb, ${JSON.stringify(published)}::jsonb, NOW())
    ON CONFLICT (dossier_slug) DO UPDATE SET
      draft = EXCLUDED.draft,
      published = EXCLUDED.published,
      updated_at = NOW()
  `;
}

export async function unpublishGallery(slug: string): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`
    UPDATE dossier_gallery_manifests SET published = NULL, updated_at = NOW() WHERE dossier_slug = ${slug}
  `;
}
