import * as THREE from 'three';
import { common, fsVert } from './glsl';
import { horizonFrag } from './scenes/horizon';
import { domeFrag } from './scenes/dome';
import { seaFrag } from './scenes/sea';
import { finaleFrag } from './scenes/finale';
import { buildTextSdf } from './textsdf';
import { portalFrag } from './transitions/portal';
import { liquidFrag } from './transitions/liquid';

export type SceneId = 0 | 1 | 2 | 3;

/** One shared uniform block for every pass (each shader declares only what it uses). */
export type Uniforms = Record<string, THREE.IUniform>;

export const SUN = { x: 0.0, y: 0.06, r: 0.135 };

const postFrag = /* glsl */ `
${common}
uniform sampler2D tScene;
uniform sampler2D tBloom;
uniform float uGrade;   // 0..1 chapter-dependent bloom mix
uniform float uFadeIn;  // opening exposure ramp
uniform vec2 uPostRes;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + .03)) / (x * (2.43 * x + .59) + .14), 0., 1.); }
void main() {
  vec2 uv = vUv;
  vec2 c = uv - .5;
  // very light radial chromatic aberration, only toward the corners
  float ca = dot(c, c) * .0035;
  vec3 col;
  col.r = texture2D(tScene, uv + c * ca).r;
  col.g = texture2D(tScene, uv).g;
  col.b = texture2D(tScene, uv - c * ca).b;
  vec3 bl = texture2D(tBloom, uv).rgb;
  col += bl * .30;
  col = aces(col * .92 * uFadeIn);
  // vignette
  float vg = smoothstep(1.05, .35, length(c * vec2(1.1, 1.)));
  col *= mix(.62, 1., vg);
  col = pow(col, vec3(1. / 2.2));
  col = mix(col, col * col * (3. - 2. * col), .42);   // gentle S-curve: deeper blacks, cleaner highlights
  // dither / film grain (static-ish, never banded)
  float g = hash21(gl_FragCoord.xy + fract(uTime) * 91.7) - .5;
  col += g * (1.6 / 255.) + g * .012 * (1. - luma(col));
  gl_FragColor = vec4(col, 1.);
}`;

const brightFrag = /* glsl */ `
${common}
uniform sampler2D tScene;
void main() {
  vec3 c = texture2D(tScene, vUv).rgb;
  float l = luma(c);
  float k = smoothstep(.9, 3.5, l);
  gl_FragColor = vec4(min(c, vec3(5.)) * k, 1.);
}`;

const blurFrag = /* glsl */ `
${common}
uniform sampler2D tSrc;
uniform vec2 uDir;
void main() {
  vec2 st = uDir / uRes;
  vec3 s = texture2D(tSrc, vUv).rgb * .2270270270;
  s += (texture2D(tSrc, vUv + st * 1.3846153846).rgb + texture2D(tSrc, vUv - st * 1.3846153846).rgb) * .3162162162;
  s += (texture2D(tSrc, vUv + st * 3.2307692308).rgb + texture2D(tSrc, vUv - st * 3.2307692308).rgb) * .0702702703;
  gl_FragColor = vec4(s, 1.);
}`;

const copyFrag = /* glsl */ `
${common}
uniform sampler2D tSrc;
void main(){ gl_FragColor = vec4(texture2D(tSrc, vUv).rgb, 1.); }`;

function rt(w: number, h: number, depth = false): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(w, h, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthBuffer: depth,
    generateMipmaps: false,
    samples: depth ? 4 : 0,
  });
}

export class Engine {
  readonly renderer: THREE.WebGLRenderer;
  readonly u: Uniforms;
  private tri: THREE.Mesh;
  private triScene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private mats = new Map<string, THREE.ShaderMaterial>();
  rtFrom: THREE.WebGLRenderTarget;
  rtTo: THREE.WebGLRenderTarget;
  rtComp: THREE.WebGLRenderTarget;
  private rtBloomA: THREE.WebGLRenderTarget;
  private rtBloomB: THREE.WebGLRenderTarget;
  private size = new THREE.Vector2(1, 1);
  private scale = 0.85;
  width = 1;
  height = 1;

  constructor(readonly canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
    if (!this.renderer.capabilities.isWebGL2) throw new Error('WebGL2 unavailable');
    this.renderer.autoClear = false;
    this.renderer.setClearColor(0x000000, 1);

    this.u = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uCam: { value: new THREE.Vector3() },
      uSun: { value: new THREE.Vector3(SUN.x, SUN.y, SUN.r) },
      uShim: { value: 0 },
      uFade: { value: 0 },
      uCrack: { value: 0 },
      tSrc: { value: null },
      tScene: { value: null },
      tBloom: { value: null },
      uDir: { value: new THREE.Vector2() },
      uGrade: { value: 0 },
      uFadeIn: { value: 1 },
      uPostRes: { value: new THREE.Vector2() },
      tSdf: { value: null },
      tFrom: { value: null },
      tTo: { value: null },
      uP: { value: 0 },
      uAperture: { value: 0 },
      uLens: { value: 0 },
      uMorph: { value: 0 },
      uOpen: { value: 0 },
      uFlood: { value: 0 },
      uRipple: { value: 0 },
      uAppear: { value: 1 },
      uWorld: { value: 1 },
      uZoom: { value: 1 },
      uRect: { value: new THREE.Vector4(-1.2, -0.6, 2.4, 1.2) },
    };

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.tri = new THREE.Mesh(g, undefined);
    this.tri.frustumCulled = false;
    this.triScene.add(this.tri);

