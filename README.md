# ALFA Premium Experience Lab — Flagship 01 · Monolith / Inner Architecture

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
