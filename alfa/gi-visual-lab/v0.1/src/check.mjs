import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { candidateRoot, loadCatalog } from './catalog.mjs';

let failed = false;
for (const file of readdirSync(join(candidateRoot, 'src')).filter(x => x.endsWith('.mjs'))) {
  const result = spawnSync(process.execPath, ['--check', join(candidateRoot, 'src', file)], { encoding: 'utf8' });
  if (result.status !== 0) { failed = true; process.stderr.write(result.stderr || String(result.error)); }
}
const packageInfo = JSON.parse(readFileSync(join(candidateRoot, 'package.json'), 'utf8'));
const catalog = loadCatalog();
if (packageInfo.version !== catalog.governance.version) throw new Error('Version mismatch');
if (failed) process.exitCode = 1;
else process.stdout.write(`Syntax + contracts PASS: v${packageInfo.version}, ${catalog.units.length} knowledge units\n`);
