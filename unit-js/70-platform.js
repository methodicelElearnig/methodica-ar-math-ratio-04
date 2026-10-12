'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-math-ratio-04 — platform glue: xAPI reporting + resume on the 720-core engine.

   The platform files (10-identity / 20-xapi / 40-resume / 50-loader / 90-boot) come from
   methodica-math-ratio-06 (feature/reporting-resume), which runs on the same 720-core
   (engine.js / quiz-engine.js). This file is that unit's 70-platform.js, extended for what only
   ratio-04 has:
     - the `statement` question type (screen 65: two נכון/לא נכון rows = two catalogue questions)
     - several catalogue questions per item (XAPI_SCREEN_QUESTIONS in each script.js)
     - hand-built question screens outside the quiz engine (component 01: s1, s4, s6 and the
       guided steps 10/11/14/15), plus the s7 accordion gate and the s42 free-text box
     - the pass gates the screens promise (components 02, 06, 07 — XAPI_GATE in script.js)
   quizState / QUESTIONS / TOTAL_SCREENS / guidedState / s7Opened are top-level const in the
   shared global lexical scope, so this shared file reaches them directly.

   Definition-only, like the rest of unit-js/ except 90-boot.js.

   Seams it provides:
     PART_FIRST / PART_LAST     this component's screen range (from PART_CONFIG, script.js)
     lastScreenButton()         the button whose click ends this component (D-8)
     partExit(dir)              engine.js goTo() walking off either end of the component
     partResult()               the component result sent with 'completed'
     keyboardForwardAllowed()   engine.js ArrowLeft gate
     capturePartPayload / applyResumeVars / applyResumeDom / restoreScreenUI   the resume hooks
     applyExecutionState(st, n) the restore replay (50-loader.js phase B)
     repaintScreen(n)           engine.js goTo(), after resetScreenState — every navigation (§8.4a)
     onQuizAnswered / onQuizCommitted / onQuizHint   quiz-engine.js call sites
     onCustomAnswered / onCustomPick                 unit.js call sites (hand-built screens)
     partBoot()                 90-boot.js — builds the question screens and lands the part
   Design record: docs-and-tools/REPORTING-RESUME.md.
   ═══════════════════════════════════════════════════════════════════ */

var PART_FIRST = (window.PART_CONFIG && typeof window.PART_CONFIG.start === 'number') ? window.PART_CONFIG.start : 0;
var PART_LAST  = (window.PART_CONFIG && typeof window.PART_CONFIG.end === 'number') ? window.PART_CONFIG.end : TOTAL_SCREENS - 1;

/* x42's box is saved through CUSTOM_STATE (capturePartPayload), and its keystrokes arm the
   debounced save through the O-2 hook in 40-resume.js. */
var RESUME_INPUT_IDS = ['x42-input'];
var RESUME_TEXT_IDS  = [];

function inPart(n) { return typeof n === 'number' && n >= PART_FIRST && n <= PART_LAST; }
function _pq(n) { return QUESTIONS.find(function (x) { return x.screen === n; }) || null; }
function _partQuestions() { return QUESTIONS.filter(function (q) { return inPart(q.screen); }); }
function _itemFor(n) {
  var m = (typeof SCREEN_TO_SUBCONTENT !== 'undefined') ? SCREEN_TO_SUBCONTENT[n] : null;
  return m ? m[0] : null;
}
/* The catalogue questions a screen answers, e.g. ['q1'] or, on screen 65, ['q6', 'q7']. */
function _qKeysFor(n) {
  var m = (typeof XAPI_SCREEN_QUESTIONS !== 'undefined') ? XAPI_SCREEN_QUESTIONS[n] : null;
  return m || [];
}

/* ═══════════════════ Reporting call sites (quiz-engine.js) ═══════════════════ */

/* What the learner answered, as they see it. Single choice: the option's own text (tooltips and
   zoom buttons stripped by xapiAnswerText), else an image's alt, else the option id. Value input:
   the boxes in data-slot order — a ratio row reads "3:2", anything else "a | b". */
function quizAnswerText(screen, q, st) {
  try {
    if (q.type === 'single' || q.type === 'multi') {
      var ids = q.type === 'multi' ? (st.selectedSet || []) : [st.selected];
      return ids.map(function (id) {
        var o = document.querySelector('#q' + screen + ' .scq-opt[data-id="' + id + '"]');
        if (!o) return String(id);
        var t = xapiAnswerText(o.querySelector('.scq-opt-text') || o);
        var img = t ? null : o.querySelector('img');
        return t || (img && img.getAttribute('alt')) || String(id);
      }).join(', ');
    }
    if (q.type === 'value-input') {
      return (st.selectedSet || []).join(q.ratioRows ? ':' : ' | ');
    }
    return JSON.stringify(st.selectedSet || st.selected || '');
  } catch (e) { return ''; }
}

/* Called from quizCheck() after the verdict is known and BEFORE any marking — every submit, all
   three branches. The isLast idiom is the family's: correct || attempts exhausted; the Retry gate
   (quiz-engine.js) makes the second attempt a real one, so answered.last counts are honest.
   A statement screen decides each row on its own, so each row is its own catalogue question
   (§6.3 "one screen with several independent sub-questions"): per-row `correct`, shared isLast. */
