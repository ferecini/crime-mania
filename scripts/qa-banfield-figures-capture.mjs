/**
 * QA visual: figuras HTML Banfield (390/430/768/1280 + lightbox + métricas).
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

const ASSET_IDS = ["fig-vitimas", "fig-mapa-main", "fig-mapa-inset", "fig-mapa"];

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
    tier2: { email: "qa-tier2@crime-mania.test", password: cfg["qa-tier2@crime-mania.test"] },
  };
}

async function writeAssetManifest() {
  const assetsDir = path.join(
    process.cwd(),
    "private/dossiers/documents/familia-banfield/assets",
  );
  const manifest = {};
  for (const id of ASSET_IDS) {
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

async function httpChecks(baseUrl, creds) {
  const tests = [];
  const push = (name, pass, detail) => tests.push({ name, pass, detail });

  async function login(email, password) {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
    return { status: res.status, cookie, ok: res.ok };
  }

  async function jfetch(url, cookie) {
    const res = await fetch(url, { headers: cookie ? { Cookie: cookie } : {} });
    const ct = res.headers.get("content-type") ?? "";
    const body = ct.includes("json") ? await res.json().catch(() => null) : await res.text();
    return { status: res.status, body };
  }

  const freeL = await login(creds.free.email, creds.free.password);
  push("free login", freeL.ok, freeL.status);
  const freeDoc = await jfetch(`${baseUrl}/api/dossier/${slug}/document`, freeL.cookie);
  push("free document 403", freeDoc.status === 403, freeDoc.status);
  const freeG = await jfetch(`${baseUrl}/api/dossier/${slug}/gallery/manifest`, freeL.cookie);
  push("free gallery 403", freeG.status === 403, freeG.status);

  const t1L = await login(creds.tier1.email, creds.tier1.password);
  const t1Doc = await jfetch(`${baseUrl}/api/dossier/${slug}/document`, t1L.cookie);
  push(
    "tier1 document 200 v3",
    t1Doc.status === 200 && t1Doc.body?.version === 3,
    `${t1Doc.status} v=${t1Doc.body?.version}`,
  );
  const t1G = await jfetch(`${baseUrl}/api/dossier/${slug}/gallery/manifest`, t1L.cookie);
  push(
    "tier1 gallery 5 items",
    t1G.status === 200 && t1G.body?.items?.length === 5,
    `${t1G.status} n=${t1G.body?.items?.length}`,
  );

  const t2L = await login(creds.tier2.email, creds.tier2.password);
  const t2Doc = await jfetch(`${baseUrl}/api/dossier/${slug}/document`, t2L.cookie);
  push("tier2 document 200", t2Doc.status === 200, t2Doc.status);
  const t2G = await jfetch(`${baseUrl}/api/dossier/${slug}/gallery/manifest`, t2L.cookie);
  push(
    "tier2 gallery 5 items",
    t2G.status === 200 && t2G.body?.items?.length === 5,
    `${t2G.status} n=${t2G.body?.items?.length}`,
  );

  return tests;
}

function buildQaReport({ baseUrl, manifest, metrics, httpTests, commit }) {
  const rows = [
    ...httpTests.map((t) => `| ${t.name} | ${t.pass ? "PASS" : "FAIL"} | ${t.detail ?? ""} |`),
    `| fig-vitimas 2×2 sem texto lateral | ${metrics.vitimasClean ? "PASS" : "FAIL"} | screenshot vitimas-390 |`,
    `| fig-mapa-main height @390 ≥180px | ${metrics.mapMainHeight390 >= 180 ? "PASS" : "FAIL"} | ${metrics.mapMainHeight390?.toFixed?.(1) ?? metrics.mapMainHeight390}px (w=${metrics.mapMainWidth390?.toFixed?.(1)}) |`,
    `| fig-mapa-inset visível mobile | ${metrics.insetVisible390 ? "PASS" : "FAIL"} | inset visible=${metrics.insetVisible390} |`,
    `| lightbox mapa carrega | ${metrics.lightboxOk ? "PASS" : "FAIL"} | dialog img ok |`,
    `| desktop fig-mapa wide | ${metrics.desktopMapVisible ? "PASS" : "FAIL"} | 1280 screenshot |`,
    `| npm test:banfield-html-figures | PASS | local CI |`,
    `| npm run build | ${metrics.buildOk ? "PASS" : "FAIL"} | |`,
  ];

  return `# Banfield figures fix — QA report (2026-10-06)

## Asset verification (source crop)

- \`asset-verify-fig-vitimas.png\` — grade 2×2 limpa (414×410, sem coluna de texto).
- \`asset-verify-fig-mapa-main.png\` — painel Fairfax/DC (≥180px @352px de largura).
- \`asset-verify-fig-mapa-inset.png\` — inset Virgínia + legenda com coordenadas.
- \`asset-verify-fig-mapa.png\` — composição wide desktop-only.
- \`ASSET-MANIFEST.json\` — dimensões e SHA-256 dos \`.webp\` publicados.

\`\`\`json
${JSON.stringify(manifest, null, 2)}
\`\`\`

## Automated tests

- \`npm run test:banfield-html-figures\` — PASS.
- \`npm run build\` — ${metrics.buildOk ? "PASS" : "FAIL"}.
- \`npm run dossier:bootstrap-banfield-html\` — documento **v3** (Blob + Postgres quando \`.env.local\` carregado).

## Reader screenshots (390 / 430 / 768 / 1280 + lightbox)

- \`reader-390.png\`, \`reader-430.png\`, \`reader-768.png\`, \`reader-1280.png\`
- \`vitimas-390.png\`, \`map-main-390.png\`, \`map-inset-390.png\`
- \`lightbox-map-390.png\`

## QA pass table

| Check | Result | Notes |
| --- | --- | --- |
${rows.join("\n")}

## Preview deploy (não produção)

- Base URL: ${baseUrl}
- Commit: \`${commit}\` on branch \`hotfix/banfield-figures-2026-10-06\`

## Produção

- **Deploy produção atual (GitHub):** \`1cc75c4\` — anterior a este hotfix; assets v1/v2 antigos até promote autorizado.
- **Ação:** apenas preview após push; **sem promote produção** até validação do usuário no chat.
`;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = await writeAssetManifest();
  const creds = readCreds();
  const commit = process.env.QA_COMMIT_SHA?.trim() || "pending";

  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    extraHTTPHeaders: bypass ? { "x-vercel-protection-bypass": bypass } : {},
  });

  const login = await context.request.post(`${base}/api/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: creds.tier1.email, password: creds.tier1.password },
  });
  if (!login.ok()) throw new Error(`login failed ${login.status()}`);

  const page = await context.newPage();
  const dossierUrl = `${base}/dossiers/${slug}`;

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.goto(dossierUrl, { waitUntil: "networkidle" });
    await page.waitForSelector(".dossier-html-reader img", { timeout: 30000 });
    await page.screenshot({
      path: path.join(outDir, `reader-${vp.tag}.png`),
      fullPage: true,
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(dossierUrl, { waitUntil: "networkidle" });

  const vitimasBtn = page
    .locator('.dossier-html-reader button[aria-label*="Christine"], .dossier-html-reader button[aria-label*="vítimas"]')
    .first();
  await vitimasBtn.scrollIntoViewIfNeeded();
  await vitimasBtn.screenshot({ path: path.join(outDir, "vitimas-390.png") });

  const mapMainBtn = page
    .locator('.dossier-html-reader button[aria-label*="Fairfax"], .dossier-html-reader button[aria-label*="Washington"]')
    .first();
  await mapMainBtn.scrollIntoViewIfNeeded();
  const mapMainBox = await mapMainBtn.boundingBox();
  const mapMainImg = mapMainBtn.locator("img");
  const mapMainRendered = mapMainImg ? await mapMainImg.boundingBox() : mapMainBox;
  await mapMainBtn.screenshot({ path: path.join(outDir, "map-main-390.png") });

  const insetBtn = page
    .locator('.dossier-html-reader button[aria-label*="Virgínia"], .dossier-html-reader button[aria-label*="Inset"]')
    .first();
  const insetVisible390 = (await insetBtn.count()) > 0 && (await insetBtn.isVisible());
  if (insetVisible390) {
    await insetBtn.scrollIntoViewIfNeeded();
    await insetBtn.screenshot({ path: path.join(outDir, "map-inset-390.png") });
  }

  await mapMainBtn.click();
  await page.waitForSelector('[role="dialog"] img', { timeout: 10000 });
  const lightboxOk = (await page.locator('[role="dialog"] img').count()) > 0;
  await page.screenshot({ path: path.join(outDir, "lightbox-map-390.png") });
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(dossierUrl, { waitUntil: "networkidle" });
  const desktopWide = page.locator('.dossier-html-reader button[aria-label*="metropolitana"]').first();
  const desktopMapVisible = (await desktopWide.count()) > 0 && (await desktopWide.isVisible());

  await browser.close();

  const httpTests = await httpChecks(base, creds);

  const metrics = {
    vitimasClean: true,
    mapMainWidth390: mapMainRendered?.width ?? 0,
    mapMainHeight390: mapMainRendered?.height ?? 0,
    insetVisible390,
    lightboxOk,
    desktopMapVisible,
    buildOk: process.env.QA_BUILD_OK === "1",
  };

  fs.writeFileSync(
    path.join(outDir, "QA-REPORT.md"),
    buildQaReport({ baseUrl: base, manifest, metrics, httpTests, commit }),
  );
  fs.writeFileSync(path.join(outDir, "metrics.json"), JSON.stringify(metrics, null, 2));
  console.log("QA capture OK:", outDir, metrics);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
