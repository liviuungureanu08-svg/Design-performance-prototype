# FINAL REPORT — ALFA Visual Lab · Integrated Surgical Audit 01

Experiment directory: `experiments/vl-audit-01/` (isolated; nothing else in the repository changed).
Branch `ccr-86d3be6b-jy48id`, based on `c816cf6`. Date 2026-10-02. One session, one model, no human input during the run.
Claim labels: **[F]** fact measured here · **[O]** observation from captures · **[I]** inference · **[P]** prediction · **[H]** human verdict (none exist) · **[M]** missing evidence.

---

## 1. Executive result
- **Built:** *INBOUND*, a Gabriel Solutions landing experience. A live field of a business's incoming customer messages piles up and heats with waiting time; **pressing and holding anywhere runs "the system"**: the same messages, mid-air, bend into Website / App & platform / Automation / AI lanes, and only a few reach **You**. Let go and new messages pile again. Below: where it went (with the visitor's own session counts) and "What arrives at yours?" with CTA. Four illustrative businesses. [F]
- **Technical readiness:** ready for Human Review on desktop; ready with known density/limitation notes on phones. 22/22 real-input checks pass; console clean; deterministic; reduced-motion and responsive variants exist. No physical-device or real-GPU test. [F][M]
- **Human Authority:** Human Static Gate, Human WOW, identity choice (operations-first vs design-first), and whether agency-borne concepts may pass Static-First.
- **Visual Lab utility (this run, not validation):** **MIXED** (structural: mixed; creative: weak mixed).

