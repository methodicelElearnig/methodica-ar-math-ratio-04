'use strict';
/* ═══════════════════════════════════════════════════════════════════
   methodica-ar-math-ratio-04 (יעד 1.4) — unit layer
   ═══════════════════════════════════════════════════════════════════ */

const TOTAL_SCREENS = 68;   /* grows as screens are built */

/* ══ S0 — TwoOptionSelection ══════════════════════════════════════════
   Copied VERBATIM from template-library/templates/TwoOptionSelection/
   template.js. Only the storage key, the character ids and the asset map
   are this unit's; the selection logic, the storage contract and the
   resume behaviour are the template's. ══ */
/* Companion-character storage — canonical contract:
   key namespaced per lomda; value is a logical ID only. */
/* The unit slug with underscores (guide §8.1) — must equal UI_CHARACTER_KEY in
   40-resume.js, which names the same cache. */
const CHARACTER_STORAGE_KEY = 'methodica_math_ratio_04_selectedCharacter';
const CHARACTER_IDS = ['character-orange', 'character-white'];
const DEFAULT_CHARACTER = 'character-orange';

/* ─── Companion character asset map ─────────────────────────
   Keys are the canonical logical IDs. This unit ships two monsters, orange
   and white. The two supplied sets are NOT symmetrical, so a pose only one
   of them has falls back to that monster's nearest pose rather than
   silently swapping in the other character. ─── */
const CHARACTER_ASSETS = {
  'character-orange': {
    selection: '../unit-assets/video/character-orange-selection.mp4',
    standing:  '../unit-assets/img/char-orange-standing.png',
    point:     '../unit-assets/img/char-orange-point.png',
    think:     '../unit-assets/img/char-orange-think.png',
    workout:   '../unit-assets/video/char-orange-workout.mp4',
    happy:     '../unit-assets/video/char-orange-happy.mp4',
    talking:   '../unit-assets/video/char-orange-talking.mp4',
    thinking:  '../unit-assets/video/char-orange-thinking.mp4',
    reading:   '../unit-assets/video/char-orange-reading.mp4',
    comics:    '../unit-assets/video/char-orange-comics.mp4',
    climbing:  '../unit-assets/video/char-orange-climbing.mp4',
    climbing2: '../unit-assets/video/char-orange-climbing.mp4',
  },
  'character-white': {
    selection: '../unit-assets/video/character-white-selection.mp4',
    standing:  '../unit-assets/img/char-white-standing.png',
    point:     '../unit-assets/img/char-white-point.png',
    think:     '../unit-assets/img/char-white-think.png',
    cube:      '../unit-assets/img/char-white-cube.png',
    workout:   '../unit-assets/video/char-white-workout.mp4',
    happy:     '../unit-assets/video/char-white-happy.mp4',
    talking:   '../unit-assets/video/char-white-talking.mp4',
    thinking:  '../unit-assets/video/char-white-thinking.mp4',
    reading:   '../unit-assets/video/char-white-reading.mp4',
    /* 29.09 — the white monster's own climbing clip, so the peak gates no
       longer fall back to the orange one. Cropped 720x720 from the producer's
       1280x720 scene and scaled to 520, matching the orange clip's format. */
    climbing:  '../unit-assets/video/char-white-climbing.mp4',
    climbing2: '../unit-assets/video/char-white-climbing.mp4',
  },
};

/* Not every pose exists for both monsters — the white one has no comics clip,
   the orange one no cube still. Rather than silently showing the wrong
   monster, a missing pose walks this chain until it finds one that monster
   owns. Each chain ends at a pose BOTH monsters have, so it always resolves.
   Delete an entry the day its asset arrives. */
const POSE_FALLBACK = {
  comics:   ['point', 'talking'],
  cube:     ['point', 'happy'],
};
/* ─── Global lomda state ────────────────────────────────── */
window.lomdaState = window.lomdaState || { selectedCharacter: null };

/* Validated read of the stored character: missing, empty, or unknown
   value → null (callers apply DEFAULT_CHARACTER where needed). */
function getStoredCharacter() {
  try {
    const v = localStorage.getItem(CHARACTER_STORAGE_KEY);
    return CHARACTER_IDS.includes(v) ? v : null;
  } catch (e) {
    return null;
  }
}

/* Seed state from storage BEFORE first render (canonical contract:
   reloading part 01 after a selection restores the selected card and
   keeps בחרתי enabled). */
window.lomdaState.selectedCharacter = getStoredCharacter();

/* Resolve the current character's asset for a given pose. */
function characterAsset(pose) {
  const id = CHARACTER_IDS.includes(window.lomdaState.selectedCharacter)
    ? window.lomdaState.selectedCharacter
    : DEFAULT_CHARACTER;
  if (!CHARACTER_ASSETS[id][pose]) {
    const alt = (POSE_FALLBACK[pose] || []).find(p => CHARACTER_ASSETS[id][p]);
    if (alt) pose = alt;
  }
  return CHARACTER_ASSETS[id][pose];
}


/* ═══════════════════════════════════════════════════════════
   S0 — TwoOptionSelection (slide 4) · approved template
   ═══════════════════════════════════════════════════════════ */
