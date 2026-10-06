import { NextResponse } from "next/server";
import { z } from "zod";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { writeAdminAudit } from "@/lib/dossier/db";
import { assertAdminRateLimit } from "@/lib/admin/rate-limit";
import {
  publishGallery,
  readAdminGallery,
  saveDraftGallery,
  unpublishGallery,
} from "@/lib/gallery/db";
import type { GalleryManifest } from "@/lib/gallery/types";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  const { slug } = await params;
  const manifest = await readAdminGallery(slug);
  if (!manifest) {
    return NextResponse.json({
      manifest: { dossierSlug: slug, items: [], version: 1 } satisfies GalleryManifest,
    });
  }
  return NextResponse.json({ manifest });
}

const patchSchema = z.object({
  items: z.array(z.any()),
  coverImageId: z.string().optional(),
  version: z.number().optional(),
  action: z.enum(["save_draft", "publish", "unpublish"]),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const { slug } = await params;
  if (!getDossierRecord(slug)) {
    return NextResponse.json({ error: "Dossiê não catalogado." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  let manifest: GalleryManifest = (await readAdminGallery(slug)) ?? {
    dossierSlug: slug,
    items: [],
    version: 1,
  };
  manifest = {
    ...manifest,
    dossierSlug: slug,
    items: parsed.data.items as GalleryManifest["items"],
    coverImageId: parsed.data.coverImageId ?? manifest.coverImageId,
    version: parsed.data.version ?? manifest.version,
  };

  try {
    if (parsed.data.action === "save_draft") {
      await saveDraftGallery(slug, manifest);
      await writeAdminAudit({ actorId: auth.session.id, action: "gallery_save_draft", slug });
      return NextResponse.json({ ok: true, manifest });
    }
    if (parsed.data.action === "unpublish") {
      await unpublishGallery(slug);
      await writeAdminAudit({ actorId: auth.session.id, action: "gallery_unpublish", slug });
      return NextResponse.json({ ok: true });
    }
    await assertAdminRateLimit(auth.session.id, "publish");
    await publishGallery(slug, manifest);
    await writeAdminAudit({ actorId: auth.session.id, action: "gallery_publish", slug });
    const pub = await readAdminGallery(slug);
    return NextResponse.json({ ok: true, manifest: pub });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha." },
      { status: 429 },
    );
  }
}
