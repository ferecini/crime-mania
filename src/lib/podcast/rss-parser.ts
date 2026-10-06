export interface ParsedRssItem {
  guid: string;
  title: string;
  description: string;
  summary: string;
  audioUrl: string;
  duration: string;
  publishedAt: string;
  coverImage: string;
  link: string;
  episodeNumber: number | null;
  status: "published" | "archived";
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripHtml(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function readTag(block: string, tag: string): string {
  const cdata = block.match(new RegExp(`<${tag}><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`));
  if (cdata?.[1]) return cdata[1].trim();
  const plain = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return plain?.[1]?.trim() ?? "";
}

function formatDuration(raw: string): string {
  if (!raw || raw === "—") return "—";
  const parts = raw.split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n))) return raw;
  if (parts.length === 3) {
    const [h, m, s] = parts;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${m}:${String(s).padStart(2, "0")}`;
  }
  return raw;
}

export function parsePodcastRss(xml: string): ParsedRssItem[] {
  const items: ParsedRssItem[] = [];
  for (const block of xml.split("<item>").slice(1)) {
    const title = readTag(block, "title");
    const guid =
      readTag(block, "guid") ||
      block.match(/url="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&") ||
      title;
    const description = readTag(block, "description");
    const audioUrl =
      block.match(/<enclosure[^>]+url="([^"]+)"/)?.[1]?.replace(/&amp;/g, "&") ?? "";
    const duration = formatDuration(readTag(block, "itunes:duration"));
    const pub = readTag(block, "pubDate");
    const epRaw = readTag(block, "itunes:episode");
    const cover =
      block.match(/<itunes:image[^>]+href="([^"]+)"/)?.[1] ??
      block.match(/<media:thumbnail[^>]+url="([^"]+)"/)?.[1] ??
      "";
    const link = readTag(block, "link");
    let publishedAt = "";
    if (pub) {
      const d = new Date(pub);
      if (!Number.isNaN(d.getTime())) publishedAt = d.toISOString().slice(0, 10);
    }
    const episodeNumber = epRaw ? Number(epRaw) : null;
    items.push({
      guid,
      title,
      description,
      summary: stripHtml(description).slice(0, 320),
      audioUrl,
      duration,
      publishedAt,
      coverImage: cover,
      link,
      episodeNumber: Number.isFinite(episodeNumber) ? episodeNumber : null,
      status: "published",
    });
  }
  return items;
}

export function normalizeEpisodeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\u0300-\u036f/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function slugifyEpisodeTitle(displayTitle: string): string {
  const t = displayTitle.includes(":") ? displayTitle.split(":").slice(1).join(":").trim() : displayTitle;
  const ascii = t
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const slug = ascii.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
  return slug || "episodio";
}

export function splitCategoryAndTitle(displayTitle: string): { category: string; title: string } {
  if (displayTitle.includes(":")) {
    const [category, ...rest] = displayTitle.split(":");
    return { category: category.trim(), title: rest.join(":").trim() };
  }
  return { category: "EPISÓDIO", title: displayTitle.trim() };
}
