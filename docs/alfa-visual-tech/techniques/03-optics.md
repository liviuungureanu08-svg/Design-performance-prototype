# 03 · Reflection / Optics

Entry format → `01-materials.md` header. Refraction *materials* (M1–M4) live in `01-materials.md`. This file covers reflection, Fresnel and optical effects.

---

### O1 · Planar reflection (Reflector / MeshReflectorMaterial) `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · MED–HIGH · mobile MED
- **Does:** renders the scene again from a camera mirrored across a plane into a texture, which the plane samples in screen space. drei `MeshReflectorMaterial` adds a blurred copy, mixed by depth/roughness (`blur`, `mixBlur`, `depthScale`, `minDepthThreshold`, `mirror`, `distortionMap`, `resolution` default 256).
- **Perceived:** exact mirror of the world on water, glossy floors and black glass, which grounds objects strongly.
- **Use:** one dominant flat reflective surface (floor, lake, table).
- **Avoid:** several reflective planes (one extra scene render each). Curved surfaces.
- **Options:** three `Reflector` with `textureWidth/Height` well below the viewport (ALFA: 768² Flagship; 0.7 × DPR-capped viewport Exp02, AL22). Blur + roughness for a polished-stone look.
- **Cost:** a full extra scene render per frame, at the reflector's resolution.
- **Fallback:** lower resolution → env reflection (O2) with a dark gradient → none.
- **Cheap-look failure:** a perfect mirror on a material that should be rough. Ripple distortion that aliases (AL11).
- **ALFA rule:** reflection sharpness is a material property. Blur by roughness and distance, and keep the resolution modest.
- **Src:** S1 `examples/jsm/objects/Reflector.js`. S2 `src/core/MeshReflectorMaterial.tsx`, `src/materials/BlurPass.tsx`. ALFA `src/flagship/world.ts` L129, `src/exp02/scene.ts` L251.

### O2 · Environment (cube) reflection + Fresnel `[EXTERNAL]` PRODUCTION · LOW · mobile LOW
- **Does:** PBR materials reflect `scene.environment` with Fresnel (Schlick) built in: reflection rises at grazing angles. It's free once LT1 exists.
- **Perceived:** edges glint and silhouettes separate from the background.
- **Use:** every glossy object.
- **Avoid:** expecting it to show *nearby* objects. It's infinitely distant.
- **Options:** box-projected env (BPCEM) for interiors, where the cubemap is corrected to room bounds (S1 `webgpu_materials_envmaps_bpcem`, S2 `useBoxProjectedEnv`). Light probes / `CubeCamera` for local reflections (re-render only on change).
- **Fallback:** none needed.
- **Cheap-look failure:** an env that doesn't match the visible surroundings.
- **ALFA rule:** if the object's surroundings are visible, the env must be built *from* them (CubeCamera / fromScene) or designed to agree.
- **Src:** S1 `examples/webgpu_materials_envmaps_bpcem.html`, `webgl_lightprobe_cubecamera.html`. S2 `src/core/useBoxProjectedEnv.tsx`, `src/core/CubeCamera.tsx`. S4 `lighting/fresnel.glsl` (reference).

### O3 · Screen-space reflections (SSR) `[EXTERNAL]` PRODUCTION (desktop) · HIGH · mobile HIGH
- **Does:** ray-marches the depth buffer to find reflected pixels. The TSL `SSRNode` has a `stochastic` option (GGX rays, which need a denoiser/temporal pass). It can't reflect anything off-screen.
- **Perceived:** reflections of nearby objects on arbitrary (non-planar) glossy surfaces.
- **Use:** desktop, complex glossy surfaces, with an env fallback for misses.
- **Avoid:** mobile. Shots where the reflected objects leave the frame (reflections pop out).
- **Fallback:** O2 (env) → O1 if the surface is planar.
- **Cheap-look failure:** edge fade-outs and smearing at screen borders, noisy stochastic reflections without a temporal pass.
- **ALFA rule:** if the receiver is planar, use O1. SSR only for non-planar receivers.
- **Src:** S1 `examples/jsm/tsl/display/SSRNode.js`, `examples/webgpu_postprocessing_ssr.html`, `webgpu_postprocessing_ssr_denoise.html`, `examples/jsm/postprocessing/SSRPass.js`.

