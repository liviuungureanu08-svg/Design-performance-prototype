import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, cpSync, writeFileSync, readFileSync, mkdirSync, symlinkSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { contracts, validate, checkContracts } from '../src/validation.mjs';
import { candidateRoot, loadCatalog, route } from '../src/catalog.mjs';
import { activeContext, phasePlan, prompt } from '../src/context.mjs';
import { diagnose } from '../src/governor.mjs';
import { prepareProject } from '../src/orchestration.mjs';
import { json, readJson, manifest, writeNew, inside, digest } from '../src/io.mjs';
import { initRun, initPair, verifyRun, addTrace, addEvidence, freezePrediction, addHumanReview, comparePair, reviewPackage } from '../src/experiments.mjs';

const input = () => readJson(join(candidateRoot, 'examples/intake.json'));
const trace = () => readJson(join(candidateRoot, 'examples/trace.json'));
const evidence = () => readJson(join(candidateRoot, 'examples/evidence.json'));
const prediction = () => readJson(join(candidateRoot, 'examples/prediction.json'));
function space(t) {
  const root = mkdtempSync(join(tmpdir(), 'alfa-v01-test-'));
  t.after(() => {
    // Only remove this test's freshly allocated absolute temporary directory.
    assert.ok(inside(tmpdir(), root)); assert.match(root.split(/[\\/]/).at(-1), /^alfa-v01-test-/);
    rmSync(root, { recursive: true, force: true });
  });
  return { root, runsRoot: join(root, 'runs') };
}
function runFixture(t) { const options = space(t); return { ...options, run: initRun(input(), options) }; }
function addArtifact(run) { writeNew(run, 'artifact/fixture.txt', 'Synthetic plumbing fixture; not a generated premium artifact.\n'); }
function humanFixture() {
  return { evaluator: 'SYNTHETIC TEST ONLY', reviewedAt: '2026-10-03', device: 'TEST DEVICE', input: 'TEST INPUT', order: 'TEST ORDER', blind: 'NONBLIND', verdicts: Object.fromEntries(Object.keys(contracts.$defs.humanReview.properties.verdicts.properties).map(x => [x, 'SYNTHETIC — NOT AN ACTUAL HUMAN VERDICT'])), limitations: ['Unit-test simulation only; never export as research evidence.'] };
}

test('contracts are internally resolvable and fail closed on unsupported extensions', () => {
  assert.equal(checkContracts(), true);
  assert.throws(() => checkContracts({ ...contracts, anyOf: [] }), /Unsupported/);
  assert.throws(() => checkContracts({ ...contracts, $ref: '#/$defs/missing' }), /Unresolved/);
  const catalog = loadCatalog(); assert.equal(catalog.units.length, 6);
  for (const unit of catalog.units) {
    assert.equal(validate('mechanism', unit), unit);
    for (const key of ['implementationPattern', 'failureModes', 'tests', 'repairStrategy', 'preserveInvariants', 'provenance']) assert.ok(unit[key].length, `${unit.id}.${key}`);
  }
});

test('intake rejects invalid Truth, unknown fields/IDs, invalid budget and traversal', () => {
  for (const mutate of [x => delete x.projectTruth.facts, x => x.projectTruth.facts = [], x => x.projectTruth.name = ' ', x => x.projectTruth.extra = 'bad', x => x.budget.tokens = 0, x => x.experimentId = '../escape', x => x.projectTruth.toString = 'unexpected', x => x.features.push('style-preset')]) {
    const value = input(); mutate(value); assert.throws(() => validate('intake', value));
  }
  assert.throws(() => route({ ...input(), selectedMechanismIds: ['VL-99'] }), /Unknown mechanism/);
});

