/**
 * Captura QA honesta do dossiê Banfield (mobile + desktop).
 * Uso: node scripts/qa-mobile-dossier-capture.mjs [baseUrl]
 * Requer: npx playwright (instala Chromium na primeira execução).
 */
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const slug = "familia-banfield";
const outDir =
  process.argv[3] ??
  path.join(process.cwd(), "private/qa-screenshots/mobile-fix-2026-10-06-v2");

function readCreds() {
  const p = path.join(process.cwd(), "private", "qa-credentials.txt");
  const raw = fs.readFileSync(p, "utf8");
  const cfg = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^(qa-.+@.+?)=(.+)$/);
    if (m) cfg[m[1]] = m[2].trim();
  }
  return {
    tier1: { email: "qa-tier1@crime-mania.test", password: cfg["qa-tier1@crime-mania.test"] },
  };
}

async function waitForVisualReady(page, rootSelector) {
  await page.evaluate(async (sel) => {
    await document.fonts.ready;
    const root = sel ? document.querySelector(sel) : document.body;
    const scope = root ?? document.body;
    const imgs = [...scope.querySelectorAll("img")];
    await Promise.all(
      imgs.map(
        (img) =>
          new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve(undefined);
              return;
            }
            img.addEventListener("load", () => resolve(undefined), { once: true });
            img.addEventListener("error", () => resolve(undefined), { once: true });
          }),
      ),
    );
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, rootSelector);
}

async function scrollSectionReady(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await waitForVisualReady(page, selector);
}

async function imgMetrics(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el || !(el instanceof HTMLImageElement)) return null;
    const r = el.getBoundingClientRect();
    return {
      naturalWidth: el.naturalWidth,
      naturalHeight: el.naturalHeight,
      renderedWidth: Math.round(r.width),
      renderedHeight: Math.round(r.height),
    };
  }, selector);
}

async function assertNoHorizontalScroll(page) {
  return page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  );
}

