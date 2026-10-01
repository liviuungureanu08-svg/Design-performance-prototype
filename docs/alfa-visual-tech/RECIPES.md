# Technique Recipes

How capabilities combine. Technique IDs → `CAPABILITY_MAP.md`. These describe **technical stacks for a visual target**. They are not art direction and not mandatory.
Performance range: Cinematic desktop → Mobile reduced (`PERFORMANCE.md`).

## Index
R-GLASS optical glass · R-REFLECT reflective surface · R-PAPER physical paper/layers · R-STONE mineral mass · R-WATER still water ·
R-GEM faceted crystal · R-METAL machined metal · R-MORPH semantic morph · R-ENTRY spatial entry · R-PORTAL optical portal · R-STILL reference endpoint

---

### R-GLASS · High-fidelity optical glass
- **Visual target:** a solid glass object with mass: refracted, slightly blurred background, darker thick regions, bright Fresnel edges, reflection lines defining its shape.
- **Stack:** real geometry with thickness (bevelled edges, never a plane) + authored env with 1–3 lightformers (LT2) + M1 transmission (`thickness`, `ior` 1.45–1.55, low but non-zero roughness) + M2 attenuation + designed background behind the glass + O2 Fresnel (free) + O4 dispersion only on thick high-IOR pieces + contact shadow (LT5) + restrained post (P7 AA; bloom only if a real emitter is visible).
- **Why it works:** glass is perceived through what it does to light: bending (refraction), absorbing (attenuation), reflecting edges (Fresnel + env shapes). Every cue is physically consistent, and none is painted on.
- **Cheap version to avoid:** transparent mesh + white outline + bloom (A3). Or thickness 0 in front of a black void.
- **Performance range:** desktop MED (one shared transmission pass) → mobile: `transmissionResolutionScale` 0.5 → thin-wall → opaque dark glass with env reflection.
- **Fallback:** a path-traced still (R-STILL).
- **Refs:** S1 `webgl_materials_physical_transmission`, transmission chunk. S2 MeshTransmissionMaterial (if glass must see glass). S11 `TransmissionTest`, `DragonAttenuation`. ALFA Flagship glass fins ("read mostly through refraction and edge reflection; dim", a lesson: give glass bright structured things to reflect).

### R-REFLECT · Premium reflective surface (floor, black glass, polished stone)
- **Visual target:** a surface that reflects the scene with roughness-dependent blur and fades with distance.
- **Stack:** O1 planar reflector at ½–¾ resolution + blur mixed by roughness/depth (drei MeshReflectorMaterial pattern) + a material roughness map (micro-variation) + Fresnel (stronger at grazing) + env for off-plane reflections + lighting that creates something worth reflecting (LT9 emitters, LT2 strips).
- **Why it works:** real polished surfaces never mirror perfectly. Blur that grows with distance from the contact point is the strongest realism cue.
- **Cheap version to avoid:** a perfect full-res mirror with uniform sharpness, or ripples that alias (AL11).
- **Performance range:** +1 scene render (desktop at ¾ res, mobile ½ res or env-only).
- **Fallback:** env reflection + dark gradient + contact shadow.
- **Refs:** S1 `objects/Reflector.js`. S2 `MeshReflectorMaterial.tsx`. ALFA Flagship floor, Exp02 lake (AL22).

### R-PAPER · Physical paper / layered sheets
- **Visual target:** sheets with weight, cut edges, layered depth and soft inter-layer shadows.
- **Stack:** extruded geometry with real thickness (G4/G9) + rough diffuse dielectric (M8) + subtle fibre normal + slightly brighter or warmer cut edges + side/grazing key light (AL15) + shadow map tightly fitted, or contact shadows per layer (LT4/LT5) + G1 choreography with contact (each sheet lifts the ones above) + optional thin translucency against backlight (M9).
- **Why it works:** paper is identified by edges and how light rakes across layers, not by texture.
- **Cheap version to avoid:** zero-thickness planes floating with no shadows, or a uniform "paper texture" overlay.
- **Performance range:** LOW–MED (shadow map dominates) → mobile 2048 or baked shadows.
- **Fallback:** a printed poster (AL6).
- **Refs:** ALFA Exp02 (`src/exp02/`). Open issues: tops too smooth, paper tooth only at grazing.

