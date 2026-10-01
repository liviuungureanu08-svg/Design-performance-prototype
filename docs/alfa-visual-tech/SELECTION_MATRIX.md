# Technique Selection Matrix

Start here when a creative spec arrives. **Capability families first, libraries last.** IDs → `CAPABILITY_MAP.md`.
Each row: what to investigate → which recipe → the main trap. Then check `PERFORMANCE.md` for the tier plan.

| If the creative spec requires… | Investigate (families → techniques) | Recipe | Main trap / warning |
|---|---|---|---|
| **Realistic glass** | Materials M1, M2 (M3 only if glass must see glass) · Lighting LT2 · Optics O2, O4 · LT5 grounding | R-GLASS | Glass in front of nothing. Outline + bloom (A3). |
| **Crystal / gem / prism** | M4 (BVH refraction) · LT2 small bright sources · O4 | R-GEM | Using M1 transmission, generic HDRI |
| **Premium metal / product hardware** | M5, M6 · LT2 · P7 AA | R-METAL | Stock HDRI reflections, highlight aliasing |
| **Stone / architecture / monolith** | M7 · LT1/LT2 · LT7 · O1 floor · LT8 exposure | R-STONE | Visible noise bump, hard CG edges |
| **Reflection becomes reality** (mirror world becomes the real world, water → world) | O1 planar reflection rendered to RT · I-S1 render-to-texture · T2/T4 (mask or camera crossing the reflection plane) · C5 camera path through the plane | R-REFLECT + R-PORTAL | Swapping two renders with a fade. The reflected world must be the *same* scene (mirrored camera), so crossing the plane is continuous. |
| **Paper / physical layers** | M8 · G1, G4/G9 · LT4/LT5 · AL15 grazing light · M9 if backlit | R-PAPER | Zero-thickness planes, no inter-layer shadow |
| **Structural transformation** (an object reconfigures) | G1 rigid choreography · G3 analytic deformation · C3 inertia · AL14 light timing | R-ENTRY / R-MORPH | Simultaneous linear motion with no mass. Deformation that ignores material rigidity. |
| **Semantic morph** (A becomes B with meaning) | T1 ancestry table first · G4 shared source · G2/G5 per element · T5 material interpolation · I-S7 hand-over plates | R-MORPH | Crossfade / dissolve / particle cloud (AL12) |
| **Image disintegration** | **First ask whether the image can instead *become* an object** (I-S3 depth relief, I-S4 projection onto geometry, T6 fracture with thickness). Only then PT1 / PT3. | R-MORPH (T6) | **Particles as the default** (A1, AL12). If fragments are used: thickness, origin, anticipation, analytic paths (reversible). |
| **Text / logo becoming shape** | G5 SDF (EDT from glyphs) · I-S2 mask · T4 | R-MORPH | Low SDF resolution (soft serifs), metaball goo |
| **World-to-world passage** | I-S1 RTs · I-S2 masks · O5 caused distortion · T3 | R-PORTAL | Noise wipe. Rendering both worlds when only one is visible. |
| **Interior reveal / scale change** | T2 · G1 · C4/C5 · LT8 exposure adaptation · G7 sections (if cutaway) | R-ENTRY | Fly-through into an unrelated scene |
| **Spatial portfolio navigation** | I5 reversible navigation · I4 object focus · C1–C5 · G6 instancing / BatchedMesh · I2 BVH (dense meshes) · deep-linkable states | R-ENTRY (as a navigation grammar) | One-way tweens, non-restorable states, orbit controls breaking the composition |
| **Interactive surface exploration** (pointer on a detailed object) | I2 BVH raycast / closest point · I1 proxies · LT3 movable light or LT2 sweep · I6 bounded rotation | — | Raycasting dense meshes linearly. Free orbit. |
| **Still water / liquid** | M10 · O1 · Fresnel · motion only with cause | R-WATER | Ripple distortion (AL11) |
| **Dramatic light change over scroll** | LT1/LT2 re-bake on change · LT4 shadow freeze/thaw · LT8 exposure · LT11 baked-per-keyframe | — | Light change overlapping geometry motion (AL14) |
| **Glowing element** | LT9 emissive + matching light + env lightformer · P1 bloom (subtle, selective) | — | Bloom as lighting (A2) |
| **High-end static endpoint / hero still** | 12-reference RF1/RF2 · S6 path tracer + OIDN · ship as image | R-STILL | Shipping a live path tracer during motion |
| **Material validation before build** | 12-reference RF2.1, RF3 · S11 Khronos test assets | R-STILL (workflow) | Blaming the asset before checking the renderer setup |
| **Mobile premium experience** | PERFORMANCE tiers · C7 portrait cinematography · baked lighting (LT6, LT11) · M1 → thin-wall · render on demand (AL4) | — | Desktop scene at low FPS. Reducing the idea instead of the fidelity. Never testing on a real phone (AL19). |
| **No-WebGL / reduced motion** | PERFORMANCE tiers STATIC & REDUCED-MOTION · AL6 poster · R-STILL | — | An error message instead of a designed poster |

## Decision questions (ask in order)
1. **What must the viewer perceive?** (thickness, weight, contact, causality, depth, material identity). Write it down.
2. **What is the ancestry?** Which element of A becomes which element of B (T1)?
3. **Which cue carries that perception most cheaply?** Light direction and geometry usually come before shaders (AL15).
4. **Is it reversible?** Anything history-dependent (feedback, simulation) needs precomputation or an analytic replacement (I-S6, PT2).
5. **What survives on mobile?** Plan the tier ladder *before* building (PERFORMANCE §4).
6. **What is the reference?** If the material is ambitious, plan a reference render (12-reference).
