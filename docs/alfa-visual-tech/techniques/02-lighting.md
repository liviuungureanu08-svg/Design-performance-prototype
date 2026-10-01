# 02 · Lighting

Entry format → `01-materials.md` header. Sources → `../SOURCE_REGISTRY.md`.
Principle (research + AL7, AL8): **most "premium" reads come from the lighting environment.** Bloom is not lighting (`../ANTI_PATTERNS.md` A2).

---

### LT1 · Image-based lighting via PMREM `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · LOW at runtime (one-time bake) · mobile LOW
- **Does:** prefilters an environment (HDR equirect, cubemap, or a rendered scene) into a roughness mip chain (PMREM). `scene.environment` then lights every PBR material with correct glossy/diffuse response. `scene.environmentRotation` / `environmentIntensity` and `backgroundBlurriness` give control.
- **Perceived:** objects sit in a coherent light world, and reflections agree with the shading.
- **Use:** always, for PBR objects. It's the baseline light.
- **Avoid:** using a downloaded HDRI's look as-is (it brings someone else's art direction).
- **Options:** `PMREMGenerator.fromEquirectangular / fromCubemap / fromScene`. `RoomEnvironment` (neutral studio, procedural). `HDRLoader`, `EXRLoader`, `UltraHDRLoader` (smaller files). `GroundedSkybox` to put the env on a ground (S1 `objects/GroundedSkybox.js`).
- **Fallback:** a lower-resolution env (256 cube is usually enough for rough materials).
- **Cheap-look failure:** a recognisable stock HDRI in chrome reflections, or an env that doesn't match the visible background.
- **ALFA rule:** bake once, never per frame unless the light actually changes (then re-bake on change, not continuously).
- **Src:** S1 `examples/webgl_pmrem_*.html`, `webgl_materials_envmaps_hdr.html`, `webgl_materials_envmaps_groundprojected.html`, `examples/jsm/environments/RoomEnvironment.js`. ALFA `src/flagship/env.ts`, `src/exp02/scene.ts` L127.

### LT2 · Authored environment / Lightformers (studio light design) `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · LOW (bake once) · mobile LOW
- **Does:** builds a small virtual scene of emissive shapes (rects, rings, circles at intensities above 1, tone mapping off) around the object, renders it into a cube target and PMREMs it. drei `Environment` with children does this (`frames=1` = render once; `Infinity` = live). `Lightformer` = an emissive plane/ring with `form`, `intensity`, `target`.
- **Perceived:** controlled reflection lines on glass, metal and lacquer. Shape-defining highlights like product photography (softboxes, strips).
- **Use:** any hero object that's reflective or transmissive. This is the most effective premium lighting tool for objects.
- **Avoid:** live (`frames=Infinity`) unless light *moves* as part of the story.
- **Options:** plain three.js: build the scene → `PMREMGenerator.fromScene` (ALFA Flagship did exactly this, AL8). Animate *one* strip for a specular sweep → re-bake only while it moves.
- **Fallback:** the same baked env at lower resolution.
- **Cheap-look failure:** symmetric evenly spaced strips, so it reads as a "render engine default". Too many sources mean noisy reflections.
- **ALFA rule:** reflection lines are composed deliberately (their layout is an art-direction decision, made per project). Technically: few sources, baked once.
- **Src:** S2 `src/core/Environment.tsx` (`frames`, CubeCamera, ~L128–173), `src/core/Lightformer.tsx`. ALFA `src/flagship/env.ts`.

### LT3 · Area lights (RectAreaLight, LTC) `[EXTERNAL]` PRODUCTION · MED (per light, per pixel) · mobile MED
- **Does:** an analytic rectangular light using LTC lookup tables (`RectAreaLightUniformsLib` / `RectAreaLightTexturesLib` must be initialised). Gives correct soft highlights on all roughness levels.
- **Perceived:** a broad window or softbox highlight whose shape changes with roughness.
- **Use:** an architectural light source visible as a shape, a dynamic softbox that moves.
- **Avoid:** needing shadows from it: **RectAreaLight has no shadow support** (S1 `src/lights/RectAreaLight.js`).
- **Options:** combine with a baked env lightformer at the same position (for reflections) and a contact/accumulated shadow (LT5/LT6). Or analytic occlusion in a custom shader (AL9).
- **Fallback:** a lightformer in the baked env (static).
- **Cheap-look failure:** an area light with no shadow, so objects float.
- **ALFA rule:** pair every area light with a separate occlusion strategy.
- **Src:** S1 `src/lights/RectAreaLight.js`, `examples/webgl_lights_rectarealight.html`, `examples/jsm/lights/RectAreaLight*Lib.js`. ALFA `src/flagship/shading.ts` (sampled line light).

