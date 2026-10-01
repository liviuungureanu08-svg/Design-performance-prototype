import { clamp01, easeOutCubic } from './scroll';

/** Splits copy into masked word spans and drives them from 0..1 in/out values. */
export class Copy {
  private blocks: { words: HTMLElement[] }[] = [];

  constructor(readonly root: HTMLElement) {
    root.querySelectorAll<HTMLElement>('[data-split]').forEach((el) => {
      const words: HTMLElement[] = [];
      this.wrap(el, words);
      this.blocks.push({ words });
    });
  }

  private wrap(node: Node, out: HTMLElement[]): void {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        (child.textContent ?? '').split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) {
            frag.append(' ');
            return;
          }
          const w = document.createElement('span');
          w.className = 'w';
          const wi = document.createElement('span');
          wi.className = 'wi';
          wi.textContent = tok;
          w.append(wi);
          frag.append(w);
          out.push(wi);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE && (child as HTMLElement).tagName !== 'BR') {
        this.wrap(child, out);
      }
    });
  }

  /** inP / outP in 0..1. Each sub-block starts a little after the previous one. */
  update(inP: number, outP: number): void {
    const visible = inP > 0 && outP < 1;
    this.root.style.visibility = visible ? 'visible' : 'hidden';
    if (!visible) return;
    const n = this.blocks.length;
    this.blocks.forEach((blk, bi) => {
      const bIn = clamp01(inP * (1 + 0.35 * (n - 1)) - bi * 0.35);
      const bOut = clamp01(outP * (1 + 0.25 * (n - 1)) - (n - 1 - bi) * 0.25);
      const count = blk.words.length;
      const st = 0.07;
      blk.words.forEach((w, i) => {
        const li = easeOutCubic(clamp01(bIn * (1 + count * st) - i * st));
        const lo = clamp01(bOut * (1 + count * st) - i * st);
        const y = (1 - li) * 108 - lo * 70;
        w.style.transform = `translate3d(0,${y.toFixed(2)}%,0)`;
        w.style.opacity = String(li * (1 - lo));
      });
    });
  }
}
