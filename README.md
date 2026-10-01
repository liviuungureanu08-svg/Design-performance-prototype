# ALFA Premium Experience Lab

| Experiment | Page | State |
|---|---|---|
| Flagship 01 — Monolith / Inner Architecture | `index.html` (`src/main.ts`, `src/flagship/`) | **CLOSED as R&D.** Technical PASS · spatial transition PASS · premium art direction PARTIAL · human wow NOT ACHIEVED · productization NOT YET. Reusable idea: spatial entry / scale reinterpretation (exterior object → entry → scale change → navigable interior); possible future use = spatial portfolio navigation (future context only, not implemented). Final state: commit `63ab9be`, local tag `flagship01-final` (tag push refused by the remote). |
| Experiment 02 — The Vale of Orrin (semantic material transformation) | `exp02.html` (`src/exp02/`) | Gates A–C self-assessed PASS, D partial, E done in software GL. **Awaiting human review. Not approved, not reusable/productizable until a human says so.** |
| Experiment 03 — The Unbuilt (Gabriel Solutions) | `exp03.html` (`src/exp03/`) | Static endpoints: human review PASS (foundation, premium direction, A↔B identity). **Motion Proof implemented (default view): HUMAN MOTION REVIEW REQUIRED.** Human WOW not validated. Experience Library candidate, not productized. |

## Agent guidance: visual work
Two separate libraries, used in this order and never both loaded whole by default:
1. **ALFA Visual Intelligence** — `docs/alfa-visual-intelligence/` — WHAT should exist and WHY it belongs to the brand (frozen baseline v1.0).
2. **ALFA Technical Visual Intelligence** — `docs/alfa-visual-tech/` — HOW to implement an already-approved direction.

- Visual / art-direction work: read `docs/alfa-visual-intelligence/QUICK_REFERENCE.md` first.
- New visual concept, new experiment, major transformation, art-direction conflict, generic-output diagnosis, or a change to Visual
  Intelligence: read the full Master `docs/alfa-visual-intelligence/ALFA_VISUAL_INTELLIGENCE_v1.0.md`.
- Only after the direction has passed its visual/human gates: use the technical router to choose HOW.
- Routing table and the visual → technical hand-off: `docs/alfa-visual-intelligence/README.md`.
- Previous experiments below are lessons and proofs, not visual templates. Engineering PASS + Art Direction FAIL = FAIL.
- Non-visual tasks need neither library.
- Pending engineering validation (not done): first real-GPU / phone measurements (see `docs/alfa-visual-tech/PERFORMANCE.md`).

## Technical Visual Intelligence Library
`docs/alfa-visual-tech/` is the curated technical toolbox: *how* to build a visual idea (materials, lighting, optics, geometry,
transitions, post, performance tiers, interaction, reference rendering). It is not art direction. Sources are traceable (three.js,
drei, R3F, LYGIA, three-mesh-bvh, three-gpu-pathtracer, canvas-sketch, Book of Shaders, plus pmndrs/postprocessing, glTF-Transform, and the
Khronos glTF sample assets), labelled `[EXTERNAL]` / `[ALFA-PROVEN]`, with licenses. LYGIA and the Book of Shaders are not usable as code in commercial work.
Future agents: read `docs/alfa-visual-tech/README.md` (router), then `SELECTION_MATRIX.md`, then only the 1–2 files it names. Don't read the whole library.
No dependencies were added for it.

## Experiment 03 — The Unbuilt (static endpoints + Motion Proof)
**Thesis: imagination becomes structure.** Brand: Gabriel Solutions. Hero object (internal name *The Fold*): one thick band,
folded three times about skewed fold lines into an asymmetric loop that never closes, split along its whole length by a
30 mm slit, **the Spine**. Everything derives from one flat development (`design.ts` → `fold.ts`: a developable folding map
with real bend radii), so A and B are literally the same object, seen through the same 60 mm lens at eye level.

Hidden generative logic (never labelled): seg 1 *understand* lies on the ground (the only contact with the world) → seg 2
*design* lifts and turns → seg 3 *build* is the bearing plane → seg 4 *amplify*, the widest, pitches back toward its own
beginning and stops in the air, higher and offset: output overhangs input; the loop climbs instead of closing. The plates
widen along the band; the Spine is the one constant they grow around.

