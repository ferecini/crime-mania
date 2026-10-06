import sharp from "sharp";
import type { EditorialCrop } from "@/lib/dossier/processing-config";

export function cropRectFromFractions(
  pageWidth: number,
  pageHeight: number,
  crop: EditorialCrop,
): { left: number; top: number; width: number; height: number } {
  const w = Math.floor(pageWidth);
  const h = Math.floor(pageHeight);
  const x0 = Math.min(w - 1, Math.max(0, Math.floor((crop.xStart ?? 0) * w)));
  const x1 = Math.min(w, Math.max(x0 + 1, Math.ceil((crop.xEnd ?? 1) * w)));
  const isColumn = (crop.xStart ?? 0) > 0 || (crop.xEnd ?? 1) < 1;
  const topBleedPx = isColumn ? 4 : 0;
  const y0 = Math.min(h - 1, Math.max(0, Math.floor(crop.yStart * h) - topBleedPx));
  const y1 = Math.min(h, Math.max(y0 + 1, Math.ceil(crop.yEnd * h)));
  return {
    left: x0,
    top: y0,
    width: Math.max(1, x1 - x0),
    height: Math.max(1, y1 - y0),
  };
}

export async function extractCropPng(
  pagePng: Buffer,
  pageWidth: number,
  pageHeight: number,
  crop: EditorialCrop,
): Promise<{
  cropBuffer: Buffer;
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
  aspectRatio: number;
}> {
  const rect = cropRectFromFractions(pageWidth, pageHeight, crop);
  const cropBuffer = await sharp(pagePng)
    .extract(rect)
    .png()
    .toBuffer();
  return {
    cropBuffer,
    sourceX: rect.left,
    sourceY: rect.top,
    sourceWidth: rect.width,
    sourceHeight: rect.height,
    aspectRatio: rect.width / rect.height,
  };
}