### R-STONE · Mineral / monolithic mass
- **Visual target:** a heavy honed or polished stone mass with panel seams and subtle variation.
- **Stack:** bevelled geometry (no razor edges) + M7 procedural or triplanar micro-roughness/bump revealed by grazing light + authored studio env (LT2) for broad soft form + analytic occlusion or AO (LT7/AL9) + planar floor reflection (R-REFLECT) + exposure discipline (LT8).
- **Why it works:** mass reads through soft broad gradients, crisp but slightly rounded edges, and micro-variation visible only where light grazes.
- **Cheap version to avoid:** uniform noise bump at all angles (looks like a procedural demo), hard CG edges.
- **Refs:** ALFA Flagship 01 (`src/flagship/shading.ts`, `env.ts`). S4 `sample/triplanar`, `sample/untile` (reference).

### R-WATER · Still water / liquid surface
- **Stack:** O1 reflector (reduced res) + Fresnel + depth-dependent absorption colour + stillness with a faint brightness swell (ALFA), *or* motion from a real cause only + M10 for poured or volumetric liquids.
- **Cheap version to avoid:** sine ripples distorting the reflection everywhere.
- **Refs:** ALFA Exp02 lake. S1 `Water2.js`, `webgpu_backdrop_water`.

### R-GEM · Faceted crystal / gemstone
- **Stack:** faceted closed mesh + M4 BVH multi-bounce refraction (3–5 bounces, high IOR) + per-channel IOR dispersion + an env authored with *small bright sources* (fire comes from them) + a dark background.
- **Cheap version to avoid:** M1 transmission on a gem (no internal facets), generic HDRI.
- **Performance range:** HIGH per pixel, so keep it small on screen. Mobile: reduce bounces to 1–2 or use a baked env/matcap.
- **Refs:** S2 `MeshRefractionMaterial.tsx`. S5 `example/diamond.js`.

### R-METAL · Machined / brushed metal
- **Stack:** metalness 1 + roughness map (machining marks, polish zones) + anisotropy along the machining direction (M5) + strong structured env (LT2) + clearcoat only if lacquered (M6) + AA (thin highlights alias, P7).
- **Cheap version to avoid:** a uniform chrome reflecting a stock HDRI.
- **Refs:** S1 anisotropy examples. S11 `AnisotropyBarnLamp`.

### R-MORPH · Semantic morph (A becomes B, different topology)
- **Stack:** ancestry table first (T1) → shared source (G4 field / SDF) → choose per element: morph targets (same topology, G2), SDF morph (topology change, G5), rigid part choreography (G1), material parameter interpolation (T5), separate hand-over plates (I-S7) → light change *after* geometry settles (AL14) → worst-frame contact sheets (AL17).
- **Cheap version to avoid:** crossfade, noise dissolve, particle cloud between A and B (AL12).
- **Refs:** ALFA Exp02, R2 T3.

### R-ENTRY · Spatial entry / scale reinterpretation
- **Stack:** one world authored once (T2) + rigid choreography (G1) + camera path with lens shift and holds (C4/C5) + exposure adaptation across the threshold (LT8) + interior lighting authored separately but motivated by exterior features (ALFA Flagship: seam reflection → interior line light).
- **Cheap version to avoid:** a fly-through into a different scene with a fade.
- **Refs:** ALFA Flagship 01.

### R-PORTAL · Optical portal between worlds
- **Stack:** both worlds rendered to RTs (I-S1, only while visible) + an aperture mask from a scene object (I-S2) + refraction or lensing on the rim (O5) + the portal expands past the frame or `blend`s to full-screen + per-layer dolly for depth.
- **Refs:** ALFA R2 T1 (`portal.ts`). S2 `MeshPortalMaterial.tsx`.

### R-STILL · High-end static endpoint / reference-quality hero
- **Stack:** the production glTF scene → three-gpu-pathtracer (WebGPU) → converge with `stableNoise` → OIDN denoise → export the still or sequence → ship as image/video, and use as the STATIC tier poster. Optionally show the live raster and fade in the traced result at a still endpoint (desktop WebGPU only).
- **Refs:** S6 (`renderVideo`, `denoise`, `materialOrb`). See `techniques/12-reference.md`.
