import Link from "next/link";
import { notFound } from "next/navigation";
import { DossierGalleryCarousel } from "@/components/dossier/DossierGalleryCarousel";
import { DossierDownloadPdfLink } from "@/components/dossier/DossierDownloadPdfLink";
import { SemanticDossierReader } from "@/components/dossier/SemanticDossierReader";
import { ResponsiveDossierReader } from "@/components/dossier/ResponsiveDossierReader";
import { legacyCropReaderEnabled } from "@/lib/dossier/access";
import { readMemberDocument, resolvePublishedFormat } from "@/lib/dossier/document-store";
import { readProcessedManifest } from "@/lib/dossier/manifest-store";
import { DossierTextSummary } from "@/components/dossier/DossierTextSummary";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getDossierRecord } from "@/data/dossiers";
import { getJurisItem } from "@/data/member-media";
import { getSession } from "@/lib/auth/session";
import { isDossierAdmin } from "@/lib/dossier/admin-access";
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
  const publishedFormat = await resolvePublishedFormat(slug);
  const htmlDocument = await readMemberDocument(slug);
  const useHtmlReader =
    !legacyCropReaderEnabled() &&
    publishedFormat === "html" &&
    htmlDocument?.status === "ready" &&
    htmlDocument.sections.some((s) => s.blocks.length > 0);
  const processedManifest = await readProcessedManifest(slug);
  const manifestReady = Boolean(
    processedManifest?.status === "ready" && processedManifest.blocks.length > 0,
  );
  const useLegacyCropReader =
    !useHtmlReader &&
    manifestReady &&
    (publishedFormat === "legacy" || legacyCropReaderEnabled());
  const documentProcessing =
    publishedFormat === "html" &&
    htmlDocument &&
    htmlDocument.status !== "ready" &&
    htmlDocument.status !== "failed";
  const documentFailed = publishedFormat === "html" && htmlDocument?.status === "failed";
  const jurisItem = dossier.jurisMediaId ? getJurisItem(dossier.jurisMediaId) : undefined;

  return (
    <article className="space-y-10">
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/membro/dossies" className="text-sm text-cm-gray hover:text-white">
          ← Dossiês
        </Link>
        {isDossierAdmin(session) && (
          <>
            <Link href="/membro/admin" className="text-sm text-cm-red-light hover:text-white">
              Admin
            </Link>
            <Link
              href={`/membro/admin/dossiers/${slug}`}
              className="text-sm text-cm-red-light hover:text-white"
            >
              Revisão dossiê
            </Link>
            <Link
              href={`/membro/admin/galerias/${slug}`}
              className="text-sm text-cm-red-light hover:text-white"
            >
              Galeria
            </Link>
          </>
        )}
      </div>
      <header>
        <p className="text-xs uppercase tracking-widest text-cm-red">{dossier.category}</p>
        <h1 className="font-display mt-2 text-3xl text-white">{dossier.title}</h1>
        <p className="mt-3 max-w-2xl text-cm-gray">{dossier.intro}</p>
      </header>

      {!canViewSummary ? (
        <PaywallCard state={summaryAccess} />
      ) : (
        <>
          {useHtmlReader ? (
            <>
              <SemanticDossierReader slug={dossier.slug} />
              {dossier.documentFile ? (
                <DossierDownloadPdfLink slug={dossier.slug} title={dossier.title} />
              ) : null}
            </>
          ) : useLegacyCropReader ? (
            <>
              <ResponsiveDossierReader slug={dossier.slug} />
              {dossier.documentFile ? (
                <DossierDownloadPdfLink slug={dossier.slug} title={dossier.title} />
              ) : null}
            </>
          ) : documentProcessing ? (
            <div className="space-y-3 rounded-[4px] border border-dashed border-cm-divider p-6">
              <p className="font-display text-white">Documento em processamento</p>
              <p className="text-sm text-cm-gray">
                A extração para HTML editorial está em andamento. Use o PDF original enquanto isso.
              </p>
              {dossier.documentFile ? (
                <DossierDownloadPdfLink slug={dossier.slug} title={dossier.title} />
              ) : null}
            </div>
          ) : documentFailed || dossier.documentFile ? (
            <div className="space-y-3">
              <p className="text-sm text-cm-gray" role="status">
                {documentFailed
                  ? (htmlDocument?.processingError ??
                    "Falha na conversão para HTML. Download do PDF original disponível.")
                  : "Documento editorial em preparação ou aguardando revisão."}
              </p>
              {dossier.documentFile ? (
                <DossierDownloadPdfLink slug={dossier.slug} title={dossier.title} />
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-cm-gray">Documento editorial em preparação.</p>
          )}
          <DossierTextSummary dossier={dossier} />
          <DossierGalleryCarousel slug={dossier.slug} />
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
