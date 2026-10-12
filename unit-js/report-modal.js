/* =====================================================================
   720-core — report flag + modal (shared; vendored per unit).
   The APPROVED block from the delivered units — copy the matching markup
   from shared/720-core/chrome/chrome-snippets.html into index.html and the
   flag pngs land in assets/img via sync-core.sh. Identity comes from window.
   METADATA (unit + component slugs) and SCREEN_TO_SUBCONTENT (item + page) — see below.
   ===================================================================== */

'use strict';

function openReportModal() {
  document.getElementById('report-modal').removeAttribute('hidden');
  setTimeout(function () { var el = document.getElementById('report-type'); if (el) el.focus(); }, 40);
}
function tryCloseReportModal() {
  var typeVal = document.getElementById('report-type').value;
  var textVal = document.getElementById('report-text').value.trim();
  if (typeVal || textVal) {
    document.getElementById('report-modal').setAttribute('hidden', '');
    document.getElementById('report-confirm-modal').removeAttribute('hidden');
  } else { forceCloseReportModal(); }
}
function forceCloseReportModal() {
  document.getElementById('report-modal').setAttribute('hidden', '');
  document.getElementById('report-confirm-modal').setAttribute('hidden', '');
  resetReportForm();
}
function backToReportForm() {
  document.getElementById('report-confirm-modal').setAttribute('hidden', '');
  document.getElementById('report-modal').removeAttribute('hidden');
  setTimeout(function () { var el = document.getElementById('report-type'); if (el) el.focus(); }, 40);
}

/* ONE Google Form serves every 720 unit (decision 13.08.26) — the endpoint and the entry ids
   below must never change here. What tells the units apart in the shared sheet is the two slugs. */
var REPORT_FORM_ACTION = 'https://docs.google.com/forms/d/e/1FAIpQLSfFq5XFtH1pPpLgV5RWT4m3NanYPW5GKremqTvkp6zKjEGqcw/formResponse';

/* Identity comes from window.METADATA (loaded by the platform layer), as in every integrated
   unit — ADDING-REPORTING-AND-RESUME.md §7.2. The folder path is only the fallback for a page
   that runs without metadata. (The vendored version matched the folder against another unit's
   component pattern, so this unit always posted "…-xx" as its component.) */
function _reportShort(u) { return String(u || '').replace(/\/+$/, '').split('/').pop(); }
function _reportPathSlug() {
  var p = location.pathname.replace(/\/index(_dev)?\.html.*$/, '').replace(/\/+$/, '');
  return (p.split('/').pop() || '').toLowerCase();
}
function reportUnitId() {
  var m = window.METADATA;
  if (m && m.learningUnitId) return _reportShort(m.learningUnitId);
  return _reportPathSlug().replace(/-0\d$/, '') || 'unknown-unit';
}
function reportComponentId() {
  var m = window.METADATA;
  if (m && m.id) return _reportShort(m.id);
  return _reportPathSlug() || 'unknown-component';
}
/* The learner's exact place, from the same map the xAPI layer uses — so a report and a statement
   always name the same item. Unmapped screen: empty item, raw screen number as the page. */
function reportItemAndPage() {
  var map = (typeof SCREEN_TO_SUBCONTENT !== 'undefined') ? SCREEN_TO_SUBCONTENT[currentScreen] : null;
  if (!map) return { item: '', page: String(currentScreen) };
  return { item: reportComponentId() + '-' + map[0], page: String(map[1]) };
}

function submitReport() {
  var typeSel = document.getElementById('report-type');
  var textVal = document.getElementById('report-text').value.trim();
  var errEl = document.getElementById('report-error');
  if (!typeSel.value || !textVal) {
    if (errEl) errEl.removeAttribute('hidden');
    (typeSel.value ? document.getElementById('report-text') : typeSel).focus();
    return;
  }
  if (errEl) errEl.setAttribute('hidden', '');
  var now = new Date();
  var body = new URLSearchParams();
  body.append('entry.301404029_year', now.getFullYear());
  body.append('entry.301404029_month', now.getMonth() + 1);
  body.append('entry.2066097581_hour', now.getHours());
  body.append('entry.301404029_day', now.getDate());
  body.append('entry.2066097581_minute', now.getMinutes());
  var where = reportItemAndPage();
  body.append('entry.1933069481', reportUnitId());
  body.append('entry.2070680092', reportComponentId());
  body.append('entry.1555704258', where.item);
  body.append('entry.1671046914', where.page);
  body.append('entry.1179822443', typeSel.options[typeSel.selectedIndex].text);
  body.append('entry.806447525', textVal);
  fetch(REPORT_FORM_ACTION, { method: 'POST', mode: 'no-cors', body: body })
    .catch(function (e) { console.error('[Report] send failed', e); });
  showReportThanks();
}
function showReportThanks() {
  document.querySelectorAll('#report-modal .report-field, #report-modal .report-actions, #report-modal .report-modal-body')
    .forEach(function (el) { el.setAttribute('hidden', ''); });
  var t = document.getElementById('report-thanks');
  if (t) t.removeAttribute('hidden');
}
function resetReportForm() {
  document.getElementById('report-type').value = '';
  document.getElementById('report-text').value = '';
  document.getElementById('report-char-count').textContent = '0 / 250';
  var errEl = document.getElementById('report-error');
  if (errEl) errEl.setAttribute('hidden', '');
  var t = document.getElementById('report-thanks');
  if (t) t.setAttribute('hidden', '');
  document.querySelectorAll('#report-modal .report-field, #report-modal .report-actions, #report-modal .report-modal-body')
    .forEach(function (el) { el.removeAttribute('hidden'); });
}
(function wireReport() {
  /* Delegation on document, never per element (§7.4): the flag is cloned into every screen AFTER
     this runs (unit.js cloneReportFlags), and a per-element bind leaves those clones dead. */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.closest && e.target.closest('.flag-btn')) openReportModal();
  });
  var ta = document.getElementById('report-text');
  var counter = document.getElementById('report-char-count');
  if (ta && counter) ta.addEventListener('input', function () { counter.textContent = ta.value.length + ' / 250'; });
  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape') return;
    var confirmModal = document.getElementById('report-confirm-modal');
    var reportModal = document.getElementById('report-modal');
    if (confirmModal && !confirmModal.hasAttribute('hidden')) { forceCloseReportModal(); return; }
    if (reportModal && !reportModal.hasAttribute('hidden')) { tryCloseReportModal(); return; }
  });
})();
