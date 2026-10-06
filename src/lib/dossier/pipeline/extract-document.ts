import { loadPdfDocument } from "@/lib/dossier/pdfjs-server";
import sharp from "sharp";
import { getDossierRecord } from "@/data/dossiers";
import type {
  DossierDocument,
  DossierDocumentSection,
  DocumentBlock,
  DossierDocumentAssetRecord,
} from "@/lib/dossier/document-types";
import { DOSSIER_DOCUMENT_LIMITS } from "@/lib/dossier/document-limits";
import { validatePdfWithPdfJs } from "@/lib/dossier/validate-pdf";
import { sanitizeDocument } from "@/lib/dossier/document-sanitize";
import type { DossierStorage } from "@/lib/dossier/storage";
import { extractEmbeddedImagesFromPage } from "@/lib/dossier/pipeline/extract-embedded-images";
import { ocrUnavailableWarning, tryOcrPdfPages } from "@/lib/dossier/pipeline/ocr-fallback";

type TextRun = {
  str: string;
  fontSize: number;
  x: number;
  y: number;
  page: number;
};

export type ExtractDocumentOptions = {
  slug: string;
  pdfBuffer: Buffer;
  pdfStorageKey: string;
  version: number;
  storage?: DossierStorage;
  upsertAsset?: (record: DossierDocumentAssetRecord) => Promise<void>;
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
  const doc = await loadPdfDocument({ data: new Uint8Array(pdfBuffer), useSystemFonts: true });
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

function blockTextLength(blocks: DocumentBlock[]): number {
  let n = 0;
  for (const b of blocks) {
    if ("text" in b && typeof b.text === "string") n += b.text.length;
    if (b.type === "list") n += b.items.join(" ").length;
    if (b.type === "timeline") n += b.entries.map((e) => e.body).join("").length;
  }
  return n;
}

async function persistExtractedImages(
  opts: ExtractDocumentOptions,
  pageCount: number,
  pdfBuffer: Buffer,
): Promise<{ blocks: DocumentBlock[]; warnings: string[] }> {
  const imageBlocks: DocumentBlock[] = [];
  const warnings: string[] = [];
  if (!opts.storage || !opts.upsertAsset) return { blocks: imageBlocks, warnings };

  const doc = await loadPdfDocument({ data: new Uint8Array(pdfBuffer), useSystemFonts: true });
  const root = `dossiers/documents/${opts.slug}/v${opts.version}/extracted`;

  for (let pageNum = 1; pageNum <= pageCount; pageNum += 1) {
    const page = await doc.getPage(pageNum);
    const images = await extractEmbeddedImagesFromPage(page, pageNum, opts.slug);
    for (const img of images) {
      let webp: Buffer;
      try {
        webp = await sharp(img.bytes).webp({ quality: 82 }).toBuffer();
      } catch {
        warnings.push(`Imagem p.${pageNum} ignorada (formato não suportado).`);
        continue;
      }
      const storageKey = `${root}/${img.id}.webp`;
      await opts.storage.put(storageKey, webp, "image/webp");
      await opts.upsertAsset({
        id: img.id,
        slug: opts.slug,
        storageKey,
        mimeType: "image/webp",
        byteSize: webp.length,
        altText: `Figura extraída do PDF (página ${pageNum})`,
      });
      imageBlocks.push({
        id: `blk-${img.id}`,
        type: "figure",
        order: 0,
        assetId: img.id,
        alt: `Figura extraída do PDF (página ${pageNum})`,
        caption: `Imagem incorporada — página ${pageNum}`,
        warnings: ["Revisar legenda e crédito após extração automática."],
      });
    }
  }

  if (imageBlocks.length) {
    warnings.push(`${imageBlocks.length} imagem(ns) incorporada(s) extraída(s) — revisar alt/caption.`);
  }
  return { blocks: imageBlocks, warnings };
}

export async function extractDocumentFromPdf(input: ExtractDocumentOptions): Promise<DossierDocument> {
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
  let ocrUsed = false;

  if (!blocks.length) {
    const ocrText = await tryOcrPdfPages(input.pdfBuffer, pageCount);
    if (ocrText?.trim()) {
      blocks.push({
        id: "ocr-1",
        type: "paragraph",
        order: 1,
        text: ocrText.trim(),
        warnings: ["Texto via OCR — revisar fidelidade."],
      });
      ocrUsed = true;
      warnings.push("OCR aplicado — revisão editorial obrigatória.");
    } else {
      warnings.push(ocrUnavailableWarning());
    }
  }

  if (pageCount > 1) {
    warnings.push(`Extraídas ${pageCount} páginas; revisar ordem de leitura e títulos.`);
  }

  const { blocks: imageBlocks, warnings: imgWarnings } = await persistExtractedImages(
    input,
    pageCount,
    input.pdfBuffer,
  );
  warnings.push(...imgWarnings);
  for (const ib of imageBlocks) {
    blocks.push({ ...ib, order: order++ });
  }

  const section: DossierDocumentSection = {
    id: "extracted",
    order: 1,
    title: "Conteúdo extraído",
    blocks,
  };

  const charCount = blockTextLength(blocks);
  const status = blocks.length ? "needs_review" : "failed";

  const doc: DossierDocument = sanitizeDocument({
    slug: input.slug,
    title: dossier.title,
    version: input.version,
    status,
    sourcePdfStorageKey: input.pdfStorageKey,
    sections: [section],
    meta: {
      charCount,
      ocrUsed,
      extractionWarnings: warnings,
      pageCount,
    },
    processingError: blocks.length ? undefined : "PDF sem texto selecionável.",
  });

  return doc;
}
