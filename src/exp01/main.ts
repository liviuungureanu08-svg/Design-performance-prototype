import './style.css';
import { BRIEFS, CAPTIONS, SURFACE_LABEL, parseNote, type Brief, type SurfaceKey, type Tok } from './data';
import { surfaceHTML } from './surfaces';
import { buildSections } from './sections';

// THE READING — state = f(progress). Desktop: a pinned 1440x900 design canvas scaled to fit; progress comes from scroll.
// Mobile: the same note collapses into a sticky source strip; each problem's consequence scrolls in beneath it.
const qs = new URLSearchParams(location.search);
const FORCE_P = qs.has('p') ? Number(qs.get('p')) : null;
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches || qs.get('motion') === 'reduced';
const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

// ----- timeline (desktop p, 0..1) -----
const T = { read0: 0.03, read1: 0.34, move0: 0.34, move1: 0.5, thread0: 0.5, grow0: 0.53, pb0: 0.72, pb1: 0.86, pa0: 0.86, pa1: 0.95, reread0: 0.95 };

interface W { la: number; el: HTMLElement; tok: Tok; i: number; w: number; ax: number; ay: number; nx: number; ny: number; svgW: number }
interface S { key: SurfaceKey; g: number; o: number; el: HTMLElement; tag: HTMLElement; thread: SVGPathElement | null; mb: HTMLElement | null }

let brief: Brief = BRIEFS[0];
let mobile = false;
let words: W[] = [];
let surfaces: S[] = [];
let cScale = 1;
let fsA = 70, fsN = 20, sN = 0.28;
let kickA = { x: 80, y: 118 }, kickN = { x: 56, y: 100 };
let vw = innerWidth, vh = innerHeight;
let P = 0, target = 0, introStart = 0, userScrolled = false;
let seqTop = 0, seqH = 0;

const stage = $('.stage'), seq = $('#seq'), mflow = $('.mflow');
const canvas = document.createElement('div'); canvas.className = 'canvas'; stage.append(canvas);
const noteEl = document.createElement('div'); noteEl.className = 'note'; canvas.append(noteEl);
const stripBg = document.createElement('div'); stripBg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:0;background:var(--paper);box-shadow:0 1px 0 var(--rule);opacity:0;z-index:-1;display:none';
const kick = document.createElement('div'); kick.className = 'kick';
const pen = document.createElement('div'); pen.className = 'pen';
const threadsSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); threadsSvg.setAttribute('class', 'threads'); threadsSvg.setAttribute('aria-hidden', 'true');
const layer = document.createElement('div'); layer.className = 'layer';
const cap = document.createElement('div'); cap.className = 'cap'; cap.setAttribute('aria-hidden', 'true');
const said = document.createElement('div'); said.className = 'said';
const rail = document.createElement('div'); rail.className = 'rail'; rail.setAttribute('aria-hidden', 'true');
const foot = document.createElement('div'); foot.className = 'hero-foot'; foot.setAttribute('aria-hidden', 'true');
canvas.prepend(stripBg);
canvas.append(kick, layer, threadsSvg, pen, cap, said, rail, foot);
const srList = document.createElement('ul'); srList.className = 'sr'; seq.append(srList);

// ----- measurement -----
const mctx = document.createElement('canvas').getContext('2d')!;
function measure(texts: string[]) {
  mctx.font = '400 100px "Instrument Serif"';
  return { w100: texts.map((t) => mctx.measureText(t).width), sp100: mctx.measureText(' ').width };
}
function flow(wd: number[], sp: number, maxW: number, breakAfter?: boolean[]) {
  const pos: { x: number; line: number }[] = [];
  let x = 0, line = 0;
  wd.forEach((w, i) => {
    if (x > 0 && x + w > maxW) { line++; x = 0; }
    pos.push({ x, line });
    x += w + sp;
    if (breakAfter?.[i]) { line++; x = 0; }
  });
  return { pos, lines: pos.length ? pos[pos.length - 1].line + 1 : 0 };
}

