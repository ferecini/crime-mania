/** UI — checkout real visível apenas quando espelhar BILLING_ENABLED no deploy. */
export const billingEnabled =
  process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/** Servidor — cobrança e webhooks Asaas. */
export function serverBillingEnabled(): boolean {
  return process.env.BILLING_ENABLED === "true";
}

/**
 * Exibe o botão Google na UI quando o Client ID público estiver definido
 * ou quando NEXT_PUBLIC_GOOGLE_AUTH=true (legado).
 */
export const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true" ||
  Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());
