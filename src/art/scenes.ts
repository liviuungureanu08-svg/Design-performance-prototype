/**
 * Procedural art direction for the two scenes.
 *
 * Everything here is generated at runtime from code: no third-party imagery.
 * Each scene yields a colour canvas and a matching depth canvas
 * (white = near, black = far) which the GPU uses for real parallax.
 */

export const ART_W = 2048;
export const ART_H = 1152;

/** Visual centre of interest of each scene (0..1, y down) — used to organise the flow. */
export const EMBER_FOCUS: [number, number] = [0.5, 0.545];
export const TIDE_FOCUS: [number, number] = [0.5, 0.375];

export interface SceneArt {
  color: HTMLCanvasElement;
  depth: HTMLCanvasElement;
}

type Style = string | CanvasGradient | CanvasPattern;
type StyleFn = (c: CanvasRenderingContext2D) => Style;
type PathFn = (c: CanvasRenderingContext2D) => void;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 1-D fractal value noise, returns roughly [-1, 1]. */
function makeFbm(seed: number) {
  const r = rng(seed);
  const lattice = Array.from({ length: 512 }, () => r() * 2 - 1);
  const at = (i: number) => lattice[((i % 512) + 512) % 512];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const noise = (x: number) => {
    const i = Math.floor(x);
    return at(i) + (at(i + 1) - at(i)) * smooth(x - i);
  };
  return (x: number, oct = 5) => {
    let s = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < oct; o++) {
      s += noise(x * f) * amp;
      amp *= 0.5;
      f *= 2.03;
    }
    return s * 1.6;
  };
}

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = ART_W;
  c.height = ART_H;
  return c;
}

/** Paints colour and depth in lockstep so the two never drift apart. */
class Painter {
  readonly color = makeCanvas();
  readonly depth = makeCanvas();
  readonly cc = this.color.getContext('2d', { willReadFrequently: false })!;
  readonly dc = this.depth.getContext('2d')!;

  constructor(depthBase: number) {
    this.dc.fillStyle = gray(depthBase);
    this.dc.fillRect(0, 0, ART_W, ART_H);
  }

  fill(path: PathFn, color: Style | StyleFn, depth: number | StyleFn | null, composite?: GlobalCompositeOperation) {
    const c = this.cc;
    c.save();
    if (composite) c.globalCompositeOperation = composite;
    c.beginPath();
    path(c);
    c.fillStyle = typeof color === 'function' ? color(c) : color;
    c.fill();
    c.restore();
    if (depth === null) return;
    const d = this.dc;
    d.save();
    d.beginPath();
    path(d);
    d.fillStyle = typeof depth === 'function' ? depth(d) : gray(depth);
    d.fill();
    d.restore();
  }

  /** Colour-only paint (glows, haze, grain) — leaves the depth map alone. */
  paint(path: PathFn, color: Style | StyleFn, composite?: GlobalCompositeOperation) {
    this.fill(path, color, null, composite);
  }

  finish(): SceneArt {
    return { color: this.color, depth: this.depth };
  }
}

function gray(v: number): string {
  const n = Math.round(Math.max(0, Math.min(1, v)) * 255);
  return `rgb(${n},${n},${n})`;
}

const rect = (x: number, y: number, w: number, h: number): PathFn => (c) => c.rect(x, y, w, h);
const circle = (x: number, y: number, r: number): PathFn => (c) => c.arc(x, y, r, 0, Math.PI * 2);

function vGrad(y0: number, y1: number, stops: [number, string][]): StyleFn {
  return (c) => {
    const g = c.createLinearGradient(0, y0, 0, y1);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    return g;
  };
}

function rGrad(x: number, y: number, r0: number, r1: number, stops: [number, string][]): StyleFn {
  return (c) => {
    const g = c.createRadialGradient(x, y, r0, x, y, r1);
    stops.forEach(([o, col]) => g.addColorStop(o, col));
    return g;
  };
}

function ridge(
  fbm: (x: number, o?: number) => number,
  base: number,
  amp: number,
  freq: number,
  offset: number,
  jagged = 0,
): PathFn {
  return (c) => {
    c.moveTo(-20, ART_H + 20);
    for (let x = -20; x <= ART_W + 20; x += 4) {
      let n = fbm(x * freq + offset);
      if (jagged > 0) n = n * (1 - jagged) + (Math.abs(fbm(x * freq * 2.2 + offset + 40, 4)) * 2 - 0.6) * jagged;
      c.lineTo(x, base * ART_H + n * amp * ART_H);
    }
    c.lineTo(ART_W + 20, ART_H + 20);
    c.closePath();
  };
}

