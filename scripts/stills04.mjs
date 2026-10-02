// Writes the no-WebGL fallback stills (canvas only, no DOM) for both compositions.
import { chromium } from 'playwright-core';
import { readdirSync, writeFileSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
for (const [tag, w, h] of [['', 1600, 900], ['-tall', 780, 1688]]) for (const [n, p] of [['a', 0], ['b', 1]]) {
  const page = await (await browser.newContext({ viewport: { width: w, height: h } })).newPage();
  await page.goto(`http://localhost:5173/exp04.html?p=${p}`); await page.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 120000 }); await page.waitForTimeout(800);
  const d = await page.evaluate(() => document.getElementById('gl').toDataURL('image/jpeg', 0.86));
  writeFileSync(`src/exp04/still-${n}${tag}.jpg`, Buffer.from(d.split(',')[1], 'base64')); await page.close();
}
await browser.close();
