import { chromium } from 'playwright-core';
const [,, outDir, mode = 'reduce', ...vps] = process.argv;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const sizes = (vps.length ? vps : ['1440x900', '390x844']).map((s) => s.split('x').map(Number));
for (const [w, h] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: mode === 'reduce' ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('http://127.0.0.1:4174/', { waitUntil: 'networkidle' });
  // parcurge pagina pentru a aprinde zonele
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += Math.floor(h * 0.6)) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(mode === 'reduce' ? 60 : 350); }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(mode === 'reduce' ? 200 : 3000);
  await page.screenshot({ path: `${outDir}/full-${w}x${h}-${mode}.png`, fullPage: true });
  await page.screenshot({ path: `${outDir}/hero-${w}x${h}-${mode}.png` });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  console.log(w, h, 'overflowX', ov, 'errors', JSON.stringify(errors));
  await ctx.close();
}
await browser.close();
