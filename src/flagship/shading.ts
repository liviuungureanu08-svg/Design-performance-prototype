import * as THREE from 'three';

/**
 * Shared analytic "world" uniforms. Every material in the monolith injects the same chunk, so occlusion, the slot light
 * and the surface-light anchor are evaluated against the *current* positions of the real slabs (no baked state).
 */
export const U = {
  uBoxMin: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) },
  uBoxMax: { value: [0, 1, 2, 3].map(() => new THREE.Vector3()) },
  uSlotA: { value: new THREE.Vector3(0, 0.3, -2.8) },
  uSlotB: { value: new THREE.Vector3(0, 4.0, -2.8) },
  uSlotCol: { value: new THREE.Color(1.0, 0.93, 0.82) },
  uSlotI: { value: 0 },
  uSlotE: { value: 0 },
  uStripAz: { value: 2.0 },
  uStripW: { value: 0.5 },
  uStripI: { value: 1 },
  uStripY: { value: 2.5 },
  uDev: { value: 0 },
  uDevY: { value: 2.9 },
  uGlow: { value: 0 },
  uGlowW: { value: 0.03 },
  uEnvK: { value: 1 },
  uFill: { value: 0 },
  uFlagOff: { value: 0 },
};

const COMMON = /* glsl */ `
varying vec3 vWPos; varying vec3 vOPos; varying vec3 vONor; varying vec3 vWNor;
uniform vec3 uBoxMin[4]; uniform vec3 uBoxMax[4];
uniform vec3 uSlotA; uniform vec3 uSlotB; uniform vec3 uSlotCol; uniform float uSlotI; uniform float uSlotE;
uniform float uStripAz, uStripW, uStripI, uStripY, uDev, uDevY, uGlow, uGlowW, uEnvK, uFill, uFlagOff;

float h31(vec3 p){ p = fract(p*0.3183099+vec3(.1,.2,.3)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y), f.z);
}
// distance along the ray to the nearest occluder slab (1e5 = escapes)
float sceneHit(vec3 ro, vec3 rd){
  float best = 1e5;
  vec3 inv = 1.0 / (rd + vec3(1e-6));
  for (int i = 0; i < 4; i++) {
    vec3 t0 = (uBoxMin[i]-ro)*inv, t1 = (uBoxMax[i]-ro)*inv;
    vec3 tn = min(t0,t1), tf = max(t0,t1);
    float a = max(max(tn.x,tn.y),tn.z), b = min(min(tf.x,tf.y),tf.z);
    if (b >= max(a,0.0) && a > 0.0) best = min(best, a);
  }
  return best;
}
vec3 bumpN(vec3 pos, vec3 n, float h, float k){
  vec3 dpdx = dFdx(pos), dpdy = dFdy(pos);
  float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpdy, n), r2 = cross(n, dpdx);
  float det = dot(dpdx, r1);
  vec3 grad = sign(det) * (dhx*r1 + dhy*r2);
  return normalize(abs(det)*n - k*grad);
}
`;

export type Kind = 'mineral' | 'floor' | 'metal' | 'glass' | 'ground';

/** Patches a MeshPhysicalMaterial with the shared analytic lighting / occlusion / surface-light anchor. */
export function patch(mat: THREE.MeshPhysicalMaterial, kind: Kind, opts: { anchor?: boolean; seamY?: number } = {}): void {
  const seamY = opts.seamY ?? 1.1;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos; varying vec3 vOPos; varying vec3 vONor; varying vec3 vWNor;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOPos = position; vONor = normal;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed,1.0)).xyz; vWNor = normalize(mat3(modelMatrix) * objectNormal);');

    const defs = [kind === 'mineral' || kind === 'floor' ? '#define MINERAL' : '', kind === 'floor' ? '#define FLOORGRID' : '', opts.anchor ? '#define ANCHOR' : '', `#define SEAMY ${seamY.toFixed(3)}`].join('\n');

    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>\n${defs}\n${COMMON}`)
      .replace(
        '#include <roughnessmap_fragment>',
        /* glsl */ `#include <roughnessmap_fragment>
#ifdef MINERAL
  float seamD = 1.0, seamG = 0.0;
  {
    float pxw = fwidth(vOPos.y) + fwidth(vOPos.x) + fwidth(vOPos.z);
    float fade = 1.0 - smoothstep(0.012, 0.045, pxw);
    #ifdef FLOORGRID
      vec2 g = abs(fract(vOPos.xz / 1.15 + 0.5) - 0.5) * 1.15;
      float sd = min(g.x, g.y);
    #else
      float sd = abs(fract(vOPos.y / SEAMY + 0.5) - 0.5) * SEAMY;
      sd = mix(sd, 1.0, step(0.6, abs(vONor.y)));
    #endif
    seamG = (1.0 - smoothstep(0.0035, 0.011, sd)) * fade;
  }
  float n1 = vnoise(vOPos*0.7), n2 = vnoise(vOPos*4.0), n3 = vnoise(vOPos*17.0);
  roughnessFactor = clamp(roughnessFactor + (n1-0.5)*0.22 + (n2-0.5)*0.07 + (n3-0.5)*0.05 + seamG*0.1, 0.1, 0.92);
  diffuseColor.rgb *= 1.0 - 0.5*seamG;
