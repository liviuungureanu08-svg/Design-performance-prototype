import { common } from '../glsl';

/**
 * CHAPTER III — HELD.
 * A night sea under a cold sky. The only warm thing in the world is a drop of liquid light hovering
 * at the horizon: a refractive sphere whose centre/radius equal the oculus of the previous chapter.
 * uCam.xy = parallax.
 */
export const seaFrag = /* glsl */ `
${common}
uniform vec3 uCam;
uniform vec3 uSun;     // sphere centre + radius (same numbers as the oculus / sun)

const float HZ = -.105;

vec3 skyCol(vec2 p) {
  float h = max(p.y - HZ, 0.);
  vec3 hor = vec3(.050, .115, .150);
  vec3 mid = vec3(.010, .026, .058);
  vec3 top = vec3(.002, .004, .013);
  vec3 c = mix(hor, mid, pw(sat(h * 2.4), .6));
  c = mix(c, top, sat((h - .25) * 1.8));
  // faint galactic band
  vec2 b = vec2(p.x * 1.1 + p.y * .8, p.y * 1.1 - p.x * .5);
  float band = smoothstep(.34, .0, abs(b.y - .16 + .06 * sin(b.x * 3.)));
  float cl = fbm(b * vec2(3., 7.) + 3.) ;
  c += vec3(.045, .06, .095) * band * (.35 + cl) * sat(h * 4.);
  // stars
  vec2 g = p * 85. - uCam.xy * .5;
  vec2 id = floor(g), f = fract(g) - .5;
  float hh = hash21(id);
  float d = length(f - (hash22(id + 3.) - .5) * .6);
  float tw = .6 + .4 * sin(uTime * (.5 + hh * 1.5) + hh * 50.);
  c += vec3(.75, .85, 1.) * smoothstep(.07 * (.4 + hh), 0., d) * step(.955, hh) * tw * sat(h * 5. - .1);
  // warm bleed from the drop
  c += vec3(1., .46, .16) * exp(-length(p - uSun.xy) * 4.2) * .20;
  return c;
}

/** Sea surface colour at p (below the horizon). */
vec3 seaCol(vec2 p) {
  float depth = max(HZ - p.y, 0.);
  float z = 1. / (depth + .018);
  float t = uTime * .06;
  float w1 = fbm3(vec2(p.x * z * .55 + t, z * .9 - t * 1.6));
  float w2 = vnoise(vec2(p.x * z * 2.4 - t * 2., z * 3.2 + t));
  float ripple = (w1 - .5) * .9 + (w2 - .5) * .35;
  // reflection of the sky, with the mirror image bent by the swell
  vec2 rp = vec2(p.x + ripple * depth * .35, HZ + depth * .55 + ripple * depth * .12);
  vec3 refl = skyCol(rp);
  float fres = .10 + .85 * pw(1. - sat(depth * 2.4), 3.);
  vec3 col = mix(vec3(.0015, .0035, .008), refl, fres * .75);
  // the light's path across the water
  float width = .010 + depth * .20;
  float col1 = exp(-pow((p.x - uSun.x + ripple * depth * .6) / width, 2.));
  float brk = smoothstep(.30, .85, w2 + (w1 - .5) * .8);
  float path = col1 * (.18 + .82 * brk) * exp(-depth * 1.7);
  col += vec3(1., .52, .20) * path * 1.5 + vec3(1., .70, .45) * pw(col1, 6.) * exp(-depth * 3.) * .9;
  // horizon haze
  col += vec3(.05, .09, .11) * exp(-depth * 40.) * .8;
  return col;
}

vec3 world(vec2 p) {
  float m = smoothstep(HZ - .002, HZ + .002, p.y);
  return mix(seaCol(p), skyCol(p), m);
}

vec3 shadeDrop(vec2 d, float R, vec2 c, float mirror) {
  vec2 q = d / R;
  float rr = dot(q, q);
  vec3 nrm = vec3(q, sqrt(max(1. - rr, 0.)));
  // refracted view: the world behind is inverted and magnified
  vec2 wp = c + vec2(-nrm.x, -nrm.y * mirror) * R * 1.15;
  vec3 behind = world(wp) * vec3(.9, .85, .8);
  // internal light: a warm core that pools toward the bottom (caustic) and thins toward the rim
  float core = exp(-rr * 2.2);
  vec3 emit = vec3(1.7, .72, .26) * core * 2.1;
  emit += vec3(2.4, 1.5, .8) * exp(-rr * 9.) * 1.5;
  float caustic = pw(sat(-nrm.y * .9 + .25), 3.) * pw(sat(1. - rr), .5);
  emit += vec3(1.8, .95, .45) * caustic * 1.3 * mirror;
  float fres = pw(1. - nrm.z, 2.6);
  vec3 col = behind * .55 + emit;
  col += vec3(.55, .78, 1.) * fres * .9;
  // glassy highlight (upper left) and a soft secondary one
  vec2 hp = q - vec2(-.38, .42 * mirror);
  col += vec3(1.) * smoothstep(.20, .02, length(hp * vec2(1., 1.7))) * .9;
  col += vec3(.7, .85, 1.) * smoothstep(.12, .0, length((q - vec2(.40, -.46 * mirror)) * vec2(1., 2.4))) * .25;
  return col;
}

void main() {
  vec2 p = pcoord(vUv);
  vec2 par = uCam.xy;
  vec2 pp = p - par * .012;        // world drifts a hair relative to the drop (depth cue)
  vec3 col = world(pp);

  vec2 c = uSun.xy - par * .02;
  float R = uSun.z;
  // liquid, never-quite-round silhouette
  vec2 d = p - c;
  float ang = atan(d.y, d.x);
  float wob = 1. + .009 * sin(ang * 3. + uTime * .7) + .006 * sin(ang * 5. - uTime * .9);
  float r = length(d);
  float edge = 1.5 / uRes.y;
  float m = smoothstep(R * wob + edge, R * wob - edge, r);
  // drop above the water
  if (r < R * 1.25) col = mix(col, shadeDrop(d / wob, R, c, 1.), m);
  // the same drop mirrored in the water: bent, dimmer, broken up by the swell
  vec2 mc = vec2(c.x, 2. * HZ - c.y);
  float depthM = max(HZ - p.y, 0.);
  vec2 dm = p - mc;
  dm.x += (fbm3(vec2(p.y * 70., uTime * .35)) - .5) * .028 * (.4 + depthM * 3.);
  dm.y *= 1.0 + (fbm3(vec2(p.x * 11., p.y * 50. + uTime * .3)) - .5) * .5;
  float rm = length(dm);
  float mm = smoothstep(R + edge * 2., R - edge * 2., rm) * step(p.y, HZ);
  if (mm > 0.) {
    vec3 rc = shadeDrop(dm, R, mc, -1.);
    col = mix(col, col + rc * .32, mm * (1. - exp(-depthM * 60.)));
  }

  gl_FragColor = vec4(col, 1.);
}`;
