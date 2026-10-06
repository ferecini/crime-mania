export const DOSSIER_DOCUMENT_LIMITS = {
  maxSections: 48,
  maxBlocksPerSection: 120,
  maxPagesExtract: 40,
  jobTimeoutMs: 14 * 60 * 1000,
  maxPdfBytes: 25 * 1024 * 1024,
  allowedImageMime: new Set(["image/webp", "image/jpeg", "image/png", "image/avif"]),
} as const;
