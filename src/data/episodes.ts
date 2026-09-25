import rawEpisodes from "@/data/episodes.generated.json";
import {
  APPLE_PODCAST_URL,
  DEEZER_SHOW_ID,
  DEEZER_SHOW_URL,
  INSTAGRAM_URL,
  SITE_URL,
  SPOTIFY_SHOW_URL,
  YOUTUBE_CHANNEL_URL,
} from "@/data/platforms";

export type EpisodeCategory = string;

export interface PublicEpisode {
  slug: string;
  /** Número editorial quando há correspondência confiável no RSS. */
  number?: number;
  category: EpisodeCategory;
  /** Título do caso (sem prefixo editorial). */
  title: string;
  /** Título completo como no Spotify. */
  displayTitle: string;
  summary: string;
  duration: string;
  publishedAt: string;
  coverImage: string;
  spotifyOpenEpisodeId: string;
  spotifyUrl: string;
  appleEpisodeId: string;
  appleUrl: string;
  deezerShowId: string;
  deezerShowUrl: string;
  audioUrl: string;
  youtubeVideoId?: string;
  youtubeUrl?: string;
}

type RawEpisode = (typeof rawEpisodes)[number];

function mapEpisode(raw: RawEpisode): PublicEpisode {
  return {
    slug: raw.slug,
    number: raw.number ?? undefined,
    category: raw.category,
    title: raw.title,
    displayTitle: raw.displayTitle,
    summary: raw.summary,
    duration: raw.duration,
    publishedAt: raw.publishedAt,
    coverImage: raw.coverImage,
    spotifyOpenEpisodeId: raw.spotifyOpenEpisodeId,
    spotifyUrl: raw.spotifyUrl,
    appleEpisodeId: raw.appleEpisodeId,
    appleUrl: raw.appleUrl,
    deezerShowId: raw.deezerShowId ?? DEEZER_SHOW_ID,
    deezerShowUrl: raw.deezerShowUrl ?? DEEZER_SHOW_URL,
    audioUrl: raw.audioUrl,
    youtubeVideoId: raw.youtubeVideoId ?? undefined,
    youtubeUrl: raw.youtubeUrl ?? undefined,
  };
}

export const PUBLIC_EPISODES: PublicEpisode[] = (rawEpisodes as RawEpisode[]).map(mapEpisode);

export function getEpisodeBySlug(slug: string): PublicEpisode | undefined {
  return PUBLIC_EPISODES.find((e) => e.slug === slug);
}

export function formatEpisodeNumber(number?: number): string | null {
  if (number == null || number <= 0) return null;
  return String(number).padStart(3, "0");
}

export {
  SPOTIFY_SHOW_URL,
  YOUTUBE_CHANNEL_URL,
  INSTAGRAM_URL,
  SITE_URL,
  APPLE_PODCAST_URL,
  DEEZER_SHOW_URL,
};
