import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { U, patch } from './shading';

type V3 = [number, number, number];
export const EPS = 0.015;
/** Rest ("closed monolith") bounds in world units. Everything below is authored as ONE building; the exterior is just its closed state. */
export const REST = {
  L: { min: [-1.9, 0, -2.8] as V3, max: [-EPS, 9.0, 2.8] as V3 }, // tall mass            -> left wall
  R: { min: [EPS, 0, -2.8] as V3, max: [1.3, 6.6, 2.3] as V3 }, //  lower, set-back mass -> right wall
  C: { min: [-1.95, 9.04, -2.9] as V3, max: [1.32, 9.3, 2.9] as V3 }, // metal lintel, cantilevered -> ceiling
  K: { min: [-1.9, 0, -3.3] as V3, max: [1.3, 9.0, -2.8] as V3 }, // rear closure         -> end wall, carries the slot
  B: { min: [-2.8, -0.3, -3.9] as V3, max: [3.2, 0, 3.6] as V3 }, // plinth               -> floor
};

function box(b: { min: V3; max: V3 }, r: number, seg = 3): THREE.BufferGeometry {
  const w = b.max[0] - b.min[0], h = b.max[1] - b.min[1], d = b.max[2] - b.min[2];
  const g = new RoundedBoxGeometry(w, h, d, seg, r);
  g.translate((b.max[0] + b.min[0]) / 2, (b.max[1] + b.min[1]) / 2, (b.max[2] + b.min[2]) / 2);
  return g;
}

export interface Fin {
  mesh: THREE.Mesh;
  x0: number; // rest x (centre)
}

export class World {
  scene = new THREE.Scene();
  L: THREE.Mesh; R: THREE.Mesh; C: THREE.Mesh; K: THREE.Mesh; B: THREE.Mesh;
  fins: Fin[] = [];
  slot: THREE.Mesh;
  housing: THREE.Mesh[] = [];
  mirror: Reflector;
  glass: THREE.MeshPhysicalMaterial;
  slotMat: THREE.MeshBasicMaterial;

