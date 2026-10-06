import Link from "next/link";
import { notFound } from "next/navigation";
import { DossierGalleryCarousel } from "@/components/dossier/DossierGalleryCarousel";
import { DossierPdfViewer } from "@/components/dossier/DossierPdfViewer";
import { DossierTextSummary } from "@/components/dossier/DossierTextSummary";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getDossierRecord } from "@/data/dossiers";
import { getJurisItem } from "@/data/member-media";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";
import { tierHasFeature } from "@/lib/plans";
import { MemberMediaPlayer } from "@/components/media/MemberMediaPlayer";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dossier = getDossierRecord(slug);
  if (!dossier) notFound();

  const session = await getSession();
  const tier = session?.tier ?? "none";
  const summaryAccess = evaluateAccess(session, "dossierSummary");
  const jurisAccess = evaluateAccess(session, "dossierJuris");
  const canViewSummary = summaryAccess.allowed;
  const jurisItem = dossier.jurisMediaId ? getJurisItem(dossier.jurisMediaId) : undefined;

  return (
    <article className="space-y-10">
      <Link href="/membro/dossies" className="text-sm text-cm-gray hover:text-white">
        ← Dossiês
      </Link>
      <header>
        <p className="text-xs uppercase tracking-widest text-cm-red">{dossier.category}</p>
        <h1 className="font-display mt-2 text-3xl text-white">{dossier.title}</h1>
        <p className="mt-3 max-w-2xl text-cm-gray">{dossier.intro}</p>
      </header>

      {!canViewSummary ? (
        <PaywallCard state={summaryAccess} />
      ) : (
        <>
          {dossier.documentFile ? (
            <DossierPdfViewer slug={dossier.slug} title={dossier.title} />
          ) : (
            <p className="text-sm text-cm-gray">Documento editorial em preparação.</p>
          )}
          <DossierTextSummary dossier={dossier} />
          <DossierGalleryCarousel images={dossier.gallery} />
          <section className="space-y-4">
            <h2 className="font-display text-lg text-white">Crime Mania Juris</h2>
            {!tierHasFeature(tier, "dossierJuris") ? (
              <PaywallCard state={jurisAccess} />
            ) : jurisItem ? (
              <MemberMediaPlayer item={jurisItem} />
            ) : (
              <p className="text-sm text-cm-gray">
                Episódio Juris deste caso será publicado em breve no catálogo unificado.
              </p>
            )}
          </section>
        </>
      )}
    </article>
  );
}
