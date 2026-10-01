import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import '@fontsource-variable/inter';
import './style.css';

import { Engine } from './gl/engine';
import { Director } from './gl/director';
import { SmoothDamp, readScrollProgress } from './scroll';
import { beatAt } from './timeline';

const params = new URLSearchParams(location.search);
const debug = params.has('debug');
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const canvas = $<HTMLCanvasElement>('gl');
const eng = new Engine(canvas);
const director = new Director(eng);
eng.raw = params.has('raw');
if (params.has('scene')) director.debug = { scene: Number(params.get('scene')), z: Number(params.get('z') ?? 0) };

function resize(): void {
  eng.resize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resize);
resize();

const smooth = new SmoothDamp(readScrollProgress(), 0.5);
let override: number | null = params.has('u') ? Number(params.get('u')) : null;
const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
window.addEventListener('pointermove', (e) => {
  pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
  pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
});
window.addEventListener('pageshow', () => smooth.snap(readScrollProgress()));

if (debug || params.has('u')) {
  (window as unknown as Record<string, unknown>).__lab = {
    set(u: number | null) {
      override = u;
      if (u !== null) smooth.snap(u);
    },
  };
}

const t0 = performance.now();
let last = t0;
function frame(now: number): void {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  const time = (now - t0) / 1000;
  const target = override ?? readScrollProgress();
  const u = override ?? smooth.step(target, dt);
  pointer.sx += (pointer.x - pointer.sx) * Math.min(1, dt * 3);
  pointer.sy += (pointer.y - pointer.sy) * Math.min(1, dt * 3);
  const beat = beatAt(u);
  director.render(beat, params.has('cx') ? { camX: Number(params.get('cx')), camY: Number(params.get('cy') ?? 0), time } : { camX: pointer.sx * 0.5 + Math.sin(time * 0.21) * 0.08, camY: -pointer.sy * 0.3 + Math.cos(time * 0.17) * 0.05, time });
  requestAnimationFrame(frame);
}
eng.initText('NOW', 0.46, 1).then(() => requestAnimationFrame(frame));

window.addEventListener('pagehide', () => eng.dispose());
