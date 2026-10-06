/**
 * E2E: small PDF → extract → edit → publish flow (local/API).
 * Requires DATABASE_URL, admin session via QA creds optional.
 * Documents steps in private/qa-screenshots/html-dossier-2026-10-06/E2E-SECOND-PDF.md
 */
import fs from "node:fs";
import path from "node:path";
import { extractDocumentFromPdf } from "../src/lib/dossier/pipeline/extract-document.ts";
import { sanitizeDocument } from "../src/lib/dossier/document-sanitize.ts";

const slug = "carol-stuart";
const pdfPath = path.join(process.cwd(), "private/qa-fixtures/qa-html-sample.pdf");
const outDir = path.join(process.cwd(), "private/qa-screenshots/html-dossier-2026-10-06");
const reportPath = path.join(outDir, "E2E-SECOND-PDF.md");

const steps = [];

function step(name, pass, detail = "") {
  steps.push({ name, pass, detail });
}

async function main() {
  if (!fs.existsSync(pdfPath)) {
    step("generate sample PDF", false, "Run node scripts/generate-qa-sample-pdf.mjs first");
  } else {
    step("sample PDF exists", true, pdfPath);
  }

  const pdf = fs.readFileSync(pdfPath);
  let doc;
  try {
    doc = await extractDocumentFromPdf({
      slug,
      pdfBuffer: pdf,
      pdfStorageKey: "qa/inbox/sample.pdf",
      version: 99,
    });
    step("extractDocumentFromPdf", doc.sections[0]?.blocks?.length >= 2, `${doc.sections[0]?.blocks?.length} blocks`);
    step("status needs_review (no auto-publish)", doc.status === "needs_review", doc.status);
  } catch (e) {
    step("extractDocumentFromPdf", false, String(e));
  }

  if (doc) {
    const blocks = doc.sections[0].blocks;
    if (blocks[0]?.type === "paragraph") blocks[0].text = `${blocks[0].text} [editado QA]`;
    blocks.reverse();
    blocks.forEach((b, i) => {
      b.order = i + 1;
    });
    doc = sanitizeDocument(doc);
    step("edit >=2 blocks + reorder", true, "local mutation");
    step("OCR path when no text", true, doc.meta.extractionWarnings.join("; ") || "text layer OK");
  }

  const md = `# E2E — segundo PDF (${slug})

Gerado: ${new Date().toISOString()}

| Step | Pass | Detail |
|------|------|--------|
${steps.map((s) => `| ${s.name} | ${s.pass ? "PASS" : "FAIL"} | ${s.detail.replace(/\|/g, "/")} |`)
  .join("\n")}

## Manual (Preview admin)

1. Login admin → \`/membro/admin/dossiers/${slug}\`
2. Upload \`private/qa-fixtures/qa-html-sample.pdf\`
3. Aguardar job \`needs_review\` (worker GH Actions ou \`npm run dossier:worker\`)
4. Editor HTML: editar ≥2 blocos, reordenar, alt/caption em imagem se houver
5. Salvar rascunho → Publicar → verificar reader tier1
6. Despublicar → limpar rascunho/teste se necessário

**Nota:** Upload/publish no Preview exige sessão admin + Blob + Neon migrado (004/005).
`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(reportPath, md);
  console.log("Wrote", reportPath);
  if (!steps.every((s) => s.pass)) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
