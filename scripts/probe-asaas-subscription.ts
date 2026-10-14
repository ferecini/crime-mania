/**
 * One-off probe: POST /subscriptions with current env (no secrets logged).
 * Usage: vercel env run --environment production -- npx tsx scripts/probe-asaas-subscription.ts
 */
async function main() {
  const env = process.env.ASAAS_ENVIRONMENT;
  const base =
    env === "production"
      ? "https://api.asaas.com/v3"
      : "https://api-sandbox.asaas.com/v3";
  const key = process.env.ASAAS_API_KEY?.trim();
  console.log("ASAAS_ENVIRONMENT:", env);
  console.log("API base:", base);
  console.log("KEY length:", key?.length ?? 0);

  async function asaas(path: string, init?: RequestInit) {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        access_token: key!,
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 500) };
    }
    return { status: res.status, ok: res.ok, json };
  }

  const my = await asaas("/myAccount", { method: "GET" });
  console.log("myAccount:", my.status, JSON.stringify(my.json).slice(0, 400));

  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
  console.log("today BR:", today);

  const cust = await asaas("/customers", {
    method: "POST",
    body: JSON.stringify({
      name: `CM Probe ${Date.now()}`,
      email: `cm-probe-${Date.now()}@crime-mania.test`,
      externalReference: `probe-${Date.now()}`,
    }),
  });
  console.log("customer:", cust.status, JSON.stringify(cust.json));

  const customerId = (cust.json as { id?: string })?.id;
  if (!customerId) return;

  const subBody = {
    customer: customerId,
    billingType: "UNDEFINED",
    value: 9,
    nextDueDate: today,
    cycle: "MONTHLY",
    description: "Crime Mania — tier1-monthly",
    externalReference: crypto.randomUUID(),
    callback: {
      successUrl: "https://crime-mania.vercel.app/membro/conta?checkout=success",
      autoRedirect: true,
    },
  };
  const sub = await asaas("/subscriptions", {
    method: "POST",
    body: JSON.stringify(subBody),
  });
  console.log("subscription:", sub.status, JSON.stringify(sub.json, null, 2));

  const subId = (sub.json as { id?: string })?.id;
  if (subId) {
    await asaas(`/subscriptions/${subId}`, { method: "DELETE" });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
