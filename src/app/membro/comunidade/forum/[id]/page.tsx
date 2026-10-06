import Link from "next/link";
import { ForumTopicView } from "@/components/community/ForumTopicView";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Tópico" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ForumTopicPage({ params }: Props) {
  const session = await getSession();
  const forum = evaluateAccess(session, "forum");
  const { id } = await params;

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade/forum" className="inline-flex min-h-11 items-center text-sm text-cm-gray hover:text-white">
        ← Fórum
      </Link>
      {!forum.allowed || !session ? (
        <PaywallCard state={forum} />
      ) : (
        <ForumTopicView topicId={id} currentUserId={session.id} />
      )}
    </div>
  );
}
