// Functional verification: interactions, reduced motion, overflow, scroll reversal, console.
import { chromium } from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const PAGE = process.env.PAGE || 'http://127.0.0.1:4177/';
const OUT = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const results = [];
const ok = (name, pass, detail = '') => { results.push(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

async function session(opts, fn) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(`[${m.type()}] ${m.text()}`); });
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
  await page.goto(PAGE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(8000);
  await fn(page);
  await ctx.close();
  return logs;
}
const settle = async (page, t) => {
  for (let k = 0; k < 80; k++) { const d = await page.evaluate((t) => Math.abs(window.__lamella.t - t), t); if (d < 0.01) return true; await page.waitForTimeout(200); }
  return false;
};
const goT = async (page, t) => { const y = await page.evaluate((t) => window.__lamella.yFor(t), t); await page.evaluate((y) => window.scrollTo(0, y), y); };

// ---------------- desktop interactions
const dLogs = await session({ viewport: { width: 1280, height: 800 } }, async (page) => {
  ok('desktop: WebGL world created', await page.evaluate(() => !!window.__lamella.world));
  ok('desktop: hero headline revealed', await page.evaluate(() => document.querySelector('.hero-block').classList.contains('on')));
  // pointer → trail deposits
  for (let k = 0; k < 20; k++) { await page.mouse.move(300 + k * 30, 300 + k * 8); await page.waitForTimeout(40); }
  await page.waitForTimeout(600);
  const trail = await page.evaluate(() => window.__lamella.world.trail.filter((v) => v.w > 0).length);
  ok('desktop: pointer movement deposits presence trail', trail > 3, `${trail} live samples`);
  const head = await page.evaluate(() => window.__lamella.world.u.uHead.value.z);
  ok('desktop: presence head active while pointer inside', head > 0.5, `strength ${head.toFixed(2)}`);
  // click ripple
  await page.mouse.click(640, 300);
  const rip = await page.evaluate(() => window.__lamella.world.ripples.filter((v) => v.w > 0).length);
  ok('desktop: click emits ripple', rip >= 1);
  // nav jump
  await page.click('.nav a[data-t="5.5"]');
  const want = await page.evaluate(() => window.__lamella.yFor(5.5));
  for (let k = 0; k < 60; k++) { if (Math.abs((await page.evaluate(() => window.scrollY)) - want) < 4) break; await page.waitForTimeout(250); }
  const y = await page.evaluate(() => window.scrollY);
  ok('desktop: nav "Commissions" scrolls to scene reading position', Math.abs(y - want) < 4, `scrollY ${Math.round(y)} target ${Math.round(want)}`);
  await settle(page, 5.5);
  await page.waitForTimeout(1500);
  ok('desktop: commissions list visible', await page.evaluate(() => document.querySelector('.works').classList.contains('on')));
  // hover works
  const box = await page.locator('.work[data-work="2"]').boundingBox();
  await page.mouse.move(box.x + 40, box.y + box.height / 2);
  await page.waitForTimeout(1500);
  const wk = await page.evaluate(() => ({ b: window.__lamella.world.u.uWorkB.value, active: document.querySelector('.work.active')?.dataset.work }));
  ok('desktop: hovering commission III switches wall programme', wk.b === 2 && wk.active === '2', JSON.stringify(wk));
  // keyboard focus
  await page.mouse.move(1000, 700);
  await page.focus('.work[data-work="3"]');
  await page.waitForTimeout(1500);
  ok('desktop: keyboard focus selects commission', await page.evaluate(() => window.__lamella.world.u.uWorkB.value === 3));
  // sound toggle
  await page.click('#sound');
  ok('desktop: sound toggle on', (await page.getAttribute('#sound', 'aria-pressed')) === 'true');
  await page.click('#sound');
  ok('desktop: sound toggle off', (await page.getAttribute('#sound', 'aria-pressed')) === 'false');
  // form
  await goT(page, 7.6); await settle(page, 7.6); await page.waitForTimeout(1500);
  await page.fill('#brief-space', 'A lobby in Lisbon');
  await page.click('.go');
  const msg = await page.textContent('.brief-ok');
  ok('desktop: commission form responds', /Noted/.test(msg), msg);
  // overflow
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('desktop: no horizontal overflow', ov <= 0, `${ov}px`);
  // scroll reversal / fast scroll — t must stay finite and converge
  const ys = [0, 9000, 2000, 14000, 500];
  for (const yy of ys) { await page.evaluate((y) => window.scrollTo(0, y), yy); await page.waitForTimeout(120); }
  const tNow = await page.evaluate(() => window.__lamella.t);
  ok('desktop: rapid scroll reversal keeps timeline finite', Number.isFinite(tNow), `t=${tNow.toFixed(3)}`);
  const perf = await page.evaluate(() => window.__lamella.perf);
  ok('desktop: JS per-frame cost recorded', true, `avg ${perf.jsMs.toFixed(2)} ms, recent max ${perf.jsMax.toFixed(2)} ms (SwiftShader, includes GL command submission)`);
});

// ---------------- reduced motion
const rLogs = await session({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' }, async (page) => {
  ok('reduced: html.reduced set', await page.evaluate(() => document.documentElement.classList.contains('reduced')));
  const intro = await page.evaluate(() => window.__lamella.world.u.uIntro.value);
  ok('reduced: intro sweep skipped', intro < -0.3, `uIntro ${intro}`);
  const idle = await page.evaluate(() => window.__lamella.world.u.uIdle.value);
  ok('reduced: ambient motion disabled', idle === 0);
  await goT(page, 3.7);
  await page.waitForTimeout(2500);
  const t = await page.evaluate(() => window.__lamella.t);
  ok('reduced: scene snaps to discrete hold state (no camera flight)', Math.abs(t - 3.8) < 1e-6, `t=${t}`);
  await page.screenshot({ path: `${OUT}/shots-reduced/reduced-nave.png` });
  await goT(page, 4.6); await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/shots-reduced/reduced-aperture.png` });
  await goT(page, 5.7); await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/shots-reduced/reduced-works.png` });
  ok('reduced: works text visible at hold', await page.evaluate(() => document.querySelector('.works').classList.contains('on')));
});

// ---------------- mobile touch
const mLogs = await session({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, async (page) => {
  ok('mobile: portrait grid used', await page.evaluate(() => window.__lamella.world.portrait && window.__lamella.world.plateCount === 2816));
  await page.touchscreen.tap(200, 300);
  await page.waitForTimeout(300);
  const rip = await page.evaluate(() => window.__lamella.world.ripples.filter((v) => v.w > 0).length);
  ok('mobile: tap reaches the wall', rip >= 1);
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok('mobile: no horizontal overflow', ov <= 0, `${ov}px`);
  const cur = await page.evaluate(() => getComputedStyle(document.querySelector('.cursor')).display);
  ok('mobile: custom cursor hidden on touch', cur === 'none');
  ok('mobile: nav hidden, readout shown', await page.evaluate(() => getComputedStyle(document.querySelector('.nav')).display === 'none' && getComputedStyle(document.querySelector('.readout')).display !== 'none'));
});

const all = [['desktop', dLogs], ['reduced', rLogs], ['mobile', mLogs]];
for (const [k, l] of all) ok(`${k}: console errors/warnings`, l.length === 0, l.join(' | ') || 'none');
const txt = results.join('\n') + '\n';
fs.writeFileSync(`${OUT}/verify-results.txt`, txt);
console.log(txt);
await browser.close();
