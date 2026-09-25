import type { PublicEpisode } from "@/data/episodes";

export const categoryArtwork = {
  assassinato: "/images/visual-kit/episodios/assassinato.png",
  desaparecida: "/images/visual-kit/episodios/desaparecida.png",
  misterio: "/images/visual-kit/episodios/misterio.png",
  predador: "/images/visual-kit/episodios/predador.png",
  manipuladas: "/images/visual-kit/episodios/manipuladas.png",
  "golpe-de-amor": "/images/visual-kit/episodios/golpe-de-amor.png",
} as const;

export type VisualCategoryKey = keyof typeof categoryArtwork;

const PODCAST_COVER_GENERIC =
  "https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/11162378/11162378-1613768383181-90894aebfa963.jpg";

/** Normaliza categoria editorial para uma das seis artes do kit. */
export function getVisualCategoryKey(category: string): VisualCategoryKey {
  const c = category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();

  if (c.includes("ASSASSINATO")) return "assassinato";
  if (c.includes("DESAPAREC") || c.includes("PERSEGUIDA")) return "desaparecida";
  if (c.includes("PREDADOR")) return "predador";
  if (c.includes("MANIPULAD")) return "manipuladas";
  if (c.includes("GOLPE")) return "golpe-de-amor";
  if (c.includes("MISTERIO")) return "misterio";
  return "misterio";
}

export function getCategoryArtworkSrc(category: string): string {
  return categoryArtwork[getVisualCategoryKey(category)];
}

/** Capa oficial do RSS substitui o fundo; caso genérico usa arte por categoria. */
export function resolveEpisodeBackgroundSrc(
  episode: Pick<PublicEpisode, "category" | "coverImage">,
): string {
  const cover = episode.coverImage?.trim() ?? "";
  const isGeneric =
    !cover ||
    cover === PODCAST_COVER_GENERIC ||
    cover.includes("podcast_uploaded_nologo");
  const isEpisodeArt = cover.includes("podcast_uploaded_episode");
  if (isEpisodeArt && !isGeneric) return cover;
  return getCategoryArtworkSrc(episode.category);
}

export const memberSectionArtwork = {
  dossies: "/images/visual-kit/membros/dossies.png",
  arquivo: "/images/visual-kit/membros/arquivo.png",
  exclusivo: "/images/visual-kit/membros/exclusivo.png",
  juris: "/images/visual-kit/membros/juris.png",
  comunidade: "/images/visual-kit/membros/comunidade.png",
  shop: "/images/visual-kit/membros/shop.png",
} as const;

export const heroArtwork = {
  desktop: "/images/visual-kit/hero/hero-desktop.png",
  mobile: "/images/visual-kit/hero/hero-mobile.png",
} as const;

export const aboutPlaceholder =
  "/images/visual-kit/sobre/apresentadora-placeholder.png";

export const shopProductArtwork = {
  mug: "/images/visual-kit/shop/caneca.png",
  shirt: "/images/visual-kit/shop/camiseta.png",
} as const;

/** Variação sutil entre cards consecutivos (escala, recorte, detalhe vermelho). */
export function getEpisodeCoverVariation(index: number) {
  const i = Math.abs(index) % 6;
  const scales = [1, 1.02, 1.04, 1.01, 1.06, 1.03];
  const positions = [
    "center center",
    "62% 38%",
    "40% 60%",
    "center 30%",
    "70% 50%",
    "35% 45%",
  ] as const;
  const accentX = ["8%", "92%", "12%", "88%", "50%", "24%"][i];
  return {
    scale: scales[i],
    objectPosition: positions[i],
    accentStyle: { left: accentX },
  };
}
