export type MemberMediaFormat = "audio" | "video";

export interface MemberMediaItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  duration: string;
  formats: MemberMediaFormat[];
  audioUrl?: string;
  videoUrl?: string;
  dossierSlug?: string;
  progressPercent?: number;
}

/** Episódios premium da área Episódios (Tier 2). */
export const MEMBER_EPISODES: MemberMediaItem[] = [];

/** Catálogo Crime Mania Juris (Tier 2). */
export const JURIS_CATALOG: MemberMediaItem[] = [];

/** Arquivo privado (Tier 2). */
export const ARCHIVE_EPISODES: MemberMediaItem[] = [];

export function getJurisItem(id: string): MemberMediaItem | undefined {
  return JURIS_CATALOG.find((item) => item.id === id);
}
