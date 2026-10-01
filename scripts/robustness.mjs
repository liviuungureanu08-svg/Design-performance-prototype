// usage: node scripts/robustness.mjs   (dev or preview server on PORT, default 5173). Software GL only.
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const url = `http://localhost:${process.env.PORT ?? 5173}/?debug&noadapt`;
const errs = [];
const res = [];
const ok = (n, c) => { const l = `${c ? 'PASS' : 'FAIL'} ${n}`; res.push(l); console.log(l); };
const page = await browser.newPage({ viewport: { width: 800, height: 450 } });
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 300)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto(url, { waitUntil: 'load' });
await page.waitForTimeout(3000);
const prog = () => page.evaluate(() => Math.round((scrollY / (document.documentElement.scrollHeight - innerHeight)) * 1000) / 1000);
for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(250); }
const slow = await prog(); ok(`slow wheel advances (${slow})`, slow > 0);
for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 1500); await page.waitForTimeout(40); }
await page.waitForTimeout(2500);
const end = await prog(); ok(`fast wheel reaches end (${end})`, end > 0.97);
await page.screenshot({ path: '/tmp/claude-0/s/rb-end.png' });
for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, -1500); await page.waitForTimeout(40); }
await page.waitForTimeout(2500);
const start = await prog(); ok(`reverse returns to start (${start})`, start < 0.03);
await page.evaluate(() => scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * 0.55));
await page.waitForTimeout(2500);
const a = await page.screenshot(); await page.waitForTimeout(1500); const b = await page.screenshot();
ok('pause mid-transition is stable', Buffer.compare(a, b) === 0 || a.length === b.length);
await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(3000);
const rl = await prog(); ok(`reload keeps position (${rl})`, rl > 0.4);
const m0 = await page.evaluate(() => window.__lab.info().memory);
for (const [w, h] of [[1000, 600], [400, 800], [1280, 720], [500, 900], [800, 450], [390, 844], [900, 500]]) { await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(700); }
const m1 = await page.evaluate(() => window.__lab.info().memory);
ok(`resize cycles: no GPU resource growth (${JSON.stringify(m0)} -> ${JSON.stringify(m1)})`, m1.textures <= m0.textures + 2 && m1.geometries <= m0.geometries);
await page.close();
const fb = await browser.newPage({ viewport: { width: 600, height: 400 } });
await fb.goto(url.replace('?debug', '?fallback=1&debug'), { waitUntil: 'load' }); await fb.waitForTimeout(800); const fbOk = await fb.evaluate(() => document.body.classList.contains('no-gl')); await fb.close(); ok('forced fallback shows poster', fbOk);

const rm = await browser.newPage({ viewport: { width: 600, height: 400 }, reducedMotion: 'reduce' });
await rm.goto(url, { waitUntil: 'load' }); await rm.waitForTimeout(2500);
ok('reduced-motion page renders', await rm.evaluate(() => !document.body.classList.contains('no-gl')));
ok(`console clean (${[...new Set(errs)].slice(0, 3).join(' | ')})`, errs.length === 0);
await browser.close();