function hand(seed: number, y: number, amp: number, slope = 0) {
  const r = (k: number) => { const s = Math.sin(seed * 12.9898 + k * 78.233) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };
  const y0 = y + r(1) * amp - slope / 2, y1 = y + r(2) * amp, y2 = y + r(3) * amp, y3 = y + r(4) * amp + slope / 2;
  return `M0 ${y0.toFixed(1)}C28 ${y1.toFixed(1)},64 ${y2.toFixed(1)},100 ${y3.toFixed(1)}`;
}

// ----- build -----
function build() {
  mobile = innerWidth < 1000 || innerHeight > innerWidth * 1.05;
  document.body.classList.toggle('m', mobile);
  vw = innerWidth; vh = innerHeight;
  noteEl.innerHTML = ''; layer.innerHTML = ''; threadsSvg.innerHTML = ''; mflow.innerHTML = ''; srList.innerHTML = '';
  words = []; surfaces = [];
  const toks = parseNote(brief.note);
  const { w100, sp100 } = measure(toks.map((t) => t.t));

  // A: the message as it arrives (one paragraph)
  const aW = mobile ? vw - 44 : 1240, lhA = 1.06;
  const aTop = mobile ? 108 : 168, aMaxH = mobile ? vh * 0.6 : 560;
  let fs = mobile ? 40 : 88;
  const fsMin = mobile ? 24 : 54;
  for (; fs > fsMin; fs -= 1) {
    const f = flow(w100.map((w) => (w * fs) / 100), (sp100 * fs) / 100, aW);
    if (f.lines * fs * lhA <= aMaxH) break;
  }
  fsA = fs;
  const fa = flow(w100.map((w) => (w * fsA) / 100), (sp100 * fsA) / 100, aW);
  const aH = fa.lines * fsA * lhA;
  const aX = mobile ? 22 : 80, aY0 = aTop + (mobile ? 0 : Math.max(0, (aMaxH - aH) / 2 - 20));

  // N: the same words set as an annotated note: each signal and each struck run ends its line (so a thread can leave it cleanly)
  fsN = mobile ? Math.min(14, Math.max(12, vw / 28)) : 20;
  const lhN = mobile ? 1.36 : 1.42;
  const nW = mobile ? vw - 44 : 372;
  const breakAfter = toks.map((t, i) => !mobile && t.k !== 'c' && (i === toks.length - 1 || toks[i + 1].k !== t.k || toks[i + 1].g !== t.g));
  const fn = flow(w100.map((w) => (w * fsN) / 100), (sp100 * fsN) / 100, nW, breakAfter);
  sN = fsN / fsA;
  const nX = mobile ? 22 : 56, nY0 = mobile ? 86 : 126;
  kickA = mobile ? { x: 22, y: 78 } : { x: 80, y: 122 };
  kickN = mobile ? { x: 22, y: 66 } : { x: 56, y: 100 };
  kick.textContent = `A first message — ${brief.label.toLowerCase()} (illustrative)`;

  noteEl.style.setProperty('--fs', fsA + 'px');
  toks.forEach((tok, i) => {
    const el = document.createElement('span');
    el.className = `w k-${tok.k}`;
    el.style.fontSize = fsA + 'px';
    const wA = (w100[i] * fsA) / 100, spA = (sp100 * fsA) / 100;
    const svgW = wA + (tok.internal ? spA : 0);
    let inner = '';
    if (tok.k !== 'c') {
      inner += `<i class="hb" style="width:${svgW}px;${tok.k === 'n' ? 'display:none' : ''}"></i>`;
    }
    inner += `<span class="t">${tok.t}</span>`;
    if (tok.k !== 'c') {
      const d = tok.k === 's' ? hand(i + 1, 93, 1.6) : hand(i + 7, 58, 2.2, -5);
      inner += `<svg width="${svgW}" height="${fsA}" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="${d}" pathLength="1"/></svg>`;
    }
    el.innerHTML = inner;
    if (tok.k === 's') el.dataset.g = String(tok.g);
    noteEl.append(el);
    words.push({ la: fa.pos[i].line / Math.max(1, fa.lines - 1), el, tok, i, w: wA, ax: aX + fa.pos[i].x, ay: aY0 + fa.pos[i].line * fsA * lhA, nx: nX + fn.pos[i].x, ny: nY0 + fn.pos[i].line * fsN * lhN, svgW });
  });
  const nBottom = nY0 + fn.lines * fsN * lhN;
  stripBg.style.display = mobile ? 'block' : 'none';
  stripBg.dataset.h = String(nBottom + 16);

  // surfaces, tags, threads
  const groups = [1, 2, 3, 4];
  const tagPos: Record<SurfaceKey, { x: number; y: number }> = { site: { x: 480, y: 98 }, app: { x: 1040, y: 60 }, flow: { x: 480, y: 438 }, ai: { x: 480, y: 656 } };
  groups.forEach((g, o) => {
    const key = brief.map[g];
    const quote = toks.filter((t) => t.k === 's' && t.g === g).map((t) => t.t).join(' ');
    const el = document.createElement('div');
    el.className = `sf ${brief.theme}`; el.dataset.s = key; el.dataset.g = String(g); el.setAttribute('aria-hidden', 'true');
    el.innerHTML = `<div class="sf-in">${surfaceHTML(brief.id, key)}</div>`;
    const tag = document.createElement('div'); tag.className = 'tag'; tag.dataset.g = String(g); tag.dataset.s = key;
    tag.innerHTML = `<i class="dot"></i><div><small>${SURFACE_LABEL[key]}</small><q>${quote}</q></div>`;
    let thread: SVGPathElement | null = null, mb: HTMLElement | null = null;
    if (!mobile) {
      layer.append(el); layer.append(tag);
      tag.style.left = tagPos[key].x + 'px'; tag.style.top = tagPos[key].y + 'px';
      thread = document.createElementNS('http://www.w3.org/2000/svg', 'path'); thread.setAttribute('pathLength', '1'); thread.dataset.g = String(g);
      threadsSvg.append(thread);
    } else {
      mb = document.createElement('div'); mb.className = 'mb'; mb.dataset.g = String(g);
      mb.append(tag, el); mflow.append(mb);
    }
    surfaces.push({ key, g, o, el, tag, thread, mb });
    const li = document.createElement('li'); li.textContent = `${SURFACE_LABEL[key]} — from “${quote}”: ${brief.alt[key]}`; srList.append(li);
  });
  if (mobile) { const ms = document.createElement('div'); ms.className = 'm-said'; ms.innerHTML = `<p>${brief.said}</p><a href="#write">Write yours ↓</a>`; mflow.append(ms); }
  const ps = document.createElement('li'); ps.textContent = brief.said; srList.append(ps);
  const nt = document.createElement('li'); nt.textContent = 'The message: ' + toks.map((t) => t.t).join(' '); srList.prepend(nt);

  if (!mobile) computeThreads(toks);

  cap.innerHTML = CAPTIONS.map((c) => `<div class="c"><span class="k">${c.k}</span><span class="t">${c.t}</span></div>`).join('');
  rail.style.cssText = 'left:1040px;top:790px;width:300px';
  rail.innerHTML = CAPTIONS.map((c) => `<span>${c.k}</span>`).join('');
  said.innerHTML = `<p>${brief.said}</p><a href="#write">Write yours ↓</a>`;
  foot.innerHTML = `<span><b>Gabriel Solutions</b> — Websites · Apps &amp; platforms · AI · Automation</span><span class="cue">Scroll — watch how we read it</span>`;
  foot.style.cssText = mobile ? 'left:22px;right:22px;bottom:calc(28px + env(safe-area-inset-bottom));flex-direction:column;gap:14px;font-size:10px' : '';

  layout();
  document.body.dataset.brief = brief.id;
  $('.briefs').querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === brief.id)));
}

