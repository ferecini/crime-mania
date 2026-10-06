import Link from "next/link";
import { CommunityModerationPanel } from "@/components/community/CommunityModerationPanel";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { getSession } from "@/lib/auth/session";
import { isCommunityModerator } from "@/lib/community/access";
import { redirect } from "next/navigation";

export const metadata = { title: "Moderação" };
export const dynamic = "force-dynamic";

export default async function CommunityModerationPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");
  if (!isCommunityModerator(session)) {
    return (
      <p className="text-sm text-cm-gray" role="status">
        Acesso restrito à equipe de moderação.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade" className="inline-flex min-h-11 items-center text-sm text-cm-gray hover:text-white">
        ← Comunidade
      </Link>
      <MemberSectionHeader title="Moderação da comunidade" description="Denúncias, sugestões e auditoria." />
      <CommunityModerationPanel />
    </div>
  );
}
