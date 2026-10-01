# 01 · Materials

Entry format: **ID · name** `[label]` maturity · cost · mobile risk. Then: does / perceived / use / avoid / options / fallback / cheap-look failure / **ALFA rule** / sources.
Source IDs → `../SOURCE_REGISTRY.md`. Ladders for glass, metal, paper and stone → `../QUALITY_LADDERS.md`.

Before you pick a material technique: in this repo the material read came from **light direction and geometry thickness** as often as from the shader (AL15).

---

### M1 · Physical transmission (MeshPhysicalMaterial) `[EXTERNAL]` PRODUCTION · MED–HIGH · mobile MED
- **Does:** three.js renders all *opaque* objects into a mip-mapped, MSAA-resolved half-float target once per camera, then transmissive surfaces sample it, offset along a refracted ray (`thickness`, `ior`). Roughness selects the mip (`lod = log2(size) * applyIorToRoughness`). `dispersion` takes 3 samples per IOR. DoubleSide transmissive meshes get an extra back-face pass.
- **Perceived:** what's behind the object is bent and blurred, so the object reads as a solid volume rather than a decal.
- **Use:** hero glass/crystal/liquid objects in front of a meaningful background.
- **Avoid:** transmissive objects layered over each other. Transmissive meshes **can't see other transmissive meshes** (only opaque objects are in the buffer; Khronos `TransmissionOrderTest` shows it). Also avoid it in front of empty or flat backgrounds, where there's nothing to refract.
- **Options:** `transmission`, `thickness` / `thicknessMap`, `ior`, `roughness`, `attenuationColor` / `attenuationDistance` (M2), `dispersion`, `specularIntensity`. Lower `renderer.transmissionResolutionScale` to save fill rate.
- **Cost:** one extra opaque-scene render plus a mip chain per frame per camera, paid once however many transmissive meshes there are.
- **Fallback:** `transmissionResolutionScale` 0.5 → thickness 0 (thin glass, still physically based) → opaque dark glass relying on Fresnel env reflection (O2).
- **Cheap-look failure:** `thickness` 0 with a flat env, so it looks like a transparent sheet. Uniform rough blur everywhere. Dispersion pushed until rainbows appear.
- **ALFA rule:** transmission needs something worth refracting and a defined thickness. Design the background *behind* the glass as part of the material.
- **Src:** S1 `src/renderers/WebGLRenderer.js` (~L2020–2135), `src/renderers/shaders/ShaderChunk/transmission_pars_fragment.glsl.js`, `examples/webgl_materials_physical_transmission.html`, `webgl_loader_gltf_transmission.html`, `webgl_loader_gltf_dispersion.html`. S11 `Models/TransmissionTest`, `TransmissionOrderTest`, `TransmissionRoughnessTest`.

### M2 · Volume absorption: thickness + attenuation `[EXTERNAL]` PRODUCTION · LOW (adds to M1) · mobile LOW
- **Does:** Beer–Lambert tint by distance travelled (`attenuationColor`, `attenuationDistance`). `thicknessMap` (baked object-space thickness) varies the path length.
- **Perceived:** thick parts are darker and more saturated, thin edges are clear, so you see mass and depth inside the object.
- **Use:** coloured glass, liquids, gemstones, resin, ice.
- **Avoid:** uniform-thickness flat panes, where it reads as plain tint.
- **Options:** bake the thickness map in a DCC tool or with a BVH ray march (S5). Use a constant thickness for primitives.
- **Fallback:** tint `color` plus a darker edge term.
- **Cheap-look failure:** a coloured transparent material with no thickness variation, which looks like cellophane.
- **ALFA rule:** coloured glass is absorption, not opacity. Never fake it with `opacity`.
- **Src:** S1 `src/materials/MeshPhysicalMaterial.js`. S11 `Models/DragonAttenuation`, `AttenuationTest`, `CompareVolume`.

### M3 · Per-object transmission buffer (drei MeshTransmissionMaterial pattern) `[EXTERNAL]` PRODUCTION · HIGH · mobile HIGH
- **Does:** each material renders the *whole scene* (itself hidden via a discard material) into its own FBO every frame. With `backside` it renders a second pass of back faces first. It adds multi-sample refraction (default 6 samples), chromatic aberration, anisotropic blur, and optional noise distortion.
- **Perceived:** transmissive objects can see other transparent objects, and thick back-face refraction reads as solid glass.
- **Use:** one hero glass object that must refract other transparent things.
- **Avoid:** several instances (cost multiplies per material), mobile, render-on-change pages where `temporalDistortion` forces continuous frames.
- **Options:** `resolution` / `backsideResolution` to cap FBO size. Share one `buffer` between materials. Set `transmissionSampler` to reuse three's buffer (cheap, but loses the "sees transparent objects" benefit).
- **Cost:** +1 or +2 full scene renders per material per frame.
- **Fallback:** M1 with `transmissionSampler: true`, then M1.
- **Cheap-look failure:** cranking `chromaticAberration` / `distortion` gives a funhouse look. `distortion` with no physical reason (AL11).
- **ALFA rule:** reproduce the *idea* (backface pass + capped-resolution buffer) only when M1's limitation is actually visible in the shot.
- **Src:** S2 `src/core/MeshTransmissionMaterial.tsx` (`useFrame` body ~L435).

