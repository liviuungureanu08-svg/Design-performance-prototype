// B2/B3/B4/B6 — verificări funcționale reale în Chromium (Playwright).
// Rulare: node functional.mjs ../evidence/functional   (serverul preview pe 4174)
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const OUT = process.argv[2] || '../evidence/functional';
fs.mkdirSync(OUT, { recursive: true });
const SITE = 'http://127.0.0.1:4174/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const results = [];
const check = (name, ok, detail = '') => { results.push({ name, ok: Boolean(ok), detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`); };

async function open(vp, opts = {}) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: opts.reduce ? 'reduce' : 'no-preference', recordVideo: opts.video ? { dir: OUT, size: vp } : undefined });
  const page = await ctx.newPage();
  const errors = [];
  const requests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', (r) => requests.push(r.url()));
  page.on('requestfailed', (r) => errors.push('requestfailed ' + r.url()));
  await page.clock.setFixedTime(new Date(opts.now || '2026-10-03T12:00:00'));
  await page.goto(SITE, { waitUntil: 'networkidle' });
  return { ctx, page, errors, requests };
}

/* ---------- desktop: navigație, CTA, meniu, degustare, seara, formular ---------- */
{
  const { ctx, page, errors, requests } = await open({ width: 1440, height: 900 }, { video: true });

  // toate ancorele interne au țintă existentă
  const anchors = await page.$$eval('a[href^="#"]', (as) => as.map((a) => a.getAttribute('href')));
  const missing = await page.evaluate((hs) => hs.filter((h) => h.length > 1 && !document.getElementById(h.slice(1))), anchors);
  check('Ancore: fiecare link intern are țintă', missing.length === 0, `${anchors.length} linkuri, lipsă: ${JSON.stringify(missing)}`);
  const external = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')).filter((h) => !h.startsWith('#')));
  check('Fără linkuri externe / moarte', external.length === 0, JSON.stringify(external));

  for (const id of ['foc', 'meniu', 'degustare', 'spatiu', 'contact']) {
    await page.click(`#nav a[href="#${id}"]`);
    await page.waitForTimeout(900);
    const { top, atEnd } = await page.$eval(`#${id}`, (el) => ({ top: Math.round(el.getBoundingClientRect().top), atEnd: Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 1 }));
    check(`Navigare → #${id}`, top >= 0 && (top <= 80 || atEnd), `top=${top}px${atEnd ? ' (capăt de pagină; secțiunea e integral vizibilă)' : ''}`);
  }
  await page.click('.hero .btn-fire', { force: true }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.click('.hero .btn-fire');
  await page.waitForTimeout(900);
  check('CTA hero „Cere o masă” → #rezervare', Math.abs(await page.$eval('#rezervare', (el) => el.getBoundingClientRect().top)) <= 80);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.hero .btn-ghost');
  await page.waitForTimeout(900);
  check('CTA hero „Vezi meniul” → #meniu', Math.abs(await page.$eval('#meniu', (el) => el.getBoundingClientRect().top)) <= 80);

  // meniu: notare preparate
  await page.click('.dish[data-dish="pastrav"] .note-btn');
  await page.click('.dish[data-dish="para"] .note-btn');
  const pressed = await page.$$eval('.note-btn[aria-pressed="true"]', (b) => b.length);
  const status = await page.textContent('#notes-status');
  check('Meniu: 2 preparate notate (aria-pressed)', pressed === 2, status.trim());
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/menu-noted-1440.png` });
  await page.click('.dish[data-dish="para"] .note-btn');
  check('Meniu: de-notare funcționează', (await page.$$eval('.note-btn[aria-pressed="true"]', (b) => b.length)) === 1);
  const inForm = await page.textContent('#notes-in-form');
  check('Preparatul notat apare în formular', inForm.includes('Păstrăv'), inForm.trim());

  // degustare: asociere
  await page.locator('#degustare').scrollIntoViewIfNeeded();
  await page.click('#pairing-switch');
  check('Degustare: switch asociere (aria-checked, status)', (await page.getAttribute('#pairing-switch', 'aria-checked')) === 'true' && (await page.textContent('#pairing-status')).includes('110'));
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/tasting-pairing-1440.png` });

  // seara: ora prin tastatură
  await page.locator('#spatiu').scrollIntoViewIfNeeded();
  await page.focus('#clock');
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  const out = await page.textContent('#clock-out');
  const cta = await page.textContent('#clock-cta');
  check('Seara: tastatura mută ora (19:30) și CTA', out === '19:30' && cta.includes('19:30'), `${out} / ${cta}`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/evening-1930-1440.png` });
  await page.click('#clock-cta');
  await page.waitForTimeout(900);
  check('Seara: CTA preselectează ora 19:30 în formular', await page.isChecked('input[name="hour"][value="19:30"]'));

  // formular gol
  const reqBefore = requests.length;
  await page.click('#form button[type="submit"]');
  const errCount = await page.$$eval('#form-errors-list li', (l) => l.length);
  const focused = await page.evaluate(() => document.activeElement.id);
  check('Formular gol: rezumat erori focusat', errCount === 4 && focused === 'form-errors', `${errCount} erori (ora era preselectată), focus=${focused}`);
  check('Formular: aria-invalid pe câmpuri', (await page.getAttribute('#f-name', 'aria-invalid')) === 'true' && (await page.getAttribute('#f-email', 'aria-invalid')) === 'true');
  await page.locator('#form').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/form-errors-1440.png` });

  // email invalid, luni, trecut
  await page.fill('#f-name', 'Ana Pop');
  await page.fill('#f-email', 'ana@exemplu');
  await page.fill('#f-date', '2026-10-05');
  await page.click('#form button[type="submit"]');
  check('Email incomplet respins', (await page.textContent('#f-email-err')).includes('incompletă'));
  check('Luni respinsă (închis)', (await page.textContent('#f-date-err')).includes('Lunea'));
  await page.fill('#f-date', '2026-10-01');
  await page.click('#form button[type="submit"]');
  check('Dată trecută respinsă', (await page.textContent('#f-date-err')).includes('a trecut'));

  // valid
  await page.fill('#f-email', 'ana@exemplu.ro');
  await page.fill('#f-date', '2026-10-10');
  await page.check('input[name="guests"][value="2"]');
  await page.click('#form button[type="submit"]');
  await page.waitForTimeout(1300);
  const confirmVisible = await page.isVisible('#confirm');
  const confirmText = await page.textContent('#confirm');
  check('Cerere validă → confirmare locală vizibilă și focusată', confirmVisible && (await page.evaluate(() => document.activeElement.id)) === 'confirm');
  check('Confirmare: rezumat corect', confirmText.includes('Ana Pop') && confirmText.includes('sâmbătă') && confirmText.includes('19:30') && confirmText.includes('2 persoane') && confirmText.includes('Păstrăv'));
  check('Mențiune demonstrativă lângă confirmare', confirmText.includes('nu a fost trimisă'));
  await page.screenshot({ path: `${OUT}/form-confirm-1440.png` });
  const reqAfter = requests.slice(reqBefore);
  check('Zero requesturi de rețea la validare/trimitere', reqAfter.length === 0, JSON.stringify(reqAfter));
  const storage = await page.evaluate(async () => ({ ls: localStorage.length, ss: sessionStorage.length, cookie: document.cookie, idb: (await indexedDB.databases?.())?.length ?? 'n/a' }));
  check('Zero persistență (localStorage/sessionStorage/cookie/IndexedDB)', storage.ls === 0 && storage.ss === 0 && storage.cookie === '' && (storage.idb === 0 || storage.idb === 'n/a'), JSON.stringify(storage));
  check('URL neschimbat (fără query cu date)', !page.url().includes('?'), page.url());

  await page.click('#confirm-reset');
  check('„Completează altă cerere” resetează formularul', (await page.isVisible('#form')) && (await page.inputValue('#f-name')) === '' && (await page.evaluate(() => document.activeElement.id)) === 'f-name');

  const allHosts = [...new Set(requests.map((u) => new URL(u).host))];
  check('Toate resursele sunt locale', allHosts.every((h) => h === '127.0.0.1:4174' || h === ''), JSON.stringify(allHosts));
  check('Zero erori runtime / resurse lipsă (desktop)', errors.length === 0, JSON.stringify(errors));
  await ctx.close();
}

