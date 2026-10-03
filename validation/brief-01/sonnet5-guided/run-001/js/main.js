(function () {
  "use strict";

  const canvas = document.getElementById("coast-canvas");
  const coastStage = document.querySelector(".coast-stage");
  const engine = new CoastEngine(canvas);

  const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  function applyReducedMotion() {
    engine.setReducedMotion(reducedMotionQuery.matches);
  }
  applyReducedMotion();
  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener("change", applyReducedMotion);
  }

  engine.start();

  window.addEventListener("resize", () => engine.resize());

  /* ---------- stage tracking ---------- */

  const panels = Array.from(document.querySelectorAll(".panel"));
  let scheduled = false;
  let currentCardRect = null;

  function updateStage() {
    scheduled = false;
    const centerY = window.innerHeight / 2;
    let current = panels[0];
    for (const p of panels) {
      if (p.getBoundingClientRect().top <= centerY) current = p;
      else break;
    }
    if (current && current.dataset.stage !== undefined) {
      engine.setTargetStage(parseFloat(current.dataset.stage));
      engine.setCalm(false);
      coastStage.classList.remove("is-calm");
    } else {
      engine.setCalm(true);
      coastStage.classList.add("is-calm");
    }
    const card = current ? current.querySelector(".panel-inner") : null;
    currentCardRect = card ? card.getBoundingClientRect() : null;
  }

  function requestStageUpdate() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateStage);
  }

  window.addEventListener("scroll", requestStageUpdate, { passive: true });
  window.addEventListener("resize", requestStageUpdate);
  updateStage();

  /* ---------- sensor hotspots ---------- */

  const tooltip = document.getElementById("sensorTooltip");
  const sensorButtons = new Map();

  CoastEngine.NAMED_SENSORS.forEach((s) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sensor-dot";
    btn.setAttribute("aria-label", s.label + ": " + s.reading);
    btn.style.display = "none";
    btn.dataset.sensorId = s.id;
    document.body.appendChild(btn);
    sensorButtons.set(s.id, btn);

    btn.addEventListener("pointerenter", () => showTooltip(s.label, s.reading, btn));
    btn.addEventListener("pointerleave", hideTooltip);
    btn.addEventListener("focus", () => showTooltip(s.label, s.reading, btn));
    btn.addEventListener("blur", hideTooltip);
  });

  function showTooltip(label, reading, btn) {
    const rect = btn.getBoundingClientRect();
    tooltip.innerHTML = "<strong>" + label + "</strong>" + reading;
    tooltip.style.left = rect.left + rect.width / 2 + "px";
    tooltip.style.top = rect.top + "px";
    tooltip.hidden = false;
  }
  function hideTooltip() {
    tooltip.hidden = true;
  }

  const CARD_PAD = 14;
  function insideCard(x, y) {
    const r = currentCardRect;
    if (!r) return false;
    return x > r.left - CARD_PAD && x < r.right + CARD_PAD && y > r.top - CARD_PAD && y < r.bottom + CARD_PAD;
  }

  function positionSensors() {
    const positions = engine.getSensorScreenPositions();
    const seen = new Set();
    positions.forEach((p) => {
      const btn = sensorButtons.get(p.id);
      if (!btn) return;
      seen.add(p.id);
      if (!p.visible || insideCard(p.x, p.y)) {
        btn.style.display = "none";
        return;
      }
      btn.style.display = "block";
      btn.style.transform = "translate(" + p.x + "px," + p.y + "px)";
    });
    sensorButtons.forEach((btn, id) => {
      if (!seen.has(id)) btn.style.display = "none";
    });
    requestAnimationFrame(positionSensors);
  }
  requestAnimationFrame(positionSensors);

  /* ---------- mobile nav ---------- */

  const navToggle = document.getElementById("navToggle");
  const primaryNav = document.getElementById("primaryNav");

  navToggle.addEventListener("click", () => {
    const open = primaryNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(open));
  });

  primaryNav.addEventListener("click", (e) => {
    if (e.target.tagName === "A" && primaryNav.classList.contains("is-open")) {
      primaryNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && primaryNav.classList.contains("is-open")) {
      primaryNav.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.focus();
    }
  });

  /* ---------- demo form ---------- */

  const form = document.getElementById("demoForm");
  const formError = document.getElementById("formError");
  const confirmPanel = document.getElementById("demoConfirm");
  const confirmEmail = document.getElementById("confirmEmail");
  const confirmProject = document.getElementById("confirmProject");
  const resetBtn = document.getElementById("demoReset");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      formError.hidden = false;
      form.reportValidity();
      return;
    }
    formError.hidden = true;
    confirmEmail.textContent = form.email.value;
    confirmProject.textContent = form.project.value;
    form.hidden = true;
    confirmPanel.hidden = false;
    confirmPanel.focus();
  });

  resetBtn.addEventListener("click", () => {
    form.reset();
    formError.hidden = true;
    confirmPanel.hidden = true;
    form.hidden = false;
    form.name.focus();
  });
})();
