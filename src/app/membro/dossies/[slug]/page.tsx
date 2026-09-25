import Link from "next/link";
import { notFound } from "next/navigation";
import { PaywallCard } from "@/components/member/PaywallCard";
import { getDossierPreview } from "@/data/dossiers";
import { getSession } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";
import { tierHasFeature } from "@/lib/plans";

const SECTIONS = [
  { id: "resumo", label: "Resumo do caso", feature: "dossierSummary" as const },
  { id: "imagens", label: "Imagens", feature: "dossierGallery" as const },
  { id: "mapa", label: "Mapa", feature: "dossierMap" as const },
  { id: "timeline", label: "Linha do tempo", feature: "dossierTimeline" as const },
  { id: "teorias", label: "Teorias", feature: "dossierTheories" as const },
  { id: "juris", label: "Crime Mania Juris", feature: "dossierJuris" as const },
];

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const dossier = getDossierPreview(slug);
  if (!dossier) notFound();

  const session = await getSession();
  const tier = session?.tier ?? "none";

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

      <nav className="flex flex-wrap gap-2 text-sm" aria-label="Seções do dossiê">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="rounded-sm border border-cm-gray-dark px-3 py-1 text-cm-gray hover:text-white"
          >
            {section.label}
          </a>
        ))}
      </nav>

      {SECTIONS.map((section) => {
        const allowed = tierHasFeature(tier, section.feature);
        const paywall = evaluateAccess(session, section.feature);
        return (
          <section
            key={section.id}
            id={section.id}
            className="scroll-mt-28 rounded-sm border border-cm-gray-dark bg-cm-surface p-6"
          >
            <h2 className="font-display text-lg text-white">{section.label}</h2>
            {allowed ? (
              <p className="mt-3 text-sm leading-relaxed text-cm-gray">
                Conteúdo editorial reservado — estrutura pronta para imagens ampliáveis, galeria com
                teclado, cronologia em cartões verticais no mobile e player protegido para Juris.
                Equipe publicará material aprovado via administração.
              </p>
            ) : (
              <div className="mt-4">
                <PaywallCard state={paywall} />
              </div>
            )}
          </section>
        );
      })}
    </article>
  );
}
