// @ts-check
// INBOUND — the field. One stream of incoming messages; one state (system on/off) is the shared cause of everything that moves.
// Off: messages arrive and pile up, heating with waiting time. On: piled messages lift oldest-first and in-flight ones bend
// (velocity-continuous) into the lane that handles them; heat drains on landing; counts tick. Release: handled work is archived,
// new arrivals pile again. Deterministic for a given seed + step sequence (fixed-step simulation).
import { LANES, NAMES } from './data.js';

/** @typedef {import('./data.js').Business} Business */
/** @typedef {import('./data.js').Msg} Msg */
/** @typedef {'fly'|'pile'|'queued'|'route'|'lane'|'archive'} Phase */
/**
 * @typedef {{ id: number, msg: Msg, name: string, born: number, x: number, y: number, vx: number, vy: number, rot: number, vrot: number,
 *   phase: Phase, delay: number, routeAfter: number, lane: number, landT: number, alpha: number, heat: number, settle: number,
 *   px?: number, py?: number, prot?: number, counted?: boolean, mult?: number, into?: Card, pulse?: number, sFull?: HTMLCanvasElement, sComp?: HTMLCanvasElement }} Card
 */

export const FONT = '"InterV", system-ui, -apple-system, "Segoe UI", sans-serif';
const INK = [27, 27, 27], AMBER = [214, 133, 24], HOT = [206, 58, 20];
const LANE_W = { site: 0.34, app: 0.24, auto: 0.18, ai: 0.16, you: 0.08 };
const SIM_SPEED = 6; // simulated minutes per real second (shown as "360× faster")
const DT = 1 / 60;

