import './style.css';
import { SmoothDamp } from '../scroll';
import { World } from './scene';
import stillA from './still-a.jpg';
import stillB from './still-b.jpg';
import stillATall from './still-a-tall.jpg';
import stillBTall from './still-b-tall.jpg';

// state = f(progress). Scroll (or the toggle in reduced motion) sets progress; the frame is a pure function of it.
const qs = new URLSearchParams(location.search);
const FORCE_P = qs.has('p') ? Number(qs.get('p')) : null;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches || qs.get('motion') === 'reduced';
const $ = <T extends HTMLElement>(s: string) => document.querySelector(s) as T;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const sstep = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };

const track = $('#track'), stage = $('.stage'), canvas = $<HTMLCanvasElement>('#gl');
const cue = $('#cue'), caption = $('#caption'), panel = $('#panel'), toggle = $('#toggle'), fallback = $('#fallback');
document.body.classList.toggle('reduced', REDUCED);
const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 760;

function webgl2(): boolean { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } }

let P = FORCE_P ?? 0, target = P, world: World | null = null, built = '', ptr = { x: 0, y: 0 }, ptrT = { x: 0, y: 0 }, t0 = performance.now(), raf = 0;
const damp = new SmoothDamp(P, 0.34);
let vw = 0, vh = 0;

function setUI(p: number) {
  const pa = clamp(1 - sstep(0.02, 0.07, p));
  cue.style.opacity = String(pa);
  caption.style.opacity = String(sstep(0.3, 0.36, p) * (1 - sstep(0.54, 0.62, p)));
  const pn = sstep(0.82, 0.92, p);
  panel.style.opacity = String(pn); panel.style.visibility = pn < 0.02 ? 'hidden' : 'visible'; panel.style.transform = `translateY(${(1 - pn) * 14}px)`;
  toggle.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String((Number(b.dataset.p) > 0.5) === (p > 0.5))));
  document.body.dataset.p = p.toFixed(3);
}

function sizeAll() {
  vw = stage.clientWidth; vh = stage.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, coarse ? 1.75 : 2);
  world?.resize(vw, vh, dpr);
}

async function ensureBuilt() {
  if (!world) return;
  const aspect = vw / vh; const key = aspect >= 0.95 ? 'wide' : 'tall';
  if (built !== key) { built = key; await world.build(aspect); }
  world.aspect = aspect;
}

function frame() {
  raf = 0;
  if (!world) return;
  const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000); last = now;
  let busy = false;
  if (FORCE_P === null && !REDUCED) {
    target = scrollP();
    const v = damp.step(target, dt); P = v; if (Math.abs(v - target) > 0.0008 || Math.abs(damp.velocity) > 0.004) busy = true; else { P = target; damp.snap(target); }
  } else if (REDUCED) { P = damp.value = target; }
  // pointer parallax, eased
  ptr.x += (ptrT.x - ptr.x) * Math.min(1, dt * 5); ptr.y += (ptrT.y - ptr.y) * Math.min(1, dt * 5);
  if (Math.abs(ptrT.x - ptr.x) + Math.abs(ptrT.y - ptr.y) > 0.002) busy = true;
  // the page "settles in" once on load: a short sway that shows its edges had thickness
  const age = (now - t0) / 1000; let sway = 0;
  if (!REDUCED && FORCE_P === null && age < 2.6) { sway = Math.pow(Math.sin(Math.PI * clamp((age - 0.5) / 2.1)), 2); busy = true; }
  setUI(P);
  world.render(P, ptr, sway);
  document.body.dataset.done = '1';
  if (busy) schedule();
}
let last = performance.now();
function schedule() { if (!raf) raf = requestAnimationFrame(frame); }

function scrollP(): number {
  if (REDUCED) return target;
  const r = track.getBoundingClientRect();
  const total = r.height - vh;
  return clamp(-r.top / Math.max(1, total));
}

async function boot() {
  if (!webgl2() || qs.has('nogl')) { return showFallback(); }
  try {
    world = new World(canvas, coarse ? 'low' : 'high', { ly: Number(qs.get('ly') ?? 46), lp: Number(qs.get('lp') ?? 26), yaw: qs.has('yaw') ? Number(qs.get('yaw')) : undefined, pitch: qs.has('pitch') ? Number(qs.get('pitch')) : undefined, zoom: qs.has('zoom') ? Number(qs.get('zoom')) : undefined });
  } catch { return showFallback(); }
  sizeAll();
  if (document.fonts) { await Promise.all(['400 40px "Instrument Serif"', '400 20px "Inter Variable"', '500 20px "Inter Variable"'].map((f) => document.fonts.load(f).catch(() => null))); }
  await ensureBuilt();
  (window as any).__exp04 = { world, setP: (p: number) => { target = p; P = p; damp.snap(p); if (FORCE_P === null && !REDUCED) { scrollTo(0, p * (track.offsetHeight - vh) + track.offsetTop); } schedule(); }, get P() { return P; } };
  schedule();
}

function showFallback() {
  document.body.classList.add('nogl');
  canvas.hidden = true; fallback.hidden = false;
  const tall = stage.clientWidth / stage.clientHeight < 0.95 ? '-tall' : '';
  const urlOf = (n: 'a' | 'b') => (tall ? (n === 'a' ? stillATall : stillBTall) : n === 'a' ? stillA : stillB);
  fallback.innerHTML = `<img alt="A website hero for Gabriel Solutions, and the same page seen from the side: every element is the front face of a deep body." src="${urlOf('a')}" id="fbimg">`;
  const setFb = (p: number) => { ($('#fbimg') as HTMLImageElement).src = urlOf(p > 0.5 ? 'b' : 'a'); setUI(p); };
  toggle.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button'); if (b) setFb(Number(b.dataset.p)); });
  document.body.classList.add('reduced'); track.style.height = '100svh'; setFb(0); document.body.dataset.done = '1';
}

addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', async () => { sizeAll(); await ensureBuilt(); schedule(); });
addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; ptrT.x = (e.clientX / innerWidth) * 2 - 1; ptrT.y = (e.clientY / innerHeight) * 2 - 1; schedule(); }, { passive: true });
addEventListener('keydown', (e) => { if (REDUCED && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { target = e.key === 'ArrowRight' ? 1 : 0; schedule(); } });
toggle.addEventListener('click', (e) => { const b = (e.target as HTMLElement).closest('button'); if (!b || !world) return; target = Number(b.dataset.p); P = target; damp.snap(target); schedule(); });
if (REDUCED) { track.style.height = '100svh'; }
boot();
