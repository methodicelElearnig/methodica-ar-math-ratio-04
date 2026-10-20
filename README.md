# methodica-ar-math-ratio-04

יעד 1.4 — יחס בין כמויות. The client's multi-component delivery repo, built
from the single-folder unit `units/methodica-math-ratio-04/` on 24.09.26.

## Shape

Global screen numbering (the approved shape used by ratio-01-02-main and
percent-07/08-main): screens keep one 0..67 range across the whole unit and
`window.PART_CONFIG` in each component's `script.js` bounds that component.

| component | screens | deck slides | content |
|---|---|---|---|
| 01 | 0–19  | 3–28  | פתיחה, הוראה מונחית וסיכום |
| 02 | 20–28 | 30–38 | תרגול סטנדרטי א |
| 03 | 29–39 | 40–50 | תרגול בסיסי ותרגול סטנדרטי ב |
| 04 | 40–42 | 52–54 | משימת כיתה |
| 05 | 43–47 | 56–60 | תרגול מתקדם |
| 06 | 48–56 | 62–70 | שאלת שיא — תשלום לוועד הבית |
| 07 | 57–67 | 72–82 | שאלת שיא — הטיול השנתי |

The split is the deck's own: slides 2, 29, 39, 51, 55, 61 and 71 are `רכיב N`
separators that print the folder name to use. It was not inferred.

## Layout

- `index.html` — redirects to component 01 (`…-01/index.html`, query string kept). Local
  browsing only: **never packaged** — the platforms launch each component by its own link.
- `<unit>-0N/` — one folder per component: `index.html` (that component's static screens only),
  `script.js` (CONFIGURATION ONLY — `PART_CONFIG` and the xAPI maps), `assets/img/` (only the
  images its own screens reference), and `index_dev.html`, a dev bar that iframes the component's
  `index.html` (byte-identical in all seven; never packaged).
- `unit-js/` — the shared behaviour layer, ONE copy: the 720-core engine plus the platform layer
  (xAPI reporting, issue report, resume) — see `unit-js/README.md`.
- `unit-css/styles.css` — the one stylesheet. `unit-assets/` — fonts and the companion-character
  family, shared by every component.
- `metadata/` — unit json + one per component (the source of every reported id).
- `_test/` — headless harness (`_test/README.md`). `docs-and-tools/` — packaging tools and the
  reporting/resume unit record (`REPORTING-RESUME.md`). `translations/` — the XLIFF export.
  None of these ships.

No top-level identifier may exist in both `unit-js` and a `script.js`; the
collision is silent and last-wins (`_test/verify-report.js` asserts it).

## Reporting and resume

xAPI to Kata through the MOE library (`xapi-720-k.js`, CDN, never shipped), the shared
"מצאתם בעיה?" form, and resume through Kata's State API — one document per component. The
platform owns routing: a component's last button reports `completed` and stops. Design and
decisions: `docs-and-tools/REPORTING-RESUME.md`; family guide:
`2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md`.

Local walk with the stand-in library, served from the folder above the repo:

```
http://localhost:<port>/methodica-ar-math-ratio-04/methodica-ar-math-ratio-04-01/index.html?xapiLib=../_test/xapi-720-k.js&resetState
```

`&dev=1` gives free navigation and the hops between components.

## Verified (24.09.26, over HTTP)

- each component builds EXACTLY its own screen range, no extras, no gaps;
- each opens on its own first screen, with no uncaught errors;
- `?screen=last` back-entry lands on the part's last screen (now under `?dev=1` only);
- every screen in every component: no missing media, no x-scroll, nothing off
  the 1280×720 stage, no type under 18px.

Re-checked 30.09.26 after the optimization: every screen of every component with both
characters, zero 404s, both fonts loaded (`_test/verify-assets.js` guards the paths).

`file://` will not do cross-component hops — serve it (`python3 -m http.server`).
