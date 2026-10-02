# Visual Lab Usage Trace — Integrated Surgical Audit 01

Contemporaneous log. Entries are appended in the order decisions were made; earlier entries are not rewritten.
When an "observed result" arrives later, it is added as a dated **UPDATE** line under the original entry, not edited into it.
Format per entry: problem → VL knowledge activated (retrieval purpose) → alternatives → decision → did VL change it? →
model-native knowledge → predicted perceptual result → confidence → evidence needed → observed result → representation problem.

"VL" = `03_VISUAL_LAB_FROZEN_RESEARCH_FOUNDATION_v1.0.md` (chapter numbers = its 14 dimensions; H1–H12, G01–G08 its compressions).
"VI" = frozen ALFA Visual Intelligence v1.0 (repo copy). "GI" = ALFA GI Operational Package v1.0.
Honesty rule I set myself: if GI, VI or my own knowledge produced a decision and VL only *named* it afterwards, the entry says so.

---

## T0 · 19:37 UTC · Startup reconciliation (no design decision)
- Repo HEAD `c816cf6`, branch `ccr-86d3be6b-jy48id`, tree clean. Experiments present: Flagship 01, Exp02, Exp03 (closed, human WOW NO), Exp01 *The Reading*, Exp04 *More Than Pixels* (both HUMAN REVIEW REQUIRED).
- Pilot 04 A/C: **not in the repository.** Nothing to contaminate; recorded as a gap.
- VI: repo copy says FROZEN BASELINE (ratified); ZIP copy says "Candidate". Body text identical after whitespace normalisation → repo copy governs.
- Repo convention (`expNN.html` + `src/expNN/` + edit to `vite.config.ts`) would require writing outside an isolated area. Decision: self-contained static directory `experiments/vl-audit-01/`, no build step, no edits to shared config/README. QA scripts reuse `node_modules` read-only.
- VL activated: none yet. Observation for audit: the VL document has no field telling a user *which chapter to open first for a given problem type* — Ch11 (routing) describes routing in the abstract but ships no routing table. I start from GI Phase A instead.

## T1 · 19:40 · Problem frame
- **Problem:** what must the experience make a prospect *feel and believe* in the first minute?
- **VL activated:** Ch1 Intent coordinates (affective / attentional / spatial / material / temporal / behavioral / semantic / identity), purpose = *direct*. Also "intent can be primary/secondary/contrast/forbidden".
- **Alternatives:** (a) frame with VI §4 Brand Essence sentence only; (b) VL Ch1 coordinates; (c) both.
- **Decision:** both. VI sentence: *"This brand exists to turn a business problem into a working digital system, in a differentiated way through design-and-build that keeps running after launch, and people should feel relief turning into want."* VL Ch1 added two coordinates I would not have written explicitly: **behavioral intent = the visitor's own action must cause the change** and **forbidden intent = sensory overload as the primary experience** (which also appears in VI §30A).
- **VL changed decision?** Partly. The *behavioral* coordinate made "who acts?" a first-class question before concept search. The forbidden-intent slot is redundant with VI §30A.
- **Model-native:** the reading of the failure memory (prior runs were all scroll-scrubbed, viewer-as-spectator) is mine.
- **Predicted result:** search will lean toward agency-driven families. **Confidence:** medium. **Evidence needed:** concept-search spread.
- **Representation problem:** Ch1 gives coordinates but no way to state *intensity* or *order in time* of intents (IMPACT→DISCOVERY→DESIRE is a temporal sequence of intents; Ch1 treats intent as a static vector).

## T2 · 19:44 · What drives time? (pre-search diagnostic)
- **Problem:** prior repo experiments (Exp02, Exp03, Exp04, Flagship 01) are all *progress-driven* (scroll scrub, `state = f(p)`); Exp01 too. Failure memory notes interactive experiences judged as stills and "rationale stronger than artifact".
- **VL activated:** Ch8 "separate time-driven, input-driven, progress-driven, state-driven and autonomous behavior"; purpose = *diagnostic / contrastive*.
- **Decision:** treat temporal driver as a search axis. Require at least two families that are **not** progress-driven.
- **VL changed decision?** **Yes, moderately.** I had noticed "everything is scroll-scrubbed" while reading the README; the Ch8 taxonomy turned that observation into an explicit axis with four named alternatives. Without it I would likely still have varied it, but less systematically.
- **Model-native:** knowledge of what autonomous/input-driven web pieces look like in practice.
- **Predicted:** wider structural spread. **Confidence:** medium. **Evidence needed:** families table.
- **Representation problem:** none; this is the clearest actionable item so far.

