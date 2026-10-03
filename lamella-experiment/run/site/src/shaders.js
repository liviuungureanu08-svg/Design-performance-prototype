// LAMELLA — GLSL
// One instanced draw renders every plate. Layout, morphing, programmes and
// presence response are all evaluated per-plate on the GPU.

export const TRAIL = 28;
export const RIPPLES = 4;

const envChunk = /* glsl */ `
uniform float uDay;
uniform float uHorGlow;
uniform float uSlots;
uniform vec3 uKeyDir;

vec3 envColor(vec3 d, float slotK){
  float h = d.y;
  vec3 c = vec3(0.0105, 0.0088, 0.0072);
  c += vec3(0.050, 0.034, 0.021) * smoothstep(-0.1, 0.9, h) * 0.55;
  c += vec3(0.62, 0.33, 0.13) * exp(-abs(h - 0.015) * 10.0) * uHorGlow;
  float ang = atan(d.x, -d.z);
  float slot = pow(max(sin(ang * 7.0 + 0.6), 0.0), 140.0) * smoothstep(-0.05, 0.55, h);
  c += vec3(1.0, 0.80, 0.55) * slot * 0.55 * uSlots * slotK;
  float ring = exp(-pow((h - 0.82) * 14.0, 2.0));
  c += vec3(0.85, 0.65, 0.42) * ring * 0.10 * uSlots;
  float s = max(dot(d, uKeyDir), 0.0);
  vec3 sky = mix(vec3(1.20, 0.70, 0.38), vec3(0.20, 0.25, 0.34), smoothstep(0.0, 0.42, h));
  sky += vec3(1.1, 0.58, 0.26) * (pow(s, 40.0) * 0.9 + pow(s, 6.0) * 0.18);
  sky += vec3(1.0, 0.75, 0.5) * exp(-abs(h) * 30.0) * 0.5;
  vec3 gnd = vec3(0.11, 0.085, 0.07);
  vec3 day = mix(sky, gnd, smoothstep(0.0, -0.1, h));
  c = mix(c, day, uDay);
  c += vec3(1.0, 0.86, 0.62) * (pow(s, 1400.0) * 40.0 * (0.15 + uDay) + pow(s, 60.0) * 0.32 * uDay);
  return c;
}
`;

