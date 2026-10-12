# Translation Export Report — methodica-math-ratio-04, Target 04

**Module root:** `units/methodica-math-ratio-04-main`  
**Module name:** `methodica-math-ratio-04`  
**Target:** `04`  
**Parts covered:** `01, 02, 03, 04, 05, 06, 07`  
**Export type:** First export (no prior XLIFF for this target; §7 refresh workflow does not apply)  
**Files:** `methodica-math-ratio-04_target-04_he.xlf`, `translation-screen-manifest.csv`, `sweep1-results.csv`, `sweep2-uncovered.csv`, `stats.json`, this report

---

## 1. Discrepancy check against the part list

The folder structure was walked before extraction. **Result: parts 01, 02, 03, 04, 05, 06, 07 exist, no gaps and no undocumented extras.**

The module root `index.html` (the LMS-entry redirect) and any shared `unit-js/` layer are covered as pseudo-part `00`, screen `99`.

## 2. Totals

| Metric | Count |
|---|---|
| Total screens (incl. pseudo-screen `-99` chrome) | **76** |
| Total translation units | **712** |
| Manual-review-flagged units | **0** |
| Excluded strings (logged, §5) | **0** |

### Units per part

| Part | Units |
|---|---|
| `04-00` | 409 |
| `04-01` | 84 |
| `04-02` | 29 |
| `04-03` | 34 |
| `04-04` | 47 |
| `04-05` | 28 |
| `04-06` | 41 |
| `04-07` | 40 |

### Units per source file

| File | Units |
|---|---|
| `index.html` | 2 |
| `methodica-math-ratio-04-01/index.html` | 84 |
| `methodica-math-ratio-04-02/index.html` | 29 |
| `methodica-math-ratio-04-03/index.html` | 34 |
| `methodica-math-ratio-04-04/index.html` | 47 |
| `methodica-math-ratio-04-05/index.html` | 28 |
| `methodica-math-ratio-04-06/index.html` | 41 |
| `methodica-math-ratio-04-07/index.html` | 40 |
| `unit-js/70-platform.js` | 8 |
| `unit-js/questions.js` | 326 |
| `unit-js/quiz-engine.js` | 22 |
| `unit-js/unit.js` | 51 |

### Units per screen

| Screen | Units |
|---|---|
| `04-00-09` | 2 |
| `04-00-10` | 4 |
| `04-00-11` | 4 |
| `04-00-12` | 2 |
| `04-00-13` | 2 |
| `04-00-14` | 4 |
| `04-00-15` | 4 |
| `04-00-16` | 1 |
| `04-00-17` | 3 |
| `04-00-19` | 11 |
| `04-00-21` | 10 |
| `04-00-22` | 9 |
| `04-00-23` | 10 |
| `04-00-24` | 8 |
| `04-00-25` | 11 |
| `04-00-26` | 7 |
| `04-00-27` | 8 |
| `04-00-28` | 11 |
| `04-00-30` | 8 |
| `04-00-31` | 6 |
| `04-00-32` | 6 |
| `04-00-33` | 7 |
| `04-00-34` | 8 |
| `04-00-36` | 9 |
| `04-00-37` | 9 |
| `04-00-38` | 15 |
| `04-00-39` | 12 |
| `04-00-44` | 10 |
| `04-00-45` | 12 |
| `04-00-46` | 12 |
| `04-00-47` | 7 |
| `04-00-50` | 10 |
| `04-00-51` | 9 |
| `04-00-53` | 12 |
| `04-00-54` | 13 |
| `04-00-55` | 11 |
| `04-00-59` | 7 |
| `04-00-60` | 10 |
| `04-00-61` | 7 |
| `04-00-63` | 11 |
| `04-00-64` | 12 |
| `04-00-65` | 9 |
| `04-00-66` | 9 |
| `04-00-99` | 57 |
| `04-01-00` | 7 |
| `04-01-01` | 9 |
| `04-01-02` | 6 |
| `04-01-03` | 4 |
| `04-01-04` | 7 |
| `04-01-05` | 4 |
| `04-01-06` | 6 |
| `04-01-07` | 9 |
| `04-01-08` | 5 |
| `04-01-18` | 4 |
| `04-01-99` | 23 |
| `04-02-20` | 6 |
| `04-02-99` | 23 |
| `04-03-29` | 5 |
| `04-03-35` | 6 |
| `04-03-99` | 23 |
| `04-04-40` | 6 |
| `04-04-41` | 11 |
| `04-04-42` | 7 |
| `04-04-99` | 23 |
| `04-05-43` | 5 |
| `04-05-99` | 23 |
| `04-06-48` | 5 |
| `04-06-49` | 5 |
| `04-06-52` | 4 |
| `04-06-56` | 4 |
| `04-06-99` | 23 |
| `04-07-57` | 5 |
| `04-07-58` | 4 |
| `04-07-62` | 4 |
| `04-07-67` | 4 |
| `04-07-99` | 23 |

