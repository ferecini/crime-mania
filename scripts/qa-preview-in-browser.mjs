/**
 * Gera relatório QA via login API no Preview (funciona quando não há Deployment Protection no fetch).
 * Usa credenciais em private/qa-credentials.txt
 */
import fs from "node:fs";
import path from "node:path";

const base = process.argv[2] ?? "https://crime-mania-1b2rcxohr-investwise.vercel.app";
const slug = "familia-banfield";
const reportPath = path.join(process.cwd(), "private/qa-screenshots/gallery-qa-2026-10-06/http-report.json");

function readCreds() {
  const raw = fs.readFileSync(path.join(process.cwd(), "private/qa-credentials.txt"), "utf8");
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
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const cookie = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, cookie, ok: res.ok };
}

async function jfetch(url, cookie, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: { ...(init.headers ?? {}), ...(cookie ? { Cookie: cookie } : {}) },
  });
  const ct = res.headers.get("content-type") ?? "";
  let body = null;
  if (ct.includes("json")) body = await res.json().catch(() => null);
  else body = await res.text();
  return { status: res.status, ct, body };
}

const creds = readCreds();
const report = { base, at: new Date().toISOString(), tests: [] };
const push = (name, pass, detail) => report.tests.push({ name, pass, detail });

const anon = await jfetch(`${base}/api/dossier/${slug}/gallery/manifest`, "");
push("anon gallery manifest 403", anon.status === 403, anon.status);

const freeL = await login(creds.free.email, creds.free.password);
push("free login", freeL.ok, freeL.status);
const freeG = await jfetch(`${base}/api/dossier/${slug}/gallery/manifest`, freeL.cookie);
push("free gallery 403", freeG.status === 403, freeG.status);
const freeImg = await jfetch(`${base}/api/dossier/${slug}/gallery/fake-id`, freeL.cookie);
push("free image 403", freeImg.status === 403 || freeImg.status === 404, freeImg.status);

const t1L = await login(creds.tier1.email, creds.tier1.password);
const t1G = await jfetch(`${base}/api/dossier/${slug}/gallery/manifest`, t1L.cookie);
push("tier1 gallery 200 x5", t1G.status === 200 && t1G.body?.items?.length === 5, `${t1G.status} n=${t1G.body?.items?.length}`);
const t2L = await login(creds.tier2.email, creds.tier2.password);
const t2G = await jfetch(`${base}/api/dossier/${slug}/gallery/manifest`, t2L.cookie);
push("tier2 gallery 200 x5", t2G.status === 200 && t2G.body?.items?.length === 5, `${t2G.status} n=${t2G.body?.items?.length}`);

const t1Html = await jfetch(`${base}/membro/dossies/${slug}`, t1L.cookie);
const leak = ["storageKey", "private.blob.vercel", "?key=", "CM_ADMIN_SYNC"].filter((s) =>
  String(t1Html.body).includes(s),
);
push("tier1 HTML leak-free", leak.length === 0, leak.join(",") || "ok");

const nonAdmin = await jfetch(`${base}/api/admin/gallery/${slug}/manifest`, freeL.cookie);
push("non-admin GET admin gallery", nonAdmin.status === 403 || nonAdmin.status === 401, nonAdmin.status);

const adminGet = await jfetch(`${base}/api/admin/gallery/${slug}/manifest`, t2L.cookie);
push("admin gallery GET", adminGet.status === 200, adminGet.status);

const host = new URL(base).host;
const xorig = await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
  method: "PATCH",
  headers: { Cookie: t2L.cookie, "Content-Type": "application/json", Origin: "https://evil.test", Host: host },
  body: JSON.stringify({ items: adminGet.body?.manifest?.items ?? [], action: "save_draft" }),
});
push("cross-origin PATCH", xorig.status === 403, xorig.status);

const badPayload = await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
  method: "PATCH",
  headers: { Cookie: t2L.cookie, "Content-Type": "application/json" },
  body: JSON.stringify({ action: "nope" }),
});
push("invalid payload", badPayload.status === 400, badPayload.status);

