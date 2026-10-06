import Link from "next/link";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Sugira um caso" };

export default async function SuggestCasePage() {
  const session = await getSession();
  const suggestion = evaluateAccess(session, "caseSuggestion");

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade" className="text-sm text-cm-gray hover:text-white">
        ← Comunidade
      </Link>
      <MemberSectionHeader title="Sugira um caso" description="Tier 2 — sugestões moderadas pela equipe." />
      {!suggestion.allowed ? (
        <PaywallCard state={suggestion} />
      ) : (
        <form className="max-w-lg space-y-3">
          <label className="block text-sm text-cm-gray">
            Descreva o caso sugerido
            <textarea
              className="mt-1 w-full rounded-sm border border-cm-gray-dark bg-cm-bg p-3 text-white"
              rows={5}
              placeholder="Em breve: envio com confirmação de recebimento"
              disabled
            />
          </label>
        </form>
      )}
    </div>
  );
}
