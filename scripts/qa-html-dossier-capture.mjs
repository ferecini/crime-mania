/**
 * QA Preview: HTML semantic dossier + gallery (Banfield).
 * node scripts/qa-html-dossier-capture.mjs [baseUrl] [outDir]
 */
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const outDir =
  process.argv[3] ??
  path.join(process.cwd(), "private/qa-screenshots/html-dossier-2026-10-06");
const slug = "familia-banfield";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const viewports = [
  { w: 390, h: 844, tag: "390" },
  { w: 430, h: 932, tag: "430" },
  { w: 768, h: 1024, tag: "768" },
  { w: 1280, h: 900, tag: "1280" },
];

function readCreds() {
  const p = path.join(process.cwd(), "private", "qa-credentials.txt");
  const raw = fs.readFileSync(p, "utf8");
  const cfg = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^(qa-.+@.+?)=(.+)$/);
    if (m) cfg[m[1]] = m[2].trim();
  }
  return {
    free: { email: "qa-free@crime-mania.test", password: cfg["qa-free@crime-mania.test"] },
    tier1: { email: "qa-tier1@crime-mania.test", password: cfg["qa-tier1@crime-mania.test"] },
  };
}

async function waitForVisualReady(page, rootSelector) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.evaluate(async (sel) => {
        await document.fonts.ready;
        const root = sel ? document.querySelector(sel) : document.body;
        const scope = root ?? document.body;
        const imgs = [...scope.querySelectorAll("img")];
        await Promise.all(
          imgs.map(
            (img) =>
              new Promise((resolve) => {
                const done = () => resolve(undefined);
                if (img.complete && img.naturalWidth > 0) {
                  done();
                  return;
                }
                img.addEventListener("load", done, { once: true });
                img.addEventListener("error", done, { once: true });
                setTimeout(done, 8000);
              }),
          ),
        );
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }, rootSelector);
      return;
    } catch (err) {
      if (attempt === 2) throw err;
      await page.waitForTimeout(400);
    }
  }
}

async function scrollLazy(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await waitForVisualReady(page, selector);
}

async function loginViaApi(context, cred) {
  const res = await context.request.post(`${base}/api/auth/login`, {
    headers: {
      "Content-Type": "application/json",
      ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}),
    },
    data: { email: cred.email, password: cred.password },
  });
  if (!res.ok()) throw new Error(`login failed HTTP ${res.status()}`);
}

async function login(page, cred) {
  const ctx = page.context();
  if (bypass) {
    await ctx.setExtraHTTPHeaders({ "x-vercel-protection-bypass": bypass });
  }
  await loginViaApi(ctx, cred);
  await page.goto(`${base}/membro`, { waitUntil: "domcontentloaded" });
}

function shotPass(shot) {
  if (shot.pass === false) return false;
  const expectsDims = shot.expectDimensions !== false;
  if (!expectsDims) return shot.pass !== false;
  if (shot.naturalWidth != null && shot.naturalWidth <= 0) return false;
  if (shot.renderedWidth != null && shot.renderedWidth <= 0) return false;
  if (shot.renderedHeight != null && shot.renderedHeight <= 0) return false;
  return true;
}