function onQuizAnswered(screen, q, st, correct) {
  var item = _itemFor(screen);
  var keys = _qKeysFor(screen);
  if (!item || !keys.length) return;
  var isLast = correct || st.attempts >= q.maxAttempts;
  if (q.type === 'statement') {
    keys.forEach(function (k, i) {
      var v = (st.selectedSet || [])[i];
      var s = q.statements[i];
      if (!s) return;
      xapiAnswered(item, k, v === String(s.correct), isLast,
        (v === 'true' ? 'صحيح' : v === 'false' ? 'غير صحيح' : '') + ' — ' + xapiAnswerText(_htmlNode(s.text)));
    });
    return;
  }
  xapiAnswered(item, keys[0], correct, isLast, quizAnswerText(screen, q, st));
}
function _htmlNode(html) { var d = document.createElement('div'); d.innerHTML = html || ''; return d; }

/* Called at the very tail of quizCheck(), after the last commitment (done / lw / verdict) on every
   path — the flush-after-last-commitment contract (§8.3, D-13). */
function onQuizCommitted(screen) { flushResumeSave(); }

/* Called from quizOpenHint() after its done-guard, immediately before the overlay opens. The hints
   ledger (xapiRequestedHint → sendStatementOnce) reports each question's hint once per attempt,
   across re-opens and reloads (D-7). A statement screen's one hint covers both its rows; it is
   reported against the first. */
function onQuizHint(screen) {
  var item = _itemFor(screen);
  var keys = _qKeysFor(screen);
  if (item && keys.length) xapiRequestedHint(item, keys[0]);
}

/* ═══════════════════ The hand-built screens (unit.js) ═══════════════════
   Component 01 asks seven catalogue questions outside the quiz engine. unit.js keeps its own DOM
   logic and calls two seams:
     onCustomPick(screen, patch)      a pending choice (s6 row picks, s7 panels, the s42 box):
                                      remembered and saved, never reported
     onCustomAnswered(screen, patch)  a committed answer (s1, s4, s6's צדקתי?, a guided pick):
                                      remembered, reported, flushed
   Both ignore calls made while a painter replays a handler (resumeIsPainting) — the painters
   below restore these screens by calling unit.js's own handlers with the saved choice. */
var CUSTOM_STATE = {};

var CUSTOM_KEYS = {
  1: { correct: function (s) { return s.pick === S1_CORRECT; },
       text: function (s) { return s.pick === 'yes' ? 'نعم' : s.pick === 'no' ? 'لا' : ''; } },
  4: { correct: function (s) { return s.pick === S4_CORRECT; },
       text: function (s) { return s.pick === 'yes' ? 'نعم' : s.pick === 'no' ? 'لا' : ''; } },
  6: { correct: function (s) {
         return S6_ROWS.every(function (r, i) { return (s.picks || [])[i] === r.correct; });
       },
       text: function (s) {
         var col = { same: 'من نفس النوع', diff: 'من أنواع مختلفة' };
         return S6_ROWS.map(function (r, i) { return r.text + ': ' + (col[(s.picks || [])[i]] || '—'); }).join(' | ');
       } }
};
function _guidedCfg(n) { return (typeof GUIDED !== 'undefined') ? GUIDED.find(function (g) { return g.screen === n; }) : null; }

function onCustomPick(screen, patch) {
  if (resumeIsPainting()) return;
  CUSTOM_STATE[screen] = Object.assign(CUSTOM_STATE[screen] || {}, patch);
  scheduleResumeSave();
}

function onCustomAnswered(screen, patch) {
  if (resumeIsPainting()) return;
  var s = CUSTOM_STATE[screen] = Object.assign(CUSTOM_STATE[screen] || {}, patch, { done: true });
  var item = _itemFor(screen);
  var keys = _qKeysFor(screen);
  if (item && keys.length) {
    var correct = false, text = '';
    var g = _guidedCfg(screen);
    if (CUSTOM_KEYS[screen]) { correct = CUSTOM_KEYS[screen].correct(s); text = CUSTOM_KEYS[screen].text(s); }
    else if (g && g.q) { correct = s.pick === g.q.correct; text = g.q.opts[s.pick] || ''; }
    /* every hand-built question here has ONE attempt, so every answer is the last */
    xapiAnswered(item, keys[0], correct, true, text);
  }
  flushResumeSave();
}