  constructor(env: THREE.Texture) {
    const s = this.scene;
    s.environment = env;
    s.background = backdrop();
    s.fog = new THREE.Fog(0x020203, 30, 80);

    // --- dark mineral: low base roughness, strong spatial variation (injected), no clearcoat, restrained specular
    const mineral = (color: number, rough: number, seamY = 0.85) => {
      const m = new THREE.MeshPhysicalMaterial({ color, roughness: rough, metalness: 0, specularIntensity: 0.55, ior: 1.5 });
      patch(m, 'mineral', { seamY });
      return m;
    };
    const mL = new THREE.MeshPhysicalMaterial({ color: 0x232427, roughness: 0.3, metalness: 0, specularIntensity: 0.6 });
    patch(mL, 'mineral', { anchor: true });
    const mR = mineral(0x28292c, 0.4);
    const mK = mineral(0x151618, 0.45);
    const mFloor = new THREE.MeshPhysicalMaterial({ color: 0x131416, roughness: 0.2, metalness: 0, specularIntensity: 0.8 });
    patch(mFloor, 'floor');
    const mMetal = new THREE.MeshPhysicalMaterial({ color: 0x7a7c82, roughness: 0.3, metalness: 1, anisotropy: 0.75, anisotropyRotation: 0 });
    patch(mMetal, 'metal');
    this.glass = new THREE.MeshPhysicalMaterial({
      color: 0xa9abb0, roughness: 0.07, metalness: 0, transmission: 1, thickness: 0.5, ior: 1.52,
      attenuationColor: new THREE.Color(0x6a6b72), attenuationDistance: 0.7, specularIntensity: 0.8, envMapIntensity: 0.28,
    });
    patch(this.glass, 'glass');

    const mk = (b: { min: V3; max: V3 }, mat: THREE.Material, r: number, seg = 3) => {
      const m = new THREE.Mesh(box(b, r, seg), mat);
      s.add(m);
      return m;
    };
    this.L = mk(REST.L, mL, 0.1, 4);
    this.R = mk(REST.R, mR, 0.1, 4);
    this.C = mk(REST.C, mMetal, 0.03);
    this.K = mk(REST.K, mK, 0.03);
    this.B = mk(REST.B, mFloor, 0.03);

    // glass blades in the recess in front of R; they will turn edge-on and become columns
    const fx = [0.32, 0.72, 1.12];
    for (const x of fx) {
      const g = new RoundedBoxGeometry(0.3, 9.2, 0.22, 4, 0.035);
      const m = new THREE.Mesh(g, this.glass);
      m.position.set(x, 4.6, 2.55);
      s.add(m);
      this.fins.push({ mesh: m, x0: x });
    }

    // the slot itself (emissive, HDR)
    this.slotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: true, fog: false });
    this.slot = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 3.7), this.slotMat);
    this.slot.position.set(0, 2.15, REST.K.max[2] + 0.002);
    s.add(this.slot);

    // dark-metal reveal either side of the slot: catches the light, gives the slot depth and scale
    for (const sx of [-1, 1]) {
      const h = new THREE.Mesh(new RoundedBoxGeometry(0.05, 3.9, 0.14, 2, 0.012), mMetal);
      h.position.set(sx * 0.0875, 2.15, REST.K.max[2] + 0.07);
      s.add(h);
      this.housing.push(h);
    }

    // the world beyond the plinth
    const gm = new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.55, metalness: 0, specularIntensity: 0.1 });
    patch(gm, 'ground');
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), gm);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.02;
    s.add(ground);

    // polished-floor reflection of the monolith: additive, softened, faded with distance from the plinth (exterior only)
    const MirrorShader = {
      name: 'SoftMirror',
      uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uK: { value: 2.2 } },
      vertexShader: 'uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main(){ vUv = textureMatrix * vec4(position, 1.0); vW = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: /* glsl */ `
        uniform sampler2D tDiffuse; uniform float uK; varying vec4 vUv; varying vec3 vW;
        void main(){
          vec2 uv = vUv.xy / vUv.w;
          float r = 0.0045;
          vec3 c = texture2D(tDiffuse, uv).rgb * 0.2;
          for (int i = 0; i < 8; i++) { float a = float(i) * 0.785398; vec2 o = vec2(cos(a), sin(a)); c += texture2D(tDiffuse, uv + o * r).rgb * 0.1 + texture2D(tDiffuse, uv + o * r * 2.2).rgb * 0.0; }
          float d = length(vW.xz - vec2(-0.3, 0.0));
          float fade = exp(-d * 0.12) * smoothstep(0.0, 1.0, 1.0 - exp(-d * 3.0) * 0.0);
          gl_FragColor = vec4(min(c, vec3(4.0)) * uK * fade, 1.0);
        }`,
    };
    this.mirror = new Reflector(new THREE.PlaneGeometry(120, 120), { textureWidth: 768, textureHeight: 768, shader: MirrorShader, clipBias: 0.003, multisample: 0 });
    this.mirror.rotation.x = -Math.PI / 2;
    this.mirror.position.y = 0.004; this.mirror.renderOrder = 1;
    const mm = this.mirror.material as THREE.ShaderMaterial;
    mm.transparent = true;
    mm.blending = THREE.AdditiveBlending;
    mm.depthWrite = false;
    s.add(this.mirror);
  }

  /** Update analytic occluder bounds from the live mesh offsets. */
  syncUniforms(): void {
    const set = (i: number, b: { min: V3; max: V3 }, m: THREE.Mesh) => {
      U.uBoxMin.value[i].set(...b.min).add(m.position);
      U.uBoxMax.value[i].set(...b.max).add(m.position);
    };
    set(0, REST.L, this.L);
    set(1, REST.R, this.R);
    set(2, REST.C, this.C);
    set(3, REST.K, this.K);
    // slot rides on K
    U.uSlotA.value.set(0, 0.3, REST.K.max[2] + 0.02).add(new THREE.Vector3(0, 0, this.K.position.z));
    U.uSlotB.value.set(0, 4.0, REST.K.max[2] + 0.02).add(new THREE.Vector3(0, 0, this.K.position.z));
    this.slot.position.set(0, 2.15, REST.K.max[2] + 0.004 + this.K.position.z);
    this.housing.forEach((h, i) => h.position.set((i ? 1 : -1) * 0.0875, 2.15, REST.K.max[2] + 0.07 + this.K.position.z));
  }
}

/** Screen-space graphite falloff: a pool of faint light behind the object so the silhouette has something to separate from. */
function backdrop(): THREE.Texture {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(300, 230, 10, 300, 230, 200);
  gr.addColorStop(0, '#26282c');
  gr.addColorStop(0.55, '#0b0c0e');
  gr.addColorStop(1, '#020203');
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
