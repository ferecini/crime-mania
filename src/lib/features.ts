/** Pagamento real — habilitar apenas quando o gateway estiver integrado. */
export const billingEnabled =
  process.env.NEXT_PUBLIC_BILLING_ENABLED === "true";

/** Google OAuth — habilitar quando credenciais estiverem configuradas. */
export const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH === "true";
