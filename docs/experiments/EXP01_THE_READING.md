# Experiment 01 (ALFA Generative Intelligence) — THE READING · Evidence record

**Status: HUMAN REVIEW REQUIRED.** Human WOW not declared. Not promoted to ALFA Core. No CONTROL run started.
Protocol `EXPERIMENT_01_PROTOCOL_v1.1_FROZEN` · Brief `GABRIEL_SOLUTIONS_EXP01_BRIEF_v1.0` · Treatment `ALFA_GI_OPERATIONAL_PACKAGE_v1.0` · Model/tier: Sonnet 5.5 Medium (single run, no escalation).
Branch `ccr-86d3be6b-jy48id`. Code: `exp01.html`, `src/exp01/`. Review build: `artifact/exp01.html` (single self-contained file). Stills: `artifact/exp01/stills/`.
Route: `npm run dev` → `/exp01.html` (`?brief=freight|atelier`, `?p=0..1` freezes a progress state, `?motion=reduced`).

## 1. Frame
Problem: make a serious client feel *"this is spectacular, and I want this thinking for my business"* (IMPACT → DISCOVERY → DESIRE) by showing that Gabriel Solutions turns an unclear business problem into a complete system (UNDERSTAND → DESIGN → BUILD → AMPLIFY).
Immutable: Gabriel business truth, five information items, accessibility/reduced-motion survival, frozen protocol. Free: everything else. Anti-fixation: no central object, dark void, blue line, white-room reveal, scroll-morph-of-an-object, glass/glow.

## 2. Concept families (structurally different) and verdict
| # | Family | Differs by | Verdict |
|---|---|---|---|
| F1 | **Brief → system, reader's grammar** (client's own words are read, marked, and each problem becomes one surface) | thesis = *Gabriel reads*, information is the structure, causality = phrase→part | **SELECTED (as reframed, §3)** |
| F2 | Self-building site (the page builds itself UNDERSTAND→AMPLIFY) | progressive construction | Rejected: = Experiment 03 failure mode (*construction ≠ revelation*); agency reel |
| F3 | Atelier object table (3D artefacts of web/app/AI on a bench) | spatial/material | Rejected: object hero, 3D for its own sake, industry swap passes trivially |
| F4 | Kinetic-type manifesto | typographic | Rejected: typography spectacle with no business substance |
| F5 | Redline/diagnostic lens over a weak existing site | interaction = lens | Kept as challenger: strong revelation, but needs a real prospect's site; weaker "complete system" |
| F6 | Tailoring/bespoke metaphor (measure → pattern → cut → wear) | metaphor | Rejected: metaphor outranks product truth; "artistic studio" risk |
| F7 | Live prompt-to-app generator | interaction = prompt | Rejected: *empty AI hype*, would fake capability |
| F8 | One business across four surfaces (exploded system diagram) | information structure | Absorbed into F1 as the endpoint (surfaces are real UIs, not boxes) |

**De-correlation / reframe (major):** F1–F3/F8 shared the hidden premise *"Gabriel shows its work."* Operator applied: change agency + reframe the client promise → *Gabriel reads yours.* This moved the search from showcasing artefacts to the **client's own sentence**, which is also the fix for the Experiment 03 lesson: after the system exists, the original message is re-read and each phrase is seen to have **been** the requirement (retrospective inevitability by evidence, not by construction). Struck "solution guesses" ("I need a website? or an app") vs kept *problems* is the commercial insight made visible.

