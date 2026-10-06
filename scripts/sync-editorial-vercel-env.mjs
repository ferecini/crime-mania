#!/usr/bin/env node
/**
 * Lê private/ops/editorial-user-ids.txt e define na Vercel:
 *   CM_EDITORIAL_USER_IDS (canônico)
 *   CM_DOSSIER_ADMIN_IDS + CM_COMMUNITY_MODERATOR_IDS (mesma lista, legado)
 *
 * Uso:
 *   node scripts/sync-editorial-vercel-env.mjs preview
 *   node scripts/sync-editorial-vercel-env.mjs production
 *   node scripts/sync-editorial-vercel-env.mjs preview --append-qa-tier2
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..");
const idsPath = path.join(repoRoot, "private/ops/editorial-user-ids.txt");

const QA_TIER2_ID = "00000000-0000-4000-8000-010000000003";
const PLACEHOLDER = /^(OWNER_UUID|REPLACE_ME|TODO|PLACEHOLDER)/i;
const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const target = process.argv[2];
const appendQa = process.argv.includes("--append-qa-tier2");

if (!target || !["preview", "production", "development"].includes(target)) {
  console.error(
    "Uso: node scripts/sync-editorial-vercel-env.mjs <preview|production|development> [--append-qa-tier2]",
  );
  process.exit(1);
}

if (!fs.existsSync(idsPath)) {
  console.error(`Arquivo ausente: ${idsPath}`);
  console.error("Copie docs/ops/editorial-user-ids.template.txt e preencha com UUIDs reais.");
  process.exit(1);
}

const raw = fs.readFileSync(idsPath, "utf8");
const ids = [];
for (const line of raw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  if (PLACEHOLDER.test(t)) continue;
  if (!UUID.test(t)) {
    console.error(`Ignorado (não é UUID): ${t}`);
    continue;
  }
  ids.push(t.toLowerCase());
}

const unique = [...new Set(ids)];
if (appendQa && !unique.includes(QA_TIER2_ID)) {
  unique.push(QA_TIER2_ID);
}

if (unique.length === 0) {
  console.error("Nenhum UUID válido em editorial-user-ids.txt.");
  process.exit(1);
}

const value = unique.join(",");

function vercelEnvSet(name, envValue) {
  execFileSync(
    "vercel",
    ["env", "add", name, target, "--value", envValue, "--yes", "--force"],
    { cwd: repoRoot, stdio: "inherit" },
  );
}

const vars = ["CM_EDITORIAL_USER_IDS", "CM_DOSSIER_ADMIN_IDS", "CM_COMMUNITY_MODERATOR_IDS"];

console.log(`Target: ${target}`);
console.log(`IDs (${unique.length}): ${unique.map((id) => id.slice(0, 8) + "…").join(", ")}`);

for (const name of vars) {
  console.log(`\n→ ${name}`);
  vercelEnvSet(name, value);
}

console.log("\nConcluído. Faça redeploy do ambiente para aplicar.");
