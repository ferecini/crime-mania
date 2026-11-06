import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DossierDocumentView } from "@/components/dossier/DossierDocumentView";
import { getSession } from "@/lib/auth/session";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
import { resolveDossierRecord } from "@/lib/dossier/catalog";
import { readAdminDocument } from "@/lib/dossier/document-store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prévia do rascunho" };

/** Prévia do rascunho (não publicado) com o mesmo leitor dos membros — abra no celular para testar o mobile. */
export default async function DossierDraftPreviewPage({
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
  const dossier = await resolveDossierRecord(slug);
  if (!dossier) notFound();
  const document = await readAdminDocument(slug);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Link href={`/membro/admin/dossiers/${slug}`} className="text-cm-gray hover:text-white">
          ← Voltar ao formulário
        </Link>
        <span className="rounded border border-amber-500/40 px-2 py-1 text-xs text-amber-100/90">
          Prévia do rascunho — {document ? `v${document.version} · ${document.status}` : "sem documento"}
        </span>
      </div>
      <h1 className="font-display text-2xl text-white md:text-3xl">{dossier.title}</h1>
      {document ? (
        <DossierDocumentView
          slug={slug}
          sections={document.sections}
          warnings={document.meta.extractionWarnings}
        />
      ) : (
        <p className="text-sm text-cm-gray">Nenhum rascunho salvo ainda.</p>
      )}
    </div>
  );
}