/* ---------- azi, oră trecută ---------- */
{
  const { ctx, page } = await open({ width: 1024, height: 768 }, { now: '2026-10-03T20:00:00' });
  await page.fill('#f-name', 'Ion');
  await page.fill('#f-email', 'ion@exemplu.ro');
  await page.fill('#f-date', '2026-10-03');
  await page.check('input[name="hour"][value="18:00"]');
  await page.check('input[name="guests"][value="6"]');
  await page.click('#form button[type="submit"]');
  check('Azi la o oră deja trecută este respins', (await page.textContent('#f-hour-err')).includes('a trecut'));
  await page.check('input[name="hour"][value="21:00"]');
  await page.click('#form button[type="submit"]');
  check('Azi la 21:00 (în viitor) este acceptat', await page.isVisible('#confirm'));
  await ctx.close();
}

/* ---------- doar tastatură ---------- */
{
  const { ctx, page, errors } = await open({ width: 1440, height: 900 }, { reduce: true });
  await page.keyboard.press('Tab');
  check('Primul Tab: link „Sari la conținut” vizibil', (await page.evaluate(() => document.activeElement.className)) === 'skip');
  await page.screenshot({ path: `${OUT}/focus-skip-1440.png` });
  const order = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => { const a = document.activeElement; return (a.id || a.getAttribute('href') || a.className || a.tagName) + ''; }));
  }
  check('Ordinea Tab: nav → hero → meniu → degustare → seara → formular', order.indexOf('#foc') < order.indexOf('#rezervare') && order.indexOf('pairing-switch') > -1 && order.indexOf('clock') > order.indexOf('pairing-switch') && order.indexOf('f-name') > order.indexOf('clock'), order.join(' | '));
  // completează formularul doar din tastatură
  await page.focus('#f-name');
  await page.keyboard.type('Maria');
  await page.keyboard.press('Tab'); await page.keyboard.type('maria@exemplu.ro');
  await page.keyboard.press('Tab'); await page.keyboard.type('10102026');
  await page.keyboard.press('Tab');
  // în Chromium, câmpul date are 3 segmente + picker; avansăm până la radio „ora”
  for (let i = 0; i < 6 && !(await page.evaluate(() => document.activeElement.name === 'hour')); i++) await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight');
  const hourFocus = await page.evaluate(() => document.activeElement.value);
  await page.screenshot({ path: `${OUT}/focus-hour-1440.png` });
  await page.keyboard.press('Tab');
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Tab'); // link meniu din „preparate notate”
  await page.keyboard.press('Tab'); // submit
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const dateVal = await page.inputValue('#f-date');
  check('Formular complet doar din tastatură → confirmare', await page.isVisible('#confirm'), `date=${dateVal}, ora=${hourFocus}`);
  await page.screenshot({ path: `${OUT}/keyboard-confirm-1440.png` });
  check('Zero erori runtime (tastatură)', errors.length === 0, JSON.stringify(errors));
  await ctx.close();
}

