import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SpotifyEmbed } from "@/components/media/SpotifyEmbed";
import { YouTubeEmbed } from "@/components/media/YouTubeEmbed";
import { ButtonLink } from "@/components/ui/Button";
import { getEpisodeBySlug } from "@/data/episodes";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episode = getEpisodeBySlug(slug);
  return {
    title: episode ? `${episode.category}: ${episode.title}` : "Episódio",
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

  return (
    <div className="cm-block min-h-0 py-24">
      <div className="cm-container max-w-3xl">
        <Link href="/episodios" className="text-sm text-cm-gray hover:text-white">
          ← Episódios
        </Link>
        <div className="mt-6 flex flex-col gap-6 md:flex-row">
          <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-sm border border-cm-gray-dark md:h-56 md:w-56">
            <Image
              src={episode.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="224px"
            />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-cm-red">
              {episode.category} · Ep. {episode.number}
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-white">{episode.title}</h1>
            <p className="mt-2 text-sm text-cm-gray">
              {episode.duration} · {episode.publishedAt}
            </p>
            <p className="mt-4 leading-relaxed text-cm-gray">{episode.summary}</p>
          </div>
        </div>

        <div id="player" className="mt-10 scroll-mt-28 space-y-6">
          <h2 className="font-display text-sm text-cm-gray">Ouvir</h2>
          <SpotifyEmbed episodeId={episode.spotifyEpisodeId} title={episode.title} />
          {episode.youtubeVideoId ? (
            <YouTubeEmbed videoId={episode.youtubeVideoId} title={episode.title} />
          ) : (
            <p className="text-sm text-cm-gray">
              Vídeo no YouTube:{" "}
              <a
                href={episode.spotifyUrl}
                className="text-cm-red hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                abrir episódio no Spotify
              </a>
            </p>
          )}
        </div>

        <ButtonLink href="/membro/planos" className="mt-10">
          Faça parte
        </ButtonLink>
      </div>
    </div>
  );
}