async function main() {
  const { chromium } = await import("playwright");
  fs.mkdirSync(outDir, { recursive: true });
  const creds = readCreds();
  const report = {
    base,
    capturedAt: new Date().toISOString(),
    shots: [],
    criteria: [],
  };

  const browser = await chromium.launch({
    headless: true,
    channel: process.env.PW_CHANNEL ?? "chrome",
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  const loginRes = await context.request.post(`${base}/api/auth/login`, {
    data: { email: creds.tier1.email, password: creds.tier1.password },
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok() || loginBody.ok !== true) {
    throw new Error(`login failed HTTP ${loginRes.status()} ${JSON.stringify(loginBody)}`);
  }

  const dossierUrl = `${base}/membro/dossies/${slug}`;
  await page.goto(dossierUrl, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#dossier-block-m01-capa", { timeout: 120000 });
  await waitForVisualReady(page, "article");

  const noScroll390 = await assertNoHorizontalScroll(page);
  report.criteria.push({
    name: "no horizontal scroll 390",
    pass: noScroll390,
  });

  const firstBlock = "#dossier-block-m01-capa";
  await scrollSectionReady(page, firstBlock);
  const topMetrics = await imgMetrics(page, `${firstBlock} img`);
  const topPath = path.join(outDir, "reader-mobile-390-top.png");
  await page.screenshot({ path: topPath, fullPage: false });
  report.shots.push({
    file: path.basename(topPath),
    ...topMetrics,
    pass: Boolean(topMetrics && topMetrics.naturalWidth > 0 && topMetrics.renderedWidth > 200),
  });

  const victims = "#dossier-block-m02-fotos-vitimas";
  await scrollSectionReady(page, victims);
  const victimsPath = path.join(outDir, "reader-mobile-390-block2.png");
  await page.screenshot({ path: victimsPath, fullPage: false });
  const victimsMetrics = await imgMetrics(page, `${victims} img`);
  report.shots.push({
    file: path.basename(victimsPath),
    ...victimsMetrics,
    pass: Boolean(victimsMetrics && victimsMetrics.naturalWidth > 0),
  });

  const timelineTitle = "#dossier-block-m05b-timeline-titulo";
  await scrollSectionReady(page, timelineTitle);
  const timelinePath = path.join(outDir, "reader-mobile-390-timeline.png");
  await page.screenshot({ path: timelinePath, fullPage: false });
  const timelineMetrics = await imgMetrics(page, `${timelineTitle} img`);
  report.shots.push({
    file: path.basename(timelinePath),
    ...timelineMetrics,
    pass: Boolean(timelineMetrics && timelineMetrics.naturalWidth > 0),
  });

  const gallerySection = 'section[aria-label="Galeria do caso"]';
  await scrollSectionReady(page, gallerySection);
  const galleryImgSel = `${gallerySection} img`;
  const galleryMetrics = await imgMetrics(page, galleryImgSel);
  const galleryPath = path.join(outDir, "gallery-mobile-390.png");
  await page.screenshot({ path: galleryPath, fullPage: false });
  const galleryWidthRatio =
    galleryMetrics && galleryMetrics.renderedWidth
      ? galleryMetrics.renderedWidth / 390
      : 0;
  report.shots.push({
    file: path.basename(galleryPath),
    ...galleryMetrics,
    widthRatioVsViewport: galleryWidthRatio,
    pass: Boolean(galleryMetrics && galleryMetrics.naturalWidth > 0 && galleryWidthRatio >= 0.85),
  });

  await page.locator(`${gallerySection} img`).first().click();
  await page.waitForSelector('[role="dialog"][aria-label="Visualização ampliada"]', {
    timeout: 10000,
  });
  await waitForVisualReady(page, '[role="dialog"]');
  const lightboxPath = path.join(outDir, "lightbox-mobile-390.png");
  await page.screenshot({ path: lightboxPath, fullPage: false });
  const lbMetrics = await imgMetrics(page, '[role="dialog"] img');
  report.shots.push({
    file: path.basename(lightboxPath),
    ...lbMetrics,
    pass: Boolean(lbMetrics && lbMetrics.naturalWidth > 0 && lbMetrics.renderedWidth > 100),
  });
  await page.keyboard.press("Escape");

  await context.close();
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  const loginRes2 = await desktopContext.request.post(`${base}/api/auth/login`, {
    data: { email: creds.tier1.email, password: creds.tier1.password },
  });
  if (!loginRes2.ok()) {
    throw new Error(`desktop login failed HTTP ${loginRes2.status()}`);
  }
  await desktopPage.goto(dossierUrl, { waitUntil: "networkidle" });
  await waitForVisualReady(desktopPage, "article");
  for (const id of ["d01-capa", "d02-resumo-caso", "d03-mapa"]) {
    await scrollSectionReady(desktopPage, `#dossier-block-${id}`);
  }
  const desktopPath = path.join(outDir, "reader-desktop-1280.png");
  await desktopPage.screenshot({ path: desktopPath, fullPage: false });
  const d1 = await imgMetrics(desktopPage, "#dossier-block-d01-capa img");
  const d2 = await imgMetrics(desktopPage, "#dossier-block-d02-resumo-caso img");
  report.shots.push({
    file: path.basename(desktopPath),
    blocks: { d01: d1, d02: d2 },
    pass: Boolean(d1?.naturalWidth && d2?.naturalWidth),
  });

  const manifestRes = await desktopPage.request.get(`${base}/api/dossier/${slug}/manifest`);
  const manifest = await manifestRes.json();
  const mobileBlocks = (manifest.blocks ?? []).filter((b) => b.viewport === "mobile");
  const desktopBlocks = (manifest.blocks ?? []).filter((b) => b.viewport === "desktop");

  async function buildContactSheet(blocks, prefix, cols) {
    const thumbW = 120;
    const rows = Math.ceil(blocks.length / cols);
    const thumbH = 160;
    const sheetW = cols * thumbW;
    const sheetH = rows * thumbH;
    const html = `<!DOCTYPE html><html><body style="margin:0;background:#111;display:grid;grid-template-columns:repeat(${cols},${thumbW}px);width:${sheetW}px">` +
      blocks
        .map(
          (b) =>
            `<div style="width:${thumbW}px;height:${thumbH}px;padding:4px;box-sizing:border-box"><img src="${base}/api/dossier/${slug}/blocks/${b.id}?w=240&fmt=webp" style="width:100%;height:100%;object-fit:contain;background:#222"/><p style="color:#aaa;font:10px sans-serif;margin:2px 0">${b.id}</p></div>`,
        )
        .join("") +
      "</body></html>";
    const sheetPage = await desktopContext.newPage();
    await sheetPage.setContent(html, { waitUntil: "domcontentloaded" });
    await sheetPage.evaluate(async () => {
      await document.fonts.ready;
      const imgs = [...document.images];
      await Promise.race([
        Promise.all(
          imgs.map(
            (img) =>
              new Promise((r) => {
                if (img.complete && img.naturalWidth > 0) return r(undefined);
                img.onload = () => r(undefined);
                img.onerror = () => r(undefined);
              }),
          ),
        ),
        new Promise((r) => setTimeout(r, 45000)),
      ]);
    });
    const p = path.join(outDir, prefix);
    await sheetPage.screenshot({ path: p, fullPage: true });
    await sheetPage.close();
    report.shots.push({ file: path.basename(p), pass: true, blockCount: blocks.length });
  }

  await buildContactSheet(mobileBlocks, "contact-mobile-crops.png", 7);
  await buildContactSheet(desktopBlocks, "contact-desktop-crops.png", 6);

  await browser.close();

  const allPass = report.shots.every((s) => s.pass !== false) && report.criteria.every((c) => c.pass);
  report.overallPass = allPass;

  const md = `# Mobile dossier QA v2 — ${report.capturedAt.slice(0, 10)}

Base: ${base}

## Pass/fail

| Criterion | Result |
|-----------|--------|
${report.criteria.map((c) => `| ${c.name} | ${c.pass ? "PASS" : "FAIL"} |`).join("\n")}
| Overall screenshots | ${allPass ? "PASS" : "FAIL"} |

## Screenshots

| File | naturalW×H | renderedW×H | Pass |
|------|------------|-------------|------|
${report.shots
  .map((s) => {
    const nw = s.naturalWidth ?? "—";
    const nh = s.naturalHeight ?? "—";
    const rw = s.renderedWidth ?? "—";
    const rh = s.renderedHeight ?? "—";
    return `| ${s.file} | ${nw}×${nh} | ${rw}×${rh} | ${s.pass ? "PASS" : "FAIL"} |`;
  })
  .join("\n")}

## JSON

\`\`\`json
${JSON.stringify(report, null, 2)}
\`\`\`
`;

  fs.writeFileSync(path.join(outDir, "QA-REPORT.md"), md);
  fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  console.log("QA report:", path.join(outDir, "QA-REPORT.md"));
  console.log("overall:", allPass ? "PASS" : "FAIL");
  if (!allPass) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
