import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getSession } from "@/lib/auth/session";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const memberSession = session
    ? { displayName: session.displayName, email: session.email }
    : null;

  return (
    <>
      <SiteHeader memberSession={memberSession} />
      <main>{children}</main>
      <SiteFooter memberSession={memberSession} />
    </>
  );
}
