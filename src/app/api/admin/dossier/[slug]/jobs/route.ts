import { NextResponse } from "next/server";
import { requireDossierAdmin } from "@/lib/dossier/admin-api";
import { getLatestDossierJobForSlug } from "@/lib/dossier/db";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, { params }: Params) {
  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  const { slug } = await params;
  const job = await getLatestDossierJobForSlug(slug);
  return NextResponse.json({ job });
}
