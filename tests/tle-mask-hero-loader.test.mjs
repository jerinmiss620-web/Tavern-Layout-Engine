import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const legacyFiles = {
  [JSON.parse(readFileSync(new URL('../channels/mask-hero-test.json', import.meta.url), 'utf8')).release.source_path]:
    'tests/fixtures/legacy/mask-hero-test-core-v0.3.302.js',
  [JSON.parse(readFileSync(new URL('../channels/mask-hero-test.json', import.meta.url), 'utf8')).loader_release.source_path]:
    'tests/fixtures/legacy/mask-hero-test-loader-v0.3.0.js',
  [JSON.parse(readFileSync(new URL('../channels/mask-hero-test.json', import.meta.url), 'utf8')).loader_release.installer_path]:
    'tests/fixtures/legacy/mask-hero-test-loader-v0.3.0.json',
};
const read = path => readFileSync(new URL('../' + (legacyFiles[path] || path), import.meta.url), 'utf8');
const manifest = JSON.parse(read('channels/mask-hero-test.json'));
const stable = JSON.parse(read('latest.json'));
const plan = JSON.parse(read('release-plan.json'));
const core = read(manifest.release.source_path);
const development = read('development/organizer/TLE.js');
const stableCore = read(stable.release.source_path);
const loader = read(manifest.loader_release.source_path);
const installer = JSON.parse(read(manifest.loader_release.installer_path));
const sha256 = value => createHash('sha256').update(value, 'utf8').digest('hex');

assert.equal(manifest.schema_version, 1);
assert.equal(manifest.project, 'Tavern Layout Engine');
assert.equal(manifest.channel, 'mask-hero-test');
assert.equal(manifest.latest_version, '0.3.302');
assert.equal(manifest.release.version, manifest.latest_version);
assert.equal(manifest.minimum_loader_version, '0.3.0');
assert.equal(sha256(stableCore), stable.release.sha256, 'the stable release artifact must match its immutable Stable manifest SHA-256');
assert.equal(Buffer.byteLength(stableCore, 'utf8'), stable.release.size_bytes, 'the stable release artifact must match its immutable Stable manifest byte count');
assert.notEqual(core, stableCore, 'the archived test channel must remain separate from the current stable release');
assert.equal(sha256(core), manifest.release.sha256, 'the test Core SHA-256 must match its manifest');
assert.equal(Buffer.byteLength(core, 'utf8'), manifest.release.size_bytes, 'the test Core byte count must match its manifest');
assert.match(manifest.release.source_url, new RegExp('/' + manifest.release.source_commit + '/releases/v0\\.3\\.302/TLE\\.js$'));
assert.match(loader, /const CHANNEL = 'mask-hero-test';/);
new vm.Script(loader, { filename: 'TLE Mask Hero Test Loader' });
assert.match(manifest.loader_release.source_url, new RegExp('/' + manifest.loader_release.source_commit + '/loader/TLE-Mask-Hero-Test-Loader-0\\.3\\.0\\.js$'));
assert.ok(loader.includes('channels/mask-hero-test.json'));
assert.ok(loader.includes('tle.loader.maskHeroTest.lastKnownGood.v1'));
assert.ok(loader.includes('TLE_Mask_Hero_Test_Cache'));
assert.equal(loader.includes('organizerBranchTest'), false);
assert.equal(loader.includes('feature/organizer-nav-worldbooks-20261125'), false);
assert.equal(sha256(loader), manifest.loader_release.sha256, 'test Loader SHA-256 must match its manifest');
assert.equal(Buffer.byteLength(loader, 'utf8'), manifest.loader_release.size_bytes, 'test Loader byte count must match its manifest');
assert.equal(installer.content, loader, 'the disabled installer must embed the exact pinned test Loader');
assert.equal(installer.enabled, false, 'the test Loader installer must be disabled by default');
assert.equal(installer.id, '0f3a9e7c-4b2d-4a71-9c83-5d6f1a2b3c40');
assert.equal(manifest.loader_release.source_commit, manifest.loader_release.installer_commit);
assert.ok(manifest.loader_release.installer_url.includes(manifest.loader_release.installer_commit));
assert.equal(stable.latest_version, '0.3.304', 'the stable channel must point to the promoted Mask Hero release');
assert.equal(stable.release.source_path, 'releases/v0.3.304/TLE.js');
assert.equal(plan.core, '0.3.304', 'the stable release plan must match the promoted Core');
assert.ok(manifest.status.startsWith('ARCHIVED'), 'the old Mask Hero test channel must be explicitly archived');

console.log('TLE Mask Hero test channel passed: immutable Core/Loader hashes, dedicated channel, disabled installer and stable-channel isolation.');
