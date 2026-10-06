import { createDossierStorage } from "@/lib/dossier/storage";
import { processPdfToManifest } from "@/lib/dossier/pipeline/process-pdf";
import { saveDraftManifest, updateDossierJob } from "@/lib/dossier/db";
import type { DossierJobRecord } from "@/lib/dossier/jobs-types";

export async function runDossierJob(job: DossierJobRecord): Promise<void> {
  const storage = await createDossierStorage();
  await updateDossierJob(job.id, { status: "processing", progress: "download_pdf" });
  const pdf = await storage.get(job.sourcePdfStorageKey);
  if (!pdf) {
    await updateDossierJob(job.id, { status: "failed", error: "PDF não encontrado no storage." });
    return;
  }

  try {
    await updateDossierJob(job.id, { progress: "render" });
    const manifest = await processPdfToManifest({
      slug: job.slug,
      pdfBuffer: pdf,
      pdfStorageKey: job.sourcePdfStorageKey,
      version: job.version,
      storage,
    });
    await saveDraftManifest(job.slug, manifest);
    await updateDossierJob(job.id, { status: "needs_review", progress: "done" });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await updateDossierJob(job.id, { status: "failed", error: message, progress: "error" });
    throw err;
  }
}
