# Technical Evidence — INBOUND

All results below were produced in this session in **headless Chromium (Playwright, software raster, no GPU)**. No physical phone, no real GPU, no Safari/Firefox, no screen reader, no human user. Labels: FACT (measured here) / OBSERVATION (seen in captures) / LIMITATION.

## 1. Realization (technique ≠ mechanism)
| Mechanism (what the viewer should perceive) | Realization chosen (replaceable) |
|---|---|
| one stream; one switch is the shared cause of everything that moves | `Field.setOn()`; every visual consequence derives from `on` + a fixed-step simulation (`field.js`) |
| unattended work accumulates and heats | per-card height field (8 px columns) → mound; heat = f(waiting minutes) → card tint + edge bar + "N min" label |
| the system reads the queue | backlog lifted in order of `born` (oldest first), 24 ms stagger, capped at 0.9 s |
| messages bend into the lane that handles them (no teleport, no crossfade between scenes) | damped spring steering (ω 8.2, ζ 0.8) carrying each card's current velocity; in-flight cards bend mid-air |
| arrival changes state | height closes toward the line on approach; on landing the old text leaves, then the stamp line arrives (sequential, 140 ms) |
| repeats are understood, not duplicated | a repeat flies onto its existing line → `×N` badge + brief ink mark |
| overflow is never lost | rows past capacity land on a visible deck under the last row |
| release keeps history, not behaviour | handled lines drift down together and fade (filed); new arrivals pile again |
| AMPLIFY | after ≥ 2.5 s on, one insight computed from the routed messages' tag count |
Stack: vanilla ES modules, Canvas 2D (cards cached as text sprites per card; surface, shadow sprite, heat drawn live) + semantic DOM for all text, controls and counts. No framework, no WebGL, no dependency added. Technique substitution: a DOM/CSS version would carry the same mechanism; WebGL would add nothing perceptible.

## 2. Automated checks
| Check | Result |
|---|---|
| `tsc --checkJs` (non-strict) over `main.js`/`field.js`/`data.js` | FACT: clean (strict mode reports only implicit-any / lazy-init noise) |
| Repository `npm run build` (existing pages) after this work | FACT: passes; `git status` shows only `experiments/` as new |
| `qa/interact.mjs` (real mouse, keyboard, CDP touch, viewport changes) | FACT: **22/22 PASS**, console/runtime clean |
| `qa/sequence.mjs` deterministic press/release sequences (1440×900, 390×844) | FACT: produced; reviewed frame by frame (§4) |
| `qa/stills.mjs` 19 viewport/business/reduced-motion stills + 2 full-page | FACT: console clean |
| Single-file `INBOUND_review.html` from `file://` | FACT: runs, hold works, font loads, zero external requests |

`qa/interact.mjs` covers: mouse hold on/off; acknowledgement within ~90 ms (lane structure visible, nothing landed yet); backlog fully routed while held (37 waiting → 36+4 routed, 0 waiting); label reflects state; arrivals pile again after release with history kept; insight hidden after release; business switch neither triggers a hold nor leaks counts; latch; session section reports real counts; no horizontal overflow at 1440 and 390; Space hold without page scroll; Enter latches; aria-live announcements; touch hold; **vertical swipe scrolls without switching the system on (0 flashes)**; reduced motion (no autonomous stream; same messages routed instantly; toggling back restores the pile; counts not inflated); determinism (identical canvas for identical seed + steps); resize wide → narrow → wide while running.

