/**
 * QA API completo — galeria + admin (Preview).
 * node scripts/qa-gallery-full.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "https://crime-mania-1b2rcxohr-investwise.vercel.app";
const slug = "familia-banfield";
const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();

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

function hdr(extra = {}) {
  return { ...extra, ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}) };
}

async function login(email, password) {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: hdr({ "Content-Type": "application/json" }),
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, cookie, ok: res.ok };
}

async function get(url, cookie = "") {
  const res = await fetch(url, { headers: hdr(cookie ? { Cookie: cookie } : {}) });
  const ct = res.headers.get("content-type") ?? "";
  let body = null;
  if (ct.includes("json")) body = await res.json().catch(() => null);
  else body = await res.text().catch(() => "");
  return { status: res.status, ct, body };
}

const results = [];
function record(name, pass, detail) {
  results.push({ name, pass, detail });
  console.log(pass ? "PASS" : "FAIL", name, detail);
}

async function main() {
  const creds = readCreds();
  if (!bypass) {
    console.warn("WARN: VERCEL_AUTOMATION_BYPASS_SECRET ausente — resultados podem ser inválidos (SSO).");
  }

  const anonGal = await get(`${base}/api/dossier/${slug}/gallery/manifest`);
  record("anon gallery manifest", anonGal.status === 403, `HTTP ${anonGal.status}`);

  const freeL = await login(creds.free.email, creds.free.password);
  record("free login", freeL.ok, `HTTP ${freeL.status}`);
  const freeGal = await get(`${base}/api/dossier/${slug}/gallery/manifest`, freeL.cookie);
  record("free gallery manifest", freeGal.status === 403, `HTTP ${freeGal.status}`);

  const t1L = await login(creds.tier1.email, creds.tier1.password);
  const t1Gal = await get(`${base}/api/dossier/${slug}/gallery/manifest`, t1L.cookie);
  const t1Items = t1Gal.body?.items?.length ?? 0;
  record("tier1 gallery 5 slides", t1Gal.status === 200 && t1Items === 5, `HTTP ${t1Gal.status} items=${t1Items}`);
  if (t1Gal.body?.items?.[0]) {
    const it = t1Gal.body.items[0];
    record(
      "tier1 metadata illustrative",
      it.isIllustrative === true && it.sourceType === "ai_placeholder",
      JSON.stringify({ isIllustrative: it.isIllustrative, sourceType: it.sourceType, hasCaption: !!it.caption }),
    );
    const img = await get(`${base}/api/dossier/${slug}/gallery/${it.id}?w=640`, t1L.cookie);
    record("tier1 image proxy", img.status === 200 && img.ct.includes("image"), `HTTP ${img.status} ${img.ct}`);
  }

  const t2L = await login(creds.tier2.email, creds.tier2.password);
  const t2Gal = await get(`${base}/api/dossier/${slug}/gallery/manifest`, t2L.cookie);
  record("tier2 gallery 5 slides", t2Gal.status === 200 && (t2Gal.body?.items?.length ?? 0) === 5, `HTTP ${t2Gal.status}`);

  const t1Page = await get(`${base}/membro/dossies/${slug}`, t1L.cookie);
  const leak = ["storageKey", "?key=", "CM_ADMIN_SYNC", "private.blob.vercel"].some((s) =>
    String(t1Page.body).includes(s),
  );
  record("tier1 HTML no storage leak", !leak, leak ? "found sensitive substring" : "clean");

  const adminGal = await get(`${base}/api/admin/gallery/${slug}/manifest`, freeL.cookie);
  record("non-admin admin gallery GET", adminGal.status === 403 || adminGal.status === 401, `HTTP ${adminGal.status}`);

  const adminGalOk = await get(`${base}/api/admin/gallery/${slug}/manifest`, t2L.cookie);
  record("admin gallery GET", adminGalOk.status === 200, `HTTP ${adminGalOk.status}`);

  const badOrigin = await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
    method: "PATCH",
    headers: hdr({
      Cookie: t2L.cookie,
      "Content-Type": "application/json",
      Origin: "https://evil.example",
      Host: new URL(base).host,
    }),
    body: JSON.stringify({ items: [], action: "save_draft" }),
  });
  record("admin PATCH cross-origin", badOrigin.status === 403, `HTTP ${badOrigin.status}`);

  const badPayload = await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
    method: "PATCH",
    headers: hdr({ Cookie: t2L.cookie, "Content-Type": "application/json" }),
    body: JSON.stringify({ action: "not_valid" }),
  });
  record("admin PATCH invalid payload", badPayload.status === 400, `HTTP ${badPayload.status}`);

  const fd = new FormData();
  fd.set("files", new Blob([Buffer.from("not-an-image")], { type: "text/plain" }), "x.txt");
  const badUpload = await fetch(`${base}/api/admin/gallery/${slug}/upload`, {
    method: "POST",
    headers: hdr({ Cookie: t2L.cookie }),
    body: fd,
  });
  record("admin upload non-image", badUpload.status === 400, `HTTP ${badUpload.status}`);

  const fails = results.filter((r) => !r.pass).length;
  console.log("\nSummary:", results.length - fails, "/", results.length, "passed");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