export const plateVertex = /* glsl */ `
#define PI 3.14159265359
#define TAU 6.28318530718
attribute vec2 aCell;
attribute vec4 aRand;

uniform float uTime;
uniform float uPTime;       // programme time (frozen under reduced motion)
uniform float uMorph;
uniform vec2  uGrid;        // cols, rows
uniform vec2  uWall;        // width, height
uniform vec3  uCanopy;      // width, depth, height
uniform vec4  uNave;        // length, radiusY, radiusZ, centerZ
uniform float uAspect;

uniform vec3  uHead;        // ndc x, ndc y, strength
uniform vec4  uTrail[${TRAIL}];
uniform vec4  uRipple[${RIPPLES}];
uniform float uRadius;
uniform float uPresAmt;

uniform float uIdle;
uniform float uSpark;
uniform float uIntro;
uniform float uTextAmt;
uniform float uTextMix;
uniform sampler2D uTextTex;
uniform float uWave;
uniform float uProc;
uniform float uProcAmt;
uniform float uOpen;
uniform float uWorkAmt;
uniform float uWorkA;
uniform float uWorkB;
uniform float uWorkMix;
uniform float uScan;
uniform float uHorizon;
uniform float uScrollVel;
uniform vec4  uSafe;        // ndc rect x0,y0,x1,y1
uniform float uSafeAmt;
uniform float uFloorY;

varying vec3 vNw;
varying vec3 vW;
varying vec3 vLN;
varying vec2 vFUV;
varying float vHash;
varying float vSpill;
varying float vH;
varying float vLit;
varying float vSafe;

float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

void layoutWall(vec2 c, out vec3 P, out vec3 N, out vec3 U){
  P = vec3((c.x - 0.5) * uWall.x, 0.55 + c.y * uWall.y, 0.0);
  N = vec3(0.0, 0.0, 1.0);
  U = vec3(0.0, 1.0, 0.0);
}

void layoutCanopy(vec2 c, out vec3 P, out vec3 N, out vec3 U){
  float x = (c.x - 0.5) * uCanopy.x;
  float z = -uCanopy.y * 0.62 + c.y * uCanopy.y;
  float t = uPTime * 0.32;
  float y = uCanopy.z + 0.95 * sin(x * 0.21 + t) * cos(z * 0.17 - t * 0.6) + 0.5 * sin(z * 0.33 + t * 0.8);
  float fx = 0.95 * 0.21 * cos(x * 0.21 + t) * cos(z * 0.17 - t * 0.6);
  float fz = -0.95 * 0.17 * sin(x * 0.21 + t) * sin(z * 0.17 - t * 0.6) + 0.5 * 0.33 * cos(z * 0.33 + t * 0.8);
  P = vec3(x, y, z);
  N = normalize(vec3(fx, -1.0, fz));
  U = normalize(vec3(0.0, fz, 1.0));
}

void layoutNave(vec2 c, out vec3 P, out vec3 N, out vec3 U){
  float x = (c.x - 0.5) * uNave.x;
  float th = PI * (1.0 - c.y);
  float ry = uNave.y, rz = uNave.z;
  // a faint helical twist so the vault reads as built, not extruded
  th += 0.05 * sin(c.x * 9.0);
  P = vec3(x, 0.2 + ry * sin(th), uNave.w + rz * cos(th));
  N = -normalize(vec3(0.0, sin(th) / ry, cos(th) / rz));
  U = normalize(vec3(0.0, -cos(th) * ry, sin(th) * rz));
}

void layoutAt(float i, vec2 c, out vec3 P, out vec3 N, out vec3 U){
  if (i < 0.5) layoutWall(c, P, N, U);
  else if (i < 1.5) layoutCanopy(c, P, N, U);
  else if (i < 2.5) layoutNave(c, P, N, U);
  else layoutWall(c, P, N, U);
}

float workProgram(float w, vec2 c, float t){
  float ar = (uGrid.x * 0.30) / (uGrid.y * 0.45);
  if (w < 0.5) {
    // Hall of Tides — a breathing waterline
    float level = 0.42 + 0.16 * sin(t * 0.45) + 0.03 * sin(c.x * 11.0 + t * 1.4) + 0.02 * sin(c.x * 27.0 - t * 2.1);
    float body = smoothstep(level + 0.012, level - 0.03, c.y);
    float crest = exp(-pow((c.y - level) / 0.018, 2.0));
    return clamp(body * (0.8 + 0.2 * sin(c.y * 26.0 - t * 0.9 + c.x * 4.0)) + crest, 0.0, 1.0);
  } else if (w < 1.5) {
    // Eclipse Lobby — an iris with a corona
    vec2 q = vec2((c.x - 0.5) * ar, c.y - 0.52);
    float d = length(q);
    float r = 0.26 + 0.035 * sin(t * 0.5);
    float corona = exp(-pow((d - r) / 0.022, 2.0)) + 0.55 * exp(-max(d - r, 0.0) * 9.0) * step(r, d) * (0.6 + 0.4 * sin(atan(q.y, q.x) * 18.0 + t));
    return clamp(corona, 0.0, 1.0);
  } else if (w < 2.5) {
    // Monsoon Arcade — rain falling at per-column speeds
    float col = floor(c.x * uGrid.x);
    float sp = 0.35 + hash11(col * 1.7) * 0.5;
    float y = fract(-t * sp * 0.6 + hash11(col * 3.1));
    float dy = c.y - y;
    float drop = exp(-pow(dy / 0.018, 2.0)) + smoothstep(0.22, 0.0, dy) * step(0.0, dy) * 0.35;
    float lit = step(0.55, hash11(col * 7.3));
    return clamp(drop * lit, 0.0, 1.0);
  } else {
    // Night Score — the wall as a slow spectrogram
    float col = floor(c.x * uGrid.x);
    float h = 0.25 + 0.22 * sin(t * 1.3 + col * 0.21) * sin(t * 0.37 + col * 0.05) + 0.12 * sin(t * 2.7 + col * 0.9);
    float bar = smoothstep(h + 0.02, h - 0.02, abs(c.y - 0.5) * 2.0);
    return bar * (0.65 + 0.35 * step(0.5, fract(col * 0.5)));
  }
}

void main(){
  vec2 c = aCell;
  float t = uPTime;

  // ---------------------------------------------------------------- layout morph
  float m = clamp(uMorph, 0.0, 3.0);
  float seg = min(floor(m), 2.0);
  float f = m - seg;
  float d;
  if (seg < 0.5) d = mix(1.0 - c.y, aRand.x, 0.12);
  else if (seg < 1.5) d = mix(abs(c.y - 0.5) * 2.0, aRand.x, 0.12);
  else d = mix(c.x, aRand.x, 0.12);
  const float S = 2.4;
  float ti = clamp(f * (1.0 + S) - d * S, 0.0, 1.0);
  ti = ti * ti * (3.0 - 2.0 * ti);
  float flight = sin(PI * ti);

  vec3 PA, NA, UA, PB, NB, UB;
  layoutAt(seg, c, PA, NA, UA);
  layoutAt(seg + 1.0, c, PB, NB, UB);
  vec3 RA = cross(UA, NA);

  vec3 P = mix(PA, PB, ti);
  vec3 N = normalize(mix(NA, NB, ti) + flight * RA * 0.9 + 1e-4);
  vec3 U = mix(UA, UB, ti);
  U = normalize(U - dot(U, N) * N);
  vec3 R = cross(U, N);
  P += normalize(NA + NB + vec3(0.0, 0.3, 0.0)) * flight * (0.7 + 1.1 * aRand.y);

  // ---------------------------------------------------------------- screen position (pre-mirror)
  vec4 clip = projectionMatrix * viewMatrix * vec4(P, 1.0);
  vec2 ndc = clip.xy / max(clip.w, 0.0001);
  vec2 sp = vec2(ndc.x * uAspect, ndc.y);

  // ---------------------------------------------------------------- programmes (in radians)
  float base = 0.0;
  base += uIdle * 0.075 * sin(t * 0.7 + c.x * 6.0 + c.y * 4.0 + aRand.x * TAU);

  // sparse, slow constellation of plates turning on their own — the wall at rest is alive
  float sp1 = pow(max(sin(t * (0.16 + aRand.w * 0.14) + aRand.x * 80.0), 0.0), 40.0);
  base += uSpark * uIdle * PI * sp1 * step(0.78, aRand.z);

  float ix = c.x + (c.y - 0.5) * 0.18 + aRand.z * 0.025;
  base += TAU * (1.0 - smoothstep(uIntro - 0.22, uIntro, ix));

  vec4 tx = texture2D(uTextTex, c);
  float tm = clamp(uTextMix * 1.6 - aRand.y * 0.6, 0.0, 1.0);
  tm = tm * tm * (3.0 - 2.0 * tm);
  base += PI * mix(tx.r, tx.g, tm) * uTextAmt;

  float wv = 0.5 + 0.5 * sin(c.x * 9.0 - t * 1.05 + sin(c.y * 5.0 + t * 0.35) * 2.0);
  base += uWave * PI * pow(wv, 2.2);

  float pb = exp(-pow((c.x - uProc) / 0.045, 2.0)) + 0.35 * exp(-pow((c.x - uProc - 0.11) / 0.02, 2.0));
  base += uProcAmt * PI * clamp(pb, 0.0, 1.0);

  float wk = mix(workProgram(uWorkA, c, t), workProgram(uWorkB, c, t), uWorkMix);
  base += uWorkAmt * PI * wk;

  float scanX = fract(t * 0.07);
  base += uScan * PI * 0.5 * exp(-pow((c.x - scanX) / 0.006, 2.0));

  base += uHorizon * PI * exp(-pow((c.y - 0.33) / 0.011, 2.0)) * (0.8 + 0.2 * sin(c.x * 30.0 + t * 0.6));

  base += uScrollVel * 0.9 * sin(c.x * 23.0 + c.y * 17.0 - t * 4.0 + aRand.w * 6.0);

  // ---------------------------------------------------------------- presence
  vec2 dh = sp - vec2(uHead.x * uAspect, uHead.y);
  float inv = 1.0 - clamp(exp(-dot(dh, dh) / (uRadius * uRadius)) * uHead.z, 0.0, 1.0);
  float wob = 0.0;
  for (int i = 0; i < ${TRAIL}; i++) {
    vec4 tr = uTrail[i];
    float age = uTime - tr.z;
    if (age < 0.0 || age > 4.5 || tr.w <= 0.0) continue;
    vec2 dd = sp - vec2(tr.x * uAspect, tr.y);
    float r = uRadius * (0.8 + age * 0.55);
    float g = exp(-dot(dd, dd) / (r * r)) * tr.w * exp(-age * 1.25);
    inv *= 1.0 - clamp(g, 0.0, 1.0);
    wob += g * sin(age * 6.5 - length(dd) * 14.0);
  }
  for (int i = 0; i < ${RIPPLES}; i++) {
    vec4 rp = uRipple[i];
    float age = uTime - rp.z;
    if (age < 0.0 || age > 3.5) continue;
    vec2 dd = sp - vec2(rp.x * uAspect, rp.y);
    float ring = exp(-pow((length(dd) - age * 1.05) / 0.07, 2.0)) * exp(-age * 0.7) * rp.w;
    inv *= 1.0 - clamp(ring, 0.0, 1.0);
  }
  float pres = (1.0 - inv) * uPresAmt;

  // the wall makes room for words
  vec2 sm = vec2(0.16, 0.2);
  float inside = smoothstep(uSafe.x - sm.x, uSafe.x + sm.x, ndc.x) * smoothstep(uSafe.z + sm.x, uSafe.z - sm.x, ndc.x)
               * smoothstep(uSafe.y - sm.y, uSafe.y + sm.y, ndc.y) * smoothstep(uSafe.w + sm.y, uSafe.w - sm.y, ndc.y);
  vSafe = uSafeAmt * inside;

  float side = dh.x < 0.0 ? -1.0 : 1.0;
  float phi = base;
  phi = mix(phi, side * PI, pres);
  phi += wob * 0.22 * uPresAmt;

  // signature: every plate turns edge-on, cascading away from the visitor
  vec3 Vc = normalize(cameraPosition - P);
  float edge = atan(-dot(N, Vc), dot(R, Vc));
  if (edge > PI * 0.5) edge -= PI;
  if (edge < -PI * 0.5) edge += PI;
  float dc = length(P - cameraPosition) / 34.0;
  float op = clamp(uOpen * 1.9 - dc * 0.9 - aRand.z * 0.12, 0.0, 1.0);
  op = op * op * (3.0 - 2.0 * op);
  phi = mix(phi, edge + 0.015 * sin(t * 1.3 + c.x * 20.0), op);

  // tumble while in flight between layouts
  phi += TAU * ti * (aRand.w > 0.5 ? 1.0 : -1.0) * step(0.001, f) * step(f, 0.999);

  // ---------------------------------------------------------------- assemble
  float cs = cos(phi), sn = sin(phi);
  vec3 lp = position;
  vec3 rp = vec3(lp.x * cs + lp.z * sn, lp.y, -lp.x * sn + lp.z * cs);
  vec3 ln = normal;
  vec3 rn = vec3(ln.x * cs + ln.z * sn, ln.y, -ln.x * sn + ln.z * cs);

  vec3 W = P + R * rp.x + U * rp.y + N * rp.z;
  vec3 Nw = R * rn.x + U * rn.y + N * rn.z;
  vH = max(W.y - uFloorY, 0.0);
#ifdef MIRROR
  W.y = 2.0 * uFloorY - W.y;
  Nw.y = -Nw.y;
#endif
  vW = W;
  vNw = Nw;
  vLN = normal;
  vFUV = position.xy / vec2(0.26, 0.40);
  vHash = aRand.y;
  vSpill = clamp(pres + uWorkAmt * wk * 0.6 + uTextAmt * 0.25, 0.0, 1.0);
  vLit = 1.0 - abs(cos(phi * 0.5)); // 0 dark side, 1 light side
  gl_Position = projectionMatrix * viewMatrix * vec4(W, 1.0);
}
`;

