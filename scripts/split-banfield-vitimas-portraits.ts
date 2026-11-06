/**
 * Divide fig-vitimas.webp (grade 2×2 do PDF) em quatro retratos nomeados.
 * Ordem: TL=Christine, TR=Joseph, BL=Brendan, BR=Juliana.
 * npx tsx scripts/split-banfield-vitimas-portraits.ts
 */
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

const SRC = "fig-vitimas.webp";
const OUT = [
  { id: "fig-portrait-christine", label: "Christine Banfield" },
  { id: "fig-portrait-joseph", label: "Joseph Ryan" },
  { id: "fig-portrait-brendan", label: "Brendan Banfield" },
  { id: "fig-portrait-juliana", label: "Juliana Magalhães" },
] as const;

async function main() {
  const srcPath = path.join(assetsDir, SRC);
  if (!fs.existsSync(srcPath)) {
    console.error("Ausente:", srcPath);
    process.exit(1);
  }
  fs.mkdirSync(assetsDir, { recursive: true });

  const buf = fs.readFileSync(srcPath);
  const meta = await sharp(buf).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (w < 2 || h < 2) {
    console.error("Imagem inválida:", w, h);
    process.exit(1);
  }

  const halfW = Math.floor(w / 2);
  const halfH = Math.floor(h / 2);
  const quads: { left: number; top: number }[] = [
    { left: 0, top: 0 },
    { left: halfW, top: 0 },
    { left: 0, top: halfH },
    { left: halfW, top: halfH },
  ];

  for (let i = 0; i < OUT.length; i++) {
    const { id, label } = OUT[i]!;
    const { left, top } = quads[i]!;
    const width = i % 2 === 0 ? halfW : w - halfW;
    const height = i < 2 ? halfH : h - halfH;
    const webp = await sharp(buf)
      .extract({ left, top, width, height })
      .webp({ quality: 90, effort: 4 })
      .toBuffer();
    const outPath = path.join(assetsDir, `${id}.webp`);
    fs.writeFileSync(outPath, webp);
    const outMeta = await sharp(webp).metadata();
    console.log(`${id}: ${outMeta.width}×${outMeta.height} (${label})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
