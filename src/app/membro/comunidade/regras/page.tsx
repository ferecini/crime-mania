import Link from "next/link";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { COMMUNITY_RULES_MARKDOWN } from "@/lib/community/rules-content";

export const metadata = { title: "Regras da comunidade" };

export default function CommunityRulesPage() {
  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade" className="inline-flex min-h-11 items-center text-sm text-cm-gray hover:text-white">
        ← Comunidade
      </Link>
      <MemberSectionHeader title="Regras da comunidade" description="Texto provisório — revisão editorial antes da abertura pública." />
      <div className="whitespace-pre-wrap rounded-[4px] border border-cm-divider bg-cm-bg-low p-6 text-sm leading-relaxed text-white/90">
        {COMMUNITY_RULES_MARKDOWN}
      </div>
    </div>
  );
}
