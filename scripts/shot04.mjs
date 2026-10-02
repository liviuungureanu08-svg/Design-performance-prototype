// EXP04 stills: node scripts/shot04.mjs "<query>" out.png [WxH]   (dev server :5173 or PAGEURL; DPR env)
import { chromium } from 'playwright-core';
import { readdirSync } from 'node:fs';
const [q, out, size = '1600x900'] = process.argv.slice(2);
const [w, h] = size.split('x').map(Number);
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: Number(process.env.DPR ?? 1), hasTouch: !!process.env.TOUCH, isMobile: !!process.env.TOUCH, reducedMotion: process.env.RM ? 'reduce' : 'no-preference' });
const page = await ctx.newPage();
const errs = [];
page.on('console', (m) => ['error', 'warning'].includes(m.type()) && errs.push(m.text().slice(0, 500)));
page.on('pageerror', (e) => errs.push('pageerror ' + e.message));
await page.goto(process.env.PAGEURL ?? `http://localhost:${process.env.PORT ?? 5173}/exp04.html?${q}`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 120000, polling: 300 }).catch(() => errs.push('timeout'));
await page.waitForTimeout(Number(process.env.WAIT ?? 600));
await page.screenshot({ path: out });
console.log(out, errs.length ? [...new Set(errs)].slice(0, 4).join('\n') : 'console clean');
await browser.close();
