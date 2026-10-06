/**
 * Envia PDF + variantes locais do Banfield para Blob e publica manifesto no Postgres.
 * npx tsx scripts/dossier-bootstrap-banfield.ts
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { publishManifest, saveDraftManifest } from "../src/lib/dossier/db";
import { createDossierStorage } from "../src/lib/dossier/storage";
import type { ProcessedDossierManifest } from "../src/lib/dossier/types";

const slug = "familia-banfield";

function readLocalManifest(): ProcessedDossierManifest {
  const p = path.join(process.cwd(), "private", "dossiers", "processed", slug, "manifest.json");
  return JSON.parse(fs.readFileSync(p, "utf8")) as ProcessedDossierManifest;
}

async function ensureSourcePage(
  manifest: ProcessedDossierManifest,
  storage: Awaited<ReturnType<typeof createDossierStorage>>,
): Promise<ProcessedDossierManifest> {
  if (manifest.sourcePageStorageKey) return manifest;
  const sorted = manifest.blocks.slice().sort((a, b) => a.order - b.order);
  const strips: Buffer[] = [];
  let width = manifest.sourceWidth ?? 0;
  for (const block of sorted) {
    const v = block.variants.find((x) => x.width === 1440 && x.format === "webp") ?? block.variants[0];
    if (!v) continue;
    const local = path.join(process.cwd(), "private", v.storageKey);
    if (!fs.existsSync(local)) continue;
    strips.push(fs.readFileSync(local));
    if (!width) {
      const meta = await sharp(local).metadata();
      width = meta.width ?? 1440;
    }
  }
  if (!strips.length || !width) return manifest;

  let totalH = 0;
  const resized: Buffer[] = [];
  for (const buf of strips) {
    const img = sharp(buf);
    const meta = await img.metadata();
    const h = meta.height ?? 1;
    totalH += h;
    resized.push(buf);
  }

  const composite: sharp.OverlayOptions[] = [];
  let top = 0;
  for (const buf of resized) {
    const meta = await sharp(buf).metadata();
    const h = meta.height ?? 1;
    composite.push({ input: buf, top, left: 0 });
    top += h;
  }

  const pagePng = await sharp({
    create: { width, height: totalH, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite(composite)
    .png()
    .toBuffer();

  const storageRoot = `dossiers/processed/${slug}/v${manifest.version}`;
  const sourcePageKey = `${storageRoot}/source-page.png`;
  await storage.put(sourcePageKey, pagePng, "image/png");
  return {
    ...manifest,
    sourcePageStorageKey: sourcePageKey,
    sourceWidth: width,
    sourceHeight: totalH,
  };
}

async function main() {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    console.error("Defina BLOB_READ_WRITE_TOKEN e POSTGRES_URL.");
    process.exit(1);
  }
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    console.error("POSTGRES_URL é obrigatório.");
    process.exit(1);
  }

  let manifest = readLocalManifest();
  const storage = await createDossierStorage();

  const pdfPath = path.join(process.cwd(), "private", "dossiers", "Dossie_Banfield.pdf");
  if (fs.existsSync(pdfPath)) {
    const pdf = fs.readFileSync(pdfPath);
    const key = `dossiers/inbox/${slug}-bootstrap.pdf`;
    await storage.put(key, pdf, "application/pdf");
    manifest.sourcePdfStorageKey = key;
  }

  for (const block of manifest.blocks) {
    for (const v of block.variants) {
      const local = path.join(process.cwd(), "private", v.storageKey);
      if (!fs.existsSync(local)) continue;
      const buf = fs.readFileSync(local);
      const ct = v.format === "webp" ? "image/webp" : "image/avif";
      await storage.put(v.storageKey, buf, ct);
    }
  }

  if (manifest.sourcePageStorageKey) {
    const localPage = path.join(process.cwd(), "private", manifest.sourcePageStorageKey);
    if (fs.existsSync(localPage)) {
      await storage.put(manifest.sourcePageStorageKey, fs.readFileSync(localPage), "image/png");
    }
  }

  manifest = await ensureSourcePage(manifest, storage);

  const ready: ProcessedDossierManifest = {
    ...manifest,
    status: "ready",
    publishedAt: new Date().toISOString().slice(0, 10),
  };
  await saveDraftManifest(slug, ready);
  await publishManifest(slug, ready);
  console.log("Banfield bootstrap concluído (storage + Postgres).");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