function roundedPath(pts: [number, number][], r: number) {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
    const l1 = Math.hypot(cx - px, cy - py), l2 = Math.hypot(nx - cx, ny - cy), rr = Math.min(r, l1 / 2, l2 / 2);
    d += `L${cx - ((cx - px) / l1) * rr} ${cy - ((cy - py) / l1) * rr}Q${cx} ${cy} ${cx + ((nx - cx) / l2) * rr} ${cy + ((ny - cy) / l2) * rr}`;
  }
  const last = pts[pts.length - 1];
  return d + `L${last[0]} ${last[1]}`;
}
function computeThreads(toks: Tok[]) {
  const tagY: Record<string, number> = { site: 98 + 6.5, app: 60 + 6.5, flow: 438 + 6.5, ai: 656 + 6.5 };
  const tagX: Record<string, number> = { site: 480, app: 1040, flow: 480, ai: 480 };
  const lanes = surfaces.map((s) => ({ s, ty: tagY[s.key] })).sort((a, b) => a.ty - b.ty);
  surfaces.forEach((s) => {
    let last = -1; toks.forEach((t, i) => { if (t.k === 's' && t.g === s.g) last = i; });
    const w = words[last];
    const sx = w.nx + w.w * sN + 9, sy = w.ny + fsN * 0.6;
    const lane = 436 + lanes.findIndex((l) => l.s === s) * 9 + 4;
    const ty = tagY[s.key];
    if (s.thread) s.thread.setAttribute('d', roundedPath([[sx, sy], [lane, sy], [lane, ty], [tagX[s.key] - 3, ty]], 10));
  });
}

