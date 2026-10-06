import Link from "next/link";
import { adminDashboardStats } from "@/lib/admin/dashboard";
import { getDossierRecord } from "@/data/dossiers";
import {
  DOSSIER_JOB_STATUS_DISPLAY_ORDER,
  dossierJobProgressLabel,
  dossierJobStatusLabel,
} from "@/lib/dossier/job-labels";
import { humanizeDossierProcessingError } from "@/lib/dossier/processing-errors";

export const dynamic = "force-dynamic";

function sortJobCounts(jobs: { status: string; c: number }[]) {
  const order = new Map(DOSSIER_JOB_STATUS_DISPLAY_ORDER.map((s, i) => [s, i]));
  return jobs.slice().sort((a, b) => {
    const ai = order.get(a.status as (typeof DOSSIER_JOB_STATUS_DISPLAY_ORDER)[number]) ?? 99;
    const bi = order.get(b.status as (typeof DOSSIER_JOB_STATUS_DISPLAY_ORDER)[number]) ?? 99;
    if (ai !== bi) return ai - bi;
    return dossierJobStatusLabel(a.status).localeCompare(dossierJobStatusLabel(b.status), "pt-BR");
  });
}

export default async function AdminHomePage() {
  let stats: Awaited<ReturnType<typeof adminDashboardStats>> | null = null;
  try {
    stats = await adminDashboardStats();
  } catch {
    stats = null;
  }

  const jobCounts = stats?.jobs?.length ? sortJobCounts(stats.jobs) : [];
  const failedJobs = stats?.failedJobs ?? [];

  return (
    <div className="space-y-8">
      <section className="rounded border border-cm-divider p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Status de processamento (dossiês)</h2>
          <Link href="/membro/admin/dossiers" className="text-xs text-cm-red-light hover:text-white">
            Gerenciar dossiês →
          </Link>
        </div>
        {!stats ? (
          <p className="mt-2 text-sm text-cm-gray">Postgres indisponível ou sem permissão.</p>
        ) : !jobCounts.length && !failedJobs.length ? (
          <p className="mt-2 text-sm text-cm-gray">Nenhum job na fila.</p>
        ) : (
          <>
            {jobCounts.length > 0 ? (
              <ul className="mt-3 space-y-1.5 text-sm text-cm-gray">
                {jobCounts.map((j) => (
                  <li key={j.status} className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-white">{dossierJobStatusLabel(j.status)}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {j.c === 1 ? "1 job" : `${j.c} jobs`}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {failedJobs.length > 0 ? (
              <div className="mt-4 rounded border border-cm-red/40 bg-cm-bg-low/50 p-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-cm-red-light">
                  Jobs com falha ({failedJobs.length})
                </h3>
                <ul className="mt-3 space-y-4">
                  {failedJobs.map((job) => {
                    const dossier = getDossierRecord(job.slug);
                    const title = dossier?.title ?? job.slug;
                    const err = humanizeDossierProcessingError(job.error ?? "");
                    const progress = dossierJobProgressLabel(job.progress ?? undefined);
                    return (
                      <li key={`${job.slug}-${job.updated_at}`} className="text-sm">
                        <Link
                          href={`/membro/admin/dossiers/${job.slug}`}
                          className="font-medium text-cm-red-light hover:text-white"
                        >
                          {title}
                        </Link>
                        <p className="mt-0.5 text-xs text-cm-gray">{job.slug}</p>
                        <p className="mt-1 text-cm-gray" role="status">
                          {err}
                        </p>
                        {progress ? (
                          <p className="mt-1 text-xs text-cm-gray">Última etapa: {progress}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-xs text-cm-gray">
                  Reenvie o PDF ou dispare o worker em{" "}
                  <Link href="/membro/admin/dossiers" className="text-cm-red-light hover:text-white">
                    revisão do dossiê
                  </Link>
                  . Jobs com falha podem ser reprocessados até esgotar tentativas.
                </p>
              </div>
            ) : null}
          </>
        )}
      </section>
      <section className="rounded border border-cm-divider p-4">
        <h2 className="text-sm font-semibold text-white">Galerias publicadas</h2>
        <p className="mt-2 text-sm text-cm-gray">
          {stats?.publishedGalleries?.length
            ? stats.publishedGalleries.join(", ")
            : "Nenhuma galeria publicada ainda."}
        </p>
      </section>
      <section className="rounded border border-cm-divider p-4">
        <h2 className="text-sm font-semibold text-white">Atalhos</h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <Link href="/membro/admin/dossiers" className="text-cm-red-light hover:text-white">
              Gerenciar dossiês →
            </Link>
          </li>
          <li>
            <Link
              href="/membro/admin/galerias/familia-banfield"
              className="text-cm-red-light hover:text-white"
            >
              Galeria Família Banfield →
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
