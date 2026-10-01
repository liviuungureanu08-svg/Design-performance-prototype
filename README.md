# Alfa Premium Web Experience Lab

Isolated creative lab (not the production Alfa repo). Question under test: can modern browser tech make a scroll-driven web page that *surprises* — where one recognisable thing becomes another — rather than a polished effect between two images?

## ROUND 1 — "Ember → Tide" (preserved)

- **Demonstrated:** a GPU-driven image transformation: ~130k instanced shards carrying real image colour, paired by tonal rank / angle, flown through a ring field, SmoothDamp scroll, DOM typography. Technically strong; human review: *"reads as an effect between two images"*.
- **Architecture:** three.js + custom shaders, Canvas-2D procedural art + depth maps, one instanced mesh, everything a pure function of progress.
- **Recovery point (do not rewrite):** commit `5e2e40a` · annotated tag `round-1-complete` (local) · remote branch **`round-1-archive`**. To run it: `git checkout round-1-archive && npm i && npm run dev`.

## ROUND 2 — "One Light" (current)

### Objective
Direct a multi-chapter *film*, not a showreel: variety of mechanism, unity of art direction. Three fundamentally different transformations, one recurring object, one lighting philosophy ("one light, four states").

### The film
| | Chapter | World | Light is… |
|---|---|---|---|
| I | **Before** | backlit dune horizon, 5 parallax depth layers, a lone traveller, one enormous sun | waiting |
| II | **Within** | monumental coffered dome seen from below (real ray/sphere geometry, volumetric shaft) | admitted |
| III | **Held** | night sea; the light is now a liquid refractive drop with a mirrored reflection | a surface |
| IV | **Now** | the word NOW as carved obsidian slabs on a black mirror; the drop sits inside the O | the word |

**The circle never leaves.** sun → eclipse/pupil → oculus → drop → the O of NOW. Same centre, same radius at every hand-off, so the viewer recognises "that became that".

### Transformations (different mechanism each time — none is particles)
1. **T1 Sun → aperture → eye** *(optical distortion + mask morph + camera travel)* — heat shimmer builds, a pupil opens in the sun, the sun's light is compressed into a thin refractive rim that bends the dunes around it (chromatic lensing); the dunes rush outward (per-layer dolly) as the rim expands past the frame while the dome pulls in from inside it. The oculus is aligned to the sun, so the circle becomes the dome's own opening.
2. **T2 The shell breaks** *(macro glass fracture + micro fragments + depth)* — the dome image is cut into ~70 irregular slabs of glass with real thickness along a jagged crack web radiating from the oculus. Cracks first leak the light of the world behind (anticipation), then slabs release in a wave outward from the opening — petals first — tumble toward/past the camera, clear from stone-image into refractive glass, and shed micro-chips from their edges. Pure function of progress, computed in the vertex shader.
3. **T3 Drop → word** *(liquid mask morph + typography as geometry + light)* — the drop opens into a ring (the O), its signed-distance field is morphed into the SDF of NOW (N and W grow out of the O as liquid skeletons), the word holds a beat as luminous glass cut-outs in the night sea, then floods the frame while the camera surges in and settles; the light-letters darken into obsidian: the word emerges from light.

### Architecture (changed from Round 1)
```
src/gl/engine.ts           Renderer, HDR (half-float) targets, bloom + ACES + grain post, shared uniform block, capability probe
src/gl/scenes/*.ts         Four procedural *shader scenes* (horizon, dome, sea, finale) — no image assets at all
src/gl/transitions/*.ts    portal (T1), fracture (T2: Voronoi→jagged glass slabs, vertex-shader motion), liquid (T3)
src/gl/textsdf.ts          Rasterises N-O-W (drawn circular O) → signed distance field (EDT) → half-float texture
src/gl/director.ts         Beat → render passes (which scenes, which transition params)
src/timeline.ts            Scroll layout (dwells ≈ stillness vs transitions) + per-transition tempo curves
src/main.ts, scroll.ts, typography.ts   boot, SmoothDamp, masked word-reveal copy, adaptive resolution, poster fallback
scripts/                   view.mjs / seq.mjs (real-Chromium stills), robustness.mjs
```
Scenes render into half-float targets; a transition is a composite of two scene targets (T1, T3: full-screen shader; T2: a real 3-D mesh pass). Everything is a pure function of scroll progress → reverse, pause, jump and reload are inherently coherent. Scroll → SmoothDamp → `Beat{scene, transition, p}`; dwell segments are near-still holds.

