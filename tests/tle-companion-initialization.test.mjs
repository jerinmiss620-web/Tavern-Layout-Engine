import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('latest.json'));
const source = read('development/organizer/TLE.js');
const previous = read('tests/fixtures/legacy/core-v0.3.260.js');
const release = read(manifest.release.source_path);
let developmentVersion = manifest.release.version;
try {
  developmentVersion = JSON.parse(read('channels/mask-hero-test.json')).release.version || developmentVersion;
} catch {}
const installer = JSON.parse(read(`releases/v${manifest.release.version}/TLE-${manifest.release.version}-import.json`));

const featureBranch = /^refs\/heads\/feature\//.test(process.env.GITHUB_REF || '') ||
  /^feature\//.test(process.env.GITHUB_HEAD_REF || '') ||
  process.env.TLE_ALLOW_DEV_SOURCE_DIVERGENCE === '1';
if (!featureBranch) {
  assert.equal(release, source, 'the pinned stable source must match the working source on stable branches');
} else {
  assert.equal(installer.content, release, 'feature work must not mutate the disabled stable backup package');
}
assert.equal(installer.content, release, 'the disabled stable backup package must contain the exact pinned stable source');
new vm.Script(source, { filename: `TLE v${developmentVersion}` });

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}

// Existing schedule and manual-hold semantics remain unchanged. Prompt-entry state is an intentional
// extension of the catalog/application engine and has dedicated identifier/role-isolation tests.
const fieldCatalog = section(source, '  const COMPANION_FIELDS = [', '  const companionRuntime = {');
for (const id of ['profile','source','model','preset','reasoning','worldInfo','theme']) {
  assert.match(fieldCatalog, new RegExp("id: '" + id + "'"));
}
assert.match(fieldCatalog, /id: 'promptEntries', name: '预设条目开关', type: 'promptEntries'/,
  'the role-specific prompt entry field is an intentional catalog extension');
assert.equal(
  section(source, '  function companionScheduleState(', '  function companionManualHold('),
  section(previous, '  function companionScheduleState(', '  function companionManualHold('),
  'day/night and cross-midnight schedule calculation must remain unchanged'
);
assert.equal(
  section(source, '  function companionManualHold(', '  function companionAutoTarget('),
  section(previous, '  function companionManualHold(', '  function companionAutoTarget('),
  'manual override expiry must remain unchanged'
);

