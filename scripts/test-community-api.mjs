/**
 * QA local da comunidade (file store). Requer dev server + contas QA logadas via curl cookies manual.
 * Uso rápido: node scripts/test-community-api.mjs --base http://localhost:3000
 */
const base = process.argv.includes("--base")
  ? process.argv[process.argv.indexOf("--base") + 1]
  : "http://localhost:3000";

async function j(method, path, body) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

console.log("Community API smoke (unauthenticated expects 401/403)...");
for (const path of ["/api/community/topics", "/api/community/suggestions"]) {
  const r = await j("GET", path);
  console.log(path, r.status, r.data.error ?? "ok");
}
console.log("Configure POSTGRES_URL + npm run community:migrate na Vercel Preview.");