## 3. Defects found and fixed (each found by capture or test, not by reasoning alone unless stated)
1. Template repeats visible in lanes → shuffled per-lane decks + larger pools + `×N` grouping.
2. Double-exposure frame at landing (full text and stamp line superimposed) → sequential fold.
3. Phone: routed cards pushed past capacity faded **mid-air, uncounted** (5 of 44 handled after 4 s) → overflow deck; all cards land.
4. Deck z-order followed creation time, not lane position → depth sort.
5. Release: translucent deck layers superimposed text; mid-route cards fell through rows → buried layers leave at once, visible rows drift down together.
6. Burst crowding (full-height cards into 36 px slots) → height closes on approach.
7. Touch scroll starting on the field flashed the system on → 110 ms touch-intent delay. **Reproduced first:** synchronous original path `flash: 1`; fixed `flash: 0`. (A 0 ms variant did *not* reproduce it in emulation because `pointercancel` arrives before timers — recorded as a test-harness limitation.)
8. Short screens: lanes/pile collided with the lede → layout reads the measured intro bottom.
9. Tablet 820: five columns truncated text to uselessness → rows below 900 px.
10. Empty white card in a lane while its top line was still in flight → text hides only under a landed line.
11. Phone insight covered a wrapped headline → placed from the measured headline bottom.

## 4. Worst-frame / worst-state review
Sequences: `evidence/sequence/contact-press.jpg`, `contact-release.jpg`, `evidence/sequence-390/contact-press.jpg` (frames at 0, 40, 80, 120, 200, 300, 400, 500, 650, 800, 1000, 1300, 2000, 3000 ms after press; 0–6000 ms after release).
- OBSERVATION: causal order holds at every inspected frame: lane rules draw (40–120 ms) before any card moves; the oldest (most heated) cards leave first (200–700 ms); counts tick only on landing; steady state by ~2 s.
- **Worst remaining, desktop:** ~1.0–1.5 s after a press with a large backlog: many cards closing into lines at once; transient small text (~7–8 px) while folding. Reads as "flowing into columns", not as a defect, but it is the least composed frame.
- **Worst remaining, phone:** 0.5–1.3 s after press: pile and lane rows share the same band → dense collage. Information recovers by ~2 s.
- **Worst remaining, release:** first ~250 ms: lane rules fade while filed lines drift; clean after fix 5.
- Not inspected: frames under real GPU timing jitter (only fixed-step captures and headless rAF).

## 5. Performance
- FACT: headless rAF interval while routing at 1440×900, DPR 1: median 16.7 ms, p95 16.8 ms, max 16.8 ms (i.e. not frame-bound in this environment).
- LIMITATION: an earlier "0.08 ms/frame" step+draw timing was **discarded** as meaningless (canvas rasterisation is deferred in headless). No real-device frame timing exists. Estimated risk: low–medium on low-end phones (≤ ~120 cards, cached text sprites, one shadow sprite, no blur per frame).
- Pauses when the field is off-screen or the tab is hidden (holds released). DPR capped at 2.

## 6. Accessibility / reduced motion / responsive
- Reduced motion (`prefers-reduced-motion` or `?motion=reduced`): no stream, no flight; a plain switch shows the same messages piled (with heat) or routed (with stamps), counts identical, insight identical. Meaning preserved (VI §30A); impact is not (the impact *is* motion under the hand).
- Hold is never the only path: Space hold, Enter latch, "Keep it running" button, "Run it for ten seconds" in the next section.
- Canvas is `aria-hidden`; a prose description, an `aria-live` region (state changes, insight) and the DOM "Where it went" section carry the information.
- Contrast: lane text #1b1b1b / #3f3f3c on white; status/eyebrow #6a6a66 on #f3f2ee (≈ 5.0:1, computed from hex, not tool-verified). Piled cards are atmospheric by design (overlap intended; T6).
- Responsive: wide (columns) ≥ 900 px; rows below; short-height scale; checked at 1920×1080, 1440×900, 1366×640, 820×1180, 390×844, 360×640.
- LIMITATION: no screen-reader session was run; no keyboard-only full walkthrough beyond the scripted checks.

## 7. Known limitations (truthful list)
- Not run on any physical device or real GPU; Safari/iOS long-press behaviour untested (CSS `-webkit-touch-callout: none` + `contextmenu` prevention are in place but unverified on iOS).
- Business content is invented and labelled; contact address is a placeholder.
- Phone transition collage (above); in-flight cards pass under the lede on 360×640.
- English only.
