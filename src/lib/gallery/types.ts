export type GallerySourceType = "ai_placeholder" | "editorial" | "photo" | "document";

export type GalleryItem = {
  id: string;
  order: number;
  caption: string;
  alt: string;
  credit?: string;
  sourceType: GallerySourceType;
  isIllustrative: boolean;
  storageKey: string;
  mimeType: string;
  width?: number;
  height?: number;
};

export type GalleryManifest = {
  dossierSlug: string;
  items: GalleryItem[];
  coverImageId?: string;
  version: number;
  publishedAt?: string;
};

export type GalleryItemPublic = {
  id: string;
  order: number;
  caption: string;
  alt: string;
  credit?: string;
  sourceType: GallerySourceType;
  isIllustrative: boolean;
  width?: number;
  height?: number;
};

export type GalleryManifestPublic = {
  dossierSlug: string;
  coverImageId?: string;
  items: GalleryItemPublic[];
};
