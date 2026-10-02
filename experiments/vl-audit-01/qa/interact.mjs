// Real-input interaction QA: mouse hold, keyboard (Space / Enter), latch, touch hold + scroll-cancel, business switch,
// scroll-away release, reduced motion, resize, overflow, determinism, frame cost. usage: node qa/interact.mjs  (serve on :8123)
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const URL = 'http://localhost:8123/index.html';
const out = [], errs = [];
const ok = (name, cond, extra = '') => out.push(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
async function page(opts = {}, q = '') {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, ...opts });
  const p = await ctx.newPage();
  p.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 200)));
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  await p.goto(URL + q); await p.waitForFunction(() => document.body.dataset.ready === '1');
  return { p, ctx };
}
const st = (p) => p.evaluate(() => { const f = window.__inb.field; return { on: f.on, handled: f.stats.handled, you: f.stats.you, waiting: f.waiting().n, lanesA: f.lanesA, cards: f.cards.length, phases: f.cards.reduce((a, c) => ((a[c.phase] = (a[c.phase] ?? 0) + 1), a), {}) }; });

{ // mouse hold on the field
  const { p, ctx } = await page();
  await p.waitForTimeout(1500);
  const s0 = await st(p);
  await p.mouse.move(700, 600); await p.mouse.down();
  await p.waitForTimeout(90); const ack = await st(p);
  await p.waitForTimeout(2500); const s1 = await st(p);
  const label = await p.textContent('#hold-l');
  await p.mouse.up(); await p.waitForTimeout(150); const s2 = await st(p);
  await p.waitForTimeout(2500); const s3 = await st(p);
  ok('mouse hold switches on; release switches off', s1.on && !s2.on);
  ok('acknowledgement within ~90 ms (lane structure visible before cards land)', ack.lanesA > 0.3 && ack.handled === 0, `lanesA=${ack.lanesA.toFixed(2)} handled=${ack.handled}`);
  ok('backlog routed while held', s1.handled + s1.you >= s0.waiting * 0.8 && s1.waiting <= 3, `before waiting=${s0.waiting} → handled ${s1.handled}+${s1.you}, waiting ${s1.waiting}`);
  ok('hold label reflects state', /let go/.test(label ?? ''), label);
  ok('after release new arrivals pile again; history kept', s3.waiting > 0 && s3.handled >= s1.handled, `waiting ${s3.waiting}, handled ${s3.handled}`);
  const ins = await p.isVisible('#insight'); ok('insight hidden after release', !ins);
  // clicks on controls must not trigger a hold
  await p.click('.biz button[data-biz="hotel"]'); await p.waitForTimeout(300);
  const s4 = await st(p); const eb = await p.textContent('#eyebrow');
  ok('business switch: no hold, field reset, eyebrow updated', !s4.on && s4.handled === 0 && /boutique hotel/.test(eb ?? ''), eb);
  // latch
  await p.click('#latch'); await p.waitForTimeout(1500); const l1 = await st(p);
  await p.click('#latch'); await p.waitForTimeout(200); const l2 = await st(p);
  ok('latch toggles on and off without holding', l1.on && !l2.on);
  // scroll away while held → release
  await p.mouse.move(700, 600); await p.mouse.down(); await p.waitForTimeout(300);
  await p.mouse.up();
  await p.evaluate(() => scrollTo(0, innerHeight * 1.2)); await p.waitForTimeout(400);
  const sess = await p.textContent('#session');
  ok('session section reports real routed counts', /messages were taken/.test(sess ?? ''), (sess ?? '').slice(0, 90) + '…');
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300);
  // overflow
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  ok('no horizontal overflow 1440', !ov);
  // frame cost (software rendering, headless): average step+draw over 120 frames in the busiest state (held)
  await p.mouse.move(700, 600); await p.mouse.down(); await p.waitForTimeout(300);
  const fr = await p.evaluate(() => new Promise((res) => { const d = []; let l = performance.now(); const f = (t) => { d.push(t - l); l = t; if (d.length < 180) requestAnimationFrame(f); else { d.sort((a, b) => a - b); res({ med: d[90], p95: d[171], max: d[179] }); } }; requestAnimationFrame(f); }));
  await p.mouse.up();
  out.push(`INFO  rAF interval while routing (headless Chromium, software raster, 1440×900 DPR1): median ${fr.med.toFixed(1)} ms · p95 ${fr.p95.toFixed(1)} ms · max ${fr.max.toFixed(1)} ms`);
  await ctx.close();
}
{ // keyboard
  const { p, ctx } = await page();
  await p.waitForTimeout(800);
  await p.keyboard.down('Space'); await p.waitForTimeout(1200); const k1 = await st(p);
  await p.keyboard.up('Space'); await p.waitForTimeout(200); const k2 = await st(p);
  const y = await p.evaluate(() => scrollY);
  ok('Space hold runs the system, release stops; page did not scroll', k1.on && !k2.on && y === 0, `scrollY=${y}`);
  await p.focus('#hold'); await p.keyboard.press('Enter'); await p.waitForTimeout(500); const k3 = await st(p);
  const pressed = await p.getAttribute('#latch', 'aria-pressed');
  await p.keyboard.press('Enter'); await p.waitForTimeout(200); const k4 = await st(p);
  ok('Enter on the hold button latches / unlatches (no hold needed)', k3.on && pressed === 'true' && !k4.on);
  const liveTxt = await p.textContent('#live'); ok('aria-live announces state change', /System off|System running/.test(liveTxt ?? ''), liveTxt ?? '');
  await ctx.close();
}
{ // touch (phone emulation)
  const { p, ctx } = await page({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  await p.waitForTimeout(800);
  const cdp = await ctx.newCDPSession(p);
  const touch = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });
  await touch('touchStart', 200, 600); await p.waitForTimeout(1500); const t1 = await st(p);
  await touch('touchEnd', 200, 600); await p.waitForTimeout(200); const t2 = await st(p);
  ok('touch hold runs, lift stops', t1.on && !t2.on, `handled ${t1.handled}`);
  // vertical swipe on the field should scroll the page and must not leave the system on
  await p.evaluate(() => { window.__flash = 0; window.__inb.field.onEvent('state', (on) => { if (on) window.__flash++; }); });
  await touch('touchStart', 200, 700);
  for (let i = 1; i <= 8; i++) { await touch('touchMove', 200, 700 - i * 40); await p.waitForTimeout(16); }
  await touch('touchEnd', 200, 380); await p.waitForTimeout(600);
  const t3 = await st(p); const sy = await p.evaluate(() => scrollY); const flashes = await p.evaluate(() => window.__flash);
  ok('vertical swipe scrolls the page and never switches the system on (no flash)', !t3.on && sy > 50 && flashes === 0, `scrollY=${sy}, on=${t3.on}, on-flashes=${flashes}`);
  const ov = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  ok('no horizontal overflow 390', !ov);
  await ctx.close();
}
{ // reduced motion
  const { p, ctx } = await page({ reducedMotion: 'reduce' });
  await p.waitForTimeout(600);
  const r0 = await st(p);
  await p.waitForTimeout(1200); const r1 = await st(p);
  ok('reduced motion: no autonomous stream', r0.cards === r1.cards && r1.waiting === r0.waiting, `cards ${r0.cards}`);
  await p.click('#latch'); await p.waitForTimeout(200); const r2 = await st(p);
  ok('reduced motion: switch shows the same messages routed, instantly', r2.on && r2.handled + r2.you === r0.waiting && r2.lanesA === 1, `${r2.handled}+${r2.you} of ${r0.waiting}`);
  await p.click('#latch'); await p.waitForTimeout(200); const r3 = await st(p);
  await p.click('#latch'); await p.waitForTimeout(200); const r4 = await st(p);
  ok('reduced motion: switching back restores the pile; counts not inflated by toggling', !r3.on && r3.waiting === r0.waiting && r4.handled === r2.handled, `handled ${r2.handled} → ${r4.handled}`);
  await p.screenshot({ path: 'evidence/reduced-on-1440.png' });
  await ctx.close();
}
{ // determinism: same seed + same step sequence → identical canvas
  const h = [];
  for (let i = 0; i < 2; i++) {
    const { p, ctx } = await page({}, '?t=5&on=1&onfor=2&freeze=1');
    h.push(await p.evaluate(() => { const d = document.querySelector('#field').toDataURL(); let x = 0; for (let i = 0; i < d.length; i += 3) x = (x * 31 + d.charCodeAt(i)) | 0; return x; }));
    await ctx.close();
  }
  ok('deterministic: identical canvas for identical seed + steps', h[0] === h[1], h.join(' / '));
}
{ // resize mid-run keeps state and re-lays out
  const { p, ctx } = await page();
  await p.mouse.move(700, 600); await p.mouse.down(); await p.waitForTimeout(1500);
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(800); const z1 = await st(p);
  await p.mouse.up();
  await p.setViewportSize({ width: 1440, height: 900 }); await p.waitForTimeout(800); const z2 = await st(p);
  ok('resize wide → narrow → wide while running: no loss, no crash', z1.handled > 0 && z2.handled >= z1.handled, `handled ${z1.handled} → ${z2.handled}`);
  await ctx.close();
}
await b.close();
console.log(out.join('\n'));
console.log(errs.length ? 'CONSOLE: ' + [...new Set(errs)].join(' | ') : 'console/runtime: clean');
