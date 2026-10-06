export type AccessTier = "tier1" | "tier2";

export interface DossierGalleryImage {
  id: string;
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
}

export interface DossierRecord {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  intro: string;
  documentFile: string;
  gallery: DossierGalleryImage[];
  jurisMediaId?: string;
  publishedAt: string;
  accessTier: AccessTier;
  credits?: string;
  relatedEpisodeSlug?: string;
  coverImage?: string;
  textContent: {
    victims?: string;
    locationDate?: string;
    timeline?: string[];
    theories?: string;
  };
}

export interface DossierPreview {
  slug: string;
  title: string;
  category: string;
  intro: string;
  relatedEpisodeSlug: string;
  coverImage: string;
}

const DOSSIERS: DossierRecord[] = [
  {
    id: "banfield-001",
    slug: "familia-banfield",
    title: "Família Banfield",
    category: "ASSASSINATO",
    summary:
      "Assassinato da família Banfield — resumo editorial com vítimas, linha do tempo, mapa e versões da acusação e defesa.",
    intro:
      "Dossiê completo do caso Banfield, com documento aprovado, galeria e Crime Mania Juris vinculado ao mesmo caso.",
    documentFile: "Dossie_Banfield.pdf",
    gallery: [],
    jurisMediaId: undefined,
    publishedAt: "2026-10-05",
    accessTier: "tier1",
    credits: "Material editorial Crime Mania.",
    relatedEpisodeSlug: "",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/production/podcast_uploaded_nologo/11162378/11162378-1613768383181-90894aebfa963.jpg",
    textContent: {
      victims: "Família Banfield — vítimas identificadas no dossiê aprovado.",
      locationDate: "Local e data conforme documento ASSASSINATO: Família Banfield.",
      timeline: [
        "Linha do tempo resumida disponível no PDF e nesta página para leitura acessível.",
      ],
      theories:
        "Teorias e versões da acusação e defesa reunidas no dossiê vertical aprovado pela equipe.",
    },
  },
  {
    id: "carol-stuart",
    slug: "carol-stuart",
    title: "Carol Stuart",
    category: "ASSASSINATO",
    summary: "Material complementar ao episódio público.",
    intro:
      "Material complementar ao episódio público: linha do tempo, mapas e análise editorial do caso em Boston.",
    documentFile: "",
    gallery: [],
    publishedAt: "2025-01-01",
    accessTier: "tier1",
    relatedEpisodeSlug: "carol-stuart",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910505464-e90ef2c4e74ba.jpg",
    textContent: {},
  },
  {
    id: "stephanie-scott",
    slug: "stephanie-scott",
    title: "Stephanie Scott",
    category: "ASSASSINATO",
    summary: "Dossiê em construção editorial.",
    intro:
      "Dossiê em construção editorial com galeria, cronologia e espaço reservado para Crime Mania Juris.",
    documentFile: "",
    gallery: [],
    publishedAt: "2025-01-01",
    accessTier: "tier1",
    relatedEpisodeSlug: "stephanie-scott",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910556047-6f39f85db2244.jpg",
    textContent: {},
  },
];

export function getDossierRecord(slug: string): DossierRecord | undefined {
  return DOSSIERS.find((d) => d.slug === slug);
}

export function listDossierRecords(): DossierRecord[] {
  return [...DOSSIERS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Prévias seguras para listagem — conteúdo completo exige assinatura no servidor. */
export const DOSSIER_PREVIEWS: DossierPreview[] = listDossierRecords().map((d) => ({
  slug: d.slug,
  title: d.title,
  category: d.category,
  intro: d.intro,
  relatedEpisodeSlug: d.relatedEpisodeSlug ?? "",
  coverImage: d.coverImage ?? "",
}));

export function getDossierPreview(slug: string): DossierPreview | undefined {
  return DOSSIER_PREVIEWS.find((d) => d.slug === slug);
}

export function getFeaturedDossierSlug(): string {
  return "familia-banfield";
}