/* ═══════════════════ Scores, gates and results ═══════════════════
   One rule for every component, from XAPI_Q_RESULTS — the same truth the 'answered' statements
   carried, so a result cannot disagree with them. Unanswered questions count as not correct.

   Components WITH a promise on screen (XAPI_GATE in script.js) score on exactly the set the
   learner was told about, and pass on the promised number (§6.4):
     02  "3 שאלות … צריך לענות נכון על 2 לפחות"  → the 3 stations (= items 001-003); a station is
                                                    correct when all of its questions are
     06  "5 סעיפים … להצליח ב-4 לפחות"            → the 5 question screens of item 001
     07  "7 סעיפים … להצליח ב-5 לפחות"            → the 7 question screens of item 001 (section ו,
                                                    screen 65, carries two catalogue questions
                                                    and is correct only when both rows are)
   Components WITHOUT one (01 teaching, 03 / 05 practice) score correct ÷ the questions the
   metadata declares, and always succeed: nothing on screen sets a bar, and inventing one would
   route learners on a number nobody was shown. Except 05, the challenge: MOE 2026-10-08 set its
   bar (XAPI_PART_PASS 0.6) — it is reported only, never shown and never gating.
   Component 04 (the class task) has no question: success with no score (§6.4). */

function _declaredQs(item) {
  try {
    var sc = (window.METADATA && window.METADATA.subContent) || [];
    for (var i = 0; i < sc.length; i++) {
      if (String(sc[i].id).replace(/\/+$/, '').slice(-(item.length + 1)) === '-' + item) {
        return (sc[i].questions || []).map(function (q) { return shortId(q.questionId); });
      }
    }
  } catch (e) {}
  /* no metadata (reporting off): the questions the screens of this item answer */
  var keys = [];
  var map = (typeof XAPI_SCREEN_QUESTIONS !== 'undefined') ? XAPI_SCREEN_QUESTIONS : {};
  Object.keys(map).forEach(function (n) {
    if (_itemFor(Number(n)) === item) keys = keys.concat(map[n]);
  });
  return keys;
}
function _evalItems() { return Object.keys((typeof XAPI_EVAL_ITEMS !== 'undefined') ? XAPI_EVAL_ITEMS : {}); }
function _qOk(item, k) { return XAPI_Q_RESULTS[item + '/' + k] === true; }
function _itemAllOk(item) { var qs = _declaredQs(item); return qs.length > 0 && qs.every(function (k) { return _qOk(item, k); }); }
function _screenAllOk(n) { var it = _itemFor(n), ks = _qKeysFor(n); return !!it && ks.length > 0 && ks.every(function (k) { return _qOk(it, k); }); }

/* The gated set: its members and how many of them are correct. */
function _gateTally() {
  var g = (typeof XAPI_GATE !== 'undefined') ? XAPI_GATE : null;
  if (!g) return null;
  var members = g.of === 'items'
    ? _evalItems()
    : Object.keys((typeof XAPI_SCREEN_QUESTIONS !== 'undefined') ? XAPI_SCREEN_QUESTIONS : {}).map(Number).filter(inPart);
  var ok = members.filter(function (m) { return g.of === 'items' ? _itemAllOk(m) : _screenAllOk(m); }).length;
  return { need: g.need, total: members.length, ok: ok };
}

/* ── A mid-component stop (XAPI_STOP in script.js; only 03 declares one) ──
   The ratio-02 SET_GATES pattern (7ae7cbd), sized to this engine. A HARD stop: no message, no
   retry — the answers are already revealed when the exercises resolve. The component reports
   'completed' (success false) and ENDS on the stop screen; the platform routes on that statement.

   ⚠️ FAILS OPEN: it may only close on evidence. Every declared question of every stop item must
   have a recorded result before the verdict counts — a resume whose results came back empty must
   not read as "wrong" and trap a learner who may well have passed. */
function _stop() { return (typeof XAPI_STOP !== 'undefined' && XAPI_STOP) ? XAPI_STOP : null; }
function _stopFailed() {
  var s = _stop();
  if (!s) return false;
  var complete = s.items.every(function (it) {
    var qs = _declaredQs(it);
    return qs.length > 0 && qs.every(function (k) { return typeof XAPI_Q_RESULTS[it + '/' + k] === 'boolean'; });
  });
  if (!complete) return false;
  return s.items.filter(_itemAllOk).length < s.need;
}
function stopBlocks(n) { var s = _stop(); return !!s && n === s.at && inPart(n) && _stopFailed(); }
function stopButton() { var s = _stop(); return s ? document.getElementById('q' + s.at + '-check') : null; }

/* End the component HERE, on the stop screen. Not partExit(): that only acts on PART_LAST and, under
   DEV_NAV, hops to the next component — the one place a stopped learner must not go. Same order
   otherwise: the 'completed' goes out first. Idempotent (sendCompletedOnce is ledger-guarded). It
   navigates NOWHERE, DEV_NAV included. */
function endComponentAtStop() {
  var res = partResult();
  try { xapiEndComponent(res, stopButton()); } catch (e) { console.error('[xAPI] end at stop', e); }
  try { setUnitResult(partResultKey(), 'fail'); } catch (e) { console.error('[resume] result', e); }
  flushResumeSave();
}

