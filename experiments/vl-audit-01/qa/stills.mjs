// Final evidence stills. usage: node qa/stills.mjs  (serve on :8123)
import { chromium } from 'playwright-core';
import { readdirSync, mkdirSync } from 'node:fs';
const exe = readdirSync('/opt/pw-browsers').filter((d) => d.startsWith('chromium-')).map((d) => `/opt/pw-browsers/${d}/chrome-linux/chrome`)[0];
const b = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
mkdirSync('evidence/stills', { recursive: true });
const errs = [];
const set = [
  ['desktop-1440-off', 1440, 900, 1, 't=8'], ['desktop-1440-on', 1440, 900, 1, 't=8&on=1&onfor=4'],
  ['desktop-1440-lift-0.5s', 1440, 900, 1, 't=8&on=1&onfor=0.5'],
  ['desktop-1920-off', 1920, 1080, 1, 't=8'], ['desktop-1920-on', 1920, 1080, 1, 't=8&on=1&onfor=4'],
  ['laptop-1366x640-off', 1366, 640, 1, 't=8'], ['laptop-1366x640-on', 1366, 640, 1, 't=8&on=1&onfor=4'],
  ['tablet-820x1180-off', 820, 1180, 2, 't=8'], ['tablet-820x1180-on', 820, 1180, 2, 't=8&on=1&onfor=4'],
  ['phone-390x844-off', 390, 844, 2, 't=8'], ['phone-390x844-on', 390, 844, 2, 't=8&on=1&onfor=4'],
  ['phone-360x640-off', 360, 640, 2, 't=8'], ['phone-360x640-on', 360, 640, 2, 't=8&on=1&onfor=4'],
  ['hotel-1440-on', 1440, 900, 1, 'biz=hotel&t=8&on=1&onfor=4'], ['interiors-1440-on', 1440, 900, 1, 'biz=interiors&t=8&on=1&onfor=4'],
  ['roaster-1440-off', 1440, 900, 1, 'biz=roaster&t=8'], ['roaster-390-on', 390, 844, 2, 'biz=roaster&t=8&on=1&onfor=4'],
  ['reduced-1440-off', 1440, 900, 1, 'motion=reduced'], ['reduced-390-on', 390, 844, 2, 'motion=reduced&on=1'],
];
for (const [name, w, h, dpr, q] of set) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  p.on('pageerror', (e) => errs.push(name + ': ' + e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(name + ': ' + m.text()));
  await p.goto(`http://localhost:8123/index.html?${q}&freeze=1`); await p.waitForFunction(() => document.body.dataset.ready === '1'); await p.waitForTimeout(500);
  await p.screenshot({ path: `evidence/stills/${name}.png` }); await p.close();
}
for (const [name, w, h, dpr, q] of [['fullpage-1440-after-run', 1440, 900, 1, 't=8&on=1&onfor=4'], ['fullpage-390-after-run', 390, 844, 1, 't=8&on=1&onfor=4']]) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dpr });
  await p.goto(`http://localhost:8123/index.html?${q}&freeze=1`); await p.waitForFunction(() => document.body.dataset.ready === '1'); await p.waitForTimeout(700);
  await p.screenshot({ path: `evidence/stills/${name}.png`, fullPage: true }); await p.close();
}
await b.close(); console.log(errs.length ? errs.join('\n') : 'stills: console clean');