### Milestones (all done in first form)
R2-0 preservation · R2-1 art direction (4 static scenes, quality-gated frozen) · R2-2 first non-particle transform (T1) · R2-3 second language (T2) · R2-4 sequence (T3, timeline, copy, rhythm) · R2-5 WOW pass (fixed: NaN from `exp` overflow, dome ray-march zipper, bright-wash bug in portal, slab over-exposure, SDF jaggies, portrait finale scale, seam checks at every transition boundary) · R2-6 robustness (below).

### Quality & fallbacks
- `?noadapt` disables adaptive resolution (used for stills). Default: render scale 0.85 of device pixels, auto-drops to 0.5 if frames are slow, ≤1.7 MP per pass.
- Portrait: scenes are height-normalised; the finale word scales about the circle so the O stays on the circle. Copy sits top for chapter III (reflection occupies the bottom).
- No WebGL2 / no float render targets / context loss / `?fallback=1` → static poster + all copy still works. MSAA is dropped automatically if unsupported.
- `prefers-reduced-motion` → ambient camera drift reduced; scroll-driven transitions remain (they *are* the content).

### Verification
- `tsc --noEmit`, `vite build` (≈580 kB JS, 151 kB gz; no image assets) pass; production bundle checked via `vite preview`.
- Real Chromium (SwiftShader software GL) stills at 640×360 → 1600×900 and 390×844@3×: every chapter, every transition at 6–10 progress points, boundary seams (transition end ≡ dwell start), fracture early→late, T3 morph sequence. Contact sheets reviewed; defects fixed iteratively.
- `node scripts/robustness.mjs` (dev or preview server running): wheel slow/fast(to the end)/reverse PASS · pause mid-transition ×3 PASS · reload keeps position PASS · 7 resize cycles incl. portrait with no GPU resource growth PASS · phone portrait across the film PASS · forced fallback PASS · console clean PASS.

### Known limitations
- **Not measured on a real GPU** (software GL only). The dome ray-march and finale (≈25 SDF fetches/px, ×2 over the mirror floor) are the heavy passes; adaptive scale is the safety net.
- No touch/gyro parallax on phones (ambient drift only). iOS Safari float-target/MSAA behaviour untested.
- Dome's lit patch is soft; T2's micro-fragments are flat triangles (they read as glass chips in motion, less so in stills). Finale serif tips soften slightly (SDF resolution 1024×512).
- Static art is procedural and tuned by eye; no reference to any third-party site or asset.

### Harvest candidates (not extracted yet — proof first)
`PortalTransition` (lensing rim + per-layer dolly), `GlassShellFracture` (Voronoi→jag→slab + vertex-shader motion), `SdfMaskMorph` (circle→type→flood with meniscus), `DepthLayerScene` (analytic parallax layers), `HdrPost` (bloom/ACES/grain), `CinematicScrollTimeline` (dwell/transition beats + tempo curves).

## Preview
`node scripts/pack-artifact.mjs` packs the production build into one self-contained HTML fragment (`artifact/index.html`, ≈1 MB, inline JS/CSS, fonts as data: URIs) for hosting as a claude.ai Artifact. Published privately (owner login required); it has been verified locally inside a skeleton-style wrapper, not inside the Artifact viewer's own sandbox.

## How to run
```bash
npm install
npm run dev                  # http://localhost:5173   (?debug exposes window.__lab.set(u); ?u=0.24 pins progress)
npm run build && npm run preview
node scripts/view.mjs "u=0.24" out.png 1280x720      # dev server must be running
node scripts/seq.mjs "" prefix 0.2,0.24,0.5 960x540  # stills to /tmp/claude-0/
node scripts/robustness.mjs
```
