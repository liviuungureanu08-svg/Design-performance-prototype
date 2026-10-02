# EXP04 — MORE THAN PIXELS (Gabriel Solutions)

**Status: HUMAN REVIEW REQUIRED.** Human WOW is not declared and nothing is promoted to ALFA Core. No CONTROL run was started.
Treatment: ALFA GI Operational Package v1.0 + frozen Visual Intelligence + EXP04 technical router. Model/effort lock: Sonnet 5.5 Medium.
Route: `exp04.html` (`src/exp04/`) · single-file review build `artifact/exp04.html` · stills `artifact/exp04/stills/` · scripts `scripts/{shot04,stills04,robust04,det04}.mjs`.
EXP01 / THE READING, EXP03 / The Unbuilt, ALFA Core, frozen Visual Intelligence and prior evidence are untouched (only `vite.config.ts` gains an `exp04` input and `scripts/pack-artifact.mjs` an `exp04` background colour).

## 1. Frame
*This brand exists to turn a business problem into a complete digital system, in a differentiated way through understanding-design-build thinking that reaches below the screen, and people should feel* **impact → discovery → desire to have that depth applied to their own website.**
Fixed concept: the visitor believes they see a website; they must discover the deeper system. Visual + structural, not a diagram/HUD/node graph.
Known fact vs assumption: scope (web/apps/platforms/AI/automation) and UNDERSTAND→DESIGN→BUILD→AMPLIFY come from the brief. The five "strata" (Interface, Behaviour, Automation, Data & AI, Operations) and all page copy are my illustrative interpretation. The contact CTA target is a placeholder anchor (no real contact fact was supplied).

## 2. Visual thesis
**A website is the front face of a body.** The page is an orthographic elevation of a physical assembly: every headline letter, card, button and the big disc is the end face of a prism that runs back to a rear wall. Seen end-on (A) nothing says so; seen from the side (B) the same objects explain A.
Ceiling lesson from The Unbuilt addressed: nothing is *constructed* in this experience. The same bodies are present from frame 0; only the viewpoint (and the ground) changes. The reveal is a re-reading of A, not a build-up to B.

## 3. Ancestry map (A → reinterpretation → B)
| In A (a flat page) | Truth that was already there | In B |
|---|---|---|
| soft drop shadows under cards, letters, disc | real cast shadows of bodies on a wall 10 units behind (key light rides with the camera: frontal in A, raking in B) | long shadows on wall/floor |
| tiny rim/thickness at the load sway and in early scroll | the bodies' sides | the full prisms |
| headline "More than pixels." | letters are black prisms with staggered depth | typographic architecture; letter fronts still read |
| red disc with a pixel-matrix face | a vermilion shaft whose end face is the "screen" | cylinder, pixel matrix on the end only |
| nav links / sub-copy | the only truly flat content, printed on the rear wall | still printed on the far wall |
| nothing | strata inlay bands wrapped round every body at the datum depths (sides only: invisible end-on) | vermilion bands + floor datum Interface→Behaviour→Automation→Data & AI→Operations |
Perceptual anchors: the page composition (letters, disc, cards keep their screen-space layout through the orbit), the vermilion disc, the letter fronts.

## 4. Concept search (GI)
Families explored (structurally different):
1. **Orthographic truth / bodies behind faces** — SELECTED.
2. **Pinscreen / pixel-column relief** (every pixel gets depth) — rejected: reads as Map→Territory (EXP02 mechanism) and as a data-bar city; encodes height, not behaviour/relationship.
3. **Tapestry-back / flip side** (clean front, knotted back) — CHALLENGER, kept through the selection critique but not prototyped (paper-level only): a flip is a replacement rather than a reinterpretation, and thread metaphors are a cliché for "systems".
4. **Lenticular / moiré** (UI at one angle, structure at another) — rejected: a trick; static B weak; no physical truth.
5. **Façade → building section** — absorbed into family 1 (the datum strata are the section drawing).
6. **Thick perforated wall, light through apertures** — rejected: re-enters Flagship 01/Unbuilt (dark monolith, emitted light).
7. **Iceberg / waterline** — rejected: cliché.
8. **Stacked glass planes with nodes** — rejected: blacklist (node graph, glass, HUD).
De-correlation moves used: change literal vs implied (depth is literal, meaning implied), change point of view rather than build content, convert representation into physical consequence (shadows, thickness), remove the hero object (the page is the object).
Anti-generic: Logo Swap — letters/CTA/cards are Gabriel copy, but the *mechanism* (a page is the front face of a deep system) is specific to "what Gabriel sells". Nearest-competitor swap: a competitor could re-skin the idea but would need the same claim; partial pass (see weaknesses). Remove-the-Effect: A stands alone as an editorial hero. Technique substitution: a flat crossfade to a diagram would lose the "same objects" reading → coupling is strong.

