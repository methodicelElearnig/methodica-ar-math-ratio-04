/* ═══════════════════ shared jsdom harness — methodica-ar-math-ratio-04 ═══════════════════
   NOT DEPLOYED. Dev tooling only. Required by verify-report.js, statement-flow.js and
   retry-gate.js.

   boot(part, opts) loads the part's REAL index.html and executes every local <script src> in
   document order from disk — the vendored 720-core, the platform layer, the part config and
   90-boot.js — exactly as the browser does. jsdom does not fetch the CDN, so bootXAPI()'s two
   loadScript() calls stay inert; a scenario that needs reporting executes _test/xapi-720-k.js
   (the stub the browser gets through ?xapiLib= on localhost) and replays the loader's
   post-metadata sequence with finishBoot(). Everything under test is the real code.

   Copied from methodica-math-ratio-06 _test/harness.js (pattern from ratio-01 35648a6);
   retargeted to seven components, answers derived from QUESTIONS instead of a fixed table.
   jsdom lives OUTSIDE the OneDrive tree (ADDING-REPORTING-AND-RESUME.md §10.1):
     NODE_PATH=/tmp/lomda-test/node_modules node _test/<file>.js */

'use strict';

const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const BASE = process.env.LOMDA_BASE || path.join(__dirname, '..');
const UNIT = 'methodica-ar-math-ratio-04';
const PARTS = ['01', '02', '03', '04', '05', '06', '07'];
const PART_DIR = c => UNIT + '-' + c;
const readMeta = c => JSON.parse(fs.readFileSync(path.join(BASE, 'metadata', PART_DIR(c) + '.json'), 'utf8').replace(/^﻿/, ''));

function makeReporter(name) {
  const failures = [];
  let passes = 0;
  const ok = (tag, what, cond, detail) => {
    if (cond) { passes++; return; }
    failures.push('[' + tag + '] ' + what + (detail ? '  —  ' + detail : ''));
  };
  const eq = (tag, what, actual, expected) => {
    const a = JSON.stringify(actual), e = JSON.stringify(expected);
    ok(tag, what, a === e, 'got ' + a + ', expected ' + e);
  };
  const done = () => {
    console.log('\n' + name + ': ' + passes + ' passed, ' + failures.length + ' failed');
    failures.forEach(f => console.log('  ✗ ' + f));
    process.exitCode = failures.length ? 1 : 0;
    return failures.length;
  };
  return { ok, eq, done, failures };
}

/* opts.search      query string (default: '?slxapi=1&registration=r1' when opts.lib, '' otherwise)
   opts.hash        '#screen=N'
   opts.lib         execute the stub library after the page scripts (+ XAPI_USING_G)
   opts.keepState   do not __reset() the stub's sessionStorage (simulated reload)
   opts.storage     { session: {...}, local: {...} } seeded before any script runs
   opts.meta        inject window.METADATA from metadata/<part>.json (default true) */
