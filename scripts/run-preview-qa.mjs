/**
 * QA automatizado no Preview — lê private/qa-credentials.txt (não commitar).
 */
import fs from "node:fs";
import path from "node:path";

const credPath = path.join(process.cwd(), "private", "qa-credentials.txt");
const raw = fs.readFileSync(credPath, "utf8");
const lines = raw.split("\n").filter((l) => l && !l.startsWith("#"));
const cfg = Object.fromEntries(
  lines.map((l) => {
    const i = l.indexOf("=");
    return [l.slice(0, i), l.slice(i + 1)];
  }),
);
const BASE = cfg.preview_url?.replace(/\/$/, "");
if (!BASE) throw new Error("preview_url missing in credentials file");

const accounts = {
  free: { email: "qa-free@crime-mania.test", password: cfg["qa-free@crime-mania.test"] },
  tier1: { email: "qa-tier1@crime-mania.test", password: cfg["qa-tier1@crime-mania.test"] },
  tier2: { email: "qa-tier2@crime-mania.test", password: cfg["qa-tier2@crime-mania.test"] },
};

const results = [];

function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function login(account) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const body = await res.json().catch(() => ({}));
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, ok: body.ok === true, cookie, body };
}

async function get(path, cookie) {
  const res = await fetch(`${BASE}${path}`, {
    headers: cookie ? { Cookie: cookie } : {},
    redirect: "manual",
  });
  const text = await res.text();
  return { status: res.status, text, headers: res.headers };
}

async function post(path, cookie, json) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(json),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

// --- no session
const pdfGuest = await get("/api/media/dossier/familia-banfield");
record("API PDF sem sessão", pdfGuest.status === 403 || pdfGuest.status === 401, `HTTP ${pdfGuest.status}`);

for (const [slot, acc] of Object.entries(accounts)) {
  const session = await login(acc);
  record(`Login ${slot}`, session.ok && session.status === 200, `HTTP ${session.status}`);
  if (!session.cookie) continue;

  const dossierApi = await get("/api/media/dossier/familia-banfield", session.cookie);
  const episodios = await get("/membro/episodios", session.cookie);
  const arquivo = await get("/membro/arquivo", session.cookie);
  const juris = await get("/membro/juris", session.cookie);
  const forum = await get("/membro/comunidade/forum", session.cookie);
  const sugira = await get("/membro/comunidade/sugira", session.cookie);
  const shop = await get("/membro/shop", session.cookie);
  const busca = await get("/membro/busca?q=banfield", session.cookie);
  const subscribe = await post("/api/subscribe", session.cookie, { planId: "tier2-monthly" });

  const episBlocked = episodios.text.includes("PaywallCard") || episodios.text.includes("Conheça os planos") || episodios.text.includes("Tier 2");
  const arquivoBlocked = arquivo.text.includes("PaywallCard") || arquivo.text.includes("upgrade");
  const jurisBlocked = juris.text.includes("PaywallCard") || juris.text.includes("upgrade");
  const forumOpen = forum.status === 200 && !forum.text.includes("PaywallCard");
  const sugiraOpen = sugira.status === 200 && !sugira.text.includes("PaywallCard");
  const shopDiscount = shop.text.includes("15%") || shop.text.includes("desconto");

  if (slot === "free") {
    record("free PDF Banfield", dossierApi.status === 403, `HTTP ${dossierApi.status}`);
    record("free episódios premium", episBlocked, episBlocked ? "paywall" : "unexpected access");
    record("free arquivo", arquivoBlocked, arquivoBlocked ? "paywall" : "leak");
    record("free juris", jurisBlocked, jurisBlocked ? "paywall" : "leak");
    record("free fórum", !forumOpen, !forumOpen ? "blocked" : "leak");
    record("free sugira", !sugiraOpen, !sugiraOpen ? "blocked" : "leak");
    record("free shop desconto", !shopDiscount, !shopDiscount ? "sem benefício" : "unexpected discount");
    record("free subscribe API", subscribe.status === 403, `HTTP ${subscribe.status}`);
    record("free busca sem vazamento", !busca.text.includes("/membro/arquivo") || busca.text.includes("bloqueado"), "busca");
  }

  if (slot === "tier1") {
    record("tier1 PDF Banfield", dossierApi.status === 200, `HTTP ${dossierApi.status}`);
    record("tier1 episódios premium", episBlocked, episBlocked ? "paywall" : "leak");
    record("tier1 arquivo", arquivoBlocked, arquivoBlocked ? "paywall" : "leak");
    record("tier1 juris catálogo", jurisBlocked, jurisBlocked ? "paywall" : "leak");
    record("tier1 fórum", forumOpen, forumOpen ? "ok" : "blocked");
    record("tier1 sugira", !sugiraOpen, !sugiraOpen ? "blocked" : "leak");
    record("tier1 shop", shopDiscount, shopDiscount ? "desconto" : "missing");
    const dossierPage = await get("/membro/dossies/familia-banfield", session.cookie);
    record("tier1 juris no dossiê (upgrade)", dossierPage.text.includes("upgrade") || dossierPage.text.includes("Tier 2"), "sem player leak");
  }

  if (slot === "tier2") {
    record("tier2 PDF Banfield", dossierApi.status === 200, `HTTP ${dossierApi.status}`);
    record("tier2 episódios premium", episodios.status === 200 && !episodios.text.includes("PaywallCard"), "page ok");
    record("tier2 arquivo", arquivo.status === 200 && !arquivo.text.includes("PaywallCard"), "page ok");
    record("tier2 juris", juris.status === 200 && !juris.text.includes("PaywallCard"), "page ok");
    record("tier2 fórum", forumOpen, "ok");
    record("tier2 sugira", sugiraOpen, sugiraOpen ? "ok" : "blocked");
    record("tier2 shop", shopDiscount, shopDiscount ? "desconto" : "missing");
  }

  const logout = await post("/api/auth/logout", session.cookie, {});
  record(`logout ${slot}`, logout.status === 200 || logout.status === 204, `HTTP ${logout.status}`);
}

const publicEp = await get("/episodios");
record("episódios públicos (guest)", publicEp.status === 200, `HTTP ${publicEp.status}`);

const robots = await get("/");
record("preview noindex", (await get("/")).text.includes('noindex') || (await get("/")).headers.get("x-robots-tag")?.includes("noindex"), "robots");

const failed = results.filter((r) => !r.pass);
console.log("\n--- Summary ---");
console.log(`Total: ${results.length}, Failed: ${failed.length}`);
if (failed.length) {
  console.log(JSON.stringify(failed, null, 2));
  process.exit(1);
}
