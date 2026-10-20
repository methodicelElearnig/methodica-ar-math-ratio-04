#!/usr/bin/env node
/* ═══════════════════ statement-flow.js — methodica-ar-math-ratio-04 behaviour ═══════════════════
   NOT DEPLOYED. What each component actually sends, walked through the REAL handlers in jsdom
   over the stub library (ADDING-REPORTING-AND-RESUME.md §6.8, §8, §10.2):

     regression  no ?slxapi → no library, scoring still works (XAPI_Q_RESULTS)
     walk        every component, all answers right: one answered.last per declared question,
                 each item initialized → completed once, one component completed, success, no
                 duplicate, the last button disabled, nothing navigates
     gate        02 / 06 / 07 fail below the promise and pass on it, and scaled is the promise's
     retry       the second attempt must differ (Retry gate) and is answered.last
     hints       requested.1 once per question, across re-opens and a reload (D-7)
     resume      reload mid-component: same screen, painted answers, no re-report; reload after
                 the end: button stays disabled, no second completed (D-8); B-1 seed
     back        Back into an earlier item re-opens it and closes nothing (O-1)
     keyboard    ArrowLeft is gated like the screen's own button; free under DEV_NAV
     character   the choice lands in the document and the later components adopt it

     NODE_PATH=C:/lomda-test/node_modules node _test/statement-flow.js
   ═══════════════════════════════════════════════════════════════════════════════════════ */
'use strict';
const H = require('./harness');
const { PARTS, readMeta } = H;
const R = H.makeReporter('statement-flow');
const { ok, eq } = R;

const short = s => String((s.opts && (s.opts.questionId || s.opts.objectId)) || s.objectType).replace(/\/+$/, '').split('/').pop();
const declaredCount = c => readMeta(c).subContent.reduce((a, sc) => a + (sc.questions || []).length, 0);

/* Answer every question of the component in screen order, through the real handlers.
   plan(n, q) → 'right' | 'wrong' (two distinct wrong attempts) for quiz screens. */
function walk(b, plan) {
  const P = JSON.parse(b.val('JSON.stringify(window.PART_CONFIG)'));
  for (let n = P.start; n <= P.end; n++) {
    b.exec('goTo(' + n + ')');
    const q = JSON.parse(b.val('JSON.stringify(QUESTIONS.find(function(q){return q.screen===' + n + ';}) || null)'));
    if (q) {
      const kind = plan ? plan(n, q) : 'right';
      if (kind === 'right') b.exec(H.enterJs(n, H.answerFor(q, 'right')) + H.clickCheck(n));
      else for (let k = 0; k < q.maxAttempts; k++) b.exec(H.enterJs(n, H.answerFor(q, 'wrong', k)) + H.clickCheck(n));
      continue;
    }
    /* component 01's hand-built screens, answered right */
    const custom = {
      0: 'selectOption(document.querySelector(\'#s0 .option-card[data-value="character-white"]\'))',
      1: 's1Answer(document.querySelector(\'#s1 .scq-opt[data-opt="no"]\'))',
      4: 's4Answer(document.querySelector(\'#s4 .scq-opt[data-opt="no"]\'))',
      6: 'S6_ROWS.forEach(function(r,i){ s6Pick(i, r.correct); }); s6Check()',
      7: 's7Toggle("a"); s7Toggle("b")',
      10: 'guidedAnswer(10, document.querySelector(\'#g10 .gc-opt[data-idx="0"]\'))',
      11: 'guidedAnswer(11, document.querySelector(\'#g11 .gc-opt[data-idx="1"]\'))',
      14: 'guidedAnswer(14, document.querySelector(\'#g14 .gc-opt[data-idx="1"]\'))',
      15: 'guidedAnswer(15, document.querySelector(\'#g15 .gc-opt[data-idx="0"]\'))',
      42: 'var t = document.getElementById("x42-input"); t.value = "30 חזרות בדקה"; s42Typed()'
    };
    if (custom[n] && b.val('!!document.querySelector(\'.screen[data-screen="' + n + '"]\')')) b.exec(custom[n]);
  }
}
function endClick(b) {
  b.exec('(function(){ var n = PART_LAST; var q = QUESTIONS.find(function(x){return x.screen===n;});' +
    ' if (q) document.getElementById("q" + n + "-check").click(); else lastScreenButton().click(); })()');
}