test('routing is deterministic, coverage-minimal, capped and does not mutate inputs', () => {
  const value = input(), before = structuredClone(value);
  const result = route(value);
  assert.deepEqual(result.selected.map(x => x.id), ['VL-01']);
  assert.deepEqual(route(value), result); assert.deepEqual(value, before);
  const capped = route({ ...value, features: ['scroll', 'pointer', 'motion', 'agency'], maxMechanisms: 1 });
  assert.equal(capped.selected.length, 1); assert.ok(capped.deferred.length);
  const targeted = route({ ...value, failureIds: ['flashing'], features: [] });
  assert.deepEqual(targeted.selected.map(x => x.id), ['VL-04']);
  assert.throws(() => route({ ...value, selectedMechanismIds: ['VL-01', 'VL-02', 'VL-03'] }), /cap/);
});

test('early creative search stays free of mechanisms; phase plan protects ambition and native alternatives', () => {
  const prepared = prepareProject(input().projectTruth);
  assert.equal(prepared.experiencePromise.feel, null);
  assert.equal(prepared.signatureDecision.selectedConcept, null);
  assert.equal(prepared.repairGate.valuePreserved, 'TO VALIDATE');
  assert.equal(prepareProject({ ...input().projectTruth, blocked: true }).status, 'BLOCKED / RESOLVE TRUTH');
  for (const phase of ['frame', 'promise', 'ambition', 'search', 'signature']) {
    const context = activeContext({ ...input(), phase });
    assert.equal(context.mechanisms.length, 0); assert.ok(context.instructions.length);
  }
  assert.throws(() => activeContext({ ...input(), phase: 'ambition', selectedMechanismIds: ['VL-01'] }), /unavailable/);
  assert.equal(phasePlan(input()).length, 11);
  assert.match(phasePlan(input()).find(x => x.phase === 'ambition').instructions.join(' '), /model-native/);
  const context = activeContext(input()); context.projectTruth.name = 'changed'; assert.notEqual(input().projectTruth.name, context.projectTruth.name);
});

test('baseline prompt contains only byte-equivalent common task, no candidate mechanism or phase rules', () => {
  const baseline = { ...input(), condition: 'baseline' };
  const context = activeContext(baseline), text = prompt(baseline, context);
  assert.equal(context.mechanisms.length, 0); assert.equal(context.instructions.length, 0);
  assert.equal(phasePlan(baseline).length, 0);
  assert.ok(prompt(input(), activeContext(input())).startsWith(text));
  assert.doesNotMatch(text, /VL-01|ALFA KNOWLEDGE|Human Authority owns|Explore before criticism/);
  assert.throws(() => activeContext({ ...baseline, selectedMechanismIds: ['VL-01'] }), /Baseline/);
  assert.throws(() => activeContext({ ...baseline, failureIds: ['flashing'] }), /Baseline/);
});

test('HEG/TEG returns reproducible failure-specific tests and repairs, never scores or Human Verdicts', () => {
  const result = diagnose(readJson(join(candidateRoot, 'examples/observations.json')), input());
  assert.equal(result.repairs[0].capability, 'HEG / TEG');
  assert.ok(result.repairs[0].knowledgeIds.includes('VL-04'));
  assert.ok(result.repairs[0].tests.length && result.repairs[0].repairStrategy.length);
  assert.match(result.repairs[0].decisionGate.join(' '), /DEFECT REDUCED and VALUE PRESERVED/);
  assert.equal(result.premium, 'HUMAN REVIEW PENDING');
  assert.match(result.technicalPerformance, /NOT MEASURED/);
  assert.throws(() => diagnose({ observations: [{ failureId: 'invented' }] }, input()));
  assert.throws(() => diagnose({ observations: [] }, input()));
  assert.throws(() => diagnose(readJson(join(candidateRoot, 'examples/observations.json')), { ...input(), condition: 'baseline' }), /baseline/);
});

