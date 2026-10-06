import { neon } from "@neondatabase/serverless";

function sqlUrl(): string {
  const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("POSTGRES_URL é obrigatório.");
  return url;
}

export type DossierJobStatusCount = { status: string; c: number };

export type FailedDossierJobRow = {
  slug: string;
  error: string | null;
  progress: string | null;
  updated_at: Date;
};

export async function adminDashboardStats() {
  const sql = neon(sqlUrl());
  const [jobs, failedJobs, audits, galleries] = await Promise.all([
    sql`SELECT status, COUNT(*)::int AS c FROM dossier_jobs GROUP BY status`,
    sql`
      SELECT slug, error, progress, updated_at
      FROM dossier_jobs
      WHERE status = 'failed'
      ORDER BY updated_at DESC
      LIMIT 20
    `,
    sql`SELECT action, COUNT(*)::int AS c FROM dossier_admin_audit WHERE created_at > NOW() - INTERVAL '7 days' GROUP BY action ORDER BY c DESC LIMIT 10`,
    sql`SELECT dossier_slug FROM dossier_gallery_manifests WHERE published IS NOT NULL`,
  ]);
  return {
    jobs: jobs as DossierJobStatusCount[],
    failedJobs: failedJobs as FailedDossierJobRow[],
    recentAudit: audits as { action: string; c: number }[],
    publishedGalleries: (galleries as { dossier_slug: string }[]).map((g) => g.dossier_slug),
  };
}
