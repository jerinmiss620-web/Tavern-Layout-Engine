#!/usr/bin/env node
/**
 * TLE test-channel publication guard.
 *
 * Run from any working directory:
 *   node loader/verify-test-channel.mjs
 *   node loader/verify-test-channel.mjs --remote
 *
 * No third-party dependencies. The default mode validates the checked-out
 * manifest, immutable commit URLs, source hashes/byte sizes, installer sync,
 * and the diagnostic-button regression contract. --remote additionally
 * downloads each immutable GitHub artifact and verifies the published bytes.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OWNER = 'jerinmiss620-web';
const REPO = 'Tavern-Layout-Engine';
const REMOTE = process.argv.includes('--remote');

const legacyFiles = {
  'releases/v0.3.204/TLE.js': 'tests/fixtures/legacy/core-v0.3.204.js',
  'test-releases/v0.3.204/TLE.js': 'tests/fixtures/legacy/core-v0.3.204.js',
  'loader/TLE-Remote-Loader-Test-0.3.0.js': 'tests/fixtures/legacy/test-loader-v0.3.0.js',
  'loader/TLE-Remote-Loader-Test-0.3.0.json': 'tests/fixtures/legacy/test-loader-v0.3.0.json',
};
function readText(path) {
  return readFileSync(join(ROOT, legacyFiles[path] || path), 'utf8');
}
function readBytes(path) {
  return readFileSync(join(ROOT, legacyFiles[path] || path));
}
function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}
function expectedRawUrl(commit, path) {
  return `https://raw.githubusercontent.com/${OWNER}/${REPO}/${commit}/${path}`;
}
function checkPinnedUrl(urlText, commit, path, label) {
  assert.match(commit || '', /^[a-f0-9]{40}$/, `${label}: source_commit must be exactly 40 lowercase hex characters`);
  const expected = expectedRawUrl(commit, path);
  assert.equal(urlText, expected, `${label}: immutable raw URL must exactly match repository, commit and path`);
  const url = new URL(urlText);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'raw.githubusercontent.com');
  assert.equal(url.username, '');
  assert.equal(url.password, '');
  assert.equal(url.port, '');
  assert.equal(url.search, '');
  assert.equal(url.hash, '');
}
function checkLocalSource(path, expectedHash, expectedSize, label) {
  const bytes = readBytes(path);
  assert.equal(bytes.byteLength, expectedSize, `${label}: byte size mismatch`);
  assert.equal(sha256(bytes), expectedHash, `${label}: SHA-256 mismatch`);
  return bytes;
}
async function checkRemoteSource(url, expectedHash, expectedSize, label) {
  const response = await fetch(url, { redirect: 'error', cache: 'no-store' });
  assert.equal(response.status, 200, `${label}: remote fetch failed (${response.status})`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.byteLength, expectedSize, `${label}: remote byte size mismatch`);
  assert.equal(sha256(bytes), expectedHash, `${label}: remote SHA-256 mismatch`);
  return bytes;
}

const manifest = JSON.parse(readText('channels/test.json'));
assert.equal(manifest.schema_version, 1);
assert.equal(manifest.project, 'Tavern Layout Engine');
assert.equal(manifest.channel, 'test');
assert.equal(manifest.latest_version, manifest.release?.version);
assert.equal(manifest.minimum_loader_version, '0.3.2');

const release = manifest.release;
assert.equal(release.source_path, `test-releases/v${release.version}/TLE.js`);
checkPinnedUrl(release.source_url, release.source_commit, release.source_path, 'TLE release');
const tleBytes = checkLocalSource(release.source_path, release.sha256, release.size_bytes, 'TLE release');
new Function(tleBytes.toString('utf8'));

const loaderRelease = manifest.loader_release;
assert.ok(loaderRelease, 'loader_release is required');
assert.equal(loaderRelease.version, '0.3.2');
assert.equal(loaderRelease.source_path, `loader/TLE-Remote-Loader-Test-${loaderRelease.version}.js`);
checkPinnedUrl(loaderRelease.source_url, loaderRelease.source_commit, loaderRelease.source_path, 'Loader release');
const loaderBytes = checkLocalSource(loaderRelease.source_path, loaderRelease.sha256, loaderRelease.size_bytes, 'Loader release');
const loaderSource = loaderBytes.toString('utf8');
new Function(loaderSource);

// The importable Tavern Helper JSON must contain exactly the pinned loader source.
const installer = JSON.parse(readText(loaderRelease.installer_path));
assert.equal(installer.type, 'script');
assert.equal(installer.content, loaderSource, 'Loader installer content is stale');
assert.match(loaderRelease.installer_commit || '', /^[a-f0-9]{40}$/);
assert.equal(
  loaderRelease.installer_url,
  `https://github.com/${OWNER}/${REPO}/blob/${loaderRelease.installer_commit}/${loaderRelease.installer_path}`,
  'Loader installer URL must use its pinned commit and path',
);

// Phase 3.1 Core API v2 and Test manifest contract.
const moduleManifest = JSON.parse(readText('modules/test.json'));
assert.equal(moduleManifest.core_api_version, 2, 'Test manifest must require Core API v2');
assert.ok(moduleManifest.modules.some(module => module.id === 'avatar.hd' && module.api_version === 1));
assert.ok(tleBytes.toString('utf8').includes("const KERNEL_VERSION = '1.1.0';"));
assert.ok(tleBytes.toString('utf8').includes('const API_VERSION = 2;'));
assert.ok(tleBytes.toString('utf8').includes('const coreModuleServices = Object.freeze('));
assert.ok(tleBytes.toString('utf8').includes("services: coreModuleServices,"));
assert.ok(tleBytes.toString('utf8').includes('integration/phase-3-core-services-20261129/modules/test.json'));
assert.ok(loaderSource.includes("const LOADER_VERSION = '0.3.2'"));
assert.ok(loaderSource.includes('integration/phase-3-core-services-20261129/channels/test.json'));

// Loader trust-policy contract: commit pinning must remain strict.
assert.ok(loaderSource.includes('[a-f0-9]{40}'), 'Loader must require a 40-character commit SHA');
assert.ok(loaderSource.includes("sourceUrl.hostname !== 'raw.githubusercontent.com'"));
assert.ok(loaderSource.includes('release.source_commit && release.source_commit !== commitMatch[1]'));

// Diagnostic-button regression contract. This is a static guard, not a substitute
// for an actual ST/TT/iPhone interaction test.
const tleSource = tleBytes.toString('utf8');
const coreApiStart = tleSource.indexOf('  const api = {');
const coreApiEnd = tleSource.indexOf('\n  };', coreApiStart);
assert.ok(coreApiStart >= 0 && coreApiEnd > coreApiStart, 'TLE runtime API object must exist');
assert.ok(tleSource.slice(coreApiStart, coreApiEnd).includes(`version: '${release.version}'`), 'TLE runtime API version must match manifest release.version');
const diagStart = tleSource.indexOf('/* Diagnostic escape hatch:');
const diagEnd = tleSource.indexOf('/* Core panel layer:', diagStart);
assert.ok(diagStart >= 0 && diagEnd > diagStart, 'Diagnostic CSS block must remain identifiable');
const diagnosticCss = tleSource.slice(diagStart, diagEnd);
assert.ok(diagnosticCss.includes('position: fixed !important'), 'Diagnostic button must remain viewport-fixed');
assert.ok(diagnosticCss.includes('top: calc(env(safe-area-inset-top, 0px) + 52px) !important;'), 'Diagnostic button must remain top-anchored');
assert.ok(diagnosticCss.includes('right: calc(env(safe-area-inset-right, 0px) + 12px) !important;'), 'Diagnostic button must remain right-anchored');
assert.ok(diagnosticCss.includes('bottom: auto !important;'), 'Diagnostic button must explicitly clear bottom anchoring');
assert.ok(!diagnosticCss.includes('bottom: 12px'), 'Diagnostic button must not return to a bottom-corner anchor');
assert.ok(diagnosticCss.includes(':popover-open { display: grid !important; }'), 'Popover-open state must remain visible');
assert.ok(diagnosticCss.includes('[data-tle-positioning="fixed-document-root-fallback"] { display: grid !important; }'), 'Non-Popover fallback must remain visible');

assert.ok(tleSource.includes("button.setAttribute('popover', 'manual')"));
assert.ok(tleSource.includes('button.showPopover()'));
assert.ok(tleSource.includes('function syncDiagnosticButtonPosition()'));
assert.ok(tleSource.includes("visualViewport.addEventListener('resize', syncPosition"));
assert.ok(tleSource.includes("visualViewport.addEventListener('scroll', syncPosition"));
assert.ok(tleSource.includes('state.diagnosticButton?.remove()'));
assert.ok(tleSource.includes("panel = HOST_DOC.createElement('dialog')"));
assert.ok(tleSource.includes('panel.showModal()'));
assert.ok(tleSource.includes('positioningMode: button?.dataset.tlePositioning'));
assert.ok(tleSource.includes('popoverSupported: Boolean(button && typeof button.showPopover'));
assert.ok(tleSource.includes('popoverOpen: Boolean(button?.matches?.(\':popover-open\'))'));
assert.ok(tleSource.includes('buttonReceivesHit: Boolean(hit && (hit === button || button?.contains(hit)))'));
assert.ok(tleSource.includes('debuggerPanel: {'));
assert.ok(tleSource.includes("setDiagnosticMode(diagnosticMode);"));
assert.ok(tleSource.includes("if (action === 'open-debugger') openMobileDebugger();"));
assert.ok(tleSource.includes("HOST_WIN.addEventListener('click', handleDiagnosticButtonClick, {"));
assert.ok(tleSource.includes('event.stopImmediatePropagation()'));
assert.ok(tleSource.includes("button.removeAttribute('popover')"));
assert.ok(tleSource.includes('HOST_DOC.documentElement.appendChild(button)'));
assert.ok(tleSource.includes('data-tle-positioning="fixed-document-root-fallback"'));
assert.ok(tleSource.includes('function watchDiagnosticButton()'));
assert.ok(tleSource.includes('diagnosticButtonObserver'));
assert.ok(tleSource.includes('buttonDisplayPriority'));
assert.ok(tleSource.includes('buttonReceivesHit'));

// Current Core regression contracts are maintained by the focused regression tests
// and the Phase 3 service checks above. Do not carry stale v0.3.196 UI assertions
// into newer Test candidates.

if (REMOTE) {
  await checkRemoteSource(release.source_url, release.sha256, release.size_bytes, 'TLE release');
  await checkRemoteSource(loaderRelease.source_url, loaderRelease.sha256, loaderRelease.size_bytes, 'Loader release');
  const installerUrl = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${loaderRelease.installer_commit}/${loaderRelease.installer_path}`;
  const response = await fetch(installerUrl, { redirect: 'error', cache: 'no-store' });
  assert.equal(response.status, 200, `Installer remote fetch failed (${response.status})`);
  const remoteInstaller = JSON.parse(await response.text());
  assert.equal(remoteInstaller.content, loaderSource, 'Remote installer content is stale');
}

console.log('TLE test-channel verification passed.');
console.log(`TLE v${release.version}: ${release.source_commit} · ${release.size_bytes} bytes · SHA-256 OK`);
console.log(`Loader v${loaderRelease.version}: ${loaderRelease.source_commit} · ${loaderRelease.size_bytes} bytes · SHA-256 OK`);
console.log('Loader installer sync: OK');
console.log('Mobile diagnostic Top Layer / top-right regression contract: OK');
if (REMOTE) console.log('Immutable GitHub artifacts and remote installer: OK');
