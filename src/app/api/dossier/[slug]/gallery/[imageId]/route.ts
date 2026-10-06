import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { canAccessDossierDocument } from "@/lib/dossier/access";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
import { readAdminGallery, readPublishedGallery } from "@/lib/gallery/db";
import { createDossierStorage } from "@/lib/dossier/storage";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; imageId: string }> },
) {
  const { slug, imageId } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const session = await getSession();
  const admin = isDossierAdmin(session);
  if (!admin && !canAccessDossierDocument(session, dossier)) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const manifest = admin ? await readAdminGallery(slug) : await readPublishedGallery(slug);
  const item = manifest?.items.find((i) => i.id === imageId);
  if (!item) {
    return NextResponse.json({ error: "Imagem não encontrada." }, { status: 404 });
  }

  const storage = await createDossierStorage();
  const data = await storage.get(item.storageKey);
  if (!data) {
    return NextResponse.json({ error: "Arquivo indisponível." }, { status: 503 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": item.mimeType,
      "Cache-Control": "private, max-age=300",
      "Content-Length": String(data.length),
    },
  });
}
