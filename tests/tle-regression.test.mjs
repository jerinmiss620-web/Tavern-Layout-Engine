import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFileSync(path.join(root, relative), 'utf8');
const manifest = JSON.parse(read('channels/test.json'));

assert.equal(manifest.schema_version, 1);
assert.equal(manifest.project, 'Tavern Layout Engine');
assert.equal(manifest.channel, 'test');
assert.equal(manifest.latest_version, manifest.release.version);
assert.ok(manifest.minimum_loader_version);

function verifyPinnedRelease(release, expectedPath, expectedUrlPattern) {
  assert.equal(release.source_path, expectedPath);
  assert.match(release.source_commit, /^[a-f0-9]{40}$/);
  assert.match(release.sha256, /^[a-f0-9]{64}$/);
  assert.ok(Number.isSafeInteger(release.size_bytes) && release.size_bytes > 0);

  const url = new URL(release.source_url);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'raw.githubusercontent.com');
  assert.equal(url.username, '');
  assert.equal(url.password, '');
  assert.equal(url.search, '');
  assert.equal(url.hash, '');

  const match = url.pathname.match(expectedUrlPattern);
  assert.ok(match, 'Untrusted immutable source URL: ' + release.source_url);
  assert.equal(match[1], release.source_commit, 'URL commit and manifest source_commit differ');
  assert.equal(match[2], release.version, 'URL release version and manifest version differ');

  const source = read(expectedPath);
  assert.equal(Buffer.byteLength(source, 'utf8'), release.size_bytes, 'UTF-8 source size mismatch');
  assert.equal(createHash('sha256').update(source, 'utf8').digest('hex'), release.sha256, 'SHA-256 mismatch');
  new vm.Script(source, { filename: expectedPath });
  return source;
}

const tlePath = 'releases/v' + manifest.release.version + '/TLE.js';
const tle = verifyPinnedRelease(
  manifest.release,
  tlePath,
  /^\/jerinmiss620-web\/Tavern-Layout-Engine\/([a-f0-9]{40})\/releases\/v(\d+\.\d+\.\d+)\/TLE\.js$/
);

const loaderRelease = manifest.loader_release;
assert.ok(loaderRelease);
const loader = verifyPinnedRelease(
  loaderRelease,
  /^\/jerinmiss620-web\/Tavern-Layout-Engine\/([a-f0-9]{40})\/loader\/TLE-Remote-Loader-Test-(\d+\.\d+\.\d+)\.js$/
  /^\/jerinmiss620-web\/Tavern-Layout-Engine\/([a-f0-9]{40})\/loader\/TLE-Remote-Loader-Test-0\.3\.0\.js$/
);
assert.equal(loaderRelease.version, '0.3.0');
assert.match(loader, /const LOADER_VERSION = '0\.3\.0'/);

const installer = JSON.parse(read(loaderRelease.installer_path));
assert.equal(installer.type, 'script');
assert.equal(installer.id, '8f994fad-ea17-49f8-93af-ebe8ba4f6c67');
assert.equal(installer.content, loader, 'Tavern Helper installer content is out of sync with Loader source');

assert.match(tle, /if \(action === 'open-debugger'\) openMobileDebugger\(\);/);
assert.match(tle, /function handleDiagnosticButtonClick\(event\)/);
assert.match(tle, /HOST_WIN\.addEventListener\('click', handleDiagnosticButtonClick, \{/);
assert.match(tle, /event\.stopImmediatePropagation\(\)/);
assert.match(tle, /button\.removeAttribute\('popover'\)/);
assert.match(tle, /HOST_DOC\.documentElement\.appendChild\(button\)/);
assert.match(tle, /data-tle-positioning="fixed-document-root-fallback"/);
assert.match(tle, /function watchDiagnosticButton\(\)/);
assert.match(tle, /diagnosticButtonObserver/);
assert.match(tle, /buttonDisplayPriority/);
assert.match(tle, /buttonReceivesHit/);
assert.match(tle, /top: calc\(env\(safe-area-inset-top, 0px\) \+ 52px\) !important;/);
assert.doesNotMatch(tle, /inset:\s*auto 12px calc\(env\(safe-area-inset-bottom/);
assert.doesNotMatch(tle, /if \(target\.closest\('#' \+ ID\.diagnosticButton\)\)/);

console.log('TLE test-channel regression checks passed: TLE v' + manifest.release.version + ', Loader v' + loaderRelease.version + '.');
