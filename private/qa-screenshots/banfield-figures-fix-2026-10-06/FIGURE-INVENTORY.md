# Banfield — inventário PDF vs documento HTML (2026-10-06)

Fonte PDF: `private/dossiers/Dossie_Banfield.pdf` (1 página).  
Documento HTML: `scripts/data/familia-banfield-document.json` (v2).

| Elemento visual no PDF | Tratamento no HTML | Asset / bloco | Estado |
| --- | --- | --- | --- |
| Capa + título + lede | Texto (`heading`, `paragraph`) | — | Presente |
| 01. Resumo — grade 2×2 (Christine, Joseph, Brendan, Juliana) | Figura limpa (sem título 01 nem parágrafo) | `fig-vitimas` | **Presente** (v2 crop) |
| 01. Resumo — parágrafo editorial | Texto + callout | blocos `facts`, `callout-teaser` | Presente |
| Metadados (vítimas, local, data) | Bloco `facts` | — | Presente |
| 02. Mapa — painel satélite + inset VA + coordenadas | Figura limpa (sem faixa «02. MAPA») | `fig-mapa` | **Presente** (v2 crop) |
| 03. Linha do tempo — 5 marcos | Bloco `timeline` (HTML) | — | Presente (sem raster) |
| Teorias / defesas / acusação (3 colunas) | Seções `versoes` + `teorias` | — | Presente (texto) |
| Encerramento / rodapé dossiê | Parágrafo + quote | — | Presente |

## Figuras raster da galeria (PDF crop reader)

Blocos `m05-mapa` / `d03-mapa` ainda cobrem a **seção** 02 (inclui título). O leitor HTML usa apenas `fig-mapa` / `fig-vitimas` acima.

## Assets HTML locais (após `dossier:extract-banfield-figures`)

Ver `ASSET-MANIFEST.json` nesta pasta (gerado na QA).
