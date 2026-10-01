import { clamp01 } from './scroll';

/** Scroll-progress layout of the whole film. Dwells are almost-still holds; transitions are the events. */
export const SEGMENTS = [
  { kind: 'dwell', scene: 0, a: 0.0, b: 0.07 },
  { kind: 'tr', from: 0, a: 0.07, b: 0.29 },
  { kind: 'dwell', scene: 1, a: 0.29, b: 0.39 },
  { kind: 'tr', from: 1, a: 0.39, b: 0.63 },
  { kind: 'dwell', scene: 2, a: 0.63, b: 0.72 },
  { kind: 'tr', from: 2, a: 0.72, b: 0.91 },
  { kind: 'dwell', scene: 3, a: 0.91, b: 1.0 },
] as const;

export interface Beat {
  /** scene shown during a dwell, or the outgoing scene during a transition */
  scene: number;
  /** -1 when dwelling, otherwise index of the active transition (0..2) */
  tr: number;
  /** raw 0..1 position inside the segment */
  s: number;
  /** transition progress after the per-transition tempo curve */
  p: number;
}

/** Monotone cubic (Fritsch–Carlson) through control points: a tempo curve we can shape by hand without overshoot. */
function pchip(pts: [number, number][]): (x: number) => number {
  const n = pts.length;
  const h: number[] = [], d: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(pts[i + 1][0] - pts[i][0]);
    d.push((pts[i + 1][1] - pts[i][1]) / h[i]);
  }
  const m: number[] = new Array(n);
  m[0] = d[0];
  m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i]);
  return (x) => {
    if (x <= pts[0][0]) return pts[0][1];
    if (x >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0;
    while (x > pts[i + 1][0]) i++;
    const t = (x - pts[i][0]) / h[i];
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h[i] * m[i + 1];
  };
}

/** Tempo curves: each transition breathes differently (anticipation, release, hold, landing). */
const curves: ((s: number) => number)[] = [
  // T1: slow anticipation -> the pupil opens -> LINGER on the eye -> accelerating travel -> soft landing
  pchip([[0, 0], [0.22, 0.1], [0.42, 0.38], [0.64, 0.5], [0.8, 0.72], [0.93, 0.95], [1, 1]]),
  // T2: tense hold while cracks creep, violent release, long settle
  pchip([[0, 0], [0.3, 0.14], [0.42, 0.3], [0.62, 0.7], [0.82, 0.93], [1, 1]]),
  // T3: ripples, the drop flows into the word, HOLD on the word, flood, landing
  pchip([[0, 0], [0.2, 0.14], [0.5, 0.5], [0.66, 0.62], [0.78, 0.74], [0.92, 0.95], [1, 1]]),
];

export function beatAt(u: number): Beat {
  for (const seg of SEGMENTS) {
    if (u <= seg.b || seg === SEGMENTS[SEGMENTS.length - 1]) {
      const s = clamp01((u - seg.a) / (seg.b - seg.a));
      if (seg.kind === 'dwell') return { scene: seg.scene, tr: -1, s, p: 0 };
      return { scene: seg.from, tr: seg.from, s, p: clamp01(curves[seg.from](s)) };
    }
  }
  return { scene: 3, tr: -1, s: 1, p: 0 };
}
