# Domínios customizados — Crime Mania (Vercel)

Projeto: **investwise/crime-mania** (`crime-mania.vercel.app`).

Domínio canônico recomendado (BR): **`https://crimemania.com.br`**

| Host | Registrador | DNS hoje | Vercel (27 out 2026) |
|------|-------------|----------|----------------------|
| `crimemania.com.br` | Registro.br | NS `a.auto.dns.br`, `b.auto.dns.br`; A `@` → `216.198.79.1`, `64.29.17.1` | Anexado — **Verified** |
| `www.crimemania.com.br` | Registro.br | CNAME `www` → `6d07db50557dbb99.vercel-dns-017.com` | Anexado — **Verified** |
| `crimemania.com` | GoDaddy | A `@` → `216.198.79.1`, `64.29.17.1`; `www` CNAME → `6d07db50557dbb99.vercel-dns-017.com` | Anexado — **Verified** |
| `www.crimemania.com` | GoDaddy | CNAME `www` → `6d07db50557dbb99.vercel-dns-017.com` | Anexado — **Verified** |

Ownership no time **investwise**: **verificado** (sem TXT extra no momento). SSL só sobe após DNS válido.

Revalidar após alterar DNS:

```bash
vercel domains verify crimemania.com.br --scope investwise
vercel domains verify www.crimemania.com.br --scope investwise
vercel domains verify crimemania.com --scope investwise
vercel domains verify www.crimemania.com --scope investwise
```

Painel: [Project → Settings → Domains](https://vercel.com/investwise/crime-mania/settings/domains)

---

## Registro.br — `crimemania.com.br`

Painel: [Registro.br](https://registro.br) → domínio → **Editar zona** (mantém NS `a.auto.dns.br` / `b.auto.dns.br`).

### Registros recomendados pela Vercel (preferência rank 1)

| Tipo | Nome / host | Valor | TTL |
|------|-------------|-------|-----|
| **A** | `@` (apex / vazio) | `216.198.79.1` | 3600 (ou padrão) |
| **A** | `@` | `64.29.17.1` | 3600 |
| **CNAME** | `www` | `6d07db50557dbb99.vercel-dns-017.com` | 3600 |

Alternativa aceita (rank 2, CLI `inspect` legado):

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| A | `www` | `76.76.21.21` |

Alternativa **nameservers Vercel** (substitui toda a zona no Registro.br — só se quiser DNS só na Vercel):

- `ns1.vercel-dns.com`
- `ns2.vercel-dns.com`

Remover registros antigos conflitantes (A/CNAME de outro host) antes de salvar.

---

## GoDaddy — `crimemania.com`

Painel: GoDaddy → **DNS** do domínio (NS atuais: `ns63.domaincontrol.com`, `ns64.domaincontrol.com`).

### Registros recomendados pela Vercel (preferência rank 1)

| Tipo | Nome | Valor | Notas |
|------|------|-------|--------|
| **A** | `@` | `216.198.79.1` | Remover A antigos (`76.223.105.230`, `13.248.243.5`) |
| **A** | `@` | `64.29.17.1` | Dois A no apex |
| **CNAME** | `www` | `6d07db50557dbb99.vercel-dns-017.com` | Substituir CNAME `www` → `crimemania.com` |

Fallback CNAME genérico (se o host project-specific falhar): `cname.vercel-dns.com`

Alternativa apex (rank 2): um único **A** `@` → `76.76.21.21`.

---

## Canônico, redirects e env (após DNS **Valid**)

1. Vercel → Domains → definir **`crimemania.com.br`** como **Primary** (Production).
2. O app já redireciona `crimemania.com`, `www.crimemania.com` e `www.crimemania.com.br` → `crimemania.com.br` (`next.config.ts`).
3. Atualizar env **Production** (e Preview se quiser paridade):

| Variável | Valor sugerido |
|----------|----------------|
| `APP_BASE_URL` | `https://crimemania.com.br` |
| `ASAAS_CHECKOUT_SUCCESS_URL` | `https://crimemania.com.br/membro/conta` (domínio cadastrado no Asaas) |

4. Google Cloud Console → OAuth → **Authorized redirect URIs** (manter localhost + vercel.app + adicionar):

   - `https://crimemania.com.br/api/auth/google/callback`
   - `https://www.crimemania.com.br/api/auth/google/callback` (opcional se não redirecionar antes do OAuth)
   - `https://crimemania.com/api/auth/google/callback`
   - `https://www.crimemania.com/api/auth/google/callback`

   Com redirect canônico, o fluxo normal usa a origem da requisição; incluir o apex `.com.br` é obrigatório.

5. Asaas → domínios permitidos para callback de pagamento — ver [asaas-billing.md](./asaas-billing.md).
6. `vercel deploy --prod` após mudar env.

**Produção (27 out 2026, ~12:42 BRT):** DNS verificado nos quatro hosts; `APP_BASE_URL` = `https://crimemania.com.br`; `ASAAS_CHECKOUT_SUCCESS_URL` = `https://crimemania.com.br/membro/conta`; deploy prod `crime-mania-nkbh70vyz-investwise.vercel.app`. Definir **Primary** = `crimemania.com.br` no painel Vercel → Domains (CLI `vercel alias` para `.com.br` pode falhar na emissão de certificado até o primary estar definido).

---

## Comandos úteis (CLI)

```bash
# Anexar domínio ao projeto (já feito em 27/10/2026)
vercel domains add crimemania.com.br crime-mania --scope investwise
vercel domains add crimemania.com crime-mania --scope investwise
vercel domains add www.crimemania.com.br crime-mania --scope investwise
vercel domains add www.crimemania.com crime-mania --scope investwise

vercel domains inspect crimemania.com.br --scope investwise
```

Propagação DNS: tipicamente minutos a 48 h (BR + GoDaddy).

---

## Verificação rápida

```bash
vercel domains verify crimemania.com.br --scope investwise   # misconfigured: false
curl -sI https://crimemania.com.br | rg -i '^HTTP|server'
curl -sI https://crimemania.com | rg -i location   # → crimemania.com.br
```

Painel Vercel → Domains → **Primary** = `crimemania.com.br` (se ainda não estiver).
