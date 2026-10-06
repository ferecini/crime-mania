# E2E — segundo PDF (carol-stuart)

Gerado: 2026-10-06T16:33:19.429Z

| Step | Pass | Detail |
|------|------|--------|
| sample PDF exists | PASS | /Users/angeloferecini/.cursor/CrimeMania/private/qa-fixtures/qa-html-sample.pdf |
| extractDocumentFromPdf | PASS | 2 blocks |
| status needs_review (no auto-publish) | PASS | needs_review |
| edit >=2 blocks + reorder | PASS | local mutation |
| OCR path when no text | PASS | text layer OK |

## Manual (Preview admin)

1. Login admin → `/membro/admin/dossiers/carol-stuart`
2. Upload `private/qa-fixtures/qa-html-sample.pdf`
3. Aguardar job `needs_review` (worker GH Actions ou `npm run dossier:worker`)
4. Editor HTML: editar ≥2 blocos, reordenar, alt/caption em imagem se houver
5. Salvar rascunho → Publicar → verificar reader tier1
6. Despublicar → limpar rascunho/teste se necessário

**Nota:** Upload/publish no Preview exige sessão admin + Blob + Neon migrado (004/005).