/* ---------- mobil: meniu de navigare ---------- */
{
  const { ctx, page, errors } = await open({ width: 390, height: 844 }, { video: true });
  await page.click('.menu-toggle');
  check('Mobil: toggle deschide meniul (aria-expanded)', (await page.getAttribute('.menu-toggle', 'aria-expanded')) === 'true' && (await page.isVisible('#nav a[href="#meniu"]')));
  await page.screenshot({ path: `${OUT}/mobile-nav-open-390.png` });
  await page.keyboard.press('Escape');
  check('Mobil: Escape închide și readuce focusul', (await page.getAttribute('.menu-toggle', 'aria-expanded')) === 'false' && (await page.evaluate(() => document.activeElement.classList.contains('menu-toggle'))));
  await page.click('.menu-toggle');
  await page.click('#nav a[href="#degustare"]');
  await page.waitForTimeout(900);
  check('Mobil: link din meniu navighează și închide meniul', (await page.getAttribute('.menu-toggle', 'aria-expanded')) === 'false' && Math.abs(await page.$eval('#degustare', (el) => el.getBoundingClientRect().top)) <= 80);
  // fluxul uman: program → preparat → cerere
  await page.click('.menu-toggle'); await page.click('#nav a[href="#contact"]'); await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/mobile-program-390.png` });
  await page.click('.menu-toggle'); await page.click('#nav a[href="#meniu"]'); await page.waitForTimeout(800);
  await page.click('.dish[data-dish="sfecla"] .note-btn');
  await page.click('.notes-tray .link-arrow'); await page.waitForTimeout(800);
  await page.fill('#f-name', 'Elena'); await page.fill('#f-email', 'elena@exemplu.ro'); await page.fill('#f-date', '2026-10-07');
  await page.check('input[name="hour"][value="21:00"]'); await page.check('input[name="guests"][value="3"]');
  await page.click('#form button[type="submit"]'); await page.waitForTimeout(1300);
  check('Mobil: sarcina umană (program → preparat → cerere) completă', await page.isVisible('#confirm'));
  await page.locator('#confirm').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${OUT}/mobile-confirm-390.png` });
  check('Zero erori runtime (mobil)', errors.length === 0, JSON.stringify(errors));
  await ctx.close();
}

