import Link from "next/link";
import { DOSSIER_PREVIEWS } from "@/data/dossiers";
import { PUBLIC_EPISODES } from "@/data/episodes";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Busca" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim().toLowerCase();
  const session = await getSession();

  const episodes = PUBLIC_EPISODES.filter(
    (e) =>
      !query ||
      e.title.toLowerCase().includes(query) ||
      e.category.toLowerCase().includes(query),
  );

  const dossiers = DOSSIER_PREVIEWS.filter(
    (d) =>
      !query ||
      d.title.toLowerCase().includes(query) ||
      d.category.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-white">Busca</h1>
      <form method="get" className="flex max-w-xl gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Procurar caso ou episódio"
          className="flex-1 rounded-sm border border-cm-gray-dark bg-cm-bg px-3 py-2 text-white"
        />
        <button
          type="submit"
          className="rounded-sm bg-cm-red px-4 py-2 text-sm font-semibold text-white"
        >
          Buscar
        </button>
      </form>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-cm-gray">
          Episódios públicos
        </h2>
        <ul className="space-y-2">
          {episodes.map((e) => (
            <li key={e.slug}>
              <Link href={`/episodios/${e.slug}`} className="text-white hover:text-cm-red-light">
                {e.category}: {e.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-cm-gray">
          Dossiês
        </h2>
        <ul className="space-y-3">
          {dossiers.map((d) => {
            const access = evaluateAccess(session, "dossierSummary");
            return (
              <li key={d.slug} className="rounded-sm border border-cm-gray-dark p-3 text-sm">
                <p className="font-medium text-white">{d.title}</p>
                <p className="text-cm-gray">{d.intro}</p>
                {access.allowed ? (
                  <Link href={`/membro/dossies/${d.slug}`} className="text-cm-red hover:underline">
                    Abrir dossiê
                  </Link>
                ) : (
                  <span className="text-cm-gray">Prévia — {access.message}</span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
