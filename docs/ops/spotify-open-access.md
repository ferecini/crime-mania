# Spotify Open Access (SOA)

Integração opcional (desligada por padrão) que libera episódios de assinantes no Spotify via
[Spotify Open Access](https://developer.spotify.com/). A fonte de verdade continua sendo a assinatura
em `billing_subscriptions`; a tabela `spotify_soa_links` é só auditoria operacional.

## Pré-requisitos

1. Conta parceira **aprovada/allowlisted** pelo Spotify para Open Access (contato com o Spotify for Podcasters / parceiros).
2. App no [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) com **Client ID** e **Client Secret** liberados para os scopes:
   - `user-soa-link` (vinculação pelo usuário)
   - `soa-manage-entitlements` (client credentials, atualização de entitlements)
3. **Partner ID** fornecido pelo Spotify.
4. Entitlements cadastrados no Spotify for Podcasters e associados aos shows/episódios pagos.
5. Billing Asaas operacional (`BILLING_ENABLED=true`) e migração `006_billing.sql` aplicada.

## Redirect URI

Cadastre no Dashboard do Spotify (exatamente, por ambiente):

```
https://crimemania.com.br/api/spotify/soa/callback
http://localhost:3000/api/spotify/soa/callback   # só dev
```

A URI é `${base}/api/spotify/soa/callback`, onde `base` vem de `getSiteUrl()` (`APP_BASE_URL` → `NEXT_PUBLIC_SITE_URL` → `VERCEL_URL` → padrão de produção). Defina `APP_BASE_URL` em produção.

## Entitlement IDs

| Tier Crime Mania | Entitlement enviado | Override (opcional)            |
| ---------------- | ------------------- | ------------------------------ |
| `tier1`          | `tier1`             | `SPOTIFY_SOA_ENTITLEMENT_TIER1` |
| `tier2`          | `tier2`             | `SPOTIFY_SOA_ENTITLEMENT_TIER2` |
| `none` / pending / expirado | `[]`     | —                              |

- Os IDs devem coincidir com os cadastrados no Spotify for Podcasters.
- **Tier 2 não inclui automaticamente `tier1`**: cada usuário recebe apenas um ID. Se o Tier 2 deve ouvir também o conteúdo do Tier 1, associe o entitlement `tier2` a esses shows no Spotify (ou ajuste `tierToEntitlements`).
- Só há entitlement com acesso pago ativo (`getBillingEffectiveTier` / `resolveTierFromSubscription`): `pending` não concede nada; período de graça de `past_due` ainda conta como ativo.

## Variáveis de ambiente (somente servidor)

```bash
# Spotify Open Access (desligado por padrão)
# SPOTIFY_SOA_ENABLED=false
# SPOTIFY_SOA_CLIENT_ID=
# SPOTIFY_SOA_CLIENT_SECRET=
# SPOTIFY_SOA_PARTNER_ID=
# SPOTIFY_SOA_ENTITLEMENT_TIER1=tier1   # opcional
# SPOTIFY_SOA_ENTITLEMENT_TIER2=tier2   # opcional
# APP_BASE_URL=https://crimemania.com.br
```

Nenhuma é `NEXT_PUBLIC_*`. A feature só fica ativa com `SPOTIFY_SOA_ENABLED=true` **e** as três credenciais definidas.

## Banco

```bash
POSTGRES_URL=... npm run spotify-soa:migrate   # migrations/007_spotify_soa.sql
```

Cria `spotify_soa_links (user_id, linked_at, last_entitlements, last_sync_at)`. Usada para (a) auditoria e (b) saber se o usuário já vinculou: o webhook só chama `replace-entitlements` para quem tem linha na tabela. Se a tabela não existir ou o Postgres falhar, o sync é ignorado (aplique a migration antes de ligar SOA em produção).

O `state` OAuth usa cookie assinado (HS256, `AUTH_SECRET`, 10 min, path `/api/spotify/soa`) ligado ao `userId` + nonce — sem tabela.

## Fluxo

1. Assinante ativo abre **Minha conta → Spotify → Conectar Spotify** (`GET /membro/spotify/conectar`; exige sessão, SOA ligado, não-QA, tier1/tier2).
2. Redireciona para `accounts.spotify.com/authorize` com scope `user-soa-link` e `state`.
3. `GET /api/spotify/soa/callback` valida `state`, troca o `code` (authorization code + client secret, sem PKCE), chama `POST open-access.spotify.com/api/v1/register-user` (Bearer do usuário; corpo = JWT HS256 com `partner_id`, `partner_user_id` = user id, `entitlements`) e redireciona para `completion_url`.
4. Erros voltam para `/membro/conta?spotify=error|disabled|no_plan|qa`.
5. Após cada webhook Asaas (e simulação em modo fake), `syncSpotifyEntitlementsSafe(userId)` chama `replace-entitlements` com token client-credentials (`soa-manage-entitlements`). Falhas são logadas e nunca derrubam o webhook.

> Premissa a validar com a documentação do parceiro: o JWT é enviado como corpo bruto com `Content-Type: application/jwt` (`src/lib/spotify-soa/client.ts`, `postSoa`). Se o Spotify exigir outro envelope (ex.: JSON `{ "jwt": ... }`), ajuste só essa função. O JWT inclui também `iat` e `exp` (5 min).

## Habilitar em produção

1. Concluir os pré-requisitos e registrar a redirect URI.
2. `npm run spotify-soa:migrate` no banco de produção.
3. Definir as variáveis na Vercel (Production) e `APP_BASE_URL`.
4. Setar `SPOTIFY_SOA_ENABLED=true` e redeploy.
5. Testar com uma conta paga real (contas QA são bloqueadas): conectar, abrir o show no Spotify, alterar/cancelar plano e conferir `spotify_soa_links.last_sync_at`.

Para desligar: `SPOTIFY_SOA_ENABLED=false` (botão some, rotas redirecionam, sync vira no-op).

## Desenvolvimento local

Desligado por padrão — sem variáveis nada muda. Testes sem rede: `npm run test:spotify-soa`.

---

## Passo a passo nos portais Spotify (o que você precisa obter)

O Crime Mania já tem o código e as URLs. **Você ainda precisa** de aprovação como parceiro Open Access e das credenciais abaixo. Sem allowlist do Spotify, o OAuth ou a API retornam erro mesmo com tudo certo no site.

### Informações que vão para a Vercel

| Variável | Onde conseguir |
| -------- | -------------- |
| `SPOTIFY_SOA_CLIENT_ID` | [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) → seu app → **Client ID** |
| `SPOTIFY_SOA_CLIENT_SECRET` | Mesmo app → **Settings** → **Client secret** (mostrar uma vez; guarde em lugar seguro) |
| `SPOTIFY_SOA_PARTNER_ID` | Enviado pelo **Spotify Partner Management** depois que o Client ID for allowlisted para Open Access |
| `SPOTIFY_SOA_ENTITLEMENT_TIER1` / `TIER2` | Opcional — padrão `tier1` e `tier2`; devem ser **iguais** aos IDs que você cadastrar no Spotify for Podcasters |
| `SPOTIFY_SOA_ENABLED` | `true` só depois das três credenciais acima |

URLs que você informa ao Spotify (não são env vars):

| Uso | URL Crime Mania |
| --- | ---------------- |
| **Redirect URI** (OAuth) | `https://crimemania.com.br/api/spotify/soa/callback` |
| **Entrypoint URL** (início do link a partir do Spotify) | `https://crimemania.com.br/membro/spotify/conectar` |

Show Crime Mania no Spotify: `0PPJmIP6w83wtmqrx4o3Wz` (conferir em [Spotify for Podcasters](https://podcasters.spotify.com/) / Creators).

---

### Parte A — Criar o app OAuth (Client ID + Secret)

1. Entre em [developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) com a conta que administra o podcast Crime Mania.
2. **Create app** (ou use um app existente só para SOA).
3. Preencha:
   - **App name**: ex. `Crime Mania Open Access` (aparece no fluxo de vinculação para o usuário).
   - **App description**: descreva a assinatura Crime Mania (texto visível no linking).
   - **Redirect URIs** → **Add** exatamente:
     ```
     https://crimemania.com.br/api/spotify/soa/callback
     ```
     (Opcional dev: `http://localhost:3000/api/spotify/soa/callback`.)
4. Salve. Copie o **Client ID**.
5. Abra **Settings** → **Client secret** → **View client secret** → copie e guarde (não commitar).

---

### Parte B — Parceria Open Access (Partner ID)

Open Access **não** liga só criando o app. O Client ID precisa estar na allowlist de parceiros SOA.

1. Leia a visão geral: [Spotify Open Access](https://developer.spotify.com/documentation/open-access).
2. Entre em contato com o **Spotify Partner Management** / suporte de parceiros Open Access (o caminho exato varia; costuma ser via formulário ou e-mail indicado na documentação ou no suporte do [Spotify for Podcasters](https://podcasters.spotify.com/)).
3. Envie pelo menos:
   - **Client ID** do passo A
   - Nome do produto: Crime Mania (assinatura por site, Asaas)
   - **Entrypoint URL**: `https://crimemania.com.br/membro/spotify/conectar`
   - **Redirect URI**: `https://crimemania.com.br/api/spotify/soa/callback`
   - Entitlements planejados: `tier1`, `tier2` (ou outros IDs, desde que iguais no site e no Podcasters)
4. Após aprovação, o Spotify devolve o **Partner ID** → use em `SPOTIFY_SOA_PARTNER_ID`.

Enquanto não houver Partner ID e allowlist, deixe `SPOTIFY_SOA_ENABLED=false` (código já está em produção; o botão só aparece quando flag + credenciais estão ok).

---

### Parte C — Entitlements e episódios no Spotify for Podcasters

1. Acesse [podcasters.spotify.com](https://podcasters.spotify.com/) (ou **Spotify for Creators**) com a conta do show Crime Mania.
2. Abra o show → configurações de **Open Access** / conteúdo restrito (nome do menu pode variar).
3. Informe o **Partner ID** recebido na Parte B.
4. Cadastre os **entitlement IDs** (ex.: `tier1`, `tier2`) — os mesmos que o site envia (`SPOTIFY_SOA_ENTITLEMENT_*` ou padrão).
5. Em **cada episódio** (ou feed) que deve ser só para assinantes:
   - Marque como restrito / Open Access.
   - Associe o entitlement correto (`tier1` para Tier 1, `tier2` para Tier 2).
   - Episódio **sem** entitlement pode ficar público dentro do programa SOA — revise todos os exclusivos.

Regra Spotify: o ouvinte só ouve o episódio se **usuário e episódio compartilham pelo menos um entitlement ID**.

---

### Parte D — Ligar no Crime Mania (depois das Partes A–C)

1. Vercel → projeto **crime-mania** → **Settings → Environment Variables** (Production):
   - `SPOTIFY_SOA_CLIENT_ID`
   - `SPOTIFY_SOA_CLIENT_SECRET`
   - `SPOTIFY_SOA_PARTNER_ID`
   - `SPOTIFY_SOA_ENABLED` = `true`
   - Confirme `APP_BASE_URL=https://crimemania.com.br`
2. **Redeploy** Production (ou aguarde o deploy do commit SOA).
3. Migration já aplicada: tabela `spotify_soa_links` (ver abaixo).
4. Teste com conta **paga real** (não QA): **Minha conta → Conectar Spotify** → concluir no Spotify → abrir episódio exclusivo no app.

Usuários podem ver vínculos em [content-access.spotify.com](https://content-access.spotify.com/).

---

### Checklist rápido

- [ ] App no Developer Dashboard com redirect URI de produção
- [ ] Client ID + Secret guardados
- [ ] E-mail/formulário ao Partner Management com Client ID e URLs
- [ ] Partner ID recebido
- [ ] Entitlements `tier1` / `tier2` no Podcasters + episódios marcados
- [ ] Variáveis na Vercel + `SPOTIFY_SOA_ENABLED=true` + redeploy
- [ ] Teste end-to-end com assinante real
