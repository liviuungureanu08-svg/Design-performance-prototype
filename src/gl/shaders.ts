/**
 * Shard shaders.
 *
 * One instance = one fragment of the image. Its whole life is a pure function
 * of the transformation progress `uT`, so scrolling backwards, pausing or
 * jumping to any position always yields a coherent frame.
 *
 *   rest in A  ->  (edge-first) departure  ->  controlled ring-shaped field
 *              ->  convergence  ->  rest in B
 */

export const shardVert = /* glsl */ `
precision highp float;

uniform sampler2D uDepthA;
uniform sampler2D uDepthB;
uniform float uT;
uniform float uTime;
uniform float uVel;
uniform float uCamDist;
uniform float uDepthAmp;
uniform vec2 uGrid;
uniform vec2 uPlane;
uniform vec2 uFocusA;

attribute vec2 aCell;
attribute vec2 aDest;
attribute vec4 aRand;

varying vec2 vUvA;
varying vec2 vUvB;
varying float vMix;
varying float vShade;
varying float vSpark;
varying float vFog;

const float PI = 3.14159265;
const float TAU = 6.2831853;
const float DUR = 0.72;

float h21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 h22(vec2 p) { return vec2(h21(p), h21(p + 17.17)); }

// Shared lattice corner: neighbours agree on it, so shards tile exactly at rest.
vec2 lattice(vec2 l) {
  vec2 j = (h22(l) - 0.5) * 0.74;
  j *= step(vec2(0.5), l) * step(l, uGrid - 0.5);
  return (l + j) / uGrid;
}
vec2 toPlane(vec2 n) { return vec2((n.x - 0.5) * uPlane.x, (0.5 - n.y) * uPlane.y); }
vec2 toUv(vec2 n) { return vec2(n.x, 1.0 - n.y); }
float persp(float z) { return (uCamDist - z) / uCamDist; }

mat3 rotAxis(vec3 a, float t) {
  float c = cos(t), s = sin(t), k = 1.0 - c;
  return mat3(
    k*a.x*a.x + c,     k*a.x*a.y + s*a.z, k*a.x*a.z - s*a.y,
    k*a.x*a.y - s*a.z, k*a.y*a.y + c,     k*a.y*a.z + s*a.x,
    k*a.x*a.z + s*a.y, k*a.y*a.z - s*a.x, k*a.z*a.z + c);
}

float easeQ(float q) {
  // A cubic ease with a dwell around q = 0.5 so the intermediate field is readable.
  float f = q + 0.8 * sin(TAU * q) / TAU;
  return f * f * (3.0 - 2.0 * f);
}

vec3 pathAt(float q, vec3 P0, vec3 P1, vec3 M) {
  float e = easeQ(q);
  vec3 C = 2.0 * M - 0.5 * (P0 + P1); // makes the curve pass exactly through M at e = 0.5
  float ie = 1.0 - e;
  return ie * ie * P0 + 2.0 * ie * e * C + e * e * P1;
}

void main() {
  vec2 corner = position.xy;

  // --- rest states ------------------------------------------------------
  vec2 nA = (aCell + 0.5) / uGrid;
  vec2 nB = (aDest + 0.5) / uGrid;
  float zA = (texture2D(uDepthA, toUv(nA)).r - 0.5) * uDepthAmp;
  float zB = (texture2D(uDepthB, toUv(nB)).r - 0.5) * uDepthAmp;
  vec3 P0 = vec3(toPlane(nA) * persp(zA), zA);
  vec3 P1 = vec3(toPlane(nB) * persp(zB), zB);

  vec2 cornerA = lattice(aCell + corner);
  vec2 cornerB = lattice(aDest + corner);
  vec2 shapeA = (toPlane(cornerA) - toPlane(nA)) * persp(zA);
  vec2 shapeB = (toPlane(cornerB) - toPlane(nB)) * persp(zB);

  // --- departure: centre holds, periphery destabilises first -------------
  float aspect = uPlane.x / uPlane.y;
  vec2 dv = (nA - 0.5) * vec2(aspect, 1.0);
  float r = clamp(length(dv) / (0.5 * length(vec2(aspect, 1.0))), 0.0, 1.0);
  float lump = 0.5 + 0.5 * sin(nA.x * 9.0 + 1.3 + sin(nA.y * 7.0) * 2.0) * sin(nA.y * 8.0 + 0.4 + sin(nA.x * 5.0));
  float inner = 1.0 - smoothstep(0.10, 1.0, r); // the periphery leaves first, the centre holds longest
  float d = 0.04 + 0.24 * clamp(0.80 * pow(inner, 1.1) + 0.12 * lump + 0.08 * aRand.w, 0.0, 1.0);
  float q = clamp((uT - d) / DUR, 0.0, 1.0);
  float e = easeQ(q);
  float b = sin(PI * e);

  // --- the controlled intermediate field: a tilted, shearing ring --------
  // Angle and radius come from the fragment's place in A, so neighbours travel
  // together: the picture is polar-unwrapped into the ring, not scattered.
  vec2 fv = (nA - uFocusA) * vec2(aspect, 1.0);
  float thA = atan(fv.y, fv.x);
  float rn = clamp(length(fv) / 1.0, 0.0, 1.0);
  float rad = 0.50 + 1.10 * pow(rn, 0.8) + 0.16 * (aRand.y - 0.5);
  float spin = uT * 1.9 + (1.7 - rad) * uT * 0.9;
  float th = thA + spin;
  vec3 ring = vec3(cos(th) * rad * 1.25, sin(th) * rad * 0.5, (aRand.z - 0.5) * 0.5 + sin(th * 2.0) * 0.12);
  float tx = 0.55, tz = -0.28;
  ring = vec3(ring.x, ring.y * cos(tx) - ring.z * sin(tx), ring.y * sin(tx) + ring.z * cos(tx));
  ring = vec3(ring.x * cos(tz) - ring.y * sin(tz), ring.x * sin(tz) + ring.y * cos(tz), ring.z);

  vec3 P = pathAt(q, P0, P1, ring);
  vec3 turb = vec3(
    sin(aRand.x * 53.0 + uT * 4.0 + P.y * 2.0),
    sin(aRand.y * 47.0 + uT * 3.3 + P.x * 2.0),
    sin(aRand.z * 61.0 + uT * 3.7)) * 0.022 * b;
  P += turb;
  float hero = step(0.988, aRand.x);
  P.z += hero * 0.55 * b;

  // --- tension: fragments shiver and draw inward just before leaving -----
  float pre = smoothstep(d - 0.12, d, uT) * (1.0 - smoothstep(0.0, 0.07, q));
  vec2 inward = -normalize(dv + 1e-4) * 0.012 * pre;
  float tt = uTime * 24.0;
  vec2 shiver = (vec2(h21(aCell + floor(tt)), h21(aCell + 9.0 + floor(tt))) - 0.5) * 0.010 * pre;
  P.xy += inward + shiver;

  // --- shard orientation, scale, motion stretch --------------------------
  vec3 axis = normalize(vec3(h21(aCell * 1.7) - 0.5, h21(aCell * 2.3) - 0.5, h21(aCell * 3.1) - 0.3) + 1e-3);
  float ang = (aRand.w * 2.0 - 1.0) * 3.4 * b + (aRand.y - 0.5) * 1.0 * b;
  mat3 R = rotAxis(axis, ang);
  float sVar = mix(1.0, (0.30 + aRand.w * aRand.w * 1.15) * (1.0 + hero * (1.4 + 2.2 * aRand.y)), b);
  vec3 off = vec3(mix(shapeA, shapeB, smoothstep(0.0, 1.0, e)), 0.0) * (1.04 * sVar);
  off = R * off;

  vec3 vq = (pathAt(min(q + 0.012, 1.0), P0, P1, ring) - pathAt(q, P0, P1, ring)) / 0.012;
  float speed = length(vq) / DUR;
  vec3 vdir = vq / (length(vq) + 1e-4);
  float stretch = clamp(speed * abs(uVel) * 0.10, 0.0, 2.2) * step(0.001, q) * step(q, 0.999);
  off += vdir * dot(off, vdir) * stretch;

  vec3 pos = P + off;

  // --- colour & light cues ----------------------------------------------
  vUvA = toUv(cornerA);
  vUvB = toUv(cornerB);
  vMix = smoothstep(0.40, 0.80, q);

  vec3 n = R * vec3(0.0, 0.0, 1.0);
  vec3 L = normalize(vec3(-0.45, 0.55, 0.70));
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  vShade = mix(1.0, (0.60 + 0.62 * abs(dot(n, L))) * (1.0 - 0.18 * hero), b);
  vSpark = pow(abs(dot(n, H)), 48.0) * b * (0.35 + aRand.z);
  vFog = smoothstep(0.55, -1.5, pos.z) * 0.55 * b;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const shardFrag = /* glsl */ `
