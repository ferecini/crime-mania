import assert from "node:assert/strict";
import { getDossierRecord } from "../src/data/dossiers";
import { canAccessDossierDocument } from "../src/lib/dossier/access";
import { pickVariantWidth, readProcessedManifest } from "../src/lib/dossier/manifest-store";
import { toPublicManifest } from "../src/lib/dossier/public-manifest";

function testAccessTiers() {
  const dossier = getDossierRecord("familia-banfield");
  assert.ok(dossier);
  assert.equal(canAccessDossierDocument(null, dossier), false);
  assert.equal(
    canAccessDossierDocument(
      { id: "1", email: "a@b.test", displayName: "A", tier: "none", provider: "email" },
      dossier,
    ),
    false,
  );
  assert.equal(
    canAccessDossierDocument(
      { id: "2", email: "t1@b.test", displayName: "T1", tier: "tier1", provider: "email" },
      dossier,
    ),
    true,
  );
}

async function testManifestOrder() {
  const manifest = await readProcessedManifest("familia-banfield");
  assert.ok(manifest, "manifest Banfield deve existir após dossier:process ou bootstrap");
  for (const viewport of ["mobile", "desktop"] as const) {
    const subset = manifest.blocks
      .filter((b) => (b.viewport === "mobile" ? "mobile" : "desktop") === viewport)
      .slice()
      .sort((a, b) => a.order - b.order);
    assert.ok(subset.length >= 1, `blocos ${viewport}`);
    const orders = subset.map((b) => b.order);
    assert.deepEqual(orders, [...orders].sort((a, b) => a - b));
  }
  const pub = toPublicManifest(manifest);
  assert.ok(!JSON.stringify(pub).includes("storageKey"));
  assert.ok(!JSON.stringify(pub).includes("passwordHash"));
  assert.ok(pub.blocks.some((b) => b.viewport === "mobile"));
  assert.ok(pub.blocks.some((b) => b.viewport === "desktop"));
  const mobileN = manifest.blocks.filter((b) => b.viewport === "mobile").length;
  const desktopN = manifest.blocks.filter((b) => b.viewport === "desktop").length;
  assert.equal(mobileN, 15, "Banfield mobile crop count");
  assert.equal(desktopN, 13, "Banfield desktop crop count");
  assert.ok(manifest.blocks.some((b) => b.id === "m05b-timeline-titulo"));
}

function testPickWidth() {
  assert.equal(pickVariantWidth(400), 640);
  assert.equal(pickVariantWidth(800), 960);
  assert.equal(pickVariantWidth(2000), 1440);
}

async function main() {
  testAccessTiers();
  await testManifestOrder();
  testPickWidth();
  console.log("test:dossier-pipeline OK");
}

main();
