import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const core = read('tests/fixtures/legacy/core-v0.3.205.js');
const corePackage = JSON.parse(read('tests/fixtures/legacy/core-v0.3.205.json'));
const loader = read('tests/fixtures/legacy/stable-loader-v0.3.2.js');
const loaderPackage = JSON.parse(read('tests/fixtures/legacy/stable-loader-v0.3.2.json'));
new vm.Script(core);
new vm.Script(loader);
assert.equal(corePackage.content, core, 'TLE importer must equal release source');
assert.equal(loaderPackage.content, loader, 'Loader importer must equal source');
for (const [name, pack] of [['core', corePackage], ['loader', loaderPackage]]) {
  assert.equal(pack.type, 'script', name);
  assert.equal(pack.enabled, false, name);
  assert.ok(!/[\r\n]|\\n/.test(pack.info), name + ' info must be one line');
  for (const section of ['简介', '使用方式', '注意事项', '作者']) {
    assert.ok(pack.info.includes(section), name + ' missing ' + section);
  }
}

// The folded panel's collapsed summary must still surface version & update status.
assert.match(core, /<details class="tle-update-section" data-tle-update-details>/);
assert.doesNotMatch(core, /<details class="tle-update-section" data-tle-update-details\s+open/);
assert.match(core, /<summary>[\s\S]*?data-tle-update-summary[\s\S]*?data-tle-update-alert/);
assert.match(core, /data-tle-available-version/);
assert.match(core, /data-tle-update-channel/);
assert.match(core, /data-tle-setting="auto-update"/);
assert.match(core, /autoInput\.disabled = !canAutoUpdate/);
assert.match(core, /typeof loader\.setAutoUpdateEnabled === 'function'/);
assert.match(core, /loader\.setAutoUpdateEnabled\(autoUpdateInput\.checked\)/);
assert.match(core, /data-tle-action="install-update"/);
assert.match(core, /data-tle-action="check-update"/);
assert.match(core, /data-tle-action="adopt-loader"/);
assert.match(core, /function getLegacyTestLoader\(\)/);
assert.match(core, /function syncDiagnosticButtonPosition\(\)/);
assert.match(core, /button\.style\.setProperty\('top'/);
assert.match(core, /button\.style\.setProperty\('right'/);
assert.match(core, /version: '0\.3\.205'/);

// Execute the preference code with a fake host localStorage.
function extract(src, begin, end) {
  const a = src.indexOf(begin), b = src.indexOf(end, a + begin.length);
  assert.ok(a >= 0 && b > a, 'cannot extract ' + begin);
  return src.slice(a, b);
}
const preferences = extract(loader, '  function isAutoUpdateEnabled() {', '  function serializeRecord(record) {');
const settings = new Map();
const statuses = [];
const api = vm.runInNewContext(preferences + '\n({ isAutoUpdateEnabled, setAutoUpdateEnabled })', {
  getStorage: () => ({ getItem: key => settings.has(key) ? settings.get(key) : null,
    setItem: (key, val) => settings.set(key, val) }),
  AUTO_UPDATE_KEY: 'tle.loader.stable.autoUpdate.v1',
  refreshButtons: () => {},
  setStatus: status => statuses.push(status),
});
assert.equal(api.isAutoUpdateEnabled(), true, 'missing option must default to on');
assert.equal(api.setAutoUpdateEnabled(false), false);
assert.equal(api.isAutoUpdateEnabled(), false, 'explicit off must persist');
assert.equal(settings.get('tle.loader.stable.autoUpdate.v1'), 'false');
assert.equal(api.setAutoUpdateEnabled(true), true);
assert.equal(api.isAutoUpdateEnabled(), true);
assert.equal(settings.get('tle.loader.stable.autoUpdate.v1'), 'true');

// Exercise the unattended installation gate independently of network and UI.
const automatic = extract(loader, '  async function maybeAutoInstallUpdate() {', '  async function startup() {');
async function trial({ enabled = true, authorized = true, cachedVersion = '0.3.203',
  activeVersion = '0.3.203', targetVersion = '0.3.206', healthy = true,
  storageFailure = false } = {}) {
  const calls = [], logs = [];
  const active = activeVersion ? { version: activeVersion } : null;
  const target = { version: targetVersion, sha256: 'test' };
  const sandbox = {
    closed: false, busy: false, candidate: target,
    isAutoUpdateEnabled: () => enabled,
    isAutoRestoreEnabled: () => authorized,
    getActiveInstance: () => active,
    compareVersions: (x, y) => x.localeCompare(y, undefined, { numeric: true }),
    isHealthy: () => healthy,
    readLastKnownGood: async () => {
      if (storageFailure) throw Error('cache unavailable');
      return cachedVersion ? { version: cachedVersion } : null;
    },
    setStatus: message => logs.push(message),
    loadRecord: async (...args) => { calls.push(args); return true; },
  };
  const fn = vm.runInNewContext(automatic + '\nmaybeAutoInstallUpdate', sandbox);
  const answer = await fn();
  return { calls, logs, answer };
}
assert.equal((await trial()).calls.length, 1, 'safe auto upgrade should install');
const safe = await trial();
assert.equal(safe.calls[0][2].confirmed, true, 'safe unattended update bypasses only the prompt');
assert.equal(safe.calls[0][2].preferRemote, true);
for (const item of [
  { enabled: false }, { authorized: false }, { cachedVersion: null },
  { cachedVersion: '0.3.198' }, { activeVersion: null }, { healthy: false },
  { targetVersion: '0.3.202' }, { targetVersion: '0.3.203' }, { storageFailure: true },
]) {
  assert.equal((await trial(item)).calls.length, 0, 'must not auto install: ' + JSON.stringify(item));
}
assert.match(loader, /await checkRemote\(\{ promptUpdate: false \}\);\s*await maybeAutoInstallUpdate\(\)/);
assert.match(loader, /async function loadRecord\(record, label, options = \{\}\)/);
assert.match(loader, /const confirmed = options\.confirmed === true \|\| SCRIPT_WIN\.confirm/);
assert.match(loader, /await verifySource\(record\)/);
assert.match(loader, /readPreviousKnownGood\(\)/);
assert.match(loader, /const CHANNEL = 'stable'/);
console.log('TLE v0.3.205 fold + Stable Loader 0.3.2 automatic update tests passed');
