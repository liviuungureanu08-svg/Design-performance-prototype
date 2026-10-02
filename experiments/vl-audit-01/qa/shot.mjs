// Still capture. usage: node qa/shot.mjs "<query>" out.png [WxH] [dpr]   (serve this directory on :8123 first)
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const [q = '', out = 'shot.png', size = '1440x900', dpr = '1'] = process.argv.slice(2);
const [width, height] = size.split('x').map(Number);
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: Number(dpr) });
const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`http://localhost:8123/index.html?${q}`);
await p.waitForFunction(() => document.body.dataset.ready === '1');
await p.waitForTimeout(400);
await p.screenshot({ path: out, fullPage: process.env.FULL === '1' });
await b.close();
console.log(out, errs.length ? 'ERRORS: ' + errs.join(' | ') : 'clean');
