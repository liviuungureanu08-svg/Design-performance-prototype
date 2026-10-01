# Quality Ladders

Merely *using* a technique doesn't meet ALFA quality. Each rung adds what the viewer can perceive.
**CHEAP** = what to avoid · **GOOD** = acceptable · **PREMIUM** = target · **REFERENCE** = the ground truth used to judge (rarely shipped live).

| Capability | CHEAP | GOOD | PREMIUM | REFERENCE |
|---|---|---|---|---|
| **Glass** | transparent mesh + white outline + bloom | physical transmission + env response | thickness + attenuation + controlled refraction/roughness + authored reflection lines + a designed background to refract + contact shadow | path-traced glass in the same scene (S6) |
| **Metal** | grey/chrome with stock HDRI | PBR metal + matching env | roughness variation + anisotropy direction + authored strips/softboxes + clean AA on highlights | path-traced, or Khronos `CompareMetallic`/`AnisotropyBarnLamp` check |
| **Paper** | zero-thickness plane + paper texture | extruded sheets, rough diffuse, shadows | real thickness with lit cut edges, grazing key light, inter-layer contact shadows, contact-preserving choreography, backlight translucency where motivated | photographed paper reference / path-traced relief |
| **Stone / mass** | uniform noise bump, hard CG edges | bevels + roughness map + studio env | grazing-revealed micro-surface, honed/polished zones, seams, authored env, floor reflection, controlled exposure | path-traced studio render |
| **Reflection** | perfect mirror everywhere, or ripples | env reflection with Fresnel | planar reflection blurred by roughness and distance + Fresnel + something worth reflecting | path-traced rough reflection |
| **Shadow / grounding** | none, or one blurred blob | shadow map (tight frustum) | contact core + soft penumbra (accumulated/baked), frozen when static | path-traced soft shadows / baked lightmap |
| **Lighting** | default ambient + one directional + bloom | PMREM env + key light | authored env (lightformers) + one motivated key + emitters that light their neighbours + chosen tone mapper | path-traced lighting of the same scene |
| **Transition** | crossfade / noise dissolve / particle cloud | mask shaped by scene content | semantic continuity: one source → two readings, ancestry per element, light change after geometry, seam-checked boundaries | — (judged by humans, not renderers) |
| **Geometry change** | linear vertex lerp through collapsed shapes | morph targets / analytic deformation with correct normals | designed intermediate shapes, rigidity-respecting deformation, contact and mass in motion | — |
| **Camera** | orbit spin / wide-FOV fly-through | damped scroll-mapped path | physical lens language (fixed focal, lens shift), motivated single moves with holds, per-aspect compositions, reversible | — |
| **Post** | bloom + vignette + CA + grain as a style | tone mapping + AA | raw frame already good. Subtle merged post for lens realism only, HDR pipeline | — |
| **Particles** | unlit dots/sprites as transition | instanced shaded fragments with identity | (prefer a non-particle solution) thick fragments with origin, anticipation, gravity/inertia, only when the subject is granular | — |
| **Mobile** | desktop scene at lower FPS, or a broken fallback | capped DPR + adaptive scale | same idea re-composed for portrait, fidelity reduced per PERFORMANCE tiers, measured on a real phone | — |
| **Fallback** | error message / blank canvas | static screenshot | designed poster from the same concept with all copy (AL6), ideally a reference-quality still | path-traced endpoint still |