function selectOption(cardEl) {
  document.querySelectorAll('#s0 .option-card').forEach(c => {
    c.classList.remove('selected');
    c.setAttribute('aria-checked', 'false');
  });
  cardEl.classList.add('selected');
  cardEl.setAttribute('aria-checked', 'true');

  /* With the platform layer the choice goes into this component's state document too
     (setUnitCharacter, 40-resume.js), so it follows the learner to another machine; the
     localStorage mirror is what the later components adopt it from. */
  if (typeof setUnitCharacter === 'function') {
    setUnitCharacter(cardEl.dataset.value);
  } else {
    window.lomdaState.selectedCharacter = cardEl.dataset.value;
    try { localStorage.setItem(CHARACTER_STORAGE_KEY, cardEl.dataset.value); } catch (e) {}
  }

  const cont = document.getElementById('s0-continue');
  if (cont) cont.disabled = false;
}

/* Entry/reset — restores the saved choice (including after a reload,
   per the canonical cross-part contract). */
function s0Enter() {
  const saved = window.lomdaState.selectedCharacter;
  document.querySelectorAll('#s0 .option-card').forEach(card => {
    const isSel = !!saved && card.dataset.value === saved;
    card.classList.toggle('selected', isSel);
    card.setAttribute('aria-checked', isSel ? 'true' : 'false');
  });
  const cont = document.getElementById('s0-continue');
  if (cont) cont.disabled = !saved;
  document.querySelectorAll('#s0 .option-card video').forEach(v => v.play().catch(() => {}));
}

/* Keyboard select on the cards */
document.querySelectorAll('#s0 .option-card').forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectOption(card);
    }
  });
});


/* point an <img> or <video> at the chosen monster's pose. The src is set on
   ENTRY, not in the markup, because the choice is only known at runtime. A
   <video> also needs load()+play(): assigning .src alone leaves it showing
   nothing, and a screen that was display:none comes back paused. */
function setCharacter(id, pose) {
  const el = document.getElementById(id);
  if (!el) return;
  const want = characterAsset(pose);
  if (!el.getAttribute('src') || !el.getAttribute('src').endsWith(want)) el.setAttribute('src', want);
  if (el.tagName === 'VIDEO') {
    el.load();
    el.currentTime = 0;
    el.play().catch(() => {});
  }
}

/* A slot whose pose may resolve to a CLIP for one monster and a STILL for the
   other (the white one has no thinking / reading / comics / climbing clip).
   The element type has to follow the asset, so this writes the right tag into
   a wrapper instead of setting src on a fixed <video>. */
function setCharacterMedia(wrapId, pose, alt) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const src = characterAsset(pose);
  if (wrap.dataset.src === src) {
    const v = wrap.querySelector('video');
    if (v) { v.currentTime = 0; v.play().catch(() => {}); }
    return;
  }
  wrap.dataset.src = src;
  const label = alt || 'الشخصية المرافقة';
  wrap.innerHTML = /\.mp4$/.test(src)
    ? `<video class="transition-video" src="${src}" autoplay muted loop playsinline aria-label="${label}"></video>`
    : `<img class="transition-still" src="${src}" alt="${label}">`;
}

/* ─── S1 — deck slide 4 ────────────────────────────────────────────
   The deck asks for a verdict with NO verbal feedback: answering marks the
   correct option and unlocks המשך. `S1_CORRECT` is read off the slide — the
   green-stroked pill with the filled radio is `לא`.
   (Restored 18.09: this block was cut by mistake when S0's JS was replaced
   with the template's; the splice ran past S0's own functions.) ─── */
const S1_CORRECT = 'no';

function s1Answer(btn) {
  const opts = document.querySelectorAll('#s1 .scq-opt');
  opts.forEach(o => {
    o.classList.remove('selected');
    o.disabled = true;
  });
  btn.classList.add('selected');
  /* the indicator is on the CORRECT option, whichever was picked */
  opts.forEach(o => {
    if (o.dataset.opt === S1_CORRECT) o.classList.add('correct');
  });
  const cont = document.getElementById('s1-continue');
  if (cont) cont.disabled = false;
  if (typeof onCustomAnswered === 'function') onCustomAnswered(1, { pick: btn.dataset.opt });
}

function s1Enter() {
  /* answered state survives navigation; nothing to restore on a fresh entry */
  const answered = document.querySelector('#s1 .scq-opt.selected');
  const cont = document.getElementById('s1-continue');
  if (cont) cont.disabled = !answered;
}

/* ─── S2 — deck slide 5 · TextWithCallout ──────────────────────────
   The deck has the companion appear AFTER the copy, and only then does המשך
   unlock. ─── */
function s2Enter() {
  const char = document.getElementById('s2-char');
  const cont = document.getElementById('s2-continue');
  setCharacter('s2-char-img', 'standing');
  if (!char || !cont) return;
  char.classList.add('is-faded');
  cont.disabled = true;
  clearTimeout(s2Enter._t);
  s2Enter._t = setTimeout(() => {
    char.classList.remove('is-faded');
    cont.disabled = false;
  }, 1200);
}

/* ─── S4 — deck slide 9 ────────────────────────────────────────────
   One attempt, no hint. The feedback title is the deck's own pair —
   "هذا صحيح‎!" or "זו טעות" — over a single shared body. ─── */
