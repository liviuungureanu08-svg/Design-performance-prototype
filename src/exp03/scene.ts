// Static endpoint renderer for Experiment 03. Raster three.js, but converged like a still photograph:
// every pass jitters the sub-pixel camera offset, the key light's position across its (large, soft) emitting area and
// one sky sample direction (shadowed), and the passes are averaged. Result: area-light soft shadows, sky occlusion
// (contact, inner folds) and clean edges without post-processing. Nothing moves; it renders, converges and stops.
import * as THREE from 'three';
import { Folder, plateGeometry } from './fold';
import { spineLight, impliedPlane, POSSIBILITY } from './ether';
import { makeFolder, P, type Params } from './design';
import { choreo, buildUniforms, growify, growDepth, growPlate, lightLine, hazePlane, LM, type BuildUniforms } from './motion';

export type SceneId = 'a' | 'b';

interface Spot { pos: THREE.Vector3; target: THREE.Vector3; color: number; intensity: number; radius: number; angle: number; shadow: boolean }
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
interface Look {
  exposure: number;
  spots: Spot[];
  sky: { up: number; down: number; tint: number; bounce: number };
  env: number; // specular environment strength
  fog: number; fogColor: number;
  wall: number; floor: number;
  sun?: { dir: THREE.Vector3; color: number; intensity: number; spread: number };
}

const LOOKS: Record<SceneId, Look> = {
  a: {
    exposure: 1.0,
    spots: [
      // key: large soft box, front-left and high; slightly warm, it is what makes the made part tangible
      { pos: V(-3.4, 1.6, -3.2), target: V(1.2, 0.6, 0.0), color: 0xffe0c4, intensity: 44, radius: 0.7, angle: 0.3, shadow: true },
      // rim: cool, high behind right, draws the top edges against the dark
      { pos: V(4.5, 6, -5.5), target: V(0.8, 1.4, 0), color: 0x9fb4d8, intensity: 90, radius: 1.0, angle: 0.7, shadow: true },
      // background wash behind the object (separation)
      { pos: V(0.5, 3.2, 4), target: V(0.2, 1.8, -6.5), color: 0x5f78a8, intensity: 80, radius: 2, angle: 0.95, shadow: false },
    ],
    sky: { up: 0.09, down: 0.02, tint: 0x7f98c4, bounce: 0x5f5e62 },
    env: 0.35, fog: 0.03, fogColor: 0x10141d,
    wall: 0x4a4d52, floor: 0x55565a,
  },
  b: {
    exposure: 1.0,
    spots: [
      // no key: daylight does the work. A faint cool counter-light from the right keeps the far edges legible
      { pos: V(4.5, 6, -5.5), target: V(0.8, 1.4, 0), color: 0xc9d3e2, intensity: 0, radius: 1.6, angle: 0.7, shadow: false },
      { pos: V(0.5, 3.4, 4), target: V(0.6, 1.4, -6.5), color: 0xd9cdbd, intensity: 75, radius: 2, angle: 0.6, shadow: false },
      { pos: V(-4.5, 5.5, 6.5), target: V(0.8, 0.4, 0), color: 0xffe0bf, intensity: 0, radius: 1.4, angle: 1.0, shadow: false },
    ],
    sky: { up: 0.28, down: 0.09, tint: 0xb4bfcf, bounce: 0x9a928a },
    env: 0.85, fog: 0.015, fogColor: 0x8f9297,
    wall: 0x9e9a95, floor: 0x948f88,
    // reality receives light: low sun through one opening in the wall behind the camera
    sun: { dir: V(-0.8, 0.38, 0.6).normalize(), color: 0xffdcb6, intensity: 6.5, spread: 0.012 },
  },
};

