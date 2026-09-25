import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EpisodeCover } from "@/components/episodes/EpisodeCover";
import { EpisodePlayer } from "@/components/media/EpisodePlayer";
import { ButtonLink } from "@/components/ui/Button";
import { formatEpisodeNumber, getEpisodeBySlug, PUBLIC_EPISODES, SITE_URL } from "@/data/episodes";
import { formatDateBR } from "@/lib/format";
import { resolveEpisodeBackgroundSrc } from "@/lib/visual/category-artwork";

export function generateStaticParams() {
  return PUBLIC_EPISODES.map((episode) => ({ slug: episode.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) return { title: "Episódio" };
  const title = `${episode.category}: ${episode.title}`;
  const ogImage = resolveEpisodeBackgroundSrc(episode);
  return {
    title,
    description: episode.summary,
    openGraph: {
      title,
      description: episode.summary,
      images: [{ url: ogImage, alt: episode.title }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: episode.summary,
      images: [ogImage],
    },
  };
}

export default async function EpisodeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  if (!episode) notFound();

  const epLabel = formatEpisodeNumber(episode.number);
  const pageUrl = `${SITE_URL.replace(/\/$/, "")}/episodios/${episode.slug}`;
  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "PodcastEpisode",
      name: episode.displayTitle,
      description: episode.summary,
      datePublished: episode.publishedAt || undefined,
      url: pageUrl,
      partOfSeries: {
        "@type": "PodcastSeries",
        name: "Crime Mania",
        url: SITE_URL,
      },
    },
  ];
  if (episode.youtubeVideoId && episode.youtubeUrl) {
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "VideoObject",
      name: `Vídeo — ${episode.title}`,
      description: episode.summary,
      thumbnailUrl: resolveEpisodeBackgroundSrc(episode),
      uploadDate: episode.publishedAt || undefined,
      contentUrl: episode.youtubeUrl,
      embedUrl: `https://www.youtube-nocookie.com/embed/${episode.youtubeVideoId}`,
    });
  }

  const episodeIndex = PUBLIC_EPISODES.findIndex((e) => e.slug === slug);

  return (
    <div className="cm-block min-h-0 pt-28">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="cm-container max-w-3xl">
        <Link href="/episodios" className="text-sm text-cm-gray transition hover:text-white">
          ← Episódios
        </Link>

        <div className="mt-8">
          <EpisodeCover
            episode={episode}
            index={episodeIndex >= 0 ? episodeIndex : 0}
            variant="hero"
            showMetaOnCover={false}
            className="min-h-[320px] w-full"
          />
        </div>

        <div className="mt-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-cm-red">
            {episode.category}
          </p>
          {epLabel && (
            <p className="mt-1 text-[10px] uppercase tracking-widest text-cm-gray">Ep. {epLabel}</p>
          )}
          <h1 className="font-display mt-3 text-3xl leading-tight text-white md:text-4xl">
            {episode.title}
          </h1>
          <p className="mt-3 text-sm text-cm-gray">
            {episode.duration !== "—" ? `${episode.duration} · ` : ""}
            {episode.publishedAt ? formatDateBR(episode.publishedAt) : ""}
          </p>
          <p className="mt-6 text-base leading-relaxed text-cm-gray md:text-lg">{episode.summary}</p>
        </div>

        <div id="player" className="mt-12 scroll-mt-32">
          <h2 className="font-display mb-4 text-sm tracking-[0.3em] text-cm-gray">Ouvir</h2>
          <EpisodePlayer episode={episode} />
        </div>

        <div className="mt-12 border-t border-cm-divider pt-8 sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div>
            <p className="font-display text-xs tracking-[0.25em] text-cm-red">Membros</p>
            <p className="mt-2 max-w-md text-sm text-cm-gray">
              Assine para desbloquear dossiês, Arquivo e Juris com material complementar aos
              episódios públicos.
            </p>
          </div>
          <ButtonLink href="/membro/planos" className="mt-4 shrink-0 sm:mt-0">
            Conheça os planos
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
