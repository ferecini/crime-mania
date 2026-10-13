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

Contas QA: **nunca** passam pelo checkout real. Com `ALLOW_TEST_USERS=true` (ou `BILLING_QA_TEST_MODE=true`), os IDs fixos de QA podem ensaiar plano e valor em Minha conta; o teste não chama o Asaas, não grava assinatura e não altera permissões.

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

## Painel Asaas (URLs corretas)

Rotas legadas como `https://www.asaas.com/configIntegracao/index` podem responder **Denied** — usar o menu **Integrações** (conta logada) ou estes caminhos:

| Recurso | URL |
|---------|-----|
| Chaves de API | `https://www.asaas.com/customerApiAccessToken/index` |
| Webhooks | `https://www.asaas.com/customerConfigIntegrations/webhooks` |

A chave secreta só aparece **uma vez** ao criar o token (ex.: “Crime Mania Produção”); se perdeu, gere outra. Salve localmente em `private/tmp-asaas-api-key.txt` (chmod 600, **não** commitar) para o agente ou o owner aplicarem na Vercel. Token do header do webhook: `private/tmp-asaas-webhook-token.txt` → `ASAAS_WEBHOOK_TOKEN` (mesmo valor no painel Asaas, header `asaas-access-token`).

## Rotação de chaves

1. Gerar nova API key no Asaas.
2. Atualizar `ASAAS_API_KEY` na Vercel (Preview primeiro).
3. Atualizar token do webhook (`ASAAS_WEBHOOK_TOKEN`) no painel e na Vercel.
4. Redeploy; reenviar evento de teste.

## Checkout não abre o Asaas (sem linha `pending`)

1. **Sintoma:** em `/planos`, “Assinar agora” volta ao normal; **não** redireciona; **não** cria `billing_subscriptions` `pending`.
2. **Causa usual:** `ASAAS_API_KEY` ausente, placeholder ou inválida — o servidor faz preflight `GET /myAccount` (401) **antes** de gravar `pending`.
3. **Mensagem na UI (após deploy recente):** banner vermelho *Pagamento não iniciado* com texto sobre chave Asaas na Vercel.
4. **Owner:** colar chave de **Produção** do painel Asaas (Integrações → API) em `ASAAS_API_KEY` (Production) e `vercel deploy --prod`. O CLI não revela o valor (`env pull` → `[SENSITIVE]`); `vercel env run` local pode mostrar LEN 0 mesmo com chave válida no runtime da Vercel.

## Checkout preso em “Aguardando pagamento”

1. **Causa comum:** `ASAAS_API_KEY` inválida (401), assinatura Asaas sem `invoiceUrl` na resposta (normal — o app cria a 1ª cobrança ou faz poll em `/payments`), ou deploy antigo que gravava `pending` antes do link hospedado.
2. **Usuário:** em Minha conta → **Cancelar checkout pendente**, depois assinar de novo em Planos.
3. **Se houver link:** **Abrir pagamento no Asaas** (fatura hospedada).
4. **Suporte (Neon, pendente):** `DELETE FROM billing_subscriptions WHERE user_id = '<id>' AND status = 'pending';`
5. **Ativo sem pagamento (bug legado):** tier só deve subir após webhook `PAYMENT_CONFIRMED`. Corrigir linha e re-sincronizar tier no app (logout/login) ou ajustar `users` store se aplicável:

```sql
-- substituir <user_id>
UPDATE billing_subscriptions
SET status = 'expired', updated_at = NOW()
WHERE user_id = '<user_id>' AND status IN ('active', 'pending') AND payment_id IS NULL;
DELETE FROM billing_subscriptions WHERE user_id = '<user_id>' AND status = 'pending';
```

API alternativa: `POST /api/billing/abandon-pending` (usuário logado, `{"confirm":true}`) remove checkout `pending` e cancela assinatura no Asaas quando houver `provider_subscription_id`.

## Rollback

1. `BILLING_ENABLED=false` + `NEXT_PUBLIC_BILLING_ENABLED=false` → redeploy imediato (checkout volta waitlist / simulado).
2. Dados em Postgres permanecem; reativar quando estável.
3. Não mergear PR de billing até checklist QA completo.

## Testes locais

```bash
npm run test:billing
POSTGRES_URL=... npm run test:billing -- --integration
```