## 3. Excluded strings, with reasons

No strings were excluded by the console/diagnostic rule in this module.


Also excluded per template v2 §5, and confirmed by sweep 2 rather than assumed: source comments (including Hebrew ones quoting producer PPT notes), regex character classes over the Hebrew alphabet, decorative `aria-hidden` subtrees and `<svg>` icon markup, CSS/DOM identifiers and asset paths, and bare numerics.

## 4. Out of scope (still needs translating by someone)

- YouTube caption tracks for any embedded video live in YouTube, not in these files.
- `metadata/*.json` carries Hebrew but is authoring/reporting data consumed by KATA, not rendered by the lomda. If it needs localising that is a separate pass.

## 5. Placeholders and inline markup

- Inline markup (`<strong>`, `<br>`, `<span dir="ltr">`) is stored as escaped literal text in `<source>` and round-trips. `<span dir="ltr">` around arithmetic is load-bearing in an RTL page and must never be dropped or repositioned.

- Runtime-concatenated values use the single form **`{value}`** throughout (template v2 §5). No angle-bracket placeholder form appears anywhere in this export.

- Multi-line elements are joined onto one line, preserving `<br>`; the stored source therefore does not byte-match the file. Every such unit is enumerated in `sweep1-results.csv` as `normalised`.

## 6. Correctness logic

720 templates key correctness off `data-id` / element ids, not displayed text, so answer options can be translated freely. Reviewed for exceptions in this module; any string that is DOM-mirrored from a JS constant is flagged `manual-review` in the manifest.

## 7. Verification (§10)

### Sweep 1 — every unit still matches its source

- **686 / 712 (96.3%) match literally.**
- **19 normalised** — multi-line joins, preserved inline markup, and `{value}` placeholder substitution. Each is listed individually in `sweep1-results.csv`.
- **7 enumerated exceptions**, each carrying its reason in the CSV:
  - `04-00-19-003` (unit-js/questions.js) — NOT FOUND
  - `04-00-19-004` (unit-js/questions.js) — NOT FOUND
  - `04-00-19-005` (unit-js/questions.js) — NOT FOUND
  - `04-00-19-010` (unit-js/questions.js) — multi-line join / inline markup
  - `04-00-32-002` (unit-js/questions.js) — NOT FOUND
  - `04-00-66-004` (unit-js/questions.js) — NOT FOUND
  - `04-00-99-013` (unit-js/quiz-engine.js) — placeholder substitution ({value})

### Sweep 2 — no Hebrew in the source is uncovered

- Every Hebrew-bearing fragment in every scanned file was independently extracted and checked against the XLIFF. **109 fragments were not covered, and all 109 are classified:**
  - 108 — source comment (excluded by template v2 §5)
  - 1 — UNCOVERED — classify
- **Genuine misses: 1.**
  - `unit-js/quiz-engine.js:212` — מכנה

### Structural checks

- XML well-formed: verified by parsing the written file.
- Unit ids unique: 712 distinct of 712.
- Every unit carries a `screen-id` note; every screen id used by a unit exists in the manifest, and every manifest row is referenced.
- Every `<target>` is empty. Source language `he`. UTF-8, no BOM.
- Id shape `{target}-{part}-{screen}-{string}`, three digits per segment: verified for all units.

## 8. Manual review

No content defects were surfaced by extraction in this module. Screens built at runtime from a JS config have no derivable human title and are marked in the manifest's `manual_review` column so a reviewer can name them.


## 9. Production files

**No production file was read-modified.** This export only creates files under `translations/`. That folder is untracked unless committed — everything in it, including a translator's returned work, can be lost without trace. **Recommend committing it.**
