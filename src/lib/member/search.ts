import { ARCHIVE_EPISODES, JURIS_CATALOG, MEMBER_EPISODES } from "@/data/member-media";
import { DOSSIER_PREVIEWS } from "@/data/dossiers";
import { getPublicEpisodes } from "@/data/episodes";
import type { SessionUser } from "@/lib/auth/session";
import { evaluateAccess } from "@/lib/paywall";
import { tierHasFeature } from "@/lib/plans";

export type SearchResultKind = "dossier" | "episodio" | "juris" | "arquivo" | "publico";

export interface MemberSearchResult {
  id: string;
  kind: SearchResultKind;
  title: string;
  summary: string;
  href?: string;
  locked: boolean;
  planHint?: string;
}

function normalizeQuery(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\u0300-\u036f/g, "")
    .toLowerCase()
    .trim();
}

function matches(haystack: string, needle: string): boolean {
  return normalizeQuery(haystack).includes(needle);
}

export async function searchMemberCatalog(
  query: string,
  session: SessionUser | null,
): Promise<MemberSearchResult[]> {
  const q = normalizeQuery(query);
  if (!q) return [];

  const tier = session?.tier ?? "none";
  const results: MemberSearchResult[] = [];

  for (const dossier of DOSSIER_PREVIEWS) {
    if (!matches(`${dossier.title} ${dossier.category} ${dossier.intro}`, q)) continue;
    const access = evaluateAccess(session, "dossierSummary");
    results.push({
      id: `dossier-${dossier.slug}`,
      kind: "dossier",
      title: dossier.title,
      summary: dossier.intro,
      href: access.allowed ? `/membro/dossies/${dossier.slug}` : undefined,
      locked: !access.allowed,
      planHint: access.requiredTier === "tier2" ? "Tier 2" : "Tier 1",
    });
  }

  for (const item of MEMBER_EPISODES) {
    if (!matches(`${item.title} ${item.summary}`, q)) continue;
    const access = evaluateAccess(session, "exclusive");
    results.push({
      id: `member-ep-${item.id}`,
      kind: "episodio",
      title: item.title,
      summary: item.summary,
      href: access.allowed ? "/membro/episodios" : undefined,
      locked: !access.allowed,
      planHint: "Tier 2",
    });
  }

  for (const item of JURIS_CATALOG) {
    if (!matches(`${item.title} ${item.summary}`, q)) continue;
    const access = evaluateAccess(session, "jurisCatalog");
    results.push({
      id: `juris-${item.id}`,
      kind: "juris",
      title: item.title,
      summary: item.summary,
      href: access.allowed ? "/membro/juris" : undefined,
      locked: !access.allowed,
      planHint: "Tier 2",
    });
  }

  for (const item of ARCHIVE_EPISODES) {
    if (!matches(`${item.title} ${item.summary}`, q)) continue;
    const access = evaluateAccess(session, "archive");
    results.push({
      id: `archive-${item.id}`,
      kind: "arquivo",
      title: item.title,
      summary: item.summary,
      href: access.allowed ? "/membro/arquivo" : undefined,
      locked: !access.allowed,
      planHint: "Tier 2",
    });
  }

  if (tierHasFeature(tier, "dossierSummary")) {
    const publicEpisodes = await getPublicEpisodes();
    for (const episode of publicEpisodes) {
      if (!matches(`${episode.title} ${episode.category} ${episode.displayTitle}`, q)) continue;
      results.push({
        id: `public-${episode.slug}`,
        kind: "publico",
        title: episodePublicTitle(episode),
        summary: episode.summary,
        href: `/episodios/${episode.slug}`,
        locked: false,
      });
    }
  }

  return results;
}

function episodePublicTitle(episode: { displayTitle: string; title: string }) {
  return episode.displayTitle?.trim() || episode.title;
}
