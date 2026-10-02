# Visual Lab Surgical Audit — from one real use

Scope: what happened when `03_VISUAL_LAB_FROZEN_RESEARCH_FOUNDATION_v1.0.md` was used on one real brief, in one session, by one model.
Evidence base: `VISUAL_LAB_USAGE_TRACE.md` (T1–T14). **n = 1. No causal claim.** No control run (same brief without VL) was made, so "VL helped" means *"the trace shows a decision changed at the moment VL was consulted"*, not *"the result is better than without VL"*.
Nothing in the foundation was modified. Every intervention below is **HOLD**.

## 0. Headline
- VL was useful as **vocabulary for structuring a concept that already existed** (roles, shared cause, state-dependent criticality, causality chain, temporal-driver taxonomy).
- VL was **not** useful for generating or choosing concepts, nor for detecting or recovering from defects — the activities that consumed most of the run.
- The single biggest structural gap: VL is a schema with no instances. It could *name* failures after they were found, but could not *anticipate* them, because failure/recovery knowledge (G07) exists only as a category.

## A. Clearly useful
| Element | Trace | What it did |
|---|---|---|
| Ch8 temporal drivers (time / input / progress / state / autonomous) | T2 | turned "all prior work is scroll-scrubbed" into a search axis; the selected family differs mainly on that axis |
| Ch6 "role is contextual" + semantic-criticality ladder | T6 | gave a direct rule: piled cards atmospheric (overlap allowed), lane cards informative, "You" critical |
| Ch7 shared cause/source/state + per-class budgets | T5 | removed independently-animated counters/insight; one switch causes everything |
| Ch8 causality chain (ACTION → ACKNOWLEDGEMENT → … → SETTLE) | T8 | asking what the "system response" step should *say* produced "oldest first" — the only fully VL-originated perceptual decision |

## B. Useful but underspecified
| Element | Problem in this run |
|---|---|
| Ch4 semantic-state parameter | useful framing (T7, T10) but no guidance on driving several primitives from one semantic parameter (tint + bar + label) |
| Composition Object "attention structure" | needed; no form for writing it (T5) |
| Ch8 "reversibility" | one word; the real decision was *history is kept, behaviour is reversed* (T8) |
| Ch9 degradation path | covers motion degradation; did not cover a **layout change breaking the mechanism** (T11 defect a) |

## C. Redundant (with GI or VI, which were also active)
- Ch10 mutation operators ≈ GI Phase C de-correlation operators at concept level (T3).
- Ch12 vectorial prediction ≈ GI Phase D critique list + VI §30 gates (T4).
- Ch8/Ch9 reduced-motion meaning ≈ VI §30A, §29 (T9, T13).
- Ch1 forbidden-intent slot ≈ VI §30A (T1).
- H1–H12 restate VI principles (Intent before technique = VI §5/§38; Prediction ≠ Truth = VI §30).
When VL and VI overlap, VI won every time because it is shorter and operational.

## D. Too abstract to activate at decision time
- Ch2 Design Languages / style families: never consulted; no decision needed a style family.
- Ch11 retrieval/routing: describes routing but ships no routing table ("for problem X, open Y"). In practice routing was done by me, from memory of the document (T0).
- Ch13 provenance/learning and Ch14 architecture: no runtime role in a single design run.
- Generative Coverage Map: not actionable without a populated corpus.

## E. Ambiguous / contradictory
- **Static-first vs agency-borne value.** VI §16 asks whether each endpoint would be kept in a portfolio; VL Ch8 says stillness is part of motion design. For a concept whose value is in the transition under the visitor's hand (T12), neither says what replaces the static gate. Not a contradiction in text; a gap in which test applies.
- **Mutation layer.** Ch10 operators are written for mechanisms (L2) but were offered for concept search (L3/experience); no declared boundary with GI Phase C (T3).
- **Role vs criticality** live in different chapters (Ch7 vs Ch6) and never meet in one schema field (T6).

## F. Missing (needed in this run, absent in VL)
1. **Agency / actor** as a composition-level property (who causes change: viewer, visitor, environment, content, system). Central here; only implicit in Ch8.
2. **Capacity / overflow behaviour** of a mechanism (more items than room). Decisive for any stream/feed; caused the worst defect (T11a).
3. **State-indexed role/criticality** (`role_by_state`).
4. **Reversibility semantics** (what is reversed vs kept).
5. **Instances of failure + recovery** for common level-of-detail and layout transitions (double exposure on LOD swap; mid-air disappearance; scroll/hold gesture conflict on touch). Without instances G07 has no runtime value.
6. **A replacement test for static-first** when value is agency-borne.
7. **A routing table** (problem type → chapter/field), even ten rows.

## G. Caused fixation or unnecessary complexity
- No fixation observed: VL has no exemplars to fixate on.
- Mild overhead: consulting 14 chapters + H1–H12 + G01–G08 for each decision cost reading time with a 4/14 hit rate. With a routing table most of that cost disappears.
- No instance where VL pushed toward safer/generic output.