## T3 · 19:58 · Generating concept families
- **Problem:** produce structurally different families, incl. non-reveal ones.
- **VL activated:** Ch10 mutation/derivation operators (parameter, trigger, input relation, material, spatial, temporal, output form, perceptual function, context; mutation distance; causality/relationship/representation mutation). Purpose = *exploratory*. Ch2 style families list consulted to see if a family axis was missing.
- **Alternatives:** generate with GI Phase B/C operators only vs. drive generation from Ch10.
- **Decision:** generated with GI operators + own knowledge (8 families, CONCEPT_SEARCH_RECORD §B). Then mapped them onto Ch10 operators: every family already matched an operator I had used. Ch2 style list: not used; families are mechanism/agency-level, not style-level.
- **VL changed decision?** **No.** Ch10 is a near-duplicate of GI Phase C operators at concept level. Its distinctions (mutation *distance*: near / structural / cross-family / cross-domain) were mildly useful to *label* F1 as "structural, cross-domain from logistics routing" but did not move selection.
- **Model-native:** all 8 families; knowledge of the "chaos→order" agency trope; knowledge of before/after-slider and configurator tropes.
- **Predicted:** — . **Confidence:** high that VL contributed little to generation here.
- **Representation problem:** Ch10 operators are written for *mechanisms* (L2) while concept search happens at *experience* level (L3/thesis). VL does not say how mutation operates on a whole experience concept vs on one effect. GI Phase C fills that gap; the two overlap without a declared boundary.

## T4 · 20:02 · Selection + fixation check
- **Problem:** choose F1 vs F5 vs F2.
- **VL activated:** Ch6 Effect Fitness = Mechanism × Role × Context; Ch12 "prediction is vectorial" (purpose = *evaluative*). VI §22 anti-generic suite, VI §30A accessibility.
- **Decision:** F1 INBOUND, F5 challenger, identity question left to Human Authority (record §E).
- **VL changed decision?** **No.** Selection was made with VI swap tests, GI critique list and failure memory. Ch12's vectorial framing matched what GI Phase D already does; it confirmed "no single score" but added no dimension that GI/VI lacked.
- **Model-native:** judgement of first-contact impact and execution risk per family.
- **Predicted:** F1 has the highest first-contact impact among non-reveal families **if** the static field is dense and alive at frame 0; risk of SaaS/automation category read. **Confidence:** medium-low on WOW, medium on comprehension.
- **Evidence needed:** static gate (two endpoint stills), then real hold interaction in browser.
- **Representation problem:** VL has no slot for *who acts / agency* as a composition-level property; it appears only inside Ch8 interaction causality. For this concept agency is the central mechanism, not a temporal detail.

## T5 · 20:08 · Composition of the hero (what owns attention, what supports)
- **Problem:** one field of ~100 moving message cards + headline + lanes + counters + AMPLIFY insight + hold affordance. Risk of "Everything Moves" (VI §25) and overload as the primary experience (VI §30A).
- **VL activated:** Ch7 roles (signature / structural / supporting / atmospheric / micro / utility / transitional), relationships (supports, competes, suppresses), **composition budgets** (attention, motion, novelty, interaction, cognitive), **shared cause/source/state**. Purpose = *structural*. Also the Composition Object schema (intent; perceptual unit; component mechanisms; roles; relationships; shared cause; spatial/temporal distribution; attention structure; tension; substitutions; emergent risks; expected outcome; evidence).
- **Decision (Composition Object, sparse):**
  - perceptual unit = *the stream* (cards + their paths are one unit, not N effects);
  - signature = the **bend**: in-flight and piled cards change trajectory toward lanes, velocity-continuous;
  - structural = lane columns (appear first, as acknowledgement); supporting = per-card status stamp + lane counts; atmospheric = the continuous arrival itself; micro = age heat on piled cards; utility = hold affordance, latch toggle, business switch; transitional = archive slide on release;
  - **shared cause** = one press state drives lanes, bend, stamps, counts, insight — nothing animates on its own clock except arrival;
  - budgets: at most ONE moving class at a time competes with the headline (arrivals only, while off; routing only, while on); headline never moves; insight appears only after routing has settled (≥2.5 s on).
