// EXP04 determinism: GL canvas bytes at the same progress after different histories (via real scroll).
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const page = await (await browser.newContext({ viewport: { width: 960, height: 600 } })).newPage();
await page.goto(process.env.PAGEURL ?? 'http://localhost:5173/exp04.html'); await page.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 120000 });
await page.waitForTimeout(3500);
const total = await page.evaluate(() => document.querySelector('#track').offsetHeight - innerHeight);
const settle = async (y) => { await page.evaluate((y) => scrollTo(0, y), y); let prev = -1, same = 0; for (let i = 0; i < 80 && same < 6; i++) { await page.waitForTimeout(400); const v = await page.evaluate(() => document.body.dataset.p); same = v === prev ? same + 1 : 0; prev = v; } await page.waitForTimeout(1200); };
const gl = () => page.evaluate(() => { const s = document.getElementById('gl').toDataURL('image/png'); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; });
const res = [];
for (const f of [0, 0.5, 1, 0.5, 0, 1, 0.5]) { await settle(f * total); res.push([f, await gl()]); }
const byF = {}; res.forEach(([f, h]) => (byF[f] ??= new Set()).add(h));
console.log(Object.entries(byF).map(([f, s]) => `p=${f}: ${s.size === 1 ? 'IDENTICAL across ' + res.filter((r) => r[0] == f).length + ' visits (different histories)' : 'DIFFERENT (' + s.size + ' variants)'}`).join('\n'));
await browser.close();
