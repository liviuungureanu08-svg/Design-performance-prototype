// usage: node scripts/seq.mjs "<extra query>" prefix u1,u2,... [WxH]  -> /tmp/claude-0/s/<prefix>-<u>.png  (dev server on :5173)
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const [q, prefix, list, size = '960x540'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(process.env.DPR ?? 1) });
const errs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 900)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto(`http://localhost:${process.env.PORT ?? 5173}/${process.env.PAGE ?? ""}?debug&noadapt&${q}`, { waitUntil: 'load' });
await page.waitForTimeout(4000);
if (process.env.HIDE) await page.evaluate((h) => h.split(',').forEach((n) => (window.__lab.world[n].visible = false)), process.env.HIDE);
for (const u of list.split(',')) {
  await page.evaluate((v) => window.__lab.set(Number(v)), u);
  await page.waitForTimeout(Number(process.env.WAIT ?? 900));
  await page.screenshot({ path: `/tmp/claude-0/s/${prefix}-${u}.png` });
}
console.log(errs.length ? [...new Set(errs)].slice(0, 4).join('\n') : 'console clean');
await browser.close();