function grain(p: Painter, seed: number, strength: number) {
  const tile = document.createElement('canvas');
  tile.width = tile.height = 256;
  const t = tile.getContext('2d')!;
  const img = t.createImageData(256, 256);
  const r = rng(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 128 + (r() - 0.5) * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  t.putImageData(img, 0, 0);
  const pat = p.cc.createPattern(tile, 'repeat')!;
  p.cc.save();
  p.cc.globalAlpha = strength;
  p.cc.globalCompositeOperation = 'overlay';
  p.cc.fillStyle = pat;
  p.cc.fillRect(0, 0, ART_W, ART_H);
  p.cc.restore();
}

function stars(p: Painter, seed: number, count: number, maxY: number, tint: string) {
  const r = rng(seed);
  const c = p.cc;
  c.save();
  c.fillStyle = tint;
  for (let i = 0; i < count; i++) {
    const y = Math.pow(r(), 1.4) * maxY * ART_H;
    c.globalAlpha = (0.15 + r() * 0.65) * (1 - (y / (maxY * ART_H)) * 0.75);
    const s = r() < 0.05 ? 2.2 : r() < 0.3 ? 1.4 : 0.9;
    c.fillRect(r() * ART_W, y, s, s);
  }
  c.restore();
}

/* ------------------------------------------------------------------ */
/* SCENE A — EMBER: a dusk of layered ridges around a low, huge sun.   */
/* ------------------------------------------------------------------ */
export function paintEmber(): SceneArt {
  const p = new Painter(0);
  const W = ART_W;
  const H = ART_H;
  const fbm = makeFbm(11);
  const sx = W * 0.5;
  const sy = H * 0.545;
  const sr = H * 0.112;

  p.fill(
    rect(0, 0, W, H),
    vGrad(0, H * 0.66, [
      [0, '#07061a'],
      [0.28, '#1c1038'],
      [0.52, '#5a1f4d'],
      [0.74, '#b8404f'],
      [0.9, '#ec7a45'],
      [1, '#ffc27d'],
    ]),
    0,
  );
  stars(p, 5, 260, 0.34, '#ffe9d6');

  // Atmosphere around the sun
  p.paint(circle(sx, sy, H * 1.1), rGrad(sx, sy, sr * 0.6, H * 1.1, [
    [0, 'rgba(255,190,110,0.62)'],
    [0.22, 'rgba(255,130,80,0.30)'],
    [0.6, 'rgba(190,60,90,0.10)'],
    [1, 'rgba(120,30,90,0)'],
  ]), 'screen');

  // Quiet ring motif (rhymes with the second scene)
  [1.55, 2.35, 3.4].forEach((k, i) => {
    p.paint((c) => {
      c.arc(sx, sy, sr * k, 0, Math.PI * 2);
      c.lineWidth = i === 0 ? 2 : 1.4;
      c.strokeStyle = `rgba(255,222,190,${0.2 - i * 0.05})`;
      c.stroke();
    }, 'rgba(0,0,0,0)');
  });

  // Sun
  p.fill(circle(sx, sy, sr), rGrad(sx, sy - sr * 0.2, sr * 0.1, sr * 1.02, [
    [0, '#fffbea'],
    [0.7, '#ffe3a8'],
    [1, '#ffb866'],
  ]), 0.06);

  const layers: { base: number; amp: number; freq: number; seed: number; top: string; bot: string; depth: number; jag?: number }[] = [
    { base: 0.625, amp: 0.028, freq: 0.0021, seed: 3, top: '#d4655a', bot: '#f59a58', depth: 0.2 },
    { base: 0.665, amp: 0.045, freq: 0.0017, seed: 17, top: '#a94a62', bot: '#d06d62', depth: 0.32 },
    { base: 0.715, amp: 0.06, freq: 0.0013, seed: 29, top: '#73386a', bot: '#a24f6c', depth: 0.46 },
    { base: 0.775, amp: 0.075, freq: 0.0011, seed: 41, top: '#42295a', bot: '#703b69', depth: 0.6 },
    { base: 0.845, amp: 0.07, freq: 0.0009, seed: 53, top: '#1c1741', bot: '#3c2650', depth: 0.76 },
  ];
  layers.forEach((l, i) => {
    p.fill(
      ridge(fbm, l.base, l.amp, l.freq, l.seed * 10, l.jag),
      vGrad((l.base - l.amp) * H, (l.base + 0.12) * H, [[0, l.top], [1, l.bot]]),
      l.depth,
    );
    // Pillars stand on the 4th ridge for scale
    if (i === 3) {
      [
        { x: 0.255, h: 0.25, w: 0.0105 },
        { x: 0.742, h: 0.155, w: 0.008 },
      ].forEach((pl) => {
        const bx = pl.x * W;
        const by = (l.base + 0.012) * H;
        const path: PathFn = (c) => {
          c.moveTo(bx - pl.w * W, by);
          c.lineTo(bx - pl.w * W * 0.55, by - pl.h * H);
          c.lineTo(bx + pl.w * W * 0.45, by - pl.h * H * 0.985);
          c.lineTo(bx + pl.w * W, by);
          c.closePath();
        };
        p.fill(path, vGrad(by - pl.h * H, by, [[0, '#1b1440'], [1, '#33224c']]), 0.66);
        // rim light on the sun-facing flank
        p.paint((c) => {
          const dir = bx < sx ? 1 : -1;
          c.moveTo(bx + dir * pl.w * W, by);
          c.lineTo(bx + dir * pl.w * W * 0.5, by - pl.h * H * 0.99);
          c.lineWidth = 2;
          c.strokeStyle = 'rgba(255,170,110,0.55)';
          c.stroke();
        }, 'rgba(0,0,0,0)', 'screen');
      });
    }
    if (i === 4) {
      // scatter of warm light across the mid layers, before the foreground
      p.paint(circle(sx, sy + H * 0.1, W * 0.7), rGrad(sx, sy + H * 0.1, 0, W * 0.7, [
        [0, 'rgba(255,150,90,0.34)'],
        [0.5, 'rgba(255,110,90,0.1)'],
        [1, 'rgba(255,90,90,0)'],
      ]), 'screen');
    }
  });

  p.fill(
    ridge(fbm, 0.935, 0.055, 0.0016, 777, 0.55),
    vGrad(0.86 * H, H, [[0, '#0c0a1d'], [1, '#04030a']]),
    0.93,
  );

  grain(p, 21, 0.1);
  return p.finish();
}

/* ------------------------------------------------------------------ */
/* SCENE B — TIDE: an eclipse over still water, mirrored below.        */
/* ------------------------------------------------------------------ */
export function paintTide(): SceneArt {
  const p = new Painter(0);
  const W = ART_W;
  const H = ART_H;
  const fbm = makeFbm(97);
  const R = rng(1234);
  const hz = H * 0.645;
  const ex = W * 0.5;
  const ey = H * 0.375;
  const er = H * 0.105;

  p.fill(
    rect(0, 0, W, hz + 2),
    vGrad(0, hz, [
      [0, '#02060b'],
      [0.35, '#06151e'],
      [0.62, '#0c3640'],
      [0.84, '#2a7d82'],
      [1, '#a6e4dc'],
    ]),
    0,
  );
  stars(p, 8, 320, 0.42, '#dff8f4');

  // Corona
  p.paint(circle(ex, ey, er * 4.2), rGrad(ex, ey, er * 0.9, er * 4.2, [
    [0, 'rgba(235,255,252,0.95)'],
    [0.06, 'rgba(160,240,232,0.6)'],
    [0.22, 'rgba(70,190,190,0.22)'],
    [0.55, 'rgba(30,110,130,0.08)'],
    [1, 'rgba(10,60,90,0)'],
  ]), 'screen');
  // Horizontal lens streak
  p.paint(rect(W * 0.08, ey - 1.2, W * 0.84, 2.4), (c) => {
    const g = c.createLinearGradient(W * 0.08, 0, W * 0.92, 0);
    g.addColorStop(0, 'rgba(180,255,250,0)');
    g.addColorStop(0.5, 'rgba(220,255,252,0.55)');
    g.addColorStop(1, 'rgba(180,255,250,0)');
    return g;
  }, 'screen');
  [1.7, 2.5, 3.6].forEach((k, i) => {
    p.paint((c) => {
      c.arc(ex, ey, er * k, 0, Math.PI * 2);
      c.lineWidth = i === 0 ? 2 : 1.4;
      c.strokeStyle = `rgba(190,248,242,${0.22 - i * 0.055})`;
      c.stroke();
    }, 'rgba(0,0,0,0)');
  });
  // Occluding disc with a bright rim
  p.fill(circle(ex, ey, er), '#02070b', 0.08);
  p.paint((c) => {
    c.arc(ex, ey, er, 0, Math.PI * 2);
    c.lineWidth = 3;
    c.strokeStyle = 'rgba(240,255,253,0.92)';
    c.shadowColor = 'rgba(150,255,245,0.9)';
    c.shadowBlur = 26;
    c.stroke();
  }, 'rgba(0,0,0,0)');

  // Far shoreline
  p.fill(ridge(fbm, 0.628, 0.012, 0.004, 90), vGrad(0.6 * H, hz + 6, [[0, '#0b3239'], [1, '#124c52']]), 0.18);
  p.fill(ridge(fbm, 0.646, 0.018, 0.0027, 200), vGrad(0.62 * H, hz + 10, [[0, '#06222a'], [1, '#0d3d44']]), 0.3);
  // Water body (continuous depth: far at horizon -> near at the bottom)
  p.fill(
    rect(0, hz, W, H - hz),
    vGrad(hz, H, [[0, '#14636a'], [0.12, '#0b4650'], [0.55, '#05212b'], [1, '#010a10']]),
    vGrad(hz, H, [[0, 'rgb(64,64,64)'], [1, 'rgb(215,215,215)']]) as StyleFn,
  );

  // Reflection column — built from nested strips so its flanks fall off softly
  for (let i = 0; i < 28; i++) {
    const k = i / 27;
    const half = W * (0.012 + 0.085 * (1 - k * k));
    p.paint(rect(ex - half, hz, half * 2, H - hz), (c) => {
      const g = c.createLinearGradient(0, hz, 0, H);
      g.addColorStop(0, 'rgba(210,255,250,0.05)');
      g.addColorStop(0.4, 'rgba(120,230,224,0.025)');
      g.addColorStop(1, 'rgba(60,170,180,0)');
      return g;
    }, 'screen');
  }
  p.paint(circle(ex, hz + (hz - ey) * 0.55, er * 2.4), rGrad(ex, hz + (hz - ey) * 0.55, 0, er * 2.4, [
    [0, 'rgba(180,250,245,0.28)'],
    [1, 'rgba(60,170,180,0)'],
  ]), 'screen');

  // Ripples — a few hundred hairline strokes, denser and wider toward the viewer
  const gauss = () => (R() + R() + R() + R() - 2) / 2;
  for (let i = 0; i < 520; i++) {
    const t = Math.pow(R(), 1.6);
    const y = hz + 4 + t * (H - hz - 8);
    const w = 24 + R() * (50 + t * 240);
    const x = ex + gauss() * W * 0.17 + (R() - 0.5) * W * 0.3 * R();
    const bright = R() < 0.7;
    const near = Math.max(0, 1 - Math.abs(x - ex) / (W * 0.3));
    p.paint(rect(x - w / 2, y, w, 0.8 + t * 2.6), bright
      ? `rgba(215,255,250,${(0.05 + R() * 0.2) * (0.4 + near)})`
      : `rgba(0,10,16,${0.12 + R() * 0.25})`, bright ? 'screen' : 'source-over');
  }

  // Standing stone and its reflection
  const px = W * 0.735;
  const pb = H * 0.715;
  const ph = H * 0.215;
  p.fill((c) => {
    c.moveTo(px - 11, pb);
    c.lineTo(px - 6, pb - ph);
    c.lineTo(px + 6, pb - ph * 0.99);
    c.lineTo(px + 12, pb);
    c.closePath();
  }, vGrad(pb - ph, pb, [[0, '#06222a'], [1, '#0a2f38']]), 0.55);
  p.paint((c) => {
    c.moveTo(px - 11, pb);
    c.lineTo(px - 6, pb - ph);
    c.lineWidth = 1.8;
    c.strokeStyle = 'rgba(200,255,250,0.5)';
    c.stroke();
  }, 'rgba(0,0,0,0)', 'screen');
  p.paint((c) => {
    c.moveTo(px - 11, pb + 2);
    c.lineTo(px - 6, pb + ph * 0.55);
    c.lineTo(px + 6, pb + ph * 0.55);
    c.lineTo(px + 12, pb + 2);
    c.closePath();
  }, vGrad(pb, pb + ph * 0.55, [[0, 'rgba(6,34,42,0.8)'], [1, 'rgba(6,34,42,0)']]));

  // Horizon haze
  p.paint(rect(0, hz - H * 0.09, W, H * 0.18), vGrad(hz - H * 0.09, hz + H * 0.09, [
    [0, 'rgba(150,235,228,0)'],
    [0.5, 'rgba(170,240,232,0.30)'],
    [1, 'rgba(150,235,228,0)'],
  ]), 'screen');

  // Foreground slabs
  p.fill((c) => {
    c.moveTo(-20, H + 20);
    c.lineTo(-20, H * 0.86);
    c.lineTo(W * 0.07, H * 0.835);
    c.lineTo(W * 0.15, H * 0.9);
    c.lineTo(W * 0.26, H * 0.95);
    c.lineTo(W * 0.31, H + 20);
    c.closePath();
  }, '#02080c', 0.95);
  p.fill((c) => {
    c.moveTo(W + 20, H + 20);
    c.lineTo(W + 20, H * 0.92);
    c.lineTo(W * 0.93, H * 0.905);
    c.lineTo(W * 0.86, H * 0.965);
    c.lineTo(W * 0.8, H + 20);
    c.closePath();
  }, '#02080c', 0.92);

  grain(p, 33, 0.1);
  return p.finish();
}
