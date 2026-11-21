import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

for (const path of ['tests/fixtures/legacy/bootstrap-v1.0.2.js', 'loader/bootstrap/TLE-Permanent-Bootstrap-1.0.6.js']) {
const src = readFileSync(new URL('../' + path, import.meta.url), 'utf8');
new vm.Script(src);
const begin = src.indexOf('  function scheduleNextCheck() {') >= 0 ? src.indexOf('  function scheduleNextCheck() {') : src.indexOf('  async function startup() {');
const end = src.indexOf('  function destroy() {', begin);
assert.ok(begin > 0 && end > begin, 'extract real Bootstrap startup function');
const startupSource = src.slice(begin, end);
assert.match(src, /tle-loader-state-change/);
assert.match(src, /if \(running\.getInfo\?\.\(\)\.busy\) return;/);
assert.match(src, /if \(!running \|\| compareVersions\(candidate\.version, running\.version\) <= 0\) return;/);

async function simulate({ oldBusy = true, remote = '0.3.4', enabled = true } = {}) {
  let cached = null, candidate = null, runtime = null;
  const planned = [], statuses = [];
  const sandbox = {
    closed: false, remoteFailure: null, RETRY_INTERVAL: 60_000, CHECK_INTERVAL: 21_600_000,
    readCached: async slot => slot === 'last' ? { version: '0.3.3' } : null,
    installRecord: async () => { runtime = { version: '0.3.3', getInfo: () => ({ busy: oldBusy }) }; return true; },
    currentRuntime: () => runtime,
    refreshAutomatic: async () => {
      // Remote manifest SHA/Commit verification already succeeded.
      // The cached loader was in the middle of checking a Core release with
      // minimum_loader_version=0.3.4, so the install is deferred.
      candidate = { version: remote };
    },
    scheduleCheck: ms => planned.push(ms),
    compareVersions: (a, b) => a.localeCompare(b, undefined, { numeric: true }),
    isAutoUpdateEnabled: () => enabled,
    setStatus: value => statuses.push(value),
    get candidate() { return candidate; },
    set candidate(value) { candidate = value; },
    get cached() { return cached; },
    set cached(value) { cached = value; },
  };
  const run = vm.runInNewContext(startupSource + '\nstartup', sandbox);
  await run();
  return planned;
}
assert.deepEqual(await simulate(), [60_000], 'busy older cached Loader must retry promptly, never 6h');
assert.deepEqual(await simulate({ oldBusy: false }), [60_000], 'pending newer version must retry');
assert.deepEqual(await simulate({ remote: '0.3.3' }), [21_600_000], 'up-to-date Loader retains regular interval');
assert.deepEqual(await simulate({ enabled: false }), [21_600_000], 'explicit opt-out remains respected');

console.log(path + ': cached v0.3.3 busy while v0.3.4 awaits retry no longer waits six hours.');

}
