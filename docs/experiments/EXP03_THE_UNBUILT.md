# Experiment 03 — THE UNBUILT · Closure & Harvest

**Status: PROVEN · CLOSED · HARVESTED** (2026-10-02). Human WOW: **NO**. Experience Library: **CANDIDATE**.
ALFA Core: **no automatic promotion**. Final implementation: commit `10a0145` (unchanged in the closure commit, which carries
the local tag `exp03-final`; tag push refused by the remote, as for earlier tags).

This file is the authoritative closure record for Experiment 03. Implementation details stay in the repository README
(section *Experiment 03*); the canonical visual reasoning stays in the frozen Master
(`docs/alfa-visual-intelligence/ALFA_VISUAL_INTELLIGENCE_v1.0.md`), which this record does **not** modify.

## 1. What it was

- **Brand / brief:** Gabriel Solutions. **Thesis:** "Imagination becomes structure."
- **Core transformation:** A → reinterpretation of A → B. **ALFA principle demonstrated:** ONE WORLD / TWO INTERPRETATIONS.
- **Hypothesis tested:** a premium, deterministic, scroll-driven transformation in which a luminous line (THE SPINE) is revealed
  to be structure, so that Scene B (the built object in daylight) explains Scene A (the "unbuilt" object of light), can produce
  retrospectively coherent surprise: *"Wait… that was there from the beginning."*
- **What was built:** one authored folding map (*THE FOLD*: a thick band folded three times, split by a 30 mm slit, THE SPINE)
  feeding both endpoints, and a Motion Proof in which a vertex-shader build field narrows Scene B's own plates per rigid
  isoline. The sequence is: the Spine's lips part → light boundaries leave the Spine → matter grows to them (width, then
  thickness), emitting at its front and cooling → light handoff from emission to received daylight through the slit.
  State = f(scroll progress). Code: `src/exp03/` (`design.ts`, `fold.ts`, `scene.ts`, `ether.ts`, `motion.ts`,
  `motion-page.ts`, `diag.ts`).

## 2. Final Human Motion Review (authoritative)

| Gate | Verdict |
|---|---|
| Technical Motion | PASS |
| Real-device mobile 3D rendering | PASS — verified by the human reviewer on a physical phone (Brave), hosted build `10a0145` |
| Mobile visibility / readability | PASS |
| Deterministic transformation concept | PASS |
| A → B continuity / ancestry | PASS |
| Camera restraint | PASS |
| Lighting handoff | PASS, with a minor perceptual reservation |
| Scene B as explanatory endpoint | PASS |
| Premium Motion | PASS |
| Signature Transformation — conceptual | PASS |
| Signature Transformation — perceptual | PARTIAL |
| **Human WOW** | **NO** |
| Concept | PROVEN |
| Experiment | CLOSED |
| Experience Library | CANDIDATE — not an Engineered Experience, not a reusable product/template yet |

**Human WOW = NO is not experiment failure.** The experiment proved useful mechanisms and exposed a perceptual ceiling.

### Primary human finding (verbatim meaning, preserved)

> Structural transformation can preserve ancestry and produce a premium coherent experience, but technical continuity alone
> does not create WOW. The perceptual revelation must make the final structure feel retrospectively inevitable, not merely
> progressively constructed.

### Perceptual findings (human review)

1. It reads as one object/world being reinterpreted, not Scene A disappearing and Scene B replacing it.
2. THE FOLD keeps a recognizable identity through the transformation.
3. THE SPINE works as a perceptual anchor across states.
4. It avoids the major blacklist failures: no crossfade, no arbitrary particle spectacle, no unnecessary orbit, no
   wobble/jelly/liquid morph, no causeless explosion, no unrelated second-world reveal.
5. The signature sequence LIGHT → EDGE → THICKNESS → SURFACE → STRUCTURE/MATERIAL works **conceptually**.
6. The intended reaction *"Wait… that was there from the beginning"* was **not achieved strongly enough**; the reaction was
   closer to *"I understand — the form is being constructed."*
7. The primary weakness is in the middle/signature transformation: some luminous boundaries temporarily read as a glowing
   outline / wireframe preceding geometry, instead of a previously misunderstood structural edge revealing what was implicitly
   present all along. (This matches the worst region already logged before review: ≈44–48 %, README *Worst remaining region*.)
8. It does not collapse into generic sci-fi spectacle, but approaches that visual language enough to weaken the revelation.
9. The camera stays subordinate to the transformation.
10. Lighting logic stays conceptually strong: A = possibility appears to emit light; B = physical reality receives light.
11. Scene B explains Scene A instead of behaving like an unrelated endpoint.

