import type { Metadata } from "next";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";

export const SITE_NAME = "Crime Mania";
export const DEFAULT_DESCRIPTION =
  "Podcast brasileiro de true crime: assassinatos, mistérios e desaparecimentos narrados com respeito às vítimas. Ouça episódios, conheça planos de assinatura e conteúdo exclusivo.";

const OG_IMAGE_PATH = "/logo-crime-mania.jpg";

export function defaultOpenGraph(): NonNullable<Metadata["openGraph"]> {
  const url = getSiteUrl();
  return {
    type: "website",
    locale: "pt_BR",
    url,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: absoluteUrl(OG_IMAGE_PATH), width: 1200, height: 630, alt: SITE_NAME }],
  };
}

export function buildPageMetadata(input: {
  title: string;
  description?: string;
  path?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const description = input.description ?? DEFAULT_DESCRIPTION;
  const canonical = input.path ? absoluteUrl(input.path) : getSiteUrl();
  return {
    title: input.title,
    description,
    alternates: { canonical },
    openGraph: {
      ...defaultOpenGraph(),
      type: input.ogType ?? "website",
      title: `${input.title} · ${SITE_NAME}`,
      description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} · ${SITE_NAME}`,
      description,
      images: [absoluteUrl(OG_IMAGE_PATH)],
    },
    robots: input.noIndex ? { index: false, follow: false } : { index: true, follow: true },
  };
}

export function rootMetadata(): Metadata {
  const verification: Metadata["verification"] = {};
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  if (google) verification.google = google;

  return {
    metadataBase: new URL(`${getSiteUrl()}/`),
    title: {
      default: `${SITE_NAME} — True crime em português`,
      template: `%s · ${SITE_NAME}`,
    },
    description: DEFAULT_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
      "true crime",
      "podcast true crime",
      "Crime Mania",
      "podcast brasileiro",
      "casos reais",
      "mistérios",
      "investigação",
    ],
    authors: [{ name: SITE_NAME, url: getSiteUrl() }],
    creator: SITE_NAME,
    openGraph: defaultOpenGraph(),
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      images: [absoluteUrl(OG_IMAGE_PATH)],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large" },
    },
    alternates: { canonical: getSiteUrl() },
    verification: Object.keys(verification).length ? verification : undefined,
  };
}