// ----- layout (canvas placement) -----
function layout() {
  vw = innerWidth; vh = innerHeight;
  if (mobile) {
    canvas.style.cssText = `width:${vw}px;height:${vh}px;transform:none`;
    stage.style.cssText = `margin-bottom:-${vh}px;height:${vh}px`;
    cScale = 1;
    mflow.style.paddingTop = Math.round(vh * 2.15) + 'px';
    seq.style.height = '';
  } else {
    const s = Math.min(vw / 1440, (vh - 56) / 830);
    cScale = s;
    const ox = (vw - 1440 * s) / 2, oy = 56 - 60 * s + Math.max(0, (vh - 56 - 830 * s) / 2);
    canvas.style.cssText = `width:1440px;height:900px;transform:translate(${ox}px,${oy}px) scale(${s})`;
    stage.style.cssText = '';
    mflow.style.paddingTop = '';
    seq.style.height = REDUCED || FORCE_P !== null ? '' : `${vh * 7.4}px`;
  }
  seqTop = seq.getBoundingClientRect().top + scrollY;
  seqH = seq.offsetHeight;
}

// ----- state -> DOM -----
function render(p: number, mq?: { [k: string]: number }) {
  const n = words.length;
  const readU = clamp((p - T.read0) / (T.read1 - T.read0));
  const readPos = readU * (n + 3);
  const mv = (la: number) => ease(clamp((p - T.move0 - 0.05 * la) / (T.move1 - T.move0 - 0.05)));
  const sw = lerp(3.4, 1.4, ease(clamp((p - T.move0) / (T.move1 - T.move0))));
  const reread = p >= T.reread0 && p < 0.9999 ? Math.floor(((p - T.reread0) / (1 - T.reread0)) * 4) + 1 : 0;
  const hot = hotGroup ?? reread;

  words.forEach((w) => {
    const t = mv(w.la);
    const x = lerp(w.ax, w.nx, t), y = lerp(w.ay, w.ny, t), sc = lerp(1, sN, t);
    const m = clamp(readPos - w.i);
    const st = w.el.style;
    st.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) scale(${sc.toFixed(4)})`;
    st.setProperty('--m', m.toFixed(3));
    if (w.tok.k === 'n') st.opacity = String(1 - 0.66 * ease(clamp((readPos - w.i - 1.2) / 2)));
    w.el.classList.toggle('hot', w.tok.k === 's' && w.tok.g === hot);
    if (w.tok.k !== 'c') st.setProperty('--sw', ((sw * (w.tok.g === hot && w.tok.k === 's' ? 1.8 : 1) * 100) / (fsA * sc * cScale)).toFixed(2));
  });
  // pen
  if (readU > 0 && readU < 1 && p < T.move0 + 0.005) {
    const i0 = Math.min(n - 1, Math.floor(readPos)), fr = clamp(readPos - i0), w = words[i0];
    pen.style.opacity = '1';
    pen.style.transform = `translate(${w.ax + fr * w.w}px,${w.ay + fsA * 0.96}px)`;
  } else pen.style.opacity = '0';
  // kick label
  const tk = ease(clamp((p - T.move0) / (T.move1 - T.move0)));
  kick.style.transform = `translate(${lerp(kickA.x, kickN.x, tk)}px,${lerp(kickA.y, kickN.y, tk)}px)`;
  kick.style.opacity = String(clamp((p - 0.005) / 0.05));
  foot.style.opacity = String(1 - clamp((p - 0.02) / (mobile ? 0.12 : 0.18)));
  foot.style.pointerEvents = 'none';
  if (mobile) { stripBg.style.height = stripBg.dataset.h + 'px'; stripBg.style.opacity = String(tk); }

  // surfaces
  const pb = clamp((p - T.pb0) / (T.pb1 - T.pb0)), pa = clamp((p - T.pa0) / (T.pa1 - T.pa0));
  surfaces.forEach((s) => {
    let g: number, b: number, a: number, tp: number, to: number;
    if (mobile && mq) {
      const q = mq[s.g] ?? 0;
      g = ease(clamp(q / 0.35)); b = clamp((q - 0.32) / 0.3); a = clamp((q - 0.62) / 0.34);
      tp = 1; to = 1;
    } else {
      const t0 = T.thread0 + 0.03 * s.o;
      tp = ease(clamp((p - t0) / 0.045));
      to = clamp((tp - 0.6) / 0.4);
      g = ease(clamp((p - (T.grow0 + 0.03 * s.o)) / 0.13)); b = pb; a = pa;
    }
    const st = s.el.style;
    s.el.dataset.on = g > 0.001 ? '1' : '0';
    st.setProperty('--g', g.toFixed(4)); st.setProperty('--pb', b.toFixed(4)); st.setProperty('--pa', a.toFixed(4));
    st.setProperty('--r1', clamp(a / 0.28).toFixed(3)); st.setProperty('--r2', clamp((a - 0.28) / 0.28).toFixed(3)); st.setProperty('--r3', clamp((a - 0.56) / 0.28).toFixed(3));
    s.tag.style.setProperty('--to', String(to));
    if (s.thread) { s.thread.style.setProperty('--tp', tp.toFixed(3)); s.thread.classList.toggle('hot', hot === s.g); }
    s.el.classList.toggle('hot', hot === s.g);
    s.tag.style.opacity = String(mobile ? 1 : to);
  });
  // caption / rail / statement (desktop)
  if (!mobile) {
    const ph = p < T.thread0 ? 0 : p < T.pb0 ? 1 : p < T.pa0 ? 2 : 3;
    const edges = [T.move1 - 0.01, T.thread0 + 0.03, T.pb0, T.pa0, 2];
    [...cap.children].forEach((c, i) => {
      const vis = clamp((p - edges[i]) / 0.02) * (1 - clamp((p - edges[i + 1] + 0.02) / 0.02));
      (c as HTMLElement).style.opacity = String(vis);
    });
    [...rail.children].forEach((c, i) => c.classList.toggle('on', p >= T.thread0 && i <= ph));
    rail.style.opacity = String(clamp((p - T.thread0) / 0.03));
    const sv = clamp((p - 0.955) / 0.03);
    said.style.opacity = String(sv); said.style.pointerEvents = sv > 0.5 ? 'auto' : 'none';
  }
  document.body.dataset.p = p.toFixed(3);
}

// mobile: per-block local progress from scroll position
function mobileQ(): { [k: string]: number } {
  const q: { [k: string]: number } = {};
  surfaces.forEach((s) => {
    const r = s.mb!.getBoundingClientRect();
    q[s.g] = clamp((vh * 0.95 - r.top) / (vh * 0.65));
  });
  return q;
}

// ----- loop -----
let hotGroup: number | null = null;
let lastKey = '';
function frame(now: number) {
  requestAnimationFrame(frame);
  const y = scrollY;
  const dist = mobile ? vh * 1.9 : seqH - vh;
  const scrollP = clamp((y - seqTop) / Math.max(1, dist)) * (mobile ? 0.5 : 1);
  if (!introStart) introStart = now;
  if (scrollP > 0.002) userScrolled = true;
  const introP = REDUCED || userScrolled ? 0 : easeOut(clamp((now - introStart - 700) / 3800)) * 0.12;
  target = FORCE_P !== null ? FORCE_P : REDUCED ? (mobile ? 0.5 : 1) : Math.max(scrollP, introP);
  const d = target - P;
  P = Math.abs(d) < 0.0003 || FORCE_P !== null || REDUCED ? target : P + d * 0.2;
  let mq: { [k: string]: number } | undefined;
  if (mobile) mq = REDUCED ? { 1: 1, 2: 1, 3: 1, 4: 1 } : mobileQ();
  const key = P.toFixed(4) + '|' + hotGroup + '|' + (mq ? Object.values(mq).map((v) => v.toFixed(3)).join(',') : '') + '|' + vw + vh;
  if (key !== lastKey) {
    lastKey = key;
    if (mobile && mq && FORCE_P === null) {
      const act = Object.entries(mq).filter(([, v]) => v > 0.45 && v < 0.99).map(([g]) => Number(g));
      hotGroup = act.length ? act[act.length - 1] : null;
    }
    render(P, mq);
  }
  void now;
}

// hover: a surface <-> its phrase (desktop, once built)
document.addEventListener('pointerover', (e) => {
  if (mobile || P < 0.9) return;
  const t = e.target as HTMLElement;
  const el = t.closest?.('.sf, .w.k-s') as HTMLElement | null;
  const g = el?.dataset.g ? Number(el.dataset.g) : null;
  if (g !== hotGroup) { hotGroup = g; lastKey = ''; }
});

// briefs switcher
function mountBriefs() {
  const b = $('.briefs');
  b.innerHTML = BRIEFS.map((x) => `<button type="button" data-id="${x.id}" aria-pressed="${x.id === brief.id}" title="${x.kind}">${x.label}</button>`).join('');
  b.addEventListener('click', (e) => {
    const id = (e.target as HTMLElement).closest('button')?.dataset.id;
    if (!id || id === brief.id) return;
    brief = BRIEFS.find((x) => x.id === id)!;
    hotGroup = null; lastKey = ''; userScrolled = false; introStart = 0; P = 0;
    build(); scrollTo(0, seqTop);
  });
}

async function boot() {
  try { await Promise.all([document.fonts.load('400 100px "Instrument Serif"'), document.fonts.load('italic 400 20px "Instrument Serif"'), document.fonts.load('500 14px "Inter Variable"')]); } catch { /* fall back to system serif */ }
  const b = qs.get('brief'); if (b) brief = BRIEFS.find((x) => x.id === b) ?? brief;
  mountBriefs(); buildSections(); build();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(() => { const m = innerWidth < 1000 || innerHeight > innerWidth * 1.05; if (m !== mobile || Math.abs(innerWidth - vw) > 40 || !mobile) { build(); lastKey = ''; } }, 120); });
  requestAnimationFrame(frame);
  document.body.dataset.ready = '1';
}
boot();