## 5. Important reframes
- Early draft had vermilion conduit rods strung between bodies (relationships layer). Review of A showed rods visible through page gaps → **removed**; relationships/strata are now inlay bands on body sides only (zero footprint end-on).
- Perspective camera at 1.6° still showed 25 px of side faces on off-centre letters → lens now starts at 0.06° and grows geometrically while the camera dollies (dolly-zoom), so A is an elevation and perspective arrives late.
- Worst frame (p≈0.3): the floor appeared as a dark horizontal slab. Floor/datum now fade in only when the pitch makes them readable as ground.
- First B composition had the model too large/low and the floor labels mirrored (canvas mapping bug); both fixed.
- Orbit timeline compressed (k completes at p=0.80) after the first sweep showed 0.6–1.0 as a dead hold.

## 6. Static gate
Self-assessed, with stills: A (`stills/desktop-p0.png`) = a believable premium editorial hero (serif headline, vermilion pixel-matrix disc, three cards, real depth shadows) — PASS as portfolio-quality at internal bar. B (`stills/desktop-p1.png`) = side view of the assembly with datum floor, stratified inlay and pixel-face cylinder — PASS (internal); the dark letter mass is dense (see weaknesses). Human Static Gate remains open.

## 7. Motion / interaction
Scroll-linked, `state = f(progress)` (SmoothDamp 0.34 s on scroll only; the frame itself is a pure function). Phases: 0–0.08 hold A (one-time load sway reveals edge thickness; pointer parallax on desktop) → 0.08–0.8 orbit/dolly-zoom (yaw −34°, pitch 33°, fov 0.06°→24°, key light rides with camera, ground arrives) → 0.82+ explanatory panel + CTA. A single caption ("Look closer. The page has a back.") sits in the middle phase.
Freeze review: p = 0 / .1 / .2 / .3 / .4 / .5 / .6 / .7 / .8 / .9 / 1 (desktop), 0 / .4 / .7 / 1 (portrait). Worst frame was p≈0.3 (fixed, see §5); at 0.3 the letters read as extruded type with contour-like inlay lines, which I consider the strongest frame for retrospective recognition.
Validation (software GL, headless Chromium, `scripts/robust04.mjs`, `scripts/det04.mjs`): GL canvas bytes are IDENTICAL at p = 0 / 0.5 / 1 across different scroll histories (forward, reverse, jump); jump 0→0.9→0.1 equals direct 0→0.1; no horizontal overflow; resize wide→tall→wide keeps progress (±0.002) and rebuilds the correct composition; console/runtime clean on dev and on the production build.

## 8. Mobile / reduced motion / fallback
- Portrait is a separate composition (`layout.ts`, `tall`): stacked 3-line headline, phone-width nav, stacked sub-copy/CTA/cards, different camera (zoom/pitch/shift) and a bottom-sheet panel. Emulated 390×844 touch viewport at DPR 2 only — **no physical device was tested**; real-phone WebGL 2 / shadow-map cost is UNVALIDATED.
- Reduced motion (media query or `?motion=reduced`): no scroll pin, no sway/parallax/damping; same renderer, with a keyboard-accessible Surface / Behind it toggle (←/→ also) that snaps between the two designed states; panel and information identical.
- No WebGL 2 (or `?nogl=1`): pre-rendered stills of both states (both compositions) + the same toggle.
- `quality: 'low'` on coarse pointers / narrow screens: 2048 shadow map, DPR cap 1.75.

## 9. Known weaknesses (do not treat as a to-do)
- Revelation partly pre-spoiled: A's headline already says "More than pixels." and its sub-copy lists the offers, so discovery is of *form* (depth) more than of *scope*. B adds the strata and the four verbs, but the system itself is represented by stratified prisms, not by anything that visibly *behaves*.
- B's letter forest is dark and dense; legibility of "More than pixels." survives only on the front faces (best around p 0.3–0.5). The large black CTA slab dominates the B foreground.
- Strata inscriptions are small; wall/floor grey in B is flatter than the A paper.
- Signature clarity: the dolly-zoom orbit is a known cinematic device; the specific thing (a flat page revealed as the front face of deep letters/shafts) is the distinct part. Risk of "3D extruded type" being read as a generic effect.
- Challenger (tapestry-back) was not prototyped, so the choice rests on critique rather than comparative renders.
- Pointer parallax is desktop only; touch has the scroll orbit only. Performance on real GPUs unmeasured (4096 shadow map re-rendered per frame while moving).
- Contact CTA is a placeholder anchor; all copy illustrative.

## 10. Comparison vs The Unbuilt (contextual, not causal)
Higher chance of retrospective recognition (same bodies throughout, nothing built); weaker spatial elegance/material depth than a single sculpted object; much more Gabriel-literal (page/website as the subject); stronger commercial legibility (visible CTA, scope, four verbs); likely higher genericity risk in the 3D type. All verdicts are the agent's self-assessment: **Human WOW / retrospective revelation / distinctiveness / desire: UNVALIDATED (human-only).**

## 11. Deviations
None from the frozen brief/protocol. Effort proxy: ~one working session; CONTROL not run.
