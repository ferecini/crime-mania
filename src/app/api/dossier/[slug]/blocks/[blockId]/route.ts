import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { canAccessProcessedManifest } from "@/lib/dossier/access";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
import { pickVariantWidth, readAdminManifest, readProcessedManifest } from "@/lib/dossier/manifest-store";
import { createDossierStorage } from "@/lib/dossier/storage";
import type { DossierAssetFormat, ProcessedDossierManifest } from "@/lib/dossier/types";
import { getSession } from "@/lib/auth/session";
import { verifyDossierBlockSignature } from "@/lib/dossier/media-signature";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string; blockId: string }> },
) {
  const { slug, blockId } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const session = await getSession();
  const url = new URL(request.url);
  const sigToken = url.searchParams.get("sig");
  if (sigToken && session) {
    const wRawSig = Number(url.searchParams.get("w") ?? "960");
    const widthSig = pickVariantWidth(Number.isFinite(wRawSig) ? wRawSig : 960);
    const fmtParamSig = url.searchParams.get("fmt");
    const formatSig = fmtParamSig === "avif" || fmtParamSig === "webp" ? fmtParamSig : "webp";
    if (
      !verifyDossierBlockSignature({
        sessionId: session.id,
        slug,
        blockId,
        width: widthSig,
        format: formatSig,
        token: sigToken,
      })
    ) {
      return NextResponse.json({ error: "Assinatura expirada ou inválida." }, { status: 403 });
    }
  } else if (process.env.CM_DOSSIER_REQUIRE_MEDIA_SIG === "1" && !isDossierAdmin(session)) {
    return NextResponse.json({ error: "Assinatura obrigatória." }, { status: 403 });
  }

  let manifest: ProcessedDossierManifest | null = null;
  const memberManifest = await readProcessedManifest(slug);
  if (memberManifest && canAccessProcessedManifest(session, memberManifest, dossier)) {
    manifest = memberManifest;
  } else if (isDossierAdmin(session)) {
    manifest = await readAdminManifest(slug);
  } else if (memberManifest) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  if (!manifest) {
    return NextResponse.json({ error: "Conteúdo indisponível." }, { status: 503 });
  }

  if (!isDossierAdmin(session) && manifest.status !== "ready") {
    return NextResponse.json({ error: "Conteúdo indisponível." }, { status: 503 });
  }

  const block = manifest.blocks.find((b) => b.id === blockId);
  if (!block) {
    return NextResponse.json({ error: "Bloco não encontrado." }, { status: 404 });
  }

  const wRaw = Number(url.searchParams.get("w") ?? "960");
  const width = pickVariantWidth(Number.isFinite(wRaw) ? wRaw : 960);
  const fmtParam = url.searchParams.get("fmt");
  const format: DossierAssetFormat =
    fmtParam === "avif" || fmtParam === "webp" ? fmtParam : "webp";

  const variant =
    block.variants.find((v) => v.width === width && v.format === format) ??
    block.variants.find((v) => v.width === width) ??
    block.variants[0];

  if (!variant) {
    return NextResponse.json({ error: "Variante indisponível." }, { status: 404 });
  }

  const storage = await createDossierStorage();
  const data = await storage.get(variant.storageKey);
  if (!data) {
    return NextResponse.json({ error: "Arquivo do bloco indisponível." }, { status: 503 });
  }

  const contentType = variant.format === "avif" ? "image/avif" : "image/webp";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=300, stale-while-revalidate=60",
      "Content-Length": String(data.length),
    },
  });
}
