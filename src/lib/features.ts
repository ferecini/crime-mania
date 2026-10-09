/** Servidor — cobrança e webhooks Asaas. */
export function serverBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === "true";
}

/**
 * Checkout real (UI + API) só quando ambos os flags estiverem true no deploy.
 * Evita NEXT_PUBLIC_BILLING_ENABLED=true sozinho acionar fluxo fake em produção.
 */
export function billingCheckoutEnabled(): boolean {
  return (
    serverBillingEnabled() &&
    process.env.NEXT_PUBLIC_BILLING_ENABLED === "true"
  );
}

/** Ensaio sem cobrança, visível somente para as contas fixas de QA. */
export function billingQaTestModeEnabled(): boolean {
  return process.env.BILLING_QA_TEST_MODE === "true";
}

/** @deprecated Prefer billingCheckoutEnabled() no servidor ou prop checkoutEnabled no client. */
export const billingEnabled = process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/**
 * Exibe o botão Google na UI quando o Client ID público estiver definido
 * ou quando NEXT_PUBLIC_GOOGLE_AUTH=true (legado).
 */
export const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true" ||
  Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());
