import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import './style.css';

import { paintEmber, paintTide } from './art/scenes';
import { CinematicTransition, type Quality } from './gl/transition';
import { SmoothDamp, clamp01, readScrollProgress, smoothstep } from './scroll';
import { Copy } from './typography';

const params = new URLSearchParams(location.search);
const quality: Quality = params.get('q') === 'balanced' ? 'balanced' : 'premium';
const debug = params.has('debug');

/** Scroll progress (0..1 over the whole runway) -> transformation progress. */
const T_START = 0.12;
const T_SPAN = 0.73;
const toT = (u: number) => -0.12 + 1.12 * clamp01((u - T_START) / T_SPAN);

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const art = { a: paintEmber(), b: paintTide() };
const copyA = new Copy($('copy-a'));
const copyM = new Copy($('copy-m'));
const copyB = new Copy($('copy-b'));
const chapter = $('chapter');
const hint = $('hint');
const meter = $('meter');

/* --- renderer, with a graceful static fallback ------------------------- */
let gl: CinematicTransition | null = null;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function enableFallback(): void {
  document.body.classList.add('no-gl');
  (['fb-a', 'fb-b'] as const).forEach((id, i) => {
    const c = $<HTMLCanvasElement>(id);
    const src = i === 0 ? art.a.color : art.b.color;
    c.width = src.width;
    c.height = src.height;
    c.getContext('2d')!.drawImage(src, 0, 0);
  });
}

if (!reduceMotion && params.get('fallback') !== '1') {
  try {
    const canvas = $<HTMLCanvasElement>('gl');
    gl = new CinematicTransition(canvas, art.a, art.b, quality);
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      gl = null;
      enableFallback();
    });
  } catch (err) {
    console.warn('WebGL transition unavailable, using static fallback.', err);
    gl = null;
  }
}
if (!gl) enableFallback();

function resize(): void {
  gl?.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

/* --- input -------------------------------------------------------------- */
const smooth = new SmoothDamp(readScrollProgress(), 0.42);
let override: number | null = null;
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
});
window.addEventListener('pageshow', () => smooth.snap(readScrollProgress()));

if (debug) {
  (window as unknown as Record<string, unknown>).__lab = {
    set(u: number | null) {
      override = u;
      if (u !== null) smooth.snap(u);
    },
    info: () => ({ shards: gl?.shardCount ?? 0, quality, fallback: !gl, memory: gl ? { ...gl.renderer.info.memory } : null }),
  };
}

/* --- frame loop --------------------------------------------------------- */
const t0 = performance.now();
let last = t0;
let velT = 0;
let chapterIdx = 0;

function frame(now: number): void {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  const time = (now - t0) / 1000;

  const target = override ?? readScrollProgress();
  const u = override ?? smooth.step(target, dt);
  const t = toT(u);
  velT += ((smooth.velocity * 1.12) / T_SPAN - velT) * Math.min(1, dt * 10);

  pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
  pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);
  const flight = Math.sin(Math.PI * clamp01((t + 0.0) / 1.0)); // calm the camera mid-flight
  const calm = 1 - 0.55 * flight;

  if (gl) {
    gl.render({
      t,
      vel: override !== null ? 0 : velT,
      camX: (pointer.sx * 0.17 + Math.sin(time * 0.23) * 0.02) * calm,
      camY: (-pointer.sy * 0.09 + Math.cos(time * 0.19) * 0.012 - (u - 0.5) * 0.05) * calm,
      time,
    });
  } else {
    const mixB = smoothstep(0.32, 0.62, u);
    $('fb-b').style.opacity = String(mixB);
    $('fb-a').style.transform = `scale(${1 + u * 0.06})`;
    $('fb-b').style.transform = `scale(${1.06 - mixB * 0.06})`;
  }

  const intro = clamp01((now - t0 - 500) / 1700);
  copyA.update(intro, smoothstep(0.05, 0.17, u));
  copyM.update(smoothstep(0.43, 0.52, u), smoothstep(0.58, 0.67, u));
  copyB.update(smoothstep(0.86, 0.98, u), 0);

  const idx = u > 0.5 ? 1 : 0;
  if (idx !== chapterIdx) {
    chapterIdx = idx;
    chapter.textContent = idx ? 'Ch. 02 — Tide' : 'Ch. 01 — Ember';
  }
  hint.style.opacity = u > 0.015 ? '0' : '1';
  meter.style.transform = `scaleX(${u.toFixed(4)})`;

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* --- lifecycle ---------------------------------------------------------- */
if (import.meta.hot) import.meta.hot.dispose(() => gl?.dispose());
window.addEventListener('pagehide', () => gl?.dispose());
