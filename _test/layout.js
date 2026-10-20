/* Layout, real Chrome: the 1280x710 canvas stays centred and inside the window at every size.
 *
 * KNOWN-ISSUES.md §1 (found 2026-10-07; MOE tester on proportion-02 14.10.26: "ברזולוציה 100 לא ניתן
 * לצפות בכל היחידה"). With auto grid tracks, #stage's cell grew to #app's full size whenever the window
 * was smaller, so #app started at the window's edge and scale() (origin: centre) could not pull it
 * back: the canvas slid off-screen with the bottom-bar buttons. Same bug and fix as ratio-06 2d46837,
 * proportion-01 f135521, proportion-02 9a49d1e.
 *
 * For every component at eight window sizes: #app is centred (±1px) and lies inside the window, and
 * the first screen has a visible button wholly inside the window. At the two school-laptop sizes,
 * every screen's visible buttons are inside the window, and so is every zoom (image, figure or
 * applet: opened, its close button reachable, closed again).
 *
 * Real Chrome via puppeteer-core, kept outside OneDrive like jsdom (README "Running"):
 *   NODE_PATH=C:/Users/Vadim/AppData/Local/Temp/lomda-test/node_modules node _test/layout.js [repoRoot]
 */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const UNIT = path.basename(ROOT);
const CHROME = process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const SIZES = [[1024, 640], [1366, 640], [1280, 600], [800, 600], [1280, 710], [1366, 768], [1920, 1080], [768, 1024]];
const WALK = [[1024, 640], [1366, 640]];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.webp': 'image/webp', '.gif': 'image/gif' };

