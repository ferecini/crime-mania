import { NextResponse } from "next/server";
import { authorizeWorkerSecret } from "@/lib/dossier/admin-access";
import { claimNextDossierJob } from "@/lib/dossier/db";
import { runDossierJob } from "@/lib/dossier/pipeline/run-job";

export const maxDuration = 300;

export async function POST(request: Request) {
  if (!authorizeWorkerSecret(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const workerId = request.headers.get("x-worker-id") ?? "api";
  const job = await claimNextDossierJob(workerId);
  if (!job) {
    return NextResponse.json({ ok: true, processed: false, message: "Nenhum job pendente." });
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
        error: err instanceof Error ? err.message : "Falha no processamento.",
      },
      { status: 500 },
    );
  }
}
