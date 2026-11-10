#!/usr/bin/env node
/* ═══════════════════ verify-report.js — methodica-ar-math-ratio-04 contracts ═══════════════════
   NOT DEPLOYED. The static and DOM-level contracts of the reporting / issue-report / resume
   layer, for all seven components (ADDING-REPORTING-AND-RESUME.md §6.2, §6.7, §8, §10.2):

     layer    script order, one ?v= everywhere, 90-boot last, the library-letter gate, no
              top-level name in two files, script.js is data only, the character key pair
     ids      component / unit ids byte-for-byte against metadata/
     map      SCREEN_TO_SUBCONTENT = exactly the component's screens = the catalogue items
     qmap     XAPI_SCREEN_QUESTIONS covers every declared question exactly once, on a screen
              that asks one; XAPI_EVAL_ITEMS = the items that have questions
     gate     XAPI_GATE agrees with the number printed on the component's gate screen
     order    goTo(): repaint -> item scope -> save; quizCheck(): report before marking, flush last
     painter  every question screen repaints without throwing, clean and answered, idempotently
     report   the issue form carries unit / component / item / page on every screen
     markup   boot cover in every index.html
     write-guard  2026-11-03 hardening: no write before the restore, the drain persists as read, a
              failed read closes every write (BOOT-AND-RESUME-HARDENING-2026-11-03.md §2.6 a-l)
     boot     per component: the net raises the flag on ?registration, the library is preloaded,
              images off the landing screen are lazy (§2.6 m-p, §2.10 q)
     leave    the leave save goes through xapi-720-l.js's saveState720OnLeave (§2.10 r-u)

     NODE_PATH=C:/lomda-test/node_modules node _test/verify-report.js
   ═══════════════════════════════════════════════════════════════════════════════════════ */
'use strict';
const H = require('./harness');
const { fs, path, BASE, UNIT, PARTS, PART_DIR, readMeta } = H;
const R = H.makeReporter('verify-report');
const { ok, eq } = R;

const read = p => fs.readFileSync(path.join(BASE, p), 'utf8');
const html = c => read(PART_DIR(c) + '/index.html');
/* Arabic writes two as a dual word ("سؤالين", "تمرينان"); a gate or stop number not in this map is NaN. */
const AR_NUM = w => ({ 'سؤالين': 2, 'سؤالان': 2, 'تمرينين': 2, 'تمرينان': 2 })[w] ?? (/^\d+$/.test(w) ? +w : NaN);
const scriptsOf = c => [...html(c).matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);
const trimId = u => String(u || '').replace(/\/+$/, '');
const last = u => trimId(u).split('/').pop();