export const plateFragment = /* glsl */ `
precision highp float;
${envChunk}
uniform vec3 uLight;
uniform vec3 uLight2;
uniform float uGlow;
uniform vec3 uFog;
uniform float uFogDen;
uniform float uReflect;
uniform vec3 uLampPos;
uniform float uLampI;

varying float vSafe;
varying vec3 vNw;
varying vec3 vW;
varying vec3 vLN;
varying vec2 vFUV;
varying float vHash;
varying float vSpill;
varying float vH;
varying float vLit;

void main(){
  vec3 N = normalize(vNw);
  vec3 V = normalize(cameraPosition - vW);
  float ndv = clamp(dot(N, V), 0.0, 1.0);
  vec3 col;
  if (vLN.z > 0.5) {
    vec3 Rr = reflect(-V, N);
    vec3 e = envColor(Rr, 1.0);
    float fr = 0.07 + 0.93 * pow(1.0 - ndv, 5.0);
    vec3 tint = vec3(0.80, 0.63, 0.45) * (0.82 + 0.36 * vHash);
    float diff = max(dot(N, uKeyDir), 0.0);
    col = vec3(0.020, 0.016, 0.012) * (0.5 + diff) + e * tint * mix(0.42, 1.0, fr);
    // fine anodised grain across the blade
    col *= 0.94 + 0.06 * sin(vFUV.y * 90.0 + vHash * 40.0);
    vec3 Ld = uLampPos - vW;
    float ld = length(Ld);
    vec3 L = Ld / ld;
    vec3 Hh = normalize(L + V);
    col += vec3(1.0, 0.82, 0.58) * tint * (pow(max(dot(N, Hh), 0.0), 90.0) * 2.2 + max(dot(N, L), 0.0) * 0.05) * uLampI / (1.0 + ld * ld * 0.0016);
    col += uLight * vSpill * 0.035 * (1.0 - vSafe * 0.7);
  } else if (vLN.z < -0.5) {
    vec2 q = vFUV;
    float frame = smoothstep(0.5, 0.43, abs(q.x)) * smoothstep(0.5, 0.465, abs(q.y));
    float r2 = dot(q * vec2(1.5, 1.0), q * vec2(1.5, 1.0));
    float core = 0.55 + 1.25 * exp(-r2 * 7.0);
    vec3 lc = mix(uLight, uLight2, smoothstep(0.1, 0.9, exp(-r2 * 5.0)) * 0.8 + vHash * 0.15);
    col = lc * uGlow * mix(0.05, core, frame) * (1.0 - vSafe * 0.78);
    col += vec3(0.30, 0.22, 0.13) * (1.0 - frame) * 0.4;
  } else {
    vec3 Rr = reflect(-V, N);
    vec3 e = envColor(Rr, 1.0);
    float diff = max(dot(N, uKeyDir), 0.0);
    col = vec3(0.86, 0.64, 0.36) * (e * 1.1 + diff * 0.22 + 0.025);
    col += vec3(1.0, 0.78, 0.45) * pow(max(dot(reflect(-V, N), uKeyDir), 0.0), 24.0) * 2.5 * uDay;
    col += uLight * vLit * 0.18 * uGlow * (1.0 - vSafe * 0.7);
  }
  float dist = length(vW - cameraPosition);
  float fog = 1.0 - exp(-dist * uFogDen);
  col = mix(col, uFog, fog);
#ifdef MIRROR
  col *= uReflect * exp(-vH * 0.11);
#endif
  gl_FragColor = vec4(col, 1.0);
}
`;

