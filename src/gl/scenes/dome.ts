import { common } from '../glsl';

/**
 * CHAPTER II — WITHIN.
 * Looking straight up inside a monumental coffered dome. Real ray/sphere geometry (not a texture), so the
 * eye can move and the room parallaxes. A single oculus lets in one shaft of light with scattering dust.
 * uCam.xy = eye offset, uCam.z = zoom (the arrival from the aperture zooms OUT through this).
 */
export const domeFrag = /* glsl */ `
${common}
uniform vec3 uCam;
uniform vec3 uSun;     // screen centre of the oculus (shared with the portal composite)
uniform float uCrack;  // 0..1 light-leak hint of the coming fracture (handled in the composite, unused here)

const float TH0 = .200;            // oculus angular radius (radians from zenith)
const float TFOV = .72;            // tan(fov/2)
const vec3 BEAM = vec3(.85, -.36, -.38);

float sdBox(vec2 p, vec2 b){ vec2 d = abs(p) - b; return length(max(d, 0.)) + min(max(d.x, d.y), 0.); }

vec3 skyOculus(vec2 q) {
  float c = fbm(q * 7. + vec2(uTime * .015, 0.));
  vec3 s = mix(vec3(1.0, .80, .52), vec3(1.0, .96, .90), smoothstep(.2, .8, c));
  return s * (2.4 + 1.8 * c) * mix(.8, 1.5, pw(sat(1. - length(q) * 2.2), 1.5));
}

// returns lit amount 0..1 of a world point via the oculus (direct beam)
float beamLit(vec3 h) {
  vec3 bd = normalize(BEAM);
  float t = (h.y - cos(TH0)) / bd.y;
  vec3 pt = h - t * bd;
  float rad = sin(TH0) * .985;
  return t < 0. ? 0. : smoothstep(rad, rad * .55, length(pt.xz));
}

void main() {
  float Z = max(1. + uCam.z, .3);
  // baseline eye looks slightly off-axis; subtract where the oculus lands so it sits exactly on uSun
  vec2 p = pcoord(vUv) - uSun.xy + vec2(.0562, -.0357) * Z;
  vec3 eye = vec3(uCam.x * .28 - .11, -.36 + uCam.y * .12, uCam.y * .14 + .07);
  vec3 d = normalize(vec3(p.x * 2. * TFOV / Z, 1., p.y * 2. * TFOV / Z));
  // ray / unit sphere (we are inside)
  float b = dot(eye, d);
  float t = -b + sqrt(b * b - (dot(eye, eye) - 1.));
  vec3 h = eye + t * d;
  float th = acos(clamp(h.y, -1., 1.));
  float ph = atan(h.z, h.x);

  vec3 col;
  float rimEdge = TH0 + .030;
  if (th < TH0) {
    // sky seen through the oculus
    col = skyOculus(h.xz / max(h.y, .2) * 1.0);
  } else {
    // ---- coffers ----
    const float ROWS = 4.;
    const float COLS = 28.;
    float thA = rimEdge + .035;
    float thB = 1.34;
    float s = clamp((th - thA) / (thB - thA), 0., 1.);
    float sr = 1. - pow(1. - s, 1.18);
    float rowf = sr * ROWS;
    float row = floor(rowf);
    float v = fract(rowf);
    float uu = fract(ph / TAU * COLS + (mod(row, 2.) * .0));
    float colId = floor(ph / TAU * COLS);

    float cellH = (thB - thA) / ROWS * .78;
    float cellW = sin(th) * TAU / COLS;
    float du = min(uu, 1. - uu) * cellW;
    float dv = min(v, 1. - v) * cellH;
    float bev = .0105;
    float edge = min(du, dv);
    // anti-alias: when a coffer is only a few pixels wide, fade its relief into plain wall instead of shimmering
    float cfc = ph / TAU * COLS;
    float fwC = min(fwidth(cfc), fwidth(fract(cfc + .5)));
    float detail = 1. - smoothstep(.22, .5, max(fwidth(rowf), fwC));
    float inCof = (1. - smoothstep(.985, 1., s)) * detail;   // below the last row the wall is plain
    float inBev = (1. - smoothstep(0., bev, edge)) * inCof;
    float recess = smoothstep(bev * .6, bev * 1.4, edge) * inCof;
    float ao = mix(1., mix(.30, 1., smoothstep(0., bev * 5., edge)), inCof);

    vec3 n = -h;
    // tangent frame on the sphere
    vec3 eT = normalize(vec3(h.x * h.y, -(h.x * h.x + h.z * h.z), h.z * h.y)); // direction of increasing theta
    vec3 eP = normalize(vec3(-h.z, 0., h.x));
    float tu = (uu - .5) * 2.;
    float tv = (v - .5) * 2.;
    float wU = (1. - smoothstep(0., bev, du)) * sign(tu) * inCof;
    float wV = (1. - smoothstep(0., bev, dv)) * sign(tv) * inCof;
    n = normalize(n - eP * wU * .9 - eT * wV * .9);

    vec3 Lo = normalize(vec3(0., 1., 0.) - h);          // toward oculus centre
    float aLit = exp(-(th - TH0) * 2.6);                  // light thins out away from the opening
    float diff = max(dot(n, Lo), 0.) * aLit;
    float beam = beamLit(h) * max(dot(n, -normalize(BEAM)), 0.);

    vec3 stone = vec3(.36, .285, .215);
    float grain = fbm3(h.xz * 90. + h.y * 40.);
    stone *= .74 + .5 * grain;
    vec3 alb = mix(stone, stone * vec3(.70, .78, .98) * .42, recess);
    vec3 skyBounce = mix(vec3(1., .62, .34), vec3(.45, .40, .50), sat((th - TH0) * 1.1));
    float ambient = .012 + .75 * exp(-(th - TH0) * 4.6);
    col = alb * (skyBounce * (ambient * ao + diff * 2.0 * ao) + beam * vec3(1., .78, .52) * 5.5 * mix(.18, 1., ao));
    // coffer walls turned toward the opening catch the light
    float catchL = pw(sat(dot(n, Lo)), 2.) * inBev;
    col += vec3(1., .66, .36) * catchL * aLit * .9;

    // oculus rim (bright chamfer)
    col *= smoothstep(1.42, 1.05, th);
    float rimT = smoothstep(TH0, TH0 + .004, th) * (1. - smoothstep(rimEdge - .006, rimEdge, th));
    col = mix(col, vec3(1., .78, .50) * 2.4, rimT * .75);
    float rimLip = smoothstep(rimEdge - .02, rimEdge + .004, th) * (1. - smoothstep(rimEdge, rimEdge + .012, th));
    col += vec3(.7, .45, .28) * rimLip * .6;
    // dark face just inside the rim (ring thickness) before the coffers begin
    float lipDark = smoothstep(rimEdge, rimEdge + .006, th) * (1. - smoothstep(thA - .012, thA, th));
    col *= 1. - .35 * lipDark;
  }

  // ---- volumetric shaft + dust (camera-ray march) ----
  vec3 bd = normalize(BEAM);
  float scat = 0.;
  float tEnd = t;
  const int N = 16;
  float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
  for (int i = 0; i < N; i++) {
    float f = (float(i) + ign) / float(N);
    vec3 sp = eye + d * (tEnd * f);
    // distance of sp from the beam axis (line through oculus centre along bd)
    vec3 o0 = vec3(0., cos(TH0), 0.);
    vec3 w = sp - o0;
    float along = dot(w, bd);
    vec3 perp = w - along * bd;
    float rad = sin(TH0) * 1.0;
    float inside = smoothstep(rad * 1.05, rad * .80, length(perp)) * smoothstep(0., .06, along);
    float dens = .55 + .9 * fbm3(vec2(along * 6. + uTime * .04, length(perp) * 9.));
    scat += inside * dens * exp(-along * .9);
  }
  scat *= tEnd / float(N) * smoothstep(1.2, .8, th);
  col += vec3(1., .72, .42) * scat * .5;

  // floating dust motes catching the beam
  vec2 g = p * 26. + vec2(uTime * .05, -uTime * .03);
  vec2 id = floor(g), f = fract(g) - .5;
  float rr = hash21(id);
  float dm = smoothstep(.06, 0., length(f - (hash22(id + 4.) - .5) * .6)) * step(.85, rr);
  col += vec3(1., .75, .5) * dm * .5 * exp(-length(p) * 1.2) * (.5 + .5 * sin(uTime + rr * 40.));

  gl_FragColor = vec4(col, 1.);
}`;
