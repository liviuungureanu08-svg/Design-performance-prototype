# GI + Visual Lab v0.1

Implemented candidate / NOT CORE / TO VALIDATE. Version `0.1.0`, initial patch `0`.

This dependency-free Node.js layer compiles selective guidance, creates isolated experiments, diagnoses named failures and records decisions, evidence and frozen predictions. It does not invoke a model, choose a visual style, render a site or certify Premium. Human validation and weaker-model transfer have not been performed.

## Structure and responsibilities

```text
alfa/gi-visual-lab/v0.1/
  governance.json           phase instructions and Human Authority boundary
  knowledge/VL-01..06.json   editable procedural units with provenance
  schemas/contracts.json    local JSON Schema definitions
  src/
    validation.mjs          strict local contract subset; no external resolution
    catalog.mjs             catalog loading and deterministic coverage routing
    orchestration.mjs       Project Truth → editable creative-search scaffold
    context.mjs             compact active context, current-phase prompt and plan
    governor.mjs            HEG diagnosis; TEG transition subset; repair guidance
    experiments.mjs         isolated snapshot/run, records, review and comparison
    io.mjs                  exclusive writes, boundaries, manifests and hashes
    cli.mjs                 operator/model adapter interface
    check.mjs               executable syntax and contract checks
  examples/                 synthetic input/observation/record formats
  test/candidate.test.mjs    regression tests in disposable temporary directories
  test/smoke.mjs             ONE persistent synthetic plumbing run; refuses rerun
  IMPLEMENTATION_REPORT.md  delivery, verification and Git safety checkpoint

experiments/alfa-gi-visual-lab-v0.1/runs/<experiment-id>/
  intake.json, active-context.json, prompt.md, run.json, seal.json
  snapshot/                 guided only: runtime/config/schema/knowledge snapshot
  artifact/                 generated artifact, owned by this run
  logs/, verification/      actual execution logs and rendered/technical checks
  trace/, evidence/         one exclusive JSON record per event
  predictions/FROZEN.json   pre-review prediction plus artifact SHA-256 manifest
  human-review/PENDING.json explicit placeholder, not a verdict
  human-review/<id>.json    separately imported actual evaluator feedback
```

No frozen source is imported as executable code. Foundation references are provenance, not runtime prompt dependencies. Run-specific artifacts never get copied into the canonical candidate. Future `v0.2/` and its own experiment namespace can coexist.

## Start

Use Node 22 or newer. No install, lockfile, build, bundled browser, database or API key is required. From this directory:

```powershell
node src/check.mjs
node --test test/*.test.mjs
node src/cli.mjs help
node src/cli.mjs prepare examples/truth.json
node src/cli.mjs plan examples/intake.json
node src/cli.mjs context examples/intake.json
node src/cli.mjs prompt examples/intake.json
```

`prepare` produces an editable reasoning scaffold with unfilled promise, concept, signature and stop/repair gates. It never invents facts or selects a concept. Complete feel/understand/canDo, justify them against fact sources, then distill the checked promise into intake. `plan` describes all phases; `context`/`prompt` deliver only the current phase. Ambition and search precede criticism, retain model-native alternatives and require structural differences rather than cosmetic variations. Quiet approaches remain eligible.

Change the intake phase deliberately: `frame → promise → ambition → search → signature → activation → generation → critique → repair → human-review → evidence`. These are operator/model reasoning stages, not a proven or enforced lifecycle state machine. Work products can live in the run's `logs/`; this layer supplies the scaffolds and guidance, the model/operator supplies the reasoning and implementation. Resolve `projectTruth.blocked` before creating a generation run. The router cannot establish whether a cited fact is true.

## Contracts

Authoritative machine-readable interfaces are `$defs` in `schemas/contracts.json`. Objects reject unknown fields; strings cannot be blank; feature/failure/phase labels and IDs are constrained. The local validator intentionally implements only the keywords used here, rejects unsupported schema keywords/references at startup, and performs no coercion/default insertion. It is not a general-purpose JSON Schema engine.

An intake requires: experiment ID, candidate version, condition, brief, Project Truth (facts with sources, constraints, unknowns, blocked flag), Experience Promise, model and settings, tool/asset permissions, time/token budget, evaluation conditions, phase, uncertainty, features, requested mechanism IDs, failure IDs, mechanism cap, preserve invariants and Human decisions. `examples/intake.json` is the complete shape; replace its placeholder model/device/settings for an actual experiment.

Active context carries truth, promise, phase, uncertainty, constraints, Human decisions, invariants, selected units, activation reasons, deferred IDs, tests and current-phase instructions. Activation means *selected*, not *used* or *helpful*: `decisionStatus` starts `NOT YET OBSERVED`. Actual changed/unchanged decisions belong in the trace.