function writeReport(report) {
  for (const s of report.shots) {
    s.pass = shotPass(s);
  }
  const allPass =
    report.criteria.every((c) => c.pass) &&
    report.shots.every((s) => s.pass);
  report.overallPass = allPass;
  const md = `# QA — HTML Dossier (Banfield) — ${report.capturedAt.slice(0, 10)}

Base: ${base}

## Environment note

Preview URLs (\`*.vercel.app\`) exigem \`VERCEL_AUTOMATION_BYPASS_SECRET\` para automação (SSO). Esta execução usou **${base}** com \`DATABASE_URL\` de Preview (.env.local) quando localhost.

## Migration 004 (Preview)

Migration \`004_dossier_documents.sql\` must be applied on the Preview Neon branch DB. Document/gallery APIs returning 200 with tier1 + published HTML indicate migration/bootstrap OK. Re-run \`npm run dossier:document-migrate\` on Preview if document 503/404.

## Pass/fail

| Criterion | Result |
|-----------|--------|
${report.criteria.map((c) => `| ${c.name} | ${c.pass ? "PASS" : "FAIL"} |`).join("\n")}
| **Overall** | **${allPass ? "PASS" : "FAIL"}** |

## API (tier1)

| Field | Value |
|-------|------:|
| document status | ${report.api.tier1DocumentStatus ?? "—"} |
| gallery status | ${report.api.tier1GalleryStatus ?? "—"} |
| sections | ${report.api.sectionCount ?? "—"} |
| blocks | ${report.api.blockCount ?? "—"} |
| gallery items | ${report.api.galleryItemCount ?? "—"} |
| free document | ${report.api.freeDocumentStatus ?? "—"} (expect 403) |
| free gallery | ${report.api.freeGalleryStatus ?? "—"} (expect 403) |

## Screenshots (\`${outDir}\`)

| File | viewport | naturalW | renderedW | Pass |
|------|----------|----------|-----------|------|
${report.shots
  .map(
    (s) =>
      `| ${s.file} | ${s.viewport ?? "—"} | ${s.naturalWidth ?? "—"} | ${s.renderedWidth ?? "—"} | ${s.pass ? "PASS" : "FAIL"} |`,
  )
  .join("\n")}

## JSON

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;
  fs.writeFileSync(path.join(outDir, "QA-REPORT.md"), md);
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  return allPass;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const creds = readCreds();
  const report = {
    base,
    capturedAt: new Date().toISOString(),
    criteria: [],
    shots: [],
    api: {},
  };

  if (base.includes("vercel.app") && !bypass) {
    console.warn(
      "WARN: Preview protegido (Vercel SSO). Defina VERCEL_AUTOMATION_BYPASS_SECRET ou use localhost com DATABASE_URL de Preview.",
    );
  }

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "chrome",
  });

  // Free tier: document + gallery 403
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    await login(page, creds.free);
    const docRes = await page.request.get(`${base}/api/dossier/${slug}/document`);
    const galRes = await page.request.get(`${base}/api/dossier/${slug}/gallery/manifest`);
    report.api.freeDocumentStatus = docRes.status();
    report.api.freeGalleryStatus = galRes.status();
    report.criteria.push({
      name: "free document API 403",
      pass: docRes.status() === 403,
    });
    report.criteria.push({
      name: "free gallery API 403",
      pass: galRes.status() === 403,
    });
    await ctx.close();
  }

  // Tier1 full QA
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await login(page, creds.tier1);

  const docRes = await page.request.get(`${base}/api/dossier/${slug}/document`);
  const galRes = await page.request.get(`${base}/api/dossier/${slug}/gallery/manifest`);
  const docJson = docRes.ok() ? await docRes.json() : null;
  const galJson = galRes.ok() ? await galRes.json() : null;
  const sectionCount = docJson?.sections?.length ?? 0;
  const blockCount =
    docJson?.sections?.reduce((n, s) => n + (s.blocks?.length ?? 0), 0) ?? 0;
  const galleryCount = galJson?.items?.length ?? 0;

  report.api.tier1DocumentStatus = docRes.status();
  report.api.tier1GalleryStatus = galRes.status();
  report.api.sectionCount = sectionCount;
  report.api.blockCount = blockCount;
  report.api.galleryItemCount = galleryCount;

  report.criteria.push({ name: "tier1 document 200", pass: docRes.status() === 200 });
  report.criteria.push({ name: "tier1 gallery 200", pass: galRes.status() === 200 });
  report.criteria.push({ name: "document sections >= 5", pass: sectionCount >= 5 });
  report.criteria.push({ name: "gallery items === 5", pass: galleryCount === 5 });

  const dossierUrl = `${base}/membro/dossies/${slug}`;
  await page.goto(dossierUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".dossier-html-reader p", { timeout: 45000 });
  await waitForVisualReady(page, "article");

  const readerChecks = await page.evaluate(() => {
    const htmlReader = document.querySelector(".dossier-html-reader");
    const cropBlocks = document.querySelectorAll('[id^="dossier-block-"]');
    const paragraphs = htmlReader?.querySelectorAll("p") ?? [];
    let selectable = false;
    if (paragraphs.length) {
      const range = document.createRange();
      range.selectNodeContents(paragraphs[0]);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      selectable = (sel?.toString()?.length ?? 0) > 20;
      sel?.removeAllRanges();
    }
    return {
      hasHtmlReader: Boolean(htmlReader),
      cropBlockCount: cropBlocks.length,
      paragraphCount: paragraphs.length,
      textSelectable: selectable,
    };
  });

  report.criteria.push({
    name: "SemanticDossierReader (.dossier-html-reader)",
    pass: readerChecks.hasHtmlReader,
  });
  report.criteria.push({
    name: "no legacy crop strips",
    pass: readerChecks.cropBlockCount === 0,
  });
  report.criteria.push({
    name: "HTML text selectable",
    pass: readerChecks.textSelectable,
  });

  for (const vp of viewports) {
    console.log("viewport", vp.tag);
    await page.setViewportSize({ width: vp.w, height: vp.h });
    try {
      await page.goto(dossierUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    } catch {
      await page.reload({ waitUntil: "domcontentloaded", timeout: 60000 });
    }
    await page.waitForSelector(".dossier-html-reader p", { timeout: 45000 });
    await waitForVisualReady(page, "article");
    const noHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    );
    report.criteria.push({
      name: `no horizontal scroll ${vp.tag}`,
      pass: noHScroll,
    });

    const gallerySel = 'section[aria-label="Galeria do caso"]';
    await scrollLazy(page, gallerySel);
    const galleryMetrics = await page.evaluate((sel) => {
      const section = document.querySelector(sel);
      const img = section?.querySelector("img");
      if (!img) return null;
      const r = img.getBoundingClientRect();
      return {
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        renderedWidth: Math.round(r.width),
        renderedHeight: Math.round(r.height),
      };
    }, gallerySel);

    const readerPath = path.join(outDir, `reader-${vp.tag}.png`);
    await page.screenshot({ path: readerPath, fullPage: false });
    const contentCol = await page.evaluate(() => {
      const main = document.querySelector("main.cm-container, main");
      return main ? Math.round(main.getBoundingClientRect().width) : 0;
    });

    report.shots.push({
      file: path.basename(readerPath),
      viewport: vp.tag,
      contentColumnWidth: contentCol,
      ...galleryMetrics,
      pass: false,
    });

    if (vp.w >= 1280 && galleryMetrics) {
      const minW = contentCol > 0 ? contentCol * 0.7 : vp.w * 0.55;
      report.criteria.push({
        name: "gallery desktop main >=70% content column",
        pass: galleryMetrics.renderedWidth >= minW && galleryMetrics.renderedWidth > 0,
        detail: { renderedWidth: galleryMetrics.renderedWidth, minW, contentCol },
      });
    }

    if (vp.w <= 767) {
      const widthRatio = galleryMetrics ? galleryMetrics.renderedWidth / vp.w : 0;
      report.criteria.push({
        name: `gallery image large mobile ${vp.tag} (>=85% vw)`,
        pass: Boolean(galleryMetrics && widthRatio >= 0.85),
      });
      await page.locator(`${gallerySel} .relative.md\\:hidden button`).first().click();
      await page.waitForSelector('[role="dialog"][aria-label="Visualização ampliada"]', {
        timeout: 10000,
      });
      await waitForVisualReady(page, '[role="dialog"]');
      const lbPath = path.join(outDir, `lightbox-${vp.tag}.png`);
      await page.screenshot({ path: lbPath, fullPage: false });
      const lb = await page.evaluate(() => {
        const img = document.querySelector('[role="dialog"] img');
        if (!img) return null;
        const r = img.getBoundingClientRect();
        return {
          naturalWidth: img.naturalWidth,
          renderedWidth: Math.round(r.width),
          renderedHeight: Math.round(r.height),
        };
      });
      report.shots.push({
        file: path.basename(lbPath),
        viewport: vp.tag,
        ...lb,
        pass: false,
      });
      await page.keyboard.press("Escape");
    }
  }

  await browser.close();

  const allPass = writeReport(report);
  console.log("QA report:", path.join(outDir, "QA-REPORT.md"));
  console.log("overall:", allPass ? "PASS" : "FAIL");
  if (!allPass) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
