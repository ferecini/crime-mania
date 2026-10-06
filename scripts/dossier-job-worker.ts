/**
 * Processa jobs enfileirados (status uploaded) via upload admin.
 * Uso: npx tsx scripts/dossier-job-worker.ts
 */
import { execSync } from "node:child_process";
import { readDossierJobs, writeDossierJobs } from "../src/lib/dossier/jobs";

const jobs = readDossierJobs().filter((j) => j.status === "uploaded");
if (!jobs.length) {
  console.log("[dossier-worker] Nenhum job pendente.");
  process.exit(0);
}

for (const job of jobs) {
  job.status = "processing";
  job.updatedAt = new Date().toISOString();
  writeDossierJobs([...readDossierJobs().filter((j) => j.id !== job.id), job]);
  try {
    execSync(`npx tsx scripts/process-dossier.ts --slug=${job.slug}`, {
      stdio: "inherit",
      cwd: process.cwd(),
    });
    job.status = "needs_review";
  } catch (err) {
    job.status = "failed";
    job.error = err instanceof Error ? err.message : String(err);
  }
  job.updatedAt = new Date().toISOString();
  const rest = readDossierJobs().filter((j) => j.id !== job.id);
  writeDossierJobs([...rest, job]);
}