| Scene B (built) | came from (Scene A, unbuilt) |
|---|---|
| top and descending planes | plates that recede diagonally toward the Spine, then a faint haze of light where the surface will be |
| physical outer edges | edge hairlines of light that outlive their receding plates, then fade |
| the slit as a precise shadow gap, and a line of sunlight passing through it inside the cast shadow | the Spine continuing as emitted blue light out of the last rib, round the last fold, fading before the loop would close |
| daylight from one opening (warm, physical, received) | blue light emitted by the possibility (no sun, a night room; warm light only on the made part) |
| the open gap between the last plane and the base | the same gap: the spine light dies out before reaching it |

Rendering (`scene.ts`): plain three.js raster converged like a photograph: every pass jitters the sub-pixel offset, each light
across its emitting area (soft shadows) and one shadowed sky direction (sky occlusion); passes are averaged (128 by default),
then AgX + dither. No bloom, no post. Ceramic = dark satin with roughness-only microstructure; reflections come from a
cube capture of the scene itself (its sunlit floor and shaded wall). The light in A is additive geometry (core + soft
falloff) plus a few real point lights so it actually lights the ribs and floor. Daylight in B = a distant spot whose cookie
is the window opening. Nothing animates: the page renders, converges, stops (a 1 px hairline shows convergence).

Review preview (private until shared): https://claude.ai/artifact/XA3iDpWSBKocSG7L7r7wWS (= `artifact/exp03.html`).
Local: `npm run dev` → `/exp03.html?view=a | b | ab | sil` (`?spp=` passes; `?cam=px,py,pz,tx,ty,tz,fov`, `?p=key:value,…`
design overrides, `?clay` are look-dev only). Stills (128 spp, SwiftShader): `artifact/exp03/` (A, B, A/B, silhouette,
portrait 390×844). Single-file page: `node scripts/pack-artifact.mjs exp03` → `artifact/exp03.html`.
`node scripts/shot03.mjs "view=a" out.png 1920x1080` captures after convergence.

Known weaknesses (self-critique): B is calm and precise but may read as a quiet product render rather than "spectacular";
its sunlit faces lean warm-brown; the line of sunlight through the Spine inside B's shadow is subtle at full-frame size; in A
the edge hairlines can still be read as an outline by some viewers, and a small blue point remains where the light leaves the
last rib; the B wall's sunlit band sits at the frame edge; portrait is recentred, not individually art-directed; verified
only in software GL (SwiftShader), a real GPU converges in seconds but was not measured.

### Motion Proof (`motion.ts`, `motion-page.ts`; default view of `exp03.html`)
**Mechanism.** One hero mesh: B's plates, each vertex carrying its flat position `u`, its fraction across the plate and A's
plate width there. A vertex-shader *build field* narrows each plate along its isoline of the folding map (isolines are rigid, so
a narrowed plate is exact geometry: nothing scales from zero, nothing pops). Two frontiers travel along the band:
1. **light boundary** (`uE`): two lines leave the spine's lips and travel to where the plate edges will be (continuing A's
   construction hairlines); it runs only ~1–1.9 m of band ahead of the matter, so a complete outline never exists;
2. **matter** (`uM`): the plate grows from the spine out to that boundary (width), then gains thickness; the newest matter still
   emits the spine's blue and cools behind its front (emission → reflection). A's implied-plane haze withdraws as matter arrives.

**Arc (scroll progress p, deterministic `state = f(p)`):** 0–15 % A, nothing moves · 15–32 % the spine's single line parts into
its two lips (the slit has width: it is not drawn on) and the camera begins a small lateral move · 32–45 % boundary light peels off
the spine over the receded planes · 45–60 % signature: matter forms seg 3 → last fold → seg 4, glowing at its front · 60–75 %
structure complete, glow and camera settle · 75–90 % light handoff, light by light (A's spots, emitters and spine light fade;
daylight through the opening rises; sky/env/fog/wall/floor interpolate; daylight arrives *before* A's lights leave, so there is
no dark trough) — the spine that emitted light now admits a line of sunlight through the slit into the cast shadow · 90–100 % B.

