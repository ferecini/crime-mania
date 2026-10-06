import { NextResponse } from "next/server";
import sharp from "sharp";
import { getDossierRecord } from "@/data/dossiers";
import { canAccessDossierDocument } from "@/lib/dossier/access";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
import { readAdminGallery, readPublishedGallery } from "@/lib/gallery/db";
import { createDossierStorage } from "@/lib/dossier/storage";
import { getSession } from "@/lib/auth/session";

export async function GET(
  request: Request,
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

  const url = new URL(request.url);
  const wRaw = Number(url.searchParams.get("w") ?? "0");
  const targetW = Number.isFinite(wRaw) && wRaw > 0 ? Math.min(1440, Math.round(wRaw)) : 0;

  let pipeline = sharp(data).rotate();
  try {
    pipeline = sharp(await pipeline.trim({ threshold: 14 }).toBuffer()).rotate();
  } catch {
    pipeline = sharp(data).rotate();
  }

  let outBuf: Buffer;
  let contentType = item.mimeType;
  if (targetW > 0) {
    outBuf = await pipeline
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality: 86, effort: 4 })
      .toBuffer();
    contentType = "image/webp";
  } else {
    outBuf = await pipeline.toBuffer();
  }

  return new NextResponse(new Uint8Array(outBuf), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300",
      "Content-Length": String(outBuf.length),
    },
  });
}
