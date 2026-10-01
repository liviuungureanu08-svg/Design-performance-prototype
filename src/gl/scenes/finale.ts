import { common } from '../glsl';

/**
 * CHAPTER IV — NOW.
 * The word is carved geometry: a layered extrusion (parallax-correct side walls), obsidian faces with
 * light-catching bevels, a black mirror floor, and the drop of light sitting inside the O.
 * Light shafts are cut by the letterforms themselves (occlusion marched through the SDF).
 */
export const finaleFrag = /* glsl */ `
${common}
uniform vec3 uCam;
uniform vec3 uSun;
uniform sampler2D tSdf;
uniform vec4 uRect;
uniform float uCrack;
uniform float uWorld;
uniform float uGlow;     // final crescendo: the light swells as the film ends
uniform float uZoom;     // >1: the camera is closer to the word (used to arrive from a push-in)
uniform float uAppear;   // 0: the word is only light  ..  1: carved obsidian

const float FLOOR_Y = -.175;

float sdfAt(vec2 p) {
  vec2 uv = (p - uRect.xy) / uRect.zw;
  vec2 c = clamp(uv, 0., 1.);
  return texture2D(tSdf, c).r + length((uv - c) * uRect.zw);
}

vec3 dropShade(vec2 d, float R) {
  vec2 q = d / R;
  float rr = dot(q, q);
  vec3 nrm = vec3(q, sqrt(max(1. - rr, 0.)));
  float core = exp(-rr * 2.0);
  vec3 col = vec3(1.7, .72, .26) * core * 2.2 + vec3(2.5, 1.6, .9) * exp(-rr * 8.) * 1.6;
  col += vec3(1.8, .95, .45) * pw(sat(-nrm.y * .9 + .25), 3.) * pw(sat(1. - rr), .5) * 1.1;
  col += vec3(.6, .8, 1.) * pw(1. - nrm.z, 2.6) * .6;
  col += vec3(1.) * smoothstep(.20, .02, length((q - vec2(-.38, .42)) * vec2(1., 1.7))) * .8;
  return col;
}

vec3 above(vec2 p, vec2 light, float R) {
  vec2 cam = uCam.xy;
  // ---------- backdrop: warm haze that thins into black ----------
  float r = length(p - light);
  vec3 col = vec3(.004, .0035, .007);
  col += (vec3(1., .46, .16) * exp(-r * 4.2) * .15 + vec3(1., .62, .30) * exp(-r * 9.) * .30) * uGlow;
  // soft horizontal band behind the baseline (the horizon the letters stand on)
  col += vec3(.9, .42, .16) * exp(-abs(p.y - FLOOR_Y) * 22.) * exp(-abs(p.x) * 1.6) * .16;

  // ---------- shafts: light from the drop, cut by the letterforms ----------
  vec2 dir = p - light;
  float ang = atan(dir.y, dir.x);
  float rays = pw(fbm3(vec2(ang * 9., 3.1)) * 1.6, 2.2) + .25 * vnoise(vec2(ang * 31., 1.7));
  float occ = 1.;
  for (int i = 1; i <= 8; i++) {
    vec2 sp = mix(light, p, float(i) / 8.);
    occ *= smoothstep(-.004, .012, sdfAt(sp));
  }
  float rr = length(dir);
  col += vec3(1., .6, .3) * rays * occ * exp(-rr * 2.1) * .30 * uGlow * uGlow * smoothstep(R * 1.0, R * 1.9, rr);

  // ---------- the drop of light in the O ----------
  float dd = length(p - light);
  if (dd < R * 1.02) col = mix(col, dropShade(p - light, R) * (.9 + .1 * uGlow), smoothstep(R * 1.02, R * .97, dd));

  // ---------- the letters: layered extrusion ----------
  const int N = 12;
  float T = .085 * uAppear;
  bool hit = false;
  vec3 wall = vec3(0.);
  vec3 glowFace = vec3(1., .60, .30) * (1.5 + 1.6 * exp(-length(p - light) * 2.0));
  for (int k = N - 1; k >= 0; k--) {
    float z = T * float(k) / float(N - 1);
    vec2 pk = p + cam * z * 1.4;
    float cov = smoothstep(.0011, -.0011, sdfAt(pk));
    if (cov > 0.) {
      float f = float(k) / float(N - 1);               // 0 front .. 1 back
      float lit = exp(-length(pk - light) * 1.9);
      wall = mix(vec3(.010, .008, .012), vec3(1., .5, .2) * 1.15, lit * (1. - f * .72));
      // thin bright seams where layers stack, so the thickness reads as machined stone
      wall *= .86 + .14 * sin(float(k) * 2.2);
      col = mix(col, mix(glowFace, wall, uAppear), cov);
      hit = true;
    }
  }
  float sd = sdfAt(p);
  float covF = smoothstep(.0011, -.0011, sd);
  if (covF > 0.) {
    float inD = max(-sd, 0.);
    float e = .0035;
    vec2 grad = vec2(sdfAt(p + vec2(e, 0.)) - sdfAt(p - vec2(e, 0.)), sdfAt(p + vec2(0., e)) - sdfAt(p - vec2(0., e))) / (2. * e);
    float bev = 1. - smoothstep(0., .011, inD);
    vec2 toL = normalize(light - p + 1e-5);
    float facing = sat(dot(-grad, toL) * .5 + .5);
    // obsidian face: deep, with a broad moving sheen and a warm fill from the drop
    vec3 face = vec3(.006, .007, .011);
    float sheen = smoothstep(.55, .0, abs(fract((p.x * .7 + p.y * 1.1 + cam.x * .35) * .9) - .5) * 2.);
    face += vec3(.55, .62, .78) * sheen * .028;
    face += vec3(1., .5, .2) * exp(-length(p - light) * 2.8) * .075;
    // bevel catches light mostly on the side that looks at the drop; a hairline stays white all round
    vec3 bevCol = vec3(1., .66, .34) * pw(facing, 3.) * 1.9 + vec3(.55, .62, .8) * .12;
    face = mix(face, bevCol, bev * (.04 + .96 * pw(facing, 4.)));
    face += vec3(1., .85, .65) * (1. - smoothstep(0., .0032, inD)) * (.05 + 1.0 * pw(facing, 4.));
    col = mix(col, mix(glowFace, face, uAppear), covF);
  }
  return col;
}

void main() {
  vec2 p = pcoord(vUv);
  p = uSun.xy + (p - uSun.xy) / (uWorld * uZoom);   // portrait: the whole word scales about the light so the O stays on the circle
  vec2 cam = uCam.xy;
  vec2 pp = p - cam * .01;
  vec2 light = uSun.xy - cam * .006;   // the drop sits a little behind the slab
  float R = uSun.z * .93;

  if (uCrack > .5) { float sd = sdfAt(p); gl_FragColor = vec4(vec3(fract(sd * 12.)) * step(0., sd) + vec3(0., 0., .5) * step(sd, 0.), 1.); return; }
  vec3 col;
  if (pp.y >= FLOOR_Y) {
    col = above(pp, light, R);
  } else {
    // black mirror floor
    float dep = FLOOR_Y - pp.y;
    float rip = (fbm3(vec2(pp.x * 6., dep * 60. + uTime * .08)) - .5);
    vec2 q = vec2(pp.x + rip * .012 * (.5 + dep * 4.), FLOOR_Y + dep * .96);
    vec3 refl = above(q, light, R);
    float fres = .10 + .80 * exp(-dep * 5.5);
    vec3 base = vec3(.0016, .0016, .0025);
    col = base + refl * fres * .34;
    // warm sheen where the light pools on the floor
    col += vec3(1., .5, .2) * exp(-pow(pp.x * 1.6, 2.)) * exp(-dep * 3.2) * .10 * (.6 + rip);
  }
  gl_FragColor = vec4(col, 1.);
}`;
