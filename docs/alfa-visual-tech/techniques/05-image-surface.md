# 05 · Image / Surface Transformation

Entry format → `01-materials.md` header.

---

### I-S1 · Render-to-texture (scene as a texture) `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · MED (per RT) · mobile MED
- **Does:** renders a scene into a `WebGLRenderTarget`, which other materials or full-screen passes then sample. It's the foundation of compositing two worlds, screens-within-scenes, portals and transitions.
- **Perceived:** one world *inside* another, a world appearing on a surface.
- **Use:** transitions between scenes (R2 rendered each scene into half-float targets and composited them), a world visible on a screen or through a portal.
- **Avoid:** full-resolution RTs for blurred or secondary content. Many RTs alive at once (memory).
- **Options:** drei `RenderTexture`, `useFBO`, `MeshPortalMaterial` (portal with SDF-blurred edge, `blend` 0→1 takes the portal world full-screen). Plain three: `WebGLRenderTarget` + `setRenderTarget`. WebGPU: `pass()` nodes in `RenderPipeline`.
- **Fallback:** half-resolution RTs, or render only the visible scene once the transition finishes.
- **Cheap-look failure:** a low-resolution blurry RT seen at full size. Mismatched colour space or tone mapping between RT and main (double tone mapping).
- **ALFA rule:** render each scene only while it's visible. Size RTs to what's perceived. Tone map once at the end.
- **Src:** S1 `examples/webgl_rtt.html`, `webgl_multiple_rendertargets.html`. S2 `src/core/{RenderTexture,Fbo,MeshPortalMaterial}.tsx`. ALFA R2 `round-2-complete:src/gl/engine.ts`, `src/gl/director.ts`.

### I-S2 · Masks (analytic, SDF, texture, stencil) `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · LOW · mobile LOW
- **Does:** a scalar field decides which of two layers shows. Analytic (circle/rect SDF), texture (painted or noise threshold), stencil buffer (geometry-shaped), SDF of type or shapes.
- **Perceived:** a reveal shaped by meaning, such as an aperture, the object's silhouette, or a word.
- **Use:** apertures (R2: sun → pupil → oculus), revealing a scene through an object's shape.
- **Avoid:** generic noise-threshold dissolves.
- **Options:** three `RenderTransitionPass` / TSL `TransitionNode` (texture-threshold mix of two scenes). Stencil (`webgl_clipping_stencil`, drei `Mask`). SDF + `fwidth`-based AA (`aastep`).
- **Fallback:** the same mask with a crossfade.
- **Cheap-look failure:** a soft noise dissolve (the PowerPoint look), aliased mask edges.
- **ALFA rule:** the mask's shape must come from something in the scene.
- **Src:** S1 `examples/jsm/postprocessing/RenderTransitionPass.js`, `examples/jsm/tsl/display/TransitionNode.js`, `webgl_postprocessing_transition.html`. S2 `src/core/Mask.tsx`. S4 `math/aastep.glsl` (port of MIT glsl-aastep). ALFA R2 T1/T3.

### I-S3 · Depth maps: image → relief / parallax `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · LOW–MED · mobile LOW
- **Does:** a depth map displaces a tessellated plane (true parallax) or offsets UVs (parallax mapping), turning a 2D image into a shallow 3D one.
- **Perceived:** an image gains volume and responds to the camera or pointer.
- **Use:** subtle depth on photography or illustration, image → object relationships.
- **Avoid:** large camera moves (disocclusion gaps). R1 needed overscan + a backdrop to hide seams.
- **Options:** displaced plane (R1 rest positions perspective-compensated so the neutral view is pixel-identical). Parallax occlusion mapping (LYGIA `space/parallaxMapping`, reference). Layered depth slices (R2 dunes: 5 analytic parallax layers).
- **Fallback:** a static image.
- **Cheap-look failure:** the "2.5D photo wobble" with stretched edges.
- **ALFA rule:** keep the camera within the depth map's valid parallax range, or author separate layers.
- **Src:** ALFA R1 README §2, R2 `DepthLayerScene` note. S1 `examples/webgl_materials_displacementmap.html`.

### I-S4 · UV manipulation / texture projection / decals `[EXTERNAL]` PRODUCTION · LOW · mobile LOW
- **Does:** remaps texture coordinates: projection from a camera (projective texturing), triplanar, polar/cartesian, flow maps, decals projected onto meshes.
- **Perceived:** an image wrapping onto or migrating across geometry. Printed marks sitting *on* the object.
- **Use:** image ↔ geometry continuity (projecting the A-state image onto B-state geometry at the hand-off frame), labels on surfaces.
- **Options:** projecting the A image from the camera onto B geometry gives a pixel-exact hand-off at one frame. drei `Decal` / three `DecalGeometry`. LYGIA `space/{cart2polar,polar2cart}`, `sample/flow` (reference).
- **Cheap-look failure:** stretching at grazing angles, visible seams.
- **ALFA rule:** for image → geometry transitions, match the projection camera to the render camera at the hand-off frame.
- **Src:** S1 `examples/webgl_decals.html`, `examples/jsm/geometries/DecalGeometry.js`. S2 `src/core/Decal.tsx`.

### I-S5 · Displacement (texture / procedural) `[EXTERNAL]` PRODUCTION · LOW–MED · mobile LOW–MED
- **Does:** moves vertices by a texture/noise along normals. Needs tessellation and recomputed normals.
- **Use:** relief, embossing, terrain from images.
- **Avoid:** using it to add "life" with animated noise (A6).
- **Cheap-look failure:** faceting, stale normals.
- **ALFA rule:** displacement amplitude and frequency must match physical scale.
- **Src:** S1 `examples/webgl_materials_displacementmap.html`. S4 `sample/normalFromHeightMap.glsl` (reference).

### I-S6 · Feedback / ping-pong buffers `[EXTERNAL]` EXPERIMENTAL · MED · mobile MED
- **Does:** reads the previous frame's RT to write the next (trails, accumulation, reaction-diffusion, fluid).
- **Perceived:** persistence, smearing, organic growth.
- **Use:** an accumulating ink or water simulation with semantic meaning.
- **Avoid:** in a scroll-driven pure-function design. **Feedback breaks reversibility** (state depends on history, which contradicts AL1).
- **Options:** `GPUComputationRenderer` (WebGL), TSL compute ping-pong (`webgpu_compute_texture_pingpong`), `AfterimagePass`.
- **Fallback:** precompute the sequence offline and scrub it as a texture atlas/video.
- **Cheap-look failure:** generic trails, motion smear.
- **ALFA rule:** if the experience must reverse, precompute feedback states or replace them with an analytic function of progress.
- **Src:** S1 `examples/jsm/misc/GPUComputationRenderer.js`, `examples/webgpu_compute_texture_pingpong.html`, `examples/jsm/postprocessing/AfterimagePass.js`. S4 `simulate/` (reference).

### I-S7 · Separate plates for hand-over `[ALFA-PROVEN]`
- Keep anything that must hand over to a real 3D phenomenon (printed shading → cast shadow, printed water lines → real water) on its own layer with its own fade curve (AL13).
