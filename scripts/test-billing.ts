/**
 * Testes de billing (estado + webhook parsing). Sem Postgres por padrão.
 * Integração DB: POSTGRES_URL=... npx tsx scripts/test-billing.ts --integration
 */
import assert from "node:assert/strict";
import {
  ASAAS_WEBHOOK_EVENTS_ALLOWLIST,
  COMMERCIAL_PLANS,
  PAST_DUE_GRACE_DAYS,
} from "../src/lib/billing/config";
import {
  nextStatusOnPaymentConfirmed,
  periodEndFromCycle,
  resolveTierFromSubscription,
} from "../src/lib/billing/state";
import {
  isWebhookEventAllowed,
  parseAsaasWebhookBody,
} from "../src/lib/billing/webhook-service";
import type { BillingSubscriptionRow } from "../src/lib/billing/types";
import { billingCheckoutEnabled } from "../src/lib/features";
import { billingQaTestModeEnabled } from "../src/lib/features";
import { canUseBillingQaTest, makeBillingQaResult } from "../src/lib/billing/qa-test";
import { QA_USER_IDS } from "../src/lib/auth/qa-users";
import { assertSameOrigin } from "../src/lib/http/same-origin";

function sub(partial: Partial<BillingSubscriptionRow> & { id: string; user_id: string }): BillingSubscriptionRow {
  return {
    plan_id: "tier1-monthly",
    billing_cycle: "monthly",
    status: "active",
    provider_subscription_id: null,
    provider_customer_id: "cus",
    payment_id: null,
    price_cents: 900,
    currency: "BRL",
    current_period_start: new Date().toISOString(),
    current_period_end: new Date(Date.now() + 86400000 * 30).toISOString(),
    cancel_at_period_end: false,
    canceled_at: null,
    past_due_since: null,
    ...partial,
  };
}

console.log("billing catalog…");
assert.equal(COMMERCIAL_PLANS["tier2-yearly"].priceCents, 15900);
assert.equal(COMMERCIAL_PLANS["tier1-monthly"].priceCents, 900);

console.log("pending blocks access…");
assert.equal(
  resolveTierFromSubscription(sub({ status: "pending" })).tier,
  "none",
);

console.log("active tier1…");
assert.equal(
  resolveTierFromSubscription(sub({ status: "active", plan_id: "tier1-monthly" })).tier,
  "tier1",
);

console.log("past_due grace…");
const graceStart = new Date();
graceStart.setUTCDate(graceStart.getUTCDate() - 2);
assert.equal(
  resolveTierFromSubscription(
    sub({
      status: "past_due",
      plan_id: "tier2-monthly",
      past_due_since: graceStart.toISOString(),
    }),
  ).tier,
  "tier2",
);

console.log("past_due beyond grace…");
const oldDue = new Date();
oldDue.setUTCDate(oldDue.getUTCDate() - (PAST_DUE_GRACE_DAYS + 1));
assert.equal(
  resolveTierFromSubscription(
    sub({
      status: "past_due",
      past_due_since: oldDue.toISOString(),
    }),
  ).blocked,
  true,
);

console.log("cancel at period end keeps access…");
const futureEnd = new Date(Date.now() + 86400000 * 10).toISOString();
assert.equal(
  resolveTierFromSubscription(
    sub({
      status: "active",
      cancel_at_period_end: true,
      current_period_end: futureEnd,
    }),
  ).tier,
  "tier1",
);

console.log("chargeback revokes…");
assert.equal(
  resolveTierFromSubscription(sub({ status: "chargeback" })).tier,
  "none",
);

console.log("webhook allowlist…");
assert.ok(isWebhookEventAllowed("PAYMENT_CONFIRMED"));
assert.ok(!isWebhookEventAllowed("UNKNOWN_EVENT"));
assert.ok(ASAAS_WEBHOOK_EVENTS_ALLOWLIST.has("SUBSCRIPTION_DELETED"));

console.log("parse webhook body…");
const parsed = parseAsaasWebhookBody({
  event: "PAYMENT_CONFIRMED",
  payment: { id: "pay_1", subscription: "sub_asaas", status: "CONFIRMED", value: 9 },
});
assert.ok(parsed?.eventId);
assert.equal(parsed?.eventType, "PAYMENT_CONFIRMED");

console.log("period end monthly…");
const start = new Date("2026-01-15T12:00:00.000Z");
const end = periodEndFromCycle(start, "monthly");
assert.equal(end.getUTCMonth(), 1);

console.log("payment confirmed status…");
assert.equal(nextStatusOnPaymentConfirmed("pending"), "active");

async function integration() {
  if (!process.argv.includes("--integration")) return;
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    console.warn("skip integration — no POSTGRES_URL");
    return;
  }
  const { recordBillingEvent } = await import("../src/lib/billing/db");
  const id = `test_evt_${Date.now()}`;
  const first = await recordBillingEvent({
    id,
    eventType: "PAYMENT_CONFIRMED",
    payload: { test: true },
  });
  const second = await recordBillingEvent({
    id,
    eventType: "PAYMENT_CONFIRMED",
    payload: { test: true },
  });
  assert.equal(first, true);
  assert.equal(second, false);
  console.log("integration idempotency OK");
}

function securityGates() {
  console.log("billingCheckoutEnabled gate…");
  const prevServer = process.env.BILLING_ENABLED;
  const prevPublic = process.env.NEXT_PUBLIC_BILLING_ENABLED;
  process.env.BILLING_ENABLED = "false";
  process.env.NEXT_PUBLIC_BILLING_ENABLED = "true";
  assert.equal(billingCheckoutEnabled(), false);
  process.env.BILLING_ENABLED = "true";
  process.env.NEXT_PUBLIC_BILLING_ENABLED = "false";
  assert.equal(billingCheckoutEnabled(), false);
  process.env.BILLING_ENABLED = "true";
  process.env.NEXT_PUBLIC_BILLING_ENABLED = "true";
  assert.equal(billingCheckoutEnabled(), true);
  process.env.BILLING_ENABLED = prevServer;
  process.env.NEXT_PUBLIC_BILLING_ENABLED = prevPublic;

  console.log("QA billing test gate…");
  const prevQaMode = process.env.BILLING_QA_TEST_MODE;
  process.env.BILLING_QA_TEST_MODE = "false";
  assert.equal(billingQaTestModeEnabled(), false);
  process.env.BILLING_QA_TEST_MODE = "true";
  assert.equal(billingQaTestModeEnabled(), true);
  assert.equal(canUseBillingQaTest({ userId: QA_USER_IDS.free, isTestUser: true }), true);
  assert.equal(canUseBillingQaTest({ userId: QA_USER_IDS.free, isTestUser: false }), false);
  assert.equal(canUseBillingQaTest({ userId: crypto.randomUUID(), isTestUser: true }), false);
  const qaResult = makeBillingQaResult("tier2-yearly");
  assert.equal(qaResult.priceCents, 15900);
  assert.equal(qaResult.simulated, true);
  process.env.BILLING_QA_TEST_MODE = prevQaMode;

  console.log("same-origin helper…");
  assert.equal(
    assertSameOrigin(
      new Request("https://crime-mania.vercel.app/api/billing/checkout", {
        method: "POST",
        headers: { origin: "https://crime-mania.vercel.app" },
      }),
    ),
    true,
  );
  assert.equal(
    assertSameOrigin(
      new Request("https://crime-mania.vercel.app/api/billing/checkout", {
        method: "POST",
        headers: { origin: "https://evil.example" },
      }),
    ),
    false,
  );
}

async function main() {
  securityGates();
  await integration();
  console.log("test-billing: all passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
