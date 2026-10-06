export type DossierProcessingStatus =
  | "uploaded"
  | "processing"
  | "needs_review"
  | "ready"
  | "failed";

export type DossierAssetFormat = "avif" | "webp";

export type DossierAssetVariant = {
  width: number;
  height: number;
  format: DossierAssetFormat;
  storageKey: string;
  byteSize?: number;
};

export type DossierBlockViewport = "mobile" | "desktop";

export type DossierBlock = {
  id: string;
  order: number;
  page: number;
  viewport: DossierBlockViewport;
  label?: string;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  aspectRatio: number;
  variants: DossierAssetVariant[];
  extractedText?: string;
  altText: string;
  credit?: string;
  decorative?: boolean;
  omitUiLabel?: boolean;
};

export type ProcessedDossierManifest = {
  id: string;
  slug: string;
  title: string;
  sourcePdfStorageKey: string;
  status: DossierProcessingStatus;
  accessTier: "tier1" | "tier2";
  blocks: DossierBlock[];
  plainText?: string;
  processingError?: string;
  version: number;
  publishedAt?: string;
  pageCount?: number;
  renderScale?: number;
  sourceWidth?: number;
  sourceHeight?: number;
  /** PNG da página renderizada (storage privado) para recortes editoriais. */
  sourcePageStorageKey?: string;
};

export type DossierManifestPublicBlock = {
  id: string;
  order: number;
  viewport: DossierBlockViewport;
  label?: string;
  aspectRatio: number;
  altText: string;
  credit?: string;
  decorative?: boolean;
  omitUiLabel?: boolean;
  widths: number[];
};

export type DossierManifestPublic = {
  slug: string;
  title: string;
  status: DossierProcessingStatus;
  version: number;
  blocks: DossierManifestPublicBlock[];
  hasTextVersion: boolean;
  hasPdfDownload: boolean;
};
