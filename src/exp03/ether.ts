// The immaterial part of Scene A. Not decoration: the spine where no plate exists yet, and the planes it implies.
// Both are additive light in air (no bloom anywhere): a camera-facing ribbon along the spine (thin core, soft halo),
// and a faint sheet occupying the future plane, densest at the spine and at the future outer edges.
import * as THREE from 'three';
import type { Folder } from './fold';

export const POSSIBILITY = new THREE.Color(0.42, 0.62, 1.0); // airy blue, not cyan

/** envelope along u: 0 before a, ramps to 1 by b, holds, fades from c to 0 at d (smooth) */
const env = (u: number, a: number, b: number, c: number, d: number) => {
  const ss = (e0: number, e1: number, x: number) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  return ss(a, b, u) * (1 - ss(c, d, u));
};

export function spineLight(f: Folder, u0: number, u1: number, fade: [number, number, number, number], width: number, intensity: number, vf: (u: number) => number = () => 0, z = 0, core = 1.6): THREE.Mesh {
  const pos: number[] = [], tan: number[] = [], side: number[] = [], amp: number[] = [], idx: number[] = [];
  const n = Math.ceil((u1 - u0) / 0.008);
  for (let i = 0; i <= n; i++) {
    const u = u0 + (u1 - u0) * i / n;
    const p = f.F(u, vf(u), z);
    const q = f.F(Math.min(u1, u + 0.004), vf(Math.min(u1, u + 0.004)), z), r = f.F(Math.max(u0, u - 0.004), vf(Math.max(u0, u - 0.004)), z);
    const t = q.sub(r).normalize();
    const a = env(u, ...fade);
    for (const s of [-1, 1]) { pos.push(p.x, p.y, p.z); tan.push(t.x, t.y, t.z); side.push(s); amp.push(a); }
    if (i > 0) { const k = (i - 1) * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('tang', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('side', new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute('amp', new THREE.Float32BufferAttribute(amp, 1));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { width: { value: width }, core: { value: core }, color: { value: POSSIBILITY.clone().multiplyScalar(intensity) } },
    vertexShader: `
      attribute vec3 tang; attribute float side; attribute float amp;
      uniform float width; varying float vS; varying float vA;
      void main(){
        vec3 wp = (modelMatrix * vec4(position, 1.)).xyz;
        vec3 vd = normalize(cameraPosition - wp);
        vec3 off = normalize(cross(tang, vd));
        wp += off * side * width;
        vS = side; vA = amp;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: `
      uniform vec3 color; uniform float core; varying float vS; varying float vA;
      void main(){
        float x = abs(vS);
        // a hairline core and a soft, wide falloff: light in air, not a tube
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

/** the implied plane: a faint luminous sheet over the future plate surfaces (both sides of the spine) */
export function impliedPlane(f: Folder, u0: number, u1: number, fade: [number, number, number, number], intensity: number): THREE.Mesh {
  const d = f.d;
  const lines = f.isolines(u0, u1, 0.03, 8);
  const cols = 36;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (const L of lines) {
    const ta = Math.tan(L.a);
    for (let j = 0; j <= cols; j++) {
      const t = j / cols * 2 - 1; // -1 … 1 across (left edge … right edge)
      const W = t < 0 ? d.wL(L.u) : d.wR(L.u);
      const v = t * W;
      const p = f.F(L.u + v * ta, v, 0);
      pos.push(p.x, p.y, p.z);
      uv.push(t, env(L.u, ...fade));
    }
  }
  for (let i = 0; i < lines.length - 1; i++) for (let j = 0; j < cols; j++) {
    const a = i * (cols + 1) + j, b = a + 1, c = a + cols + 1, e = c + 1;
    idx.push(a, c, b, b, c, e);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: { color: { value: POSSIBILITY.clone().multiplyScalar(intensity) } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 wp = modelMatrix * vec4(position, 1.); vV = normalize(cameraPosition - wp.xyz); gl_Position = projectionMatrix * viewMatrix * wp; }',
    fragmentShader: `
      uniform vec3 color; varying vec2 vUv;
      void main(){
        float x = abs(vUv.x);
        // densest at the spine, thinning toward where the surface will be; no rim (a rim reads as glass)
        float haze = exp(-x * 4.5) * (1. - smoothstep(0.7, 1.0, x));
        gl_FragColor = vec4(color * haze * vUv.y, 1.);
      }`,
    blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, side: THREE.DoubleSide, fog: false,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  return mesh;
}
