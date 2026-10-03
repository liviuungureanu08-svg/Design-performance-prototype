# Final report — clean-room spectacle experiment

**Status: PENDING_HUMAN_REVIEW**

---

## Workspace

| | |
|---|---|
| Experiment folder | `lamella-experiment/run/` |
| Site source | `lamella-experiment/run/site/` |
| Verification artifacts | `lamella-experiment/run/verification/` |

The repository root already contained a `run/` folder from a previous, frozen experiment. It was not opened, read, modified or reused. This experiment was built in a new sibling folder so that nothing in the earlier one would be overwritten. `MAIN_PROMPT.md`, `inputs/` and `shared/` at the repository root were also left unread.

## Startup

```bash
cd lamella-experiment/run/site
npm install

# development server
npm run dev
# → http://127.0.0.1:5177/

# production build + preview (what the verification used)
npm run build
npm run preview
# → http://127.0.0.1:4177/
```

Optional URL flag: `?hq` locks the highest quality level and turns off adaptive downgrading. The verification screenshots used it.

---

## Company

**Lamella**, also Lamella Environments AG. It is a fictional practice building kinetic architecture: walls, ceilings and vaults made from thousands of pivoting plates. Each plate is a blade of anodised bronze on its front and a diffuse light emitter on its back, and turns on its own motor. There are studios in Zürich, Kyoto and Mexico City. All client and venue names in the commissions list are invented.

## Concept thesis

The product and the website are the same thing. The page does not show pictures of an installation. The visitor stands in front of one: a single field of plates that responds to them and rebuilds itself into different architecture as they scroll.

The narrative pairs two ideas. Architecture can *notice* you, because each plate turns its light toward you. Architecture can *disappear*, because each plate can turn edge-on to your exact line of sight.

## Signature mechanism

The website runs on one physical rule. Every plate has a single degree of freedom: rotation about its own long axis.

- Angle 0 shows the dark bronze face, which reflects the room.
- Angle π shows the light face.
- Angles in between give half-tones and edge-on slivers.

Everything else comes from that one rule: presence response, the written word, the half-tone sun, the commission programmes, the transformations and the vanishing. It is evaluated per plate on the GPU.

## Signature transformation (peak)

**Aperture**, section 04, inside the vault. Every plate computes the rotation that makes it edge-on to the camera:

```glsl
atan(-dot(N, V), dot(R, V))
```

The plates cascade outward from the visitor into that alignment. The vault of 4,608 blades collapses visually into fine brass lines. The light model moves from night to daylight, and a low sun appears at the end of the nave. The headline's letter-spacing opens with the blades, and its ink switches from light to dark as the sky brightens. Scrolling on, the blades close, and the vault unrolls back into a flat wall.

## Experiential arc (scroll timeline `t` = 0…8)

| t | Scene | What the environment does |
|---|---|---|
| 0 | **Arrival** | Black veil lifts. A sweep of turning plates crosses the dark wall once. A sparse constellation of plates turns on its own. Pointer movement draws light. |
| 1 | **Presence** | Camera swings oblique to show plate depth and the floor reflection. The wall writes `HELLO` (`HI` in portrait), then re-writes itself as a half-tone sun made of partially turned metal. |
| 2 | **Canopy** | The wall peels away row by row. A travelling band of plates tumbles through a full turn while in flight. It becomes an undulating ceiling overhead, with a slow wind-wave programme. |
| 3 | **Nave** | The ceiling bends down into a vault. The camera walks through it. A ring of lit plates travels with the camera ("the light walks with you"). |
| 4 | **Aperture** | Signature peak (above). |
| 5 | **Commissions** | The vault unrolls back into the wall, framed to the right of a list of four commissions. Each commission has its own wall programme: tide line, eclipse/iris, rain at per-column speeds, spectrogram. Hover, focus or tap switches programmes with a staggered cross-fade. Without input, scroll position selects them. |
| 6 | **The plate** | Grazing macro view of the plates (thickness, bronze grain, brass edges). A calibration scan line runs across. Larger presence radius. Includes a line-drawn cross-section and four specifications. |
| 7 | **Contact** | Wide, calm frame. A single lit horizon row with a warm horizon glow and floor reflection. "Bring us a room." Brief input with a local confirmation. |

