import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { RECT, SHEET, N, WATER, level, signedArea, pointIn, type Field, type Level } from './terrain';
import { tint, SUN_AZ, type Print } from './print';

export const D = 0.05; // thickness of one leaf (world units); 16 leaves = the relief
const EPS = 0.00035;

/** One paper leaf: top cap (uv = world xy, so the print lands exactly where it was), bottom cap, and cut walls. */
function leafGeometry(L: Level, d: number): THREE.BufferGeometry {
  const pos: number[] = [], nor: number[] = [], uv: number[] = [];
  const idx: number[] = [];
  // orient: region on the left (outer CCW, holes CW)
  const loops = L.loops.map((l, i) => {
    const ccw = signedArea(l) > 0;
    if (ccw === !L.holes[i]) return l;
    const r = new Float32Array(l.length);
    for (let q = 0; q < l.length; q += 2) { r[q] = l[l.length - 2 - q]; r[q + 1] = l[l.length - 1 - q]; }
    return r;
  });
  // caps: each outer with the holes directly inside it
  const v2 = (l: Float32Array) => { const a: THREE.Vector2[] = []; for (let q = 0; q < l.length; q += 2) a.push(new THREE.Vector2(l[q], l[q + 1])); return a; };
  loops.forEach((outer, i) => {
    if (L.holes[i]) return;
    const holes = loops.filter((h, j) => L.holes[j] && pointIn(outer, h[0], h[1]) &&
      !loops.some((o2, m) => m !== i && !L.holes[m] && Math.abs(signedArea(o2)) < Math.abs(signedArea(outer)) && pointIn(o2, h[0], h[1]) && pointIn(outer, o2[0], o2[1])));
    const c = v2(outer), hs = holes.map(v2);
    const tris = THREE.ShapeUtils.triangulateShape(c, hs);
    const all = c.concat(...hs);
    for (const z of [0, -d]) {
      const base = pos.length / 3;
      for (const p of all) { pos.push(p.x, p.y, z); nor.push(0, 0, z === 0 ? 1 : -1); uv.push(p.x, p.y); }
      for (const t of tris) {
        const [a, b, cc] = t;
        const cross = (all[b].x - all[a].x) * (all[cc].y - all[a].y) - (all[b].y - all[a].y) * (all[cc].x - all[a].x);
        const up = (cross > 0) === (z === 0);
        if (up) idx.push(base + a, base + b, base + cc); else idx.push(base + a, base + cc, base + b);
      }
    }
  });
  const capCount = idx.length;
  // walls with smoothed normals (sharp only at real corners, e.g. the neatline)
  for (const l of loops) {
    const n = l.length / 2;
    const sn: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const dx = l[j * 2] - l[i * 2], dy = l[j * 2 + 1] - l[i * 2 + 1], len = Math.hypot(dx, dy) || 1;
      sn.push([dy / len, -dx / len]);
    }
    let arc = 0;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      const a = sn[i], prev = sn[(i - 1 + n) % n], next = sn[j];
      const blend = (o: [number, number]) => {
        if (a[0] * o[0] + a[1] * o[1] < 0.75) return a;
        const x = a[0] + o[0], y = a[1] + o[1], m = Math.hypot(x, y);
        return [x / m, y / m] as [number, number];
      };
      const n0 = blend(prev), n1 = blend(next);
      const x0 = l[i * 2], y0 = l[i * 2 + 1], x1 = l[j * 2], y1 = l[j * 2 + 1];
      const seg = Math.hypot(x1 - x0, y1 - y0);
      const b = pos.length / 3;
      pos.push(x0, y0, 0, x1, y1, 0, x1, y1, -d, x0, y0, -d);
      nor.push(n0[0], n0[1], 0, n1[0], n1[1], 0, n1[0], n1[1], 0, n0[0], n0[1], 0);
      uv.push(arc, 0, arc + seg, 0, arc + seg, -d, arc, -d);
      idx.push(b, b + 3, b + 1, b + 1, b + 3, b + 2);
      arc += seg;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.addGroup(0, capCount, 0);
  g.addGroup(capCount, idx.length - capCount, 1);
  return g;
}

