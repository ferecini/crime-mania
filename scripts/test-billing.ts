/**
 * Testes de billing (estado + webhook parsing). Sem Postgres por padrão.
 * Integração DB: POSTGRES_URL=... npx tsx scripts/test-billing.ts --integration
 */
import assert from "node:assert/strict";
import {
  ASAAS_WEBHOOK_EVENTS_ALLOWLIST,
  COMMERCIAL_PLANS,
  PAST_DUE_GRACE_DAYS,
  billingProviderName,
  isServerBillingEnabled,
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
import { assertBillingAccountAllowed } from "../src/lib/billing/billing-account";
import { hydrateUsersStore } from "../src/lib/auth/users-store-hydrate";
import { pickPayableUrl } from "../src/lib/billing/asaas-provider";
import {
  isMissingCustomerTaxIdError,
  parseAsaasErrors,
  userMessageForAsaasErrors,
} from "../src/lib/billing/asaas-errors";
import { isValidCpfCnpj, normalizeCpfCnpj } from "../src/lib/billing/cpf-cnpj";

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
const pendingResolution = resolveTierFromSubscription(sub({ status: "pending" }));
assert.equal(pendingResolution.tier, "none");
assert.equal(pendingResolution.blocked, true);
assert.equal(pendingResolution.status, "pending");

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

console.log("Asaas payable URL selection…");
assert.equal(
  pickPayableUrl({ invoiceUrl: "https://sandbox.asaas.com/i/abc", bankSlipUrl: null }),
  "https://sandbox.asaas.com/i/abc",
);
assert.equal(
  pickPayableUrl({ invoiceUrl: "", bankSlipUrl: "https://sandbox.asaas.com/b/1" }),
  "https://sandbox.asaas.com/b/1",
);
assert.equal(pickPayableUrl({ invoiceUrl: "not-a-url" }), null);
assert.equal(pickPayableUrl({}), null);

console.log("Asaas error parsing…");
const parsedErrors = parseAsaasErrors({
  errors: [{ code: "invalid_successUrl", description: "internal detail" }],
});
assert.equal(parsedErrors[0]?.code, "invalid_successUrl");
assert.match(
  userMessageForAsaasErrors(parsedErrors, 400, "fallback"),
  /Domínio de retorno/,
);
assert.equal(
  userMessageForAsaasErrors([], 401, "fallback"),
  userMessageForAsaasErrors([{ code: "invalid_access_token" }], 401, "fallback"),
);
const taxIdErr = [
  {
    code: "invalid_object",
    description: "Para criar esta cobrança é necessário preencher o CPF ou CNPJ do cliente.",
  },
];
assert.ok(isMissingCustomerTaxIdError(taxIdErr));
assert.match(userMessageForAsaasErrors(taxIdErr, 400, "fallback"), /CPF ou CNPJ/);
assert.equal(normalizeCpfCnpj("123.456.789-09"), "12345678909");
assert.ok(isValidCpfCnpj("11144477735"));
assert.ok(!isValidCpfCnpj("11111111111"));

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

function providerConfigGates() {
  console.log("billingProviderName gates…");
  const prevEnabled = process.env.BILLING_ENABLED;
  const prevProvider = process.env.BILLING_PROVIDER;
  const prevKey = process.env.ASAAS_API_KEY;

  process.env.BILLING_ENABLED = "false";
  assert.equal(billingProviderName(), "fake");

  process.env.BILLING_ENABLED = "true";
  process.env.BILLING_PROVIDER = "fake";
  process.env.ASAAS_API_KEY = "test_key";
  assert.throws(() => billingProviderName(), /BILLING_PROVIDER/);

  process.env.BILLING_PROVIDER = "asaas";
  process.env.ASAAS_API_KEY = "";
  assert.throws(() => billingProviderName(), /ASAAS_API_KEY/);

  process.env.ASAAS_API_KEY = "test_key";
  assert.equal(billingProviderName(), "asaas");
  assert.equal(isServerBillingEnabled(), true);

  process.env.BILLING_ENABLED = prevEnabled;
  process.env.BILLING_PROVIDER = prevProvider;
  process.env.ASAAS_API_KEY = prevKey;
}

function billingAccountGuard() {
  console.log("billing account guard (OAuth / Vercel store miss)…");
  hydrateUsersStore(true);
  const oauthId = "b6663e93-54e8-430f-b76c-0626b8c6746a";
  assert.throws(
    () => assertBillingAccountAllowed(oauthId),
    /Conta não encontrada no cadastro/,
  );
  assert.doesNotThrow(() =>
    assertBillingAccountAllowed(oauthId, {
      email: "owner@example.com",
      isTestUser: false,
    }),
  );
  assert.throws(
    () =>
      assertBillingAccountAllowed(QA_USER_IDS.free, {
        email: "qa-free@crime-mania.test",
        isTestUser: true,
      }),
    /Contas de QA/,
  );
}

function securityGates() {
  billingAccountGuard();
  providerConfigGates();
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
  const prevTestUsers = process.env.ALLOW_TEST_USERS;
  process.env.ALLOW_TEST_USERS = "false";
  process.env.BILLING_QA_TEST_MODE = "false";
  assert.equal(billingQaTestModeEnabled(), false);
  process.env.BILLING_QA_TEST_MODE = "true";
  assert.equal(billingQaTestModeEnabled(), true);
  process.env.BILLING_QA_TEST_MODE = "false";
  process.env.ALLOW_TEST_USERS = "true";
  assert.equal(billingQaTestModeEnabled(), true);
  assert.equal(canUseBillingQaTest({ userId: QA_USER_IDS.free, isTestUser: true }), true);
  assert.equal(canUseBillingQaTest({ userId: QA_USER_IDS.free, isTestUser: false }), false);
  assert.equal(canUseBillingQaTest({ userId: crypto.randomUUID(), isTestUser: true }), false);
  const qaResult = makeBillingQaResult("tier2-yearly");
  assert.equal(qaResult.priceCents, 15900);
  assert.equal(qaResult.simulated, true);
  process.env.BILLING_QA_TEST_MODE = prevQaMode;
  process.env.ALLOW_TEST_USERS = prevTestUsers;

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
