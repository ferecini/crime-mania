import Link from "next/link";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";
import { getCommunityRepository } from "@/lib/community/repository";
import { isCommunityModerator } from "@/lib/community/access";
import { COMMUNITY_RULES_MARKDOWN } from "@/lib/community/rules-content";

export const metadata = { title: "Comunidade" };
export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const session = await getSession();
  const forum = evaluateAccess(session, "forum");
  const suggestion = evaluateAccess(session, "caseSuggestion");
  let recent: { id: string; title: string; categoryLabel?: string; replyCount: number; lastActivityAt: string }[] =
    [];
  if (forum.allowed) {
    try {
      const repo = await getCommunityRepository();
      const { topics } = await repo.listTopics({ limit: 5 });
      recent = topics.map((t) => ({
        id: t.id,
        title: t.title,
        categoryLabel: t.categoryLabel,
        replyCount: t.replyCount,
        lastActivityAt: t.lastActivityAt,
      }));
    } catch {
      /* sem persistência configurada */
    }
  }

  return (
    <div className="space-y-8">
      <MemberSectionHeader
        title="Comunidade"
        description="Espaço exclusivo para debater casos, crimes e tudo sobre o universo do true crime"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6">
          <h2 className="text-lg font-semibold text-white">Fórum da comunidade</h2>
          <p className="mt-2 text-sm text-cm-gray">Debates gerais — Tier 1 e Tier 2.</p>
          {!forum.allowed ? (
            <div className="mt-4">
              <PaywallCard state={forum} />
            </div>
          ) : (
            <Link
              href="/membro/comunidade/forum"
              className="cm-text-link mt-4 inline-flex min-h-11 items-center text-sm font-semibold"
            >
              Entrar no fórum →
            </Link>
          )}
        </section>
        <section className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6">
          <h2 className="text-lg font-semibold text-white">Sugira um episódio</h2>
          <p className="mt-2 text-sm text-cm-gray">Indique um caso que você gostaria de ouvir no Crime Mania — Tier 2.</p>
          {!suggestion.allowed ? (
            <div className="mt-4">
              <PaywallCard state={suggestion} />
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/membro/comunidade/sugira" className="cm-text-link inline-flex min-h-11 items-center text-sm font-semibold">
                Enviar sugestão →
              </Link>
              <Link
                href="/membro/comunidade/sugira/minhas"
                className="inline-flex min-h-11 items-center text-sm font-semibold text-cm-gray hover:text-white"
              >
                Minhas sugestões
              </Link>
            </div>
          )}
        </section>
      </div>

      {forum.allowed && recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white">Atividade recente</h2>
          <ul className="mt-3 divide-y divide-cm-divider rounded-[4px] border border-cm-divider bg-cm-bg-low">
            {recent.map((t) => (
              <li key={t.id}>
                <Link href={`/membro/comunidade/forum/${t.id}`} className="block p-4 min-h-11">
                  <p className="text-xs text-cm-gray">{t.categoryLabel}</p>
                  <p className="font-medium text-white">{t.title}</p>
                  <p className="mt-1 text-xs text-cm-gray">
                    {t.replyCount} respostas · {new Date(t.lastActivityAt).toLocaleString("pt-BR")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-[4px] border border-cm-divider bg-cm-bg-low p-6">
        <h2 className="text-lg font-semibold text-white">Regras e atalhos</h2>
        <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-cm-gray">{COMMUNITY_RULES_MARKDOWN}</p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link href="/membro/comunidade/regras" className="cm-text-link min-h-11 inline-flex items-center text-sm font-semibold">
            Ler regras completas
          </Link>
          <Link
            href="/membro/comunidade/notificacoes"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-cm-gray hover:text-white"
          >
            Notificações
          </Link>
          {session && isCommunityModerator(session) && (
            <Link href="/membro/comunidade/moderacao" className="cm-text-link min-h-11 inline-flex items-center text-sm font-semibold">
              Moderação
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
