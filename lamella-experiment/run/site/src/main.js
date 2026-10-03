import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource-variable/inter-tight/wght.css';
import './style.css';
import { World } from './world.js';
import { Timeline, TEXT_WINDOWS, HOLDS, clamp, lin, sstep } from './timeline.js';
import { Sound } from './audio.js';

const root = document.documentElement;
const mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const reduced = mqReduced.matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;
const isPortrait = () => window.innerWidth / window.innerHeight < 0.82;
if (reduced) root.classList.add('reduced');
if (finePointer) root.classList.add('has-cursor');

const canvas = document.getElementById('gl');
let world;
try {
  world = new World(canvas, { portrait: isPortrait(), reduced });
} catch (e) {
  root.classList.add('no-webgl', 'ready');
  console.warn('WebGL unavailable', e);
}
const tl = new Timeline();
if (world) tl.set(world.portrait, world.naveLen, world.naveZ);
const sound = new Sound();

// ------------------------------------------------------------------ DOM refs
const sections = [...document.querySelectorAll('.sec')];
const blocks = sections.map((s) => s.querySelector('.block'));
const rail = [...document.querySelectorAll('.rail li')];
const heroFoot = document.querySelector('.hero-foot');
const foot = document.querySelector('.foot');
const aperture = document.querySelector('.sec-aperture');
const works = [...document.querySelectorAll('.work')];
const worksBlock = document.querySelector('.works');
const rCount = document.getElementById('r-count');
const rMotion = document.getElementById('r-motion');
const cursorEl = document.querySelector('.cursor');
const cDot = document.querySelector('.c-dot');
const cRing = document.querySelector('.c-ring');
const fmt = new Intl.NumberFormat('en-US');
const lockQuality = new URLSearchParams(location.search).has('hq');

function syncCounts() {
  if (!world) return;
  const n = fmt.format(world.plateCount);
  rCount.textContent = n;
  document.querySelectorAll('.num, .a-count').forEach((el) => (el.textContent = n));
}
syncCounts();

// ------------------------------------------------------------------ scroll → t
let tops = [];
function measure() {
  const y = window.scrollY;
  tops = sections.map((s) => s.getBoundingClientRect().top + y);
  tops.push(Math.max(document.documentElement.scrollHeight - window.innerHeight, tops[tops.length - 1] + 1));
}
function rawT() {
  const y = window.scrollY;
  let i = 0;
  while (i < sections.length - 1 && y >= tops[i + 1]) i++;
  return clamp(i + (y - tops[i]) / Math.max(tops[i + 1] - tops[i], 1), 0, sections.length);
}
measure();

// critically damped follower — the environment has inertia, the document does not
let tS = rawT(), vS = 0;
const OMEGA = 6.2;

// ------------------------------------------------------------------ pointer
const P = { x: 0, y: -0.2, active: false, type: 'mouse', lastMove: 0 };
const head = { x: 0, y: -0.2, s: 0, px: 0, py: 0 };
let ring = { x: innerWidth / 2, y: innerHeight / 2 };
let rawPx = { x: innerWidth / 2, y: innerHeight / 2 };
let lastTrail = { x: 0, y: 0, t: 0 };
let par = { x: 0, y: 0, vx: 0, vy: 0 };
let energy = 0, speedS = 0;

function toNdc(cx, cy) { return [(cx / innerWidth) * 2 - 1, -((cy / innerHeight) * 2 - 1)]; }

window.addEventListener('pointermove', (e) => {
  [P.x, P.y] = toNdc(e.clientX, e.clientY);
  P.type = e.pointerType;
  rawPx.x = e.clientX; rawPx.y = e.clientY;
  if (e.pointerType === 'mouse') P.active = true;
  P.lastMove = performance.now();
  if (finePointer) {
    cDot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    cursorEl.classList.remove('out');
  }
}, { passive: true });
window.addEventListener('pointerdown', (e) => {
  [P.x, P.y] = toNdc(e.clientX, e.clientY);
  P.type = e.pointerType;
  P.active = true;
  if (e.pointerType !== 'mouse') { head.x = P.x; head.y = P.y; }
  cursorEl.classList.add('press');
}, { passive: true });
window.addEventListener('pointerup', (e) => {
  cursorEl.classList.remove('press');
  if (e.pointerType !== 'mouse') P.active = false;
}, { passive: true });
// touch: the finger keeps lighting the wall while it scrolls the page
const onTouch = (e) => {
  const tt = e.touches[0];
  if (!tt) return;
  [P.x, P.y] = toNdc(tt.clientX, tt.clientY);
  if (!P.active || P.type !== 'touch') { head.x = P.x; head.y = P.y; }
  P.type = 'touch'; P.active = true; P.lastMove = performance.now();
};
window.addEventListener('touchstart', onTouch, { passive: true });
window.addEventListener('touchmove', onTouch, { passive: true });
window.addEventListener('touchend', (e) => { if (!e.touches.length) P.active = false; }, { passive: true });
window.addEventListener('pointercancel', () => { if (P.type !== 'mouse') P.active = false; });
document.addEventListener('pointerleave', () => { P.active = false; cursorEl.classList.add('out'); });
document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) { P.active = false; cursorEl.classList.add('out'); } });
window.addEventListener('click', (e) => {
  if (!world || e.target.closest('a, button, input, .work')) return;
  const [x, y] = toNdc(e.clientX, e.clientY);
  world.ripple(x, y, clock, 1);
});
document.addEventListener('pointerover', (e) => {
  cursorEl.classList.toggle('link', !!e.target.closest('a, button, .work, input'));
});

