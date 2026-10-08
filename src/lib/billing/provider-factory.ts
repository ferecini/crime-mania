import { AsaasBillingProvider } from "@/lib/billing/asaas-provider";
import { billingProviderName } from "@/lib/billing/config";
import { FakeBillingProvider } from "@/lib/billing/fake-provider";
import type { BillingProvider } from "@/lib/billing/types";

let cached: BillingProvider | null = null;

export function getBillingProvider(): BillingProvider {
  if (cached) return cached;
  cached =
    billingProviderName() === "asaas" ? new AsaasBillingProvider() : new FakeBillingProvider();
  return cached;
}

/** Testes — força provider fake */
export function resetBillingProviderForTests(): void {
  cached = null;
}