const lerpHex = (a: number, b: number, t: number) => new THREE.Color(a).lerp(new THREE.Color(b), t).getHex();
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** the look at handoff h: every light of A and of B exists; A's dim as B's rise (light by light, never image by image) */
function blendLook(h: number, sun: number, emit: number): Look {
  const A = LOOKS.a, B = LOOKS.b;
  return {
    exposure: 1,
    spots: [...A.spots.map((s) => ({ ...s, intensity: s.intensity * (1 - h) * (0.35 + 0.65 * emit) })), ...B.spots.map((s) => ({ ...s, intensity: s.intensity * h }))],
    sky: { up: lerp(A.sky.up, B.sky.up, h), down: lerp(A.sky.down, B.sky.down, h), tint: lerpHex(A.sky.tint, B.sky.tint, h), bounce: lerpHex(A.sky.bounce, B.sky.bounce, h) },
    env: lerp(A.env, B.env, h), fog: lerp(A.fog, B.fog, h), fogColor: lerpHex(A.fogColor, B.fogColor, h),
    wall: lerpHex(A.wall, B.wall, h), floor: lerpHex(A.floor, B.floor, h),
    sun: { ...B.sun!, intensity: B.sun!.intensity * sun },
  };
}

/** light cookie: a tall opening with slightly soft jambs (daylight through a window, not a stage spot) */
function windowCookie(): THREE.Texture {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  g.filter = 'blur(5px)';
  g.fillStyle = '#fff'; g.fillRect(84, 6, 92, 244);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** dark mineral ceramic: a cloudy, very low-amplitude roughness variation plus a fine grain, both in object space.
 *  Visible only inside reflections and grazing highlights; never as a pattern in the diffuse colour. */
function mineral(m: THREE.MeshPhysicalMaterial): void {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (s, r) => {
    prev.call(m, s, r);
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    s.fragmentShader = s.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vObj;
      float h3(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      float n3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3. - 2. * f);
        return mix(mix(mix(h3(i), h3(i + vec3(1,0,0)), f.x), mix(h3(i + vec3(0,1,0)), h3(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(h3(i + vec3(0,0,1)), h3(i + vec3(1,0,1)), f.x), mix(h3(i + vec3(0,1,1)), h3(i + vec3(1,1,1)), f.x), f.y), f.z); }`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      {
        float cloud = n3(vObj * 5.0) * 0.6 + n3(vObj * 13.0) * 0.4;
        float grain = n3(vObj * 420.0);
        roughnessFactor = clamp(roughnessFactor + (cloud - 0.5) * 0.035 + (grain - 0.5) * 0.04, 0.05, 1.0);
      }`);
  };
}

const noIrradiance = (m: THREE.Material) => {
  // the environment map is used for reflections only; diffuse sky light comes from the shadowed sky samples
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace('#include <lights_fragment_maps>',
      THREE.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );', ''));
  };
  return m;
};

