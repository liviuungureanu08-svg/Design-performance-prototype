import { ART_H, ART_W, EMBER_FOCUS, TIDE_FOCUS } from '../art/scenes';

/**
 * Pairs every fragment of Scene A with a destination cell in Scene B.
 *
 * The pairing is a 1-D optimal-transport by tonal rank: the brightest cells of
 * A travel to the brightest cells of B, the darkest to the darkest. Inside a
 * tonal band cells keep their angular order around the focal point so the
 * flow stays laminar rather than turning into noise. The result is that colour/energy is
 * conserved across the transformation — the viewer reads one image
 * re-forming into another instead of two images being swapped.
 */

function lumaGrid(source: HTMLCanvasElement, cols: number, rows: number): Float32Array {
  const c = document.createElement('canvas');
  c.width = cols;
  c.height = rows;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, cols, rows);
  const px = ctx.getImageData(0, 0, cols, rows).data;
  const out = new Float32Array(cols * rows);
  for (let i = 0; i < out.length; i++) {
    const r = px[i * 4] / 255;
    const g = px[i * 4 + 1] / 255;
    const b = px[i * 4 + 2] / 255;
    out[i] = Math.pow(0.2126 * r + 0.7152 * g + 0.0722 * b, 0.6);
  }
  return out;
}

/**
 * Orders cells into equal-count tonal bands, and inside each band by polar angle
 * around the scene's focal point. Equal-count bands guarantee A-band k and
 * B-band k hold the same number of cells, so angular position survives the
 * pairing: fragments swirl around the centre instead of crossing it.
 */
function order(luma: Float32Array, cols: number, rows: number, focus: [number, number], bands: number): Uint32Array {
  const n = luma.length;
  const aspect = ART_W / ART_H;
  const angle = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = ((i % cols) + 0.5) / cols;
    const y = (Math.floor(i / cols) + 0.5) / rows;
    angle[i] = Math.atan2(y - focus[1], (x - focus[0]) * aspect);
  }
  const byLuma = Array.from({ length: n }, (_, i) => i).sort((a, b) => luma[a] - luma[b] || a - b);
  const out = new Uint32Array(n);
  const per = n / bands;
  for (let b = 0; b < bands; b++) {
    const lo = Math.round(b * per);
    const hi = Math.round((b + 1) * per);
    const slice = byLuma.slice(lo, hi).sort((p, q) => angle[p] - angle[q] || p - q);
    for (let k = 0; k < slice.length; k++) out[lo + k] = slice[k];
  }
  return out;
}

/** Returns, for each A cell index, the B cell index it is destined for. */
export function pairCells(a: HTMLCanvasElement, b: HTMLCanvasElement, cols: number, rows: number): Uint32Array {
  const oa = order(lumaGrid(a, cols, rows), cols, rows, EMBER_FOCUS, 40);
  const ob = order(lumaGrid(b, cols, rows), cols, rows, TIDE_FOCUS, 40);
  const dest = new Uint32Array(cols * rows);
  for (let k = 0; k < oa.length; k++) dest[oa[k]] = ob[k];
  return dest;
}
