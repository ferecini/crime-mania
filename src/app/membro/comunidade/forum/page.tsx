import Link from "next/link";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";

export const metadata = { title: "Fórum da comunidade" };

export default async function CommunityForumPage() {
  const session = await getSession();
  const forum = evaluateAccess(session, "forum");

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade" className="text-sm text-cm-gray hover:text-white">
        ← Comunidade
      </Link>
      <MemberSectionHeader title="Fórum da comunidade" description="Debates gerais — não dividido por caso." />
      {!forum.allowed ? (
        <PaywallCard state={forum} />
      ) : (
        <p className="text-sm text-cm-gray">
          Fórum geral em integração — criação de tópicos, respostas, moderação e denúncias conforme
          política editorial.
        </p>
      )}
    </div>
  );
}
