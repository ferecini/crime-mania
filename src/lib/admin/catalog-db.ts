import { neon } from "@neondatabase/serverless";

export type DossierCatalogRow = {
  slug: string;
  title: string;
  category: string;
  accessTier: string;
  intro: string | null;
  status: string;
};

function sqlUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório.");
  return url;
}

export async function listDossierCatalog(): Promise<DossierCatalogRow[]> {
  const sql = neon(sqlUrl());
  const rows = await sql`SELECT * FROM dossier_catalog ORDER BY updated_at DESC`;
  return rows.map((r) => ({
    slug: r.slug as string,
    title: r.title as string,
    category: r.category as string,
    accessTier: r.access_tier as string,
    intro: (r.intro as string) ?? null,
    status: r.status as string,
  }));
}

export async function createDossierCatalog(input: {
  slug: string;
  title: string;
  category?: string;
  accessTier?: string;
  intro?: string;
}): Promise<DossierCatalogRow> {
  const sql = neon(sqlUrl());
  await sql`
    INSERT INTO dossier_catalog (slug, title, category, access_tier, intro, status)
    VALUES (
      ${input.slug}, ${input.title}, ${input.category ?? "ASSASSINATO"},
      ${input.accessTier ?? "tier1"}, ${input.intro ?? null}, 'draft'
    )
  `;
  const rows = await sql`SELECT * FROM dossier_catalog WHERE slug = ${input.slug}`;
  const r = rows[0];
  return {
    slug: r.slug as string,
    title: r.title as string,
    category: r.category as string,
    accessTier: r.access_tier as string,
    intro: (r.intro as string) ?? null,
    status: r.status as string,
  };
}
