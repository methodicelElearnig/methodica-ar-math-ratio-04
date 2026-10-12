/* =====================================================================
   720-core — screen engine (shared across all units; vendored per unit)
   Per 720-templates references/_global-components.md.

   The unit must define BEFORE this file runs (js/unit.js):
     TOTAL_SCREENS        — number of screens
     resetScreenState(n)  — per-screen restore hook
   Optional: quizBuildScreens() from quiz-engine.js (auto-called if present).
   ===================================================================== */

'use strict';

let currentScreen = 0;
/* Cross-component navigation. `goTo()` called these at a part's boundaries and
   nothing defined them, so המשך on a component's last screen silently did
   nothing. `prev` enters the previous component at ITS last screen, which the
   receiving engine reads off `?screen=`. */
function goToNextPart() {
  const to = window.PART_CONFIG && window.PART_CONFIG.next;
  if (to) window.location.href = to + 'index.html' + window.location.search;
}
function goToPrevPart() {
  const to = window.PART_CONFIG && window.PART_CONFIG.prev;
  if (!to) return;
  /* keep every other launch parameter (slxapi / registration / dev flags) —
     this used to replace the whole query string with ?screen=last */
  const qs = new URLSearchParams(window.location.search);
  qs.set('screen', 'last');
  window.location.href = to + 'index.html?' + qs.toString();
}

/* ---------- Canvas scaling (1280×710) ---------- */
function scaleApp() {
  const app = document.getElementById('app');
  const scale = Math.min(window.innerWidth / 1280, window.innerHeight / 710);
  app.style.transform = `scale(${scale})`;
}
window.addEventListener('resize', scaleApp);

/* ---------- Navigation ---------- */
function goTo(n) {
  /* Part mode (5-component delivery architecture, per approved units):
     window.PART_CONFIG = { start, end, next | (routeByScore + nextPass/nextFail) }.
     Navigating past the part's last screen routes to the next part app. */
  if (window.PART_CONFIG) {
    /* With the platform layer loaded (70-platform.js), leaving the component is partExit()'s call:
       it reports the component 'completed' and moves nowhere unless DEV_NAV. Without it, the
       vendored behaviour — hop to the neighbour — is unchanged. */
    if (n > window.PART_CONFIG.end) { if (typeof partExit === 'function') partExit(+1); else goToNextPart(); return; }
    if (n < window.PART_CONFIG.start) { if (typeof partExit === 'function') partExit(-1); else goToPrevPart(); return; }
  }
  /* A mid-component stop (XAPI_STOP, 70-platform.js): forward off the stop screen with the promised
     exercises not passed ends the component there. One hook here covers the check button, the
     arrow key and advanceScreen alike. Never while a resume replays the saved screen. */
  if (n === currentScreen + 1 && typeof stopBlocks === 'function' && !(typeof _restoring !== 'undefined' && _restoring) &&
      stopBlocks(currentScreen)) { endComponentAtStop(); return; }
  if (n < 0 || n >= TOTAL_SCREENS) return;
  /* 07.09 — a retired screen number (43, folded into 42) must not blank the
     canvas. The teardown below used to run BEFORE the lookup, so navigating to
     a number with no section left every screen deactivated. Resolve the target
     first, and skip a gap in the direction of travel so the DEV bar's numeric
     stepper walks straight over it. */
  let target = document.querySelector(`.screen[data-screen="${n}"]`);
  if (!target) {
    const step = n >= currentScreen ? 1 : -1;
    for (let i = n + step; i >= 0 && i < TOTAL_SCREENS; i += step) {
      target = document.querySelector(`.screen[data-screen="${i}"]`);
      if (target) { n = i; break; }
    }
    if (!target) return;
  }
  // Close all feedback popups and hint overlays before the screen swap
  document.querySelectorAll('[id$="-popup"], [id$="-hint-overlay"]')
    .forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.applet-embed.is-zoomed').forEach(el => el.classList.remove('is-zoomed'));
  const prev = document.querySelector('.screen.active');
  if (window.Motion && prev) Motion.cancel(prev);
  /* 29.09 — lifted from percent-08's engine, which is where this was solved:
     hiding a screen does not pause what is inside it, so a clip kept playing,
     audible, after navigating away. Stop and REWIND every player in the unit
     on each move, then start the ones the incoming screen marks `autoplay`.
     Rewinding matters as much as pausing — a film resumed mid-sentence when
     the learner came back.

     A YOUTUBE IFRAME cannot be paused by any DOM property; blanking its src
     tears the player down. The original is parked on a data attribute and
     restored on entry, so it restarts from 0 like the <video> clips do. */
  document.querySelectorAll('video').forEach(v => {
    if (v.pause) { v.pause(); try { v.currentTime = 0; } catch (e) {} }
  });
  document.querySelectorAll('iframe[src], iframe[data-src]').forEach(f => {
    /* A YouTube player wired for reporting is stopped through its API instead (ytLeave,
       70-platform.js: closes an open 'played' with its 'paused', then rewinds) — blanking the src
       would sever the binding. Unwired (API not loaded): the blanking below, as before. */
    if (typeof ytLeave === 'function' && ytLeave(f)) return;
    const live = f.getAttribute('src');
    if (live && !/^about:blank$/.test(live)) {
      if (!f.dataset.src) f.dataset.src = live;
      f.setAttribute('src', 'about:blank');
    }
  });
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  target.classList.add('active');
  target.querySelectorAll('video[autoplay]').forEach(v => {
    const play = v.play();
    if (play && play.catch) play.catch(() => {});
  });
  target.querySelectorAll('iframe[data-src]').forEach(f => {
    /* A wired YouTube iframe is never blanked (ytLeave); if one is found blank anyway, ytHeal
       restores the embed and re-wires it (QA B-4, percent-08). */
    if (f.__ytPlayer) { if (typeof ytHeal === 'function') ytHeal(f); return; }
    if (f.getAttribute('src') !== f.dataset.src) f.setAttribute('src', f.dataset.src);
  });
  if (window.Motion) Motion.reveal(target);
  currentScreen = n;
  resetScreenState(n);
  /* Platform layer (70-platform.js / 20-xapi.js / 40-resume.js), in this order and after the
     paint: repaint the screen from state (resume §8.4a — every navigation, not only a restore),
     open/close the catalogue item, then arm the debounced save. Each guarded and logged: a
     reporting fault must never stop navigation, and an empty catch would hide a stale-cache
     ReferenceError. */
  if (typeof repaintScreen === 'function') { try { repaintScreen(n); } catch (e) { console.error('[resume] repaint', e); } }
  if (typeof xapiOnScreen === 'function') { try { xapiOnScreen(n); } catch (e) { console.error('[xAPI] onScreen', e); } }
  if (typeof scheduleResumeSave === 'function') { try { scheduleResumeSave(); } catch (e) { console.error('[resume] save', e); } }
  if (typeof decorateBubbles === 'function') decorateBubbles(target);
  // keep the DEV harness in sync when navigation happens INSIDE the lomda
  // (buttons / keyboard), not only via the DEV bar
  if (window.parent !== window) {
    window.parent.postMessage({ type: 'DEV_SCREEN', screen: n }, '*');
  }
}

