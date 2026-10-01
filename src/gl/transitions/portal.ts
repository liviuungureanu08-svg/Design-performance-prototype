import { common } from '../glsl';

/**
 * T1 — the sun becomes the aperture (optical distortion -> mask morph -> camera travel).
 * No particles. A pupil opens inside the sun; the sun's light is pushed out into a refractive rim that
 * bends the dunes around it, and the rim expands past the frame while B pulls back from inside it.
 * uP: 0..1.  The scene shaders are driven separately (dolly / zoom / shimmer) by the choreography.
 */
export const portalFrag = /* glsl */ `
${common}
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform vec3 uSun;
uniform float uP;
uniform float uAperture;   // aperture radius (scene units), computed on the CPU so scenes and composite agree
uniform float uLens;       // 0..1 lensing strength

vec3 sampleTex(sampler2D t, vec2 pc, float asp) {
  return texture2D(t, pc / vec2(asp, 1.) + .5).rgb;
}

void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = pcoord(vUv);
  vec2 c = uSun.xy;
  vec2 d = p - c;
  float dd = length(d);
  vec2 dir = d / max(dd, 1e-5);
  float ra = uAperture;
  float rim = dd - ra;                 // signed distance to the rim

  // ---- A: bent around the aperture (like light skirting a dense object) ----
  float lensW = .05 + ra * .35;
  float pull = uLens * (.050 + .06 * ra) * exp(-pow(max(rim, 0.) / lensW, 2.)) * smoothstep(-.02, .01, rim);
  vec3 colA;
  {
    // chromatic split proportional to the bend
    vec2 s = dir * pull;
    colA.r = sampleTex(tFrom, p - s * 1.12, asp).r;
    colA.g = sampleTex(tFrom, p - s, asp).g;
    colA.b = sampleTex(tFrom, p - s * .88, asp).b;
  }
  // ---- B: seen through the glass edge of the opening (magnified toward the rim) ----
  float edgeIn = exp(-pow(min(rim, 0.) / (.04 + ra * .10), 2.));
  vec2 pb = c + d * (1. - .30 * edgeIn * uLens);
  vec3 colB = sampleTex(tTo, pb, asp);

  float m = smoothstep(.0035, -.0035, rim);
  vec3 col = mix(colA, colB, m);

  // ---- the rim: the sun's light, compressed into a thin refractive ring ----
  float thick = .0022 + .0035 * smoothstep(.0, .5, ra);
  float core = exp(-pow(rim / thick, 2.));
  float halo = exp(-max(rim, 0.) * (16. - 7. * smoothstep(0., .6, ra))) * .55 * step(0., rim) + exp(-max(-rim, 0.) * 42.) * .45 * step(rim, 0.);
  float open = smoothstep(.012, .05, ra);               // only once the pupil exists
  float energy = open * (1.4 + 2.6 / (1. + ra * 5.5));   // thinner ring => hotter
  vec3 rimCol = mix(vec3(1., .55, .22), vec3(1., .86, .62), core);
  col += rimCol * (core * 5.5 + halo * .9) * energy * .5;
  // pre-opening: the sun's own limb darkens slightly toward the pupil
  col *= 1. - .35 * exp(-pow(dd / max(ra, .002), 2.)) * (1. - m) * open;

  gl_FragColor = vec4(col, 1.);
}`;
