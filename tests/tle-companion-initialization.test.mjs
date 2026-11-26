import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('development/organizer/TLE.js');
const previous = read('releases/v0.3.240/TLE.js');
const release = read('releases/v0.3.241/TLE.js');

assert.equal(release, source, 'v0.3.241 pinned test source must match the working source');
assert.equal(JSON.parse(read('releases/v0.3.241/TLE-0.3.241-TEST-import.json')).content, source,
  'the disabled import package must contain the exact test source');
new vm.Script(source, { filename: 'TLE v0.3.241' });

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}

// The change is deliberately limited to initialization/dispatch and schedule-token bookkeeping.
// The configuration catalog, schedule calculation, manual hold and application engine stay intact.
assert.equal(
  section(source, '  const COMPANION_FIELDS = [', '  const companionRuntime = {'),
  section(previous, '  const COMPANION_FIELDS = [', '  const companionRuntime = {'),
  'the companion field catalog must remain unchanged'
);
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
assert.equal(
  section(source, '  async function companionApply(', '  function companionOnChatChanged('),
  section(previous, '  async function companionApply(', '  function companionOnChatChanged('),
  'the complete per-item application engine and failure reporting must remain unchanged'
);

// A real initialization now records the already-open role instead of simulating a role change.
const bind = section(source, '  function companionBindEvents() {', '  function companionCleanup() {');
assert.match(bind, /const initialRole = companionCurrentRole\(\);/);
assert.match(bind, /companionRuntime\.lastRole = initialRole\?\.key \|\| '';/);
assert.doesNotMatch(bind, /companionRuntime\.lastRole\s*=\s*''/);
assert.doesNotMatch(bind, /On script reload, apply the selected role/);

// Schedule tokens are migrated without discarding existing plans/defaults/schedules/manual holds.
assert.match(source, /scheduleTokens: raw\.scheduleTokens && typeof raw\.scheduleTokens === 'object' \? raw\.scheduleTokens : \{\}/);
assert.match(source, /delete fresh\.scheduleTokens\[role\.key\]/);
const handler = section(source, '  function companionOnChatChanged(', '  function companionBindEvents(');
assert.match(handler, /const storedToken = data\.scheduleTokens\?\.\[key\] \|\| '';/);
assert.match(handler, /data\.scheduleTokens\[key\] = token;/);
assert.match(handler, /companionShouldAutoApply\(\{ choice, force, changed, boundaryChanged, manualHold \}\)/);

// Exercise the exact decision helper used by the runtime.
const helper = section(source, '  function companionShouldAutoApply(', '  async function companionApply(');
const sandbox = {};
vm.runInNewContext(helper + '\nglobalThis.evaluate = companionShouldAutoApply;', sandbox);
const shouldApply = sandbox.evaluate;
const defaultChoice = { id: 'default', slot: null };
const scheduledChoice = { id: 'day', slot: { token: 'avatar-a|day-start|day' } };

assert.equal(shouldApply({ choice: defaultChoice }), false,
  'initializing an already-open role must not replay its default plan');
assert.equal(shouldApply({ choice: defaultChoice, changed: true }), true,
  'a real character switch must still apply the new role default');
assert.equal(shouldApply({ choice: defaultChoice, force: true }), true,
  'an explicitly retried pending application must still run');
assert.equal(shouldApply({ choice: scheduledChoice }), false,
  'the same scheduled period must not reapply after a normal reload');
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
assert.match(source, /Core v0\.3\.241/);
assert.match(source, /version: '0\.3\.241'/);

console.log('TLE companion initialization and schedule-recovery checks passed: v0.3.241.');
