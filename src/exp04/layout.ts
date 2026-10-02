// Two compositions of the SAME page (landscape / portrait). Units: 1 unit ≈ 1/16 of the landscape page width. y up, origin = page centre.
// frontZ = where the element's front face sits; every body runs back from there to the rear wall (WALL_Z).
export const WALL_Z = -10;
export type LayoutKey = 'wide' | 'tall';

export interface Layout {
  key: LayoutKey;
  W: number; H: number;               // design box (the "page")
  headline: { lines: { text: string; x: number; y: number }[]; size: number; };
  logo: { x: number; y: number; size: number };
  navLinks: { x: number; y: number; w: number; h: number } | null;
  navCta: { x: number; y: number; w: number; h: number };
  sub: { x: number; y: number; w: number; h: number; lines: string[]; size: number };
  cta: { x: number; y: number; w: number; h: number };
  disc: { x: number; y: number; r: number };
  cards: { x: number; y: number; w: number; h: number; n: string; title: string; body: string }[];
  zoomOut: number; yawEnd: number; pitchEnd: number; fovEnd: number;
  pivot: [number, number, number]; shift: [number, number];
}

const CARDS = [
  { n: '01', title: 'Websites', body: 'Considered, fast, and unmistakably yours.' },
  { n: '02', title: 'Apps & platforms', body: 'Products people come back to.' },
  { n: '03', title: 'AI & automation', body: 'Work that runs without you.' },
];

export const SUB = ['Websites and apps for businesses', 'that expect more from a screen.'];

export function layoutFor(aspect: number): Layout {
  if (aspect >= 0.95) {
    const cw = 2.62, ch = 1.78, gap = 0.22, x0 = -0.5, cy = -3.35;
    return {
      key: 'wide', W: 16, H: 9,
      headline: { size: 2.55, lines: [{ text: 'More than', x: -7.3, y: 0.95 }, { text: 'pixels.', x: -7.3, y: -1.45 }] },
      logo: { x: -7.3, y: 3.62, size: 0.5 },
      navLinks: { x: -1.0, y: 3.74, w: 5.2, h: 0.5 },
      navCta: { x: 5.4, y: 3.74, w: 2.3, h: 0.6 },
      sub: { x: -7.3, y: -2.55, w: 6.2, h: 1.0, lines: SUB, size: 0.27 },
      cta: { x: -7.3, y: -3.75, w: 4.15, h: 0.86 },
      disc: { x: 4.95, y: 0.35, r: 2.9 },
      cards: CARDS.map((c, i) => ({ ...c, x: x0 + i * (cw + gap), y: cy, w: cw, h: ch })),
      zoomOut: 2.0, yawEnd: 34, pitchEnd: 33, fovEnd: 24, pivot: [0.4, -0.5, -4.8], shift: [0.2, 0.08],
    };
  }
  const cw = 2.0, gap = 0.2, x0 = -3.1 + 0;
  return {
    key: 'tall', W: 7, H: 15,
    headline: { size: 2.3, lines: [{ text: 'More', x: -3.05, y: 4.7 }, { text: 'than', x: -3.05, y: 2.55 }, { text: 'pixels.', x: -3.05, y: 0.4 }] },
    logo: { x: -3.05, y: 6.55, size: 0.42 },
    navLinks: null,
    navCta: { x: 1.3, y: 6.62, w: 2.15, h: 0.6 },
    sub: { x: -3.05, y: -3.9, w: 6.1, h: 1.1, lines: ['Websites and apps for', 'businesses that expect', 'more from a screen.'], size: 0.3 },
    cta: { x: -3.05, y: -5.15, w: 6.1, h: 0.95 },
    disc: { x: 1.5, y: -1.6, r: 2.05 },
    cards: CARDS.map((c, i) => ({ ...c, x: x0 + i * (cw + gap), y: -6.55, w: cw, h: 1.15 })),
    zoomOut: 2.0, yawEnd: 34, pitchEnd: 28, fovEnd: 22, pivot: [0, -0.4, -4.8], shift: [0.02, 0.2],
  };
}
