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

/** Painel mapa único ~1410×321 — panorâmico, altura @358 ainda legível (~82px) */
const MOBILE_MAP_MIN_HEIGHT_AT_358 = 78;
/** Largura útil ~358px com bleed -mx-4 @390 viewport */
const MOBILE_CONTENT_WIDTH = 358;

async function testFigureAssets() {
  const portraitIds = [
    "fig-portrait-christine",
    "fig-portrait-joseph",
    "fig-portrait-brendan",
    "fig-portrait-juliana",
  ];
  for (const id of [...portraitIds, "fig-vitimas", "fig-mapa"]) {
    const p = path.join(assetsDir, `${id}.webp`);
    assert.ok(fs.existsSync(p), `${id}.webp deve existir`);
  }

  const mapaPath = path.join(assetsDir, "fig-mapa.webp");

  for (const id of portraitIds) {
    const meta = await sharp(path.join(assetsDir, `${id}.webp`)).metadata();
    const w = meta.width ?? 0;
    const h = meta.height ?? 0;
    assert.ok(w >= 200 && w <= 220, `${id} width ${w}`);
    assert.ok(h >= 200 && h <= 215, `${id} height ${h}`);
  }

  const mapa = await sharp(mapaPath).metadata();
  const mmw = mapa.width ?? 0;
  const mmh = mapa.height ?? 0;

  assert.ok(mmw >= 1350 && mmw <= 1450, `fig-mapa width ${mmw}`);
  assert.ok(mmh >= 300 && mmh <= 350, `fig-mapa height ${mmh}`);
  const renderedH = MOBILE_CONTENT_WIDTH / (mmw / mmh);
  assert.ok(
    renderedH >= MOBILE_MAP_MIN_HEIGHT_AT_358 - 0.5,
    `fig-mapa rendered height @${MOBILE_CONTENT_WIDTH}px = ${renderedH.toFixed(1)} (need ≥${MOBILE_MAP_MIN_HEIGHT_AT_358})`,
  );

  const { data, info } = await sharp(mapaPath).raw().toBuffer({ resolveWithObject: true });
  const w = info.width ?? 0;
  const h = info.height ?? 0;
  const scanRows = Math.min(100, Math.floor(h * 0.25));
  let timelineBleedRow: number | null = null;
  for (let y = h - 1; y >= h - scanRows; y--) {
    let red = 0;
    let dark = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * (info.channels ?? 3);
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r > 150 && g < 90 && b < 90) red++;
      if (r + g + b < 40) dark++;
    }
    if (red >= 10 && dark / w > 0.75) {
      timelineBleedRow = y;
      break;
    }
  }
  assert.equal(
    timelineBleedRow,
    null,
    `fig-mapa não deve incluir vermelho «03» na faixa inferior (row=${timelineBleedRow})`,
  );
}

async function main() {
  await testFigureAssets();
  console.log("test:banfield-html-figures OK");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
