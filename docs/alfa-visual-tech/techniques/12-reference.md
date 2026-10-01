# 12 · High-Fidelity Reference Rendering

> **REFERENCE QUALITY ≠ REAL-TIME PRODUCTION TECHNIQUE.**
> Path tracing tells you what the material and light *should* look like. A production ALFA page normally ships a rasterised
> approximation of it, or pre-rendered frames from it.

---

### RF1 · GPU path tracing (three-gpu-pathtracer) `[REFERENCE-ONLY]` (default) · EXTREME · mobile: not viable
- **Does:** unbiased Monte-Carlo path tracing of a normal three.js scene (MeshStandard/MeshPhysical only) on the GPU, with BVH traversal (three-mesh-bvh). It accumulates samples over frames. Current version **requires WebGPU** (`WebGPUPathTracer`). It supports transmission, multi-bounce refraction, rough reflection, real area/spot lights, env importance sampling with MIS, and a physical camera with DoF.
- **Convergence controls:** `maxBounces` (default 15), `frameBudget` (path slots per call), `minSamples`, `maxSamples`, `renderScale`, `dynamicLowRes` + `lowResScale` (low-res preview while moving), `renderDelay` / `fadeDuration` (fade from the raster image to the traced one), `filterGlossyFactor`, `clampIndirect` (firefly suppression), `stableNoise` (same camera → same image, useful for diffing).
- **Denoise / upscale:** `OIDNDenoiser` (Open Image Denoise), `FSRUpscaler`. `BlurredEnvMapGenerator` trades sharp env reflections for convergence speed.
- **Perceived:** ground-truth glass, caustics, soft shadows, interreflection. The target the real-time version is judged against.
- **Limits for live sites:** WebGPU only. Noisy while the camera moves (scroll means constant motion). Seconds to converge. Heavy on battery. Punctual lights need MIS. No emissive MIS.
- **Src:** S6 README (Use, Gotchas), `src/webgpu/API.md`, `src/webgpu/{WebGPUPathTracer,OIDNDenoiser,BlurredEnvMapGenerator}.js`, examples `materialOrb`, `denoise`, `depthOfField`, `areaLight`, `renderVideo`, `furnace_test`.

### RF2 · Uses of reference rendering inside ALFA (ranked by expected value)
1. **Material validation** `[REFERENCE-ONLY]`: render the *same* scene (same glTF, env, camera) in the raster engine and in the path tracer, then compare side by side. Wherever they disagree (glass too clear, metal too dark, missing contact darkening), that's what the raster version must approximate (env tweak, AO, contact shadow, thickness map).
2. **Endpoint / hero stills** `[PRODUCTION as image]`: path-trace and denoise a still, then ship it as an image (poster, fallback, static endpoint of a scroll sequence). It can also be the STATIC tier (`../PERFORMANCE.md`).
3. **Pre-rendered sequences** `[PRODUCTION as video/frames]`: `renderVideo` example. Ship as a scrubbed video or frame atlas when the shot is camera-locked. The trade-off is file size and no interactivity.
4. **Baking**: lightmaps, AO, caustics or contact shadows path-traced offline, then applied as textures in the raster scene (LT6, LT10).
5. **Progressive live hero** `[EXPERIMENTAL]`: only for a *still* moment (the user stops scrolling at an endpoint), WebGPU desktop, with the raster image shown first (`renderDelay`/`fadeDuration` exist for exactly this). Never during motion.

### RF3 · Physical validation scenes `[EXTERNAL]`
- **Furnace test** (S6 `example/furnace_test`): an energy-conserving material in a uniform env should disappear, so any visible energy loss or gain is wrong.
- **Khronos sample assets** (S11 `Compare*`, `TransmissionTest`, `DragonAttenuation`, …): known-good extension usage. Check how *your* renderer setup shows them before blaming the content.
- **ALFA rule:** when a material "looks off", first load the matching Khronos test asset in the same lighting.

### RF4 · Comparing approximation vs reference `[EXTERNAL]` methodology (proposed, not yet done in ALFA)
- Fixed camera, fixed env, `stableNoise` on, same tone mapper and exposure in both renderers.
- Compare at 3 progress points (the worst-frame principle, AL17): the hero frame, a mid-transition frame, the endpoint.
- Record differences as named perceptual gaps ("edge darkening missing", "absorption too weak"), not pixel metrics.
- The raster version passes when every named gap is either fixed or consciously accepted.