const S4_CORRECT = 'no';
function s4Answer(btn) {
  const opts = document.querySelectorAll('#s4 .scq-opt');
  opts.forEach(o => { o.disabled = true; o.classList.remove('selected'); });
  btn.classList.add('selected');
  const right = btn.dataset.opt === S4_CORRECT;
  opts.forEach(o => { if (o.dataset.opt === S4_CORRECT) o.classList.add('correct'); });
  if (!right) btn.classList.add('wrong');
  const box = document.getElementById('s4-fb');
  document.getElementById('s4-fb-title').textContent = right ? 'هذا صحيح‎!' : 'هذا خطأ';
  box.classList.remove('hidden');
  feedboxDrag(box);
  /* 21.09 — these were `fb-correct` / `fb-wrong`, which match NOTHING in the
     stylesheet: `.quiz-feedbox` is display:none and only `.is-correct` /
     `.is-wrong` turn it on. Both panels were built and populated, then never
     shown — this is the "missing feedbacks". */
  box.classList.toggle('is-correct', right);
  box.classList.toggle('is-wrong', !right);
  document.getElementById('s4-continue').disabled = false;
  if (typeof onCustomAnswered === 'function') onCustomAnswered(4, { pick: btn.dataset.opt });
}
function s4Enter() {
  const answered = document.querySelector('#s4 .scq-opt[disabled]');
  document.getElementById('s4-continue').disabled = !answered;
}


/* 21.09 — `.quiz-feedbox` carries `cursor: grab` in the stylesheet but nothing
   ever made it draggable, so every panel only LOOKED movable. On s6 that
   matters: the panel lands over the rows it is explaining. One hook, wired
   wherever a feedbox is revealed. */
function feedboxDrag(box) {
  if (!box || box.dataset.dragWired) return;
  box.dataset.dragWired = '1';
  let sx = 0, sy = 0, ox = 0, oy = 0, dragging = false;
  box.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button, a, input, select')) return;
    dragging = true;
    sx = e.clientX; sy = e.clientY;
    const t = (box.style.transform.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)/) || [0, 0, 0]);
    ox = parseFloat(t[1]) || 0; oy = parseFloat(t[2]) || 0;
    box.setPointerCapture(e.pointerId);
  });
  box.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    box.style.transform = `translate(${ox + e.clientX - sx}px, ${oy + e.clientY - sy}px)`;
  });
  const stop = () => { dragging = false; };
  box.addEventListener('pointerup', stop);
  box.addEventListener('pointercancel', stop);
}

/* ─── S6 — deck slide 13 · sorting ─────────────────────────────────
   Four examples, two columns. `same` = نسبة بين كميات من نفس النوع (the column
   whose header sits at deck x=262), `diff` = من أنواع مختلفة (x=28). The key is
   the green radio column per row, read off the slide. One attempt. ─── */
const S6_ROWS = [
  { text: 'تخبز مرام صانعة الحلويات 50 قطعة كعك في الساعة',            correct: 'diff' },
  { text: 'سعر كيلو الموز 8 شيكل',                            correct: 'diff' },
  { text: 'تسير سيارة بسرعة 85 كم (كيلومتر) في الساعة',              correct: 'diff' },
  { text: 'مقابل كل بلوزتين بيضاوين، توجد لدى ياسمين 3 بلوزات سوداء',    correct: 'same' },
];
function s6Build() {
  const tb = document.getElementById('s6-rows');
  if (!tb || tb.childElementCount) return;
  tb.innerHTML = S6_ROWS.map((r, i) => `
    <tr data-row="${i}">
      <td class="sort-text">${r.text}</td>
      <td><button class="scq-opt sort-pick" type="button" data-col="same" onclick="s6Pick(${i},'same')"><span class="scq-radio" aria-hidden="true"></span></button></td>
      <td><button class="scq-opt sort-pick" type="button" data-col="diff" onclick="s6Pick(${i},'diff')"><span class="scq-radio" aria-hidden="true"></span></button></td>
    </tr>`).join('');
}
function s6Pick(i, col) {
  const row = document.querySelector(`#s6-rows tr[data-row="${i}"]`);
  row.querySelectorAll('.sort-pick').forEach(b => b.classList.toggle('selected', b.dataset.col === col));
  const picked = document.querySelectorAll('#s6-rows .sort-pick.selected').length;
  document.getElementById('s6-continue').disabled = picked < S6_ROWS.length;
  if (typeof onCustomPick === 'function') onCustomPick(6, { picks: s6Picks() });
}
/* the column picked in each row, or null — what the platform layer saves and reports */
function s6Picks() {
  return S6_ROWS.map((r, i) => {
    const b = document.querySelector(`#s6-rows tr[data-row="${i}"] .sort-pick.selected`);
    return b ? b.dataset.col : null;
  });
}
function s6Enter() {
  s6Build();
  /* once checked, the picks are cleared into ✓/✗ marks and the button is המשך — it used to
     count zero picks here and lock the learner out of their own finished screen on the way back */
  if (document.querySelector('#s6-rows .sort-pick[disabled]')) {
    document.getElementById('s6-continue').disabled = false;
    return;
  }
  const picked = document.querySelectorAll('#s6-rows .sort-pick.selected').length;
  document.getElementById('s6-continue').disabled = picked < S6_ROWS.length;
}

