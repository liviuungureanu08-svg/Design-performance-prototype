import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { buildEnvironment } from './env';
import { World } from './world';
import { Choreo } from './choreo';

const GRADE = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uVig: { value: 0.32 }, uGrain: { value: 0.012 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime, uVig, uGrain; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233)))*43758.5453); }
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      vec2 q = vUv - 0.5; float v = 1.0 - uVig * smoothstep(0.25, 0.85, length(q * vec2(1.0, 0.9)));
      c *= v;
      float lum = dot(c, vec3(0.2126,0.7152,0.0722));
      c += (h(vUv*vec2(1731.0,977.0) + uTime) - 0.5) * uGrain * (0.35 + smoothstep(0.0, 0.6, lum));
      gl_FragColor = vec4(c, 1.0);
    }`,
};

export class Engine {
  renderer: THREE.WebGLRenderer;
  camera = new THREE.PerspectiveCamera(30, 1, 0.05, 160);
  world: World;
  choreo: Choreo;
  composer: EffectComposer;
  bloom: UnrealBloomPass;
  grade: ShaderPass;
  renderScale = 1;
  raw = false;
  camOverride: number[] | null = null;
  private baseProj = new THREE.Matrix4();
  private baseFov = 30;
  private w = 1;
  private h = 1;
  private maxDpr = 1.75;

  constructor(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', { antialias: false, powerPreference: 'high-performance', alpha: false });
    if (!gl) throw new Error('WebGL2 unavailable');
    this.renderer = new THREE.WebGLRenderer({ canvas, context: gl });
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    const env = buildEnvironment(this.renderer);
    this.world = new World(env);
    this.choreo = new Choreo(this.world);
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.world.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.06, 0.3, 2.0);
    this.composer.addPass(this.bloom);
    this.grade = new ShaderPass(GRADE);
    this.composer.addPass(this.grade);
    this.composer.addPass(new OutputPass());
  }

  setRaw(raw: boolean): void {
    this.raw = raw;
    this.bloom.enabled = !raw;
    this.grade.enabled = !raw;
  }
  setScale(s: number): void {
    this.renderScale = s;
    this.resize(this.w, this.h);
  }
  resize(w: number, h: number): void {
    this.w = w; this.h = h;
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr) * this.renderScale;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.aspect = w / h;
    // portrait: widen the vertical field so the monolith keeps its framing (cinematography, not shrinking)
    const portrait = Math.max(0, 1 - this.camera.aspect) ;
    this.baseFov = 30 + portrait * 22;
    this.camera.fov = this.baseFov;
    this.camera.updateProjectionMatrix();
    this.baseProj.copy(this.camera.projectionMatrix);
  }
  render(u: number, parts: { L: number; R: number; C: number; F: number }, time: number, drift: THREE.Vector3): void {
    this.choreo.apply(u, parts.L, parts.R, parts.C, parts.F);
    const o = this.camOverride;
    if (o) { this.camera.position.set(o[0], o[1], o[2]); this.camera.lookAt(o[3], o[4], o[5]); this.choreo.shift = o[6] ?? 0; }
    else { this.camera.position.copy(this.choreo.camPos).add(drift); this.camera.lookAt(this.choreo.camTarget); }
    // architectural lens shift: verticals stay straight while the monolith is observed, then it relaxes into a real tilt
    const fovNow = this.baseFov + (this.choreo.fov - 30);
    if (Math.abs(this.camera.fov - fovNow) > 1e-4) { this.camera.fov = fovNow; this.camera.updateProjectionMatrix(); this.baseProj.copy(this.camera.projectionMatrix); }
    this.camera.projectionMatrix.copy(this.baseProj);
    this.camera.projectionMatrix.elements[9] = this.choreo.shift;
    this.camera.projectionMatrixInverse.copy(this.camera.projectionMatrix).invert();
    this.renderer.toneMappingExposure = this.choreo.exposure;
    this.grade.uniforms.uTime.value = time % 10;
    this.composer.render();
  }
  dispose(): void {
    this.composer.dispose();
    this.renderer.dispose();
  }
}
