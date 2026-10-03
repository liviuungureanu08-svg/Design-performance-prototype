// Scroll timeline. `t` runs 0..8 — section i owns [i, i+1).
// Everything the environment does is a pure function of t, so slow scroll,
// fast scroll and direction reversal all resolve to the same states.

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lin = (t, a, b) => clamp((t - a) / (b - a));
export const sstep = (t, a, b) => { const x = lin(t, a, b); return x * x * (3 - 2 * x); };
export const band = (t, a, b, fi, fo) => sstep(t, a, a + fi) * (1 - sstep(t, b - fo, b));
const mix = (a, b, k) => a + (b - a) * k;

// Camera keys: t, position, target, vertical fov
function keys(portrait, naveLen, naveZ) {
  const L = naveLen / 2;
  if (!portrait) {
    return [
      [0.00, [0, 9.6, 37], [0, 11.6, 0], 38],
      [0.55, [0, 9.6, 37], [0, 11.6, 0], 38],
      [1.10, [-16.5, 6.0, 20], [9.5, 10.6, 0], 40],
      [1.70, [-14, 5.4, 18.5], [9.5, 10.2, 0], 40],
      [2.12, [-4, 3.2, 16], [0, 8.0, -2], 46],
      [2.62, [0.5, 2.1, 9.5], [-1, 8.6, -6], 58],
      [2.95, [0.5, 2.4, 6.5], [-1, 7.8, -8], 58],
      [3.42, [-L - 7, 3.2, naveZ + 0.4], [0, 4.8, naveZ], 52],
      [4.00, [-L * 0.48, 3.0, naveZ], [L, 4.2, naveZ], 54],
      [4.55, [-L * 0.18, 3.0, naveZ], [L, 5.0, naveZ], 56],
      [4.92, [-L * 0.08, 3.1, naveZ], [L, 5.2, naveZ], 56],
      [5.42, [-9.5, 9.0, 33], [-9.5, 10.8, 0], 40],
      [6.00, [-9, 9.2, 31], [-9, 11.0, 0], 40],
      [6.30, [10.5, 6.8, 6.4], [4.2, 9.6, -0.2], 34],
      [6.90, [9.2, 7.6, 5.4], [3.0, 10.2, -0.2], 34],
      [7.35, [0, 7.4, 44], [0, 11.2, 0], 36],
      [8.00, [0, 7.0, 46], [0, 11.0, 0], 36],
    ];
  }
  return [
    [0.00, [0, 13.5, 40], [0, 15.5, 0], 52],
    [0.55, [0, 13.5, 40], [0, 15.5, 0], 52],
    [1.10, [-9, 9.0, 30], [1.5, 14.5, 0], 52],
    [1.70, [-7.5, 8.5, 29], [1.5, 14.0, 0], 52],
    [2.12, [-2, 3.5, 18], [0, 8.5, -2], 64],
    [2.62, [0.3, 2.1, 10.5], [-0.5, 9.0, -6], 74],
    [2.95, [0.3, 2.4, 8], [-0.5, 8.4, -8], 74],
    [3.42, [-L - 6, 3.4, naveZ], [0, 5.4, naveZ], 70],
    [4.00, [-L * 0.45, 3.4, naveZ], [L, 5.0, naveZ], 72],
    [4.55, [-L * 0.15, 3.4, naveZ], [L, 5.4, naveZ], 74],
    [4.92, [-L * 0.05, 3.4, naveZ], [L, 5.6, naveZ], 74],
    [5.42, [0, 7.5, 42], [0, 7.6, 0], 52],
    [6.00, [0, 7.5, 40], [0, 7.6, 0], 52],
    [6.30, [5.5, 13.2, 7.2], [1.0, 15.5, -0.2], 48],
    [6.90, [4.8, 14.2, 6.6], [0.2, 16.0, -0.2], 48],
    [7.35, [0, 11.5, 48], [0, 15.0, 0], 50],
    [8.00, [0, 11.0, 50], [0, 14.8, 0], 50],
  ];
}

