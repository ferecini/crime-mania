import fs from "node:fs";
import path from "node:path";
import type { DossierDocument, DossierPublishedFormat } from "@/lib/dossier/document-types";
import { readPublishedDocument, readPublishedFormat, readDraftDocument } from "@/lib/dossier/document-db";

const DOCUMENT_ROOT = path.join(process.cwd(), "private", "dossiers", "documents");

function hasPostgres(): boolean {
  return Boolean(process.env.POSTGRES_URL ?? process.env.DATABASE_URL);
}

function documentPath(slug: string): string {
  return path.join(DOCUMENT_ROOT, slug, "document.json");
}

function readDocumentFile(slug: string): DossierDocument | null {
  try {
    const raw = fs.readFileSync(documentPath(slug), "utf8");
    return JSON.parse(raw) as DossierDocument;
  } catch {
    return null;
  }
}

export async function readMemberDocument(slug: string): Promise<DossierDocument | null> {
  if (hasPostgres()) {
    try {
      const pub = await readPublishedDocument(slug);
      if (pub) return pub;
    } catch {
      /* dev fallback */
    }
  }
  const file = readDocumentFile(slug);
  if (file?.status === "ready") return file;
  return null;
}

export async function readAdminDocument(slug: string): Promise<DossierDocument | null> {
  if (hasPostgres()) {
    try {
      const draft = await readDraftDocument(slug);
      if (draft) return draft;
      return await readPublishedDocument(slug);
    } catch {
      /* file fallback */
    }
  }
  return readDocumentFile(slug);
}

export async function resolvePublishedFormat(slug: string): Promise<DossierPublishedFormat> {
  if (hasPostgres()) {
    try {
      const fmt = await readPublishedFormat(slug);
      if (fmt) return fmt;
    } catch {
      /* fallback */
    }
  }
  const file = readDocumentFile(slug);
  if (file?.status === "ready") return "html";
  return "legacy";
}

export function writeDocumentFile(slug: string, doc: DossierDocument): void {
  const dir = path.dirname(documentPath(slug));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(documentPath(slug), `${JSON.stringify(doc, null, 2)}\n`, { mode: 0o600 });
}