function paperTooth(): THREE.DataTexture {
  // fine fibre relief as a normal map: tiny amplitude, only visible when the sun grazes
  const S = 256, data = new Uint8Array(S * S * 4), h = new Float32Array(S * S);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < S * S; i++) h[i] = rnd();
  for (let pass = 0; pass < 2; pass++) for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    h[i] = (h[i] * 2 + h[y * S + ((x + 1) % S)] + h[((y + 1) % S) * S + x]) / 4;
  }
  // a few long fibres
  for (let f = 0; f < 90; f++) {
    let x = rnd() * S, y = rnd() * S; const a = rnd() * Math.PI, len = 10 + rnd() * 30;
    for (let t = 0; t < len; t++) { x = (x + Math.cos(a) + S) % S; y = (y + Math.sin(a) + S) % S; h[(y | 0) * S + (x | 0)] += 0.35; }
  }
  for (let i = 0; i < S * S; i++) {
    const x = i % S, y = (i / S) | 0;
    const dx = h[y * S + ((x + 1) % S)] - h[y * S + ((x - 1 + S) % S)];
    const dy = h[((y + 1) % S) * S + x] - h[((y - 1 + S) % S) * S + x];
    const k = 0.9;
    const nx = -dx * k, ny = -dy * k, m = Math.hypot(nx, ny, 1);
    data[i * 4] = (nx / m * 0.5 + 0.5) * 255; data[i * 4 + 1] = (ny / m * 0.5 + 0.5) * 255; data[i * 4 + 2] = (1 / m * 0.5 + 0.5) * 255; data[i * 4 + 3] = 255;
  }
  const t = new THREE.DataTexture(data, S, S);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1.6, 1.6);
  t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

