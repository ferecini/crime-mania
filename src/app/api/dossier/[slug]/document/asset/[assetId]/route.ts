import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { canAccessPublishedDocument } from "@/lib/dossier/access";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
import { readDocumentAsset } from "@/lib/dossier/document-db";
import { readAdminDocument, readMemberDocument } from "@/lib/dossier/document-store";
import { createDossierStorage } from "@/lib/dossier/storage";
import { getSession } from "@/lib/auth/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string; assetId: string }> },
) {
  const { slug, assetId } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier) {
    return NextResponse.json({ error: "Dossiê não encontrado." }, { status: 404 });
  }

  const session = await getSession();
  const memberDoc = await readMemberDocument(slug);
  let allowed = memberDoc && canAccessPublishedDocument(session, memberDoc, dossier);
  if (!allowed && isDossierAdmin(session)) {
    const adminDoc = await readAdminDocument(slug);
    allowed = Boolean(adminDoc);
  }
  if (!allowed) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  let bytes: Buffer | null = null;
  let mimeType = "application/octet-stream";

  try {
    const asset = await readDocumentAsset(slug, assetId);
    if (asset) {
      const storage = await createDossierStorage();
      bytes = await storage.get(asset.storageKey);
      mimeType = asset.mimeType;
    }
  } catch {
    /* postgres opcional em dev */
  }

  if (!bytes) {
    const { readLocalDocumentAsset } = await import("@/lib/dossier/document-assets-local");
    const local = readLocalDocumentAsset(slug, assetId);
    if (local) {
      bytes = local.bytes;
      mimeType = local.mimeType;
    }
  }

  if (!bytes) {
    return NextResponse.json({ error: "Recurso não encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      "Content-Type": mimeType,
      "Cache-Control": "private, no-store",
    },
  });
}
