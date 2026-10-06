# Banfield figures fix — QA report (2026-10-06)

## Asset verification (source crop)

- `asset-verify-fig-vitimas.png` — grade 2×2 limpa (sem «01. RESUMO DO» nem parágrafo lateral).
- `asset-verify-fig-mapa.png` — mapa completo Fairfax / DC / inset Virgínia (sem faixa «02. MAPA»).
- `ASSET-MANIFEST.json` — dimensões e SHA-256 dos `.webp` publicados.

## Automated tests

- `npm run test:banfield-html-figures` — PASS (dimensões + aspecto; rejeita perfil 1440×287 defeituoso).
- `npm run dossier:bootstrap-banfield-html` — publicado **documento v2** (Blob + Postgres quando `.env.local` carregado).

## Reader screenshots (390 / 430 / 768 / 1280 + lightbox)

Pendente: `node scripts/qa-banfield-figures-capture.mjs http://127.0.0.1:3000` após `npx playwright install chromium` (Chromium não estava instalado neste ambiente).

## Produção

- **Deploy produção atual (GitHub):** `1cc75c4` — anterior a este hotfix; pode servir **fig-mapa/fig-vitimas v1** defeituosos se bootstrap antigo rodou.
- **SHA `03b61367`:** não encontrado no histórico git local (provável ID Vercel, não commit).
- **Ação:** apenas preview após push; **sem promote produção** até reautorização pós-QA visual completa.
