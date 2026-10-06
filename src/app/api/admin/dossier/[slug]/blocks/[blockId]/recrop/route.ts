import { NextResponse } from "next/server";
import { z } from "zod";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { saveDraftManifest, writeAdminAudit } from "@/lib/dossier/db";
import { readAdminManifest } from "@/lib/dossier/manifest-store";
import { rerenderBlockCrop } from "@/lib/dossier/pipeline/recrop-block";
import { createDossierStorage } from "@/lib/dossier/storage";

type Params = { params: Promise<{ slug: string; blockId: string }> };

const bodySchema = z.object({
  sourceY: z.number().int().min(0),
  sourceHeight: z.number().int().min(1),
});

export async function POST(request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  const { slug, blockId } = await params;
  if (!getDossierRecord(slug)) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const manifest = await readAdminManifest(slug);
  if (!manifest?.sourcePageStorageKey || !manifest.sourceWidth || !manifest.sourceHeight) {
    return NextResponse.json(
      { error: "Manifesto sem página-fonte; reprocesse o PDF com o worker atual." },
      { status: 400 },
    );
  }

  const block = manifest.blocks.find((b) => b.id === blockId);
  if (!block) {
    return NextResponse.json({ error: "Bloco não encontrado." }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const storage = await createDossierStorage();
  const pagePng = await storage.get(manifest.sourcePageStorageKey);
  if (!pagePng) {
    return NextResponse.json({ error: "Página-fonte indisponível no storage." }, { status: 503 });
  }

  const storageRoot = `dossiers/processed/${slug}/v${manifest.version}`;
  const blockPrefix = `${storageRoot}/blocks/${block.id}`;
  const rendered = await rerenderBlockCrop({
    storage,
    sourcePagePng: pagePng,
    sourceWidth: manifest.sourceWidth,
    sourceHeight: manifest.sourceHeight,
    block: { id: block.id, sourceY: parsed.data.sourceY, sourceHeight: parsed.data.sourceHeight },
    blockStoragePrefix: blockPrefix,
  });

  const blocks = manifest.blocks.map((b) =>
    b.id === blockId ? { ...b, ...rendered } : b,
  );
  const updated = { ...manifest, blocks, status: "needs_review" as const };
  await saveDraftManifest(slug, updated);
  await writeAdminAudit({
    actorId: auth.session.id,
    action: "dossier_recrop_block",
    slug,
    detail: { blockId, sourceY: rendered.sourceY, sourceHeight: rendered.sourceHeight },
  });

  return NextResponse.json({ ok: true, block: blocks.find((b) => b.id === blockId) });
}
