import * as THREE from 'three';
import type { Layout } from './layout';
import { WALL_Z } from './layout';

export const COL = { chalk: '#e4e7e5', card: '#f7f8f6', ink: '#14161a', vermilion: '#ff4a1c', mute: '#5d6368', dot: '#c9cecb' };
const SERIF = '"Instrument Serif", "Times New Roman", serif';
const SANS = '"Inter Variable", Inter, system-ui, sans-serif';
export const PPU = 150; // texture pixels per world unit (front faces are seen ~1:1..2:1 at the start)

export function canvasTex(wU: number, hU: number, draw: (c: CanvasRenderingContext2D, ppu: number, w: number, h: number) => void, ppu = PPU, aniso = 8): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = Math.ceil(wU * ppu); cv.height = Math.ceil(hU * ppu);
  const c = cv.getContext('2d')!;
  draw(c, ppu, cv.width, cv.height);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
  return t;
}

/** Printed on the rear wall: the only truly flat content. The faint dot raster is the page's literal pixel grid. */
export function wallPrint(L: Layout, aniso: number): THREE.CanvasTexture {
  return canvasTex(L.W, L.H, (c, ppu, w, h) => {
    c.clearRect(0, 0, w, h);
    const step = 0.2 * ppu;
    c.fillStyle = 'rgba(20,22,26,0.11)';
    for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) { c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); }
    const X = (x: number) => (x + L.W / 2) * ppu, Y = (y: number) => (L.H / 2 - y) * ppu;
    // subcopy
    c.fillStyle = COL.ink; c.font = `400 ${L.sub.size * ppu}px ${SANS}`; c.textBaseline = 'middle';
    const n = L.sub.lines.length, lh = L.sub.size * 1.42;
    L.sub.lines.forEach((t, i) => c.fillText(t, X(L.sub.x), Y(L.sub.y + ((n - 1) / 2 - i) * lh)));
    // nav links
    if (L.navLinks) {
      c.font = `500 ${0.2 * ppu}px ${SANS}`; c.fillStyle = COL.ink;
      let nx = X(L.navLinks.x); ['Work', 'Systems', 'Process', 'Contact'].forEach((t) => { c.fillText(t, nx, Y(L.navLinks!.y)); nx += c.measureText(t).width + 0.55 * ppu; });
    }
  }, 128, aniso);
}

export function cardFront(w: number, h: number, d: { n: string; title: string; body: string }, tall: boolean, aniso: number) {
  return canvasTex(w, h, (c, ppu, cw, ch) => {
    c.fillStyle = COL.card; c.fillRect(0, 0, cw, ch);
    const p = 0.2 * ppu;
    c.fillStyle = COL.mute; c.font = `500 ${0.15 * ppu}px ${SANS}`; c.textBaseline = 'top'; c.fillText(d.n, p, p * 0.9);
    c.fillStyle = COL.ink; c.font = `400 ${(tall ? 0.3 : 0.42) * ppu}px ${SERIF}`; c.textBaseline = 'alphabetic';
    const fit = (t: string, max: number, px: number, fam: string, wt: number) => { c.font = `${wt} ${px}px ${fam}`; const m = c.measureText(t).width; return m > max ? px * max / m : px; };
    const maxW = cw - 2 * p;
    const tpx = fit(d.title, maxW, (tall ? 0.3 : 0.4) * ppu, SERIF, 400);
    c.font = `400 ${tpx}px ${SERIF}`; c.fillText(d.title, p, ch - (tall ? p * 0.85 : p * 2.9));
    if (!tall) { c.fillStyle = COL.mute; const bpx = fit(d.body, maxW, 0.15 * ppu, SANS, 400); c.font = `400 ${bpx}px ${SANS}`; c.fillText(d.body, p, ch - p * 1.15); }
    // a tiny pixel-matrix mark, top right: the same raster as the wall
    c.fillStyle = COL.ink; const s = 0.055 * ppu, g = 0.1 * ppu;
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { if ((i + j) % 2 === 0 || (i === 1 && j === 1)) c.fillRect(cw - p - 2 * g - s + i * g, p + j * g, s, s); }
  }, PPU, aniso);
}

export function pillFront(w: number, h: number, label: string, mode: 'ink' | 'line', size: number, aniso: number) {
  return canvasTex(w, h, (c, ppu, cw, ch) => {
    if (mode === 'ink') { c.fillStyle = COL.ink; c.fillRect(0, 0, cw, ch); } else { c.fillStyle = COL.card; c.fillRect(0, 0, cw, ch); }
    c.fillStyle = mode === 'ink' ? '#f4f5f2' : COL.ink; c.font = `500 ${size * ppu}px ${SANS}`; c.textBaseline = 'middle'; c.textAlign = 'center';
    c.fillText(label, cw / 2, ch / 2 + 0.01 * ppu);
  }, PPU, aniso);
}

/** The disc's end face: a pixel matrix whose dots grow from nothing to full — the screen is where the shaft ends. */
export function discFace(aniso: number) {
  return canvasTex(1, 1, (c, _p, w, h) => {
    c.fillStyle = COL.vermilion; c.fillRect(0, 0, w, h);
    const n = 30, s = w / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, v = (j + 0.5) / n;
      const t = Math.min(1, Math.max(0, (u * 0.55 + (1 - v) * 0.45 - 0.12) / 0.8));
      const r = s * 0.5 * (0.08 + 0.92 * t) ;
      c.fillStyle = 'rgba(255,214,196,0.9)'; c.beginPath(); c.arc((i + 0.5) * s, (j + 0.5) * s, r * 0.78, 0, Math.PI * 2); c.fill();
    }
  }, 1024, aniso);
}

/** Floor datum: five strata drawn the way an architect dimensions a section. Canvas x = world x, canvas up = away from the page. */
export function floorDatum(L: Layout, zs: number[], names: string[], aniso: number) {
  const x0 = -L.W / 2 - 4.2, x1 = L.W / 2 + 1.2, zFront = 3.2, zBack = WALL_Z - 0.4;
  const wU = x1 - x0, hU = zFront - zBack;
  const tex = canvasTex(wU, hU, (c, ppu, w, h) => {
    c.clearRect(0, 0, w, h);
    const X = (x: number) => (x - x0) * ppu, Z = (z: number) => (z - zBack) * ppu;
    zs.forEach((z, i) => {
      c.strokeStyle = 'rgba(20,22,26,0.5)'; c.lineWidth = 0.012 * ppu;
      c.beginPath(); c.moveTo(X(-L.W / 2 - 0.3), Z(z)); c.lineTo(X(L.W / 2 + 0.2), Z(z)); c.stroke();
      c.save(); c.translate(X(-L.W / 2 - 0.55), Z(z) + 0.2 * ppu); c.rotate(Math.PI / 2);
      c.textAlign = 'left'; c.textBaseline = 'alphabetic';
      c.font = `500 ${0.17 * ppu}px ${SANS}`; c.fillStyle = COL.vermilion; c.fillText(`0${i + 1}`, 0, 0);
      c.fillStyle = COL.ink; c.font = `500 ${0.25 * ppu}px ${SANS}`; c.fillText(names[i].toUpperCase(), 0.45 * ppu, 0);
      c.restore();
    });
  }, 70, aniso);
  return { tex, x0, x1, zFront, zBack, wU, hU };
}
