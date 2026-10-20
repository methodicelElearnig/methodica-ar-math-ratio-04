# `_test/` — headless harness (never deployed)

| File | What it asserts |
|---|---|
| `verify-assets.js` | The hoisted layout (guide §15): every `src`/`href` resolves **case-exact**, CSS `url()` from the stylesheet's folder, `questions.js` images from the component that owns each screen, one `?v=` on every code reference, no hoisted file grown back, the shared `index.html` tail identical in all seven parts. No dependencies. |
| `harness.js` | Shared jsdom boot (from ratio-06): loads a component's **real** `index.html` and runs every local `<script src>` in document order from disk; optional stub library + `finishBoot()` replay of the loader's post-metadata sequence; `reload()` over the same storage. `answerFor(q, 'right' \| 'wrong', k)` builds answers from the page's own `QUESTIONS`. |
| `verify-report.js` | Contracts, all seven components: script order and `?v=`, `-k` inside the `XAPI_USING_G` gate, no top-level name in two files, `script.js` data only, the character key pair; ids byte-for-byte against `metadata/` (component, unit, every item and question id); `SCREEN_TO_SUBCONTENT` = the component's screens = the catalogue items; `XAPI_SCREEN_QUESTIONS` asks every declared question exactly once; `XAPI_EVAL_ITEMS`; `XAPI_GATE` = the number printed on the gate screen; `goTo` / `quizCheck` / `quizOpenHint` / `onCustomAnswered` ordering; painter sweep (every screen, clean and answered, idempotent); the flag opens the form and the issue report carries unit / component / item / page on **every** screen; the boot cover. |
| `statement-flow.js` | Behaviour: no `?slxapi` → nothing sent, scoring still works; a full right-answer walk of every component (one `answered.last` per declared question, one explicit-result `completed` per item, one component `completed` last, button disabled, no hop); the three gates on both sides of the threshold; the Retry gate; hint dedupe across re-opens and a reload; resume mid-component (quiz and the hand-built screens of 01), after the end (no second `completed`); B-1 seed; Back closes nothing (O-1); the keyboard gate and `DEV_NAV`; the character adopted across components. |
| `layout.js` | Real Chrome (puppeteer-core), KNOWN-ISSUES §1: at eight window sizes from 768×1024 to 1920×1080, every component's 1280×710 canvas is centred (±1px) and inside the window and the first screen's buttons are reachable; at 1024×640 and 1366×640 (school laptop) every screen's buttons and every image/figure zoom (open, close button reachable, close) are too. 308 checks; 137 fail on the pre-fix `#stage` (auto grid tracks). |
| `xapi-720-k.js` | Local stand-in for the CDN library over `sessionStorage` (from ratio-06, retargeted). Loaded in a browser only via `?xapiLib=../_test/xapi-720-k.js` on `localhost`. Console helpers: `__stmts() __state() __dupes() __reset() __failWrites(bool\|status) __setState(doc)`. |

## Running

jsdom must live **outside** the OneDrive tree (ADDING-REPORTING-AND-RESUME.md §10.1). One
`npm install jsdom` into any folder outside OneDrive (this machine: `C:/lomda-test`), then from
the repo root:

```bash
node _test/verify-assets.js
NODE_PATH=C:/lomda-test/node_modules node _test/verify-report.js
NODE_PATH=C:/lomda-test/node_modules node _test/statement-flow.js
NODE_PATH=C:/Users/Vadim/AppData/Local/Temp/lomda-test/node_modules node _test/layout.js
```

`layout.js` needs `puppeteer-core` (in the second folder) and Chrome at its default path
(`CHROME=` overrides it).

State on 2026-10-08: **346 + 722 + 222 = 1290 checks, all green.** Every group was
mutation-tested — 16 deliberate breaks, each turning at least one suite red: gate threshold,
a missing map key, the statement screen mapping one key, no flush after the commitment, no Retry
`lw`, no repaint on `goTo`, no ended-button restore, a hop without `DEV_NAV`, an ungated
keyboard, the hint reported before its guard, a hand-built answer not reported, a donor
character key, a wrong id prefix, hand-built state not restored, per-element flag binding, item
results left to the library. `verify-assets.js` has its own eight (see its commit).

## In a browser

```
http://localhost:<port>/methodica-ar-math-ratio-04/methodica-ar-math-ratio-04-01/index.html?xapiLib=../_test/xapi-720-k.js
```

Add `&resetState` for a clean document, `&dev=1` for free navigation and the hops between
components. Serve from a **subpath** (the folder above the repo), so a wrong `../` depth fails
locally as it would in production.

## Not covered here

A real Kata run (ADDING-REPORTING-AND-RESUME.md §12): stubs prove payload **shape**, not
**arrival**; the real Google Form row in the shared sheet; pixel-level checks.
