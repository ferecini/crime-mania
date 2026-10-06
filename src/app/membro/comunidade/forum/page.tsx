import Link from "next/link";
import { ForumTopicList } from "@/components/community/ForumTopicList";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Fórum da comunidade" };
export const dynamic = "force-dynamic";

export default async function CommunityForumPage() {
  const session = await getSession();
  const forum = evaluateAccess(session, "forum");

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade" className="inline-flex min-h-11 items-center text-sm text-cm-gray hover:text-white">
        ← Comunidade
      </Link>
      <MemberSectionHeader title="Fórum da comunidade" description="Debates gerais — não dividido por caso." />
      {!forum.allowed ? (
        <PaywallCard state={forum} />
      ) : (
        <>
          <Link
            href="/membro/comunidade/forum/novo"
            className="inline-flex min-h-11 items-center rounded-sm bg-cm-red px-4 text-sm font-semibold text-white hover:bg-cm-red/90"
          >
            Novo tópico
          </Link>
          <ForumTopicList />
        </>
      )}
    </div>
  );
}
