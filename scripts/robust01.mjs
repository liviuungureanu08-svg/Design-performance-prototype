// Experiment 01 robustness: real scroll (wheel) determinism, reverse, resize, reduced motion, viewports, console errors.
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const url = `http://localhost:${process.env.PORT ?? 5173}/exp01.html`;
const out = [];
const errs = [];
async function open(w, h, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, ...opts });
  const page = await ctx.newPage();
  page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 200)));
  page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
  await page.goto(url + (opts.q ?? ''));
  await page.waitForFunction(() => document.body.dataset.ready === '1');
  return page;
}
const hash = async (p) => createHash('md5').update(await p.screenshot()).digest('hex').slice(0, 8);
const settle = (p) => p.waitForTimeout(700);

// 1. determinism: same scroll -> identical pixels, regardless of path (forward, reverse, jump)
let page = await open(1440, 900);
await page.waitForTimeout(4800); // let the intro finish
const H = await page.evaluate(() => document.querySelector('#seq').offsetHeight - innerHeight);
const at = async (f) => { await page.evaluate((y) => scrollTo(0, y), Math.round(H * f)); await settle(page); return hash(page); };
const a1 = await at(0.6);
for (let i = 1; i <= 10; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(40); }
await at(0.95); await at(0.1);
const a2 = await at(0.6);
out.push(['determinism (0.6 forward vs after reverse/jumps)', a1 === a2 ? 'PASS' : `FAIL ${a1} ${a2}`]);
// 2. endpoints reachable, no horizontal overflow
out.push(['no horizontal overflow @1440', (await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)) ? 'PASS' : 'FAIL']);
const p1 = await page.evaluate(() => { scrollTo(0, 1e6); return 1; });
await page.waitForTimeout(500);
out.push(['page end reachable, write-yours present', (await page.evaluate(() => !!document.querySelector('#mine'))) ? 'PASS' : 'FAIL']);
// 3. brief switch resets and rebuilds
await page.click('.briefs button[data-id="freight"]'); await page.waitForTimeout(600);
out.push(['brief switch → scroll to sequence start, freight words', (await page.evaluate(() => scrollY < 50 && document.querySelector('.w') && document.body.dataset.brief === 'freight')) ? 'PASS' : 'FAIL']);
await page.close();
// 4. viewports (desktop sizes): overflow + surfaces inside viewport at p=1
for (const [w, h] of [[1280, 720], [1920, 1080], [1024, 768], [1366, 640]]) {
  const pg = await open(w, h, { q: '?p=1' });
  const r = await pg.evaluate(() => { const bad = []; document.querySelectorAll('.sf,.tag,.said,.cap .c').forEach((e) => { const b = e.getBoundingClientRect(); if (b.width && (b.right > innerWidth + 1 || b.bottom > innerHeight + 1 || b.left < -1)) bad.push(e.className + ':' + Math.round(b.bottom)); }); return bad; });
  out.push([`desktop ${w}x${h}: all parts inside viewport @p=1`, r.length ? 'FAIL ' + r.join(',') : 'PASS']);
  await pg.close();
}
// 5. mobile: overflow, reduced motion
for (const [w, h] of [[390, 844], [360, 740], [820, 1180]]) {
  const pg = await open(w, h, { isMobile: true, hasTouch: true });
  await pg.waitForTimeout(300);
  const ov = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  out.push([`mobile ${w}x${h}: horizontal overflow px`, ov <= 1 ? 'PASS (0)' : 'FAIL ' + ov]);
  await pg.close();
}
const rm = await open(1440, 900, { reducedMotion: 'reduce' });
await rm.waitForTimeout(500);
const rmr = await rm.evaluate(() => ({ p: document.body.dataset.p, sf: [...document.querySelectorAll('.sf')].every((e) => e.dataset.on === '1'), h: document.querySelector('#seq').offsetHeight <= innerHeight + 2 }));
out.push(['reduced motion: final state, all surfaces visible, no pinned scroll', rmr.p === '1.000' && rmr.sf && rmr.h ? 'PASS' : 'FAIL ' + JSON.stringify(rmr)]);
await rm.close();
console.table(out.map(([k, v]) => ({ check: k, result: v })));
console.log('console errors/warnings:', errs.length ? [...new Set(errs)].join(' | ') : 'none');
await browser.close();