/* ---------- responsive: overflow și CTA accesibil ---------- */
for (const [w, h] of [[1440, 900], [1024, 768], [390, 844], [320, 568]]) {
  const { ctx, page } = await open({ width: w, height: h }, { reduce: true });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const wide = await page.evaluate(() => [...document.querySelectorAll('body *')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1) && getComputedStyle(el).position !== 'fixed' && !el.closest('.hero-thread, .hero-glow, .menu-glow, .evening-sky, .foot-mark, svg'); }).map((el) => el.tagName + '.' + el.className).slice(0, 8));
  const ctaVisible = await page.evaluate(() => { const els = [...document.querySelectorAll('a[href="#rezervare"]')]; return els.some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.top < innerHeight && r.bottom > 0; }); });
  const clipped = await page.evaluate(() => [...document.querySelectorAll('h1,h2,h3,p,a,button,label,dd,dt,li')].filter((el) => el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible').map((e) => e.className).slice(0, 5));
  check(`Responsive ${w}×${h}: overflow orizontal 0`, ov === 0 && wide.length === 0, `scroll Δ=${ov}; elemente peste margine: ${JSON.stringify(wide)}`);
  check(`Responsive ${w}×${h}: CTA rezervare vizibil la încărcare`, ctaVisible);
  check(`Responsive ${w}×${h}: fără text tăiat`, clipped.length === 0, JSON.stringify(clipped));
  await page.screenshot({ path: `${OUT}/viewport-${w}x${h}.png`, fullPage: true });
  await ctx.close();
}

/* ---------- JS dezactivat: conținut vizibil, formular fără trimitere ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', (r) => reqs.push(r.url()));
  await page.goto(SITE, { waitUntil: 'networkidle' });
  const visible = await page.evaluate(() => ['#hero-title', '#foc-title', '.dish-name', '.price-big', '#rez-title', '.week-full'].every((s) => { const e = document.querySelector(s); const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.opacity !== '0' && e.getBoundingClientRect().height > 0; }));
  check('Fără JS: conținutul cheie este vizibil', visible);
  const n = reqs.length;
  await page.fill('#f-name', 'Test');
  await page.click('#form button[type="submit"]');
  await page.waitForTimeout(500);
  check('Fără JS: submit nu trimite nimic (method=dialog)', reqs.length === n && !page.url().includes('?'), page.url());
  await page.screenshot({ path: `${OUT}/nojs-1440.png`, fullPage: true });
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
fs.writeFileSync(`${OUT}/functional-results.json`, JSON.stringify({ when: new Date().toISOString(), browser: 'Chromium 141.0.7390.37 headless (playwright-core 1.56.1)', passed: results.length - failed.length, failed: failed.length, results }, null, 2));
console.log(`\n${results.length - failed.length}/${results.length} PASS`);
process.exit(failed.length ? 1 : 0);