(async function main() {
  /* ── regression: no launch parameters ── */
  {
    const b = await H.boot('02', { lib: false, search: '' });
    ok('regression', 'no ?slxapi: no library sender exists, so nothing can be sent', b.val('typeof window.sendStatement720 !== "function"'));
    b.exec('goTo(21);' + H.enterJs(21, { single: b.val('QUESTIONS.find(function(q){return q.screen===21;}).correct') }) + H.clickCheck(21));
    eq('regression', 'scoring still records the answer', b.val('XAPI_Q_RESULTS["001/q1"]'), true);
    ok('regression', 'nothing was fetched', !b.w.__fetches.length);
  }

  /* ── walk: every component, all right ── */
  for (const c of PARTS) {
    const b = await H.boot(c, { lib: true });
    b.finishBoot();
    b.exec('window.__hops = 0; goToNextPart = function () { window.__hops++; }; goToPrevPart = function () { window.__hops++; };');
    walk(b);
    endClick(b);
    endClick(b);   // a second click is silent
    b.exec('goTo(PART_FIRST - 1)');   // Back off the first screen
    const st = b.stmts();
    const answeredLast = st.filter(s => s.verb === 'answered.last');
    eq('walk', c + ' one answered.last per declared question', answeredLast.length, declaredCount(c));
    ok('walk', c + ' no plain answered when everything is right first time', !st.some(s => s.verb === 'answered'));
    ok('walk', c + ' every answer is correct', answeredLast.every(s => s.result && s.result.success === true));
    const meta = readMeta(c);
    meta.subContent.forEach(sc => {
      const id = sc.id;
      eq('walk', c + ' item ' + short({ opts: { objectId: id } }) + ' completed exactly once',
        st.filter(s => s.verb === 'completed' && s.opts && s.opts.objectId === id).length, 1);
      const ic = st.find(s => s.verb === 'completed' && s.opts && s.opts.objectId === id);
      if ((sc.questions || []).length) {
        ok('walk', c + ' item ' + short({ opts: { objectId: id } }) + ' completed carries an explicit result (success + scaled 1)',
          ic && ic.result && ic.result.success === true && ic.result.score && ic.result.score.scaled === 1, JSON.stringify(ic && ic.result));
      }
      ok('walk', c + ' item ' + short({ opts: { objectId: id } }) + ' initialized before completed',
        st.findIndex(s => s.verb === 'initialized' && s.opts && s.opts.objectId === id) <
        st.findIndex(s => s.verb === 'completed' && s.opts && s.opts.objectId === id));
    });
    const comp = st.filter(s => s.verb === 'completed' && s.objectType === 'onlinelesson');
    eq('walk', c + ' one component completed', comp.length, 1);
    ok('walk', c + ' component completed is the last statement', st[st.length - 1] && st[st.length - 1].objectType === 'onlinelesson' && st[st.length - 1].verb === 'completed');
    ok('walk', c + ' component success', comp[0] && comp[0].result && comp[0].result.success === true);
    if (declaredCount(c)) eq('walk', c + ' component scaled = 1', comp[0] && comp[0].result.score.scaled, 1);
    else ok('walk', c + ' no questions → success with no score', comp[0] && comp[0].result && !comp[0].result.score);
    ok('walk', c + ' the last button is disabled', b.val('lastScreenButton().disabled'));
    eq('walk', c + ' nothing navigated (no hop to a neighbour without DEV_NAV)', b.val('window.__hops'), 0);
    eq('walk', c + ' verdict recorded', b.val('getUnitResult(partResultKey())'), 'pass');
    ok('walk', c + ' no console errors', !b.errors.length, b.errors.slice(0, 3).join(' | '));
  }

  /* ── gate ── */
  const GATES = { '02': { total: 3, need: 2 }, '06': { total: 5, need: 4 }, '07': { total: 7, need: 5 } };
  for (const c of Object.keys(GATES)) {
    const G = GATES[c];
    for (const wrongCount of [G.total - G.need, G.total - G.need + 1]) {
      const b = await H.boot(c, { lib: true });
      b.finishBoot();
      /* make `wrongCount` members wrong: stations (02) = the first screen of each item; sections = screens */
      const qmap = JSON.parse(b.val('JSON.stringify(XAPI_SCREEN_QUESTIONS)'));
      const map = JSON.parse(b.val('JSON.stringify(SCREEN_TO_SUBCONTENT)'));
      let members = Object.keys(qmap).map(Number);
      if (c === '02') { const seen = {}; members = members.filter(n => !seen[map[n][0]] && (seen[map[n][0]] = true)); }
      const wrong = new Set(members.slice(0, wrongCount));
      walk(b, n => wrong.has(n) ? 'wrong' : 'right');
      endClick(b);
      const comp = b.stmts().filter(s => s.verb === 'completed' && s.objectType === 'onlinelesson')[0];
      const pass = G.total - wrongCount >= G.need;
      eq('gate', c + ' ' + (G.total - wrongCount) + '/' + G.total + ' → success ' + pass, comp && comp.result.success, pass);
      eq('gate', c + ' scaled is counted on the promised set', comp && comp.result.score.scaled, (G.total - wrongCount) / G.total);
      eq('gate', c + ' verdict recorded', b.val('getUnitResult(partResultKey())'), pass ? 'pass' : 'fail');
      ok('gate', c + ' the component still ends below the gate', b.val('lastScreenButton().disabled'));
    }
  }

  /* ── retry + hints + resume + back (component 03) ── */
  {
    const b = await H.boot('03', { lib: true });
    b.finishBoot();
    const q30 = JSON.parse(b.val('JSON.stringify(QUESTIONS.find(function(q){return q.screen===30;}))'));
    b.exec('goTo(30); quizOpenHint(30); quizCloseHint(); quizOpenHint(30); quizCloseHint();');
    b.exec(H.enterJs(30, H.answerFor(q30, 'wrong', 0)) + H.clickCheck(30));
    b.exec(H.enterJs(30, H.answerFor(q30, 'wrong', 0)));
    ok('retry', 'the same wrong answer cannot be submitted twice', b.val('document.getElementById("q30-check").disabled'));
    b.exec(H.enterJs(30, H.answerFor(q30, 'right')) + H.clickCheck(30));
    eq('retry', 'first wrong = answered, second = answered.last', b.stmts().filter(s => /^answered/.test(s.verb)).map(s => s.verb), ['answered', 'answered.last']);
    eq('hints', 'two opens → one requested.1', b.stmts().filter(s => s.verb === 'requested.1').length, 1);
    const q31 = JSON.parse(b.val('JSON.stringify(QUESTIONS.find(function(q){return q.screen===31;}))'));
    b.exec('goTo(31);' + H.enterJs(31, H.answerFor(q31, 'wrong', 0)) + H.clickCheck(31));
    /* no flush here and no wait: the 800 ms debounce from goTo(31) has not landed, so only the
       synchronous flush after the commitment (onQuizCommitted) can have saved this attempt */
    const before = b.stmts().length;

    const r = await b.reload();
    r.finishBoot();
    eq('resume', 'reload lands on the saved screen', r.val('currentScreen'), 31);
    eq('resume', 'the pending retry is painted (lw kept, same answer blocked)', r.val('!!quizState[31].lw && document.getElementById("q31-check").disabled'), true);
    r.exec('goTo(30)');
    ok('resume', 'the answered screen is painted finished', r.val('document.getElementById("q30-feedbox").classList.contains("is-correct")'));
    r.exec('quizOpenHint(30); quizOpenHint(31); quizCloseHint();');
    const after = r.stmts().slice(before);
    ok('resume', 'nothing re-reported by the restore', !after.some(s => /^answered|^completed/.test(s.verb)), after.map(s => s.verb).join(','));
    eq('hints', 'hint on 30 is not re-reported after the reload; 31 is new', after.filter(s => s.verb === 'requested.1').map(short), ['q2']);
    ok('resume', 'B-1 seed: the library knows item 001 was answered', r.val('!!window.xapiItemAnswered[xapiItemId("001")]'));

    /* O-1: back from 33 (item 002) to 32 (item 001) closes nothing */
    r.exec('goTo(32); goTo(33);');
    const mark = r.stmts().length;
    r.exec('goTo(32)');
    const back = r.stmts().slice(mark);
    ok('back', 'Back into an earlier item closes nothing', !back.some(s => s.verb === 'completed'));
    ok('back', 'Back re-opens the earlier item', back.some(s => s.verb === 'initialized' && short(s) === 'methodica-ar-math-ratio-04-03-001'));
  }

  /* ── B-2 (QA 2026-10-02): Back onto a screen with NO item closes nothing (component 01) ──
     Live: s19 (item 004) answered wrong once → Back to s18 (null) sent completed 004 {success:false,
     scaled:0}; the right answer after it was then swallowed by the ledger. */
  {
    const b = await H.boot('01', { lib: true });
    b.finishBoot();
    const q19 = JSON.parse(b.val('JSON.stringify(QUESTIONS.find(function(q){return q.screen===19;}))'));
    b.exec('goTo(18); goTo(19);' + H.enterJs(19, H.answerFor(q19, 'wrong', 0)) + H.clickCheck(19));
    const mark = b.stmts().length;
    b.exec('goTo(18)');
    ok('b2', 'Back s19 → s18 (no item) sends no completed', !b.stmts().slice(mark).some(s => s.verb === 'completed'), b.stmts().slice(mark).map(s => s.verb + ':' + short(s)).join(','));
    eq('b2', 'and leaves item 004 out of the ledger', b.val('alreadySent("doneItems", itemLedgerKey("004"))'), false);
    b.exec('goTo(19);' + H.enterJs(19, H.answerFor(q19, 'right')) + H.clickCheck(19));
    endClick(b);
    const c004 = b.stmts().filter(s => s.verb === 'completed' && short(s) === 'methodica-ar-math-ratio-04-01-004');
    eq('b2', 'item 004 completed exactly once', c004.length, 1);
    ok('b2', 'with the final result (success, scaled 1)', c004[0] && c004[0].result && c004[0].result.success === true && c004[0].result.score.scaled === 1, JSON.stringify(c004[0] && c004[0].result));
    ok('b2', 'no console errors', !b.errors.length, b.errors.slice(0, 3).join(' | '));
  }

  /* ── resume of the hand-built screens (component 01) ── */
  {
    const b = await H.boot('01', { lib: true });
    b.finishBoot();
    b.exec(`selectOption(document.querySelector('#s0 .option-card[data-value="character-white"]'));` +
      `goTo(1); s1Answer(document.querySelector('#s1 .scq-opt[data-opt="yes"]'));` +
      `goTo(4); s4Answer(document.querySelector('#s4 .scq-opt[data-opt="no"]'));` +
      'goTo(6); s6Pick(0, "diff"); s6Pick(3, "same"); goTo(7); s7Toggle("a");' +
      `goTo(10); guidedAnswer(10, document.querySelector('#g10 .gc-opt[data-idx="1"]')); goTo(6); flushResumeSave();`);
    const n0 = b.stmts().length;
    const r = await b.reload();
    r.finishBoot();
    eq('resume', '01: lands on s6', r.val('currentScreen'), 6);
    eq('resume', '01: s6 row picks restored', r.val('JSON.stringify(s6Picks())'), JSON.stringify(['diff', null, null, 'same']));
    r.exec('goTo(1)');
    eq('resume', '01: s1 painted with the saved pick', r.val('(document.querySelector("#s1 .scq-opt.selected")||{}).dataset.opt'), 'yes');
    r.exec('goTo(4)');
    ok('resume', '01: s4 painted answered, feedback shown', r.val('!!document.querySelector("#s4 .scq-opt[disabled]") && document.getElementById("s4-fb").classList.contains("is-correct")'));
    r.exec('goTo(7)');
    eq('resume', '01: s7 panel gate restored (one of two opened)', r.val('JSON.stringify(s7Opened)'), JSON.stringify({ a: true, b: false }));
    r.exec('goTo(10)');
    ok('resume', '01: guided step 10 painted answered', r.val('guidedState[10].done && !document.getElementById("g10-check").disabled'));
    eq('resume', '01: character restored', r.val('window.lomdaState.selectedCharacter'), 'character-white');
    ok('resume', '01: nothing re-reported', !r.stmts().slice(n0).some(s => /^answered|^completed/.test(s.verb)));
  }

  /* ── resume after the end (component 05) ── */
  {
    const b = await H.boot('05', { lib: true });
    b.finishBoot();
    walk(b); endClick(b);
    const n0 = b.stmts().length;
    const r = await b.reload();
    r.finishBoot();
    ok('resume', '05 after the end: the last button stays disabled', r.val('lastScreenButton().disabled'));
    endClick(r);
    ok('resume', '05 after the end: no second completed', !r.stmts().slice(n0).some(s => s.verb === 'completed'));
  }

  /* ── keyboard ── */
  {
    const b = await H.boot('01', { lib: true });
    b.finishBoot();
    const key = k => b.exec('document.dispatchEvent(new KeyboardEvent("keydown", { key: "' + k + '" }))');
    key('ArrowLeft');
    eq('keyboard', 's0: no character chosen → ArrowLeft stays', b.val('currentScreen'), 0);
    b.exec('selectOption(document.querySelector(\'#s0 .option-card[data-value="character-orange"]\'))');
    key('ArrowLeft');
    eq('keyboard', 's0: chosen → ArrowLeft moves', b.val('currentScreen'), 1);
    key('ArrowLeft');
    eq('keyboard', 's1 unanswered → stays', b.val('currentScreen'), 1);
    b.exec('goTo(19)'); key('ArrowLeft');
    eq('keyboard', 'quiz screen unanswered → stays', b.val('currentScreen'), 19);
    const d = await H.boot('01', { lib: true, search: '?dev=1' });
    d.finishBoot();
    d.exec('document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))');
    eq('keyboard', 'DEV_NAV: free navigation', d.val('currentScreen'), 1);
  }

  /* ── character: chosen in 01, in 01's document, adopted by 03 ── */
  {
    const b = await H.boot('01', { lib: true });
    b.finishBoot();
    b.exec('selectOption(document.querySelector(\'#s0 .option-card[data-value="character-white"]\'))');
    eq('character', '01 document carries the choice', b.state() && JSON.stringify(b.state()).indexOf('character-white') !== -1, true);
    const c3 = await H.boot('03', { lib: true, keepState: true, storage: { session: {}, local: b.localDump() } });
    c3.finishBoot();
    eq('character', '03 adopts the choice from the mirror', c3.val('window.lomdaState.selectedCharacter'), 'character-white');
  }

  /* ── 03: the stop after the two basic exercises (MOE monday 05-06.10.26, head of team) ──
     s29 promises "2 תרגילים … ענו נכון על שניהם כדי להתקדם": exercise 1 = item 001 (s30-32),
     exercise 2 = item 002 (s33-34). Under both right, leaving s34 forward ENDS the component there. */
  {
    const answer = (b, okScreens) => {
      for (let n = 30; n <= 34; n++) {
        b.exec('goTo(' + n + ')');
        const q = JSON.parse(b.val('JSON.stringify(QUESTIONS.find(function(q){return q.screen===' + n + ';}))'));
        if (okScreens.has(n)) b.exec(H.enterJs(n, H.answerFor(q, 'right')) + H.clickCheck(n));
        else for (let k = 0; k < q.maxAttempts; k++) b.exec(H.enterJs(n, H.answerFor(q, 'wrong', k)) + H.clickCheck(n));
      }
    };
    const comp = b => b.stmts().filter(s => s.verb === 'completed' && s.objectType === 'onlinelesson');
    const cases = [
      ['both right', new Set([30, 31, 32, 33, 34]), false],
      ['exercise 1 wrong (s31)', new Set([30, 32, 33, 34]), true],
      ['exercise 2 wrong (s34)', new Set([30, 31, 32, 33]), true],
      ['both wrong', new Set([]), true],
    ];
    for (const [tag, okSet, stops] of cases) {
      const b = await H.boot('03', { lib: true });
      b.finishBoot();
      b.exec('window.__hops = 0; goToNextPart = function () { window.__hops++; }; goToPrevPart = function () { window.__hops++; };');
      answer(b, okSet);
      b.exec(H.clickCheck(34));
      if (!stops) {
        eq('stop', '03 ' + tag + ': on to s35 (the harder exercises)', b.val('currentScreen'), 35);
        eq('stop', '03 ' + tag + ': nothing completed yet', comp(b).length, 0);
        continue;
      }
      eq('stop', '03 ' + tag + ': stays on s34', b.val('currentScreen'), 34);
      const c = comp(b);
      ok('stop', '03 ' + tag + ': the component is completed, success false', c.length === 1 && c[0].result && c[0].result.success === false, JSON.stringify(c.map(x => x.result)));
      ok('stop', '03 ' + tag + ': the s34 button is ended', b.val('document.getElementById("q34-check").disabled') === true && b.val('document.getElementById("q34-check").getAttribute("aria-disabled")') === 'true');
      eq('stop', '03 ' + tag + ': verdict recorded as fail', b.val('getUnitResult(partResultKey())'), 'fail');
      eq('stop', '03 ' + tag + ': no hop to a neighbour', b.val('window.__hops'), 0);
      b.exec(H.clickCheck(34) + 'goTo(35); document.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }));');
      ok('stop', '03 ' + tag + ': a second click, goTo(35) and ArrowLeft move nothing and send nothing', b.val('currentScreen') === 34 && comp(b).length === 1, 'screen=' + b.val('currentScreen') + ' completed=' + comp(b).length);
      if (tag !== 'both wrong') continue;
      b.exec('goTo(33); goTo(34);');
      ok('stop', '03: Back and forward again leaves the button ended', b.val('document.getElementById("q34-check").disabled') === true);
      b.exec('flushResumeSave();');
      const r = await b.reload();
      r.finishBoot();
      ok('stop', '03: after a reload on s34 the button is still ended, nothing re-sent',
        r.val('currentScreen') === 34 && r.val('document.getElementById("q34-check").disabled') === true && comp(r).length === 1,
        'screen=' + r.val('currentScreen') + ' disabled=' + r.val('document.getElementById("q34-check").disabled') + ' completed=' + comp(r).length);
      ok('stop', '03: no console errors', !b.errors.length && !r.errors.length, b.errors.concat(r.errors).slice(0, 3).join(' | '));
    }
    /* answered wrong, reloaded BEFORE the click: the button is live, and the click still stops */
    {
      const b = await H.boot('03', { lib: true });
      b.finishBoot();
      answer(b, new Set([30, 31, 32]));
      b.exec('flushResumeSave();');
      const r = await b.reload();
      r.finishBoot();
      ok('stop', '03: reloaded before the click, the s34 button is live', r.val('currentScreen') === 34 && r.val('document.getElementById("q34-check").disabled') === false,
        'screen=' + r.val('currentScreen') + ' disabled=' + r.val('document.getElementById("q34-check").disabled'));
      r.exec(H.clickCheck(34));
      ok('stop', '03: that click still stops and reports', r.val('currentScreen') === 34 && comp(r).length === 1 && comp(r)[0].result.success === false);
    }
    /* fails open: no results recorded for the stop items -> no stop */
    {
      const b = await H.boot('03', { lib: true });
      b.finishBoot();
      b.exec('goTo(34); quizState[34].done = true; goTo(35);');
      ok('stop', '03: with the basic results missing the stop fails open (on to s35)', b.val('currentScreen') === 35 && comp(b).length === 0);
    }
  }

  /* ── 01: YouTube played / paused (MOE monday 05.10.26; layer ported from percent-08) ── */
  {
    const P = `window.__ytPlayers.filter(function(p){ return p.el.closest('.screen').getAttribute('data-screen') === '3'; })[0]`;
    const b = await H.boot('01', { lib: true });
    b.finishBoot();
    b.exec(H.FAKE_YT(false));
    eq('yt', '01: both YouTube iframes got a player', b.val('window.__ytPlayers.length'), 2);
    ok('yt', '01: attached to the existing iframes (no videoId / playerVars)', b.val('window.__ytPlayers.every(function(p){ return p.el.tagName === "IFRAME" && !p.cfg.videoId && !p.cfg.playerVars; })') === true);
    ok('yt', '01: the Arabic titles survive the API renaming them', b.val('Array.prototype.every.call(document.querySelectorAll("iframe[data-yt-item]"), function(f){ return /[\\u0621-\\u064A]/.test(f.getAttribute("title")); })') === true);
    b.exec('goTo(3)');
    let n = b.stmts().length;
    b.exec(`${P}.t = 12; ${P}.fire(1); ${P}.fire(3); ${P}.fire(1); ${P}.fire(2); ${P}.fire(2); ${P}.fire(1); ${P}.fire(0); ${P}.fire(2); ${P}.fire(1);`);
    const v = b.stmts().slice(n).filter(s => s.verb === 'played' || s.verb === 'paused');
    eq('yt', '01: start, seek, pause, duplicate pause, resume, ended, pause-after-end, replay → played,paused,played,played', v.map(s => s.verb), ['played', 'paused', 'played', 'played']);
    ok('yt', '01: objectId is item 002', v.length && v.every(s => /-04-01-002\/?$/.test((s.opts && s.opts.objectId) || '')), v.map(s => s.opts && s.opts.objectId).join(','));
    ok('yt', '01: the time is carried', v.length && v.every(s => s.opts && s.opts.time === 12), JSON.stringify(v.map(s => s.opts)));
    n = b.stmts().length;
    b.exec('goTo(4)');
    const leave = b.stmts().slice(n).filter(s => s.verb === 'played' || s.verb === 'paused');
    ok('yt', '01: leaving s3 mid-play closes it with a paused and stops the player', leave.length === 1 && leave[0].verb === 'paused' && b.val(`${P}.stopped`) >= 1, leave.map(s => s.verb).join(','));
    ok('yt', '01: the wired iframe is not blanked', b.val(`${P}.el.getAttribute('src')`) !== 'about:blank');
    ok('yt', '01: no console errors', !b.errors.length, b.errors.slice(0, 3).join(' | '));
    /* B-4: leaving before the players are ready must not park them for good */
    const d = await H.boot('01', { lib: true });
    d.finishBoot();
    d.exec(H.FAKE_YT(true) + 'goTo(3); goTo(4);');
    ok('yt', '01 B-4: leaving s3 before its player is ready does not park it on about:blank', d.val(`${P}.el.getAttribute('src')`) !== 'about:blank', d.val(`${P}.el.getAttribute('src')`));
    d.exec('window.__ytMakeReady(); goTo(3);');
    n = d.stmts().length;
    d.exec(`${P}.fire(1);`);
    ok('yt', '01 B-4: that player still reports played', d.stmts().slice(n).some(s => s.verb === 'played'));
    /* reporting off: the layer is silent */
    const o = await H.boot('01', { lib: false, search: '' });
    o.exec(H.FAKE_YT(false) + 'goTo(3);' + `${P}.fire(1); ${P}.fire(2);`);
    ok('yt', '01: with reporting off nothing is fetched or thrown', !o.w.__fetches.length && !o.errors.length, o.errors.slice(0, 2).join(' | '));
  }

  R.done();
})().catch(e => { console.error(e); process.exitCode = 1; });
