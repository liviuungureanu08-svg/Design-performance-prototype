# ALFA Technical Visual Intelligence Library

**What this answers:** *HOW can we technically achieve a visual idea?*
**What it does not answer:** *WHAT should look beautiful?* That's art direction: [ALFA Visual Intelligence](../alfa-visual-intelligence/README.md)
(separate, decides WHAT + WHY). A technique being listed here does not make it premium, and an example existing upstream doesn't mean it should be used.

**Entry condition:** start here only with an approved visual direction (Visual Intelligence → *Bridge*). Never pick a technique first and
justify it afterwards. Engineering PASS here never overrides an art-direction FAIL or the Human WOW Gate.

Researched once (2026-10-01) from 8 core + 3 additional trusted sources, read in their source code, plus verified lessons from ALFA's
own experiments. **Don't read the whole library.** Use the router below and open 1–2 small files.

## Router: read only what the problem needs

| You need… | Read |
|---|---|
| To choose techniques for a creative spec | `SELECTION_MATRIX.md` (first, always), then the IDs it names |
| To find a technique ID / see all capabilities | `CAPABILITY_MAP.md` (index, ~1 page) |
| Realistic glass | `RECIPES.md` → R-GLASS, then `techniques/01-materials.md` M1–M3 |
| Gems / crystal | `RECIPES.md` → R-GEM, `techniques/01-materials.md` M4 |
| Metal / stone / paper / liquid | `RECIPES.md` → R-METAL / R-STONE / R-PAPER / R-WATER |
| Lighting, shadows, env maps, tone mapping | `techniques/02-lighting.md` |
| Reflections, Fresnel, refraction optics, dispersion | `techniques/03-optics.md` |
| Semantic transformation / morph | `RECIPES.md` → R-MORPH, `techniques/08-transitions.md` T1, `techniques/04-geometry.md` |
| Scene-to-scene transition | `techniques/08-transitions.md` (+ `05-image-surface.md` I-S1/I-S2) |
| Thinking about particles | `techniques/06-particles.md` (read the warning first) |
| Camera, scroll mapping, damping, portrait | `techniques/07-camera.md` |
| Whether a post effect is justified | `techniques/09-post.md` (one table) |
| Mobile, tiers, fallback, reduced motion, budgets | `PERFORMANCE.md` |
| Pointer / raycasting / BVH / spatial navigation | `techniques/11-interaction.md` |
| Path tracing, reference renders, material validation | `techniques/12-reference.md` |
| "Is this good enough?" | `QUALITY_LADDERS.md` (one table) |
| Reviewing a build for technical mistakes | `ANTI_PATTERNS.md` (one table) |
| What ALFA has already proven / failed | `ALFA_PROVEN_LESSONS.md` |
| License or provenance before reusing anything | `SOURCE_REGISTRY.md` (license table at top) |

## Conventions
- **Labels:** `[EXTERNAL]` (research only, not proven in ALFA) · `[ALFA-PROVEN]` (verified in this repo, *software GL only*) ·
  `[EXPERIMENTAL]` · `[REFERENCE-ONLY]` (not a live production technique).
- **Maturity:** PRODUCTION / EXPERIMENTAL / REFERENCE-ONLY. **Cost:** LOW / MED / HIGH / EXTREME.
- **ID prefixes:** M materials · LT lighting · O optics · G geometry · I-S image/surface · PT particles · C camera · T transitions ·
  P post · I interaction · RF reference · R-* recipes · A anti-patterns · AL ALFA lessons · S sources.
  "R1 / R2" in text means ALFA Round 1 / Round 2.
- **Source citations** `S# path`: repo-relative upstream paths, checked against the commits in `SOURCE_REGISTRY.md`. When implementing,
  re-check against the pinned dependency version (three.js r186 in this repo). The WebGPU/TSL APIs move fastest.

## Dependency discipline
- Researching a source does **not** authorise adding it. This library added **no dependencies**.
- Each future implementation task decides dependencies individually: is a small custom version (often < 100 lines, e.g. contact shadows or a
  baked lightformer env) better than importing a helper library?
- **LYGIA** (Prosperity license) and **The Book of Shaders** (all rights reserved) are knowledge sources only for commercial work.

## Maintenance
- Add a technique only with a source, a label and an ALFA rule. Keep entries short. Prefer a link to the upstream path over copied code.
- When an ALFA experiment proves or disproves something, update `ALFA_PROVEN_LESSONS.md` and relabel the technique (`[EXTERNAL]` → `[ALFA-PROVEN]`).
- The first real-GPU / phone measurement should update `PERFORMANCE.md` budgets and AL5/AL19/AL21.
