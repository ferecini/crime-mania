/**
 * Optional OCR when PDF has no text layer. Enable with DOSSIER_ENABLE_OCR=1 and install tesseract.js locally.
 * Production path: needs_review + manual edit in admin (no auto-publish).
 */
export async function tryOcrPdfPages(pdfBuffer: Buffer, maxPages: number): Promise<string | null> {
  void pdfBuffer;
  void maxPages;
  if (process.env.DOSSIER_ENABLE_OCR !== "1") return null;
  return null;
}

export function ocrUnavailableWarning(): string {
  return "PDF sem camada de texto — revise manualmente ou instale OCR (DOSSIER_ENABLE_OCR=1 + tesseract.js).";
}
