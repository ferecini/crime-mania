# Banfield figures fix — QA report (2026-10-06)

## Asset verification (source crop)

- `asset-verify-fig-vitimas.png` — grade 2×2 (414×410).
- `asset-verify-fig-mapa-main.png` — painel Fairfax/DC (908×465).
- `asset-verify-fig-mapa-inset.png` — inset Virgínia + coordenadas (705×476).
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
    "height": 465,
    "aspect": 1.953,
    "bytes": 73242,
    "sha256": "00e545cb0fbdc15259ea1dd25efb6bdab80c1d8c2d2267e940de6b3b00237e18"
  },
  "fig-mapa-inset": {
    "width": 705,
    "height": 476,
    "aspect": 1.481,
    "bytes": 33206,
    "sha256": "491cecfdf85083663eb4202eba0bba10bc38fff872b51eed8a12d3d5c6d2e15a"
  }
}
```

## Documento HTML (v6)

- Figura `fig-vitimas` na seção **Vítimas** (`sections[].id === "vitimas"`).
- `fig-mapa-main` + `fig-mapa-inset` na seção **Mapa** em todos os breakpoints (grid 1 col mobile, 2 cols desktop); sem `fig-mapa` wide.
- Bootstrap: `npm run dossier:bootstrap-banfield-html` → Blob `v6` + Postgres `published`.

## Automated tests

- `npm run test:banfield-html-figures` — PASS.
- `npm run build` — PASS.

## DOM mapa (768 / 1280)

Ver `dom-map-768.json` e `dom-map-1280.json` — rect + computed styles dos `<img>`.

## Reader screenshots (390 / 430 / 768 / 1280 + lightbox)

Capturas após `document ready` e `naturalWidth > 0` em `fig-vitimas`, `fig-mapa-main`, `fig-mapa-inset`:

- `reader-390.png`, `reader-768.png`, `reader-1280.png`
- `map-section-768.png`, `map-section-1280.png`, `img-main-768.png`, `img-inset-768.png`
- `dom-map-768.json`, `dom-map-1280.json`
- `vitimas-390.png`, `map-main-390.png`, `map-inset-390.png`, `lightbox-map-390.png` (só o dialog)

## QA pass table

| Check | Result | Notes |
| --- | --- | --- |
| free login | PASS | 200 |
| free document 403 | PASS | 403 |
| free gallery 403 | PASS | 403 |
| tier1 document 200 v4 | PASS | 200 v=6 |
| document fig-vitimas in seção vitimas | PASS | figures=3 |
| document map main/inset in seção mapa | PASS | [{"sectionId":"mapa","assetId":"fig-mapa-main"},{"sectionId":"mapa","assetId":"fig-mapa-inset"}] |
| tier1 asset fig-vitimas 200 | PASS | 200 |
| tier1 asset fig-mapa-main 200 | PASS | 200 |
| tier1 asset fig-mapa-inset 200 | PASS | 200 |
| tier1 gallery 5 items | PASS | 200 n=5 |
| tier2 document 200 | PASS | 200 |
| tier2 gallery 5 items | PASS | 200 n=5 |
| reader mostra fig-vitimas @390 | PASS | naturalWidth=414 |
| reader mostra fig-mapa-main @390 | PASS | img h=199.7px |
| reader mostra fig-mapa-inset @390 | PASS | naturalWidth=705 |
| fig-mapa-main img height @390 ≥180px | PASS | img w×h=390.0×199.7 |
| lightbox mapa img ≥180px h @390 | PASS | {"width":366,"height":187.421875} |
| map imgs visíveis @768 (DOM) | PASS | ver dom-map-768.json |
| map imgs visíveis @1280 (DOM) | PASS | ver dom-map-1280.json |
| npm test:banfield-html-figures | PASS | |
| npm run build | PASS | |

## Preview deploy (não produção)

- Base URL: http://localhost:3021
- Commit: `21710c6` on branch `hotfix/banfield-figures-2026-10-06`

## Produção

- **Não promover** até validação visual da proprietária neste chat.
