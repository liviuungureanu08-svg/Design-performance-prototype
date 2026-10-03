import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson } from './io.mjs';
import { validate, contracts } from './validation.mjs';

export const candidateRoot = fileURLToPath(new URL('../', import.meta.url));
export function loadCatalog(root = candidateRoot) {
  const governance = readJson(join(root, 'governance.json'));
  if (governance.version !== '0.1.0' || governance.status !== 'CANDIDATE / NOT CORE / TO VALIDATE') throw new Error('Unsupported governance version/status');
  if (!Number.isInteger(governance.patch) || governance.patch < 0) throw new Error('Invalid patch');
  for (const phase of contracts.$defs.intake.properties.phase.enum) {
    if (!Array.isArray(governance.phases[phase]) || !governance.phases[phase].length || governance.phases[phase].some(x => typeof x !== 'string' || !x.trim())) throw new Error(`Missing instructions: ${phase}`);
  }
  const expected = Object.keys(contracts.$defs.humanReview.properties.verdicts.properties);
  if (JSON.stringify(governance.humanDimensions) !== JSON.stringify(expected)) throw new Error('Human dimensions disagree with schema');
  if (!Array.isArray(governance.authority) || !governance.authority.length) throw new Error('Missing authority boundaries');
  const units = readdirSync(join(root, 'knowledge')).filter(x => x.endsWith('.json')).sort().map(x => validate('mechanism', readJson(join(root, 'knowledge', x))));
  if (!units.length || new Set(units.map(x => x.id)).size !== units.length) throw new Error('Empty/duplicate knowledge IDs');
  return { governance, units };
}

// Greedy coverage selects the smallest relevant set up to a hard cap. Ranking
// is routing priority, never a design-quality or Premium score.
export function route(intake, catalog = loadCatalog()) {
  validate('intake', intake);
  const byId = new Map(catalog.units.map(x => [x.id, x]));
  for (const id of intake.selectedMechanismIds) if (!byId.has(id)) throw new Error(`Unknown mechanism: ${id}`);
  if (intake.condition === 'baseline') {
    if (intake.selectedMechanismIds.length || intake.failureIds.length) throw new Error('Baseline cannot activate ALFA knowledge/failures');
    return { selected: [], deferred: [], reasons: [] };
  }
  if (intake.selectedMechanismIds.length > intake.maxMechanisms) throw new Error('Explicit selection exceeds context cap');
  const selected = intake.selectedMechanismIds.map(id => byId.get(id));
  if (selected.some(x => !x.routing.phases.includes(intake.phase))) throw new Error('Mechanism unavailable in this phase; protect search before activation');
  const reasons = selected.map(x => ({ mechanismId: x.id, reason: `Explicit selection for: ${intake.uncertainty}`, decisionStatus: 'NOT YET OBSERVED' }));
  const failures = new Set(intake.failureIds), features = new Set(intake.features);
  const cover = unit => { unit.routing.failures.forEach(x => failures.delete(x)); unit.routing.features.forEach(x => features.delete(x)); };
  selected.forEach(cover);
  const eligible = catalog.units.filter(x => x.routing.phases.includes(intake.phase) && !selected.includes(x));
  const priority = unit => unit.routing.failures.filter(x => failures.has(x)).length * 100 + unit.routing.features.filter(x => features.has(x)).length;
  while (selected.length < intake.maxMechanisms) {
    const next = eligible.filter(x => !selected.includes(x)).sort((a, b) => priority(b) - priority(a) || a.id.localeCompare(b.id))[0];
    if (!next || !priority(next)) break;
    const matched = [...next.routing.failures.filter(x => failures.has(x)), ...next.routing.features.filter(x => features.has(x))];
    selected.push(next); cover(next);
    reasons.push({ mechanismId: next.id, reason: `Routes ${matched.join(', ')}; uncertainty: ${intake.uncertainty}`, decisionStatus: 'NOT YET OBSERVED' });
  }
  const deferred = eligible.filter(x => !selected.includes(x) && priority(x) > 0).map(x => x.id);
  return { selected, deferred, reasons };
}