### LT4 · Shadow maps (PCF / PCSS / VSM / CSM) `[EXTERNAL]` PRODUCTION · MED–HIGH · mobile MED–HIGH
- **Does:** depth from the light's view. **PCF** (`PCFSoftShadowMap` deprecated in r186 → use `PCFShadowMap` + `shadow.radius`). **VSM** blurs nicely but every receiver also casts. **PCSS** (example) makes penumbra widen with distance. **CSM** / `SunLight` cascades for *large* scenes only (S1 docs: small bounded scenes don't benefit).
- **Perceived:** grounding, form, time of day, contact.
- **Use:** a directional key that defines the scene (Exp02 low sun, AL15).
- **Avoid:** an unmeasured giant map (Exp02 4096², AL21). Updating every frame when light and geometry are static.
- **Options:** fit the shadow camera tightly to the subject (resolution matters more than map size). `bias` / `normalBias`. `renderer.shadowMap.autoUpdate = false` + `needsUpdate = true` on change (drei `BakeShadows` does exactly this).
- **Cost:** a full depth render of casters per light per update, plus filtering taps per pixel.
- **Fallback:** 2048 → 1024 maps, fewer casters, baked shadow texture, contact shadow only (LT5).
- **Cheap-look failure:** hard aliased edges, peter-panning, shadow acne. A uniform blur radius regardless of distance.
- **ALFA rule:** tight frustum first, map size last. Freeze the map when nothing moves.
- **Src:** S1 `src/constants.js` (deprecation note), `examples/webgl_shadowmap_{pcss,vsm,csm,performance}.html`, `examples/jsm/lights/SunLight.js` (header). S2 `src/core/BakeShadows.tsx`. ALFA `src/exp02/scene.ts` L161–162, L299–304.

