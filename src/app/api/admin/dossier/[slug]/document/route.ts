import { NextResponse } from "next/server";
import { z } from "zod";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { publishDocument, saveDraftDocument, unpublishDocument } from "@/lib/dossier/document-db";
import { readAdminDocument } from "@/lib/dossier/document-store";
import { writeAdminAudit } from "@/lib/dossier/db";
import type { DossierDocument } from "@/lib/dossier/document-types";
import { sanitizeDocument } from "@/lib/dossier/document-sanitize";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  const { slug } = await params;
  const document = await readAdminDocument(slug);
  if (!document) {
    return NextResponse.json({ error: "Sem documento HTML." }, { status: 404 });
  }
  return NextResponse.json({ document });
}

const patchSchema = z.object({
  document: z.any().optional(),
  action: z.enum(["save_draft", "publish", "unpublish"]).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const { slug } = await params;
  if (!getDossierRecord(slug)) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  let document = (parsed.data.document as DossierDocument | undefined) ?? (await readAdminDocument(slug));
  if (!document) {
    return NextResponse.json({ error: "Sem documento para editar." }, { status: 404 });
  }

  const action = parsed.data.action ?? "save_draft";
  document = sanitizeDocument(document);

  if (action === "save_draft") {
    document = { ...document, status: "needs_review" };
    await saveDraftDocument(slug, document);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_html_save_draft", slug });
    return NextResponse.json({ ok: true, document });
  }

  if (action === "publish") {
    document = { ...document, status: "ready" };
    await publishDocument(slug, document, "html");
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_html_publish", slug });
    return NextResponse.json({ ok: true, document, published: true });
  }

  if (action === "unpublish") {
    await unpublishDocument(slug);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_html_unpublish", slug });
    return NextResponse.json({ ok: true, unpublished: true });
  }

  return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
}
