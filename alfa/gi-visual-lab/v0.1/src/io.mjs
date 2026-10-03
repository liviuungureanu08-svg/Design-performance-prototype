import { lstatSync, readdirSync, readFileSync, writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { resolve, relative, dirname, isAbsolute, join } from 'node:path';
import { createHash } from 'node:crypto';

export const readJson = path => JSON.parse(readFileSync(path, 'utf8'));
export const json = value => JSON.stringify(value, null, 2) + '\n';
export const hash = value => createHash('sha256').update(value).digest('hex');
export const digest = value => hash(json(value));

export function inside(root, target) {
  const rel = relative(resolve(root), resolve(target));
  return rel !== '' && rel !== '..' && !rel.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(rel);
}

export function noLinks(path) {
  const absolute = resolve(path);
  let cursor = absolute;
  while (true) {
    try {
      if (lstatSync(cursor).isSymbolicLink()) throw new Error(`Links/reparse redirects are forbidden: ${cursor}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const parent = dirname(cursor);
    if (parent === cursor) break;
    cursor = parent;
  }
  return absolute;
}

export function writeNew(root, relativePath, content) {
  const target = resolve(root, relativePath);
  if (!inside(root, target)) throw new Error('Output path escapes run root');
  noLinks(target);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, { flag: 'wx' });
}

export function treeFiles(root) {
  noLinks(root);
  const result = [];
  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Snapshot contains link: ${path}`);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) result.push({ path: relative(root, path).split('\\').join('/'), bytes: readFileSync(path) });
      else throw new Error(`Unsupported file: ${path}`);
    }
  }
  walk(realpathSync(root));
  return result;
}

export function manifest(root) {
  return Object.fromEntries(treeFiles(root).map(file => [file.path, hash(file.bytes)]));
}
