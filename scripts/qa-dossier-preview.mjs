/**
 * QA rápido do dossiê no Preview (login + manifest + bloco).
 * node scripts/qa-dossier-preview.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? process.env.PREVIEW_URL ?? "https://crime-mania-2u9ox88tz-investwise.vercel.app";
const slug = "familia-banfield";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();

function apiHeaders(extra = {}) {
  return {
    ...extra,
    ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}),
  };
}

function readCreds() {
  const p = path.join(process.cwd(), "private", "qa-credentials.txt");
  const raw = fs.readFileSync(p, "utf8");
  const cfg = {};
  for (const line of raw.split("\n")) {
    const m = line.match(/^(qa-.+@.+?)=(.+)$/);
    if (m) cfg[m[1]] = m[2].trim();
  }
  return {
    free: { email: "qa-free@crime-mania.test", password: cfg["qa-free@crime-mania.test"] },
    tier1: { email: "qa-tier1@crime-mania.test", password: cfg["qa-tier1@crime-mania.test"] },
    tier2: { email: "qa-tier2@crime-mania.test", password: cfg["qa-tier2@crime-mania.test"] },
  };
}

async function login(email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: apiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { ok: res.ok, cookie, status: res.status };
}

async function manifest(cookie) {
  const res = await fetch(`${base}/api/dossier/${slug}/manifest`, {
    headers: apiHeaders(cookie ? { Cookie: cookie } : {}),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function blockHead(cookie) {
  const res = await fetch(`${base}/api/dossier/${slug}/blocks/01-capa-resumo?w=390&fmt=webp`, {
    headers: apiHeaders(cookie ? { Cookie: cookie } : {}),
  });
  return { status: res.status, type: res.headers.get("content-type"), len: res.headers.get("content-length") };
}

async function main() {
  if (!bypass) {
    console.warn("Defina VERCEL_AUTOMATION_BYPASS_SECRET para QA em Preview protegido.");
  }
  const creds = readCreds();
  const anon = await manifest("");
  console.log("anon manifest", anon.status);

  const freeLogin = await login(creds.free.email, creds.free.password);
  const freeM = await manifest(freeLogin.cookie);
  console.log("free manifest", freeM.status);

  const t1Login = await login(creds.tier1.email, creds.tier1.password);
  const t1M = await manifest(t1Login.cookie);
  console.log("tier1 manifest", t1M.status, t1M.body?.blocks?.length ?? 0, "blocks");
  const t1B = await blockHead(t1Login.cookie);
  console.log("tier1 block", t1B.status, t1B.type, t1B.len);

  const t2Login = await login(creds.tier2.email, creds.tier2.password);
  const t2M = await manifest(t2Login.cookie);
  console.log("tier2 manifest", t2M.status);

  const html = await fetch(`${base}/membro/dossies/${slug}`, {
    headers: apiHeaders({ Cookie: t1Login.cookie }),
  }).then((r) => r.text());
  const bad = ["?key=", "CM_ADMIN_SYNC", "storageKey", "<iframe", "<object"].filter((s) => html.includes(s));
  console.log("html leaks", bad.length ? bad : "none");

  const galAnon = await fetch(`${base}/api/dossier/${slug}/gallery/manifest`, { headers: apiHeaders({}) });
  console.log("gallery anon", galAnon.status);
  const galT1 = await fetch(`${base}/api/dossier/${slug}/gallery/manifest`, {
    headers: apiHeaders({ Cookie: t1Login.cookie }),
  });
  const galBody = galT1.ok ? await galT1.json() : {};
  console.log("gallery tier1", galT1.status, galBody.items?.length ?? 0, "slides");
  if (galBody.items?.[0]) {
    const img = await fetch(
      `${base}/api/dossier/${slug}/gallery/${galBody.items[0].id}`,
      { headers: apiHeaders({ Cookie: t1Login.cookie }) },
    );
    console.log("gallery image", img.status, img.headers.get("content-type"));
  }

  console.log("OK qa-dossier-preview");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
