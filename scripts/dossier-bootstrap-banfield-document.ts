/**
 * Publica documento HTML editorial Banfield + assets no Blob/Postgres.
 * npx tsx scripts/dossier-bootstrap-banfield-document.ts
 */
import fs from "node:fs";
import path from "node:path";
import {
  publishDocument,
  upsertDocumentAsset,
} from "../src/lib/dossier/document-db";
import { importCaseForm } from "../src/lib/dossier/case-form";
import { sanitizeDocument } from "../src/lib/dossier/document-sanitize";
import { writeDocumentFile } from "../src/lib/dossier/document-store";
import { createDossierStorage } from "../src/lib/dossier/storage";
import type { DossierDocument } from "../src/lib/dossier/document-types";

const slug = "familia-banfield";

const ASSETS: { id: string; localRel: string; alt: string }[] = [
  {
    id: "fig-portrait-christine",
    localRel: "private/dossiers/documents/familia-banfield/assets/fig-portrait-christine.webp",
    alt: "Christine Banfield.",
  },
  {
    id: "fig-portrait-joseph",
    localRel: "private/dossiers/documents/familia-banfield/assets/fig-portrait-joseph.webp",
    alt: "Joseph Ryan.",
  },
  {
    id: "fig-portrait-brendan",
    localRel: "private/dossiers/documents/familia-banfield/assets/fig-portrait-brendan.webp",
    alt: "Brendan Banfield.",
  },
  {
    id: "fig-portrait-juliana",
    localRel: "private/dossiers/documents/familia-banfield/assets/fig-portrait-juliana.webp",
    alt: "Juliana Magalhães.",
  },
  {
    id: "fig-mapa",
    localRel: "private/dossiers/documents/familia-banfield/assets/fig-mapa.webp",
    alt: "Mapa de Fairfax, Virgínia e Washington D.C.",
  },
];

function loadDocument(): DossierDocument {
  const p = path.join(process.cwd(), "scripts", "data", "familia-banfield-document.json");
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as DossierDocument;
  const caseForm = importCaseForm(raw);
  const next: DossierDocument = {
    ...raw,
    version: (raw.version ?? 0) + 1,
    caseForm,
  };
  return sanitizeDocument(next);
}

async function main() {
  const doc = loadDocument();
  writeDocumentFile(slug, doc);

  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const hasPg = Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);

  if (!hasPg) {
    console.log("POSTGRES_URL ausente — documento salvo em private/dossiers/documents apenas.");
    return;
  }

  const storage = hasBlob ? await createDossierStorage() : null;
  const root = `dossiers/documents/${slug}/v${doc.version}`;

  for (const asset of ASSETS) {
    const localPath = path.join(process.cwd(), asset.localRel);
    if (!fs.existsSync(localPath)) {
      console.warn("Asset local ausente:", asset.localRel);
      continue;
    }
    const bytes = fs.readFileSync(localPath);
    const storageKey = `${root}/assets/${asset.id}.webp`;
    if (storage) {
      await storage.put(storageKey, bytes, "image/webp");
    }
    await upsertDocumentAsset({
      id: asset.id,
      slug,
      storageKey,
      mimeType: "image/webp",
      byteSize: bytes.length,
      altText: asset.alt,
    });
  }

  await publishDocument(slug, doc, "html");
  console.log("Banfield HTML publicado (format=html).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
