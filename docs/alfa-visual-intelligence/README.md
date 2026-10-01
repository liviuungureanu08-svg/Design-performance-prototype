# ALFA Visual Intelligence — Router

**What this answers:** *WHAT should exist, and WHY does it belong to this brand?*
**What it does not answer:** *HOW to build it.* That is [ALFA Technical Visual Intelligence](../alfa-visual-tech/README.md).

| File | Role | Authority |
|---|---|---|
| [`ALFA_VISUAL_INTELLIGENCE_v1.0.md`](ALFA_VISUAL_INTELLIGENCE_v1.0.md) | Canonical Master (~570 lines) | **Authoritative.** FROZEN BASELINE v1.0 |
| [`QUICK_REFERENCE.md`](QUICK_REFERENCE.md) | Compact operational reference (~140 lines) | Derived. If it differs from the Master, the Master wins |

**Don't load the whole Master or the whole technical library by default.** Pick the route below.

## Which file to read

| Situation | Read |
|---|---|
| Non-visual coding task (build, tooling, bug, refactor with no visual change) | Neither library |
| Ordinary visual implementation detail **inside an already-approved direction** (tune a material, timing, crop, light, a fallback) | `QUICK_REFERENCE.md` → then [technical router](../alfa-visual-tech/README.md) → [`SELECTION_MATRIX.md`](../alfa-visual-tech/SELECTION_MATRIX.md) → only the 1–2 technique/recipe files it names |
| One specific technique (material, lighting, transition, camera, post…) for an approved direction | [Technical router](../alfa-visual-tech/README.md) row for that need → that one file. Skim `QUICK_REFERENCE.md` first if it would change what the viewer perceives |
| New visual direction, new experiment (e.g. Experiment 03), new or major transformation, art-direction conflict | Full Master. Technical library only after the direction is approved (see Bridge) |
| "Builds and passes tests but looks mediocre / generic" | Full Master: §22 Anti-Generic, §23 Premium vs Cheap, §25 Failure Modes, §26 Worst-Frame, §30 Gates. Fix the direction before the technique |
| Reviewing a transformation or a finished experience | Master §26, §30, §36–37. Technical [`ANTI_PATTERNS.md`](../alfa-visual-tech/ANTI_PATTERNS.md) only for implementation defects |
| Proposing a change to Visual Intelligence itself | Full Master + Change Control below |

## Bridge: Visual → Technical

```
Brand / Product Brief
        ↓
VISUAL INTELLIGENCE (this folder)            decides WHAT + WHY
  Brand Essence · Desired Emotion · Visual Thesis · WOW Governor ·
  Static Art Direction A/B · Human Static Gate · Signature Moment ·
  Perceptual Anchor · Ancestry Map / transformation logic ·
  Conflict Resolver · Restraint Gate · Anti-Generic tests
        ↓
Approved Visual Direction  (hand-off artefact, written down)
        ↓
TECHNICAL VISUAL INTELLIGENCE (../alfa-visual-tech)   decides HOW
  rendering · materials · lighting · geometry · optics · transition
  mechanics · camera · post · performance · fallback · interaction
        ↓
Implementation → Motion Proof → Engineering Gate → Human WOW Gate
```

**Entry condition for the technical library:** the Master's Operating Pipeline (§3) places *Technical Intelligence Selection* after the
Anti-Generic Tests, and §36 (Definition of Done — Direction) lists what must exist first. Minimum hand-off to carry into the technical
side: Visual Thesis, WOW level, approved Scene A/B, Signature Moment, Perceptual Anchor, Ancestry Map (where relevant), and the
perception the technique must deliver (e.g. "thickness", "contact", "B derives from A"). That last item is what
[`SELECTION_MATRIX.md`](../alfa-visual-tech/SELECTION_MATRIX.md) starts from.

## Rules that prevent the usual inversions

- **Technique first is not allowed.** Found a great Three.js technique? It may go into the technical library as a capability (with source and
  label). It may not become a project's idea. Brand justification invented after choosing a technique = FAIL (Master §38, §22 Technique
  Substitution).
- **Previous experiments are lessons and proofs, not templates.** Round 1, Round 2, Flagship 01 and Experiment 02 are recorded as lessons
  (Master §33–34 for visual lessons; technical [`ALFA_PROVEN_LESSONS.md`](../alfa-visual-tech/ALFA_PROVEN_LESSONS.md) for what works
  technically). Do not reuse their look, palette, grammar or code as a starting aesthetic (Master §1, §22 Alfa-Style Detection).
- **Engineering PASS + Art Direction FAIL = FAIL.** Typecheck, build, robustness scripts and frame rate never override an art-direction
  failure or the Human WOW Gate. AI does not self-certify WOW (Master §30).
- **Static First.** Weak endpoints are not handed to the technical side to be rescued by motion or post (Master §16).

## Change control

`ALFA_VISUAL_INTELLIGENCE_v1.0` is a **frozen baseline**. Do not edit it because one experiment fails aesthetically. It changes only when a
real project exposes a repeatable reasoning defect, a contradiction, an ambiguity, a missing class of visual problem, or evidence that a rule is
harmful/incomplete (Master §40). Gaps trigger targeted research, not a broad research restart. Any change requires Human Review and a
matching update to `QUICK_REFERENCE.md`.

The technical library has its own maintenance rules and licensing authority
([`SOURCE_REGISTRY.md`](../alfa-visual-tech/SOURCE_REGISTRY.md)); this folder does not override them.
