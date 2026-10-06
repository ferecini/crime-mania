/**
 * Worker de dossiês — Postgres + Blob. Uso: GitHub Actions ou local com env.
 * npx tsx scripts/dossier-cloud-worker.ts
 */
import { claimNextDossierJob } from "../src/lib/dossier/db";
import { runDossierJob } from "../src/lib/dossier/pipeline/run-job";

async function main() {
  let processed = 0;
  for (;;) {
    const job = await claimNextDossierJob("cloud-worker");
    if (!job) break;
    console.log(`[dossier-cloud-worker] Processando ${job.id} slug=${job.slug}`);
    await runDossierJob(job);
    processed += 1;
  }
  console.log(
    processed
      ? `[dossier-cloud-worker] Concluído (${processed} job(s)).`
      : "[dossier-cloud-worker] Nenhum job pendente.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
