// Experiment 03 — Motion Proof. One deterministic function of scroll progress p ∈ [0, 1]:
//   MYSTERY (A) → SUSPICION (the spine's two lips part) → PARADOX (light boundaries migrate from the spine to where the
//   plate edges will be, along the whole band) → SIGNATURE (matter grows out of the spine to those boundaries: width,
//   then thickness; fresh matter still emits, then cools) → UNDERSTANDING → PHYSICAL HANDOFF (emission yields to
//   daylight through the slit) → REALITY (B).
// Nothing is generated that A did not already imply: the plates are B's own geometry, narrowed per isoline of the
// folding map (each isoline is rigid, so the narrowed plate is exact geometry, never a scaled mesh).
import * as THREE from 'three';
import type { Folder } from './fold';
import type { Params } from './design';
import { POSSIBILITY } from './ether';

const ss = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export const LE = 0.8; // length of the travelling light-boundary zone along the band (m of flat length)
export const LM = 1.15; // length of the travelling matter zone

export interface Choreo {
  split: number; // the spine's lips part (0 → 1)
  uE: number; // light-boundary frontier (flat u)
  uM: number; // matter frontier (flat u)
  emit: number; // authority of emitted light (1 → 0)
  sun: number; // authority of daylight (0 → 1)
  hand: number; // environment / look handoff A → B (0 → 1)
  cam: number; // investigator offset (0 → 1 → 0)
  glow: number; // light given off by forming matter (rises and falls with the signature moment)
}

export function choreo(p: number, P: Params): Choreo {
  const u0 = P.f2 - 0.35;
  // matter frontier; the light boundary runs only a short distance ahead of it (never a complete outline)
  const m = ss(0.4, 0.68, p);
  const uM = u0 + (P.end + LM - u0) * m;
  return {
    split: ss(0.14, 0.33, p),
    uE: uM + 1.05 * ss(0.27, 0.41, p),
    uM,
    emit: 1 - ss(0.73, 0.91, p),
    sun: ss(0.72, 0.93, p),
    hand: ss(0.72, 0.95, p),
    cam: ss(0.15, 0.48, p) * (1 - ss(0.57, 0.86, p)),
    glow: ss(0.44, 0.54, p) * (1 - ss(0.62, 0.78, p)),
  };
}

/* ------------------------------------------------------------------ */
/* uniforms shared by every material that takes part in the build      */
/* ------------------------------------------------------------------ */
export function buildUniforms() {
  return {
    uM: { value: -10 }, uE: { value: -10 }, uLM: { value: LM }, uLE: { value: LE },
    uSplit: { value: 0 }, uEmit: { value: 1 },
    uPoss: { value: POSSIBILITY.clone() },
  };
}
export type BuildUniforms = ReturnType<typeof buildUniforms>;

const GROW_COMMON = /* glsl */ `
  attribute float aU; attribute float aVf; attribute float aZf; attribute float aWB; attribute float aWA;
  attribute vec3 aDv; attribute vec3 aDz;
  uniform float uM; uniform float uLM;
  varying float vEm;
  float gsm(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0., 1.); return t * t * (3. - 2. * t); }
  void grow(inout vec3 p){
    float ms = clamp((uM - aU) / uLM, 0., 1.);
    float g = gsm(0., .55, ms);                       // width: matter spreads from the spine to the boundary
    float span = max(aWA, aWB * g);                    // never narrower than what A already had
    float th = aWA > 0. ? 1. : mix(.16, 1., gsm(.12, .78, ms)); // then the new plane gains its thickness
    p += aDv * (aVf * (span - aWB));
    p += aDz * (aZf * (th - 1.));
    float fresh = gsm(aWA - .004, aWA + .03, aVf * span);  // only matter that did not exist in A
    // the newest matter (its advancing front) still carries the light it came from, and cools behind it
    vEm = fresh * gsm(0., .07, ms) * (1. - gsm(.1, .62, ms)) * (.4 + .6 * pow(aVf, 4.));
  }`;

/** inject the build into a (physical) ceramic material: geometry + cooling emission of fresh matter */
export function growify(m: THREE.Material, U: BuildUniforms): void {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => {
    prev.call(m, s, r);
    Object.assign(s.uniforms, { uM: U.uM, uLM: U.uLM, uEmit: U.uEmit, uPoss: U.uPoss });
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n' + GROW_COMMON)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ngrow(transformed);');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vEm; uniform float uEmit; uniform vec3 uPoss;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uPoss * (vEm * uEmit * 0.9);');
  };
  m.customProgramCacheKey = () => 'exp03-grow-' + m.type;
}

