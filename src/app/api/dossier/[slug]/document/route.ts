import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { canAccessPublishedDocument } from "@/lib/dossier/access";
import { readMemberDocument, resolvePublishedFormat } from "@/lib/dossier/document-store";
import { toPublicDocument } from "@/lib/dossier/public-document";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const format = await resolvePublishedFormat(slug);
  if (format !== "html") {
    return NextResponse.json({ error: "Leitor HTML indisponível para este dossiê." }, { status: 503 });
  }

  const session = await getSession();
  const document = await readMemberDocument(slug);

  if (!document) {
    return NextResponse.json({ error: "Documento editorial indisponível." }, { status: 503 });
  }

  if (document.status === "processing" || document.status === "uploaded") {
    return NextResponse.json({ status: document.status }, { status: 202 });
  }

  if (document.status === "failed") {
    return NextResponse.json(
      { error: document.processingError ?? "Falha na extração do documento." },
      { status: 503 },
    );
  }

  if (document.status === "needs_review") {
    return NextResponse.json({ error: "Dossiê aguardando revisão editorial." }, { status: 503 });
  }

  if (!canAccessPublishedDocument(session, document, dossier)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  return NextResponse.json(toPublicDocument(document, Boolean(dossier.documentFile)), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
