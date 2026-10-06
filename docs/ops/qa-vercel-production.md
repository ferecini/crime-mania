# QA em Preview e Production (Vercel)

Contas fixas (`src/lib/auth/qa-users.ts`):

| Slot  | E-mail                      | User ID (fixo)                          |
|-------|-----------------------------|-----------------------------------------|
| free  | `qa-free@crime-mania.test`  | `00000000-0000-4000-8000-010000000001`  |
| tier1 | `qa-tier1@crime-mania.test` | `00000000-0000-4000-8000-010000000002`  |
| tier2 | `qa-tier2@crime-mania.test` | `00000000-0000-4000-8000-010000000003`  |

Senhas: `private/qa-credentials.txt` (gitignored).

## Variáveis na Vercel (Preview **e** Production)

- `ALLOW_TEST_USERS=true`
- `CM_TEST_USERS_JSON` — gerar localmente (não commitar):

  ```bash
  ALLOW_TEST_USERS=true \
    QA_FREE_EMAIL=... QA_FREE_PASSWORD=... \
    QA_TIER1_EMAIL=... QA_TIER1_PASSWORD=... \
    QA_TIER2_EMAIL=... QA_TIER2_PASSWORD=... \
    npm run seed:test-members -- --emit-vercel-json
  ```

  Copiar a linha JSON para `CM_TEST_USERS_JSON`.

## Acesso editorial (admin hub + dossiês + moderação)

- `CM_EDITORIAL_USER_IDS` — lista canônica (vírgulas).
- Incluir `00000000-0000-4000-8000-010000000003` para QA tier2 em Preview/Prod.
- `CM_DOSSIER_ADMIN_IDS` e `CM_COMMUNITY_MODERATOR_IDS` podem espelhar a mesma lista (legado).

Sincronizar a partir de `private/ops/editorial-user-ids.txt`:

```bash
node scripts/sync-editorial-vercel-env.mjs preview --append-qa-tier2
node scripts/sync-editorial-vercel-env.mjs production --append-qa-tier2
```

Após alterar env: redeploy (`vercel deploy --prod` para Production).

## Verificação manual

1. Login em https://crime-mania.vercel.app com `qa-tier1@crime-mania.test` → conteúdo Tier 1.
2. Login com `qa-tier2@crime-mania.test` → Tier 2 + `/membro/admin`.
3. `GET /api/auth/session` autenticado → `user.id` deve bater com a tabela acima.