/** shadow depth for grown plates (otherwise shadows would come from B's full geometry) */
export function growDepth(U: BuildUniforms): THREE.MeshDepthMaterial {
  const m = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, { uM: U.uM, uLM: U.uLM });
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\n' + GROW_COMMON)
      .replace('#include <begin_vertex>', '#include <begin_vertex>\ngrow(transformed);');
  };
  m.customProgramCacheKey = () => 'exp03-grow-depth';
  return m;
}

/* ------------------------------------------------------------------ */
/* plate geometry with build attributes (B's plate; A's width as floor) */
/* ------------------------------------------------------------------ */
const D2R = Math.PI / 180;
const edgeV = (W: (u: number) => number, u0: number, a: number, sign: number) => {
  let v = sign * W(u0);
  for (let i = 0; i < 6; i++) v = sign * W(u0 + v * Math.tan(a));
  return v;
};

export function growPlate(fd: Folder, side: -1 | 1, WB: (u: number) => number, WA: (u: number) => number): THREE.BufferGeometry {
  const d = fd.d, h = d.h, e = Math.min(d.edge, h * 0.45), g = d.gap / 2, segs = 5;
  const lines = fd.isolines(0, d.length, 0.012, 14);
  const pos: number[] = [], nor: number[] = [], idx: number[] = [];
  const at: Record<string, number[]> = { aU: [], aVf: [], aZf: [], aWB: [], aWA: [], aDv: [], aDz: [] };
  const P = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), N = new THREE.Vector3(), Ev = new THREE.Vector3();
  let ring = 0;
  for (const L of lines) {
    const ta = Math.tan(L.a);
    const vIn = side * g, vOut = edgeV(WB, L.u, L.a, side);
    const spanB = Math.abs(vOut - vIn);
    const wa = WA(L.u);
    const spanA = wa > 0 ? Math.abs(edgeV(WA, L.u, L.a, side) - vIn) : 0;
    const lo = Math.min(vIn, vOut), hi = Math.max(vIn, vOut);
    const ee = Math.min(e, (hi - lo) * 0.45);
    const prof: [number, number, number, number][] = [];
    const corners: [number, number, number][] = [[hi - ee, h / 2 - ee, 0], [lo + ee, h / 2 - ee, 90], [lo + ee, -h / 2 + ee, 180], [hi - ee, -h / 2 + ee, 270]];
    for (const [cv, cz, a0] of corners) for (let i = 0; i <= segs; i++) {
      const a = (a0 + 90 * i / segs) * D2R;
      prof.push([cv + ee * Math.cos(a), cz + ee * Math.sin(a), Math.cos(a), Math.sin(a)]);
    }
    for (const [v, z, nv, nz] of prof) {
      const fu = L.u + v * ta, fv = v;
      fd.F(fu, fv, z, P);
      const eps = 1e-4;
      fd.F(fu + eps, fv, 0, A).sub(fd.F(fu - eps, fv, 0, B));
      const du = A.clone();
      fd.F(fu, fv + eps, 0, A).sub(fd.F(fu, fv - eps, 0, B));
      Ev.copy(A);
      N.crossVectors(du, Ev).normalize();
      Ev.addScaledVector(N, -Ev.dot(N)).normalize();
      const n3 = N.clone().multiplyScalar(nz).addScaledVector(Ev, nv).normalize();
      pos.push(P.x, P.y, P.z); nor.push(n3.x, n3.y, n3.z);
      // derivatives along the isoline (rigid, so linear) and through the thickness
      const dv = fd.F(fu + ta * eps, fv + eps, z, A).sub(fd.F(fu - ta * eps, fv - eps, z, B)).multiplyScalar(side / (2 * eps)).clone();
      const dz = fd.F(fu, fv, z + eps, A).sub(fd.F(fu, fv, z - eps, B)).multiplyScalar(h / 2 / (2 * eps));
      at.aU.push(L.u); at.aVf.push(spanB > 0 ? Math.abs(v - vIn) / spanB : 0); at.aZf.push(z / (h / 2));
      at.aWB.push(spanB); at.aWA.push(spanA); at.aDv.push(dv.x, dv.y, dv.z); at.aDz.push(dz.x, dz.y, dz.z);
    }
    ring = prof.length;
  }
  const nl = lines.length;
  for (let i = 0; i < nl - 1; i++) for (let j = 0; j < ring; j++) {
    const a = i * ring + j, b = i * ring + (j + 1) % ring, c = (i + 1) * ring + j, dd = (i + 1) * ring + (j + 1) % ring;
    idx.push(a, b, c, b, dd, c);
  }
  const copyAttrs = (src: number) => { for (const k of Object.keys(at)) { const w = k === 'aDv' || k === 'aDz' ? 3 : 1; for (let c = 0; c < w; c++) at[k].push(at[k][src * w + c]); } };
  const cap = (li: number, flip: boolean) => {
    const base = pos.length / 3;
    const cx = new THREE.Vector3();
    const pts: THREE.Vector3[] = [];
    for (let j = 0; j < ring; j++) { const k = (li * ring + j) * 3; const v = new THREE.Vector3(pos[k], pos[k + 1], pos[k + 2]); pts.push(v); cx.add(v); }
    cx.multiplyScalar(1 / ring);
    const n = new THREE.Vector3().crossVectors(pts[Math.floor(ring / 4)].clone().sub(cx), pts[0].clone().sub(cx)).normalize();
    const k2 = ((flip ? li - 1 : li + 1) * ring) * 3;
    const nb = new THREE.Vector3(pos[k2], pos[k2 + 1], pos[k2 + 2]);
    if (n.dot(cx.clone().sub(nb)) < 0) n.negate();
    for (let j = 0; j < ring; j++) { const p = pts[j]; pos.push(p.x, p.y, p.z); nor.push(n.x, n.y, n.z); copyAttrs(li * ring + j); }
    // centre: mid of the profile (aVf 0.5, mid-thickness)
    pos.push(cx.x, cx.y, cx.z); nor.push(n.x, n.y, n.z);
    copyAttrs(li * ring); const last = pos.length / 3 - 1;
    at.aVf[last] = 0.5; at.aZf[last] = 0;
    const c = base + ring;
    for (let j = 0; j < ring; j++) {
      const a = base + j, b = base + (j + 1) % ring;
      const pa = pts[j], pb = pts[(j + 1) % ring];
      const fn = new THREE.Vector3().crossVectors(pa.clone().sub(cx), pb.clone().sub(cx));
      if (fn.dot(n) > 0) idx.push(c, a, b); else idx.push(c, b, a);
    }
  };
  cap(0, false);
  cap(nl - 1, true);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  for (const k of Object.keys(at)) geo.setAttribute(k, new THREE.Float32BufferAttribute(at[k], k === 'aDv' || k === 'aDz' ? 3 : 1));
  geo.setIndex(idx);
  return geo;
}

