# ALFA Premium Experience Lab

| Experiment | Page | State |
|---|---|---|
| Flagship 01 — Monolith / Inner Architecture | `index.html` (`src/main.ts`, `src/flagship/`) | **CLOSED as R&D.** Technical PASS · spatial transition PASS · premium art direction PARTIAL · human wow NOT ACHIEVED · productization NOT YET. Reusable idea: spatial entry / scale reinterpretation (exterior object → entry → scale change → navigable interior); possible future use = spatial portfolio navigation (future context only, not implemented). Final state: commit `63ab9be`, local tag `flagship01-final` (tag push refused by the remote). |
| Experiment 02 — The Vale of Orrin (semantic material transformation) | `exp02.html` (`src/exp02/`) | Gates A–C self-assessed PASS, D partial, E done in software GL. **Awaiting human review. Not approved, not reusable/productizable until a human says so.** |

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
