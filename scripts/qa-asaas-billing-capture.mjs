/**
 * Captura /planos e /membro/conta (390 + desktop).
 * Uso: node scripts/qa-asaas-billing-capture.mjs --base http://localhost:3000
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3000";

const outDir = path.join(
  __dirname,
  "../private/qa-screenshots/asaas-billing-2026-10-08",
);
fs.mkdirSync(outDir, { recursive: true });

async function shot(name, url, width) {
  const puppeteer = await import("puppeteer-core").catch(() => null);
  if (!puppeteer) {
    console.warn("puppeteer-core não instalado — use browser MCP para capturas manuais.");
    return false;
  }
  const browser = await puppeteer.default.launch({
    headless: true,
    channel: "chrome",
  });
  const page = await browser.newPage();
  await page.setViewport({ width, height: width <= 430 ? 844 : 900 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await page.screenshot({ path: path.join(outDir, name), fullPage: true });
  await browser.close();
  console.log("saved", name);
  return true;
}

const targets = [
  ["planos-desktop-1280.png", `${base}/planos`, 1280],
  ["planos-mobile-390.png", `${base}/planos`, 390],
  ["conta-desktop-1280.png", `${base}/membro/conta`, 1280],
  ["conta-mobile-390.png", `${base}/membro/conta`, 390],
];

let ok = 0;
for (const [name, url, w] of targets) {
  if (await shot(name, url, w)) ok += 1;
}

if (ok === 0) {
  fs.writeFileSync(
    path.join(outDir, "README.txt"),
    `Rodar dev server e capturar manualmente:\n${targets.map((t) => t[1]).join("\n")}\n`,
  );
  console.log("Wrote README.txt fallback in", outDir);
}
