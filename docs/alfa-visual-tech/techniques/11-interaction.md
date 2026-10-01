# 11 · Interaction

Entry format → `01-materials.md` header.

---

### I1 · Raycasting (three.js Raycaster) `[EXTERNAL]` PRODUCTION · LOW (few simple meshes) → HIGH (dense meshes) · mobile MED
- **Does:** tests a ray against every triangle of the candidate meshes (bounding-sphere/box early-out per object only).
- **Use:** hover and click on a few low-poly objects, proxy meshes.
- **Avoid:** per-pointer-move raycasts against high-poly meshes (linear in triangles).
- **Options:** raycast against invisible low-poly *proxies*. Throttle to animation frames. Use `layers` to limit candidates. GPU picking (render IDs to a 1×1 RT, `webgl_interactive_cubes_gpu`) for huge counts.
- **ALFA rule:** never raycast the render mesh if a proxy will do.
- **Src:** S1 `src/core/Raycaster.js`, `examples/webgl_interactive_cubes_gpu.html`, `webgl_instancing_raycast.html`.

### I2 · BVH-accelerated queries `[EXTERNAL]` PRODUCTION · LOW per query after build · mobile LOW
- **Does:** `computeBoundsTree` builds a BVH (can be async in a worker), and `acceleratedRaycast` replaces `Mesh.raycast`. `firstHitOnly` stops at the nearest hit. Also shapecast, closest point and distance queries, and a scene-level `ObjectBVH` for many objects (frustum culling, scene raycast).
- **Perceived (what it enables):** precise surface interaction on dense meshes at 60 fps: a cursor that sticks to a sculpture's surface, light that follows the pointer across a detailed relief, brushing or sculpting, proximity-driven effects.
- **Use:** dense meshes (> ~10k tris) under continuous pointer interaction, surface sampling, collision for camera or character.
- **Avoid:** morphing or skinned geometry without the refit / skinned variants. The BVH is static, so refit after vertex edits.
- **Gotchas:** queries run in BVH-local space. Center large geometry first. One root per geometry group.
- **Src:** S5 README (Use, Gotchas), `src/core/{MeshBVH,ObjectBVH,SkinnedMeshBVH}.js`, `example/{raycast,shapecast,asyncGenerate,characterMovement,selection,objectbvh_sceneRaycast,objectbvh_frustumCulling}.js`. S1 `examples/webgl_raycaster_bvh.html`.

### I3 · Pointer / touch / scroll input hygiene `[ALFA-PROVEN]` + `[EXTERNAL]`
- **Does:** native scroll as the primary input (works with every device and accessibility tool). Pointer adds small damped offsets only. R3F advice applies everywhere: mutate in the loop, no per-event state churn, use deltas.
- **Touch:** no hover, so anything hover-dependent needs a tap or scroll equivalent. Avoid scroll-jacking (blocking native scroll). ALFA never hijacked scroll.
- **ALFA rule:** the experience must be complete with scroll alone. Pointer is enhancement.
- **Src:** AL1. S3 `docs/advanced/pitfalls.mdx`, `docs/API/events.mdx`.

### I4 · Spatial selection / object focus `[EXTERNAL]`
- **Does:** on selection, compute the object's bounds, animate the camera to frame it (damped, as a function of a focus progress 0..1 so it reverses), dim the others.
- **Options:** drei `Bounds` (fit and clip to an object), `CameraControls`. In plain three, compute a `Box3` and frame it with the FOV math.
- **ALFA rule:** focus is a reversible state with its own progress value, never a one-way tween.
- **Src:** S2 `src/core/Bounds.tsx`, `src/core/CameraControls.tsx`.

### I5 · Reversible navigation (spatial portfolio) `[ALFA-PROVEN]` (pattern) + `[EXTERNAL]`
- **Does:** the URL / history state maps to a discrete spatial location. The transition between locations is a progress curve, so back/forward equals reversing that progress. Flagship's "spatial entry / scale reinterpretation" was flagged as a possible future pattern for portfolio navigation (not implemented).
- **Techniques:** C1–C5 + I4 + T2. BVH (I2) when items are dense meshes. `BatchedMesh` / instancing for many items.
- **ALFA rule:** every navigable state must be deep-linkable and restorable on reload (AL1 reload coherence).
- **Src:** ALFA README (Flagship reusable idea).

### I6 · Presentation rotation (bounded) `[EXTERNAL]`
- **Does:** drag rotates a hero object within polar/azimuth limits, damped, and snaps back on release.
- **Use:** product inspection without free orbit (keeps the art-directed angles).
- **Src:** S2 `src/web/PresentationControls.tsx`.
