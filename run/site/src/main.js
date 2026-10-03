// FIR DE FOC — interacțiuni. Totul rămâne în memoria paginii:
// nimic nu este trimis prin rețea și nimic nu este salvat.

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/* ---------- firul se aprinde la intrarea fiecărei zone ---------- */
const zones = $$('.thread-zone');
if ('IntersectionObserver' in window) {
  const lightIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('is-lit');
        lightIO.unobserve(e.target);
      }
    }
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.01 });
  zones.forEach((z) => lightIO.observe(z));
} else {
  zones.forEach((z) => z.classList.add('is-lit'));
}

/* ---------- ambientul din hero se oprește când nu e vizibil ---------- */
const hero = $('.hero');
const heroSvg = $('.hero-thread');
function syncHeroMotion(visible) {
  const run = visible && !reduceMotion.matches;
  hero.classList.toggle('is-off', !run);
  if (heroSvg && heroSvg.pauseAnimations) {
    if (run) heroSvg.unpauseAnimations(); else heroSvg.pauseAnimations();
  }
}
if ('IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => syncHeroMotion(e.isIntersecting)).observe(hero);
}
document.addEventListener('visibilitychange', () => syncHeroMotion(!document.hidden && hero.getBoundingClientRect().bottom > 0));
reduceMotion.addEventListener?.('change', () => syncHeroMotion(true));
syncHeroMotion(true);

/* ---------- Sezon / Foc / Gest: nodurile stau exact pe fir ---------- */
const philoPath = $('#philo-path');
const philoSvg = $('.stages-thread');
function placeKnots() {
  if (!philoSvg || getComputedStyle(philoSvg).display === 'none') {
    $$('.stage').forEach((st) => st.style.removeProperty('--ky'));
    return;
  }
  const box = philoSvg.getBoundingClientRect();
  const sx = box.width / 1200;
  const len = philoPath.getTotalLength();
  $$('.stage').forEach((st) => {
    const k = st.querySelector('.stage-knot');
    const x = (st.getBoundingClientRect().left + 8 - box.left) / sx;
    let lo = 0, hi = len;
    for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (philoPath.getPointAtLength(mid).x < x) lo = mid; else hi = mid; }
    const y = philoPath.getPointAtLength(lo).y * (box.height / 120);
    st.style.setProperty('--ky', `${(y - k.offsetHeight / 2).toFixed(1)}px`);
  });
}
placeKnots();
window.addEventListener('resize', placeKnots, { passive: true });

/* ---------- navigare ---------- */
const toggle = $('.menu-toggle');
const nav = $('#nav');
function setNav(open, returnFocus = false) {
  toggle.setAttribute('aria-expanded', String(open));
  nav.classList.toggle('is-open', open);
  if (!open && returnFocus) toggle.focus();
}
toggle.addEventListener('click', () => setNav(toggle.getAttribute('aria-expanded') !== 'true'));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') setNav(false, true);
});
document.addEventListener('click', (e) => {
  if (toggle.getAttribute('aria-expanded') === 'true' && !e.target.closest('.bar')) setNav(false);
});
window.matchMedia('(min-width: 1021px)').addEventListener?.('change', (m) => { if (m.matches) setNav(false); });

const navLinks = $$('#nav a');
if ('IntersectionObserver' in window) {
  const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
  const spyIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      navLinks.forEach((a) => a.removeAttribute('aria-current'));
      byId.get(e.target.id)?.setAttribute('aria-current', 'true');
    }
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('section[id], footer[id]').forEach((s) => spyIO.observe(s));
}

