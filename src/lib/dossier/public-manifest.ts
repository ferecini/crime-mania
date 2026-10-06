import type { DossierManifestPublic, ProcessedDossierManifest } from "@/lib/dossier/types";

export function toPublicManifest(manifest: ProcessedDossierManifest): DossierManifestPublic {
  const widths = new Set<number>();
  for (const block of manifest.blocks) {
    for (const v of block.variants) widths.add(v.width);
  }
  const sortedWidths = [...widths].sort((a, b) => a - b);

  return {
    slug: manifest.slug,
    title: manifest.title,
    status: manifest.status,
    version: manifest.version,
    hasTextVersion: Boolean(manifest.plainText?.trim()),
    hasPdfDownload: Boolean(manifest.sourcePdfStorageKey),
    blocks: manifest.blocks
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((b) => ({
        id: b.id,
        order: b.order,
        viewport: b.viewport === "mobile" ? "mobile" : "desktop",
        label: b.label,
        aspectRatio: b.aspectRatio,
        altText: b.altText,
        credit: b.credit,
        decorative: b.decorative,
        omitUiLabel: b.omitUiLabel,
        widths: sortedWidths.length ? sortedWidths : [640, 960, 1440],
      })),
  };
}
