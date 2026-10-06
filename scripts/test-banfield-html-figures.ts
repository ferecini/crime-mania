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

/** fig-mapa defeituoso anterior: 1440×287, crop da faixa d03 (resumo + «02. MAPA»). */
const BAD_MAPA_DIMENSIONS = { width: 1440, height: 287 };

const MOBILE_MAP_MIN_HEIGHT_AT_352 = 180;
const MOBILE_VIEWPORT_WIDTH = 352;

async function testFigureAssets() {
  for (const id of ["fig-vitimas", "fig-mapa-main", "fig-mapa-inset", "fig-mapa"]) {
    const p = path.join(assetsDir, `${id}.webp`);
    assert.ok(fs.existsSync(p), `${id}.webp deve existir`);
  }

  const vitimasPath = path.join(assetsDir, "fig-vitimas.webp");
  const mapaMainPath = path.join(assetsDir, "fig-mapa-main.webp");
  const mapaInsetPath = path.join(assetsDir, "fig-mapa-inset.webp");
  const mapaPath = path.join(assetsDir, "fig-mapa.webp");

  const vitimas = await sharp(vitimasPath).metadata();
  const mapaMain = await sharp(mapaMainPath).metadata();
  const mapaInset = await sharp(mapaInsetPath).metadata();
  const mapa = await sharp(mapaPath).metadata();
  const vw = vitimas.width ?? 0;
  const vh = vitimas.height ?? 0;
  const mmw = mapaMain.width ?? 0;
  const mmh = mapaMain.height ?? 0;
  const miw = mapaInset.width ?? 0;
  const mih = mapaInset.height ?? 0;
  const mw = mapa.width ?? 0;
  const mh = mapa.height ?? 0;

  assert.ok(vw >= 400 && vw <= 450, `fig-vitimas width ${vw}`);
  assert.ok(vh >= 310 && vh <= 340, `fig-vitimas height ${vh}`);
  const vAspect = vw / vh;
  assert.ok(vAspect >= 1.2 && vAspect <= 1.45, `fig-vitimas aspect ${vAspect}`);

  const mainAspect = mmw / mmh;
  const mainRenderedH = MOBILE_VIEWPORT_WIDTH / mainAspect;
  assert.ok(
    mainRenderedH >= MOBILE_MAP_MIN_HEIGHT_AT_352 - 0.5,
    `fig-mapa-main rendered height @352px = ${mainRenderedH.toFixed(1)} (need ≥${MOBILE_MAP_MIN_HEIGHT_AT_352})`,
  );
  assert.ok(mainAspect <= 352 / MOBILE_MAP_MIN_HEIGHT_AT_352 + 0.02, `fig-mapa-main aspect ${mainAspect}`);

  assert.ok(miw >= 650, `fig-mapa-inset width ${miw}`);
  assert.ok(mih >= 350, `fig-mapa-inset height ${mih}`);

  assert.ok(mw >= 1500, `fig-mapa width ${mw}`);
  assert.ok(mh >= 250 && mh <= 320, `fig-mapa height ${mh}`);
  const mAspect = mw / mh;
  assert.ok(mAspect >= 4 && mAspect <= 8, `fig-mapa aspect ${mAspect}`);
  assert.ok(mAspect < 9, "fig-mapa não deve ser faixa extrema (>9:1)");

  assert.ok(
    mw !== BAD_MAPA_DIMENSIONS.width || mh !== BAD_MAPA_DIMENSIONS.height,
    "fig-mapa ainda tem dimensões exatas do asset defeituoso 1440×287",
  );
  assert.ok(mw > BAD_MAPA_DIMENSIONS.width, "fig-mapa deve ser mais largo que o crop defeituoso");
}

async function main() {
  await testFigureAssets();
  console.log("test:banfield-html-figures OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
