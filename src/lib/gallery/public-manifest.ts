import type { GalleryManifest, GalleryManifestPublic } from "@/lib/gallery/types";

export function toPublicGalleryManifest(manifest: GalleryManifest): GalleryManifestPublic {
  return {
    dossierSlug: manifest.dossierSlug,
    coverImageId: manifest.coverImageId,
    items: manifest.items
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        id: item.id,
        order: item.order,
        caption: item.caption,
        alt: item.alt,
        credit: item.credit,
        sourceType: item.sourceType,
        isIllustrative: item.isIllustrative,
      })),
  };
}
