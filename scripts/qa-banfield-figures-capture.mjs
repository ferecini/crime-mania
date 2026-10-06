/**
 * QA visual: figuras HTML Banfield (390/430/768/1280 + lightbox mapa).
 * node scripts/qa-banfield-figures-capture.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const base = process.argv[2] ?? process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "private/qa-screenshots/banfield-figures-fix-2026-10-06",
);
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
  return { email: "qa-tier1@crime-mania.test", password: cfg["qa-tier1@crime-mania.test"] };
}

async function writeAssetManifest() {
  const assetsDir = path.join(
    process.cwd(),
    "private/dossiers/documents/familia-banfield/assets",
  );
  const manifest = {};
  for (const id of ["fig-vitimas", "fig-mapa"]) {
    const p = path.join(assetsDir, `${id}.webp`);
    const buf = fs.readFileSync(p);
    const meta = await sharp(p).metadata();
    manifest[id] = {
      width: meta.width,
      height: meta.height,
      aspect: Number(((meta.width ?? 1) / (meta.height ?? 1)).toFixed(3)),
      bytes: buf.length,
      sha256: crypto.createHash("sha256").update(buf).digest("hex"),
    };
  }
  fs.writeFileSync(path.join(outDir, "ASSET-MANIFEST.json"), JSON.stringify(manifest, null, 2));
  return manifest;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = await writeAssetManifest();

  const { chromium } = await import("playwright");
  const cred = readCreds();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    extraHTTPHeaders: bypass ? { "x-vercel-protection-bypass": bypass } : {},
  });

  const login = await context.request.post(`${base}/api/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: cred.email, password: cred.password },
  });
  if (!login.ok()) throw new Error(`login failed ${login.status()}`);

  const page = await context.newPage();
  const dossierUrl = `${base}/dossiers/${slug}`;

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto(dossierUrl, { waitUntil: "networkidle" });
    await page.waitForSelector(".dossier-html-reader img", { timeout: 20000 });
    await page.locator(".dossier-html-reader img").first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);
    await page.screenshot({
      path: path.join(outDir, `reader-${vp.tag}.png`),
      fullPage: true,
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(dossierUrl, { waitUntil: "networkidle" });
  const mapBtn = page.locator('.dossier-html-reader button[aria-label*="Mapa"], .dossier-html-reader button[aria-label*="Fairfax"]').first();
  await mapBtn.scrollIntoViewIfNeeded();
  await mapBtn.click();
  await page.waitForSelector('[role="dialog"] img', { timeout: 10000 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outDir, "lightbox-map-390.png") });

  await browser.close();

  fs.writeFileSync(
    path.join(outDir, "QA-REPORT.md"),
    `# Banfield figures fix QA\n\n- Base URL: ${base}\n- Assets: ${JSON.stringify(manifest, null, 2)}\n- Screenshots: reader-390/430/768/1280, lightbox-map-390\n`,
  );
  console.log("QA capture OK:", outDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
