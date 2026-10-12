#!/usr/bin/env node
/* =====================================================================
   methodica-math-ratio-04 — asset contract (guide §15.2 / §15.4 step 6)

   Static, no dependencies:   node _test/verify-assets.js
   Exit code 1 on any failure.

   1. every src/href in every component's index.html resolves, CASE-EXACT
      (fs.existsSync is case-insensitive on Windows; the CDN is not)
   2. every CSS url() resolves from the STYLESHEET's own folder
   3. every asset path written in unit-js resolves from the page that uses
      it: questions.js per question (its screen decides the component),
      everything else from every component
   4. ?v= on every code reference, one value across all components
   5. no hoisted file grew back inside a component
   6. the shared tail of index.html (report flag, overlays, script tags)
      is byte-identical across components
   ===================================================================== */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..');
const UNIT = 'methodica-math-ratio-04';
const PARTS = [1, 2, 3, 4, 5, 6, 7].map(n => `${UNIT}-0${n}`);

let fails = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { fails++; console.log('  FAIL ' + msg); } }
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const exists = p => fs.existsSync(path.join(ROOT, p));

/* case-exact: every segment must appear verbatim in its parent's listing */
function resolveExact(rel) {
  const segs = path.normalize(rel).split(path.sep).filter(Boolean);
  if (segs[0] === '..') return false;             // escaped the unit root
  let dir = ROOT;
  for (const s of segs) {
    let names;
    try { names = fs.readdirSync(dir); } catch (e) { return false; }
    if (!names.includes(s)) return false;
    dir = path.join(dir, s);
  }
  return true;
}
const local = u => !/^(https?:|data:|#|mailto:|javascript:|about:)/.test(u) && u.trim() !== '';
const strip = u => u.split('#')[0].split('?')[0];
const fromPart = (part, u) => path.posix.normalize(`${part}/${strip(u)}`);

/* 1 + 4 — index.html references */
console.log('index.html references');
const versions = new Set();
const tails = [];
for (const part of PARTS) {
  const html = read(`${part}/index.html`);
  for (const m of html.matchAll(/\b(?:src|href|poster)\s*=\s*"([^"]+)"/g)) {
    const u = m[1];
    if (!local(u) || u.includes('${')) continue;
    ok(resolveExact(fromPart(part, u)), `${part}/index.html → ${u}`);
    if (/\.(js|css)(\?|$)/.test(u)) {
      const v = (u.match(/[?&]v=([^&#]+)/) || [])[1];
      ok(!!v, `${part}/index.html: no ?v= on ${u}`);
      if (v) versions.add(v);
    }
  }
  const at = html.indexOf('<!-- Report/issue flag');
  tails.push(at >= 0 ? html.slice(at) : html.split('\n').slice(-99).join('\n'));
}
ok(versions.size === 1, `one ?v= across all components (found: ${[...versions].join(', ')})`);
ok(tails.every(t => t === tails[0]), 'shared index.html tail is identical in all components');

/* 2 — CSS url() from the stylesheet's own folder */
console.log('CSS url()');
const cssFiles = [];
(function walk(d) {
  for (const n of fs.readdirSync(path.join(ROOT, d))) {
    if (n === '.git' || n === 'node_modules' || n === '_test') continue;
    const p = d ? `${d}/${n}` : n;
    if (fs.statSync(path.join(ROOT, p)).isDirectory()) walk(p);
    else if (n.endsWith('.css')) cssFiles.push(p);
  }
})('');
for (const css of cssFiles) {
  const src = read(css);
  for (const m of src.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)) {
    if (!local(m[2])) continue;
    ok(resolveExact(path.posix.normalize(`${path.posix.dirname(css)}/${strip(m[2])}`)), `${css} → ${m[2]}`);
  }
}

/* 3 — asset paths written in JS */
console.log('unit-js asset paths');
const ASSET_RE = /(?:\.\.\/)?(?:unit-assets|assets|media)\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|gif|svg|mp4|webm|woff2?|css)/g;
const partOfScreen = {};
for (const part of PARTS) {
  const sb = { window: {}, XAPI_ID_PREFIX: '' };
  vm.runInNewContext(read(`${part}/script.js`).replace(/^\s*const\s/gm, 'var '), sb);
  const P = sb.window.PART_CONFIG;
  for (let n = P.start; n <= P.end; n++) partOfScreen[n] = part;
}
const qsb = {};
vm.runInNewContext(read('unit-js/questions.js').replace(/^const QUESTIONS/m, 'var QUESTIONS'), qsb);
for (const q of qsb.QUESTIONS) {
  const part = partOfScreen[q.screen];
  ok(!!part, `question screen ${q.screen} belongs to a component`);
  for (const u of JSON.stringify(q).match(ASSET_RE) || []) {
    ok(resolveExact(fromPart(part, u)), `questions.js screen ${q.screen} (${part}) → ${u}`);
  }
}
for (const f of fs.readdirSync(path.join(ROOT, 'unit-js')).filter(n => n.endsWith('.js') && n !== 'questions.js')) {
  const src = read(`unit-js/${f}`).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  for (const u of src.match(ASSET_RE) || []) {
    /* a shared path must work from every component; a part-local one from at
       least one (the screen that builds it only exists in one component) */
    const hits = PARTS.filter(p => resolveExact(fromPart(p, u)));
    if (u.startsWith('../unit-assets/')) ok(hits.length === PARTS.length, `unit-js/${f} → ${u} (from every component)`);
    else ok(hits.length > 0, `unit-js/${f} → ${u} (from its component)`);
  }
}

/* 5 — nothing hoisted grew back */
console.log('no stale copies');
for (const part of PARTS) {
  ok(!exists(`${part}/styles.css`), `${part}/styles.css must not exist (shared: unit-css/styles.css)`);
  ok(!exists(`${part}/assets/fonts`), `${part}/assets/fonts must not exist (shared: unit-assets/fonts)`);
  for (const d of ['media', 'assets/img']) {
    if (!exists(`${part}/${d}`)) continue;
    for (const n of fs.readdirSync(path.join(ROOT, part, d))) {
      ok(!/^char(acter)?-/.test(n), `${part}/${d}/${n}: character assets live in unit-assets/`);
    }
  }
}

console.log(`\n${checks - fails}/${checks} checks passed` + (fails ? ` — ${fails} FAILED` : ''));
process.exit(fails ? 1 : 0);
