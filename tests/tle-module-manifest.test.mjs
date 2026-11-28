import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFileSync(path.join(root, relative), 'utf8');
const manifest = JSON.parse(read('modules/stable.json'));
const schema = JSON.parse(read('modules/manifest.schema.json'));

assert.equal(manifest.schema_version, 1);
assert.equal(manifest.project, 'Tavern Layout Engine');
assert.equal(manifest.channel, 'stable');
assert.equal(manifest.core_api_version, 1);
assert.deepEqual(manifest.modules, [], 'Stable module list must stay empty until a module passes the pilot gate.');
assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(schema.$defs.module.required.includes('source_commit'), true);
assert.equal(schema.$defs.module.required.includes('sha256'), true);
assert.equal(schema.$defs.module.required.includes('size_bytes'), true);
assert.equal(schema.$defs.module.required.includes('dependencies'), true);
assert.equal(schema.$defs.module.required.includes('parent_id'), true);
assert.equal(schema.$defs.module.required.includes('permissions'), true);
assert.equal(schema.$defs.module.properties.source_url.pattern.includes('raw\\.githubusercontent\\.com'), true);

console.log('TLE module manifest schema checks passed: stable manifest is intentionally empty.');
