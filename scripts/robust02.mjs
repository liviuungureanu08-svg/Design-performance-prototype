// Robustness pass on the packed Experiment 02 preview: real scrolling (slow, fast, pause, reverse), resize, portrait, console, GPU memory.
// usage: (python3 -m http.server 8099 -d artifact &) ; node scripts/robust02.mjs
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const out = '/tmp/claude-0/s/rb02';
const errs = [];
const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 300)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto('http://localhost:8099/exp02.html?debug&dtmax=3', { waitUntil: 'load' });
await page.waitForTimeout(5000);
const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const mem0 = await page.evaluate(() => window.__lab.info());
const to = async (f, wait) => { await page.evaluate((y) => scrollTo(0, y), Math.round(max * f)); await page.waitForTimeout(wait); };
for (let f = 0; f <= 1.001; f += 0.1) await to(f, 900);            // slow forward
await page.waitForTimeout(9000); await page.screenshot({ path: `${out}-fwd-end.png` });
await to(0.5, 9000); await page.screenshot({ path: `${out}-pause-mid.png` }); // jump + pause
for (let f = 1; f >= -0.001; f -= 0.25) await to(f, 60);           // fast reverse
await page.waitForTimeout(9000); await page.screenshot({ path: `${out}-rev-start.png` });
await to(1, 40); await to(0, 40); await to(0.62, 40);              // flick
await page.setViewportSize({ width: 700, height: 900 }); await page.waitForTimeout(9000);
await page.screenshot({ path: `${out}-resize.png` });
const mem1 = await page.evaluate(() => window.__lab.info());
const p = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
p.on('pageerror', (e) => errs.push('phone pageerror ' + e.message));
await p.goto('http://localhost:8099/exp02.html?dtmax=3', { waitUntil: 'load' }); await p.waitForTimeout(5000);
await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await p.waitForTimeout(10000);
await p.screenshot({ path: `${out}-phone-end.png` });
const rm = await browser.newPage({ viewport: { width: 900, height: 600 }, reducedMotion: 'reduce' });
rm.on('pageerror', (e) => errs.push('rm pageerror ' + e.message));
await rm.goto('http://localhost:8099/exp02.html?dtmax=3', { waitUntil: 'load' }); await rm.waitForTimeout(4000);
await rm.evaluate(() => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.5)); await rm.waitForTimeout(8000);
await rm.screenshot({ path: `${out}-reduced.png` });
console.log(JSON.stringify({ mem0, mem1 }), '\n', errs.length ? [...new Set(errs)].join('\n') : 'console clean');
await browser.close();
