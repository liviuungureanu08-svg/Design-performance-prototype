// The invented valley, authored once. Everything else (print, plies, water) is derived from it,
// so a contour line on the print and the cut edge of a ply are literally the same polyline.

export const RECT = { x0: -4.2, x1: 4.2, y0: -2.8, y1: 2.8 }; // map neatline (world units, z up, +y = north)
export const SHEET = { x0: -4.85, x1: 4.85, y0: -4.05, y1: 3.4 }; // the paper
export const N = 24; // plies above the base sheet (ply 1 = the plinth, the whole map rectangle)
export const WATER = 7; // the lake is the region below level(WATER)
export const level = (k: number) => (k - 1) / N; // ply k is the region h >= level(k)
export const SUMMIT = { x: 2.3, y: 1.3 };
export const LAKE_C = { x: -1.5, y: -0.5 };

export type Loop = Float32Array; // x,y pairs, closed implicitly
export interface Field { nx: number; ny: number; h: Float32Array; at(x: number, y: number): number }
export interface Level { k: number; loops: Loop[]; holes: boolean[] } // holes[i] true when loops[i] is a hole

// --- small deterministic noise ---
function hash(x: number, y: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}
function fbm(x: number, y: number, oct = 5): number {
  let s = 0, a = 0.5, f = 1;
  for (let i = 0; i < oct; i++) { s += a * vnoise(x * f + i * 17.3, y * f - i * 9.1); f *= 2.03; a *= 0.5; }
  return s;
}
const g = (x: number, y: number, cx: number, cy: number, sx: number, sy: number, rot = 0) => {
  const c = Math.cos(rot), s = Math.sin(rot);
  const dx = x - cx, dy = y - cy;
  const u = (dx * c + dy * s) / sx, v = (-dx * s + dy * c) / sy;
  return Math.exp(-(u * u + v * v));
};

const seg = (x: number, y: number, ax: number, ay: number, bx: number, by: number) => {
  const vx = bx - ax, vy = by - ay;
  const t = clamp01(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy));
  return { d: Math.hypot(x - ax - vx * t, y - ay - vy * t), t };
};
function clamp01(x: number) { return Math.min(1, Math.max(0, x)); }

function raw(x: number, y: number): number {
  // domain warp gives the contours a geological hand instead of concentric rings
  const wx = x + 0.38 * fbm(x * 0.4 + 3.1, y * 0.4 - 1.7, 3);
  const wy = y + 0.38 * fbm(x * 0.4 - 5.3, y * 0.4 + 2.2, 3);
  // broad tilt: the land falls from the north-east toward the south-west outlet
  let h = 0.3 + 0.05 * (wx * 0.6 + wy * 0.8) / 4 + 0.06 * fbm(wx * 0.45, wy * 0.45, 3);
  // the massif: a long ridge climbing SW→NE to the summit; ridged gullies give spurs on its flanks
  const r = seg(wx, wy, -0.3, -1.3, 2.4, 1.25);
  const gullies = 1 - Math.abs(fbm(wx * 1.1 + 7, wy * 1.1 - 3, 3));
  const ridged = (1 - Math.abs(fbm(wx * 1.7 - 2, wy * 1.7 + 5, 3))) ** 2;
  const mass = Math.exp(-((r.d / 1.3) ** 2));
  h += mass * (0.2 + 0.32 * r.t) * (0.72 + 0.28 * gullies + 0.22 * ridged);
  h += 0.22 * g(wx, wy, SUMMIT.x, SUMMIT.y, 0.8, 0.62, 0.5);
  // the western fell and the southern downs
  h += 0.27 * g(wx, wy, -2.9, 1.5, 1.3, 0.85, -0.35) * (0.75 + 0.25 * gullies + 0.2 * ridged);
  h += 0.12 * g(wx, wy, -3.3, -2.2, 1.2, 0.7);
  // the glacial trough that holds the lough: long, curved, parallel to the ridge
  const lk = seg(x + 0.12 * wx, y + 0.12 * wy, -2.65, -1.55, -0.35, 0.55);
  h -= 0.34 * Math.exp(-((lk.d / 0.5) ** 2)) * Math.sin(Math.PI * (0.15 + 0.7 * lk.t));
  return h;
}