/* ------------------------------------------------------------------ */
/* light in air: lines that live on isolines of the band               */
/* ------------------------------------------------------------------ */
const env = (u: number, a: number, b: number, c: number, d: number) => ss(a, b, u) * (1 - ss(c, d, u));

/** mode 0: a spine lip (moves from the spine centre to its lip as uSplit rises)
 *  mode 1: A's construction hairline at the future outer edge (fades where matter arrives)
 *  mode 2: a light boundary that travels from the spine to the future outer edge, then hands over to matter */
export function lightLine(f: Folder, u0: number, u1: number, fade: [number, number, number, number], width: number, intensity: number,
  vA: (u: number, a: number) => number, vB: (u: number, a: number) => number, mode: 0 | 1 | 2, U: BuildUniforms, core = 1.6): THREE.Mesh {
  const lines = f.isolines(u0, u1, 0.008, 12);
  const pa: number[] = [], pb: number[] = [], ta: number[] = [], tb: number[] = [], side: number[] = [], amp: number[] = [], au: number[] = [], idx: number[] = [];
  const pts = lines.map((L) => {
    const t = Math.tan(L.a), va = vA(L.u, L.a), vb = vB(L.u, L.a);
    return { u: L.u, A: f.F(L.u + va * t, va, 0), B: f.F(L.u + vb * t, vb, 0) };
  });
  for (let i = 0; i < pts.length; i++) {
    const q = pts[Math.min(pts.length - 1, i + 1)], r = pts[Math.max(0, i - 1)];
    const tA = q.A.clone().sub(r.A).normalize(), tB = q.B.clone().sub(r.B).normalize();
    const a = env(pts[i].u, ...fade);
    for (const s of [-1, 1]) {
      pa.push(pts[i].A.x, pts[i].A.y, pts[i].A.z); pb.push(pts[i].B.x, pts[i].B.y, pts[i].B.z);
      ta.push(tA.x, tA.y, tA.z); tb.push(tB.x, tB.y, tB.z); side.push(s); amp.push(a); au.push(pts[i].u);
    }
    if (i > 0) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3));
  g.setAttribute('posB', new THREE.Float32BufferAttribute(pb, 3));
  g.setAttribute('tang', new THREE.Float32BufferAttribute(ta, 3));
  g.setAttribute('tangB', new THREE.Float32BufferAttribute(tb, 3));
  g.setAttribute('side', new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute('amp', new THREE.Float32BufferAttribute(amp, 1));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { width: { value: width }, core: { value: core }, color: { value: POSSIBILITY.clone().multiplyScalar(intensity) }, ...U },
    defines: { MODE: mode },
    vertexShader: /* glsl */ `
      attribute vec3 posB; attribute vec3 tang; attribute vec3 tangB; attribute float side; attribute float amp; attribute float aU;
      uniform float width, uM, uE, uLM, uLE, uSplit, uEmit; varying float vS; varying float vA;
      float gsm(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0., 1.); return t * t * (3. - 2. * t); }
      void main(){
        float ms = clamp((uM - aU) / uLM, 0., 1.), es = clamp((uE - aU) / uLE, 0., 1.);
        float k, a;
        #if MODE == 0
          k = uSplit; a = amp;
        #elif MODE == 1
          k = 0.; a = amp * (1. - gsm(0., .55, ms));
        #else
          k = gsm(0., .62, es); a = amp * gsm(.02, .3, es) * (1. - gsm(.2, .62, ms));
        #endif
        a *= uEmit;
        vec3 wp = (modelMatrix * vec4(mix(position, posB, k), 1.)).xyz;
        vec3 t = normalize(mix(tang, tangB, k));
        vec3 vd = normalize(cameraPosition - wp);
        wp += normalize(cross(t, vd)) * side * width;
        vS = side; vA = a;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color; uniform float core; varying float vS; varying float vA;
      void main(){
        float x = abs(vS);
        float c = exp(-x * x * 1600.);
        float halo = exp(-x * x * 30.) * 0.16 + exp(-x * 6.) * 0.05;
        gl_FragColor = vec4(color * (c * core + halo) * vA, 1.);
      }`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide, fog: false,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return mesh;
}