function partResult() {
  var items = _evalItems();
  if (!items.length) return { success: true };
  if (_stopFailed()) {
    var tot = 0, good = 0;
    items.forEach(function (it) { _declaredQs(it).forEach(function (k) { tot++; if (_qOk(it, k)) good++; }); });
    return { success: false, score: { scaled: tot ? good / tot : 0 } };
  }
  var t = _gateTally();
  if (t) return { success: t.ok >= t.need, score: { scaled: t.total ? t.ok / t.total : 0 } };
  var total = 0, ok = 0;
  items.forEach(function (it) {
    _declaredQs(it).forEach(function (k) { total++; if (_qOk(it, k)) ok++; });
  });
  /* XAPI_PART_PASS (script.js, only 05 declares one): MOE 2026-10-08 — the challenge reports its
     real score, success only ≥60%, no gate, nothing shown. */
  var scaled = total ? ok / total : 0;
  var pass = (typeof XAPI_PART_PASS === 'number') ? XAPI_PART_PASS : null;
  return { success: pass === null ? true : scaled >= pass, score: { scaled: scaled } };
}

/* An explicit result for every graded item's 'completed' (read by xapiItemResult, 20-xapi.js).
   Without it the item result would be the library's own per-page-load aggregate, which knows
   nothing about answers restored by a resume. scaled = correct ÷ declared; success = all correct,
   except an item that IS a gated component's whole promised set (06 / 07), whose success is the
   gate's. Built as a getter map so it follows XAPI_EVAL_ITEMS (script.js, loaded before this). */
var XAPI_ITEM_RESULT = {};
_evalItems().forEach(function (item) {
  XAPI_ITEM_RESULT[item] = function () {
    var qs = _declaredQs(item);
    var ok = qs.filter(function (k) { return _qOk(item, k); }).length;
    var scaled = qs.length ? ok / qs.length : 0;
    var g = (typeof XAPI_GATE !== 'undefined') ? XAPI_GATE : null;
    var success = (g && g.of === 'screens') ? (function () { var t = _gateTally(); return t.ok >= t.need; })()
                                            : (qs.length > 0 && ok === qs.length);
    return { success: success, score: { scaled: scaled } };
  };
});

function partResultKey() { return 'ratio04_c' + currentPartSlug().slice(-2) + '_result'; }

/* ═══════════════════ The end of the component ═══════════════════ */

/* The button whose click ends this component: the last question's "המשך" (02, 03, 05, and 01's
   screen 19), else the static last screen's continue button (04's x42, 06's x56, 07's x67). */
function lastScreenButton() {
  if (_pq(PART_LAST)) return document.getElementById('q' + PART_LAST + '-check');
  return document.querySelector('.screen[data-screen="' + PART_LAST + '"] .btn-continue');
}

/* engine.js goTo() calls this instead of hopping when n leaves [PART_FIRST, PART_LAST].
   Forward off the last screen = the learner's last click: report the component, disable the
   button, record the verdict, flush — and navigate NOWHERE (the platform owns routing, §8.12).
   Only a DEV_NAV walkthrough (?dev=1 without ?registration) goes on to the next component.
   Backward off the first screen only exists under DEV_NAV too. */
function partExit(dir) {
  if (_restoring) return;
  if (dir < 0) {
    if (DEV_NAV) goToPrevPart();
    return;
  }
  if (currentScreen !== PART_LAST) return;
  /* The last question must be answered before its "המשך" ends anything, and a gated static last
     screen (x42 until something is typed) must be open — ArrowLeft reaches this path too. */
  var lq = _pq(PART_LAST);
  if (lq && !(quizState[PART_LAST] && quizState[PART_LAST].done)) return;
  var btn = lastScreenButton();
  if (!lq && btn && btn.disabled && !alreadySent('done', currentPartSlug())) return;
  var res = partResult();
  try { xapiEndComponent(res, btn); } catch (e) { console.error('[xAPI] end component', e); }
  try { setUnitResult(partResultKey(), res.success ? 'pass' : 'fail'); } catch (e) { console.error('[resume] result', e); }
  flushResumeSave();
  if (DEV_NAV && window.PART_CONFIG && window.PART_CONFIG.next) {
    var dest = String(window.PART_CONFIG.next).replace(/\/index\.html$/, '').replace(/\/+$/, '').split('/').pop();
    writeForwardState(dest, '#screen=' + PART_LAST);
    goToNextPart();
  }
}

/* ArrowLeft goes forward only where the screen's own forward button would (engine.js): a quiz
   screen once answered, s6 once checked, any other screen while its continue button is enabled
   (s0 before a character is chosen, s2 before the companion appears, s7 before both panels, the
   guided questions, x42). A local walkthrough keeps free navigation. */
function keyboardForwardAllowed() {
  if (DEV_NAV) return true;
  var n = currentScreen;
  if (quizState[n]) return !!quizState[n].done;
  if (n === 6 && inPart(6)) return !!(CUSTOM_STATE[6] && CUSTOM_STATE[6].done);
  var btn = document.querySelector('.screen[data-screen="' + n + '"] .btn-continue');
  return !(btn && btn.disabled);
}

/* ═══════════════════ Resume hooks ═══════════════════ */

var RESUME_Q_FIELDS = ['attempts', 'done', 'wasCorrect', 'hintUsed', 'selected', 'selectedSet', 'lw', 'tgl'];

