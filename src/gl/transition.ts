import * as THREE from 'three';
import { ART_H, ART_W, EMBER_FOCUS, type SceneArt } from '../art/scenes';
import { pairCells } from './match';
import { backdropFrag, backdropVert, shardFrag, shardVert } from './shaders';

export type Quality = 'premium' | 'balanced';

const GRID: Record<Quality, [number, number]> = {
  premium: [480, 270], // ~130k shards, ~4px at 1080p
  balanced: [320, 180], // ~58k shards
};

const FOV = 32;
const DEPTH_AMP = 0.55;
/** The image plane overscans the viewport so parallax never reveals an edge. */
const OVERSCAN = 1.1;

export interface FrameState {
  /** transformation progress, roughly -0.12 .. 1 */
  t: number;
  /** d(t)/dt in 1/s, smoothed — drives motion stretch */
  vel: number;
  /** camera parallax offset in world units */
  camX: number;
  camY: number;
  time: number;
}

function texture(canvas: HTMLCanvasElement, srgb: boolean, mips: boolean): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.generateMipmaps = mips;
  t.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

function blurred(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 27;
  const g = c.getContext('2d')!;
  g.imageSmoothingQuality = 'high';
  g.drawImage(src, 0, 0, c.width, c.height);
  return c;
}

export class CinematicTransition {
  readonly renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 40);
  private shards: THREE.Mesh;
  private backdrop: THREE.Mesh;
  private disposables: { dispose(): void }[] = [];
  private uniforms: Record<string, THREE.IUniform>;
  private camDist = 4;
  readonly shardCount: number;

  constructor(canvas: HTMLCanvasElement, a: SceneArt, b: SceneArt, quality: Quality) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      powerPreference: 'high-performance',
    });
    if (!this.renderer.capabilities.isWebGL2) throw new Error('WebGL2 unavailable');
    this.renderer.setClearColor(0x05040a, 1);

    const [cols, rows] = GRID[quality];
    this.shardCount = cols * rows;

    const texA = texture(a.color, true, true);
    const texB = texture(b.color, true, true);
    const depA = texture(a.depth, false, false);
    const depB = texture(b.depth, false, false);
    const blurA = texture(blurred(a.color), true, false);
    const blurB = texture(blurred(b.color), true, false);
    this.disposables.push(texA, texB, depA, depB, blurA, blurB);

    const planeW = 2 * (ART_W / ART_H);
    this.uniforms = {
      uColorA: { value: texA },
      uColorB: { value: texB },
      uDepthA: { value: depA },
      uDepthB: { value: depB },
      uBlurA: { value: blurA },
      uBlurB: { value: blurB },
      uT: { value: -1 },
      uTime: { value: 0 },
      uVel: { value: 0 },
      uCamDist: { value: this.camDist },
      uDepthAmp: { value: DEPTH_AMP },
      uGrid: { value: new THREE.Vector2(cols, rows) },
      uPlane: { value: new THREE.Vector2(planeW * OVERSCAN, 2 * OVERSCAN) },
      uFocusA: { value: new THREE.Vector2(EMBER_FOCUS[0], EMBER_FOCUS[1]) },
    };

    // --- shards ---
    const dest = pairCells(a.color, b.color, cols, rows);
    const n = cols * rows;
    const cell = new Float32Array(n * 2);
    const to = new Float32Array(n * 2);
    const rand = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      cell[i * 2] = i % cols;
      cell[i * 2 + 1] = Math.floor(i / cols);
      to[i * 2] = dest[i] % cols;
      to[i * 2 + 1] = Math.floor(dest[i] / cols);
      for (let k = 0; k < 4; k++) rand[i * 4 + k] = Math.random();
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0]), 3));
    geo.setIndex([0, 1, 2, 2, 1, 3]);
    geo.setAttribute('aCell', new THREE.InstancedBufferAttribute(cell, 2));
    geo.setAttribute('aDest', new THREE.InstancedBufferAttribute(to, 2));
    geo.setAttribute('aRand', new THREE.InstancedBufferAttribute(rand, 4));
    geo.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      vertexShader: shardVert,
      fragmentShader: shardFrag,
      uniforms: this.uniforms,
      side: THREE.DoubleSide,
    });
    this.shards = new THREE.Mesh(geo, mat);
    this.shards.frustumCulled = false;
    this.disposables.push(geo, mat);

    // --- backdrop (dark under-glow) ---
    const bgz = -0.8;
    const bgGeo = new THREE.PlaneGeometry(1, 1);
    const bgMat = new THREE.ShaderMaterial({
      vertexShader: backdropVert,
      fragmentShader: backdropFrag,
      uniforms: this.uniforms,
      depthWrite: false,
    });
    this.backdrop = new THREE.Mesh(bgGeo, bgMat);
    this.backdrop.position.z = bgz;
    this.backdrop.scale.set(1, 1, 1);
    this.backdrop.renderOrder = -1;
    this.disposables.push(bgGeo, bgMat);

    this.scene.add(this.backdrop, this.shards);
  }

  resize(width: number, height: number): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;

    // Fit like `object-fit: cover`, with margin for parallax and depth scale.
    const planeW = 2 * (ART_W / ART_H);
    const visibleH = Math.min(2, planeW / this.camera.aspect);
    this.camDist = visibleH / 2 / Math.tan((FOV * Math.PI) / 360);
    this.uniforms.uCamDist.value = this.camDist;
    const s = (this.camDist + 0.8) / this.camDist;
    this.backdrop.scale.set(planeW * s * OVERSCAN, 2 * s * OVERSCAN, 1);
    this.camera.near = 0.1;
    this.camera.far = this.camDist * 4;
    this.camera.updateProjectionMatrix();
  }

  render(s: FrameState): void {
    this.uniforms.uT.value = s.t;
    this.uniforms.uVel.value = s.vel;
    this.uniforms.uTime.value = s.time;
    this.camera.position.set(s.camX, s.camY, this.camDist);
    this.camera.lookAt(0, 0, 0);
    this.backdrop.position.z = -0.8;
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