async function boot(c, opts) {
  opts = opts || {};
  const dir = path.join(BASE, PART_DIR(c));
  const search = opts.search !== undefined ? opts.search : (opts.lib ? '?slxapi=1&registration=r1' : '');
  const errors = [], warns = [], logs = [];
  const dom = new JSDOM(fs.readFileSync(path.join(dir, 'index.html'), 'utf8'), {
    url: 'http://localhost:8777/' + UNIT + '/' + PART_DIR(c) + '/index.html' + search + (opts.hash || ''),
    runScripts: 'dangerously',   // inline markup scripts (the boot-cover net) run as in a browser; src scripts are NOT fetched
    pretendToBeVisual: true,
    beforeParse(w) {
      if (opts.storage && opts.storage.session) for (const k in opts.storage.session) w.sessionStorage.setItem(k, opts.storage.session[k]);
      if (opts.storage && opts.storage.local) for (const k in opts.storage.local) w.localStorage.setItem(k, opts.storage.local[k]);
    }
  });
  const w = dom.window;
  w.console.error = (...a) => errors.push(a.map(String).join(' '));
  w.console.warn = (...a) => warns.push(a.map(String).join(' '));
  w.console.log = (...a) => logs.push(a.map(String).join(' '));
  w.__fetches = [];
  w.fetch = (url, init) => { w.__fetches.push({ url: String(url), init: init || {} }); return Promise.resolve({ ok: true, json: () => Promise.resolve({}) }); };
  w.HTMLMediaElement.prototype.load = function () {};
  w.HTMLMediaElement.prototype.play = function () { return Promise.resolve(); };
  w.HTMLMediaElement.prototype.pause = function () {};
  w.scrollTo = () => {};

  /* A classic <script> element per file, so top-level let/const land in the ONE global lexical
     scope all page scripts share — exactly the cross-file visibility the unit relies on (an
     eval would scope them to itself). A load-time throw is reported through window.onerror. */
  w.addEventListener('error', (ev) => errors.push('[script error] ' + (ev.message || (ev.error && ev.error.message))));
  const exec = (code, label) => {
    const el = w.document.createElement('script');
    el.textContent = code + '\n//# sourceURL=' + (label || 'exec');
    w.document.head.appendChild(el);
    el.remove();
  };
  const val = (expr) => {
    exec('window.__v = (function(){ try { return (' + expr + '); } catch (e) { return "__throw:" + e.message; } })();', 'val');
    return w.__v;
  };

  const srcs = [...w.document.querySelectorAll('script[src]')].map(s => s.getAttribute('src'));
  for (const src of srcs) {
    if (/^[a-z]+:\/\//i.test(src) || src.startsWith('//')) continue;
    const p = path.resolve(dir, src.split('?')[0]);
    if (fs.existsSync(p)) exec(fs.readFileSync(p, 'utf8'), src);
    else errors.push('[missing script] ' + src);
  }
  /* 90-boot.js (like the 720-core) runs at DOMContentLoaded: wait for jsdom's real one — never
     dispatch a synthetic event, or the boot would run twice. */
  if (w.document.readyState === 'loading') await new Promise(r => w.document.addEventListener('DOMContentLoaded', r));

  if (opts.lib) {
    /* from THIS folder, not BASE: a deployment package (verify-report.js <pkg>) correctly has no _test/ */
    exec(fs.readFileSync(path.join(__dirname, 'xapi-720-k.js'), 'utf8'), 'stub');
    exec('window.XAPI_USING_G = true;');
    if (!opts.keepState) exec('window.__reset();');
  }
  if (opts.meta !== false) {
    exec('window.METADATA = ' + JSON.stringify(readMeta(c)) + ';');
  }

  const stmts = () => JSON.parse(val('JSON.stringify(window.__stmts ? window.__stmts() : [])'));
  const verbs = () => stmts().map(s => s.verb);
  const state = () => JSON.parse(val('JSON.stringify(window.__state ? window.__state() : null)'));
  const sessionDump = () => { const o = {}; for (let i = 0; i < w.sessionStorage.length; i++) { const k = w.sessionStorage.key(i); o[k] = w.sessionStorage.getItem(k); } return o; };
  const localDump = () => { const o = {}; for (let i = 0; i < w.localStorage.length; i++) { const k = w.localStorage.key(i); o[k] = w.localStorage.getItem(k); } return o; };

  /* Replay what 50-loader.js does after the metadata poll resolves (phase A read + phase B). */
  const finishBoot = (screenOverride) => {
    exec('var __doc = readUnitState(); adoptUnitCharacter(__doc); _resumeReady = true; if (!_unitState) _unitState = emptyUnitState(); drainPendingUnitState();' +
      'window.__resumed = false; if (__doc.payload) { applyExecutionState(__doc.payload, ' +
      (screenOverride === undefined ? 'undefined' : screenOverride) + '); window.__resumed = true; }' +
      "try { sendStatement720('initialized', 'onlinelesson'); } catch (e) {}" +
      'if (!window.__resumed) xapiOnScreen(currentScreen);', 'finishBoot');
  };

  /* A reload: a new page for the same part over the same sessionStorage (stub state + log). */
  const reload = async (o) => {
    const b = await boot(c, Object.assign({}, opts, o || {}, { keepState: true, storage: { session: sessionDump(), local: localDump() } }));
    return b;
  };

  const flushTimers = () => { /* debounced writes: run any pending 800 ms timer now */
    exec('if (window.__flushDebounce) window.__flushDebounce();');
  };

  return { dom, w, exec, val, stmts, verbs, state, finishBoot, reload, errors, warns, logs, flushTimers, sessionDump, localDump };
}

/* Answers per quiz screen, derived from the page's own QUESTIONS (w = a booted window):
   right(q), and two DISTINCT wrong answers wrong(q, 0) / wrong(q, 1) — distinct so the Retry
   gate lets the second one through. Returned as the shape enterJs takes. */
function answerFor(q, kind, k) {
  if (q.type === 'single') {
    if (kind === 'right') return { single: q.correct };
    const wr = q.options.filter(o => o.id !== q.correct);
    return { single: wr[k % wr.length].id };
  }
  if (q.type === 'value-input') {
    return { inputs: kind === 'right' ? q.correctInputs.slice() : q.correctInputs.map(() => String(900 + k)) };
  }
  if (q.type === 'statement') {
    /* wrong: every row flipped on k=0, only the first row flipped on k=1 */
    return { rows: q.statements.map((st, i) => String(kind === 'right' ? st.correct : ((k === 0 || i === 0) ? !st.correct : st.correct))) };
  }
  throw new Error('no answer builder for type ' + q.type);
}

/* JS source that enters an answer through the real handlers (no check click). */
function enterJs(n, ans) {
  if (ans.inputs) {
    return 'document.querySelectorAll("#q' + n + ' .vi-input").forEach(function(inp,k){ inp.value = ' + JSON.stringify(ans.inputs) + '[k]; }); quizInputChange(' + n + ');';
  }
  if (ans.rows) {
    return JSON.stringify(ans.rows) + '.forEach(function(v,i){ var r = document.querySelectorAll("#q' + n + ' .stmt-row")[i];' +
      ' quizStatementPick(' + n + ', i, r.querySelector(\'.stmt-pill[data-val="\' + v + \'"]\')); });';
  }
  return 'quizSelect(' + n + ', document.querySelector(\'#q' + n + ' .scq-opt[data-id="' + ans.single + '"]\'));';
}
const clickCheck = n => 'document.getElementById("q' + n + '-check").click();';

/* The YouTube IFrame API as a recording fake (percent-08 _test/harness.js). This harness does not
   fetch scripts, so a test exec()s it: it defines window.YT and fires onYouTubeIframeAPIReady, which
   is how ytWirePlayers() attaches. slow = method-less until window.__ytMakeReady() (QA B-4 race). */
const FAKE_YT = (slow) => `
  window.YT = { PlayerState: { UNSTARTED: -1, ENDED: 0, PLAYING: 1, PAUSED: 2, BUFFERING: 3, CUED: 5 } };
  window.__ytPlayers = [];
  window.YT.Player = function (el, cfg) {
    var self = this; this.el = el; this.cfg = cfg || {}; this.t = 0; this.stopped = 0;
    window.__ytPlayers.push(this);
    el.setAttribute('title', 'YouTube video player');
    this.fire = function (state) {
      if (self.cfg.events && self.cfg.events.onStateChange) self.cfg.events.onStateChange({ target: self, data: state });
    };
    this.__ready = function () {
      if (self.getCurrentTime) return;
      self.getCurrentTime = function () { return self.t; };
      self.stopVideo = function () { self.stopped++; };
      self.pauseVideo = function () { self.fire(2); };
      if (self.cfg.events && self.cfg.events.onReady) self.cfg.events.onReady({ target: self });
    };
    ${slow ? '' : 'self.__ready();'}
  };
  window.__ytMakeReady = function () { window.__ytPlayers.forEach(function (p) { p.__ready(); }); };
  if (typeof window.onYouTubeIframeAPIReady === 'function') window.onYouTubeIframeAPIReady();
`;

module.exports = { BASE, UNIT, PARTS, PART_DIR, readMeta, makeReporter, boot, answerFor, enterJs, clickCheck, FAKE_YT, fs, path };
