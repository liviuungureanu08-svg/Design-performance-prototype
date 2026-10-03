import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import {
  TRAIL, RIPPLES,
  plateVertex, plateFragment, bgVertex, bgFragment, floorVertex, floorFragment, finalShader,
} from './shaders.js';
import { WallImage } from './wallimage.js';

const PLATE_W = 0.26, PLATE_H = 0.40, PLATE_D = 0.035;
const PITCH_X = 0.30, PITCH_Y = 0.45;

export class World {
  constructor(canvas, { portrait, reduced }) {
    this.canvas = canvas;
    this.reduced = reduced;
    this.portrait = portrait;

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, powerPreference: 'high-performance', alpha: false, stencil: false,
    });
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    renderer.setClearColor(0x050403, 1);
    this.renderer = renderer;

    this.dprMax = Math.min(window.devicePixelRatio || 1, portrait ? 1.6 : 1.75);
    this.dpr = this.dprMax;
    this.samples = 4;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
    this.camera.position.set(0, 9, 36);

    this.trail = Array.from({ length: TRAIL }, () => new THREE.Vector4(0, 0, -100, 0));
    this.trailIdx = 0;
    this.ripples = Array.from({ length: RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0));
    this.rippleIdx = 0;

    this.u = {
      uTime: { value: 0 },
      uPTime: { value: 0 },
      uMorph: { value: 0 },
      uGrid: { value: new THREE.Vector2() },
      uWall: { value: new THREE.Vector2() },
      uCanopy: { value: new THREE.Vector3() },
      uNave: { value: new THREE.Vector4() },
      uAspect: { value: 1 },
      uHead: { value: new THREE.Vector3(0, 0, 0) },
      uTrail: { value: this.trail },
      uRipple: { value: this.ripples },
      uRadius: { value: 0.16 },
      uPresAmt: { value: 1 },
      uIdle: { value: 1 },
      uSpark: { value: 0 },
      uIntro: { value: -0.4 },
      uTextAmt: { value: 0 },
      uTextMix: { value: 1 },
      uTextTex: { value: null },
      uWave: { value: 0 },
      uProc: { value: 0 },
      uProcAmt: { value: 0 },
      uOpen: { value: 0 },
      uWorkAmt: { value: 0 },
      uWorkA: { value: 0 },
      uWorkB: { value: 0 },
      uWorkMix: { value: 1 },
      uScan: { value: 0 },
      uHorizon: { value: 0 },
      uScrollVel: { value: 0 },
      uSafe: { value: new THREE.Vector4(-2, -2, -2, -2) },
      uSafeAmt: { value: 1 },
      uFloorY: { value: 0 },
      uDay: { value: 0 },
      uHorGlow: { value: 0.12 },
      uSlots: { value: 1 },
      uKeyDir: { value: new THREE.Vector3(-0.45, 0.62, 0.64).normalize() },
      uLight: { value: new THREE.Color(1.55, 0.98, 0.52) },
      uLight2: { value: new THREE.Color(1.7, 1.28, 0.82) },
      uGlow: { value: 1 },
      uFog: { value: new THREE.Color(0.012, 0.0095, 0.0075) },
      uFogDen: { value: 0.012 },
      uReflect: { value: 0.27 },
      uLampPos: { value: new THREE.Vector3(-16, 26, 22) },
      uLampI: { value: 1 },
      uInvProj: { value: new THREE.Matrix4() },
      uCamWorld: { value: new THREE.Matrix4() },
      uBgDim: { value: 1 },
      uPool: { value: 0 },
      uPoolC: { value: new THREE.Vector2(0, 2) },
    };

    this.image = new WallImage();
    this.u.uTextTex.value = this.image.texture;

    this._buildBackground();
    this._buildFloor();
    this._buildPlates(portrait);
    this._buildPost();

    this.workTween = null;
    this.imageTween = null;
    this.resize();
  }

  get plateCount() { return this.cols * this.rows; }

  _buildBackground() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const m = new THREE.ShaderMaterial({
      vertexShader: bgVertex, fragmentShader: bgFragment, uniforms: this.u,
      depthTest: false, depthWrite: false, transparent: true, blending: THREE.NoBlending,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.frustumCulled = false;
    mesh.renderOrder = 0;
    this.scene.add(mesh);
  }

  _buildFloor() {
    const g = new THREE.PlaneGeometry(600, 600);
    g.rotateX(-Math.PI / 2);
    const m = new THREE.ShaderMaterial({
      vertexShader: floorVertex, fragmentShader: floorFragment, uniforms: this.u,
      transparent: true, depthWrite: false, depthTest: false,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.renderOrder = 2;
    mesh.frustumCulled = false;
    // reflections are drawn before the floor; real plates must not be occluded by them
    mesh.onAfterRender = (r) => r.clearDepth();
    this.floor = mesh;
    this.scene.add(mesh);
  }

  _buildPlates(portrait) {
    if (this.plates) {
      this.scene.remove(this.plates, this.mirror);
      this.plates.geometry.dispose();
    }
    const cols = portrait ? 44 : 96;
    const rows = portrait ? 64 : 48;
    this.cols = cols; this.rows = rows;
    const box = new THREE.BoxGeometry(PLATE_W, PLATE_H, PLATE_D);
    const g = new THREE.InstancedBufferGeometry();
    g.index = box.index;
    g.setAttribute('position', box.attributes.position);
    g.setAttribute('normal', box.attributes.normal);
    const n = cols * rows;
    const cell = new Float32Array(n * 2);
    const rnd = new Float32Array(n * 4);
    let s = 1337;
    const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const k = j * cols + i;
      cell[k * 2] = (i + 0.5) / cols;
      cell[k * 2 + 1] = (j + 0.5) / rows;
      rnd[k * 4] = rand(); rnd[k * 4 + 1] = rand(); rnd[k * 4 + 2] = rand(); rnd[k * 4 + 3] = rand();
    }
    g.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 2));
    g.setAttribute('aRand', new THREE.InstancedBufferAttribute(rnd, 4));
    g.instanceCount = n;

    this.u.uGrid.value.set(cols, rows);
    this.u.uWall.value.set(cols * PITCH_X, rows * PITCH_Y);
    this.wallW = cols * PITCH_X; this.wallH = rows * PITCH_Y;
    this.u.uCanopy.value.set(cols * PITCH_X * 1.12, rows * PITCH_Y * 1.15, 8.6);
    const naveLen = cols * 0.45;
    this.naveLen = naveLen;
    this.naveZ = -4;
    this.u.uNave.value.set(naveLen, portrait ? 9.5 : 8.6, portrait ? 5.0 : 6.4, this.naveZ);
    this.image.setGrid(cols, rows);

    const mat = new THREE.ShaderMaterial({
      vertexShader: plateVertex, fragmentShader: plateFragment, uniforms: this.u,
      transparent: true, blending: THREE.NoBlending,
    });
    const mirrorMat = new THREE.ShaderMaterial({
      vertexShader: plateVertex, fragmentShader: plateFragment, uniforms: this.u,
      defines: { MIRROR: 1 }, side: THREE.BackSide, transparent: true, blending: THREE.NoBlending,
    });
    this.plates = new THREE.Mesh(g, mat);
    this.mirror = new THREE.Mesh(g, mirrorMat);
    for (const [mesh, o] of [[this.mirror, 1], [this.plates, 3]]) {
      mesh.frustumCulled = false;
      mesh.renderOrder = o;
      this.scene.add(mesh);
    }
  }

  setPortrait(p) {
    if (p === this.portrait) return;
    this.portrait = p;
    this._buildPlates(p);
  }

  _buildPost() {
    const r = this.renderer;
    const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: this.samples });
    this.composer = new EffectComposer(r, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.35, 0.5, 1.25);
    this.composer.addPass(this.bloom);
    this.final = new ShaderPass(finalShader);
    this.final.uniforms.uRes.value = new THREE.Vector2(1, 1);
    this.composer.addPass(this.final);
  }

  setQuality(level) {
    // 0 best .. 3 lowest
    const dprs = [this.dprMax, Math.min(this.dprMax, 1.4), 1.15, 1.0];
    this.dpr = dprs[level];
    this.qualityLevel = level;
    this.composer.renderTarget1.samples = level >= 2 ? 0 : 4;
    this.composer.renderTarget2.samples = level >= 2 ? 0 : 4;
    this.bloom.enabled = level < 3;
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.width = w; this.height = h;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.dpr);
    this.composer.setSize(w, h);
    this.bloom.setSize(Math.round(w * this.dpr * 0.5), Math.round(h * this.dpr * 0.5));
    this.final.uniforms.uRes.value.set(w * this.dpr, h * this.dpr);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.u.uAspect.value = w / h;
  }

  pushTrail(x, y, time, strength) {
    const v = this.trail[this.trailIdx];
    v.set(x, y, time, strength);
    this.trailIdx = (this.trailIdx + 1) % TRAIL;
  }

  ripple(x, y, time, strength = 1) {
    this.ripples[this.rippleIdx].set(x, y, time, strength);
    this.rippleIdx = (this.rippleIdx + 1) % RIPPLES;
  }

  showImage(name, time) {
    if (this.image.current === name) return;
    this.image.show(name);
    this.imageTween = { start: time, dur: this.reduced ? 0.01 : 1.6 };
    this.u.uTextMix.value = 0;
  }

  setWork(i, time) {
    if (this.u.uWorkB.value === i && this.workTween === null) return;
    if (this.u.uWorkB.value === i) return;
    const u = this.u;
    // collapse current blend into A, then fade to the new programme
    u.uWorkA.value = u.uWorkMix.value > 0.5 ? u.uWorkB.value : u.uWorkA.value;
    u.uWorkB.value = i;
    u.uWorkMix.value = 0;
    this.workTween = { start: time, dur: this.reduced ? 0.01 : 1.1 };
  }

  update(time, dt) {
    const u = this.u;
    u.uTime.value = time;
    if (!this.reduced) u.uPTime.value = time;
    if (this.imageTween) {
      const k = Math.min((time - this.imageTween.start) / this.imageTween.dur, 1);
      u.uTextMix.value = k;
      if (k >= 1) this.imageTween = null;
    }
    if (this.workTween) {
      const k = Math.min((time - this.workTween.start) / this.workTween.dur, 1);
      u.uWorkMix.value = k * k * (3 - 2 * k);
      if (k >= 1) this.workTween = null;
    }
    this.final.uniforms.uTime.value = time;
  }

  render() {
    const cam = this.camera;
    cam.updateMatrixWorld();
    this.u.uInvProj.value.copy(cam.projectionMatrixInverse);
    this.u.uCamWorld.value.copy(cam.matrixWorld);
    this.composer.render();
  }
}
