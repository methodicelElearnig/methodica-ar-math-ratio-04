'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-ratio-04-06 — רכיב 06 מתוך 7 · שקופיות 62-70 — שאלת שיא: תשלום לוועד הבית

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev are folder paths; engine.js appends index.html (the CDN serves a folder URL as 0
   bytes). Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 48, end: 56, next: "../methodica-math-ratio-04-07/", prev: "../methodica-math-ratio-04-05/" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-math-ratio-04-06.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-math-ratio-04-06';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-math-ratio-04-06.json';

/* Screen 48 is the gate ("יש בה 5 סעיפים. עליכם להצליח ב-4 לפחות") — no item. One item, 001,
   spans the whole peak question: story cards 49 / 52 / 56 and the five sections א-ה. */
var SCREEN_TO_SUBCONTENT = {
  48: null,
  49: ['001', 1],
  50: ['001', 2],
  51: ['001', 3],
  52: ['001', 4],
  53: ['001', 5],
  54: ['001', 6],
  55: ['001', 7],
  56: ['001', 8]
};

/* Screen -> the catalogue questions it answers (metadata questions[].questionId, last segment). */
var XAPI_SCREEN_QUESTIONS = {
  50: ['q1'],
  51: ['q2'],
  53: ['q3'],
  54: ['q4'],
  55: ['q5']
};

/* Items carrying a code-graded question (used as a set). */
var XAPI_EVAL_ITEMS = { '001': 1 };

/* The promise on the gate screen, counted in sections = the question screens above.
   partResult() scores and passes on exactly that (§6.4). */
var XAPI_GATE = { of: 'screens', need: 4 };
