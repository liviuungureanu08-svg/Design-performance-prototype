# Performance, Quality Tiers, Fallbacks (capability family 10)

**Core principle: reduce fidelity before reducing the idea.** Drop resolution, samples and secondary effects first. Change the
*representation* only when the idea can't survive (see "Representation changes" below).
ALFA caveat (AL19): **no ALFA number here has been measured on a real GPU.** Treat budgets as starting points to measure, not as facts.

## 1. Tiers

| Tier | Detect | DPR cap | Typical content | Drops vs the tier above |
|---|---|---|---|---|
| **CINEMATIC DESKTOP** | WebGL2 + float RT + sustained frames OK after warm-up | 1.75–2 (ALFA used 1.75) | Full materials (transmission, layered), one planar reflector, accumulated or baked soft shadows, MSAA/SMAA, merged post (subtle bloom, grade, grain), optional DoF at a still moment | — |
| **PREMIUM STANDARD** | Integrated GPU / laptop, or monitor-driven decline | 1.5 | Same idea and same choreography | Half-res transmission (`transmissionResolutionScale` 0.5), reflector ½ res, shadow map ½, no DoF/SSR/SSAO, bloom half-res |
| **MOBILE REDUCED** | Coarse pointer + small viewport, or decline below threshold | 1.5–2 render scale × 0.6–0.85 (R2 default 0.85 auto → 0.5) | Same choreography and camera *re-composed for portrait* (C7) | Thin-wall or env-only glass, baked shadows and AO only, no screen-space effects, FXAA/SMAA or MSAA 4×, no per-object transmission buffers (M3), fewer instances (R1: 58k vs 130k) |
| **STATIC / NO-WEBGL** | No WebGL2, context lost, no float RT, `?fallback=1` | — | Designed poster(s) built from the same concept (AL6), with all copy and navigation intact. Ideally reference-rendered stills (12-reference RF2.2). | The interaction, not the idea |
| **PREFERS-REDUCED-MOTION** | `matchMedia('(prefers-reduced-motion: reduce)')` | tier as detected | ALFA so far: scroll-driven transforms stay (they *are* the content) and ambient drift goes. Exp02 shortens inertia (×0.25). | Ambient/idle motion, parallax, camera shake, long inertia, motion blur, large sudden camera surges (replace them with a cut or a short crossfade) |

**Reduced-motion note:** ALFA has only *logic-verified* this, never visually verified it in a packed build (Exp02 README). For large camera traversals, consider offering stepped states (snap to chapter endpoints with short crossfades) instead of continuous flight. That's a design decision for the creative spec.

## 2. Adaptive mechanisms

| Mechanism | Pattern | Source |
|---|---|---|
| DPR cap | `min(devicePixelRatio, cap)`. The biggest single lever (cost scales with pixels: DPR 2 = 4× the pixels of DPR 1). | ALFA `src/flagship/engine.ts`, `src/exp02/scene.ts` L160 |
| Adaptive render scale | Decline on *sustained* slow time, recover slowly, floor 0.5 | ALFA `src/main.ts` L64–70 `[ALFA-PROVEN logic, untuned]` |
| Performance monitor | Average frame time over iterations against refresh-rate-aware bounds (e.g. [50, 60] or [50, 90] fps). `factor` 0..1 with `step`, `flipflops` limit → `onFallback` | S2 `src/core/PerformanceMonitor.tsx` |
| Movement regression | Lower DPR/quality *while moving*, restore when still | S3 `docs/advanced/scaling-performance.mdx` ("Movement regression"); S2 `AdaptiveDpr`; S6 `dynamicLowRes` (same idea) |
| Render on demand | Render only when inputs change | AL4 `src/exp02/main.ts`; S3 `frameloop="demand"` + `invalidate()` |
| Freeze static work | `shadowMap.autoUpdate=false`, env `frames=1`, contact shadows `frames=1`, accumulate-then-freeze | S2 `BakeShadows`, `Environment`, `ContactShadows`, `AccumulativeShadows` |
| Shader warm-up | `renderer.compileAsync(scene, camera)` before a material/transmission switch, to avoid a hitch mid-scroll | S1 `src/renderers/WebGLRenderer.js` |
| Visibility culling | Skip rendering a scene or RT that isn't on screen. Pause the RAF when the canvas is off-screen (IntersectionObserver) or the tab is hidden | ALFA R2 director (renders only the needed scenes) |
| Off-main-thread | `OffscreenCanvas` in a worker, async BVH generation | S1 `webgl_worker_offscreencanvas`; S5 `asyncGenerate` |

## 3. Budgets: rule-of-thumb starting points (general practice, not from a cited source, not ALFA-measured. Measure and replace them.)

| Resource | Desktop start | Mobile start | Why |
|---|---|---|---|
| Frame time | 16.7 ms (60 Hz). Don't assume 120 Hz | 16.7 ms target, 33 ms floor before declining | Scroll jank is felt immediately |
| Draw calls | low hundreds | < ~100 | CPU-bound on mobile. Fix with instancing / BatchedMesh / merging (G6) |
| Full-screen passes | ≤ ~4 merged | ≤ ~2 | Fill rate is the mobile bottleneck. Each pass = a full read and write |
| Render targets | Size each to what it's perceived at (blur RTs ¼–½) | Same, stricter | Memory + bandwidth. Giant RTs = A7 |
| Shadow maps | 2048² with a tight frustum, measure before 4096² | 1024–2048² | ALFA uses 4096² unmeasured (AL21) |
| Textures | KTX2 (GPU-compressed) via glTF-Transform. Typical max 2048² (4096² only for a hero) | ≤ 2048², fewer maps | VRAM: an uncompressed 4096² RGBA ≈ 64 MB + mips |
| Geometry | Simplify to perceptual payoff. meshopt compression | Lower LOD | Download + vertex cost (A13) |
| Transmission | One shared pass (M1). Per-object buffers (M3) at most 1 | Thin-wall or env-only | +1–2 scene renders per M3 material |

Tools: `renderer.info` (calls, triangles, memory: textures/geometries; ALFA robustness checks memory stays constant across resize, AL18), `stats-gl` / drei `StatsGl`, browser GPU profiler. **Always measure on a real mid-range phone before signing off** (never done in ALFA so far).

## 4. Representation changes (where fidelity reduction is not enough)

| Technique | Why it can't just be scaled down | Alternative representation |
|---|---|---|
| Path tracing (RF1) | Needs WebGPU and seconds of convergence | Pre-rendered stills or sequence, baked lighting |
| SSR / SSGI / screen-space DoF | Quality collapses at low res, cost floor is high | Planar reflector or env reflection. Baked GI. Composed depth via layout instead of blur |
| Per-object transmission buffers (M3) | Cost scales per material | M1 shared pass → thin-wall → env-reflective opaque glass |
| GPU particle simulation (PT2) | Bandwidth + not reversible | Analytic paths (PT3) or a baked sequence |
| 3D ray-marched SDF (G5) | Per-pixel loop cost | Mesh-based morph targets or a pre-rendered mask sequence |
| Live caustics (LT10) | Multi-pass | Baked caustic texture |
| Wide landscape compositions on portrait (C7) | Not a perf issue: the composition fails | A separate portrait camera key set and layout |
| Hover-dependent interaction | No hover on touch | Tap / scroll-driven equivalent |

## 5. Frame-rate independence
- All motion uses `dt` (R3F pitfalls; ALFA SmoothDamp). Clamp `dt` (AL3). Choreography is a function of progress, not of frame count (AL1).
- Never tie animation speed to `requestAnimationFrame` count (A14).
