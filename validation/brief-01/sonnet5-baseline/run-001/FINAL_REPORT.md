# FINAL REPORT — ALFA Validation, Brief 01, Baseline

## 1. Experiment condition
BASELINE — native model generation, no ALFA, no Impeccable.

## 2. Model
Claude Sonnet 5.

## 3. Effort
High.

## 4. Git base branch and commit
Base: `origin/main` @ `24e654b` ("Initial commit"). This base was chosen because it
predates all ALFA/Visual Lab/Lamella/Fir de Foc history that exists on other branches
in this repository — selected using commit metadata only (`git log --oneline`), without
opening any file content from those commits.

## 5. Dedicated branch created
`validation/brief-01-sonnet5-baseline`

## 6. Exact run directory
`validation/brief-01/sonnet5-baseline/run-001/`

## 7. Brief summary
TIDELINE: a fictional B2B coastal-intelligence company selling a system that combines
distributed sensors, repeat surveys and predictive modelling into one operational view
of a changing coastline, for ports, harbour authorities and coastal engineering teams.
Primary business goal: get qualified organizations to request a technical demo. Required
sections: hero, problem, system (Observe/Interpret/Act), Field→Model→Decision, a fictional
project example (North Breakwater / Pilot 07), an operating-principle statement, and a
working demo-request form — all with full creative freedom on visual language.

## 8. Chosen native concept
The company's own name is the concept: a "tideline" is the physical mark successive tides
leave on a shore — a record of change over time, which is exactly what the product measures
and what differentiates it from a single survey. The site is built around a single recurring
visual device: a procedurally generated **survey line** (a smooth path through seeded points),
which is reused at every level of the page — faint stacked "drift" lines behind the hero,
a one-survey-vs-fourteen-surveys comparison in the Problem section, and four different
renderings of the *same* underlying signal (raw/noisy → cleaned → annotated → resolved into
a decision) driving the interactive Field→Model→Decision stepper. The visual motif is never
decorative on its own; it is the same mechanism the copy is describing.

Visual language is a "survey chart" aesthetic rather than a generic dark-tech one: warm
paper ground (`#F3EFE6`), deep ink text, a muted sounding-line teal (`#1E6E68`) and a copper
annotation accent (`#B9703A`), monospace for all data readouts (stats, eyebrows, tags) to read
like instrument output, and a dark-ink "operating principle" section as the one high-contrast
break in an otherwise light, paper-toned page.

## 9. Design rationale
The audience (coastal engineers, harbour authorities, procurement decision-makers) is
explicitly described in the brief as professionally skeptical and not looking for a visual
gimmick. The design avoids spectacle (no WebGL/3D/particles) and instead spends its effort on
information hierarchy, restrained motion, and one idea executed consistently, which was judged
the stronger fit for a credibility-first B2B infrastructure sell than a louder effect-driven
site would be.

## 10. Signature/custom elements
- Procedural isoline/survey-line generator (`js/isoline.js`), seeded and deterministic, used
  nowhere else in any prior project referenced in this session (none were read).
- The Field→Model→Decision stepper: four renderings of one shared point-set, each adding
  fidelity (raw trace → gridded/smoothed → anomaly-flagged → resolved decision band), tied
  directly to the brief's required "FIELD → MEASUREMENTS → INTERPRETATION → DECISION" idea.
- Stat figures, eyebrows and eyebrows rendered in monospace to read as chart/instrument output.
- Abstract (non-map) corridor diagram for the Pilot 07 case study, contrasting the originally
  surveyed uniform-risk band against the narrower actual active corridor.

## 11. Implementation stack
Plain HTML + CSS + vanilla ES modules. No framework, no build step, no external fonts or
CDN dependencies — chosen as the simplest stack that satisfies the brief, keeps the experiment
fully self-contained inside the run directory, and avoids any repository-wide dependency change.
System font stack for UI text, monospace system stack for data readouts.

Files:
- `index.html` — semantic markup, all copy present in HTML (not JS-injected), so content
  degrades gracefully without JavaScript.
- `css/styles.css` — full design system (tokens, layout, responsive rules, reduced-motion).
- `js/isoline.js` — seeded procedural survey-line generator.
- `js/main.js` — scroll-reveal, hero idle drift, stepper interaction, mobile nav, demo form.

## 12. Primary interactions
- Sticky header navigation to in-page sections (System / Project / Principle / Demo).
- Native `<details>/<summary>` mobile menu (works even without JavaScript).
- Field→Model→Decision stepper: click or arrow-key (full ARIA `tablist`/`tab`/`tabpanel`
  pattern with roving tabindex) between four stages; shared visual updates per stage.
- Demo request form: client-side required/email validation, inline error message, success
  state with a generated reference code, and a reset control — fully functional with no backend.
- Subtle idle drift animation on the hero survey lines, paused off-screen, on tab-hide, and
  entirely disabled under reduced motion.

## 13. Responsive / mobile status
Verified at 1440×900 (desktop) and 390×844 (iPhone-class mobile) with Playwright + Chromium.
Mobile is a deliberately reinterpreted layout, not a shrunk desktop: capability cards and the
project grid stack to one column, the stepper tabs wrap to a two-row control, the mobile nav
is a dedicated anchored dropdown panel (not the desktop bar compressed), and the demo form
collapses to one column. No horizontal overflow at either breakpoint (checked programmatically).

