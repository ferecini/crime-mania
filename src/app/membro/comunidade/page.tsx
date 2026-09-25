import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Comunidade" };

export default async function CommunityPage() {
  const session = await getSession();
  const forum = evaluateAccess(session, "forum");
  const suggestion = evaluateAccess(session, "caseSuggestion");

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl text-white">Comunidade</h1>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Fórum geral</h2>
        {!forum.allowed ? (
          <PaywallCard state={forum} />
        ) : (
          <p className="text-sm text-cm-gray">
            Fórum geral (não por caso) — módulo de discussão será integrado na próxima etapa.
          </p>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Sugestão de caso</h2>
        {!suggestion.allowed ? (
          <PaywallCard state={suggestion} />
        ) : (
          <form className="max-w-lg space-y-3">
            <label className="block text-sm text-cm-gray">
              Descreva o caso sugerido
              <textarea
                className="mt-1 w-full rounded-sm border border-cm-gray-dark bg-cm-bg p-3 text-white"
                rows={4}
                placeholder="Em breve: envio moderado Tier 2"
                disabled
              />
            </label>
          </form>
        )}
      </section>
    </div>
  );
}
