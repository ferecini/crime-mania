import type { DossierDocument, DossierDocumentPublic } from "@/lib/dossier/document-types";

export function toPublicDocument(doc: DossierDocument, hasPdfDownload: boolean): DossierDocumentPublic {
  return {
    slug: doc.slug,
    title: doc.title,
    version: doc.version,
    status: doc.status,
    sections: doc.sections,
    meta: {
      ocrUsed: doc.meta.ocrUsed,
      extractionWarnings: doc.meta.extractionWarnings ?? [],
    },
    hasPdfDownload,
  };
}
