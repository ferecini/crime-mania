# Mobile dossier QA v2 — 2026-10-06

Base: http://127.0.0.1:3000

## Pass/fail

| Criterion | Result |
|-----------|--------|
| no horizontal scroll 390 | PASS |
| Overall screenshots | PASS |

## Screenshots

| File | naturalW×H | renderedW×H | Pass |
|------|------------|-------------|------|
| reader-mobile-390-top.png | 358×76 | 354×76 | PASS |
| reader-mobile-390-block2.png | 308×299 | 354×344 | PASS |
| reader-mobile-390-timeline.png | 358×22 | 354×23 | PASS |
| gallery-mobile-390.png | 780×520 | 352×235 | PASS |
| lightbox-mobile-390.png | 1200×800 | 358×239 | PASS |
| reader-desktop-1280.png | —×— | —×— | PASS |
| contact-mobile-crops.png | —×— | —×— | PASS |
| contact-desktop-crops.png | —×— | —×— | PASS |

## JSON

```json
{
  "base": "http://127.0.0.1:3000",
  "capturedAt": "2026-10-06T16:33:15.985Z",
  "shots": [
    {
      "file": "reader-mobile-390-top.png",
      "naturalWidth": 358,
      "naturalHeight": 76,
      "renderedWidth": 354,
      "renderedHeight": 76,
      "pass": true
    },
    {
      "file": "reader-mobile-390-block2.png",
      "naturalWidth": 308,
      "naturalHeight": 299,
      "renderedWidth": 354,
      "renderedHeight": 344,
      "pass": true
    },
    {
      "file": "reader-mobile-390-timeline.png",
      "naturalWidth": 358,
      "naturalHeight": 22,
      "renderedWidth": 354,
      "renderedHeight": 23,
      "pass": true
    },
    {
      "file": "gallery-mobile-390.png",
      "naturalWidth": 780,
      "naturalHeight": 520,
      "renderedWidth": 352,
      "renderedHeight": 235,
      "widthRatioVsViewport": 0.9025641025641026,
      "pass": true
    },
    {
      "file": "lightbox-mobile-390.png",
      "naturalWidth": 1200,
      "naturalHeight": 800,
      "renderedWidth": 358,
      "renderedHeight": 239,
      "pass": true
    },
    {
      "file": "reader-desktop-1280.png",
      "blocks": {
        "d01": {
          "naturalWidth": 1152,
          "naturalHeight": 246,
          "renderedWidth": 806,
          "renderedHeight": 172
        },
        "d02": {
          "naturalWidth": 1152,
          "naturalHeight": 377,
          "renderedWidth": 806,
          "renderedHeight": 264
        }
      },
      "pass": true
    },
    {
      "file": "contact-mobile-crops.png",
      "pass": true,
      "blockCount": 15
    },
    {
      "file": "contact-desktop-crops.png",
      "pass": true,
      "blockCount": 13
    }
  ],
  "criteria": [
    {
      "name": "no horizontal scroll 390",
      "pass": true
    }
  ],
  "overallPass": true
}
```
