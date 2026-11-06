import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ensureBanfieldPortraitWebp } from "../src/lib/dossier/banfield-portrait-assets";

async function main() {
  const dir = path.join(
    process.cwd(),
    "private",
    "dossiers",
    "documents",
    "familia-banfield",
    "assets",
  );
  const collage = fs.readFileSync(path.join(dir, "fig-vitimas.webp"));
  const christine = fs.readFileSync(path.join(dir, "fig-portrait-christine.webp"));

  const fromCollage = await ensureBanfieldPortraitWebp("familia-banfield", "fig-portrait-christine", collage);
  assert.ok(fromCollage && fromCollage.bytes.length > 100, "recorta quadrante a partir da grade");
  const legacyVitimas = await ensureBanfieldPortraitWebp("familia-banfield", "fig-vitimas", collage, 2);
  assert.ok(legacyVitimas && legacyVitimas.bytes.length > 100, "fig-vitimas?q= recorta quadrante");
  const noopGrid = await ensureBanfieldPortraitWebp("familia-banfield", "fig-portrait-christine", christine);
  assert.equal(noopGrid, null, "não altera quando já é retrato");

  const noopSlug = await ensureBanfieldPortraitWebp("outro-slug", "fig-portrait-christine", collage);
  assert.equal(noopSlug, null);
  const noopVitimasNoQ = await ensureBanfieldPortraitWebp("familia-banfield", "fig-vitimas", collage, null);
  assert.equal(noopVitimasNoQ, null);

  console.log("test-banfield-portrait-fallback: OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
