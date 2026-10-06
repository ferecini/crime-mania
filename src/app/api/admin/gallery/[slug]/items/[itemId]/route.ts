import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { writeAdminAudit } from "@/lib/dossier/db";
import { createDossierStorage } from "@/lib/dossier/storage";
import { assertAdminRateLimit } from "@/lib/admin/rate-limit";
import { readAdminGallery, saveDraftGallery } from "@/lib/gallery/db";

type Params = { params: Promise<{ slug: string; itemId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const { slug, itemId } = await params;
  if (!getDossierRecord(slug)) {
    return NextResponse.json({ error: "Dossiê não catalogado." }, { status: 404 });
  }

  try {
    await assertAdminRateLimit(auth.session.id, "delete");
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Limite." },
      { status: 429 },
    );
  }

  const manifest = await readAdminGallery(slug);
  if (!manifest) {
    return NextResponse.json({ error: "Sem galeria." }, { status: 404 });
  }
  const item = manifest.items.find((i) => i.id === itemId);
  if (!item) {
    return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
  }

  const storage = await createDossierStorage();
  await storage.delete(item.storageKey);

  const items = manifest.items
    .filter((i) => i.id !== itemId)
    .map((it, idx) => ({ ...it, order: idx + 1 }));
  const coverImageId =
    manifest.coverImageId === itemId ? (items[0]?.id ?? undefined) : manifest.coverImageId;
  const updated = { ...manifest, items, coverImageId };
  await saveDraftGallery(slug, updated);
  await writeAdminAudit({
    actorId: auth.session.id,
    action: "gallery_delete_item",
    slug,
    detail: { itemId },
  });

  return NextResponse.json({ ok: true, manifest: updated });
}
