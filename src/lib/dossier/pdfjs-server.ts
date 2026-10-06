import "server-only";
import { pathToFileURL } from "node:url";
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/types/src/display/api";

let workerConfigured = false;

function resolveWorkerModuleUrl(): string {
  const resolved = import.meta.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  return pathToFileURL(resolved).href;
}

/** Configura pdf.js no Node/serverless (Vercel inclui o worker via outputFileTracingIncludes). */
export async function ensurePdfJsNode(): Promise<void> {
  if (workerConfigured) return;
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = resolveWorkerModuleUrl();
  workerConfigured = true;
}

export type PdfLoadOptions = {
  data: Uint8Array;
  useSystemFonts?: boolean;
};

export async function loadPdfDocument(options: PdfLoadOptions): Promise<PDFDocumentProxy> {
  await ensurePdfJsNode();
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task: PDFDocumentLoadingTask = getDocument({
    data: options.data,
    useSystemFonts: options.useSystemFonts ?? true,
  });
  return task.promise;
}
