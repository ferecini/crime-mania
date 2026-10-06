import crypto from "node:crypto";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";
import { getDossierRecord } from "@/data/dossiers";
import {
  BANFIELD_EDITORIAL_CROPS,
  DOSSIER_PROCESSING_LIMITS,
  type EditorialCrop,
} from "@/lib/dossier/processing-config";
import type { DossierBlock, ProcessedDossierManifest } from "@/lib/dossier/types";
import type { DossierStorage } from "@/lib/dossier/storage";
import { validatePdfWithPdfJs } from "@/lib/dossier/validate-pdf";

function cropsForSlug(slug: string): EditorialCrop[] {
  if (slug === "familia-banfield") return BANFIELD_EDITORIAL_CROPS;
  throw new Error(`Cortes editoriais não definidos para ${slug}.`);
}

async function renderPagePng(pdfBuf: Buffer, scale: number) {
  await validatePdfWithPdfJs(pdfBuf);
  const doc = await getDocument({ data: new Uint8Array(pdfBuf), useSystemFonts: true }).promise;
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({
    canvas: canvas as unknown as HTMLCanvasElement,
    canvasContext: ctx as unknown as CanvasRenderingContext2D,
    viewport,
  }).promise;
  const png = canvas.toBuffer("image/png");
  const tc = await page.getTextContent();
  const plainParts: string[] = [];
  for (const item of tc.items) {
    if ("str" in item && item.str.trim()) plainParts.push(item.str.trim());
  }
  return {
    png,
    width: viewport.width,
    height: viewport.height,
    pageCount: doc.numPages,
    plainText: plainParts.join("\n"),
  };
}

async function writeVariants(
  storage: DossierStorage,
  cropBuffer: Buffer,
  blockStoragePrefix: string,
): Promise<DossierBlock["variants"]> {
  const variants: DossierBlock["variants"] = [];
  const meta = await sharp(cropBuffer).metadata();
  const srcW = meta.width ?? 1;
  const srcH = meta.height ?? 1;

  for (const targetW of DOSSIER_PROCESSING_LIMITS.variantWidths) {
    const resized = sharp(cropBuffer).resize({
      width: Math.min(targetW, srcW),
      withoutEnlargement: true,
    });
    for (const format of DOSSIER_PROCESSING_LIMITS.formats) {
      const relKey = `${blockStoragePrefix}/w${targetW}.${format}`;
      let outBuf: Buffer;
      const contentType = format === "webp" ? "image/webp" : "image/avif";
      if (format === "webp") {
        outBuf = await resized.clone().webp({ quality: 88, effort: 4 }).toBuffer();
      } else {
        outBuf = await resized.clone().avif({ quality: 55, effort: 4 }).toBuffer();
      }
      await storage.put(relKey, outBuf, contentType);
      const outMeta = await sharp(outBuf).metadata();
      variants.push({
        width: targetW,
        height: outMeta.height ?? Math.round((targetW / srcW) * srcH),
        format,
        storageKey: relKey,
        byteSize: outBuf.length,
      });
    }
  }
  return variants;
}

export async function processPdfToManifest(input: {
  slug: string;
  pdfBuffer: Buffer;
  pdfStorageKey: string;
  version: number;
  storage: DossierStorage;
  publish?: boolean;
  editorialCrops?: EditorialCrop[];
}): Promise<ProcessedDossierManifest> {
  const dossier = getDossierRecord(input.slug);
  if (!dossier) throw new Error("Dossiê desconhecido.");

  const scale = DOSSIER_PROCESSING_LIMITS.renderScale;
  const { png, width, height, pageCount, plainText } = await renderPagePng(input.pdfBuffer, scale);
  const crops = input.editorialCrops ?? cropsForSlug(input.slug);
  const storageRoot = `dossiers/processed/${input.slug}/v${input.version}`;
  const sourcePageKey = `${storageRoot}/source-page.png`;
  await input.storage.put(sourcePageKey, png, "image/png");
  const blocks: DossierBlock[] = [];

  for (let i = 0; i < crops.length; i++) {
    const crop = crops[i];
    const y0 = Math.min(height - 1, Math.max(0, Math.floor(crop.yStart * height)));
    const y1 = Math.min(height, Math.max(y0 + 1, Math.ceil(crop.yEnd * height)));
    const cropH = Math.floor(y1 - y0);
    const cropBuffer = await sharp(png)
      .extract({ left: 0, top: y0, width, height: cropH })
      .png()
      .toBuffer();

    const blockPrefix = `${storageRoot}/blocks/${crop.id}`;
    const variants = await writeVariants(input.storage, cropBuffer, blockPrefix);
    blocks.push({
      id: crop.id,
      order: i + 1,
      page: 1,
      label: crop.label,
      sourceY: y0,
      sourceHeight: cropH,
      aspectRatio: width / cropH,
      variants,
      altText: crop.altText,
    });
  }

  return {
    id: dossier.id,
    slug: dossier.slug,
    title: dossier.title,
    sourcePdfStorageKey: input.pdfStorageKey,
    status: input.publish ? "ready" : "needs_review",
    accessTier: dossier.accessTier,
    blocks,
    plainText,
    version: input.version,
    publishedAt: input.publish ? new Date().toISOString().slice(0, 10) : undefined,
    pageCount,
    renderScale: scale,
    sourceWidth: width,
    sourceHeight: height,
    sourcePageStorageKey: sourcePageKey,
  };
}

export function sha256Hex(buf: Buffer): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}