function skyEnv(renderer: THREE.WebGLRenderer): THREE.Texture {
  // a plain daylight sky: pale warm horizon, soft blue zenith, a darker ground. No studio softboxes.
  const scene = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: { sun: { value: new THREE.Vector3(Math.sin(SUN_AZ), Math.cos(SUN_AZ), 0.36).normalize() } },
    vertexShader: 'varying vec3 vd; void main(){ vd = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `varying vec3 vd; uniform vec3 sun;
      void main(){ vec3 d = normalize(vd); float z = d.z;
        vec3 zen = vec3(0.42,0.56,0.74), hor = vec3(1.0,0.9,0.78), gnd = vec3(0.23,0.22,0.2);
        vec3 c = z > 0. ? mix(hor, zen, pow(z, 0.55)) : mix(hor*0.6, gnd, pow(-z, 0.4));
        c += vec3(1.0,0.78,0.5) * pow(max(dot(d, sun), 0.), 24.) * 2.5;
        gl_FragColor = vec4(c, 1.); }`,
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 48, 24), mat));
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(scene, 0.02);
  pm.dispose(); mat.dispose();
  return rt.texture;
}

export interface Pose {
  lift: number[];     // per leaf, cumulative top height (world)
  hill: number;       // printed relief shading 1 → 0
  sunEl: number;      // radians
  sunWarm: number;    // 0 neutral daylight → 1 low warm sun
  water: number;      // ink → water
  cam: { el: number; dist: number; tx: number; ty: number; tz: number; az: number };
}

export class Stage {
  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(26, 1, 0.5, 80);
  sun = new THREE.DirectionalLight(0xffffff, 3);
  hemi = new THREE.HemisphereLight(0xdfe7ef, 0x6b6357, 0.6);
  leaves: THREE.Mesh[] = [];
  water: THREE.Mesh;
  waterU = { value: 0 };
  warmU = { value: 0 };
  capMat: THREE.MeshStandardMaterial;
  hillU = { value: 1 };
  linesU = { value: 1 };
  private disposables: { dispose(): void }[] = [];
  aspect = 1;

  constructor(canvas: HTMLCanvasElement, field: Field, levels: Level[], print: Print, mobile: boolean) {
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }));
    r.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 2 : 1.75));
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFShadowMap;
    r.toneMapping = THREE.NeutralToneMapping;
    r.toneMappingExposure = 0.92;
    r.outputColorSpace = THREE.SRGBColorSpace;
    this.camera.up.set(0, 0, 1);
    const env = skyEnv(r);
    this.scene.environment = env;
    this.scene.background = env;
    this.scene.backgroundIntensity = 0.9;
    this.disposables.push(env);

    const sw = SHEET.x1 - SHEET.x0, sh = SHEET.y1 - SHEET.y0;
    const tex = (c: HTMLCanvasElement, srgb: boolean) => {
      const t = new THREE.CanvasTexture(c);
      if (srgb) t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = r.capabilities.getMaxAnisotropy();
      t.repeat.set(1 / sw, 1 / sh);
      t.offset.set(-SHEET.x0 / sw, -SHEET.y0 / sh);
      this.disposables.push(t);
      return t;
    };
    const map = tex(print.color, true), hill = tex(print.hill, false), lake = tex(print.lake, false);
    const tooth = paperTooth();
    this.disposables.push(tooth);

    this.capMat = new THREE.MeshStandardMaterial({ map, roughness: 0.82, normalMap: tooth, normalScale: new THREE.Vector2(0.16, 0.16), envMapIntensity: 0.8 });
    this.capMat.onBeforeCompile = (sh) => {
      sh.uniforms.hillMap = { value: hill };
      sh.uniforms.uHill = this.hillU;
      sh.uniforms.lakeMap = { value: lake };
      sh.uniforms.uLines = this.linesU;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform sampler2D hillMap, lakeMap; uniform float uHill, uLines;')
        .replace('#include <map_fragment>', '#include <map_fragment>\n  float hs = texture2D(hillMap, vMapUv).r / 0.94;\n  diffuseColor.rgb *= mix(1.0, hs, uHill);\n  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.16, 0.19), texture2D(lakeMap, vMapUv).g * 0.42 * uLines);');
    };
    this.disposables.push(this.capMat);

    // desk: a matte grey-green drafting board
    const desk = new THREE.Mesh(new THREE.PlaneGeometry(140, 140), new THREE.MeshStandardMaterial({ color: 0x6f767b, roughness: 0.93 }));
    desk.position.z = -0.026;
    desk.receiveShadow = true;
    this.scene.add(desk);
    this.disposables.push(desk.geometry, desk.material as THREE.Material);

    // the sheet itself (carries the margin, title and key; never moves)
    const sheetL: Level = { k: 0, loops: [new Float32Array([SHEET.x0, SHEET.y0, SHEET.x1, SHEET.y0, SHEET.x1, SHEET.y1, SHEET.x0, SHEET.y1])], holes: [false] };
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xe8e0d0, roughness: 0.9 });
    const sheet = new THREE.Mesh(leafGeometry(sheetL, 0.025), [this.capMat, edgeMat]);
    sheet.receiveShadow = true; sheet.castShadow = true;
    this.scene.add(sheet);
    this.disposables.push(sheet.geometry, edgeMat);

    // the leaves
    for (const L of levels) {
      const c = new THREE.Color(L.k < WATER ? (L.k % 2 ? '#cbc2b2' : '#c4baa9') : tint(L.k)).multiplyScalar(L.k < WATER ? 1 : 0.94);
      const wall = new THREE.MeshStandardMaterial({ color: c, roughness: 0.92, envMapIntensity: 0.7 });
      const m = new THREE.Mesh(leafGeometry(L, D), [this.capMat, wall]);
      m.castShadow = m.receiveShadow = true;
      this.scene.add(m);
      this.leaves.push(m);
      this.disposables.push(m.geometry, wall);
    }

    // water: a mirror at the shore level, clipped to the printed lake. Its ripples are the engraver's
    // water lining (shore-parallel), so the printed lines become the surface's own disturbance.
    const wg = new THREE.PlaneGeometry(RECT.x1 - RECT.x0, RECT.y1 - RECT.y0);
    const DW = 512, DH = Math.round((DW * (RECT.y1 - RECT.y0)) / (RECT.x1 - RECT.x0));
    const wl = level(WATER);
    let df = new Float32Array(DW * DH);
    for (let j = 0; j < DH; j++) for (let i = 0; i < DW; i++) {
      const x = RECT.x0 + ((i + 0.5) / DW) * (RECT.x1 - RECT.x0), y = RECT.y0 + ((j + 0.5) / DH) * (RECT.y1 - RECT.y0);
      df[j * DW + i] = Math.max(0, Math.min(1, (wl - field.at(x, y)) / 0.12));
    }
    for (let pass = 0; pass < 3; pass++) { // soften so the swell has no stair-steps
      const o = new Float32Array(df.length);
      for (let j = 0; j < DH; j++) for (let i = 0; i < DW; i++) {
        let a = 0, n = 0;
        for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) {
          const ii = i + di, jj = j + dj;
          if (ii >= 0 && jj >= 0 && ii < DW && jj < DH) { a += df[jj * DW + ii]; n++; }
        }
        o[j * DW + i] = a / n;
      }
      df = o;
    }
    const dd = new Uint16Array(DW * DH * 4);
    for (let i = 0; i < DW * DH; i++) { dd[i * 4] = THREE.DataUtils.toHalfFloat(df[i]); dd[i * 4 + 3] = THREE.DataUtils.toHalfFloat(1); }
    const depth = new THREE.DataTexture(dd, DW, DH, THREE.RGBAFormat, THREE.HalfFloatType);
    depth.magFilter = depth.minFilter = THREE.LinearFilter; depth.needsUpdate = true;
    const sc0 = Math.min(window.devicePixelRatio, 1.5) * 0.7;
    const refl = new Reflector(wg, {
      textureWidth: Math.round(window.innerWidth * sc0), textureHeight: Math.round(window.innerHeight * sc0), clipBias: 0.002,
      shader: {
        name: 'LakeShader',
        uniforms: {
          color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
          lake: { value: lake }, depth: { value: depth }, uWater: this.waterU, uWarm: this.warmU,
          sheetRepeat: { value: new THREE.Vector4(1 / sw, 1 / sh, -SHEET.x0 / sw, -SHEET.y0 / sh) },
          rect: { value: new THREE.Vector4(RECT.x0, RECT.y0, RECT.x1 - RECT.x0, RECT.y1 - RECT.y0) },
        },
        vertexShader: `uniform mat4 textureMatrix; varying vec4 vRefl; varying vec3 vW; varying vec3 vV;
          void main(){ vRefl = textureMatrix * vec4(position,1.); vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vV = cameraPosition - w.xyz;
            gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: `uniform sampler2D tDiffuse, lake, depth; uniform float uWater, uWarm; uniform vec4 sheetRepeat, rect;
          varying vec4 vRefl; varying vec3 vW; varying vec3 vV;
          void main(){
            vec2 su = vW.xy * sheetRepeat.xy + sheetRepeat.zw;
            float m = texture2D(lake, su).r;
            vec2 ru = (vW.xy - rect.xy) / rect.zw;
            float d = texture2D(depth, ru).r;
            // shore-parallel swell at the phase of the printed water lines, as a faint brightness only
            float ph = d * 6.2832 / 0.1584;
            float aa = 1. - smoothstep(0.25, 0.7, fwidth(ph) / 6.2832); // never finer than the screen can hold
            float swell = sin(ph) * (1. - smoothstep(0.2, 0.75, d)) * aa;
            vec3 r = texture2DProj(tDiffuse, vRefl).rgb;
            vec3 V = normalize(vV);
            float cosv = clamp(V.z, 0., 1.);
            float F = 0.05 + 0.95 * pow(1. - cosv, 5.);
            vec3 deep = mix(vec3(0.07, 0.16, 0.18), vec3(0.1, 0.15, 0.15), uWarm);
            vec3 col = (deep + r * (0.22 + 0.9 * F)) * (1. + 0.07 * swell);
            float a = m * uWater * mix(0.62, 0.92, smoothstep(0.0, 0.5, d) * 0.6 + F);
            gl_FragColor = vec4(col, a);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`,
      },
    });
    const wmat = refl.material as THREE.ShaderMaterial;
    wmat.transparent = true; wmat.depthWrite = false;
    wmat.uniforms.uWater = this.waterU; wmat.uniforms.uWarm = this.warmU; wmat.uniforms.lake.value = lake; wmat.uniforms.depth.value = depth;
    this.water = refl;
    this.water.renderOrder = 2;
    this.scene.add(this.water);
    this.disposables.push(wg, depth, refl.getRenderTarget(), wmat);

    const s = this.sun;
    s.castShadow = true;
    s.shadow.mapSize.set(mobile ? 2048 : 4096, mobile ? 2048 : 4096);
    const sc = s.shadow.camera;
    sc.left = -6.2; sc.right = 6.2; sc.top = 6.2; sc.bottom = -6.2; sc.near = 1; sc.far = 40;
    s.shadow.bias = -0.0004;
    s.shadow.normalBias = 0.012;
    s.shadow.radius = 3;
    this.scene.add(s, s.target, this.hemi);
  }

  resize(w: number, h: number): void {
    this.renderer.setSize(w, h, false);
    this.aspect = w / h;
    this.camera.aspect = this.aspect;
    this.camera.updateProjectionMatrix();
  }

  render(p: Pose): void {
    for (let i = 0; i < this.leaves.length; i++) this.leaves[i].position.z = p.lift[i] + (i + 1) * EPS;
    this.hillU.value = p.hill;
    // sun from the same azimuth the engraver assumed
    const ce = Math.cos(p.sunEl);
    this.sun.position.set(Math.sin(SUN_AZ) * ce * 20, Math.cos(SUN_AZ) * ce * 20, Math.sin(p.sunEl) * 20);
    const warm = new THREE.Color(1, 0.985, 0.96).lerp(new THREE.Color(1, 0.83, 0.64), p.sunWarm);
    this.sun.color.copy(warm);
    this.sun.intensity = 2.0 + 3.1 * p.sunWarm;
    this.hemi.intensity = 0.95 - 0.55 * p.sunWarm;
    this.hemi.color.set(0xe7ecef).lerp(new THREE.Color(0xb7c9e6), p.sunWarm);
    this.scene.environmentIntensity = 0.75 - 0.33 * p.sunWarm;
    this.waterU.value = p.water;
    this.linesU.value = 1 - p.water;
    this.warmU.value = p.sunWarm;
    this.water.visible = p.water > 0.002;
    this.water.position.z = p.lift[WATER - 2] + D * 0.62;
    // camera: a slow settle from reading the sheet to regarding the land
    const c = p.cam;
    const portrait = this.aspect < 1;
    const dist = c.dist * (portrait ? 1.55 / Math.max(0.45, this.aspect) * 0.62 : 1);
    this.camera.position.set(c.tx + Math.sin(c.az) * Math.cos(c.el) * dist, c.ty - Math.cos(c.az) * Math.cos(c.el) * dist, c.tz + Math.sin(c.el) * dist);
    this.camera.lookAt(c.tx, c.ty, c.tz);
    this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
  }
}

export { N };
