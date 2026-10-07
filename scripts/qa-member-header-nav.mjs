/**
 * QA visual: cabeçalho e menu lateral da área logada.
 * Uso: node scripts/qa-member-header-nav.mjs [baseUrl]
 * Requer: servidor local + npx playwright install chromium
 */
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? process.env.QA_BASE_URL ?? "http://127.0.0.1:3000";
const outDir =
  process.argv[3] ??
  path.join(process.cwd(), "private/qa-screenshots/member-header-nav-2026-10-07");

const viewports = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 768 },
  { name: "1440", width: 1440, height: 900 },
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
    email: "qa-tier1@crime-mania.test",
    password: cfg["qa-tier1@crime-mania.test"],
  };
}

async function login(page, creds) {
  await page.goto(`${base}/entrar`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"]', creds.email);
  await page.fill('input[type="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/membro/, { timeout: 30_000 });
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const { chromium } = await import("playwright");
  const creds = readCreds();
  const browser = await chromium.launch({ headless: true });
  const report = { base, outDir, shots: [], checks: [] };

  try {
    for (const vp of viewports) {
      const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const page = await context.newPage();
      await login(page, creds);
      await page.goto(`${base}/membro`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);

      const file = path.join(outDir, `membro-${vp.name}-default.png`);
      await page.screenshot({ path: file, fullPage: false });
      report.shots.push(file);

      if (vp.width >= 1024) {
        const collapseBtn = page.getByRole("button", { name: /Recolher menu|Expandir menu/i });
        if (await collapseBtn.count()) {
          await collapseBtn.click();
          await page.waitForTimeout(350);
          const collapsed = path.join(outDir, `membro-${vp.name}-sidebar-collapsed.png`);
          await page.screenshot({ path: collapsed, fullPage: false });
          report.shots.push(collapsed);
          await collapseBtn.click();
          await page.waitForTimeout(350);
        }
      }

      const searchToggle =
        vp.width >= 768
          ? page.getByRole("button", { name: "Buscar" }).first()
          : page.getByRole("button", { name: /Buscar casos/i }).first();
      if (await searchToggle.count()) {
        await searchToggle.click();
        await page.waitForTimeout(250);
        const searchOpen = path.join(outDir, `membro-${vp.name}-search-open.png`);
        await page.screenshot({ path: searchOpen, fullPage: false });
        report.shots.push(searchOpen);
        await page.keyboard.press("Escape");
        await page.waitForTimeout(200);
      }

      if (vp.width < 768) {
        await page.getByRole("button", { name: /Abrir menu/i }).click();
        await page.waitForTimeout(250);
        const drawer = path.join(outDir, `membro-${vp.name}-drawer.png`);
        await page.screenshot({ path: drawer, fullPage: false });
        report.shots.push(drawer);
      }

      const navLinks = await page.locator("header nav[aria-label='Principal'] a").count();
      if (vp.width >= 768) {
        report.checks.push({ viewport: vp.name, publicNavCount: navLinks, expectMin: 3 });
      }

      await context.close();
    }

    fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
    console.log("QA OK:", outDir);
    console.log(JSON.stringify(report.checks, null, 2));
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
