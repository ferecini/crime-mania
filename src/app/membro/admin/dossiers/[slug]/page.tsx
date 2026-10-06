import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DossierHtmlReviewPanel } from "@/components/dossier/DossierHtmlReviewPanel";
import { DossierReviewPanel } from "@/components/dossier/DossierReviewPanel";
import { getDossierRecord } from "@/data/dossiers";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function MemberAdminDossierPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/entrar");
  if (!isDossierAdmin(session)) {
    return (
      <main className="cm-container py-16 text-sm text-cm-gray">
        Acesso restrito à equipe editorial de dossiês.
      </main>
    );
  }

  const { slug } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier) notFound();

  return (
    <main className="cm-container space-y-6 py-10">
      <Link href="/membro/dossies" className="text-sm text-cm-gray hover:text-white">
        ← Dossiês
      </Link>
      <DossierHtmlReviewPanel slug={slug} />
      <details className="rounded border border-cm-divider p-4">
        <summary className="cursor-pointer text-sm text-cm-gray">
          Recortes legados (rollback — não usar como leitor principal)
        </summary>
        <div className="mt-4">
          <DossierReviewPanel slug={slug} title={dossier.title} />
        </div>
      </details>
    </main>
  );
}
