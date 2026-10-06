import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { canAccessDossierDocument } from "@/lib/dossier/access";
import { readPublishedGallery } from "@/lib/gallery/db";
import { toPublicGalleryManifest } from "@/lib/gallery/public-manifest";
import { getSession } from "@/lib/auth/session";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const session = await getSession();
  if (!canAccessDossierDocument(session, dossier)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const manifest = await readPublishedGallery(slug);
  if (!manifest?.items?.length) {
    return NextResponse.json({ error: "Galeria indisponível." }, { status: 503 });
  }

  return NextResponse.json(toPublicGalleryManifest(manifest), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
