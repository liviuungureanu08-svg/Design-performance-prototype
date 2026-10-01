# Source Registry

Researched 2026-10-01 from shallow clones of each repository's default branch, read in source rather than from READMEs only.
Other files cite sources by ID (`S1 path`). Paths are relative to each repo root and were checked to exist at the commit listed.
Researching a source does **not** make it an ALFA dependency (see README → Dependency discipline).

## License summary (read this before reusing anything)

| ID | Source | License | What ALFA may do |
|---|---|---|---|
| S1 | three.js | MIT | Use; read and adapt code (keep notice) |
| S2 | pmndrs/drei | MIT | Use, or reproduce smaller custom versions (keep notice when adapting) |
| S3 | pmndrs/react-three-fiber | MIT | Use; architectural lessons apply without R3F |
| S4 | LYGIA | **Prosperity 3.0 (non-commercial) + paid Patron license** | **Client/commercial work: do not ship LYGIA code without a Patron/commercial license.** Read it as a map. Many files are ports of MIT algorithms (e.g. `generative/snoise.glsl` → stegu/webgl-noise, MIT), so go to the original author's license, which each file's YAML header names. |
| S5 | three-mesh-bvh | MIT | Use |
| S6 | three-gpu-pathtracer | MIT | Use (as a reference/offline tool, see 12-reference) |
| S7 | canvas-sketch | MIT | Concepts only (no runtime need) |
| S8 | The Book of Shaders | **All rights reserved** (`LICENSE`) | **Knowledge only.** Don't copy code or text into ALFA products. Links and attribution are allowed. |
| S9 | pmndrs/postprocessing | Zlib | Use |
| S10 | glTF-Transform | MIT | Use as a build-time tool |
| S11 | Khronos glTF-Sample-Assets | Each asset has its own license (CC0 / CC-BY 4.0 / other, see each model's README) | Validation scenes only. Check the license per asset before any public use. |

## Core sources

### S1 — three.js · github.com/mrdoob/three.js
- Snapshot `f0f1455` (2026-10-01), package r186 (ALFA pins `^0.186.1`). Authority: the reference renderer. ~600 official examples.
- Maintenance: daily commits. Adoption: very high.
- Studied: `src/renderers/WebGLRenderer.js` (transmission pass ~L2020–2135, `transmissionResolutionScale`, `compileAsync`), `src/renderers/shaders/ShaderChunk/transmission_pars_fragment.glsl.js`, `src/materials/MeshPhysicalMaterial.js`, `src/lights/RectAreaLight.js` ("no shadow support"), `src/renderers/webgpu/WebGPURenderer.js` (`forceWebGL`, automatic WebGL2 fallback backend), `src/renderers/common/PostProcessing.js` (deprecated r183 → `RenderPipeline`), `examples/jsm/{objects,environments,lights,misc,postprocessing,tsl/display}`.
- Examples cited: `webgl_materials_physical_transmission`, `webgl_loader_gltf_{transmission,dispersion,anisotropy,sheen,iridescence}`, `webgl_lights_rectarealight`, `webgl_shadow_contact`, `webgl_shadowmap_{pcss,vsm,csm,progressive}`, `webgl_materials_envmaps_groundprojected`, `webgpu_materials_envmaps_bpcem`, `webgpu_backdrop_water`, `webgpu_caustics`, `webgl_postprocessing_{transition,taa,smaa,gtao,dof,unreal_bloom_selective}`, `webgpu_postprocessing_{ssr,ssgi,traa,motion_blur,dof,bloom_emissive,transition}`, `webgpu_upscaling_taau`, `webgl_instancing_performance`, `webgl_mesh_batch`, `webgl_batch_lod_bvh`, `webgl_lod`, `webgl_morphtargets`, `webgpu_compute_particles`, `webgl_raycaster_bvh`, `webgl_worker_offscreencanvas`.
- Caveat: some newer `webgpu_*` examples are recent and the TSL API moves between releases (e.g. the PostProcessing → RenderPipeline rename). Re-check against the pinned version before implementing.

### S2 — pmndrs/drei · github.com/pmndrs/drei
- Snapshot `bf6f4ad` (2026-09-30). Maintained by Poimandres; the most widely used R3F helper set.
- Studied (as implementations to learn from, not to import wholesale): `src/core/MeshTransmissionMaterial.tsx`, `src/materials/MeshRefractionMaterial.tsx` (BVH-based), `src/core/{Environment,Lightformer,ContactShadows,AccumulativeShadows,MeshReflectorMaterial,MeshPortalMaterial,Caustics,BakeShadows,PerformanceMonitor,AdaptiveDpr,Detailed,Instances,Float,Backdrop,useBoxProjectedEnv}.tsx`, `src/web/{ScrollControls,PresentationControls}.tsx`.
- Caveat: many helpers render extra full-scene passes per frame (MTM, reflector, contact shadows). Read the `useFrame` body before you adopt one.

### S3 — pmndrs/react-three-fiber · github.com/pmndrs/react-three-fiber
- Snapshot `13e5e0e` (2026-10-01), fiber 9.8.1. Studied `docs/advanced/scaling-performance.mdx`, `docs/advanced/pitfalls.mdx`, `docs/API/canvas.mdx`.
- Value: lessons on lifecycle, on-demand rendering and regression that carry over to plain three.js. ALFA so far uses plain three.js; R3F is not implied.

### S4 — LYGIA · github.com/patriciogonzalezvivo/lygia
- Snapshot `ce08fe3` (2026-09-14), v1.4.1. Multi-language shader library (GLSL/HLSL/WGSL/MSL/CUDA). Each file has a YAML header (contributors, description, license).
- Families studied: `generative/` (snoise, fbm, curl, voronoi, worley, psrdnoise), `sdf/` (primitives + `op*`), `lighting/` (fresnel, ior, pbr, pbrGlass, iridescence, envMap, sphericalHarmonics, ssao, ssr, atmosphere, volumetricLightScattering), `color/` (mixOklab, tonemap, exposure, whiteBalance, lut, dither), `sample/` (triplanar, untile, bicubic, flow, normalFromHeightMap, dof, fxaa), `filter/` (bilateral, gaussianBlur, kuwahara, smartDeNoise), `morphological/` (jumpFlood, marchingSquares, dilation/erosion, alphaHashing), `space/` (parallaxMapping, tbn, linearizeDepth), `math/` (aastep, quintic, gain), `distort/`, `simulate/`.
- **License blocks commercial runtime use** (see the table above).

### S5 — three-mesh-bvh · github.com/gkjohnson/three-mesh-bvh
- Snapshot `a4d077d` (2026-09-30), v0.9.15. Used by Matterport, Threekit, IFC.js and others (README). three.js's own examples import it (`webgl_raycaster_bvh`, `webgl_batch_lod_bvh`).
- Studied: README (API + Gotchas), `src/core/*` (MeshBVH, ObjectBVH, SkinnedMeshBVH, PointsBVH, LineBVH), `src/webgl/MeshBVHUniformStruct.js` (BVH in a shader), and the examples `raycast`, `shapecast`, `distancecast`, `sdfGeneration`, `webgpu_sdfGeneration`, `clippedEdges`, `voxelize`, `sculpt`, `diamond`, `gpuPathTracingSimple`, `asyncGenerate`, `characterMovement`, `selection`, `objectbvh_frustumCulling`.
- Gotchas (README): the BVH is static, so call `refit()` after vertex edits. Queries run in BVH-local space. Center large geometry first. One root per geometry group.

### S6 — three-gpu-pathtracer · github.com/gkjohnson/three-gpu-pathtracer
- Snapshot `368f45e` (2026-09-30), v0.0.26 (pre-1.0, API still moving). Peer deps: three ≥0.185, three-mesh-bvh ≥0.9.15.
- **Current direction: "The project requires WebGPU"** (README Gotchas). Entry is `three-gpu-pathtracer/webgpu` with `WebGPUPathTracer`, `OIDNDenoiser`, `FSRUpscaler`, `BlurredEnvMapGenerator` (`src/webgpu/API.md`). Legacy WebGL code is still in `src/core/`.
- Gotchas: only MeshStandard/MeshPhysical materials are supported. Punctual lights need MIS. Emissive gets no MIS.
- three.js r186 already borrows from it (`examples/jsm/tsl/display/ImportanceSampledEnvironment.js` cites it).

### S7 — canvas-sketch · github.com/mattdesl/canvas-sketch
- Snapshot `798a24f` (2026-05-26), v0.7.8. Maintenance is low-frequency but the project is stable. Studied `docs/api.md`, `docs/exporting-artwork.md`, `docs/animated-sketches.md`, `docs/physical-units.md`.

### S8 — The Book of Shaders · github.com/patriciogonzalezvivo/thebookofshaders
- Snapshot `5a537e7` (2026-02-27). Chapters 05 shaping functions, 06 color, 07 shapes, 08 matrices, 09 patterns, 10 random, 11 noise, 12 cellular noise, 13 fBm. **All rights reserved.** Used here only to ground the explanations.

## Additional sources (each had to earn its place)

### S9 — pmndrs/postprocessing · github.com/pmndrs/postprocessing
- Why included: its `EffectPass` merges many fullscreen effects into one shader pass, so you avoid paying a full-screen read/write per effect, which is the main cost of a three.js `EffectComposer` chain. It also has a mature set of effects (SMAA, tone mapping, LUT, DoF, bloom with a luminance mip chain).
- Not covered by the core set: three.js `EffectComposer` chains a pass per effect. Three's WebGPU `RenderPipeline` (TSL) solves this natively, but only on that renderer path.
- License: Zlib. Maintenance: v6.39.5, commit 2026-09-09, long-lived (since 2015), also used underneath `@react-three/postprocessing`.

### S10 — glTF-Transform · github.com/donmccurdy/glTF-Transform
- Why included: the build-time asset pipeline (`prune`, `dedup`, `resample`, meshopt/Draco geometry compression, KTX2/WebP texture compression, `resize`). Texture and geometry budgets (`PERFORMANCE.md` §3) depend on it.
- Not covered by the core set: three.js only *loads* (`KTX2Loader`, `DRACOLoader`, meshopt decoder) and does not optimise assets.
- License: MIT. Maintenance: commit 2026-09-28. Author is a three.js glTF maintainer.

### S11 — Khronos glTF-Sample-Assets (+ glTF Sample Viewer) · github.com/KhronosGroup/glTF-Sample-Assets
- Why included: canonical test scenes for the PBR extensions three.js implements (`Models/TransmissionTest`, `TransmissionRoughnessTest`, `TransmissionOrderTest` (shows that transmissive objects can't see each other), `DragonAttenuation`, `DispersionTest`, the `Compare*` series (CompareRoughness, CompareTransmission, CompareVolume, CompareSheen…), `SheenCloth`, `AnisotropyBarnLamp`). Use them to check a material setup against a known-good reference *before* building custom content (12-reference).
- Not covered by the core set: the core sources give renderers, not ground-truth material test content.
- License: per asset (see the table). Maintenance: commit 2026-09-28, Khronos-owned.

## Notable exclusions / research-only

| Item | Decision | Why |
|---|---|---|
| LYGIA as a runtime dependency | Research-only for commercial work | Prosperity license. Use the MIT originals it credits, or ALFA's own code. |
| Book of Shaders code | Research-only | All rights reserved |
| drei `MeshDistortMaterial`, `MeshWobbleMaterial`, `Sparkles`, `Stars`, `Cloud` | Excluded | Preset "effect" components: noise displacement with no causal reason. They teach nothing about capabilities that the techniques files don't already cover. |
| drei `Caustics` | `[EXPERIMENTAL]` | Port of N8python/caustics. Heavy multi-pass, scene-specific tuning. |
| `three-stdlib` | Not separately catalogued | drei's dependency. It mirrors three.js addons, so cite the upstream `three/addons` instead. |
| Path tracing as a live renderer for ALFA sites | `[REFERENCE-ONLY]` by default | WebGPU-only, converges over seconds, noise while moving (12-reference). |
| Generic "awesome-shaders/effects" lists, CodePen/Shadertoy one-offs | Not ingested | No maintenance, licensing or production signal |
| GSAP/ScrollTrigger, Lenis, Theatre.js | Not evaluated | Not needed. ALFA proved native scroll + SmoothDamp (ALFA_PROVEN_LESSONS AL1). Evaluate only when a future task needs it. |
