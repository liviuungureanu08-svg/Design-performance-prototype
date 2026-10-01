// Motion Proof page: one scroll-driven, deterministic sequence. visual state = f(progress); the image converges
// whenever the viewer stops (a still is as clean as the static endpoints), and stays light while they scroll.
import * as THREE from 'three';
import { SmoothDamp } from '../scroll';
import { Stage, type SceneId } from './scene';
import { choreo } from './motion';

type Shot = (id: SceneId, aspect: number) => { pos: THREE.Vector3; target: THREE.Vector3; fov: number };

export function runMotion(shot: Shot, params: URLSearchParams, typeHtml: string, over: Record<string, number>): void {
  const body = document.body;
  body.dataset.view = 'motion';
  const host = document.getElementById('views')!;
  const el = document.createElement('figure');
  el.className = 'cell scene-motion';
  el.innerHTML = `<canvas></canvas><div class="type">${typeHtml}</div><div class="hint">Scroll</div>`;
  host.append(el);
  const runway = document.createElement('div');
  runway.id = 'runway';
  body.append(runway);
  const canvas = el.querySelector('canvas')!;
  const hint = el.querySelector<HTMLElement>('.hint')!;

  const spp = Number(params.get('spp') ?? 96);
  const mpp = Number(params.get('mpp') ?? 2); // passes per frame while moving
  const fixed = params.has('t') ? Math.min(1, Math.max(0, Number(params.get('t')))) : null;
  if (fixed !== null) body.classList.add('frozen');
  // investigator offset (look-dev override: ?off=dx,dy,dz,tx,ty)
  const off = (params.get('off') ?? '-0.95,0.32,-0.7,0.12,0.06').split(',').map(Number);

  const gl = document.createElement('canvas');
  let stage: Stage;
  try {
    stage = new Stage(gl, { spp, params: over });
    stage.initMotion();
  } catch (e) {
    console.warn('WebGL unavailable', e);
    el.classList.add('no-gl');
    return;
  }
  const P = stage.params;

  const progress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  };
  const camAt = (p: number, aspect: number) => {
    const s = shot('a', aspect), k = choreo(p, P).cam;
    s.pos.add(new THREE.Vector3(off[0], off[1], off[2]).multiplyScalar(k));
    s.target.add(new THREE.Vector3(off[3], off[4], 0).multiplyScalar(k));
    return s;
  };

  let aspect = 1;
  const size = () => {
    const r = el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    aspect = r.width / r.height;
    stage.resize(r.width, r.height);
    lastP = -1;
  };
  let lastP = -1;
  size();
  let rt = 0;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(size, 120); });

  // smoothing: restrained, only enough to give the band mass (≈0.25 s); snapped on load / bfcache restore
  const smooth = new SmoothDamp(fixed ?? progress(), 0.26);
  window.addEventListener('pageshow', () => smooth.snap(progress()));
  let last = performance.now(), moving = false, stillSince = 0;
  const ctx = canvas.getContext('2d')!;

  function tick(now: number): void {
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const p = fixed ?? smooth.step(progress(), dt);
    if (lastP < 0 || Math.abs(p - lastP) > 2e-5) {
      stage.setProgress(p);
      stage.aim(camAt(p, aspect));
      if (lastP < 0 || fixed !== null) stage.restart(); else stage.soften();
      moving = lastP >= 0 && fixed === null;
      stillSince = now;
      lastP = p;
      body.style.setProperty('--prog', p.toFixed(4));
      hint.style.opacity = p > 0.015 ? '0' : '';
      delete body.dataset.done;
    } else if (moving && now - stillSince > 220) {
      stage.restart(); // the viewer stopped: converge a clean still from here
      moving = false;
    }
    if (!stage.done) {
      stage.step(moving ? mpp : 2);
      ctx.drawImage(gl, 0, 0, canvas.width, canvas.height);
      el.style.setProperty('--p', String(moving ? 0 : stage.progress));
      el.classList.toggle('converged', !moving && stage.done);
    }
    if (!moving && stage.done) body.dataset.done = '1';
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  (window as unknown as Record<string, unknown>).__exp03 = { stage, done: () => body.dataset.done === '1', progress: () => lastP };
}
