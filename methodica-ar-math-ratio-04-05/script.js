'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-ratio-04-05 — רכיב 05 מתוך 7 · שקופיות 56-60 — תרגול מתקדם

   CONFIGURATION ONLY. Every behaviour is shared in ../unit-js/.
   The split follows the deck's own "רכיב N" separator slides.
   ═══════════════════════════════════════════════════════════════════ */
/* next/prev are folder paths; engine.js appends index.html (the CDN serves a folder URL as 0
   bytes). Used only by DEV_NAV walkthroughs — in production the platform routes. */
window.PART_CONFIG = { start: 43, end: 47, next: "../methodica-ar-math-ratio-04-06/", prev: "../methodica-ar-math-ratio-04-04/" };

/* ═══════════════════ xAPI (720) — this component's configuration ═══════════════════
   Data only; the shared layer in ../unit-js/ reads it at CALL time. Ids must match
   ../metadata/methodica-ar-math-ratio-04-05.json byte-for-byte (the loader shouts on a mismatch). */
var XAPI_COMP_SLUG     = 'methodica-ar-math-ratio-04-05';
var XAPI_COMP_ID       = XAPI_ID_PREFIX + XAPI_COMP_SLUG + '/';
var XAPI_METADATA_FILE = '../metadata/methodica-ar-math-ratio-04-05.json';

/* Screen 43 is the transition — no item. 001 the tank (44-45) · 002 the electric car (46-47). */
var SCREEN_TO_SUBCONTENT = {
  43: null,
  44: ['001', 1],
  45: ['001', 2],
  46: ['002', 1],
  47: ['002', 2]
};

/* Screen -> the catalogue questions it answers (metadata questions[].questionId, last segment). */
var XAPI_SCREEN_QUESTIONS = {
  44: ['q1'],
  45: ['q2'],
  46: ['q1'],
  47: ['q2']
};

/* Items carrying a code-graded question (used as a set). */
var XAPI_EVAL_ITEMS = { '001': 1, '002': 1 };

/* No pass gate on screen — see partResult() (70-platform.js). */
var XAPI_GATE = null;

/* The challenge's component result: correct ÷ the 4 questions the metadata declares (unanswered
   counts as wrong), success at this share or more — partResult() (70-platform.js).
   MOE 2026-10-08: real score, success only ≥60%, no gate, nothing shown. */
var XAPI_PART_PASS = 0.6;
