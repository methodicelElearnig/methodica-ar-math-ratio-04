'use strict';
/* ═══════════════════ xAPI (720) — identity ═══════════════════
   Shared by all seven components of methodica-math-ratio-04. Loaded first. Copied from
   methodica-math-ratio-06 (feature/reporting-resume, itself from ratio-01 35648a6) and
   retargeted; design: Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md.

   Canonical id prefix for this unit. Every component/item/question id the lomda reports is built
   from it and must match metadata/*.json byte-for-byte, INCLUDING the trailing slashes
   (metadata/methodica-math-ratio-04-01.json id:
   https://lomdot.education.gov.il/metodica/720active/math/ratio/04/methodica-math-ratio-04-01/). */
var XAPI_ID_PREFIX = 'https://lomdot.education.gov.il/metodica/720active/math/ratio/04/';

/* The unit id is the BARE slug here (MOE v2.5 §2.7 — the content unit alone need not be an IRI):
   metadata/methodica-math-ratio-04_unit.json carries id "methodica-math-ratio-04", and every
   component's learningUnitId says the same. XAPI_UNIT_ID must equal that id, whatever its shape.
   It keys the library's localStorage fallback; no statement ever carries it as object. */
window.XAPI_UNIT_ID = 'methodica-math-ratio-04';

/* Last path segment of a canonical id — the short slug the bug-report form records. */
function shortId(u){ return String(u || '').replace(/\/+$/, '').split('/').pop(); }

/* Resume (KATA State API) — ACTIVE. True also switches the loader to xapi-720-k.js (the State
   transport + state diagnostics), so this flag changes reporting too — see 50-loader.js. */
var RESUME_ENABLED = true;

/* ── The platform owns routing (2026-09-16) ──
   Kata launches each component on its own URL with its own ?registration and routes on our
   'completed' statements. The unit therefore never moves between components by itself: the last
   screen's button reports and stops. The cross-component hops in engine.js survive only for local
   walkthroughs behind this flag — and ONLY when the page was not launched by the platform (every
   Kata launch URL carries ?registration, and a hop in a real session would report the next
   component under this component's registration). */
var DEV_NAV = false;
try {
  var _devQ = new URLSearchParams(location.search);
  DEV_NAV = _devQ.get('dev') === '1' && !_devQ.has('registration');
} catch (e) {}
