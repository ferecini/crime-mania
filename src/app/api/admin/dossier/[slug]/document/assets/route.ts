import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { upsertDocumentAsset, readDraftDocument } from "@/lib/dossier/document-db";
import { DOSSIER_DOCUMENT_LIMITS } from "@/lib/dossier/document-limits";
import { createDossierStorage } from "@/lib/dossier/storage";
import { writeAdminAudit } from "@/lib/dossier/db";
import sharp from "sharp";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const { slug } = await params;
  if (!getDossierRecord(slug)) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const assetIdRaw = String(form.get("assetId") ?? "").trim();
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file obrigatório." }, { status: 400 });
  }
  const mime = file.type || "application/octet-stream";
  if (!DOSSIER_DOCUMENT_LIMITS.allowedImageMime.has(mime)) {
    return NextResponse.json({ error: "MIME de imagem não permitido." }, { status: 400 });
  }
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Imagem muito grande." }, { status: 400 });
  }

  const draft = await readDraftDocument(slug);
  const version = draft?.version ?? 1;
  const assetId =
    assetIdRaw.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) ||
    `upload-${Date.now().toString(36)}`;

  let webp: Buffer;
  try {
    webp = await sharp(buf).webp({ quality: 85 }).toBuffer();
  } catch {
    return NextResponse.json({ error: "Imagem inválida." }, { status: 400 });
  }

  const storageKey = `dossiers/documents/${slug}/v${version}/assets/${assetId}.webp`;
  const storage = await createDossierStorage();
  await storage.put(storageKey, webp, "image/webp");
  await upsertDocumentAsset({
    id: assetId,
    slug,
    storageKey,
    mimeType: "image/webp",
    byteSize: webp.length,
    altText: String(form.get("alt") ?? "").slice(0, 500) || undefined,
    caption: String(form.get("caption") ?? "").slice(0, 1000) || undefined,
    credit: String(form.get("credit") ?? "").slice(0, 300) || undefined,
  });

  await writeAdminAudit({
    actorId: auth.session.id,
    action: "dossier_html_asset_upload",
    slug,
    detail: { assetId },
  });

  return NextResponse.json({ ok: true, assetId, storageKey });
}