test('isolated runs snapshot source independently, leave source unchanged and refuse overwrites', t => {
  const before = manifest(candidateRoot), { run, runsRoot } = runFixture(t);
  assert.deepEqual(manifest(candidateRoot), before);
  assert.equal(verifyRun(run).status, 'INTEGRITY PASS');
  assert.equal(readJson(join(run, 'human-review/PENDING.json')).verdicts, null);
  assert.ok(existsSync(join(run, 'snapshot/knowledge/VL-01.json')));
  assert.throws(() => initRun(input(), { runsRoot }), /EEXIST/);
  const artifactBefore = manifest(candidateRoot); addArtifact(run);
  assert.deepEqual(manifest(candidateRoot), artifactBefore);
});

test('run boundaries reject source overlap, blocked Truth, escaped paths and redirect junctions', t => {
  const options = space(t);
  assert.throws(() => initRun(input(), { runsRoot: join(candidateRoot, 'runs') }), /overlaps/);
  assert.throws(() => initRun(input(), { runsRoot: resolve(candidateRoot, '..') }), /overlaps/);
  const blocked = input(); blocked.projectTruth.blocked = true;
  assert.throws(() => initRun(blocked, options), /blocked/);
  assert.equal(existsSync(options.runsRoot), false);
  assert.throws(() => writeNew(options.root, '../escaped.txt', 'bad'), /escapes/);
  assert.throws(() => writeNew(options.root, '.', 'bad'), /escapes/);
  const actual = join(options.root, 'actual'); mkdirSync(actual);
  const link = join(options.root, 'redirect'); symlinkSync(actual, link, process.platform === 'win32' ? 'junction' : 'dir');
  assert.throws(() => initRun(input(), { runsRoot: join(link, 'runs') }), /Links/);
  assert.throws(() => writeNew(options.root, 'redirect/bad.txt', 'bad'), /Links/);
});

test('snapshot remains valid after future canonical edits; snapshot or sealed input changes are detected', t => {
  const options = space(t), sourceRoot = join(options.root, 'candidate');
  cpSync(candidateRoot, sourceRoot, { recursive: true });
  const run = initRun(input(), { ...options, sourceRoot });
  const unit = readJson(join(sourceRoot, 'knowledge/VL-01.json')); unit.why = 'Future candidate edit';
  writeFileSync(join(sourceRoot, 'knowledge/VL-01.json'), json(unit));
  assert.equal(verifyRun(run).status, 'INTEGRITY PASS');
  writeFileSync(join(run, 'snapshot/knowledge/VL-01.json'), json(unit));
  assert.throws(() => verifyRun(run), /snapshot changed/);
  const second = initRun({ ...input(), experimentId: 'second' }, options);
  writeFileSync(join(second, 'prompt.md'), 'tampered');
  assert.throws(() => verifyRun(second), /Sealed input changed/);
});

test('trace and evidence are write-once, linked and authority-limited', t => {
  const { run } = runFixture(t);
  assert.throws(() => addEvidence(run, evidence()), /existing decision trace/);
  assert.throws(() => addTrace(run, { ...trace(), mechanismId: 'VL-02' }), /not activated/);
  addTrace(run, trace()); addEvidence(run, evidence());
  assert.throws(() => addTrace(run, trace()), /EEXIST/);
  assert.throws(() => addEvidence(run, evidence()), /EEXIST/);
  assert.throws(() => addTrace(run, { ...trace(), id: '../bad' }), /Invalid/);
  assert.throws(() => addEvidence(run, { ...evidence(), id: 'human', label: 'HUMAN VERDICT', authority: 'MODEL' }), /agree/);
  assert.throws(() => addEvidence(run, { ...evidence(), id: 'human', label: 'HUMAN VERDICT', authority: 'HUMAN' }), /explicit/);
  assert.throws(() => addEvidence(run, { ...evidence(), id: 'bad', authority: 'MODEL' }), /TEST/);
  assert.throws(() => addEvidence(run, { ...evidence(), id: 'bad', contribution: 'CONTROLLED COMPARISON' }), /does not certify/);
  addTrace(run, { ...trace(), id: 'native', origin: 'MODEL NATIVE', mechanismId: 'NONE' });
  assert.equal(verifyRun(run).humanReview, 'PENDING');
});

