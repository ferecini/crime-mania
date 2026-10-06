import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { canAccessProcessedManifest } from "@/lib/dossier/access";
import { readProcessedManifest } from "@/lib/dossier/manifest-store";
import { toPublicManifest } from "@/lib/dossier/public-manifest";
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

  const session = await getSession();
  const manifest = await readProcessedManifest(slug);

  if (!manifest) {
    return NextResponse.json({ error: "Leitor nativo indisponível." }, { status: 503 });
  }

  if (manifest.status === "processing" || manifest.status === "uploaded") {
    return NextResponse.json({ status: manifest.status }, { status: 202 });
  }

  if (manifest.status === "failed") {
    return NextResponse.json(
      { error: manifest.processingError ?? "Falha no processamento." },
      { status: 503 },
    );
  }

  if (!canAccessProcessedManifest(session, manifest, dossier)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (manifest.status === "needs_review") {
    return NextResponse.json({ error: "Dossiê aguardando revisão editorial." }, { status: 503 });
  }

  return NextResponse.json(toPublicManifest(manifest), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