/* ---------- preparate notate ---------- */
const notes = new Set();
const notesStatus = $('#notes-status');
const notesInForm = $('#notes-in-form');
function renderNotes() {
  const list = [...notes];
  if (!list.length) {
    notesStatus.textContent = 'Nimic notat încă. Atinge „Notează” la un preparat.';
    notesInForm.innerHTML = 'Niciunul. Poți nota preparate din <a href="#meniu">meniu</a>.';
    return;
  }
  notesStatus.innerHTML = '';
  const strong = document.createElement('strong');
  strong.textContent = list.length === 1 ? '1 preparat notat' : `${list.length} preparate notate`;
  notesStatus.append(strong, document.createTextNode(`: ${list.join(' · ')}.`));
  notesInForm.innerHTML = '';
  const ul = document.createElement('ul');
  list.forEach((n) => { const li = document.createElement('li'); li.textContent = n; ul.append(li); });
  notesInForm.append(ul);
}
$$('.note-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.setAttribute('aria-pressed', String(on));
    btn.querySelector('.note-label').textContent = on ? 'Notat pentru seara mea' : 'Notează pentru seara mea';
    btn.closest('.dish').classList.toggle('is-noted', on);
    if (on) notes.add(btn.dataset.note); else notes.delete(btn.dataset.note);
    renderNotes();
  });
});

/* ---------- degustare: asocierea de băuturi ---------- */
const pairSwitch = $('#pairing-switch');
const courseLine = $('#course-line');
const pairStatus = $('#pairing-status');
pairSwitch.addEventListener('click', () => {
  const on = pairSwitch.getAttribute('aria-checked') !== 'true';
  pairSwitch.setAttribute('aria-checked', String(on));
  courseLine.dataset.pairing = on ? 'on' : 'off';
  pairStatus.innerHTML = on
    ? 'Degustare: <span class="num">240</span> RON / persoană + asociere de băuturi: <span class="num">110</span> RON.'
    : 'Degustare: <span class="num">240</span> RON / persoană.';
});

/* ---------- seara: 36 de locuri pe un singur fir ---------- */
const SVGNS = 'http://www.w3.org/2000/svg';
const seatsPath = $('#seats-path');
const seatsBurn = $('#seats-burn');
const seatsDots = $('#seats-dots');
const spark = $('#seats-spark');
const halo = $('#seats-halo');
const evening = $('#spatiu');

const seatsSvg = $('#seats-svg');
let total = 0;
let seatLen = [];
let seatEls = [];
let reach = 150;

function catmull(points) {
  const head = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  const segs = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    segs.push(` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`);
  }
  return { head, segs, d: head + segs.join('') };
}

// 36 de puncte parcurse în serpentină: 4 × 9 pe ecrane late, 6 × 6 pe telefon
function buildSeats(narrow) {
  const cols = narrow ? 6 : 9;
  const rows = 36 / cols;
  const W = narrow ? 600 : 1000;
  const stepX = (W - 140) / (cols - 1);
  const stepY = narrow ? 96 : 92;
  const H = 52 * 2 + stepY * (rows - 1);
  seatsSvg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  const pts = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const col = r % 2 === 0 ? c : cols - 1 - c;
      pts.push([70 + col * stepX, 52 + r * stepY + Math.sin(col * 0.9 + r * 1.7) * 14]);
    }
  }
  // firul intră din stânga; iese pe latura unde se termină ultimul rând
  const last = pts[35];
  const exitX = rows % 2 === 0 ? 0 : W;
  const { head, segs, d } = catmull([[0, pts[0][1]], ...pts, [exitX, last[1]]]);
  seatsPath.setAttribute('d', d);
  seatsBurn.setAttribute('d', d);
  total = seatsPath.getTotalLength();
  reach = total / 36 * 2.6;
  // locul i este capătul segmentului i+1: lungimea până la el = lungimea prefixului
  const probe = document.createElementNS(SVGNS, 'path');
  seatsSvg.append(probe);
  let acc = head;
  seatLen = pts.map((_, i) => {
    acc += segs[i];
    probe.setAttribute('d', acc);
    return probe.getTotalLength();
  });
  probe.remove();
  seatsDots.textContent = '';
  seatEls = pts.map(([x, y], i) => {
    const c = document.createElementNS(SVGNS, 'circle');
    c.setAttribute('cx', x.toFixed(1));
    c.setAttribute('cy', y.toFixed(1));
    c.setAttribute('r', narrow ? '9' : '7');
    c.setAttribute('class', 'seat');
    c.style.transitionDelay = reduceMotion.matches ? '0s' : `${i * 18}ms, 0s, 0s`;
    seatsDots.append(c);
    return c;
  });
  seatsBurn.style.strokeDasharray = `${total}`;
}
const narrowMQ = window.matchMedia('(max-width: 600px)');
buildSeats(narrowMQ.matches);