#endif`
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
#ifdef MINERAL
  {
    float hh = (vnoise(vOPos*26.0)-0.5)*0.0002 + (vnoise(vOPos*11.0)-0.5)*0.0007 - seamG*0.0008;
    normal = bumpN(-vViewPosition, normal, hh, 1.0);
  }
#endif`
      )
      .replace(
        '#include <lights_fragment_end>',
        /* glsl */ `#include <lights_fragment_end>
{
  vec3 Pw = vWPos;
  vec3 Nw = normalize(normal * mat3(viewMatrix));
  vec3 Vw = normalize(cameraPosition - Pw);
  vec3 ro = Pw + Nw * 0.015;
  // --- analytic specular / diffuse occlusion against the real slabs
  vec3 Rw = reflect(-Vw, Nw);
  float tR = sceneHit(ro, Rw);
  float specOcc = tR > 9e4 ? 1.0 : mix(0.03, 0.4, smoothstep(0.0, 6.0, tR));
  vec3 up = abs(Nw.y) > 0.9 ? vec3(1,0,0) : vec3(0,1,0);
  vec3 T1 = normalize(cross(up, Nw)), T2 = cross(Nw, T1);
  float a0 = sceneHit(ro, Nw);
  float a1 = sceneHit(ro, normalize(Nw + T1*0.9));
  float a2 = sceneHit(ro, normalize(Nw - T1*0.9));
  float a3 = sceneHit(ro, normalize(Nw + T2*0.9));
  float a4 = sceneHit(ro, normalize(Nw - T2*0.9));
  float diffOcc = 0.0;
  diffOcc += smoothstep(0.0, 5.0, min(a0, 50.0)) + smoothstep(0.0, 5.0, min(a1, 50.0)) + smoothstep(0.0, 5.0, min(a2, 50.0));
  diffOcc += smoothstep(0.0, 5.0, min(a3, 50.0)) + smoothstep(0.0, 5.0, min(a4, 50.0));
  diffOcc = mix(0.08, 1.0, diffOcc / 5.0);
  // studio flag: the tall softbox lives above, so the mass falls off toward the ground and toward the shadow side
  float flag = mix(mix(0.1, 1.0, pow(smoothstep(-0.5, 9.5, Pw.y), 1.15)), 1.0, uFlagOff);
  flag *= mix(1.0, mix(0.3, 1.0, smoothstep(-3.5, 3.0, 0.7 * Pw.z - 0.2 * Pw.x)), 1.0 - uFlagOff);
  reflectedLight.indirectSpecular *= specOcc * uEnvK * flag;
  reflectedLight.indirectDiffuse  *= diffOcc * uEnvK * 0.16 * flag;
  // soft bounce of the slot light inside the hall
  reflectedLight.indirectDiffuse += diffuseColor.rgb * uFill * (1.0 - diffOcc) * 0.5;

  // --- the slot: a real vertical line light, sampled, with per-sample occlusion
  float specOccSlot = 1.0;
  { float tq = sceneHit(ro, Rw); if (tq < 9e4 && Rw.z < -0.001) { float ts = (uSlotA.z - Pw.z) / Rw.z; specOccSlot = tq < ts - 0.05 ? 0.0 : 1.0; } }
  if (uSlotI > 0.001) {
    const int NS = 9;
    float len = distance(uSlotA, uSlotB);
    for (int i = 0; i < NS; i++) {
      float f = (float(i) + 0.5) / float(NS);
      vec3 Pl = mix(uSlotA, uSlotB, f);
      vec3 Ld = Pl - Pw; float d = length(Ld); Ld /= d;
      float facing = -Ld.z;
      if (facing <= 0.0 || Pw.z < uSlotA.z + 0.35) continue;
      float gn = smoothstep(0.0, 0.12, dot(normalize(vWNor), Ld));
      if (gn <= 0.0) continue;
      float tH = sceneHit(ro, Ld);
      if (tH < d - 0.06) continue;
      float dotNL = saturate(dot(geometryNormal, normalize(mat3(viewMatrix) * Ld)));
      vec3 irr = uSlotCol * uSlotI * facing * gn * dotNL * (len / float(NS)) / (d*d + 0.3);
      reflectedLight.directDiffuse += irr * BRDF_Lambert(material.diffuseColor);
    }
  }
  // glossy mirror image of the slot itself: analytic rectangle reflection, edges blurred by roughness and by pixel footprint
  {
    float rz = min(Rw.z, -0.001);
    float tt = clamp((uSlotA.z - Pw.z) / rz, 0.0, 40.0);
    vec3 hp = Pw + Rw * tt;
    float foot = length(fwidth(hp)) * 0.8;
    float blur = material.roughness * material.roughness * tt * 0.5 + 0.012 + foot;
    float hw = 0.0375;
    float cx = 0.5 * (tanh(clamp(1.2 * (hp.x + hw) / blur, -9.0, 9.0)) - tanh(clamp(1.2 * (hp.x - hw) / blur, -9.0, 9.0)));
    float cy = 0.5 * (tanh(clamp(1.2 * (hp.y - uSlotA.y) / blur, -9.0, 9.0)) - tanh(clamp(1.2 * (hp.y - uSlotB.y) / blur, -9.0, 9.0)));
    vec3 Fs = F_Schlick(material.specularColor, material.specularF90, saturate(dot(geometryNormal, geometryViewDir)));
    float on = (Rw.z < -0.001 && uSlotE > 0.001) ? 1.0 : 0.0;
    reflectedLight.directSpecular += min(uSlotCol * uSlotE * Fs * cx * cy * specOccSlot, vec3(2.5)) * on;
  }

  #ifdef ANCHOR
  {
    // THE ANCHOR. Phase 1: a reflection of a strip light on the seam bevel. Phase 2: it deviates and leaves the surface.
    // Phase 3: it is view-independent light bleeding out of the stone along the seam (subsurface), i.e. the slot behind.
    float ndv = saturate(dot(Nw, Vw));
    float az = atan(Rw.x, Rw.z);
    float dz = az - uStripAz;
    float w = uStripW + roughnessFactor * 0.08;
    float yb = smoothstep(0.3, 1.3, vOPos.y) * (1.0 - smoothstep(3.3, 4.6, vOPos.y));
    // hot segment drifts along the seam: slightly wrong for a reflection
    float seg = exp(-pow((vOPos.y - uStripY) / 1.5, 2.0));
    float dxs = max(0.0, -vOPos.x - 0.015);
    float bump = exp(-pow((vOPos.y - uDevY) / 0.8, 2.0));
    float onBevel = 1.0 - smoothstep(0.0, 0.1, dxs);
    float refl = exp(-dz*dz/(w*w)) * yb * (0.35 + 0.65 * seg) * mix(1.0, 1.0 - 0.85*bump*smoothstep(0.0,0.04,uDev), 1.0);
    float F = 0.1 + 0.9 * pow(1.0 - ndv, 5.0);
    vec3 warm = vec3(1.0, 0.95, 0.88);
    vec3 em = warm * refl * uStripI * (0.1 + F) * 14.0;
    // deviation: the line leaves its physical place and bows onto the face
    float off = uDev * bump;
    float lobe = exp(-pow((dxs - off) / 0.016, 2.0)) * smoothstep(0.0, 0.04, uDev) * bump;
    em += warm * lobe * yb * 9.0 * smoothstep(0.0, 1.0, ndv + 0.3) * smoothstep(0.25, 0.7, vONor.z);
    // subsurface: light diffusing through the mineral right at the seam: a tight core plus a faint bleed
    float ss = (exp(-dxs / uGlowW) + 0.1 * exp(-dxs / (uGlowW * 7.0))) * yb;
    float frontness = smoothstep(0.25, 0.7, vONor.z);
    em += warm * ss * uGlow * smoothstep(0.0, 0.5, ndv) * 4.0 * frontness;
    totalEmissiveRadiance += em;
  }
  #endif
  #ifdef MINERAL
  {
    // a broad, soft sheen where the polished face catches the overhead box: reveals the plane, fades as the interior takes over
    float band = exp(-pow((Pw.y - 7.3 + 0.9 * Pw.x - 0.5 * Pw.z) / 1.5, 2.0));
    float nv = saturate(dot(Nw, Vw));
    totalEmissiveRadiance += vec3(0.9, 0.92, 0.95) * band * 0.05 * (1.0 - uFlagOff) * smoothstep(0.2, 0.7, nv) * (1.0 - smoothstep(0.7, 1.0, abs(Nw.y)));
  }
  #endif
}
`
      );
  };
  mat.customProgramCacheKey = () => `${kind}-${opts.anchor ? 1 : 0}-${seamY}`;
}
