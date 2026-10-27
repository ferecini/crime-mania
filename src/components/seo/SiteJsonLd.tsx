import { APPLE_PODCAST_URL, SPOTIFY_SHOW_URL, YOUTUBE_CHANNEL_URL } from "@/data/platforms";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";
import { SITE_NAME } from "@/lib/seo/metadata";

/** Schema.org para página inicial e rich results. */
export function SiteJsonLd() {
  const url = getSiteUrl();
  const graph = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url,
      logo: absoluteUrl("/logo-crime-mania.jpg"),
      sameAs: [SPOTIFY_SHOW_URL, APPLE_PODCAST_URL, YOUTUBE_CHANNEL_URL],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url,
      inLanguage: "pt-BR",
      publisher: { "@type": "Organization", name: SITE_NAME },
    },
    {
      "@context": "https://schema.org",
      "@type": "PodcastSeries",
      name: SITE_NAME,
      url,
      genre: "True Crime",
      inLanguage: "pt-BR",
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
