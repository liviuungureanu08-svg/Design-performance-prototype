// Robustness pass: real wheel scrolling, reversal, reload mid-scroll, resize, fallback, resource counters.
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173/';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const errors = [];
const watch = (p) => { p.on('console', (m) => m.type() === 'error' && errors.push(m.text())); p.on('pageerror', (e) => errors.push(e.message)); };
const ok = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`);

// 1. wheel scrolling: slow, fast, reverse
let page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
watch(page);
await page.goto(base + '?debug', { waitUntil: 'load' });
await page.waitForTimeout(2500);
const before = await page.evaluate(() => window.__lab.info());
await page.mouse.move(640, 360);
for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(30); }   // slow-ish
const y1 = await page.evaluate(() => scrollY);
for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(8); }   // rapid
const y2 = await page.evaluate(() => scrollY);
for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, -700); await page.waitForTimeout(8); }  // reverse
const y3 = await page.evaluate(() => scrollY);
ok('wheel advances', y1 > 0 && y2 > y1, `(${y1} -> ${y2})`);
ok('reverse retreats', y3 < y2, `(${y2} -> ${y3})`);
await page.waitForTimeout(1500);
await page.screenshot({ path: 'shots/rb-after-reverse.png' });

// 2. reload at arbitrary scroll position
await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.45));
await page.waitForTimeout(500);
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(3500);
await page.screenshot({ path: 'shots/rb-reload-mid.png' });
ok('reload keeps scroll', (await page.evaluate(() => scrollY)) > 1000);

// 3. resize cycles + resource counters
for (const [w, h] of [[900, 1200], [1920, 1080], [600, 900], [1280, 720], [1000, 1000]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(250);
}
await page.screenshot({ path: 'shots/rb-resized.png' });
const after = await page.evaluate(() => window.__lab.info());
ok('no GPU resource growth across resize', after.memory.textures === before.memory.textures && after.memory.geometries === before.memory.geometries, JSON.stringify(after.memory));
await page.close();

// 4. portrait phone at start/mid/end
page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
watch(page);
await page.goto(base + '?debug', { waitUntil: 'load' });
await page.waitForTimeout(3500);
for (const u of [0, 0.5, 1]) { await page.evaluate((v) => window.__lab.set(v), u); await page.waitForTimeout(1200); await page.screenshot({ path: `shots/rb-phone-${u}.png` }); }
await page.close();

// 5. fallback path
page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
watch(page);
await page.goto(base + '?debug&fallback=1', { waitUntil: 'load' });
await page.waitForTimeout(2500);
const fb = await page.evaluate(() => window.__lab.info());
ok('fallback engages', fb.fallback === true);
await page.evaluate(() => window.__lab.set(0.4)); await page.waitForTimeout(600);
await page.screenshot({ path: 'shots/rb-fallback.png' });

console.log(errors.length ? 'console errors:\n' + errors.join('\n') : 'console clean');
await browser.close();
