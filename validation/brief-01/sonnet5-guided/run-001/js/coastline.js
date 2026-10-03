/*
 * Coastline engine.
 *
 * VL-01: raw input (scroll) is never drawn directly. Scroll only sets a
 * target "stage" (0..3); a separate governed value eases toward it over
 * elapsed time, so fast/instant scroll still traverses every intermediate
 * visual state instead of skipping to an endpoint.
 *
 * The tide oscillation runs on its own clock and never depends on the
 * stage or on scroll at all — it is the literal "not a snapshot" signal.
 */
(function () {
  "use strict";

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function smoothstep(x, lo, hi) {
    if (lo === hi) return x >= hi ? 1 : 0;
    const t = clamp((x - lo) / (hi - lo), 0, 1);
    return t * t * (3 - 2 * t);
  }

  const PALETTE = {
    seabed: "#0f2a3c",
    seabedDeep: "#081621",
    contour: "#2d4f5c",
    tide: "#7fc7b8",
    tideFaint: "#5fb3a3",
    sensorDecor: "#9fb8c2",
    sensorNamed: "#d98f4a",
    mesh: "#5fb3a3",
    band: "#5fb3a3",
    corridor: "#d98f4a",
  };

  const NAMED_SENSORS = [
    { id: "s1", xNorm: 0.20, label: "Shoreline position", reading: "Δ −0.6 m / survey", activeFrom: 0.9 },
    { id: "s2", xNorm: 0.36, label: "Wave run-up", reading: "2.3 m, rising", activeFrom: 1.15 },
    { id: "s3", xNorm: 0.52, label: "Sediment turbidity", reading: "nominal", activeFrom: 1.55 },
    { id: "s4", xNorm: 0.67, label: "Bathymetric depth", reading: "−4.1 m MSL", activeFrom: 2.0 },
    { id: "s5", xNorm: 0.80, label: "Structure exposure", reading: "within corridor", activeFrom: 2.55 },
  ];

  const DECOR_X = [0.08, 0.14, 0.28, 0.44, 0.59, 0.73, 0.87, 0.93, 0.97];

  function groundYNorm(xNorm) {
    if (xNorm < 0.16) return 0.40;
    if (xNorm < 0.30) {
      const t = (xNorm - 0.16) / 0.14;
      const e = t * t * (3 - 2 * t);
      return lerp(0.40, 0.53, e);
    }
    const t = clamp((xNorm - 0.30) / 0.70, 0, 1);
    return lerp(0.53, 0.88, Math.pow(t, 0.6));
  }

  function scatterSeed(i) {
    // deterministic pseudo-random offset, stable across frames/resizes
    const s = Math.sin(i * 12.9898) * 43758.5453;
    return s - Math.floor(s);
  }

  function CoastEngine(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.stage = 0;
    this.targetStage = 0;
    this.reducedMotion = false;
    this.calm = false;

    this.tidePhase = 0;
    this.lastTime = null;

    this._sensorScreen = [];
    this._raf = null;

    this.resize();
    this._loop = this._loop.bind(this);
  }

  CoastEngine.prototype.resize = function () {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  CoastEngine.prototype.setTargetStage = function (n) {
    this.targetStage = n;
  };

  CoastEngine.prototype.setReducedMotion = function (b) {
    this.reducedMotion = b;
  };

  CoastEngine.prototype.setCalm = function (b) {
    this.calm = b;
  };

  CoastEngine.prototype.start = function () {
    if (this._raf) return;
    this.lastTime = null;
    this._raf = requestAnimationFrame(this._loop);
  };

  CoastEngine.prototype.stop = function () {
    if (this._raf) cancelAnimationFrame(this._raf);
    this._raf = null;
  };

  CoastEngine.prototype._loop = function (now) {
    if (this.lastTime === null) this.lastTime = now;
    const dt = Math.min((now - this.lastTime) / 1000, 0.05);
    this.lastTime = now;

    if (this.reducedMotion) {
      this.stage = this.targetStage;
    } else {
      const tau = 0.22;
      const k = 1 - Math.exp(-dt / tau);
      this.stage = lerp(this.stage, this.targetStage, k);
      if (Math.abs(this.stage - this.targetStage) < 0.001) this.stage = this.targetStage;
    }

    if (!this.reducedMotion) {
      this.tidePhase += dt * 0.35;
    }

    this._draw();
    this._raf = requestAnimationFrame(this._loop);
  };

  CoastEngine.prototype._draw = function () {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    if (this.calm) return;

    const stage = this.stage;
    const tideY = 0.46 + (this.reducedMotion ? 0 : Math.sin(this.tidePhase) * 0.012 + Math.sin(this.tidePhase * 2.7) * 0.004);

    // seabed / land silhouette
    ctx.beginPath();
    ctx.moveTo(0, groundYNorm(0) * h);
    for (let i = 0; i <= 40; i++) {
      const x = i / 40;
      ctx.lineTo(x * w, groundYNorm(x) * h);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const seabedGrad = ctx.createLinearGradient(0, 0.4 * h, 0, h);
    seabedGrad.addColorStop(0, PALETTE.seabed);
    seabedGrad.addColorStop(1, PALETTE.seabedDeep);
    ctx.fillStyle = seabedGrad;
    ctx.globalAlpha = 0.88;
    ctx.fill();
    ctx.globalAlpha = 1;

    // depth contour isolines, fade in with understanding
    const contourOpacity = smoothstep(stage, 1.5, 2.5);
    if (contourOpacity > 0.01) {
      ctx.strokeStyle = PALETTE.contour;
      ctx.lineWidth = 1;
      for (let c = 1; c <= 3; c++) {
        ctx.globalAlpha = contourOpacity * (0.55 - c * 0.1);
        ctx.beginPath();
        for (let i = 0; i <= 40; i++) {
          const x = i / 40;
          const y = (groundYNorm(x) + c * 0.045) * h;
          if (i === 0) ctx.moveTo(x * w, y); else ctx.lineTo(x * w, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // predictive uncertainty band (right-projecting cone), understanding phase
    const bandOpacity = smoothstep(stage, 1.7, 2.5) * (1 - smoothstep(stage, 2.9, 3.3) * 0.4);
    if (bandOpacity > 0.01) {
      const originX = 0.74 * w;
      const originY = tideY * h;
      ctx.beginPath();
      ctx.moveTo(originX, originY - 4);
      ctx.lineTo(w, originY - 0.16 * h);
      ctx.lineTo(w, originY + 0.2 * h);
      ctx.lineTo(originX, originY + 4);
      ctx.closePath();
      ctx.fillStyle = PALETTE.band;
      ctx.globalAlpha = bandOpacity * 0.14;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // decision corridor highlight
    const corridorOpacity = smoothstep(stage, 2.5, 3.1);
    if (corridorOpacity > 0.01) {
      const x0 = 0.56 * w;
      const x1 = 0.84 * w;
      ctx.fillStyle = PALETTE.corridor;
      ctx.globalAlpha = corridorOpacity * 0.1;
      ctx.fillRect(x0, 0, x1 - x0, h);
      ctx.globalAlpha = corridorOpacity * 0.8;
      ctx.strokeStyle = PALETTE.corridor;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, h); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }

    // tide line (independent ambient clock)
    ctx.strokeStyle = PALETTE.tide;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const x = i / 60;
      const ripple = this.reducedMotion ? 0 : Math.sin(x * 14 + this.tidePhase * 1.6) * 0.0025;
      const y = (tideY + ripple) * h;
      if (i === 0) ctx.moveTo(x * w, y); else ctx.lineTo(x * w, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // mesh connecting named sensors once understood
    const meshOpacity = smoothstep(stage, 1.7, 2.5);
    const sensorScreen = [];
    const connectPts = [];

    const allPoints = NAMED_SENSORS.map((s, i) => ({ sensor: s, decor: false, i }))
      .concat(DECOR_X.map((x, i) => ({ sensor: { xNorm: x, activeFrom: 0.3 + (i % 4) * 0.25 }, decor: true, i })));

    for (const p of allPoints) {
      const s = p.sensor;
      const gx = s.xNorm * w;
      const gy = groundYNorm(s.xNorm) * h;
      const appear = smoothstep(stage, s.activeFrom - 0.35, s.activeFrom + 0.15);
      if (appear <= 0.01) continue;

      const settle = smoothstep(stage, 1.0, 2.2);
      const seed = scatterSeed(p.i + (p.decor ? 50 : 0));
      const scatterAmp = (1 - settle) * 0.05 * h;
      const scatterX = (seed - 0.5) * 2 * (1 - settle) * 0.02 * w;
      const scatterY = (seed - 0.5) * 2 * scatterAmp;

      const px = gx + scatterX;
      const py = gy + scatterY - 2;

      if (!p.decor) {
        connectPts.push({ x: px, y: py, appear });
        sensorScreen.push({
          id: s.id, label: s.label, reading: s.reading,
          x: px, y: py, visible: appear > 0.35,
        });
      }

      ctx.beginPath();
      ctx.arc(px, py, p.decor ? 2.6 : 5, 0, Math.PI * 2);
      ctx.fillStyle = p.decor ? PALETTE.sensorDecor : PALETTE.sensorNamed;
      ctx.globalAlpha = appear * (p.decor ? 0.5 : 0.95);
      ctx.fill();
      if (!p.decor) {
        ctx.beginPath();
        ctx.arc(px, py, 9, 0, Math.PI * 2);
        ctx.strokeStyle = PALETTE.sensorNamed;
        ctx.globalAlpha = appear * meshOpacity * 0.7;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    if (meshOpacity > 0.01 && connectPts.length > 1) {
      ctx.strokeStyle = PALETTE.mesh;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = meshOpacity * 0.55;
      ctx.beginPath();
      connectPts.forEach((pt, i) => {
        if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    this._sensorScreen = sensorScreen;
  };

  CoastEngine.prototype.getSensorScreenPositions = function () {
    return this._sensorScreen;
  };

  CoastEngine.NAMED_SENSORS = NAMED_SENSORS;
  window.CoastEngine = CoastEngine;
})();
