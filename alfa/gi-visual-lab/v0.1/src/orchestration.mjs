import { validate } from './validation.mjs';

// An editable work-product scaffold, not invented Project Truth or a selected
// creative concept. A model/operator fills this before sealing generation input.
export function prepareProject(truth) {
  validate('truth', truth);
  return {
    status: truth.blocked ? 'BLOCKED / RESOLVE TRUTH' : 'DRAFT / MODEL OR OPERATOR TO COMPLETE',
    projectTruth: structuredClone(truth),
    experiencePromise: {
      feel: null, understand: null, canDo: null,
      supportingFactSources: truth.facts.map(x => x.source),
      instruction: 'Fill feel/understand/canDo using supplied facts and audience needs; expose invented assumptions. Distill into intake.experiencePromise only after checking relevance.'
    },
    conceptSearch: {
      modelNativeAlternatives: [], structurallyDistinctCandidates: [],
      candidateShape: { name: null, projectRelevance: null, representation: null, userAgency: null, temporalDriver: null, signatureSystem: null, uncertainty: null },
      instruction: 'Generate distinct structural families before criticism. Retain native alternatives; record what changed beyond palette/effect swaps. Quiet and expansive concepts remain eligible.'
    },
    signatureDecision: { selectedConcept: null, rationale: null, logoSwap: null, industrySwap: null, effectSwap: null, removeAsset: null, preserveInvariants: [] },
    repairGate: { reproducedFailureSource: null, beforeSource: null, afterSource: null, defectReduced: 'TO VALIDATE', valuePreserved: 'TO VALIDATE', unresolvedRisks: [] },
    stopGate: { nextDecision: null, minimumSufficientTest: null, requiresHumanAuthority: null, stopReason: null },
    instruction: 'Do not equate a filled worksheet or process compliance with artifact quality or ALFA contribution. No automatic learning or promotion.'
  };
}
