import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const assetsDir = path.join(
  process.cwd(),
  "private",
  "dossiers",
  "documents",
  "familia-banfield",
  "assets",
);

const MOBILE_MAP_MIN_HEIGHT_AT_358 = 180;
/** Largura útil ~358px com bleed -mx-4 @390 viewport */
const MOBILE_CONTENT_WIDTH = 358;

async function testFigureAssets() {
  for (const id of ["fig-vitimas", "fig-mapa-main", "fig-mapa-inset"]) {
    const p = path.join(assetsDir, `${id}.webp`);
    assert.ok(fs.existsSync(p), `${id}.webp deve existir`);
  }

  const vitimasPath = path.join(assetsDir, "fig-vitimas.webp");
  const mapaMainPath = path.join(assetsDir, "fig-mapa-main.webp");
  const mapaInsetPath = path.join(assetsDir, "fig-mapa-inset.webp");

  const vitimas = await sharp(vitimasPath).metadata();
  const mapaMain = await sharp(mapaMainPath).metadata();
  const mapaInset = await sharp(mapaInsetPath).metadata();
  const vw = vitimas.width ?? 0;
  const vh = vitimas.height ?? 0;
  const mmw = mapaMain.width ?? 0;
  const mmh = mapaMain.height ?? 0;
  const miw = mapaInset.width ?? 0;
  const mih = mapaInset.height ?? 0;

  assert.ok(vw >= 400 && vw <= 430, `fig-vitimas width ${vw}`);
  assert.ok(vh >= 395 && vh <= 425, `fig-vitimas height ${vh}`);

  assert.ok(mmw >= 880 && mmw <= 930, `fig-mapa-main width ${mmw}`);
  assert.ok(mmh >= 450 && mmh <= 480, `fig-mapa-main height ${mmh}`);
  const mainRenderedH = MOBILE_CONTENT_WIDTH / (mmw / mmh);
  assert.ok(
    mainRenderedH >= MOBILE_MAP_MIN_HEIGHT_AT_358 - 0.5,
    `fig-mapa-main rendered height @${MOBILE_CONTENT_WIDTH}px = ${mainRenderedH.toFixed(1)} (need ≥${MOBILE_MAP_MIN_HEIGHT_AT_358})`,
  );

  assert.ok(miw >= 650 && miw <= 780, `fig-mapa-inset width ${miw}`);
  assert.ok(mih >= 400 && mih <= 490, `fig-mapa-inset height ${mih}`);
}

async function main() {
  await testFigureAssets();
  console.log("test:banfield-html-figures OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