## Visual system

- **Palette.** Near-black umber room, smoked-bronze plate faces, brass edges, a 2,700 K-ish warm light face, warm ink (`#efe6d8`) and brass accent (`#cfa86c`). The only cool tone appears in the daylight sky during the Aperture scene. There is no purple/blue neon and no gradient blobs.
- **Type.** Instrument Serif for display and statements, IBM Plex Mono uppercase for labels, readouts and specs, Inter Tight for body text. All are self-hosted via `@fontsource`.
- **UI echoes the mechanism.** The logo mark is five bars at different rotations; it opens on hover. The section rail is made of small bars that "turn open" when active. The header readout shows the live plate count and an estimate of plates in motion.
- **Custom cursor** (fine pointers only). The dot is placed directly on `pointermove`, so it has no lag. A ring follows with light smoothing, and both use `mix-blend-mode: difference`.

## Interaction system

- **Presence (pointer/touch).** Raw pointer → a quick head follower (time constant ≈ 40 ms) → distance-spaced trail deposits, 28 samples in a ring buffer.
  - Each deposit stores position, birth time and a strength derived from speed.
  - In the shader, each sample's influence grows in radius and decays with age, with a damped oscillation term (`sin(age·6.5 − dist·14)`). Plates swept past overshoot slightly and settle instead of stopping dead.
  - Plates turn *toward* the visitor: the rotation direction depends on which side of the visitor they are.
- **Resting pointer.** The head keeps the plates under it lit, like a person standing still. After 3 s idle, its strength eases down to 65 %.
- **Click/tap.** A circular ripple travels out across the field.
- **Touch.** `touchmove` updates presence while the finger scrolls the page, so on mobile the finger lights the wall as it scrolls.
- **"The wall makes room for words."** The active text block's rectangle is sent to the shader each frame. Light faces and spill behind it are dimmed by about 78 % with a wide soft edge. Plate geometry and motion are unchanged, so no outline artifact appears.
- **Commissions.** Hover, focus and click select a programme. Programme changes cross-fade with per-plate delay.
- **Sound (opt-in, off by default).** Fully synthesised: a low room tone, plus a band-passed "rustle" and granular ticks. Their level follows the estimated number of moving plates.

## Motion architecture

- **One clock.** A single `requestAnimationFrame` loop; `dt` is clamped to 0.1 s. Every environment parameter is a pure function of the smoothed timeline value `t`, so slow scroll, fast scroll and direction reversal resolve to identical states.
- **Raw input → target → physical response → visual state:**
  - **Scroll.** Native scroll (no hijacking) → raw `t` → critically damped spring (ω = 6.2, velocity clamped to 7 sections/s) → camera, morph and programmes. Text visibility reads the *raw* `t`, so content reacts without inertia; the environment carries it.
  - **Pointer.** Head follower (fast) and camera parallax follower (slow, ω ≈ 2.4).
- **Camera.** Keyframed path. Catmull-Rom through positions and targets, with quintic easing per segment, gives intentional pauses at reading positions. There are separate keyframe sets for landscape and portrait.
- **Layout morphs** (wall → canopy → nave → wall).
  - Per-plate staggered interpolation of position and orientation basis. The stagger is a coherent travelling front (`S = 2.4`), not random scatter.
  - Plates lift off their surface along an arc while moving.
  - A full 2π tumble during flight sends a band of light through the sheet as it rebuilds.
- **Text.** Line-mask reveals. Exit direction follows travel: up when scrolling forward, down when scrolling back.

## Scroll behaviour

- The page is a normal document. Sections act as scroll spacers that pace the timeline; text panels are fixed overlays shown in deterministic `t` windows.
- **In-page navigation** (nav links, logo) scrolls to each scene's reading position, not the section top.
- **Scroll speed adds energy.** Scroll velocity drives a small global shimmer, so fast scroll visibly ruffles the plates and slow scroll stays calm.

## Material and depth strategy

