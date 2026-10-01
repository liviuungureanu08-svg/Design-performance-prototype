import * as THREE from 'three';
import type { Engine } from '../engine';
import { SUN } from '../engine';
import { fsVert, lib } from '../glsl';
import { smoothstep } from '../../scroll';

/**
 * T2 — the shell breaks.
 * The dome image is cut into ~70 irregular slabs of glass (real thickness, real depth) along a crack web that
 * radiates from the oculus. Cracks first leak the light of the world behind, then the slabs release in a wave
 * that travels outward from the opening: each tumbles toward and past the camera, and sheds micro-fragments
 * from its edges. Everything is a pure function of progress `uP` (computed in the vertex shader).
 */

type V2 = [number, number];
const TAU = Math.PI * 2;

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clipHalf(poly: V2[], nx: number, ny: number, c: number): V2[] {
  // keep points with nx*x + ny*y <= c
  const out: V2[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const da = nx * a[0] + ny * a[1] - c;
    const db = nx * b[0] + ny * b[1] - c;
    if (da <= 0) out.push(a);
    if (da * db < 0) {
      const t = da / (da - db);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}

function area(poly: V2[]): number {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    s += a[0] * b[1] - b[0] * a[1];
  }
  return s / 2;
}

function centroid(poly: V2[]): V2 {
  let cx = 0, cy = 0, A = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const k = a[0] * b[1] - b[0] * a[1];
    cx += (a[0] + b[0]) * k;
    cy += (a[1] + b[1]) * k;
    A += k;
  }
  return [cx / (3 * A), cy / (3 * A)];
}

