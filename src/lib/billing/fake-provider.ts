import { appBaseUrl } from "@/lib/billing/config";
import type { BillingProvider, CheckoutSessionResult } from "@/lib/billing/types";
import type { CommercialPlanId } from "@/lib/billing/config";

/** Provider determinístico — sem chamadas HTTP externas. */
export class FakeBillingProvider implements BillingProvider {
  async createCustomer(input: {
    userId: string;
    email: string;
    name: string;
  }): Promise<{ customerId: string }> {
    void input.email;
    void input.name;
    return { customerId: `fake_cus_${input.userId.replace(/-/g, "").slice(0, 16)}` };
  }

  async startCheckout(input: {
    userId: string;
    planId: CommercialPlanId;
    subscriptionId: string;
    existingCustomerId?: string;
  }): Promise<CheckoutSessionResult> {
    const customerId =
      input.existingCustomerId ??
      (await this.createCustomer({ userId: input.userId, email: "", name: "" })).customerId;
    const token = Buffer.from(`${input.subscriptionId}:${input.planId}`).toString("base64url");
    return {
      mode: "simulated",
      checkoutUrl: `${appBaseUrl()}/planos?billing=simulated&sub=${input.subscriptionId}&t=${token}`,
      subscriptionId: input.subscriptionId,
      customerId,
      message:
        "Modo seguro: nenhuma cobrança real. Confirme o pagamento simulado via webhook de teste ou aguarde BILLING_ENABLED=true.",
    };
  }

  async cancelSubscription(): Promise<void> {
    /* noop — estado atualizado via API cancel + webhook stub */
  }

  updatePaymentMethodStub() {
    return {
      message: "Atualização de cartão disponível quando BILLING_ENABLED=true e Asaas ativo.",
    };
  }
}
