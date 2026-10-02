// Experiment 01 still capture. usage: node scripts/shot01.mjs out.png "<query e.g. p=0.5&brief=freight>" [WxH] [scrollY]
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const [out, q = '', size = '1440x900', sy] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: Number(process.env.DPR ?? 1), isMobile: w < 700, hasTouch: w < 700 });
const errs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 400)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto(`http://localhost:${process.env.PORT ?? 5173}/exp01.html?${q}`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.ready === '1');
if (sy) { await page.evaluate((y) => scrollTo(0, y), Number(sy)); }
await page.waitForTimeout(Number(process.env.WAIT ?? 600));
await page.screenshot({ path: out, fullPage: process.env.FULL === '1' });
console.log(out, errs.length ? [...new Set(errs)].slice(0, 5).join('\n') : 'console clean');
await browser.close();
