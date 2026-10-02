// EXP04 robustness: real scroll, reverse/jump determinism, resize, reduced motion, console. usage: node scripts/robust04.mjs
import { chromium } from 'playwright-core';
import { readdirSync, mkdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const URL = process.env.PAGEURL ?? 'http://localhost:5173/exp04.html';
const out = [];
const errs = [];
async function run(name, opts, fn) {
  const ctx = await browser.newContext(opts); const page = await ctx.newPage();
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(`${name}: ` + m.text().slice(0, 300)));
  page.on('pageerror', (e) => errs.push(`${name}: pageerror ` + e.message));
  await page.goto(URL + (opts.q ?? ''), { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 120000 });
  await page.waitForTimeout(3200); // let the load-sway finish
  await fn(page); await ctx.close();
}
const shot = async (page, f) => { await page.waitForTimeout(1500); return page.screenshot(); };
const hash = (b) => { let h = 0; for (let i = 0; i < b.length; i += 7) h = (h * 31 + b[i]) | 0; return h; };
const settle = async (page, y) => {
  await page.evaluate((y) => scrollTo(0, y), y);
  let prev = -1, same = 0;
  for (let i = 0; i < 80 && same < 3; i++) { await page.waitForTimeout(400); const v = await page.evaluate(() => document.body.dataset.p); same = v === prev ? same + 1 : 0; prev = v; }
  await page.waitForTimeout(300);
};

await run('scroll', { viewport: { width: 1280, height: 720 } }, async (page) => {
  const total = await page.evaluate(() => document.querySelector('#track').offsetHeight - innerHeight);
  const seq = {};
  for (const f of [0, 0.25, 0.5, 0.75, 1, 0.5, 0.25, 0]) {
    await settle(page, f * total); const b = await page.screenshot(); const P = await page.evaluate(() => document.body.dataset.p);
    (seq[f] ??= []).push({ h: hash(b), P });
  }
  const det = [0, 0.25, 0.5].map((f) => `${f}: fwd=${seq[f][0].P} rev=${seq[f][1].P} ${seq[f][0].h === seq[f][1].h ? 'IDENTICAL' : 'DIFF'}`);
  // jump: straight 0 -> 0.9 -> 0.1 vs stepwise
  await settle(page, 0.9 * total); const j1 = hash(await page.screenshot());
  await settle(page, 0.1 * total); const j2 = hash(await page.screenshot());
  await settle(page, 0); await settle(page, 0.1 * total); const j3 = hash(await page.screenshot());
  out.push('determinism fwd/rev: ' + det.join(' | '));
  out.push('jump 0->0.9->0.1 equals direct 0->0.1: ' + (j2 === j3));
  const ok = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
  out.push('horizontal overflow: ' + (ok.sw > ok.iw ? 'YES ' + JSON.stringify(ok) : 'none'));
  // resize mid-way across the layout switch
  await settle(page, 0.6 * total);
  await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(2500);
  const r1 = await page.evaluate(() => document.body.dataset.p);
  await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(2500);
  const r2 = await page.evaluate(() => document.body.dataset.p);
  out.push(`resize wide->tall->wide keeps progress: p=${r1} -> ${r2}`);
});
await run('reduced', { viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' }, async (page) => {
  const h = await page.evaluate(() => document.querySelector('#track').offsetHeight / innerHeight);
  const a = hash(await shot(page)); await page.click('button[data-p="1"]'); await page.waitForTimeout(800);
  const b = hash(await shot(page)); const vis = await page.evaluate(() => getComputedStyle(document.querySelector('#panel')).visibility);
  out.push(`reduced motion: track height ${h.toFixed(2)}vh-units (no scroll-pin), toggle changes frame: ${a !== b}, panel ${vis}`);
});
await browser.close();
console.log(out.join('\n')); console.log(errs.length ? 'CONSOLE: ' + [...new Set(errs)].slice(0, 5).join('\n') : 'console/runtime: clean');