- **VL changed decision?** **Yes, modestly.** "Shared cause" and the explicit *budget per moving class* reshaped my first sketch, in which the AMPLIFY insight and counters animated independently of the press. VI §9 (attention budget) says the same in less operational form; Ch7's role vocabulary made it quicker to write down.
- **Model-native:** card sizes, lane split, typographic hierarchy, the pile-as-height-field idea.
- **Predicted:** the bend reads as one causal event, not as 100 animations. **Confidence:** medium. **Evidence needed:** frame sequence across the first 600 ms after press; real hold in browser.
- **Representation problem:** the Composition Object has *roles* but no field for **state-dependent role** (see T6). It also has "attention structure" but no unit or form for writing it.

## T6 · 20:10 · Same object, two roles
- **Problem:** message cards are atmosphere in the pile (unreadable is acceptable, even intended) but content in the lanes (must be readable). How much legibility to spend where?
- **VL activated:** Ch6 "role is contextual, not intrinsic"; semantic criticality ladder (decorative / supporting / informative / interactive / critical). Purpose = *functional*.
- **Decision:** criticality is **state-indexed**: piled cards = supporting/atmospheric (overlap allowed, rotated ±7°, but each card individually still a real sentence); routed cards in lanes = informative (no rotation, no overlap, min 12 px text, contrast ≥ 4.5:1); "Needs you" cards = critical (largest, full sentence, never compacted). Screen-reader summary carries the informative layer in both states.
- **VL changed decision?** **Yes.** The criticality ladder gave me the decision rule directly. Without it I would have set one legibility standard for all cards and probably sacrificed the pile's density for it.
- **Predicted:** pile reads as pressure, lanes read as information. **Confidence:** medium-high. **Evidence needed:** stills of both states at 1440 and 390 widths; contrast check.
- **Representation problem:** Ch6 places role/criticality under *context*, Ch7 under *composition*. The two never meet in a schema field. Candidate: `role_by_state` in the Composition Object.

## T7 · 20:12 · Colour
- **Problem:** colour must be motivated (brief). Prior repo palettes: paper + red (Exp01), grey + vermilion (Exp04), dark + blue (Exp03).
- **VL activated:** Ch4 parametric anatomy — **semantic-state parameter** (a parameter whose value carries meaning); Ch3 colour/light family. Purpose = *direct*.
- **Alternatives:** (a) brand colour accent; (b) colour = channel (website/WhatsApp/email…); (c) **colour = waiting time** (fresh = ink, waiting = amber, overdue = red-orange); (d) staleness as fading.
- **Decision:** (c) on piled cards only. Routed cards return to ink: colour heat *is* the unattended state and disappears when the system takes the message. Neutral ground `#F3F2EE` (not the Exp01 cream, not the Exp04 grey). (d) rejected: fading reduces impact. (b) rejected: noise, no meaning in the arc.
- **VL changed decision?** **Partly.** The idea of heat-as-wait is mine; Ch4's "semantic-state parameter" vocabulary made me check that the ramp is *monotonic and reversible with state*, which led to the rule "routing removes heat".
- **Known risk:** red-orange end of the ramp is close to Exp04's vermilion. Accepted: the hue is semantic (overdue) here, not an accent; reported under ALFA-style detection.
- **Predicted:** off-state pile reads warm/urgent; on-state cools to ink. **Confidence:** medium.

## T8 · 20:14 · Interaction causality + temporal profile
- **Problem:** what exactly happens between press and meaning; what happens on release.
- **VL activated:** Ch8 causality chain ACTION → ACKNOWLEDGEMENT → SYSTEM RESPONSE → STATE CHANGE → PERCEPTUAL CONSEQUENCE → MEANING → SETTLE; temporal profile (trigger, onset, trajectory, duration, rhythm, coordination, settle, reversibility). Purpose = *structural*.
- **Decision:**
  - ACTION press anywhere on the stage / hold Space / or toggle (latch) →
  - ACKNOWLEDGEMENT ≤ 80 ms: lane rules draw in, lane labels appear, the hold ring fills (no card has moved yet) →
  - SYSTEM RESPONSE 80–900 ms: cards lift **in order of waiting time, oldest first** (the system reads the queue) and bend toward their lane; incoming cards bend mid-flight; trajectory = steering with carried velocity, no teleport, no crossfade →
  - STATE CHANGE: on landing each card loses its heat and gets a stamp ("answered · 0:04") →
  - CONSEQUENCE: lane counts tick; "Needs you" shows the few that remain →
  - MEANING (after ≥2.5 s on): one AMPLIFY insight derived from the actual routed messages →
  - SETTLE: lanes compact; arrivals keep coming and are routed at arrival.
  - RELEASE: handled cards are *not* undone; they slide into an archive count ("142 handled"); new arrivals fall and pile again. Reversible in behaviour, not in history.