/* This component's payload: where the learner is, the per-question verdicts, every quiz
   question's state — submitted AND pending (§8.8 rule 4) — and the hand-built screens'. */
function capturePartPayload() {
  var qs = {};
  _partQuestions().forEach(function (q) {
    var st = quizState[q.screen];
    if (!st) return;
    var o = {};
    RESUME_Q_FIELDS.forEach(function (k) {
      if (st[k] === undefined) return;
      o[k] = Array.isArray(st[k]) ? st[k].slice() : st[k];
    });
    qs[q.screen] = o;
  });
  var x42 = document.getElementById('x42-input');
  if (x42 && inPart(42)) CUSTOM_STATE[42] = { text: x42.value };
  return {
    currentScreen: currentScreen,
    qResults: JSON.parse(JSON.stringify(XAPI_Q_RESULTS)),
    q: qs,
    c: JSON.parse(JSON.stringify(CUSTOM_STATE))
  };
}

/* Restores the variables. Idempotent — applyExecutionState runs it twice. XAPI_Q_RESULTS and
   CUSTOM_STATE are refilled in place (shared vars other code holds). Only this part's screens. */
function applyResumeVars(st) {
  if (!st) return;
  if (st.qResults && typeof st.qResults === 'object') {
    Object.keys(XAPI_Q_RESULTS).forEach(function (k) { delete XAPI_Q_RESULTS[k]; });
    Object.keys(st.qResults).forEach(function (k) { XAPI_Q_RESULTS[k] = !!st.qResults[k]; });
  }
  var qs = st.q || {};
  Object.keys(qs).forEach(function (key) {
    var n = Number(key);
    if (!inPart(n) || !quizState[n]) return;
    var src = qs[key] || {};
    RESUME_Q_FIELDS.forEach(function (k) {
      if (src[k] === undefined) return;
      quizState[n][k] = Array.isArray(src[k]) ? src[k].slice() : src[k];
    });
  });
  var cs = st.c || {};
  Object.keys(CUSTOM_STATE).forEach(function (k) { delete CUSTOM_STATE[k]; });
  Object.keys(cs).forEach(function (key) {
    if (inPart(Number(key))) CUSTOM_STATE[key] = JSON.parse(JSON.stringify(cs[key]));
  });
  /* s7's gate lives in unit.js's own object; it is state, so it is restored here (§8.8 rule 7) */
  if (CUSTOM_STATE[7] && typeof s7Opened !== 'undefined') {
    s7Opened.a = !!CUSTOM_STATE[7].a;
    s7Opened.b = !!CUSTOM_STATE[7].b;
  }
}

/* Nothing here lives only in the DOM: typed values are mirrored into quizState[n].selectedSet on
   every keystroke (quizInputChange) and x42's box into CUSTOM_STATE, and the painters write both
   back after this runs. */
function applyResumeDom(st) { /* intentionally empty — see restoreScreenUI */ }

/* One painter per interaction type, config-driven (§8.8). Every painter:
   - repaints from state, never resets it; never reports; mutates no score state
   - is idempotent and safe on a clean screen ("clean" = nothing picked or typed, never attempts===0)
   - re-derives the check button through the live predicate (quizCheckBlocked — the Retry gate)
   - draws the wrong-attempt look only while the answer is still the submitted one (D-15)
   Static screens have no painter. */
function restoreScreenUI(n) {
  if (!inPart(n)) return;
  var q = _pq(n);
  if (q) {
    var st = quizState[n];
    if (!st || !document.getElementById('q' + n)) return;
    if (q.type === 'single' || q.type === 'multi') paintChoice(n, q, st);
    else if (q.type === 'value-input') paintValue(n, q, st);
    else if (q.type === 'statement') paintStatement(n, q, st);
    return;
  }
  paintCustom(n);
}

function _hintBtn(n) { return document.getElementById('q' + n + '-hint'); }

/* The finished look: exactly what live play leaves (quizCheck's correct / final-wrong branches). */
function _paintDone(n, q, st) {
  var hb = _hintBtn(n);
  if (hb) hb.style.display = 'none';
  if (st.wasCorrect) {
    quizShowFeedback(n, 'correct', q.fb.correct);
  } else {
    var fb = Object.assign({}, q.fb.wrong);
    if (q.type === 'value-input' && st.slotOk && st.slotOk.some(Boolean)) fb.title = 'تقريبًا! بعض الإجابات صحيحة';
    quizShowFeedback(n, 'wrong', fb);
    if (q.type === 'value-input') {
      var mode = st.tgl;
      quizAnswerToggleAdd(n, q);
      var tb = document.querySelector('#q' + n + '-feedbox .fb-answer-toggle');
      if (mode === 'mine' && tb) tb.click();
    }
  }
  quizFinish(n);   // DOM: stepper, locked options, "המשך"; st.done is already true
}

