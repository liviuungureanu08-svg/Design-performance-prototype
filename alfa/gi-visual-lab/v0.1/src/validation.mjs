import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const contracts = JSON.parse(readFileSync(fileURLToPath(new URL('../schemas/contracts.json', import.meta.url)), 'utf8'));

export function checkContracts(schema = contracts) {
  const keywords = new Set(['$schema', '$id', '$defs', '$ref', 'title', 'description', 'type', 'properties', 'required', 'additionalProperties', 'items', 'minItems', 'maxItems', 'uniqueItems', 'minLength', 'pattern', 'minimum', 'maximum', 'enum']);
  function inspect(node) {
    if (!node || typeof node !== 'object' || Array.isArray(node)) throw new Error('Malformed schema');
    for (const key of Object.keys(node)) if (!keywords.has(key)) throw new Error(`Unsupported schema keyword: ${key}`);
    if (node.$ref && (!node.$ref.startsWith('#/$defs/') || !Object.hasOwn(schema.$defs, node.$ref.slice(8)))) throw new Error(`Unresolved schema reference: ${node.$ref}`);
    if (node.type && !['object', 'array', 'string', 'number', 'integer', 'boolean'].includes(node.type)) throw new Error('Unsupported schema type');
    if (node.pattern) new RegExp(node.pattern);
    for (const key of node.required ?? []) if (!Object.hasOwn(node.properties ?? {}, key)) throw new Error(`Required field absent from schema: ${key}`);
    Object.values(node.$defs ?? {}).forEach(inspect);
    Object.values(node.properties ?? {}).forEach(inspect);
    if (node.items) inspect(node.items);
  }
  inspect(schema);
  return true;
}
checkContracts();

// Deliberately limited to the JSON Schema keywords used by our local contracts.
// No coercion, defaults, network resolution or executable validation hooks.
export function validate(name, value) {
  const root = contracts.$defs[name];
  if (!root) throw new Error(`Unknown contract: ${name}`);
  const errors = [];
  function visit(schema, item, path) {
    if (schema.$ref) return visit(contracts.$defs[schema.$ref.split('/').at(-1)], item, path);
    if (schema.enum && !schema.enum.includes(item)) errors.push(`${path}: expected ${schema.enum.join('|')}`);
    if (schema.type === 'object') {
      if (!item || typeof item !== 'object' || Array.isArray(item)) { errors.push(`${path}: expected object`); return; }
      for (const key of schema.required ?? []) if (!Object.hasOwn(item, key)) errors.push(`${path}.${key}: required`);
      for (const [key, entry] of Object.entries(item)) {
        if (Object.hasOwn(schema.properties ?? {}, key)) visit(schema.properties[key], entry, `${path}.${key}`);
        else if (schema.additionalProperties === false) errors.push(`${path}.${key}: unknown field`);
      }
    } else if (schema.type === 'array') {
      if (!Array.isArray(item)) { errors.push(`${path}: expected array`); return; }
      if (item.length < (schema.minItems ?? 0)) errors.push(`${path}: too few items`);
      if (item.length > (schema.maxItems ?? Infinity)) errors.push(`${path}: too many items`);
      if (schema.uniqueItems && new Set(item.map(x => JSON.stringify(x))).size !== item.length) errors.push(`${path}: duplicate items`);
      item.forEach((entry, i) => visit(schema.items, entry, `${path}[${i}]`));
    } else if (schema.type === 'string') {
      if (typeof item !== 'string' || item.trim().length < (schema.minLength ?? 0)) errors.push(`${path}: expected nonempty string`);
      else if (schema.pattern && !new RegExp(schema.pattern).test(item)) errors.push(`${path}: invalid format`);
    } else if (schema.type === 'number' || schema.type === 'integer') {
      if (typeof item !== 'number' || !Number.isFinite(item) || (schema.type === 'integer' && !Number.isInteger(item))) errors.push(`${path}: expected ${schema.type}`);
      else if (item < (schema.minimum ?? -Infinity) || item > (schema.maximum ?? Infinity)) errors.push(`${path}: outside range`);
    } else if (schema.type === 'boolean' && typeof item !== 'boolean') errors.push(`${path}: expected boolean`);
  }
  visit(root, value, name);
  if (errors.length) throw new Error(errors.join('\n'));
  return value;
}
