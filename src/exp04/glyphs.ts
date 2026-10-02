import * as THREE from 'three';
import opentype from 'opentype.js';
import serifUrl from '@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff?url';

// Real letterforms (Instrument Serif outlines via opentype.js) -> THREE shapes, one entry per glyph, so each letter can be its own body.
let font: opentype.Font | null = null;
export async function loadSerif(): Promise<void> {
  if (font) return;
  const buf = await (await fetch(serifUrl)).arrayBuffer();
  font = opentype.parse(buf);
}

export interface GlyphShape { ch: string; shapes: THREE.Shape[]; x0: number; x1: number }

/** Lays out `text` at baseline y=0, starting x=0, em size = `size` world units. Returns shapes in y-up world units. */
export function glyphShapes(text: string, size: number): { glyphs: GlyphShape[]; width: number } {
  if (!font) throw new Error('font not loaded');
  const glyphs: GlyphShape[] = [];
  let width = 0;
  const f = font; const sc = size / f.unitsPerEm;
  let gx = 0, prev: opentype.Glyph | null = null;
  for (const ch of text) {
    const glyph = f.charToGlyph(ch);
    if (prev) gx += f.getKerningValue(prev, glyph) * sc;
    const adv = (glyph.advanceWidth ?? 0) * sc;
    width = Math.max(width, gx + adv);
    prev = glyph;
    const path = glyph.getPath(gx, 0, size);
    gx += adv;
    if (!path.commands.length) continue;
    const sp = new THREE.ShapePath();
    for (const c of path.commands as any[]) {
      if (c.type === 'M') sp.moveTo(c.x, -c.y);
      else if (c.type === 'L') sp.lineTo(c.x, -c.y);
      else if (c.type === 'Q') sp.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
      else if (c.type === 'C') sp.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
    }
    const bb = path.getBoundingBox();
    glyphs.push({ ch, shapes: sp.toShapes(), x0: bb.x1, x1: bb.x2 });
  }
  return { glyphs, width };
}
