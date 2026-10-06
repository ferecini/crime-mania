/**
 * Compare Banfield PDF text layer vs published HTML document.
 * node scripts/dossier-banfield-pdf-html-compare.mjs [pdfPath] [outJson]
 */
import fs from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const slug = "familia-banfield";
const pdfPath =
  process.argv[2] ??
  path.join(process.cwd(), "private", "dossiers", "Dossie_Banfield.pdf");
const outPath =
  process.argv[3] ??
  path.join(process.cwd(), "private/qa-screenshots/html-dossier-2026-10-06/banfield-pdf-html-compare.json");

async function pdfPlainText(pdfBuf) {
  const doc = await getDocument({ data: new Uint8Array(pdfBuf), useSystemFonts: true }).promise;
  const parts = [];
  for (let p = 1; p <= doc.numPages; p += 1) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    for (const item of tc.items) {
      if ("str" in item && item.str.trim()) parts.push(item.str.trim());
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function htmlPlainText(docJson) {
  const parts = [];
  for (const section of docJson.sections ?? []) {
    if (section.title) parts.push(section.title);
    for (const block of section.blocks ?? []) {
      if (block.text) parts.push(block.text);
      if (block.type === "list") parts.push(...(block.items ?? []));
      if (block.type === "timeline") {
        for (const e of block.entries ?? []) {
          parts.push(e.date, e.title, e.body);
        }
      }
      if (block.caption) parts.push(block.caption);
    }
  }
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function normalize(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9áéíóúãõç\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSet(s) {
  return new Set(normalize(s).split(" ").filter((w) => w.length > 3));
}

async function main() {
  if (!fs.existsSync(pdfPath)) {
    console.error("PDF não encontrado:", pdfPath);
    process.exit(1);
  }
  const docJsonPath = path.join(process.cwd(), "private/dossiers/documents/familia-banfield/document.json");
  const published = JSON.parse(fs.readFileSync(docJsonPath, "utf8"));

  const pdfBuf = fs.readFileSync(pdfPath);
  const pdfText = await pdfPlainText(pdfBuf);
  const htmlText = htmlPlainText(published);

  const pdfTokens = tokenSet(pdfText);
  const htmlTokens = tokenSet(htmlText);
  const inHtmlNotPdf = [...htmlTokens].filter((t) => !pdfTokens.has(t)).slice(0, 40);
  const inPdfNotHtml = [...pdfTokens].filter((t) => !htmlTokens.has(t)).slice(0, 40);

  const imageBlocks = [];
  for (const s of published.sections ?? []) {
    for (const b of s.blocks ?? []) {
      if (b.type === "image" || b.type === "figure") {
        imageBlocks.push({ section: s.id, assetId: b.assetId, alt: b.alt });
      }
    }
  }

  const report = {
    slug,
    generatedAt: new Date().toISOString(),
    pdfPath,
    pdfCharCount: pdfText.length,
    htmlCharCount: htmlText.length,
    pdfPageCount: (await getDocument({ data: new Uint8Array(pdfBuf), useSystemFonts: true }).promise)
      .numPages,
    htmlSectionCount: published.sections?.length ?? 0,
    htmlBlockCount: published.sections?.reduce((n, s) => n + (s.blocks?.length ?? 0), 0) ?? 0,
    htmlImageBlocks: imageBlocks,
    coverageRatio: htmlTokens.size ? [...htmlTokens].filter((t) => pdfTokens.has(t)).length / htmlTokens.size : 0,
    sampleOmittedFromHtml: inPdfNotHtml,
    sampleEditorialOnlyInHtml: inHtmlNotPdf,
    note:
      "Banfield HTML é bootstrap editorial (não extração 1:1 do PDF). Este relatório mede sobreposição lexical PDF×HTML.",
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  const mdPath = outPath.replace(/\.json$/, ".md");
  fs.writeFileSync(
    mdPath,
    `# Banfield PDF vs HTML

- PDF chars: ${report.pdfCharCount}
- HTML chars: ${report.htmlCharCount}
- PDF pages: ${report.pdfPageCount}
- HTML sections/blocks: ${report.htmlSectionCount} / ${report.htmlBlockCount}
- Token overlap (HTML in PDF): ${(report.coverageRatio * 100).toFixed(1)}%
- Extracted/editorial images: ${report.htmlImageBlocks.length}

Ver \`${path.basename(outPath)}\` para amostras omitidas vs editorial.
`,
  );
  console.log("Wrote", outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
