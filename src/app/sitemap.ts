import type { MetadataRoute } from "next";
import { getPublicEpisodes } from "@/lib/podcast/episode-catalog";
import { absoluteUrl } from "@/lib/seo/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/episodios"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/planos"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/shop"), changeFrequency: "monthly", priority: 0.5 },
  ];

  let episodes: MetadataRoute.Sitemap = [];
  try {
    const list = await getPublicEpisodes();
    episodes = list.map((ep) => ({
      url: absoluteUrl(`/episodios/${ep.slug}`),
      lastModified: ep.publishedAt ? new Date(ep.publishedAt) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));
  } catch {
    /* catálogo indisponível — sitemap estático apenas */
  }

  return [...staticRoutes, ...episodes];
}