(async function main() {
  /* ── layer ── */
  const ORDER = ['../unit-js/10-identity.js', '../unit-js/20-xapi.js', '../unit-js/40-resume.js', '../unit-js/50-loader.js',
    'script.js', '../unit-js/motion.js', '../unit-js/quiz-engine.js', '../unit-js/questions.js', '../unit-js/unit.js',
    '../unit-js/report-modal.js', '../unit-js/engine.js', '../unit-js/70-platform.js', '../unit-js/90-boot.js'];
  const versions = new Set();
  for (const c of PARTS) {
    const s = scriptsOf(c);
    eq('layer', c + ' script order', s.map(x => x.split('?')[0]), ORDER);
    s.forEach(x => versions.add((x.match(/[?&]v=([^&]+)/) || [])[1]));
    ok('markup', c + ' has the boot cover and its inline safety net',
      /<div id="boot-cover"/.test(html(c)) && /__resumeInFlight/.test(html(c)));
    ok('markup', c + ' boot cover sits before #stage', html(c).indexOf('id="boot-cover"') < html(c).indexOf('id="stage"'));
  }
  ok('layer', 'one ?v= on every script in every component', versions.size === 1 && !versions.has(undefined), [...versions].join(', '));

  const loader = read('unit-js/50-loader.js');
  ok('layer', "-l is the resume library and the XAPI_USING_G regex knows it (2026-11-10, §2.10)",
    /RESUME_ENABLED \? 'xapi-720-l\.js'/.test(loader) && /xapi-720-\[[a-z]*l[a-z]*\]\\\.js/.test(loader));

  const shared = fs.readdirSync(path.join(BASE, 'unit-js')).filter(f => f.endsWith('.js')).map(f => 'unit-js/' + f);
  for (const c of PARTS) {
    const decl = {};
    for (const f of shared.concat(PART_DIR(c) + '/script.js')) {
      for (const m of read(f).matchAll(/^(?:var|let|const|function)\s+([A-Za-z_$][\w$]*)/gm)) (decl[m[1]] = decl[m[1]] || []).push(f);
    }
    const dup = Object.keys(decl).filter(k => decl[k].length > 1);
    ok('layer', c + ' no top-level name declared in two files', !dup.length, dup.map(k => k + ' in ' + decl[k].join(' + ')).join('; '));
    const src = read(PART_DIR(c) + '/script.js').replace(/\/\*[\s\S]*?\*\//g, '');
    ok('layer', c + ' script.js is configuration only (no function, no const)', !/\bfunction\b|^\s*const\s/m.test(src));
  }
  const ui = read('unit-js/40-resume.js').match(/var UI_CHARACTER_KEY = '([^']+)'/)[1];
  const ck = read('unit-js/unit.js').match(/const CHARACTER_STORAGE_KEY = '([^']+)'/)[1];
  eq('layer', 'UI_CHARACTER_KEY (40-resume) = CHARACTER_STORAGE_KEY (unit.js)', ui, ck);
  ok('layer', 'the character key is namespaced to this unit', ck === UNIT.replace(/-/g, '_') + '_selectedCharacter', ck);

  /* ── order (source-level) ── */
  const eng = read('unit-js/engine.js');
  const iR = eng.indexOf('repaintScreen(n)'), iX = eng.indexOf('xapiOnScreen(n)'), iS = eng.indexOf('scheduleResumeSave()', iX);
  ok('order', 'goTo(): repaintScreen → xapiOnScreen → scheduleResumeSave, after resetScreenState',
    eng.indexOf('resetScreenState(n);') < iR && iR < iX && iX < iS);
  ok('order', 'goTo(): leaving the component goes through partExit', /partExit\(\+1\)/.test(eng) && /partExit\(-1\)/.test(eng));
  const qe = read('unit-js/quiz-engine.js');
  const qc = qe.slice(qe.indexOf('function quizCheck('), qe.indexOf('function quizMarkRetry('));
  ok('order', 'quizCheck(): onQuizAnswered before any marking', qc.indexOf('onQuizAnswered') < qc.indexOf('quizMarkOutcome'));
  ok('order', 'quizCheck(): onQuizCommitted is the last thing it does', /onQuizCommitted\(screen\)[^]*?\n  }\n}\s*$/.test(qc));
  const qh = qe.slice(qe.indexOf('function quizOpenHint('), qe.indexOf('function quizCloseHint('));
  ok('order', 'quizOpenHint(): the hint is reported after the done-guard', qh.indexOf('if (st.done) return;') < qh.indexOf('onQuizHint'));
  const plat = read('unit-js/70-platform.js');
  const oca = plat.slice(plat.indexOf('function onCustomAnswered('), plat.indexOf('/* ═══', plat.indexOf('function onCustomAnswered(')));
  ok('order', 'onCustomAnswered(): flushes after reporting', oca.lastIndexOf('flushResumeSave()') > oca.indexOf('xapiAnswered('));
  ok('order', 'the verdict is recorded only through setUnitResult', !/localStorage\.setItem\([^)]*_result/.test(plat));

  /* ── per component: ids, map, qmap, gate, painters, issue form ── */
  const unitMeta = JSON.parse(read('metadata/' + UNIT + '_unit.json').replace(/^\uFEFF/, ''));
  for (const c of PARTS) {
    const meta = readMeta(c);
    const b = await H.boot(c, { lib: true });
    b.finishBoot();
    const v = b.val;
    const tag = c;

    /* ids */
    eq('ids', c + ' XAPI_COMP_ID = metadata id', v('XAPI_COMP_ID'), meta.id);
    eq('ids', c + ' XAPI_UNIT_ID = the unit record id', v('window.XAPI_UNIT_ID'), unitMeta.id);
    eq('ids', c + ' learningUnitId = the unit record id', meta.learningUnitId, unitMeta.id);
    eq('ids', c + ' XAPI_METADATA_FILE names this component', v('XAPI_METADATA_FILE'), '../metadata/' + PART_DIR(c) + '.json');
    ok('ids', c + ' component id is XAPI_ID_PREFIX + slug + /', meta.id === v('XAPI_ID_PREFIX') + PART_DIR(c) + '/');
    meta.subContent.forEach(sc => {
      const suf = last(sc.id).slice(-3);
      eq('ids', c + ' item ' + suf + ' id = xapiItemId()', v('xapiItemId(' + JSON.stringify(suf) + ')'), sc.id);
      (sc.questions || []).forEach(q => {
        const qk = last(q.questionId);
        eq('ids', c + ' ' + suf + '/' + qk + ' question id = xapiQ()', v('xapiQ(' + JSON.stringify(suf) + ',' + JSON.stringify(qk) + ').questionId'), q.questionId);
      });
    });

    /* map */
    const P = JSON.parse(v('JSON.stringify(window.PART_CONFIG)'));
    const map = JSON.parse(v('JSON.stringify(SCREEN_TO_SUBCONTENT)'));
    const domScreens = JSON.parse(v('JSON.stringify([...document.querySelectorAll(".screen[data-screen]")].map(function(s){return +s.dataset.screen;}).sort(function(a,b){return a-b;}))'));
    const range = []; for (let n = P.start; n <= P.end; n++) range.push(n);
    eq('map', c + ' the component builds exactly its screen range', domScreens, range);
    eq('map', c + ' SCREEN_TO_SUBCONTENT keys = the component screens', Object.keys(map).map(Number).sort((a, b) => a - b), range);
    const mapped = [...new Set(Object.values(map).filter(Boolean).map(x => x[0]))].sort();
    const catalog = meta.subContent.map(sc => last(sc.id).slice(-3)).sort();
    eq('map', c + ' mapped items = catalogue items (both directions)', mapped, catalog);
    ok('map', c + ' every value is null or [3-digit string, page]', Object.values(map).every(x => x === null ||
      (Array.isArray(x) && /^\d{3}$/.test(x[0]) && typeof x[1] === 'number')));

    /* qmap */
    const qmap = JSON.parse(v('JSON.stringify(XAPI_SCREEN_QUESTIONS)'));
    const declared = [], asked = [];
    meta.subContent.forEach(sc => (sc.questions || []).forEach(q => declared.push(last(sc.id).slice(-3) + '/' + last(q.questionId))));
    const customQ = [1, 4, 6, 10, 11, 14, 15];
    Object.keys(qmap).forEach(n => {
      const it = map[n] && map[n][0];
      ok('qmap', c + ' screen ' + n + ' answers questions of a mapped item', !!it);
      qmap[n].forEach(k => asked.push(it + '/' + k));
      const isQuiz = v('!!QUESTIONS.find(function(q){return q.screen===' + n + ';})');
      ok('qmap', c + ' screen ' + n + ' actually asks a question (quiz engine or hand-built)', isQuiz || customQ.includes(+n));
      if (isQuiz && v('QUESTIONS.find(function(q){return q.screen===' + n + ';}).type') === 'statement') {
        eq('qmap', c + ' statement screen ' + n + ' maps one key per row', qmap[n].length, v('QUESTIONS.find(function(q){return q.screen===' + n + ';}).statements.length'));
      }
    });
    eq('qmap', c + ' every declared question is asked exactly once', asked.slice().sort(), declared.slice().sort());
    const quizInPart = JSON.parse(v('JSON.stringify(QUESTIONS.filter(function(q){return inPart(q.screen);}).map(function(q){return q.screen;}))'));
    ok('qmap', c + ' every quiz screen of the component reports', quizInPart.every(n => qmap[n]), quizInPart.filter(n => !qmap[n]).join(','));
    const withQs = meta.subContent.filter(sc => (sc.questions || []).length).map(sc => last(sc.id).slice(-3)).sort();
    eq('qmap', c + ' XAPI_EVAL_ITEMS = the items that have questions', Object.keys(JSON.parse(v('JSON.stringify(XAPI_EVAL_ITEMS)'))).sort(), withQs);

    /* gate: the number on the gate screen is the number in code */
    const gate = JSON.parse(v('JSON.stringify(XAPI_GATE)'));
    /* Arabic screens: 06/07 "يحتوي السؤال على 5 بنود. عليكم الإجابة عن 4 منها على الأقل",
       02 "3 أسئلة" + "عن سؤالين على الأقل" (a dual, written as a word: AR_NUM). */
    const gateText = html(c).match(/على (\d+) بنود[^<]*?عن (\d+) منها على الأقل|عن (\S+) على الأقل/);
    if (gate) {
      ok('gate', c + ' the gate screen states a threshold', !!gateText);
      const need = gateText && (gateText[2] ? +gateText[2] : AR_NUM(gateText[3]));
      eq('gate', c + ' XAPI_GATE.need = the number on screen', gate.need, need);
      const t = JSON.parse(v('JSON.stringify(_gateTally())'));
      const totalOnScreen = +(html(c).match(/(\d+) (?:أسئلة|بنود)/) || [])[1];
      eq('gate', c + ' the gated set has as many members as the screen promises', t.total, totalOnScreen);
    } else {
      ok('gate', c + ' no threshold on screen, none in code', !/على الأقل/.test(html(c)));
    }

    /* painter sweep */
    for (const n of range) {
      const r = v('(function(){ goTo(' + n + '); restoreScreenUI(' + n + '); restoreScreenUI(' + n + '); return "ok"; })()');
      ok('painter', c + ' screen ' + n + ' repaints clean without throwing', r === 'ok', r);
    }
    for (const n of quizInPart) {
      const q = JSON.parse(v('JSON.stringify(QUESTIONS.find(function(q){return q.screen===' + n + ';}))'));
      b.exec('goTo(' + n + ');' + H.enterJs(n, H.answerFor(q, 'right')) + H.clickCheck(n));
      const once = v('(function(){ repaintScreen(' + n + '); return document.getElementById("q' + n + '").innerHTML; })()');
      const twice = v('(function(){ repaintScreen(' + n + '); return document.getElementById("q' + n + '").innerHTML; })()');
      ok('painter', c + ' screen ' + n + ' answered: repaint is idempotent', once === twice);
      ok('painter', c + ' screen ' + n + ' answered: the finished look is painted', v('document.getElementById("q' + n + '-feedbox").classList.contains("is-correct")'));
    }

    /* issue form on every screen */
    for (const n of range) {
      b.exec('window.__fetches = []; goTo(' + n + ');' +
        'var __f = document.querySelector(".screen.active .flag-btn") || document.querySelector(".flag-btn"); __f.click();');
      ok('report', c + ' screen ' + n + ' the flag opens the form', v('!document.getElementById("report-modal").hasAttribute("hidden")'));
      b.exec('document.getElementById("report-type").selectedIndex = 1;' +
        'document.getElementById("report-text").value = "x"; submitReport(); forceCloseReportModal();');
      const f = b.w.__fetches[0];
      const body = f && f.init.body ? Object.fromEntries(f.init.body.entries()) : {};
      const m = map[n];
      ok('report', c + ' screen ' + n + ' posts unit / component', body['entry.1933069481'] === UNIT && body['entry.2070680092'] === PART_DIR(c), JSON.stringify(body));
      eq('report', c + ' screen ' + n + ' item', body['entry.1555704258'], m ? PART_DIR(c) + '-' + m[0] : '');
      eq('report', c + ' screen ' + n + ' page', body['entry.1671046914'], m ? String(m[1]) : String(n));
    }
    ok('boot', c + ' no console errors while booting and sweeping', !b.errors.length, b.errors.slice(0, 3).join(' | '));
  }

  /* ── 03: the stop agrees with the screen; 01: the YouTube embeds (MOE monday 05-06.10.26) ── */
  {
    const b = await H.boot('03');
    const stop = JSON.parse(b.val('JSON.stringify(typeof XAPI_STOP !== "undefined" ? XAPI_STOP : null)'));
    const intro = html('03').match(/<h1 class="ts-title">((\d+) تمارين|تمرينان)<\/h1>/);
    const introN = intro && (intro[2] ? +intro[2] : AR_NUM(intro[1]));
    ok('stop', '03 declares a stop', !!stop);
    ok('stop', '03 the stop covers as many exercises as s29 promises', !!(stop && intro && stop.items.length === introN), JSON.stringify(stop) + ' / ' + introN);
    ok('stop', '03 "أجيبوا بشكل صحيح السؤالين" = need is every one of them', !!(stop && /أجيبوا بشكل صحيح السؤالين/.test(html('03')) && stop.need === stop.items.length));
    const lastOfItem = stop ? JSON.parse(b.val('JSON.stringify(Object.keys(SCREEN_TO_SUBCONTENT).map(Number).filter(function(n){ return SCREEN_TO_SUBCONTENT[n] && SCREEN_TO_SUBCONTENT[n][0] === ' + JSON.stringify(stop.items[stop.items.length - 1]) + '; }))')).pop() : null;
    eq('stop', '03 the stop screen is the last screen of the last stop item', stop && stop.at, lastOfItem);
    for (const c of PARTS.filter(c => c !== '03')) {
      const x = await H.boot(c);
      eq('stop', c + ' declares no stop', x.val('typeof XAPI_STOP === "undefined" || XAPI_STOP === null'), true);
    }
    const yt = [...html('01').matchAll(/<iframe src="([^"]+)"\s+data-yt-item="(\d+)"/g)];
    eq('yt', '01 both YouTube iframes are tagged for reporting (item 002)', yt.map(m => m[2]), ['002', '002']);
    ok('yt', '01 markup: nocookie + enablejsapi=1, no origin / forigin / widget_referrer baked in',
      yt.length === 2 && yt.every(m => /^https:\/\/www\.youtube-nocookie\.com\/embed\/[\w-]+\?enablejsapi=1/.test(m[1]) && !/origin=|forigin|widget_referrer/.test(m[1])), yt.map(m => m[1]).join(' '));
    const y = await H.boot('01', { search: '?slxapi=1&registration=DEADBEEF-QA&canary=CANARY123' });
    const srcs = JSON.parse(y.val('JSON.stringify(Array.prototype.map.call(document.querySelectorAll("iframe[data-yt-item]"), function(f){ return f.dataset.src || f.getAttribute("src"); }))'));
    ok('yt', '01 at runtime over http the embeds carry origin=<page origin>, once', srcs.length === 2 && srcs.every(u => (u.match(/[?&]origin=/g) || []).length === 1 && u.indexOf('origin=' + encodeURIComponent('http://localhost:8777')) !== -1), srcs.join(' '));
    ok('yt', '01 and never the launch query (token / registration / canary)', srcs.every(u => !/DEADBEEF|CANARY123|slxapi|registration|forigin/.test(u)), srcs.join(' '));
    ok('yt', '01 the origin is added over http(s) only (file:// has origin "null")', /function ytApplyOrigin\(\)\s*\{\s*if \(!\/\^https\?:\$\/\.test\(window\.location\.protocol\)\) return;/.test(read('unit-js/70-platform.js')));
  }

  /* ── 05, the challenge: real score, success only at >= 60% (MOE 2026-10-08) ──
     Over the 4 questions metadata declares (001 q1+q2, 002 q1+q2); unanswered counts as wrong.
     None, 2 of 2 answered and 2/4 fail; 3/4 and 4/4 pass, each with the real score. Every other
     component declares no XAPI_PART_PASS. */
  {
    const b = await H.boot('05', { lib: true });
    const run = (pairs) => JSON.parse(b.val('(function(){ Object.keys(XAPI_Q_RESULTS).forEach(function (k) { delete XAPI_Q_RESULTS[k]; });' +
      ' Object.assign(XAPI_Q_RESULTS, ' + JSON.stringify(pairs) + '); var r = partResult(); return JSON.stringify([r.success, r.score.scaled]); })()'));
    eq('challenge', '05 XAPI_PART_PASS is 0.6', b.val('XAPI_PART_PASS'), 0.6);
    eq('challenge', '05 success only at >= 60% of 4, unanswered = wrong',
      [{}, { '001/q1': true, '001/q2': true },
       { '001/q1': true, '001/q2': true, '002/q1': false, '002/q2': false },
       { '001/q1': true, '001/q2': true, '002/q1': true },
       { '001/q1': true, '001/q2': true, '002/q1': true, '002/q2': true }].map(run),
      [[false, 0], [false, 0.5], [false, 0.5], [true, 0.75], [true, 1]]);
    for (const c of PARTS.filter(c => c !== '05')) {
      const x = await H.boot(c);
      eq('challenge', c + ' declares no XAPI_PART_PASS', x.val('typeof XAPI_PART_PASS'), 'undefined');
    }
  }

  /* ── 03: the score contract (MOE QA runbook §4 "ציון ומעבר"; 08.11 sheet fixes 1, 2, 6) ──
     s29 promises 2 exercises, both right to move on (K = N = 2): items 001 (q1-q3) and 002 (q1, q2), each right
     only when all its parts are. success and score.scaled come from that one count — the count the s34 stop
     reads; the two harder exercises (003, 004) never enter. Every count 0..2 with the harder set all wrong /
     all right, and each basic exercise with one part wrong. */
  {
    const b = await H.boot('03', { lib: true });
    b.finishBoot();
    const T = [['001/q1', '001/q2', '001/q3'], ['002/q1', '002/q2']], C = ['003/q1', '003/q2', '004/q1', '004/q2'];
    const run = (pairs) => JSON.parse(b.val('(function(){ Object.keys(XAPI_Q_RESULTS).forEach(function (k) { delete XAPI_Q_RESULTS[k]; });' +
      ' Object.assign(XAPI_Q_RESULTS, ' + JSON.stringify(pairs) + '); var r = partResult(); return JSON.stringify([r.success, r.score.scaled]); })()'));
    const seed = (k, chal) => Object.fromEntries(T.flatMap((q, i) => q.map(x => [x, i < k])).concat(C.map(x => [x, chal])));
    for (let k = 0; k <= 2; k++) for (const chal of [false, true]) {
      const tag = '03 ' + k + '/2' + (chal ? ' + harder all right' : ' + harder all wrong');
      const [succ, scaled] = run(seed(k, chal));
      eq('score', tag + ': success = correct ≥ 2', succ, k >= 2);
      eq('score', tag + ': scaled = correct / 2 (harder set not counted)', scaled, k / 2);
      eq('score', tag + ': success ⇔ scaled ≥ K/N', succ, scaled >= 1);
    }
    for (const [tag, wrong] of [['001 with q2 wrong', '001/q2'], ['002 with q2 wrong', '002/q2']]) {
      const pairs = seed(2, true); pairs[wrong] = false;
      eq('score', '03 ' + tag + ' counts 0: 1 of 2, success false', run(pairs), [false, 0.5]);
    }
    run({});
  }

  /* ── write-guard (BOOT-AND-RESUME-HARDENING-2026-11-03.md §2.6 a-l, 2026-11-10) ──
     Nothing is written before the restore; the drain persists the document AS READ; a failed read
     (anything but a 404) closes every write. Part 01 with a seeded v6 document saved on screen 2.
     Run against the previous package (LOMDA_BASE=<pkg>) these fail: that is the proof they see it. */
  {
    const SLUG = PART_DIR('01');
    const SEED = { v: 6, component: SLUG, payload: { currentScreen: 2 }, done: {}, doneItems: {}, hints: {}, picks: {},
      ui: { character: 'character-white' }, results: {} };
    const seeded = async () => {
      const b = await H.boot('01', { lib: true });
      b.exec('__setState(' + JSON.stringify(SEED) + ');');
      return b;
    };
    const store = b => b.state() || {};
    const pay = b => (store(b).payload || {}).currentScreen;
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    {
      const b = await seeded();
      b.exec("readUnitState(); setUnitCharacter('character-orange'); goTo(1);");
      eq('write-guard', 'a: a pick + goTo before _resumeReady leave the stored payload on screen 2', pay(b), 2);
      eq('write-guard', 'a: the pick is queued', b.val('_pendingProfile && _pendingProfile.character'), 'character-orange');
      b.exec('window.__held = null; window.saveState720Debounced = function (id, doc) { window.__held = doc; };' +
        '_resumeReady = true; drainPendingUnitState();');
      eq('write-guard', 'b: the drain keeps the stored payload on screen 2', pay(b), 2);
      eq('write-guard', 'b: ... and stores the picked character', (store(b).ui || {}).character, 'character-orange');
      eq('write-guard', 'b: ... under this component', store(b).component, SLUG);
      b.exec('applyExecutionState(_unitState.payload);');
      eq('write-guard', 'c: the restore lands on screen 2', b.val('currentScreen'), 2);
      eq('write-guard', 'd: the document the debounced write holds still says screen 2', b.val('window.__held && window.__held.payload && window.__held.payload.currentScreen'), 2);
      b.w.close();
    }
    {
      const b = await seeded();
      b.exec("readUnitState(); goTo(1); markSent('doneItems', 'x');");
      eq('write-guard', 'e: a ledger mark before _resumeReady writes nothing', pay(b), 2);
      eq('write-guard', 'e: ... but is kept in memory', b.val('_unitState.doneItems.x'), true);
      b.exec('_resumeReady = true; flushResumeSave();');
      eq('write-guard', 'f: the next save carries the mark', (store(b).doneItems || {}).x, true);
      b.w.close();
    }
    {
      const b = await seeded();
      b.exec("window.__realLoad = loadState720; window.loadState720 = function () { return null; };" +
        "window.stateLastResult720 = function () { return { op: 'load', status: 500, ok: false }; }; readUnitState();");
      eq('write-guard', 'g: a 500 read is a failed read', b.val('_resumeReadFailed'), true);
      eq('write-guard', 'g: ... with no payload in memory', b.val('_unitState.payload'), null);
      b.exec("_resumeReady = true; window.__p = persistUnitState(_unitState); flushResumeSave(); markSent('done', 'y'); goTo(1); scheduleResumeSave();");
      await sleep(900);
      eq('write-guard', 'h: persistUnitState refuses', b.val('window.__p'), false);
      const real = JSON.parse(b.val('JSON.stringify(window.__realLoad(RESUME_STATE_ID))')) || {};
      eq('write-guard', 'h: the stored payload is still screen 2', (real.payload || {}).currentScreen, 2);
      ok('write-guard', 'h: nothing of the session reached the store', !(real.done || {}).y);
      b.exec("window.loadState720 = window.__realLoad; window.stateLastResult720 = function () { return { op: 'load', status: 200, ok: true }; }; readUnitState();");
      eq('write-guard', 'i: a later good read reopens', b.val('_resumeReadFailed'), false);
      eq('write-guard', 'i: ... with the saved payload', b.val('_unitState.payload && _unitState.payload.currentScreen'), 2);
      b.exec("window.loadState720 = function () { return null; }; window.stateLastResult720 = function () { return { op: 'load', status: 404, ok: true, reason: 'absent' }; }; readUnitState();");
      eq('write-guard', 'j: a 404 is a fresh document, not a failure', b.val('_resumeReadFailed'), false);
      eq('write-guard', 'j: ... with no payload', b.val('_unitState.payload'), null);
      b.w.close();
    }
    const res = read('unit-js/40-resume.js');
    const fnBody = (src, name) => { const m = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}').exec(src); return m ? m[0] : ''; };
    const drain = fnBody(res, 'drainPendingUnitState').replace(/\/\*[\s\S]*?\*\//g, '');
    ok('write-guard', 'k: the drain never captures, it persists the document as read', !/captureUnitState\(/.test(drain) && /persistUnitState\(_unitState\)/.test(drain));
    ok('write-guard', 'k: markSent persists only after _resumeReady', /if \(!_resumeReady\) return;\s*try \{ persistUnitState/.test(fnBody(res, 'markSent')));
    ok('write-guard', 'k: persistUnitState opens with the failed-read refusal', /^function persistUnitState\(doc\) \{\s*var ok = false;\s*(\/\*[\s\S]*?\*\/\s*)?if \(_resumeReadFailed\)/.test(fnBody(res, 'persistUnitState')));
    for (const f of ['scheduleResumeSave', 'flushResumeSave', 'flushResumeSaveLeaving'])
      ok('write-guard', 'k: ' + f + ' bails on a failed read', /if \(!RESUME_ENABLED \|\| !_resumeReady \|\| _restoring \|\| _resumeReadFailed\) return;/.test(fnBody(res, f)));
    const ld = read('unit-js/50-loader.js');
    ok('write-guard', 'l: phase B retries a failed read', /if \(_resumeReadFailed\) \{\s*_saved = readUnitState\(\);/.test(ld));
    ok('write-guard', 'l: a throwing restore keeps a failed read closed', /_resumeReady = !_resumeReadFailed;/.test(ld));
    ok('write-guard', 'l: phase A keeps the cover on a failed read', /if \(!_payload && !_resumeReadFailed\) dropBootCover\(\);/.test(ld));
    ok('write-guard', 'l: the restore stays inside the !_resumeReadFailed wrapper and keeps _devHarness', /if \(!_resumeReadFailed\) \{[\s\S]*if \(_payload && !_devHarness\)[\s\S]*\}\s*\/\* if \(!_resumeReadFailed\) \*\//.test(ld));
    ok('write-guard', 'l: a screen reached during the boot window is saved after phase B',
      /if \(!_resumed\) \{ try \{ xapiOnScreen\(currentScreen\); \} catch \(e\) \{\} \}[\s\S]{0,700}if \(!_resumed && currentScreen !== PART_FIRST\) \{ try \{ scheduleResumeSave\(\); \}/.test(ld));
  }

  /* ── boot window, per component (§2.6 m-p, §2.10 q) ── */
  {
    const { JSDOM } = require('jsdom');
    const letter = (/RESUME_ENABLED \? 'xapi-720-([a-z])\.js'/.exec(read('unit-js/50-loader.js')) || [])[1];
    eq('boot', 'q: the loader asks for -l', letter, 'l');
    ok('boot', 'q: the XAPI_USING_G regex knows -l', /xapi-720-\[[a-z]*l[a-z]*\]\\\.js/.test(read('unit-js/50-loader.js')));
    const CDN = 'https://lomdot.education.gov.il/metodica/720active/common/';
    for (const c of PARTS) {
      const src = html(c);
      const doc = new JSDOM(src).window.document;
      const nets = [...doc.querySelectorAll('script:not([src])')].filter(s => /boot-cover/.test(s.textContent));
      eq('boot', 'm: ' + c + ' exactly one inline net', nets.length, 1);
      const net = nets[0] ? nets[0].textContent : '';
      ok('boot', 'm: ' + c + ' the net raises the flag on a registration', /registration=/.test(net) && /__resumeInFlight = true/.test(net));
      ok('boot', 'm: ' + c + ' the net keeps 800 ms and the 11000 ceiling', /__resumeInFlight/.test(net) && /\b800\b/.test(net) && /\b11000\b/.test(net));
      for (const [q, want] of [['?slxapi=1&registration=abc', true], ['', false]]) {
        const d = new JSDOM(src, { url: 'http://localhost:8777/' + UNIT + '/' + PART_DIR(c) + '/index.html' + q, runScripts: 'dangerously' });
        eq('boot', 'n: ' + c + ' __resumeInFlight ' + (want ? 'raised with' : 'not raised without') + ' a registration', d.window.__resumeInFlight === true, want);
        d.window.close();
      }
      const pre = [...doc.querySelectorAll('head link[rel=preload][as=script]')].map(l => l.getAttribute('href'));
      eq('boot', 'o: ' + c + ' preloads the wrapper and the loader\'s library, byte-equal', pre, [CDN + 'xapiwrapper.min.js', CDN + 'xapi-720-' + letter + '.js']);
      ok('boot', 'o: ' + c + ' no crossorigin on the preloads', ![...doc.querySelectorAll('head link[rel=preload]')].some(l => l.hasAttribute('crossorigin')));
      ok('boot', 'o: ' + c + ' preconnects to Kata', !!doc.querySelector('head link[rel=preconnect][href="https://kata.cet.ac.il"]'));
      const land = doc.querySelector('.screen.active');
      const imgs = [...doc.querySelectorAll('img[src]')].filter(i => /^assets\//.test(i.getAttribute('src')) || /^\.\.\/unit-assets\/img\/.*\.png$/.test(i.getAttribute('src')));
      const bad = imgs.filter(i => !!(land && land.contains(i)) === (i.getAttribute('loading') === 'lazy'));
      ok('boot', 'p: ' + c + ' images off the landing screen are lazy, on it eager', !bad.length, bad.map(i => i.getAttribute('src')).join(', '));
      const vids = [...doc.querySelectorAll('video[autoplay][src]')].filter(v => !(land && land.contains(v)));
      ok('boot', 'p: ' + c + ' no hidden autoplay video carries an inline src', !vids.length, vids.map(v => v.getAttribute('src')).join(', '));
    }
  }

  /* ── leave save via xapi-720-l.js (§2.10 r-u) ── */
  {
    ok('leave', 'r: both stubs exist', fs.existsSync(path.join(__dirname, 'xapi-720-k.js')) && fs.existsSync(path.join(__dirname, 'xapi-720-l.js')));
    const res = read('unit-js/40-resume.js');
    ok('leave', 's: flushResumeSaveOnLeave goes through flushResumeSaveLeaving',
      /function flushResumeSaveOnLeave\(\) \{\s*if \(_leavingToNextPart\) return;\s*flushResumeSaveLeaving\(\);\s*\}/.test(res));
    ok('leave', 's: flushResumeSaveLeaving prefers saveState720OnLeave, typeof-guarded',
      /typeof window\.saveState720OnLeave === 'function'\) \? window\.saveState720OnLeave : window\.saveState720/.test(res));
    for (const lib of ['xapi-720-l.js', 'xapi-720-k.js']) {
      const b = await H.boot('01', { lib: true, libFile: lib });
      b.finishBoot();
      b.exec('goTo(3);');
      b.w.dispatchEvent(new b.w.Event('pagehide'));
      const lw = JSON.parse(b.val('JSON.stringify(window.__leaveWrites ? window.__leaveWrites() : null)'));
      if (lib === 'xapi-720-l.js') {
        ok('leave', 't: on -l the pagehide save goes through saveState720OnLeave with screen 3', !!lw && lw.length > 0 && lw[lw.length - 1].cs === 3, JSON.stringify(lw));
      } else {
        ok('leave', 't: on -k there is no saveState720OnLeave and nothing throws', lw === null && b.val('typeof window.saveState720OnLeave') === 'undefined' && !b.errors.length, b.errors.join(' | '));
      }
      eq('leave', 't: ' + lib + ' the stored document is at screen 3', ((b.state() || {}).payload || {}).currentScreen, 3);
      b.w.close();
    }
    {
      const b = await H.boot('01', { lib: true, libFile: 'xapi-720-l.js' });
      b.exec('__setState(' + JSON.stringify({ v: 6, component: PART_DIR('01'), payload: { currentScreen: 2 }, done: {}, doneItems: {}, hints: {}, picks: {}, ui: { character: null }, results: {} }) + ');');
      b.exec("window.__realLoad = loadState720; window.loadState720 = function () { return null; }; window.stateLastResult720 = function () { return { op: 'load', status: 503, ok: false }; };" +
        'readUnitState(); _resumeReady = true; goTo(4); flushResumeSaveOnLeave();');
      eq('leave', 'u: after a failed read the leave save writes nothing', JSON.parse(b.val('JSON.stringify(__leaveWrites())')).length, 0);
      eq('leave', 'u: ... and the stored document is untouched (screen 2)', b.val('window.__realLoad(RESUME_STATE_ID).payload.currentScreen'), 2);
      b.w.close();
    }
  }

  R.done();
})().catch(e => { console.error(e); process.exitCode = 1; });