export interface StageOpts { silhouette?: boolean; clay?: boolean; spp?: number; params?: Partial<Params> }

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(22, 16 / 9, 0.1, 80);
  folder: Folder;
  params: Params;
  private emitters: THREE.PointLight[] = [];
  private spots: THREE.SpotLight[] = [0, 1, 2].map(() => new THREE.SpotLight());
  private glowLights: THREE.PointLight[] = [];
  build: BuildUniforms = buildUniforms();
  private motion = false; private envKey = -1; private seq = 0;
  private skyL = new THREE.DirectionalLight();
  private sun = new THREE.SpotLight();
  private rtS!: THREE.WebGLRenderTarget; private rtA!: THREE.WebGLRenderTarget; private rtB!: THREE.WebGLRenderTarget;
  private quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  private qs = new THREE.Scene(); private qc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private accumMat: THREE.ShaderMaterial; private outMat: THREE.ShaderMaterial;
  private look!: Look;
  private w = 0; private h = 0; private n = 0; private spp: number;
  objectGroup = new THREE.Group();
  envGroup = new THREE.Group();
  private ceramic: THREE.MeshPhysicalMaterial;
  private silMat = new THREE.MeshBasicMaterial({ color: 0x141414, side: THREE.DoubleSide });
  private wallMat: THREE.MeshPhysicalMaterial; private floorMat: THREE.MeshPhysicalMaterial;
  private env: THREE.Texture;
  done = false;
  id: SceneId = 'a';
  silhouette: boolean;

  constructor(canvas: HTMLCanvasElement, opts: StageOpts = {}) {
    this.silhouette = !!opts.silhouette;
    this.spp = opts.spp ?? 96;
    this.params = { ...P, ...opts.params };
    this.folder = makeFolder(this.params);
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.AgXToneMapping;
    r.outputColorSpace = THREE.SRGBColorSpace;

    this.ceramic = noIrradiance(new THREE.MeshPhysicalMaterial({ color: opts.clay ? 0xb8b4ae : 0x141518, roughness: 0.38, metalness: 0, specularIntensity: 0.8, side: THREE.FrontSide, shadowSide: THREE.FrontSide })) as THREE.MeshPhysicalMaterial;
    mineral(this.ceramic);
    this.wallMat = noIrradiance(new THREE.MeshPhysicalMaterial({ roughness: 0.92, specularIntensity: 0.2 })) as THREE.MeshPhysicalMaterial;
    this.floorMat = noIrradiance(new THREE.MeshPhysicalMaterial({ roughness: 0.62, specularIntensity: 0.45 })) as THREE.MeshPhysicalMaterial;

    this.scene.add(this.objectGroup, this.envGroup, this.skyL, this.skyL.target, this.sun, this.sun.target);
    // daylight: a distant spot (near-parallel rays) whose cookie is the opening it comes through (soft-edged rectangle)
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(4096, 4096);
    this.sun.shadow.camera.near = 20; this.sun.shadow.camera.far = 60;
    this.sun.shadow.bias = -0.00015; this.sun.shadow.normalBias = 0.006;
    this.sun.angle = 0.16; this.sun.penumbra = 0; this.sun.decay = 0; this.sun.distance = 0;
    this.sun.map = windowCookie();
    for (const k of this.spots) {
      this.scene.add(k, k.target);
      k.shadow.mapSize.set(2048, 2048);
      k.shadow.bias = -0.0002; k.shadow.normalBias = 0.01;
      k.shadow.camera.near = 2; k.shadow.camera.far = 24;
      k.penumbra = 1; k.decay = 2;
    }
    this.skyL.castShadow = true;
    this.skyL.shadow.mapSize.set(2048, 2048);
    const sc = this.skyL.shadow.camera; sc.left = -4.5; sc.right = 4.5; sc.top = 4.5; sc.bottom = -4.5; sc.near = 0.1; sc.far = 24;
    this.skyL.shadow.bias = -0.0003; this.skyL.shadow.normalBias = 0.015;

    this.buildEnvironment();
    this.env = this.bakeEnv();

    this.accumMat = new THREE.ShaderMaterial({
      uniforms: { prev: { value: null }, cur: { value: null }, k: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: 'uniform sampler2D prev, cur; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = mix(texture2D(prev, vUv), texture2D(cur, vUv), k); }',
      depthTest: false, depthWrite: false,
    });
    this.outMat = new THREE.ShaderMaterial({
      uniforms: { tex: { value: null }, exposure: { value: 1 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: `
        uniform sampler2D tex; uniform float exposure; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          vec3 c = texture2D(tex, vUv).rgb * exposure;
          gl_FragColor = vec4(c, 1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          // triangular dither against banding in the soft wall gradients
          gl_FragColor.rgb += (hash(gl_FragCoord.xy) + hash(gl_FragCoord.yx + 7.1) - 1.) / 255.;
        }`,
      depthTest: false, depthWrite: false, toneMapped: true,
    });
    this.quad.frustumCulled = false;
    this.qs.add(this.quad);
  }

  private buildEnvironment(): void {
    // floor with precise large-format joints (scale + precision), back wall far behind, a returning side wall
    const floorGeo = new THREE.PlaneGeometry(40, 40).rotateX(-Math.PI / 2);
    this.floorMat.onBeforeCompile = (s) => {
      s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvW = (modelMatrix * vec4(transformed, 1.)).xyz;');
      s.fragmentShader = s.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vW;')
        .replace('#include <lights_fragment_maps>', THREE.ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance( geometryNormal );', ''))
        .replace('#include <color_fragment>', `#include <color_fragment>
          {
            vec2 g = vW.xz / 1.2 + vec2(0.31, 0.17);
            vec2 fw = fwidth(g);
            vec2 d = abs(fract(g + 0.5) - 0.5) / max(fw, vec2(1e-4));
            float j = 1. - clamp(min(d.x, d.y) - 0.15, 0., 1.);
            diffuseColor.rgb *= 1. - 0.32 * j * clamp(1. - length(fw) * 40., 0., 1.);
          }`);
    };
    const floor = new THREE.Mesh(floorGeo, this.floorMat);
    floor.receiveShadow = true;
    this.envGroup.add(floor);
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(40, 16), this.wallMat);
    wall.position.set(0, 8, -6.5);
    wall.receiveShadow = true; wall.castShadow = true;
    this.envGroup.add(wall);

  }

  /** authored reflection environment: dim room, one large soft box on the key side, a thin high strip for edge lines */
  private bakeEnv(): THREE.Texture {
    const s = new THREE.Scene();
    const room = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide,
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: 'varying vec3 vP; void main(){ float y = normalize(vP).y; gl_FragColor = vec4(mix(vec3(0.05,0.05,0.05), vec3(0.16,0.17,0.19), smoothstep(-0.2, 0.8, y)), 1.); }',
    }));
    s.add(room);
    const panel = (w: number, h: number, pos: THREE.Vector3, c: number) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }));
      m.position.copy(pos); m.lookAt(0, 0, 0); s.add(m);
    };
    panel(4, 4, new THREE.Vector3(-6, 6, 3.5), 0xfff0e0);
    panel(9, 0.35, new THREE.Vector3(1, 8, -3), 0xd8dde6);
    panel(2.5, 6, new THREE.Vector3(7, 2, 2), 0x3a3d44);
    const pm = new THREE.PMREMGenerator(this.renderer);
    const t = pm.fromScene(s, 0.02).texture;
    pm.dispose();
    return t;
  }

  private envRT: THREE.WebGLRenderTarget | null = null;
  /** reflections come from the scene itself (its sunlit floor, its shaded wall), captured once without the object */
  private sceneEnv(): THREE.Texture | null {
    const rt = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    const cam = new THREE.CubeCamera(0.1, 60, rt);
    cam.position.set(1.0, 1.3, 0);
    const vis = this.objectGroup.visible;
    this.objectGroup.visible = false;
    this.scene.environment = null;
    this.placeLights(0);
    // sky as an unshadowed hemisphere for the capture (one shadowed sample would bias it)
    const L = this.look, sk = this.skyL.intensity;
    this.skyL.intensity = 0;
    const hemi = new THREE.HemisphereLight(L.sky.tint, L.sky.bounce, Math.PI * L.sky.up);
    this.scene.add(hemi);
    cam.update(this.renderer, this.scene);
    this.scene.remove(hemi); hemi.dispose();
    this.skyL.intensity = sk;
    this.objectGroup.visible = vis;
    const pm = new THREE.PMREMGenerator(this.renderer);
    this.envRT?.dispose();
    this.envRT = pm.fromCubemap(rt.texture);
    pm.dispose(); rt.dispose();
    return this.envRT.texture;
  }

  /** (re)build the hero for a scene */
  private buildObject(id: SceneId): void {
    this.objectGroup.clear();
    const f = this.folder, d = f.d;
    const add = (g: THREE.BufferGeometry, m: THREE.Material) => { const o = new THREE.Mesh(g, this.silhouette ? this.silMat : m); o.castShadow = true; o.receiveShadow = true; this.objectGroup.add(o); return o; };
    this.emitters.forEach((l) => this.scene.remove(l));
    this.emitters = [];
    if (id === 'b') {
      add(plateGeometry(f, { side: -1, W: d.wL, u0: 0, u1: d.length }), this.ceramic);
      add(plateGeometry(f, { side: 1, W: d.wR, u0: 0, u1: d.length }), this.ceramic);
      return;
    }
    // Scene A: matter → structure → possibility along the same band.
    // surface (seg 1–2) → partial plane (plates recede diagonally toward the spine across seg 3) → structural line (two ribs
    // flanking the slit, carried round the last fold) → the spine continues as light → absence before the loop would close.
    const p = this.params, rib = d.gap / 2 + 0.018, uRib = p.f3 - 0.12;
    const taper = (W: (u: number) => number, len: number) => (u: number) => u <= p.f2 ? W(u) : Math.max(rib, W(p.f2) + (rib - W(p.f2)) * Math.min(1, (u - p.f2) / len));
    add(plateGeometry(f, { side: -1, W: taper(d.wL, 0.75), u0: 0, u1: uRib }), this.ceramic);
    add(plateGeometry(f, { side: 1, W: taper(d.wR, 1.05), u0: 0, u1: uRib }), this.ceramic);
    const ether = new THREE.Group();
    // the spine continues as light out of the slit; the future outer edges are faint construction hairlines, never closed
    ether.add(spineLight(f, p.f3 - 0.5, d.length, [p.f3 - 0.5, p.f3 + 0.05, p.f3 + 0.5, d.length - 0.12], 0.06, 0.75, () => 0, 0, 1.3));
    // where a plate recedes, its outer edge outlives it for a while as a hairline of light (surface → partial plane → edge
    // → line); the edge fades before the last fold, so only the spine carries on round it
    const eL = (u: number) => -d.wL(u), eR = (u: number) => d.wR(u);
    ether.add(spineLight(f, p.f2 + 0.02, p.f3, [p.f2 + 0.02, p.f2 + 0.12, p.f2 + 0.22, p.f2 + 0.85], 0.035, 0.3, eL, 0, 1.0));
    ether.add(spineLight(f, p.f2 + 0.02, p.f3, [p.f2 + 0.02, p.f2 + 0.12, p.f2 + 0.3, p.f2 + 1.05], 0.035, 0.3, eR, 0, 1.0));
    ether.add(impliedPlane(f, p.f2 + 0.1, d.length, [p.f2 + 0.2, p.f2 + 0.9, p.f3 + 0.35, d.length - 0.15], 0.07));
    this.objectGroup.add(ether);
    // possibility emits light: the luminous spine really lights the ribs, the plate edges and the air around them
    // emitters follow the luminous spine with its own envelope, so the light it gives fades where it fades
    const us = [p.f3 - 0.35, p.f3 - 0.03, p.f3 + 0.3, p.f3 + 0.62, p.f3 + 0.95];
    const ks = [0.04, 0.26, 0.26, 0.17, 0.08];
    for (let i = 0; i < us.length; i++) {
      const u = us[i];
      const l = new THREE.PointLight(POSSIBILITY, ks[i], 0, 2);
      l.position.copy(f.F(u, 0, 0));
      this.emitters.push(l); this.scene.add(l);
    }
  }

  setScene(id: SceneId): void {
    this.id = id;
    this.look = LOOKS[id];
    this.buildObject(id);
    this.applyLook(this.look, true);
    this.restart();
  }

  private applyLook(L: Look, captureEnv: boolean): void {
    L.spots.forEach((sp, i) => {
      const k = this.spots[i];
      k.position.copy(sp.pos); k.target.position.copy(sp.target);
      k.color.set(sp.color); k.intensity = sp.intensity; k.angle = sp.angle; k.castShadow = sp.shadow && (!this.motion || sp.intensity > 0);
    });
    this.wallMat.color.set(L.wall); this.floorMat.color.set(L.floor);
    this.sun.visible = !!L.sun && (!this.motion || L.sun.intensity > 0);
    if (L.sun) { this.sun.color.set(L.sun.color); this.sun.intensity = L.sun.intensity; }
    this.scene.fog = new THREE.FogExp2(L.fogColor, L.fog);
    this.scene.background = new THREE.Color(L.fogColor);
    this.outMat.uniforms.exposure.value = L.exposure;
    this.renderer.toneMappingExposure = 1;
    if (this.silhouette) {
      this.envGroup.visible = false;
      this.scene.fog = null;
      this.scene.background = new THREE.Color(0xe8e5df);
      this.scene.environment = null;
    } else {
      if (captureEnv) this.scene.environment = this.sceneEnv() ?? this.env;
      this.scene.environmentIntensity = L.env;
    }
  }

  /* ---------------------------------------------------------------- */
  /* Motion Proof: one object whose state is a pure function of p      */
  /* ---------------------------------------------------------------- */
  initMotion(): void {
    this.motion = true;
    this.objectGroup.clear();
    this.emitters.forEach((l) => this.scene.remove(l));
    this.emitters = [];
    // B's spots join A's (six lights; each fades or rises, none moves)
    for (let i = 0; i < 3; i++) {
      const k = new THREE.SpotLight();
      this.scene.add(k, k.target);
      k.shadow.mapSize.set(2048, 2048); k.shadow.bias = -0.0002; k.shadow.normalBias = 0.01;
      k.shadow.camera.near = 2; k.shadow.camera.far = 24; k.penumbra = 1; k.decay = 2;
      this.spots.push(k);
    }
    const f = this.folder, d = f.d, p = this.params, U = this.build;
    const rib = d.gap / 2 + 0.018, uRib = p.f3 - 0.12;
    // A's plate widths (the made part, receding toward the spine) are the floor the build grows from
    const taper = (W: (u: number) => number, len: number) => (u: number) => u > uRib ? 0 : u <= p.f2 ? W(u) : Math.max(rib, W(p.f2) + (rib - W(p.f2)) * Math.min(1, (u - p.f2) / len));
    const mat = noIrradiance(new THREE.MeshPhysicalMaterial({ color: 0x141518, roughness: 0.38, metalness: 0, specularIntensity: 0.8, side: THREE.FrontSide, shadowSide: THREE.FrontSide })) as THREE.MeshPhysicalMaterial;
    mineral(mat);
    growify(mat, U);
    const depth = growDepth(U);
    for (const [side, WB, WA] of [[-1, d.wL, taper(d.wL, 0.75)], [1, d.wR, taper(d.wR, 1.05)]] as const) {
      const o = new THREE.Mesh(growPlate(f, side, WB, WA), mat);
      o.castShadow = true; o.receiveShadow = true; o.customDepthMaterial = depth;
      this.objectGroup.add(o);
    }
    const ether = new THREE.Group();
    const zero = () => 0, g2 = d.gap / 2;
    // the spine's light: two lips that coincide in A (exactly A's single line) and part to the slit's width
    for (const s of [-1, 1]) ether.add(lightLine(f, p.f3 - 0.5, d.length, [p.f3 - 0.5, p.f3 + 0.05, p.f3 + 0.5, d.length - 0.12], 0.06, 0.375, zero, () => s * g2, 0, U, 1.3));
    // A's construction hairlines at the future outer edges (seg 3), unchanged until matter reaches them
    const edgeOf = (W: (u: number) => number, sg: number) => (u: number, a: number) => { let v = sg * W(u); for (let i = 0; i < 6; i++) v = sg * W(u + v * Math.tan(a)); return v; };
    ether.add(lightLine(f, p.f2 + 0.02, p.f3, [p.f2 + 0.02, p.f2 + 0.12, p.f2 + 0.22, p.f2 + 0.85], 0.035, 0.3, edgeOf(d.wL, -1), edgeOf(d.wL, -1), 1, U, 1.0));
    ether.add(lightLine(f, p.f2 + 0.02, p.f3, [p.f2 + 0.02, p.f2 + 0.12, p.f2 + 0.3, p.f2 + 1.05], 0.035, 0.3, edgeOf(d.wR, 1), edgeOf(d.wR, 1), 1, U, 1.0));
    // light boundaries that leave the spine and travel to where the outer edges will be (they continue A's hairlines)
    ether.add(lightLine(f, p.f2 + 0.2, d.length, [p.f2 + 0.2, p.f2 + 0.85, d.length - 0.05, d.length + 0.01], 0.035, 0.3, () => -g2, edgeOf(d.wL, -1), 2, U, 1.0));
    ether.add(lightLine(f, p.f2 + 0.2, d.length, [p.f2 + 0.3, p.f2 + 1.05, d.length - 0.05, d.length + 0.01], 0.035, 0.3, () => g2, edgeOf(d.wR, 1), 2, U, 1.0));
    ether.add(hazePlane(f, p.f2 + 0.1, d.length, [p.f2 + 0.2, p.f2 + 0.9, p.f3 + 0.35, d.length - 0.15], 0.07, U));
    this.objectGroup.add(ether);
    // A's emitters (the luminous spine lights the ribs and floor) and two that ride the forming matter
    const us = [p.f3 - 0.35, p.f3 - 0.03, p.f3 + 0.3, p.f3 + 0.62, p.f3 + 0.95];
    for (const u of us) { const l = new THREE.PointLight(POSSIBILITY, 0, 0, 2); l.position.copy(f.F(u, 0, 0)); this.emitters.push(l); this.scene.add(l); }
    for (let i = 0; i < 2; i++) { const l = new THREE.PointLight(POSSIBILITY, 0, 0, 2); this.glowLights.push(l); this.scene.add(l); }
    this.id = 'a';
    this.envKey = -1;
    this.setProgress(0);
  }

  /** the whole visual state at progress p (deterministic: no history) */
  setProgress(pr: number): void {
    const c = choreo(pr, this.params), U = this.build, f = this.folder, d = f.d;
    U.uM.value = c.uM; U.uE.value = c.uE; U.uSplit.value = c.split; U.uEmit.value = c.emit;
    const ks = [0.04, 0.26, 0.26, 0.17, 0.08];
    this.emitters.forEach((l, i) => (l.intensity = ks[i] * c.emit));
    // the forming matter gives off light where it is newest (just behind the matter frontier)
    this.glowLights.forEach((l, i) => {
      const u = Math.min(d.length - 0.1, Math.max(this.params.f2, c.uM - LM * (0.3 + 0.35 * i)));
      l.position.copy(f.F(u, 0, 0.08));
      l.intensity = 0.16 * c.glow * c.emit;
    });
    const look = blendLook(c.hand, c.sun, c.emit);
    this.look = look;
    const key = Math.round(c.hand * 24);
    this.applyLook(look, key !== this.envKey);
    this.envKey = key;
  }

  frame(cam: { pos: THREE.Vector3; target: THREE.Vector3; fov: number; shiftY?: number }): void {
    this.aim(cam);
    this.restart();
  }

  /** place the camera without discarding the accumulated image (motion) */
  aim(cam: { pos: THREE.Vector3; target: THREE.Vector3; fov: number }): void {
    this.camera.position.copy(cam.pos);
    this.camera.fov = cam.fov;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(cam.target);
  }

  resize(w: number, h: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.round(w * dpr); this.h = Math.round(h * dpr);
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    for (const rt of [this.rtS, this.rtA, this.rtB]) rt?.dispose();
    const mk = (type: THREE.TextureDataType) => new THREE.WebGLRenderTarget(this.w, this.h, { type, depthBuffer: true, colorSpace: THREE.LinearSRGBColorSpace });
    // accumulate in float32 where the GPU can render to it; otherwise (common on phones) half float, which still converges
    const acc = this.renderer.extensions.has('EXT_color_buffer_float') ? THREE.FloatType : THREE.HalfFloatType;
    this.rtS = mk(THREE.HalfFloatType); this.rtA = mk(acc); this.rtB = mk(acc);
    this.restart();
  }

  restart(): void { this.n = 0; this.seq = 0; this.done = false; }
  /** while moving: keep a short history (weight of a new pass ≥ 1/3) and keep advancing the sample sequence */
  soften(): void { this.n = Math.min(this.n, 2); this.done = false; }

  private placeLights(i: number): void {
    const L = this.look;
    // each spot is a disc-shaped emitter (soft box) perpendicular to its axis
    L.spots.forEach((sp, si) => {
      const ax = sp.target.clone().sub(sp.pos).normalize();
      const t1 = new THREE.Vector3().crossVectors(ax, new THREE.Vector3(0, 1, 0)).normalize(), t2 = new THREE.Vector3().crossVectors(t1, ax);
      const rr = sp.radius * Math.sqrt((i * 0.618034 + 0.25 + si * 0.31) % 1), th = i * 2.399963 + si * 1.3;
      this.spots[si].position.copy(sp.pos).addScaledVector(t1, rr * Math.cos(th)).addScaledVector(t2, rr * Math.sin(th));
    });
    if (L.sun) {
      const sa = i * 2.399963 + 0.5, sr = L.sun.spread * Math.sqrt(((i + 0.5) / this.spp));
      const d0 = L.sun.dir.clone();
      const u1 = new THREE.Vector3().crossVectors(d0, new THREE.Vector3(0, 1, 0)).normalize(), u2 = new THREE.Vector3().crossVectors(u1, d0);
      d0.addScaledVector(u1, sr * Math.cos(sa)).addScaledVector(u2, sr * Math.sin(sa)).normalize();
      this.sun.target.position.set(0.9, 1.1, -0.2);
      this.sun.position.copy(this.sun.target.position).addScaledVector(d0, 40);
    }
    // sky: Fibonacci sphere direction; upper half = sky (shadowed), lower half = floor bounce
    const zf = 1 - 2 * ((i + 0.5) / this.spp), rf = Math.sqrt(1 - zf * zf), pf = i * 2.399963 + 0.9;
    const dir = new THREE.Vector3(rf * Math.cos(pf), zf, rf * Math.sin(pf));
    const up = dir.y > 0;
    this.skyL.color.set(up ? L.sky.tint : L.sky.bounce);
    // uniform sphere sampling, pdf 1/4π → intensity 4π·L (radiance L per hemisphere)
    this.skyL.intensity = 4 * Math.PI * (up ? L.sky.up : L.sky.down);
    this.skyL.target.position.set(1, 0.6, 0.3);
    this.skyL.position.copy(this.skyL.target.position).addScaledVector(dir, 10);
    this.skyL.castShadow = up;
  }

  /** render `count` more converging passes; returns true when converged */
  step(count = 1): boolean {
    if (this.done || !this.rtS) return true;
    const r = this.renderer;
    for (let c = 0; c < count && this.n < this.spp; c++) {
      const i = this.seq++ % this.spp;
      // stratified sequences (R2 / golden-angle) so few passes already look smooth
      const g1 = 0.7548776662, g2 = 0.5698402910;
      const ja = (0.5 + g1 * (i + 1)) % 1, jb = (0.5 + g2 * (i + 1)) % 1;
      this.camera.setViewOffset(this.w, this.h, ja - 0.5, jb - 0.5, this.w, this.h);
      this.placeLights(i);
      if (this.silhouette) { this.spots.forEach((k) => (k.intensity = 0)); this.skyL.intensity = 0; this.sun.intensity = 0; }
      r.setRenderTarget(this.rtS);
      r.render(this.scene, this.camera);
      // accumulate (ping-pong, exact running mean)
      this.accumMat.uniforms.prev.value = this.rtA.texture;
      this.accumMat.uniforms.cur.value = this.rtS.texture;
      this.accumMat.uniforms.k.value = 1 / (this.n + 1);
      this.quad.material = this.accumMat;
      r.setRenderTarget(this.rtB);
      r.render(this.qs, this.qc);
      [this.rtA, this.rtB] = [this.rtB, this.rtA];
      this.n++;
    }
    this.camera.clearViewOffset();
    this.outMat.uniforms.tex.value = this.rtA.texture;
    this.quad.material = this.outMat;
    r.setRenderTarget(null);
    r.render(this.qs, this.qc);
    this.done = this.n >= this.spp;
    return this.done;
  }

  get progress(): number { return this.n / this.spp; }
}