/* 21.09, producer: this screen had no check step at all — the four rows just
   unlocked המשך and the `#s6-fb` panel sitting in the markup was never
   populated or shown ("dev slide 6 is missing"). Deck slide 13 gives it a
   צדקתי? button and the feedback below, so it now follows the same
   answer -> mark -> feedback -> continue flow as s4 / s19. */
function s6Check() {
  const picks = s6Picks();
  let allRight = true;
  S6_ROWS.forEach((r, i) => {
    const row = document.querySelector(`#s6-rows tr[data-row="${i}"]`);
    const picked = row.querySelector('.sort-pick.selected');
    const ok = picked && picked.dataset.col === r.correct;
    if (!ok) allRight = false;
    row.querySelectorAll('.sort-pick').forEach(b => {
      b.disabled = true;
      b.classList.remove('selected');
      if (b.dataset.col === r.correct) b.classList.add('correct');
      else if (picked && b === picked) b.classList.add('wrong');
    });
  });
  const box = document.getElementById('s6-fb');
  document.getElementById('s6-fb-title').innerHTML = allRight ? 'هذا صحيح‎!' : 'هذا خطأ. الإجابة الصحيحة تظهر الآن.<br>هيّا نفهم السبب:';
  box.classList.remove('hidden');
  feedboxDrag(box);
  box.classList.toggle('is-correct', allRight);
  box.classList.toggle('is-wrong', !allRight);
  const btn = document.getElementById('s6-continue');
  btn.onclick = advanceScreen;
  btn.querySelector('.nav-label').dataset.label = 'متابعة';
  btn.querySelector('.nav-label span').textContent = 'متابعة';
  if (typeof onCustomAnswered === 'function') onCustomAnswered(6, { picks: picks });
}

/* ─── S7 — deck slides 14-16 · accordion ───────────────────────────
   המשך unlocks only once BOTH panels have been opened (notesSlide 14). ─── */
const s7Opened = { a: false, b: false };
function s7Toggle(which) {
  const item = document.getElementById('s7-' + which);
  /* QA 29.09 — accordion, not checklist: opening one closes the other. */
  document.querySelectorAll('#s7 .acc-item').forEach(el => { if (el !== item) el.classList.remove('open'); });
  const open = item.classList.toggle('open');
  if (open) s7Opened[which] = true;
  document.getElementById('s7-continue').disabled = !(s7Opened.a && s7Opened.b);
  if (typeof onCustomPick === 'function') onCustomPick(7, { a: s7Opened.a, b: s7Opened.b });
}
function s7Enter() {
  document.getElementById('s7-continue').disabled = !(s7Opened.a && s7Opened.b);
}


const GC_BULB = `<svg class="gc-bulb" viewBox="0 0 20.997 27.9988" fill="none" aria-hidden="true">
  <path d="M17.4818 2.65764C15.2512 0.668476 12.2563 -0.275357 9.25683 0.0699765C4.59833 0.60431 0.748334 4.35748 0.103168 8.99148C-0.387999 12.5078 0.894168 16.0031 3.532 18.34C4.99267 19.6338 5.83033 21.5191 5.83033 23.5095V23.9155C5.83033 26.1671 7.662 27.9988 9.91367 27.9988H11.0803C13.332 27.9988 15.1637 26.1671 15.1637 23.9155V23.5095C15.1637 21.5308 16.0072 19.6321 17.4877 18.3143C19.6108 16.4243 20.9968 13.6885 20.9968 10.6666C20.9968 7.51914 19.6435 4.58398 17.4818 2.65764ZM13.9968 23.9155C13.9968 25.5236 12.6885 26.8319 11.0803 26.8319H9.91367C8.3055 26.8319 6.99717 25.5236 6.99717 23.9155V23.6666H13.9968V23.9155ZM16.7117 17.4441C15.1252 18.8546 14.1655 20.7801 13.9968 22.4996H12.2503V15.4996C12.2503 15.1776 11.9888 14.9161 11.6668 14.9161C11.3448 14.9161 11.0833 15.1776 11.0833 15.4996V22.4996H9.91367V15.4996C9.91367 15.1776 9.65217 14.9161 9.33017 14.9161C9.00817 14.9161 8.74667 15.1776 8.74667 15.4996V22.4996H6.99717C6.83433 20.7906 5.87233 18.8686 4.30667 17.4791C1.97967 15.4166 0.850168 12.3373 1.28217 9.15181C1.85183 4.95064 5.32617 1.68881 9.34733 1.23231C11.9958 0.928476 14.6432 1.76381 16.6118 3.51864C18.5233 5.22314 19.8298 7.81948 19.8298 10.6666C19.8298 13.3348 18.5967 15.7626 16.7117 17.4441Z" fill="currentColor"/>
</svg>`;

const guidedState = {};

/* the companion + bubble (2.1's charWidget, from its questions.js) — the pose
   follows the learner's chosen monster */
const charWidget = (text, pose, extra = '') => `
  <div class="character-widget ${extra}">
    <div class="speech-bubble">${text}</div>
    <img src="${pose}" alt="شخصية مرافقة">
  </div>`;

