import Link from "next/link";
import { CommunityNotificationsList } from "@/components/community/CommunityNotificationsList";
import { MemberSectionHeader } from "@/components/member/MemberSectionHeader";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const metadata = { title: "Notificações" };
export const dynamic = "force-dynamic";

export default async function CommunityNotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/entrar");

  return (
    <div className="space-y-6">
      <Link href="/membro/comunidade" className="inline-flex min-h-11 items-center text-sm text-cm-gray hover:text-white">
        ← Comunidade
      </Link>
      <MemberSectionHeader title="Notificações" description="Atualizações do fórum e das suas sugestões." />
      <CommunityNotificationsList />
    </div>
  );
}
