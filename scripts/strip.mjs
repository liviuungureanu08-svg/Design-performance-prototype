// usage: node scripts/strip.mjs "<query>" prefix from to step [WxH]  -> labelled contact sheet /tmp/claude-0/s/<prefix>-strip.png
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
const [q, prefix, a, b, st, size = '480x270'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 400)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto(`http://localhost:5173/?debug&noadapt&${q}`, { waitUntil: 'load' });
await page.waitForTimeout(3500);
const files = [];
for (let u = Number(a); u <= Number(b) + 1e-6; u += Number(st)) {
  const v = Math.round(u * 1000) / 1000;
  await page.evaluate((x) => window.__lab.set(x), v);
  await page.waitForTimeout(500);
  const f = `/tmp/claude-0/s/${prefix}-${v}.png`;
  await page.screenshot({ path: f });
  files.push(f);
}
await browser.close();
execSync(`python3 scripts/sheet.py /tmp/claude-0/s/${prefix}-strip.png 4 ${files.join(' ')} --label`);
console.log(errs.length ? [...new Set(errs)].slice(0, 3).join('\n') : 'console clean');
