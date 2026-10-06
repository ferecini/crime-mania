import { NextResponse } from "next/server";
import { z } from "zod";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import {
  getLatestDossierVersion,
  publishManifest,
  readDraftManifest,
  readPublishedManifest,
  saveDraftManifest,
  unpublishManifest,
  writeAdminAudit,
} from "@/lib/dossier/db";
import { readAdminManifest } from "@/lib/dossier/manifest-store";
import type { ProcessedDossierManifest } from "@/lib/dossier/types";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  const { slug } = await params;
  const manifest = await readAdminManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: "Sem manifesto." }, { status: 404 });
  }
  return NextResponse.json({ manifest });
}

const patchSchema = z.object({
  blocks: z.array(z.any()).optional(),
  plainText: z.string().optional(),
  action: z.enum(["save_draft", "approve", "publish", "unpublish", "new_version"]).optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }
  const { slug } = await params;
  if (!getDossierRecord(slug)) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  let manifest = await readAdminManifest(slug);
  if (!manifest) {
    return NextResponse.json({ error: "Sem manifesto para editar." }, { status: 404 });
  }

  if (parsed.data.blocks) {
    manifest = { ...manifest, blocks: parsed.data.blocks as ProcessedDossierManifest["blocks"] };
  }
  if (parsed.data.plainText !== undefined) {
    manifest = { ...manifest, plainText: parsed.data.plainText };
  }

  const action = parsed.data.action ?? "save_draft";
  if (action === "save_draft") {
    manifest = { ...manifest, status: "needs_review" };
    await saveDraftManifest(slug, manifest);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_save_draft", slug });
    return NextResponse.json({ ok: true, manifest });
  }

  if (action === "approve") {
    manifest = { ...manifest, status: "needs_review" };
    await saveDraftManifest(slug, manifest);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_approve", slug });
    return NextResponse.json({ ok: true, manifest, approved: true });
  }

  if (action === "new_version") {
    const published = await readPublishedManifest(slug);
    const base = published ?? manifest;
    const version = Math.max(await getLatestDossierVersion(slug), base.version) + 1;
    manifest = {
      ...base,
      ...manifest,
      version,
      status: "needs_review",
      publishedAt: undefined,
    };
    await saveDraftManifest(slug, manifest);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_new_version", slug, detail: { version } });
    return NextResponse.json({ ok: true, manifest });
  }

  if (action === "unpublish") {
    const pub = await readPublishedManifest(slug);
    if (pub) {
      await saveDraftManifest(slug, { ...pub, status: "needs_review" });
    }
    await unpublishManifest(slug);
    await writeAdminAudit({ actorId: auth.session.id, action: "dossier_unpublish", slug });
    const draftNow = await readDraftManifest(slug);
    return NextResponse.json({ ok: true, manifest: draftNow });
  }

  await publishManifest(slug, manifest);
  await writeAdminAudit({ actorId: auth.session.id, action: "dossier_publish", slug });
  const published = await readAdminManifest(slug);
  return NextResponse.json({ ok: true, manifest: published });
}
