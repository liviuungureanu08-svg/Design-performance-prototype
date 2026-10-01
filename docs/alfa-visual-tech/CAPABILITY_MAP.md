# Capability Map (ID index)

One line per technique: read this, then open only the file holding the IDs you need.
Labels: **E** = `[EXTERNAL]`, **A** = `[ALFA-PROVEN]`, **X** = `[EXPERIMENTAL]`, **REF** = `[REFERENCE-ONLY]`. Cost: L / M / H / XH (extreme).

## 01 Materials → `techniques/01-materials.md`
| ID | Technique | Label | Cost |
|---|---|---|---|
| M1 | Physical transmission (shared screen-space pass) | E | M–H |
| M2 | Volume absorption: thickness + attenuation | E | L |
| M3 | Per-object transmission buffer (drei MTM pattern) | E | H |
| M4 | BVH multi-bounce refraction (gems) | E | H |
| M5 | Metal: env-driven specular + anisotropy | E | L–M |
| M6 | Layered lobes: clearcoat, sheen, iridescence, specular | E | L–M |
| M7 | Stone/mineral procedural micro-surface | E+A | L–M |
| M8 | Paper/card (thickness, rough diffuse, edges) | A (partial) | L |
| M9 | Thin translucency approximation (no SSS in three r186) | X | L–M |
| M10 | Liquid surfaces | E+A | M |

## 02 Lighting → `techniques/02-lighting.md`
LT1 IBL via PMREM (E+A, L) · LT2 authored env / Lightformers (E+A, L) · LT3 RectAreaLight, LTC, no shadows (E, M) ·
LT4 shadow maps PCF/PCSS/VSM/CSM (E, M–H) · LT5 contact shadows (E, M / ~0 frozen) · LT6 accumulated/progressive shadows, lightmaps (E, H then ~0) ·
LT7 ambient occlusion baked/GTAO (E, L / M–H) · LT8 exposure & tone mapping (E+A, ~0) · LT9 emissive relationships (E, L) ·
LT10 caustic approximations (X, M–H) · LT11 baked vs dynamic decision (E+A)

## 03 Reflection / Optics → `techniques/03-optics.md`
O1 planar reflection (E+A, M–H) · O2 env reflection + Fresnel, BPCEM (E, L) · O3 SSR (E, H, desktop) · O4 dispersion (E, L–M) ·
O5 optical distortion *with a cause* (E+A, X) · O6 depth-aware optics (E) · O7 reflection probes / CubeCamera (E, M on update)

## 04 Geometry → `techniques/04-geometry.md`
G1 rigid part choreography (A) · G2 morph targets (E) · G3 vertex-shader deformation (E+A) · G4 procedural geometry from a shared field (A) ·
G5 SDF morphing 2D/3D (E+A) · G6 instancing / BatchedMesh (E) · G7 CSG / clipping / caps (E) · G8 BVH geometry ops (E) · G9 contour extrusion (A)

## 05 Image / Surface → `techniques/05-image-surface.md`
I-S1 render-to-texture (E+A) · I-S2 masks: analytic/SDF/texture/stencil (E+A) · I-S3 depth maps → relief/parallax (E+A) ·
I-S4 UV/projection/decals (E) · I-S5 displacement (E) · I-S6 feedback/ping-pong (X, **breaks reversibility**) · I-S7 separate hand-over plates (A)

## 06 Particles (default: NO) → `techniques/06-particles.md`
PT1 instanced fragments with identity (A) · PT2 GPGPU simulation (E, not reversible) · PT3 analytic paths (A) · PT4 points/sprites (E) ·
PT5 flow fields (X) · PT6 image reconstruction (E+A)

## 07 Camera / Spatial motion → `techniques/07-camera.md`
C1 scroll → progress → pose (A) · C2 SmoothDamp + dt clamp (A+E) · C3 per-mass inertia (A) · C4 physical camera language (A+E) ·
C5 camera paths, monotone keys (A+E) · C6 parallax (A+E) · C7 responsive cinematography (A partial)

## 08 Transitions → `techniques/08-transitions.md`
T1 semantic continuity (A) · T2 geometric/spatial continuity (A) · T3 optical transition (A, X) · T4 mask shaped by meaning (A+E) ·
T5 material parameter transition (A+E) · T6 fracture with thickness (A, X) · T7 RT composition architecture + seam checks (A)

## 09 Post-processing → `techniques/09-post.md`
P1 bloom · P2 DoF · P3 motion blur · P4 grade/LUT · P5 vignette · P6 grain/dither · P7 anti-aliasing · P8 temporal upscaling ·
P9 SSAO/GTAO · P10 SSGI (X) · P11 flare/god rays/CA · P12 outline. Each has *helps when* / *makeup when*.

## 10 Performance → `PERFORMANCE.md`
Tiers · adaptive mechanisms · budgets · representation changes · frame-rate independence.

## 11 Interaction → `techniques/11-interaction.md`
I1 raycasting + proxies + GPU picking (E) · I2 BVH-accelerated queries (E) · I3 input hygiene, scroll-first (A+E) ·
I4 object focus (E) · I5 reversible spatial navigation (A pattern + E) · I6 bounded presentation rotation (E)

## 12 Reference rendering → `techniques/12-reference.md`
RF1 GPU path tracing, WebGPU (REF) · RF2 uses inside ALFA: validation, stills, sequences, baking, progressive hero (X) ·
RF3 validation scenes (furnace, Khronos) · RF4 approximation-vs-reference method

## Cross-cutting
Recipes `R-*` → `RECIPES.md` · ladders → `QUALITY_LADDERS.md` · anti-patterns `A1–A20` → `ANTI_PATTERNS.md` ·
ALFA lessons `AL1–AL22` → `ALFA_PROVEN_LESSONS.md` · sources `S1–S11` → `SOURCE_REGISTRY.md`
