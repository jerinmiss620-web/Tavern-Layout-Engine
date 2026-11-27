#!/usr/bin/env node
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = path => readFileSync(join(process.cwd(), path));
const readText = path => read(path).toString('utf8');
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(readText('channels/companion-prompt-state.json'));

assert.equal(manifest.schema_version, 1);
assert.equal(manifest.project, 'Tavern Layout Engine');
assert.equal(manifest.channel, 'test');
assert.equal(manifest.latest_version, manifest.release.version);
assert.equal(manifest.release.version, '0.3.292');
assert.equal(manifest.minimum_loader_version, '0.3.0');
assert.equal(manifest.recommended_loader_version, '0.3.0');

const release = manifest.release;
assert.equal(release.source_path, 'releases/v0.3.292/TLE.js');
assert.equal(release.changelog_path, 'releases/v0.3.292/CHANGELOG.md');
assert.match(release.source_commit || '', /^[a-f0-9]{40}$/);
assert.equal(
  release.source_url,
  'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/' + release.source_commit + '/' + release.source_path,
);
const releaseBytes = read(release.source_path);
const releaseSource = releaseBytes.toString('utf8');
assert.equal(releaseBytes.byteLength, release.size_bytes);
assert.equal(sha256(releaseBytes), release.sha256);
assert.match(releaseSource, /version: '0\.3\.292'/);
assert.match(releaseSource, /const VERSION = '0\.3\.292'/);
new Function(releaseSource);

const developmentSource = readText('development/organizer/TLE.js');
const expectedCandidate = developmentSource;
assert.equal(releaseSource, expectedCandidate,
  'The test artifact must be an exact versioned copy of the current development Core.');

const stable = JSON.parse(readText('latest.json'));
assert.equal(stable.channel, 'stable');
assert.equal(stable.latest_version, '0.3.291');
assert.equal(stable.release.version, '0.3.291');
assert.equal(stable.release.source_path, 'releases/v0.3.291/TLE.js');
assert.notEqual(release.source_commit, stable.release.source_commit);

const loader = manifest.loader_release;
assert.ok(loader);
assert.equal(loader.version, manifest.recommended_loader_version);
assert.equal(loader.source_path, 'loader/TLE-Remote-Loader-Companion-Prompt-Test-0.3.0.js');
assert.equal(loader.installer_path, 'loader/TLE-Remote-Loader-Companion-Prompt-Test-0.3.0.json');
assert.match(loader.source_commit || '', /^[a-f0-9]{40}$/);
assert.match(loader.installer_commit || '', /^[a-f0-9]{40}$/);
assert.equal(
  loader.source_url,
  'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/' + loader.source_commit + '/' + loader.source_path,
);
assert.equal(
  loader.installer_url,
  'https://github.com/jerinmiss620-web/Tavern-Layout-Engine/blob/' + loader.installer_commit + '/' + loader.installer_path,
);
const loaderBytes = read(loader.source_path);
const loaderSource = loaderBytes.toString('utf8');
assert.equal(loaderBytes.byteLength, loader.size_bytes);
assert.equal(sha256(loaderBytes), loader.sha256);
assert.match(loaderSource, /const LOADER_VERSION = '0\.3\.0'/);
assert.match(loaderSource, /const CHANNEL = 'test'/);
assert.ok(loaderSource.includes('feature/companion-prompt-state-v0.3.289-20261127/channels/companion-prompt-state.json'));
assert.ok(loaderSource.includes('__TLE_REMOTE_LOADER_TEST_V1__'));
assert.ok(loaderSource.includes('companionPromptStateV03289Test'));
assert.ok(!loaderSource.includes('feature/companion-prompt-entry-states-20261127'));
new Function(loaderSource);

const installer = JSON.parse(readText(loader.installer_path));
assert.equal(installer.type, 'script');
assert.equal(installer.enabled, false);
assert.equal(installer.content, loaderSource, 'Importable Test Loader JSON must contain the exact pinned loader source.');
assert.ok(installer.id && installer.name);

const changelog = readText(release.changelog_path);
assert.match(changelog, /TEST ONLY/);
assert.match(changelog, /identifier/);
assert.match(changelog, /原始预设/);

console.log('Companion prompt-state Test Loader verification passed.');
console.log('TLE v0.3.292 TEST artifact: byte size and SHA-256 OK.');
console.log('Test Loader v0.3.0: byte size, SHA-256 and installer sync OK.');
console.log('Stable latest.json remains v0.3.291.');
