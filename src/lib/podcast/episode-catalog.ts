import { unstable_cache } from "next/cache";
import rawSnapshot from "@/data/episodes.generated.json";
import supplements from "@/data/episode-supplements.json";
import type { PublicEpisode } from "@/data/episodes";
import {
  normalizeEpisodeLabel,
  parsePodcastRss,
  slugifyEpisodeTitle,
  splitCategoryAndTitle,
  type ParsedRssItem,
} from "@/lib/podcast/rss-parser";
import {
  APPLE_PODCAST_URL,
  DEEZER_SHOW_ID,
  DEEZER_SHOW_URL,
} from "@/data/platforms";

const DEFAULT_RSS_URL = "https://anchor.fm/s/43210668/podcast/rss";
const PODCAST_COVER =
  "https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/11162378/11162378-1613768383181-90894aebfa963.jpg";

export const EPISODE_REVALIDATE_SECONDS = Number(
  process.env.EPISODE_REVALIDATE_SECONDS ?? "1800",
);

type Supplement = (typeof supplements)[number];
type SnapshotRow = (typeof rawSnapshot)[number];

let lastSyncError: string | null = null;
let lastSyncAt: string | null = null;

export function getEpisodeSyncDiagnostics() {
  return { lastSyncError, lastSyncAt, revalidateSeconds: EPISODE_REVALIDATE_SECONDS };
}

function supplementByTitle(): Map<string, Supplement> {
  const map = new Map<string, Supplement>();
  for (const row of supplements) {
    map.set(normalizeEpisodeLabel(row.displayTitle), row);
  }
  return map;
}

function mapSnapshotRow(raw: SnapshotRow): PublicEpisode {
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
    guid: raw.slug,
    status: "published" as const,
  };
}

function mergeRssItem(item: ParsedRssItem, byTitle: Map<string, Supplement>): PublicEpisode {
  const displayTitle = item.title.trim();
  const { category, title } = splitCategoryAndTitle(displayTitle);
  const supplement =
    byTitle.get(normalizeEpisodeLabel(displayTitle)) ??
    [...byTitle.values()].find((s) => {
      const n = normalizeEpisodeLabel(displayTitle);
      const st = normalizeEpisodeLabel(s.displayTitle);
      return n.includes(st) || st.includes(n);
    });

  const slug = supplement?.slug ?? slugifyEpisodeTitle(displayTitle);

  const mergedCategory = supplement?.categoryOverride ?? category;
  return {
    guid: item.guid,
    slug,
    number: item.episodeNumber ?? undefined,
    category: mergedCategory,
    title,
    displayTitle,
    summary: item.summary || `Episódio Crime Mania: ${displayTitle}.`,
    duration: item.duration,
    publishedAt: item.publishedAt,
    coverImage: item.coverImage || PODCAST_COVER,
    spotifyOpenEpisodeId: supplement?.spotifyOpenEpisodeId ?? "",
    spotifyUrl: supplement?.spotifyUrl ?? "",
    appleEpisodeId: supplement?.appleEpisodeId ?? "",
    appleUrl: supplement?.appleUrl ?? APPLE_PODCAST_URL,
    deezerShowId: supplement?.deezerShowId ?? DEEZER_SHOW_ID,
    deezerShowUrl: supplement?.deezerShowUrl ?? DEEZER_SHOW_URL,
    audioUrl: item.audioUrl,
    youtubeVideoId: supplement?.youtubeVideoId ?? undefined,
    youtubeUrl: supplement?.youtubeUrl ?? undefined,
    status: item.status,
  };
}

function mergeCatalogFromRss(rssXml: string): PublicEpisode[] {
  const byTitle = supplementByTitle();
  const rssItems = parsePodcastRss(rssXml);
  const activeGuids = new Set(rssItems.map((i) => i.guid));
  const episodes = rssItems.map((item) => mergeRssItem(item, byTitle));

  const rssSlugs = new Set(episodes.map((e) => e.slug));
  for (const snap of rawSnapshot as SnapshotRow[]) {
    if (rssSlugs.has(snap.slug)) continue;
    episodes.push({
      ...mapSnapshotRow(snap),
      guid: snap.slug,
      status: "archived",
    });
  }

  episodes.sort((a, b) => {
    const da = a.publishedAt || "";
    const db = b.publishedAt || "";
    if (da !== db) return db.localeCompare(da);
    return (b.number ?? 0) - (a.number ?? 0);
  });

  void activeGuids;
  return episodes.filter((e) => e.status === "published");
}

async function fetchRssXml(): Promise<string | null> {
  const url = process.env.PODCAST_RSS_URL?.trim() || DEFAULT_RSS_URL;
  try {
    const res = await fetch(url, {
      next: { revalidate: EPISODE_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(25_000),
    });
    if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
    const text = await res.text();
    if (!text.includes("<item>")) throw new Error("RSS sem itens");
    lastSyncError = null;
    lastSyncAt = new Date().toISOString();
    return text;
  } catch (err) {
    lastSyncError = err instanceof Error ? err.message : "Falha ao buscar RSS";
    return null;
  }
}

function snapshotCatalog(): PublicEpisode[] {
  return (rawSnapshot as SnapshotRow[]).map(mapSnapshotRow);
}

const loadCatalogCached = unstable_cache(
  async (): Promise<PublicEpisode[]> => {
    const xml = await fetchRssXml();
    if (xml) {
      try {
        return mergeCatalogFromRss(xml);
      } catch (err) {
        lastSyncError = err instanceof Error ? err.message : "Falha ao normalizar RSS";
      }
    }
    return snapshotCatalog();
  },
  ["crime-mania-public-episodes"],
  { revalidate: EPISODE_REVALIDATE_SECONDS, tags: ["crime-mania-public-episodes"] },
);

export async function getPublicEpisodes(): Promise<PublicEpisode[]> {
  return loadCatalogCached();
}

export async function getEpisodeBySlug(slug: string): Promise<PublicEpisode | undefined> {
  const list = await getPublicEpisodes();
  return list.find((e) => e.slug === slug);
}

export async function getArchivedEpisodeBySlug(slug: string): Promise<PublicEpisode | undefined> {
  const snap = (rawSnapshot as SnapshotRow[]).find((e) => e.slug === slug);
  return snap ? { ...mapSnapshotRow(snap), status: "archived" } : undefined;
}
