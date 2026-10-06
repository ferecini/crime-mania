import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { canAccessProcessedManifest } from "@/lib/dossier/access";
import { readProcessedManifest } from "@/lib/dossier/manifest-store";
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
  if (!manifest || manifest.status !== "ready") {
    return NextResponse.json({ error: "Texto indisponível." }, { status: 503 });
  }

  if (!canAccessProcessedManifest(session, manifest, dossier)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  return NextResponse.json(
    { plainText: manifest.plainText ?? "" },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
