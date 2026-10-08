import { NextResponse } from "next/server";
import { isServerBillingEnabled } from "@/lib/billing/config";
import { processAsaasWebhook } from "@/lib/billing/webhook-service";

function verifyWebhookToken(request: Request): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN?.trim();
  if (!expected) return false;
  const header =
    request.headers.get("asaas-access-token") ??
    request.headers.get("x-asaas-token") ??
    request.headers.get("authorization");
  if (!header) return false;
  const token = header.replace(/^Bearer\s+/i, "").trim();
  return token === expected;
}

export async function POST(request: Request) {
  if (!isServerBillingEnabled()) {
    return NextResponse.json({ ok: true, skipped: "billing_disabled" });
  }

  if (!verifyWebhookToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  try {
    const result = await processAsaasWebhook(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "processing_failed" }, { status: 422 });
    }
    return NextResponse.json({ ok: true, duplicate: result.duplicate ?? false });
  } catch {
    return NextResponse.json({ ok: true, deferred: true });
  }
}