**Plates**
- A real 3D box per plate (0.26 × 0.40 × 0.035 m), drawn as one instanced draw. There are three shading zones:
  - **Bronze front.** Fresnel reflection of a procedural environment, a lamp specular term, faint grain, and warm spill when neighbours are lit.
  - **Light back.** Hot core, amber rim and dark frame.
  - **Brass edges.** Environment reflection plus sun specular in daylight.

**Environment and floor**
- **Environment function.** Night ambience, horizon glow, faint architectural light slots that appear only in reflections, and a daylight sky with a sun. The same function is used for the background, plate reflections and the floor, so they stay consistent.
- **Honed stone floor** with slab joints.
- **Floor reflection.** A true mirrored second draw of the plates, faded with height and tinted by the semi-transparent floor.
- **Fog** blends toward the current atmosphere.

**Post-processing**
- HDR half-float target with 4× MSAA (quality levels 0–1), then a half-resolution bloom (high threshold), then a custom final pass: ACES tone mapping, vignette and fine grain.

## Responsive approach

- **Portrait** (aspect < 0.82) rebuilds the field as a 44 × 64 grid (2,816 plates, a tall wall) with its own camera path and wider FOVs. The wall image is redrawn for the new grid ("HI", sun centred higher).
- **Mobile layout.**
  - Text blocks sit at the bottom, full width.
  - The commission list sits under the wall, and the wall is framed higher.
  - The nav is hidden; the brand, a compact readout and the sound toggle remain.
  - The rail shrinks to bars only. The custom cursor is off.
  - On mobile, presence comes from taps and from the scrolling finger.
- DPR is capped at 1.75 desktop and 1.6 portrait.

## Reduced-motion approach

`prefers-reduced-motion: reduce`:

- **Static scenes.** The scroll timeline snaps to one fixed hold state per section, with a 380 ms canvas cross-fade between states. There are no camera flights, no layout flights and no tumbles.
- **No ambient motion.** No intro sweep, no idle breathing or constellation; programme time is frozen, so canopy and commission patterns are still images.
- **CSS.** Text transitions are instant, and looping CSS animations are removed.
- **What stays.** Identity, composition, every scene (including the vanished-vault Aperture state) and pointer presence. Pointer presence is user-initiated and decays.

## Performance observations

- **Rendering.** One instanced draw for the plates and one for their reflection, one floor quad, and one background triangle. Everything else is post-processing. There are about 110 k triangles in total at 4,608 plates.
  - Layout, morphing, presence and programmes are computed on the GPU in the vertex shader.
  - The CPU per frame updates about 40 uniforms.
  - There are no per-frame allocations in the render path.
  - DOM style writes are cached and skipped when unchanged. The single layout read (safe-zone rectangle) happens before any DOM write in the frame.
- **Adaptive quality.** After 60-frame windows averaging > 24 ms, the quality level steps down: DPR → 1.4 → 1.15 → 1.0, then MSAA off, then bloom off. It never steps back up, to avoid oscillation.
- **Measured in this container** (no hardware GPU; Chromium on SwiftShader software rendering):
  - JS time per frame averaged about 1.5–2.3 ms across runs, including GL command submission.
  - Occasional spikes above 150 ms were dominated by software rasterisation.
  - Without `?hq`, adaptive quality dropped to level 3 under SwiftShader, as designed.
  - These numbers do **not** represent frame rate on a real GPU. **Frame rate on real hardware was not measured.**
- **Bundle.** JS 513 kB (≈133 kB gzip; mostly three.js), CSS 21 kB, plus self-hosted font files.

## Verification performed

All of it was in headless Chromium (Playwright, SwiftShader WebGL) against the production preview build.

