import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { getDossierRecord } from "@/data/dossiers";
import type { DossierDocument, DossierDocumentSection, DocumentBlock } from "@/lib/dossier/document-types";
import { DOSSIER_DOCUMENT_LIMITS } from "@/lib/dossier/document-limits";
import { validatePdfWithPdfJs } from "@/lib/dossier/validate-pdf";
import { sanitizeDocument } from "@/lib/dossier/document-sanitize";

type TextRun = {
  str: string;
  fontSize: number;
  x: number;
  y: number;
  page: number;
};

function median(values: number[]): number {
  if (!values.length) return 12;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function groupLines(runs: TextRun[]): { y: number; text: string; fontSize: number }[] {
  const sorted = runs.slice().sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);
  const lines: { y: number; text: string; fontSize: number; page: number }[] = [];
  for (const run of sorted) {
    const text = run.str.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const last = lines[lines.length - 1];
    if (last && last.page === run.page && Math.abs(last.y - run.y) < 4) {
      last.text = `${last.text} ${text}`.trim();
      last.fontSize = Math.max(last.fontSize, run.fontSize);
    } else {
      lines.push({ y: run.y, text, fontSize: run.fontSize, page: run.page });
    }
  }
  return lines;
}

function classifyLine(line: { text: string; fontSize: number }, bodySize: number): DocumentBlock | null {
  const text = line.text.trim();
  if (!text) return null;
  const id = `auto-${Math.random().toString(36).slice(2, 10)}`;
  if (line.fontSize >= bodySize * 1.35 || (text.length < 80 && text === text.toUpperCase())) {
    return { id, type: "heading", order: 0, level: line.fontSize >= bodySize * 1.6 ? 2 : 3, text };
  }
  if (text.startsWith("•") || text.startsWith("-")) {
    return {
      id,
      type: "list",
      order: 0,
      style: "unordered",
      items: [text.replace(/^[•-]\s*/, "")],
    };
  }
  return { id, type: "paragraph", order: 0, text };
}

async function collectRuns(pdfBuffer: Buffer): Promise<{ runs: TextRun[]; pageCount: number }> {
  await validatePdfWithPdfJs(pdfBuffer);
  const doc = await getDocument({ data: new Uint8Array(pdfBuffer), useSystemFonts: true }).promise;
  const pageCount = Math.min(doc.numPages, DOSSIER_DOCUMENT_LIMITS.maxPagesExtract);
  const runs: TextRun[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const tr = item.transform;
      const fontSize = Math.hypot(tr[0] ?? 0, tr[1] ?? 0) || 12;
      runs.push({
        str: item.str,
        fontSize,
        x: tr[4] ?? 0,
        y: tr[5] ?? 0,
        page: pageNum,
      });
    }
  }
  return { runs, pageCount };
}

export async function extractDocumentFromPdf(input: {
  slug: string;
  pdfBuffer: Buffer;
  pdfStorageKey: string;
  version: number;
}): Promise<DossierDocument> {
  const dossier = getDossierRecord(input.slug);
  if (!dossier) throw new Error("Dossiê desconhecido.");
  if (input.pdfBuffer.length > DOSSIER_DOCUMENT_LIMITS.maxPdfBytes) {
    throw new Error("PDF excede o limite permitido.");
  }

  const { runs, pageCount } = await collectRuns(input.pdfBuffer);
  const bodySize = median(runs.map((r) => r.fontSize));
  const lines = groupLines(runs);
  const blocks: DocumentBlock[] = [];
  let order = 1;

  for (const line of lines) {
    const block = classifyLine(line, bodySize);
    if (!block) continue;
    blocks.push({ ...block, order: order++ });
    if (blocks.length >= DOSSIER_DOCUMENT_LIMITS.maxBlocksPerSection * 2) break;
  }

  const warnings: string[] = [];
  if (!blocks.length) {
    warnings.push("Nenhuma camada de texto detectada — OCR manual necessário.");
  }
  if (pageCount > 1) {
    warnings.push(`Extraídas ${pageCount} páginas; revisar ordem de leitura e títulos.`);
  }

  const section: DossierDocumentSection = {
    id: "extracted",
    order: 1,
    title: "Conteúdo extraído",
    blocks,
  };

  const doc: DossierDocument = sanitizeDocument({
    slug: input.slug,
    title: dossier.title,
    version: input.version,
    status: blocks.length ? "needs_review" : "failed",
    sourcePdfStorageKey: input.pdfStorageKey,
    sections: [section],
    meta: {
      charCount: blocks.reduce((n, b) => n + ("text" in b && typeof b.text === "string" ? b.text.length : 0), 0),
      ocrUsed: false,
      extractionWarnings: warnings,
      pageCount,
    },
    processingError: blocks.length ? undefined : "PDF sem texto selecionável.",
  });

  return doc;
}
