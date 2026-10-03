import { mkdirSync, existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { candidateRoot, loadCatalog } from './catalog.mjs';
import { activeContext, prompt } from './context.mjs';
import { validate } from './validation.mjs';
import { readJson, json, digest, hash, inside, noLinks, writeNew, treeFiles, manifest } from './io.mjs';

export const defaultRunsRoot = resolve(candidateRoot, '../../../experiments/alfa-gi-visual-lab-v0.1/runs');
const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const folders = ['artifact', 'logs', 'verification', 'trace', 'evidence', 'predictions', 'human-review'];
const sharedFields = ['brief', 'projectTruth', 'experiencePromise', 'model', 'permissions', 'budget', 'evaluation'];
export const commonInput = intake => Object.fromEntries(sharedFields.map(key => [key, intake[key]]));
function safeId(id) { if (!idPattern.test(id)) throw new Error('Invalid record/run ID'); return id; }
function independent(root, source) {
  noLinks(root); noLinks(source);
  if (resolve(root) === resolve(source) || inside(source, root) || inside(root, source)) throw new Error('Run root overlaps canonical candidate');
}
function envelope(record) { return { record, digest: digest(record) }; }
function records(run, folder) {
  noLinks(join(run, folder));
  return readdirSync(join(run, folder)).filter(x => x.endsWith('.json') && x !== 'PENDING.json').sort().map(x => {
    noLinks(join(run, folder, x));
    const data = readJson(join(run, folder, x));
    if (data.digest !== digest(data.record)) throw new Error(`Record digest mismatch: ${folder}/${x}`);
    return data.record;
  });
}

export function initRun(intake, { runsRoot = defaultRunsRoot, sourceRoot = candidateRoot } = {}) {
  validate('intake', intake); safeId(intake.experimentId);
  if (intake.projectTruth.blocked) throw new Error('Project Truth is blocked; resolve missing evidence before generation');
  independent(runsRoot, sourceRoot);
  const catalog = loadCatalog(sourceRoot), context = activeContext(intake, catalog);
  const run = resolve(runsRoot, intake.experimentId);
  if (!inside(runsRoot, run)) throw new Error('Run path escapes root');
  noLinks(run);
  // Validate everything before creating an exclusive run. Never reset old output.
  const sourceFiles = intake.condition === 'guided' ? treeFiles(sourceRoot).filter(x => /^(src\/|schemas\/|knowledge\/|governance.json$|package.json$)/.test(x.path)) : [];
  mkdirSync(runsRoot, { recursive: true }); mkdirSync(run);
  folders.forEach(folder => mkdirSync(join(run, folder)));
  writeNew(run, 'intake.json', json(intake));
  writeNew(run, 'active-context.json', json(context));
  writeNew(run, 'prompt.md', prompt(intake, context));
  writeNew(run, 'human-review/PENDING.json', json({ status: 'HUMAN REVIEW PENDING', verdicts: null, instruction: 'Freeze an actual artifact and prediction before explicit human input. Never fill with model predictions.' }));
  for (const file of sourceFiles) writeNew(run, `snapshot/${file.path}`, file.bytes);
  const runInfo = {
    schemaVersion: '0.1.0', experimentId: intake.experimentId, condition: intake.condition,
    candidateVersion: intake.candidateVersion, createdAt: new Date().toISOString(),
    commonInputDigest: digest(commonInput(intake)),
    snapshot: intake.condition === 'guided' ? 'snapshot/' : null,
    execution: 'MANUAL MODEL ADAPTER / NO MODEL INVOCATION',
    permissions: 'DECLARED ONLY; OS/MODEL TOOL SANDBOX REQUIRED',
    evidenceBoundary: 'Engineering plumbing is not ALFA performance or Human validation.'
  };
  writeNew(run, 'run.json', json(runInfo));
  const sealedFiles = ['intake.json', 'active-context.json', 'prompt.md', 'run.json', 'human-review/PENDING.json'];
  writeNew(run, 'seal.json', json({ files: Object.fromEntries(sealedFiles.map(path => [path, hash(readFileSync(join(run, path)))])), snapshot: Object.fromEntries(sourceFiles.map(x => [x.path, hash(x.bytes)])) }));
  return run;
}

export function initPair(intake, options = {}) {
  validate('intake', intake);
  if (intake.condition !== 'guided') throw new Error('Pair template must be guided');
  // Suffixes must fit the same path-safe ID contract.
  const baseline = { ...structuredClone(intake), experimentId: `${intake.experimentId}-baseline`, condition: 'baseline', selectedMechanismIds: [], failureIds: [] };
  const guided = { ...structuredClone(intake), experimentId: `${intake.experimentId}-guided` };
  validate('intake', baseline); validate('intake', guided);
  activeContext(baseline); activeContext(guided);
  const runsRoot = options.runsRoot ?? defaultRunsRoot;
  for (const input of [baseline, guided]) if (existsSync(join(runsRoot, input.experimentId))) throw new Error('Pair target already exists; use new IDs');
  return { baseline: initRun(baseline, options), guided: initRun(guided, options) };
}

export function verifyRun(run) {
  noLinks(run);
  const seal = readJson(join(run, 'seal.json'));
  for (const path of ['intake.json', 'active-context.json', 'prompt.md', 'run.json', 'human-review/PENDING.json']) if (!Object.hasOwn(seal.files ?? {}, path)) throw new Error(`Missing seal entry: ${path}`);
  const intake = validate('intake', readJson(join(run, 'intake.json')));
  const context = validate('activeContext', readJson(join(run, 'active-context.json')));
  const info = readJson(join(run, 'run.json'));
  if (info.experimentId !== intake.experimentId || info.condition !== intake.condition || context.condition !== intake.condition) throw new Error('Run metadata disagrees with intake');
  for (const [path, expected] of Object.entries(seal.files)) {
    if (!inside(run, resolve(run, path))) throw new Error('Invalid sealed path');
    noLinks(join(run, path));
    if (hash(readFileSync(join(run, path))) !== expected) throw new Error(`Sealed input changed: ${path}`);
  }
  if (info.commonInputDigest !== digest(commonInput(intake))) throw new Error('Common inputs changed');
  if (intake.condition === 'guided') {
    if (JSON.stringify(manifest(join(run, 'snapshot'))) !== JSON.stringify(seal.snapshot)) throw new Error('Candidate snapshot changed');
    const reconstructed = activeContext(intake, loadCatalog(join(run, 'snapshot')));
    if (digest(reconstructed) !== digest(context) || prompt(intake, context) !== readFileSync(join(run, 'prompt.md'), 'utf8')) throw new Error('Context/prompt inconsistent with snapshot');
  } else if (context.mechanisms.length || context.instructions.length || existsSync(join(run, 'snapshot')) || prompt(intake, context) !== readFileSync(join(run, 'prompt.md'), 'utf8')) throw new Error('Baseline contaminated by guidance');
  for (const record of records(run, 'trace')) validate('trace', record);
  for (const record of records(run, 'evidence')) validate('evidence', record);
  const reviews = records(run, 'human-review');
  for (const record of reviews) {
    validate('humanReview', record.review);
    if (record.inputOrigin !== 'EXPLICIT HUMAN INPUT — OPERATOR ATTESTED') throw new Error('Human input origin missing');
  }
  const freezePath = join(run, 'predictions/FROZEN.json');
  if (reviews.length && !existsSync(freezePath)) throw new Error('Human Review without frozen prediction');
  if (existsSync(freezePath)) {
    noLinks(freezePath);
    const freeze = readJson(freezePath);
    if (freeze.digest !== digest(freeze.record)) throw new Error('Prediction digest changed');
    validate('prediction', freeze.record.prediction);
    for (const record of reviews) if (record.predictionDigest !== freeze.digest) throw new Error('Human Review is bound to a different prediction');
    if (JSON.stringify(manifest(join(run, 'artifact'))) !== JSON.stringify(freeze.record.artifactManifest)) throw new Error('Artifact changed after pre-review freeze');
  }
  return { status: 'INTEGRITY PASS', experimentId: intake.experimentId, condition: intake.condition, humanReview: records(run, 'human-review').length ? 'EXPLICIT HUMAN INPUT RECORDED' : 'PENDING', evidenceBoundary: 'Not a quality verdict; hashes detect accidental edits, not adversarial tampering.' };
}

export function addTrace(run, trace) {
  verifyRun(run); validate('trace', trace); safeId(trace.id);
  const context = readJson(join(run, 'active-context.json'));
  if (trace.origin === 'ALFA KNOWLEDGE' && !context.mechanisms.some(x => x.id === trace.mechanismId)) throw new Error('Trace knowledge was not activated in this run');
  if (trace.origin !== 'ALFA KNOWLEDGE' && trace.mechanismId !== 'NONE') throw new Error('Native/unchanged decisions use mechanismId NONE');
  writeNew(run, `trace/${trace.id}.json`, json(envelope(trace)));
  return trace;
}

export function addEvidence(run, evidence, { explicitHumanInput = false } = {}) {
  verifyRun(run); validate('evidence', evidence); safeId(evidence.id); safeId(evidence.eventId);
  if (!existsSync(join(run, 'trace', `${evidence.eventId}.json`))) throw new Error('Evidence must link an existing decision trace');
  if ((evidence.label === 'HUMAN VERDICT') !== (evidence.authority === 'HUMAN')) throw new Error('Human label/authority must agree');
  if (evidence.authority === 'HUMAN' && (!explicitHumanInput || !records(run, 'human-review').length)) throw new Error('Human evidence requires explicit recorded human input');
  if (evidence.authority === 'HUMAN' && !records(run, 'human-review').some(x => evidence.source === `human-review/${x.id}.json`)) throw new Error('Human evidence source must name its recorded review');
  if (evidence.label === 'TECHNICAL EVIDENCE' && evidence.authority !== 'TEST') throw new Error('Technical evidence needs TEST authority');
  if (evidence.contribution === 'CONTROLLED COMPARISON') throw new Error('v0.1 does not certify controlled contribution; use a separate human/governance audit');
  writeNew(run, `evidence/${evidence.id}.json`, json(envelope(evidence)));
  return evidence;
}

export function freezePrediction(run, prediction) {
  verifyRun(run); validate('prediction', prediction);
  if (records(run, 'human-review').length) throw new Error('Cannot freeze a new prediction after Human Review');
  const context = readJson(join(run, 'active-context.json'));
  for (const id of prediction.activeKnowledgeIds) if (!context.mechanisms.some(x => x.id === id)) throw new Error(`Prediction references inactive knowledge: ${id}`);
  const artifactManifest = manifest(join(run, 'artifact'));
  if (!Object.keys(artifactManifest).length) throw new Error('An actual artifact is required before freezing');
  const record = { prediction, frozenAt: new Date().toISOString(), artifactManifest };
  writeNew(run, 'predictions/FROZEN.json', json(envelope(record)));
  return record;
}

export function addHumanReview(run, id, review, { explicitHumanInput = false } = {}) {
  if (!explicitHumanInput) throw new Error('No automatic Human Verdict generation');
  verifyRun(run); safeId(id); validate('humanReview', review);
  if (!existsSync(join(run, 'predictions/FROZEN.json'))) throw new Error('Freeze artifact and prediction before Human Review');
  const record = { id, inputOrigin: 'EXPLICIT HUMAN INPUT — OPERATOR ATTESTED', review, receivedAt: new Date().toISOString(), predictionDigest: readJson(join(run, 'predictions/FROZEN.json')).digest };
  writeNew(run, `human-review/${id}.json`, json(envelope(record)));
  return record;
}

export function comparePair(baseline, guided) {
  const verification = [verifyRun(baseline), verifyRun(guided)];
  const a = readJson(join(baseline, 'intake.json')), b = readJson(join(guided, 'intake.json'));
  if (a.condition !== 'baseline' || b.condition !== 'guided') throw new Error('Expected baseline then guided');
  if (digest(commonInput(a)) !== digest(commonInput(b))) throw new Error('Mismatched model/settings/brief/permissions/budget/evaluation');
  const arm = run => ({ trace: records(run, 'trace'), evidence: records(run, 'evidence'), prediction: existsSync(join(run, 'predictions/FROZEN.json')) ? readJson(join(run, 'predictions/FROZEN.json')).record.prediction : null, humanReview: records(run, 'human-review') });
  return { status: 'COMPARABLE DECLARED INPUTS / CONTRIBUTION NOT PROVEN', verification, baseline: arm(baseline), guided: arm(guided), next: 'Compare frozen predictions with actual evaluator verdicts; retain disagreements. Audit actual execution budgets, model settings, order and contamination before attributing contribution. No numeric Premium score.' };
}

export function reviewPackage(run) {
  verifyRun(run);
  if (!existsSync(join(run, 'predictions/FROZEN.json'))) throw new Error('Freeze artifact and prediction before preparing Human Review');
  const frozen = readJson(join(run, 'predictions/FROZEN.json')).record;
  const context = readJson(join(run, 'active-context.json'));
  const catalog = loadCatalog(context.condition === 'guided' ? join(run, 'snapshot') : candidateRoot);
  return {
    status: 'HUMAN REVIEW PENDING', artifactDirectory: join(run, 'artifact'), artifactManifest: frozen.artifactManifest,
    questions: catalog.governance.humanDimensions, verdicts: null,
    instruction: 'Show artifact before rationale or prediction. Operator must anonymize arm/path/model if using blind review; this package alone cannot guarantee blindness. Record device/input/order/prior knowledge and actual evaluator words.',
    predictionHandling: 'Prediction stays frozen in the operator ledger; do not show it before first reaction.'
  };
}
