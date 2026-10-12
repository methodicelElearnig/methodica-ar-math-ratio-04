'use strict';
/* ═══════════════════ BOOT ═══════════════════
   The LAST script tag on every page. Its own tag, never lines appended to another file: a
   top-level throw elsewhere cannot reach it (ADDING-REPORTING-AND-RESUME.md §3.2).

   The order is load-bearing:
     0. initResumeResetHatch() first — it strips ?resetState from the URL and raises the reset
        flag before anything reads the query or touches the state document.
     1. the leave handlers and the pending-answer saves.
     2. partBoot() (70-platform.js) — build the question screens, clone the report flags, scale,
        land on the component's first screen. Before bootXAPI(), so a restore replays onto built
        screens.
     3. bootXAPI() last — the library, the metadata, the resume read and restore, the component
        'initialized'.

   Unlike ratio-01 (whose boot runs synchronously from the end of <body>), this runs at
   DOMContentLoaded: the 720-core files register their own DOMContentLoaded work (motion.js,
   quiz-engine.js's image-zoom pass, unit.js's s2 character), and this listener — registered
   last — keeps the vendored order: theirs first, then the boot that used to be engine.js's. */
function _bootUnit() {
  try { initResumeResetHatch(); }    catch (e) { console.error('[boot] initResumeResetHatch', e); }
  try { initResumeLeaveHandlers(); } catch (e) { console.error('[boot] initResumeLeaveHandlers', e); }
  try { initResumeFieldSaves(); }    catch (e) { console.error('[boot] initResumeFieldSaves', e); }
  try { initQuizFieldSaves(); }      catch (e) { console.error('[boot] initQuizFieldSaves', e); }
  try { partBoot(); }                catch (e) { console.error('[boot] partBoot', e); }
  bootXAPI();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _bootUnit);
else _bootUnit();