/* ═══════════════════════════════════════════════════════════════════
   GUIDED — deck slides 18-26 · GuidedInstructionFlow (Figma 3147:29197),
   ONE SCREEN PER DECK SLIDE, on the builder copied from the delivered 2.1
   (proportion-02-01-main/unit-js/unit.js: buildGuidedScreens + guidedAnswer).
   Same family as 2.1's screens 5-18: exercise in the bordered box on the
   right, indigo callout with the bulb on the left, answer pills inside it.

   The exercise text is constant on all nine slides; slide 22 adds ב (`showB`).
   `intro` is the full-width line slides 18 and 22 carry above the exercise.

   Every key is confirmed by the NEXT slide's own reveal text:
     19 כן → 20 "من نفس النوع" · 20 אין צורך → 21 "אין צורך" ·
     23 من أنواع مختلفة → 24 "من أنواع مختلفة" · 24 כן → 25 "עלינו לציין".
   FLAGGED: slide 18 gives the runner 8 متر في الثانية; 19-26 give 3 and every
   calculation uses 3 — built with 3.
   Behaviour = the approved callout (client 10.09, producer 15.09): the pick
   itself reveals, only the CORRECT option gets the ✓, a wrong pick keeps its
   lavender wash, the bar button unlocks as שנמשיך?.
   ═══════════════════════════════════════════════════════════════════ */
const RA = t => '<span class="ratio">' + t + '</span>';
const FRC = (n, d) => '<span class="fracpair"><span class="fraction fr-inline"><span class="frac-top">' + n +
                      '</span><span class="frac-bottom">' + d + '</span></span></span>';

const G_LEAD = 'راكبة دراجة وعدّاء ماراثون يتنافسان في مقاطع مختلفة‎:';
/* 21.09 — deck slides 18/19 put a picture above each column inside the box
   (image14 the cyclist on the right, image15 the runner on the left); the
   build had the text only. */
/* 29.09, producer: dslide 9 (deck slide 18) is the ONLY screen that reads
   8 متر في الثانية; dslides 10-17 (deck 19-26) go back to 3, which is what every
   calculation on them uses. The line break and the unbreakable parenthetical
   stay on all of them so the panel never re-wraps between steps. */
const G_PAIR = speed => '<div class="gx-pair">' +
  '<div class="gx-col"><img class="gx-pic" src="assets/img/gx-cyclist.png" alt="راكبة دراجة">' +
  '<p class="gx-block">تقطع راكبة الدراجة مسافة <strong>30 كم</strong> بسرعة ثابتة مقدارها <strong>20 كم/ساعة </strong>(20 كم في ساعة واحدة)‎.</p></div>' +
  '<div class="gx-col"><img class="gx-pic" src="assets/img/gx-runner.png" alt="عدّاء ماراثون">' +
  '<p class="gx-block">يقطع العدّاء مسافة <strong>25 كم</strong> <br>بسرعة ثابتة مقدارها <strong>' + speed +
  ' متر في الثانية </strong><span class="gx-nb">(' + speed + ' متر في ثانية واحدة)</span>.</p></div></div>';
const G_QA = '<p class="gx-q"><strong>أ. ما هي النسبة بين المسافة التي تقطعها راكبة الدراجة والمسافة التي يقطعها عدّاء الماراثون؟</strong></p>';
const G_QB = '<p class="gx-q"><strong>ب. من يتحرك بسرعة أكبر، عدّاء الماراثون أم راكبة الدراجة؟</strong></p>';
/* 21.09, producer: once sub-question ב opens (screen 13 / deck slide 22) the
   deck shows ONLY ב — question א is gone from the box. The build kept א on
   screen and appended ב under it. */
const exerciseBox = (showB, speed) => `<div class="gx-lead">${G_LEAD}</div>${G_PAIR(speed)}${showB ? G_QB : G_QA}`;