## 14. Reduced-motion status
`prefers-reduced-motion: reduce` is handled in two layers: a blanket CSS override that collapses
all animation/transition durations to effectively zero, and JS that skips the `IntersectionObserver`
reveal animation (content is shown immediately, fully opaque) and never starts the hero's
`requestAnimationFrame` drift loop. Verified programmatically: reveal elements render at
`opacity: 1` immediately under emulated reduced motion.

## 15. Technical verification performed
All verification was done by serving the run directory with a local static file server and
driving real Chromium via Playwright (pre-installed in this environment):
- Page loads with **zero console/page errors** across desktop, mobile, and reduced-motion passes.
- **Zero external network requests** — fully self-contained (no fonts/CDNs/analytics).
- Full keyboard tab order checked from the skip link through nav and hero CTAs.
- Stepper: click and `ArrowRight`/`ArrowLeft` keyboard navigation both verified to change the
  active stage and the visible panel.
- Demo form: empty-submit validation path, full valid submission → confirmation panel with
  generated reference code, and reset-to-form path — all verified end to end.
- Mobile nav: open/close via the native `<details>` toggle, and auto-close on link click.
- Anchor navigation: confirmed (by geometry, not just visually) that every nav target's content
  clears the sticky header on both breakpoints after a `scroll-margin-top` fix (see §17).
- Scroll-reveal: confirmed that content below the fold is invisible only until actually scrolled
  into view (by design), and reaches full opacity once intersected — checked by scrolling
  incrementally through the full page height, not just a single full-page screenshot.

## 16. Test/build result
No build step exists (static site). All functional checks above passed after two rounds of
fixes (see §17). No automated test framework was added, per the brief's instruction to keep
verification lightweight rather than building a large test suite.

## 17. Known technical weaknesses (fixed during this run, logged for transparency)
Three real bugs were found by verification and fixed before completion:
1. **Demo confirmation overlapped the form.** `.demo-confirm`/`.demo-form` each declared their
   own `display` value, which overrode the `[hidden]` attribute's default `display:none`.
   Fixed with explicit `[hidden]{ display:none }` rules.
2. **Mobile nav dropdown positioned against the wrong box.** The `<details>` element shrank to
   its hamburger button's width inside the flex header, so the absolutely positioned dropdown
   (`inset-inline:0`) rendered as a near-invisible 40px-wide sliver instead of a usable menu.
   Rewritten as a conventional right-anchored dropdown panel with an explicit width.
3. **Anchor-nav targets landed under the sticky header.** Clicking "Demo" (and other nav links)
   scrolled the target section's top edge to y=0, which the 68px sticky header then covered,
   clipping the heading. Fixed with `scroll-margin-top` on all anchorable sections.

Residual, not fixed (judged acceptable for a baseline, noted for Human Review):
- The email field's inline error message ("Enter your work email address") fires for both an
  empty and a malformed email, which is slightly imprecise; it does not block any valid
  submission and native browser validation still blocks submission either way.
- No dark-mode variant exists; a single considered theme was prioritized over a toggle.
- The hero's decorative "readout" values (drift, survey pass, sector) are static fictional
  dressing, not dynamically generated — intentional per the brief's fictional-data boundary.

## 18. Known design/experience risks (implementation observation, not Human Review)
- The restrained, text/line-driven approach is a deliberate bet against spectacle; a reviewer
  expecting more visual flourish from a "flagship experience" could read it as under-ambitious
  rather than confident. This is a judgment call the brief explicitly left open (§5, §10).
  No self-score is offered — this is left to Human Review as instructed.
- The signature isoline motif is generated at runtime per page load (seeded, so stable within
  a session) rather than being a fixed asset; on a very old browser without `IntersectionObserver`
  or ES module support the decorative visuals would be absent, though all copy and functionality
  would remain intact since markup is content-first.

## 19. File inventory
```
validation/brief-01/sonnet5-baseline/run-001/
├── index.html
├── css/
│   └── styles.css
├── js/
│   ├── isoline.js
│   └── main.js
└── FINAL_REPORT.md
```

## 20. Git status relevant to this experiment
Branch `validation/brief-01-sonnet5-baseline`, based on `origin/main` @ `24e654b`. Only files
under `validation/brief-01/sonnet5-baseline/run-001/` were created or modified by this
experiment. Two untracked, pre-existing directories (`lamella-experiment/`, `run/`) were present
in the working tree before this run began (carried over from a prior branch's working state);
they were not read, opened, modified, or included in any commit from this experiment, per the
contamination boundary in the governing instructions.

---

## 21. Mandatory isolation declaration

ALFA USED: NO
ALFA CORE USED: NO
ALFA GI USED: NO
ALFA VISUAL LAB USED: NO
ALFA PREMIUM EDGE USED: NO
HUMAN EXPERIENCE GOVERNOR USED: NO
TRANSITION EXPERIENCE GOVERNOR USED: NO
ALFA DOCUMENTS READ: NO
PREVIOUS ALFA EXPERIMENTS READ: NO
LAMELLA USED AS REFERENCE: NO
VELORUM USED AS REFERENCE: NO
FIR DE FOC USED AS REFERENCE: NO
IMPECCABLE USED: NO
IMPECCABLE MATERIAL READ: NO
EXTERNAL DESIGN SKILL / FRAMEWORK USED: NO
PREVIOUS DESIGN IMPLEMENTATION REUSED: NO

All design decisions in this run originated from Brief 01 and native reasoning only. The
only reference to forbidden material in this report is the branch-base-selection step (§4),
which used `git log` commit **metadata** (hashes and commit messages) to pick a clean base
commit — no file content from any forbidden commit, branch, or directory was opened, read,
or inspected at any point in this run.

**BASELINE STATUS: CLEAN**
