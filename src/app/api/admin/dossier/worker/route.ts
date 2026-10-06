import { NextResponse } from "next/server";
import { assertSameOrigin, requireDossierAdmin } from "@/lib/dossier/admin-api";
import { authorizeWorkerSecret } from "@/lib/dossier/admin-access";
import { claimNextDossierJob } from "@/lib/dossier/db";
import { humanizeDossierProcessingError } from "@/lib/dossier/processing-errors";
import { runDossierJob } from "@/lib/dossier/pipeline/run-job";

export const maxDuration = 300;

export async function POST(request: Request) {
  const workerOk = authorizeWorkerSecret(request);
  if (!workerOk) {
    const admin = await requireDossierAdmin();
    if ("error" in admin || !assertSameOrigin(request)) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  const workerId = request.headers.get("x-worker-id") ?? "api";
  const job = await claimNextDossierJob(workerId);
  if (!job) {
    return NextResponse.json({ ok: true, processed: false, message: "Nenhuma tarefa pendente na fila." });
  }

  try {
    await runDossierJob(job);
    return NextResponse.json({ ok: true, processed: true, jobId: job.id, slug: job.slug });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        processed: true,
        jobId: job.id,
        error: humanizeDossierProcessingError(
          err instanceof Error ? err.message : "Falha no processamento.",
        ),
      },
      { status: 500 },
    );
  }
}
