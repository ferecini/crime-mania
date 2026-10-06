import sharp from "sharp";
import { DOSSIER_PROCESSING_LIMITS } from "@/lib/dossier/processing-config";
import type { DossierBlock, DossierAssetFormat } from "@/lib/dossier/types";
import type { DossierStorage } from "@/lib/dossier/storage";

async function writeVariants(
  storage: DossierStorage,
  cropBuffer: Buffer,
  blockStoragePrefix: string,
  sourceWidth: number,
  cropH: number,
): Promise<DossierBlock["variants"]> {
  const variants: DossierBlock["variants"] = [];
  const meta = await sharp(cropBuffer).metadata();
  const srcW = meta.width ?? sourceWidth;
  for (const targetW of DOSSIER_PROCESSING_LIMITS.variantWidths) {
    const resized = sharp(cropBuffer).resize({
      width: Math.min(targetW, srcW),
      withoutEnlargement: true,
    });
    for (const format of DOSSIER_PROCESSING_LIMITS.formats) {
      const relKey = `${blockStoragePrefix}/w${targetW}.${format}`;
      let outBuf: Buffer;
      if (format === "webp") {
        outBuf = await resized.clone().webp({ quality: 88, effort: 4 }).toBuffer();
      } else {
        outBuf = await resized.clone().avif({ quality: 55, effort: 4 }).toBuffer();
      }
      await storage.put(relKey, outBuf, format === "webp" ? "image/webp" : "image/avif");
      const outMeta = await sharp(outBuf).metadata();
      variants.push({
        width: targetW,
        height: outMeta.height ?? Math.round((targetW / srcW) * cropH),
        format: format as DossierAssetFormat,
        storageKey: relKey,
        byteSize: outBuf.length,
      });
    }
  }
  return variants;
}

export async function rerenderBlockCrop(input: {
  storage: DossierStorage;
  sourcePagePng: Buffer;
  sourceWidth: number;
  sourceHeight: number;
  block: Pick<DossierBlock, "id" | "sourceX" | "sourceY" | "sourceWidth" | "sourceHeight">;
  blockStoragePrefix: string;
}): Promise<
  Pick<
    DossierBlock,
    "variants" | "aspectRatio" | "sourceX" | "sourceY" | "sourceWidth" | "sourceHeight"
  >
> {
  const x0 = Math.min(input.sourceWidth - 1, Math.max(0, Math.floor(input.block.sourceX)));
  const y0 = Math.min(input.sourceHeight - 1, Math.max(0, Math.floor(input.block.sourceY)));
  const cropW = Math.min(
    input.sourceWidth - x0,
    Math.max(1, Math.floor(input.block.sourceWidth)),
  );
  const cropH = Math.min(
    input.sourceHeight - y0,
    Math.max(1, Math.floor(input.block.sourceHeight)),
  );
  const cropBuffer = await sharp(input.sourcePagePng)
    .extract({ left: x0, top: y0, width: cropW, height: cropH })
    .png()
    .toBuffer();
  const variants = await writeVariants(
    input.storage,
    cropBuffer,
    input.blockStoragePrefix,
    cropW,
    cropH,
  );
  return {
    sourceX: x0,
    sourceY: y0,
    sourceWidth: cropW,
    sourceHeight: cropH,
    aspectRatio: cropW / cropH,
    variants,
  };
}
