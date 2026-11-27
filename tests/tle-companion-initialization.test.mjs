import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('latest.json'));
const source = read('development/organizer/TLE.js');
const previous = read('tests/fixtures/legacy/core-v0.3.260.js');
const release = read(manifest.release.source_path);
const installer = JSON.parse(read(`releases/v${manifest.release.version}/TLE-${manifest.release.version}-import.json`));

const developmentMode = process.env.TLE_TEST_DEVELOPMENT === '1';
assert.equal(installer.content, release, 'the pinned stable source and disabled stable backup package must remain identical');
if (!developmentMode) {
  assert.equal(release, source, 'the pinned stable source must match the working source');
  assert.equal(installer.content, source, 'the disabled stable backup package must contain the exact stable source');
}
new vm.Script(source, { filename: `TLE v${manifest.release.version}` });

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}

// The change is deliberately limited to initialization/dispatch and schedule-token bookkeeping.
// The configuration catalog, schedule calculation, manual hold and application engine stay intact.
const currentFields = section(source, '  const COMPANION_FIELDS = [', '  const companionRuntime = {');
const previousFields = section(previous, '  const COMPANION_FIELDS = [', '  const companionRuntime = {');
const comparableFields = developmentMode
  ? currentFields.replace("    { id: 'promptEntries', name: '预设条目开关', type: 'promptEntries' },\n", '')
  : currentFields;
assert.equal(comparableFields, previousFields,
  'all existing companion fields must remain unchanged apart from the new prompt-entry field');

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
const currentApply = section(source, '  async function companionApply(', '  function companionOnChatChanged(');
const previousApply = section(previous, '  async function companionApply(', '  function companionOnChatChanged(');
const comparableApply = developmentMode
  ? (() => {
      let comparable = currentApply
        .replace(/^\s*const resetResult = await companionPromptResetOverlay\(\);\n\s*if \(resetResult\.issue\) \{[\s\S]*?^\s*}\n\s*if \(resetResult\.changed\) finished\+\+;\n/m, '')
        .replace(/^\s*const promptPreflight = await companionPromptPreflight\(plan, role\);\n/m, '')
        .replace(/^\s*if \(error\?\.code === 'TLE_PROMPT_BASELINE_RESTORE_FAILED'\) throw error;\n/m, '');
      const promptStart = comparable.indexOf("          if (field.id === 'promptEntries') {");
      const promptEnd = comparable.indexOf("          if (field.id === 'worldInfo') {", promptStart);
      assert.ok(promptStart >= 0 && promptEnd > promptStart,
        'prompt-entry integration block must remain isolated in the application loop');
      return comparable.slice(0, promptStart) + comparable.slice(promptEnd);
    })()
  : currentApply;
assert.equal(comparableApply, previousApply,
  'the existing per-item application engine and failure reporting must remain unchanged outside prompt-entry integration');


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
assert.ok(source.includes('Core v' + manifest.release.version));
assert.ok(source.includes('Host Diagnostics 2.0 · v' + manifest.release.version));
assert.ok(source.includes('data-tle-update-summary>v' + manifest.release.version));
assert.ok(source.includes('data-tle-runtime-version>v' + manifest.release.version));
assert.ok(source.includes("version: '" + manifest.release.version + "'"));

console.log('TLE companion initialization and schedule-recovery checks passed: v' + manifest.release.version + '.');
