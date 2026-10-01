// Scene A is a printed survey sheet. Every mark on it is computed from the same field and the same
// loops that later become paper plies, so the print is the construction drawing of Scene B.
import { RECT, SHEET, N, WATER, level, SUMMIT, LAKE_C, contour, quietSpot, type Field, type Level } from './terrain';

// Hypsometric inks, muted like a lithographed survey (not a GIS ramp). Index 1..N; below WATER = bathymetry.
const STOPS: [number, string][] = [
  [1, '#82a0a3'], [6, '#c4d6d0'], // lake floor, shallowing
  [7, '#b6be9e'], [10, '#c8c9a2'], [13, '#d9cca0'], [16, '#e0bd8c'], [19, '#d3a786'], [21, '#cda497'], [23, '#d9c6bf'], [24, '#eee7df'],
];
const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const TINTS = [''].concat(Array.from({ length: N }, (_, i) => {
  const k = i + 1;
  let a = STOPS[0], b = STOPS[STOPS.length - 1];
  for (let q = 0; q < STOPS.length - 1; q++) if (k >= STOPS[q][0] && k <= STOPS[q + 1][0]) { a = STOPS[q]; b = STOPS[q + 1]; break; }
  const t = b[0] === a[0] ? 0 : (k - a[0]) / (b[0] - a[0]);
  const A = hex(a[1]), B = hex(b[1]);
  return '#' + A.map((v, j) => Math.round(v + (B[j] - v) * t).toString(16).padStart(2, '0')).join('');
}));
export const tint = (k: number) => TINTS[Math.max(1, Math.min(N, k))];
export const SUN_AZ = (264 * Math.PI) / 180; // the light the engraver drew is the light that will arrive
const INK = '#4a3527';
const WATER_INK = '#3f6f78';

export interface Print { color: HTMLCanvasElement; hill: HTMLCanvasElement; lake: HTMLCanvasElement }

