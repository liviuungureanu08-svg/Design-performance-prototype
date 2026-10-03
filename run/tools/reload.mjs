// B6 — încărcare rece + reîncărcare: erori runtime, resurse lipsă, layout shift (CLS din PerformanceObserver).
import { chromium } from 'playwright-core';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('response', (r) => { if (r.status() >= 400) errs.push(`${r.status()} ${r.url()}`); });
await p.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
for (const label of ['cold', 'reload']) {
  if (label === 'cold') await p.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' }); else await p.reload({ waitUntil: 'networkidle' });
  for (let y = 0; y < 9000; y += 500) { await p.evaluate((yy) => scrollTo(0, yy), y); await p.waitForTimeout(120); }
  const cls = await p.evaluate(() => window.__cls);
  console.log(`${label}: CLS(scroll complet)=${cls.toFixed(4)} erori=${JSON.stringify(errs)}`);
}
await b.close();
