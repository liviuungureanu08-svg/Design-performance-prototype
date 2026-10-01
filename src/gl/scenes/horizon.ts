import { common } from '../glsl';

/**
 * CHAPTER I — BEFORE.
 * A backlit dune horizon at first light. Five depth layers with real parallax and dolly
 * (nearer layers travel faster toward the camera), a single enormous sun, a tiny figure for scale.
 * uCam.xy = lateral parallax, uCam.z = dolly toward the sun (the vanishing point).
 * uSun = (x, y, radius) in height-normalised space, shared with the portal composite.
 */
export const horizonFrag = /* glsl */ `
${common}
uniform vec3 uCam;
uniform vec3 uSun;
uniform float uShim;
uniform float uFade; // 0 normal .. 1 : sun disc fully replaced by aperture (hidden)

const vec3 SUNC = vec3(1.5, .86, .44);

float ridge(float x, float seed, float amp, float freq) {
  float h = 0.;
  float a = amp, f = freq;
  for (int i = 0; i < 4; i++) { h += a * (vn1(x * f + seed) - .5); a *= .46; f *= 2.17; }
  return h;
}

struct Layer { float y; float amp; float freq; float seed; float haze; float par; float zoom; };

vec3 stars(vec2 p) {
  vec2 g = p * 70.;
  vec2 id = floor(g), f = fract(g) - .5;
  float h = hash21(id);
  vec2 o = (hash22(id + 7.) - .5) * .6;
  float d = length(f - o);
  float tw = .65 + .35 * sin(uTime * (.4 + h * 1.3) + h * 40.);
  float s = smoothstep(.09 * (.4 + h), 0., d) * step(.965, h) * tw;
  return vec3(.8, .85, 1.) * s;
}

void main() {
  vec2 p = pcoord(vUv);
  float px = 1.5 / uRes.y;
  vec2 sunP = uSun.xy;
  float sunR = uSun.z;

  // heat shimmer (anticipation): horizontal displacement concentrated near the horizon band
  float band = exp(-pow((p.y + .02) * 5.5, 2.));
  p.x += uShim * band * (vnoise(vec2(p.y * 60., uTime * 1.6)) - .5) * .018;
  p.y += uShim * band * (vnoise(vec2(p.x * 40. + 9., uTime * 1.2)) - .5) * .006;

  // ---------- sky ----------
  float h = p.y + .06;
  vec3 deep = vec3(.004, .009, .026);
  vec3 plum = vec3(.030, .020, .052);
  vec3 rose = vec3(.150, .046, .050);
  vec3 amber = vec3(.74, .245, .075);
  vec3 sky = mix(amber, rose, smoothstep(-.02, .20, h));
  sky = mix(sky, plum, smoothstep(.05, .30, h));
  sky = mix(sky, deep, smoothstep(.20, .55, h));
  sky *= mix(1., .62, smoothstep(.0, .5, abs(p.x) * 1.1) * smoothstep(-.1, .3, h)); // horizontal falloff away from the sun

  vec2 d = p - sunP;
  float r = length(d);
  float glowA = exp(-r * 3.4) * .22;
  float glowB = exp(-r * 9.0) * .55;
  float glowC = exp(-r * 26.) * 1.2;
  float horizonGlow = exp(-abs(p.y + .035) * 14.) * exp(-abs(p.x - sunP.x) * 1.7) * .85;
  vec3 col = sky + vec3(1., .52, .24) * (glowA + horizonGlow) + vec3(1., .66, .38) * glowB + vec3(1., .8, .55) * glowC;

  // high-altitude cirrus streaks, lit from below by the sun
  float cir = fbm(vec2(p.x * 2.2 + 1.7, p.y * 14. - p.x * .6));
  cir = smoothstep(.45, .82, cir) * smoothstep(.02, .22, h) * smoothstep(.55, .12, h);
  col += cir * vec3(.9, .34, .20) * (.05 + .34 * exp(-abs(p.x - sunP.x) * 1.9));

  col += stars(p + vec2(.3, 0.)) * smoothstep(.12, .45, h) * .9;

  // ---------- sun ----------
  float disc = smoothstep(sunR + px, sunR - px * 2., r);
  float limb = pw(sat(1. - r / sunR), .35);
  vec3 sunCol = mix(vec3(1.05, .40, .13), vec3(2.3, 1.55, .92), pw(limb, 1.25));
  sunCol *= .86 + .14 * fbm3(d * 22. + uTime * .02); // faint photospheric mottling
  col = mix(col, sunCol, disc * (1. - uFade));

  // ---------- dunes ----------
  Layer L[5];
  L[0] = Layer(-.060, .040, 2.2, 3.1, .92, .014, .55);
  L[1] = Layer(-.135, .060, 1.7, 11.7, .66, .030, .85);
  L[2] = Layer(-.235, .085, 1.35, 5.3, .38, .055, 1.25);
  L[3] = Layer(-.345, .110, 1.05, 21.9, .16, .090, 2.2);
  L[4] = Layer(-.470, .130, .80, 8.6, .00, .150, 3.6);

  vec3 fog = vec3(.40, .125, .065);
  float figMask = 0.;
  for (int i = 0; i < 5; i++) {
    Layer l = L[i];
    float zs = 1. + max(uCam.z, 0.) * l.zoom;
    vec2 q = sunP + (p - sunP) / zs - uCam.xy * l.par * vec2(1., .55);
    float yc = l.y + ridge(q.x, l.seed, l.amp, l.freq);
    float dyRaw = yc - q.y; // >0 below crest
    float m = smoothstep(-px / zs, px / zs, dyRaw);
    float dy = max(dyRaw, 0.);

    float meridianS = exp(-pow((q.x - sunP.x) * .8, 2.));
    // slope-based shading: faces turned away from the sun fall into shadow
    float e = .004;
    float slope = (ridge(q.x + e, l.seed, l.amp, l.freq) - ridge(q.x - e, l.seed, l.amp, l.freq)) / (2. * e);
    float toward = sat(.5 + .5 * slope * clamp((q.x - sunP.x) * 8., -1., 1.)); // facing sun-ish
    vec3 shadow = mix(vec3(.004, .0035, .010), vec3(.045, .016, .022), toward * (.35 + .65 * meridianS));
    vec3 body = mix(shadow, fog * (.20 + .55 * l.haze), l.haze * l.haze * .95);
    // backlit crest rim, strongest near the sun's meridian
    float meridian = exp(-pow((q.x - sunP.x) * 1.15, 2.));
    float rim = exp(-dy * (420. - 220. * l.haze)) * (.22 + 1.5 * meridian);
    body += vec3(1.5, .62, .24) * rim * (.55 - .3 * l.haze) * (1. - .5 * l.haze);
    body += vec3(.9, .3, .12) * exp(-dy * 70.) * meridian * (.10 + .2 * l.haze) * (1. - float(i == 4) * .8);
    // lower parts of each layer drift toward the haze colour (aerial perspective)
    body = mix(body, fog * (.15 + .5 * l.haze), smoothstep(.0, .25, dy) * l.haze * .45);
    // wind ripples
    float rip = vnoise(vec2(q.x * 14. + float(i) * 3., q.y * 110.)) * vnoise(vec2(q.x * 3.5, q.y * 18.));
    body *= 1. + (rip - .25) * .9 * (1. - l.haze) * smoothstep(.0, .03, dy);
    col = mix(col, body, m);

    // the traveller: a tiny figure on the third crest
    if (i == 3) {
      float fx = -.285;
      float fy = l.y + ridge(fx, l.seed, l.amp, l.freq) - .0015;
      vec2 f = q - vec2(fx, fy);
      float body2 = length(vec2(f.x * 1.35, max(f.y - .0035, 0.) * .72 - clamp(f.y - .0035, 0., .02) * .0)) ;
      // body: tapering capsule
      float w = mix(.0058, .0026, sat(f.y / .030));
      float sdB = max(abs(f.x) - w, max(-f.y, f.y - .031));
      float sdH = length(f - vec2(.0004, .0365)) - .0042;
      float staff = max(abs(f.x - .0085 - f.y * .05) - .0007, max(-f.y, f.y - .040));
      float sd = min(min(sdB, sdH), staff);
      figMask = smoothstep(px / zs, -px / zs, sd) * step(.0, f.y + .01);
      col = mix(col, vec3(.004, .003, .006), figMask);
    }
  }

  // ---------- drifting dust, glowing when backlit ----------
  float dust = 0.;
  for (int k = 0; k < 2; k++) {
    float sc = k == 0 ? 11. : 19.;
    vec2 g = (p - uCam.xy * (.04 + .06 * float(k))) * sc + vec2(uTime * .12 * (1. + float(k)), -uTime * .05 * (1. + float(k)));
    vec2 id = floor(g), f = fract(g) - .5;
    vec2 o = (hash22(id + float(k) * 13.) - .5) * .7;
    float rr = hash21(id + 3.);
    float dd = length(f - o);
    dust += smoothstep(.045 * (.5 + rr), 0., dd) * step(.86, rr) * (.4 + .6 * sin(uTime * .8 + rr * 30.));
  }
  float dustLight = exp(-length(p - sunP) * 1.6);
  col += vec3(1., .62, .34) * dust * dustLight * .35 * smoothstep(-.35, .0, p.y + .2);

  gl_FragColor = vec4(col, 1.);
}`;
