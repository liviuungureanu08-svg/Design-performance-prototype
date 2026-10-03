import { loadCatalog, route } from './catalog.mjs';
import { validate } from './validation.mjs';

export function activeContext(intake, catalog = loadCatalog()) {
  const routed = route(intake, catalog);
  return validate('activeContext', {
    schemaVersion: '0.1.0', status: 'CANDIDATE / NOT CORE / TO VALIDATE',
    condition: intake.condition, phase: intake.phase,
    projectTruth: structuredClone(intake.projectTruth), experiencePromise: intake.experiencePromise,
    uncertainty: intake.uncertainty, constraints: [...intake.projectTruth.constraints],
    humanDecisions: [...intake.humanDecisions], preserveInvariants: [...intake.preserveInvariants],
    mechanisms: structuredClone(routed.selected), activations: routed.reasons,
    deferredIds: routed.deferred, activeTests: [...new Set(routed.selected.flatMap(x => x.tests))],
    instructions: intake.condition === 'baseline' ? [] : [...catalog.governance.phases[intake.phase], ...catalog.governance.authority]
  });
}

export function prompt(intake, context) {
  // Shared task is identical for both arms. Baseline receives no ALFA guidance.
  const shared = {
    brief: intake.brief, projectTruth: intake.projectTruth, experiencePromise: intake.experiencePromise,
    model: intake.model, permissions: intake.permissions, budget: intake.budget, evaluation: intake.evaluation
  };
  let output = `TASK INPUT\n${JSON.stringify(shared, null, 2)}\n`;
  if (intake.condition === 'guided') output += `\nGI + VISUAL LAB v0.1 — CANDIDATE, NOT CORE\n${JSON.stringify(context, null, 2)}\n`;
  return output;
}

export function phasePlan(intake, catalog = loadCatalog()) {
  validate('intake', intake);
  if (intake.condition === 'baseline') return [];
  return Object.entries(catalog.governance.phases).map(([phase, instructions]) => ({ phase, instructions }));
}
