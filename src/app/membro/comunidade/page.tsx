import Link from "next/link";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
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
      <MemberSectionHeader
        title="Comunidade"
        description="Espaço exclusivo para debater casos, crimes e tudo sobre o universo do true crime"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6">
          <h2 className="text-lg font-semibold text-white">Fórum da comunidade</h2>
          <p className="mt-2 text-sm text-cm-gray">Debates gerais sobre true crime — Tier 1 e Tier 2.</p>
          {!forum.allowed ? (
            <div className="mt-4">
              <PaywallCard state={forum} />
            </div>
          ) : (
            <Link href="/membro/comunidade/forum" className="cm-text-link mt-4 inline-flex min-h-11 items-center text-sm font-semibold">
              Entrar no fórum →
            </Link>
          )}
        </section>
        <section className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6">
          <h2 className="text-lg font-semibold text-white">Sugira um caso</h2>
          <p className="mt-2 text-sm text-cm-gray">Envie sugestões moderadas — exclusivo Tier 2.</p>
          {!suggestion.allowed ? (
            <div className="mt-4">
              <PaywallCard state={suggestion} />
            </div>
          ) : (
            <Link href="/membro/comunidade/sugira" className="cm-text-link mt-4 inline-flex min-h-11 items-center text-sm font-semibold">
              Abrir formulário →
            </Link>
          )}
        </section>
      </div>
    </div>
  );
}