precision highp float;

uniform sampler2D uColorA;
uniform sampler2D uColorB;

varying vec2 vUvA;
varying vec2 vUvB;
varying float vMix;
varying float vShade;
varying float vSpark;
varying float vFog;

void main() {
  vec3 ca = texture2D(uColorA, vUvA).rgb;
  vec3 cb = texture2D(uColorB, vUvB).rgb;
  vec3 col = mix(ca, cb, vMix);
  col *= vShade;
  vec3 tint = mix(vec3(1.0, 0.78, 0.55), vec3(0.55, 0.95, 1.0), vMix);
  col += vSpark * tint * 0.9;
  col *= 1.0 - 0.85 * vFog;
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;

export const backdropVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

/** A dark, blurred under-glow: what shows through where shards have left. */
export const backdropFrag = /* glsl */ `
precision highp float;
uniform sampler2D uBlurA;
uniform sampler2D uBlurB;
uniform float uT;
varying vec2 vUv;
void main() {
  vec3 a = texture2D(uBlurA, vUv).rgb;
  vec3 b = texture2D(uBlurB, vUv).rgb;
  vec3 col = mix(a, b, smoothstep(0.50, 0.95, uT));
  float away = smoothstep(0.0, 0.42, uT) * (1.0 - smoothstep(0.80, 1.0, uT));
  col *= mix(1.0, 0.22, away);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
`;