### M4 · BVH multi-bounce refraction (gems, crystal) `[EXTERNAL]` PRODUCTION (narrow) · HIGH per pixel · mobile HIGH
- **Does:** the fragment shader traces the refracted ray *inside the mesh* against a BVH packed into textures, up to N bounces with total internal reflection, then samples an env map. Optional per-channel IOR (dispersion).
- **Perceived:** internal facets, fire and sparkle, the way a real gem behaves. Impossible with screen-space M1.
- **Use:** diamonds, cut crystal, faceted prisms, small closed meshes.
- **Avoid:** large or complex meshes, objects that must refract the *scene* (it samples the env map, not the scene), many instances.
- **Options:** drei `MeshRefractionMaterial` (`bounces` default 3, `ior` 2.4, `aberrationStrength`, `fresnel`, `correctMips`). Or write a custom shader with `MeshBVHUniformStruct` + `bvhIntersectFirstHit`.
- **Fallback:** M1 with high IOR + strong env, or a baked matcap/env lookup of the faceting.
- **Cheap-look failure:** a generic HDRI with no bright, structured light sources, so there's no fire. Too many bounces with no visible gain.
- **ALFA rule:** facet sparkle comes from the *environment's* small bright sources. Author them (LT2 Lightformers).
- **Src:** S2 `src/materials/MeshRefractionMaterial.tsx`. S5 `example/diamond.js`, `src/webgl/MeshBVHUniformStruct.js`.

### M5 · Metal: env-driven specular + anisotropy `[EXTERNAL]` PRODUCTION · LOW–MED · mobile LOW
- **Does:** `metalness` 1, base colour = specular tint, appearance almost entirely from the environment (PMREM) and roughness variation. `anisotropy` + `anisotropyRotation` / `anisotropyMap` stretch highlights for brushed metal.
- **Perceived:** what the metal reflects defines its shape. Brushed direction reads as a manufacturing process.
- **Use:** premium hardware, jewellery, architectural trims.
- **Avoid:** a flat or uniform environment. Metal with nothing to reflect looks grey plastic.
- **Options:** roughness maps (fingerprints, polish gradients), clearcoat (M6) for lacquered metal, authored env (LT2, AL8).
- **Fallback:** the same at lower env resolution. Metal survives every tier well.
- **Cheap-look failure:** uniform roughness 0.2 everywhere, "chrome ball" HDRI reflections that don't belong to the scene.
- **ALFA rule:** design the reflected world (strips, softboxes, horizon) before tuning the metal.
- **Src:** S1 `examples/webgl_materials_texture_anisotropy.html`, `webgl_loader_gltf_anisotropy.html`. S11 `Models/AnisotropyBarnLamp`, `CompareAnisotropy`, `CompareMetallic`.

### M6 · Layered surfaces: clearcoat, sheen, iridescence, specular `[EXTERNAL]` PRODUCTION · LOW–MED each · mobile LOW–MED
- **Does:** extra BRDF lobes on MeshPhysicalMaterial. `clearcoat` (+ its own roughness/normal map) = varnish over a base. `sheen` (+ colour, roughness) = velvet/fabric retro-reflection at grazing angles. `iridescence` (+ IOR, thickness range/map) = thin-film interference. `specularIntensity` / `specularColor` = dielectric F0 control.
- **Perceived:** depth in the finish (car paint, lacquer), the softness of cloth at silhouettes, soap-film or oil colour shifts.
- **Use:** only where the real-world material has that layer.
- **Avoid:** iridescence as decoration. Sheen on hard materials.
- **Fallback:** drop the lobe (the base material remains correct).
- **Cheap-look failure:** iridescence on everything ("holographic" cliché). Clearcoat at full strength on matte objects.
- **ALFA rule:** add a lobe only when you can name the physical layer it models.
- **Src:** S1 `src/materials/MeshPhysicalMaterial.js`, `examples/webgl_materials_physical_clearcoat.html`, `webgl_loader_gltf_sheen.html`, `webgl_loader_gltf_iridescence.html`. S11 `Models/SheenCloth`, `CompareSheen`, `CompareIridescence`, `CompareClearcoat`.