const clock = $('#clock');
const clockOut = $('#clock-out');
const clockPhase = $('#clock-phase');
const clockCta = $('#clock-cta');
const SLOTS = ['18:00', '19:30', '21:00'];
const fmt = (v) => {
  const m = 18 * 60 + v * 30;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};
function phaseText(v, time) {
  if (v === 0) return '18:00 — se deschide sala. Prima așezare a serii.';
  if (time === '19:30') return '19:30 — a doua așezare.';
  if (time === '21:00') return '21:00 — ultima așezare a serii.';
  if (v === 10) return '23:00 — închidem. Focul rămâne jar până la următoarea seară.';
  const next = SLOTS.find((s) => s > time);
  if (next) return `${time} — seara curge, felurile vin pe rând. Următoarea așezare: ${next}.`;
  return `${time} — mesele de la 21:00 își continuă seara. Închidem la 23:00.`;
}
function setClock(v) {
  const t = v / 10;
  const time = fmt(v);
  evening.style.setProperty('--t', t.toFixed(3));
  clock.style.setProperty('--t', t.toFixed(3));
  clockOut.textContent = time;
  clock.setAttribute('aria-valuetext', time);
  clockPhase.textContent = phaseText(v, time);

  const L = total * (0.04 + t * 0.92);
  const p = seatsPath.getPointAtLength(L);
  spark.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
  halo.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
  seatsBurn.style.strokeDashoffset = `${total - L}`;
  seatEls.forEach((el, i) => el.classList.toggle('is-warm', Math.abs(seatLen[i] - L) < reach));

  const slot = SLOTS.includes(time) ? time : SLOTS.find((s) => s > time);
  if (slot) {
    clockCta.hidden = false;
    clockCta.dataset.hour = slot;
    clockCta.textContent = `Cere o masă la ${slot}`;
  } else {
    clockCta.dataset.hour = '';
    clockCta.textContent = 'Alege o oră pentru altă seară';
  }
}
clock.addEventListener('input', () => setClock(Number(clock.value)));
setClock(Number(clock.value));
narrowMQ.addEventListener?.('change', (m) => { buildSeats(m.matches); setClock(Number(clock.value)); });

/* ---------- formularul ---------- */
const form = $('#form');
const confirmBox = $('#confirm');
const errBox = $('#form-errors');
const errList = $('#form-errors-list');
const fName = $('#f-name');
const fEmail = $('#f-email');
const fDate = $('#f-date');
let attempted = false;

const pad = (n) => String(n).padStart(2, '0');
const toISO = (dt) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
fDate.min = toISO(new Date());

clockCta.addEventListener('click', () => {
  const h = clockCta.dataset.hour;
  if (h) {
    const r = form.querySelector(`input[name="hour"][value="${h}"]`);
    if (r) { r.checked = true; if (attempted) validate(); }
  }
});

const radios = (name) => $$(`input[name="${name}"]`, form);
const checked = (name) => radios(name).find((r) => r.checked)?.value || '';
const parseDate = (v) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (!m) return null;
  const dt = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return dt.getMonth() === Number(m[2]) - 1 ? dt : null;
};

function rules() {
  const errs = {};
  const name = fName.value.trim();
  if (!name) errs.name = 'Scrie numele pe care facem cererea.';
  else if (name.length < 2) errs.name = 'Numele trebuie să aibă cel puțin 2 caractere.';

  const email = fEmail.value.trim();
  if (!email) errs.email = 'Adaugă o adresă de email.';
  else if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[^\s@.]{2,}$/.test(email)) errs.email = 'Adresa de email pare incompletă — de exemplu: nume@exemplu.ro.';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dt = parseDate(fDate.value);
  const hour = checked('hour');
  if (!fDate.value) errs.date = 'Alege data la care vrei să vii.';
  else if (!dt) errs.date = 'Data nu este validă. Folosește calendarul.';
  else if (dt < today) errs.date = 'Data a trecut. Alege azi sau o zi viitoare.';
  else if (dt.getDay() === 1) errs.date = 'Lunea suntem închiși. Alege o zi de marți până duminică.';

  if (!hour) errs.hour = 'Alege una dintre cele trei ore: 18:00, 19:30 sau 21:00.';
  else if (dt && !errs.date && dt.getTime() === today.getTime()) {
    const [h, m] = hour.split(':').map(Number);
    if (h * 60 + m <= now.getHours() * 60 + now.getMinutes()) {
      errs.hour = `Ora ${hour} a trecut deja azi. Alege o oră mai târzie sau altă zi.`;
    }
  }
  if (!checked('guests')) errs.guests = 'Alege câte persoane veți fi, între 1 și 6.';
  return errs;
}

