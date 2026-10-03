import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readJson, json } from './io.mjs';
import { loadCatalog } from './catalog.mjs';
import { activeContext, phasePlan, prompt } from './context.mjs';
import { diagnose } from './governor.mjs';
import { prepareProject } from './orchestration.mjs';
import { defaultRunsRoot, initRun, initPair, verifyRun, addTrace, addEvidence, freezePrediction, addHumanReview, comparePair, reviewPackage } from './experiments.mjs';

export const usage = `GI + Visual Lab v0.1 candidate (Node >=22; no dependencies)
  node src/cli.mjs validate
  node src/cli.mjs prepare <truth.json>
  node src/cli.mjs context <intake.json>
  node src/cli.mjs prompt <intake.json>
  node src/cli.mjs plan <intake.json>
  node src/cli.mjs init <intake.json>
  node src/cli.mjs pair <guided-intake.json>
  node src/cli.mjs diagnose <run-id> <observations.json>
  node src/cli.mjs trace <run-id> <trace.json>
  node src/cli.mjs evidence <run-id> <evidence.json> [--human-input]
  node src/cli.mjs freeze-prediction <run-id> <prediction.json>
  node src/cli.mjs review-package <run-id>
  node src/cli.mjs human-review <run-id> <review-id> <review.json> --human-input
  node src/cli.mjs verify-run <run-id>
  node src/cli.mjs compare-pair <baseline-id> <guided-id>
Runs are confined to experiments/alfa-gi-visual-lab-v0.1/runs/.
--human-input attests actual human feedback, never a model-written verdict.
No model invocation, automatic learning, Core promotion, commit or push.`;

export function main(argv) {
  const [command, ...raw] = argv;
  const explicitHumanInput = raw.includes('--human-input');
  const args = raw.filter(x => x !== '--human-input');
  if (explicitHumanInput && !['evidence', 'human-review'].includes(command)) throw new Error('Unexpected human-input flag');
  const counts = { validate: 0, prepare: 1, context: 1, prompt: 1, plan: 1, init: 1, pair: 1, diagnose: 2, trace: 2, evidence: 2, 'freeze-prediction': 2, 'review-package': 1, 'human-review': 3, 'verify-run': 1, 'compare-pair': 2 };
  if (!command || command === 'help' || command === '--help') return usage;
  if (!Object.hasOwn(counts, command) || args.length !== counts[command] || args.some(x => x.startsWith('--'))) throw new Error(`Invalid arguments\n${usage}`);
  const runPath = id => {
    if (!/^[a-z][a-z0-9-]{0,63}$/.test(id)) throw new Error('Invalid run ID');
    return join(defaultRunsRoot, id);
  };
  if (command === 'validate') { const catalog = loadCatalog(); return { status: 'CONTRACT PASS', version: catalog.governance.version, units: catalog.units.map(x => x.id) }; }
  if (command === 'prepare') return prepareProject(readJson(resolve(args[0])));
  if (['context', 'prompt', 'plan'].includes(command)) {
    const intake = readJson(resolve(args[0]));
    return command === 'context' ? activeContext(intake) : command === 'plan' ? phasePlan(intake) : prompt(intake, activeContext(intake));
  }
  if (command === 'init' || command === 'pair') return command === 'init' ? { run: initRun(readJson(resolve(args[0]))) } : initPair(readJson(resolve(args[0])));
  const run = runPath(args[0]);
  if (command === 'verify-run') return verifyRun(run);
  if (command === 'review-package') return reviewPackage(run);
  if (command === 'compare-pair') return comparePair(run, runPath(args[1]));
  if (command === 'diagnose') {
    verifyRun(run);
    return diagnose(readJson(resolve(args[1])), readJson(join(run, 'intake.json')), loadCatalog(join(run, 'snapshot')));
  }
  if (command === 'trace') return addTrace(run, readJson(resolve(args[1])));
  if (command === 'evidence') return addEvidence(run, readJson(resolve(args[1])), { explicitHumanInput });
  if (command === 'freeze-prediction') return freezePrediction(run, readJson(resolve(args[1])));
  return addHumanReview(run, args[1], readJson(resolve(args[2])), { explicitHumanInput });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = main(process.argv.slice(2)); process.stdout.write(typeof result === 'string' ? result : json(result)); }
  catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
}
