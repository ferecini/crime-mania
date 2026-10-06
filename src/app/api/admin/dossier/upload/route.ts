import { NextResponse } from "next/server";
import { getDossierRecord } from "@/data/dossiers";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { createDossierJob, getLatestDossierVersion, writeAdminAudit } from "@/lib/dossier/db";
import { createDossierStorage } from "@/lib/dossier/storage";
import { humanizeDossierProcessingError } from "@/lib/dossier/processing-errors";
import { assertAllowedSlug, validatePdfBuffer, validatePdfWithPdfJs } from "@/lib/dossier/validate-pdf";

export async function POST(request: Request) {
  if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Upload indisponível: configure BLOB_READ_WRITE_TOKEN ou use processamento local." },
      { status: 503 },
    );
  }

  const auth = await requireDossierAdmin();
  if ("error" in auth) return auth.error;
  if (!assertSameOrigin(request)) {
    return NextResponse.json({ error: "Origem inválida." }, { status: 403 });
  }

  const form = await request.formData();
  const slug = String(form.get("slug") ?? "").trim();
  const file = form.get("file");
  if (!slug || !(file instanceof File)) {
    return NextResponse.json({ error: "slug e file são obrigatórios." }, { status: 400 });
  }

  try {
    assertAllowedSlug(slug);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Slug inválido." }, { status: 400 });
  }

  if (!getDossierRecord(slug)) {
    return NextResponse.json({ error: "Dossiê não catalogado." }, { status: 404 });
  }

  if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Apenas PDF." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let sha256: string;
  try {
    ({ sha256 } = validatePdfBuffer(buf));
    await validatePdfWithPdfJs(buf);
  } catch (e) {
    return NextResponse.json(
      {
        error: humanizeDossierProcessingError(e instanceof Error ? e.message : "PDF inválido."),
      },
      { status: 400 },
    );
  }

  const blobPath = `dossiers/inbox/${slug}-${sha256.slice(0, 12)}.pdf`;
  const storage = await createDossierStorage();
  await storage.put(blobPath, buf, "application/pdf");

  const nextVersion = (await getLatestDossierVersion(slug)) + 1;
  const job = await createDossierJob({
    slug,
    blobPath,
    sha256,
    version: nextVersion,
    requestedBy: auth.session.id,
  });

  await writeAdminAudit({
    actorId: auth.session.id,
    action: "dossier_upload",
    slug,
    detail: { jobId: job.id, sha256: sha256.slice(0, 12) },
  });

  return NextResponse.json({
    ok: true,
    jobId: job.id,
    message: "PDF enviado. A fila processará o arquivo em segundo plano (GitHub Actions ou botão abaixo).",
  });
}