/** A's implied plane (faint luminous sheet over the future surfaces); it withdraws exactly where matter arrives */
export function hazePlane(f: Folder, u0: number, u1: number, fade: [number, number, number, number], intensity: number, U: BuildUniforms): THREE.Mesh {
  const d = f.d;
  const lines = f.isolines(u0, u1, 0.03, 8);
  const cols = 36;
  const pos: number[] = [], uv: number[] = [], au: number[] = [], idx: number[] = [];
  for (const L of lines) {
    const ta = Math.tan(L.a);
    for (let j = 0; j <= cols; j++) {
      const t = j / cols * 2 - 1;
      const W = t < 0 ? d.wL(L.u) : d.wR(L.u);
      const v = t * W;
      const p = f.F(L.u + v * ta, v, 0);
      pos.push(p.x, p.y, p.z);
      uv.push(t, env(L.u, ...fade)); au.push(L.u);
    }
  }
  for (let i = 0; i < lines.length - 1; i++) for (let j = 0; j < cols; j++) {
    const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, e = c + 1;
    idx.push(a, c, b, b, c, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aU', new THREE.Float32BufferAttribute(au, 1));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { color: { value: POSSIBILITY.clone().multiplyScalar(intensity) }, ...U },
    vertexShader: `attribute float aU; uniform float uM, uLM; varying vec2 vUv; varying float vMs;
      void main(){ vUv = uv; vMs = clamp((uM - aU) / uLM, 0., 1.); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.); }`,
    fragmentShader: `
      uniform vec3 color; uniform float uEmit; varying vec2 vUv; varying float vMs;
      float gsm(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0., 1.); return t * t * (3. - 2. * t); }
      void main(){
        float x = abs(vUv.x);
        float haze = exp(-x * 4.5) * (1. - smoothstep(0.7, 1.0, x));
        // the sheet lies on the mid-surface, so growing matter occludes it where it already exists; what is left of it
        // (ahead of the plate edge) withdraws as the matter zone completes
        gl_FragColor = vec4(color * haze * vUv.y * (1. - gsm(.3, .9, vMs)) * uEmit, 1.);
      }`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide, fog: false,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return mesh;
}