const FIELDS = {
  name: { el: () => fName, label: 'Nume' },
  email: { el: () => fEmail, label: 'Email' },
  date: { el: () => fDate, label: 'Data' },
  hour: { el: () => radios('hour')[0], label: 'Ora' },
  guests: { el: () => radios('guests')[0], label: 'Persoane' },
};

function paint(errs) {
  for (const key of Object.keys(FIELDS)) {
    const wrap = form.querySelector(`[data-field="${key}"]`);
    const msg = $(`#f-${key}-err`);
    const bad = Boolean(errs[key]);
    msg.textContent = errs[key] || '';
    wrap.classList.toggle('is-invalid', bad);
    wrap.classList.toggle('is-valid', !bad && attempted);
    const targets = key === 'hour' || key === 'guests' ? radios(key) : [FIELDS[key].el()];
    targets.forEach((t) => (bad ? t.setAttribute('aria-invalid', 'true') : t.removeAttribute('aria-invalid')));
  }
}
function validate() {
  const errs = rules();
  paint(errs);
  return errs;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  attempted = true;
  const errs = validate();
  const keys = Object.keys(errs);
  if (keys.length) {
    errList.innerHTML = '';
    keys.forEach((k) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = `#f-${k}-err`;
      a.textContent = `${FIELDS[k].label}: ${errs[k]}`;
      a.addEventListener('click', (ev) => { ev.preventDefault(); FIELDS[k].el().focus(); });
      li.append(a);
      errList.append(li);
    });
    errBox.hidden = false;
    errBox.focus();
    return;
  }
  errBox.hidden = true;
  showConfirm();
});
form.addEventListener('input', () => { if (attempted) { validate(); if (!Object.keys(rules()).length) errBox.hidden = true; } });
form.addEventListener('change', () => { if (attempted) validate(); });

function showConfirm() {
  const dt = parseDate(fDate.value);
  const dateTxt = new Intl.DateTimeFormat('ro-RO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(dt);
  const g = Number(checked('guests'));
  const rows = [
    ['Nume', fName.value.trim()],
    ['Email', fEmail.value.trim()],
    ['Data', dateTxt],
    ['Ora', checked('hour')],
    ['Persoane', g === 1 ? '1 persoană' : `${g} persoane`],
    ['Preparate notate', notes.size ? [...notes].join(' · ') : '—'],
  ];
  const list = $('#confirm-list');
  list.innerHTML = '';
  rows.forEach(([k, v]) => {
    const dtEl = document.createElement('dt');
    const ddEl = document.createElement('dd');
    dtEl.textContent = k;
    ddEl.textContent = v;
    list.append(dtEl, ddEl);
  });
  form.hidden = true;
  confirmBox.hidden = false;
  // repornește desenul nodului
  const knot = confirmBox.querySelector('.draw');
  knot.style.animation = 'none';
  void knot.getBoundingClientRect();
  knot.style.animation = '';
  confirmBox.focus();
}

$('#confirm-reset').addEventListener('click', () => {
  form.reset();
  attempted = false;
  paint({});
  $$('.field', form).forEach((f) => f.classList.remove('is-valid'));
  errBox.hidden = true;
  $('#confirm-list').innerHTML = '';
  confirmBox.hidden = true;
  form.hidden = false;
  fName.focus();
});

/* ---------- program: ziua de azi ---------- */
const todayEl = $(`#week .day[data-d="${new Date().getDay()}"]`);
if (todayEl) todayEl.classList.add('is-today');
