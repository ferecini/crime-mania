import type { DossierCaseForm } from "@/lib/dossier/case-form";
import type { DossierProcessingStatus } from "@/lib/dossier/types";

export type DossierPublishedFormat = "html" | "legacy";

export type DocumentBlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "figure"
  | "quote"
  | "facts"
  | "timeline"
  | "list"
  | "table"
  | "callout"
  | "people";

export type DocumentLink = {
  href: string;
  label: string;
};

export type DocumentBlockBase = {
  id: string;
  type: DocumentBlockType;
  order: number;
  warnings?: string[];
};

export type HeadingBlock = DocumentBlockBase & {
  type: "heading";
  level: 1 | 2 | 3;
  text: string;
};

export type ParagraphBlock = DocumentBlockBase & {
  type: "paragraph";
  text: string;
};

export type ImageBlock = DocumentBlockBase & {
  type: "image";
  assetId: string;
  alt: string;
  caption?: string;
  credit?: string;
  layout?: "landscape" | "portrait" | "inline";
};

export type FigureBlock = DocumentBlockBase & {
  type: "figure";
  assetId: string;
  alt: string;
  caption: string;
  credit?: string;
  /** Tailwind md breakpoint: show only below md or md and up. */
  showWhen?: "mobile-only" | "desktop-only";
};

export type QuoteBlock = DocumentBlockBase & {
  type: "quote";
  text: string;
  attribution?: string;
};

export type FactsBlock = DocumentBlockBase & {
  type: "facts";
  title?: string;
  items: { label: string; value: string }[];
};

export type TimelineEntry = {
  date: string;
  title: string;
  body: string;
  /** Imagem opcional (asset do dossiê) exibida no card. */
  assetId?: string;
};

export type TimelineBlock = DocumentBlockBase & {
  type: "timeline";
  title?: string;
  entries: TimelineEntry[];
};

export type ListBlock = DocumentBlockBase & {
  type: "list";
  style: "unordered" | "ordered";
  items: string[];
};

export type TableBlock = DocumentBlockBase & {
  type: "table";
  caption?: string;
  headers: string[];
  rows: string[][];
};

export type CalloutBlock = DocumentBlockBase & {
  type: "callout";
  variant: "info" | "warning" | "accent";
  title?: string;
  text: string;
};

export type PeopleBlock = DocumentBlockBase & {
  type: "people";
  title?: string;
  items: { name: string; role?: string; credit?: string; assetId?: string }[];
};

export type DocumentBlock =
  | HeadingBlock
  | ParagraphBlock
  | ImageBlock
  | FigureBlock
  | QuoteBlock
  | FactsBlock
  | TimelineBlock
  | ListBlock
  | TableBlock
  | CalloutBlock
  | PeopleBlock;

export type DossierDocumentSection = {
  id: string;
  order: number;
  title?: string;
  /** "phase" renderiza cabeçalho visível (rótulo + título) como etapa do dossiê. */
  kind?: "phase";
  /** Rótulo curto exibido acima do título da fase (ex.: "Fase 1"). */
  label?: string;
  blocks: DocumentBlock[];
};

export type DossierDocumentMeta = {
  charCount: number;
  ocrUsed: boolean;
  extractionWarnings: string[];
  pageCount?: number;
};

export type DossierDocument = {
  slug: string;
  title: string;
  version: number;
  status: DossierProcessingStatus;
  sourcePdfStorageKey?: string;
  sections: DossierDocumentSection[];
  /**
   * Conteúdo estruturado (fonte da verdade quando presente). `sections` é
   * regenerado a partir dele em toda gravação (sanitizeDocument).
   */
  caseForm?: DossierCaseForm;
  meta: DossierDocumentMeta;
  processingError?: string;
  publishedAt?: string;
};

export type DossierDocumentAssetRecord = {
  id: string;
  slug: string;
  storageKey: string;
  mimeType: string;
  byteSize?: number;
  altText?: string;
  caption?: string;
  credit?: string;
};

export type DossierDocumentPublic = {
  slug: string;
  title: string;
  version: number;
  status: DossierProcessingStatus;
  sections: DossierDocumentSection[];
  meta: Pick<DossierDocumentMeta, "extractionWarnings" | "ocrUsed">;
  hasPdfDownload: boolean;
};
