import * as THREE from 'three';
import { Curve, clamp01, easeIO3, easeIO5, smooth } from './curve';
import { U } from './shading';
import { World } from './world';

/** Camera: OBSERVE → APPROACH → COMMIT → TRAVERSE → SETTLE. Duplicated keys form plateaus (stillness). */
const CAM: { u: number; p: [number, number, number]; t: [number, number, number] }[] = [
  { u: 0.0, p: [-8.5, 1.4, 28.0], t: [2.4, 1.4, 0] },
  { u: 0.12, p: [-8.4, 1.4, 27.9], t: [2.4, 1.4, 0] },
  { u: 0.25, p: [-8.0, 1.45, 27.1], t: [2.1, 1.5, 0] },
  { u: 0.38, p: [-6.4, 1.55, 25.2], t: [1.5, 1.7, -0.2] },
  { u: 0.52, p: [-3.6, 1.7, 24.0], t: [0.7, 2.2, -0.8] },
  { u: 0.6, p: [-1.5, 1.8, 16.5], t: [0.6, 2.6, -1.2] },
  { u: 0.68, p: [-0.7, 1.9, 9.0], t: [1.0, 2.9, -2.0] },
  { u: 0.74, p: [-0.55, 1.75, 5.2], t: [1.2, 2.7, -3.0] },
  { u: 0.8, p: [-0.15, 1.62, 2.4], t: [1.0, 2.5, -3.3] },
  { u: 0.88, p: [0.15, 1.56, 1.1], t: [0.9, 2.35, -3.3] },
  { u: 0.95, p: [0.22, 1.55, 0.8], t: [0.85, 2.3, -3.3] },
  { u: 1.0, p: [0.23, 1.55, 0.72], t: [0.85, 2.3, -3.3] },
];
const cc = (sel: (k: (typeof CAM)[number]) => number) => new Curve(CAM.map((k) => [k.u, sel(k)] as [number, number]));
const camC = { px: cc((k) => k.p[0]), py: cc((k) => k.p[1]), pz: cc((k) => k.p[2]), tx: cc((k) => k.t[0]), ty: cc((k) => k.t[1]), tz: cc((k) => k.t[2]) };

const K = (pts: [number, number][]) => new Curve(pts);
const C = {
  sepR: K([[0, 0], [0.26, 0.002], [0.38, 0.014], [0.46, 0.12], [0.52, 0.5], [0.6, 1.4], [0.72, 1.62], [1, 1.62]]),
  sepL: K([[0, 0], [0.38, 0.004], [0.46, 0.05], [0.52, 0.2], [0.62, 0.5], [0.72, 0.86], [0.8, 0.9], [1, 0.9]]),
  capLift: K([[0, 0], [0.42, 0], [0.5, 0.05], [0.62, 0.16], [0.74, 0.16], [1, 0.16]]),
  capX: K([[0, 0], [0.42, 0], [0.5, 0.08], [0.66, 0.55], [0.78, 0.55], [1, 0.55]]),
  kX: K([[0, 0], [0.44, 0], [0.56, 0.2], [0.7, 0.5], [0.82, 0.5], [1, 0.5]]),
  kZ: K([[0, 0], [0.44, 0], [0.56, -0.2], [0.7, -0.5], [0.82, -0.5], [1, -0.5]]),
  stripI: K([[0, 0.9], [0.2, 1.0], [0.38, 0.8], [0.52, 0.25], [0.62, 0]]),
  stripY: K([[0, 2.5], [0.12, 2.5], [0.22, 3.3], [0.3, 2.9], [0.4, 2.5]]),
  dev: K([[0, 0], [0.13, 0], [0.22, 0.05], [0.3, 0.085], [0.38, 0.06], [0.46, 0.0], [1, 0]]),
  glow: K([[0, 0], [0.2, 0], [0.3, 0.4], [0.4, 1.0], [0.5, 1.2], [0.6, 0.7], [0.72, 0.25], [0.86, 0.0], [1, 0]]),
  glowW: K([[0, 0.008], [0.3, 0.012], [0.5, 0.03], [1, 0.03]]),
  slotI: K([[0, 0], [0.34, 0], [0.44, 3], [0.56, 10], [0.7, 32], [0.8, 52], [1, 52]]),
  slotE: K([[0, 0], [0.4, 0], [0.5, 1.5], [0.6, 3], [0.7, 4.5], [1, 4.5]]),
  envK: K([[0, 1], [0.5, 1], [0.7, 0.03], [0.9, 0.008], [1, 0.008]]),
  fill: K([[0, 0], [0.5, 0], [0.7, 0.2], [1, 0.3]]),
  fov: K([[0, 30], [0.6, 30], [0.8, 36], [1, 36]]),
  shift: K([[0, 0.3], [0.38, 0.3], [0.52, 0.27], [0.65, 0.08], [0.78, 0], [1, 0]]),
  exposure: K([[0, 1.0], [0.5, 1.0], [0.72, 1.2], [1, 1.35]]),
};
const FIN_X1 = [0.8, 1.0, 1.2];
const FIN_Z1 = [1.2, -0.9, -2.7];

