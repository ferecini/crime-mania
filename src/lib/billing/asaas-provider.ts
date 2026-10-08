import {
  asaasApiBaseUrl,
  isServerBillingEnabled,
  type CommercialPlanId,
} from "@/lib/billing/config";
import type { BillingProvider, CheckoutSessionResult } from "@/lib/billing/types";
import { appBaseUrl } from "@/lib/billing/config";

function apiKey(): string {
  const key = process.env.ASAAS_API_KEY?.trim();
  if (!key) throw new Error("ASAAS_API_KEY não configurada.");
  return key;
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
      throw new Error("Falha ao criar cliente Asaas.");
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
    const res = await asaasFetch("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: customerId,
        billingType: "CREDIT_CARD",
        value,
        cycle: input.planId.includes("yearly") ? "YEARLY" : "MONTHLY",
        description: `Crime Mania — ${input.planId}`,
        externalReference: input.subscriptionId,
        callback: {
          successUrl: `${appBaseUrl()}/membro/conta?checkout=success`,
          autoRedirect: true,
        },
      }),
    });
    const data = (await res.json()) as {
      id?: string;
      invoiceUrl?: string;
      errors?: unknown;
    };
    if (!res.ok || !data.id) {
      throw new Error("Falha ao iniciar assinatura Asaas.");
    }

    return {
      mode: data.invoiceUrl ? "hosted" : "tokenized",
      checkoutUrl: data.invoiceUrl ?? `${appBaseUrl()}/membro/conta?checkout=pending`,
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
