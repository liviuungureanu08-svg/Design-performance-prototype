# 07 · Camera / Spatial Motion

Entry format → `01-materials.md` header. This family is mostly `[ALFA-PROVEN]`. External sources add damping and interruption patterns.

---

### C1 · Scroll → progress → pose (deterministic mapping) `[ALFA-PROVEN]` PRODUCTION · ~0 · mobile LOW
- **Does:** native page scroll normalised to 0..1, then smoothed, then every camera and object parameter evaluated as a function of the smoothed progress (monotone cubic keyframes in Flagship `curve.ts`).
- **Perceived:** the viewer controls time, and the experience is fully reversible and interruptible.
- **ALFA rule:** never accumulate camera state per frame. Always evaluate it from progress (AL1).
- **Src:** ALFA `src/scroll.ts`, `src/flagship/curve.ts`, `src/flagship/choreo.ts`, `src/exp02/choreo.ts`.

### C2 · Critically damped smoothing (SmoothDamp) `[ALFA-PROVEN]` + `[EXTERNAL]` PRODUCTION · ~0
- **Does:** spring-like follow with no overshoot, frame-rate independent (uses `dt`). R3F pitfalls make the same point: use deltas, mutate in the loop, don't push per-frame state through React. drei `ScrollControls` uses `damping` + `maxSpeed` (it caps speed for long jumps).
- **ALFA rule:** clamp `dt` (AL3). Consider a max speed so a jump from 0 → 1 doesn't whip through every beat. ALFA doesn't do this yet; consider it if fast flicks look wrong.
- **Src:** ALFA `src/scroll.ts`. S3 `docs/advanced/pitfalls.mdx`. S2 `src/web/ScrollControls.tsx` (`damping`, `maxSpeed`).

### C3 · Per-mass inertia / interruption `[ALFA-PROVEN]`
- Separate dampers for camera, heavy masses and light masses (AL2). Interruption is free because targets are re-evaluated every frame.

### C4 · Physical camera language `[ALFA-PROVEN]` + `[EXTERNAL]`
- **Does:** a fixed focal length (Flagship FOV 30°), lens shift (off-axis projection) instead of tilting to keep verticals straight, a slow settle rather than a fly-through (Exp02: one move 64°→36° elevation). A look-up for a scale beat. Exposure adaptation across a threshold.
- **Perceived:** architecture photographed, not a game camera.
- **Cheap-look failure:** orbit-control spins, wide-FOV fly-throughs, constant motion with no holds.
- **ALFA rule:** one motivated move per beat, with holds between beats (R2 dwell segments).
- **Src:** ALFA `src/flagship/engine.ts` (lens shift, `baseProj`), Exp02 README (camera settle). S6 `src/objects/PhysicalCamera.js` (focus distance, f-stop, for reference DoF).

### C5 · Camera paths `[ALFA-PROVEN]` + `[EXTERNAL]`
- **Does:** keyframed position and target curves (monotone cubic avoids overshoot) or splines (`CatmullRomCurve3`). Flagship used an asymmetric near-miss traversal past the glass fins.
- **ALFA rule:** monotone interpolation for camera keys. Catmull-Rom overshoots between uneven keys.
- **Src:** ALFA `src/flagship/curve.ts`. S1 `src/extras/curves/CatmullRomCurve3.js`. S2 `src/core/MotionPathControls.tsx`.

### C6 · Parallax (pointer / ambient) `[ALFA-PROVEN]` + `[EXTERNAL]`
- **Does:** a small camera offset from the pointer (R1) or a slow ambient drift (Flagship). Reduced or disabled under reduced motion.
- **Avoid:** it on touch devices without a design (no hover). Gyro needs a permission prompt on iOS. None of ALFA's experiments had touch parallax.
- **ALFA rule:** parallax amplitude stays within the depth content's valid range (I-S3). Damp it.
- **Src:** ALFA `src/main.ts` (drift), R1 README. S2 `src/web/PresentationControls.tsx` (bounded polar/azimuth, damping, snap-back) as the pattern for *bounded* object rotation.

### C7 · Responsive cinematography `[ALFA-PROVEN]` (partial)
- **Does:** portrait widens the vertical FOV (`30 + portrait·22`) instead of shrinking the subject. It re-centres, places type per orientation, and normalises scenes to height (R2).
- **Unresolved:** landscape-shaped subjects in portrait leave empty bands (Exp02). The fix is a different composition per orientation (a camera key set per aspect class), not scaling.
- **ALFA rule:** author key camera poses for at least two aspect classes (landscape, portrait). Interpolate by aspect if needed.
- **Src:** ALFA `src/flagship/engine.ts` resize, Exp02 README "Unresolved".