export function buildField(nx = 421, ny = 281): Field {
  const h = new Float32Array(nx * ny);
  const X = (i: number) => RECT.x0 + (i / (nx - 1)) * (RECT.x1 - RECT.x0);
  const Y = (j: number) => RECT.y0 + (j / (ny - 1)) * (RECT.y1 - RECT.y0);
  let mn = Infinity, mx = -Infinity;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const v = raw(X(i), Y(j));
    h[j * nx + i] = v; mn = Math.min(mn, v); mx = Math.max(mx, v);
  }
  for (let i = 0; i < h.length; i++) h[i] = 0.06 + 0.94 * (h[i] - mn) / (mx - mn);
  // the only ground below the water level is the one basin connected to the lake centre
  const wl = level(WATER);
  const keep = new Uint8Array(nx * ny);
  const ci = Math.round(((LAKE_C.x - RECT.x0) / (RECT.x1 - RECT.x0)) * (nx - 1));
  const cj = Math.round(((LAKE_C.y - RECT.y0) / (RECT.y1 - RECT.y0)) * (ny - 1));
  const stack = [cj * nx + ci];
  while (stack.length) {
    const p = stack.pop()!;
    if (keep[p] || h[p] >= wl) continue;
    keep[p] = 1;
    const i = p % nx, j = (p / nx) | 0;
    if (i > 0) stack.push(p - 1); if (i < nx - 1) stack.push(p + 1);
    if (j > 0) stack.push(p - nx); if (j < ny - 1) stack.push(p + nx);
  }
  for (let p = 0; p < h.length; p++) if (!keep[p] && h[p] < wl + 0.012) h[p] = wl + 0.012 + (h[p] < wl ? 0 : h[p] - wl) * 0.5;
  const at = (x: number, y: number) => {
    const fx = Math.min(nx - 1.001, Math.max(0, ((x - RECT.x0) / (RECT.x1 - RECT.x0)) * (nx - 1)));
    const fy = Math.min(ny - 1.001, Math.max(0, ((y - RECT.y0) / (RECT.y1 - RECT.y0)) * (ny - 1)));
    const i = fx | 0, j = fy | 0, u = fx - i, v = fy - j;
    const a = h[j * nx + i], b = h[j * nx + i + 1], c = h[(j + 1) * nx + i], d = h[(j + 1) * nx + i + 1];
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return { nx, ny, h, at };
}