function paintChoice(n, q, st) {
  var opts = document.querySelectorAll('#q' + n + ' .scq-opt');
  var picked = q.type === 'multi' ? (st.selectedSet || []) : (st.selected ? [st.selected] : []);
  var hasPick = picked.length > 0;
  if (!st.done && !st.attempts && !hasPick) return;              // clean screen — leave untouched
  opts.forEach(function (o) {
    o.classList.remove('selected', 'correct', 'wrong', 'locked');
    var on = picked.indexOf(o.dataset.id) !== -1;
    if (on) o.classList.add('selected');
    o.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  var check = document.getElementById('q' + n + '-check');
  if (st.done) {
    quizMarkOutcome(n, q, !!st.wasCorrect);
    _paintDone(n, q, st);
    return;
  }
  check.textContent = 'هل إجابتي صحيحة؟';
  if (st.attempts > 0) {
    var hb = _hintBtn(n);
    if (hb) hb.style.visibility = 'visible';
    /* Nothing new picked since the rejected attempt: show what the learner saw when they left —
       the rejected pick marked wrong and the retry prompt. A new pick clears both, as live. */
    if (!hasPick && st.lw && q.type === 'single') {
      var w = document.querySelector('#q' + n + ' .scq-opt[data-id="' + st.lw + '"]');
      if (w) w.classList.add('wrong');
      quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
    } else {
      quizHideFeedback(n);
    }
  }
  check.disabled = quizCheckBlocked(q, st, hasPick);
}

function paintValue(n, q, st) {
  var slots = Array.prototype.slice.call(document.querySelectorAll('#q' + n + ' .vi-input'));
  var vals = st.selectedSet || [];
  var typed = vals.some(function (v) { return v !== '' && v != null; });
  if (!st.done && !st.attempts && !typed) return;                 // clean screen — leave untouched
  slots.forEach(function (inp, i) {
    inp.value = vals[i] == null ? '' : vals[i];
    inp.classList.remove('wrong', 'correct', 'mark-ok', 'mark-bad');
    inp.disabled = false;
  });
  var check = document.getElementById('q' + n + '-check');
  if (st.done) {
    quizMarkOutcome(n, q, !!st.wasCorrect);   // recomputes the same slotOk/answerKey from the same selectedSet
    _paintDone(n, q, st);
    return;
  }
  check.textContent = 'هل إجابتي صحيحة؟';
  var ready = slots.length > 0 && vals.length === slots.length && !vals.some(function (v) { return !v; });
  if (st.attempts > 0) {
    var hb = _hintBtn(n);
    if (hb) hb.style.visibility = 'visible';
    if (st.lw && quizSig(q, st) === st.lw) {        // still the rejected answer: its marks + prompt
      quizMarkRetry(n, q);
      quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
    } else {
      quizHideFeedback(n);
    }
  }
  check.disabled = quizCheckBlocked(q, st, ready);
}

/* The נכון / לא נכון rows (screen 65). Same contract as the two above. */
function paintStatement(n, q, st) {
  var rows = Array.prototype.slice.call(document.querySelectorAll('#q' + n + ' .stmt-row'));
  var vals = st.selectedSet || [];
  var picked = vals.some(function (v) { return !!v; });
  if (!st.done && !st.attempts && !picked) return;                // clean screen — leave untouched
  rows.forEach(function (r, i) {
    r.classList.remove('wrong');
    r.querySelectorAll('.stmt-pill').forEach(function (p) {
      p.classList.remove('selected', 'correct', 'wrong');
      p.disabled = false;
      if (vals[i] && p.dataset.val === vals[i]) p.classList.add('selected');
    });
  });
  var check = document.getElementById('q' + n + '-check');
  if (st.done) {
    quizMarkOutcome(n, q, !!st.wasCorrect);
    _paintDone(n, q, st);
    return;
  }
  check.textContent = 'هل إجابتي صحيحة؟';
  var ready = rows.length > 0 && vals.length === rows.length && !vals.some(function (v) { return !v; });
  if (st.attempts > 0) {
    var hb = _hintBtn(n);
    if (hb) hb.style.visibility = 'visible';
    if (st.lw && quizSig(q, st) === st.lw) {
      quizMarkRetry(n, q);
      quizShowFeedback(n, 'wrong', { title: q.fb.retry, body: '' });
    } else {
      quizHideFeedback(n);
    }
  }
  check.disabled = quizCheckBlocked(q, st, ready);
}

/* The hand-built screens: replay unit.js's own handler with the saved choice, so the painted
   screen is exactly what the live click produced. Each replay is guarded on the DOM so a screen
   already showing its answer is left alone, and onCustom* ignore the replay (resumeIsPainting). */
function paintCustom(n) {
  var s = CUSTOM_STATE[n];
  if (!s) return;
  if (n === 1 || n === 4) {
    if (!s.done || document.querySelector('#s' + n + ' .scq-opt[disabled]')) return;
    var b = document.querySelector('#s' + n + ' .scq-opt[data-opt="' + s.pick + '"]');
    if (b) (n === 1 ? s1Answer : s4Answer)(b);
    return;
  }
  if (n === 6) {
    if (document.querySelector('#s6-rows .sort-pick[disabled]')) return;   // already checked on screen
    s6Build();
    (s.picks || []).forEach(function (col, i) { if (col) s6Pick(i, col); });
    if (s.done) s6Check();
    return;
  }
  if (n === 7) { s7Enter(); return; }
  if (n === 42) {
    var inp = document.getElementById('x42-input');
    if (inp && !inp.value && s.text) { inp.value = s.text; s42Typed(); }
    return;
  }
  var g = _guidedCfg(n);
  if (g && g.q && s.done && guidedState[n] && !guidedState[n].done) {
    var el = document.querySelector('#g' + n + ' .gc-opt[data-idx="' + s.pick + '"]');
    if (el) guidedAnswer(n, el);
  }
}

/* Every navigation repaints the target screen from state (engine.js goTo, after resetScreenState):
   the §8.4a hard-lock is "variables say answered, DOM says blank". Skipped while restoring —
   applyExecutionState paints explicitly after its second applyResumeVars. Never an empty catch. */
function repaintScreen(n) {
  if (_restoring) return;
  beginRepaint();
  try {
    restoreScreenUI(n);
    restoreEndedButton();   // D-8: the painter just re-enabled a finished component's button
  } catch (e) { console.error('[resume] repaintScreen', e); }
  finally { endRepaint(); }
}

/* Replay a saved payload onto this component (ratio-06 70-platform.js). Two passes of
   applyResumeVars around goTo(); the sender is stubbed across the whole replay so nothing is
   re-reported; then the library is told about the restored answers (B-1 / seed) and the landing
   screen's item is opened exactly once.
   screenOverride (#screen=N) chooses the SCREEN only, never skips the restore (§8.4b). Both it and
   the saved screen are range-checked against THIS component: engine.js goTo() treats a screen
   outside [PART_FIRST, PART_LAST] as a request to leave the component. */
function applyExecutionState(st, screenOverride) {
  if (!st) return;
  _restoring = true;
  var _origSend = window.sendStatement720;
  window.sendStatement720 = function () {};
  var _inRange = function (v) { return typeof v === 'number' && v >= PART_FIRST && v <= PART_LAST; };
  try {
    applyResumeVars(st);
    var _n = _inRange(screenOverride) ? screenOverride
           : (_inRange(st.currentScreen) ? st.currentScreen : PART_FIRST);
    goTo(_n);
    applyResumeVars(st);
    applyResumeDom(st);
    restoreScreenUI(currentScreen);
    restoreEndedButton();
    /* The progress strip of the landing screen reads quizState, restored above */
    try { quizStepperUpdate(currentScreen); } catch (e) {}
  } catch (e) {
    console.error('[resume] apply', e);
  } finally {
    window.sendStatement720 = _origSend;
    _restoring = false;
  }
  try { xapiSeedAnsweredFromResume(); } catch (e) {}
  xapiCurrentItem = null;
  try { xapiOnScreen(currentScreen); } catch (e) {}
}

/* Pending answers are saved as they are made, not only on the next screen change (O-2 for this
   engine): a pick or a keystroke arms the debounced save. Bubble phase on document, so the
   element's own inline handler has already updated quizState. */
function initQuizFieldSaves() {
  var arm = function (e) {
    var t = e && e.target;
    if (t && t.closest && t.closest('.quiz-screen')) scheduleResumeSave();
  };
  document.addEventListener('input', arm);
  document.addEventListener('change', arm);
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.quiz-screen .scq-opt, .quiz-screen .stmt-pill')) scheduleResumeSave();
  });
}

