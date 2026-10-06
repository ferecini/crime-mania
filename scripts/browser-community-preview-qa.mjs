/**
 * Expressão JS para Runtime.evaluate no Preview (sessão Vercel SSO já ok no browser).
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
  free: { email: "qa-free@crime-mania.test", password: cfg["qa-free@crime-mania.test"] },
  tier1: { email: "qa-tier1@crime-mania.test", password: cfg["qa-tier1@crime-mania.test"] },
  tier2: { email: "qa-tier2@crime-mania.test", password: cfg["qa-tier2@crime-mania.test"] },
};

const payload = JSON.stringify(accounts);
const out = `(async()=>{
const accounts = ${payload};
const results = [];
const record = (name, pass, detail) => results.push({ name, pass, detail: String(detail ?? "") });
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
async function api(method, path, json) {
  const res = await fetch(path, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: json ? JSON.stringify(json) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}
const t1 = await login(accounts.tier1);
record("Login tier1", t1.ok, t1.status);
await api("POST", "/api/community/rules");
const topicRes = await api("POST", "/api/community/topics", {
  title: "QA Browser T1 " + Date.now(),
  body: "Corpo do tópico QA via browser preview com texto suficiente.",
  categoryId: "cat-casos",
});
record("1 criar tópico T1", topicRes.status === 200, topicRes.status);
const topicId = topicRes.body.topic?.id;
const t2 = await login(accounts.tier2);
record("Login tier2", t2.ok, t2.status);
await api("POST", "/api/community/rules");
if (topicId) {
  const reply = await api("POST", "/api/community/topics/" + topicId + "/replies", { body: "Resposta T2 browser QA." });
  record("2 responder T2", reply.status === 200, reply.status);
  const hack = await api("PATCH", "/api/community/topics/" + topicId, { title: "Hack" });
  record("4 editar outro bloqueado", hack.status === 403 || hack.status === 400, hack.status);
  const close = await api("POST", "/api/community/admin/moderate", { action: "close_topic", targetId: topicId, reason: "QA" });
  record("5 fechar tópico mod", close.status === 200, close.status);
  if (close.status === 200) {
    const closedReply = await api("POST", "/api/community/topics/" + topicId + "/replies", { body: "fail" });
    record("5 bloqueio resposta", closedReply.status >= 400, closedReply.status);
  }
  await login(accounts.tier1);
  await api("POST", "/api/community/rules");
  const rep = await api("POST", "/api/community/reports", { targetType: "topic", targetId: topicId, reason: "spam" });
  record("6 denunciar", rep.status === 200, rep.status);
}
const xss = await api("POST", "/api/community/topics", {
  title: "<script>x</script>",
  body: "ok<script>alert(1)</script> texto válido aqui.",
  categoryId: "cat-casos",
});
record("7 sanitização", xss.status === 200 && !String(xss.body.topic?.body).includes("<script"), xss.body.error || "ok");
const sug = await api("POST", "/api/community/suggestions", {
  caseTitle: "Browser QA caso",
  summary: "Resumo longo o suficiente para passar na validação mínima do formulário.",
  relevance: "Relevância longa o suficiente para passar na validação mínima do formulário.",
  sourceLinks: ["https://example.com/a", "https://example.org/b"],
  sensitiveContent: false,
  noPrivateDataConfirmed: true,
  clientToken: "browser-" + Date.now(),
});
record("10 sugestão T2", sug.status === 200, sug.body.suggestion?.protocol || sug.status);
await login(accounts.tier1);
const t1sug = await api("GET", "/api/community/suggestions");
record("11 T1 sug bloqueado", t1sug.status === 403, t1sug.status);
await login(accounts.free);
const freeForum = await api("GET", "/api/community/topics");
record("free fórum API", freeForum.status === 403, freeForum.status);
const forumPage = await fetch("/membro/comunidade/forum", { credentials: "include" });
const forumText = await forumPage.text();
record("free fórum UI paywall", forumText.includes("Conteúdo premium") || forumText.includes("PaywallCard"), forumPage.status);
return results;
})()`;

process.stdout.write(out);
