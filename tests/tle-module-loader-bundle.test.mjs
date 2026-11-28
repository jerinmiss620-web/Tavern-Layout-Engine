import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildModuleLoaderBundle } from '../scripts/build-module-loader.mjs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('development/core/module-loader.js');
const core = read('development/organizer/TLE.js');
const expected = buildModuleLoaderBundle(source);
const startMarker = '  /* TLE_MODULE_LOADER_START */';
const endMarker = '  /* TLE_MODULE_LOADER_END */';
const start = core.indexOf(startMarker);
const end = core.indexOf(endMarker, start);

assert.ok(start >= 0 && end > start, 'Core module-loader marker pair is missing');
assert.equal(core.slice(start, end + endMarker.length), expected, 'Core must embed the exact current Module Loader source');
assert.match(core, /const moduleLoader = TLEModuleLoaderBundle\.createModuleLoader/);
assert.match(core, /moduleLoader\.start\(\)/);
assert.match(core, /moduleLoader\.destroy\(\)/);
assert.match(core, /modules: moduleKernel,\s+moduleLoader,/);
assert.match(core, /__TLE_REMOTE_LOADER_DIAGNOSTICS__\?\.channel === 'test'/);
assert.doesNotMatch(core, /hdAvatarEngine = createTLEHDAvatarEngine\(SCRIPT_WIN, HOST_WIN, HOST_DOC\)/);
assert.doesNotMatch(core, /hdAvatarEngine\?\.stop\?\.\(\)/);

console.log('TLE Module Loader bundle parity and Core lifecycle integration passed.');
