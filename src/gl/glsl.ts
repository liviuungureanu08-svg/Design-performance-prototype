/** Shared GLSL: noise, helpers, and the full-screen vertex shader. */

export const fsVert = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

export const lib = /* glsl */ `
#define PI 3.14159265359
#define TAU 6.28318530718

/* GLSL's smoothstep is undefined when edge0 >= edge1; this one is safe and allows reversed edges. */
float ss(float a, float b, float x){ float t = clamp((x - a) / (b - a + 1e-9 * step(abs(b - a), 1e-9)), 0., 1.); return t * t * (3. - 2. * t); }
#define smoothstep(a, b, x) ss(a, b, x)

float pw(float x, float y){ return pow(max(x, 1e-5), y); }
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2  hash22(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vn1(float x){ float i = floor(x), f = fract(x); f = f * f * (3. - 2. * f); return mix(hash11(i), hash11(i + 1.), f); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y);
}
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= .5; } return s; }
float fbm3(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = p * 2.03 + vec2(17.1, 9.7); a *= .5; } return s; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float sat(float x){ return clamp(x, 0., 1.); }
float luma(vec3 c){ return dot(c, vec3(.2126, .7152, .0722)); }
`;

export const common = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
${lib}
/** Height-normalised centred coordinates: y in [-.5,.5], x in [-aspect/2, aspect/2]. */
vec2 pcoord(vec2 uv){ return (uv - .5) * vec2(uRes.x / uRes.y, 1.); }
`;