// ------------------------------------------------------------------ works interaction
let manualWork = -1, manualFromIdx = -1;
works.forEach((w, i) => {
  const set = () => { manualWork = i; manualFromIdx = scrollWorkIdx; };
  w.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') set(); });
  w.addEventListener('focus', set);
  w.addEventListener('click', set);
});
worksBlock.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') manualWork = -1; });
let scrollWorkIdx = 0, shownWork = -1;
const apVars = {};
const setVar = (k, v) => { if (apVars[k] !== v) { apVars[k] = v; aperture.style.setProperty(k, v); } };

// ------------------------------------------------------------------ in-page navigation lands on each scene's reading position
document.querySelectorAll('a[data-t]').forEach((a) => a.addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: window.__lamella.yFor(+a.dataset.t), behavior: reduced ? 'auto' : 'smooth' });
}));

// ------------------------------------------------------------------ misc UI
document.getElementById('sound').addEventListener('click', (e) => {
  const on = sound.toggle();
  e.currentTarget.setAttribute('aria-pressed', String(on));
  e.currentTarget.querySelector('.sound-label').textContent = on ? 'Sound on' : 'Sound off';
});
document.getElementById('brief').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = e.currentTarget.space.value.trim();
  e.currentTarget.querySelector('.brief-ok').textContent = v
    ? 'Noted. A studio lead will reply within two working days.'
    : 'Tell us a little about the room first.';
  if (v && world) world.ripple(0, -0.1, clock, 1);
});

// ------------------------------------------------------------------ resize
let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    measure();
    if (world) {
      world.setPortrait(isPortrait());
      tl.set(world.portrait, world.naveLen, world.naveZ);
      world.resize();
      syncCounts();
    }
  }, 120);
});

// ------------------------------------------------------------------ reduced motion: discrete states
let rmIdx = -1, rmBusy = false;
function reducedTarget(tr) {
  const i = Math.min(Math.floor(tr + 0.08), HOLDS.length - 1);
  if (i !== rmIdx && !rmBusy) {
    if (rmIdx === -1) { rmIdx = i; tS = HOLDS[i]; return; }
    rmBusy = true;
    canvas.style.opacity = '0';
    setTimeout(() => {
      rmIdx = Math.min(Math.floor(rawT() + 0.08), HOLDS.length - 1);
      tS = HOLDS[rmIdx];
      canvas.style.opacity = '1';
      rmBusy = false;
    }, 380);
  }
}

// ------------------------------------------------------------------ frame loop
const camPos = [0, 0, 0], camTgt = [0, 0, 0];
let clock = 0, last = performance.now(), introStart = -1;
let frames = 0, ftAcc = 0, quality = 0, qCooldown = 0, readoutT = 0, motionShown = 0;
const start = performance.now();
let curSec = -1;

