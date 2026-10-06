import Link from "next/link";
import { LockedTile } from "@/components/member/LockedTile";
import { getFeaturedDossierSlug, getDossierPreview } from "@/data/dossiers";
import { episodePublicTitle, getPublicEpisodes } from "@/data/episodes";
import { getSession } from "@/lib/auth/session";
import { tierHasFeature } from "@/lib/plans";
import { ButtonLink } from "@/components/ui/Button";
import { EpisodeCover } from "@/components/episodes/EpisodeCover";

export const metadata = { title: "Área de membros" };

export default async function MemberHomePage() {
  const session = await getSession();
  const tier = session?.tier ?? "none";
  const episodes = await getPublicEpisodes();
  const latestEpisode = episodes[0];
  const latestDossier = getDossierPreview(getFeaturedDossierSlug());

  const sections = [
    {
      title: "Episódios",
      description: "Episódios para você",
      href: "/membro/episodios",
      feature: "exclusive" as const,
    },
    {
      title: "Dossiês",
      description: "Informação, fatos e fotos.",
      href: `/membro/dossies/${getFeaturedDossierSlug()}`,
      feature: "dossierSummary" as const,
    },
    {
      title: "Crime Mania Juris",
      description: "Episódios selecionados comentados por especialistas.",
      href: "/membro/juris",
      feature: "jurisCatalog" as const,
    },
    {
      title: "Comunidade",
      description:
        "Espaço exclusivo para debater casos, crimes e tudo sobre o universo do true crime",
      href: "/membro/comunidade",
      feature: "forum" as const,
    },
    {
      title: "Arquivo",
      description: "Explore nosso acervo privado de episódios",
      href: "/membro/arquivo",
      feature: "archive" as const,
    },
    {
      title: "Shop",
      description: "Merch oficial com benefícios para assinantes.",
      href: "/membro/shop",
      feature: "shopDiscount" as const,
      unlockedAlways: true,
    },
  ];

  return (
    <div className="space-y-10">
      <header className="overflow-hidden rounded-[4px] bg-cm-bg-low">
        <div className="grid md:grid-cols-[1.15fr_0.85fr]">
          <div className="p-6 md:p-8">
            <p className="font-display text-xs tracking-[0.3em] text-cm-red">Central do maníaco</p>
            <h1 className="font-display mt-3 text-2xl text-white md:text-3xl">
              Olá, {session?.displayName}
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-cm-gray md:text-base">
              {tier === "none"
                ? "Sua conta está ativa, mas a assinatura ainda não foi liberada. Explore o que está aberto e escolha um plano para desbloquear dossiês, Arquivo e Juris."
                : "Seu plano está ativo. Continue ouvindo, explore dossiês e participe da comunidade."}
            </p>
            {tier === "none" ? (
              <ButtonLink href="/planos" className="mt-5">
                Conheça os planos
              </ButtonLink>
            ) : latestEpisode ? (
              <ButtonLink href={`/episodios/${latestEpisode.slug}#player`} variant="secondary" className="mt-5">
                Continuar ouvindo
              </ButtonLink>
            ) : null}
          </div>
          {latestEpisode && (
            <div className="relative min-h-[200px] border-t border-cm-divider md:min-h-[220px] md:border-l md:border-t-0">
              <div className="absolute inset-3 overflow-hidden rounded-[4px]">
                <EpisodeCover episode={latestEpisode} index={0} variant="compact" className="h-full w-full !aspect-auto" />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5">
                <p className="text-[10px] uppercase tracking-widest text-cm-gray">Continuar ouvindo</p>
                <p className="font-medium text-white">{episodePublicTitle(latestEpisode)}</p>
                <Link
                  href={`/episodios/${latestEpisode.slug}#player`}
                  className="cm-text-link mt-2 inline-flex min-h-11 items-center text-xs font-semibold"
                >
                  Ouvir episódio →
                </Link>
              </div>
            </div>
          )}
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-sm tracking-[0.25em] text-cm-gray">Seu acesso</h2>
          <Link href="/planos" className="text-xs font-semibold text-cm-red hover:text-white">
            Ver planos
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const locked =
              !section.unlockedAlways && !tierHasFeature(tier, section.feature);
            if (locked) {
              return (
                <LockedTile
                  key={section.href}
                  title={section.title}
                  description={section.description}
                  href={section.href}
                  planHint={
                    section.feature === "archive" || section.feature === "jurisCatalog" || section.feature === "exclusive"
                      ? "Tier 2"
                      : "Assinatura"
                  }
                />
              );
            }
            return (
              <Link
                key={section.href}
                href={section.href}
                className="group block rounded-[4px] border border-cm-divider bg-cm-bg-low p-4 transition hover:bg-cm-bg-elevated"
              >
                <h3 className="font-semibold text-white">{section.title}</h3>
                <p className="mt-1 text-sm text-cm-gray">{section.description}</p>
                <p className="mt-3 text-xs font-semibold text-cm-red-light">Acessar →</p>
              </Link>
            );
          })}
        </div>
      </section>

      {latestDossier && (
        <section className="border-t border-cm-divider pt-8">
          <p className="font-display text-xs tracking-[0.25em] text-cm-gray">Dossiê em destaque</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{latestDossier.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-cm-gray">{latestDossier.intro}</p>
            </div>
            <ButtonLink href={`/membro/dossies/${latestDossier.slug}`} variant="secondary" className="shrink-0">
              Abrir dossiê
            </ButtonLink>
          </div>
        </section>
      )}
    </div>
  );
}
