# 04 · Geometry Transformation

Entry format → `01-materials.md` header.
ALFA lesson AL10: **the transformation reads as causal when both states derive from one source.** Pick the technique that preserves ancestry.

---

### G1 · Choreographed rigid parts (piecewise transform) `[ALFA-PROVEN]` PRODUCTION · LOW · mobile LOW
- **Does:** an object is authored as parts whose transforms are pure functions of progress, with per-part inertia (AL2) and overlapping windows.
- **Perceived:** mechanical or architectural opening, a stack rising, assembly. Weight, sequence and contact all read.
- **Use:** objects that really are made of parts (slabs, leaves, panels, pages).
- **Avoid:** organic shape change.
- **Options:** Flagship slabs/cap/fins. Exp02 24 leaves in overlapping windows (each lifts everything above it, so the stack stays in contact).
- **Fallback:** the same at lower DPR. It survives all tiers.
- **Cheap-look failure:** linear simultaneous motion with no overlap, mass or contact (Exp02 "plinth rising alone" read as "map on a box").
- **ALFA rule:** overlap windows, vary inertia by mass, keep contact.
- **Src:** ALFA `src/flagship/choreo.ts`, `src/exp02/choreo.ts`.

### G2 · Morph targets (blend shapes) `[EXTERNAL]` PRODUCTION · LOW–MED · mobile LOW
- **Does:** per-vertex position/normal deltas blended on the GPU (`morphTargetInfluences`). Needs identical topology between the shapes.
- **Perceived:** smooth shape change that keeps surface identity (the same skin deforms).
- **Use:** shape A → B with a known correspondence (authored in a DCC tool), facial or organic change, logo morphs.
- **Avoid:** different topologies (you need remeshing or an SDF approach, G5). Huge vertex counts × many targets (memory).
- **Options:** `webgl_morphtargets`. `InstancedMesh` + morph (`webgl_instancing_morph`). Animate influences as a function of progress.
- **Fallback:** fewer targets, lower-poly targets.
- **Cheap-look failure:** linear vertex interpolation passing through collapsed or self-intersecting intermediate shapes.
- **ALFA rule:** design the *intermediate* shape. Add an in-between target when the linear midpoint is ugly.
- **Src:** S1 `examples/webgl_morphtargets.html`, `webgl_instancing_morph.html`, `webgpu_morphtargets.html`.