const area = (l: Loop) => {
  let s = 0;
  for (let i = 0, n = l.length / 2; i < n; i++) {
    const j = (i + 1) % n;
    s += l[i * 2] * l[j * 2 + 1] - l[j * 2] * l[i * 2 + 1];
  }
  return s / 2;
};
function inside(l: Loop, x: number, y: number): boolean {
  let c = false;
  for (let i = 0, n = l.length / 2, j = n - 1; i < n; j = i++) {
    const xi = l[i * 2], yi = l[i * 2 + 1], xj = l[j * 2], yj = l[j * 2 + 1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** Marching squares on the field padded with "below everything" so every region closes along the neatline. */
export function contour(f: Field, lv: number, minArea = 0.06): Level['loops'] {
  const { nx, ny, h } = f;
  const W = nx + 2, H = ny + 2;
  const v = (i: number, j: number) => (i <= 0 || j <= 0 || i >= W - 1 || j >= H - 1 ? -1 : h[(j - 1) * nx + (i - 1)]);
  // pad samples sit exactly on the neatline, so the closing edge lands on it
  const px = (i: number) => RECT.x0 + (Math.min(nx - 1, Math.max(0, i - 1)) / (nx - 1)) * (RECT.x1 - RECT.x0);
  const py = (j: number) => RECT.y0 + (Math.min(ny - 1, Math.max(0, j - 1)) / (ny - 1)) * (RECT.y1 - RECT.y0);
  // edge ids: horizontal edge (i,j)-(i+1,j) = 2*(j*W+i), vertical (i,j)-(i,j+1) = 2*(j*W+i)+1
  const pt = new Map<number, [number, number]>();
  const P = (id: number): [number, number] => {
    let p = pt.get(id);
    if (p) return p;
    const e = id >> 1, i = e % W, j = (e / W) | 0;
    const i2 = id & 1 ? i : i + 1, j2 = id & 1 ? j + 1 : j;
    const a = v(i, j), b = v(i2, j2);
    const t = (lv - a) / (b - a);
    p = [px(i) + (px(i2) - px(i)) * t, py(j) + (py(j2) - py(j)) * t];
    pt.set(id, p);
    return p;
  };
  const next = new Map<number, number>(); // directed segments, region (>= lv) kept on the left
  for (let j = 0; j < H - 1; j++) for (let i = 0; i < W - 1; i++) {
    const a = v(i, j) >= lv ? 1 : 0, b = v(i + 1, j) >= lv ? 1 : 0, c = v(i + 1, j + 1) >= lv ? 1 : 0, d = v(i, j + 1) >= lv ? 1 : 0;
    const code = a | (b << 1) | (c << 2) | (d << 3);
    if (code === 0 || code === 15) continue;
    const S = 2 * (j * W + i), E = 2 * (j * W + i + 1) + 1, Nn = 2 * ((j + 1) * W + i), Wd = 2 * (j * W + i) + 1;
    const seg = (p: number, q: number) => next.set(p, q);
    switch (code) {
      case 1: seg(Wd, S); break; case 2: seg(S, E); break; case 3: seg(Wd, E); break;
      case 4: seg(E, Nn); break; case 6: seg(S, Nn); break; case 7: seg(Wd, Nn); break;
      case 8: seg(Nn, Wd); break; case 9: seg(Nn, S); break; case 11: seg(Nn, E); break;
      case 12: seg(E, Wd); break; case 13: seg(E, S); break; case 14: seg(S, Wd); break;
      case 5: seg(Wd, Nn); seg(E, S); break; // saddles resolved as "connected low ground"
      case 10: seg(S, E); seg(Nn, Wd); break;
    }
  }
  const loops: Loop[] = [];
  const seen = new Set<number>();
  for (const start of next.keys()) {
    if (seen.has(start)) continue;
    const pts: number[] = [];
    let e: number | undefined = start;
    while (e !== undefined && !seen.has(e)) { seen.add(e); const p = P(e); pts.push(p[0], p[1]); e = next.get(e); }
    if (e !== start || pts.length < 8) continue;
    // drop collinear / near-duplicate points (keeps the walls light without visible faceting)
    const out: number[] = [];
    for (let q = 0; q < pts.length; q += 2) {
      const n = out.length;
      if (n >= 2 && Math.hypot(pts[q] - out[n - 2], pts[q + 1] - out[n - 1]) < 0.012) continue;
      out.push(pts[q], pts[q + 1]);
    }
    const l = new Float32Array(out);
    if (Math.abs(area(l)) >= minArea) loops.push(l);
  }
  return loops;
}

export function buildLevels(f: Field): Level[] {
  const levels: Level[] = [];
  const rect = new Float32Array([RECT.x0, RECT.y0, RECT.x1, RECT.y0, RECT.x1, RECT.y1, RECT.x0, RECT.y1]);
  levels.push({ k: 1, loops: [rect], holes: [false] });
  for (let k = 2; k <= N; k++) {
    const loops = contour(f, level(k));
    const holes = loops.map((l, i) => {
      let depth = 0;
      for (let o = 0; o < loops.length; o++) if (o !== i && Math.abs(area(loops[o])) > Math.abs(area(l)) && inside(loops[o], l[0], l[1])) depth++;
      return depth % 2 === 1;
    });
    levels.push({ k, loops, holes });
  }
  return levels;
}

export const signedArea = area;
export const pointIn = inside;

/** Level index (1..N) of the ground at x,y. */
export const plyAt = (f: Field, x: number, y: number) => Math.max(1, Math.min(N, Math.floor(f.at(x, y) * N) + 1));
/** Nearest spot to (x,y) where a w×h label box lies on a single leaf, so the type never breaks across a cut. */
export function quietSpot(f: Field, x: number, y: number, w: number, h: number, only?: number): [number, number] {
  for (let r = 0; r < 1.6; r += 0.04) {
    for (let a = 0; a < Math.PI * 2; a += r ? 0.3 / r : 7) {
      const cx = x + Math.cos(a) * r, cy = y + Math.sin(a) * r;
      const k = plyAt(f, cx, cy);
      if (only !== undefined && k !== only) continue;
      let ok = cx > RECT.x0 + 0.1 && cx + w < RECT.x1 - 0.1 && cy - h * 0.3 > RECT.y0 + 0.1 && cy + h < RECT.y1 - 0.1;
      for (let i = 0; ok && i <= 8; i++) for (let j = 0; ok && j <= 3; j++) if (plyAt(f, cx + (w * i) / 8, cy - h * 0.3 + (h * 1.3 * j) / 3) !== k) ok = false;
      if (ok) return [cx, cy];
    }
  }
  return [x, y];
}
