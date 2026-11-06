import sharp from "sharp";

/** IDs usados no dossiê Banfield; cada um corresponde a um quadrante da grade 2×2 do PDF (ordem do split local). */
export const BANFIELD_PORTRAIT_GRID_ORDER: Record<string, 0 | 1 | 2 | 3> = {
  "fig-portrait-christine": 0,
  "fig-portrait-joseph": 1,
  "fig-portrait-brendan": 2,
  "fig-portrait-juliana": 3,
};

const COLLAGE_MIN_SIDE = 320;
const CROPPED_MAX_SIDE = 280;

function extractQuadrant(
  input: Buffer,
  index: 0 | 1 | 2 | 3,
): Promise<Buffer> {
  return sharp(input)
    .metadata()
    .then((meta) => {
      const w = meta.width ?? 0;
      const h = meta.height ?? 0;
      if (w < 4 || h < 4) throw new Error("empty");
      const halfW = Math.floor(w / 2);
      const halfH = Math.floor(h / 2);
      const quads: { left: number; top: number; width: number; height: number }[] = [
        { left: 0, top: 0, width: halfW, height: halfH },
        { left: halfW, top: 0, width: w - halfW, height: halfH },
        { left: 0, top: halfH, width: halfW, height: h - halfH },
        { left: halfW, top: halfH, width: w - halfW, height: h - halfH },
      ];
      const rect = quads[index]!;
      return sharp(input).extract(rect).webp({ quality: 90, effort: 4 }).toBuffer();
    });
}

/**
 * Se o Blob/Postgres ainda tiver o arquivo antigo (grade 2×2) para um id de retrato,
 * recorta o quadrante certo na hora do GET para o leitor mostrar uma pessoa por card.
 */
export async function ensureBanfieldPortraitWebp(
  slug: string,
  assetId: string,
  bytes: Buffer,
): Promise<{ bytes: Buffer; mimeType: string } | null> {
  if (slug !== "familia-banfield") return null;
  const quadrant = BANFIELD_PORTRAIT_GRID_ORDER[assetId];
  if (quadrant === undefined) return null;

  const meta = await sharp(bytes).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  // Já é retrato (bootstrap novo ou split local).
  if (w <= CROPPED_MAX_SIDE && h <= CROPPED_MAX_SIDE) return null;
  if (w < COLLAGE_MIN_SIDE || h < COLLAGE_MIN_SIDE) return null;

  try {
    const out = await extractQuadrant(bytes, quadrant);
    return { bytes: out, mimeType: "image/webp" };
  } catch {
    return null;
  }
}
