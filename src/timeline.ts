import { clamp01, smoothstep } from './scroll';

/** Scroll-progress layout of the whole film. Dwells are almost-still holds; transitions are the events. */
export const SEGMENTS = [
  { kind: 'dwell', scene: 0, a: 0.0, b: 0.075 },
  { kind: 'tr', from: 0, a: 0.075, b: 0.3 },
  { kind: 'dwell', scene: 1, a: 0.3, b: 0.4 },
  { kind: 'tr', from: 1, a: 0.4, b: 0.63 },
  { kind: 'dwell', scene: 2, a: 0.63, b: 0.73 },
  { kind: 'tr', from: 2, a: 0.73, b: 0.9 },
  { kind: 'dwell', scene: 3, a: 0.9, b: 1.0 },
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

/** Tempo curves: each transition breathes differently (slow anticipation, hard release, soft landing). */
const curves: ((s: number) => number)[] = [
  // T1: long anticipation, accelerating travel, soft landing
  (s) => {
    const a = Math.pow(s, 1.35);
    return a * a * (3 - 2 * a) * 0.55 + a * 0.45;
  },
  // T2: tense hold (cracks creep), violent release, long settle
  (s) => {
    const k = smoothstep(0.0, 1.0, s);
    return s * 0.3 + k * 0.45 + smoothstep(0.3, 0.8, s) * 0.25;
  },
  // T3: pause on the shape, then flood
  (s) => {
    const k = smoothstep(0.0, 1.0, s);
    return k * 0.5 + smoothstep(0.38, 0.95, s) * 0.5;
  },
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
