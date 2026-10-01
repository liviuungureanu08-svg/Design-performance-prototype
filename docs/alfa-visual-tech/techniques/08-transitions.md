# 08 · Transitions

A transition is a **change of world with preserved identity**. Shader wipes are the least important tool here.
Ranking from ALFA evidence: semantic/geometric continuity (Exp02, R2) > optical/mask transitions with a cause (R2 T1/T3) > particles (R1, failed) > generic wipes (never tried, and not worth trying).

---

### T1 · Semantic continuity (one source → two readings) `[ALFA-PROVEN]` PRODUCTION · cost of the scene · mobile = scene
- **Does:** both states are generated from one authored source. Every element of B has a named ancestor in A (Exp02 ancestry table: contour → terrace edge, printed shading → real shadow, printed lake → water).
- **Perceived:** "that *became* this" rather than "this replaced that".
- **ALFA rule:** write the ancestry table *before* choosing techniques. Each row picks its own technique.
- **Src:** ALFA Exp02 README, AL10.

### T2 · Geometric / spatial continuity `[ALFA-PROVEN]` PRODUCTION
- **Does:** the same object stays on screen while camera and scale reinterpret it (Flagship: exterior → seam → interior. The exterior masses *become* the interior walls).
- **Techniques:** G1 rigid choreography, C4/C5 camera, exposure adaptation (LT8), a shared axis (Flagship: everything on x = 0).
- **ALFA rule:** keep one anchor (an axis, a shape, a colour) fixed across the change. Exp02: the lough's silhouette never changes. R2: the circle keeps its centre and radius.
- **Src:** ALFA Flagship README, R2 README.

### T3 · Optical transition (lens, aperture, refraction) `[ALFA-PROVEN]` EXPERIMENTAL · LOW–MED
- **Does:** an optical object in scene A (sun, drop, glass) becomes the window into B. Its rim refracts A while B is visible inside it, then it expands past the frame (R2 T1 portal).
- **Techniques:** I-S1 render-to-texture of both scenes, O5 caused distortion, I-S2 SDF mask, per-layer dolly.
- **Src:** ALFA `round-2-complete:src/gl/transitions/portal.ts`.

### T4 · Mask transition shaped by meaning `[ALFA-PROVEN]` + `[EXTERNAL]` PRODUCTION · LOW
- **Does:** composite two RTs with a mask that comes from scene content (an SDF of a word, an object silhouette, a stencil from geometry).
- **Options:** R2 T3 SDF morph circle → NOW. drei `MeshPortalMaterial` (`blend` takes the portal world full-screen, an SDF-blurred edge). three `RenderTransitionPass` / TSL `TransitionNode` (texture threshold).
- **Cheap-look failure:** a noise-texture dissolve.
- **Src:** ALFA `round-2-complete:src/gl/transitions/liquid.ts`. S2 `src/core/MeshPortalMaterial.tsx`. S1 `examples/jsm/postprocessing/RenderTransitionPass.js`.

### T5 · Material transition `[ALFA-PROVEN]` (partial) + `[EXTERNAL]`
- **Does:** the same geometry changes material (stone image → refractive glass in R2 T2. Ink → water in Exp02). Interpolate *physical parameters* (roughness, transmission, IOR, attenuation) rather than crossfading two renders.
- **Watch out:** transmission switching from 0 to > 0 changes the shader program and adds the transmission pass, so warm it up beforehand (`renderer.compileAsync`) to avoid a hitch.
- **ALFA rule:** interpolate parameters, keep the light fixed during a material change (AL14).
- **Src:** ALFA R2 README T2, Exp02 README. S1 `src/renderers/WebGLRenderer.js` (`compileAsync`).

### T6 · Fracture / break-up `[ALFA-PROVEN]` EXPERIMENTAL · MED
- **Does:** cut the object into thick pieces along a meaningful pattern (a crack web radiating from the oculus in R2), release them in a wave from the origin, and add anticipation (cracks leak light first).
- **ALFA rule:** pieces need thickness, an origin and anticipation. Otherwise it's a particle effect (06).
- **Src:** ALFA `round-2-complete:src/gl/transitions/fracture.ts`. S1 `examples/jsm/misc/ConvexObjectBreaker.js` (physics-oriented alternative).

### T7 · Render-target composition architecture `[ALFA-PROVEN]`
- R2 director pattern: progress → `Beat{scene, transition, p}` → which scenes render into which RTs → composite. Seam check: the transition end frame must equal the dwell start frame pixel for pixel (R2 checked every boundary).
- **ALFA rule:** test boundary frames (p = 0, p = 1 of each transition) against the adjacent dwell frames.
- **Src:** ALFA `round-2-complete:src/gl/director.ts`, `src/timeline.ts`.