// A real initialization now records the already-open role instead of simulating a role change.
const bind = section(source, '  function companionBindEvents() {', '  function companionCleanup() {');
assert.match(bind, /const initialRole = companionCurrentRole\(\);/);
assert.match(bind, /const initialChoice = companionAutoTarget\(initialData, initialRole\);/);
assert.match(bind, /if \(initialRole && initialChoice\?\.slot && !savedScheduleToken\)/);
assert.match(bind, /initialData\.scheduleTokens\[initialRole\.key\] = initialChoice\.slot\.token;/);
assert.match(bind, /companionRuntime\.lastRole = initialRole\?\.key \|\| '';/);
assert.doesNotMatch(bind, /companionRuntime\.lastRole\s*=\s*''/);
assert.doesNotMatch(bind, /On script reload, apply the selected role/);
assert.match(bind, /const freshHostStartup = companionIsFreshHostStartup\(/);
assert.match(bind, /HOST_WIN\[COMPANION_PAGE_STARTUP_KEY\] = true;/);
assert.match(bind, /companionRuntime\.startupRestorePending = freshHostStartup;/);
assert.match(bind, /if \(freshHostStartup && !initialRole\) companionQueueStartupRestore\(\);/);

// Schedule tokens are migrated without discarding existing plans/defaults/schedules/manual holds.
assert.match(source, /scheduleTokens: raw\.scheduleTokens && typeof raw\.scheduleTokens === 'object' \? raw\.scheduleTokens : \{\}/);
assert.match(source, /delete fresh\.scheduleTokens\[role\.key\]/);
const handler = section(source, '  function companionOnChatChanged(', '  function companionBindEvents(');
assert.match(handler, /const storedToken = data\.scheduleTokens\?\.\[key\] \|\| '';/);
assert.match(handler, /data\.scheduleTokens\[key\] = token;/);
assert.match(handler, /const startupRestore = companionRuntime\.startupRestorePending;/);
assert.match(handler, /companionShouldAutoApply\(\{ choice, force, changed, boundaryChanged, manualHold, startupRestore \}\)/);
assert.match(source, /function companionQueueStartupRestore\(attempt = 0\)/);
assert.match(source, /companionRuntime\.startupRetryTimer = HOST_WIN\.setTimeout/);
const cleanup = section(source, '  function companionCleanup() {', '  function setChatToolsPage(');
assert.match(cleanup, /clearTimeout\(companionRuntime\.startupRetryTimer\)/);
assert.match(cleanup, /companionRuntime\.startupRestorePending = false;/);

// A new host Window means the host page has started; a prior Core instance or
// page marker means this is only an in-document Core reload/re-enable.
const startupHelper = section(source, '  function companionIsFreshHostStartup(', '  function companionCurrentRole(');
const startupSandbox = {};
vm.runInNewContext(startupHelper + '\nglobalThis.evaluate = companionIsFreshHostStartup;', startupSandbox);
const isFreshHostStartup = startupSandbox.evaluate;
assert.equal(isFreshHostStartup(null, false), true,
  'a fresh host document must restore an already-open chat');
assert.equal(isFreshHostStartup({}, false), false,
  'a same-document Core update must not replay the default plan');
assert.equal(isFreshHostStartup(null, true), false,
  're-enabling Core in the same host document must not replay the default plan');

// Exercise the exact decision helper used by the runtime.
const helper = section(source, '  function companionShouldAutoApply(', '  async function companionApply(');
const sandbox = {};
vm.runInNewContext(helper + '\nglobalThis.evaluate = companionShouldAutoApply;', sandbox);
const shouldApply = sandbox.evaluate;
const defaultChoice = { id: 'default', slot: null };
const scheduledChoice = { id: 'day', slot: { token: 'avatar-a|day-start|day' } };

assert.equal(shouldApply({ choice: defaultChoice }), false,
  'a same-document Core initialization must not replay its default plan');
assert.equal(shouldApply({ choice: defaultChoice, startupRestore: true }), true,
  'a fresh host startup must restore the already-open role default');
assert.equal(shouldApply({ choice: null, startupRestore: true }), false,
  'a fresh host startup without a matching default must not change current settings');
assert.equal(shouldApply({ choice: defaultChoice, changed: true }), true,
  'a real character switch must still apply the new role default');
assert.equal(shouldApply({ choice: defaultChoice, force: true }), true,
  'an explicitly retried pending application must still run');
assert.equal(shouldApply({ choice: scheduledChoice }), false,
  'a same-document Core reload must not reapply the same scheduled period');
assert.equal(shouldApply({ choice: scheduledChoice, startupRestore: true }), true,
  'a fresh host startup must restore the current scheduled plan');
assert.equal(shouldApply({ choice: scheduledChoice, boundaryChanged: true }), true,
  'a missed day/night boundary must recover the current scheduled plan');
assert.equal(shouldApply({ choice: scheduledChoice, boundaryChanged: true, manualHold: true }), false,
  'a manual plan must remain in control until the next schedule boundary');

assert.match(source, /for \(const field of COMPANION_FIELDS\)/);
assert.match(source, /跳过不可用项目/);
assert.match(source, /部分应用完成/);
assert.match(source, /未能应用任何项目/);
assert.match(source, /companionUnavailableReason\(field, target, error\)/);
assert.match(source, /companionQueueGenerationRetry\(\)/);
assert.match(source, /companionScheduleState\(data, role\)/);
assert.ok(source.includes('Core v' + developmentVersion));
assert.ok(source.includes('Host Diagnostics 2.0 · v' + developmentVersion));
assert.ok(source.includes('data-tle-update-summary>v' + developmentVersion));
assert.ok(source.includes('data-tle-runtime-version>v' + developmentVersion));
assert.ok(source.includes("version: '" + developmentVersion + "'"));

console.log('TLE companion initialization and schedule-recovery checks passed: development v' + developmentVersion + '.');
