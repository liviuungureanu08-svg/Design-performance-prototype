// Every curve of the transformation, as pure functions of progress (scroll is intent; per-mass smoothing happens upstream).
import { N } from './terrain';
import { D, type Pose } from './scene';

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rad = (d: number) => (d * Math.PI) / 180;

/** One leaf's travel: gathers, arrives a hair past its seat, settles. Lighter (higher) leaves overshoot more. */
function leaf(t: number, over: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  const c = inOut(Math.min(1, t / 0.7));
  const s = clamp((t - 0.45) / 0.55);
  return c + over * Math.sin(Math.PI * s) * Math.pow(1 - s, 0.6);
}

/** uHeavy / uLight: the same scroll seen through heavy and light inertia. */
export function pose(u: number, uHeavy = u, uLight = u): Pose {
  const lift: number[] = [];
  let acc = 0;
  for (let j = 1; j <= N; j++) {
    const f = (j - 1) / (N - 1);
    const p = lerp(uHeavy, uLight, f);
    // anticipation: the cut lines open into hairline steps before anything rises
    const pre = 0.055 * smooth(0.04, 0.14, p);
    const start = 0.15 + f * 0.42, dur = 0.2 - f * 0.07;
    const g = pre + (1 - pre) * leaf((p - start) / dur, 0.05 + 0.13 * f);
    acc += D * g;
    lift.push(acc);
  }
  const cam = smooth(0.1, 0.8, u);
  return {
    lift,
    hill: 1 - smooth(0.38, 0.8, u),
    sunEl: lerp(rad(66), rad(16), smooth(0.3, 0.88, u)),
    sunWarm: smooth(0.42, 0.92, u),
    water: smooth(0.8, 0.95, u),
    cam: { el: lerp(rad(64), rad(36), cam), dist: lerp(18.6, 18.2, cam), tx: lerp(0, 0.15, cam), ty: lerp(-0.33, -0.6, cam), tz: lerp(0, 0.3, cam), az: lerp(0, rad(-14), cam) },
  };
}
