import { OPS } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { PDFPageProxy } from "pdfjs-dist/types/src/display/api";

export type ExtractedPdfImage = {
  id: string;
  page: number;
  mimeType: string;
  bytes: Buffer;
  width?: number;
  height?: number;
};

function mimeFromFilter(filter: unknown): string {
  const name = typeof filter === "string" ? filter : Array.isArray(filter) ? filter[0] : "";
  if (String(name).includes("DCTDecode")) return "image/jpeg";
  if (String(name).includes("JPXDecode")) return "image/jpeg";
  return "image/png";
}

async function resolveImageBytes(
  page: PDFPageProxy,
  name: string,
): Promise<{ bytes: Buffer; mimeType: string; width?: number; height?: number } | null> {
  try {
    const img = await page.objs.get(name);
    if (!img?.data) return null;
    const raw = img.data as Uint8Array | Uint8ClampedArray;
    if (!raw?.length) return null;
    const mimeType = mimeFromFilter(img.filter);
    return {
      bytes: Buffer.from(raw),
      mimeType,
      width: img.width as number | undefined,
      height: img.height as number | undefined,
    };
  } catch {
    return null;
  }
}

export async function extractEmbeddedImagesFromPage(
  page: PDFPageProxy,
  pageNum: number,
  slug: string,
): Promise<ExtractedPdfImage[]> {
  const out: ExtractedPdfImage[] = [];
  const seen = new Set<string>();
  let opList: Awaited<ReturnType<PDFPageProxy["getOperatorList"]>>;
  try {
    opList = await page.getOperatorList();
  } catch {
    return out;
  }

  for (let i = 0; i < opList.fnArray.length; i += 1) {
    const fn = opList.fnArray[i];
    if (
      fn !== OPS.paintImageXObject &&
      fn !== OPS.paintInlineImageXObject &&
      fn !== OPS.paintImageXObjectRepeat
    ) {
      continue;
    }
    const args = opList.argsArray[i];
    const name = args?.[0];
    if (typeof name !== "string" || seen.has(name)) continue;
    seen.add(name);
    const resolved = await resolveImageBytes(page, name);
    if (!resolved || resolved.bytes.length < 512) continue;
    if (resolved.bytes.length > 8 * 1024 * 1024) continue;
    const id = `pdf-img-p${pageNum}-${seen.size}`;
    out.push({
      id: `${slug.slice(0, 24)}-${id}`.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 64),
      page: pageNum,
      mimeType: resolved.mimeType,
      bytes: resolved.bytes,
      width: resolved.width,
      height: resolved.height,
    });
    if (out.length >= 24) break;
  }
  return out;
}
