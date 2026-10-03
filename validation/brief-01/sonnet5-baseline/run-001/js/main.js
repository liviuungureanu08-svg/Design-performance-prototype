import { mountIsolines } from './isoline.js';

document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

mountIsolines(document);

/* ---------- scroll reveal ---------- */
if (!reduceMotion && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
} else {
  document.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
}

/* ---------- hero drift (idle, paused off-screen / reduced motion) ---------- */
const heroField = document.querySelector('.hero-field');
if (heroField && !reduceMotion) {
  let running = true;
  let start = null;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => (running = e.isIntersecting));
  });
  io.observe(heroField);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) running = false;
    else io.takeRecords();
  });

  function tick(ts) {
    if (!start) start = ts;
    if (running) {
      const t = (ts - start) / 1000;
      heroField.querySelectorAll('[data-drift]').forEach((path, i) => {
        const offset = Math.sin(t * 0.12 + i) * 4;
        path.style.transform = `translateY(${offset.toFixed(2)}px)`;
      });
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ---------- field -> model -> decision stepper ---------- */
const stepper = document.querySelector('[data-stepper]');
if (stepper) {
  const tabs = Array.from(stepper.querySelectorAll('.stepper-tab'));
  const panels = Array.from(stepper.querySelectorAll('.stepper-panel'));
  const fill = stepper.querySelector('.stepper-fill');

  function setStage(index, { focusTab = false } = {}) {
    tabs.forEach((tab, i) => {
      const active = i === index;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && focusTab) tab.focus();
    });
    panels.forEach((panel, i) => {
      panel.hidden = i !== index;
    });
    if (fill) fill.style.width = `${((index + 1) / tabs.length) * 100}%`;
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => setStage(i));
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        setStage((i + 1) % tabs.length, { focusTab: true });
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        setStage((i - 1 + tabs.length) % tabs.length, { focusTab: true });
      } else if (e.key === 'Home') {
        e.preventDefault();
        setStage(0, { focusTab: true });
      } else if (e.key === 'End') {
        e.preventDefault();
        setStage(tabs.length - 1, { focusTab: true });
      }
    });
  });

  setStage(0);
}

/* ---------- mobile nav: close after choosing a link ---------- */
const navMobile = document.querySelector('.nav-mobile');
if (navMobile) {
  navMobile.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => {
      navMobile.removeAttribute('open');
    })
  );
}

/* ---------- demo form ---------- */
const form = document.getElementById('demo-form');
const confirm = document.getElementById('demo-confirm');
const confirmCode = document.getElementById('confirm-code');
const resetBtn = document.getElementById('demo-reset');
const emailInput = document.getElementById('f-email');
const emailError = document.getElementById('f-email-error');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const valid = form.checkValidity();
    if (!valid) {
      emailError.hidden = emailInput.validity.valid;
      form.querySelectorAll(':invalid').forEach((el, i) => {
        if (i === 0) el.focus();
      });
      return;
    }
    emailError.hidden = true;

    const ref = 'TL-' + Math.floor(100000 + Math.random() * 900000);
    confirmCode.textContent = `Reference ${ref}`;
    form.hidden = true;
    confirm.hidden = false;
    confirm.focus();
  });
}

if (resetBtn) {
  resetBtn.addEventListener('click', () => {
    form.reset();
    confirm.hidden = true;
    form.hidden = false;
    document.getElementById('f-name').focus();
  });
}
