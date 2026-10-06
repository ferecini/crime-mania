import {
  APPLE_PODCAST_URL,
  DEEZER_SHOW_URL,
  INSTAGRAM_URL,
  SITE_URL,
  SPOTIFY_SHOW_URL,
  YOUTUBE_CHANNEL_URL,
} from "@/data/platforms";
import {
  getArchivedEpisodeBySlug,
  getEpisodeBySlug as getEpisodeBySlugAsync,
  getPublicEpisodes,
} from "@/lib/podcast/episode-catalog";

export type EpisodeCategory = string;
export type EpisodeStatus = "published" | "archived";

export interface PublicEpisode {
  guid: string;
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
  status?: EpisodeStatus;
}

export { getPublicEpisodes, getEpisodeBySlugAsync as getEpisodeBySlug, getArchivedEpisodeBySlug };

export function formatEpisodeNumber(number?: number): string | null {
  if (number == null || number <= 0) return null;
  return String(number).padStart(3, "0");
}

/** Título canônico igual às plataformas oficiais (Spotify, Apple, etc.). */
export function episodePublicTitle(episode: Pick<PublicEpisode, "displayTitle" | "title">): string {
  const canonical = episode.displayTitle?.trim();
  return canonical || episode.title;
}

function normalizeEpisodeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\u0300-\u036f/g, "")
    .toUpperCase()
    .trim();
}

/** Categoria já aparece no prefixo do título canônico (ex.: ASSASSINATO: Carol Stuart). */
export function episodeCategoryInTitle(
  episode: Pick<PublicEpisode, "displayTitle" | "title" | "category">,
): boolean {
  const title = normalizeEpisodeLabel(episodePublicTitle(episode));
  const category = normalizeEpisodeLabel(episode.category);
  return title.startsWith(`${category}:`) || title.startsWith(`${category} `);
}

export {
  SPOTIFY_SHOW_URL,
  YOUTUBE_CHANNEL_URL,
  INSTAGRAM_URL,
  SITE_URL,
  APPLE_PODCAST_URL,
  DEEZER_SHOW_URL,
};