## 3. Selected direction — THE READING
**Thesis: every unclear brief already contains its system.** A first message (illustrative) is set huge on paper. A reading pen marks signal (problems, red underline) and strikes noise (the client's guessed solutions, uncertainty). The note settles into an annotated column; one orthogonal thread per problem leaves its phrase and ends in a tag quoting it; the surface unfolds *from that tag* (DESIGN: identity + structure on skeletons → BUILD: data, logic, states replace skeletons in place → AMPLIFY: it runs — a message becomes an order, the list reflows, the assistant answers). A final re-read pass lights each phrase with its part. Palette is motivated: paper + proofreader's red = Gabriel as *reader*; each system takes the **client's** own brand (bakery / freight / lighting atelier) = range across local, medium, premium.
Ancestry: same word nodes in A and N (moved, not replaced); phrase → thread → tag → surface. Anchor: the red pen/threads.
Interaction: scroll-scrubbed state = f(progress) (deterministic, reversible); hover/tap links a part to its phrase; brief switcher; "Write yours" (live keyword first-read of the visitor's own paragraph, honest labelling, mailto).

## 4. Critique results (Phase D)
Gabriel relevance: high (reads → system is the stated promise). Logo/competitor swap: weak-to-moderate pass — the mechanism (client language → system) is specific, but a studio could reuse it with other content/identity. Remove effect: information survives (reduced-motion shows annotated note + tagged system + statement). Technique substitution: pure DOM/SVG — no WebGL needed; none used. ALFA style detection: no object/blue/dark/glass; shares only the *retrospective-evidence* mechanism with Exp 03, by project logic. Novelty serves value: yes (desire = visitor writes their own).

## 5. Static gate
Scene A (hero message with marks) and Scene B (annotated note + four-surface system, three briefs) rendered and reviewed before motion (`artifact/exp01/stills/bakery-p0.12.png`, `bakery-p1.png`, `freight-p1.png`, `atelier-p1.png`). Self-assessed **PASS/ADEQUATE-to-STRONG** (hierarchy clear, concept legible without explanation, surfaces are credible interfaces). Honest reservations: surfaces are HTML mock UIs without photography; the hero relies on typographic scale + red mark craft rather than a visual image.

## 6. Self-critique → fixes (major)
1. Round-cap dots from stroke-dash on unread words and non-scaling-stroke breaking `pathLength` → per-frame stroke units, hidden until reached.
2. Move phase: words crossing/overlapping → stagger by *line* so lines travel as units; captions delayed until the note is settled and cross-faded without overlap.
3. Threads crossing note text → N layout forces a line break after each signal/struck run so threads leave from clean line ends; orthogonal lanes.
4. AI/phone/flow cards clipped or sparse → re-budgeted card heights, inline forecast row, extra list rows, shorter atelier quote.
5. Header overlap on scroll (mobile) → header gradient; mobile statement added.

## 7. Technical validation (software Chromium; **no real-GPU/phone measurement — none needed, no WebGL**)
`npx tsc --noEmit` clean; `vite build` OK (exp01 JS 36 kB / 13 kB gz); `scripts/robust01.mjs`: determinism (forward vs reverse/jumps identical pixels) PASS; no horizontal overflow 1440 / 390 / 360 / 820; desktop 1280×720, 1920×1080, 1024×768, 1366×640 all parts inside viewport PASS; brief switch rebuild PASS; reduced-motion final state PASS; console clean. Mobile = restructured (sticky note strip + stacked consequences), not a cropped desktop.
**Not tested:** real phone/touch, real-GPU frame rate, screen-reader pass, Safari/Firefox, 4K, user-testing.

## 8. Deviations / blockers / known gaps
- Contact address is a placeholder `hello@gabrielsolutions.example` (missing business truth; does not change the solution). Replace before any real use.
- Example businesses and numbers are invented and labelled illustrative; no results/metrics claimed.
- English only (language of audience not specified).
- Tag pushes are refused by the remote (as before); no tag created.
- No human corrections or interruptions so far (rescue cost: 0). Wall-time/token proxy: single continuous session; ~10 build/critique iterations; one major reframe (§2).

## 9. Known remaining weaknesses (for the human reviewer)
- Impact is typographic/editorial; no single image-level "wow object". Whether that reaches WOW is the human's call.
- Surfaces are illustrative UI, strongest in bakery; freight/atelier slightly lighter.
- Move phase (≈0.34–0.5) is orderly but is still a reflow of text; intended causality is read→settle, not spectacle.
- Keyword reader in "Write yours" is heuristic and can mis-read; labelled as such.
- Logo/competitor swap resistance moderate (see §4).

## 10. Outcome self-assessment (not human verdicts)
O1 structural diversity: STRONG (8 families, 1 premise reframe). O2 Gabriel relevance: STRONG. O3 genericity/fixation: ADEQUATE–STRONG. O4 best-candidate quality: ADEQUATE–STRONG (confidence medium). O5 Human WOW: **NOT SELF-DECLARED — HUMAN REVIEW REQUIRED.** Comparison with The Unbuilt (contextual only, not a causal control): different grammar (language vs geometry); addresses its recorded failure mode by design; any difference in outcome cannot be attributed to ALFA GI alone.
