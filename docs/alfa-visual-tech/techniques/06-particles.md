# 06 · Particles / Points

> **Default answer: NO.** AL12: 130k instanced shards carrying real image colour, with optimal-transport pairing, were technically
> strong and still read as "an effect between two images". Use particles only when the subject *is* granular (sand, dust, swarms, stars,
> spray, data points) or when the story is literally disintegration *and* the fragments have physical identity.

## When NOT to use particles
- As the transition between two images or scenes → use geometry continuity, masks or optical transitions (`08-transitions.md`).
- To add "magic", "energy" or "life" to an otherwise static scene.
- To represent abstract ideas (data, AI, network) without a concrete reason.
- When the fragments don't have mass, shape, thickness and lighting. Unlit dots are the cheapest look on the web.

---

### PT1 · Instanced fragments with identity `[ALFA-PROVEN]` (technically) PRODUCTION · MED · mobile MED
- **Does:** instanced quads or shards, each carrying its own part of the image (sampled UV cell), with depth, size variation and shading from normals.
- **Perceived:** matter that *was* the image. It reads better than dots, and still reads as "an effect" (AL12).
- **Use:** physical shattering of an object that is itself flat (glass pane, print).
- **Cheap-look failure:** uniform fragment size, synchronised departure, noise-driven paths.
- **ALFA rule:** if you do it, fragments need thickness, light response and causal motion (break origin, gravity, inertia). R2 T2's glass slabs with real thickness did better than R1's flat shards.
- **Src:** ALFA R1 (`round-1-complete:src/gl/`), R2 T2 (`round-2-complete:src/gl/transitions/fracture.ts`).

### PT2 · GPU particle simulation (GPGPU / compute) `[EXTERNAL]` PRODUCTION · MED–HIGH · mobile HIGH
- **Does:** stores positions and velocities in float textures (WebGL `GPUComputationRenderer`) or storage buffers (WebGPU TSL compute) and updates them on the GPU each frame.
- **Use:** large granular phenomena (sand, fluids, flocks) with real dynamics.
- **Avoid:** in reversible scroll experiences. A simulation depends on history (I-S6), so use analytic paths (PT3) instead.
- **Fallback:** analytic paths, fewer particles, a pre-baked texture of positions per frame.
- **Src:** S1 `examples/jsm/misc/GPUComputationRenderer.js`, `examples/webgl_gpgpu_*.html`, `webgpu_compute_particles.html`, `webgpu_compute_particles_fluid.html`.

### PT3 · Analytic particle paths (pure function of progress) `[ALFA-PROVEN]` PRODUCTION · LOW–MED · mobile MED
- **Does:** each particle's position = f(progress, per-particle seed), evaluated in the vertex shader. R1 used Bézier paths through a controlled intermediate field.
- **Use:** whenever particles must be scroll-reversible.
- **ALFA rule:** compatible with AL1. Prefer it over simulation for scroll work.
- **Src:** ALFA R1 `round-1-complete:src/gl/shaders.ts`.

### PT4 · Point rendering (Points / sprites) `[EXTERNAL]` PRODUCTION · LOW · mobile LOW–MED (overdraw)
- **Does:** `THREE.Points` with size attenuation. Each point is a screen-aligned square, often shaded as a disc in the fragment shader.
- **Avoid:** large soft additive sprites (overdraw kills mobile fill rate), and points meant to look like solid matter.
- **Src:** S1 `examples/webgl_points_*.html`, `webgpu_instance_points.html`.

### PT5 · Flow fields `[EXTERNAL]` EXPERIMENTAL · LOW–MED
- **Does:** moves particles or lines along a vector field (curl noise is divergence-free, so it gives "fluid" swirls).
- **Use:** visualising a real field (wind, water, magnetic) where the field *means* something.
- **Cheap-look failure:** generic curl-noise swirls (the most recognisable generative cliché).
- **Src:** S4 `generative/curl.glsl` (reference). S8 ch. 11 (knowledge).

### PT6 · Image reconstruction (particles → image) `[EXTERNAL]` + `[ALFA-PROVEN]` (R1) PRODUCTION · MED
- **Does:** the reverse of disintegration: particles converge into an image or shape by assigning each one a target (tonal rank or optimal-transport pairing in R1).
- **ALFA rule:** the same caveat as PT1. Pairing by meaning (part → part) beats pairing by tone (AL12 / R1 limitation "no semantic correspondence").
- **Src:** ALFA R1 `round-1-complete:src/gl/match.ts`.