**Camera.** Same ~60 mm lens and position as both endpoints; a single eased offset (≈0.95 m left, 0.3 m up, 0.7 m in, target
nudged ≈0.12 m) peaking around 45–55 % and gone by ~86 %: observer → investigator → witness. No orbit, no FOV animation.

**Rendering while scrolling.** Each frame renders 2 passes (`?mpp=`) with a short history (new pass weight ≥ 1/3, sample sequence
keeps advancing); 220 ms after the viewer stops, accumulation restarts clean and converges to the full still (`?spp=`, default 96).
Progress is SmoothDamp(0.26 s) of the scroll position, snapped exactly onto it at rest (same position → same image).
Float32 accumulation falls back to half float where the GPU can't render to float32 (common on phones).

**Review.** `npm run dev` → `/exp03.html` (scroll), `/exp03.html?t=0.5` (frozen at 50 %, converges), `?view=a|b|ab|sil`
(static endpoints, unchanged). Freeze frames: `node scripts/shot03.mjs "view=motion&t=0.5&spp=64" out.png 1600x900`.
Robustness: `node scripts/robust03.mjs`. Representative frames: `artifact/exp03/motion/`.

## Experiment 02 — The Vale of Orrin
**Concept: map → territory.** Scene A is a printed survey sheet (contour map with hypsometric tints, engraved
relief shading, water lining, title block). Scene B is the same sheet as a paper relief model under low sun: the
map's own paper splits into 24 leaves, each cut exactly along one printed contour, stacked into the land.
Scene A is the construction drawing of Scene B, because both come from one authored height field:
`terrain.ts` → marching-squares loops → (a) the printed contour lines and tints, (b) the leaf geometry.

Ancestry (Scene B ← Scene A):
| Scene B | came from |
|---|---|
| each terrace edge / cut wall | the printed contour line at that height (same polyline) |
| terrace tops + the coloured strata on the walls | the hypsometric tint bands; the legend ramp stays flat as their key |
| real cast shadows from a low western sun | the printed relief shading, drawn from the same azimuth; it fades as real shadow arrives |
| the lake: a reflective water surface over a terraced basin | the printed blue lake; its engraved shore-parallel water lining leaves the paper as the water arrives (faint swell at the same phase) |
| summit, "Carn Orrin", "Western Fell", title block | the same printed marks; labels are placed on a single leaf so type never breaks across a cut |

Perceptual anchors: the lough (the only cool shape; its silhouette and position never change) and the summit mark.

Choreography (`choreo.ts`, pure functions of progress): 0–3% hold → 3–12% the contour lines open into hairline steps
(anticipation) → 10–75% leaves rise bottom-up in overlapping windows (each lifts everything above it, so the stack
is always in contact; lighter upper leaves arrive quicker with a little overshoot; three inertia groups in `main.ts`)
→ 42–78% printed shading hands over → 50–93% sun lowers and warms → 82–96% ink becomes water. Camera: one slow
settle from 64° to 36° elevation and −14° azimuth (document → object); no fly-through.

What worked: one-source construction makes ancestry literal and legible; the 37–63% band reads as "the print is
becoming terraces", not as a dissolve; walls caught by side light carry the material read (paper thickness).
What failed / was replaced: contre-jour sun (muddy walls) → west side light; reflection-distortion ripples (aliased,
shader-demo look) → still water + faint brightness swell; printed water lining under water (jaggy) → separate plate
that fades out; plinth rising alone at 20–35% ("map on a box") → overlapping leaf windows; light change competing with
the rise at 62–69% → light now starts after most leaves have landed.

Unresolved: ~0–12% is quiet (the anticipation is subtle at full-sheet scale); the land tops are smooth-flat
(paper tooth only at grazing light); the summit's ridged hillshade is noisy in A; portrait leaves empty bands above
and below the landscape-shaped object; Scene B lowers overall key (desk becomes slate-charcoal); verified only in
software GL (SwiftShader), never on a real phone GPU.

Review preview (private until shared): https://claude.ai/artifact/QV3Tyms5JY3kiFaigGkLrF (= `artifact/exp02.html`).
Verification: typecheck + build clean; packed page console clean; real-scroll robustness (slow forward, jump+pause, fast
reverse, flick, resize) correct; fallback poster and portrait checked; reduced motion = shorter inertia only (logic,
not visually verified in the packed build); all in SwiftShader, no frame-rate or phone-GPU measurement.

