import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const b = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const p = await b.newPage({ viewport: { width: 390, height: 844 } });
await p.goto('http://localhost:5173/?debug&q=balanced');
await p.waitForTimeout(3500);
for (const u of [0, 0.5, 1]) { await p.evaluate((v) => window.__lab.set(v), u); await p.waitForTimeout(1200); await p.screenshot({ path: `shots/phone-${u}.png` }); }
await b.close();
