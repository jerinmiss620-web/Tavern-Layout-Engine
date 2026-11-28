import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFileSync(path.join(root, relative), 'utf8');
const stable = JSON.parse(read('modules/stable.json'));
const test = JSON.parse(read('modules/test.json'));
const schema = JSON.parse(read('modules/manifest.schema.json'));
const moduleSource = read('modules/src/hd-avatar-engine.js');
const smokeSource = read('modules/src/core-services-smoke.js');

assert.equal(stable.schema_version, 1);
assert.equal(stable.project, 'Tavern Layout Engine');
assert.equal(stable.channel, 'stable');
assert.equal(stable.core_api_version, 1);
assert.deepEqual(stable.modules, [], 'Stable manifest must stay empty until the pilot passes real-host validation.');
assert.equal(test.schema_version, 1);
assert.equal(test.project, 'Tavern Layout Engine');
assert.equal(test.channel, 'test');
assert.equal(test.core_api_version, 2);
assert.equal(test.modules.length, 2, 'Test manifest must contain the HD Avatar pilot and the Core Services smoke module.');
const pilot = test.modules.find(module => module.id === 'avatar.hd');
const smoke = test.modules.find(module => module.id === 'core.services-smoke');
assert.equal(pilot.id, 'avatar.hd');
assert.equal(pilot.version, '1.0.0');
assert.equal(pilot.api_version, 1);
assert.equal(pilot.settings_schema_version, 1);
assert.match(pilot.source_commit, /^[a-f0-9]{40}$/);
assert.equal(pilot.source_path, 'modules/src/hd-avatar-engine.js');
assert.equal(pilot.source_url,
  'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/' +
  pilot.source_commit + '/' + pilot.source_path);
assert.equal(pilot.sha256, createHash('sha256').update(moduleSource, 'utf8').digest('hex'));
assert.equal(pilot.size_bytes, Buffer.byteLength(moduleSource, 'utf8'));
assert.equal(pilot.parent_id, null);
assert.deepEqual(pilot.dependencies, []);
assert.deepEqual(pilot.permissions, ['host:script-window', 'host:window', 'host:document']);
assert.equal(pilot.enabled_by_default, true);

assert.equal(smoke.id, 'core.services-smoke');
assert.equal(smoke.version, '1.0.0');
assert.equal(smoke.api_version, 2);
assert.equal(smoke.settings_schema_version, 1);
assert.match(smoke.source_commit, /^[a-f0-9]{40}$/);
assert.equal(smoke.source_commit, '20b2a0c43aba06f151a58530af3356426e1f5526');
assert.equal(smoke.source_path, 'modules/src/core-services-smoke.js');
assert.equal(smoke.source_url,
  'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/' +
  smoke.source_commit + '/' + smoke.source_path);
assert.equal(smoke.sha256, createHash('sha256').update(smokeSource, 'utf8').digest('hex'));
assert.equal(smoke.size_bytes, Buffer.byteLength(smokeSource, 'utf8'));
assert.equal(smoke.parent_id, null);
assert.deepEqual(smoke.dependencies, []);
assert.deepEqual(smoke.permissions, ['services:chat-context', 'services:resource-catalog']);
assert.equal(smoke.enabled_by_default, true);

assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema');
assert.equal(schema.$defs.module.required.includes('source_commit'), true);
assert.equal(schema.$defs.module.required.includes('sha256'), true);
assert.equal(schema.$defs.module.required.includes('size_bytes'), true);
assert.equal(schema.$defs.module.required.includes('dependencies'), true);
assert.equal(schema.$defs.module.required.includes('parent_id'), true);
assert.equal(schema.$defs.module.required.includes('permissions'), true);
assert.equal(schema.$defs.module.properties.source_url.pattern.includes('raw\\.githubusercontent\\.com'), true);

console.log('TLE module manifests passed: Stable remains empty; Test pilot source is pinned and hash/byte-count verified.');
