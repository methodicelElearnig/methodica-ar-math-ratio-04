'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-ratio-04-07 — רכיב 07 מתוך 7 · שקופיות 72-82 — שאלת שיא: הטיול השנתי

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev are folder paths; engine.js appends index.html (the CDN serves a folder URL as 0
   bytes). Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 57, end: 67, next: null, prev: "../methodica-ar-math-ratio-04-06/" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-ar-math-ratio-04-07.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-ar-math-ratio-04-07';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-ratio-04-07.json';

/* Screen 57 is the gate ("יש בה 7 סעיפים. עליכם להצליח ב-5 לפחות") — no item. One item, 001,
   spans the whole peak question: story cards 58 / 62 / 67 and the seven sections א-ז. Section ו
   (screen 65) is two נכון/לא נכון rows, which the catalogue declares as q6 and q7. */
var SCREEN_TO_SUBCONTENT = {
  57: null,
  58: ['001', 1],
  59: ['001', 2],
  60: ['001', 3],
  61: ['001', 4],
  62: ['001', 5],
  63: ['001', 6],
  64: ['001', 7],
  65: ['001', 8],
  66: ['001', 9],
  67: ['001', 10]
};

/* Screen -> the catalogue questions it answers (metadata questions[].questionId, last segment). */
var XAPI_SCREEN_QUESTIONS = {
  59: ['q1'],
  60: ['q2'],
  61: ['q3'],
  63: ['q4'],
  64: ['q5'],
  65: ['q6', 'q7'],
  66: ['q8']
};

/* Items carrying a code-graded question (used as a set). */
var XAPI_EVAL_ITEMS = { '001': 1 };

/* The promise on the gate screen, counted in sections = the question screens above.
   partResult() scores and passes on exactly that (§6.4). */
var XAPI_GATE = { of: 'screens', need: 5 };
