import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const plan = JSON.parse(read('release-plan.json'));
const stable = JSON.parse(read('latest.json'));
const avatar = read('development/avatar-engine/avatar-engine.js').trimEnd();
const gallerySource = read('development/gallery-home/gallery-home.js');
const developmentCore = read('development/organizer/TLE.js');
const stableCore = read(stable.release.source_path);

function coreVersion(source, label) {
  const match = source.match(/\/\/ Tavern Layout Engine · Host Diagnostics 2\.0 · v(\d+\.\d+\.\d+)/);
  assert.ok(match, label + ': missing Core version header');
  return match[1];
}

function galleryForVersion(version) {
  const matches = [...gallerySource.matchAll(/const VERSION = '(\d+\.\d+\.\d+)';/g)];
  assert.equal(matches.length, 1, 'Gallery source must contain one component VERSION');
  return gallerySource.replace(matches[0][0], "const VERSION = '" + version + "';").trimEnd();
}

function extract(source, startMarker, endMarker, label) {
  assert.equal(source.split(startMarker).length - 1, 1, label + ': start marker count');
  assert.equal(source.split(endMarker).length - 1, 1, label + ': end marker count');
  const start = source.indexOf(startMarker) + startMarker.length;
  const contentStart = source.indexOf('\n', start) + 1;
  const end = source.indexOf(endMarker, contentStart);
  assert.ok(contentStart > start && end > contentStart, label + ': invalid marker order');
  return source.slice(contentStart, end).replace(/\r?\n$/, '');
}

function checkDevelopmentCore(source, version) {
  assert.equal(
    extract(source, '/* TLE_AVATAR_ENGINE_START */', '/* TLE_AVATAR_ENGINE_END */', 'Development Avatar'),
    avatar,
    'Development Core: HD Avatar Engine differs from its authoritative source',
  );
  assert.equal(
    extract(source, '/* TLE_GALLERY_HOME_START */', '/* TLE_GALLERY_HOME_END */', 'Development Gallery'),
    galleryForVersion(version),
    'Development Core: Gallery Home differs from its authoritative source',
  );
}

checkDevelopmentCore(developmentCore, coreVersion(developmentCore, 'Development Core'));
assert.ok(stableCore.includes(avatar), 'Stable Core: HD Avatar Engine differs from its authoritative source');
assert.ok(stableCore.includes(galleryForVersion(stable.release.version)),
  'Stable Core: Gallery Home differs from its authoritative source');

assert.equal(
  coreVersion(stableCore, 'Stable Core'),
  stable.release.version,
  'Stable Core header must match latest.json',
);

execFileSync(process.execPath, ['scripts/build-core.mjs', '--check'], { stdio: 'inherit' });

console.log('TLE Core source-of-truth checks passed: stable artifact and development modules match.');
