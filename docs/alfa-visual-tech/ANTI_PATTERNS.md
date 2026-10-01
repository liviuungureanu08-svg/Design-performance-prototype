# Technical Anti-Patterns

Label: `[ALFA-PROVEN]` = observed in ALFA's own experiments. `[EXTERNAL]` = from research and general practice.

| # | Anti-pattern | Symptom | Why it fails | Better approach |
|---|---|---|---|---|
| A1 | **Particles as default transition** `[ALFA-PROVEN]` | A → cloud → B. "An effect between two images." | No identity, no causality. The viewer sees a technique, not a change of world (R1 verdict). | Semantic or geometric continuity (T1/T2), masks from scene content (T4), fracture with thickness (T6). `techniques/06-particles.md` |
| A2 | **Bloom as lighting** `[EXTERNAL]` | Glowing objects next to unlit surroundings, milky haze | Bloom is a lens artefact. It doesn't light anything. | Emitter + matching light + env lightformer (LT9). Bloom subtle and selective (P1). |
| A3 | **Transparent layer + outline as glass** `[EXTERNAL]` | Glass looks like a hologram or UI | No refraction, absorption or reflection structure | R-GLASS (M1 + M2 + LT2 + thickness) |
| A4 | **Excessive post-processing** `[EXTERNAL]` (ALFA kept post minimal, AL7) | Bloom + CA + vignette + grain + DoF on every frame | Hides weak light and material, costs fill rate, every site looks alike | Look-dev with `?raw`. Every effect must name its perceptual gain (09-post). |
| A5 | **Noise hiding artifacts** `[EXTERNAL]` | Grain or dither cranked to mask aliasing, banding or low-res RTs | The artefact remains and the noise adds a second one | Fix the cause: AA (P7), RT size, half-float targets. Grain only at banding level. |
| A6 | **Shader distortion without causal reason** `[ALFA-PROVEN]` | Wobble, ripple, swirl, "liquify" | Reads as a shader demo. Ripples aliased in Exp02 (AL11). | Distortion only from a named optical object (O5). Stillness by default. |
| A7 | **Giant render targets** `[EXTERNAL]` | Full-res (× DPR) RTs for blur, reflection, portals | Memory and fill-rate blowup on mobile, for no visible gain on blurred content | Size RTs to their perceived resolution (½–¼ for blur. Reflector ½–¾ was enough, AL22). |
| A8 | **Excessive DPR** `[EXTERNAL]` + `[ALFA-PROVEN]` cap | Rendering at DPR 3 on phones | Cost ∝ pixels (DPR 3 = 9×). Hardly visible on moving 3D. | Cap 1.5–2. Adaptive scale (PERFORMANCE §2). |
| A9 | **Unnecessary continuous rendering** `[EXTERNAL]` + `[ALFA-PROVEN]` fix | GPU busy on a still page, battery drain | Wastes power, throttles thermally, and later frames jank | Render on change (AL4), `frameloop="demand"` (S3), freeze shadows/env. |
| A10 | **Huge shadow maps without measurement** `[ALFA-PROVEN]` (AL21) | 4096² default "for quality" | VRAM + depth-render cost. Resolution mostly wasted on a loose frustum. | Fit the frustum tightly, 2048 first, measure. Bake when static (LT4, LT6). |
| A11 | **Excessive draw calls** `[EXTERNAL]` | Hundreds or thousands of meshes, each its own material | CPU-bound, especially on mobile | Instancing / BatchedMesh / merging, shared materials (G6). |
| A12 | **Overused per-object transmission buffers** `[EXTERNAL]` | Several MeshTransmissionMaterials in one scene | Each = +1–2 full scene renders per frame (S2 source) | One shared M1 pass. M3 for one hero only. |
| A13 | **Geometry complexity without perceptual payoff** `[EXTERNAL]` | Millions of triangles, unseen detail | Download, memory and vertex cost for nothing visible at viewing distance | Simplify to the silhouette and normal maps. glTF-Transform meshopt (S10), LOD. |
| A14 | **Animation tied to unstable frame rate** `[EXTERNAL]` | Motion speed varies with device. Jumps after tab switch. | Per-frame increments instead of time/progress | Progress-driven pose (AL1), `dt`-based damping with clamp (AL3). |
| A15 | **Desktop-only cinematography** `[ALFA-PROVEN]` (AL16) | Portrait shows the subject tiny, or empty bands | The composition was authored for one aspect | Per-aspect camera keys and type placement (C7). Test 390×844 early. |
| A16 | **Technically impressive, perceptually empty** `[ALFA-PROVEN]` (R1) | Proud technical write-up, flat human reaction | Complexity is not experience | Start from "what must the viewer perceive" (SELECTION_MATRIX decision questions). |
| A17 | **History-dependent effects in scroll experiences** `[EXTERNAL]` | Reversing scroll doesn't restore the previous state | Feedback buffers / simulations depend on the path taken | Analytic functions of progress (AL1, PT3), precomputed sequences (I-S6). |
| A18 | **Light change competing with motion** `[ALFA-PROVEN]` (AL14) | Muddy mid-transition frames | Two changes fight for attention | Sequence: geometry lands, then light changes. |
| A19 | **Stock environment as art direction** `[EXTERNAL]` | Recognisable HDRI in chrome, generic look | Someone else's light design | Author the env (LT2, AL8). |
| A20 | **Judging performance in software GL** `[ALFA-PROVEN]` (AL19) | "Runs fine" in SwiftShader screenshots | Software GL tells you nothing about real GPU cost | Measure on real desktop *and* a mid-range phone before claiming perf. |
