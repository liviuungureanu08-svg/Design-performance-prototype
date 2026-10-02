import * as THREE from 'three';
import { glyphShapes, loadSerif } from './glyphs';
import { layoutFor, WALL_Z, type Layout } from './layout';
import { COL, cardFront, discFace, floorDatum, pillFront, wallPrint } from './textures';

// MORE THAN PIXELS — one physical assembly, two readings.
// A = the assembly seen end-on through a ~1.6° lens (an orthographic elevation: it IS a flat page).
// B = the same bodies seen from the side. Every UI element is the front face of a body that runs back to the rear wall.
export const STRATA = ['Interface', 'Behaviour', 'Automation', 'Data & AI', 'Operations'];
export const STRATA_Z = [0, -2.5, -5, -7.5, -10];
const D2R = Math.PI / 180;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const inout = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/** Strata inlay: thin bands wrapped round every body at the datum depths. Sides only, so end-on (A) they do not exist. */
function strata(m: THREE.MeshStandardMaterial, band: string) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uBand = { value: new THREE.Color(band) };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vWz; varying float vNz;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWz = (modelMatrix * vec4(transformed, 1.0)).z; vNz = abs((mat3(modelMatrix) * objectNormal).z);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uBand; varying float vWz; varying float vNz;')
      .replace('#include <color_fragment>', `#include <color_fragment>
      float bd = 0.0; bd = max(bd, 1.0 - smoothstep(0.03, 0.05, abs(vWz + 2.5))); bd = max(bd, 1.0 - smoothstep(0.03, 0.05, abs(vWz + 5.0))); bd = max(bd, 1.0 - smoothstep(0.03, 0.05, abs(vWz + 7.5)));
      bd *= 1.0 - smoothstep(0.35, 0.6, vNz);
      diffuseColor.rgb = mix(diffuseColor.rgb, uBand, bd);`);
  };
  return m;
}

export interface Pose { yaw: number; pitch: number; px: number; py: number } // pointer parallax (-1..1)

export class World {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  cam = new THREE.PerspectiveCamera(2, 1, 1, 1000);
  sun = new THREE.DirectionalLight(0xffffff, 1);
  hemi = new THREE.HemisphereLight(0xffffff, 0x4d4f50, 1);
  group = new THREE.Group();
  L: Layout = layoutFor(1.6);
  w = 1; h = 1; aspect = 1.6;
  floor!: THREE.Mesh; datum!: THREE.Mesh; floorMat!: THREE.MeshStandardMaterial; datumMat!: THREE.MeshStandardMaterial;
  quality: 'high' | 'low';
  params: { ly: number; lp: number; yaw?: number; pitch?: number; zoom?: number };