### M7 · Stone / mineral: procedural micro-surface `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · LOW–MED · mobile LOW
- **Does:** varies roughness and bump procedurally (noise/fbm or cellular) in object or world space. Triplanar projection avoids UV seams. Texture-untiling (Quilez technique) hides repetition on large surfaces.
- **Perceived:** honed vs polished zones, panel seams and grain catch grazing light, so the object reads as heavy and real.
- **Use:** monoliths, architectural masses, plinths.
- **Avoid:** high-frequency noise visible at normal viewing distance (it reads as dirt/noise, not stone).
- **Options:** Flagship 01 shading patch (procedural mineral roughness/bump/panel seams, AL9). LYGIA `sample/triplanar`, `sample/untile`, `generative/{fbm,worley,voronoi}` as reference (license!). Simplex noise from stegu/webgl-noise (MIT).
- **Fallback:** baked roughness/normal textures (KTX2).
- **Cheap-look failure:** uniform noise bump, so it looks like a "procedural texture demo".
- **ALFA rule:** micro-surface should be revealed by grazing light, not visible at all angles.
- **Src:** ALFA `src/flagship/shading.ts`. S4 `sample/triplanar.glsl`, `sample/untile.glsl`. S8 ch. 11–13 (noise/fBm, knowledge only).

### M8 · Paper / card `[ALFA-PROVEN]` (partial) PRODUCTION · LOW · mobile LOW
- **Does:** rough diffuse dielectric (roughness ≈ 0.9+, low specular), **real geometric thickness** (visible cut walls), fibre tooth via a low-amplitude normal/bump, slightly lighter or warmer cut edges, plus contact shadows between layers.
- **Perceived:** sheets with weight and edges, layered depth, crafted objects.
- **Use:** layered relief, editorial "physical print", folding/unfolding.
- **Avoid:** zero-thickness planes (the instant "card in space" look). Glossy paper unless it's coated stock.
- **Options:** extrude outlines (ALFA Exp02 leaves = extruded contour loops). Side/grazing key light (AL15). Shadow maps or contact shadows (LT5 in 02-lighting) between sheets.
- **Fallback:** a pre-rendered or printed poster (AL6).
- **Cheap-look failure:** thin planes, uniform flat shading. Tooth visible only at grazing light while the tops look plastic-smooth (an Exp02 open issue).
- **ALFA rule:** paper reads through edges and light direction first. Micro-texture comes second.
- **Src:** ALFA Exp02 README, `src/exp02/scene.ts`. (Translucency for thin paper → M9.)

### M9 · Thin translucency / subsurface approximation `[EXTERNAL]` EXPERIMENTAL · LOW–MED · mobile LOW
- **Does:** three.js r186 has **no diffuse-transmission/subsurface lobe** (no `KHR_materials_diffuse_transmission` support found in `src/`). The options are approximations: wrap lighting, a back-light term scaled by a thickness map, `transmission` with high roughness for frosted material, or baked translucency.
- **Perceived:** light glowing through thin paper, wax, leaves, skin.
- **Use:** backlit thin sheets, lampshades, petals.
- **Avoid:** promising real SSS. Note that `SSSNode` in `tsl/display` is **screen-space *shadows***, not subsurface.
- **Options:** custom `onBeforeCompile` or TSL term. `transmission` + `roughness` ≈ 1 for frosted. Khronos `DiffuseTransmission*` assets as a visual reference for the target.
- **Fallback:** emissive-mapped backlight shape.
- **Cheap-look failure:** a uniform emissive glow, so it looks like a light bulb instead of a lit material.
- **ALFA rule:** translucency is driven by a light *behind* the object. Without that light, don't add it.
- **Src:** S1 `src/materials/MeshPhysicalMaterial.js` (property list), `examples/jsm/tsl/display/SSSNode.js` (header). S11 `Models/DiffuseTransmissionTest`, `DiffuseTransmissionTeacup`.

### M10 · Liquid surfaces `[EXTERNAL]` + `[ALFA-PROVEN]` PRODUCTION · MED · mobile MED
- **Does:** M1/M2 with IOR ≈ 1.33 for volume, plus a surface normal from analytic waves or a normal map. For open water: planar reflection (O1) + Fresnel + depth-based colour. The WebGPU path can refract the already-rendered scene through `viewportSharedTexture` (the "backdrop" pattern).
- **Perceived:** a surface that mirrors at grazing angles and reveals depth when looking down.
- **Use:** still water, poured liquids, drops.
- **Avoid:** animated distortion without a cause. Exp02 replaced ripples with still water plus a faint swell (AL11).
- **Options:** three `objects/Water*`, `Reflector`, `Refractor`. WebGPU `webgpu_backdrop_water`. LYGIA `generative/gerstnerWave` (reference).
- **Fallback:** static env reflection + depth gradient.
- **Cheap-look failure:** a sine-wave distorted reflection everywhere, which aliases.
- **ALFA rule:** stillness first. Add motion only with a physical source (wind, contact, flow).
- **Src:** S1 `examples/jsm/objects/{Water.js,Water2.js,Reflector.js,Refractor.js}`, `examples/webgpu_backdrop_water.html`. ALFA Exp02 lake (`src/exp02/scene.ts` ~L240–260).