// Admin workflow: 6th image, publish, verify, delete 6th, publish restore
let manifest = adminGet.body?.manifest ?? { dossierSlug: slug, items: [], version: 1 };
const pngB64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const pngBuf = Buffer.from(pngB64, "base64");
const fd = new FormData();
fd.set("files", new Blob([pngBuf], { type: "image/png" }), "qa-temp-sixth.png");
const up = await fetch(`${base}/api/admin/gallery/${slug}/upload`, {
  method: "POST",
  headers: { Cookie: t2L.cookie },
  body: fd,
});
const upJ = await up.json().catch(() => ({}));
push("admin upload 6th", up.status === 200, up.status);
manifest = upJ.manifest ?? manifest;
const sixthId = upJ.added?.[0];
if (sixthId) {
  manifest.items = manifest.items.map((it) =>
    it.id === sixthId
      ? { ...it, caption: "QA temp sixth", alt: "QA alt sixth", credit: "QA credit", isIllustrative: true, sourceType: "ai_placeholder" }
      : it,
  );
  const moved = manifest.items.filter((it) => it.id !== sixthId);
  moved.push(manifest.items.find((it) => it.id === sixthId));
  manifest.items = moved.map((it, i) => ({ ...it, order: i + 1 }));
  manifest.coverImageId = sixthId;
  await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
    method: "PATCH",
    headers: { Cookie: t2L.cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ items: manifest.items, coverImageId: manifest.coverImageId, action: "save_draft" }),
  });
  await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
    method: "PATCH",
    headers: { Cookie: t2L.cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ items: manifest.items, coverImageId: manifest.coverImageId, action: "publish" }),
  });
  const pub6 = await jfetch(`${base}/api/dossier/${slug}/gallery/manifest`, t1L.cookie);
  push("reader after 6th publish", pub6.status === 200 && pub6.body?.items?.length === 6, `${pub6.status} n=${pub6.body?.items?.length}`);
  await fetch(`${base}/api/admin/gallery/${slug}/items/${sixthId}`, {
    method: "DELETE",
    headers: { Cookie: t2L.cookie },
  });
  const restored = manifest.items.filter((it) => it.id !== sixthId).map((it, i) => ({ ...it, order: i + 1 }));
  manifest.coverImageId = restored[0]?.id;
  await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
    method: "PATCH",
    headers: { Cookie: t2L.cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ items: restored, coverImageId: manifest.coverImageId, action: "publish" }),
  });
  const pub5 = await jfetch(`${base}/api/dossier/${slug}/gallery/manifest`, t1L.cookie);
  push("reader restored 5 items", pub5.status === 200 && pub5.body?.items?.length === 5, `${pub5.status} n=${pub5.body?.items?.length}`);
}

// unpublish/publish
await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
  method: "PATCH",
  headers: { Cookie: t2L.cookie, "Content-Type": "application/json" },
  body: JSON.stringify({ items: (await jfetch(`${base}/api/admin/gallery/${slug}/manifest`, t2L.cookie)).body?.manifest?.items ?? [], action: "unpublish" }),
});
const unpub = await jfetch(`${base}/api/dossier/${slug}/gallery/manifest`, t1L.cookie);
push("after unpublish member 503/403", unpub.status === 503 || unpub.status === 403, unpub.status);
await fetch(`${base}/api/admin/gallery/${slug}/manifest`, {
  method: "PATCH",
  headers: { Cookie: t2L.cookie, "Content-Type": "application/json" },
  body: JSON.stringify({
    items: (await jfetch(`${base}/api/admin/gallery/${slug}/manifest`, t2L.cookie)).body?.manifest?.items ?? [],
    action: "publish",
  }),
});
const repub = await jfetch(`${base}/api/dossier/${slug}/gallery/manifest`, t1L.cookie);
push("after republish 5 items", repub.status === 200 && repub.body?.items?.length === 5, `${repub.status} n=${repub.body?.items?.length}`);

const fdBad = new FormData();
fdBad.set("files", new Blob(["not-image"], { type: "text/plain" }), "x.txt");
const badUp = await fetch(`${base}/api/admin/gallery/${slug}/upload`, {
  method: "POST",
  headers: { Cookie: t2L.cookie },
  body: fdBad,
});
push("upload non-image 400", badUp.status === 400, badUp.status);

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
const fails = report.tests.filter((t) => !t.pass).length;
console.log(JSON.stringify(report, null, 2));
process.exit(fails ? 1 : 0);
