export interface DossierPreview {
  slug: string;
  title: string;
  category: string;
  intro: string;
  relatedEpisodeSlug: string;
  coverImage: string;
}

/** Prévias seguras para listagem — conteúdo completo exige assinatura no servidor. */
export const DOSSIER_PREVIEWS: DossierPreview[] = [
  {
    slug: "carol-stuart",
    title: "Carol Stuart",
    category: "ASSASSINATO",
    intro:
      "Material complementar ao episódio público: linha do tempo, mapas e análise editorial do caso em Boston.",
    relatedEpisodeSlug: "carol-stuart",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910505464-e90ef2c4e74ba.jpg",
  },
  {
    slug: "stephanie-scott",
    title: "Stephanie Scott",
    category: "ASSASSINATO",
    intro:
      "Dossiê em construção editorial com galeria, cronologia e espaço reservado para Crime Mania Juris.",
    relatedEpisodeSlug: "stephanie-scott",
    coverImage:
      "https://d3t3ozftmdmh3i.cloudfront.net/staging/podcast_uploaded_episode/11162378/11162378-1784910556047-6f39f85db2244.jpg",
  },
];

export function getDossierPreview(slug: string): DossierPreview | undefined {
  return DOSSIER_PREVIEWS.find((d) => d.slug === slug);
}
