// The one authored source of THE FOLD. Hidden generative logic (never labelled):
//   seg 1  UNDERSTAND  lying on the ground: it takes in the situation (the only contact with the world)
//   seg 2  DESIGN      the first fold: the band turns and lifts, the plates start to widen
//   seg 3  BUILD       the bearing plane: carries everything that follows
//   seg 4  AMPLIFY     the widest plane, cantilevered back over the beginning, higher and offset: the loop never closes,
//                      it climbs. The output overhangs the input.
// The spine (slit) is the one constant: the plates grow around it.
import * as THREE from 'three';
import { Folder, pl, type Design } from './fold';

export const P = {
  f1: 1.6, f2: 3.3, f3: 4.7, end: 6.1,
  a1: -20, p1: 85, a2: 22, p2: 85, a3: -18, p3: 90, a0: -8, ae: 12,
  l0: 0.35, l1: 0.42, l2: 0.55, l3: 0.7, l4: 0.9,
  r0: 0.25, r1: 0.32, r2: 0.48, r3: 0.68, r4: 0.95,
  yaw: -10, h: 0.07, gap: 0.03,
};
export type Params = typeof P;
export const SEG = P;

export function makeDesign(p: Params = P): Design {
  const place = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));
  place.premultiply(new THREE.Matrix4().makeRotationY(p.yaw * Math.PI / 180));
  place.premultiply(new THREE.Matrix4().makeTranslation(0, p.h / 2, 0));
  return {
    folds: [
      { u: p.f1, alpha: p.a1, phi: p.p1, r: 0.07 },
      { u: p.f2, alpha: p.a2, phi: p.p2, r: 0.07 },
      { u: p.f3, alpha: p.a3, phi: p.p3, r: 0.07 },
    ],
    length: p.end,
    h: p.h,
    gap: p.gap,
    edge: 0.006,
    wL: pl([[0, p.l0], [p.f1, p.l1], [p.f2, p.l2], [p.f3, p.l3], [p.end, p.l4]]),
    wR: pl([[0, p.r0], [p.f1, p.r1], [p.f2, p.r2], [p.f3, p.r3], [p.end, p.r4]]),
    startAlpha: p.a0,
    endAlpha: p.ae,
    place,
  };
}

export const makeFolder = (p: Params = P) => new Folder(makeDesign(p));
