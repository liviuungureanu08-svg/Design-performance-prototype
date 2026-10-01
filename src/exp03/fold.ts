// THE FOLD — one continuous band, folded like a sheet (developable: every fold is a real bend of radius r about a
// skewed fold line), split along its length by THE SPINE (a constant slit between two plates).
// Flat coordinates: u along the spine, v across it (v = 0 is the spine), z through the thickness.
// Everything derives from this one flat development, so Scene A and Scene B are literally the same object.
import * as THREE from 'three';

export interface Fold { u: number; alpha: number; phi: number; r: number }
export interface Design {
  folds: Fold[];
  length: number;
  h: number; // plate thickness
  gap: number; // spine slit width
  edge: number; // long-edge radius
  wL: (u: number) => number; // left plate outer edge (positive number, v = -wL)
  wR: (u: number) => number; // right plate outer edge
  startAlpha: number; endAlpha: number;
  place: THREE.Matrix4; // flat → world
}

const D2R = Math.PI / 180;

/** piecewise-linear keyframes [[u, value], ...] */
export const pl = (k: [number, number][]) => (u: number): number => {
  if (u <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (u <= k[i][0]) {
    const t = (u - k[i - 1][0]) / (k[i][0] - k[i - 1][0]);
    return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * t;
  }
  return k[k.length - 1][1];
};

interface FoldFrame { c: THREE.Vector3; m: THREE.Vector3; t: THREE.Vector3; R: THREE.Matrix4; w: number; f: Fold }

export class Folder {
  frames: FoldFrame[];
  d: Design;
  constructor(d: Design) {
    this.d = d;
    this.frames = d.folds.map((f) => {
      const a = f.alpha * D2R, pa = Math.abs(f.phi) * D2R, sg = Math.sign(f.phi) || 1;
      const c = new THREE.Vector3(f.u, 0, 0), m = new THREE.Vector3(Math.cos(a), -Math.sin(a), 0), t = new THREE.Vector3(Math.sin(a), Math.cos(a), 0);
      const B = new THREE.Matrix4().makeBasis(m, t, new THREE.Vector3(0, 0, 1)).setPosition(c);
      const L = new THREE.Matrix4().set(
        Math.cos(pa), 0, -sg * Math.sin(pa), f.r * Math.sin(pa) - f.r * pa * Math.cos(pa),
        0, 1, 0, 0,
        sg * Math.sin(pa), 0, Math.cos(pa), sg * (f.r * (1 - Math.cos(pa)) - f.r * pa * Math.sin(pa)),
        0, 0, 0, 1);
      const R = B.clone().multiply(L).multiply(B.clone().invert());
      return { c, m, t, R, w: f.r * pa, f };
    });
  }
  /** flat (u, v, z) → world */
  F(u: number, v: number, z: number, out = new THREE.Vector3()): THREE.Vector3 {
    const p = new THREE.Vector3(u, v, 0);
    const M = new THREE.Matrix4();
    for (const fr of this.frames) {
      const d = p.clone().sub(fr.c);
      const s = d.dot(fr.m);
      if (s <= 0) break;
      if (s < fr.w) {
        const tt = d.dot(fr.t), r = fr.f.r, sg = Math.sign(fr.f.phi) || 1, th = s / r;
        const ls = r * Math.sin(th) - z * sg * Math.sin(th), lz = sg * r * (1 - Math.cos(th)) + z * Math.cos(th);
        out.copy(fr.c).addScaledVector(fr.m, ls).addScaledVector(fr.t, tt).add(new THREE.Vector3(0, 0, lz));
        return out.applyMatrix4(M).applyMatrix4(this.d.place);
      }
      M.multiply(fr.R);
    }
    return out.set(u, v, z).applyMatrix4(M).applyMatrix4(this.d.place);
  }
  /** isolines (spine crossing u0, skew alpha in rad) aligned with every fold, so each bend is sampled exactly */
  isolines(u0: number, u1: number, step = 0.02, bendSteps = 10): { u: number; a: number }[] {
    const d = this.d, out: { u: number; a: number }[] = [];
    const lines: { u: number; a: number }[] = [];
    let prev = { u: 0, a: d.startAlpha * D2R };
    for (const fr of this.frames) {
      const a = fr.f.alpha * D2R;
      const n = Math.max(2, Math.ceil((fr.f.u - prev.u) / step));
      for (let i = 0; i < n; i++) { const t = i / n; lines.push({ u: prev.u + (fr.f.u - prev.u) * t, a: prev.a + (a - prev.a) * t }); }
      for (let i = 0; i < bendSteps; i++) lines.push({ u: fr.f.u + (fr.w * i / bendSteps) / Math.cos(a), a });
      prev = { u: fr.f.u + fr.w / Math.cos(a), a };
    }
    const ea = d.endAlpha * D2R, n = Math.max(2, Math.ceil((d.length - prev.u) / step));
    for (let i = 0; i <= n; i++) { const t = i / n; lines.push({ u: prev.u + (d.length - prev.u) * t, a: prev.a + (ea - prev.a) * t }); }
    // clip to [u0, u1] (inserting exact end lines)
    const lerpA = (u: number) => { for (let i = 1; i < lines.length; i++) if (lines[i].u >= u) { const t = (u - lines[i - 1].u) / Math.max(1e-9, lines[i].u - lines[i - 1].u); return lines[i - 1].a + (lines[i].a - lines[i - 1].a) * t; } return ea; };
    out.push({ u: u0, a: lerpA(u0) });
    for (const l of lines) if (l.u > u0 + 1e-6 && l.u < u1 - 1e-6) out.push(l);
    out.push({ u: u1, a: lerpA(u1) });
    return out;
  }
}

/** solve v = W(u0 + v tan a) for a plate edge on an isoline */
const edgeV = (W: (u: number) => number, u0: number, a: number, sign: number) => {
  let v = sign * W(u0);
  for (let i = 0; i < 6; i++) v = sign * W(u0 + v * Math.tan(a));
  return v;
};

export interface PlateSpec { side: -1 | 1; W: (u: number) => number; u0: number; u1: number; capStart?: boolean; capEnd?: boolean }

/** one plate (left or right of the spine) as a closed rounded-section sweep */
export function plateGeometry(fd: Folder, spec: PlateSpec): THREE.BufferGeometry {
  const d = fd.d, h = d.h, e = Math.min(d.edge, h * 0.45), g = d.gap / 2, segs = 5;
  const lines = fd.isolines(spec.u0, spec.u1);
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  const P = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3(), Ev = new THREE.Vector3();
  let ring = 0;
  for (const L of lines) {
    const ta = Math.tan(L.a);
    const vIn = spec.side * g, vOut = edgeV(spec.W, L.u, L.a, spec.side);
    const lo = Math.min(vIn, vOut), hi = Math.max(vIn, vOut);
    const ee = Math.min(e, (hi - lo) * 0.45);
    // profile loop in (v, z) with 2D normals; corners rounded with radius ee
    const prof: [number, number, number, number][] = [];
    const corners: [number, number, number][] = [[hi - ee, h / 2 - ee, 0], [lo + ee, h / 2 - ee, 90], [lo + ee, -h / 2 + ee, 180], [hi - ee, -h / 2 + ee, 270]];
    for (const [cv, cz, a0] of corners) for (let i = 0; i <= segs; i++) {
      const a = (a0 + 90 * i / segs) * D2R;
      prof.push([cv + ee * Math.cos(a), cz + ee * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
    const flat = (v: number) => [L.u + v * ta, v] as const;
    for (const [v, z, nv, nz] of prof) {
      const [fu, fv] = flat(v);
      fd.F(fu, fv, z, P);
      // surface normal and in-surface across-direction by finite differences on the mid-surface
      const eps = 1e-4;
      fd.F(fu + eps, fv, 0, A).sub(fd.F(fu - eps, fv, 0, B));
      const du = A.clone();
      fd.F(fu, fv + eps, 0, A).sub(fd.F(fu, fv - eps, 0, B));
      Ev.copy(A);
      N.crossVectors(du, Ev).normalize();
      Ev.addScaledVector(N, -Ev.dot(N)).normalize();
      const n3 = N.clone().multiplyScalar(nz).addScaledVector(Ev, nv).normalize();
      pos.push(P.x, P.y, P.z); nor.push(n3.x, n3.y, n3.z);
    }
    ring = prof.length;
  }
  const nl = lines.length;
  for (let i = 0; i < nl - 1; i++) for (let j = 0; j < ring; j++) {
    const a = i * ring + j, b = i * ring + (j + 1) % ring, c = (i + 1) * ring + j, dd = (i + 1) * ring + (j + 1) % ring;
    idx.push(a, b, c, b, dd, c);
  }
  // caps: duplicate ring vertices with flat normals, fan triangulation
  const cap = (li: number, flip: boolean) => {
    const base = pos.length / 3;
    const cx = new THREE.Vector3();
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j < ring; j++) { const k = (li * ring + j) * 3; const v = new THREE.Vector3(pos[k], pos[k + 1], pos[k + 2]); pts.push(v); cx.add(v); }
    cx.multiplyScalar(1 / ring);
    const n = new THREE.Vector3().crossVectors(pts[Math.floor(ring / 4)].clone().sub(cx), pts[0].clone().sub(cx)).normalize();
    // orient outward: away from the neighbouring ring
    const k2 = ((flip ? li - 1 : li + 1) * ring) * 3;
    const nb = new THREE.Vector3(pos[k2], pos[k2 + 1], pos[k2 + 2]);
    if (n.dot(cx.clone().sub(nb)) < 0) n.negate();
    for (const p of pts) { pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); }
    pos.push(cx.x, cx.y, cx.z); nor.push(n.x, n.y, n.z);
    const c = base + ring;
    for (let j = 0; j < ring; j++) {
      const a = base + j, b = base + (j + 1) % ring;
      // winding chosen so the face normal matches n
      const pa = pts[j], pb = pts[(j + 1) % ring];
      const fn = new THREE.Vector3().crossVectors(pa.clone().sub(cx), pb.clone().sub(cx));
      if (fn.dot(n) > 0) idx.push(c, a, b); else idx.push(c, b, a);
    }
  };
  if (spec.capStart !== false) cap(0, false);
  if (spec.capEnd !== false) cap(nl - 1, true);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setIndex(idx);
  return geo;
}

/** spine polyline (mid-thickness, v = 0) sampled along u */
export function spinePoints(fd: Folder, u0: number, u1: number, step = 0.01, z = 0): THREE.Vector3[] {
  const out: THREE.Vector3[] = [];
  const n = Math.max(2, Math.ceil((u1 - u0) / step));
  for (let i = 0; i <= n; i++) out.push(fd.F(u0 + (u1 - u0) * i / n, 0, z));
  return out;
}
