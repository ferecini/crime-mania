/** Cortes editoriais iniciais (fração 0–1 da altura da página renderizada). Revisáveis no admin. */
export type EditorialCrop = {
  id: string;
  label: string;
  yStart: number;
  yEnd: number;
  altText: string;
};

export const BANFIELD_EDITORIAL_CROPS: EditorialCrop[] = [
  {
    id: "01-capa-resumo",
    label: "Capa e resumo do caso",
    yStart: 0,
    yEnd: 0.122,
    altText: "Capa do dossiê Família Banfield e resumo do caso.",
  },
  {
    id: "02-vitimas-local",
    label: "Vítimas, local e data",
    yStart: 0.122,
    yEnd: 0.191,
    altText: "Vítimas, local e data do crime Banfield.",
  },
  {
    id: "03-mapa",
    label: "Mapa",
    yStart: 0.191,
    yEnd: 0.33,
    altText: "Mapa relacionado ao caso Banfield.",
  },
  {
    id: "04-linha-do-tempo",
    label: "Linha do tempo",
    yStart: 0.33,
    yEnd: 0.486,
    altText: "Linha do tempo do caso Banfield.",
  },
  {
    id: "05-teorias-acusacao",
    label: "Teorias e versão da acusação",
    yStart: 0.486,
    yEnd: 0.66,
    altText: "Teorias e versão da acusação no caso Banfield.",
  },
  {
    id: "06-defesa-brendan",
    label: "Versão da defesa de Brendan",
    yStart: 0.66,
    yEnd: 0.816,
    altText: "Versão da defesa de Brendan Banfield.",
  },
  {
    id: "07-defesa-juliana",
    label: "Versão da defesa de Juliana e encerramento",
    yStart: 0.816,
    yEnd: 1,
    altText: "Versão da defesa de Juliana Banfield e encerramento editorial.",
  },
];

export const DOSSIER_PROCESSING_LIMITS = {
  maxPdfBytes: 25 * 1024 * 1024,
  maxPages: 20,
  renderScale: 2,
  variantWidths: [640, 960, 1440] as const,
  formats: ["webp", "avif"] as const,
  maxBlockSourceHeightPx: 1400,
};