/* ═══════════════════ YouTube (screens 3 and 5, component 01) ═══════════════════
   Ported as is from methodica-math-percent-08 (70-platform.js, incl. its live QA B-4 fix 4ac987d)
   on 07.10.26: ratio-04 had the same static iframes but no reporting layer, so its two content
   films sent no played/paused at all (MOE monday, 05.10).

   ytApplyOrigin is ratio-04's addition (same monday item — "the videos don't open", YouTube's
   player-configuration error 153: no referrer signal reached YouTube in the tester's launch
   environment). The 720 standard (ADDING-REPORTING-AND-RESUME.md §6.9.1): origin=location.ORIGIN
   in the embed URL, over http(s) only, NEVER href (the launch query carries the reporting token).
   It runs before partBoot's first goTo() parks the iframes, so the parked copy carries it too.

   The two iframes are static markup: src = youtube-nocookie.com/embed/<id>?enablejsapi=1&…, nothing
   derived from location.href (QA D-1 — the launch URL carries the reporting token). YT.Player is
   attached to the FINISHED element with no videoId / playerVars, so the API never builds an iframe
   and never appends `forigin`. data-yt-item names the catalogue item the video belongs to.

   engine.js goTo() used to stop a video by blanking its src (about:blank) and restoring it on
   entry. That would sever the API binding, so a wired player is stopped through the API instead
   (ytLeave): an open 'played' is closed with its 'paused' first — the learner left, which is a real
   pause (§6.9.2) — then stopVideo() rewinds it, as the blanking did. If the API never loaded the
   player is absent and ytLeave returns false, and the old blanking stays the fallback. */
