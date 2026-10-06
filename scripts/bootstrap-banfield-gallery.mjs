/**
 * Envia as 5 imagens de teste da galeria Banfield para Blob e publica no Postgres.
 * node scripts/bootstrap-banfield-gallery.mjs [pasta]
 */
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { neon } from "@neondatabase/serverless";
import { put } from "@vercel/blob";

const slug = "familia-banfield";
const defaultDir =
  "/Users/angeloferecini/Documents/Codex/2026-09-25/referenced-chatgpt-conversation-this-is-an/outputs/banfield-gallery-test";

const ITEMS = [
  {
    file: "01-casa-suburbana-ilustrativa.png",
    caption: "Residência suburbana genérica na Virgínia — imagem ilustrativa.",
    alt: "Casa suburbana genérica entre árvores no inverno, vista da rua ao entardecer.",
  },
  {
    file: "02-mapa-virginia-ilustrativo.png",
    caption: "Referência geográfica genérica da região da Virgínia — imagem ilustrativa.",
    alt: "Mapa ilustrativo da Virgínia sobre uma mesa, com bússola, caderno e marcador vermelho.",
  },
  {
    file: "03-chegada-au-pair-ilustrativa.png",
    caption: "Representação genérica da chegada de uma au pair — imagem ilustrativa.",
    alt: "Mala fechada, chaves e papéis sem texto sobre um móvel, com quarto ao fundo.",
  },
  {
    file: "04-evidencia-digital-ilustrativa.png",
    caption: "Representação conceitual de evidências digitais — imagem ilustrativa.",
    alt: "Telefone com interface abstrata ao lado de cartões e fotografias genéricas organizadas sobre uma mesa.",
  },
  {
    file: "05-tribunal-arquivos-ilustrativa.png",
    caption: "Arquivos judiciais em ambiente de tribunal — imagem ilustrativa.",
    alt: "Pastas e cadernos fechados sobre uma mesa diante de um tribunal vazio.",
  },
];

const credit = "Ilustração gerada por IA — demonstração editorial Crime Mania.";

const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!url || !token) {
  console.error("POSTGRES_URL e BLOB_READ_WRITE_TOKEN são obrigatórios.");
  process.exit(1);
}

const dir = process.argv[2] ?? defaultDir;
const sql = neon(url);
const version = 1;
const items = [];

for (let i = 0; i < ITEMS.length; i++) {
  const spec = ITEMS[i];
  const abs = path.join(dir, spec.file);
  if (!fs.existsSync(abs)) {
    console.error("Arquivo ausente:", abs);
    process.exit(1);
  }
  const buf = fs.readFileSync(abs);
  const meta = await sharp(buf).metadata();
  const id = randomUUID();
  const key = `dossiers/gallery/${slug}/v${version}/${id}.png`;
  await put(key, buf, { access: "private", token, contentType: "image/png", addRandomSuffix: false });
  items.push({
    id,
    order: i + 1,
    caption: spec.caption,
    alt: spec.alt,
    credit,
    sourceType: "ai_placeholder",
    isIllustrative: true,
    storageKey: key,
    mimeType: "image/png",
    width: meta.width,
    height: meta.height,
  });
  console.log("OK", spec.file);
}

const manifest = {
  dossierSlug: slug,
  items,
  coverImageId: items[0].id,
  version,
  publishedAt: new Date().toISOString().slice(0, 10),
};

await sql`
  INSERT INTO dossier_gallery_manifests (dossier_slug, draft, published, updated_at)
  VALUES (${slug}, ${JSON.stringify(manifest)}::jsonb, ${JSON.stringify(manifest)}::jsonb, NOW())
  ON CONFLICT (dossier_slug) DO UPDATE SET
    draft = EXCLUDED.draft,
    published = EXCLUDED.published,
    updated_at = NOW()
`;

console.log("Galeria Banfield publicada:", items.length, "imagens.");
