# QA — HTML Dossier (Banfield) — 2026-10-06

Base: **https://crime-mania-git-docs-qa-env-production-investwise.vercel.app** (automation blocked without `VERCEL_AUTOMATION_BYPASS_SECRET`)

## Environment note

Preview URLs (`*.vercel.app`) require `VERCEL_AUTOMATION_BYPASS_SECRET` for Playwright login. Re-run:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=… node scripts/qa-html-dossier-capture.mjs "https://crime-mania-git-docs-qa-env-production-investwise.vercel.app"
```

Output directory: `private/qa-screenshots/html-dossier-2026-10-06/` (not `html-dossier-2026-06`).

## Completed in branch

| Item | Status |
|------|--------|
| Full HTML admin editor (`DossierDocumentEditor`) | Done |
| Job polling + PDF upload in admin | Done |
| Publish guard (no empty/failed auto-publish) | Done |
| Version snapshots (migration 005) | Done |
| Embedded PDF images → Blob | Done (when storage in worker) |
| OCR fallback | `needs_review` + warning (tesseract optional) |
| Gallery desktop ≥70% + overlaid arrows | Done |
| QA script zero-dimension false positives | Fixed in `qa-html-dossier-capture.mjs` |
| Banfield PDF vs HTML report | `banfield-pdf-html-compare.json` |
| E2E second PDF (extract) | `E2E-SECOND-PDF.md` |

## Pass/fail (automation)

| Criterion | Result |
|-----------|--------|
| Preview Playwright login | **FAIL** (401 without bypass secret) |
| Local Playwright login | **FAIL** (dev server / DB not running in agent session) |
| **Overall automation** | **BLOCKED** — manual Preview QA with SSO required |

## Manual Preview checklist

- [ ] 390 / 430 / 768 / 1280 viewports after full load
- [ ] Gallery desktop width ≥70% of content column (measure in DevTools)
- [ ] Admin: upload `private/qa-fixtures/qa-html-sample.pdf` on `carol-stuart`, edit, publish, unpublish

## Artifacts

- `report.json` — regenerate after successful capture run
- `banfield-pdf-html-compare.json` / `.md`
- `E2E-SECOND-PDF.md`