var YT_API_SRC = 'https://www.youtube.com/iframe_api';
function ytWirePlayers() {
  var frames = document.querySelectorAll('iframe[data-yt-item]');
  if (!frames.length) return;
  var attach = function () {
    frames.forEach(function (f) {
      if (f.__ytPlayer || !window.YT || !YT.Player) return;
      var item = f.getAttribute('data-yt-item');
      /* The boot's goTo() parked every iframe on about:blank before the API arrived; a player is
         only meaningful on the real embed, and from now on ytLeave stops it without blanking. */
      if (f.dataset.src && f.getAttribute('src') === 'about:blank') f.setAttribute('src', f.dataset.src);
      /* The API overwrites the iframe's title with "YouTube video player" (seen live 28.09.26);
         the Hebrew title is the accessible name — put it back once the player is ready. */
      var title = f.getAttribute('title');
      try {
        f.__ytPlayer = new YT.Player(f, { events: {
          onReady: function () { try { if (title) f.setAttribute('title', title); } catch (_) {} },
          onStateChange: function (e) {
            try { xapiYouTubeState(e, item); } catch (_) {}
            try { if (title && f.getAttribute('title') !== title) f.setAttribute('title', title); } catch (_) {}
          } } });
      } catch (e) { console.error('[youtube] attach', e); }
    });
  };
  if (window.YT && YT.Player) { attach(); return; }
  var prev = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = function () {
    if (typeof prev === 'function') { try { prev(); } catch (e) {} }
    attach();
  };
  if (!document.querySelector('script[src="' + YT_API_SRC + '"]')) {
    var s = document.createElement('script');
    s.src = YT_API_SRC;
    s.onerror = function () { console.warn('[youtube] iframe API unavailable — videos play, not reported'); };
    document.head.appendChild(s);
  }
}
/* Stop a WIRED player on leaving its screen. Returns true for every wired iframe (one that has a
   __ytPlayer), ready or not, so goTo() never blanks it.

   QA B-4 (2026-10-04, seen live): a real player has no methods until its embed has loaded and
   handshaken — seconds after ytWirePlayers() attached it. This used to answer false in that window;
   goTo() then parked the iframe on about:blank, a player bound to a blanked page can never become
   ready, and the restore on entry skipped it (it has a __ytPlayer) — both videos stayed black for
   the rest of the page load, with no played/paused. A not-yet-ready player cannot have been started
   through the API, but the learner may have pressed play inside the embed, so it is paused through
   the embed's own message channel (enablejsapi=1) instead of being torn down. */
function ytLeave(f) {
  var p = f && f.__ytPlayer;
  if (!p) return false;
  if (typeof p.stopVideo !== 'function') {
    try {
      if (f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), 'https://www.youtube-nocookie.com');
    } catch (e) {}
    return true;
  }
  try {
    if (p.__xapiPlaying && window.YT && YT.PlayerState) xapiYouTubeState({ target: p, data: YT.PlayerState.PAUSED }, f.getAttribute('data-yt-item'));
    p.__xapiPlaying = false;
    p.stopVideo();
  } catch (e) { console.error('[youtube] leave', e); }
  return true;
}

/* Self-heal on entry (B-4): a wired iframe found on about:blank has lost its player for good. Put
   the real embed back, drop the dead binding and wire a fresh player. Returns true when it acted. */
function ytHeal(f) {
  if (!f || !f.__ytPlayer || f.getAttribute('src') !== 'about:blank' || !f.dataset.src) return false;
  f.setAttribute('src', f.dataset.src);
  try { delete f.__ytPlayer; } catch (e) { f.__ytPlayer = undefined; }
  try { ytWirePlayers(); } catch (e) { console.error('[youtube] heal', e); }
  return true;
}

function ytApplyOrigin() {
  if (!/^https?:$/.test(window.location.protocol)) return;   // file:// has origin "null" — YouTube rejects it
  var o = 'origin=' + encodeURIComponent(window.location.origin);
  document.querySelectorAll('iframe[data-yt-item]').forEach(function (f) {
    var s = f.getAttribute('src');
    if (!s || /[?&]origin=/.test(s) || !/youtube-nocookie\.com\/embed\//.test(s)) return;
    f.setAttribute('src', s + (s.indexOf('?') < 0 ? '?' : '&') + o);
  });
}

/* The part's own boot, called once from 90-boot.js (was engine.js's DOMContentLoaded block):
   build the question screens, scale, land. The guided screens are built by unit.js's own
   DOMContentLoaded listener, which runs before this one (90-boot.js registers last). */
function partBoot() {
  if (typeof quizBuildScreens === 'function') quizBuildScreens();
  scaleApp();
  try { ytApplyOrigin(); } catch (e) { console.error('[boot] ytApplyOrigin', e); }
  /* NOT a hard goTo(0): goTo() treats n < PART_FIRST as leaving the component. */
  goTo(firstScreen());
  if (window.Motion) Motion.reveal(document.querySelector('.screen.active'));
  try { ytWirePlayers(); } catch (e) { console.error('[boot] ytWirePlayers', e); }
}
