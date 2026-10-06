import fs from "node:fs";
import path from "node:path";

const MIME: Record<string, string> = {
  webp: "image/webp",
  avif: "image/avif",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
};

export function readLocalDocumentAsset(
  slug: string,
  assetId: string,
): { bytes: Buffer; mimeType: string } | null {
  const base = path.join(process.cwd(), "private", "dossiers", "documents", slug, "assets");
  for (const ext of ["webp", "avif", "png", "jpg", "jpeg"]) {
    const filePath = path.join(base, `${assetId}.${ext}`);
    try {
      const bytes = fs.readFileSync(filePath);
      return { bytes, mimeType: MIME[ext] ?? "application/octet-stream" };
    } catch {
      /* try next */
    }
  }
  return null;
}
