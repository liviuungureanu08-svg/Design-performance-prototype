# Alfa Premium Web Experience Lab

## Objective

Prove (or disprove) that modern browser tech can deliver a studio-grade, scroll-driven visual transformation in which **Scene A physically becomes Scene B** — not a crossfade, not a particle overlay. Isolated lab; not the production Alfa repo.

## Architecture

Vite + TypeScript + **three.js (direct, no React/R3F)**. One page, one WebGL canvas, DOM typography on top.

```
src/art/scenes.ts      Procedural art (Canvas 2D): Ember (scene A) and Tide (scene B), each with a colour + depth map
src/gl/match.ts        Pairs every A fragment with a B destination (equal-count tonal bands, angular order inside a band)
src/gl/shaders.ts      Vertex/fragment shaders: the entire transformation is a pure function of progress `uT`
src/gl/transition.ts   CinematicTransition: instanced shard mesh + dark backdrop + camera/parallax
src/scroll.ts          Critically-damped smoothing (SmoothDamp) + helpers
src/typography.ts      Masked word-reveal copy choreography
src/main.ts            Boot, scroll → progress mapping, frame loop, static fallback
scripts/shots.mjs      Real-Chromium screenshots at fixed progress values (`window.__lab`, needs `?debug`)
scripts/robustness.mjs Wheel/reverse/reload/resize/phone/fallback pass with GPU resource counters
```

How the transformation works:

1. **Fragments are the image.** The image is tiled by a jittered lattice (~130k irregular quads). Corners are shared, so at rest the shards tile exactly and the picture is intact; each shard samples its *own* cell of the texture, so in flight it carries real image colour, never generic dots.
2. **Real depth.** A procedural depth map displaces shards in z; the camera orbits slightly with the pointer → genuine parallax. Rest positions are perspective-compensated so the neutral view is pixel-identical to the flat art.
3. **Matter continuity.** Each A shard is assigned a B destination by tonal rank (1-D optimal transport on luminance) with angular order preserved around each scene's focal point → energy/colour is conserved and neighbours travel together (laminar flow, not noise).
4. **A → field → B.** Path = quadratic Bézier forced through a point on a tilted, shearing **ring** (the controlled intermediate field), whose angle/radius derive from the shard's place in A. Eased with a dwell near the midpoint so the field is readable.
5. **Choreography.** Departure order: periphery first, centre (the sun) holds longest; shards shiver and draw inward just before leaving (anticipation); sizes vary, ~1% are larger "hero" shards for depth; light cues from shard normals; scroll-velocity stretches shards along their motion.
6. **Scroll feel.** Native scroll → SmoothDamp (spring-like inertia) → progress. All state is a pure function of progress, so reverse/pause/jump/reload are inherently coherent.

## Current State

All milestones M0–M6 implemented in first form; visually verified in headless Chromium (software WebGL). See Verification.

## Completed Milestones

- M0 Foundation · M1 Static art direction · M2 Depth/scroll/typography · M3 Fragmentation · M4 A→field→B · M5 Polish (first pass: departure order, hero shards, shading, soft reflections) · M6 Robustness pass (see Verification)

## Current Milestone

Polish iteration / validation on real GPU hardware.

## Important Technical Decisions

- **Direct three.js + custom shaders**, no R3F, no GSAP/ScrollTrigger: one mesh, one uniform-driven timeline; a 15-line SmoothDamp beats a timeline library here.
- **All art is procedural** (code-generated at runtime) → no third-party asset licensing. Fonts: Instrument Serif and Inter via `@fontsource` (SIL OFL).
- **Dark blurred backdrop** under the shards so depth disocclusion gaps and departed regions read as tone, not as holes.
- **Quality levels**: `?q=balanced` (58k shards) vs default `premium` (130k). `?fallback=1`, WebGL failure, context loss or `prefers-reduced-motion` → static scroll cross-fade of the two scenes.
- Timeline: scroll 0–12 % calm (parallax), 12–33 % build-up, 33–70 % transformation, 85 %+ Tide settled. Page runway 820 vh.

## Known Limitations

- Verified only on software WebGL (SwiftShader) — real-GPU frame rates are **not measured**; 130k shards × 4 verts with 2 path evaluations is expected to be comfortable on discrete/modern integrated GPUs but unproven.
- Depth parallax can show faint disocclusion seams at hard depth edges at maximum pointer offset (mitigated by 4 % shard overscan + backdrop).
- Matching is tonal/angular only; no semantic correspondence (a sun does not literally "become" the eclipse, it feeds it by tone).
- No touch-gyro parallax on mobile; phone layout is cover-cropped.

## How to Run

```bash
npm install
npm run dev        # http://localhost:5173  (add ?q=balanced, ?fallback=1, ?debug)
npm run build      # typecheck + production build to dist/
npm run preview
npm run shots      # needs the dev server running; writes ./shots/*.png
node scripts/robustness.mjs
```

`?debug` exposes `window.__lab.set(u)` (force progress 0..1) and `window.__lab.info()`.

## Verification

- `tsc --noEmit` and `vite build` pass.
- Real Chromium (SwiftShader): scene A, build-up, ring field, convergence, scene B captured at fixed progress; console clean.
- `scripts/robustness.mjs` (run at 480×270, `?q=balanced`, software GL): wheel advance PASS, reverse scroll PASS, reload at mid-scroll keeps position PASS, 5 resize cycles with no texture/geometry growth (6 textures / 2 geometries, constant) PASS, forced fallback engages PASS, console clean.
- 390×844 phone: found and fixed a cover-fit bug (portrait was letterboxed); re-verified start/mid/end fill the screen (`scripts/phone.mjs`).
- Not verified: real-GPU frame rate; fallback visual quality beyond engaging; 2× DPR on real hardware.

## Next

Measure on real hardware; tune shard count per device (PREMIUM 130k / BALANCED 58k / FALLBACK static); then evaluate extracting `CinematicImageTransition` (match + shaders + transition) and `ScrollChoreography` (SmoothDamp + copy) as reusable primitives.
