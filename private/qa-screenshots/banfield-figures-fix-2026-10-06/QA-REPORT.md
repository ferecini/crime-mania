# Banfield figures fix — QA report (2026-10-06)

## Asset verification (source crop)

- `asset-verify-fig-vitimas.png` — grade 2×2 (414×410).
- `asset-verify-fig-mapa-main.png` — painel Fairfax/DC (908×465).
- `asset-verify-fig-mapa-inset.png` — inset Virgínia + coordenadas (705×476).
- `asset-verify-fig-mapa.png` — composição wide desktop-only (1582×275).
- `ASSET-MANIFEST.json` — dimensões e SHA-256 dos `.webp`.

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
    "height": 508,
    "aspect": 1.787,
    "bytes": 54860,
    "sha256": "6d23f991eba6d1987e234e964934c7132985dc7d0f3f712a40e805d29f75ec90"
  },
  "fig-mapa-inset": {
    "width": 705,
    "height": 476,
    "aspect": 1.481,
    "bytes": 33206,
    "sha256": "491cecfdf85083663eb4202eba0bba10bc38fff872b51eed8a12d3d5c6d2e15a"
  },
  "fig-mapa": {
    "width": 1594,
    "height": 294,
    "aspect": 5.422,
    "bytes": 62800,
    "sha256": "2aff24438fa234434fd726d492e40da6961294531e229d5ca72c474ca9c047b4"
  }
}
```

## Documento HTML (v4)

- Figura `fig-vitimas` na seção **Vítimas** (`sections[].id === "vitimas"`).
- `fig-mapa-main` + `fig-mapa-inset` na seção **Mapa** (`sections[].id === "mapa"`), visíveis em mobile/tablet/desktop (sem `showWhen` nos painéis corrigidos).
- Bootstrap: `npm run dossier:bootstrap-banfield-html` → Blob `v4` + Postgres `published`.

## Automated tests

- `npm run test:banfield-html-figures` — PASS.
- `npm run build` — PASS.

## Reader screenshots (390 / 430 / 768 / 1280 + lightbox)

Capturas após `document ready` e `naturalWidth > 0` em `fig-vitimas`, `fig-mapa-main`, `fig-mapa-inset`:

- `reader-390.png`, `reader-430.png`, `reader-768.png`, `reader-1280.png`
- `vitimas-390.png`, `map-main-390.png`, `map-inset-390.png`
- `lightbox-map-390.png`

## QA pass table

| Check | Result | Notes |
| --- | --- | --- |
| free login | PASS | 200 |
| free document 403 | PASS | 403 |
| free gallery 403 | PASS | 403 |
| tier1 document 200 v4 | PASS | 200 v=4 |
| document fig-vitimas in seção vitimas | PASS | figures=4 |
| document map main/inset in seção mapa | PASS | [{"sectionId":"mapa","assetId":"fig-mapa-main"},{"sectionId":"mapa","assetId":"fig-mapa-inset"},{"sectionId":"mapa","assetId":"fig-mapa"}] |
| tier1 asset fig-vitimas 200 | PASS | 200 |
| tier1 asset fig-mapa-main 200 | PASS | 200 |
| tier1 asset fig-mapa-inset 200 | PASS | 200 |
| tier1 gallery 5 items | PASS | 200 n=5 |
| tier2 document 200 | PASS | 200 |
| tier2 gallery 5 items | PASS | 200 n=5 |
| reader mostra fig-vitimas @390 | PASS | naturalWidth=414 |
| reader mostra fig-mapa-main @390 | PASS | h=180.1px |
| reader mostra fig-mapa-inset @390 | PASS | naturalWidth=705 |
| fig-mapa-main height @390 ≥180px | PASS | w=322.0 |
| lightbox mapa carrega | PASS | dialog img ok |
| reader @1280 sem loading | PASS | |
| npm test:banfield-html-figures | PASS | |
| npm run build | PASS | |

## Preview deploy (não produção)

- Base URL: http://127.0.0.1:3021
- Commit: `be6fee9` on branch `hotfix/banfield-figures-2026-10-06`

## Produção

- **Não promover** até validação visual da proprietária neste chat.
