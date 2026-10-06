/**
 * Dossier Processing Pipeline — render PDF, cortes editoriais, variantes WebP/AVIF, manifesto.
 * Uso: npx tsx scripts/process-dossier.ts --slug familia-banfield
 * Worker local (não serverless): compatível com Vercel quando artefatos são commitados ou gerados no CI.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import sharp from "sharp";
import { getDossierRecord } from "../src/data/dossiers";
import {
  BANFIELD_EDITORIAL_CROPS,
  DOSSIER_PROCESSING_LIMITS,
  type EditorialCrop,
} from "../src/lib/dossier/processing-config";
import type { DossierBlock, ProcessedDossierManifest } from "../src/lib/dossier/types";
import { writeProcessedManifestFile } from "../src/lib/dossier/manifest-store";
import { extractCropPng } from "../src/lib/dossier/pipeline/crop-utils";

function parseArgs(): { slug: string; publish: boolean } {
  const slugArg = process.argv.find((a) => a.startsWith("--slug="));
  const slug = slugArg?.slice("--slug=".length) ?? "familia-banfield";
  const publish = process.argv.includes("--publish");
  return { slug, publish };
}

function pdfMagicOk(buf: Buffer): boolean {
  return buf.subarray(0, 5).toString("utf8") === "%PDF-";
}

function cropsForSlug(slug: string): EditorialCrop[] {
  if (slug === "familia-banfield") return BANFIELD_EDITORIAL_CROPS;
  throw new Error(`Cortes editoriais não definidos para ${slug}. Adicione em processing-config.ts.`);
}

async function renderPagePng(pdfPath: string, scale: number) {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await getDocument({ data, useSystemFonts: true }).promise;
  if (doc.numPages > DOSSIER_PROCESSING_LIMITS.maxPages) {
    throw new Error(`PDF excede ${DOSSIER_PROCESSING_LIMITS.maxPages} páginas.`);
  }
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale });
  const canvas = createCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d");
  await page.render({ canvasContext: ctx, viewport }).promise;
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
      const relKey = path.posix.join(blockStoragePrefix, `w${targetW}.${format}`);
      const absPath = path.join(process.cwd(), "private", relKey);
      fs.mkdirSync(path.dirname(absPath), { recursive: true });
      let outBuf: Buffer;
      if (format === "webp") {
        outBuf = await resized.clone().webp({ quality: 88, effort: 4 }).toBuffer();
      } else {
        outBuf = await resized.clone().avif({ quality: 55, effort: 4 }).toBuffer();
      }
      fs.writeFileSync(absPath, outBuf);
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

async function main() {
  const { slug, publish } = parseArgs();
  const dossier = getDossierRecord(slug);
  if (!dossier?.documentFile) {
    console.error("Dossiê sem PDF configurado.");
    process.exit(1);
  }

  const pdfPath = path.join(process.cwd(), "private", "dossiers", dossier.documentFile);
  const pdfBuf = fs.readFileSync(pdfPath);
  if (!pdfMagicOk(pdfBuf)) {
    console.error("Arquivo não é PDF válido.");
    process.exit(1);
  }
  if (pdfBuf.length > DOSSIER_PROCESSING_LIMITS.maxPdfBytes) {
    console.error("PDF excede tamanho máximo.");
    process.exit(1);
  }

  const hash = crypto.createHash("sha256").update(pdfBuf).digest("hex").slice(0, 16);
  console.log(`[dossier] hash=${hash} slug=${slug}`);

  const scale = DOSSIER_PROCESSING_LIMITS.renderScale;
  const { png, width, height, pageCount, plainText } = await renderPagePng(pdfPath, scale);
  const crops = cropsForSlug(slug);

  const version = 2;
  const storageRoot = path.posix.join("dossiers/processed", slug, `v${version}`);
  const sourcePageKey = path.posix.join(storageRoot, "source-page.png");
  fs.mkdirSync(path.dirname(path.join(process.cwd(), "private", sourcePageKey)), {
    recursive: true });
  fs.writeFileSync(path.join(process.cwd(), "private", sourcePageKey), png);

  const blocks: DossierBlock[] = [];

  for (const crop of crops) {
    const extracted = await extractCropPng(png, width, height, crop);
    const blockPrefix = path.posix.join(storageRoot, "blocks", crop.id);
    const variants = await writeVariants(extracted.cropBuffer, blockPrefix);
    blocks.push({
      id: crop.id,
      order: crop.order,
      page: 1,
      viewport: crop.viewport,
      label: crop.label,
      sourceX: extracted.sourceX,
      sourceY: extracted.sourceY,
      sourceWidth: extracted.sourceWidth,
      sourceHeight: extracted.sourceHeight,
      aspectRatio: extracted.aspectRatio,
      variants,
      altText: crop.altText,
      omitUiLabel: crop.omitUiLabel,
      extractedText: undefined,
    });
    console.log(
      `[dossier] ${crop.viewport} bloco ${crop.id} ${extracted.sourceWidth}x${extracted.sourceHeight}px ar=${extracted.aspectRatio.toFixed(2)}`,
    );
  }

  const manifest: ProcessedDossierManifest = {
    id: dossier.id,
    slug: dossier.slug,
    title: dossier.title,
    sourcePdfStorageKey: path.posix.join("dossiers", dossier.documentFile),
    status: publish ? "ready" : "needs_review",
    accessTier: dossier.accessTier,
    blocks,
    plainText,
    version,
    publishedAt: publish ? new Date().toISOString().slice(0, 10) : undefined,
    pageCount,
    renderScale: scale,
    sourceWidth: width,
    sourceHeight: height,
    sourcePageStorageKey: sourcePageKey,
  };

  writeProcessedManifestFile(slug, manifest);
  const mobileCount = blocks.filter((b) => b.viewport === "mobile").length;
  const desktopCount = blocks.filter((b) => b.viewport === "desktop").length;
  const totalBytes = blocks.flatMap((b) => b.variants).reduce((s, v) => s + (v.byteSize ?? 0), 0);
  console.log(
    `[dossier] manifesto ${manifest.status} — mobile=${mobileCount} desktop=${desktopCount} blocos, ~${Math.round(totalBytes / 1024)} KiB variantes`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
