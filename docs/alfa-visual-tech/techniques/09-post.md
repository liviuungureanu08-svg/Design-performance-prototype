# 09 · Post-Processing

Every entry answers two questions: **when it helps** and **when it becomes makeup for weak art direction.**
Rule of thumb (AL7): turn post off (`?raw`). If the frame is no longer good, the problem is upstream (light, material, composition).
Architecture: chained passes each cost a full-screen read and write. Merge effects (S9 `EffectPass`; WebGPU `RenderPipeline` composes TSL nodes) and apply tone mapping + colour space once at the end (`OutputPass`).

| ID | Effect | Helps when | Makeup when | Cost / mobile | Sources |
|---|---|---|---|---|---|
| P1 | **Bloom** (luminance-threshold mip-chain blur; selective/emissive variants) | Real HDR emitters (sun, slot, filament) need to bleed slightly into the lens. Strength subtle (ALFA Flagship 0.06). | It substitutes for lighting, outlines glass, makes "glow" the style, or lifts everything above a low threshold (milky haze). | MED; mobile MED (halve the resolution) | S1 `postprocessing/UnrealBloomPass.js`, `tsl/display/BloomNode.js`, `webgpu_postprocessing_bloom_emissive`; S9 BloomEffect |
| P2 | **Depth of field** (bokeh / gather; TSL `DepthOfFieldNode`) | Guiding attention in a still or slow shot at a physically plausible f-stop, focus pull as a narrative beat. | It hides empty or low-detail backgrounds, a miniature "tilt-shift" look nobody intended, or a blur that animates for no reason. | HIGH; mobile HIGH (often drop it) | S1 `webgl_postprocessing_dof*.html`, `tsl/display/DepthOfFieldNode.js`; S6 `PhysicalCamera` as reference |
| P3 | **Motion blur** (per-object velocity or camera reprojection) | Fast camera surges (R2 T3 surge), keeping fast motion readable at 60 Hz. | Applied to slow scroll motion (smears premium detail), or used to hide stutter. | MED–HIGH; mobile HIGH | S1 `tsl/display/MotionBlur.js`, `webgpu_postprocessing_motion_blur.html` |
| P4 | **Colour grading / LUT** | Unifying a palette across chapters, a final look matched to brand. Apply it *after* tone mapping. | It rescues a bad lighting palette, teal-orange by default, or crushed blacks that hide geometry. | LOW | S1 `postprocessing/LUTPass.js`, `tsl/display/Lut3DNode.js`, `webgl_postprocessing_3dlut`; S4 `color/lut.glsl` (ref) |
| P5 | **Vignette** | Very subtle edge falloff to hold the eye on a centred subject (Flagship 0.32 with a smooth curve). | Visible dark corners and a "photo filter" look. Portrait screens make it obvious. | ~0 | ALFA `src/flagship/engine.ts` GRADE shader |
| P6 | **Grain / dither** | Breaking gradient banding in dark smooth gradients (8-bit output). Very low amplitude, luminance-weighted (Flagship 0.012). | Covering aliasing, noise or low-res RTs (A5), or a "film" costume. | ~0 | ALFA GRADE shader; S4 `color/dither.glsl` (ref) |
| P7 | **Anti-aliasing**: MSAA (geometry edges, cheap on desktop with WebGL2 RT `samples`), FXAA (cheap, blurry), SMAA (better edges), TAA/TRAA (best on shader aliasing and thin detail, but ghosts under motion), SSAA (reference stills) | Always needed in some form. Premium edges matter more than any effect. | Not applicable (AA is hygiene). The failure is *choosing none*, or relying on TAA ghosting under scroll motion. | MSAA MED / FXAA LOW / SMAA LOW–MED / TAA MED; mobile: measure MSAA cost at capped DPR, avoid TAA ghosting | S1 `webgl_postprocessing_{fxaa,smaa,taa,ssaa}`, `tsl/display/{SMAANode,TRAANode,FXAANode,SSAAPassNode}.js`; ALFA Flagship (half-float MSAA 4× RT) |
| P8 | **Temporal upscaling** (TAAU / FSR1) | Rendering at reduced internal resolution on high-DPR screens and reconstructing (WebGPU path). | Upscaling hides that the scene is too heavy, so fix the cost first. | MED; promising for mobile but unverified in ALFA | S1 `webgpu_upscaling_taau.html`, `tsl/display/{TAAUNode,FSR1Node}.js` |
| P9 | **SSAO / GTAO** | See LT7. | Dark halos. | MED–HIGH | `02-lighting.md` LT7 |
| P10 | **Screen-space GI** (SSGI) | Desktop-only colour bleed in enclosed spaces. | Generic "realism" toggle with noise. | HIGH; mobile no | S1 `tsl/display/SSGINode.js` `[EXPERIMENTAL]` |
| P11 | **Lens flare / god rays / chromatic aberration** | A real bright source in frame, motivated by a lens or the atmosphere. | Decoration, or a sci-fi stock look. | LOW–MED | S1 `objects/Lensflare.js`, `tsl/display/{GodraysNode,ChromaticAberrationNode}.js` |
| P12 | **Outline / edge detection** | Technical or diagrammatic styles chosen by art direction. | "Glass" made from a white outline (A3), selection highlights in a premium scene. | MED | S1 `postprocessing/OutlinePass.js` |

**ALFA rules for post**
1. Look-dev with post disabled. Post only after the raw frame passes review.
2. One merged pass where possible. Half-resolution for blur-type effects.
3. Use HDR (half-float) intermediates whenever bloom or grading is present (ALFA Flagship, R2).
4. Each effect must answer "what does the viewer perceive that they otherwise wouldn't?"
