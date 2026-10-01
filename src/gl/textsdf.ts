import * as THREE from 'three';

/**
 * The finale word, rasterised once and turned into a signed distance field (negative inside) that the
 * shaders use for crisp extruded letters, mask morphing and liquid refraction.
 * World rect is expressed in the same height-normalised space as the scenes.
 */
export interface TextSdf {
  texture: THREE.DataTexture;
  /** x0, y0, width, height of the field in scene space */
  rect: THREE.Vector4;
}

const W = 1024;
const H = 512;
export const SDF_RECT = { x: -1.2, y: -0.6, w: 2.4, h: 1.2 };

/** 1-D squared distance transform (Felzenszwalb & Huttenlocher). */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0;
  v[0] = 0;
  z[0] = -Infinity;
  z[1] = Infinity;
  for (let q = 1; q < n; q++) {
    let s: number;
    for (;;) {
      const p = v[k];
      s = (f[q] + q * q - (f[p] + p * p)) / (2 * q - 2 * p);
      if (s <= z[k] && k > 0) k--;
      else break;
    }
    if (s > z[k]) {
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = Infinity;
    } else {
      v[k] = q;
      z[k] = s;
    }
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while (z[k + 1] < q) k++;
    const p = v[k];
    d[q] = (q - p) * (q - p) + f[p];
  }
}

function edt2d(mask: Uint8Array, inside: boolean): Float64Array {
  const INF = 1e12;
  const g = new Float64Array(W * H);
  for (let i = 0; i < W * H; i++) g[i] = (mask[i] > 127) === inside ? INF : 0;
  const n = Math.max(W, H);
  const f = new Float64Array(n), d = new Float64Array(n), z = new Float64Array(n + 1);
  const v = new Int32Array(n);
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < H; y++) f[y] = g[y * W + x];
    edt1d(f, H, d, v, z);
    for (let y = 0; y < H; y++) g[y * W + x] = d[y];
  }
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) f[x] = g[y * W + x];
    edt1d(f, W, d, v, z);
    for (let x = 0; x < W; x++) g[y * W + x] = d[x];
  }
  return g;
}

/** Two light [1 2 1] passes remove the stair-stepping an EDT of a binary mask leaves on the zero-level set. */
function smoothField(data: Uint16Array): void {
  const f = new Float32Array(W * H);
  for (let i = 0; i < W * H; i++) f[i] = THREE.DataUtils.fromHalfFloat(data[i]);
  const t = new Float32Array(W * H);
  for (let pass = 0; pass < 5; pass++) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      t[i] = (f[y * W + Math.max(0, x - 1)] + 2 * f[i] + f[y * W + Math.min(W - 1, x + 1)]) * 0.25;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      f[i] = (t[Math.max(0, y - 1) * W + x] + 2 * t[i] + t[Math.min(H - 1, y + 1) * W + x]) * 0.25;
    }
  }
  for (let i = 0; i < W * H; i++) data[i] = THREE.DataUtils.toHalfFloat(f[i]);
}

export async function buildTextSdf(word: string, capHeight: number, centerOfIndex: number): Promise<TextSdf> {
  try {
    await document.fonts.load('400 200px "Instrument Serif"');
  } catch {
    /* fall back to the serif stack */
  }
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, W, H);
  g.fillStyle = '#fff';
  g.textBaseline = 'alphabetic';
  const unit = H / SDF_RECT.h; // px per scene unit
  // size the font so the cap height equals `capHeight` scene units
  const probe = 200;
  g.font = `400 ${probe}px "Instrument Serif", Georgia, serif`;
  const cap = g.measureText('H');
  const capPx = cap.actualBoundingBoxAscent;
  const fs = (capHeight * unit * probe) / capPx;
  g.font = `400 ${fs}px "Instrument Serif", Georgia, serif`;
  // "N" + a drawn, truly circular "O" (the recurring motif) + "W".
  // The O is centred on the scene's light (sun / oculus / drop) so the circle that has travelled through
  // every chapter lands exactly inside it.
  const centreY = 0.06;
  const baselineScene = centreY - capHeight * 0.5;
  const baselinePx = H * (1 - (baselineScene - SDF_RECT.y) / SDF_RECT.h);
  const cx = W / 2;
  const cy = H * (1 - (centreY - SDF_RECT.y) / SDF_RECT.h);
  const Ro = capHeight * unit * 0.52;
  const gap = capHeight * unit * 0.09;
  g.beginPath();
  g.ellipse(cx, cy, Ro, Ro, 0, 0, Math.PI * 2);
  g.ellipse(cx, cy, Ro * 0.60, Ro * 0.80, 0, 0, Math.PI * 2, true);
  g.fill('evenodd');
  const stroke = fs * 0.014;
  g.lineJoin = 'round';
  g.strokeStyle = '#fff';
  g.lineWidth = stroke;
  g.textAlign = 'right';
  g.fillText(word[0], cx - Ro - gap, baselinePx);
  g.strokeText(word[0], cx - Ro - gap, baselinePx);
  g.textAlign = 'left';
  g.fillText(word[2], cx + Ro + gap, baselinePx);
  g.strokeText(word[2], cx + Ro + gap, baselinePx);
  void centerOfIndex;
  const img = g.getImageData(0, 0, W, H).data;
  const mask = new Uint8Array(W * H);
  // flip vertically so row 0 is the bottom (matches texture v)
  for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) mask[(H - 1 - y) * W + xx] = img[(y * W + xx) * 4];
  const dOut = edt2d(mask, false); // distance of outside pixels to the shape
  const dIn = edt2d(mask, true); // distance of inside pixels to the outside
  const data = new Uint16Array(W * H);
  const pxScene = SDF_RECT.w / W;
  for (let i = 0; i < W * H; i++) {
    const inside = mask[i] > 127;
    const dist = inside ? -(Math.sqrt(dIn[i]) - 0.5) : Math.sqrt(dOut[i]) - 0.5;
    data[i] = THREE.DataUtils.toHalfFloat(dist * pxScene);
  }
  smoothField(data);
  const tex = new THREE.DataTexture(data, W, H, THREE.RedFormat, THREE.HalfFloatType);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return { texture: tex, rect: new THREE.Vector4(SDF_RECT.x, SDF_RECT.y, SDF_RECT.w, SDF_RECT.h) };
}
