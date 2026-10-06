# Banfield figures fix — QA report (2026-10-06)

## Inset fix (fig-mapa-inset)

- **Problema:** crop 705×433 (`yEnd=0.51`) cortava a segunda linha de coordenadas (`77.3538° W`).
- **Correção:** apenas `yEnd` 0.51 → **0.525** (sem alterar `xStart`/`xEnd`/`yStart`).
- **Dimensões finais:** **705×476** (rect px: left 891, top 1036, right 1596, bottom 1512).
- **Verificação visual:** `asset-verify-inset.png` — ambas as linhas (`38.9589° N`, `77.3538° W`) visíveis com margem inferior; coluna N/seta e contorno da Virgínia intactos.
- **fig-vitimas:** **414×410** inalterado (SHA `98419580f172080a…`); crop não tocado; ficheiro não regenerado nesta passagem.

## Asset verification (source crop)

- `asset-verify-inset.png` — inset com coordenadas completas.
- `ASSET-MANIFEST.json` — dimensões e SHA-256 dos `.webp` locais.

## Automated tests

- `npm run test:banfield-html-figures` — **PASS** (inset height até 490px).
- `npm run build` — **PASS**.
- `npm run dossier:bootstrap-banfield-document` — **PASS** (Blob + Postgres com `.env.local`).

## Reader screenshots (390 / 430 / 768 / 1280 + lightbox)

**Bloqueado nesta sessão:** Playwright Chromium não instalado (`npx playwright install chromium` necessário). Reexecutar:

```bash
node scripts/qa-banfield-figures-capture.mjs https://<preview-host>
```

## Preview deploy (não produção)

- Branch: `hotfix/banfield-figures-2026-10-06`
- Commit: _(atualizar após push)_
- URL preview: _(Vercel deployment desta branch — sem promote produção)_

## Produção

- **Sem deploy produção** até OK explícito do owner.
- Commit `f86e8a9` não deve ir para produção como estado final deste hotfix.
