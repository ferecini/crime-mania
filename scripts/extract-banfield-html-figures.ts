/**
 * Extrai fig-vitimas / fig-mapa a partir de source-page.png (frações em processing-config).
 * npx tsx scripts/extract-banfield-html-figures.ts
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";
import { BANFIELD_HTML_FIGURE_CROPS } from "../src/lib/dossier/processing-config";
import type { HtmlFigureCrop } from "../src/lib/dossier/processing-config";

const slug = "familia-banfield";
const sourceRel = path.join(
  "private",
  "dossiers",
  "processed",
  slug,
  "v2",
  "source-page.png",
);
const outDir = path.join(process.cwd(), "private", "dossiers", "documents", slug, "assets");

function rectFromCrop(pageWidth: number, pageHeight: number, crop: HtmlFigureCrop) {
  const w = Math.floor(pageWidth);
  const h = Math.floor(pageHeight);
  const left = Math.min(w - 1, Math.max(0, Math.floor(crop.xStart * w)));
  const right = Math.min(w, Math.max(left + 1, Math.ceil(crop.xEnd * w)));
  const top = Math.min(h - 1, Math.max(0, Math.floor(crop.yStart * h)));
  const bottom = Math.min(h, Math.max(top + 1, Math.ceil(crop.yEnd * h)));
  return {
    left,
    top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}

async function pipelineFromCrop(pagePng: Buffer, crop: HtmlFigureCrop) {
  const page = sharp(pagePng);
  const meta = await page.metadata();
  const rect = rectFromCrop(meta.width ?? 1, meta.height ?? 1, crop);
  let buf = await sharp(pagePng).extract(rect).png().toBuffer();
  if (crop.trimBorder) {
    buf = await sharp(buf).trim({ threshold: 18 }).png().toBuffer();
  }
  return buf;
}

async function main() {
  const sourcePath = path.join(process.cwd(), sourceRel);
  if (!fs.existsSync(sourcePath)) {
    console.error("source-page.png ausente:", sourceRel);
    process.exit(1);
  }
  fs.mkdirSync(outDir, { recursive: true });

  const pagePng = fs.readFileSync(sourcePath);

  for (const crop of BANFIELD_HTML_FIGURE_CROPS) {
    const outPath = path.join(outDir, `${crop.assetId}.webp`);
    const pngBuf = await pipelineFromCrop(pagePng, crop);
    const webp = await sharp(pngBuf).webp({ quality: 90, effort: 4 }).toBuffer();
    fs.writeFileSync(outPath, webp);
    const outMeta = await sharp(webp).metadata();
    const hash = crypto.createHash("sha256").update(webp).digest("hex");
    const aspect = (outMeta.width ?? 1) / (outMeta.height ?? 1);
    console.log(
      `${crop.assetId}: ${outMeta.width}×${outMeta.height} aspect=${aspect.toFixed(2)} sha256=${hash.slice(0, 16)}…`,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