/** Different masses respond with different inertia: the heavy mass lags, the glass is quick. */
export class Choreo {
  exposure = 1;
  shift = 0;
  fov = 30;
  readonly camPos = new THREE.Vector3();
  readonly camTarget = new THREE.Vector3();
  constructor(private w: World) {}

  apply(u: number, uL = u, uR = u, uC = u, uF = u): void {
    const w = this.w;
    // --- structural separation: R (lighter, set back) leads; L (tall, heavy) resists then follows
    const stress = smooth(0.25, 0.32, u) * (1 - smooth(0.4, 0.5, u)); // micro-flex: shear across the seam, then relaxes into separation
    w.L.position.set(-C.sepL.at(uL) - 0.004 * stress, 0.012 * stress, 0);
    w.R.position.set(C.sepR.at(uR) + 0.004 * stress, -0.016 * stress, 0);
    w.C.position.set(C.capX.at(uC), C.capLift.at(uC) + 0.01 * stress, 0);
    w.K.position.set(C.kX.at(uC), 0, C.kZ.at(uC));

    // --- glass blades: turn edge-on in the recess, then glide into the hall as columns
    w.fins.forEach((f, i) => {
      const rot = easeIO3(clamp01((uF - (0.4 + 0.02 * i)) / 0.12)) * (Math.PI / 2);
      const m = clamp01((uF - (0.6 + 0.03 * i)) / 0.14);
      const k = easeIO3(m);
      f.mesh.rotation.set(0.003 * stress * (i - 1), rot, 0.004 * stress * (i === 1 ? 1 : -1));
      f.mesh.position.set(f.x0 + (FIN_X1[i] - f.x0) * k, 4.6, 2.55 + (FIN_Z1[i] - 2.55) * k);
    });
    w.glass.ior = 1.52 + 0.1 * stress;
    w.glass.thickness = 0.3 + 0.1 * stress;

    // --- light narrative
    U.uStripI.value = C.stripI.at(u);
    U.uStripY.value = C.stripY.at(u);
    U.uDev.value = C.dev.at(u);
    U.uGlow.value = C.glow.at(u);
    U.uGlowW.value = C.glowW.at(u);
    U.uSlotI.value = C.slotI.at(u);
    const e = C.slotE.at(u);
    w.slotMat.color.setRGB(1.0 * e, 0.93 * e, 0.82 * e);
    U.uSlotE.value = e;
    U.uEnvK.value = C.envK.at(u);
    U.uFill.value = C.fill.at(u);
    U.uFlagOff.value = smooth(0.5, 0.74, u);
    this.exposure = C.exposure.at(u);
    this.shift = C.shift.at(u);
    this.fov = C.fov.at(u);
    w.mirror.visible = u < 0.62;
    (w.mirror.material as THREE.ShaderMaterial).uniforms.uK.value = 2.2 * (1 - smooth(0.46, 0.6, u));
    w.syncUniforms();

    // --- camera
    this.camPos.set(camC.px.at(u), camC.py.at(u), camC.pz.at(u));
    this.camTarget.set(camC.tx.at(u), camC.ty.at(u), camC.tz.at(u));
  }
}
export { easeIO5 };