Routing validates requested IDs, respects unit phase eligibility and the explicit cap (`1..6`), then greedily covers remaining failures before features with stable ID tie-breaking. No automatic units are activated during frame/promise/ambition/search/signature. Explicit IDs may override relevance, never phase/cap/unknown-ID checks. A feature alone is a candidate trigger; inspect `whenNotToUse` and use explicit selection to reject false positives. Deferred matches are visible. This is a deterministic coverage heuristic, not globally optimal selection, semantic inference or a token-budget guarantee. No entire corpus is delivered by default.

Each unit includes ID/version/status, rule, why, mechanism, when-to-use/not-use, sensitive parameters, dependencies, implementation pattern, sourced good/anti examples, failure modes, tests, repair strategy, invariants, cost, transferability, provenance and routing metadata.

| Unit | Operational focus |
| --- | --- |
| VL-01 | Raw input → target → governed environment → visual state → settle |
| VL-02 | Meaningful motion vs redundant noise |
| VL-03 | Responsive, smooth, physical, controlled pointer response |
| VL-04 | Fast-scroll flashing and skipped states |
| VL-05 | Readability and semantic timing during transformation |
| VL-06 | Preserve agency, signature amplitude and spectacle during repair |

No universal easing/damping constant or house-style recipe is encoded. Native document controls remain precise and responsive; environmental motion may have governed travel, inertia and settle. FPS/callbacks cannot certify perceptual continuity. Preserve the VELORUM contradiction: technical refinement improved some continuity/control while Human Review found weaker spectacle/agency and only PARTIAL UX Motion Quality. LAMELLA and FIR DE FOC remain different evidence, not reusable visual templates.

## Isolated experiment protocol

Prepare and inspect an intake, using a new path-safe ID. `init` creates an exclusive run; any existing destination fails rather than being reset. CLI outputs are confined to the experiment namespace, resolved relative to the installed candidate, not the current shell directory.

```powershell
node src/cli.mjs init examples/intake.json
node src/cli.mjs diagnose synthetic-plumbing examples/observations.json
node src/cli.mjs trace synthetic-plumbing examples/trace.json
node src/cli.mjs freeze-prediction synthetic-plumbing examples/prediction.json
node src/cli.mjs evidence synthetic-plumbing examples/evidence.json
node src/cli.mjs review-package synthetic-plumbing
node src/cli.mjs verify-run synthetic-plumbing
```

These examples demonstrate formats; do not import synthetic claims as real experiment outcomes. The persistent plumbing run may already exist. Choose a fresh ID for another experiment. The freeze command requires nonempty `artifact/`; use the authorized model session to create its artifact there first. A single packaged plumbing smoke can be created with `node test/smoke.mjs`; it creates no site and invokes no model/browser/Human.

For a guided run, candidate runtime, contracts, governance and knowledge are copied and hashed before generation; the model receives `prompt.md`, not the full snapshot. Use the snapshot's CLI or the current CLI `diagnose <run-id>` (which loads that run's snapshot) to avoid relying on later canonical knowledge changes. Input, prompt and active context are sealed. Changing conditions/guidance requires a new run ID; do not edit an existing sealed run. Guidance for a new observed failure is a recommendation, not retroactive activation: record it as an inference and create an explicitly revised run/context if testing that changed intervention.

Generated artifacts, logs and verification stay in their run. `verify-run` checks sealed inputs, snapshot consistency, record digests and artifact freeze integrity. Exclusive writes and link/path checks protect against accidental overwrites and redirection. Hashes are not signed/OS-immutable records and do not resist an adversary who edits both data and its seal. Filesystem checks are not a race-resistant security sandbox. Tool/assets/budget fields declare the intended protocol; enforcement belongs to the actual model session/tool sandbox and operator. Never give an experimental generator canonical-source write authority.

## HEG / TEG, trace and evidence

`diagnose` accepts sourced observations, routes only matching failure knowledge and returns targeted tests, repairs, preserve invariants and BEFORE/AFTER decision gates. TEG covers skipping, flashing, timeline mismatch and abrupt settle inside HEG. It does not perform browser inspection, smoothing/post-processing or performance measurement. A malformed/unknown failure fails rather than becoming generic advice. Test native document/environment timing separately and capture actual rendering at slow/normal/fast wheel, aggressive drag, reverse, pause/resume and direction changes.

Capture invariants before repair and verify both DEFECT REDUCED and VALUE PRESERVED. Record regression or lost amplitude honestly. Stop low-information polishing or decisions that need Human Authority.

Trace records require why, before/after decisions, failure target, value preserved, outcome and evidence references. `ALFA KNOWLEDGE` must refer to a unit activated in the sealed context. `MODEL NATIVE` and `NO CHANGE` use `mechanismId: "NONE"`. References can be pending until evidence is recorded; no causal effect is inferred from an activation.

