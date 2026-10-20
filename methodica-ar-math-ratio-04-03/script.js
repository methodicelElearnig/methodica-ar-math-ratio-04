'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-ratio-04-03 — רכיב 03 מתוך 7 · שקופיות 40-50 — תרגול בסיסי ותרגול סטנדרטי ב

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev are folder paths; engine.js appends index.html (the CDN serves a folder URL as 0
   bytes). Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 29, end: 39, next: "../methodica-ar-math-ratio-04-04/", prev: "../methodica-ar-math-ratio-04-02/" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-ar-math-ratio-04-03.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-ar-math-ratio-04-03';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-ratio-04-03.json';

/* Screens 29 and 35 open the two practice blocks — no item.
   001 robots (30-32) · 002 printer (33-34) · 003 two cars (36-37) · 004 lawns and fence (38-39). */
var SCREEN_TO_SUBCONTENT = {
  29: null,
  30: ['001', 1],
  31: ['001', 2],
  32: ['001', 3],
  33: ['002', 1],
  34: ['002', 2],
  35: null,
  36: ['003', 1],
  37: ['003', 2],
  38: ['004', 1],
  39: ['004', 2]
};

/* Screen -> the catalogue questions it answers (metadata questions[].questionId, last segment). */
var XAPI_SCREEN_QUESTIONS = {
  30: ['q1'],
  31: ['q2'],
  32: ['q3'],
  33: ['q1'],
  34: ['q2'],
  36: ['q1'],
  37: ['q2'],
  38: ['q1'],
  39: ['q2']
};

/* Items carrying a code-graded question (used as a set). */
var XAPI_EVAL_ITEMS = { '001': 1, '002': 1, '003': 1, '004': 1 };

/* No pass gate on the component's whole set — see partResult() (70-platform.js). */
var XAPI_GATE = null;

/* A STOP in the middle of the component (MOE tester + head of team, monday 05-06.10.26). Slide 40 /
   s29 promises "تمرينان … ענו נכון על שניהם כדי להתקדם", and נמרוד: "אחרי כישלון באחד או שני
   הבסיסים אנחנו עוצרים. הצלחה בשניהם מעביר להמשך התרגילים ברכיב." The two basic exercises are
   items 001 (s30-32) and 002 (s33-34); an exercise is right when all its parts are (_itemAllOk).
   Under `need`, leaving s34 forward ends the component there (stopBlocks / endComponentAtStop,
   70-platform.js) and the platform routes on recommendedAfterFail (-02). */
var XAPI_STOP = { at: 34, items: ['001', '002'], need: 2 };
