# Login com Google (OAuth)

Erro **`redirect_uri_mismatch`** = o Google recebeu um callback que **não está** na lista **Authorized redirect URIs** do OAuth Client.

## Produção (domínio `crimemania.com.br`)

1. Abra [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials).
2. Selecione o projeto do Crime Mania.
3. Abra o **OAuth 2.0 Client ID** usado no site (o mesmo `GOOGLE_CLIENT_ID` da Vercel).
4. Em **Authorized redirect URIs**, **adicione** (uma por linha):

   - `https://crimemania.com.br/api/auth/google/callback`
   - `https://crimemania.com/api/auth/google/callback` (se ainda usar `.com`)
   - `https://crime-mania.vercel.app/api/auth/google/callback` (preview legado, opcional)

5. Em **Authorized JavaScript origins** (opcional, ajuda em alguns fluxos):

   - `https://crimemania.com.br`
   - `https://crimemania.com`

6. **Save**. A mudança costuma valer em segundos; em caso raro, até alguns minutos.

## Vercel (Production)

| Variável | Valor |
|----------|--------|
| `GOOGLE_CLIENT_ID` | Client ID do Google |
| `GOOGLE_CLIENT_SECRET` | Secret do Google |
| `GOOGLE_REDIRECT_URI` | `https://crimemania.com.br/api/auth/google/callback` |
| `APP_BASE_URL` | `https://crimemania.com.br` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | igual ao `GOOGLE_CLIENT_ID` (botão na UI) |

Após alterar env: **redeploy** em Production.

## Local

Redirect automático: `http://localhost:3000/api/auth/google/callback` — cadastre também no mesmo Client ID (ou use um client de dev separado).

## Verificação

1. Aba anônima → `https://crimemania.com.br/entrar` → **Continuar com Google**.
2. Não deve aparecer `redirect_uri_mismatch`; deve voltar logado ou para onboarding de nome.