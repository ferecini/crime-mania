import { NextResponse } from "next/server";
import { z } from "zod";
import { listDossierRecords } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { writeAdminAudit } from "@/lib/dossier/db";
import { createDossierCatalog, listDossierCatalog } from "@/lib/admin/catalog-db";
import { assertAllowedSlug } from "@/lib/dossier/validate-pdf";

export async function GET() {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  const staticList = listDossierRecords().map((d) => ({
    slug: d.slug,
    title: d.title,
    category: d.category,
    accessTier: d.accessTier,
    source: "catalog" as const,
  }));
  let dynamic: Awaited<ReturnType<typeof listDossierCatalog>> = [];
  try {
    dynamic = await listDossierCatalog();
  } catch {
    /* postgres optional in dev */
  }
  const slugs = new Set(staticList.map((s) => s.slug));
  const merged = [
    ...staticList,
    ...dynamic
      .filter((d) => !slugs.has(d.slug))
      .map((d) => ({ ...d, source: "postgres" as const })),
  ];
  return NextResponse.json({ dossiers: merged });
}

const createSchema = z.object({
  slug: z.string().min(2).max(64),
  title: z.string().min(2).max(200),
  category: z.string().optional(),
  accessTier: z.enum(["tier1", "tier2"]).optional(),
  intro: z.string().optional(),
});

export async function POST(request: Request) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }
  try {
    assertAllowedSlug(parsed.data.slug);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Slug inválido." }, { status: 400 });
  }
  const row = await createDossierCatalog(parsed.data);
  await writeAdminAudit({
    actorId: auth.session.id,
    action: "dossier_catalog_create",
    slug: row.slug,
  });
  return NextResponse.json({ ok: true, dossier: row });
}
