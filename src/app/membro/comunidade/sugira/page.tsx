import Link from "next/link";
import { EpisodeSuggestionForm } from "@/components/community/EpisodeSuggestionForm";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Sugira um episódio" };
export const dynamic = "force-dynamic";

export default async function SuggestEpisodePage() {
  const session = await getSession();
  const suggestion = evaluateAccess(session, "caseSuggestion");

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade" className="inline-flex min-h-11 items-center text-sm text-cm-gray hover:text-white">
        ← Comunidade
      </Link>
      <MemberSectionHeader
        title="Sugira um episódio"
        description="Indique um caso que você gostaria de ouvir no Crime Mania."
      />
      {!suggestion.allowed ? (
        <PaywallCard state={suggestion} />
      ) : (
        <>
          <p className="text-sm text-cm-gray">
            <Link href="/membro/comunidade/sugira/minhas" className="cm-text-link font-semibold">
              Minhas sugestões
            </Link>
          </p>
          <EpisodeSuggestionForm />
        </>
      )}
    </div>
  );
}
