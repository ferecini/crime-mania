# Banfield figures fix — QA report (2026-10-06)

## Asset verification (source crop)

- `asset-verify-fig-vitimas.png` — grade 2×2 limpa (414×410, labels Christine/Joseph/Brendan/Juliana completos; sem coluna de texto).
- `asset-verify-fig-mapa-main.png` — painel Fairfax/DC (908×465, inalterado).
- `asset-verify-fig-mapa-inset.png` — inset Virgínia + coordenadas 38.9589° N / 77.3538° W no asset (705×433).
- `asset-verify-fig-mapa.png` — composição wide desktop-only (1582×275).
- `ASSET-MANIFEST.json` — dimensões e SHA-256 dos `.webp` publicados.

```json
{
  "fig-vitimas": {
    "width": 414,
    "height": 410,
    "aspect": 1.01,
    "bytes": 33144,
    "sha256": "98419580f172080a3f2f0bb2fd8ea715e61251a41c395e7b80dc686089c954e3"
  },
  "fig-mapa-main": {
    "width": 908,
    "height": 465,
    "aspect": 1.953,
    "bytes": 55680,
    "sha256": "7a0d7a6e97e2ab132397de98a24413e203ac58472c132e3ada252332490e70f8"
  },
  "fig-mapa-inset": {
    "width": 705,
    "height": 433,
    "aspect": 1.628,
    "bytes": 29420,
    "sha256": "8432490f4b01fc7ea78ca209d053e243c17b89233dae34d91fd7063eb757ab74"
  },
  "fig-mapa": {
    "width": 1582,
    "height": 275,
    "aspect": 5.753,
    "bytes": 79216,
    "sha256": "372ff2a6e55118d9b1f40772d57c90079d7f54e271dc61d60e972c3d117d481a"
  }
}
```

## Coords handling

- **Escolha:** estender crop do inset (`yEnd` 0.51) para incluir as coordenadas no PNG; caption JSON alinhada (`38,9589° N, 77,3538° O`).

## Automated tests

- `npm run test:banfield-html-figures` — PASS (`055efc9`).
- `npm run dossier:bootstrap-banfield-html` — documento **v3** publicado (Blob + Postgres com `.env.local`).

## Reader screenshots (390 / 430 / 768 / 1280 + lightbox)

Pendente neste ambiente: `npx playwright install chromium` + `QA_COMMIT_SHA=055efc9 node scripts/qa-banfield-figures-capture.mjs https://crime-mania-2wzdd1e3k-investwise.vercel.app` (install Chromium demorou/travou no sandbox).

## Preview deploy (não produção)

- https://crime-mania-2wzdd1e3k-investwise.vercel.app/dossiers/familia-banfield
- Commit: `055efc9` on branch `hotfix/banfield-figures-2026-10-06`

## Produção

- **Deploy produção atual (GitHub):** `1cc75c4` — anterior a este hotfix.
- **Ação:** preview only; **não aprovado para promote produção** até validação visual do usuário.
