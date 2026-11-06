import { getDossierRecord, listDossierRecords, type DossierRecord } from "@/data/dossiers";
import { listDossierCatalog, type DossierCatalogRow } from "@/lib/admin/catalog-db";
import { readMemberDocument } from "@/lib/dossier/document-store";

function hasPostgres(): boolean {
  return Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);
}

function fromCatalogRow(row: DossierCatalogRow): DossierRecord {
  return {
    id: row.slug,
    slug: row.slug,
    title: row.title,
    category: row.category,
    summary: row.intro ?? "",
    intro: row.intro ?? "",
    documentFile: "",
    gallery: [],
    publishedAt: row.createdAt ?? "",
    accessTier: row.accessTier === "tier2" ? "tier2" : "tier1",
    textContent: {},
  };
}

/** Dossiês criados no admin (tabela dossier_catalog) — sem PDF e sem deploy. */
async function listCatalogRecords(): Promise<DossierRecord[]> {
  if (!hasPostgres()) return [];
  try {
    return (await listDossierCatalog()).map(fromCatalogRow);
  } catch {
    return [];
  }
}

/** Catálogo estático (src/data/dossiers.ts) primeiro; depois dossiês criados no admin. */
export async function resolveDossierRecord(slug: string): Promise<DossierRecord | undefined> {
  const fixed = getDossierRecord(slug);
  if (fixed) return fixed;
  return (await listCatalogRecords()).find((d) => d.slug === slug);
}

/** Lista para membros: dossiês do admin só aparecem quando há documento publicado. */
export async function listPublishedDossierRecords(): Promise<DossierRecord[]> {
  const fixed = listDossierRecords();
  const slugs = new Set(fixed.map((d) => d.slug));
  const candidates = (await listCatalogRecords()).filter((d) => !slugs.has(d.slug));
  const published: DossierRecord[] = [];
  for (const d of candidates) {
    if ((await readMemberDocument(d.slug))?.status === "ready") published.push(d);
  }
  return [...fixed, ...published];
}
