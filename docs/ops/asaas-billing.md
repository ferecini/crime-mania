# Asaas — assinaturas Crime Mania

Integração de assinatura recorrente via Asaas. **Checkout e provider real só funcionam com os dois flags** `BILLING_ENABLED=true` **e** `NEXT_PUBLIC_BILLING_ENABLED=true` no mesmo deploy. Se apenas o flag público estiver true, a UI não exibe checkout e as APIs `POST /api/billing/checkout|cancel` respondem 403 (evita provider fake em produção).

## Variáveis (Vercel / local)

| Variável | Escopo | Descrição |
|----------|--------|-----------|
| `BILLING_ENABLED` | Server | `false` por padrão — sem chamadas Asaas reais |
| `NEXT_PUBLIC_BILLING_ENABLED` | Client | Espelha go-live da UI de checkout |
| `BILLING_PROVIDER` | Server | `asaas` (usa fake quando billing desligado) |
| `ASAAS_ENVIRONMENT` | Server | `sandbox` ou `production` |
| `ASAAS_API_KEY` | Server | Chave API (nunca commitar) |
| `ASAAS_WEBHOOK_TOKEN` | Server | Token enviado pelo Asaas no header do webhook |
| `APP_BASE_URL` | Server | Ex.: `https://crime-mania.vercel.app` |
| `POSTGRES_URL` | Server | Neon — tabelas `billing_*` |

Contas QA: **nunca** passam pelo checkout real. Com `BILLING_QA_TEST_MODE=true`, os IDs fixos de QA podem ensaiar plano e valor em Minha conta; o teste não chama o Asaas, não grava assinatura e não altera permissões.

## Migração

```bash
POSTGRES_URL=... npm run billing:migrate
```

Arquivo: `migrations/006_billing.sql`

## URLs de webhook (registrar no painel Asaas)

Substitua `{host}` pelo domínio do ambiente.

| Ambiente | URL |
|----------|-----|
| Preview (Vercel) | `https://{preview-host}/api/billing/webhook/asaas` |
| Production | `https://{production-host}/api/billing/webhook/asaas` |

Header esperado: `asaas-access-token: <ASAAS_WEBHOOK_TOKEN>` (ou `Authorization: Bearer`).

## Eventos Asaas (allowlist)

Inscrever no webhook:

- `PAYMENT_CREATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_DELETED`
- `PAYMENT_REFUNDED`
- `PAYMENT_CHARGEBACK_REQUESTED`
- `PAYMENT_CHARGEBACK_DISPUTE`
- `SUBSCRIPTION_CREATED`
- `SUBSCRIPTION_UPDATED`
- `SUBSCRIPTION_INACTIVATED`
- `SUBSCRIPTION_DELETED`

Tier de membro **só** muda após processamento idempotente desses eventos.

## Smoke test (sandbox)

1. `BILLING_ENABLED=true`, chaves sandbox, migrar DB.
2. Login usuário não-QA → `/planos` → checkout → pagamento sandbox.
3. Confirmar webhook 200 e linha em `billing_events`.
4. Verificar tier em `/membro/conta` após `PAYMENT_CONFIRMED`.
5. Cancelar → `cancelAtPeriodEnd` → acesso até `current_period_end`.

## Rotação de chaves

1. Gerar nova API key no Asaas.
2. Atualizar `ASAAS_API_KEY` na Vercel (Preview primeiro).
3. Atualizar token do webhook (`ASAAS_WEBHOOK_TOKEN`) no painel e na Vercel.
4. Redeploy; reenviar evento de teste.

## Rollback

1. `BILLING_ENABLED=false` + `NEXT_PUBLIC_BILLING_ENABLED=false` → redeploy imediato (checkout volta waitlist / simulado).
2. Dados em Postgres permanecem; reativar quando estável.
3. Não mergear PR de billing até checklist QA completo.

## Testes locais

```bash
npm run test:billing
POSTGRES_URL=... npm run test:billing -- --integration
```