## 3. ALFA knowledge harvest

Separation: **A** observation · **B** interpretation · **C** candidate principle/lesson · **D** confidence · **E** promotion status.
Governance (unchanged, not bypassed): external/experimental evidence → insight → candidate principle → experimental support →
human review → versioned promotion → ALFA Core. Nothing below is promoted.

| # | A. Observation | B. Interpretation | C. Candidate principle / lesson | D. Confidence | E. Status |
|---|---|---|---|---|---|
| H1 | Ancestry held (A↔B PASS, Spine anchor PASS) yet the reaction was "it is being constructed", not "it was there all along"; Human WOW NO. | Continuity shows *process*; revelation requires the viewer to **re-read A's evidence** as having been the answer. A step-by-step build answers "how is it made?", not "what was I looking at?". | **Progressive construction ≠ retrospective revelation.** Technical continuity alone does not create WOW; the reveal must make the final structure feel retrospectively inevitable, not merely progressively constructed. | Medium for the failure mode (directly observed, matches the logged worst frames); low for any general remedy (one experiment, one reviewer). | **CANDIDATE** (evidence for Master §10 *Surprise + Inevitability* and a possible future Failure Modes entry; Master unchanged) |
| H2 | Luminous boundaries travelling ahead of matter read as glowing outline / wireframe at the signature moment. | Light that *precedes* geometry along its future outline is read as a construction preview (sci-fi drafting language), not as a structure that was always there. | Hypothesis only: light meant to be revealed as structure should already occupy the structure's place and change *meaning*, rather than travel ahead to draw it. Untested. | Low (single observation, remedy not tested). | **HOLD** |
| H3 | One authored source (the folding map) drove both endpoints and every intermediate state; identity and ancestry passed. | Confirms that one shared source makes a transformation causal rather than a swap. | Already covered by Master §11–§13 and technical AL10. | Medium (consistent with Experiment 02 and Flagship 01). | Supporting evidence for existing principles — **no change** |
| H4 | Emission → received daylight, light by light (no image crossfade), PASS with a minor reservation. | The *role* of light (emits vs receives) can carry the narrative across states. | Lighting meaning can migrate from emission to physical reception as part of the transformation. | Low–medium (one experiment, reservation noted). | **HOLD** |
| H5 | A small eased offset of the same ~60 mm camera stayed subordinate; camera restraint PASS. | Supports Master §18: the camera revealed, it did not perform. | Supports existing principle. | Medium (consistent with Flagship 01 lessons). | Supporting evidence — **no change** |
| H6 | Scene B explained Scene A (PASS). | The endpoint pair satisfied the "retrospectively coherent" half; the *transition* is where inevitability was lost. | Endpoint coherence is necessary but not sufficient for revelation. | Medium. | **CANDIDATE** (bundled with H1) |
| T1 | Physical phone (Android Chrome) showed UI but a black scene; reproduced by withholding `OES_texture_float_linear`; NEAREST sampling of the accumulation targets fixed it; human verified on a physical phone (Brave). | Desktop/SwiftShader success hides mobile GPU format limits. | Never sample float32 render targets with LINEAR filtering unless `OES_texture_float_linear` is present; 1:1 full-screen passes should use NEAREST. | High (reproduced, fixed, device-verified). | Added to technical lessons log as `[ALFA-PROVEN]` AL23 (technical library, not ALFA Core) |
| T2 | Narrowing B's plates per rigid isoline of the folding map gave exact intermediate geometry (no scale-from-zero, no pops); deterministic, reversible. | A developable/rigid parametrisation turns "growth" into exact geometry. | Build-field over a rigid parametrisation for structural growth. | Medium (software GL; one experiment). | Added to technical lessons log as AL24 |

## 4. Experience Library candidate — SPATIAL / STRUCTURAL REINTERPRETATION

**Status: CANDIDATE.** Not an Engineered Experience, not a template, not productized. (No Experience Library area exists in this
repository yet; this card is the candidate record.)

**Mechanism (reusable):** a visible or suggested property of the initial state is progressively revealed to have structural
meaning; the final state explains the initial state.

**Reusable relationships (not appearance):**
- a perceptual anchor persists across states;
- ancestry persists (what in A becomes what in B);
- the initial ambiguity contains truthful evidence of the final structure;
- the transformation reveals structural meaning rather than adding new content;
- the final state retrospectively explains the initial state;
- the camera supports the event, it does not create it;
- lighting meaning can migrate from emission to physical reception.

