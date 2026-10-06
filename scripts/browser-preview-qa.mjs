/**
 * Emite expressão JS para Runtime.evaluate no Preview (já autenticado no SSO Vercel).
 * Não imprime senhas — só JSON de resultados quando executado no browser.
 */
import fs from "node:fs";
import path from "node:path";

const credPath = path.join(process.cwd(), "private", "qa-credentials.txt");
const raw = fs.readFileSync(credPath, "utf8");
const cfg = Object.fromEntries(
  raw
    .split("\n")
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i), l.slice(i + 1)];
    }),
);

const accounts = {
  free: {
    email: "qa-free@crime-mania.test",
    password: cfg["qa-free@crime-mania.test"],
  },
  tier1: {
    email: "qa-tier1@crime-mania.test",
    password: cfg["qa-tier1@crime-mania.test"],
  },
  tier2: {
    email: "qa-tier2@crime-mania.test",
    password: cfg["qa-tier2@crime-mania.test"],
  },
};

const payload = JSON.stringify(accounts);
const out = `(async()=>{
const accounts = ${payload};
const results = [];
const record = (name, pass, detail) => results.push({ name, pass, detail: detail ?? "" });
async function login(acc) {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
  const res = await fetch("/api/auth/login", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: acc.email, password: acc.password }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, ok: body.ok === true };
}
async function get(path) {
  const res = await fetch(path, { credentials: "include" });
  const text = await res.text();
  return { status: res.status, text };
}
async function post(path, json) {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(json),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
const pdfGuest = await fetch("/api/media/dossier/familia-banfield");
record("API PDF sem sessão", pdfGuest.status === 401 || pdfGuest.status === 403, "HTTP " + pdfGuest.status);
for (const [slot, acc] of Object.entries(accounts)) {
  const session = await login(acc);
  record("Login " + slot, session.ok && session.status === 200, "HTTP " + session.status);
  if (!session.ok) continue;
  const membro = await get("/membro");
  record("Greeting " + slot, membro.text.includes("QA"), membro.text.slice(0, 120));
  const dossierApi = await get("/api/media/dossier/familia-banfield");
  const episodios = await get("/membro/episodios");
  const arquivo = await get("/membro/arquivo");
  const juris = await get("/membro/juris");
  const forum = await get("/membro/comunidade/forum");
  const sugira = await get("/membro/comunidade/sugira");
  const shop = await get("/membro/shop");
  const busca = await get("/membro/busca?q=banfield");
  const subscribe = await post("/api/subscribe", { planId: "tier2-monthly" });
  const premium = (t) => t.includes("Conteúdo premium") || t.includes("PaywallCard") || t.includes("Conheça os planos");
  const episBlocked = premium(episodios.text);
  const arquivoBlocked = premium(arquivo.text);
  const jurisBlocked = premium(juris.text);
  const forumOpen = forum.status === 200 && !premium(forum.text);
  const sugiraOpen = sugira.status === 200 && !premium(sugira.text);
  const shopDiscount = shop.text.includes("15%") || shop.text.toLowerCase().includes("desconto");
  const buscaTier2Leak = busca.text.includes("Tier 2") && busca.text.includes("desbloqueado");
  if (slot === "free") {
    record("free PDF Banfield", dossierApi.status === 403, "HTTP " + dossierApi.status);
    record("free episódios premium bloqueados", episBlocked, episBlocked ? "paywall" : "leak");
    record("free arquivo bloqueado", arquivoBlocked, arquivoBlocked ? "paywall" : "leak");
    record("free juris bloqueado", jurisBlocked, jurisBlocked ? "paywall" : "leak");
    record("free fórum bloqueado", !forumOpen, !forumOpen ? "blocked" : "leak");
    record("free sugira bloqueado", !sugiraOpen, !sugiraOpen ? "blocked" : "leak");
    record("free shop sem desconto", !shopDiscount, !shopDiscount ? "ok" : "unexpected");
    record("free subscribe API", subscribe.status === 403, "HTTP " + subscribe.status);
    record("free busca", !buscaTier2Leak, "sem vazamento tier2");
  }
  if (slot === "tier1") {
    record("tier1 PDF Banfield", dossierApi.status === 200, "HTTP " + dossierApi.status);
    record("tier1 episódios premium bloqueados", episBlocked, episBlocked ? "paywall" : "leak");
    record("tier1 arquivo bloqueado", arquivoBlocked, arquivoBlocked ? "paywall" : "leak");
    record("tier1 juris bloqueado", jurisBlocked, jurisBlocked ? "paywall" : "leak");
    record("tier1 fórum liberado", forumOpen, forumOpen ? "ok" : "blocked");
    record("tier1 sugira bloqueado", !sugiraOpen, !sugiraOpen ? "blocked" : "leak");
    record("tier1 shop desconto", shopDiscount, shopDiscount ? "ok" : "missing");
    record("tier1 subscribe API", subscribe.status === 403, "HTTP " + subscribe.status);
    record("tier1 busca sem tier2", !buscaTier2Leak, "busca");
    const dossierPage = await get("/membro/dossies/familia-banfield");
    record("tier1 dossiê Banfield", dossierPage.text.includes("/api/media/dossier") || dossierPage.text.includes("Galeria"), "page");
    record("tier1 juris no dossiê upgrade", dossierPage.text.includes("upgrade") || dossierPage.text.includes("Tier 2"), "sem mídia juris");
  }
  if (slot === "tier2") {
    record("tier2 PDF Banfield", dossierApi.status === 200, "HTTP " + dossierApi.status);
    record("tier2 episódios premium", !episBlocked, !episBlocked ? "ok" : "blocked");
    record("tier2 arquivo", !arquivoBlocked, !arquivoBlocked ? "ok" : "blocked");
    record("tier2 juris", !jurisBlocked || juris.text.includes("em preparação"), jurisBlocked ? "paywall" : "ok/empty");
    record("tier2 fórum", forumOpen, forumOpen ? "ok" : "blocked");
    record("tier2 sugira", sugiraOpen, sugiraOpen ? "ok" : "blocked");
    record("tier2 shop desconto", shopDiscount, shopDiscount ? "ok" : "missing");
    record("tier2 subscribe API", subscribe.status === 403, "HTTP " + subscribe.status);
  }
  const logout = await post("/api/auth/logout", {});
  record("logout " + slot, logout.status === 200, "HTTP " + logout.status);
}
const pub = await fetch("/episodios");
record("episódios públicos guest", pub.status === 200, "HTTP " + pub.status);
return results;
})()`;

process.stdout.write(out);
