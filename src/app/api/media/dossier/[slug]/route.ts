import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { getSession } from "@/lib/auth/session";
import { readProcessedManifest } from "@/lib/dossier/manifest-store";
import { createDossierStorage } from "@/lib/dossier/storage";
import { tierHasFeature } from "@/lib/plans";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier?.documentFile) {
    return NextResponse.json({ error: "Documento não encontrado." }, { status: 404 });
  }

  const session = await getSession();
  const tier = session?.tier ?? "none";
  const allowed =
    tierHasFeature(tier, "dossierSummary") &&
    (dossier.accessTier === "tier1"
      ? tier === "tier1" || tier === "tier2"
      : tier === "tier2");

  if (!allowed) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const manifest = await readProcessedManifest(slug);
  const storage = await createDossierStorage();
  const pdfKey = manifest?.sourcePdfStorageKey ?? `dossiers/${dossier.documentFile}`;
  const data = await storage.get(pdfKey);
  if (!data) {
    return NextResponse.json({ error: "Arquivo indisponível." }, { status: 503 });
  }

  const download = new URL(request.url).searchParams.get("download") === "1";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": download
        ? `attachment; filename="${dossier.documentFile}"`
        : "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