function cr(p0, p1, p2, p3, s) {
  const s2 = s * s, s3 = s2 * s;
  return 0.5 * (2 * p1 + (-p0 + p2) * s + (2 * p0 - 5 * p1 + 4 * p2 - p3) * s2 + (-p0 + 3 * p1 - 3 * p2 + p3) * s3);
}

export class Timeline {
  constructor() { this.set(false, 43.2, -4); }
  set(portrait, naveLen, naveZ) {
    this.portrait = portrait;
    this.naveLen = naveLen;
    this.naveZ = naveZ;
    this.k = keys(portrait, naveLen, naveZ);
  }

  camera(t, outPos, outTgt) {
    const k = this.k;
    let i = 0;
    while (i < k.length - 2 && t >= k[i + 1][0]) i++;
    const a = k[i], b = k[i + 1];
    let s = clamp((t - a[0]) / (b[0] - a[0]));
    s = s * s * s * (s * (s * 6 - 15) + 10);
    const p0 = k[Math.max(i - 1, 0)], p3 = k[Math.min(i + 2, k.length - 1)];
    for (let c = 0; c < 3; c++) {
      outPos[c] = cr(p0[1][c], a[1][c], b[1][c], p3[1][c], s);
      outTgt[c] = cr(p0[2][c], a[2][c], b[2][c], p3[2][c], s);
    }
    return mix(a[3], b[3], s);
  }

  // all environment parameters for a given t
  state(t, camX) {
    const morph = lin(t, 1.86, 2.58) + lin(t, 2.78, 3.4) + lin(t, 4.9, 5.48);
    const open = sstep(t, 4.16, 4.52) * (1 - sstep(t, 4.82, 5.02));
    const L = this.naveLen;
    return {
      morph,
      textAmt: band(t, 0.88, 2.0, 0.16, 0.18),
      image: t < 1.42 ? 'hello' : 'sun',
      wave: band(t, 2.25, 3.05, 0.25, 0.3),
      procAmt: band(t, 3.25, 4.95, 0.25, 0.25) * (1 - open),
      proc: clamp((camX + L / 2) / L + 0.12, -0.2, 1.3),
      open,
      day: open * 0.92,
      workAmt: band(t, 5.36, 6.22, 0.18, 0.22),
      scan: band(t, 6.18, 7.0, 0.2, 0.2),
      horizon: sstep(t, 7.05, 7.5),
      horGlow: 0.10 + 0.22 * band(t, 3.2, 5.0, 0.4, 0.3) + 0.32 * sstep(t, 7.0, 7.6),
      fogDen: 0.010 + 0.012 * band(t, 3.2, 5.05, 0.3, 0.3) * (1 - open * 0.7),
      bloom: 0.32 + 0.12 * open + 0.08 * band(t, 3.3, 4.2, 0.2, 0.2),
      exposure: 1.0 - 0.12 * open,
      slots: 1 - open * 0.6,
      pool: band(t, 5.3, 6.3, 0.2, 0.2) + 0.6 * sstep(t, 7.0, 7.6),
      idle: 1,
      spark: 1 - sstep(t, 0.6, 1.0) + sstep(t, 7.1, 7.6) * 0.7,
      radius: t > 6.1 && t < 7.0 ? 0.24 : 0.16,
      // DOM
      a1: band(t, 4.05, 4.98, 0.14, 0.1),
      a2: band(t, 4.3, 4.98, 0.14, 0.1),
    };
  }
}

// text blocks: [section index, on-from, on-to] in t space
export const TEXT_WINDOWS = [
  [0, -1, 0.62],
  [1, 1.0, 1.92],
  [2, 2.5, 3.08],
  [3, 3.45, 4.02],
  [5, 5.45, 6.08],
  [6, 6.28, 7.02],
  [7, 7.22, 99],
];

// discrete hold states for reduced motion
export const HOLDS = [0.3, 1.5, 2.7, 3.8, 4.7, 5.8, 6.6, 7.8];
