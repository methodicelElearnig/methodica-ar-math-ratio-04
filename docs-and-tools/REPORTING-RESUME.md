# methodica-math-ratio-04 — xAPI reporting, issue reporting, resume

Unit record. The family guide is
`2026/Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md`; this file records only
what is specific to this unit and why. Added 2026-09-30, branch `vadimr/feat/reporting-resume`.

## 0. Optimization first (guide §15)

Done before the layer, one class of file per commit, nothing re-encoded:

| What | Δ |
|---|---|
| `fonts.css` + 2 Assistant variable woff2, byte-identical ×7 → `unit-assets/fonts/` | −180 KB |
| `styles.css`, byte-identical ×7 (kept in sync by hand) → `unit-css/styles.css` | −1.03 MB |
| the companion-character family (15 clips, 9 stills; 4 stored twice) → `unit-assets/{video,img}/`, moved **as a family** because `CHARACTER_ASSETS` builds the names | −1.24 MB |
| dead assets (05's tank PNG pairs + info icon, the white equation still, the orange question still), dead map entries, `S19_CORRECT` | −1.2 MB |
| `index_dev.html` ×7 byte-identical (title from the URL), copied S0 comment dropped from 02–07 | — |

Tracked tree 12.70 MB → 9.05 MB (134 → 102 files), before the layer. Guard:
`_test/verify-assets.js`. Side effect: component 07's white `climbing2` pose had pointed at a clip
that existed only in 06 (a 404 with the white monster) — it now resolves to the shared clip.

## 1. Shape of the integration

This unit runs on the vendored **720-core** (`engine.js`, `quiz-engine.js`, `questions.js`,
`unit.js`, `motion.js`, `report-modal.js`) — the same engine as **methodica-math-ratio-06**, whose
`feature/reporting-resume` is the template:

- Platform files copied from ratio-06 (itself from ratio-01 35648a6: v6 document, B-1, O-1, O-2,
  D-7, D-8): `10-identity.js`, `20-xapi.js` (only the answer-text selector list is this unit's —
  it strips the info dot), `40-resume.js` (keys retargeted), `50-loader.js`, `90-boot.js`,
  `_test/xapi-720-k.js`, `report-modal.js` (ratio-06's patched copy — identical vendored base).
- **`unit-js/70-platform.js`** — ratio-06's glue, extended for what only this unit has:
  the `statement` type (screen 65), several catalogue questions per item
  (`XAPI_SCREEN_QUESTIONS`), component 01's hand-built question screens, and the promised gates.
- The 720-core received **guarded hook calls only**, so it still runs without the layer.
  `unit.js` reports its hand-built screens through two seams, `onCustomAnswered` (committed) and
  `onCustomPick` (pending), and restores through replay: the painter calls unit.js's own handler
  with the saved choice, so a restored screen is exactly what the live click produced.

Script order in all seven `index.html` (one `?v=`):
`10-identity, 20-xapi, 40-resume, 50-loader, script.js, motion, quiz-engine, questions, unit,
report-modal, engine, 70-platform, 90-boot`.

## 2. Identity and maps

| | |
|---|---|
| `XAPI_ID_PREFIX` | `https://lomdot.education.gov.il/metodica/720active/math/ratio/04/` |
| `XAPI_UNIT_ID` | `methodica-math-ratio-04` — bare slug, = `metadata/methodica-math-ratio-04_unit.json` `id` |
| component ids | `<prefix><slug>/`, = `METADATA.id` (checked on every load) |

Screens are numbered **globally** (0–67). Each `script.js` maps exactly its own screens:

| Comp | Screens | Items → screens | Questions |
|---|---|---|---|
| 01 | 0–19 | 001 → 1–2 · 002 → 3–7 · 003 → 9–17 · 004 → 19 (0, 8, 18 null) | s1 q1 · s4 q1 · s6 q2 · guided 10/11/14/15 q1–q4 · q19 q1 |
| 02 | 20–28 | 001 → 21–23 · 002 → 24–25 · 003 → 26–28 (20 null) | one per screen |
| 03 | 29–39 | 001 → 30–32 · 002 → 33–34 · 003 → 36–37 · 004 → 38–39 (29, 35 null) | one per screen |
| 04 | 40–42 | 001 → 41–42 (40 null) | none — the class task |
| 05 | 43–47 | 001 → 44–45 · 002 → 46–47 (43 null) | one per screen |
| 06 | 48–56 | 001 → 49–56 (48 null) | 50 q1 · 51 q2 · 53 q3 · 54 q4 · 55 q5 |
| 07 | 57–67 | 001 → 58–67 (57 null) | 59 q1 · 60 q2 · 61 q3 · 63 q4 · 64 q5 · **65 q6 + q7** · 66 q8 |

Every declared question is asked exactly once (asserted). Screen 65 is two נכון/לא נכון rows that
the catalogue declares as q6 and q7: each row is reported on its own with its own `correct` and a
shared `isLast` (guide §6.3). Its one hint is reported against q6.

## 3. Decisions (2026-09-30)

| Decision | Where |
|---|---|
| Metadata = the repo's `metadata/*.json` as found in the working tree on 30.09 (committed first on the branch) | `03b3f1e` |
| **02** scores and passes on the promise of screen 20: "3 שאלות … 2 לפחות" = the 3 stations of the progress strip (items 001–003), a station correct only when all of its questions are; `scaled` = stations / 3 | `XAPI_GATE {of:'items', need:2}` |
| **06** / **07**: "5 סעיפים … 4 לפחות" / "7 סעיפים … 5 לפחות" = the question screens; section ו (65) correct only when both rows are; `scaled` = sections / 5 or 7. The item's own result (one item spans the whole peak question) is `scaled` = questions / declared (8 in 07), `success` = the gate | `XAPI_GATE {of:'screens'}` |
| **01 / 03** show no threshold: `scaled` = correct ÷ the questions the metadata declares, `success: true`. A bar nobody was shown would route learners on an invented number | `partResult()` |
| **05** (the challenge, "בואו נאתגר את עצמנו"): `scaled` = correct ÷ the 4 declared questions (unanswered = wrong), `success` = `scaled >= 0.6`. **Changed 2026-10-08 (MOE, with Maya)** from `success: true`: the challenge reports its real score. Still no gate on screen — every learner continues, nothing is shown | `XAPI_PART_PASS = 0.6` → `partResult()` |
| **04** (class task, no question): `{ success: true }` with no score (guide §6.4); item 001 reports initialized/completed only | `XAPI_EVAL_ITEMS = {}` |
| Every hand-built question in 01 has one attempt, so it reports `answered.last` | `onCustomAnswered()` |
| Keyboard forward gated like each screen's own button (quiz answered, s6 checked, otherwise the continue button enabled); arrows inside a field never navigate; free under `DEV_NAV` | `keyboardForwardAllowed()` |
| Retry gate (`st.lw`, D-14) on single, value-input and statement questions | `quiz-engine.js` |
| Character key renamed to `methodica_math_ratio_04_selectedCharacter` (was `ratio04_selectedCharacter`, un-namespaced — D-6). A choice stored under the old key before this change is not adopted | `unit.js`, `40-resume.js` |
| YouTube (01 screens 3 and 5): static `youtube-nocookie` iframes, `strict-origin-when-cross-origin`, nothing from `location` in `src` — the token cannot reach Google (§6.9.1). **No `played`/`paused`**: that needs the IFrame API, and the engine parks every iframe by blanking its `src` on navigation. Open — see §7 | `index.html` |

## 4. The component end

The last click of every component goes through `goTo(PART_LAST + 1)` → `partExit(+1)`:
01 q19 המשך · 02 q28 · 03 q39 · 04 x42 "אפשר להמשיך" (once something is typed) · 05 q47 ·
06 x56 המשך · 07 x67 סיימתי.
`partExit` = `xapiEndComponent(partResult(), lastScreenButton())` → `setUnitResult('ratio04_c0N_result')`
→ `flushResumeSave()` → navigate **nowhere** (only `DEV_NAV` hops on). `restoreEndedButton()` keeps
a finished component's button disabled after every repaint and reload (D-8).

## 5. Resume payload (v6 document, one per component)

```
payload = { currentScreen, qResults,
            q: { <screen>: { attempts, done, wasCorrect, hintUsed, selected, selectedSet, lw, tgl } },
            c: { 1|4: {pick, done}, 6: {picks[4], done}, 7: {a, b}, 10|11|14|15: {pick, done}, 42: {text} } }
```

`q` = the quiz engine's questions of this component (pending picks and typed values included,
saved on every pick/keystroke, debounced); `c` = the hand-built screens (`CUSTOM_STATE`), s7's
two-panel gate and x42's free text. `userInputs` / `answerKey` / `slotOk` are re-derived by
`quizMarkOutcome` from `selectedSet`. The character is chosen on 01's screen 0 and stored in
`ui.character` of 01's document; later components adopt it from the localStorage mirror
(`adoptUnitCharacter`).

## 6. Tools

- `_test/` — see `_test/README.md` (346 + 722 + 222 checks, mutation-tested).
- `docs-and-tools/package-allowlist.ps1`, `build-package.ps1`, `verify-package.ps1` — from
  ratio-06; the allowlist ships `metadata/*.json`, `unit-js/*.js`, `unit-css/*.css`,
  `unit-assets/**` and each component's `index.html`, `script.js`, `assets/**` — 84 files. Nothing
  at the root; `_test/`, `docs-and-tools/`, `translations/`, `index_dev.html`, `*.md` never ship.
- `reset-state.html` — QA: inspect / delete one registration's state document (from ratio-06).
- Not taken: `send-metadata.ps1` / `retrieve-metadata.ps1` (Kata catalogue tooling — needs the API
  key; a separate step).

## 7. Open before release

1. ~~Push the metadata to Kata~~ — **done 30.09.26** with ratio-05's sender (`send-metadata.ps1`):
   preflight `absent=8 exists=0`; dry run `created=24 updated=1`; live `created=24 updated=1
   failed=0` (all 201; the update is the 03 → 02 `recommendedAfterFail` link, 200). Verified by
   read-back, not by the 2xx: `retrieve-metadata.ps1 -FailOnDrift` → unit 1, components 7,
   items 16, warnings 0, no drift against `metadata/`. `-Status` → **7/7 draft** (not published —
   separate, one-way decision). `hostedContentRef` = `…/metodica/720/math/ratio/04/<component>/index.html`.
   ⚠️ Kata accepted the **06/07 `order: 6` tie** as sent and stores both at 6 (owner's decision to
   send as is). Logs (git-ignored): `docs-and-tools/send-metadata.2026-09-30-{dryrun,live}.log`,
   `preflight-metadata.log`, `retrieve-metadata.log`.
2. ~~**YouTube `played` / `paused`** for item 002 (01 screens 3, 5)~~ — **done 07.10.26** (MOE
   monday, 05.10: "the videos don't open"; content videos must report). percent-08's layer ported
   as is: `enablejsapi=1` + `data-yt-item="002"` in the markup, `YT.Player` on the finished iframe
   (`ytWirePlayers`), `xapiYouTubeState`, `ytLeave` / `ytHeal` in `goTo` (incl. its QA B-4 fix).
   Plus `ytApplyOrigin`: `origin=location.origin` over http(s) only — the 720 standard for
   YouTube's player-configuration error 153 (§6.9.1). Confirm both in a Kata run.
3. Check every `questionType` / `correctAnswers` in `metadata/` against the interaction and the key
   in `questions.js` / `unit.js` (e.g. 01-002 q2 is `matching`, answered as one all-or-nothing
   sort; the reported response lists each row's choice).
4. Live Kata run (guide §12) with a test learner, and one QA-marked issue report in the shared
   sheet.
5. Deploy all seven components atomically (guide §11.2).
6. Inherited from ratio-06, unchanged: on a **resumed** load the landing item's `initialized`
   goes out before the component's (`applyExecutionState` runs before the loader's component
   `initialized`).
