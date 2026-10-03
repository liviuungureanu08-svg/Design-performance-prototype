# FINAL REPORT — Brief 01 / TIDELINE — Sonnet 5, ALFA-guided

## 1. Experiment identity

Controlled ALFA validation run: Brief 01 (TIDELINE) implemented by Sonnet 5 under the
permitted ALFA GI + Visual Lab v0.1 candidate guidance, for later Human Review comparison
against the independently-run Sonnet 5 native baseline.

## 2. Model / run type

Model: Claude Sonnet 5. Run type: ALFA-GUIDED (GI + Visual Lab v0.1 candidate only).

## 3. Branch

`validation/brief-01-sonnet5-guided`

## 4. Run directory

`validation/brief-01/sonnet5-guided/run-001/`

## 5. Resolved repository / base information

Repository: `liviuungureanu08-svg/design-performance-prototype`. Branch created from
`origin/main` (`24e654b`). The repository also contains unrelated prior material
(`lamella-experiment/`, `run/`, other validation branches, an ALFA GI + Visual Lab v0.1
source branch) which was preserved untouched and, where off-limits, not inspected — see
§12–16.

## 6. Implementation stack

Dependency-free static site: semantic HTML, hand-written CSS (custom properties, no
framework), and vanilla JS split into two files — `js/coastline.js` (the rendering engine)
and `js/main.js` (DOM/scroll/form wiring). No build step, no bundler, no external network
requests, no runtime dependency on the ALFA candidate's own Node.js tooling (that tooling
was read as guidance only, never imported or executed against this site — consistent with
its own README: "No frozen source is imported as executable code").

## 7. Concept (independently developed)

One continuous canvas — a coastal cross-section (land / intertidal / seabed) — persists
behind the page instead of per-section decorative heroes, carrying the brief's
COASTLINE → OBSERVATION → UNDERSTANDING → DECISION progression as one accumulating visual
argument rather than four illustrations:

- **Hero (COASTLINE):** near-empty horizon, a single ambient point, tide line already
  moving.
- **Problem (OBSERVATION):** scattered, disconnected sensor points — visually enacting
  "isolated observations are insufficient" rather than only stating it.
- **System (UNDERSTANDING):** points resolve into a connected isoline mesh with a
  predictive uncertainty band, alongside the OBSERVE/INTERPRET/ACT and
  FIELD→MEASUREMENTS→INTERPRETATION→DECISION copy.
- **Project/Principle (DECISION):** a highlighted monitoring corridor around the Pilot 07
  cluster, calm and resolved.

Two drivers are deliberately kept separate (per VL-01): an **ambient tide oscillation**
that runs on its own clock, continuously, independent of scroll or stage — making "a
shoreline is not a snapshot" literal rather than textual — and a **scroll-governed,
eased accumulation stage** that advances through section thresholds rather than raw pixel
mapping, so no amount of scroll speed can skip or flash between states.

Signature tests run against the concept: Logo Swap and Industry Swap both fail to
neutralize it (the cross-section/tide mechanism is domain-specific, not a branding skin);
Effect Swap would remove the core argument, not just decoration; Remove Asset leaves a
fully readable, functional page (progressive base case).

## 8. Major interaction / motion systems

- **Governed stage travel** (VL-01): `CoastEngine` eases a continuous `stage` value
  toward a target set by section-threshold scroll tracking, using a time-constant lerp
  (not frame-count), so a reload at mid-scroll, a reversed scroll, or an instant
  full-page jump all resolve through the same intermediate visual states instead of
  snapping.
- **Motion role separation** (VL-02): the tide line is the ambient/atmospheric layer; the
  sensor mesh and corridor highlight are the primary, semantically-driven layer; they are
  implemented and can be reasoned about independently.
- **Pointer response** (VL-03): five named sensors are real, focusable `<button>` hotspots
  positioned to match the canvas, with immediate hover/focus acknowledgement (a tooltip),
  not file dependent on touch.
- **Transition/flash discipline** (VL-04): verified under true instant scroll jumps and
  rapid wheel bursts (see §10) — no flashing or skipped states observed.
- **Readability during transformation** (VL-05): section copy sits on an opaque/blurred
  card above the canvas; a repair (see §11) ensures interactive sensor hotspots never
  register underneath that readable card.
- **Repair discipline** (VL-06): two defects were found and fixed during this run's own
  testing; see §11.

## 9. Accessibility / mobile / reduced-motion handling

- Skip link, visible focus rings (`:focus-visible`), labelled form fields, `aria-live`
  confirmation region, keyboard-operable mobile nav (Escape closes it) — all verified with
  Playwright (see §10).
- `prefers-reduced-motion: reduce`: tide oscillation amplitude is set to zero and stage
  changes apply immediately instead of easing; verified via Playwright's
  `reducedMotion: "reduce"` emulation.