### O4 · Dispersion / chromatic separation `[EXTERNAL]` PRODUCTION · LOW–MED · mobile LOW–MED
- **Does:** physically: per-wavelength IOR inside transmission (`dispersion` on MeshPhysicalMaterial = 3 samples). Optically: chromatic aberration as a *lens* post effect.
- **Perceived:** thick crystal edges split into spectral fringes, and a sense of the lens.
- **Use:** high-IOR thick glass/crystal at edges.
- **Avoid:** as a full-screen post "style" (the camera isn't a cheap lens unless you mean it to be).
- **Fallback:** drop it, since it's subtle by nature.
- **Cheap-look failure:** RGB-split edges everywhere, a glitch aesthetic.
- **ALFA rule:** dispersion lives in the material and only shows where light travels far through glass.
- **Src:** S1 `examples/webgl_loader_gltf_dispersion.html`, `transmission_pars_fragment.glsl.js` (~L172–195), `examples/jsm/tsl/display/ChromaticAberrationNode.js`. S11 `Models/DispersionTest`, `DragonDispersion`.

### O5 · Optical distortion with a cause (lensing, heat, refractive rim) `[EXTERNAL]` + `[ALFA-PROVEN]` EXPERIMENTAL · LOW–MED · mobile LOW
- **Does:** offsets screen UVs or a scene render target along a field derived from a physical cause, such as a refractive object's normal, a lens SDF, or heat. R2 T1 used a thin refractive rim bending the dunes plus chromatic lensing. Exp02 *removed* causeless ripples.
- **Perceived:** space bending around an object, an aperture, a portal.
- **Use:** when an optical object exists in the scene and the distortion comes from its shape.
- **Avoid:** noise-driven wobble (drei `MeshDistortMaterial`-style) with no source.
- **Options:** render-target + full-screen shader. `Refractor`. A depth-aware offset to avoid foreground smear.
- **Fallback:** crossfade/mask without distortion.
- **Cheap-look failure:** wavy "heat haze" on everything, or swirl and liquify demos.
- **ALFA rule:** name the optical object causing the distortion. If you can't, don't distort.
- **Src:** ALFA R2 T1 (`round-2-complete:src/gl/transitions/`), Exp02 README (ripples removed). S1 `examples/jsm/objects/Refractor.js`.

### O6 · Depth-aware optics (depth of field, fog, depth-based blur) `[EXTERNAL]` PRODUCTION · MED–HIGH · mobile HIGH
- See `09-post.md` P2 (DoF). For refraction, sampling the depth buffer stops foreground objects bleeding into a refracted background (mask by depth before offsetting UVs).
- **ALFA rule:** any screen-space optical offset should test depth so near objects don't smear.
- **Src:** S1 `examples/jsm/tsl/display/depthAwareBlur.js`, `depthAwareBlend.js`.

### O7 · Reflection probes / local cubemaps `[EXTERNAL]` PRODUCTION · MED (per update) · mobile MED
- **Does:** a `CubeCamera` at a point renders the 6 faces, which are used as that object's env. Light probes (SH) give diffuse only.
- **Use:** an object that must reflect its *immediate* surroundings (a glass object in a room).
- **Avoid:** updating every frame (6 scene renders).
- **ALFA rule:** update the probe on scene change only, and at low resolution (128–256).
- **Src:** S1 `examples/webgl_lightprobe_cubecamera.html`, `webgl_lightprobes*.html`, `examples/jsm/lights/LightProbeGenerator.js`. S2 `src/core/CubeCamera.tsx`.