- **VL changed decision?** **Yes, for one specific item:** "oldest first" ordering came from asking what the *system response* step should communicate (the system reads the queue). The rest (ack → response → settle) is standard interaction-design knowledge I would have applied anyway; Ch8 matches VI §15.9 (cause → anticipation → reaction → consequence → settle).
- **Predicted:** the press feels like *switching something on*, not triggering an animation. **Confidence:** medium. **Evidence needed:** frame-by-frame capture of 0–1200 ms after press; real pointer/touch/keyboard tests.
- **Representation problem:** VL's chain has no slot for **what is NOT reversed** on release (history vs behaviour). Reversibility is one word in the temporal profile; here it needed a decision with meaning.

## T9 · 20:15 · Degradation path / reduced motion
- **VL activated:** Ch9 degradation path full → reduced → fallback → static, preserving meaning; Ch8 "reduced-motion alternatives must preserve meaning". Purpose = *failure/constraint*.
- **Decision:** reduced motion = no flight, no autonomous stream; two designed static states (pile / routed) of the same messages switched by a button and Space; counts and insight identical; aria-live summary of each switch. No-JS fallback: a static paragraph summary with the scope and CTA.
- **VL changed decision?** **No** — VI §30A and §29 already require this; VL restates it. Redundant.

## T10 · 20:52 · Static gate, pass 1 (stills `evidence/dev/a-off.png`, `b-on.png`, 1440×900)
- **Observed A (off):** pile reads as a pile; "Waiting 48 · oldest 2 h 7 min" in red works. **Weak:** heat lives only in 3 px bars + tiny labels, so the pile reads as *messy text* more than *pressure*; flat wide band, empty upper-right; overlapping text reads partly as a rendering bug, not as physical layers.
- **Observed B (on):** lanes read as a credible system; "You" column is distinct; insight card lands. **Weak:** duplicated messages are visible (template pool too small → exposes fakery); a mid-landing frame shows **two texts superimposed** (full card + compact line crossfading) — a double-exposure worst frame; B risks generic SaaS dashboard.
- **VL activated for the fixes:** Ch4 semantic-state parameter again (heat is underspent: apply it to the card *surface*, not only an edge); VI §23 "Noise: defect concealment → intentional material texture" / Ch9 failure taxonomy (*perceptual*, *premium*) for the double exposure; Ch3 "quiet tools are first-class" (a 1-layer soft shadow makes overlap read as physical stacking).
- **Decisions:** (1) card surface tints with heat (paper-white → faint amber → faint rust), bar stays; (2) soft single shadow on piled cards only (removed in lanes: lanes are information, not objects); (3) landing fold = sequential, never simultaneous (old text out in the first half, stamp line in the second, card body continuous); (4) per-lane shuffled decks + larger pools so repeats are rare in view; (5) taller, narrower mound.
- **VL changed decision?** (1) yes — pushed by the "semantic-state parameter" framing (the same parameter should be allowed to drive more than one primitive); (2)(3)(4)(5) no — standard craft fixes I would make anyway. Ch9 named the failure class but supplied no recovery for "superimposed text during a level-of-detail change"; recovery came from model knowledge.
- **Representation problem:** VL stores failures and recovery *in principle* (G07) but holds no instances, so at the moment of a concrete defect it can only label it. Usefulness at debugging time ≈ zero.

## T11 · 21:20 · Worst frames + interaction defects (evidence/sequence/*, qa/interact.mjs)
- **Found:** (a) narrow layout: routed cards pushed past lane capacity *before landing* faded out mid-air, uncounted (only 5 of 44 handled after 4 s on 390×844) — a **causality** failure; (b) release: translucent archived deck layers superimposed text; mid-route cards fell *through* lane rows; (c) burst at ~1.0–1.5 s after first press: full-height cards crowding 36 px slots; (d) touch: a scroll gesture starting on the field switched the system on for one event cycle before `pointercancel` (reproduced: `flash: 1` with the original synchronous path; `flash: 0` after the fix).
- **Fixes:** (a) overflow lands on a visible **deck** under the last row (cards always arrive somewhere; counted on landing); (b) on release, buried deck layers leave at once, visible rows drift down together and fade ("filed"), repeats already merging leave instantly; (c) cards close their height toward the line as they approach the slot (uniform text scale, never squashed); (d) touch commits to "hold" only after 110 ms without >8 px movement.
- **VL activated:** Ch8 "preserve perceptible causality"; Ch9 failure taxonomy (*causality*, *interaction*, *responsive*). Purpose = *failure*.
- **VL changed decision?** **No.** VL named (a) and (d) as failure classes after I found them; detection came from capture tooling and counting, recovery from model knowledge. (a) is a *responsive* failure that the VL degradation-path concept (full → reduced → fallback → static) does not cover: the layout changed, the motion did not degrade, and the mechanism broke.
- **Model-native:** all diagnoses and recoveries; the "deck" idea; the touch-intent delay (a standard long-press pattern).
- **Observed:** sequence re-captured; interaction suite 22/22 PASS (see TECHNICAL_EVIDENCE.md).
- **Representation problem:** VL has no slot for **capacity/overflow behaviour of a mechanism** (what happens when there are more items than the composition has room for). For any stream/feed mechanism this is decisive.

