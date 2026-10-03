import { loadCatalog } from './catalog.mjs';
import { validate } from './validation.mjs';

const transitionFailures = new Set(['state-skipping', 'flashing', 'timeline-mismatch', 'abrupt-settle']);
export function diagnose(record, intake, catalog = loadCatalog()) {
  validate('diagnostic', record); validate('intake', intake);
  if (intake.condition !== 'guided') throw new Error('Do not deliver HEG guidance to baseline');
  return {
    status: 'DIAGNOSTIC GUIDANCE / NOT A HUMAN VERDICT',
    technicalPerformance: 'NOT MEASURED BY THIS GOVERNOR',
    perceptualContinuity: 'TO VALIDATE IN ACTUAL RENDERING',
    premium: 'HUMAN REVIEW PENDING',
    repairs: record.observations.map(observation => {
      const units = catalog.units.filter(x => x.routing.failures.includes(observation.failureId));
      return {
        observation, capability: transitionFailures.has(observation.failureId) ? 'HEG / TEG' : 'HEG',
        knowledgeIds: units.map(x => x.id),
        tests: [...new Set(units.flatMap(x => x.tests))],
        repairStrategy: [...new Set(units.flatMap(x => x.repairStrategy))],
        preserveInvariants: [...new Set([...intake.preserveInvariants, ...units.flatMap(x => x.preserveInvariants)])],
        decisionGate: ['Capture reproduced BEFORE with source and invariant.', 'Try one targeted repair; keep native document controls.', 'Capture identical AFTER scenario.', 'Record DEFECT REDUCED and VALUE PRESERVED separately, with evidence or TO VALIDATE.', 'If impact or agency declined, preserve the contradiction and reconsider repair; Human owns final experience quality.']
      };
    }),
    stop: 'Stop low-information polishing. Do not promote knowledge or certify quality automatically.'
  };
}
