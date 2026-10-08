/**
 * Stub de lembretes de cobrança (sem envio de e-mail v1).
 * Agendar via cron externo quando BILLING_ENABLED=true.
 */
export async function runBillingReminderStub(): Promise<{ checked: number; reminders: number }> {
  return { checked: 0, reminders: 0 };
}
