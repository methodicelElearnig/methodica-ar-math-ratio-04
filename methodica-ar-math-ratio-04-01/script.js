'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-ratio-04-01 — רכיב 01 מתוך 7 · שקופיות 3-28 — פתיחה, הקנייה מודרכת

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev are folder paths; engine.js appends index.html (the CDN serves a folder URL as 0
   bytes). Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 0, end: 19, next: "../methodica-ar-math-ratio-04-02/", prev: null };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-ar-math-ratio-04-01.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-ar-math-ratio-04-01';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-ratio-04-01.json';

/* Screen -> [item, page in item]. 0 = the character choice, 8 and 18 = transitions: no item.
   001 tennis/running 3:5 (s1 question, s2 reveal) · 002 the two kinds of ratio (films s3/s5, s4
   question, s6 sorting, s7 accordion) · 003 the guided cyclist/runner exercise (9-17) · 004 the
   tomato warm-up (19). */
var SCREEN_TO_SUBCONTENT = {
  0: null,
  1: ['001', 1],
  2: ['001', 2],
  3: ['002', 1],
  4: ['002', 2],
  5: ['002', 3],
  6: ['002', 4],
  7: ['002', 5],
  8: null,
  9: ['003', 1],
  10: ['003', 2],
  11: ['003', 3],
  12: ['003', 4],
  13: ['003', 5],
  14: ['003', 6],
  15: ['003', 7],
  16: ['003', 8],
  17: ['003', 9],
  18: null,
  19: ['004', 1]
};

/* Screen -> the catalogue questions it answers (metadata questions[].questionId, last segment). */
var XAPI_SCREEN_QUESTIONS = {
  1: ['q1'],
  4: ['q1'],
  6: ['q2'],
  10: ['q1'],
  11: ['q2'],
  14: ['q3'],
  15: ['q4'],
  19: ['q1']
};

/* Items carrying a code-graded question (used as a set). */
var XAPI_EVAL_ITEMS = { '001': 1, '002': 1, '003': 1, '004': 1 };

/* No pass gate on screen — see partResult() (70-platform.js). */
var XAPI_GATE = null;