## H. Model knew better / VL added no value
- All 8 concept families; selection; anti-generic critique.
- Every defect diagnosis and recovery (deck overflow, touch-intent delay, sequential fold, measured-layout responsive fix, merge-onto-line grouping).
- Card/typography craft, colour palette choice, interaction affordances (latch, Space, Enter).
- Engineering of determinism and test tooling.

## I. Candidate schema changes (all HOLD)
| # | Current problem | Evidence from this run | Smallest intervention | Expected benefit | Risk | Status |
|---|---|---|---|---|---|---|
| I1 | No agency field | T4, T5, F1 | add `actor` (viewer / visitor / system / environment / content) to Composition Object | makes "who causes change" a search axis and a check | one more field to fill | HOLD |
| I2 | Role is static | T6 | add `role_by_state` to Composition Object (role + criticality per named state) | decides legibility budget per state directly | overlap with Ch6 must be cross-referenced, not duplicated | HOLD |
| I3 | No capacity behaviour | T11a | add `capacity_overflow` to Mechanism Object (what happens past capacity; must preserve causality) | anticipates the most expensive defect class for stream mechanisms | low | HOLD |
| I4 | Reversibility is one word | T8 | split into `reverses_behaviour` / `keeps_history` | forces the meaningful decision | low | HOLD |
| I5 | Attention structure has no form | T5 | define as ordered list per state: primary / supporting / ignorable / reward | writable, checkable | may become bureaucratic | HOLD |
| I6 | No routing table | T0, D | add a ≤ 15-row "problem → chapter/field" table to Ch11 | removes most reading overhead | risk of being treated as a checklist | HOLD |

## J. Candidate content additions (all HOLD, need more than n = 1)
| # | Content | Evidence | Status |
|---|---|---|---|
| J1 | Failure/recovery instance: *level-of-detail swap → superimposed text*; recovery: sequential fold on a continuous body | T10 | HOLD (ALFA-observed, single run) |
| J2 | Failure/recovery instance: *overflow fades mid-flight → causality loss*; recovery: deck/stack that always receives | T11 | HOLD |
| J3 | Failure/recovery instance: *touch hold vs scroll → state flash*; recovery: intent delay + movement threshold; test must assert "no transient on" | T11 | HOLD |
| J4 | Mechanism candidate: *semantic-state heat* (waiting time drives tint/edge/label; removed by the state change it argues for) | T7, T10 | HOLD — perceptual effect unvalidated by humans |
| J5 | Mechanism candidate: *same objects, re-routed under the visitor's hand* (non-reveal A/B by agency) | whole run | HOLD — Human WOW unresolved |
| J6 | Evaluation note: static-first needs an agency variant (e.g. "would the *transition* be kept as a 3-second clip?") | T12 | HOLD — requires Human Authority decision |

## 7. Information-architecture audit (Mechanism / Design Language / Composition objects)
| Field | Status in this run |
|---|---|
| Composition: intent, perceptual unit, component mechanisms, roles, relationships, shared cause, temporal distribution, substitutions, emergent risks | **required and used** (T5, T9) |
| Composition: spatial distribution, tension | useful, used lightly |
| Composition: attention structure | required, **no form** (I5) |
| Composition: expected outcome, evidence | **impossible to populate honestly** before human evidence; filled only as prediction |
| Mechanism: intent relations, perceptual behaviour, temporal behaviour, constraints, failures/recovery | used |
| Mechanism: parametric anatomy (stable / exploratory / failure-prone ranges) | **impossible to populate honestly** — ranges were found by trial, not known in advance; only the chosen values can be recorded |
| Mechanism: derivation, learning/provenance | never used |
| Design Language Object (all fields) | **never used** — the style was a by-product of mechanism and content decisions, not selected as a language |
| Provenance of model-native knowledge | no field distinguishes "from the model" vs "from VL"; this trace had to invent the distinction |
| Missing | actor, role_by_state, capacity_overflow, reversibility split (I1–I4) |

**Large knowledge base / small active palette.** The "small active palette" did happen naturally (≈ 6 elements activated across the run), but it happened through my judgement, not through any VL mechanism. The assumption that retrieval/routing will select the right small palette is **untested**: there is no corpus and no router. The "large knowledge base" side is empty — so this run tested the *schema*, not a knowledge base.

## Signals (this run only)
- **VL STRUCTURAL UTILITY SIGNAL: MIXED** — real help on composition/interaction structuring (4 decisions); absent on routing, failure anticipation, information architecture fields that cannot be filled honestly.
- **VL CREATIVE UTILITY SIGNAL: MIXED (weak)** — widened search on one axis (temporal driver) and originated one perceptual decision (oldest-first) plus parts of two others; no effect on concept generation or selection.
