// Procedural "survey line" generator.
// TIDELINE's product repeatedly surveys a coastline and compares passes
// over time — a tideline is literally the mark successive tides leave.
// This module builds that idea as the site's one recurring visual motif:
// a smooth line through seeded points, stackable into "surveys",
// and renderable at four fidelities (raw / cleaned / annotated / decision)
// for the field-to-decision stepper.

function mulberry32(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function samplePoints(seed, { count = 10, width = 400, height = 100, baseline = 50, amplitude = 18, roughness = 1 } = {}) {
  const rand = mulberry32(seed);
  const pts = [];
  for (let i = 0; i < count; i++) {
    const x = (i / (count - 1)) * width;
    const t = i / (count - 1);
    const wave = Math.sin(t * Math.PI * 2.1 + seed * 0.3) * amplitude * 0.6;
    const noise = (rand() - 0.5) * amplitude * roughness;
    const y = baseline + wave + noise;
    pts.push({ x, y });
  }
  return pts;
}

// Catmull-Rom -> cubic bezier path, so the line reads as a smooth survey
// trace rather than a jagged connect-the-dots sketch.
function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

function jaggedPath(points) {
  if (points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 1; i < points.length; i++) d += ` L ${points[i].x.toFixed(1)} ${points[i].y.toFixed(1)}`;
  return d;
}

function svg(width, height, inner) {
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" focusable="false">${inner}</svg>`;
}

// Hero field: several faint "drift" lines behind one live teal line.
export function renderHero(width = 1200, height = 520) {
  const lines = [];
  for (let i = 0; i < 6; i++) {
    const pts = samplePoints(1000 + i * 7, { count: 9, width, height, baseline: height * (0.3 + i * 0.1), amplitude: 46, roughness: 0.9 });
    const opacity = (0.12 + i * 0.05).toFixed(2);
    lines.push(`<path d="${smoothPath(pts)}" fill="none" stroke="#1E6E68" stroke-width="1.4" opacity="${opacity}" data-drift="${i}"/>`);
  }
  const live = samplePoints(42, { count: 11, width, height, baseline: height * 0.52, amplitude: 60, roughness: 1 });
  lines.push(`<path d="${smoothPath(live)}" fill="none" stroke="#B9703A" stroke-width="2" opacity="0.8" data-drift="live"/>`);
  return svg(width, height, lines.join(''));
}

export function renderSingle(width = 400, height = 90) {
  const pts = samplePoints(7, { count: 8, width, height, baseline: height * 0.55, amplitude: 22, roughness: 1 });
  return svg(width, height, `<path d="${smoothPath(pts)}" fill="none" stroke="#16211F" stroke-width="2"/>`);
}

export function renderStack(width = 400, height = 90) {
  const parts = [];
  const layers = 7;
  for (let i = 0; i < layers; i++) {
    const pts = samplePoints(7 + i, { count: 9, width, height, baseline: height * (0.4 + i * 0.03), amplitude: 20, roughness: 0.8 });
    const isLast = i === layers - 1;
    const stroke = isLast ? '#1E6E68' : '#16211F';
    const opacity = isLast ? 0.9 : 0.14 + i * 0.03;
    const sw = isLast ? 2 : 1.2;
    parts.push(`<path d="${smoothPath(pts)}" fill="none" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity.toFixed(2)}"/>`);
  }
  return svg(width, height, parts.join(''));
}

// Four fidelities sharing one base seed, for the Field -> Decision stepper.
export function renderStage(stage, width = 600, height = 160) {
  const basePts = samplePoints(99, { count: 14, width, height, baseline: height * 0.55, amplitude: 36, roughness: 1.3 });
  const smoothPts = samplePoints(99, { count: 9, width, height, baseline: height * 0.55, amplitude: 30, roughness: 0.55 });

  if (stage === 0) {
    return svg(width, height, `<path d="${jaggedPath(basePts)}" fill="none" stroke="#4A5A57" stroke-width="1.4" opacity="0.85"/>`);
  }

  if (stage === 1) {
    const grid = [];
    for (let gx = 0; gx <= width; gx += width / 8) grid.push(`<line x1="${gx}" y1="0" x2="${gx}" y2="${height}" stroke="#16211F" stroke-width="0.5" opacity="0.08"/>`);
    return svg(width, height, grid.join('') + `<path d="${smoothPath(smoothPts)}" fill="none" stroke="#16211F" stroke-width="2"/>`);
  }

  if (stage === 2) {
    const anomalyIdx = [3, 6];
    const markers = anomalyIdx
      .map((i) => {
        const p = smoothPts[i];
        return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="5" fill="none" stroke="#B9703A" stroke-width="2"/>`;
      })
      .join('');
    return svg(width, height, `<path d="${smoothPath(smoothPts)}" fill="none" stroke="#16211F" stroke-width="2" opacity="0.5"/>` + markers);
  }

  // stage 3: decision — the trace resolves into one flagged band.
  const flagStart = smoothPts[3].x;
  const flagEnd = smoothPts[6].x;
  return svg(
    width,
    height,
    `<rect x="${flagStart.toFixed(1)}" y="0" width="${(flagEnd - flagStart).toFixed(1)}" height="${height}" fill="#1E6E68" opacity="0.12"/>` +
      `<path d="${smoothPath(smoothPts)}" fill="none" stroke="#1E6E68" stroke-width="2.4"/>` +
      `<line x1="${flagStart.toFixed(1)}" y1="0" x2="${flagStart.toFixed(1)}" y2="${height}" stroke="#1E6E68" stroke-width="1" opacity="0.5"/>` +
      `<line x1="${flagEnd.toFixed(1)}" y1="0" x2="${flagEnd.toFixed(1)}" y2="${height}" stroke="#1E6E68" stroke-width="1" opacity="0.5"/>`
  );
}

export function mountIsolines(root = document) {
  root.querySelectorAll('[data-isoline]').forEach((el) => {
    const kind = el.dataset.isoline;
    if (kind === 'hero') el.innerHTML = renderHero();
    else if (kind === 'single') el.innerHTML = renderSingle();
    else if (kind === 'stack') el.innerHTML = renderStack();
    else if (kind.startsWith('stage-')) el.innerHTML = renderStage(Number(kind.split('-')[1]));
  });
}
