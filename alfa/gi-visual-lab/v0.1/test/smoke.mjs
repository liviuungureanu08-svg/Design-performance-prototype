import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { candidateRoot } from '../src/catalog.mjs';
import { writeNew, json } from '../src/io.mjs';

// One persistent tiny synthetic run. No model, browser or Human is invoked.
// Re-running intentionally fails rather than overwriting existing evidence.
const cli = join(candidateRoot, 'src/cli.mjs');
function command(...args) {
  const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || String(result.error));
  return JSON.parse(result.stdout);
}
const example = file => join(candidateRoot, 'examples', file);
const { run } = command('init', example('intake.json'));
const id = 'synthetic-plumbing';
writeNew(run, 'artifact/fixture.txt', 'Synthetic plumbing fixture only. Native document input and environment response remain distinct. No rendered motion or Human quality assessed.\n');
writeNew(run, 'logs/smoke.json', json({ type: 'SYNTHETIC PLUMBING', modelInvoked: false, humanReviewPerformed: false }));
command('trace', id, example('trace.json'));
command('freeze-prediction', id, example('prediction.json'));
command('evidence', id, example('evidence.json'));
const verification = command('verify-run', id);
writeNew(run, 'verification/plumbing.json', json(verification));
process.stdout.write(json({ run, ...verification, boundary: 'No ALFA performance, Human validation or weaker-model evidence.' }));
