// Deterministic press → hold → release frame sequence (fixed-step simulation advanced by hand; loop frozen).
// usage: node qa/sequence.mjs outdir [WxH] [dpr] [query]   (serve this directory on :8123)
import { chromium } from 'playwright-core';
import { readdirSync, mkdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const [dir = 'evidence/sequence', size = '1440x900', dpr = '1', q = 't=8'] = process.argv.slice(2);
mkdirSync(dir, { recursive: true });
const [width, height] = size.split('x').map(Number);
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
const p = await b.newPage({ viewport: { width, height }, deviceScaleFactor: Number(dpr) });
const errs = []; p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push(e.message));
await p.goto(`http://localhost:8123/index.html?${q}&freeze=1`);
await p.waitForFunction(() => document.body.dataset.ready === '1');
let now = 0;
const to = async (ms) => { const d = ms - now; if (d > 0) await p.evaluate((s) => window.__inb.ff(s), d / 1000); now = ms; await p.evaluate(() => window.__inb.draw()); };
const shot = (name) => p.screenshot({ path: `${dir}/${name}.png` });
const press = [0, 40, 80, 120, 200, 300, 400, 500, 650, 800, 1000, 1300, 2000, 3000];
await shot('press-0000-before');
await p.evaluate(() => window.__inb.hold(true));
for (const ms of press) { await to(ms); await shot(`press-${String(ms).padStart(4, '0')}`); }
await p.evaluate(() => window.__inb.hold(false));
const base = now;
for (const ms of [0, 100, 250, 500, 900, 1500, 3000, 6000]) { await to(base + ms); await shot(`release-${String(ms).padStart(4, '0')}`); }
const st = await p.evaluate(() => ({ ...window.__inb.field.stats, cards: window.__inb.field.cards.length }));
await b.close();
console.log(JSON.stringify(st), errs.length ? 'ERRORS: ' + errs.join(' | ') : 'console clean');