const GUIDED = [
  { screen: 9,  noStep: true,
    intro: '<strong>تأملوا في التمرين التالي. لا تحلوه، فقط انظروا إلى المعطيات وفكروا إذا كان لديكم اتجاه للحل.</strong>',
    companion: 'سنشرح الحل فورًا،<br>خطوة بخطوة' },
  { screen: 10,
    callout: 'أولًا، نفحص الكميات التي نريد<br> بناء النسبة بينها‎.',
    calloutQ: 'هل الكميات من نفس النوع؟',
    q: { opts: ['نعم', 'لا'], correct: 0 } },
  { screen: 11,
    callout: 'في هذه الحالة، النسبة هي بين مسافتين، ولذلك الكميات هي من نفس النوع‎.',
    calloutQ: 'هل هناك حاجة للإشارة إلى وحدة القياس إلى جانب الكمية؟',
    q: { opts: ['يجب الإشارة إلى وحدات القياس', 'لا حاجة للإشارة إلى وحدات القياس'], correct: 1 } },
  { screen: 12, answer: true,
    callout: 'لا حاجة للإشارة إلى وحدات القياس عندما تكون الكميات من نفس النوع.<br><br>الآن، سننتقل لكتابة النسبة بين المسافة التي تقطعها راكبة الدراجة والمسافة التي يقطعها عدّاء الماراثون ' + RA('30 : 25') + '. بعد الاختزال سنحصل على النسبة ' + RA('6 : 5') + '.' },
  /* 21.09, producer: no callout on this screen. (Deck slide 22 does carry the
     same sentence at x=316886 — flagged, removed as asked.) */
  { screen: 13, answer: true, showB: true,
    intro: '<strong>فيما يلي بند آخر للسؤال. لا تحلوه، فقط انظروا إلى المعطيات وفكروا إذا كان لديكم اتجاه للحل.</strong>',
    companion: 'تعالوا نرى كيف نحل البند ب' },
  { screen: 14, showB: true,
    callout: 'الآن، علينا معرفة أيهما أسرع‎.',
    calloutQ: 'في هذه الحالة، النسبة هي بين‎:',
    q: { opts: ['كميات من نفس النوع', 'كميات من أنواع مختلفة'], correct: 1 } },
  { screen: 15, showB: true,
    callout: 'النسبة في هذه الحالة هي بين مسافة (كم) وزمن (ساعة)، ولذلك الكميات هي من أنواع مختلفة‎.',
    calloutQ: 'هل هناك حاجة للإشارة إلى وحدة القياس إلى جانب الكمية؟',
    q: { opts: ['نعم', 'لا'], correct: 0 } },
  { screen: 16, answer: true, showB: true,
    callout: 'بما أن الحديث عن نسبة بين مقدارين من نوعين مختلفين، فعلينا الإشارة إلى وحدات القياس.<br><br>الآن، أمامنا مهمة أخرى مهمة: سرعة راكبة الدراجة مذكورة بوحدة كم/س، وسرعة العدّاء مذكورة بوحدة متر في الثانية. لكي نقارن بين السرعتين، علينا توحيد وحدات القياس‎.' },
  { screen: 17, answer: true, showB: true,
    callout: 'سرعة راكبة الدراجة هي 20 كم في ساعة واحدة، أي 20,000 متر في 3,600 ثانية.<br>نختزل ونحصل على أن سرعتها هي ' + FRC('50', '9') + ' متر في الثانية، أي: <span class="vi-mixed" dir="ltr"><span class="vi-mixed-whole">5</span>' + FRC('5', '9') + '</span> أمتار في الثانية.<br>سرعة العدّاء هي 3 أمتار في الثانية.<br>الاستنتاج: راكبة الدراجة أسرع‎.' },
];

/* 2.1's builder. Differences, all because this deck differs: no recipe table
   (the exercise is a text block, framed like 2.1's table), no fixed g-title
   (these slides carry none), `intro` for the full-width line, `companion` for
   the bubble beside the monster. Everything else is verbatim. */
function buildGuidedScreens() {
  const app = document.getElementById('app');
  const backRef = document.getElementById('quiz-hint-overlay');
  const optsHTML = (cfg) => `<div class="gc-opts" role="radiogroup" aria-label="خيارات الإجابة">
    ${cfg.q.opts.map((o, i) => `
      <div class="gc-opt" role="radio" aria-checked="false" tabindex="0" data-idx="${i}"
           onclick="guidedAnswer(${cfg.screen}, this)"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();guidedAnswer(${cfg.screen}, this);}">${o}</div>`).join('')}
  </div>`;

  GUIDED.forEach((cfg) => {
    /* one shared unit.js for the whole unit: a component builds only the
       screens inside its own range, exactly as quizBuildScreens does. Without
       this every component ships the whole unit's guided screens. */
    if (window.PART_CONFIG &&
        (cfg.screen < window.PART_CONFIG.start || cfg.screen > window.PART_CONFIG.end)) return;
    guidedState[cfg.screen] = { done: false };
    const sec = document.createElement('section');
    sec.className = 'screen g-screen';
    sec.dataset.screen = cfg.screen;
    sec.id = `g${cfg.screen}`;
    sec.innerHTML = `
      <div class="g-layout">
        <div class="g-right">
          <div class="g-instruction">
            <!-- QA 29.09 — the intro line is emitted on EVERY guided step, empty
                 where the deck has none. Omitting it moved the exercise panel up
                 by a line between steps; producer: the panel stays put. -->
            <div class="g-story">${cfg.intro || ''}</div>
            <div class="g-frame"><div class="g-media">${exerciseBox(!!cfg.showB, cfg.screen === 9 ? 8 : 3)}</div></div>
            <div class="g-after" id="g${cfg.screen}-after"></div>
          </div>
        </div>
        ${(cfg.noStep || (!cfg.callout && !cfg.calloutQ && !cfg.q)) ? '' : `<aside class="g-callout" data-reveal="4" aria-label="تعليمات المرحلة">
          ${GC_BULB}
          ${cfg.callout ? `<div class="gc-text">${cfg.callout}</div>` : ''}
          ${cfg.calloutQ ? `<div class="gc-q">${cfg.calloutQ}</div>` : ''}
          ${cfg.q ? optsHTML(cfg) : ''}
        </aside>`}
      </div>
      ${cfg.companion
        ? charWidget(cfg.companion, characterAsset('standing')).replace('class="character-widget ', 'data-reveal="1" data-reveal-fade class="character-widget ')
        : ''}
      ${cfg.q
        ? `<button class="btn-continue" id="g${cfg.screen}-check" disabled>متابعة</button>`
        : `<button class="btn-continue" id="g${cfg.screen}-continue" onclick="goTo(${cfg.screen + 1})">متابعة</button>`}
      <button class="btn-back" onclick="goTo(${cfg.screen - 1})">عودة</button>`;
    app.insertBefore(sec, backRef);
  });
}
document.addEventListener('DOMContentLoaded', buildGuidedScreens);

/* the approved callout resolve, verbatim from 2.1 */
function guidedAnswer(screen, el) {
  const st = guidedState[screen];
  if (st.done) return;
  st.done = true;
  st.selected = Number(el.dataset.idx);
  const cfg = GUIDED.find(g => g.screen === screen);
  document.querySelectorAll(`#g${screen} .gc-opt`).forEach(o => {
    const idx = Number(o.dataset.idx);
    o.classList.add('locked');
    o.classList.remove('selected');
    o.setAttribute('aria-checked', o === el ? 'true' : 'false');
    if (idx === cfg.q.correct) o.classList.add('correct');
    else if (idx === st.selected) o.classList.add('chosen');
  });
  const btn = document.getElementById(`g${screen}-check`);
  btn.disabled = false;
  btn.textContent = 'متابعة';
  btn.setAttribute('onclick', `goTo(${screen + 1})`);
  if (typeof onCustomAnswered === 'function') onCustomAnswered(screen, { pick: st.selected });
}