/** @param {number} a */
export function rng(a) {
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
/** waiting minutes → heat 0..1 */
export const heatOf = (wait) => clamp((wait - 4) / 36, 0, 1);
/** @param {number} h */
export function heatRGB(h) {
  const c = h < 0.45 ? INK.map((v, i) => mix(v, AMBER[i], h / 0.45)) : AMBER.map((v, i) => mix(v, HOT[i], (h - 0.45) / 0.55));
  return `rgb(${c.map((v) => Math.round(v)).join(',')})`;
}
export const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m) % 60).padStart(2, '0')}`;

export class Field {
  /** @param {HTMLCanvasElement} canvas @param {{ seed?: number, reduced?: boolean }} [o] */
  constructor(canvas, o = {}) {
    this.cv = canvas;
    this.ctx = /** @type {CanvasRenderingContext2D} */ (canvas.getContext('2d'));
    this.seed = o.seed ?? 7;
    this.reduced = !!o.reduced;
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    /** @type {Card[]} */ this.cards = [];
    this.on = false;
    this.onTime = 0; // seconds of the current hold
    this.lanesA = 0; // lane structure visibility 0..1 (acknowledgement)
    this.t = 0; // real seconds simulated
    this.listeners = /** @type {Record<string, Function[]>} */ ({});
    this.w = 0; this.h = 0;
  }
  /** @param {string} ev @param {Function} f */
  onEvent(ev, f) { (this.listeners[ev] ??= []).push(f); }
  /** @param {string} ev @param {...any} a */
  emit(ev, ...a) { (this.listeners[ev] ?? []).forEach((f) => f(...a)); }

  /** @param {Business} biz */
  reset(biz) {
    this.biz = biz;
    this.r = rng(this.seed * 7919 + biz.id.length * 131 + biz.id.charCodeAt(0));
    this.cards = []; this.nextId = 1; this.on = false; this.onTime = 0; this.lanesA = 0; this.t = 0;
    this.sim = 19 * 60 + 40; // clock starts 19:40 — the evening is already busy
    this.nextSpawn = 0.4;
    this.lanes = LANES.map((l) => ({ ...l, list: /** @type {Card[]} */ ([]), count: 0 }));
    this.stats = { arrived: 0, handled: 0, you: 0, tag: 0, insightShown: false };
    this.decks = {}; this.lastIdx = {};
    this.byLane = Object.fromEntries(LANES.map((l) => [l.id, biz.messages.filter((m) => m.lane === l.id)]));
    this.heap = new Float32Array(Math.ceil((this.w || 2000) / 8) + 2);
    // the evening so far: 34 messages between 18:02 and 19:38, already on the pile
    const seeded = [];
    for (let i = 0; i < 34; i++) seeded.push(18 * 60 + 2 + this.r() * 96);
    seeded.sort((a, b) => a - b);
    for (const born of seeded) { const c = this.make(born); this.dropOnPile(c); }
    this.stats.arrived = 0;
    this.emit('stats', this.stats);
  }

  /** @param {number} w @param {number} h @param {number} [top] bottom of the intro text: the field never draws structure above it */
  resize(w, h, top = 0) {
    this.w = w; this.h = h;
    this.cv.width = Math.round(w * this.dpr); this.cv.height = Math.round(h * this.dpr);
    this.cv.style.width = w + 'px'; this.cv.style.height = h + 'px';
    const narrow = w < 900; // below ~900 px five columns truncate the messages; lanes become rows
    this.narrow = narrow;
    this.pad = narrow ? 16 : Math.max(28, w * 0.035);
    this.cw = narrow ? Math.min(w - 2 * this.pad - 36, 268) : clamp(w * 0.165, 214, 272);
    this.ch = narrow ? 54 : 58;
    this.compH = narrow ? 26 : 30;
    this.floorY = h - (narrow ? 164 : 112);
    this.pileTop = Math.max(h * (narrow ? 0.47 : 0.45), top + 18 + this.ch * 0.9);
    this.lanesTop = Math.max(h * (narrow ? 0.43 : 0.44), top + 22);
    const lb = this.floorY - 8, gap = narrow ? 6 : 16;
    this.laneRects = LANES.map((_, i) => {
      if (narrow) { const rh = (lb - this.lanesTop) / 5; return { x: this.pad, y: this.lanesTop + i * rh, w: w - 2 * this.pad, h: rh - gap }; }
      const lw = (w - 2 * this.pad - 4 * gap) / 5;
      return { x: this.pad + i * (lw + gap), y: this.lanesTop, w: lw, h: lb - this.lanesTop };
    });
    this.labelW = narrow ? 112 : 0;
    this.headH = narrow ? 0 : 44;
    // sprites depend on sizes
    for (const c of this.cards) { c.sFull = undefined; c.sComp = undefined; }
    if (this.biz) this.rebuildHeap(true);
  }

  /** @param {number} born */
  make(born) {
    const r = this.r;
    let u = r(), lane = 'site';
    for (const [k, v] of Object.entries(LANE_W)) { if (u < v) { lane = k; break; } u -= v; }
    const msg = this.draw1(lane);
    /** @type {Card} */
    const c = { id: this.nextId++, msg, name: NAMES[Math.floor(r() * NAMES.length)], born, x: 0, y: 0, vx: 0, vy: 0, rot: (r() - 0.5) * 0.5, vrot: (r() - 0.5) * 1.6,
      phase: 'fly', delay: 0, routeAfter: -1, lane: LANES.findIndex((l) => l.id === msg.lane), landT: 0, alpha: 1, heat: 0, settle: 0 };
    this.cards.push(c);
    this.stats.arrived++;
    return c;
  }

  /** per-lane shuffled deck: a message text does not repeat until its lane's pool is used up @param {string} lane */
  draw1(lane) {
    const pool = this.byLane[lane], deck = (this.decks[lane] ??= []);
    if (!deck.length) {
      const idx = pool.map((_, i) => i);
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(this.r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      if (idx.length > 1 && idx[idx.length - 1] === this.lastIdx?.[lane]) idx.unshift(/** @type {number} */ (idx.pop()));
      deck.push(...idx);
    }
    const i = /** @type {number} */ (deck.pop());
    (this.lastIdx ??= {})[lane] = i;
    return pool[i];
  }

  // ---------- pile height field (8 px columns) ----------
  heapAt(x) { const i = clamp(Math.round(x / 8), 0, this.heap.length - 1); return this.heap[i]; }
  heapMax(x0, x1) { let m = 0; for (let i = Math.max(0, Math.floor(x0 / 8)); i <= Math.min(this.heap.length - 1, Math.ceil(x1 / 8)); i++) m = Math.max(m, this.heap[i]); return m; }
  heapAdd(x, inc) {
    const half = this.cw * 0.5, cap = this.floorY - this.pileTop;
    for (let i = Math.max(0, Math.floor((x - half) / 8)); i <= Math.min(this.heap.length - 1, Math.ceil((x + half) / 8)); i++) {
      const f = 1 - Math.abs(i * 8 - x) / (half * 0.95); // a rounded mound, not a brick
      this.heap[i] = Math.min(cap, this.heap[i] + inc * Math.max(0.12, f));
    }
  }
  restY(x) { return this.floorY - this.heapMax(x - this.cw * 0.3, x + this.cw * 0.3) - this.ch * 0.5 + this.ch * 0.18; }
  /** place a card directly on the pile (seeding / reduced motion) @param {Card} c */
  dropOnPile(c) {
    const r = this.r, m = this.pad + this.cw * 0.5;
    c.x = mix(m, (this.w || 1440) - m, r());
    c.y = this.restY(c.x); c.rot = (r() - 0.5) * 0.24; c.vx = c.vy = c.vrot = 0;
    c.phase = 'pile'; c.settle = 1;
    this.heapAdd(c.x, this.ch * 0.46);
  }
  rebuildHeap(reposition) {
    this.heap = new Float32Array(Math.ceil(this.w / 8) + 2);
    for (const c of this.cards) if (c.phase === 'pile' || c.phase === 'queued') {
      if (reposition) { c.x = clamp(c.x, this.pad + this.cw * 0.5, this.w - this.pad - this.cw * 0.5); c.y = this.restY(c.x); }
      this.heapAdd(c.x, this.ch * 0.46);
    }
  }

  spawn() {
    const c = this.make(this.sim);
    const r = this.r, w = this.w, h = this.h;
    c.x = w + this.cw * 0.6;
    c.y = h * (this.narrow ? mix(0.30, 0.42, r()) : mix(0.20, 0.40, r()));
    c.vy = -mix(60, 260, r());
    const m = this.pad + this.cw * 0.5;
    const xL = mix(m, w - m, Math.pow(r(), 0.8)); // aim: where it will land
    const yL = this.restY(xL), g = this.grav();
    const T = (-c.vy + Math.sqrt(c.vy * c.vy + 2 * g * Math.max(10, yL - c.y))) / g;
    c.vx = (xL - c.x) / T;
    if (this.on) { c.routeAfter = 0.14; }
    return c;
  }
  grav() { return this.narrow ? 1500 : 1700; }

  /** @param {boolean} on */
  setOn(on) {
    if (on === this.on) return;
    this.on = on;
    if (on) {
      this.onTime = 0;
      const pile = this.cards.filter((c) => c.phase === 'pile').sort((a, b) => a.born - b.born); // oldest first: the system reads the queue
      pile.forEach((c, i) => { c.phase = 'queued'; c.delay = this.reduced ? 0 : 0.08 + Math.min(0.9, i * 0.024); c.px = c.x; c.py = c.y; c.prot = c.rot; });
      for (const c of this.cards) if (c.phase === 'fly') this.route(c, false);
      this.heap.fill(0);
      if (this.reduced) { for (const c of pile) this.route(c, false); this.snapAll(); }
    } else {
      for (const c of this.cards) {
        if (c.phase === 'lane' || c.phase === 'route') {
          if (this.reduced) continue;
          if (c.into) c.alpha = 0; // a repeat on its way onto an existing line: it is already part of that line
          else if (c.phase === 'lane') { const s = this.slot(c); if (s.i >= s.cap) c.alpha = 0; }
          c.phase = 'archive';
        } else if (c.phase === 'queued') c.phase = 'pile';
        else if (c.phase === 'fly') c.routeAfter = -1;
      }
      if (this.reduced) this.restorePile();
      else { this.lanes.forEach((l) => (l.list = [])); this.rebuildHeap(false); }
    }
    this.emit('state', on, this.stats);
  }

  /** assign a lane slot and start steering @param {Card} c @param {boolean} kick */
  route(c, kick) {
    const lane = this.lanes[c.lane];
    // the same question again: the system groups it onto the visible line that already answered it (×N) instead of a new row
    const same = this.reduced ? undefined : lane.list.find((o) => o.msg === c.msg && o.alpha >= 1 && !o.into && lane.list.indexOf(o) < this.slot(o).cap);
    if (same) c.into = same; else lane.list.unshift(c); // newest on top
    c.phase = 'route';
    if (kick) { c.vy = -mix(240, 380, this.r()); c.vx += (this.slot(c).x - c.x) * 0.25; }
    c.vrot = 0;
  }
  /** @param {Card} c */
  slot(c) {
    if (c.into) return this.slot(c.into);
    const li = c.lane, R = this.laneRects[li], i = this.lanes[li].list.indexOf(c), you = this.lanes[li].id === 'you';
    // overflow never vanishes mid-air: rows past capacity land on a deck under the last visible row (3 px per layer, max 3)
    if (this.narrow) {
      const hh = this.compH, cap = Math.max(1, Math.floor((R.h - 12) / (hh + 4))), v = Math.min(i, cap - 1), deck = clamp(i - (cap - 1), 0, 3);
      return { x: R.x + this.labelW + (R.w - this.labelW) / 2, y: R.y + 4 + v * (hh + 4) + hh / 2 + deck * 3, w: R.w - this.labelW, h: hh, i, cap };
    }
    const hh = you ? this.ch : this.compH, gap = you ? 10 : 6, cap = Math.max(1, Math.floor((R.h - this.headH - 10) / (hh + gap))), v = Math.min(i, cap - 1), deck = clamp(i - (cap - 1), 0, 3);
    return { x: R.x + R.w / 2, y: R.y + this.headH + v * (hh + gap) + hh / 2 + deck * 3, w: R.w, h: hh, i, cap };
  }
  /** @param {Card} c */
  land(c) {
    c.phase = 'lane'; c.landT = this.t;
    if (c.into) { const o = c.into; o.mult = (o.mult ?? 1) + 1; o.sComp = undefined; o.pulse = this.t; c.alpha = 0; }
    if (c.counted) return; // reduced motion toggles the same cards back and forth: count each message once
    c.counted = true;
    const lane = this.lanes[c.lane];
    lane.count++;
    if (lane.id === 'you') this.stats.you++; else this.stats.handled++;
    if (c.msg.tag === this.biz?.tag) this.stats.tag++;
    this.emit('stats', this.stats);
  }
  snapAll() { for (const c of this.cards) if (c.phase === 'route') { const s = this.slot(c); c.x = s.x; c.y = s.y; c.rot = 0; this.land(c); c.heat = 0; } this.lanesA = 1; }
  restorePile() {
    for (const c of this.cards) if (c.phase === 'lane') { c.phase = 'pile'; c.x = c.px ?? c.x; c.y = c.py ?? c.y; c.rot = c.prot ?? 0; }
    this.lanes.forEach((l) => (l.list = [])); this.lanesA = 0; this.rebuildHeap(false);
  }

  /** advance one fixed step */
  step() {
    const dt = DT;
    this.t += dt;
    if (!this.reduced) {
      this.sim += SIM_SPEED * dt;
      this.nextSpawn -= dt;
      while (this.nextSpawn <= 0) { this.spawn(); this.nextSpawn += -Math.log(1 - this.r() * 0.95) * 0.62; }
    }
    if (this.on) this.onTime += dt;
    this.lanesA = clamp(this.lanesA + (this.on ? dt / 0.18 : -dt / 0.3), 0, 1);
    const g = this.grav(), om = 8.2, ze = 0.8;
    for (const c of this.cards) {
      const wait = this.sim - c.born;
      const targetHeat = c.phase === 'fly' || c.phase === 'pile' || c.phase === 'queued' ? heatOf(wait) : 0;
      c.heat = c.phase === 'route' || c.phase === 'lane' ? Math.max(0, c.heat - dt / 0.35) : targetHeat;
      switch (c.phase) {
        case 'fly': {
          if (c.routeAfter > 0 && (c.routeAfter -= dt) <= 0) { this.route(c, false); break; }
          c.vy += g * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vrot * dt;
          const ry = this.restY(c.x);
          if (c.vy > 0 && c.y >= ry) {
            c.y = ry; c.phase = 'pile'; c.settle = 0; c.vrot = 0;
            c.rot = clamp(c.rot % (Math.PI * 2), -0.13, 0.13);
            this.heapAdd(c.x, this.ch * 0.46);
          }
          break;
        }
        case 'pile': c.settle = Math.min(1, c.settle + dt / 0.12); break;
        case 'queued': if ((c.delay -= dt) <= 0) this.route(c, true); break;
        case 'route': case 'lane': {
          if (c.into && (c.into.alpha < 1 || (c.into.phase !== 'lane' && c.into.phase !== 'route') || !this.lanes[c.lane].list.includes(c.into))) { c.into = undefined; this.lanes[c.lane].list.unshift(c); }
          const s = this.slot(c);
          const ax = om * om * (s.x - c.x) - 2 * ze * om * c.vx, ay = om * om * (s.y - c.y) - 2 * ze * om * c.vy;
          c.vx += ax * dt; c.vy += ay * dt; c.x += c.vx * dt; c.y += c.vy * dt;
          c.rot *= Math.exp(-9 * dt);
          if (c.phase === 'route' && Math.hypot(s.x - c.x, s.y - c.y) < 3 && Math.hypot(c.vx, c.vy) < 60) this.land(c);
          if (c.phase === 'lane' && s.i >= s.cap + 4) c.alpha = Math.max(0, c.alpha - dt / 0.25); // buried under the deck: retire
          break;
        }
        case 'archive': c.y += 46 * dt; c.alpha -= dt / 0.42; break;
      }
    }
    // remove what has left; keep lane lists in sync
    const before = this.cards.length;
    this.cards = this.cards.filter((c) => c.alpha > 0 && c.x > -this.cw * 2);
    if (this.cards.length !== before) for (const l of this.lanes) l.list = l.list.filter((c) => c.alpha > 0);
    // an overgrown pile keeps its newest 220 (the buried bottom layers are invisible anyway)
    const piled = this.cards.filter((c) => c.phase === 'pile');
    if (piled.length > 220) { const drop = new Set(piled.slice(0, piled.length - 220)); this.cards = this.cards.filter((c) => !drop.has(c)); }
    if (this.on && !this.stats.insightShown && this.onTime > 2.5 && this.stats.tag >= 2) { this.stats.insightShown = true; this.emit('insight', this.biz?.insight(this.stats.tag)); }
  }

  waiting() {
    let n = 0, oldest = 0;
    for (const c of this.cards) if (c.phase === 'pile' || c.phase === 'fly' || c.phase === 'queued') { n++; oldest = Math.max(oldest, this.sim - c.born); }
    return { n, oldest };
  }

  // ---------- rendering ----------
  /** @param {number} w @param {number} h @param {(x: CanvasRenderingContext2D) => void} f */
  sprite(w, h, f) {
    const s = document.createElement('canvas');
    s.width = Math.ceil(w * this.dpr); s.height = Math.ceil(h * this.dpr);
    const x = /** @type {CanvasRenderingContext2D} */ (s.getContext('2d'));
    x.scale(this.dpr, this.dpr); f(x); return s;
  }
  /** @param {CanvasRenderingContext2D} x @param {string} s @param {number} max */
  fit(x, s, max) { if (x.measureText(s).width <= max) return s; while (s.length > 1 && x.measureText(s + '…').width > max) s = s.slice(0, -1); return s.trimEnd() + '…'; }
  /** live card surface; its tint is the waiting time (heat), so the pile warms as a mass @param {number} w @param {number} h @param {number} heat @param {boolean} strong */
  surface(w, h, heat, strong) {
    const x = this.ctx;
    const c = heat < 0.45 ? [255, 255, 255].map((v, i) => mix(v, [252, 240, 222][i], heat / 0.45)) : [252, 240, 222].map((v, i) => mix(v, [248, 222, 208][i], (heat - 0.45) / 0.55));
    x.fillStyle = `rgb(${c.map(Math.round).join(',')})`; x.beginPath(); x.roundRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1, 5); x.fill();
    x.lineWidth = strong ? 1.5 : 1; x.strokeStyle = strong ? '#161616' : 'rgba(20,20,20,0.13)'; x.stroke();
  }
  /** one shared soft shadow (piled / flying cards are objects; lane lines are information and cast none) */
  shadow() {
    if (this._sh && this._shW === this.cw) return this._sh;
    const b = 14, W = this.cw + 2 * b, H = this.ch + 2 * b;
    this._shW = this.cw;
    return (this._sh = this.sprite(W, H, (x) => { x.filter = 'blur(6px)'; x.fillStyle = 'rgba(40,30,20,0.16)'; x.beginPath(); x.roundRect(b, b + 3, this.cw, this.ch, 6); x.fill(); }));
  }
  /** full card: sender line + message @param {Card} c */
  full(c) {
    const W = this.cw, H = this.ch, you = this.lanes?.[c.lane]?.id === 'you';
    return this.sprite(W, H, (x) => {
      x.textBaseline = 'alphabetic';
      x.font = `600 11px ${FONT}`; x.fillStyle = '#6a6a66';
      x.fillText(this.fit(x, `${c.name} · ${c.msg.via} · ${hhmm(c.born)}`, W - 30 - (you ? 0 : 70)), 14, 21);
      x.font = `500 ${this.narrow ? 13 : 13.5}px ${FONT}`; x.fillStyle = '#161616';
      x.fillText(this.fit(x, c.msg.t, W - 26), 14, H - 15);
    });
  }
  /** compact lane card: tick + message + stamp @param {Card} c @param {number} W @param {number} H */
  compact(c, W, H) {
    const you = this.lanes[c.lane].id === 'you';
    if (you && !this.narrow) return this.sprite(W, H, (x) => {
      x.font = `600 11px ${FONT}`; x.fillStyle = '#6a6a66'; x.fillText(this.fit(x, `${c.name} · ${c.msg.via}`, W - 24), 12, 20);
      x.font = `600 13px ${FONT}`; x.fillStyle = '#111'; x.fillText(this.fit(x, c.msg.t, W - 24), 12, 38);
      x.font = `700 10.5px ${FONT}`; x.fillText(c.msg.stamp.toUpperCase(), 12, H - 8);
    });
    return this.sprite(W, H, (x) => {
      x.font = `700 11px ${FONT}`; const st = (c.mult ?? 1) > 1 ? `×${c.mult}  ${c.msg.stamp}` : c.msg.stamp; const sw = Math.min(W * 0.46, x.measureText(st).width);
      x.fillStyle = you ? '#111' : '#3f3f3c'; x.textAlign = 'right'; x.fillText(this.fit(x, st, W * 0.46), W - 10, H / 2 + 4); x.textAlign = 'left';
      x.strokeStyle = '#161616'; x.lineWidth = 1.4; x.beginPath();
      if (you) { x.arc(14, H / 2, 3, 0, Math.PI * 2); x.fillStyle = '#111'; x.fill(); } else { x.moveTo(9, H / 2); x.lineTo(12.5, H / 2 + 3.5); x.lineTo(19, H / 2 - 3.5); x.stroke(); }
      x.font = `500 12px ${FONT}`; x.fillStyle = '#1b1b1b'; x.fillText(this.fit(x, c.msg.t, W - sw - 42), 26, H / 2 + 4);
    });
  }

  draw() {
    const x = this.ctx, d = this.dpr, W = this.w, H = this.h;
    x.setTransform(d, 0, 0, d, 0, 0);
    x.clearRect(0, 0, W, H);
    // floor hairline (where waiting work collects)
    x.globalAlpha = 1 - this.lanesA * 0.8; x.fillStyle = 'rgba(20,20,20,0.18)'; x.fillRect(this.pad, this.floorY + 0.5, W - 2 * this.pad, 1); x.globalAlpha = 1;
    // lane structure — appears first on press (acknowledgement), rule draws left → right
    if (this.lanesA > 0) {
      const a = this.lanesA, e = 1 - Math.pow(1 - a, 3);
      this.laneRects.forEach((R, i) => {
        const L = this.lanes[i];
        x.globalAlpha = a;
        x.fillStyle = '#161616'; x.fillRect(R.x, R.y, (this.narrow ? R.w : R.w) * e, 1);
        x.font = `700 11px ${FONT}`; x.fillStyle = L.id === 'you' ? '#111' : '#2a2a28';
        x.fillText(L.name.toUpperCase(), R.x, R.y + (this.narrow ? 16 : 18));
        x.font = `500 11px ${FONT}`; x.fillStyle = '#7a7a75';
        const cnt = String(L.count);
        if (this.narrow) { x.fillText(`${L.verb} · ${cnt}`, R.x, R.y + 31); }
        else { x.fillText(L.verb, R.x, R.y + 33); x.font = `600 22px ${FONT}`; x.fillStyle = '#161616'; x.textAlign = 'right'; x.fillText(cnt, R.x + R.w, R.y + 30); x.textAlign = 'left'; }
      });
      x.globalAlpha = 1;
    }
    const order = { pile: 0, queued: 0, archive: 1, lane: 2, route: 3, fly: 4 };
    // within a lane, deeper rows (and the deck) draw first so the newest line is always on top
    const depth = (c) => (c.phase === 'lane' || c.phase === 'route' ? this.lanes[c.lane].list.indexOf(c.into ?? c) : 0);
    const list = [...this.cards].sort((a, b) => order[a.phase] - order[b.phase] || depth(b) - depth(a));
    for (const c of list) this.drawCard(c);
  }
  /** @param {Card} c */
  drawCard(c) {
    const x = this.ctx;
    let W = this.cw, H = this.ch, s = null, k = 0;
    if (c.phase === 'archive' && c.sComp) { // handled work leaves as it was filed (its lane list is already cleared)
      const w = c.sComp.width / this.dpr, h = c.sComp.height / this.dpr;
      x.save(); x.globalAlpha = clamp(c.alpha, 0, 1); x.translate(c.x, c.y); this.surface(w, h, 0, this.lanes[c.lane].id === 'you'); x.drawImage(c.sComp, -w / 2, -h / 2, w, h); x.restore();
      return;
    }
    if (c.phase === 'lane' || c.phase === 'route') {
      s = this.slot(c);
      // route: full card scaled to lane width; on landing it folds into the compact line over 180 ms
      k = c.phase === 'route' ? 0 : clamp((this.t - c.landT) / 0.14, 0, 1);
      if (this.reduced) k = 1;
    }
    x.save();
    const A = clamp(c.alpha, 0, 1);
    x.globalAlpha = A;
    x.translate(c.x, c.y); x.rotate(c.rot);
    const you = this.lanes[c.lane].id === 'you';
    if (s) {
      // route: full card scaled to lane width; on landing it folds into its line: the old text leaves first, then the stamp line arrives
      const sc = Math.min(1, s.w / this.cw), w1 = this.cw * sc, h1 = this.ch * sc;
      const near = c.phase === 'route' ? clamp(1 - Math.hypot(s.x - c.x, s.y - c.y) / 170, 0, 1) : 1;
      const a = near * near * (3 - 2 * near), e = Math.max(a, k);
      W = mix(w1, s.w, e); H = mix(h1, s.h, e);
      // text hides only under a line that has actually landed above it (never an empty card while the top line is in flight)
      let ahead = 0; if (c.phase === 'lane' && s.i >= s.cap) for (const o of this.lanes[c.lane].list) { if (o === c) break; if (o.phase === 'lane') ahead++; }
      const buried = ahead >= s.cap;
      this.surface(W, H, c.heat, you && k > 0.5);
      if (!buried) {
        x.save(); x.beginPath(); x.rect(-W / 2, -H / 2, W, H); x.clip();
        if (k < 0.5) { c.sFull ??= this.full(c); const t = H / h1; x.globalAlpha = A * (1 - 2 * k); x.drawImage(c.sFull, -W / 2, -H / 2, w1 * t, h1 * t); }
        else { if (!c.sComp || c.sComp.width !== Math.ceil(s.w * this.dpr) || c.sComp.height !== Math.ceil(s.h * this.dpr)) c.sComp = this.compact(c, s.w, s.h); x.globalAlpha = A * (2 * k - 1); x.drawImage(c.sComp, -W / 2, -H / 2, s.w, s.h); }
        x.restore();
      }
    } else {
      const sh = this.shadow(); x.drawImage(sh, -sh.width / this.dpr / 2, -sh.height / this.dpr / 2, sh.width / this.dpr, sh.height / this.dpr);
      this.surface(W, H, c.heat, false);
      c.sFull ??= this.full(c);
      x.drawImage(c.sFull, -W / 2, -H / 2, W, H);
    }
    // a grouped repeat just arrived on this line: brief ink mark where it landed
    if (c.pulse !== undefined && this.t - c.pulse < 0.5 && s) { x.globalAlpha = A * (1 - (this.t - c.pulse) / 0.5); x.fillStyle = '#161616'; x.fillRect(-W / 2, -H / 2, 3, H); x.globalAlpha = A; }
    // heat: the left edge and the waiting label carry how long it has waited (drains when the system takes it)
    if (c.heat > 0.02 && k < 1) {
      x.globalAlpha = clamp(c.alpha, 0, 1) * (1 - k);
      const col = heatRGB(c.heat);
      x.fillStyle = col; x.fillRect(-W / 2, -H / 2 + 4, 3, H - 8);
      const wait = Math.round(this.sim - c.born);
      if (!s && wait >= 5) { x.font = `700 10.5px ${FONT}`; x.textAlign = 'right'; x.fillText(`${wait} min`, W / 2 - 10, -H / 2 + 21); x.textAlign = 'left'; }
    }
    x.restore();
  }
}
