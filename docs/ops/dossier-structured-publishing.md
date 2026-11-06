# Dossiês: publicação estruturada (sem PDF)

O leitor mobile-first (HTML) passa a ser alimentado por **campos de formulário**, não por PDF.

## Modelo

`DossierDocument.caseForm` (`src/lib/dossier/case-form.ts`) é a fonte da verdade:

| Campo do formulário | Seção gerada (`sections`) | Render |
| --- | --- | --- |
| Capa (título, subtítulo, abertura) | `intro` | H1/H2 + parágrafos |
| Resumo do caso (ficha + destaque) | `facts` | cards + callout |
| Vítimas (nome, descrição, foto, crédito) | `vitimas` | bloco `people` (1 pessoa = foto em destaque; várias = grade 2/3/4 colunas) |
| Fases (rótulo, título, texto, imagens) | `fase-<id>` (`kind: "phase"`) | card de etapa com índice sticky |
| Linha do tempo (data, título, texto, imagem opcional) | `timeline` | mobile: trilho vertical; `md+`: espinha central, cards alternados |
| Mapa e imagens | `mapa` | figuras com lightbox |
| Teorias (texto + citação) | `teorias` | parágrafos + quote |

Em toda gravação (`sanitizeDocument`) as `sections` são **regeneradas** a partir do `caseForm`, então leitor, banco
(`dossier_documents.draft/published` JSONB), versões e API pública continuam iguais. Nenhuma migration SQL nova.

## Fluxo do redator

1. `/membro/admin/dossiers` → **Novo dossiê (sem PDF)** (slug + título + plano). Exige `POSTGRES_URL`.
2. **Editar dossiê** → **Criar dossiê em branco** → preencher os 7 painéis (fotos via “Enviar foto/Adicionar imagem”).
3. **Salvar rascunho** → **Ver prévia (rascunho salvo)** (`/membro/admin/dossiers/<slug>/previa`; abra no celular).
4. **Publicar**. Dossiês criados no admin aparecem em `/membro/dossies/<slug>` e na listagem `?all=1` após publicados.

Imagens: até 8 MB (convertidas para WebP no servidor). Em hospedagem serverless o limite de corpo da requisição pode ser
menor (~4,5 MB na Vercel) — reduza fotos grandes antes do envio.

## Migração de dossiês antigos

- **HTML editorial / extraído de PDF (ex.: Banfield)**: continuam funcionando sem mudanças (leitor lê `sections`).
- **Banfield em produção:** rode `npx tsx scripts/dossier-bootstrap-banfield-document.ts` com `POSTGRES_URL` (e `BLOB_READ_WRITE_TOKEN` se usar Blob). O script grava `caseForm` com vítimas separadas (legenda com vírgulas vira um card por nome; pode trocar fotos no admin).
- Para editar por campos: abrir **Editar dossiê** → **Converter para formulário** (`importCaseForm`): seções conhecidas
  (`intro`, `facts`, `vitimas`, `timeline`, `mapa`, `teorias`) mapeiam 1:1; seções só com título/parágrafo/imagem viram
  **fases** (cada heading = uma fase); o resto é preservado em `extraSections` (somente leitura). Revise, salve e publique.
- “Desativar formulário” volta ao editor de blocos legado (mantém as `sections` atuais).
- **Fluxo PDF** (`dossier:process`, worker, upload) permanece como importador opcional (`<details>` no admin); o
  botão de download do PDF só aparece se o dossiê estático tiver `documentFile`. Reader legado por recortes continua atrás
  de `DOSSIER_LEGACY_CROP_READER=1`.

## Env vars

Sem novas variáveis. Usadas: `POSTGRES_URL`/`DATABASE_URL` (documentos e catálogo), `BLOB_READ_WRITE_TOKEN` (imagens;
em dev sem Blob o storage local é usado), `CM_EDITORIAL_USER_IDS` / `CM_DOSSIER_ADMIN_IDS` (quem acessa o admin).

## Testes

`npm run test:dossier-case-form` (import/compile/sanitize, usa o JSON do Banfield) e `npx tsc --noEmit`.
