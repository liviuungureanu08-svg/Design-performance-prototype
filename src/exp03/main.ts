import '@fontsource-variable/inter';
import './style.css';
import * as THREE from 'three';
import { Stage, type SceneId } from './scene';
import { runMotion } from './motion-page';

// Review page. ?view = motion (default: the scroll-driven Motion Proof, see motion-page.ts) | a | b | ab | sil (the static
// endpoints, unchanged). ?spp = passes per image. Static views: each image is rendered once, converges, and the GPU stops.
const params = new URLSearchParams(location.search);
const view = (params.get('view') ?? 'motion') as 'motion' | 'a' | 'b' | 'ab' | 'sil';
const spp = Number(params.get('spp') ?? 128);
const $ = (id: string) => document.getElementById(id)!;

const VIEWS: [string, string][] = [['motion', 'Motion'], ['a', 'A · The Unbuilt'], ['b', 'B · Built'], ['ab', 'A / B'], ['sil', 'Silhouette']];
$('review').innerHTML = VIEWS.map(([k, l]) => `<a href="?view=${k}"${k === view ? ' aria-current="page"' : ''}>${l}</a>`).join('');

/** one camera for both endpoints (same place, same lens): only the world changes. ~60 mm (vertical FOV 22.6°), eye level */
export function shot(_id: SceneId, aspect: number): { pos: THREE.Vector3; target: THREE.Vector3; fov: number } {
  const o = params.get('cam')?.split(',').map(Number);
  if (o) return { pos: new THREE.Vector3(o[0], o[1], o[2]), target: new THREE.Vector3(o[3], o[4], o[5]), fov: o[6] ?? 22.6 };
  if (aspect >= 1) {
    // landscape: hero right of centre, negative space left for the type; keep the object's width on narrow-landscape
    const fov = aspect >= 1.5 ? 22.6 : 2 * Math.atan(Math.tan(11.3 * Math.PI / 180) * 1.5 / aspect) * 180 / Math.PI;
    return { pos: new THREE.Vector3(0.1, 1.5, 10.6), target: new THREE.Vector3(0.6, 1.22, 0), fov };
  }
  // portrait: same lens position, vertical FOV opened until the object's width fits; object high, type on the floor below
  const fov = 2 * Math.atan(Math.min(0.62, Math.tan(11.3 * Math.PI / 180) * 0.86 / aspect)) * 180 / Math.PI;
  return { pos: new THREE.Vector3(0.95, 1.45, 10.6), target: new THREE.Vector3(0.95, 0.95, 0), fov };
}

const TYPE: Record<SceneId, string> = {
  a: '<div class="brand">Gabriel Solutions</div><h1 class="thesis">Imagination<br>becomes structure.</h1>',
  b: '<div class="brand">Gabriel Solutions</div><h1 class="thesis">Imagination<br>becomes structure.</h1>',
};

// ?p=key:value,... overrides design parameters (look-dev only)
const over = Object.fromEntries((params.get('p') ?? '').split(',').filter(Boolean).map((kv) => { const [k, v] = kv.split(':'); return [k, Number(v)]; }));
if (view === 'motion') runMotion(shot, params, TYPE.a, over);
else staticReview();

function staticReview(): void {
  interface Cell { id: SceneId; canvas: HTMLCanvasElement; el: HTMLElement }
  const cells: Cell[] = [];
  const host = $('views');
  document.body.dataset.view = view;
  const ids: SceneId[] = view === 'ab' ? ['a', 'b'] : view === 'b' ? ['b'] : ['a'];
  for (const id of view === 'sil' ? ((params.get('only') ? [params.get('only')] : ['a', 'b']) as SceneId[]) : ids) {
    const el = document.createElement('figure');
    el.className = `cell scene-${id}`;
    el.innerHTML = `<canvas></canvas>${view === 'sil' ? `<figcaption>${id.toUpperCase()}</figcaption>` : `<div class="type">${TYPE[id]}</div>`}`;
    host.append(el);
    cells.push({ id, canvas: el.querySelector('canvas')!, el });
  }

  const gl = document.createElement('canvas');
  let stage: Stage | null = null;
  try { stage = new Stage(gl, { silhouette: view === 'sil', clay: params.has('clay'), spp: view === 'sil' ? 1 : spp, params: over }); } catch (e) { console.warn('WebGL unavailable', e); }

  let queue: Cell[] = [];
  let cur: Cell | null = null;
  function start(): void {
    if (!stage) return;
    queue = [...cells];
    next();
  }
  function next(): void {
    cur = queue.shift() ?? null;
    if (!cur || !stage) { document.body.dataset.done = '1'; return; }
    const r = cur.el.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cur.canvas.width = Math.round(r.width * dpr); cur.canvas.height = Math.round(r.height * dpr);
    stage.resize(r.width, r.height);
    stage.setScene(cur.id);
    const sh = shot(cur.id, r.width / r.height);
    if (params.has('auto')) {
      // look-dev: frame the object's bounding box from a given azimuth/elevation
      const [az, el] = (params.get('auto') || '-35,8').split(',').map(Number);
      const b = new THREE.Box3(); const f = stage.folder;
      for (let u = 0; u <= f.d.length; u += 0.05) for (const v of [-f.d.wL(u), 0, f.d.wR(u)]) b.expandByPoint(f.F(u, v, 0));
      const c = b.getCenter(new THREE.Vector3()), rad = b.getSize(new THREE.Vector3()).length() / 2;
      const dist = rad / Math.sin(11.3 * Math.PI / 180) * 1.05;
      const a = az * Math.PI / 180, e = el * Math.PI / 180;
      sh.target = c; sh.pos = c.clone().add(new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(dist)); sh.fov = 22.6;
    }
    stage.frame(sh);
    requestAnimationFrame(tick);
  }
  function tick(): void {
    if (!stage || !cur) return;
    const done = stage.step(view === 'sil' ? 1 : 2);
    const ctx = cur.canvas.getContext('2d')!;
    ctx.drawImage(gl, 0, 0, cur.canvas.width, cur.canvas.height);
    cur.el.style.setProperty('--p', String(stage.progress));
    if (done) { cur.el.classList.add('converged'); next(); } else requestAnimationFrame(tick);
  }
  delete document.body.dataset.done;
  start();
  let rt = 0;
  let lastW = window.innerWidth, lastH = window.innerHeight;
  window.addEventListener('resize', () => {
    if (window.innerWidth === lastW && window.innerHeight === lastH) return;
    lastW = window.innerWidth; lastH = window.innerHeight;
    clearTimeout(rt); rt = window.setTimeout(() => { delete document.body.dataset.done; start(); }, 200);
  });
  (window as unknown as Record<string, unknown>).__exp03 = { stage, done: () => document.body.dataset.done === '1' };
}