let jsMs = 0, jsMax = 0;
function frame(now) {
  const f0 = performance.now();
  const dtRaw = (now - last) / 1000;
  last = now;
  const dt = Math.min(dtRaw, 0.1);
  clock += dt;

  // ---- scroll follower
  const tr = rawT();
  if (reduced) {
    reducedTarget(tr);
    vS = 0;
  } else {
    const a = OMEGA * OMEGA * (tr - tS) - 2 * OMEGA * vS;
    vS += a * dt;
    vS = clamp(vS, -7, 7);
    tS += vS * dt;
    if (Math.abs(tr - tS) < 1e-5 && Math.abs(vS) < 1e-4) { tS = tr; vS = 0; }
  }
  const t = tS;
  const tText = reduced ? tS : tr;

  // ---- pointer follower: the head is quick (no perceptible lag); parallax is slow
  const kh = 1 - Math.exp(-dt * 24);
  const ox = head.x, oy = head.y;
  head.x += (P.x - head.x) * kh;
  head.y += (P.y - head.y) * kh;
  const idle = (performance.now() - P.lastMove) / 1000;
  const sTarget = P.active ? (P.type === 'mouse' ? 1 - 0.35 * clamp((idle - 3) / 6) : 1) : 0;
  head.s += (sTarget - head.s) * (1 - Math.exp(-dt * (P.active ? 6 : 1.6)));
  const asp = innerWidth / innerHeight;
  const mv = Math.hypot((head.x - ox) * asp, head.y - oy);
  const speed = mv / Math.max(dt, 1e-3);
  speedS += (speed - speedS) * (1 - Math.exp(-dt * 8));

  if (world) {
    // trail deposits — distance-spaced so slow and fast strokes read alike
    const dx = (head.x - lastTrail.x) * asp, dy = head.y - lastTrail.y;
    if (head.s > 0.05 && Math.hypot(dx, dy) > 0.035) {
      const s = clamp(0.3 + speedS * 0.22, 0.3, 1) * head.s;
      if (!reduced || true) world.pushTrail(head.x, head.y, clock, s);
      lastTrail = { x: head.x, y: head.y, t: clock };
    }

    // ---- camera
    let fov = tl.camera(t, camPos, camTgt);
    const kp = 1 - Math.exp(-dt * 2.4);
    const targetPx = P.active && P.type === 'mouse' && !reduced ? P.x : 0;
    const targetPy = P.active && P.type === 'mouse' && !reduced ? P.y : 0;
    par.x += (targetPx - par.x) * kp;
    par.y += (targetPy - par.y) * kp;
    const cam = world.camera;
    cam.position.set(camPos[0], camPos[1], camPos[2]);
    cam.lookAt(camTgt[0], camTgt[1], camTgt[2]);
    cam.updateMatrixWorld();
    const dist = Math.hypot(camTgt[0] - camPos[0], camTgt[1] - camPos[1], camTgt[2] - camPos[2]);
    const amp = clamp(dist / 30, 0.15, 1.2);
    cam.translateX(par.x * 1.1 * amp);
    cam.translateY(par.y * 0.55 * amp);
    cam.lookAt(camTgt[0], camTgt[1], camTgt[2]);
    if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }

    // ---- environment state
    const st = tl.state(t, cam.position.x);
    const u = world.u;

    // the wall makes room for the active text block (layout read happens before any DOM writes this frame)
    let safe = null;
    for (const b of blocks) if (b && b.classList.contains('on')) { safe = b; break; }
    if (safe) {
      const r = safe.getBoundingClientRect();
      u.uSafe.value.set((r.left / innerWidth) * 2 - 1, 1 - (r.bottom / innerHeight) * 2, (r.right / innerWidth) * 2 - 1, 1 - (r.top / innerHeight) * 2);
      u.uSafeAmt.value += (1 - u.uSafeAmt.value) * (1 - Math.exp(-dt * 4));
    } else {
      u.uSafeAmt.value += (0 - u.uSafeAmt.value) * (1 - Math.exp(-dt * 4));
    }
    u.uMorph.value = st.morph;
    u.uTextAmt.value = st.textAmt;
    world.showImage(st.image, clock);
    u.uWave.value = st.wave;
    u.uProc.value = st.proc;
    u.uProcAmt.value = st.procAmt;
    u.uOpen.value = st.open;
    u.uDay.value = st.day;
    u.uWorkAmt.value = st.workAmt;
    u.uScan.value = st.scan;
    u.uHorizon.value = st.horizon;
    u.uHorGlow.value = st.horGlow;
    u.uFogDen.value = st.fogDen;
    u.uSlots.value = st.slots;
    u.uPool.value = st.pool;
    u.uIdle.value = reduced ? 0 : 1;
    u.uSpark.value = st.spark;
    u.uRadius.value += (st.radius - u.uRadius.value) * (1 - Math.exp(-dt * 3));
    u.uScrollVel.value += (clamp(Math.abs(vS) * 0.07, 0, 0.35) - u.uScrollVel.value) * (1 - Math.exp(-dt * 5));
    u.uHead.value.set(head.x, head.y, head.s);
    u.uKeyDir.value.set(-0.45 + 1.45 * st.day, 0.62 - 0.42 * st.day, 0.64 - 0.64 * st.day).normalize();
    u.uFog.value.setRGB(0.012 + st.day * 0.85, 0.0095 + st.day * 0.55, 0.0075 + st.day * 0.33);
    world.bloom.strength = st.bloom;
    world.final.uniforms.uExposure.value = st.exposure;
    world.final.uniforms.uVignette.value = 0.55 - st.day * 0.3;

    // intro sweep
    if (introStart < 0 && clock > 0.15) {
      introStart = clock;
      root.classList.add('ready');
    }
    if (!reduced && introStart >= 0) {
      const k = clamp((clock - introStart - 0.55) / 2.9);
      u.uIntro.value = -0.3 + 1.7 * (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    }

    // works programme
    scrollWorkIdx = Math.min(3, Math.floor(lin(tText, 5.45, 6.05) * 4));
    if (manualWork >= 0 && P.type !== 'mouse' && scrollWorkIdx !== manualFromIdx) manualWork = -1;
    const wi = manualWork >= 0 ? manualWork : scrollWorkIdx;
    world.setWork(wi, clock);
    if (wi !== shownWork) { works.forEach((w, i) => w.classList.toggle('active', i === wi)); shownWork = wi; }

    // aperture DOM coupling
    setVar('--a1', st.a1.toFixed(3));
    setVar('--a2', st.a2.toFixed(3));
    setVar('--open', st.open.toFixed(3));
    setVar('--day', `${Math.round(sstep(st.day, 0.42, 0.62) * 100)}%`);


    // ---- motion energy (readout + sound)
    const frac = st.morph % 1;
    const flight = frac > 0.001 && frac < 0.999 ? Math.sin(Math.PI * frac) : 0;
    const target = clamp(0.012 + speedS * 0.05 * head.s + Math.abs(vS) * 0.25 + flight * 0.9 + st.wave * 0.35 + st.procAmt * 0.08 + st.workAmt * 0.18 + st.open * (1 - st.open) * 2.5 + (u.uIntro.value > -0.2 && u.uIntro.value < 1.2 ? 0.4 : 0));
    energy += ((reduced ? clamp(0.01 + speedS * 0.05 * head.s) : target) - energy) * (1 - Math.exp(-dt * 6));
    sound.update(energy, st.day, dt);

    world.update(clock, dt);
    world.render();

    // ---- adaptive quality (only ever steps down)
    frames++; ftAcc += dtRaw; qCooldown -= dtRaw;
    if (frames >= 60) {
      const avg = ftAcc / frames;
      if (!lockQuality && avg > 0.024 && quality < 3 && qCooldown <= 0 && clock > 3) {
        quality++; world.setQuality(quality); qCooldown = 2.5;
      }
      frames = 0; ftAcc = 0;
    }

    readoutT -= dt;
    if (readoutT <= 0) {
      readoutT = 0.12;
      const m = Math.round(world.plateCount * clamp(energy));
      motionShown += (m - motionShown) * 0.5;
      rMotion.textContent = fmt.format(Math.round(motionShown));
    }
  }

  // ---- DOM: text windows, rail, cursor ring
  const sec = clamp(Math.floor(tText + 0.02), 0, sections.length - 1);
  if (sec !== curSec) {
    rail.forEach((li, i) => { li.classList.toggle('on', i === sec); li.classList.toggle('past', i < sec); });
    curSec = sec;
  }
  for (const [i, a, b] of TEXT_WINDOWS) {
    const blk = blocks[i];
    const on = introStart >= 0 && clock > (reduced ? 0.2 : 1.05) && tText >= a && tText <= b;
    if (on !== blk.classList.contains('on')) {
      blk.classList.toggle('on', on);
      // exit in the direction of travel
      blk.classList.toggle('up', !on && tText > b);
    }
  }
  heroFoot.classList.toggle('on', introStart >= 0 && clock > 1.05 && tText < 0.25);
  heroFoot.classList.toggle('gone', tText >= 0.25);
  foot.classList.toggle('on', blocks[7].classList.contains('on'));

  if (finePointer) {
    const kr = 1 - Math.exp(-dt * 16);
    ring.x += (rawPx.x - ring.x) * kr;
    ring.y += (rawPx.y - ring.y) * kr;
    cRing.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
  }

  const f1 = performance.now() - f0;
  jsMs += (f1 - jsMs) * 0.05;
  jsMax = Math.max(jsMax * 0.995, f1);
  requestAnimationFrame(frame);
}

const go = () => requestAnimationFrame((n) => { last = n; requestAnimationFrame(frame); });
Promise.race([
  Promise.all([
    document.fonts.load('700 40px "Inter Tight Variable"'),
    document.fonts.load('400 40px "Instrument Serif"'),
  ]),
  new Promise((r) => setTimeout(r, 1500)),
]).then(() => {
  if (world) { world.image.current = null; world.image.show('hello'); world.image.lastShown = null; world.image.show('hello'); }
  go();
});

// expose for verification tooling
window.__lamella = {
  get t() { return tS; },
  get world() { return world; },
  get quality() { return quality; },
  get perf() { return { jsMs, jsMax }; },
  yFor(t) { measure(); const i = Math.min(Math.floor(t), sections.length - 1); return tops[i] + (t - i) * (tops[i + 1] - tops[i]); },
};