Run: `npm run dev` → `/exp02.html` (`?debug`, `?u=0.5` pins progress, `?fallback=1` shows the printed poster).
`PAGE=exp02.html node scripts/strip.mjs "" m 0 1 0.0625` contact sheet; `node scripts/pack-artifact.mjs exp02` → `artifact/exp02.html`;
`node scripts/robust02.mjs` (serve `artifact/` on :8099).

---

# Flagship 01 · Monolith / Inner Architecture (closed)

Isolated creative lab (not the production ALFA repo). **Status: Gate C reworked after human review (TARGETED REWORK); self-inspected only; NOT human-approved.**

Checkpoint before the rework: tag `flagship01-v1` (local).

## Preservation
- Round 1 "Ember → Tide": commit `5e2e40a`, tag `round-1-complete`, remote branch `round-1-archive`.
- Round 2 "One Light": commit `feb4eaf`, local tag `round-2-complete` (tag push was refused by the remote; the commit is in this branch's history). Its sources were removed from the working tree in the first Flagship commit; `git checkout round-2-complete` restores them.

## Concept (one world, two interpretations)
One building, authored once. The exterior is its closed state. Ancestry:
| Exterior | Interior |
|---|---|
| tall mass **L** / set-back mass **R** | left / right walls (slide apart, R leads, L is heavier and lags) |
| metal lintel **C** | ceiling (lifts and shifts) |
| three glass blades in R's recess | turn edge-on, glide into the hall as glass columns (the near-miss) |
| rear closure **K** (hidden) | end wall, retreats to deepen the void; carries the slot |
| strip reflection on L's seam bevel | deviates → the line becomes a glimpse of the lit interior *through* the seam → the slot and the ceiling line, all on one axis (x = 0) |
| hidden inner faces (only seen through the seam) | pale honed stone walls of the hall, lit from the ceiling line: the interior is lighter than the object |

## Architecture
```
src/flagship/world.ts     meshes (rounded boxes), materials, analytic occluder bounds, floor mirror
src/flagship/shading.ts   shared GLSL patch: analytic slab occlusion (ray/AABB), sampled line light + rectangle mirror of the slot,
                          the anchor (reflection → deviation → subsurface), procedural mineral roughness/bump/panel seams
src/flagship/env.ts       authored dark studio, baked through PMREM
src/flagship/choreo.ts    every curve: slabs, cap, fins, light, camera (monotone cubic keyframes), per-mass inertia hooks
src/flagship/engine.ts    renderer, MSAA half-float composer (bloom, grade, output), lens shift, portrait cinematography
src/main.ts               scroll → SmoothDamp per mass → engine; minimal UI; fallback poster
```
Everything is a pure function of scroll progress (reverse, pause, jump and reload are coherent).

## Rework (human gate)
- Interior finish on hidden faces + luminous ceiling line (a line light under the lintel along the seam axis) → the gap reveals a lit room, not darkness.
- Camera moves onto the hall axis during 38–58% so the whole object and the room inside it share one frame; threshold adds a look-up to the ceiling, then settles; eye-adaptation exposure across the threshold; slot emission lowered.
- Final text set as dark ink on the pale wall (landscape) / light ink on the dark floor band (portrait).
- `node scripts/strip.mjs "" name 0 1 0.0625` renders a labelled progress contact sheet.

## Run
```
npm i && npm run dev          # ?debug exposes window.__lab.set(u); ?u=0.5 pins progress; ?raw disables bloom/grade
                              # ?cam=px,py,pz,tx,ty,tz,shift overrides the camera (look-dev)
node scripts/seq.mjs "" prefix 0,0.5,1 960x540     # real-Chromium stills → /tmp/claude-0/s/ (HIDE=C hides the cap)
node scripts/robustness.mjs
npm run build
```

## Known limitations
- Verified only with software GL (SwiftShader); no real-GPU/phone measurements. Adaptive render scale exists but is untuned.
- Hall proportion (2.5 m wide, 9 m tall) is fixed by the exterior; the scale beat is a look-up at ~83–87%, not a wide final frame.
- Glass columns read mostly through refraction and edge reflection of the slot; they are dim.
- Portrait framing is recentred but not individually art-directed per shot.
