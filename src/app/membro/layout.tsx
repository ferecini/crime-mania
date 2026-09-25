import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberNav } from "@/components/member/MemberNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/member/LogoutButton";

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/entrar?next=/membro");
  }

  const tierLabel =
    session.tier === "tier2"
      ? "Tier 2"
      : session.tier === "tier1"
        ? "Tier 1"
        : "Sem assinatura";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-cm-gray-dark bg-cm-bg/95 backdrop-blur-md">
        <div className="cm-container flex flex-col gap-4 px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="font-display text-sm text-cm-gray hover:text-white">
              ← Site público
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <span className="text-cm-gray">
                Olá, <span className="text-white">{session.displayName}</span>
              </span>
              <span className="rounded-sm border border-cm-gray-dark px-2 py-0.5 text-xs text-white">
                {tierLabel}
              </span>
              <LogoutButton />
            </div>
          </div>
          <MemberNav />
        </div>
      </header>
      <main className="min-h-[60vh] px-5 py-10 lg:px-8">
        <div className="cm-container">{children}</div>
      </main>
      <SiteFooter />
    </>
  );
}
