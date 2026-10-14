import {
  asaasApiBaseUrl,
  isServerBillingEnabled,
  type CommercialPlanId,
} from "@/lib/billing/config";
import {
  AsaasOperationError,
  isInvalidCustomerError,
  parseAsaasErrors,
  throwAsaasFailure,
  logAsaasFailure,
} from "@/lib/billing/asaas-errors";
import type { BillingProvider, CheckoutSessionResult } from "@/lib/billing/types";

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY?.trim();
  if (!key) throw new Error("ASAAS_API_KEY não configurada.");
  return key;
}

/** Valida credenciais e ambiente sem criar cliente, cobrança ou assinatura. */
export async function checkAsaasConnection(): Promise<{
  ok: boolean;
  status: number;
  environment: "sandbox" | "production";
}> {
  const environment = asaasApiBaseUrl().includes("sandbox") ? "sandbox" : "production";
  const response = await fetch(`${asaasApiBaseUrl()}/myAccount`, {
    method: "GET",
    headers: { access_token: apiKey() },
    cache: "no-store",
  });
  return { ok: response.ok, status: response.status, environment };
}

type AsaasPaymentLinkFields = {
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
};

/** Prefer hosted invoice URL; fall back to boleto slip when that is all Asaas returns. */
export function pickPayableUrl(payment: AsaasPaymentLinkFields): string | null {
  const invoice = payment.invoiceUrl?.trim();
  if (invoice?.startsWith("http")) return invoice;
  const slip = payment.bankSlipUrl?.trim();
  if (slip?.startsWith("http")) return slip;
  return null;
}

function todayIsoDateInBrazil(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

/** Optional post-payment redirect — only when domain is registered in Asaas. */
function subscriptionPaymentCallback():
  | { successUrl: string; autoRedirect: true }
  | undefined {
  const explicit = process.env.ASAAS_CHECKOUT_SUCCESS_URL?.trim();
  if (explicit?.startsWith("https://")) {
    return { successUrl: explicit.replace(/\/$/, ""), autoRedirect: true };
  }
  return undefined;
}

function buildSubscriptionBody(input: {
  customerId: string;
  value: number;
  planId: CommercialPlanId;
  subscriptionId: string;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    customer: input.customerId,
    billingType: "UNDEFINED",
    value: input.value,
    nextDueDate: todayIsoDateInBrazil(),
    cycle: input.planId.includes("yearly") ? "YEARLY" : "MONTHLY",
    description: `Crime Mania — ${input.planId}`,
    externalReference: input.subscriptionId,
  };
  const callback = subscriptionPaymentCallback();
  if (callback) body.callback = callback;
  return body;
}

async function createAsaasSubscription(input: {
  customerId: string;
  value: number;
  planId: CommercialPlanId;
  subscriptionId: string;
}): Promise<{ id: string; invoiceUrl?: string | null }> {
  const res = await asaasFetch("/subscriptions", {
    method: "POST",
    body: JSON.stringify(buildSubscriptionBody(input)),
  });
  const data = (await res.json()) as {
    id?: string;
    invoiceUrl?: string;
    errors?: unknown;
  };
  if (!res.ok || !data.id) {
    throwAsaasFailure(
      "POST /subscriptions",
      res.status,
      data,
      "Falha ao iniciar assinatura Asaas.",
    );
  }
  return { id: data.id, invoiceUrl: data.invoiceUrl };
}

async function waitMs(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchAsaasSubscriptionInvoiceUrl(
  providerSubscriptionId: string,
): Promise<string | null> {
  const res = await asaasFetch(
    `/payments?subscription=${encodeURIComponent(providerSubscriptionId)}&limit=5`,
  );
  if (!res.ok) return null;
  const data = (await res.json()) as {
    data?: Array<AsaasPaymentLinkFields & { status?: string }>;
  };
  for (const payment of data.data ?? []) {
    const url = pickPayableUrl(payment);
    if (url) return url;
  }
  return null;
}

/** Subscriptions often omit invoiceUrl; poll payments then create the first charge if needed. */
export async function resolveHostedCheckoutUrl(input: {
  providerSubscriptionId: string;
  customerId: string;
  value: number;
  externalReference: string;
  subscriptionInvoiceUrl?: string | null;
}): Promise<string | null> {
  const direct = input.subscriptionInvoiceUrl?.trim();
  if (direct?.startsWith("http")) return direct;

  for (const delayMs of [0, 400, 900, 1600]) {
    if (delayMs > 0) await waitMs(delayMs);
    const fromList = await fetchAsaasSubscriptionInvoiceUrl(input.providerSubscriptionId);
    if (fromList) return fromList;
  }

  const res = await asaasFetch("/payments", {
    method: "POST",
    body: JSON.stringify({
      customer: input.customerId,
      billingType: "UNDEFINED",
      value: input.value,
      dueDate: todayIsoDateInBrazil(),
      subscription: input.providerSubscriptionId,
      externalReference: input.externalReference,
    }),
  });
  const payment = (await res.json()) as AsaasPaymentLinkFields & { errors?: unknown };
  if (!res.ok) {
    logAsaasFailure("POST /payments (subscription link)", res.status, parseAsaasErrors(payment));
    return null;
  }
  return pickPayableUrl(payment);
}

async function asaasFetch(path: string, init?: RequestInit): Promise<Response> {
  if (!isServerBillingEnabled()) {
    throw new Error("Asaas desabilitado (BILLING_ENABLED=false).");
  }
  const url = `${asaasApiBaseUrl()}${path}`;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      access_token: apiKey(),
      ...(init?.headers ?? {}),
    },
  });
}