/* the companion follows the chosen monster on entry */
function guidedEnter(n) {
  const img = document.querySelector(`#g${n} .character-widget img`);
  if (img) img.src = characterAsset('standing');
}

/* ─── Per-screen restore hooks (called by engine goTo) ─────────────── */
function resetScreenState(n) {
  /* 21.09 — the engine's own per-screen hook was never wired in, so
     quizStepperUpdate() never ran on navigation: the strip showed no
     current station and answered ones lost their ✓/✗ on the way back.
     This is the call 2.1 makes and this unit was missing. */
  if (typeof quizResetScreenState === 'function') quizResetScreenState(n);
  switch (n) {
    case 0: s0Enter(); break;
    case 1: s1Enter(); break;
    case 2: s2Enter(); break;
    case 4: s4Enter(); break;
    case 6: s6Enter(); break;
    case 7: s7Enter(); break;
    /* 22.09 — the companion's pose per slot. Read down the column: no pose
       repeats back to back, and the two that do repeat (workout on 20/43,
       climbing on the two peak gates) sit 20+ screens apart. */
    case 8: setCharacter('x8-char', 'happy'); break;          /* deck 17 */
    case 9: case 13: guidedEnter(n); break;
    case 18: setCharacterMedia('x18-char', 'thinking', 'الشخصية المرافقة تفكر'); break;     /* deck 27 — "ماذا بقيَ عالقًا في عقولنا؟" */
    case 20: setCharacter('x20-char', 'workout'); break;      /* deck 30 */
    case 29: setCharacterMedia('x29-char', 'reading', 'الشخصية المرافقة تقرأ'); break;      /* deck 40 — "אין כמו תרגול" */
    case 35: setCharacter('x35-char', 'talking'); break;      /* deck 46 */
    case 40: setCharacterMedia('x40-char', 'comics', 'الشخصية المرافقة'); break;       /* deck 52 — "ללמוד גם בצורה אחרת" */
    case 41: setCharacter('x41-char', 'cube'); break;         /* deck 53 — "هل أنتم مستعدون للتحدي؟" */
    case 42: s42Enter(); break;
    case 43: setCharacter('x43-char', 'workout'); break;   /* deck 56 */
    case 48: setCharacterMedia('x48-char', 'climbing', 'الشخصية المرافقة تتسلق نحو القمة'); break;  /* deck 62 — the peak gate */
    case 57: setCharacterMedia('x57-char', 'climbing2', 'الشخصية المرافقة تتسلق نحو القمة'); break;  /* deck 72 */
    /* 48 / 57 (deck 62 / 72) are the peak-question gates and the six
       FullImageWithTextOverlay screens are static — nothing to reset. */
    default: break;
  }
}

/* ─── S42 — deck slide 54 ──────────────────────────────────────────
   Production note: "הדמות מופיעה רק אחרי ההקלדה, ואז כפתור המשך זמין
   ללחיצה". There is no right answer here — the learner compares their own
   two measurements — so the gate is "anything typed", not a key. ─── */
function s42Enter() {
  setCharacter('x42-char', 'think');
  s42Typed();
}
function s42Typed() {
  const input = document.getElementById('x42-input');
  const wrap = document.getElementById('x42-charwrap');
  const btn = document.getElementById('x42-continue');
  if (!input || !wrap || !btn) return;
  const bubble = document.getElementById('x42-bubble');
  const typed = input.value.trim().length > 0;
  wrap.classList.toggle('is-hidden', !typed);
  if (bubble) bubble.classList.toggle('is-hidden', !typed);
  btn.disabled = !typed;
}

/* ─── info dot (deck slide 59) ─────────────────────────────────────
   Figma 720---UI-Templates 5034:42518 "Tooltip Text Screen". Producer 29.09:
   the trigger is HOVER, not a click, and the panel has two states — it opens
   to one side of the icon or the other. Opening/closing is CSS (:hover and
   :focus-visible, so the keyboard reaches it too); the only thing JS decides
   is the SIDE, which needs a measurement CSS cannot make. ─── */