**Not part of the mechanism (this experiment's art direction only):** dark object, blue light line, white/daylit room,
satin ceramic, the folded band, the ~60 mm framing, the specific LIGHT → EDGE → THICKNESS → SURFACE staging.

**Known failure mode:** **PROGRESSIVE CONSTRUCTION ≠ RETROSPECTIVE REVELATION.** If the viewer simply watches geometry being
built, ancestry can stay intact while the revelation (and WOW) still fails. Watch especially for light that runs ahead of
geometry to trace its outline: it reads as a wireframe/construction preview.

**Technical carry-overs:** state = f(progress) with converge-at-rest accumulation; build field over a rigid parametrisation;
light-by-light handoff with the receiving light arriving before the emitting lights leave; mobile float-format rule (AL23).

## 5. Evidence (stored in this repository)

| Evidence | Location |
|---|---|
| Scene A, Scene B, A/B, silhouette, portrait (static endpoints, 128 passes) | `artifact/exp03/` (`a-unbuilt-1920.jpg`, `b-built-1920.jpg`, `ab-side-by-side.jpg`, `silhouette.jpg`, `portrait-390x844.jpg`) |
| Motion freeze frames 0–100 % and contact sheet | `artifact/exp03/motion/` (`p000…p100.jpg`, `contact-sheet.jpg`) |
| Portrait/mobile review frames (software GL) | `artifact/exp03/motion/phone-0.jpg`, `phone-053.jpg`, `phone-1.jpg` |
| Robustness: wheel slow/fast, reverse, rapid direction changes, pause, same-progress determinism (identical hash), reload, resize, portrait | `scripts/robust03.mjs`; results in README *Verification* |
| Worst-frame log (found, changed, remaining) | README *Worst frames found and changed* / *Worst remaining region* |
| Hosted build reviewed on the phone | `artifact/exp03-preview/` (commit `10a0145`), URL in README |
| Mobile fix diagnosis (reproduction, pixel regression ≤1/255 on 0.01 % of pixels vs. the previous build) | commit `10a0145` message; `src/exp03/diag.ts` (`?diag`) |
| Real-device Human Motion Review (PASS rendering on Brave; Human WOW NO) | **Recorded here from the human verdict.** The physical-phone recordings were reviewed in the session, **not stored in the repository**. |

Notes: `p000…p100.jpg` were rendered before the mobile fix (`10a0145`); that fix changes desktop output by at most 1/255 on
0.01 % of pixels. All automated verification ran in software GL (SwiftShader); no real-GPU frame rate was measured.

## 6. Why development stops here

THE UNBUILT is **not** stopped because it failed. It is stopped because it has already produced the information it was meant
to produce. Further polishing would risk brute-force optimisation of one concept instead of improving ALFA's ability to generate
and evaluate *different* concepts. The remaining weaknesses (≈44–48 % outline read, faint boundary curl ≈50–53 %, slightly
flat peak emission, the calm 60–72 % stretch, the lighting reservation) are harvested as evidence and do **not** trigger another
refinement loop.

## 7. What must NOT be inferred from this single experiment

- That structural transformation cannot produce WOW (one concept, one execution, one reviewer).
- That dark object + blue line + daylit room, or LIGHT → EDGE → THICKNESS → SURFACE, is an ALFA style or a reusable template.
- That H1/H2/H4 are ALFA law: they are candidates/holds and need support from other, different experiments.
- That mobile performance is known: only rendering and readability were verified on one physical phone; no frame rate was measured.
- That THE UNBUILT is a control or baseline for Experiment 01: it is pre-Foundation evidence/reference with no matched control.

## 8. Next gate (recorded, not started)

1. Experiment 03 CLOSED + evidence harvested. *(this record)*
2. Lock the Experiment 01 protocol **before** observing the outcome of More Than Pixels.
3. Create the compact operational ALFA Generative Intelligence package that the locked protocol requires.
4. Run the prospective CONTROL vs ALFA GENERATIVE INTELLIGENCE comparison under matched conditions: the same real Gabriel
   Solutions project/brief, the same model/capability class, comparable budget, criteria locked before observing results.
5. More Than Pixels may take part in that experimental phase according to the locked protocol.
6. Evaluate the evidence.
7. Only then consider promotion/changes to ALFA methodology.

THE UNBUILT is pre-Foundation evidence/reference, **not** the causal control for Experiment 01.
