// Visual verification: renders the experience at fixed progress values in real Chromium.
// usage: node scripts/shots.mjs [url] [u1,u2,...] [WxH]
import { chromium } from 'playwright-core';
import { mkdirSync, readdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173/';
const us = (process.argv[3] ?? '0,0.2,0.3,0.4,0.5,0.6,0.7,0.8,1').split(',').map(Number);
const [w, h] = (process.argv[4] ?? '1600x900').split('x').map(Number);
const exe = process.env.CHROMIUM ?? readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];

mkdirSync('shots', { recursive: true });
const browser = await chromium.launch({
  executablePath: exe,
  args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: w, height: h } });
const errors = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errors.push(`${m.type()}: ${m.text()}`));
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
await page.goto(`${base}${base.includes('?') ? '&' : '?'}debug`, { waitUntil: 'load' });
await page.waitForTimeout(3500);
console.log('info', JSON.stringify(await page.evaluate(() => window.__lab?.info())));
for (const u of us) {
  await page.evaluate((v) => window.__lab.set(v), u);
  await page.waitForTimeout(900);
  const f = `shots/u${String(Math.round(u * 1000)).padStart(4, '0')}.png`;
  await page.screenshot({ path: f });
  console.log('shot', f);
}
console.log(errors.length ? errors.join('\n') : 'console clean');
await browser.close();