function hash2(a: number, b: number): number {
  let h = Math.imul((a * 73856093) ^ (b * 19349663), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Break straight Voronoi borders into jagged cracks. Shared borders get identical jitter (canonical orientation). */
function jag(poly: V2[], hx: number, hy: number): V2[] {
  const out: V2[] = [];
  const q = (v: number) => Math.round(v * 2000);
  const onRect = (v: V2) => Math.abs(Math.abs(v[0]) - hx) < 1e-6 || Math.abs(Math.abs(v[1]) - hy) < 1e-6;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    out.push(a);
    if (onRect(a) && onRect(b) && (Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6)) continue;
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.min(4, Math.max(1, Math.floor(len / 0.11)));
    const flip = q(a[0]) * 7919 + q(a[1]) > q(b[0]) * 7919 + q(b[1]);
    const ca = flip ? b : a;
    const cb = flip ? a : b;
    const kx = q(ca[0]) * 31 + q(cb[0]);
    const ky = q(ca[1]) * 17 + q(cb[1]);
    const dx = (cb[0] - ca[0]) / len;
    const dy = (cb[1] - ca[1]) / len;
    const pts: V2[] = [];
    for (let k = 1; k <= n; k++) {
      const t = (k + (hash2(kx, ky + k) - 0.5) * 0.5) / (n + 1);
      const off = (hash2(kx + k * 13, ky - k * 7) - 0.5) * len * 0.22;
      pts.push([ca[0] + (cb[0] - ca[0]) * t - dy * off, ca[1] + (cb[1] - ca[1]) * t + dx * off]);
    }
    if (flip) pts.reverse();
    out.push(...pts);
  }
  return out;
}

/** A crack web: concentric rings of seeds around the impact point (radial + ring fractures), plus scatter. */
function makeCells(asp: number, origin: V2): V2[][] {
  const r = rng(23);
  const seeds: V2[] = [];
  const rings = [
    { r: 0.21, n: 11 },
    { r: 0.42, n: 17 },
    { r: 0.72, n: 21 },
    { r: 1.18, n: 17 },
    { r: 1.8, n: 11 },
  ];
  rings.forEach((ring) => {
    const off = r() * TAU;
    for (let j = 0; j < ring.n; j++) {
      const ang = off + (j + (r() - 0.5) * 0.6) * (TAU / ring.n);
      const rad = ring.r * (1 + (r() - 0.5) * 0.30);
      seeds.push([origin[0] + Math.cos(ang) * rad, origin[1] + Math.sin(ang) * rad]);
    }
  });
  for (let k = 0; k < 9; k++) {
    const ang = r() * TAU;
    const rad = 0.3 + r() * 0.9;
    seeds.push([origin[0] + Math.cos(ang) * rad, origin[1] + Math.sin(ang) * rad]);
  }
  const hx = asp / 2 + 0.04;
  const hy = 0.54;
  const cells: V2[][] = [];
  for (let i = 0; i < seeds.length; i++) {
    let poly: V2[] = [[-hx, -hy], [hx, -hy], [hx, hy], [-hx, hy]];
    const si = seeds[i];
    for (let j = 0; j < seeds.length && poly.length; j++) {
      if (i === j) continue;
      const sj = seeds[j];
      const nx = sj[0] - si[0];
      const ny = sj[1] - si[1];
      const c = (sj[0] * sj[0] + sj[1] * sj[1] - si[0] * si[0] - si[1] * si[1]) / 2;
      poly = clipHalf(poly, nx, ny, c);
    }
    if (poly.length >= 3 && Math.abs(area(poly)) > 2e-4) cells.push(jag(poly, hx, hy));
  }
  return cells;
}

const motionGLSL = /* glsl */ `
uniform float uP;
uniform vec3 uOrigin;   // crack origin xy, farthest cell distance
uniform float uAsp;

struct Motion { vec3 disp; mat3 rot; float tau; float t0; };

mat3 axisAngle(vec3 ax, float a) {
  float c = cos(a), s = sin(a), t = 1. - c;
  return mat3(
    t * ax.x * ax.x + c,        t * ax.x * ax.y + s * ax.z, t * ax.x * ax.z - s * ax.y,
    t * ax.x * ax.y - s * ax.z, t * ax.y * ax.y + c,        t * ax.y * ax.z + s * ax.x,
    t * ax.x * ax.z + s * ax.y, t * ax.y * ax.z - s * ax.x, t * ax.z * ax.z + c);
}

Motion shardMotion(vec2 cen, vec4 rnd) {
  Motion m;
  vec2 rel = cen - uOrigin.xy;
  float rr = length(rel) / uOrigin.z;
  vec2 dir = rel / max(length(rel), 1e-4);
  // release time: a wave outward from the opening, with per-slab jitter
  float t0 = .22 + .32 * pow(rr, .85) + rnd.x * .06;
  float tau = clamp((uP - t0) / .40, 0., 1.);
  float f = tau * tau;
  float e = tau * tau * (3. - 2. * tau);
  // the slab first loosens in its socket: a small, tense shudder before it leaves
  float pre = smoothstep(t0 - .16, t0, uP) * (1. - smoothstep(0., .06, tau));
  float prePush = smoothstep(t0 - .12, t0, uP);
  float big = step(.82, rnd.w);              // a few slabs rush the lens
  float zmax = mix(.55 + 1.5 * rnd.z * rnd.z, 2.6 + 1.0 * rnd.z, big);
  float spread = (.30 + .95 * rnd.y) * (1. + .5 * rr);
  vec3 disp = vec3(dir * spread * e * 1.5, f * zmax);
  disp.y -= f * (.04 + .22 * rnd.w);
  disp += vec3(dir * .0016 * prePush + (rnd.zw - .5) * .0022 * pre, -.006 * prePush);
  vec3 ax = normalize(vec3(rnd.x - .5, rnd.z - .5, rnd.w - .5) + vec3(.001, .002, .003));
  float ang = f * (1.1 + 3.6 * rnd.y) * (rnd.w > .5 ? 1. : -1.) + (rnd.x - .5) * .05 * prePush;
  m.disp = disp;
  m.rot = axisAngle(ax, ang);
  m.tau = tau;
  m.t0 = t0;
  return m;
}
`;

const shardVert = /* glsl */ `
${motionGLSL}
attribute vec3 aNormal;
attribute vec2 aCen;
attribute vec4 aRnd;
attribute vec3 aMisc;     // x: edge distance (world), y: kind (0 front, 1 back, 2 side), z: side param
varying vec3 vN;
varying vec3 vW;
varying vec2 vRest;
varying vec3 vMisc;
varying float vTau;
varying float vRR;

void main() {
  Motion m = shardMotion(aCen, aRnd);
  vec3 local = position;
  vec3 w = vec3(aCen, 0.) + m.disp + m.rot * local;
  vN = m.rot * aNormal;
  vW = w;
  vRest = aCen + local.xy;
  vMisc = aMisc;
  vTau = m.tau;
  vRR = length(aCen - uOrigin.xy) / uOrigin.z;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;

const microVert = /* glsl */ `
${motionGLSL}
attribute vec2 aSpawn;
attribute vec2 aCorner;
attribute vec4 aMRnd;
attribute vec2 aCen;
attribute vec4 aRnd;
varying vec2 vRest;
varying float vLife;
varying float vH;

void main() {
  Motion m = shardMotion(aCen, aRnd);
  vec2 relDir = normalize(aSpawn - aCen + 1e-4);
  float tm0 = m.t0 + .02 + aMRnd.x * .14;
  float tm = clamp((uP - tm0) / .34, 0., 1.);
  float grow = smoothstep(0., .04, tm);
  float life = grow * pow(max(1. - tm, 0.), .8) * (1. - smoothstep(.9, 1., uP));
  // rides the parent until it breaks away, then follows its own, wider arc
  vec3 own = vec3(relDir * (.10 + .55 * aMRnd.y) * tm + (aMRnd.zw - .5) * .35 * tm, (.2 + 1.3 * aMRnd.y * aMRnd.y) * tm * tm);
  own.y -= .25 * tm * tm * (.3 + aMRnd.z);
  vec3 local = vec3(aSpawn - aCen, .0);
  float spin = tm * (3. + 9. * aMRnd.w) * (aMRnd.z > .5 ? 1. : -1.);
  mat2 r2 = mat2(cos(spin), sin(spin), -sin(spin), cos(spin));
  vec3 w = vec3(aCen, 0.) + m.disp + m.rot * (local + vec3(r2 * aCorner * life, 0.)) + own;
  vRest = aSpawn;
  vLife = life;
  vH = aMRnd.y;
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;

const lightGLSL = /* glsl */ `
${lib}
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform float uTime;
uniform vec3 uSun;
uniform float uHoleR;

vec2 restUV(vec2 rest) { return vec2(rest.x / uAsp + .5, rest.y + .5); }
`;

const shardFrag = /* glsl */ `
precision highp float;
${motionGLSL}
${lightGLSL}
varying vec3 vN;
varying vec3 vW;
varying vec2 vRest;
varying vec3 vMisc;
varying float vTau;
varying float vRR;

void main() {
  float kind = vMisc.y;
  vec2 holeD = vRest - uOrigin.xy;
  float holeA = kind < 1.5 ? smoothstep(uHoleR - .0022, uHoleR + .0022, length(holeD)) : 1.;   // the oculus itself is a hole, not a slab
  if (holeA < .02) discard;

  vec3 N = normalize(vN);
  vec3 V = normalize(cameraPosition - vW);
  if (!gl_FrontFacing && kind > 1.5) N = -N;
  vec3 Lp = vec3(uOrigin.xy, 1.6);
  vec3 L = normalize(Lp - vW);
  vec2 uv = restUV(vRest);
  vec3 col;

  float crackWave = smoothstep(.0, .26, uP - (.02 + .26 * vRR));      // cracks creep outward from the opening
  float crackHot = crackWave * (.35 + 1.4 * smoothstep(.12, .52, uP));

  if (kind < .5) {
    // ---- front face: the dome, seen through a slab of glass ----
    vec2 scr = gl_FragCoord.xy / vec2(textureSize(tTo, 0));
    vec3 img = texture2D(tFrom, uv).rgb;
    img /= 1. + .55 * luma(img);
    float e = vMisc.x;
    float edge = 1. - smoothstep(0., .012, e);
    // glassy bevel refracts the world behind it
    vec2 off = N.xy * .035 * edge;
    vec3 behind = texture2D(tTo, scr + off).rgb;
    col = mix(img * .82, behind * 1.1 + vec3(.10, .12, .16), edge * .4 * smoothstep(0., .12, vTau));
    // broad specular + fresnel
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(R, V), 0.), 26.) * 1.1;
    float fres = pow(1. - abs(dot(N, V)), 3.);
    col += vec3(1., .86, .66) * spec * (.25 + .5 * vTau * 3.);
    col += vec3(.55, .75, 1.) * fres * .18 * vTau;
    // light leaking out of the cracks
    float flick = .55 + .45 * vnoise(vRest * 38. + uTime * .5);
    float crack = exp(-e / .0024) * crackHot * flick;
    col += vec3(1., .58, .26) * crack * 2.4 + vec3(1., .9, .75) * exp(-e / .0009) * crackHot * flick * 1.2;
    // as a slab leaves, the stone image clears into glass and starts to show the world behind it
    float clear = smoothstep(.04, .7, vTau) * .62;
    vec3 seen = texture2D(tTo, scr + N.xy * (.05 + .14 * vTau) + (uv - .5) * .02 * vTau).rgb;
    col = mix(col, seen * 1.15 + vec3(.05, .06, .09), clear);
    col *= 1. - .25 * smoothstep(0., 1., vTau);
  } else if (kind < 1.5) {
    // ---- back face: dark glass with a faint reflection of the world ----
    vec2 scr = gl_FragCoord.xy / vec2(textureSize(tTo, 0));
    vec3 behind = texture2D(tTo, scr + N.xy * .06).rgb;
    col = vec3(.012, .014, .02) + behind * .5;
    float fres = pow(1. - abs(dot(N, V)), 2.5);
    col += vec3(.6, .78, 1.) * fres * .35;
    vec3 R = reflect(-L, N);
    col += vec3(1., .8, .6) * pow(max(dot(R, V), 0.), 20.) * 1.1;
  } else {
    // ---- side wall: thickness. A bright, cool-to-warm glass edge ----
    float t = vMisc.z;
    float lit = .35 + .65 * pow(max(dot(N, L), 0.), .7);
    vec3 glass = mix(vec3(.55, .82, 1.), vec3(1., .74, .46), t);
    float released = smoothstep(0., .22, vTau);
    vec3 leak = vec3(1., .60, .28) * (.25 + 1.8 * crackHot);
    col = mix(leak * (.35 + .65 * lit), glass * (.75 + 1.1 * lit), released);
    col += vec3(1., .9, .75) * pow(1. - abs(dot(N, V)), 2.) * .35 * released;
  }
  gl_FragColor = vec4(col, holeA);
}`;

const microFrag = /* glsl */ `
precision highp float;
${motionGLSL}
${lightGLSL}
varying vec2 vRest;
varying float vLife;
varying float vH;
void main() {
  if (vLife < .01) discard;
  vec3 img = texture2D(tFrom, restUV(vRest)).rgb;
  float glint = step(.86, vH) * (.5 + .5 * sin(uTime * 9. + vH * 90.));
  vec3 col = img * (.8 + .5 * vH) + vec3(1., .82, .6) * glint * 1.6 * vLife;
  gl_FragColor = vec4(col, 1.);
}`;

const bgFrag = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform vec3 uSun;
uniform float uP;
uniform float uHoleR;
${lib}
void main() {
  float asp = uRes.x / uRes.y;
  vec2 pc = (vUv - .5) * vec2(asp, 1.);
  vec2 c = uSun.xy;
  // an impact "kick": the world behind pushes in as the shell lets go, then settles
  float kick = smoothstep(.28, .45, uP) * (1. - smoothstep(.45, 1., uP));
  float zoom = 1. + .07 * kick;
  vec2 q = c + (pc - c) / zoom;
  vec3 world = texture2D(tTo, q / vec2(asp, 1.) + .5).rgb;
  // inside the opening the sky condenses into the drop of light
  float d = length(pc - c);
  float swap = smoothstep(.05, .30, uP);
  vec3 sky = texture2D(tFrom, vUv).rgb;
  vec3 col = world;
  float inHole = smoothstep(uHoleR + .004, uHoleR - .004, d);
  col = mix(world, mix(sky, world, swap), inHole);
  gl_FragColor = vec4(col, 1.);
}`;

interface Built {
  asp: number;
  shards: THREE.Mesh;
  micro: THREE.Mesh;
  rMax: number;
}

export class FractureTransition {
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private built: Built | null = null;
  private bg: THREE.Mesh;
  private uniforms: Record<string, THREE.IUniform>;
  private readonly D = 4;

  constructor(private eng: Engine) {
    const u = eng.u;
    this.uniforms = {
      uP: u.uP,
      uAsp: { value: 1 },
      uOrigin: { value: new THREE.Vector3(SUN.x, SUN.y, 1.2) },
      tFrom: u.tFrom,
      tTo: u.tTo,
      uTime: u.uTime,
      uSun: u.uSun,
      uHoleR: { value: 0.148 },
      uRes: u.uRes,
    };
    this.camera = new THREE.PerspectiveCamera((2 * Math.atan(0.5 / this.D) * 180) / Math.PI, 1, 0.05, 40);
    this.camera.position.set(0, 0, this.D);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.bg = new THREE.Mesh(
      g,
      new THREE.ShaderMaterial({ vertexShader: fsVert, fragmentShader: bgFrag, uniforms: this.uniforms, depthTest: false, depthWrite: false }),
    );
    this.bg.frustumCulled = false;
    this.bg.renderOrder = -1;
    this.scene.add(this.bg);
  }

  private build(asp: number): void {
    if (this.built) {
      this.scene.remove(this.built.shards, this.built.micro);
      [this.built.shards, this.built.micro].forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
    }
    const origin: V2 = [SUN.x, SUN.y];
    const cells = makeCells(asp, origin);
    const rnd = rng(77);

    const pos: number[] = [], nor: number[] = [], cen: number[] = [], rn: number[] = [], misc: number[] = [];
    const mSpawn: number[] = [], mCorner: number[] = [], mRnd: number[] = [], mCen: number[] = [], mPR: number[] = [], mPos: number[] = [];
    let rMax = 0.5;

    for (const poly of cells) {
      const c = centroid(poly);
      const shardRnd: [number, number, number, number] = [rnd(), rnd(), rnd(), rnd()];
      const thick = 0.012 + rnd() * 0.016;
      const n = poly.length;
      const loc = poly.map((v) => [v[0] - c[0], v[1] - c[1]] as V2);
      // inradius estimate for edge-distance interpolation
      let inr = 1e9;
      for (let i = 0; i < n; i++) {
        const a = loc[i], b = loc[(i + 1) % n];
        const ex = b[0] - a[0], ey = b[1] - a[1];
        const len = Math.hypot(ex, ey) || 1;
        inr = Math.min(inr, Math.abs(a[0] * ey - a[1] * ex) / len);
      }
      rMax = Math.max(rMax, Math.hypot(c[0] - origin[0], c[1] - origin[1]));
      const push = (x: number, y: number, z: number, nx: number, ny: number, nz: number, ed: number, kind: number, st: number) => {
        pos.push(x, y, z);
        nor.push(nx, ny, nz);
        cen.push(c[0], c[1]);
        rn.push(...shardRnd);
        misc.push(ed, kind, st);
      };
      for (let i = 0; i < n; i++) {
        const a = loc[i], b = loc[(i + 1) % n];
        // front (ccw seen from +z)
        push(0, 0, thick / 2, 0, 0, 1, inr, 0, 0);
        push(a[0], a[1], thick / 2, 0, 0, 1, 0, 0, 0);
        push(b[0], b[1], thick / 2, 0, 0, 1, 0, 0, 0);
        // back
        push(0, 0, -thick / 2, 0, 0, -1, inr, 1, 0);
        push(b[0], b[1], -thick / 2, 0, 0, -1, 0, 1, 0);
        push(a[0], a[1], -thick / 2, 0, 0, -1, 0, 1, 0);
        // side wall
        const ex = b[0] - a[0], ey = b[1] - a[1];
        const len = Math.hypot(ex, ey) || 1;
        const nx = ey / len, ny = -ex / len; // outward for ccw polygons
        push(a[0], a[1], thick / 2, nx, ny, 0, 0, 2, 0);
        push(b[0], b[1], thick / 2, nx, ny, 0, 0, 2, 0);
        push(b[0], b[1], -thick / 2, nx, ny, 0, 0, 2, 1);
        push(a[0], a[1], thick / 2, nx, ny, 0, 0, 2, 0);
        push(b[0], b[1], -thick / 2, nx, ny, 0, 0, 2, 1);
        push(a[0], a[1], -thick / 2, nx, ny, 0, 0, 2, 1);
      }

      // micro-fragments: chips that will flake off this slab's edges
      const K = 24;
      const lens: number[] = [];
      let totalLen = 0;
      for (let i = 0; i < n; i++) {
        const l = Math.hypot(loc[(i + 1) % n][0] - loc[i][0], loc[(i + 1) % n][1] - loc[i][1]);
        lens.push(l);
        totalLen += l;
      }
      for (let k = 0; k < K; k++) {
        let r = rnd() * totalLen;
        let e = 0;
        while (e < n - 1 && r > lens[e]) {
          r -= lens[e];
          e++;
        }
        const a = loc[e], b = loc[(e + 1) % n];
        const t = r / (lens[e] || 1);
        // nudge inside so the chip appears to come from the slab, not the gap
        const sx = a[0] + (b[0] - a[0]) * t, sy = a[1] + (b[1] - a[1]) * t;
        const sp: V2 = [c[0] + sx * 0.97, c[1] + sy * 0.97];
        const size = 0.004 + Math.pow(rnd(), 2.4) * 0.020;
        const ang = rnd() * TAU;
        const mr: [number, number, number, number] = [rnd(), rnd(), rnd(), rnd()];
        const corners: V2[] = [[-1.3, -0.3], [1.2, -0.18], [0.2, 0.42]];
        for (const cc of corners) {
          const x = (cc[0] * Math.cos(ang) - cc[1] * Math.sin(ang)) * size;
          const y = (cc[0] * Math.sin(ang) + cc[1] * Math.cos(ang)) * size;
          mPos.push(0, 0, 0);
          mSpawn.push(sp[0], sp[1]);
          mCorner.push(x, y);
          mRnd.push(...mr);
          mCen.push(c[0], c[1]);
          mPR.push(...shardRnd);
        }
      }
    }

    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    sg.setAttribute('aNormal', new THREE.Float32BufferAttribute(nor, 3));
    sg.setAttribute('aCen', new THREE.Float32BufferAttribute(cen, 2));
    sg.setAttribute('aRnd', new THREE.Float32BufferAttribute(rn, 4));
    sg.setAttribute('aMisc', new THREE.Float32BufferAttribute(misc, 3));
    const smat = new THREE.ShaderMaterial({
      vertexShader: shardVert,
      fragmentShader: shardFrag,
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
      alphaToCoverage: true,
    });
    const shards = new THREE.Mesh(sg, smat);
    shards.frustumCulled = false;

    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.Float32BufferAttribute(mPos, 3));
    mg.setAttribute('aSpawn', new THREE.Float32BufferAttribute(mSpawn, 2));
    mg.setAttribute('aCorner', new THREE.Float32BufferAttribute(mCorner, 2));
    mg.setAttribute('aMRnd', new THREE.Float32BufferAttribute(mRnd, 4));
    mg.setAttribute('aCen', new THREE.Float32BufferAttribute(mCen, 2));
    mg.setAttribute('aRnd', new THREE.Float32BufferAttribute(mPR, 4));
    const mmat = new THREE.ShaderMaterial({
      vertexShader: microVert,
      fragmentShader: microFrag,
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
    });
    const micro = new THREE.Mesh(mg, mmat);
    micro.frustumCulled = false;

    this.scene.add(shards, micro);
    this.uniforms.uOrigin.value.set(SUN.x, SUN.y, rMax * 1.02);
    this.uniforms.uAsp.value = asp;
    this.built = { asp, shards, micro, rMax };
  }

  /** Renders the transition into rtComp. tFrom / tTo textures must already hold the two scenes. */
  render(p: number): void {
    const e = this.eng;
    const asp = e.width / e.height;
    if (!this.built || Math.abs(this.built.asp - asp) > 0.04) this.build(asp);
    this.uniforms.uAsp.value = asp;
    this.camera.aspect = asp;
    // the camera pushes through the debris once most of the shell has let go
    const dolly = 1.15 * smoothstep(0.5, 1.0, p);
    this.camera.position.set(0, 0, this.D - dolly);
    this.camera.updateProjectionMatrix();
    const r = e.renderer;
    r.setRenderTarget(e.rtComp);
    r.clear(true, true, false);
    (this.uniforms.uRes.value as THREE.Vector2).set(e.rtComp.width, e.rtComp.height);
    r.render(this.scene, this.camera);
  }

  dispose(): void {
    if (this.built) {
      [this.built.shards, this.built.micro].forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
    }
    this.bg.geometry.dispose();
    (this.bg.material as THREE.Material).dispose();
  }
}
