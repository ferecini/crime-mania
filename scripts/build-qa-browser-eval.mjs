import fs from "node:fs";
import path from "node:path";
import { qaGalleryHttpScript } from "./qa-browser-http-bundle.mjs";

const credPath = path.join(process.cwd(), "private/qa-credentials.txt");
const raw = fs.readFileSync(credPath, "utf8");
const cfg = {};
for (const line of raw.split("\n")) {
  const m = line.match(/^(qa-.+@.+?)=(.+)$/);
  if (m) cfg[m[1]] = m[2].trim();
}
const creds = {
  free: { email: "qa-free@crime-mania.test", password: cfg["qa-free@crime-mania.test"] },
  tier1: { email: "qa-tier1@crime-mania.test", password: cfg["qa-tier1@crime-mania.test"] },
  tier2: { email: "qa-tier2@crime-mania.test", password: cfg["qa-tier2@crime-mania.test"] },
};
const fn = qaGalleryHttpScript();
const expr = `(async()=>{globalThis.__QA_CREDS=${JSON.stringify(creds)}; const run=${fn}; return await run();})()`;
const out = path.join(process.cwd(), "private/qa-screenshots/gallery-qa-2026-10-06/_browser-eval.js");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, expr);
console.log(out, expr.length);
