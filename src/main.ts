import * as THREE from 'three';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import './style.css';
import { Engine } from './flagship/engine';
import { SmoothDamp } from './scroll';
import { smooth } from './flagship/curve';

const params = new URLSearchParams(location.search);
const debug = params.has('debug') || params.has('u');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

let eng: Engine | null = null;
if (params.get('fallback') !== '1') {
  try {
    eng = new Engine($<HTMLCanvasElement>('gl'));
    eng.setRaw(params.has('raw'));
    if (params.has('cam')) eng.camOverride = params.get('cam')!.split(',').map(Number);
    eng.resize(window.innerWidth, window.innerHeight);
    $<HTMLCanvasElement>('gl').addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      eng = null;
      document.body.classList.add('no-gl');
    });
  } catch (err) {
    console.warn('WebGL2 unavailable, using the static poster.', err);
    eng?.dispose();
    eng = null;
  }
}
if (!eng) document.body.classList.add('no-gl');

let resizeTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => eng?.resize(window.innerWidth, window.innerHeight), 120);
});

const readProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
};
// scroll = intent; each mass answers with its own inertia (heavy slab lags, light slab and glass are quick)
const sU = new SmoothDamp(readProgress(), 0.42);
const sL = new SmoothDamp(readProgress(), 0.85);
const sR = new SmoothDamp(readProgress(), 0.5);
const sC = new SmoothDamp(readProgress(), 0.65);
const sF = new SmoothDamp(readProgress(), 0.38);
let override: number | null = params.has('u') ? Number(params.get('u')) : null;
window.addEventListener('pageshow', () => [sU, sL, sR, sC, sF].forEach((s) => s.snap(readProgress())));

if (debug) {
  (window as unknown as Record<string, unknown>).__lab = {
    set(u: number | null) {
      override = u;
      if (u !== null) [sU, sL, sR, sC, sF].forEach((s) => s.snap(u));
    },
    world: eng?.world,
    info: () => ({ scale: eng?.renderScale ?? 0, memory: eng ? { ...eng.renderer.info.memory } : null, fallback: !eng }),
  };
}

let slow = 0, fast = 0;
function adapt(dt: number): void {
  if (!eng || params.has('noadapt')) return;
  if (dt > 1 / 24) slow += dt; else slow = Math.max(0, slow - dt * 0.5);
  if (dt < 1 / 52) fast += dt; else fast = Math.max(0, fast - dt * 2);
  if (slow > 1.4 && eng.renderScale > 0.5) { eng.setScale(Math.max(0.5, eng.renderScale - 0.1)); slow = 0; }
  else if (fast > 6 && eng.renderScale < 1) { eng.setScale(Math.min(1, eng.renderScale + 0.05)); fast = 0; }
}

const t0 = performance.now();
let last = t0;
const drift = new THREE.Vector3();
const end = $('end');
const hint = $('hint');

function frame(now: number): void {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  const target = override ?? readProgress();
  let u: number, uL: number, uR: number, uC: number, uF: number;
  if (override !== null) u = uL = uR = uC = uF = override;
  else {
    u = sU.step(target, dt); uL = sL.step(target, dt); uR = sR.step(target, dt); uC = sC.step(target, dt); uF = sF.step(target, dt);
  }
  if (eng) {
    // the camera is nearly still while the object is being understood; a hair of life only during the stills
    const k = reduceMotion || params.has('u') ? 0 : 1;
    const calm = 1 - smooth(0.2, 0.5, u) * 0.8 - smooth(0.88, 0.97, u) * 0.2;
    const tt = (now - t0) / 1000;
    drift.set(Math.sin(tt * 0.23) * 0.05, Math.cos(tt * 0.19) * 0.03, 0).multiplyScalar(k * Math.max(0, calm) * (1 - smooth(0.5, 0.7, u)));
    eng.render(u, { L: uL, R: uR, C: uC, F: uF }, tt, drift);
    adapt(dt);
  }
  end.classList.toggle('on', u > 0.945);
  hint.style.opacity = u > 0.01 ? '0' : '1';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.addEventListener('pagehide', () => eng?.dispose());