### G3 · Vertex-shader deformation as a function of progress `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · LOW–MED · mobile LOW–MED
- **Does:** displaces vertices analytically in the vertex shader (bend, twist, fold, fracture offsets) from uniforms. R2 T2 computed all glass-slab motion in the vertex shader.
- **Perceived:** folding, bending, peeling, breaking.
- **Use:** deformations with an analytic description (fold along an axis, curl a page, crack outward from a point).
- **Avoid:** deformations that need collision or physics.
- **Options:** `onBeforeCompile` / TSL `positionNode`. Recompute normals analytically (or derivative normals) so the lighting follows. Need enough tessellation along the bend.
- **Fallback:** coarser tessellation.
- **Cheap-look failure:** stale normals (the lighting doesn't follow the deformation), visible faceting at bends, rubbery motion on rigid materials.
- **ALFA rule:** material rigidity constrains deformation. Paper folds and doesn't stretch. Stone breaks and doesn't bend.
- **Src:** ALFA R2 `round-2-complete:src/gl/transitions/` (fracture). S1 `examples/webgl_modifier_curve_instanced.html`.

### G4 · Procedural geometry from a shared field `[ALFA-PROVEN]` PRODUCTION · LOW (build time) · mobile LOW
- **Does:** generates meshes at load from an authored scalar field (height, SDF) via contouring (marching squares/cubes) and extrusion, so the same field also drives 2D art.
- **Perceived:** the "map becomes territory" ancestry. Every edge has a reason.
- **Use:** semantic transformations between a drawing and an object.
- **Options:** Exp02 `terrain.ts` → marching-squares loops → printed contours *and* leaf geometry. three `MarchingCubes` (`objects/MarchingCubes.js`) for 3D fields.
- **Fallback:** a pre-generated glTF of the same geometry.
- **Cheap-look failure:** procedural geometry without authorship, like random noise terrain.
- **ALFA rule:** author the field deliberately. Procedural means derived, not random.
- **Src:** ALFA `src/exp02/terrain.ts`. S1 `examples/jsm/objects/MarchingCubes.js`. S4 `morphological/marchingSquares.glsl` (reference).

### G5 · SDF-based shape morphing (2D masks / 3D ray-marched) `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION (2D) / EXPERIMENTAL (3D) · LOW (2D) / HIGH (3D ray march) · mobile LOW / HIGH
- **Does:** interpolates or smooth-unions signed distance fields, so topology can change freely (a circle becomes the word NOW). 2D: an SDF texture (EDT of rasterised glyphs) + `smoothstep` / `fwidth` AA. 3D: ray-marched SDF primitives with smooth min.
- **Perceived:** liquid continuous change between shapes of different topology.
- **Use:** type ↔ shape, logo reveals, liquid masks (R2 T3).
- **Avoid:** 3D ray marching full screen on mobile, and the "metaball blob" look as the default.
- **Options:** SDF from glyphs via EDT (ALFA R2 `textsdf.ts`), from a mesh via BVH (`three-mesh-bvh` `sdfGeneration`, CPU or WebGPU) into a 3D texture, jump flood for GPU SDF of masks. Quilez SDF primitives/operators (LYGIA `sdf/*`, reference).
- **Fallback:** pre-rendered mask sequence or a simple crossfade.
- **Cheap-look failure:** generic metaball goo, soft blurred edges from low SDF resolution (R2: serif tips soften at 1024×512).
- **ALFA rule:** SDF resolution follows the finest feature (serif tips). Keep the morph's intermediate shapes designed, not incidental.
- **Src:** ALFA R2 `round-2-complete:src/gl/textsdf.ts`. S5 `example/sdfGeneration.js`, `example/webgpu_sdfGeneration.js`. S4 `sdf/`, `morphological/jumpFlood.glsl`. S8 ch. 07 (shapes, knowledge).

### G6 · Instancing / BatchedMesh `[EXTERNAL]` PRODUCTION · LOW per instance · mobile LOW–MED
- **Does:** `InstancedMesh` draws N copies of one geometry in one draw call (per-instance matrix/colour). `BatchedMesh` draws *different* geometries sharing one material in one call, with per-instance visibility, sorting and LOD.
- **Perceived:** density and multiplicity without stutter.
- **Use:** repeated architecture, tiles, shards, a portfolio grid of 3D cards.
- **Avoid:** using multiplicity as content (see 06-particles).
- **Options:** per-instance attributes driving shader animation (ALFA R1: 130k instanced shards). three-mesh-bvh `computeBatchedBoundsTree` for raycasting batched meshes.
- **Fallback:** fewer instances (R1 had `?q=balanced` 58k vs 130k).
- **Cheap-look failure:** obvious repetition (the same rotation and scale), uniform scatter.
- **ALFA rule:** instancing solves draw calls, not composition.
- **Src:** S1 `examples/webgl_instancing_performance.html`, `webgl_mesh_batch.html`, `webgl_batch_lod_bvh.html`. ALFA R1 (`round-1-complete:src/gl/transition.ts`).

### G7 · CSG / clipping / sectioning `[EXTERNAL]` PRODUCTION (narrow) · MED (CSG at build) / LOW (clipping planes) · mobile LOW
- **Does:** clipping planes cut geometry in the shader. With a BVH, three-mesh-bvh computes clipped-edge outlines and caps (`clippedEdges` example). Real CSG boolean ops come from BVH-based libraries (`three-bvh-csg`, same author; not separately researched).
- **Perceived:** cross-sections, revealing interiors, "cut" models.
- **Use:** architectural sections, product cutaways, interior reveals.
- **Avoid:** runtime CSG on large meshes every frame.
- **Fallback:** pre-cut geometry.
- **Cheap-look failure:** a clipped mesh with no cap (hollow inside visible).
- **ALFA rule:** every cut needs a cap and a cut-surface material.
- **Src:** S5 `example/clippedEdges.js`. S1 `examples/webgl_clipping*.html`.

### G8 · BVH-assisted geometry ops (closest point, voxelize, sculpt, sample) `[EXTERNAL]` PRODUCTION · LOW–MED · mobile LOW–MED
- **Does:** fast `closestPointToPoint`, `shapecast`, triangle collection, voxelization, interactive sculpting with `refit()`. These enable surface sampling and proximity effects.
- **Use:** placing things *on* surfaces, proximity-driven deformation, surface-following motion.
- **ALFA rule:** reach for BVH when a per-frame spatial query over > ~10k triangles is required (see 11-interaction I2).
- **Src:** S5 `example/{distancecast,shapecast,collectTriangles,voxelize,sculpt,randomSampleDebug}.js`.

### G9 · Contour / heightfield extrusion `[ALFA-PROVEN]`
- See G4. Exp02: each terrace edge/cut wall *is* the printed contour polyline at that height. Labels sit on a single leaf so type never breaks across a cut (a useful general rule for any sliced geometry carrying text).
