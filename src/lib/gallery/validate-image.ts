import sharp from "sharp";

const MAX_BYTES = 8 * 1024 * 1024;
const MAX_DIM = 6000;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function validateGalleryImage(
  buf: Buffer,
  declaredMime: string,
): Promise<{ mimeType: string; width: number; height: number }> {
  if (buf.length > MAX_BYTES) {
    throw new Error("Imagem excede 8 MB.");
  }
  const meta = await sharp(buf).metadata();
  const format = meta.format;
  const mimeType =
    format === "jpeg"
      ? "image/jpeg"
      : format === "png"
        ? "image/png"
        : format === "webp"
          ? "image/webp"
          : format === "heif"
            ? "image/avif"
            : "";
  if (!mimeType || !ALLOWED.has(mimeType)) {
    throw new Error("Formato não permitido. Use JPG, PNG, WebP ou AVIF.");
  }
  if (declaredMime && !declaredMime.startsWith("image/")) {
    throw new Error("MIME inválido.");
  }
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  if (width < 1 || height < 1 || width > MAX_DIM || height > MAX_DIM) {
    throw new Error("Dimensões inválidas ou acima de 6000 px.");
  }
  return { mimeType, width, height };
}
