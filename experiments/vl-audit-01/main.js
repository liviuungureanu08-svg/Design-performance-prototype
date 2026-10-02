// @ts-check
import { BUSINESSES, LANES } from './data.js';
import { Field } from './field.js';

const Q = new URLSearchParams(location.search);
const $ = (/** @type {string} */ s) => /** @type {HTMLElement} */ (document.querySelector(s));
const mq = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = Q.get('motion') === 'reduced' || (Q.get('motion') !== 'full' && mq.matches);
document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';

const stage = $('#stage'), canvas = /** @type {HTMLCanvasElement} */ ($('#field'));
const holdBtn = $('#hold'), latchBtn = $('#latch'), statusEl = $('#status'), live = $('#live'), insight = $('#insight');
const field = new Field(canvas, { seed: Number(Q.get('seed') ?? 7), reduced });
let biz = BUSINESSES.find((b) => b.id === Q.get('biz')) ?? BUSINESSES[0];
let latched = false, holding = false, running = true, visible = true;
/** @type {{ site: number, app: number, auto: number, ai: number, you: number }} */
const session = { site: 0, app: 0, auto: 0, ai: 0, you: 0 };
let ranOnce = false;

function introBottom() {
  const st = stage.getBoundingClientRect().top, lede = $('.lede'), h1 = $('#h1');
  if (stage.clientWidth < 720) insight.style.top = `${Math.round(h1.getBoundingClientRect().bottom - st + 14)}px`; // the insight replaces the lede on phones
  return lede.getBoundingClientRect().bottom - st;
}
function size() { field.resize(stage.clientWidth, stage.clientHeight, introBottom()); field.draw(); }
function setBiz(/** @type {typeof biz} */ b) {
  biz = b; field.setOn(false); latched = false; holding = false;
  field.reset(b);
  for (const k of Object.keys(session)) session[/** @type {keyof typeof session} */ (k)] = 0;
  ranOnce = false;
  $('#eyebrow').textContent = `${b.label[0].toUpperCase()}${b.label.slice(1)} · ${b.day} evening · ${reduced ? 'a snapshot' : 'shown 360× faster'}`;
  document.querySelectorAll('.biz button').forEach((el) => el.setAttribute('aria-pressed', String(/** @type {HTMLElement} */ (el).dataset.biz === b.id)));
  hideInsight(true); syncControls(); renderSession(); field.draw();
  live.textContent = `Showing ${b.label}.`;
  if (field.w) size();
}

// ---------- system on/off: one shared cause ----------
function want() { return latched || holding; }
function apply() {
  const on = want();
  if (on === field.on) return;
  field.setOn(on);
  if (on) { ranOnce = true; live.textContent = 'System running. Each message is taken to the website, the app, automation or AI; only the ones that need a person go to You.'; }
  else { hideInsight(false); const w = field.stats; live.textContent = `System off. ${w.handled} handled, ${w.you} for you. New messages are piling up again.`; }
  syncControls();
}
function syncControls() {
  stage.classList.toggle('on', field.on);
  latchBtn.setAttribute('aria-pressed', String(latched));
  latchBtn.textContent = latched ? 'Stop' : 'Keep it running';
  $('#hold-l').textContent = latched ? 'Running' : field.on ? 'Running · let go to stop' : reduced ? 'Run the system' : 'Hold to run the system';
}
const isControl = (/** @type {EventTarget|null} */ t) => t instanceof Element && !!t.closest('button:not(#hold), a, .insight');
stage.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || isControl(e.target)) return;
  if (reduced) { latched = !latched; apply(); return; } // no holding required when motion is reduced: a plain switch
  if (e.pointerType === 'touch') { // a touch may become a scroll: commit to "hold" only if the finger stays put for 110 ms
    touchStart = { x: e.clientX, y: e.clientY, id: e.pointerId };
    touchT = window.setTimeout(() => { touchT = 0; touchStart = null; holding = true; apply(); }, 110);
    return;
  }
  holding = true; apply();
});
/** @type {{x:number,y:number,id:number}|null} */ let touchStart = null; let touchT = 0;
const cancelTouch = () => { if (touchT) { clearTimeout(touchT); touchT = 0; } touchStart = null; };
stage.addEventListener('pointermove', (e) => { if (touchStart && e.pointerId === touchStart.id && Math.hypot(e.clientX - touchStart.x, e.clientY - touchStart.y) > 8) cancelTouch(); });
const release = () => { cancelTouch(); if (holding) { holding = false; apply(); } };
addEventListener('pointerup', release);
addEventListener('pointercancel', release); // touch: the browser took the gesture for scrolling
addEventListener('blur', release);
stage.addEventListener('contextmenu', (e) => e.preventDefault());
addEventListener('keydown', (e) => {
  if (e.code !== 'Space' || e.repeat || /** @type {Element} */ (e.target).closest?.('input, textarea')) return;
  if (stage.getBoundingClientRect().bottom < 80) return; // field scrolled away: let space scroll
  e.preventDefault();
  if (reduced) { latched = !latched; apply(); return; }
  holding = true; apply();
});
addEventListener('keyup', (e) => { if (e.code === 'Space') { e.preventDefault(); release(); } });
holdBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); latched = !latched; apply(); } });
latchBtn.addEventListener('click', () => { latched = !latched; holding = false; apply(); });
$('#run10').addEventListener('click', () => {
  stage.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
  latched = true; apply();
  if (!reduced) setTimeout(() => { if (latched) { latched = false; apply(); } }, 10000);
});
document.querySelectorAll('.biz button').forEach((el) => el.addEventListener('click', () => {
  const b = BUSINESSES.find((x) => x.id === /** @type {HTMLElement} */ (el).dataset.biz); if (b && b !== biz) setBiz(b);
}));

