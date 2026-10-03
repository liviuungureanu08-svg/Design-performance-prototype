import * as THREE from 'three';

// Draws greyscale "images" for the wall at one texel per plate.
// R channel holds the previous image, G the next — the shader cross-fades
// between them with a per-plate delay so the wall re-writes itself.
export class WallImage {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    this.scratch = document.createElement('canvas');
    this.sctx = this.scratch.getContext('2d', { willReadFrequently: true });
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;
    this.current = null;
    this.prevData = null;
    this.setGrid(96, 48);
  }

  setGrid(cols, rows) {
    this.cols = cols; this.rows = rows;
    for (const c of [this.canvas, this.scratch]) { c.width = cols; c.height = rows; }
    this.prevData = new Uint8ClampedArray(cols * rows);
    const name = this.current;
    this.current = null;
    this._write(this.prevData, this.prevData);
    if (name) this.show(name);
  }

  _draw(name) {
    const { sctx: c, cols: w, rows: h } = this;
    c.save();
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, h);
    // CanvasTexture.flipY maps canvas row 0 to the top of the wall
    c.fillStyle = '#fff';
    if (name === 'hello') {
      const word = w > h ? 'HELLO' : 'HI';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      let size = h * (w > h ? 0.62 : 0.38);
      c.font = `700 ${size}px "Inter Tight Variable", "Inter Tight", Arial, sans-serif`;
      const m = c.measureText(word).width;
      if (m > w * 0.86) { size *= (w * 0.86) / m; c.font = `700 ${size}px "Inter Tight Variable", Arial, sans-serif`; }
      c.fillText(word, w / 2, h * (w > h ? 0.53 : 0.36));
    } else if (name === 'sun') {
      const cx = w * 0.5, cy = h * (w > h ? 0.52 : 0.66);
      const R = Math.min(w * 0.42, h * 0.44);
      const img = c.getImageData(0, 0, w, h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const dx = (x + 0.5 - cx) * (0.30 / 0.45), dy = (y + 0.5 - (h - cy));
        const d = Math.hypot(dx, dy) / R;
        let v = Math.max(0, 1 - d) ** 0.9;
        v *= 0.72 + 0.28 * Math.cos(d * 22);
        if (d > 1.0 && d < 1.07) v = 0.85;
        const k = (y * w + x) * 4;
        img.data[k] = img.data[k + 1] = img.data[k + 2] = Math.round(Math.min(v, 1) * 255);
        img.data[k + 3] = 255;
      }
      c.restore();
      c.putImageData(img, 0, 0);
      return;
    }
    c.restore();
  }

  show(name) {
    if (this.current === name) return;
    this._draw(name);
    const src = this.sctx.getImageData(0, 0, this.cols, this.rows).data;
    const next = new Uint8ClampedArray(this.cols * this.rows);
    for (let i = 0; i < next.length; i++) next[i] = src[i * 4];
    this._write(this.lastShown || this.prevData, next);
    this.lastShown = next;
    this.current = name;
  }

  _write(prev, next) {
    const img = this.ctx.createImageData(this.cols, this.rows);
    for (let i = 0; i < next.length; i++) {
      img.data[i * 4] = prev[i];
      img.data[i * 4 + 1] = next[i];
      img.data[i * 4 + 2] = 0;
      img.data[i * 4 + 3] = 255;
    }
    this.ctx.putImageData(img, 0, 0);
    this.texture.needsUpdate = true;
  }
}
