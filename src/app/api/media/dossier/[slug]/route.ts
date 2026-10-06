import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { getSession } from "@/lib/auth/session";
import { tierHasFeature } from "@/lib/plans";

export async function GET(
  _request: Request,
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

  const filePath = path.join(process.cwd(), "private", "dossiers", dossier.documentFile);
  try {
    const data = await fs.readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${dossier.documentFile}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "Arquivo indisponível no servidor." }, { status: 503 });
  }
}
