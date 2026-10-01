// usage: node scripts/view.mjs "<query>" out.png [WxH]
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const [q, out, size = '1280x720'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 1500)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto(`http://localhost:${process.env.PORT ?? 5173}/?noadapt&${q}`, { waitUntil: 'load' });
await page.waitForTimeout(2500);
await page.screenshot({ path: out });
console.log(errs.length ? [...new Set(errs)].slice(0, 4).join('\n') : 'console clean');
await browser.close();
