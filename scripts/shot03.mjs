// Experiment 03 still capture: waits until every image on the page has converged, then screenshots.
// usage: node scripts/shot03.mjs "<query>" out.png [WxH]      (dev server on :5173 or PORT; URL path via PAGEURL)
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const [q, out, size = '1600x900'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(process.env.DPR ?? 1) });
const errs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 600)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
const t0 = Date.now();
await page.goto(process.env.PAGEURL ?? `http://localhost:${process.env.PORT ?? 5173}/exp03.html?${q}`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 900_000, polling: 500 }).catch(() => errs.push('timeout'));
await page.screenshot({ path: out });
console.log(out, ((Date.now() - t0) / 1000).toFixed(1) + 's', errs.length ? [...new Set(errs)].slice(0, 4).join('\n') : 'console clean');
await browser.close();