- Mobile: sensor hover hint is hidden below 760px (the affordance is a desktop/pointer
  enhancement per VL-03's own boundary — "essential actions must not depend on pointer
  precision" — not a requirement on touch); core content, stats, nav and the demo form are
  plain DOM and fully functional with the canvas motion layer reduced to backdrop.
- No horizontal overflow confirmed at 390×844.

## 10. Tests performed

All via a local static server and Playwright (Chromium), against the actual rendered
page:

- Desktop (1440×900): initial load, full normal scroll, a genuine **instant** jump to the
  bottom and back (`behavior: "instant"`, bypassing the page's own
  `scroll-behavior: smooth` — the real-world equivalent of an aggressive scrollbar drag),
  a 25-event rapid wheel burst, pausing mid-transition, reverse scroll, sensor hover at
  multiple scroll depths, keyboard tab order (isolated check), nav-anchor clicks, demo
  form invalid submission and valid submission with confirmation.
- Mobile (390×844, touch emulated): load, mobile nav open/close, scroll through all
  sections, horizontal-overflow check, demo form section.
- Reduced motion (`reducedMotion: "reduce"`): load and mid-page screenshot.
- Console errors, page errors, failed requests and HTTP error responses were captured on
  every page; final state is clean.

## 11. Defects found and repaired during this run (VL-06 discipline)

1. **Sensor hotspot position mismatch.** `.sensor-dot` was CSS `position: absolute`
   against document coordinates while its computed (x, y) were viewport coordinates
   (matching the `position: fixed` canvas). Diagnosed via a hover test whose screenshot
   showed the page auto-scrolled to the footer when hovering a System-section sensor —
   Playwright's actionability scroll-into-view exposed the drift. Repair: changed to
   `position: fixed`. Re-verified: zero scroll drift on hover at two different scroll
   depths (before/after `scrollY` identical).
2. **Interactive sensor hotspots landing under the readable text card**, a direct VL-05
   violation (hovering a near-shore marker popped a tooltip over live copy). Repair:
   sensor hotspots are now suppressed for any frame where their position falls inside the
   current section's text card (with a small pad), rather than cosmetically repositioning
   the tooltip. This is a value-preserving repair — the dots remain visible as ambient
   texture behind the card; only the hotspot's registration over the card is removed.
   This fix had a second-order effect: it made the System section's "hover a marker" hint
   unfulfillable (its card is tall enough to cover every sensor active at that stage), so
   the hint was moved to the Project section, where sensors are confirmed reachable, and
   hidden below 760px per §9.

## 12. Prohibited sources — NOT used

Confirmed not read, invoked or incorporated: Impeccable, LAMELLA, VELORUM, FIR DE FOC,
Effect Ceiling, the Sonnet 5 baseline implementation/screenshots/FINAL_REPORT for this
brief, any Luna baseline or Luna guided run, `docs/alfa-visual-intelligence`,
`alfa-visual-tech`, frozen ALFA Core material, any external design framework, and no web
research was used to source visual inspiration.

## 13. Impeccable — NOT read, invoked, or applied

Confirmed.

## 14. Previous ALFA visual experiments — NOT inspected

Confirmed. Other branches/experiments present in this repository
(`lamella-experiment/`, `run/` containing the FIR DE FOC evidence, `round-1-archive`,
`ccr-86d3be6b-jy48id`) were identified only by file listing while locating the permitted
ALFA candidate and the Brief 01 contract; their content was not opened or used.

## 15. Baseline — NOT inspected

Confirmed. `apps/briefs/brief-01/sonnet5-baseline/run-001/` was never opened. Project
Truth and the Experience Promise for this run came from the Brief 01 contract supplied
directly as shared common input, not from the baseline's output.

## 16. Luna's run — NOT inspected

Confirmed. No Luna baseline or Luna guided artifacts were present in, or fetched into,
this working tree at any point in this run.

## 17. ALFA GI + Visual Lab v0.1 — the only additional framework used

Confirmed. Guidance was read, read-only, from `alfa/gi-visual-lab/v0.1` on
`origin/validation/alfa-gi-visual-lab-v0.1-source` (`README.md`, `governance.json`, and
knowledge units `VL-01` through `VL-06`). No other path on that branch was merged or
copied; the extraction used `git archive` into a scratch directory outside the repository
index, and an accidental `git checkout -- <path>` staging of those files earlier in the
session was caught and reverted (`git reset`) before any commit. No candidate source code
(`src/*.mjs`) was imported or executed by this site.

## 18. Files changed / created

All new, under `validation/brief-01/sonnet5-guided/run-001/`:

- `index.html`
- `css/styles.css`
- `js/coastline.js`
- `js/main.js`
- `FINAL_REPORT.md` (this file)

No existing file in the repository was modified. `lamella-experiment/` and `run/`
(pre-existing untracked directories) were left untouched.

## 19. Known limitations

- Sensor reading values are illustrative UI copy for a fictional product (explicitly
  fictional, consistent with the brief's factual boundary), not derived from any model.
- No automated accessibility audit (e.g. axe-core) was run — checks were manual/targeted
  (focus order, labels, `aria-live`, contrast by inspection) rather than exhaustive.
- Testing used Chromium only; no cross-browser verification.
- The ALFA candidate's own CLI/governance/trace/evidence machinery
  (`intake.json`, `trace.json`, frozen predictions, Human Review package) was not
  exercised — the candidate was used purely as reasoning guidance for this build, not as
  an executed experiment-tracking pipeline, since the task's own deliverable path
  (`validation/brief-01/sonnet5-guided/run-001/`) is a different convention from the
  candidate's own (`experiments/alfa-gi-visual-lab-v0.1/runs/<id>/`).
- No automated Premium/WOW/UX Motion Quality claim is made anywhere in this report, per
  the candidate's own Human Authority boundary — those are for Human Review.

## 20. Git / push status

Committed to `validation/brief-01-sonnet5-guided`, created from `origin/main`. Push
status and exact commit SHA follow in the commit that accompanies this report.