export const bgVertex = /* glsl */ `
varying vec2 vNdc;
void main(){ vNdc = position.xy; gl_Position = vec4(position.xy, 0.9999, 1.0); }
`;

export const bgFragment = /* glsl */ `
precision highp float;
${envChunk}
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform float uBgDim;
varying vec2 vNdc;
void main(){
  vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize((uCamWorld * vec4(v.xyz / v.w, 0.0)).xyz);
  vec3 col = envColor(dir, 0.0) * uBgDim;
  gl_FragColor = vec4(col, 1.0);
}
`;

export const floorVertex = /* glsl */ `
varying vec3 vW;
void main(){
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

export const floorFragment = /* glsl */ `
precision highp float;
${envChunk}
uniform vec3 uFog;
uniform float uFogDen;
uniform vec3 uLight;
uniform float uPool;
uniform vec2 uPoolC;
varying vec3 vW;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
void main(){
  vec3 V = normalize(cameraPosition - vW);
  float ndv = clamp(V.y, 0.0, 1.0);
  float fr = 0.05 + 0.95 * pow(1.0 - ndv, 5.0);
  vec3 e = envColor(reflect(-V, vec3(0.0, 1.0, 0.0)), 0.6);
  // honed stone: large slabs with hairline joints
  vec2 g = vW.xz / 3.6;
  vec2 jf = abs(fract(g) - 0.5);
  float joint = smoothstep(0.497, 0.5, max(jf.x, jf.y));
  float tone = 0.85 + 0.15 * hash(floor(g));
  vec3 base = vec3(0.016, 0.0135, 0.011) * tone * (1.0 - joint * 0.5);
  vec3 col = base + e * fr * 0.35;
  float pool = exp(-length((vW.xz - uPoolC) * vec2(0.06, 0.16))) * uPool;
  col += uLight * pool * 0.05;
  float a = mix(0.88, 0.58, fr);
  float dist = length(vW - cameraPosition);
  float fog = 1.0 - exp(-dist * uFogDen);
  col = mix(col, uFog, fog);
  a = mix(a, 1.0, fog);
  gl_FragColor = vec4(col, a);
}
`;

export const finalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uExposure: { value: 1.0 },
    uVignette: { value: 0.55 },
    uGrain: { value: 0.035 },
    uRes: { value: [1, 1] },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */ `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uExposure;
    uniform float uVignette;
    uniform float uGrain;
    uniform vec2 uRes;
    varying vec2 vUv;
    vec3 aces(vec3 x){
      const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
      return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
    }
    vec3 toSRGB(vec3 c){
      return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
    }
    float hash(vec2 p){ p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb * uExposure;
      // gentle warm toe, cool-neutral shoulder
      c = aces(c * vec3(1.02, 1.0, 0.97));
      vec2 q = vUv - 0.5;
      q.x *= uRes.x / uRes.y;
      c *= 1.0 - uVignette * smoothstep(0.35, 1.25, length(q));
      c = toSRGB(c);
      float n = hash(vUv * uRes + fract(uTime * 13.7) * 100.0) - 0.5;
      c += n * uGrain;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
};