test('prediction cannot certify Human quality, requires artifact and freezes before explicit Human Review', t => {
  const { run } = runFixture(t);
  assert.throws(() => freezePrediction(run, prediction()), /artifact/);
  assert.throws(() => addHumanReview(run, 'test-human', humanFixture()), /No automatic/);
  assert.throws(() => addHumanReview(run, 'test-human', humanFixture(), { explicitHumanInput: true }), /Freeze/);
  addArtifact(run);
  assert.throws(() => freezePrediction(run, { ...prediction(), activeKnowledgeIds: ['VL-06'] }), /inactive/);
  freezePrediction(run, prediction()); const frozen = readFileSync(join(run, 'predictions/FROZEN.json'), 'utf8');
  const pack = reviewPackage(run);
  assert.equal(pack.verdicts, null); assert.equal(pack.questions.length, 18);
  assert.equal(Object.hasOwn(pack, 'prediction'), false); assert.equal(Object.hasOwn(pack, 'model'), false);
  assert.throws(() => freezePrediction(run, prediction()), /EEXIST/);
  addHumanReview(run, 'test-human', humanFixture(), { explicitHumanInput: true });
  addTrace(run, trace());
  const humanEvidence = { ...evidence(), id: 'human-test', label: 'HUMAN VERDICT', authority: 'HUMAN', source: 'human-review/test-human.json', claim: 'Synthetic Human-import unit-test only, not actual validation.' };
  assert.throws(() => addEvidence(run, { ...humanEvidence, source: 'invented' }, { explicitHumanInput: true }), /name its recorded/);
  addEvidence(run, humanEvidence, { explicitHumanInput: true });
  assert.equal(readFileSync(join(run, 'predictions/FROZEN.json'), 'utf8'), frozen);
  assert.throws(() => freezePrediction(run, prediction()), /after Human Review/);
  assert.equal(verifyRun(run).humanReview, 'EXPLICIT HUMAN INPUT RECORDED');
  writeFileSync(join(run, 'artifact/fixture.txt'), 'changed after review');
  assert.throws(() => verifyRun(run), /Artifact changed/);
});

test('matched pairs share model/settings/resources/evaluation while outputs and guidance stay independent', t => {
  const options = space(t), pair = initPair(input(), options);
  assert.equal(existsSync(join(pair.baseline, 'snapshot')), false);
  assert.equal(readJson(join(pair.baseline, 'active-context.json')).mechanisms.length, 0);
  assert.ok(readJson(join(pair.guided, 'active-context.json')).mechanisms.length);
  assert.match(comparePair(pair.baseline, pair.guided).status, /NOT PROVEN/);
  addArtifact(pair.guided); assert.equal(Object.keys(manifest(join(pair.baseline, 'artifact'))).length, 0);
  const different = input(); different.experimentId = 'different'; different.model.settings.effort = 'different';
  const mismatch = initRun(different, options);
  assert.throws(() => comparePair(pair.baseline, mismatch), /Mismatched/);
  assert.throws(() => initPair(input(), options), /already exists/);
});

test('CLI smoke handles actual commands, invalid IDs and malformed arguments without generated bulk', () => {
  const cli = join(candidateRoot, 'src/cli.mjs');
  const exec = args => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  assert.equal(exec(['validate']).status, 0);
  const result = exec(['context', join(candidateRoot, 'examples/intake.json')]);
  assert.equal(result.status, 0); assert.equal(JSON.parse(result.stdout).mechanisms[0].id, 'VL-01');
  assert.equal(exec(['plan', join(candidateRoot, 'examples/intake.json')]).status, 0);
  assert.equal(exec(['prepare', join(candidateRoot, 'examples/truth.json')]).status, 0);
  assert.equal(exec(['verify-run', '../escape']).status, 1);
  assert.equal(exec(['context']).status, 1);
  assert.equal(exec(['validate', '--human-input']).status, 1);
});
