# unit-js — methodica-ar-math-ratio-04

The shared layer, ONE copy for every component, loaded in this order (identical `?v=` everywhere):

| File | Role |
|---|---|
| `10-identity.js` | id prefix, unit id, `RESUME_ENABLED`, `DEV_NAV` |
| `20-xapi.js` | item scope, question ids from metadata, `xapiAnswered` / `xapiRequestedHint` / `xapiEndComponent` |
| `40-resume.js` | the v6 state document, the statement ledgers, saves, the character |
| `50-loader.js` | `bootXAPI()`: CDN library, metadata, restore, component `initialized` |
| *(component `script.js`)* | configuration only |
| `motion.js`, `quiz-engine.js`, `questions.js`, `unit.js`, `report-modal.js`, `engine.js` | the 720-core engine and this unit's screens, with guarded hooks into the layer |
| `70-platform.js` | the glue: reporting call sites, gates and scores, painters, `partExit`, `partBoot` |
| `90-boot.js` | the only file that does anything on load — last, in its own tag |

Each component's `script.js` is configuration only (`PART_CONFIG` + the xAPI maps);
every behaviour lives here. No top-level identifier may exist in both a
`script.js` and this layer — the collision is silent and last-wins.
Design record: `../docs-and-tools/REPORTING-RESUME.md`.
