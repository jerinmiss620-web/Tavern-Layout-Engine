import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFileSync(path.join(root, relative), 'utf8');
const manifest = JSON.parse(read('latest.json'));
const remote = process.argv.includes('--remote');

assert.equal(manifest.schema_version, 1, 'Unsupported stable manifest schema');
assert.equal(manifest.project, 'Tavern Layout Engine');
assert.equal(manifest.channel, 'stable');
assert.equal(manifest.latest_version, manifest.release?.version, 'Stable version fields differ');

const release = manifest.release;
assert.match(release.version, /^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$/);
assert.equal(release.source_path, `releases/v${release.version}/TLE.js`);
assert.match(release.source_commit, /^[a-f0-9]{40}$/);
assert.match(release.sha256, /^[a-f0-9]{64}$/);
assert.ok(Number.isSafeInteger(release.size_bytes) && release.size_bytes > 0);
assert.ok(release.changelog_path, 'Missing release changelog path');
assert.ok(existsSync(path.join(root, release.changelog_path)), 'Release changelog does not exist');

const sourceUrl = new URL(release.source_url);
assert.equal(sourceUrl.protocol, 'https:');
assert.equal(sourceUrl.hostname, 'raw.githubusercontent.com');
assert.equal(sourceUrl.username, '');
assert.equal(sourceUrl.password, '');
assert.equal(sourceUrl.search, '');
assert.equal(sourceUrl.hash, '');
assert.equal(
  sourceUrl.pathname,
  `/jerinmiss620-web/Tavern-Layout-Engine/${release.source_commit}/${release.source_path}`,
  'Stable source URL does not match repository, commit and path'
);

function verifySource(source, label) {
  const bytes = Buffer.from(source, 'utf8');
  assert.equal(bytes.byteLength, release.size_bytes, label + ': UTF-8 byte-size mismatch');
  const hash = createHash('sha256').update(bytes).digest('hex');
  assert.equal(hash, release.sha256, label + ': SHA-256 mismatch');
  new vm.Script(source, { filename: release.source_path });
  return hash;
}

const localSource = read(release.source_path);
const localHash = verifySource(localSource, 'Local source');

if (remote) {
  const manifestUrl = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/main/latest.json';
  const manifestResponse = await fetch(manifestUrl, { cache: 'no-store' });
  assert.ok(manifestResponse.ok, 'Could not fetch remote latest.json: HTTP ' + manifestResponse.status);
  const remoteManifest = await manifestResponse.json();
  assert.deepEqual(remoteManifest, manifest, 'Remote stable manifest differs from local latest.json');

  const sourceResponse = await fetch(release.source_url, { cache: 'no-store' });
  assert.ok(sourceResponse.ok, 'Could not fetch pinned source: HTTP ' + sourceResponse.status);
  const remoteSource = await sourceResponse.text();
  const remoteHash = verifySource(remoteSource, 'Remote source');
  assert.equal(remoteHash, localHash, 'Local and remote source hashes differ');
}

console.log(
  'Stable release verification passed: TLE v' + release.version +
  ', ' + release.size_bytes + ' UTF-8 bytes, SHA-256 ' + localHash +
  (remote ? ' (local + remote).' : ' (local).')
);
