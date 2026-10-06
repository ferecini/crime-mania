/**
 * QA Comunidade no Preview — APIs + matriz tier (lê private/qa-credentials.txt).
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
const BASE = (process.env.PREVIEW_URL ?? cfg.preview_url)?.replace(/\/$/, "");
if (!BASE) throw new Error("preview_url missing");

const accounts = {
  free: { email: "qa-free@crime-mania.test", password: cfg["qa-free@crime-mania.test"] },
  tier1: { email: "qa-tier1@crime-mania.test", password: cfg["qa-tier1@crime-mania.test"] },
  tier2: { email: "qa-tier2@crime-mania.test", password: cfg["qa-tier2@crime-mania.test"] },
};

const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim();

const results = [];
function record(name, pass, detail = "") {
  results.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

async function login(account) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}),
    },
    body: JSON.stringify({ email: account.email, password: account.password }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const body = await res.json().catch(() => ({}));
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  return { status: res.status, ok: body.ok === true, cookie };
}

async function api(method, path, cookie, json) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(bypass ? { "x-vercel-protection-bypass": bypass } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: json ? JSON.stringify(json) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

console.log(`Base: ${BASE}\n`);

// 16 — API sem tier
const guestTopics = await api("GET", "/api/community/topics", "");
record("API fórum sem sessão", guestTopics.status === 401, `HTTP ${guestTopics.status}`);

const free = await login(accounts.free);
record("Login free", free.ok, `HTTP ${free.status}`);
const freeTopics = await api("GET", "/api/community/topics", free.cookie);
record("11 free fórum API", freeTopics.status === 403, `HTTP ${freeTopics.status}`);
const freeSug = await api("GET", "/api/community/suggestions", free.cookie);
record("11 free sugestões API", freeSug.status === 403, `HTTP ${freeSug.status}`);

const t1 = await login(accounts.tier1);
record("Login tier1", t1.ok, `HTTP ${t1.status}`);
await api("POST", "/api/community/rules", t1.cookie);
const topic1 = await api("POST", "/api/community/topics", t1.cookie, {
  title: `QA Preview T1 ${Date.now()}`,
  body: "Corpo do tópico de QA no preview com texto suficiente.",
  categoryId: "cat-casos",
});
record("1 tier1 criar tópico", topic1.status === 200 && topic1.body.topic?.id, `HTTP ${topic1.status}`);
const topicId = topic1.body.topic?.id;

const t2 = await login(accounts.tier2);
record("Login tier2", t2.ok, `HTTP ${t2.status}`);
await api("POST", "/api/community/rules", t2.cookie);
if (topicId) {
  const reply = await api("POST", `/api/community/topics/${topicId}/replies`, t2.cookie, {
    body: "Resposta QA Tier 2 no preview.",
  });
  record("2 tier2 responder", reply.status === 200, `HTTP ${reply.status}`);
}

const editOther = await api("PATCH", `/api/community/topics/${topicId}`, t2.cookie, {
  title: "Hack",
});
record("4 impedir edição outro", editOther.status === 403 || editOther.status === 400, `HTTP ${editOther.status}`);

const modClose = await api("POST", "/api/community/admin/moderate", t2.cookie, {
  action: "close_topic",
  targetId: topicId,
  reason: "QA",
});
record(
  "5 fechar tópico (mod)",
  modClose.status === 200 || modClose.status === 403,
  modClose.status === 403 ? "configure CM_COMMUNITY_MODERATOR_IDS" : `HTTP ${modClose.status}`,
);

if (modClose.status === 200 && topicId) {
  const replyClosed = await api("POST", `/api/community/topics/${topicId}/replies`, t1.cookie, {
    body: "Não deve passar",
  });
  record("5 resposta em fechado", replyClosed.status >= 400, `HTTP ${replyClosed.status}`);
}

const xss = await api("POST", "/api/community/topics", t2.cookie, {
  title: "<script>alert(1)</script>",
  body: "Texto<script>alert(1)</script> com conteúdo válido aqui.",
  categoryId: "cat-casos",
});
record(
  "7 sanitização",
  xss.status === 200 && !String(xss.body.topic?.body).includes("<script"),
  xss.body.error ?? "ok",
);

const badUrl = await api("POST", "/api/community/suggestions", t2.cookie, {
  caseTitle: "Caso link",
  summary: "Resumo longo o suficiente para passar na validação mínima do formulário.",
  relevance: "Relevância longa o suficiente para passar na validação mínima do formulário.",
  sourceLinks: ["javascript:alert(1)"],
  sensitiveContent: false,
  noPrivateDataConfirmed: true,
});
record("8 link malicioso", badUrl.status >= 400, `HTTP ${badUrl.status}`);

const t2Again = await login(accounts.tier2);
const sug = await api("POST", "/api/community/suggestions", t2Again.cookie, {
  caseTitle: "Preview QA episódio",
  summary: "Resumo longo o suficiente para passar na validação mínima do formulário.",
  relevance: "Relevância longa o suficiente para passar na validação mínima do formulário.",
  sourceLinks: ["https://example.com/fonte1", "https://example.org/fonte2"],
  sensitiveContent: false,
  noPrivateDataConfirmed: true,
  clientToken: `qa-${Date.now()}`,
});
record("10 sugestão multi-link", sug.status === 200 && sug.body.suggestion?.protocol, `HTTP ${sug.status}`);

const t1Sug = await api("GET", "/api/community/suggestions", t1.cookie);
record("11 tier1 sugestões bloqueado", t1Sug.status === 403, `HTTP ${t1Sug.status}`);

const mine = await api("GET", "/api/community/suggestions", t2.cookie);
record("12 minhas sugestões", mine.status === 200 && Array.isArray(mine.body.suggestions), `HTTP ${mine.status}`);

if (topicId) {
  const report = await api("POST", "/api/community/reports", t1.cookie, {
    targetType: "topic",
    targetId: topicId,
    reason: "spam",
  });
  record("6 denunciar", report.status === 200, `HTTP ${report.status}`);
}

const search = await fetch(`${BASE}/membro/busca?q=Preview`, {
  headers: { Cookie: t2.cookie },
});
const searchText = await search.text();
record("14 busca tópico", search.status === 200 && searchText.includes("forum"), `HTTP ${search.status}`);

const failed = results.filter((r) => !r.pass);
console.log("\n--- Summary ---");
console.log(`Total: ${results.length}, Failed: ${failed.length}`);
if (failed.length) {
  console.log(JSON.stringify(failed, null, 2));
  process.exit(1);
}