## 2. New experience
- **Concept name:** INBOUND.
- **Project Truth connection:** Gabriel turns a business problem into a working system across web, apps/platforms, AI and automation (UNDERSTAND → DESIGN → BUILD → AMPLIFY). The lanes *are* that scope; the AMPLIFY insight ("9 people asked about Saturdays → drafted a Saturday appointments page") is computed from the messages actually routed. The problem is shown as the client lives it: volume that never stops.
- **Experience thesis:** *We don't make your business quieter. We make everything that arrives go somewhere.*
- **Signature moment:** the first hold — the heated pile lifts oldest-first and every in-flight message bends into the lane that handles it, velocity-continuous; counts tick only as each one lands.
- **Arc:** IMPACT (a warm, growing pile; "Waiting 48 · oldest 2 h 19 min") → DISCOVERY (by the visitor's own hand: the lanes, the stamps, ×N grouping, "only 5 need you", the insight) → DESIRE ("While the system ran, 36 messages were taken… 4 came to you"; "What arrives at yours?").
- **Perceptual Contract:** Initial belief: *a business is drowning in messages.* Invariant: *the same cards; the volume never drops.* Trigger: *my hold.* Transformation: *pile → lanes.* Reinterpretation: *the pile was never too much — it had nowhere to go.* Signature: *the bend.* Recognition: *this is my inbox.* End belief: *with a system, almost nothing needs me.*
- **Transformation Contract:** FROM a heated pile THROUGH oldest-first lift and mid-air re-routing TO quiet lanes with stamps BECAUSE a designed system takes each message somewhere.
- **Interaction Contract:** hold → lane rules draw (acknowledgement ≤ 90 ms [F]) → cards lift and bend → heat drains on landing, stamp appears → counts tick → insight → settle. Release → handled lines filed (history kept), new arrivals pile (behaviour reversed). Alternatives: Space, Enter/latch, "Run it for ten seconds".
- **Payoff Contract:** afterwards the visitor can see that their own inbound volume could be absorbed by website + app + automation + AI, leaving only what needs judgment — and that Gabriel designs and builds that.
- **Structural difference from prior ALFA experiments:** all five repo experiments are *scroll-scrubbed reinterpretations* watched by a viewer (A → B by progress). INBOUND has no scrubber, no hidden truth, no B to reveal: an autonomous stream plus a reversible state **owned by the visitor's hand**; category meaning is carried by behaviour, not copy; no object hero, no dark void, no WebGL. Exp01's annotation grammar and its bakery/freight examples were deliberately excluded. [F]

## 3. Concept search record (full: `CONCEPT_SEARCH_RECORD.md`)
- **Families:** F1 INBOUND · F2 Two Futures · F3 The Page Handles You · F4 Under Force · F5 Constraint Instrument · F6 The Cut · F7 Powers of Ten · F8 Overnight.
- **Structural differences:** temporal driver, agency, information logic, emotional arc; F7 kept as the conventional contrast.
- **Selected F1:** breaks the shared premise of all prior work; behaviour carries category; desire is concrete; Remove-Effect keeps the information.
- **Challenger kept: F5** (design-first). Rejected: F2 (split halves impact; slider trope), F3 (surveillance vs "human"; slow first contact), F4 (fails swap tests), F6/F7 (reveals), F8 (scrubber premise).
- **Fixation check:** chaos→order trope addressed by three named differences (volume constant, reversible under the hand, end state = "few need you"); Exp01/Exp04 overlaps checked and excluded.
- **Visual Lab effect on search:** widened slightly (temporal-driver axis); no effect on generation or selection.

## 4. Visual Lab Usage Trace summary (full: `VISUAL_LAB_USAGE_TRACE.md`)
| VL element | Design problem | Decision | Implementation | Predicted result | Evidence status |
|---|---|---|---|---|---|
| Ch8 temporal drivers | prior work all progress-driven | driver as a search axis | autonomous stream + input-driven state | wider spread | [O] spread visible in families table |
| Ch7 shared cause, roles, budgets | many moving classes | one switch causes everything; one moving class at a time | `setOn` drives lanes, bend, stamps, counts, insight | reads as one event | [O] frame sequences show causal order; [M] human |
| Ch6 criticality by role | legibility budget | state-indexed: pile atmospheric, lanes informative, You critical | overlap/rotation only in pile | pressure vs information | [O] stills; [M] human |
| Ch8 causality chain | what the response should say | oldest first | delay sorted by `born` | "the system reads the queue" | [O] hottest leave first; [M] perceived? |
| Ch4 semantic-state parameter | colour motivation | heat = waiting time on tint/edge/label; drained by routing | `heatRGB`, `surface()` | warm pressure → cool order | [O] stills; [M] human |
| Ch1 behavioural intent | frame | visitor's action causes change | hold mechanic | — | [O] |
**Inspected but rejected / no effect:** Ch10 mutation operators (redundant with GI), Ch12 vectorial prediction (redundant with GI/VI), Ch9 degradation (redundant with VI §30A; missed layout-driven failure), Ch2 design languages (never needed), Ch11 routing (no table to use), Ch13/14 (no runtime role), H1–H12 (restate VI), Generative Coverage Map (no corpus).
**Tally:** 4 decisions changed, 4 partly, 6 unchanged.

## 5. Technical realization (full: `TECHNICAL_EVIDENCE.md`)
- **Techniques:** fixed-step deterministic simulation; height-field pile; damped-spring steering with carried velocity; cached text sprites + live surfaces; one shadow sprite; DOM for all text/controls; aria-live; measured responsive layout; single-file packer.
- **Realization choices, not VL mechanisms:** Canvas 2D vs DOM, springs, sprites, height field, deck overflow, 110 ms touch-intent delay, sequential fold.
- **Checks:** 22/22 interaction checks [F]; headless rAF median 16.7 ms, p95 16.8 ms [F] (software raster; not a device measurement); determinism identical hashes [F]; no overflow at 390/1440 [F]; reduced motion preserves information and counts [F]; viewports 360×640 → 1920×1080 captured [F].
- **Worst frames:** desktop ~1.0–1.5 s after a large-backlog press (dense folding, transient small text); phone 0.5–1.3 s (pile and rows share a band → collage); both recover by ~2 s [O].
- **Limitations:** no physical phone / real GPU / iOS long-press / Safari / screen-reader session [M]; invented content; placeholder contact; English only.

## 6. Visual Lab Surgical Audit (full: `VISUAL_LAB_SURGICAL_AUDIT.md`)
- **A. Clearly useful:** Ch8 temporal drivers; Ch6 role/criticality; Ch7 shared cause + budgets; Ch8 causality chain.
- **B. Useful but underspecified:** semantic-state parameter (multi-primitive coupling); attention structure (no form); reversibility (one word); degradation path (misses layout-driven failure).
- **C. Redundant:** Ch10 ≈ GI Phase C; Ch12 ≈ GI Phase D/VI §30; reduced-motion ≈ VI §30A; H1–H12 ≈ VI.
- **D. Too abstract:** Ch2, Ch11 (no routing table), Ch13, Ch14, Coverage Map.
- **E. Ambiguous:** static-first vs agency-borne value; mutation at mechanism vs experience level; role (Ch7) vs criticality (Ch6) split.
- **F. Missing:** actor/agency; capacity/overflow; role_by_state; reversibility semantics; failure/recovery *instances*; static-first replacement test; routing table.
- **G. Fixation/complexity:** no fixation (no exemplars); reading overhead with ~30% hit rate.
- **H. Model knew better:** concept generation/selection, all defect diagnosis and recovery, craft, engineering.
- **I. Schema changes (HOLD):** I1 `actor`; I2 `role_by_state`; I3 `capacity_overflow`; I4 reversibility split; I5 attention-structure form; I6 ≤ 15-row routing table — each with problem → evidence → smallest intervention → benefit → risk in the audit file.
- **J. Content additions (HOLD):** J1–J3 failure/recovery instances (LOD double exposure; overflow vanishing mid-air; touch hold vs scroll flash); J4 semantic-state heat; J5 re-routing under the hand; J6 agency variant of static-first.

## 7. Information architecture audit
- **Required & used:** Composition intent, perceptual unit, mechanisms, roles, relationships, shared cause, temporal distribution, substitutions, emergent risks; Mechanism perceptual/temporal behaviour, constraints, failures.
- **Never used:** entire Design Language Object; Mechanism derivation, learning/provenance.
- **Missing:** actor, role_by_state, capacity_overflow, reversibility split; a field separating model-native vs VL-sourced knowledge.
- **Impossible to populate honestly:** Composition "expected outcome"/"evidence" before humans (only as prediction); Mechanism parametric stable/failure-prone ranges (found by trial, not known).
- **Large KB / small active palette:** a small palette (~6 elements) emerged by my judgement; no retrieval or routing mechanism was exercised because no corpus or router exists. This run tested the schema, not a knowledge base. [F]

## 8. ALFA capability audit (full table: `ALFA_CAPABILITY_AUDIT.md`)
Demonstrated: Project Truth use, structural diversity, Search Governor procedure, VI gates except human ones, Experience Specification contracts, evidence matched to the variable (interaction tests, not stills), prediction ledger, Human-Authority boundaries. Partial: static gate (self), identity fit, critic separation (same model). Research-only: routing, retrieval, learning/calibration loop, promotion. Missing: any human outcome; any control run.

## 9. Prediction ledger (full: `PREDICTION_LEDGER.md`, frozen before review)
Comprehension HIGH once held / MED before · identity MED–HIGH for "systems", MED–LOW for "website" · premium static MED–LOW · premium dynamic MED · WOW **probably NO, ≈ 1 in 4 YES** (low confidence) · commercial desire MED–HIGH for service businesses · interaction clarity MED–HIGH desktop / MED phone · execution risk MED. None are outcomes. [P]

## 10. Human Review package
`HUMAN_REVIEW_PROTOCOL.md`: blind desktop first contact (WOW yes/no before reasons), exploration, phone pass, 1–5 ratings (comprehension, identity, premium static, premium dynamic, desire, interaction clarity), signature recognition, forced/generic/confusing, next-day memory, and two owner decisions. Open `INBOUND_review.html` (no server needed).

## 11. Evidence integrity
- [F] tests, timings, hashes, file changes, defect reproductions as listed.
- [O] causal order, worst frames, stills — my reading of captures.
- [I] that VL "changed" a decision is my attribution at decision time; no control exists to check it.
- [P] all perceptual/commercial outcomes.
- [H] none.
- [M] human evidence; device/GPU evidence; control run without VL.
- **Contamination:** none yet. Risk: the owner reading these reports before Pass 1 of the protocol. Trace honesty limit: entries were written during the run in order, but by the same agent that made the decisions.

## 12. Final experimental verdict
- **ARTIFACT TECHNICAL STATUS:** ENGINEERING PASS (headless, scripted) · READY FOR HUMAN REVIEW · device/GPU UNVERIFIED · Art Direction self-assessed PARTIAL (on-state endpoint is ordinary by design; Static Gate open).
- **VISUAL LAB STRUCTURAL UTILITY SIGNAL:** MIXED
- **VISUAL LAB CREATIVE UTILITY SIGNAL:** MIXED (weak)
- **ALFA INTEGRATION SIGNAL:** MIXED
- **HUMAN WOW:** UNRESOLVED
- **CORE PROMOTION:** NONE

## 13. Recommended next experiment (smallest justified)
**Owner review of INBOUND first** (protocol as written), then — only if VL's value is still in question — a **matched no-VL control on the same brief, same model, same time budget**, with this run's prediction ledger format, comparing only: number of structurally distinct families, number of mid-level structuring decisions, and defects found before human review. No VL schema or content change before that comparison; I1–I6 and J1–J6 stay HOLD.
