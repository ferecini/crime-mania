import crypto from "node:crypto";
import { DOSSIER_PROCESSING_LIMITS } from "@/lib/dossier/processing-config";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class PdfValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfValidationError";
  }
}

export function assertAllowedSlug(slug: string): void {
  if (!SLUG_RE.test(slug) || slug.length > 64) {
    throw new PdfValidationError("Slug inválido.");
  }
}

export function validatePdfBuffer(buf: Buffer): { sha256: string } {
  if (buf.length < 8) throw new PdfValidationError("Arquivo muito pequeno.");
  if (buf.length > DOSSIER_PROCESSING_LIMITS.maxPdfBytes) {
    throw new PdfValidationError("PDF excede tamanho máximo.");
  }
  if (buf.subarray(0, 5).toString("utf8") !== "%PDF-") {
    throw new PdfValidationError("Cabeçalho PDF inválido.");
  }
  const body = buf.toString("latin1");
  if (/\/Encrypt/i.test(body.slice(0, Math.min(body.length, 65536)))) {
    throw new PdfValidationError("PDF criptografado não suportado.");
  }
  if (body.includes("/JBIG2Decode") && buf.length > 5 * 1024 * 1024) {
    throw new PdfValidationError("PDF rejeitado (risco de decompressão).");
  }
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");
  return { sha256 };
}

export async function validatePdfWithPdfJs(buf: Buffer): Promise<{ pageCount: number }> {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const timeoutMs = 30_000;
  const docPromise = getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
  const doc = await Promise.race([
    docPromise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new PdfValidationError("Timeout ao ler PDF.")), timeoutMs),
    ),
  ]);
  const pageCount = doc.numPages;
  if (pageCount > DOSSIER_PROCESSING_LIMITS.maxPages) {
    throw new PdfValidationError(`PDF excede ${DOSSIER_PROCESSING_LIMITS.maxPages} páginas.`);
  }
  if (pageCount < 1) throw new PdfValidationError("PDF sem páginas.");
  return { pageCount };
}