Evidence requires a trace event ID, claim, source, scope, limitations, label and authority. Labels remain separate: TECHNICAL EVIDENCE, OBSERVED, HUMAN VERDICT, INFERENCE, HYPOTHESIS, TO VALIDATE. Technical records need TEST authority; Human labels require HUMAN authority, explicit input and an existing `human-review/<id>.json` source. Contribution remains NOT EVALUATED or SELF-ATTRIBUTED; this CLI refuses CONTROLLED COMPARISON certification. Engineering passes, process compliance, model capability and ALFA contribution are distinct claims.

## Prediction and Human Review

Before review, freeze strengths, risks, expected failures, confidence/uncertainty and active knowledge IDs against the actual artifact manifest. `FROZEN.json` is exclusive; changed artifacts invalidate review integrity. A post-review prediction cannot replace it. For a repaired artifact after review, start a new experiment and preserve the earlier one.

`review-package` exposes the frozen artifact manifest and 18 Human questions without model metadata or predicted verdicts. Operator must present the artifact first, anonymize run paths/arms if needed and hide rationale/prediction. A path can reveal condition: the tool cannot guarantee blinding.

Import actual feedback with:

```powershell
node src/cli.mjs human-review <run-id> <review-id> <actual-review.json> --human-input
```

The `humanReview` contract requires evaluator, review date, device, input, order, blind/nonblind status, limitations and actual text for all questions. Use "not assessed" in the evaluator's words when appropriate; do not invent an answer. The explicit flag is operator attestation, not identity verification. The tool cannot know whether supplied text was really written by a Human. Multiple evaluators stay separate; predictions never overwrite verdicts. No automated Premium/WOW/Would Pay/UX Motion score exists.

## Baseline vs guided

```powershell
node src/cli.mjs pair <guided-intake.json>
node src/cli.mjs compare-pair <experiment-id>-baseline <experiment-id>-guided
```

`pair` clones the same brief, truth, promise, model/settings, assets/tools, budget and evaluation into two independent folders. Baseline has no ALFA instructions, selected/failure knowledge or snapshot. Its prompt is exactly the common task prefix of the guided prompt. The supplied promise is shared task input; do not derive it using guided-only reasoning after baseline is run. All generated content remains independent. Comparison refuses different declared common inputs, exposes each arm's trace/evidence/prediction/Human records, and does not certify contribution.

Use independent fresh sessions with identical actual model/settings/effort/tool permissions, assets, budget accounting and evaluation task. Give baseline only its common prompt; do not let it inspect candidate, guided results or this protocol. Use OS/tool isolation to enforce that separation. Randomize/anonymize review order, retain deviations, actual time/tokens and contamination notes in each `logs/`. Declared matching cannot prove executed matching, blindness or ALFA effect. Do not promote from a single pair. The two substantive validation briefs are a separately authorized next phase and were not run here.

## Modify and extend

Edit one knowledge JSON to change its procedural guidance; edit governance for phase behavior, catalog for routing, governor for diagnosis and contracts for interfaces. Keep stable IDs, update provenance and tests. Document any released v0.1 patch in `CHANGELOG.md` and increment governance patch; update package/schema version identifiers together for a version change. Material routing/schema/governance changes should be a separate `v0.2/` with its own namespace, not silent alteration of delivered v0.1. Existing run snapshots remain historical. No run automatically promotes/learns or writes back to source.

Tests cover contracts, invalid Truth, deterministic capped routing, early-phase ambition, baseline separation, diagnosis, trace/evidence authority, prediction/review separation, overwrite/traversal/junction rejection, snapshot independence, actual artifact freeze and matched-input mismatch. The source hash is checked before/after generated run output. CLI smoke exercises real child processes; synthetic Human-import fixtures exist only in disposable unit-test directories and are not validation evidence.

Known limitations: manual model adapter, editable scaffolds rather than autonomous creative search, finite failure vocabulary, no rendering/GPU/perceptual measurement, declared rather than enforced budgets, operator-attested Human input, heuristic routing, no adversarial integrity, no resume/recovery of partial failed initialization, no cross-process transactions. If pair creation partially fails, preserve its folder and use a new ID; never clean historical output to retry. No separate build/typecheck/linter is installed because this is plain dependency-free ESM; syntax/contracts and Node tests are the executable checks.

## Evidence boundary

This candidate derives from the canonical [Premium Edge Foundation](../../../docs/ALFA_PREMIUM_EDGE_FOUNDATION_v0.1.md), [Human Experience Governor](../../../docs/ALFA_HUMAN_EXPERIENCE_GOVERNOR_v0.1.md), [Experiment Evidence](../../../docs/ALFA_EXPERIMENT_EVIDENCE_2026-10-03.md) and [Refactor Direction](../../../docs/ALFA_GI_VISUAL_LAB_REFACTOR_DIRECTION_v0.1.md). Those files and all historical research/experiments remain untouched.

Engineering plumbing can be verified now. Creative benefit, useful ambition without convergence, preserved agency/spectacle during repair, cross-domain transfer and weaker/cheaper-model contribution remain hypotheses for independent baseline/guided experiments and Human Review.
