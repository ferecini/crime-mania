import Link from "next/link";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { getSession } from "@/lib/auth/session";
import { searchMemberCatalog } from "@/lib/member/search";

export const metadata = { title: "Busca" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const query = q.trim();
  const session = await getSession();
  const results = query ? await searchMemberCatalog(query, session) : [];

  return (
    <div className="space-y-8">
      <MemberSectionHeader title="Busca" description="Resultados respeitam seu plano e não expõem mídia protegida." />
      <form method="get" className="flex max-w-xl flex-col gap-3 sm:flex-row">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar casos e conteúdos"
          className="cm-input min-h-11 flex-1"
        />
        <button
          type="submit"
          className="min-h-11 rounded-sm bg-cm-red px-4 py-2 text-sm font-semibold text-white"
        >
          Buscar
        </button>
      </form>

      {!query && <p className="text-sm text-cm-gray">Digite um termo para pesquisar dossiês, episódios, Juris e Arquivo.</p>}
      {query && results.length === 0 && (
        <p className="text-sm text-cm-gray" role="status">
          Nenhum resultado para &quot;{query}&quot;.
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-3">
          {results.map((result) => (
            <li key={result.id} className="rounded-[4px] border border-cm-divider p-4 text-sm">
              <p className="text-[10px] uppercase tracking-widest text-cm-gray">{result.kind}</p>
              <p className="font-medium text-white">{result.title}</p>
              <p className="mt-1 text-cm-gray">{result.summary}</p>
              {result.locked ? (
                <p className="mt-2 text-cm-gray">Conteúdo bloqueado — plano {result.planHint ?? "necessário"}.</p>
              ) : result.href ? (
                <Link href={result.href} className="cm-text-link mt-2 inline-flex min-h-11 items-center font-semibold">
                  Abrir →
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
