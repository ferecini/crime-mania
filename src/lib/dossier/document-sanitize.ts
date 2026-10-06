import type { DocumentBlock, DossierDocument } from "@/lib/dossier/document-types";
import { DOSSIER_DOCUMENT_LIMITS } from "@/lib/dossier/document-limits";

const HTTP_LINK = /^https?:\/\//i;

export function escapePlainText(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function sanitizeLinkHref(href: string): string | null {
  const trimmed = href.trim();
  if (!HTTP_LINK.test(trimmed)) return null;
  if (trimmed.length > 2048) return null;
  return trimmed;
}

function sanitizeBlock(block: DocumentBlock): DocumentBlock | null {
  switch (block.type) {
    case "heading":
      return {
        ...block,
        text: block.text.trim().slice(0, 500),
        level: block.level >= 1 && block.level <= 3 ? block.level : 2,
      };
    case "paragraph":
    case "quote":
    case "callout":
      return { ...block, text: block.text.trim().slice(0, 20_000) };
    case "image":
      return {
        ...block,
        assetId: block.assetId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64),
        alt: block.alt.trim().slice(0, 500),
        caption: block.caption?.trim().slice(0, 1000),
        credit: block.credit?.trim().slice(0, 300),
      };
    case "figure":
      return {
        ...block,
        assetId: block.assetId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64),
        alt: block.alt.trim().slice(0, 500),
        caption: block.caption.trim().slice(0, 1000),
        credit: block.credit?.trim().slice(0, 300),
      };
    case "facts":
      return {
        ...block,
        items: block.items.slice(0, 24).map((item) => ({
          label: item.label.trim().slice(0, 120),
          value: item.value.trim().slice(0, 2000),
        })),
      };
    case "timeline":
      return {
        ...block,
        entries: block.entries.slice(0, 48).map((e) => ({
          date: e.date.trim().slice(0, 80),
          title: e.title.trim().slice(0, 200),
          body: e.body.trim().slice(0, 4000),
        })),
      };
    case "list":
      return {
        ...block,
        items: block.items.slice(0, 64).map((i) => i.trim().slice(0, 2000)),
      };
    case "table":
      return {
        ...block,
        headers: block.headers.slice(0, 12).map((h) => h.trim().slice(0, 120)),
        rows: block.rows.slice(0, 64).map((row) =>
          row.slice(0, 12).map((cell) => cell.trim().slice(0, 2000)),
        ),
      };
    default:
      return block;
  }
}

export function sanitizeDocument(doc: DossierDocument): DossierDocument {
  const sections = doc.sections
    .slice(0, DOSSIER_DOCUMENT_LIMITS.maxSections)
    .map((section, si) => ({
      ...section,
      id: section.id.slice(0, 64) || `section-${si + 1}`,
      order: si + 1,
      title: section.title?.trim().slice(0, 200),
      blocks: section.blocks
        .slice(0, DOSSIER_DOCUMENT_LIMITS.maxBlocksPerSection)
        .map((b, bi) => sanitizeBlock({ ...b, order: bi + 1 }))
        .filter((b): b is DocumentBlock => Boolean(b)),
    }));

  let charCount = 0;
  for (const section of sections) {
    for (const block of section.blocks) {
      if ("text" in block && typeof block.text === "string") charCount += block.text.length;
      if (block.type === "timeline") {
        for (const entry of block.entries) charCount += entry.body.length + entry.title.length;
      }
      if (block.type === "facts") {
        for (const item of block.items) charCount += item.label.length + item.value.length;
      }
    }
  }

  return {
    ...doc,
    title: doc.title.trim().slice(0, 300),
    sections,
    meta: {
      ...doc.meta,
      charCount: Math.min(charCount, 500_000),
      extractionWarnings: (doc.meta.extractionWarnings ?? []).slice(0, 32),
    },
  };
}
