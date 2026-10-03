// Render-review harness: screenshots at timeline positions + console capture.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
const PAGE = process.env.PAGE || 'http://127.0.0.1:4177/?hq';
const OUT = process.env.OUT || new URL('./shots/', import.meta.url).pathname;
const W = +(process.env.W || 1440), H = +(process.env.H || 900);
const TS = (process.env.TS || '0,0.3,1.3,1.75,2.2,2.7,3.6,3.9,4.25,4.6,5.2,5.6,5.9,6.6,7.8').split(',').map(Number);
const reduced = process.env.REDUCED === '1';
const mobile = process.env.MOBILE === '1';
import fs from 'fs';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, reducedMotion: reduced ? 'reduce' : 'no-preference', hasTouch: mobile, isMobile: mobile });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
await page.goto(PAGE, { waitUntil: 'networkidle' });
await page.waitForTimeout(+(process.env.INTRO || 14000));
const tag = process.env.TAG || (mobile ? 'mobile' : 'desktop') + (reduced ? '-reduced' : '');
for (const t of TS) {
  const y = await page.evaluate((t) => window.__lamella.yFor(t), t);
  await page.evaluate((y) => window.scrollTo(0, y), y);
  for (let k = 0; k < 80; k++) {
    const d = await page.evaluate((t) => Math.abs(window.__lamella.t - t), t);
    if (d < 0.003) break;
    await page.waitForTimeout(250);
  }
  if (process.env.MOVE === '1') {
    for (let k = 0; k < 14; k++) { await page.mouse.move(W * (0.35 + k * 0.03), H * (0.35 + Math.sin(k * 0.5) * 0.08)); await page.waitForTimeout(60); }
  }
  await page.waitForTimeout(+(process.env.SETTLE || 2200));
  await page.screenshot({ path: `${OUT}/${tag}-t${t.toFixed(2)}.jpg`, type: 'jpeg', quality: 84 });
  console.log('shot', t);
}
const q = await page.evaluate(() => ({ q: window.__lamella.quality, gl: (() => { const c = document.createElement('canvas').getContext('webgl2'); const d = c.getExtension('WEBGL_debug_renderer_info'); return d ? c.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'n/a'; })() }));
console.log(JSON.stringify(q));
fs.writeFileSync(`${OUT}/${tag}-console.txt`, logs.join('\n') + '\n');
console.log(logs.join('\n'));
await browser.close();