    this.addPass('horizon', horizonFrag);
    this.addPass('dome', domeFrag);
    this.addPass('sea', seaFrag);
    this.addPass('finale', finaleFrag);
    this.addPass('portal', portalFrag);
    this.addPass('liquid', liquidFrag);
    this.addPass('post', postFrag);
    this.addPass('bright', brightFrag);
    this.addPass('blur', blurFrag);
    this.addPass('copy', copyFrag);

    this.rtFrom = rt(2, 2);
    this.rtTo = rt(2, 2);
    this.rtComp = rt(2, 2, true);
    this.rtBloomA = rt(2, 2);
    this.rtBloomB = rt(2, 2);
  }

  /** Rasterise the finale word into an SDF texture (async: needs the web font). */
  async initText(word: string, capHeight: number, centreIndex: number): Promise<void> {
    const sdf = await buildTextSdf(word, capHeight, centreIndex);
    this.u.tSdf.value = sdf.texture;
    (this.u.uRect.value as THREE.Vector4).copy(sdf.rect);
  }

  addPass(name: string, frag: string): THREE.ShaderMaterial {
    const m = new THREE.ShaderMaterial({
      vertexShader: fsVert,
      fragmentShader: frag,
      uniforms: this.u,
      depthTest: false,
      depthWrite: false,
    });
    this.mats.set(name, m);
    return m;
  }

  mat(name: string): THREE.ShaderMaterial {
    const m = this.mats.get(name);
    if (!m) throw new Error(`no pass ${name}`);
    return m;
  }

  setScale(s: number): void {
    this.scale = s;
    this.resize(this.width, this.height);
  }
  get renderScale(): number {
    return this.scale;
  }

  resize(w: number, h: number): void {
    this.width = w;
    this.height = h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    // the finale word is ~1.4 screen-heights wide: shrink it to fit portrait screens
    this.u.uWorld.value = Math.min(1, (w / h) / 1.55);
    // never shade more than ~1.7 megapixels per scene pass (phones with 3x screens)
    const cap = Math.min(1, Math.sqrt(1.7e6 / (w * dpr * h * dpr * this.scale * this.scale)));
    const rw = Math.max(2, Math.round(w * dpr * this.scale * cap));
    const rh = Math.max(2, Math.round(h * dpr * this.scale * cap));
    this.size.set(rw, rh);
    [this.rtFrom, this.rtTo, this.rtComp].forEach((r) => r.setSize(rw, rh));
    const bw = Math.max(2, rw >> 2);
    const bh = Math.max(2, rh >> 2);
    this.rtBloomA.setSize(bw, bh);
    this.rtBloomB.setSize(bw, bh);
  }

  /**
   * Some GPUs (older mobile) cannot render into half-float targets or multisample them. Probe once, degrade
   * MSAA if needed, and throw (-> static poster) only if HDR targets themselves are unusable.
   */
  validate(): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const complete = (t: THREE.WebGLRenderTarget): boolean => {
      this.u.tSrc.value = this.rtBloomA.texture;
      this.pass('copy', t);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      this.renderer.setRenderTarget(null);
      return ok;
    };
    if (!this.renderer.extensions.has('EXT_color_buffer_float') && !this.renderer.extensions.has('EXT_color_buffer_half_float')) {
      throw new Error('float render targets unavailable');
    }
    if (!complete(this.rtFrom)) throw new Error('half-float render target incomplete');
    if (!complete(this.rtComp)) {
      this.rtComp.samples = 0;
      this.rtComp.dispose();
      if (!complete(this.rtComp)) throw new Error('comp target incomplete');
    }
  }

  get internalSize(): THREE.Vector2 {
    return this.size;
  }

  /** Draw a full-screen pass into a target (or the canvas when null). */
  pass(name: string, target: THREE.WebGLRenderTarget | null, res?: THREE.Vector2, clear = false): void {
    const r = res ?? (target ? new THREE.Vector2(target.width, target.height) : this.size);
    (this.u.uRes.value as THREE.Vector2).copy(r);
    this.tri.material = this.mat(name);
    this.renderer.setRenderTarget(target);
    if (clear) this.renderer.clear();
    this.renderer.render(this.triScene, this.cam);
  }

  /** Final grade: bloom + tonemap + grain, comp -> canvas. */
  raw = false;
  post(src: THREE.WebGLRenderTarget): void {
    if (this.raw) {
      this.u.tSrc.value = src.texture;
      this.pass('copy', null, new THREE.Vector2(this.canvas.width, this.canvas.height));
      return;
    }
    this.u.tScene.value = src.texture;
    this.pass('bright', this.rtBloomA);
    this.u.tSrc.value = this.rtBloomA.texture;
    (this.u.uDir.value as THREE.Vector2).set(1.6, 0);
    this.pass('blur', this.rtBloomB);
    this.u.tSrc.value = this.rtBloomB.texture;
    (this.u.uDir.value as THREE.Vector2).set(0, 1.6);
    this.pass('blur', this.rtBloomA);
    this.u.tSrc.value = this.rtBloomA.texture;
    (this.u.uDir.value as THREE.Vector2).set(3.2, 0);
    this.pass('blur', this.rtBloomB);
    this.u.tSrc.value = this.rtBloomB.texture;
    (this.u.uDir.value as THREE.Vector2).set(0, 3.2);
    this.pass('blur', this.rtBloomA);
    this.u.tBloom.value = this.rtBloomA.texture;
    this.u.tScene.value = src.texture;
    const px = new THREE.Vector2(this.canvas.width, this.canvas.height);
    this.pass('post', null, px);
  }

  dispose(): void {
    this.mats.forEach((m) => m.dispose());
    [this.rtFrom, this.rtTo, this.rtComp, this.rtBloomA, this.rtBloomB].forEach((r) => r.dispose());
    this.tri.geometry.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