// ---------- consequences shown in the DOM ----------
let lastLanded = 0;
field.onEvent('stats', () => {
  for (const L of field.lanes ?? []) session[/** @type {keyof typeof session} */ (L.id)] = L.count;
  const n = field.stats.handled + field.stats.you;
  if (n !== lastLanded) { lastLanded = n; queueSession(); }
});
let sessT = 0;
function queueSession() { if (!sessT) sessT = window.setTimeout(() => { sessT = 0; renderSession(); }, 250); }
function renderSession() {
  const total = Object.values(session).reduce((a, b) => a + b, 0);
  for (const L of LANES) { const el = document.querySelector(`[data-n="${L.id}"]`); if (el) el.textContent = String(session[L.id]); }
  const s = $('#session');
  if (!ranOnce && total === 0) { s.innerHTML = 'You haven’t run it yet. <button type="button" class="link" id="run10">Run it for ten seconds</button>'; $('#run10').addEventListener('click', () => { stage.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }); latched = true; apply(); if (!reduced) setTimeout(() => { if (latched) { latched = false; apply(); } }, 10000); }); return; }
  s.innerHTML = `While the system ran, <b>${total}</b> messages were taken: <b>${session.site}</b> answered by the website, <b>${session.app}</b> booked or changed in the app, <b>${session.auto}</b> processed by automation, <b>${session.ai}</b> replied to by AI. <b>${session.you}</b> came to you, with the context attached.`;
}
field.onEvent('insight', (/** @type {string} */ t) => {
  $('#insight-t').textContent = t; insight.hidden = false; stage.classList.add('noticed'); insight.classList.add('out');
  requestAnimationFrame(() => requestAnimationFrame(() => insight.classList.remove('out')));
  live.textContent = 'Noticed: ' + t;
});
function hideInsight(/** @type {boolean} */ now) {
  stage.classList.remove('noticed');
  if (insight.hidden) return;
  if (now || reduced) { insight.hidden = true; return; }
  insight.classList.add('out'); setTimeout(() => { if (!field.on) insight.hidden = true; }, 360);
}
let statT = 0;
function renderStatus() {
  const w = field.waiting();
  const fmt = (m) => (m >= 60 ? `${Math.floor(m / 60)} h ${Math.round(m % 60)} min` : `${Math.round(m)} min`);
  statusEl.innerHTML = field.on
    ? `<b>${field.stats.handled}</b> handled · <b>${field.stats.you}</b> for you · waiting <b>${w.n}</b>`
    : `Waiting <b>${w.n}</b> · oldest <b class="${w.oldest > 25 ? 'hot' : ''}">${fmt(w.oldest)}</b>${field.stats.handled + field.stats.you ? ` · handled so far ${field.stats.handled}` : ''}`;
  holdBtn.style.setProperty('--p', String(field.on ? Math.min(1, field.onTime / 0.9) : 0));
}

// ---------- loop: fixed-step simulation, paused when not visible ----------
let acc = 0, last = performance.now();
function frame(/** @type {number} */ now) {
  if (!running) return;
  acc += Math.min(0.1, (now - last) / 1000); last = now;
  if (visible && !reduced) { let n = 0; while (acc >= 1 / 60 && n++ < 6) { field.step(); acc -= 1 / 60; } if (n >= 6) acc = 0; }
  else acc = 0;
  if (visible) field.draw();
  if ((statT += 1) % 6 === 0) renderStatus();
  requestAnimationFrame(frame);
}
new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (!visible) release(); }, { threshold: 0.05 }).observe(stage);
document.addEventListener('visibilitychange', () => { if (document.hidden) release(); last = performance.now(); });
new ResizeObserver(() => size()).observe(stage);
mq.addEventListener('change', () => location.reload());

// ---------- start (and deterministic test hooks: ?t= seconds fast-forward, ?on=1, ?onfor= seconds, ?freeze=1) ----------
await document.fonts.load(`600 13px InterV`).catch(() => {});
await document.fonts.ready;
size();
setBiz(biz);
const ff = (/** @type {number} */ s) => { for (let i = 0; i < Math.round(s * 60); i++) field.step(); };
if (Q.has('t')) ff(Number(Q.get('t')));
if (Q.get('on') === '1') { latched = true; apply(); ff(Number(Q.get('onfor') ?? 0)); }
if (Q.has('freeze')) running = false;
field.draw(); renderStatus(); syncControls();
// @ts-ignore test hook
window.__inb = { field, ff, set: (on) => { latched = on; holding = false; apply(); }, hold: (on) => { holding = on; apply(); }, draw: () => { field.draw(); renderStatus(); }, stop: () => (running = false) };
document.body.dataset.ready = '1';
if (running) requestAnimationFrame((t) => { last = t; frame(t); });
