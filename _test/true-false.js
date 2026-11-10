/* ═══════════════════ true-false.js — methodica-ar-math-ratio-04 ═══════════════════
   True/false questions report 'true' / 'false', never the label on screen (guide
   Documentation/reporting-and-resume/ADDING-REPORTING-AND-RESUME.md §6.3b). Kata compares
   result.response with the question's correctXapiResponsesPattern, which for a true-false question
   is ["true"] or ["false"]; "نعم" / "لا" / "صحيح — <statement>" never match (Kata read 10.11.26:
   all five are true-false with answers ["true","false"]).

   For every metadata question of type true-false (01-001 q1 s1, 01-002 q1 s4, 02-001 q2 s22,
   07-001 q6/q7 s65), answered right and wrong through the real handlers (jsdom, the stub library),
   each answered statement must carry student_answer — what the live library turns into
   result.response — 'true' or 'false', equal to the metadata's correct answer exactly when success.
     NODE_PATH=<jsdom>/node_modules node _test/true-false.js
   ═══════════════════════════════════════════════════════════════════════════════════ */
'use strict';
const H = require('./harness');
const R = H.makeReporter('true-false');
const { ok } = R;

/* the correct answer as a boolean string; this repo's metadata may still hold the on-screen label */
const TRUE_WORDS = ['true', 'נכון', 'כן', 'صحيح', 'نعم'];
/* The five Kata declares (read 10.11.26). This repo's metadata also marks 01-003 q1 / q4 (guided s10 /
   s15, כן / לא) true-false, but Kata's item 01-003 carries no questions at all — left as they are,
   like percent-08's guided 01-002, until the catalogue says otherwise. */
const KATA_TF = ['01:001/q1', '01:002/q1', '02:001/q2', '07:001/q6', '07:001/q7'];
const TF = {};
for (const c of H.PARTS) {
  for (const it of H.readMeta(c).subContent) for (const q of it.questions || []) {
    if (q.questionType !== 'true-false') continue;
    const p = q.questionId.replace(/\/+$/, '').split('/');
    const key = c + ':' + p[p.length - 2].slice(-3) + '/' + p[p.length - 1];
    if (KATA_TF.indexOf(key) !== -1) TF[key] = TRUE_WORDS.indexOf(String(q.correctAnswers[0])) !== -1 ? 'true' : 'false';
  }
}

/* one walk per component over its true/false screens; right = the correct pick, wrong = every
   wrong attempt the screen allows (answerFor's distinct wrong answers) */
const pickYesNo = (n, right) => 'goTo(' + n + '); (function(){ var c = ' + (n === 1 ? 'S1_CORRECT' : 'S4_CORRECT') + ';' +
  ' var v = ' + (right ? 'c' : '(c === "yes" ? "no" : "yes")') + ';' +
  ' ' + (n === 1 ? 's1Answer' : 's4Answer') + '(document.querySelector(\'#s' + n + ' .scq-opt[data-opt="\' + v + \'"]\')); })();';
function quiz(b, n, right) {
  b.exec('goTo(' + n + ')');
  const q = JSON.parse(b.val('JSON.stringify(QUESTIONS.find(function(q){return q.screen===' + n + ';}))'));
  if (right) b.exec(H.enterJs(n, H.answerFor(q, 'right')) + H.clickCheck(n));
  else for (let k = 0; k < q.maxAttempts; k++) b.exec(H.enterJs(n, H.answerFor(q, 'wrong', k)) + H.clickCheck(n));
}
const WALK = {
  '01': (b, r) => b.exec(pickYesNo(1, r) + pickYesNo(4, r)),
  '02': (b, r) => quiz(b, 22, r),
  '07': (b, r) => quiz(b, 65, r),
};

(async function main() {
  ok('setup', 'the metadata declares the 5 true/false questions', Object.keys(TF).length === 5, Object.keys(TF).join(' '));
  for (const c of Object.keys(WALK)) for (const right of [true, false]) {
    const b = await H.boot(c, { lib: true });
    b.finishBoot();
    WALK[c](b, right);
    const tag = c + (right ? ' right' : ' wrong');
    const seen = {};
    for (const s of b.stmts()) {
      if (!/^answered/.test(s.verb) || !s.opts || !s.opts.questionId) continue;
      const p = s.opts.questionId.replace(/\/+$/, '').split('/');
      const key = c + ':' + p[p.length - 2].slice(-3) + '/' + p[p.length - 1];
      if (!(key in TF)) continue;
      seen[key] = true;
      const r = s.result || {};
      const sent = r.response != null ? String(r.response) : ((r.extensions && r.extensions.student_answer) || []).join(' | ');
      ok(tag, key + ' (' + s.verb + ') reports "true" / "false"', sent === 'true' || sent === 'false', JSON.stringify(sent));
      ok(tag, key + ' the value equals the correct answer exactly when success', (sent === TF[key]) === (r.success === true),
        'sent ' + sent + ', correct ' + TF[key] + ', success ' + r.success);
      if (right) ok(tag, key + ' success', r.success === true, String(r.success));
    }
    for (const key of Object.keys(TF).filter(k => k.startsWith(c + ':'))) ok(tag, key + ' was reported', seen[key]);
    ok(tag, 'no page error', !b.errors.length, b.errors.slice(0, 2).join(' | '));
    b.w.close();
  }
  R.done();
})().catch(e => { console.error(e); process.exit(2); });
