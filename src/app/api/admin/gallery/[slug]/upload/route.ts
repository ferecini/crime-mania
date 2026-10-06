import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { writeAdminAudit } from "@/lib/dossier/db";
import { createDossierStorage } from "@/lib/dossier/storage";
import { assertAdminRateLimit } from "@/lib/admin/rate-limit";
import { readAdminGallery, saveDraftGallery } from "@/lib/gallery/db";
import { validateGalleryImage } from "@/lib/gallery/validate-image";
import type { GalleryItem } from "@/lib/gallery/types";

type Params = { params: Promise<{ slug: string }> };

export async function POST(request: Request, { params }: Params) {
  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Blob não configurado." }, { status: 503 });
  }

  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  const { slug } = await params;
  if (!getDossierRecord(slug)) {
    return NextResponse.json({ error: "Dossiê não catalogado." }, { status: 404 });
  }

  try {
    await assertAdminRateLimit(auth.session.id, "upload");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Limite." },
      { status: 429 },
    );
  }

  const form = await request.formData();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) {
    return NextResponse.json({ error: "Envie ao menos um arquivo." }, { status: 400 });
  }

  const storage = await createDossierStorage();
  let manifest = (await readAdminGallery(slug)) ?? { dossierSlug: slug, items: [], version: 1 };
  const startOrder = manifest.items.length;
  const added: GalleryItem[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const buf = Buffer.from(await file.arrayBuffer());
    let mimeType: string;
    let width: number;
    let height: number;
    try {
      ({ mimeType, width, height } = await validateGalleryImage(buf, file.type));
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Arquivo inválido." },
        { status: 400 },
      );
    }
    const id = randomUUID();
    const ext =
      mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : mimeType.split("/")[1];
    const key = `dossiers/gallery/${slug}/v${manifest.version}/${id}.${ext}`;
    await storage.put(key, buf, mimeType);
    added.push({
      id,
      order: startOrder + i + 1,
      caption: file.name.replace(/\.[^.]+$/, ""),
      alt: file.name,
      credit: "",
      sourceType: "editorial",
      isIllustrative: false,
      storageKey: key,
      mimeType,
      width,
      height,
    });
  }

  manifest = { ...manifest, items: [...manifest.items, ...added] };
  if (!manifest.coverImageId && added[0]) manifest.coverImageId = added[0].id;
  await saveDraftGallery(slug, manifest);
  await writeAdminAudit({
    actorId: auth.session.id,
    action: "gallery_upload",
    slug,
    detail: { count: added.length },
  });

  return NextResponse.json({ ok: true, added: added.map((a) => a.id), manifest });
}
