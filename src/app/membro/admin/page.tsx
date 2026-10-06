import Link from "next/link";
import { adminDashboardStats } from "@/lib/admin/dashboard";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  let stats: Awaited<ReturnType<typeof adminDashboardStats>> | null = null;
  try {
    stats = await adminDashboardStats();
  } catch {
    stats = null;
  }

  return (
    <div className="space-y-8">
      <section className="rounded border border-cm-divider p-4">
        <h2 className="text-sm font-semibold text-white">Status de processamento (dossiês)</h2>
        {!stats?.jobs?.length ? (
          <p className="mt-2 text-sm text-cm-gray">Nenhum job ou Postgres indisponível.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm text-cm-gray">
            {stats.jobs.map((j) => (
              <li key={j.status}>
                {j.status}: {j.c}
              </li>
            ))}
          </ul>
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
