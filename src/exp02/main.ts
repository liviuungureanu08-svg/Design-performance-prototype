import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './style.css';
import { buildField, buildLevels } from './terrain';
import { makePrint, poster } from './print';
import { Stage } from './scene';
import { pose } from './choreo';
import { SmoothDamp } from '../scroll';

const params = new URLSearchParams(location.search);
const debug = params.has('debug') || params.has('u');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = Math.min(screen.width, screen.height) < 820 || matchMedia('(pointer: coarse)').matches;
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

await Promise.all([document.fonts.load("400 40px 'Instrument Serif'"), document.fonts.load("italic 400 40px 'Instrument Serif'")]).catch(() => {});
const field = buildField();
const levels = buildLevels(field);
const print = makePrint(field, levels, mobile ? 3072 : 4096);

let stage: Stage | null = null;
if (params.get('fallback') !== '1') {
  try {
    stage = new Stage($<HTMLCanvasElement>('gl'), field, levels, print, mobile);
    stage.resize(window.innerWidth, window.innerHeight);
    $<HTMLCanvasElement>('gl').addEventListener('webglcontextlost', (e) => { e.preventDefault(); stage = null; fallback(); });
  } catch (err) {
    console.warn('WebGL unavailable, showing the printed sheet.', err);
    stage = null;
  }
}
function fallback(): void {
  document.body.classList.add('no-gl');
  const p = poster(print);
  const host = $('poster');
  p.setAttribute('aria-label', 'The Vale of Orrin — printed survey sheet');
  host.replaceChildren(p);
}
if (!stage) fallback();

let resizeTimer = 0;
window.addEventListener('resize', () => {
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => { stage?.resize(window.innerWidth, window.innerHeight); sizeKey = `${window.innerWidth}x${window.innerHeight}`; }, 100);
});

const readProgress = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
};
// the plinth leaves are heavy and answer late; the summit leaves are light and quick; light and camera in between
const k = reduceMotion ? 0.25 : 1;
const sH = new SmoothDamp(readProgress(), 0.8 * k), sL = new SmoothDamp(readProgress(), 0.36 * k), sM = new SmoothDamp(readProgress(), 0.55 * k);
let override: number | null = params.has('u') ? Number(params.get('u')) : null;
window.addEventListener('pageshow', () => [sH, sL, sM].forEach((s) => s.snap(readProgress())));
if (debug) {
  (window as unknown as Record<string, unknown>).__lab = {
    set(u: number | null) { override = u; if (u !== null) [sH, sL, sM].forEach((s) => s.snap(u)); },
    stage,
    info: () => ({ memory: stage ? { ...stage.renderer.info.memory } : null, calls: stage?.renderer.info.render.calls, tris: stage?.renderer.info.render.triangles, fallback: !stage }),
  };
}

const hint = $('hint');
let lastKey = '', sizeKey = '';
let last = performance.now();
function frame(now: number): void {
  const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
  last = now;
  const target = override ?? readProgress();
  const uH = override ?? sH.step(target, dt), uL = override ?? sL.step(target, dt), uM = override ?? sM.step(target, dt);
  // render only when something moved (a still page costs nothing)
  const key = `${uM.toFixed(5)}|${uH.toFixed(5)}|${uL.toFixed(5)}|${sizeKey}`;
  if (stage && key !== lastKey) { stage.render(pose(uM, uH, uL)); lastKey = key; }
  hint.style.opacity = uM > 0.01 ? '0' : '1';
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.addEventListener('pagehide', () => stage?.dispose());
