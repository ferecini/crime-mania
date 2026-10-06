import Link from "next/link";
import { MySuggestionsList } from "@/components/community/MySuggestionsList";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Minhas sugestões" };
export const dynamic = "force-dynamic";

export default async function MySuggestionsPage() {
  const session = await getSession();
  const suggestion = evaluateAccess(session, "caseSuggestion");

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade/sugira" className="inline-flex min-h-11 items-center text-sm text-cm-gray hover:text-white">
        ← Sugira um episódio
      </Link>
      <MemberSectionHeader title="Minhas sugestões" description="Acompanhe status e mensagens da equipe." />
      {!suggestion.allowed ? <PaywallCard state={suggestion} /> : <MySuggestionsList />}
    </div>
  );
}
