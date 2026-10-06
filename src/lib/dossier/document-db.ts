import { neon } from "@neondatabase/serverless";
import type {
  DossierDocument,
  DossierDocumentAssetRecord,
  DossierPublishedFormat,
} from "@/lib/dossier/document-types";
import { sanitizeDocument } from "@/lib/dossier/document-sanitize";

function sqlUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório para documentos HTML.");
  return url;
}

export async function saveDraftDocument(slug: string, doc: DossierDocument): Promise<void> {
  const sql = neon(sqlUrl());
  const clean = sanitizeDocument(doc);
  await sql`
    INSERT INTO dossier_documents (slug, draft, version, updated_at)
    VALUES (${slug}, ${JSON.stringify(clean)}::jsonb, ${clean.version}, NOW())
    ON CONFLICT (slug) DO UPDATE SET
      draft = EXCLUDED.draft,
      version = EXCLUDED.version,
      updated_at = NOW()
  `;
}

export async function publishDocument(
  slug: string,
  doc: DossierDocument,
  format: DossierPublishedFormat = "html",
): Promise<void> {
  const sql = neon(sqlUrl());
  const clean = sanitizeDocument({
    ...doc,
    status: "ready",
    publishedAt: new Date().toISOString().slice(0, 10),
  });
  await sql`
    INSERT INTO dossier_documents (slug, draft, published, published_format, version, updated_at)
    VALUES (
      ${slug},
      ${JSON.stringify(clean)}::jsonb,
      ${JSON.stringify(clean)}::jsonb,
      ${format},
      ${clean.version},
      NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
      published = EXCLUDED.published,
      draft = EXCLUDED.draft,
      published_format = EXCLUDED.published_format,
      version = EXCLUDED.version,
      updated_at = NOW()
  `;
}

export async function unpublishDocument(slug: string): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`
    UPDATE dossier_documents SET published = NULL, updated_at = NOW() WHERE slug = ${slug}
  `;
}

export async function readDraftDocument(slug: string): Promise<DossierDocument | null> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT draft FROM dossier_documents WHERE slug = ${slug}`;
  if (!rows[0]?.draft) return null;
  return rows[0].draft as DossierDocument;
}

export async function readPublishedDocument(slug: string): Promise<DossierDocument | null> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT published FROM dossier_documents WHERE slug = ${slug}`;
  if (!rows[0]?.published) return null;
  return rows[0].published as DossierDocument;
}

export async function readPublishedFormat(slug: string): Promise<DossierPublishedFormat | null> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT published_format FROM dossier_documents WHERE slug = ${slug}`;
  if (!rows[0]?.published_format) return null;
  return rows[0].published_format as DossierPublishedFormat;
}

export async function upsertDocumentAsset(record: DossierDocumentAssetRecord): Promise<void> {
  const sql = neon(sqlUrl());
  await sql`
    INSERT INTO dossier_document_assets (id, slug, storage_key, mime_type, byte_size, alt_text, caption, credit)
    VALUES (
      ${record.id},
      ${record.slug},
      ${record.storageKey},
      ${record.mimeType},
      ${record.byteSize ?? null},
      ${record.altText ?? null},
      ${record.caption ?? null},
      ${record.credit ?? null}
    )
    ON CONFLICT (slug, id) DO UPDATE SET
      storage_key = EXCLUDED.storage_key,
      mime_type = EXCLUDED.mime_type,
      byte_size = EXCLUDED.byte_size,
      alt_text = EXCLUDED.alt_text,
      caption = EXCLUDED.caption,
      credit = EXCLUDED.credit
  `;
}

export async function readDocumentAsset(
  slug: string,
  assetId: string,
): Promise<DossierDocumentAssetRecord | null> {
  const sql = neon(sqlUrl());
  const rows = await sql`
    SELECT id, slug, storage_key, mime_type, byte_size, alt_text, caption, credit
    FROM dossier_document_assets
    WHERE slug = ${slug} AND id = ${assetId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  const r = rows[0] as Record<string, unknown>;
  return {
    id: r.id as string,
    slug: r.slug as string,
    storageKey: r.storage_key as string,
    mimeType: r.mime_type as string,
    byteSize: (r.byte_size as number) ?? undefined,
    altText: (r.alt_text as string) ?? undefined,
    caption: (r.caption as string) ?? undefined,
    credit: (r.credit as string) ?? undefined,
  };
}

export async function listDocumentAssets(slug: string): Promise<DossierDocumentAssetRecord[]> {
  const sql = neon(sqlUrl());
  const rows = await sql`
    SELECT id, slug, storage_key, mime_type, byte_size, alt_text, caption, credit
    FROM dossier_document_assets WHERE slug = ${slug}
  `;
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: r.id as string,
      slug: r.slug as string,
      storageKey: r.storage_key as string,
      mimeType: r.mime_type as string,
      byteSize: (r.byte_size as number) ?? undefined,
      altText: (r.alt_text as string) ?? undefined,
      caption: (r.caption as string) ?? undefined,
      credit: (r.credit as string) ?? undefined,
    };
  });
}
