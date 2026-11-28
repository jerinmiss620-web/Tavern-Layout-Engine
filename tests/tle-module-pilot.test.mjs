import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const originalEngine = read('development/avatar-engine/avatar-engine.js');
const moduleSource = read('modules/src/hd-avatar-engine.js');
const core = read('development/organizer/TLE.js');
const stable = JSON.parse(read('modules/stable.json'));
const test = JSON.parse(read('modules/test.json'));

assert.ok(moduleSource.endsWith(originalEngine), 'The independent pilot must preserve the audited avatar engine source byte-for-byte');
assert.match(moduleSource, /export default function createHDAvatarModule\(context\)/);
assert.match(moduleSource, /context\.host\.scriptWindow/);
assert.match(moduleSource, /context\.host\.window/);
assert.match(moduleSource, /context\.host\.document/);
assert.match(moduleSource, /createTLEHDAvatarEngine\(SCRIPT_WIN, WIN, DOC\)/);
assert.match(core, /id: 'avatar\.hd'/);
assert.match(core, /name: 'HD Avatar Engine'/);
assert.match(core, /permissions: \['host:script-window', 'host:window', 'host:document'\]/);
assert.match(core, /moduleLoader\.start\(\)/);
assert.deepEqual(stable.modules, [], 'Stable manifest must remain empty until the pilot passes real-host validation');
assert.equal(test.channel, 'test');
assert.deepEqual(test.modules, [], 'The test manifest stays empty until the immutable source commit is available');

console.log('HD Avatar Engine pilot packaging and fallback contract passed.');