1. **Render review.** Screenshots at timeline positions, reviewed visually after each pass. There were two refinement passes:
   - **Pass 1:**
     - Bloom was blowing scenes out to cream. Lowered emission, raised the bloom threshold and gave the light faces a hot-core look.
     - Text was scrolling away mid-scene. Fixed panels with `t` windows replaced sticky panels.
     - A plate-rotation-based text safe zone created a lit rectangle outline. Replaced it with emission dimming.
     - The rail was misaligned. Fixed.
     - A light-column artifact appeared in the background. Removed reflection slots from the backdrop.
     - Morph flights scattered randomly. Changed to a coherent travelling front.
     - The Aperture scene only brightened. Reworked so the blades align edge-on to the viewer, added a daylight sky and sun, and moved the headline below the sun.
     - Fixed discovery and commissions framing, descender clipping and footer visibility.
   - **Pass 2:**
     - Rebalanced Aperture sky, exposure and bloom so the peak keeps colour.
     - Steepened the headline ink switch so it doesn't pass through a low-contrast grey.
     - Fixed portrait framing for the commissions scene and the portrait word/sun position.
     - Moved the per-frame layout read ahead of style writes and cached style writes.
     - Calmed the tide programme.
   - Final screenshot sets:
     - `verification/final-desktop/` (1440 × 900)
     - `verification/final-mobile/` (390 × 844)
     - `verification/shots-reduced/` (reduced motion)
2. **Functional checks** (`verification/verify.mjs` → `verification/verify-results.txt`). All 28 checks PASS:
   - Hero reveal.
   - Pointer trail deposition and presence strength.
   - Click ripple.
   - Nav jump to the commissions reading position.
   - Commission hover and keyboard focus switching the wall programme.
   - Sound toggle on and off.
   - Contact form response.
   - No horizontal overflow on desktop or mobile.
   - Rapid scroll reversal leaves the timeline finite and converging.
   - Reduced motion: intro skipped, ambient motion off, discrete hold states, text shown.
   - Mobile: portrait grid, tap reaching the wall, cursor hidden, nav/readout layout.
3. **Console.** Zero errors and zero warnings in the desktop, reduced-motion and mobile sessions, and in all screenshot sessions (`verification/*/…-console.txt`).

Re-run:

```bash
cd lamella-experiment/run/site && npm run build && npm run preview &
cd ../verification
node verify.mjs
OUT=$(pwd)/final-desktop node shoot.mjs
```

## Known weaknesses

- **Untested on real hardware:**
  - Frame rate on a real GPU was not measured. All rendering here was software; frame pacing and smoothness on real devices are untested.
  - Adaptive quality only steps down. A brief hitch on a fast machine could lower quality permanently for the session.
  - Sound was verified only as toggling state in headless; it was not listened to.
- **Composition:**
  - In the canopy-to-vault transition (t ≈ 2.9–3.3), the lower half of the frame is mostly empty floor and horizon.
  - In the Aperture peak, the headline sits over the floor reflection of the sun. Readability depends on the ink switching to dark, which happens over a short band of the transition.
  - The commission programmes "Hall of Tides" and "Night Score" use partially turned plates. Banding in them can read as busy at small sizes.
- **Interaction:**
  - Long in-page jumps (nav links) use native smooth scroll. The environment flies through every intermediate scene quickly on the way.
  - The safe zone is a single rectangle per text block, so the dimming does not follow line shapes.
  - On touch devices, presence exists only while a finger is down. There is no hover-style browsing of the wall.
  - Under reduced motion, pointer presence still animates (user-initiated, decaying).
- **Content:**
  - The contact field only gives a local confirmation; nothing is sent.
  - Client and venue names are fictional, but some could coincide with real entities.
  - Specifications in the copy (0.1°, 11 ms, 18 dB(A)) are fictional product claims.

---

## Isolation declarations

```
IMPECCABLE USED: NO
EXTERNAL DESIGN SKILL USED: NO
ALFA GI USED: NO
ALFA VISUAL LAB USED: NO
PREVIOUS EXPERIMENT IMPLEMENTATION REUSED: NO
WEB DESIGN REFERENCES CONSULTED: NO
```

Implementation libraries only: three.js (WebGL, `EffectComposer`, `UnrealBloomPass`) and Vite. Fonts come from `@fontsource`. All shaders, layouts, programmes, audio synthesis, UI and copy were written for this run. No web browsing took place.

**FINAL STATUS: PENDING_HUMAN_REVIEW**