export function makePrint(f: Field, levels: Level[], width: number): Print {
  const sw = SHEET.x1 - SHEET.x0, sh = SHEET.y1 - SHEET.y0;
  const W = width, H = Math.round((width * sh) / sw);
  const s = W / sw; // px per world unit
  const X = (x: number) => (x - SHEET.x0) * s;
  const Y = (y: number) => (SHEET.y1 - y) * s;
  const canvas = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
  const color = canvas(), lake = canvas();
  const HW = Math.round(W / 4), HH = Math.round(H / 4), hs = s / 4;
  const hill = Object.assign(document.createElement('canvas'), { width: HW, height: HH });
  const c = color.getContext('2d')!;

  // paper: warm cotton with a faint cloudiness of the pulp
  c.fillStyle = '#f0e9db';
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 140; i++) {
    const x = ((i * 7919) % 997) / 997 * W, y = ((i * 104729) % 991) / 991 * H, r = (0.04 + ((i * 31) % 17) / 170) * W;
    const gr = c.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, i % 2 ? 'rgba(120,96,60,0.018)' : 'rgba(255,252,244,0.03)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gr;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const path = (loops: Float32Array[]) => {
    c.beginPath();
    for (const l of loops) {
      c.moveTo(X(l[0]), Y(l[1]));
      for (let i = 2; i < l.length; i += 2) c.lineTo(X(l[i]), Y(l[i + 1]));
      c.closePath();
    }
  };

  // tints: each level fills exactly the region its ply will occupy
  for (const L of levels) { path(L.loops); c.fillStyle = tint(L.k); c.fill('evenodd'); }

  // contours: every ply edge, index contours heavier; under water they are drawn in the water ink
  c.lineJoin = 'round';
  for (const L of levels) {
    if (L.k === 1) continue;
    const idx = (L.k - 1) % 5 === 0;
    c.strokeStyle = L.k <= WATER ? WATER_INK : INK;
    c.globalAlpha = L.k === WATER ? 0.95 : idx ? 0.78 : 0.5;
    c.lineWidth = s * (L.k === WATER ? 0.011 : idx ? 0.0105 : 0.0055);
    for (const l of L.loops) {
      // skip the neatline-hugging stretches (the neatline is ruled separately)
      c.beginPath();
      let pen = false;
      for (let i = 0; i <= l.length; i += 2) {
        const x = l[i % l.length], y = l[(i + 1) % l.length];
        const onEdge = x <= RECT.x0 + 1e-4 || x >= RECT.x1 - 1e-4 || y <= RECT.y0 + 1e-4 || y >= RECT.y1 - 1e-4;
        if (onEdge) { pen = false; continue; }
        if (!pen) c.moveTo(X(x), Y(y)); else c.lineTo(X(x), Y(y));
        pen = true;
      }
      c.stroke();
    }
  }
  c.globalAlpha = 1;

  // neatline: hairline inside a heavier rule
  c.strokeStyle = INK;
  c.lineWidth = s * 0.012;
  c.strokeRect(X(RECT.x0), Y(RECT.y1), (RECT.x1 - RECT.x0) * s, (RECT.y1 - RECT.y0) * s);
  c.lineWidth = s * 0.004;
  const o = 0.06;
  c.strokeRect(X(RECT.x0 - o), Y(RECT.y1 + o), (RECT.x1 - RECT.x0 + 2 * o) * s, (RECT.y1 - RECT.y0 + 2 * o) * s);
  // graticule ticks between the two rules
  c.lineWidth = s * 0.005;
  for (let x = -4; x <= 4.01; x += 1) {
    c.beginPath(); c.moveTo(X(x), Y(RECT.y1)); c.lineTo(X(x), Y(RECT.y1 + o)); c.moveTo(X(x), Y(RECT.y0)); c.lineTo(X(x), Y(RECT.y0 - o)); c.stroke();
  }
  for (let y = -2; y <= 2.01; y += 1) {
    c.beginPath(); c.moveTo(X(RECT.x0), Y(y)); c.lineTo(X(RECT.x0 - o), Y(y)); c.moveTo(X(RECT.x1), Y(y)); c.lineTo(X(RECT.x1 + o), Y(y)); c.stroke();
  }

  // names: few, set in the map's own italic, never across a dense contour bundle
  const serif = (px: number, italic = false) => `${italic ? 'italic ' : ''}400 ${px}px 'Instrument Serif', Georgia, serif`;
  const spaced = (t: string, x: number, y: number, track: number, align: 'left' | 'center' = 'left') => {
    const chars = [...t];
    const wsum = chars.reduce((a, ch) => a + c.measureText(ch).width, 0) + track * (chars.length - 1);
    let px = align === 'center' ? x - wsum / 2 : x;
    for (const ch of chars) { c.fillText(ch, px, y); px += c.measureText(ch).width + track; }
  };
  c.fillStyle = INK;
  c.textBaseline = 'alphabetic';
  // summit: triangle + name + height
  const sx = X(SUMMIT.x), sy = Y(SUMMIT.y), t = s * 0.05;
  c.beginPath(); c.moveTo(sx, sy - t); c.lineTo(sx + t * 0.9, sy + t * 0.6); c.lineTo(sx - t * 0.9, sy + t * 0.6); c.closePath(); c.fill();
  // the name sits on one leaf beside the mark, so the type survives the cutting
  c.font = serif(s * 0.15, true);
  const nw = c.measureText('Carn Orrin').width / s;
  const [nx, ny] = quietSpot(f, SUMMIT.x - nw - 0.16, SUMMIT.y - 0.05, nw, 0.24);
  c.fillText('Carn Orrin', X(nx), Y(ny));
  c.font = serif(s * 0.1);
  c.fillText('2 361', X(nx), Y(ny - 0.13));
  c.font = serif(s * 0.13, true);
  c.globalAlpha = 0.85;
  const fw = c.measureText('Western Fell').width / s;
  const [fx, fy] = quietSpot(f, -3.4, 2.3, fw, 0.15);
  c.fillText('Western Fell', X(fx), Y(fy));
  c.globalAlpha = 1;
  c.fillStyle = WATER_INK;
  c.font = serif(s * 0.15, true);
  c.save();
  c.translate(X(LAKE_C.x + 0.05), Y(LAKE_C.y - 0.03));
  c.rotate(-0.72);
  spaced('Lough Orrin', 0, 0, s * 0.035, 'center');
  c.restore();

  // margin: title block (left) and the key to the leaves (right) — the legend is the strata, flat
  const by = SHEET.y0 + 0.62;
  c.fillStyle = INK;
  c.font = serif(s * 0.27);
  spaced('THE VALE OF ORRIN', X(RECT.x0), Y(by + 0.16), s * 0.06);
  c.font = serif(s * 0.125, true);
  c.globalAlpha = 0.82;
  c.fillText('A survey in twenty-four leaves of paper  ·  contours at 100 m  ·  1 : 50 000', X(RECT.x0), Y(by - 0.16));
  c.globalAlpha = 1;
  const kx = RECT.x1 - 2.4, kw = 2.4 / N;
  for (let k = 1; k <= N; k++) {
    c.fillStyle = tint(k);
    c.fillRect(X(kx + (k - 1) * kw), Y(by + 0.2), kw * s + 1, 0.16 * s);
  }
  c.strokeStyle = INK; c.lineWidth = s * 0.004;
  c.strokeRect(X(kx), Y(by + 0.2), 2.4 * s, 0.16 * s);
  c.fillStyle = INK;
  c.font = serif(s * 0.095);
  c.textAlign = 'center';
  for (const k of [1, 6, 11, 16, 21]) c.fillText(String((k - 1) * 100), X(kx + (k - 0.5) * kw), Y(by - 0.04));
  c.textAlign = 'right';
  c.font = serif(s * 0.095, true);
  c.fillText('metres', X(RECT.x1), Y(by - 0.24));
  c.textAlign = 'left';

  // printed relief shading (kept on its own plate so it can hand over to real shadow)
  const hc = hill.getContext('2d')!;
  const img = hc.createImageData(HW, HH);
  const lx = Math.sin(SUN_AZ), ly = Math.cos(SUN_AZ), le = Math.sin((40 * Math.PI) / 180), lh = Math.cos((40 * Math.PI) / 180);
  const e = 0.02, z = 2.6;
  for (let py = 0; py < HH; py++) {
    const y = SHEET.y1 - py / hs;
    for (let px = 0; px < HW; px++) {
      const x = SHEET.x0 + px / hs;
      let v = 1;
      if (x > RECT.x0 && x < RECT.x1 && y > RECT.y0 && y < RECT.y1) {
        const hx = (f.at(x + e, y) - f.at(x - e, y)) / (2 * e) * z, hy = (f.at(x, y + e) - f.at(x, y - e)) / (2 * e) * z;
        const nl = Math.hypot(hx, hy, 1);
        const d = (-hx * lx * lh - hy * ly * lh + le) / nl; // cos of incidence
        const flat = le;
        v = Math.min(1.05, 1 + (d - flat) * 0.85);
        v = v < 1 ? 1 - (1 - v) * 0.75 / (1 + (1 - v) * 0.9) : v;
        if (f.at(x, y) < level(WATER)) v = 1;
      }
      const o4 = (py * HW + px) * 4;
      const g8 = Math.max(0, Math.min(255, v * 240));
      img.data[o4] = g8; img.data[o4 + 1] = g8; img.data[o4 + 2] = g8; img.data[o4 + 3] = 255;
    }
  }
  hc.putImageData(img, 0, 0);

  // lake mask for the water surface
  const lc = lake.getContext('2d')!;
  lc.fillStyle = '#000'; lc.fillRect(0, 0, W, H);
  const wl = levels[WATER - 1];
  lc.beginPath();
  // region below WATER inside the neatline = rect minus the WATER loops
  lc.rect(X(RECT.x0), Y(RECT.y1), (RECT.x1 - RECT.x0) * s, (RECT.y1 - RECT.y0) * s);
  for (const l of wl.loops) { lc.moveTo(X(l[0]), Y(l[1])); for (let i = 2; i < l.length; i += 2) lc.lineTo(X(l[i]), Y(l[i + 1])); lc.closePath(); }
  lc.fillStyle = '#f00';
  lc.fill('evenodd');
  // water lining (green plate): shoreline-parallel lines, the engraver's convention for still water.
  // Kept off the paper plate so the lines can leave the paper when the water arrives.
  lc.globalCompositeOperation = 'lighter';
  lc.strokeStyle = '#0f0';
  lc.lineWidth = Math.max(1.5, s * 0.0062);
  for (let i = 1; i < 9; i++) {
    for (const l of contour(f, level(WATER) - i * 0.0095, 0.004)) {
      lc.beginPath();
      lc.moveTo(X(l[0]), Y(l[1]));
      for (let q = 2; q < l.length; q += 2) lc.lineTo(X(l[q]), Y(l[q + 1]));
      lc.closePath();
      lc.stroke();
    }
  }
  lc.globalCompositeOperation = 'source-over';
  return { color, hill, lake };
}

/** Composite for the no-WebGL poster: the print as an object. */
export function poster(p: Print): HTMLCanvasElement {
  const out = Object.assign(document.createElement('canvas'), { width: p.color.width, height: p.color.height });
  const c = out.getContext('2d')!;
  c.drawImage(p.color, 0, 0);
  c.globalCompositeOperation = 'multiply';
  c.drawImage(p.hill, 0, 0, out.width, out.height);
  // water lining from the green plate, in water ink
  const t = Object.assign(document.createElement('canvas'), { width: out.width, height: out.height });
  const tc = t.getContext('2d')!;
  tc.drawImage(p.lake, 0, 0);
  const d = tc.getImageData(0, 0, t.width, t.height);
  for (let i = 0; i < d.data.length; i += 4) { const g = d.data[i + 1]; d.data[i] = 63; d.data[i + 1] = 111; d.data[i + 2] = 120; d.data[i + 3] = g * 0.42; }
  tc.putImageData(d, 0, 0);
  c.globalCompositeOperation = 'source-over';
  c.drawImage(t, 0, 0);
  return out;
}
