/** Pagamento real — habilitar apenas quando o gateway estiver integrado. */
export const billingEnabled =
  process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/**
 * Exibe o botão Google na UI quando o Client ID público estiver definido
 * ou quando NEXT_PUBLIC_GOOGLE_AUTH=true (legado).
 */
export const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true" ||
  Boolean(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim());
