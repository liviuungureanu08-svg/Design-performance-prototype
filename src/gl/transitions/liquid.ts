import { common } from '../glsl';

/**
 * T3 — the drop becomes the word (mask morph + liquid refraction + typography as geometry).
 * The circle that has travelled through every chapter (sun -> aperture -> oculus -> drop) is the reveal
 * mask. Its signed-distance field is morphed into the SDF of the word NOW (the O lands exactly on the
 * circle), so the shape *flows* into letterforms, holds for a beat as luminous glass cut-outs in the night
 * sea, then floods outward. The boundary behaves like a liquid meniscus: it bends what it touches.
 */
export const liquidFrag = /* glsl */ `
${common}
uniform sampler2D tFrom;
uniform sampler2D tTo;
uniform sampler2D tSdf;
uniform vec4 uRect;
uniform vec3 uSun;
uniform float uMorph;    // 0 circle .. 1 word
uniform float uOpen;     // circle window opens
uniform float uFlood;    // dilation of the mask (scene units)
uniform float uRipple;
uniform float uWorld;   // 0..1 ripples leaving the drop

float sdfAt(vec2 p) {
  vec2 uv = (p - uRect.xy) / uRect.zw;
  vec2 c = clamp(uv, 0., 1.);
  return texture2D(tSdf, c).r + length((uv - c) * uRect.zw);
}

float field(vec2 p) {
  float dc = length(p - uSun.xy) - uSun.z * .97;
  float dt = sdfAt(uSun.xy + (p - uSun.xy) / uWorld) * uWorld;
  return mix(dc, dt, uMorph) - uFlood + (1. - uOpen) * .6;
}

vec3 tex(sampler2D t, vec2 pc, float asp) { return texture2D(t, pc / vec2(asp, 1.) + .5).rgb; }

void main() {
  float asp = uRes.x / uRes.y;
  vec2 p = pcoord(vUv);
  vec2 c = uSun.xy;

  // ripples spreading from the drop across sky and water
  vec2 dc = p - c;
  float r = length(dc);
  vec2 rdir = dc / max(r, 1e-4);
  float ring = sin(r * 52. - uRipple * 9. - uTime * .6) * exp(-r * 3.4) * smoothstep(0., .25, r);
  vec2 pr = p + rdir * ring * .011 * uRipple;

  float e = 3.2 / uRes.y;
  float dm = field(p);
  vec2 g = vec2(field(p + vec2(e, 0.)) - field(p - vec2(e, 0.)), field(p + vec2(0., e)) - field(p - vec2(0., e))) / (2. * e);
  vec2 n = g / max(length(g), 1e-4);

  // outside: the night sea, bent toward the opening like light through a water lens (small chromatic split)
  float bend = (.020 + .02 * uMorph) * exp(-pow(max(dm, 0.) / .060, 2.)) * smoothstep(.0, .01, uOpen);
  vec3 outC;
  outC.r = tex(tFrom, pr - n * bend * 1.15, asp).r;
  outC.g = tex(tFrom, pr - n * bend, asp).g;
  outC.b = tex(tFrom, pr - n * bend * .85, asp).b;
  // inside: the next world, magnified toward the rim
  float lens = .014 * exp(-pow(min(dm, 0.) / .045, 2.)) * smoothstep(.0, .01, uOpen);
  vec3 inC = tex(tTo, p + n * lens, asp);

  float m = smoothstep(.0028, -.0028, dm);
  vec3 col = mix(outC, inC, m);

  // meniscus: thin bright rim facing the light, cool counter-glint on the far side
  float edge = exp(-pow(dm / .0075, 2.)) * smoothstep(.0, .02, uOpen);
  float lt = dot(n, normalize(vec2(-.55, .83)));
  col += vec3(1., .90, .74) * pow(max(lt, 0.), 2.5) * edge * 1.7;
  col += vec3(.55, .75, 1.) * pow(max(-lt, 0.), 2.5) * edge * .55;
  // the opening spills warm light onto the water around it
  col += vec3(1., .55, .24) * exp(-max(dm, 0.) * 16.) * (1. - m) * .16 * smoothstep(0., .1, uOpen) * (1. - smoothstep(.9, 1.6, uFlood));

  gl_FragColor = vec4(col, 1.);
}`;