## T12 · 21:24 · Reconsidering the signature moment after seeing it move
- **Observation (sequence frames, not human):** the strongest frame in the arc is not the lanes (B) but **~300–700 ms after press**: the pile visibly lifting oldest-first while the lane rules have already drawn. B alone is a clean but ordinary sorted UI; A alone is an attractive but ambiguous pile. The meaning is in the *transition under the hand*, which stills cannot carry.
- **Implication:** the static gate (VI §16) is structurally weak for this concept — B would likely not be kept "in a premium portfolio" by itself. Remove-the-Effect test: the *information* survives (reduced-motion route proves it), the *impact* does not.
- **VL activated:** Ch12 "claim fidelity must not exceed evidence fidelity"; Cheapest Valid Artifact ladder (the selected rung: isolated interaction + signature-moment prototype).
- **VL changed decision?** **No** — it reinforced recording this as a limitation rather than "PASS".
- **Representation problem:** VI §16 Static-First and VL Ch8 "stillness is part of motion design" give no guidance for concepts whose value is *agency-borne*. Neither says which endpoint test replaces the portfolio-still test when the endpoint is ordinary by design.

## T13 · 21:45 · Responsive layout defects (evidence/contact-viewports.jpg, contact-phones.jpg)
- **Found:** fixed height fractions made lanes/pile collide with the lede on short screens (1366×640, 360×640); 5 columns at 820 px truncated messages to 3–4 characters; a lane could show an **empty card** (top line in flight while the line below already hid its text); the phone insight covered a wrapped headline.
- **Fixes:** layout reads the real intro bottom from the DOM; rows below 900 px; text hides only under a *landed* line; insight placed from the headline's measured bottom; short-height type scale.
- **VL activated:** VI §29 Responsive Cinematography (preserve meaning → hierarchy → anchor → causality → information, then adjust layout). VL Ch6 device/viewport context axis.
- **VL changed decision?** **No.** VI §29's priority order was the operative rule; VL Ch6 lists viewport as a context axis without anything actionable.
- **Residual (recorded, not fixed):** on phones the pile and the lane rows occupy the same band, so 0.5–1.3 s after the first press is a dense collage; on 360×640, cards in flight pass under the lede.

## T14 · 21:50 · Stop decision
- **Problem:** continue polishing or stop?
- **Applied:** GI stop rule (coherent and resolved enough for Human Review; next questions are perceptual/human: does the bend produce impact? is the identity too operations-coded?). VL Ch12 Cheapest Valid Artifact: the rung reached is *signature-moment prototype + section prototype*, which matches the variable being tested (agency under the hand). A full site would not add information before human evidence.
- **VL changed decision?** **No** (GI stop rule did the work; VL ladder agreed).
- **Predictions are frozen in PREDICTION_LEDGER.md before any human sees the artifact.**

## Trace summary (counted from entries above, not reconstructed)
| Entry | VL changed the decision? |
|---|---|
| T1 frame | partly (behavioural-intent coordinate) |
| T2 temporal driver | **yes, moderately** |
| T3 family generation | no |
| T4 selection | no |
| T5 composition / shared cause / budgets | **yes, modestly** |
| T6 state-indexed criticality | **yes** |
| T7 colour = waiting time | partly |
| T8 causality chain → oldest-first | **yes, one item** |
| T9 degradation | no (redundant with VI) |
| T10 static gate fixes | partly (1 of 5 fixes) |
| T11 worst frames / interaction defects | no |
| T12 agency vs static-first | no |
| T13 responsive | no |
| T14 stop | no |
Totals: 4 yes · 4 partly · 6 no. Every "yes" is in the **mid-level structuring** of a concept already chosen; none is in concept generation, selection, debugging or recovery.
