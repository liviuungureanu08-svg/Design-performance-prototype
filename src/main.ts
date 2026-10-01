import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import './style.css';

import { Engine } from './gl/engine';
import { Director } from './gl/director';
import { SmoothDamp, clamp01, readScrollProgress, smoothstep } from './scroll';
import { beatAt } from './timeline';
import { Copy } from './typography';

const params = new URLSearchParams(location.search);
const debug = params.has('debug') || params.has('u');
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const copies = [new Copy($('copy-0')), new Copy($('copy-1')), new Copy($('copy-2')), new Copy($('copy-3'))];
const chapter = $('chapter');
const hint = $('hint');
const meter = $('meter');
const NAMES = ['I · Before', 'II · Within', 'III · Held', 'IV · Now'];

/* --- renderer, with a graceful static fallback ------------------------- */
let eng: Engine | null = null;
let director: Director | null = null;
if (params.get('fallback') !== '1') {
  try {
    eng = new Engine($<HTMLCanvasElement>('gl'));
    director = new Director(eng);
    eng.raw = params.has('raw');
    if (params.has('scene')) director.debug = { scene: Number(params.get('scene')), z: Number(params.get('z') ?? 0) };
    $<HTMLCanvasElement>('gl').addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      eng = null;
      director = null;
      document.body.classList.add('no-gl');
    });
  } catch (err) {
    console.warn('WebGL unavailable, using the static poster.', err);
    eng = null;
    director = null;
  }
}
if (!eng) document.body.classList.add('no-gl');

function resize(): void {
  eng?.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

/* --- input -------------------------------------------------------------- */
const smooth = new SmoothDamp(readScrollProgress(), 0.5);
let override: number | null = params.has('u') ? Number(params.get('u')) : null;
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
    info: () => ({ scale: eng?.renderScale ?? 0, memory: eng ? { ...eng.renderer.info.memory } : null, fallback: !eng }),
  };
}

/* --- adaptive resolution: keep the frame rate honest on weak GPUs -------- */
let slow = 0;
let fast = 0;
function adapt(dt: number): void {
  if (!eng) return;
  if (dt > 1 / 24) slow += dt;
  else slow = Math.max(0, slow - dt * 0.5);
  if (dt < 1 / 52) fast += dt;
  else fast = Math.max(0, fast - dt * 2);
  if (slow > 1.4 && eng.renderScale > 0.5) {
    eng.setScale(Math.max(0.5, eng.renderScale - 0.1));
    slow = 0;
  } else if (fast > 6 && eng.renderScale < 0.85) {
    eng.setScale(Math.min(0.85, eng.renderScale + 0.05));
    fast = 0;
  }
}

/* --- frame loop --------------------------------------------------------- */
const t0 = performance.now();
let last = t0;
let started = false;

function frame(now: number): void {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  const time = (now - t0) / 1000;
  const target = override ?? readScrollProgress();
  const u = override ?? smooth.step(target, dt);
  pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
  pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);
  const beat = beatAt(u);

  if (eng && director) {
    const k = reduceMotion ? 0.25 : 1;
    // the eye stills during the big events so the transformation, not the camera, is the subject
    const calm = 1 - 0.7 * (beat.tr >= 0 ? Math.sin(Math.PI * clamp01(beat.s)) : 0);
    const look = params.has('cx')
      ? { camX: Number(params.get('cx')), camY: Number(params.get('cy') ?? 0), time }
      : { camX: (pointer.sx * 0.5 + Math.sin(time * 0.21) * 0.08) * k * calm, camY: (-pointer.sy * 0.3 + Math.cos(time * 0.17) * 0.05) * k * calm, time };
    director.render(beat, look);
    adapt(dt);
  }

  // typography: in on arrival, out as the next event begins; silence in between
  const intro = clamp01((now - t0 - 600) / 1700);
  copies[0].update(intro, smoothstep(0.075, 0.125, u));
  copies[1].update(smoothstep(0.285, 0.33, u), smoothstep(0.385, 0.425, u));
  copies[2].update(smoothstep(0.625, 0.67, u), smoothstep(0.715, 0.755, u));
  copies[3].update(smoothstep(0.93, 0.975, u), 0);

  const idx = beat.tr < 0 ? beat.scene : beat.p > 0.5 ? beat.scene + 1 : beat.scene;
  if (chapter.dataset.i !== String(idx)) {
    chapter.dataset.i = String(idx);
    chapter.textContent = NAMES[idx];
  }
  hint.style.opacity = u > 0.012 ? '0' : '1';
  meter.style.transform = `scaleX(${u.toFixed(4)})`;

  if (!started) {
    started = true;
    document.body.classList.add('ready');
  }
  requestAnimationFrame(frame);
}

function start(): void {
  requestAnimationFrame(frame);
}
if (eng) eng.initText('NOW', 0.46, 1).then(start, start);
else start();

window.addEventListener('pagehide', () => eng?.dispose());
