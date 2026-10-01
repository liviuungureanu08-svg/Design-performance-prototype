// usage: node scripts/seq.mjs "extra query" prefix u1,u2,... [WxH]  -> /tmp/claude-0/<prefix>-<u>.png and a contact sheet note
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const [q, prefix, list, size = '960x540'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 600)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto(`http://localhost:5173/?debug&noadapt&${q}`, { waitUntil: 'load' });
await page.waitForTimeout(2500);
for (const u of list.split(',')) {
  await page.evaluate((v) => window.__lab.set(Number(v)), u);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `/tmp/claude-0/${prefix}-${u}.png` });
}
console.log(errs.length ? [...new Set(errs)].slice(0, 4).join('\n') : 'console clean');
await browser.close();