export class AsaasBillingProvider implements BillingProvider {
  async createCustomer(input: {
    userId: string;
    email: string;
    name: string;
  }): Promise<{ customerId: string }> {
    const res = await asaasFetch("/customers", {
      method: "POST",
      body: JSON.stringify({
        name: input.name || input.email,
        email: input.email,
        externalReference: input.userId,
      }),
    });
    const data = (await res.json()) as { id?: string; errors?: unknown };
    if (!res.ok || !data.id) {
      throwAsaasFailure(
        "POST /customers",
        res.status,
        data,
        "Falha ao criar cliente Asaas.",
      );
    }
    return { customerId: data.id };
  }

  async startCheckout(input: {
    userId: string;
    email: string;
    name: string;
    planId: CommercialPlanId;
    priceCents: number;
    existingCustomerId?: string;
    subscriptionId: string;
  }): Promise<CheckoutSessionResult> {
    let customerId = input.existingCustomerId;
    if (!customerId) {
      customerId = (await this.createCustomer(input)).customerId;
    }

    const value = input.priceCents / 100;
    let data: { id: string; invoiceUrl?: string | null };
    try {
      data = await createAsaasSubscription({
        customerId,
        value,
        planId: input.planId,
        subscriptionId: input.subscriptionId,
      });
    } catch (err) {
      const canRetryCustomer =
        !!input.existingCustomerId &&
        err instanceof AsaasOperationError &&
        isInvalidCustomerError(err.codes.map((code) => ({ code })));
      if (!canRetryCustomer) throw err;
      customerId = (await this.createCustomer(input)).customerId;
      data = await createAsaasSubscription({
        customerId,
        value,
        planId: input.planId,
        subscriptionId: input.subscriptionId,
      });
    }

    const checkoutUrl = await resolveHostedCheckoutUrl({
      providerSubscriptionId: data.id,
      customerId,
      value,
      externalReference: input.subscriptionId,
      subscriptionInvoiceUrl: data.invoiceUrl,
    });
    if (!checkoutUrl) {
      await asaasFetch(`/subscriptions/${data.id}`, { method: "DELETE" }).catch(() => undefined);
      throw new Error(
        "Asaas não retornou link de pagamento. Verifique a chave API e tente novamente.",
      );
    }

    return {
      mode: "hosted",
      checkoutUrl,
      subscriptionId: input.subscriptionId,
      providerSubscriptionId: data.id,
      customerId,
      message: "Redirecionando para pagamento seguro Asaas.",
    };
  }

  async cancelSubscription(providerSubscriptionId: string): Promise<void> {
    const res = await asaasFetch(`/subscriptions/${providerSubscriptionId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Falha ao cancelar assinatura no Asaas.");
    }
  }

  updatePaymentMethodStub() {
    return {
      message: "Use o portal Asaas ou a fatura por e-mail para atualizar o cartão.",
    };
  }
}
