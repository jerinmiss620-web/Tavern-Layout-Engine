import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../development/organizer/TLE.js', import.meta.url), 'utf8');

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}

const helperSource = section(
  source,
  '  function companionPromptMergeStateMaps(',
  '  function companionPromptCurrentPresetName(',
);
const sandbox = {};
vm.runInNewContext(helperSource + `
globalThis.promptHelpers = {
  companionPromptMergeStateMaps,
  companionPromptExtendStateMap,
  companionPromptUpdateKnownStateMap,
  companionPromptApplyStateMap,
  companionPromptBaselineRestoreIssue,
};
`, sandbox);
const helpers = sandbox.promptHelpers;
const plain = value => JSON.parse(JSON.stringify(value));

assert.deepEqual(
  plain(helpers.companionPromptMergeStateMaps(
    { alpha: true, beta: false },
    { alpha: false, gamma: true },
  )),
  { alpha: false, beta: false, gamma: true },
  'current state replaces matching identifiers while preserving other saved identifiers',
);

assert.deepEqual(
  plain(helpers.companionPromptExtendStateMap(
    { alpha: true, deleted: false },
    { alpha: false, added: true },
  )),
  { alpha: true, deleted: false, added: true },
  'new identifiers are added without overwriting an existing baseline',
);

assert.deepEqual(
  plain(helpers.companionPromptUpdateKnownStateMap(
    { alpha: false, deleted: true, unavailable: false },
    { alpha: true, added: true },
  )),
  { alpha: true, deleted: true, unavailable: false },
  'editing a saved role updates known identifiers and preserves missing ones without importing new entries',
);

const order = [
  { identifier: 'alpha', enabled: true },
  { identifier: 'locked', enabled: false },
  { identifier: 'new-entry', enabled: true },
  { identifier: 'deleted', enabled: true },
];
const promptMap = new Map([
  ['alpha', { identifier: 'alpha' }],
  ['locked', { identifier: 'locked', marker: true }],
  ['new-entry', { identifier: 'new-entry' }],
]);
const applied = helpers.companionPromptApplyStateMap(
  order,
  { alpha: false, locked: true, deleted: false, missing: false },
  promptMap,
  prompt => !prompt.marker,
);
assert.deepEqual(plain(applied), {
  applied: ['alpha'],
  changed: ['alpha'],
  missing: ['deleted', 'missing'],
  locked: ['locked'],
  newEntries: ['new-entry'],
});
assert.equal(order[0].enabled, false, 'matching identifiers receive the saved state');
assert.equal(order[1].enabled, false, 'locked entries are never overwritten');
assert.equal(order[2].enabled, true, 'new entries retain their native state');

const restoreIssue = helpers.companionPromptBaselineRestoreIssue(
  [{ identifier: 'alpha', enabled: true }, { identifier: 'locked', enabled: false }],
  [{ identifier: 'alpha' }, { identifier: 'locked', marker: true }],
  { alpha: false, locked: true, missing: true },
  prompt => !prompt.marker,
);
assert.deepEqual(plain(restoreIssue), {
  missing: ['missing'],
  locked: ['locked'],
}, 'baseline recovery must reject missing identifiers and locked entries whose state differs');

const catalog = section(source, '  const COMPANION_FIELDS = [', '  const companionRuntime = {');
assert.match(catalog, /id: 'promptEntries', name: '预设条目开关', type: 'promptEntries'/);
assert.match(source, /promptBaselines: raw\.promptBaselines && typeof raw\.promptBaselines === 'object'/);
assert.match(source, /promptActive: raw\.promptActive && typeof raw\.promptActive === 'object'/);

const roleSave = section(
  source,
  '  function companionPromptSaveRoleState(',
  '  function companionPromptMarkActive(',
);
assert.match(roleSave, /byRole\[overlay\.roleKey\] = \{/);
assert.match(roleSave, /presetName: overlay\.presetName/);
assert.match(roleSave, /companionPromptUpdateKnownStateMap\(previous\?\.states, snapshot\.states\)/);

const preflight = section(
  source,
  '  async function companionPromptPreflight(',
  '  function companionPromptReapplyActiveOverlay(',
);
assert.match(preflight, /saved\.presetName !== presetName/);
assert.match(preflight, /companionPromptEnsureBaseline\(manager, presetName\)/);
assert.match(preflight, /companionPromptRestoreBaseline\(manager, presetName\)/);

const saveBridge = section(
  source,
  '  function companionInstallPromptSaveBridge(',
  '  async function companionPromptManager(',
);
assert.match(saveBridge, /if \(overlay && strategy === 'global' && !presetName\)/);
assert.match(saveBridge, /已取消原生保存/);
assert.match(saveBridge, /const restoreBaseline = \(\) => \{/);
assert.match(saveBridge, /companionPromptRestoreBaseline\(manager, presetName\)/);
assert.match(saveBridge, /original\.apply\(this, args\)/);

assert.match(source, /if \(companionRuntime\.promptOverlay && companionRuntime\.promptOverlay\.roleKey !== role\.key\) \{\s*await companionPromptResetOverlay\(\);\s*\}/);
assert.match(source, /const result = await companionApplyPromptEntries\(target, role, id\)/);
assert.match(source, /newEntries\.push\(id\)/);

console.log('TLE companion prompt-entry identifier mapping, role isolation and shared-preset baseline protections passed.');