function infoDotPlace(wrap) {
  const pop = wrap.querySelector('.info-pop');
  if (!pop) return;
  /* measure against the stage, not the viewport: the unit is scaled to fit */
  const stage = wrap.closest('.screen') || document.body;
  const s = stage.getBoundingClientRect();
  const w = wrap.getBoundingClientRect();
  pop.classList.remove('info-pop--right');
  /* default opens toward the LEFT of the icon (the Figma state); flip when
     that would run past the stage edge */
  if (w.left - pop.offsetWidth < s.left + 8) pop.classList.add('info-pop--right');
}
document.addEventListener('pointerover', (e) => {
  const wrap = e.target.closest && e.target.closest('.info-wrap');
  if (wrap) infoDotPlace(wrap);
});
document.addEventListener('focusin', (e) => {
  const wrap = e.target.closest && e.target.closest('.info-wrap');
  if (wrap) infoDotPlace(wrap);
});

function advanceScreen() { goTo(currentScreen + 1); }


/* ─── Speech-bubble frame ──────────────────────────────────────────
   The bubble outline is an SVG path injected at render time, not a CSS
   border: the tail has to join the rounded body cleanly at any size, and
   a rotated CSS square renders a diagonal wedge instead (ratio-06, 15.09).
   Copied verbatim from the delivered percent-08. engine.js calls
   decorateBubbles(screen) on every goTo. ─── */
/* Figma bubble shapes (551:12741 / 551:12742) — vendored verbatim from the
   approved proportion-2-1 build (maven-skills §8i). */
function bubblePathBottom(w, h) {
  const r = 10, i = 1, cx = w / 2, td = 15.3, tw = 17;
  return `M ${i + r} ${i} H ${w - i - r} A ${r} ${r} 0 0 1 ${w - i} ${i + r}` +
    ` V ${h - i - r} A ${r} ${r} 0 0 1 ${w - i - r} ${h - i}` +
    ` H ${cx + tw} L ${cx} ${h - i + td} L ${cx - tw} ${h - i}` +
    ` H ${i + r} A ${r} ${r} 0 0 1 ${i} ${h - i - r}` +
    ` V ${i + r} A ${r} ${r} 0 0 1 ${i + r} ${i} Z`;
}

function bubblePathSideLeft(w, h) {
  const r = 8.5, i = 1, cy = h / 2, td = 17.6, th = 11.3;
  return `M ${i + r} ${i} H ${w - i - r} A ${r} ${r} 0 0 1 ${w - i} ${i + r}` +
    ` V ${h - i - r} A ${r} ${r} 0 0 1 ${w - i - r} ${h - i}` +
    ` H ${i + r} A ${r} ${r} 0 0 1 ${i} ${h - i - r}` +
    ` V ${cy + th} L ${i - td} ${cy} L ${i} ${cy - th}` +
    ` V ${i + r} A ${r} ${r} 0 0 1 ${i + r} ${i} Z`;
}

/* mirror of bubblePathSideLeft: notch on the RIGHT edge, so the bubble can sit
   to the LEFT of the character and point at it (producer 14.09.26). */
function bubblePathSideRight(w, h) {
  const r = 8.5, i = 1, cy = h / 2, td = 17.6, th = 11.3;
  return `M ${i + r} ${i} H ${w - i - r} A ${r} ${r} 0 0 1 ${w - i} ${i + r}` +
    ` V ${cy - th} L ${w - i + td} ${cy} L ${w - i} ${cy + th}` +
    ` V ${h - i - r} A ${r} ${r} 0 0 1 ${w - i - r} ${h - i}` +
    ` H ${i + r} A ${r} ${r} 0 0 1 ${i} ${h - i - r}` +
    ` V ${i + r} A ${r} ${r} 0 0 1 ${i + r} ${i} Z`;
}

function decorateBubbles(scope) {
  (scope || document).querySelectorAll('.speech-bubble').forEach(b => {
    const w = b.offsetWidth, h = b.offsetHeight;
    if (!w || !h) return;
    const key = w + 'x' + h;
    if (b.dataset.bubbleSize === key) return;
    b.dataset.bubbleSize = key;
    const stale = b.querySelector('.bubble-shape');
    if (stale) stale.remove();
    if (!b.dataset.bubbleWatched) {
      b.dataset.bubbleWatched = '1';
      if (window.ResizeObserver) {
        new ResizeObserver(() => decorateBubbles(b.parentElement || b)).observe(b);
      }
    }
    let svg;
    if (b.classList.contains('side-bubble--right')) {
      const td = 18;
      svg = `<svg class="bubble-shape" style="left:0;top:0;width:${w + td}px;height:${h}px" ` +
        `viewBox="0 0 ${w + td} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
        `<path d="${bubblePathSideRight(w, h)}" fill="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
    } else if (b.classList.contains('side-bubble')) {
      const td = 18;
      svg = `<svg class="bubble-shape" style="left:${-td}px;top:0;width:${w + td}px;height:${h}px" ` +
        `viewBox="${-td} 0 ${w + td} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
        `<path d="${bubblePathSideLeft(w, h)}" fill="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
    } else {
      const td = 17;
      svg = `<svg class="bubble-shape" style="left:0;top:0;width:${w}px;height:${h + td}px" ` +
        `viewBox="0 0 ${w} ${h + td}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
        `<path d="${bubblePathBottom(w, h)}" fill="white" stroke-width="2" stroke-linejoin="round"/></svg>`;
    }
    b.insertAdjacentHTML('afterbegin', svg);
  });
}
