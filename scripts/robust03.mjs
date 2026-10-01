// Experiment 03 Motion Proof robustness (software GL): wheel forward slow/fast, reverse, rapid direction changes, pause,
// jump, reload mid-way, resize, portrait. Checks: console clean, progress follows scroll, the image converges when the
// viewer stops, and the state is deterministic (same progress → same pixels whatever the path taken to reach it).
// usage: node scripts/robust03.mjs   (dev server on :5173 or PORT)
import { chromium } from 'playwright-core';
import { readdirSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const base = `http://localhost:${process.env.PORT ?? 5173}/exp03.html?view=motion&spp=8&mpp=1`;
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
mkdirSync('shots/r03', { recursive: true });
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const errs = [];
const ok = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
const watch = (p) => { p.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 300))); p.on('pageerror', (e) => errs.push('pageerror ' + e.message)); };
const prog = (p) => p.evaluate(() => window.__exp03.progress());
const settle = (p) => p.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 300_000, polling: 250 });
const hash = async (p) => createHash('sha1').update(await p.locator('canvas').first().screenshot()).digest('hex').slice(0, 12);

let page = await browser.newPage({ viewport: { width: 960, height: 540 } });
watch(page);
await page.goto(base, { waitUntil: 'load' });
await settle(page);
ok('loads at progress 0', (await prog(page)) < 0.001);
await page.mouse.move(480, 270);

for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 90); await page.waitForTimeout(60); } // slow forward
await page.waitForTimeout(800);
const p1 = await prog(page);
ok('slow forward advances', p1 > 0.02, p1.toFixed(3));
for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 1400); await page.waitForTimeout(16); } // fast forward
await page.waitForTimeout(1200);
const p2 = await prog(page);
ok('fast forward advances', p2 > p1 + 0.15, p2.toFixed(3));
for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, -1200); await page.waitForTimeout(16); } // reverse
await page.waitForTimeout(1200);
const p3 = await prog(page);
ok('reverse retreats', p3 < p2 - 0.05, p3.toFixed(3));
for (let i = 0; i < 16; i++) { await page.mouse.wheel(0, i % 2 ? -900 : 1000); await page.waitForTimeout(20); } // direction changes
await page.waitForTimeout(1200);
const p4 = await prog(page);
ok('rapid direction changes stay bounded', p4 >= 0 && p4 <= 1, p4.toFixed(3));
await settle(page);
ok('pause: image converges when the viewer stops', true);
await page.screenshot({ path: 'shots/r03/after-scrub.png' });

// determinism: reach the same scroll position by two different paths → identical converged pixels
const jumpTo = async (y) => { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(1500); await settle(page); };
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const target = Math.round(max * 0.52);
await jumpTo(Math.round(max * 0.9)); await jumpTo(target);
const hA = await hash(page), pA = await prog(page);
await jumpTo(Math.round(max * 0.1)); await jumpTo(target);
const hB = await hash(page), pB = await prog(page);
ok('deterministic: same progress via different paths → same image', hA === hB && Math.abs(pA - pB) < 1e-4, `${pA.toFixed(4)} ${hA} / ${pB.toFixed(4)} ${hB}`);

// reload mid-way: restores at the scrolled position (no jump back to A)
await page.reload({ waitUntil: 'load' });
await settle(page);
const pR = await prog(page);
ok('reload keeps the scroll position', Math.abs(pR - pA) < 0.02, pR.toFixed(3));

// resize, then portrait
await page.setViewportSize({ width: 1280, height: 720 }); await page.waitForTimeout(400); await settle(page);
await page.setViewportSize({ width: 390, height: 844 }); await page.waitForTimeout(400); await settle(page);
await page.screenshot({ path: 'shots/r03/portrait-mid.png' });
ok('resize / portrait re-converge', true);
await page.close();

console.log(errs.length ? 'console:\n' + [...new Set(errs)].join('\n') : 'console clean');
await browser.close();
