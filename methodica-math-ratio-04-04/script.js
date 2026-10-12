'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-ratio-04-04 — רכיב 04 מתוך 7 · שקופיות 52-54 — مهمّة صفيّة

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev are folder paths; engine.js appends index.html (the CDN serves a folder URL as 0
   bytes). Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 40, end: 42, next: "../methodica-math-ratio-04-05/", prev: "../methodica-math-ratio-04-03/" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-math-ratio-04-04.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-math-ratio-04-04';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-math-ratio-04-04.json';

/* Screen 40 is the transition — no item. 001 = the class task: the instruction (41) and the
   learner's own free-text comparison (42). It has no question in the catalogue and nothing is
   graded, so it is NOT in XAPI_EVAL_ITEMS: it reports initialized/completed only, and the
   component completes with success and no score (§6.4). */
var SCREEN_TO_SUBCONTENT = {
  40: null,
  41: ['001', 1],
  42: ['001', 2]
};

/* Screen -> the catalogue questions it answers (metadata questions[].questionId, last segment). */
var XAPI_SCREEN_QUESTIONS = {};

/* Items carrying a code-graded question (used as a set). */
var XAPI_EVAL_ITEMS = {};

/* No pass gate on screen — see partResult() (70-platform.js). */
var XAPI_GATE = null;
