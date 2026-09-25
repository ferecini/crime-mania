import Image from "next/image";
import Link from "next/link";
import { LockedTile } from "@/components/member/LockedTile";
import { DOSSIER_PREVIEWS } from "@/data/dossiers";
import { PUBLIC_EPISODES } from "@/data/episodes";
import { getSession } from "@/lib/auth/session";
import { tierHasFeature } from "@/lib/plans";
import { ButtonLink } from "@/components/ui/Button";
import { memberSectionArtwork } from "@/lib/visual/category-artwork";
import { EpisodeCover } from "@/components/episodes/EpisodeCover";

export const metadata = { title: "Área de membros" };

export default async function MemberHomePage() {
  const session = await getSession();
  const tier = session?.tier ?? "none";
  const latestEpisode = PUBLIC_EPISODES[0];
  const latestDossier = DOSSIER_PREVIEWS[0];

  const sections = [
    {
      title: "Dossiês",
      description: "Material complementar aos episódios públicos.",
      href: "/membro/dossies",
      feature: "dossierSummary" as const,
      image: memberSectionArtwork.dossies,
    },
    {
      title: "Arquivo",
      description: "Casos não públicos, somente em áudio.",
      href: "/membro/arquivo",
      feature: "archive" as const,
      image: memberSectionArtwork.arquivo,
    },
    {
      title: "Conteúdo exclusivo",
      description: "Episódios extras e newsletter em áudio/vídeo.",
      href: "/membro/exclusivo",
      feature: "exclusive" as const,
      image: memberSectionArtwork.exclusivo,
    },
    {
      title: "Crime Mania Juris",
      description: "Análises jurídicas em áudio e vídeo.",
      href: "/membro/juris",
      feature: "jurisCatalog" as const,
      image: memberSectionArtwork.juris,
    },
    {
      title: "Comunidade",
      description: "Fórum geral e sugestões de casos.",
      href: "/membro/comunidade",
      feature: "forum" as const,
      image: memberSectionArtwork.comunidade,
    },
    {
      title: "Shop",
      description: "Merch oficial com benefícios para assinantes.",
      href: "/membro/shop",
      feature: "shopDiscount" as const,
      unlockedAlways: true,
      image: memberSectionArtwork.shop,
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
              <ButtonLink href="/membro/planos" className="mt-5">
                Conheça os planos
              </ButtonLink>
            ) : (
              <ButtonLink href={`/episodios/${latestEpisode.slug}#player`} variant="secondary" className="mt-5">
                Continuar ouvindo
              </ButtonLink>
            )}
          </div>
          <div className="relative min-h-[200px] border-t border-cm-divider md:min-h-[220px] md:border-l md:border-t-0">
            <div className="absolute inset-3 overflow-hidden rounded-[4px]">
              <EpisodeCover episode={latestEpisode} index={0} variant="compact" className="h-full w-full !aspect-auto" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5">
              <p className="text-[10px] uppercase tracking-widest text-cm-gray">Continuar ouvindo</p>
              <p className="font-medium text-white">{latestEpisode.title}</p>
              <Link
                href={`/episodios/${latestEpisode.slug}#player`}
                className="cm-text-link mt-2 inline-flex min-h-11 items-center text-xs font-semibold"
              >
                Ouvir episódio →
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="font-display text-sm tracking-[0.25em] text-cm-gray">Seu acesso</h2>
          <Link href="/membro/planos" className="text-xs font-semibold text-cm-red hover:text-white">
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
                  imageSrc={section.image}
                  planHint={
                    section.feature === "archive" || section.feature === "jurisCatalog"
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
                className="group overflow-hidden rounded-[4px] bg-cm-bg-low transition hover:bg-cm-bg-elevated"
              >
                <div className="relative h-32">
                  <Image
                    src={section.image}
                    alt=""
                    fill
                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                    sizes="320px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" aria-hidden />
                </div>
                <div className="border-t border-cm-divider p-4">
                  <h3 className="font-semibold text-white">{section.title}</h3>
                  <p className="mt-1 text-sm text-cm-gray">{section.description}</p>
                  <p className="mt-3 text-xs font-semibold text-cm-red-light">Acessar →</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-cm-divider pt-8">
        <p className="font-display text-xs tracking-[0.25em] text-cm-gray">Último dossiê em destaque</p>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[4px]">
            <Image src={memberSectionArtwork.dossies} alt="" fill className="object-cover" sizes="96px" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white">{latestDossier.title}</p>
            <p className="mt-1 line-clamp-2 text-sm text-cm-gray">{latestDossier.intro}</p>
          </div>
          <ButtonLink href={`/membro/dossies/${latestDossier.slug}`} variant="secondary" className="shrink-0">
            Abrir dossiê
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
