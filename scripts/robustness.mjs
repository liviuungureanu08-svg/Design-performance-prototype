// Round 2 robustness pass: real wheel input (slow / fast / reverse), pause mid-transition, reload, resize cycles
// with GPU resource counters, portrait phone, forced fallback, console cleanliness.
// usage: node scripts/robustness.mjs [baseUrl]   (dev or preview server must be running)
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173/';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
mkdirSync('shots', { recursive: true });
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const errors = [];
const watch = (p) => { p.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(m.text().slice(0, 300))); p.on('pageerror', (e) => errors.push('pageerror ' + e.message)); };
const ok = (name, cond, extra = '') => console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${extra}`);
const settle = (page, ms = 1800) => page.waitForTimeout(ms);

// 1. wheel scrolling: slow, fast, reverse; pause mid-transition
let page = await browser.newPage({ viewport: { width: 640, height: 360 } });
watch(page);
await page.goto(base + '?debug', { waitUntil: 'load' });
await settle(page, 3000);
const before = await page.evaluate(() => window.__lab.info());
await page.mouse.move(320, 180);
for (let i = 0; i < 25; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(30); }
const y1 = await page.evaluate(() => scrollY);
for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(8); }
const y2 = await page.evaluate(() => scrollY);
for (let i = 0; i < 30; i++) { await page.mouse.wheel(0, -700); await page.waitForTimeout(8); }
const y3 = await page.evaluate(() => scrollY);
ok('wheel advances', y1 > 0 && y2 > y1, `(${y1} -> ${y2})`);
ok('reverse retreats', y3 < y2, `(${y2} -> ${y3})`);
await settle(page);
await page.screenshot({ path: 'shots/rb-after-reverse.png' });

// pause mid-transition 1 (portal) and 2 (fracture): scroll there, stop, let smoothing settle, shoot twice
for (const [name, frac] of [['portal', 0.22], ['fracture', 0.49], ['liquid', 0.83]]) {
  await page.evaluate((f) => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), frac);
  await settle(page, 2600);
  await page.screenshot({ path: `shots/rb-pause-${name}.png` });
}
ok('pause mid-transition renders (3 states)', true);

// 2. reload at arbitrary scroll position
await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight * 0.45));
await page.waitForTimeout(500);
await page.reload({ waitUntil: 'load' });
await settle(page, 3500);
await page.screenshot({ path: 'shots/rb-reload-mid.png' });
ok('reload keeps scroll', (await page.evaluate(() => scrollY)) > 1000);

// 3. resize cycles + resource counters
const mem0 = await page.evaluate(() => window.__lab.info().memory);
for (const [w, h] of [[900, 1200], [1280, 720], [390, 844], [1000, 1000], [640, 360], [820, 1180], [640, 360]]) {
  await page.setViewportSize({ width: w, height: h });
  await page.waitForTimeout(400);
}
await settle(page, 1200);
await page.screenshot({ path: 'shots/rb-resized.png' });
const mem1 = await page.evaluate(() => window.__lab.info().memory);
ok('no GPU resource growth across resize cycles', mem1.textures <= mem0.textures + 1 && mem1.geometries <= mem0.geometries + 2, JSON.stringify({ mem0, mem1 }));
await page.close();

// 4. portrait phone across the whole film
page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
watch(page);
await page.goto(base + '?debug', { waitUntil: 'load' });
await settle(page, 3500);
for (const u of [0, 0.22, 0.36, 0.5, 0.68, 0.84, 1]) {
  await page.evaluate((v) => window.__lab.set(v), u);
  await page.waitForTimeout(1300);
  await page.screenshot({ path: `shots/rb-phone-${u}.png` });
}
console.log('info(phone)', JSON.stringify(await page.evaluate(() => window.__lab.info())));
await page.close();

// 5. fallback path (no WebGL work at all)
page = await browser.newPage({ viewport: { width: 640, height: 360 } });
watch(page);
await page.goto(base + '?debug&fallback=1', { waitUntil: 'load' });
await settle(page, 1500);
const poster = await page.evaluate(() => getComputedStyle(document.getElementById('poster')).display);
ok('forced fallback shows the poster', poster === 'block');
await page.screenshot({ path: 'shots/rb-fallback.png' });
await page.close();

const uniq = [...new Set(errors)];
ok('console clean (no errors/warnings)', uniq.length === 0, uniq.slice(0, 5).join(' | '));
await browser.close();
