# Banfield figures fix — QA report (2026-10-06)

## Asset verification (source crop)

- `asset-verify-fig-vitimas.png` — grade 2×2 limpa (414×410; xEnd 0.285; sem coluna «01. RESUMO DO»).
- `asset-verify-fig-mapa-main.png` — Fairfax/DC (908×508 após padding; aspect 1.79 → ~180px @322px content width em 390).
- `asset-verify-fig-mapa-inset.png` — inset Virgínia + coordenadas completas (705×476; yEnd 0.525).
- `asset-verify-fig-mapa.png` — faixa wide desktop (1594×294).
- `ASSET-MANIFEST.json` — dimensões e SHA-256 abaixo.

## Automated tests

| Check | Result | Notes |
| --- | --- | --- |
| `npm run test:banfield-html-figures` | PASS | vitimas + map main/inset/desktop |
| `npm run build` | PASS | Next 15.5.26 |
| `npm run dossier:bootstrap-banfield-html` | PASS | documento **v4** → Blob `v4` + Postgres |

## Reader / API QA (tier1, localhost `:3020` dev + `:3035` prod start)

| Check | Result | Notes |
| --- | --- | --- |
| tier1 login + reader ready | PASS | dev `:3020`, Playwright + `PLAYWRIGHT_CHANNEL=chrome` |
| fig-vitimas visível @390 | PASS | naturalWidth 414; screenshot `vitimas-390.png` |
| fig-mapa-main @390 height ≥180px | PASS | wrapper `min-h-[180px]` + asset 908×508; button box ≥180px |
| fig-mapa-inset visível @390 | PASS | naturalWidth 705; `map-inset-390.png` |
| lightbox mapa | PASS | `lightbox-map-390.png` |
| reader 390/430/768/1280 | PASS | `reader-*.png` (commit `8fc9bdb` + refresh local) |
| free document 403 | PASS | API localhost |
| tier1 document v4 + fig blocks | PASS | seções `vitimas` / `mapa` |
| tier1/tier2 gallery 5 items | PASS | manifest API |
| Preview Vercel API (sem bypass) | FAIL | 401 Deployment Protection — usar SSO browser ou `VERCEL_AUTOMATION_BYPASS_SECRET` |

Capturas: `private/qa-screenshots/banfield-figures-fix-2026-10-06/` (`reader-*`, `vitimas-390`, `map-main-390`, `map-inset-390`, `lightbox-map-390`).

## Preview deploy (não produção)

- Branch preview: https://crime-mania-git-hotfix-banfield-figures-2026-10-06-investwise.vercel.app/dossiers/familia-banfield
- PR: https://github.com/ferecini/crime-mania/pull/9
- **Produção permanece** `1cc75c4` até OK explícito no chat (sem promote).

## Produção

- Não promover este hotfix até validação visual da proprietária.
