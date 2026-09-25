import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MemberNav } from "@/components/member/MemberNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getSession } from "@/lib/auth/session";
import { LogoutButton } from "@/components/member/LogoutButton";
import { MemberBottomNav } from "@/components/member/MemberBottomNav";

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
    <div className="min-h-screen bg-cm-bg">
      <header className="border-b border-white/5 bg-cm-bg/95 backdrop-blur-xl">
        <div className="cm-container flex flex-col gap-4 px-5 py-4 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="relative h-7 w-16 shrink-0 opacity-90 hover:opacity-100">
                <Image src="/logo-crime-mania.jpg" alt="Crime Mania" fill className="object-contain object-left" />
              </Link>
              <span className="hidden h-4 w-px bg-white/10 sm:block" aria-hidden />
              <Link href="/" className="text-xs font-medium text-cm-gray hover:text-white">
                Site público
              </Link>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="text-cm-gray">
                Olá, <span className="font-medium text-white">{session.displayName}</span>
              </span>
              <span className="rounded-full border border-cm-red/30 bg-cm-red/10 px-3 py-0.5 text-xs font-semibold text-white">
                {tierLabel}
              </span>
              <LogoutButton />
            </div>
          </div>
          <div className="lg:hidden">
            <MemberNav layout="rail" />
          </div>
        </div>
      </header>

      <div className="cm-container grid gap-8 px-5 py-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12 lg:px-8 lg:py-12">
        <aside className="hidden lg:block">
          <p className="font-display mb-4 text-[10px] tracking-[0.35em] text-cm-gray">Área logada</p>
          <MemberNav layout="sidebar" />
        </aside>
        <main className="min-w-0 pb-20 lg:pb-0">{children}</main>
      </div>
      <MemberBottomNav />
      <SiteFooter />
    </div>
  );
}
