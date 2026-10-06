import { NextResponse } from "next/server";
import { z } from "zod";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import {
  listDocumentVersionSnapshots,
  publishDocument,
  readDocumentVersionSnapshot,
  saveDraftDocument,
  unpublishDocument,
} from "@/lib/dossier/document-db";
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
  let versions: Awaited<ReturnType<typeof listDocumentVersionSnapshots>> = [];
  try {
    versions = await listDocumentVersionSnapshots(slug);
  } catch {
    /* migration 005 optional */
  }
  return NextResponse.json({ document, versions });
}

const patchSchema = z.object({
  document: z.any().optional(),
  action: z.enum(["save_draft", "publish", "unpublish", "new_version", "restore_version"]).optional(),
  versionId: z.string().optional(),
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
    const blockCount = document.sections.reduce((n, s) => n + s.blocks.length, 0);
    if (blockCount < 1) {
      return NextResponse.json({ error: "Documento sem blocos — não publicar." }, { status: 400 });
    }
    if (document.status === "failed") {
      return NextResponse.json(
        { error: "Extração falhou — corrija o rascunho antes de publicar." },
        { status: 400 },
      );
    }
    document = { ...document, status: "ready" };
    await publishDocument(slug, document, "html", auth.session.id);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_html_publish", slug });
    return NextResponse.json({ ok: true, document, published: true });
  }

  if (action === "new_version") {
    document = {
      ...document,
      version: document.version + 1,
      status: "needs_review",
      publishedAt: undefined,
    };
    await saveDraftDocument(slug, document);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_html_new_version", slug });
    return NextResponse.json({ ok: true, document });
  }

  if (action === "restore_version") {
    const versionId = parsed.data.versionId;
    if (!versionId) {
      return NextResponse.json({ error: "versionId obrigatório." }, { status: 400 });
    }
    const snap = await readDocumentVersionSnapshot(slug, versionId);
    if (!snap) {
      return NextResponse.json({ error: "Versão não encontrada." }, { status: 404 });
    }
    document = sanitizeDocument({ ...snap, status: "needs_review" });
    await saveDraftDocument(slug, document);
    await writeAdminAudit({
      actorId: auth.session.id,
      action: "dossier_html_restore_version",
      slug,
      detail: { versionId },
    });
    return NextResponse.json({ ok: true, document });
  }

  if (action === "unpublish") {
    await unpublishDocument(slug);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_html_unpublish", slug });
    return NextResponse.json({ ok: true, unpublished: true });
  }

  return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
}