### LT5 · Contact shadows (depth-from-below + blur) `[EXTERNAL]` PRODUCTION · MED (if every frame) / ~0 (frozen) · mobile LOW–MED
- **Does:** an orthographic camera looks up from the ground plane, renders a depth-to-alpha material into a small RT (default 512²), and blurs it (horizontal + vertical passes). The result is a soft occlusion pool on a plane.
- **Perceived:** the object *touches* the ground, the most important grounding cue.
- **Use:** product-style objects on a floor, layered paper on a desk.
- **Avoid:** non-planar receivers. Needing directional shadows (it's direction-less).
- **Options:** drei `ContactShadows` (`frames`: 1 = bake once, `blur`, `far`, `resolution`). three `webgl_shadow_contact` (the same technique in plain three.js). WebGPU `SSSNode` (screen-space shadows) complements shadow maps for fine detail.
- **Fallback:** a pre-baked shadow texture on a plane.
- **Cheap-look failure:** one uniformly blurred blob, with no tight dark core where contact happens.
- **ALFA rule:** combine a tight contact core with a broad soft falloff (two blurs, or contact + LT4/LT6).
- **Src:** S1 `examples/webgl_shadow_contact.html`, `examples/jsm/tsl/display/SSSNode.js`. S2 `src/core/ContactShadows.tsx`.

### LT6 · Accumulated / progressive shadows and lightmaps `[EXTERNAL]` PRODUCTION (static scenes) · HIGH while accumulating, ~0 after · mobile MED
- **Does:** renders many jittered shadow frames (randomized light positions) and accumulates them into a texture. The result is area-light-like soft shadows and AO-like occlusion. `ProgressiveLightMap` accumulates into UV2 lightmaps for whole objects.
- **Perceived:** soft studio shadows with a correct penumbra. Real-time maps can't produce that look.
- **Use:** static hero staging. Accumulate during a loading/intro moment, then freeze.
- **Avoid:** moving casters (temporal mode smears unless `limit` / `blend` is tuned).
- **Options:** drei `AccumulativeShadows` + `RandomizedLight` (`frames` default 40, `temporal`, `limit`, `blend`, `alphaTest`). three `misc/ProgressiveLightMap.js` (+ `ProgressiveLightMapGPU.js`).
- **Fallback:** bake offline into a texture (or path-trace it, 12-reference).
- **Cheap-look failure:** visible banding or noise from too few frames, or a frozen shadow that disagrees with a moving object.
- **ALFA rule:** accumulate once and freeze. Never pay this every frame.
- **Src:** S2 `src/core/AccumulativeShadows.tsx`. S1 `examples/jsm/misc/ProgressiveLightMap.js`, `examples/webgl_shadowmap_progressive.html`.

### LT7 · Ambient occlusion (baked / GTAO / SAO) `[EXTERNAL]` PRODUCTION · baked LOW / screen-space MED–HIGH · mobile HIGH (SS)
- **Does:** darkens creases and contact. Baked AO uses an `aoMap`. Screen-space uses GTAO (`GTAOPass` / `GTAONode`) or SAO/SSAO from depth + normals.
- **Perceived:** density, crevices, small-scale contact.
- **Use:** complex static geometry → bake. Dynamic geometry on desktop → GTAO at half resolution.
- **Avoid:** strong SSAO halos around silhouettes, or SSAO on mobile.
- **Fallback:** baked AO, or none.
- **Cheap-look failure:** dark "outline" halos, the dirty look of AO cranked up.
- **ALFA rule:** AO is a correction, so keep it barely noticeable when toggled.
- **Src:** S1 `examples/jsm/postprocessing/GTAOPass.js`, `examples/jsm/tsl/display/GTAONode.js`, `examples/webgl_postprocessing_gtao.html`.

### LT8 · Exposure and tone mapping `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · ~0 · mobile LOW
- **Does:** maps scene-referred HDR to display. three r186: `ACESFilmic`, `AgX`, `Neutral`, `Reinhard`, `Cineon`, `Linear`, `Custom`. Neutral (Khronos PBR Neutral) keeps base colours close to authored values. ACES compresses and shifts hue. AgX desaturates highlights gracefully. Exposure can be animated (eye adaptation).
- **Perceived:** highlight roll-off, colour fidelity, a "filmic" or "product-true" feel.
- **Use:** Neutral for colour-critical materials and brand colours (Exp02). ACES/AgX for cinematic high-contrast light (Flagship, with exposure adaptation across a threshold).
- **Avoid:** switching tone mappers to "fix" lighting. Double tone mapping when compositing render targets (three disables it inside the transmission pass for this reason).
- **Options:** half-float targets for HDR intermediates (ALFA Flagship, R2). `OutputPass` at the end of a composer chain applies tone mapping + colour space.
- **Fallback:** none needed.
- **Cheap-look failure:** clipped white highlights, or a mid-grey wash from low exposure plus heavy bloom.
- **ALFA rule:** choose the tone mapper per project by material priority (colour fidelity vs cinematic contrast) and record why.
- **Src:** S1 `src/constants.js` (ToneMapping constants), `examples/jsm/postprocessing/OutputPass.js`. ALFA `src/exp02/scene.ts` L163, `src/flagship/engine.ts` L48, L103.

### LT9 · Emissive relationships `[EXTERNAL]` PRODUCTION · LOW · mobile LOW
- **Does:** an emissive material only *looks* bright. It doesn't light its surroundings in a rasteriser. Make it believable by adding a matching light (point/rect/line), a matching lightformer in the env (for reflections), and optionally selective bloom on *that* source only.
- **Perceived:** a glowing object that actually illuminates its world.
- **Use:** slots, screens, lamps, light lines (Flagship slot + ceiling line).
- **Avoid:** emissive + bloom with no light falling on the neighbours (A2).
- **Fallback:** a baked gradient on the receivers.
- **Cheap-look failure:** a glowing object next to unlit surfaces, so it looks like a sticker.
- **ALFA rule:** every visible emitter needs a visible effect on at least one neighbouring surface.
- **Src:** S1 `examples/webgpu_postprocessing_bloom_emissive.html`, `webgl_postprocessing_unreal_bloom_selective.html`. ALFA `src/flagship/shading.ts` (line light + slot mirror).

### LT10 · Caustic approximations `[EXTERNAL]` EXPERIMENTAL · MED–HIGH · mobile HIGH
- **Does:** (a) a projected or animated caustic texture through a spotlight / shadow-colour path (`webgpu_caustics` puts a caustic texture into a coloured shadow through the transmissive object). (b) drei `Caustics`: a multi-pass normal-based refraction projection onto a plane. (c) Path-traced / offline bake (12-reference).
- **Perceived:** light focused by glass or water, a strong realism cue around glass objects.
- **Use:** a hero glass object on a light surface, static or slow.
- **Avoid:** mobile. Animated caustics without moving liquid.
- **Fallback:** a baked caustic texture on the ground.
- **Cheap-look failure:** a generic tiling pool caustic under a non-water object.
- **ALFA rule:** caustic shape must come from *this* object's geometry. Bake it if needed.
- **Src:** S1 `examples/webgpu_caustics.html`, `webgpu_volume_caustics.html`. S2 `src/core/Caustics.tsx`. S6 (reference).

### LT11 · Baked vs dynamic decision `[EXTERNAL]` + `[ALFA-PROVEN]`
- Bake (env, shadows, AO, lightmaps, caustics) whatever does not change during the experience. ALFA's choreography is a pure function of progress (AL1), so many "dynamic" lights can be precomputed **per keyframe** and interpolated.
- Keep dynamic only what the story animates (sun lowering in Exp02, exposure adaptation in Flagship).
- **ALFA rule:** list what changes over progress. Everything else is baked.
