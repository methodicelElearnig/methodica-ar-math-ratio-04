'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-ratio-04-02 — רכיב 02 מתוך 7 · שקופיות 30-38 — תרגול סטנדרטי א (3 תרגילים)

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev are folder paths; engine.js appends index.html (the CDN serves a folder URL as 0
   bytes). Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 20, end: 28, next: "../methodica-ar-math-ratio-04-03/", prev: "../methodica-ar-math-ratio-04-01/" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-ar-math-ratio-04-02.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-ar-math-ratio-04-02';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-ratio-04-02.json';

/* Screen 20 is the transition ("3 שאלות … צריך לענות נכון על 2 שאלות לפחות") — no item.
   001 Anna and Lihi (21-23) · 002 fuel (24-25) · 003 the fruit shake (26-28): the three stations of
   the progress strip. */
var SCREEN_TO_SUBCONTENT = {
  20: null,
  21: ['001', 1],
  22: ['001', 2],
  23: ['001', 3],
  24: ['002', 1],
  25: ['002', 2],
  26: ['003', 1],
  27: ['003', 2],
  28: ['003', 3]
};

/* Screen -> the catalogue questions it answers (metadata questions[].questionId, last segment). */
var XAPI_SCREEN_QUESTIONS = {
  21: ['q1'],
  22: ['q2'],
  23: ['q3'],
  24: ['q1'],
  25: ['q2'],
  26: ['q1'],
  27: ['q2'],
  28: ['q3']
};

/* Items carrying a code-graded question (used as a set). */
var XAPI_EVAL_ITEMS = { '001': 1, '002': 1, '003': 1 };

/* The promise on screen 20: 2 of the 3 stations (items), each correct only when all of its
   questions are. partResult() scores and passes on exactly that (§6.4). */
var XAPI_GATE = { of: 'items', need: 2 };
