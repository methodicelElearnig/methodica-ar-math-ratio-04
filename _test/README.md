# `_test/` — headless harness (never deployed)

| File | What it asserts |
|---|---|
| `verify-assets.js` | The hoisted layout (guide §15): every `src`/`href` resolves **case-exact**, CSS `url()` from the stylesheet's folder, `questions.js` images from the component that owns each screen, one `?v=` on every code reference, no hoisted file grown back, the shared `index.html` tail identical in all seven parts. No dependencies. |
| `harness.js` | Shared jsdom boot (from ratio-06): loads a component's **real** `index.html` and runs every local `<script src>` in document order from disk; optional stub library + `finishBoot()` replay of the loader's post-metadata sequence; `reload()` over the same storage. `answerFor(q, 'right' \| 'wrong', k)` builds answers from the page's own `QUESTIONS`. |
| `verify-report.js` | **resp** (MOE runbook 10.11.26): a correct round sends Kata's `correctXapiResponsesPattern` byte for byte for every question (the `KATA` table, copied from Kata; the three class E questions carry the proposed performance pattern), the shipped metadata carries the same strings, a wrong 03-001 / 01-002 keeps the form, `3600/1800` still matches, no invisible characters, the old builders and `quizAnswerText` are gone, no direct `answered`. The old `20-xapi.js` fails 54 of them; old `20-xapi.js` + `70-platform.js` fail 25 with exactly the runbook's strings (RLM/LRM in `300 كم`, the lawn labels glued). Listed gaps: guided 01-003 (Nimrod) and 07-001 q2/q3, where the page's wording ≠ Kata's (decision in DEPLOY.md). Since 2026-11-10 also the boot/resume hardening (BOOT-AND-RESUME-HARDENING-2026-11-03.md §2.6, §2.10): write-guard a–l (part 01 with a seeded v6 document: nothing written before the restore, the drain persists as read, a failed read closes every write), per component m–q (the net raises the flag on `?registration`, the two preloads byte-equal to the loader's `-l`, the Kata preconnect, images off the landing screen lazy) and leave r–u (`pagehide` saves through `saveState720OnLeave`; on `-k` the fallback; nothing after a failed read). 61 of them fail against `deployments/2026-11-09` (`LOMDA_BASE=<package>`); the mutation "leave handler back to `flushResumeSave`" fails 2. Contracts, all seven components: script order and `?v=`, `-k` inside the `XAPI_USING_G` gate, no top-level name in two files, `script.js` data only, the character key pair; ids byte-for-byte against `metadata/` (component, unit, every item and question id); `SCREEN_TO_SUBCONTENT` = the component's screens = the catalogue items; `XAPI_SCREEN_QUESTIONS` asks every declared question exactly once; `XAPI_EVAL_ITEMS`; `XAPI_GATE` = the number printed on the gate screen; `goTo` / `quizCheck` / `quizOpenHint` / `onCustomAnswered` ordering; painter sweep (every screen, clean and answered, idempotent); the flag opens the form and the issue report carries unit / component / item / page on **every** screen; the boot cover. |
| `statement-flow.js` | Behaviour: no `?slxapi` → nothing sent, scoring still works; a full right-answer walk of every component (one `answered.last` per declared question, one explicit-result `completed` per item, one component `completed` last, button disabled, no hop); the three gates on both sides of the threshold; the Retry gate; hint dedupe across re-opens and a reload; resume mid-component (quiz and the hand-built screens of 01), after the end (no second `completed`); B-1 seed; Back closes nothing (O-1); the keyboard gate and `DEV_NAV`; the character adopted across components. |
| `layout.js` | Real Chrome (puppeteer-core), KNOWN-ISSUES §1: at eight window sizes from 768×1024 to 1920×1080, every component's 1280×710 canvas is centred (±1px) and inside the window and the first screen's buttons are reachable; at 1024×640 and 1366×640 (school laptop) every screen's buttons and every image/figure zoom (open, close button reachable, close) are too. 308 checks; 137 fail on the pre-fix `#stage` (auto grid tracks). |
| `true-false.js` | Guide §6.3b: the five true/false questions Kata declares (01-001 q1 s1, 01-002 q1 s4, 02-001 q2 s22, 07-001 q6/q7 s65), answered right and wrong through the real handlers, report `"true"` / `"false"` and match the correct answer exactly when success. 46 checks; 18 fail on the code before 2026-11-10 (labels). |
| `xapi-720-k.js` | Local stand-in for the CDN library over `sessionStorage` (from ratio-06, retargeted). Loaded in a browser only via `?xapiLib=../_test/xapi-720-k.js` (or `-l.js`) on `localhost`. Console helpers: `__stmts() __state() __dupes() __reset() __failWrites(bool\|status) __setState(doc)`. |
| `xapi-720-l.js` | The same stub plus `saveState720OnLeave` (the `-l` library's one addition, BOOT-AND-RESUME-HARDENING §2.10), which writes like `saveState720` and counts its calls (`__leaveWrites()`). The loader asks for `-l` since 2026-11-10; the `-k` stub stays for the check that the unit still runs on `-k`. |

## Running

jsdom must live **outside** the OneDrive tree (ADDING-REPORTING-AND-RESUME.md §10.1). One
`npm install jsdom` into any folder outside OneDrive (this machine: `C:/lomda-test`), then from
the repo root:

```bash
node _test/verify-assets.js
NODE_PATH=C:/lomda-test/node_modules node _test/verify-report.js
NODE_PATH=C:/lomda-test/node_modules node _test/statement-flow.js
NODE_PATH=C:/lomda-test/node_modules node _test/true-false.js
NODE_PATH=C:/Users/Vadim/AppData/Local/Temp/lomda-test/node_modules node _test/layout.js
```

`layout.js` needs `puppeteer-core` (in the second folder) and Chrome at its default path
(`CHROME=` overrides it).

State on 2026-11-10: **346 + 853 + 226 + 46 = 1471 checks, all green**, `layout.js` 308 / 308. State on 2026-11-09: **346 + 742 + 226 = 1314 checks, all green** (the 03 score contract added 24; 10 of them fail on the pre-fix `partResult`). On 2026-10-08: 346 + 722 + 222 = 1290. Every group was
mutation-tested — 16 deliberate breaks, each turning at least one suite red: gate threshold,
a missing map key, the statement screen mapping one key, no flush after the commitment, no Retry
`lw`, no repaint on `goTo`, no ended-button restore, a hop without `DEV_NAV`, an ungated
keyboard, the hint reported before its guard, a hand-built answer not reported, a donor
character key, a wrong id prefix, hand-built state not restored, per-element flag binding, item
results left to the library. `verify-assets.js` has its own eight (see its commit).

## In a browser

```
http://localhost:<port>/methodica-ar-math-ratio-04/methodica-ar-math-ratio-04-01/index.html?xapiLib=../_test/xapi-720-l.js
```

Add `&resetState` for a clean document, `&dev=1` for free navigation and the hops between
components. Serve from a **subpath** (the folder above the repo), so a wrong `../` depth fails
locally as it would in production.

## Not covered here

A real Kata run (ADDING-REPORTING-AND-RESUME.md §12): stubs prove payload **shape**, not
**arrival**; the real Google Form row in the shared sheet; pixel-level checks.
