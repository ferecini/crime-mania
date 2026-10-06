/**
 * QA visual: figuras HTML Banfield (390/430/768/1280 + lightbox + métricas).
 * node scripts/qa-banfield-figures-capture.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execSync } from "node:child_process";
import sharp from "sharp";

const base = process.argv[2] ?? process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "private/qa-screenshots/banfield-figures-fix-2026-10-06",
);
const slug = "familia-banfield";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();
const EXPECTED_DOC_VERSION = Number(process.env.QA_DOC_VERSION ?? "6");

const ASSET_IDS = ["fig-vitimas", "fig-mapa-main", "fig-mapa-inset"];

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

function gitCommitSha() {
  if (process.env.QA_COMMIT_SHA?.trim()) return process.env.QA_COMMIT_SHA.trim();
  try {
    return execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function documentHasFigures(doc) {
  const figures = [];
  for (const section of doc?.sections ?? []) {
    for (const block of section.blocks ?? []) {
      if (block.type === "figure") figures.push({ sectionId: section.id, assetId: block.assetId });
    }
  }
  const vitimasSection = doc?.sections?.find((s) => s.id === "vitimas");
  const mapaSection = doc?.sections?.find((s) => s.id === "mapa");
  const vitimasOk = vitimasSection?.blocks?.some((b) => b.type === "figure" && b.assetId === "fig-vitimas");
  const mapMainOk = mapaSection?.blocks?.some((b) => b.type === "figure" && b.assetId === "fig-mapa-main");
  const mapInsetOk = mapaSection?.blocks?.some((b) => b.type === "figure" && b.assetId === "fig-mapa-inset");
  return { figures, vitimasOk, mapMainOk, mapInsetOk };
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
  const figMeta = documentHasFigures(t1Doc.body);
  push(
    "tier1 document 200 v4",
    t1Doc.status === 200 && t1Doc.body?.version === EXPECTED_DOC_VERSION,
    `${t1Doc.status} v=${t1Doc.body?.version}`,
  );
  push(
    "document fig-vitimas in seção vitimas",
    figMeta.vitimasOk,
    `figures=${figMeta.figures.length}`,
  );
  push(
    "document map main/inset in seção mapa",
    figMeta.mapMainOk && figMeta.mapInsetOk,
    JSON.stringify(figMeta.figures.filter((f) => f.assetId?.startsWith("fig-mapa"))),
  );

  for (const assetId of ["fig-vitimas", "fig-mapa-main", "fig-mapa-inset"]) {
    const ar = await fetch(
      `${baseUrl}/api/dossier/${slug}/document/asset/${assetId}?w=960`,
      { headers: { Cookie: t1L.cookie } },
    );
    push(`tier1 asset ${assetId} 200`, ar.status === 200, ar.status);
  }

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

async function gotoDossier(page, url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      await page.goto(url, { waitUntil: "load", timeout: 120000 });
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(1500);
    }
  }
}

async function waitReaderReady(page) {
  await page.waitForSelector(".dossier-html-reader", { timeout: 90000 });
  await page.waitForFunction(
    () => {
      const root = document.querySelector(".dossier-html-reader");
      if (!root) return false;
      const text = root.textContent ?? "";
      if (text.includes("Carregando dossiê")) return false;
      if (text.includes("Não foi possível carregar")) return false;
      for (const id of ["fig-vitimas", "fig-mapa-main", "fig-mapa-inset"]) {
        const fig = root.querySelector(`[data-dossier-figure="${id}"] img`);
        if (!fig || !fig.complete || fig.naturalWidth <= 0) return false;
      }
      return true;
    },
    { timeout: 90000 },
  );
}

function buildQaReport({ baseUrl, manifest, metrics, httpTests, commit }) {
  const rows = [
    ...httpTests.map((t) => `| ${t.name} | ${t.pass ? "PASS" : "FAIL"} | ${t.detail ?? ""} |`),
    `| reader mostra fig-vitimas @390 | ${metrics.vitimasVisible390 ? "PASS" : "FAIL"} | naturalWidth=${metrics.vitimasNaturalWidth} |`,
    `| reader mostra fig-mapa-main @390 | ${metrics.mapMainVisible390 ? "PASS" : "FAIL"} | img h=${metrics.mapMainImgHeight390?.toFixed?.(1)}px |`,
    `| reader mostra fig-mapa-inset @390 | ${metrics.insetVisible390 ? "PASS" : "FAIL"} | naturalWidth=${metrics.insetNaturalWidth} |`,
    `| fig-mapa-main img height @390 ≥180px | ${metrics.mapMainImgHeight390 >= 180 ? "PASS" : "FAIL"} | img w×h=${metrics.mapMainImgWidth390?.toFixed?.(1)}×${metrics.mapMainImgHeight390?.toFixed?.(1)} |`,
    `| lightbox mapa img ≥180px h @390 | ${metrics.lightboxOk && (metrics.lightboxMainImgRect390?.height ?? 0) >= 180 ? "PASS" : "FAIL"} | ${JSON.stringify(metrics.lightboxMainImgRect390)} |`,
    `| reader @1280 sem loading | ${metrics.reader1280Ready ? "PASS" : "FAIL"} | |`,
    `| npm test:banfield-html-figures | ${metrics.figureTestOk ? "PASS" : "FAIL"} | |`,
    `| npm run build | ${metrics.buildOk ? "PASS" : "FAIL"} | |`,
  ];

  return `# Banfield figures fix — QA report (2026-10-06)

## Asset verification (source crop)

- \`asset-verify-fig-vitimas.png\` — grade 2×2 (414×410).
- \`asset-verify-fig-mapa-main.png\` — painel Fairfax/DC (908×465).
- \`asset-verify-fig-mapa-inset.png\` — inset Virgínia + coordenadas (705×476).
- \`ASSET-MANIFEST.json\` — dimensões e SHA-256 dos \`.webp\`.

\`\`\`json
${JSON.stringify(manifest, null, 2)}
\`\`\`

## Documento HTML (v${EXPECTED_DOC_VERSION})

- Figura \`fig-vitimas\` na seção **Vítimas** (\`sections[].id === "vitimas"\`).
- \`fig-mapa-main\` + \`fig-mapa-inset\` na seção **Mapa** em todos os breakpoints (grid 1 col mobile, 2 cols desktop); sem \`fig-mapa\` wide.
- Bootstrap: \`npm run dossier:bootstrap-banfield-html\` → Blob \`v${EXPECTED_DOC_VERSION}\` + Postgres \`published\`.

## Automated tests

- \`npm run test:banfield-html-figures\` — ${metrics.figureTestOk ? "PASS" : "FAIL"}.
- \`npm run build\` — ${metrics.buildOk ? "PASS" : "FAIL"}.

## Reader screenshots (390 / 430 / 768 / 1280 + lightbox)

Capturas após \`document ready\` e \`naturalWidth > 0\` em \`fig-vitimas\`, \`fig-mapa-main\`, \`fig-mapa-inset\`:

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

- **Não promover** até validação visual da proprietária neste chat.
`;
}

async function imgClientRect(page, assetId) {
  return page.evaluate((id) => {
    const img = document.querySelector(`[data-dossier-figure="${id}"] img`);
    if (!img) return null;
    const r = img.getBoundingClientRect();
    return {
      x: r.x,
      y: r.y,
      width: r.width,
      height: r.height,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight,
    };
  }, assetId);
}

async function figureMetrics(page, assetId) {
  const img = page.locator(`[data-dossier-figure="${assetId}"] img`).first();
  const count = await img.count();
  if (count === 0) return { visible: false, naturalWidth: 0, rect: null };
  await img.scrollIntoViewIfNeeded();
  const visible = await img.isVisible();
  const rect = await imgClientRect(page, assetId);
  return {
    visible,
    naturalWidth: rect?.naturalWidth ?? 0,
    naturalHeight: rect?.naturalHeight ?? 0,
    rect,
  };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const manifest = await writeAssetManifest();
  const creds = readCreds();
  const commit = gitCommitSha();

  let figureTestOk = false;
  try {
    execSync("npm run test:banfield-html-figures", { stdio: "pipe", encoding: "utf8" });
    figureTestOk = true;
  } catch {
    figureTestOk = false;
  }

  const { chromium } = await import("playwright");
  const channel = process.env.PLAYWRIGHT_CHANNEL?.trim() || undefined;
  const browser = await chromium.launch({ headless: true, channel });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    extraHTTPHeaders: bypass ? { "x-vercel-protection-bypass": bypass } : {},
  });

  const page = await context.newPage();
  const login = await page.request.post(`${base}/api/auth/login`, {
    headers: { "Content-Type": "application/json" },
    data: { email: creds.tier1.email, password: creds.tier1.password },
  });
  if (!login.ok()) throw new Error(`login failed ${login.status()}`);
  if (base.startsWith("http://")) {
    console.warn(
      "QA base is HTTP: use `next dev` locally or HTTPS Preview (secure session cookies).",
    );
  }

  const dossierUrl = `${base}/membro/dossies/${slug}`;

  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await gotoDossier(page, dossierUrl);
    await waitReaderReady(page);
    await page.screenshot({
      path: path.join(outDir, `reader-${vp.tag}.png`),
      fullPage: true,
    });
  }

  await page.setViewportSize({ width: 390, height: 844 });
  await gotoDossier(page, dossierUrl);
  await waitReaderReady(page);

  const vitimas = await figureMetrics(page, "fig-vitimas");
  await page.locator('[data-dossier-figure="fig-vitimas"]').screenshot({
    path: path.join(outDir, "vitimas-390.png"),
  });

  const mapMain = await figureMetrics(page, "fig-mapa-main");
  await page.locator('[data-dossier-figure="fig-mapa-main"] img').screenshot({
    path: path.join(outDir, "map-main-390.png"),
  });

  await page.evaluate(() => {
    const el = document.querySelector('[data-dossier-figure="fig-mapa-inset"]');
    el?.scrollIntoView({ block: "center", inline: "nearest" });
  });
  await page.waitForTimeout(400);
  const inset = await figureMetrics(page, "fig-mapa-inset");
  await page.locator('[data-dossier-figure="fig-mapa-inset"] img').screenshot({
    path: path.join(outDir, "map-inset-390.png"),
  });

  await page.locator('[data-dossier-figure="fig-mapa-main"] button').click();
  await page.waitForSelector('[role="dialog"] img', { timeout: 10000 });
  const lightboxOk = (await page.locator('[role="dialog"] img').count()) > 0;
  const lightboxMainRect = lightboxOk
    ? await page.evaluate(() => {
        const img = document.querySelector('[role="dialog"] img');
        if (!img) return null;
        const r = img.getBoundingClientRect();
        return { width: r.width, height: r.height };
      })
    : null;
  await page.screenshot({ path: path.join(outDir, "lightbox-map-390.png") });
  await page.keyboard.press("Escape");

  let reader1280Ready = false;
  await page.setViewportSize({ width: 1280, height: 900 });
  await gotoDossier(page, dossierUrl);
  try {
    await waitReaderReady(page);
    reader1280Ready = true;
  } catch {
    reader1280Ready = false;
  }

  await browser.close();

  const httpTests = await httpChecks(base, creds);

  const metrics = {
    vitimasVisible390: vitimas.visible && vitimas.naturalWidth > 0,
    vitimasNaturalWidth: vitimas.naturalWidth,
    vitimasImgRect390: vitimas.rect,
    mapMainVisible390: mapMain.visible && mapMain.naturalWidth > 0,
    mapMainImgWidth390: mapMain.rect?.width ?? 0,
    mapMainImgHeight390: mapMain.rect?.height ?? 0,
    mapMainImgRect390: mapMain.rect,
    insetVisible390: inset.visible && inset.naturalWidth > 0,
    insetNaturalWidth: inset.naturalWidth,
    insetImgRect390: inset.rect,
    lightboxOk,
    lightboxMainImgRect390: lightboxMainRect,
    reader1280Ready,
    figureTestOk,
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
