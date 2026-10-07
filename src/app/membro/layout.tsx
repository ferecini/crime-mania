import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSession } from "@/lib/auth/session";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
import { MemberBottomNav } from "@/components/member/MemberBottomNav";
import { MemberAreaHeader } from "@/components/member/MemberAreaHeader";
import { MemberSidebar } from "@/components/member/MemberSidebar";
import { MediaPlaybackProvider } from "@/components/media/MediaPlaybackProvider";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/entrar?next=/membro");
  }

  const showAdmin = isDossierAdmin(session);

  return (
    <MediaPlaybackProvider>
      <div className="min-h-screen overflow-x-hidden bg-cm-bg">
        <MemberAreaHeader displayName={session.displayName} />
        <div className="pt-[3.75rem] md:pt-[4.25rem]">
          <div className="cm-container flex gap-6 px-5 py-8 lg:gap-8 lg:px-8 lg:py-12">
            <MemberSidebar showAdmin={showAdmin} />
            <main className="min-w-0 flex-1 pb-20 lg:pb-0">{children}</main>
          </div>
        </div>
        <MemberBottomNav />
        <SiteFooter
          memberSession={{ displayName: session.displayName, email: session.email }}
        />
      </div>
    </MediaPlaybackProvider>
  );
}
