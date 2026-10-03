// Opt-in sound: a low room tone plus the dry rustle and tick of blades turning.
// Everything is synthesised; loudness follows how many plates are moving.
export class Sound {
  constructor() { this.on = false; this.ctx = null; this.acc = 0; }

  toggle() {
    if (!this.ctx) this._init();
    this.on = !this.on;
    const t = this.ctx.currentTime;
    if (this.on) this.ctx.resume();
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(this.on ? 0.85 : 0, t, this.on ? 0.6 : 0.15);
    return this.on;
  }

  _init() {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.ctx = ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.connect(ctx.destination);
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(comp);
    this.master = master;

    // room tone
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = 0.4;
    lp.connect(master);
    const drone = ctx.createGain();
    drone.gain.value = 0.06;
    drone.connect(lp);
    [55, 82.41, 110.2, 164.8, 220.4].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = i % 2 ? 'triangle' : 'sine';
      o.frequency.value = f;
      o.detune.value = (i - 2) * 3.5;
      const g = ctx.createGain();
      g.gain.value = [1, 0.5, 0.32, 0.14, 0.07][i];
      o.connect(g).connect(drone);
      o.start();
    });
    this.lp = lp;

    // blade rustle
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf; src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.value = 0;
    src.connect(bp).connect(ng).connect(master);
    src.start();
    this.ng = ng; this.bp = bp;

    // ticks
    const tl = Math.floor(ctx.sampleRate * 0.012);
    this.tick = ctx.createBuffer(1, tl, ctx.sampleRate);
    const td = this.tick.getChannelData(0);
    for (let i = 0; i < tl; i++) td[i] = (Math.random() * 2 - 1) * Math.exp(-i / (tl * 0.12));
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 1500;
    this.tickBus = ctx.createGain();
    this.tickBus.gain.value = 0.22;
    this.tickBus.connect(hp).connect(master);
  }

  update(energy, day, dt) {
    if (!this.on || !this.ctx) return;
    const t = this.ctx.currentTime;
    const e = Math.min(energy, 1);
    this.ng.gain.setTargetAtTime(e * 0.045, t, 0.09);
    this.bp.frequency.setTargetAtTime(2200 + e * 2800, t, 0.12);
    this.lp.frequency.setTargetAtTime(300 + day * 1400, t, 0.4);
    this.acc += dt * e * 55;
    let n = 0;
    while (this.acc > 1 && n < 6) {
      this.acc -= 1; n++;
      const s = this.ctx.createBufferSource();
      s.buffer = this.tick;
      s.playbackRate.value = 0.6 + Math.random() * 1.1;
      const g = this.ctx.createGain();
      g.gain.value = 0.25 + Math.random() * 0.75;
      s.connect(g).connect(this.tickBus);
      s.start(t + Math.random() * dt);
    }
  }
}
