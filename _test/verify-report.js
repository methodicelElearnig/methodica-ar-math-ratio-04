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
     resp     MOE runbook 10.11.26: a correct round sends Kata's correctXapiResponsesPattern byte for
              byte (the KATA table; the class E proposals), the shipped metadata carries it, wrong
              answers keep the form, no invisible characters, the old builders are gone

     NODE_PATH=C:/lomda-test/node_modules node _test/verify-report.js

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


  /* ── resp: result.response = Kata's correctXapiResponsesPattern (MOE runbook 10.11.26) ──
     Kata compares result.response with the pattern character by character
     (QA/2026-11-10_moe-runbook-checks/REPORT.md; this unit: phase3/lane-D.md 04-01…04-07). KATA is
     the pattern list for every question, copied from Kata (read 10.11.26); a list with two entries
     accepts either (Kata's own alternatives, '3:2' / '3 : 2'). The three class E questions carry
     the performance pattern proposed in metadata/ and DEPLOY.md. Guided 01-003 is NOT here: Kata
     declares no question on it, and since the group-A fix (10.11) it reports nothing. */
  {
    const KATA = {
    '01-001/q1': ["false"],
    '01-002/q1': ["false"],
    '01-002/q2': ["تخبز مرام صانعة الحلويات 50 قطعة كعك في الساعة[.]نسبة بين كميات من أنواع مختلفة[,]سعر كيلو الموز 8 شيكل[.]نسبة بين كميات من أنواع مختلفة[,]تسير سيارة بسرعة 85 كم (كيلومتر) في الساعة[.]نسبة بين كميات من أنواع مختلفة[,]مقابل كل بلوزتين بيضاوين، توجد لدى ياسمين 3 بلوزات سوداء[.]نسبة بين كميات من نفس النوع"],
    '01-004/q1': ["في المتجر أ، بـ 10 أغورات"],
    '02-001/q1': ["2/3"],
    '02-001/q2': ["false"],
    '02-001/q3': ["سمر"],
    '02-002/q1': ["30"],
    '02-002/q2': ["250.2 شيكل"],
    '02-003/q1': ["3:2", "3 : 2"],
    '02-003/q2': ["8"],
    '02-003/q3': ["عصير البرتقال[.]9[,]عصير المانجو[.]6"],   // proposed (class E)
    '03-001/q1': ["أمتار في الدقيقة[.]90[,]أمتار في الثانية[.]1.5"],   // proposed (class E)
    '03-001/q2': ["3:5", "3 : 5"],
    '03-001/q3': ["4:5", "4 : 5"],
    '03-002/q1': ["300"],
    '03-002/q2': ["1.5"],
    '03-003/q1': ["السيارة أ"],
    '03-003/q2': ["السيارة ب"],
    '03-004/q1': ["المسطّح ب (25 مترًا في 25 مترًا)"],
    '03-004/q2': ["14"],
    '05-001/q1': ["12"],
    '05-001/q2': ["مستوى الماء سينخفض"],
    '05-002/q1': ["300 كم"],
    '05-002/q2': ["27.5 kWh"],
    '06-001/q1': ["3,600/1,800", "3600/1800"],
    '06-001/q2': ["2"],
    '06-001/q3': ["نعم"],
    '06-001/q4': ["نعم"],
    '06-001/q5': ["عدد الشقق بمساحة 90 مترًا مربعًا[.]5[,]عدد الشقق بمساحة 75 مترًا مربعًا[.]4"],   // proposed (class E)
    '07-001/q1': ["8:1", "8 : 1"],
    '07-001/q2': ["نسبة بين كميات من نفس النوع، لأن الكميتين هما أشخاص"],
    '07-001/q3': ["عدد بلا وحدات"],
    '07-001/q4': ["شيكل للساعة"],
    '07-001/q5': ["هذا عدد يمثّل تكلفة ساعة عمل واحدة للحافلة"],
    '07-001/q6': ["false"],
    '07-001/q7': ["true"],
    '07-001/q8': ["الإجابتان أ و-ب صحيحتان، وهما توضّحان الفرق بين النسبة بين كميات من نفس النوع والنسبة بين كميات من أنواع مختلفة"],
    };
    /* known, listed in DEPLOY.md; each one must still be what it is (a fix makes the check fail) */
    const KNOWN_GAPS = {

    /* class A, wording: the page's option text ≠ Kata's answer text (lane-D 04-07). Fix = the page
       or Kata takes the other's wording — a translator's / Vadim's decision (DEPLOY.md) */
    '07-001/q2': { why: 'page wording ≠ Kata', sends: 'نسبة بين كميات من نفس النوع، لأن الكميتين تمثلان أشخاصًا', warn: /001 q2/ },
    '07-001/q3': { why: 'page wording ≠ Kata', sends: 'عدد بدون وحدات', warn: /001 q3/ },
    };
    const qk = (qid) => { const p = trimId(qid).split('/'); return p[p.length - 2].slice(-6) + '/' + p[p.length - 1]; };
    const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2066-\u2069\u061C]/;
    const x = read('unit-js/20-xapi.js'), p = read('unit-js/70-platform.js');
    ['xapiZoneAnswer', 'xapiFieldsAnswer', 'xapiMultiAnswer'].forEach(f => ok('resp', '20-xapi.js: the old builder ' + f + ' is gone', !new RegExp('function ' + f + '\\b').test(x)));
    ok('resp', '70-platform.js: quizAnswerText (", " / ":" / " | " joins) is gone', !/function quizAnswerText\b/.test(p));
    ['xapiResponse', 'xapiChoiceResponse', 'xapiMatchingResponse', 'xapiPerformanceResponse', 'xapiNumericResponse', 'xapiTrueFalseResponse'].forEach(f => ok('resp', '20-xapi.js defines ' + f, new RegExp('function ' + f + '\\b').test(x)));
    ok('resp', 'the bidi strip covers LRM, RLM, ALM, ZWSP and the embeddings / isolates', /_XAPI_BIDI = \/\[\\u200B\\u200E\\u200F\\u202A-\\u202E\\u2066-\\u2069\\u061C\]\/g/.test(x));
    ['unit-js/unit.js', 'unit-js/quiz-engine.js', 'unit-js/questions.js', 'unit-js/engine.js'].concat(PARTS.map(c => PART_DIR(c) + '/script.js')).forEach(f => {
      ok('resp', f + ': no direct xapiAnswered / sendStatement720 answered', !/xapiAnswered\s*\(|sendStatement720\(\s*['"]answered/.test(read(f)));
    });
    const inMeta = {};
    PARTS.forEach(c => readMeta(c).subContent.forEach(it => (it.questions || []).forEach(q => { inMeta[qk(q.questionId)] = q; })));
    eq('resp', 'KATA lists exactly the metadata questions', Object.keys(KATA).sort(), Object.keys(inMeta).sort());
    Object.keys(KATA).forEach(k => {
      const q = inMeta[k];
      eq('resp', k + ': metadata correctXapiResponsesPattern = Kata', q && q.correctXapiResponsesPattern, KATA[k]);
      if (q && q.questionType === 'performance') {
        eq('resp', k + ': performance steps = the pattern', (q.correctAnswers || []).map(s => s.stepId + '[.]' + s.response).join('[,]'), KATA[k][0]);
        eq('resp', k + ': xapiInteractionComponents.steps = the step names', ((q.xapiInteractionComponents || {}).steps || []).map(s => s.id), (q.correctAnswers || []).map(s => s.stepId));
      }
    });

    /* a correct round per component, through the real handlers (statement-flow's walk) */
    const custom = {
      1: 's1Answer(document.querySelector(\'#s1 .scq-opt[data-opt="no"]\'))',
      4: 's4Answer(document.querySelector(\'#s4 .scq-opt[data-opt="no"]\'))',
      6: 'S6_ROWS.forEach(function(r,i){ s6Pick(i, r.correct); }); s6Check()',
      7: 's7Toggle("a"); s7Toggle("b")',
      10: 'guidedAnswer(10, document.querySelector(\'#g10 .gc-opt[data-idx="0"]\'))',
      11: 'guidedAnswer(11, document.querySelector(\'#g11 .gc-opt[data-idx="1"]\'))',
      14: 'guidedAnswer(14, document.querySelector(\'#g14 .gc-opt[data-idx="1"]\'))',
      15: 'guidedAnswer(15, document.querySelector(\'#g15 .gc-opt[data-idx="0"]\'))'
    };
    const responsesOf = (b, from) => {
      const out = {};
      b.stmts().slice(from || 0).filter(s => /^answered/.test(s.verb)).forEach(s => {
        const r = s.result.response != null ? s.result.response : ((s.result.extensions || {}).student_answer || []).join(', ');
        (out[qk(s.opts.questionId)] = out[qk(s.opts.questionId)] || []).push(String(r));
      });
      return out;
    };
    const seen = {};
    for (const c of PARTS) {
      const b = await H.boot(c, { lib: true });
      b.finishBoot();
      const P = JSON.parse(b.val('JSON.stringify(window.PART_CONFIG)'));
      for (let n = P.start; n <= P.end; n++) {
        b.exec('goTo(' + n + ')');
        const q = JSON.parse(b.val('JSON.stringify(QUESTIONS.find(function(q){return q.screen===' + n + ';}) || null)'));
        if (q) b.exec(H.enterJs(n, H.answerFor(q, 'right')) + H.clickCheck(n));
        else if (custom[n] && b.val('!!document.querySelector(\'.screen[data-screen="' + n + '"]\')')) b.exec(custom[n]);
      }
      const got = responsesOf(b);
      Object.keys(got).forEach(k => {
        if (!(k in KATA)) { ok('resp', c + ': ' + k + ' answered on an id Kata does not have', false, got[k].join(' | ')); return; }
        seen[k] = true;
        if (k in KNOWN_GAPS) { eq('resp', c + ': ' + k + ' known gap still as listed (' + KNOWN_GAPS[k].why + ')', got[k], [KNOWN_GAPS[k].sends]); return; }
        ok('resp', c + ': ' + k + ' correct answer → one of Kata\'s patterns', got[k].length === 1 && KATA[k].includes(got[k][0]), JSON.stringify(got[k]) + ' vs ' + JSON.stringify(KATA[k]));
      });
      if (c === '01') ok('resp', '01: the guided 01-003 picks (s10, s11, s14, s15) report nothing (group-A fix, 10.11)', !b.stmts().some(s => /^answered/.test(s.verb) && /-01-003\/q\d/.test((s.opts && s.opts.questionId) || '')));
      ok('resp', c + ': no response carries an invisible character', Object.keys(got).every(k => got[k].every(r => !INVISIBLE.test(r))), JSON.stringify(got));
      const gapWarn = w => (c === '07' && Object.keys(KNOWN_GAPS).some(k => KNOWN_GAPS[k].warn && k.startsWith(c + '-') && KNOWN_GAPS[k].warn.test(w)));
      ok('resp', c + ': no layer warning on a correct round outside the known gaps', !b.warns.some(w => /\[xAPI\] (response|performance)/.test(w) && !gapWarn(w)), b.warns.filter(w => /\[xAPI\]/.test(w)).join(' | '));
      ok('resp', c + ': no console.error', !b.errors.length, b.errors.slice(0, 3).join(' | '));
      b.w.close();
    }
    Object.keys(KATA).forEach(k => ok('resp', k + ': answered in a correct round', !!seen[k]));

    /* wrong answers keep the form; typed variants the engine accepts still match */
    {
      const b = await H.boot('03', { lib: true });
      b.finishBoot();
      let n0 = b.stmts().length;
      b.exec('goTo(30);' + H.enterJs(30, { inputs: ['91', '2'] }) + H.clickCheck(30));
      const r = responsesOf(b, n0)['03-001/q1'] || [];
      eq('resp', '03-001/q1 wrong values → the same steps, the learner\'s values', r, [KATA['03-001/q1'][0].replace('[.]90[,]', '[.]91[,]').replace(/\[\.\]1\.5$/, '[.]2')]);
      b.w.close();
      const d = await H.boot('06', { lib: true });
      d.finishBoot();
      d.exec('goTo(50);' + H.enterJs(50, { inputs: ['3600', '1800'] }) + H.clickCheck(50));
      ok('resp', '06-001/q1 typed "3600" / "1800" → one of Kata\'s patterns', KATA['06-001/q1'].includes((responsesOf(d)['06-001/q1'] || [])[0]), JSON.stringify(responsesOf(d)));
      d.w.close();
      const e = await H.boot('01', { lib: true });
      e.finishBoot();
      e.exec('goTo(6); S6_ROWS.forEach(function(r,i){ s6Pick(i, i === 3 ? "diff" : r.correct); }); s6Check()');
      const m = (responsesOf(e)['01-002/q2'] || [])[0] || '';
      const pairs = m.split('[,]');
      eq('resp', '01-002/q2 one wrong row → four pairs, the three right ones first in Kata\'s order', pairs.slice(0, 3), KATA['01-002/q2'][0].split('[,]').slice(0, 3));
      ok('resp', '01-002/q2 … and the wrong pair last, as placed', /\[\.\]/.test(pairs[3] || '') && pairs[3] !== KATA['01-002/q2'][0].split('[,]')[3], pairs[3]);
      e.w.close();
    }
  }

  R.done();
})().catch(e => { console.error(e); process.exitCode = 1; });