  constructor(public canvas: HTMLCanvasElement, quality: 'high' | 'low', params: { ly: number; lp: number; yaw?: number; pitch?: number; zoom?: number } = { ly: 46, lp: 26 }) {
    this.quality = quality; this.params = params;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }));
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFShadowMap; r.shadowMap.autoUpdate = true;
    this.scene.background = new THREE.Color(COL.chalk);
    this.hemi.intensity = 0.64 * Math.PI; this.sun.intensity = 0.56 * Math.PI;
    this.sun.castShadow = true;
    const sz = quality === 'high' ? 4096 : 2048;
    this.sun.shadow.mapSize.set(sz, sz);
    const sc = this.sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 110;
    this.sun.shadow.bias = -0.0004; this.sun.shadow.normalBias = 0.03; this.sun.shadow.radius = 3.2; (this.sun.shadow as any).intensity = 0.62;
    this.scene.add(this.hemi, this.sun, this.sun.target, this.group);
  }

  get maxAniso() { return Math.min(8, this.renderer.capabilities.getMaxAnisotropy()); }

  async build(aspect: number) {
    await loadSerif();
    const L = (this.L = layoutFor(aspect));
    this.aspect = aspect;
    // dispose previous
    this.group.traverse((o: any) => { if (o.geometry) o.geometry.dispose(); if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; ms.forEach((m: any) => { m.map?.dispose(); m.dispose(); }); } });
    this.group.clear();
    const an = this.maxAniso;
    const std = (color: string, map?: THREE.Texture | null) => new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0, map: map ?? null });
    const ink = strata(std(COL.ink), COL.vermilion), inkSide = strata(std('#464b53'), COL.vermilion);
    const white = strata(std(COL.card), COL.vermilion), wallMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(COL.chalk).multiplyScalar(0.8), emissive: new THREE.Color(COL.chalk).multiplyScalar(0.2), roughness: 1 }), verm = strata(std(COL.vermilion), COL.ink);
    const add = (m: THREE.Mesh, cast = true, recv = true) => { m.castShadow = cast; m.receiveShadow = recv; this.group.add(m); return m; };

    // ----- rear wall (the printed page) + decal of the only flat content -----
    const wall = add(new THREE.Mesh(new THREE.PlaneGeometry(140, 120), wallMat), false, true); wall.position.set(0, 0, WALL_Z);
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(L.W, L.H), new THREE.MeshStandardMaterial({ map: wallPrint(L, an), transparent: true, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    pr.position.set(0, 0, WALL_Z + 0.004); pr.receiveShadow = true; this.group.add(pr);

    // ----- floor + datum -----
    const floorY = -L.H / 2 - (L.key === 'wide' ? 0.75 : 0.9);
    this.floorMat = new THREE.MeshStandardMaterial({ color: COL.chalk, roughness: 1, transparent: true }); this.floor = add(new THREE.Mesh(new THREE.PlaneGeometry(140, 80), this.floorMat), false, true);
    this.floor.rotation.x = -Math.PI / 2; this.floor.position.set(0, floorY, -10);
    const fd = floorDatum(L, STRATA_Z, STRATA, an);
    this.datumMat = new THREE.MeshStandardMaterial({ map: fd.tex, transparent: true, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); this.datum = new THREE.Mesh(new THREE.PlaneGeometry(fd.wU, fd.hU), this.datumMat);
    this.datum.rotation.x = -Math.PI / 2; this.datum.position.set((fd.x0 + fd.x1) / 2, floorY + 0.004, (fd.zFront + fd.zBack) / 2); this.datum.receiveShadow = true; this.group.add(this.datum);

    // ----- headline: every letter its own black prism, fronts staggered in depth (invisible end-on) -----
    let li = 0;
    for (const line of L.headline.lines) {
      const { glyphs } = glyphShapes(line.text, L.headline.size);
      for (const g of glyphs) {
        const front = -Math.round(hash(li * 3 + 1) * 5) * 0.55 + (li === 0 ? 0 : 0);
        const geo = new THREE.ExtrudeGeometry(g.shapes, { depth: front - WALL_Z, bevelEnabled: false, curveSegments: 8 });
        const m = add(new THREE.Mesh(geo, [ink, inkSide])); m.position.set(line.x, line.y, WALL_Z); li++;
      }
    }
    // logo (small serif letters, also bodies)
    {
      const { glyphs } = glyphShapes('Gabriel Solutions', L.logo.size);
      glyphs.forEach((g, i) => {
        const front = -2.2 - (i % 3) * 0.3;
        const m = add(new THREE.Mesh(new THREE.ExtrudeGeometry(g.shapes, { depth: front - WALL_Z, bevelEnabled: false, curveSegments: 6 }), [ink, inkSide]));
        m.position.set(L.logo.x, L.logo.y, WALL_Z);
      });
    }

    // ----- slabs (rounded prisms with a printed front) -----
    const slab = (x: number, y: number, w: number, h: number, r: number, front: number, face: THREE.Texture, side: THREE.Material) => {
      const s = new THREE.Shape(); const x0 = -w / 2, y0 = -h / 2;
      s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.absarc(x0 + w - r, y0 + r, r, -Math.PI / 2, 0, false); s.lineTo(x0 + w, y0 + h - r); s.absarc(x0 + w - r, y0 + h - r, r, 0, Math.PI / 2, false);
      s.lineTo(x0 + r, y0 + h); s.absarc(x0 + r, y0 + h - r, r, Math.PI / 2, Math.PI, false); s.lineTo(x0, y0 + r); s.absarc(x0 + r, y0 + r, r, Math.PI, Math.PI * 1.5, false);
      const geo = new THREE.ExtrudeGeometry(s, { depth: front - WALL_Z, bevelEnabled: false, curveSegments: 10 });
      face.repeat.set(1 / w, 1 / h); face.offset.set(0.5, 0.5); face.wrapS = face.wrapT = THREE.ClampToEdgeWrapping;
      const m = add(new THREE.Mesh(geo, [new THREE.MeshStandardMaterial({ map: face, roughness: 1 }), side]));
      m.position.set(x + w / 2, y, WALL_Z); return m;
    };
    const tall = L.key === 'tall';
    L.cards.forEach((c, i) => slab(c.x, c.y, c.w, c.h, 0.1, -1.6 - i * 0.9, cardFront(c.w, c.h, c, tall, an), white));
    slab(L.cta.x, L.cta.y, L.cta.w, L.cta.h, L.cta.h / 2, -0.5, pillFront(L.cta.w, L.cta.h, 'Tell us what you’re building  →', 'ink', tall ? 0.26 : 0.27, an), std(COL.ink));
    slab(L.navCta.x, L.navCta.y, L.navCta.w, L.navCta.h, L.navCta.h / 2, -1.2, pillFront(L.navCta.w, L.navCta.h, 'Start a project', 'line', 0.2, an), white);

    // ----- the disc: a vermilion shaft whose end face is a pixel matrix -----
    {
      const depth = -1.0 - WALL_Z;
      const geo = new THREE.CylinderGeometry(L.disc.r, L.disc.r, depth, 96, 1, false); geo.rotateX(Math.PI / 2);
      const face = discFace(an);
      const m = add(new THREE.Mesh(geo, [verm, new THREE.MeshStandardMaterial({ map: face, roughness: 1 }), verm]));
      m.position.set(L.disc.x, L.disc.y, WALL_Z + depth / 2);
      m.rotation.z = 0;
    }

    this.sun.shadow.needsUpdate = true;
  }

  /** Pure function of (progress, pose): same inputs -> same frame. */
  pose(p: number, ptr: { x: number; y: number }, sway = 0) {
    const L = this.L, a = this.aspect;
    const k = inout(clamp((p - 0.08) / 0.72));
    const hFit = Math.max(L.H * 1.12, (L.W * 1.08) / a);
    const fov = Math.exp(lerp(Math.log(0.06), Math.log(L.fovEnd), k));
    const Hp = lerp(hFit, hFit * (this.params.zoom ?? L.zoomOut), k);
    const dist = Hp / 2 / Math.tan((fov * D2R) / 2);
    const pf = 1 - clamp((p - 0.04) / 0.4) * 0.55;
    const yaw = -(this.params.yaw ?? L.yawEnd) * k + ptr.x * -3.2 * pf + sway * -2.2;
    const pitch = (this.params.pitch ?? L.pitchEnd) * k + ptr.y * 2.2 * pf + sway * 0.9;
    return { k, fov, dist, yaw, pitch };
  }

  render(p: number, ptr = { x: 0, y: 0 }, sway = 0) {
    const L = this.L;
    const { k, fov, dist, yaw, pitch } = this.pose(p, ptr, sway);
    const piv = new THREE.Vector3(L.pivot[0] * k, L.pivot[1] * k, lerp(0, L.pivot[2], k) * 1);
    const dir = (yw: number, pt: number) => new THREE.Vector3(Math.sin(yw * D2R) * Math.cos(pt * D2R), Math.sin(pt * D2R), Math.cos(yw * D2R) * Math.cos(pt * D2R));
    const cam = this.cam;
    cam.fov = fov; cam.aspect = this.w / this.h;
    cam.position.copy(piv).addScaledVector(dir(yaw, pitch), dist);
    cam.near = Math.max(1, dist - 70); cam.far = dist + 90;
    cam.lookAt(piv);
    // key light rides with the camera: frontal (a flat page's light) at A, raking at B
    const ly = lerp(-1.4, this.params.ly, k), lp = lerp(2.0, this.params.lp, k);
    this.sun.position.copy(piv).addScaledVector(dir(yaw + ly, pitch + lp), 46);
    this.sun.target.position.copy(piv);
    // frame composition: shift scene toward the side that leaves room for the text panel (B only)
    const sx = L.shift[0] * k, sy = L.shift[1] * k;
    cam.setViewOffset(this.w, this.h, -sx * this.w, sy * this.h, this.w, this.h);
    cam.updateProjectionMatrix();
    // the ground only arrives once the view is high enough to read it as ground (edge-on it is not part of A)
    const fo = clamp((k - 0.16) / 0.3); this.floorMat.opacity = fo * fo * (3 - 2 * fo); this.datumMat.opacity = Math.max(0, (k - 0.5) / 0.4 > 1 ? 1 : (k - 0.5) / 0.4);
    this.floor.visible = this.floorMat.opacity > 0.003;
    this.renderer.render(this.scene, cam);
    return k;
  }

  resize(w: number, h: number, dpr: number) {
    this.w = w; this.h = h;
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
  }
}