/* ROOT mounted under /<unit>/ — a subpath, as on the CDN (README "In a browser"). */
function serve() {
  const server = http.createServer((q, r) => {
    const u = decodeURIComponent(q.url.split('?')[0]);
    if (!u.startsWith('/' + UNIT + '/')) { r.writeHead(404); return r.end(); }
    const f = path.join(ROOT, u.slice(UNIT.length + 2));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || !fs.statSync(f).isFile()) { r.writeHead(404); return r.end(); }
    r.writeHead(200, { 'Content-Type': TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(r);
  });
  return new Promise((res) => server.listen(0, '127.0.0.1', () => res({
    base: `http://127.0.0.1:${server.address().port}/${UNIT}/`,
    close: () => new Promise((c) => server.close(c)),
  })));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let pass = 0; const fail = [];
const ok = (name, cond, detail) => { if (cond) pass++; else fail.push(name + (detail ? ' -> ' + detail : '')); };

const measure = (page) => page.evaluate(() => {
  const r = document.getElementById('app').getBoundingClientRect();
  const btns = [...document.querySelectorAll('.screen.active button')]
    .filter((b) => b.offsetParent && /\S/.test(b.innerText))
    .map((b) => { const q = b.getBoundingClientRect(); return { t: b.innerText.trim(), l: q.left, top: q.top, r: q.right, b: q.bottom }; });
  return { vw: innerWidth, vh: innerHeight, l: r.left, t: r.top, r: r.right, b: r.bottom, btns };
});
const inside = (b, m) => b.l >= -1 && b.top >= -1 && b.r <= m.vw + 1 && b.b <= m.vh + 1;
const box = (b) => [b.l, b.top, b.r, b.b].map(Math.round).join(',');

/* Every zoom on the active screen — the magnifier on images and [data-zoom] figures/tables
   (quiz-engine.js, #img-zoom-overlay inside #app) and, should one be added, an applet's in-place
   zoom (.applet-embed.is-zoomed): open it, check that the zoomed view and its close button lie
   wholly inside the window, close it again. Returns how many were opened and the ones outside. */
const zoomOff = (page) => page.evaluate(() => {
  const vw = innerWidth, vh = innerHeight, out = [];
  let seen = 0;
  const inWin = (q) => q.left >= -1 && q.top >= -1 && q.right <= vw + 1 && q.bottom <= vh + 1;
  const rect = (q) => [q.left, q.top, q.right, q.bottom].map(Math.round).join(',');
  const check = (name, view, close) => {
    const f = view.getBoundingClientRect(), c = close && close.getBoundingClientRect();
    if (!f.width) out.push(name + ' did not open');
    else if (!inWin(f)) out.push(name + ' view ' + rect(f));
    else if (!c || !c.width || !inWin(c)) out.push(name + ' close ' + (c ? rect(c) : 'missing'));
  };
  document.querySelectorAll('.screen.active .img-zoom-btn').forEach((btn, i) => {
    if (!btn.offsetParent) return;
    seen++; btn.click();
    const ov = document.getElementById('img-zoom-overlay');
    if (!ov || getComputedStyle(ov).display === 'none') { out.push('image zoom ' + i + ' did not open'); return; }
    check('image zoom ' + i, ov, ov.querySelector('.applet-close-btn'));
    quizImageZoomClose();
  });
  document.querySelectorAll('.screen.active .applet-embed').forEach((em, i) => {
    const open = em.querySelector('[data-applet-toggle="open"]');
    if (!open || !open.offsetParent) return;
    seen++; open.click();
    check('applet zoom ' + i, em.classList.contains('is-zoomed') ? em : document.createElement('i'),
      em.querySelector('[data-applet-toggle="close"]'));
    em.classList.remove('is-zoomed');
  });
  return { seen, out };
});

(async () => {
  const puppeteer = require('puppeteer-core');
  const srv = await serve();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const comps = fs.readdirSync(ROOT).filter((d) => new RegExp('^' + UNIT + '-\\d\\d$').test(d)).sort();
  let zooms = 0;
  try {
    for (const comp of comps) {
      const page = await browser.newPage();
      const errs = [];
      page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
      await page.setViewport({ width: 1280, height: 710 });
      await page.goto(srv.base + comp + '/index.html', { waitUntil: 'networkidle0' });
      await sleep(1200);
      for (const [w, h] of SIZES) {
        await page.setViewport({ width: w, height: h }); await sleep(250);
        const m = await measure(page);
        const tag = comp.slice(-2) + ' @' + w + 'x' + h;
        const cx = (m.l + m.r) / 2, cy = (m.t + m.b) / 2;
        ok(tag + ' canvas centred', Math.abs(cx - m.vw / 2) <= 1 && Math.abs(cy - m.vh / 2) <= 1,
          cx.toFixed(1) + ',' + cy.toFixed(1) + ' vs ' + m.vw / 2 + ',' + m.vh / 2);
        ok(tag + ' canvas inside the window', inside({ l: m.l, top: m.t, r: m.r, b: m.b }, m), box({ l: m.l, top: m.t, r: m.r, b: m.b }));
        ok(tag + ' first screen has a button', m.btns.length > 0);
        m.btns.forEach((b) => ok(tag + ' "' + b.t + '" reachable', inside(b, m), box(b)));
      }
      const { start, end } = await page.evaluate(() => ({ start: PART_CONFIG.start, end: PART_CONFIG.end }));
      for (const [w, h] of WALK) {
        await page.setViewport({ width: w, height: h }); await sleep(250);
        const off = [], zoff = [];
        for (let n = start; n <= end; n++) {
          await page.evaluate((n) => goTo(n), n); await sleep(200);
          const m = await measure(page);
          m.btns.filter((b) => !inside(b, m)).forEach((b) => off.push('s' + n + ' "' + b.t + '" ' + box(b)));
          const z = await zoomOff(page);
          if (w === WALK[0][0]) zooms += z.seen;
          z.out.forEach((o) => zoff.push('s' + n + ' ' + o));
        }
        const tag = comp.slice(-2) + ' @' + w + 'x' + h;
        ok(tag + ' every screen\'s buttons reachable', !off.length, off.slice(0, 3).join(' | '));
        ok(tag + ' every zoom inside the window', !zoff.length, zoff.slice(0, 3).join(' | '));
      }
      ok(comp.slice(-2) + ' no page error', !errs.length, errs.slice(0, 2).join(' | '));
      await page.close();
    }
  } finally { await browser.close(); await srv.close(); }
  ok('the walk opened at least one zoom', zooms > 0, 'none found');
  console.log(`[layout] pass ${pass} fail ${fail.length} (${comps.length} components, ${zooms} zooms opened at 1024x640)`);
  fail.forEach((f) => console.log('  FAIL ' + f));
  process.exitCode = fail.length ? 1 : 0;
})().catch((e) => { console.error(e); process.exitCode = 2; });
