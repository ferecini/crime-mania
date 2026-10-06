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
  for (const targetW of DOSSIER_PROCESSING_LIMITS.variantWidths) {
    const resized = sharp(cropBuffer).resize({
      width: Math.min(targetW, sourceWidth),
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
        height: outMeta.height ?? Math.round((targetW / sourceWidth) * cropH),
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
  block: Pick<DossierBlock, "id" | "sourceY" | "sourceHeight">;
  blockStoragePrefix: string;
}): Promise<Pick<DossierBlock, "variants" | "aspectRatio" | "sourceY" | "sourceHeight">> {
  const y0 = Math.min(input.sourceHeight - 1, Math.max(0, Math.floor(input.block.sourceY)));
  const cropH = Math.min(
    input.sourceHeight - y0,
    Math.max(1, Math.floor(input.block.sourceHeight)),
  );
  const cropBuffer = await sharp(input.sourcePagePng)
    .extract({ left: 0, top: y0, width: input.sourceWidth, height: cropH })
    .png()
    .toBuffer();
  const variants = await writeVariants(
    input.storage,
    cropBuffer,
    input.blockStoragePrefix,
    input.sourceWidth,
    cropH,
  );
  return {
    sourceY: y0,
    sourceHeight: cropH,
    aspectRatio: input.sourceWidth / cropH,
    variants,
  };
}