/* Forward by keyboard is gated like the screen's own forward button (ported from ratio-06
   28.09.26): unguarded, ArrowLeft walked past unanswered questions — navigation the screen gates,
   and with reporting on it closed the catalogue item with a non-final result that the ledger then
   keeps for good. The platform layer decides (keyboardForwardAllowed in 70-platform.js); without
   it the vendored free navigation is unchanged, and a local walkthrough (DEV_NAV) keeps it too. */
document.addEventListener('keydown', (e) => {
  /* arrows inside an answer box / select / the report textarea move the caret, not the screen */
  const inField = e.target && e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
  const fwdOk = typeof keyboardForwardAllowed !== 'function' || keyboardForwardAllowed();
  if (e.key === 'ArrowLeft' && !inField && fwdOk) goTo(currentScreen + 1);  // RTL: left = forward
  if (e.key === 'ArrowRight' && !inField) goTo(currentScreen - 1);
  if (e.key === 'Escape' && typeof quizCloseHint === 'function') quizCloseHint();
});

/* Dev bridge for index_dev.html — shared 720 protocol (DEV_GOTO / DEV_READY /
   DEV_SCREEN); 'goto' is kept so any older harness still works. */
window.addEventListener('message', (e) => {
  if (!e.data) return;
  if (e.data.type === 'DEV_GOTO' || e.data.type === 'goto') {
    const n = parseInt(e.data.screen, 10);
    if (!isNaN(n)) goTo(n);
  }
});
if (window.parent !== window) {
  // screens are generated at runtime, so count them once the DOM is built
  const announce = () => {
    const built = document.querySelectorAll('.screen[data-screen]').length;
    window.parent.postMessage({
      type: 'DEV_READY',
      total: Math.max(built, typeof TOTAL_SCREENS === 'number' ? TOTAL_SCREENS : 0),
      part: window.PART_CONFIG || null,
    }, '*');
  };
  if (document.readyState === 'complete') announce();
  else window.addEventListener('load', announce, { once: true });
}

/* ---------- Applet fullscreen zoom (in place — state persists) ---------- */
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-applet-toggle]');
  if (!btn) return;
  btn.closest('.applet-embed').classList.toggle('is-zoomed', btn.dataset.appletToggle === 'open');
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.applet-embed.is-zoomed').forEach(el => el.classList.remove('is-zoomed'));
  }
});

/* ---------- Init ----------
   A component opens on ITS first screen — screens keep the unit's global
   numbering across all seven components. `?screen=last` is how the PREVIOUS
   component is entered when the learner presses חזרה on a part's first
   screen; anything else is a direct deep link, clamped to this part.
   With the platform layer ?screen=last is honoured only under DEV_NAV: it is
   only ever written by goToPrevPart(), which the layer runs under DEV_NAV
   alone (the platform owns routing). */
function firstScreen() {
  const P = window.PART_CONFIG;
  const q = new URLSearchParams(window.location.search).get('screen');
  const devOk = typeof DEV_NAV === 'undefined' || DEV_NAV;
  let open = P ? P.start : 0;
  if (P && q === 'last') { if (devOk) open = P.end; }
  else if (q && !isNaN(parseInt(q, 10))) {
    const n = parseInt(q, 10);
    if (!P || (n >= P.start && n <= P.end)) open = n;
  }
  return open;
}
/* With the platform layer, 90-boot.js runs the boot (partBoot() in 70-platform.js: build the
   question screens, scale, land) and then bootXAPI() — in that order, so the restore replays onto
   built screens. Without it, the vendored init below runs as before. */
document.addEventListener('DOMContentLoaded', () => {
  if (typeof partBoot === 'function') return;
  if (typeof quizBuildScreens === 'function') quizBuildScreens();
  scaleApp();
  goTo(firstScreen());
  if (window.Motion) Motion.reveal(document.querySelector('.screen.active'));
});
