import Link from "next/link";
import { ForumTopicCreate } from "@/components/community/ForumTopicCreate";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Novo tópico" };
export const dynamic = "force-dynamic";

export default async function NewForumTopicPage() {
  const session = await getSession();
  const forum = evaluateAccess(session, "forum");

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade/forum" className="inline-flex min-h-11 items-center text-sm text-cm-gray hover:text-white">
        ← Fórum
      </Link>
      <MemberSectionHeader title="Novo tópico" description="Revise as regras antes de publicar." />
      {!forum.allowed || !session ? <PaywallCard state={forum} /> : <ForumTopicCreate />}
    </div>
  );
}
