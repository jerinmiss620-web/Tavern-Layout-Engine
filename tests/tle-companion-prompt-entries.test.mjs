import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(path.join(root, 'development/organizer/TLE.js'), 'utf8');

const helperStart = source.indexOf('function companionPromptMergeStateMaps');
const helperEnd = source.indexOf('function companionPromptCurrentPresetName', helperStart);
assert.ok(helperStart >= 0 && helperEnd > helperStart, 'Prompt-state pure helpers must exist in the Organizer Core');

const sandbox = vm.createContext({});
const helperSource = source.slice(helperStart, helperEnd)
  + '\nthis.promptStateHelpers = { companionPromptMergeStateMaps, companionPromptExtendStateMap, companionPromptUpdateKnownStateMap, companionPromptApplyStateMap };';
new vm.Script(helperSource, { filename: 'TLE companion prompt-state helpers' }).runInContext(sandbox);
const helpers = sandbox.promptStateHelpers;
const plain = value => JSON.parse(JSON.stringify(value));

const tests = [
  {
    name: 'updates only previously recorded identifiers and leaves new entries native until explicit re-collection',
    run() {
      const updated = helpers.companionPromptUpdateKnownStateMap(
        { keep: false, deleted: true },
        { keep: true, added: false },
      );
      assert.deepEqual(plain(updated), { keep: true, deleted: true });
    },
  },

  {
    name: 'detects missing baseline identifiers and locked entries whose live state differs, while allowing already-correct locked and new entries',
    run() {
      const issue = helpers.companionPromptBaselineRestoreIssue(
        [
          { identifier: 'available', enabled: true },
          { identifier: 'locked', enabled: true },
          { identifier: 'locked-correct', enabled: false },
          { identifier: 'new-entry', enabled: true },
        ],
        [
          { identifier: 'available' },
          { identifier: 'locked', locked: true },
          { identifier: 'locked-correct', locked: true },
          { identifier: 'new-entry' },
        ],
        { available: false, locked: false, 'locked-correct': false, deleted: true },
        prompt => !prompt.locked,
      );
      assert.deepEqual(plain(issue), { missing: ['deleted'], locked: ['locked'] });
    },
  },
  {
    name: 'stores only identifier-to-enabled mappings and merges updates without losing stale identifiers',
    run() {
      const merged = helpers.companionPromptMergeStateMaps(
        { keep: false, deleted: true },
        { keep: true, added: false },
      );
      assert.deepEqual(plain(merged), { keep: true, deleted: true, added: false });

      const extended = helpers.companionPromptExtendStateMap(
        { keep: false, deleted: true },
        { keep: true, added: false },
      );
      assert.deepEqual(plain(extended), { keep: false, deleted: true, added: false });
    },
  },
  {
    name: 'matches by identifier after reordering and ignores changed prompt names or content',
    run() {
      const order = [
        { identifier: 'second', enabled: true },
        { identifier: 'first', enabled: false },
        { identifier: 'new-entry', enabled: true },
      ];
      const orderBefore = order.map(entry => entry.identifier);
      const promptMap = new Map([
        ['first', { identifier: 'first', name: 'Renamed prompt', content: 'Edited body' }],
        ['second', { identifier: 'second', name: 'Changed label', content: 'Changed body' }],
        ['new-entry', { identifier: 'new-entry', name: 'New entry', content: 'New body' }],
      ]);

      const result = helpers.companionPromptApplyStateMap(
        order,
        { first: true, second: false },
        promptMap,
        () => true,
      );

      assert.deepEqual(order.map(entry => entry.identifier), orderBefore, 'Applying state must not change native preset order');
      assert.equal(order[0].enabled, false, 'The second entry must be matched by identifier, not its former index');
      assert.equal(order[1].enabled, true, 'Renamed/edited entries must still match their stable identifier');
      assert.equal(order[2].enabled, true, 'Entries absent from the saved state must retain their current state');
      assert.deepEqual(plain(result), {
        applied: ['first', 'second'],
        changed: ['first', 'second'],
        missing: [],
        locked: [],
        newEntries: ['new-entry'],
      });
    },
  },
  {
    name: 'reports deleted identifiers independently while still applying every available entry',
    run() {
      const order = [
        { identifier: 'available', enabled: false },
        { identifier: 'locked', enabled: true },
      ];
      const promptMap = new Map([
        ['available', { identifier: 'available' }],
        ['locked', { identifier: 'locked' }],
      ]);

      const result = helpers.companionPromptApplyStateMap(
        order,
        { deleted: true, available: true, locked: false },
        promptMap,
        prompt => prompt.identifier !== 'locked',
      );

      assert.equal(order[0].enabled, true, 'A missing item must not block other matches');
      assert.equal(order[1].enabled, true, 'A locked native item must remain unchanged');
      assert.deepEqual(plain(result), {
        applied: ['available'],
        changed: ['available'],
        missing: ['deleted'],
        locked: ['locked'],
        newEntries: [],
      });
    },
  },
  {
    name: 'preserves the original order array and leaves new entries outside the saved state untouched',
    run() {
      const order = [
        { identifier: 'a', enabled: false },
        { identifier: 'b', enabled: true },
        { identifier: 'c', enabled: false },
      ];
      const before = order.map(entry => entry.identifier);
      const result = helpers.companionPromptApplyStateMap(
        order,
        { b: false },
        new Map(order.map(entry => [entry.identifier, { identifier: entry.identifier }])),
        () => true,
      );
      assert.deepEqual(order.map(entry => entry.identifier), before);
      assert.equal(order[0].enabled, false);
      assert.equal(order[1].enabled, false);
      assert.equal(order[2].enabled, false);
      assert.deepEqual(plain(result.newEntries), ['a', 'c']);
    },
  },
];

  {
    name: 'baseline restore blocks missing and mismatched locked entries before mutation',
    run() {
      const restoreStart = source.indexOf('function companionPromptRestoreBaseline');
      const restoreEnd = source.indexOf('function companionPromptRoleStateExists', restoreStart);
      const restoreSource = source.slice(restoreStart, restoreEnd);
      const build = ({ baseline, order, prompts, canToggle }) => {
        const sandbox = vm.createContext({});
        sandbox.applyCalls = 0;
        sandbox.companionRead = () => ({ promptBaselines: { SharedPreset: baseline } });
        sandbox.companionPromptOrder = () => order;
        sandbox.companionPromptCanToggle = (_manager, prompt) => canToggle(prompt);
        sandbox.companionPromptApplyToManager = () => {
          sandbox.applyCalls++;
          return { applied: [], changed: [], missing: [], locked: [], newEntries: [] };
        };
        new vm.Script(helperSource + '\n' + restoreSource + '\nthis.restore = companionPromptRestoreBaseline;').runInContext(sandbox);
        const manager = { serviceSettings: { prompts } };
        return { sandbox, manager };
      };
      const locked = build({
        baseline: { locked: false },
        order: [{ identifier: 'locked', enabled: true }],
        prompts: [{ identifier: 'locked', locked: true }],
        canToggle: prompt => !prompt.locked,
      });
      assert.throws(() => locked.sandbox.restore(locked.manager, 'SharedPreset'),
        error => error.code === 'TLE_PROMPT_BASELINE_RESTORE_FAILED');
      assert.equal(locked.sandbox.applyCalls, 0, 'A locked mismatch must be detected before any preset mutation');
      const missing = build({
        baseline: { deleted: true },
        order: [],
        prompts: [],
        canToggle: () => true,
      });
      assert.throws(() => missing.sandbox.restore(missing.manager, 'SharedPreset'),
        error => error.code === 'TLE_PROMPT_BASELINE_RESTORE_FAILED');
      assert.equal(missing.sandbox.applyCalls, 0, 'A missing baseline identifier must stop restoration before mutation');
      const alreadyCorrect = build({
        baseline: { locked: true },
        order: [{ identifier: 'locked', enabled: true }],
        prompts: [{ identifier: 'locked', locked: true }],
        canToggle: prompt => !prompt.locked,
      });
      const result = alreadyCorrect.sandbox.restore(alreadyCorrect.manager, 'SharedPreset');
      assert.equal(result.baseline.locked, true, 'A locked entry already matching the baseline is safe');
      assert.equal(alreadyCorrect.sandbox.applyCalls, 1);
    },
  },
for (const test of tests) {
  test.run();
  console.log('✓ ' + test.name);
}

const fieldsStart = source.indexOf('const COMPANION_FIELDS');
const fieldsEnd = source.indexOf('];', fieldsStart);
const fields = source.slice(fieldsStart, fieldsEnd);
assert.ok(fields.indexOf("id: 'promptEntries'") > fields.indexOf("id: 'preset'"),
  'Prompt-entry state must be applied after the preset field');

const snapshotStart = source.indexOf('function companionPromptSnapshotFromManager');
const snapshotEnd = source.indexOf('function companionPromptApplyToManager', snapshotStart);
const snapshot = source.slice(snapshotStart, snapshotEnd);
assert.match(snapshot, /states\[id\] = Boolean\(entry\.enabled\)/);
assert.doesNotMatch(snapshot, /prompt\.content|prompt\.name|injection_order|position|prompt_order\s*:/,
  'The snapshot must not copy prompt bodies, labels, injection order, or the preset order array');
assert.match(source, /function companionPromptSaveRoleState[\s\S]*byRole\[overlay\.roleKey\]/,
  'Prompt state must be saved separately for each role using the same plan');
assert.match(source, /function companionApplyPromptEntries[\s\S]*saved\.presetName !== presetName/,
  'A saved state must not be applied to a different preset');
assert.match(source, /function companionPromptOnSettingsUpdated/,
  'External preset saves must be isolated from the active role overlay');
assert.match(source, /function companionInstallPromptSaveBridge/,
  'Native Prompt Manager saves must preserve the preset baseline');
assert.match(source, /newEntries\.push\(id\)/,
  'New prompt entries must be detected and left to the current native state');


// Saving one role's live overlay updates only identifiers already recorded for that role.
const saveStart = source.indexOf('function companionPromptSaveRoleState');
const saveEnd = source.indexOf('function companionPromptMarkActive', saveStart);
assert.ok(saveStart >= 0 && saveEnd > saveStart, 'Role-state save function must exist');
const roleSandbox = vm.createContext({});
roleSandbox.roleStore = {
  plans: [{
    id: 'shared-plan',
    roles: ['role-A', 'role-B'],
    fields: { promptEntries: { byRole: {
      'role-A': { presetName: 'Shared Preset', states: { keep: false, deleted: true } },
      'role-B': { presetName: 'Shared Preset', states: { keep: true } },
    } } },
  }],
};
roleSandbox.companionRead = () => roleSandbox.roleStore;
roleSandbox.companionSave = data => { roleSandbox.roleStore = JSON.parse(JSON.stringify(data)); return true; };
roleSandbox.companionRefreshList = () => {};
new vm.Script(
  source.slice(helperStart, helperEnd)
  + '\n' + source.slice(saveStart, saveEnd)
  + '\nthis.saveRoleState = companionPromptSaveRoleState;',
  { filename: 'TLE companion role-state persistence' },
).runInContext(roleSandbox);
assert.equal(roleSandbox.saveRoleState(
  { planId: 'shared-plan', roleKey: 'role-A', presetName: 'Shared Preset' },
  { states: { keep: true, added: false } },
), true);
const roleStates = roleSandbox.roleStore.plans[0].fields.promptEntries.byRole;
assert.deepEqual(plain(roleStates['role-A'].states), { keep: true, deleted: true });
assert.deepEqual(plain(roleStates['role-B'].states), { keep: true });

const bridgeStart = source.indexOf('function companionInstallPromptSaveBridge');
const bridgeEnd = source.indexOf('async function companionPromptManager', bridgeStart);
const bridge = source.slice(bridgeStart, bridgeEnd);
assert.match(bridge, /companionPromptRestoreBaseline/);
assert.match(bridge, /persistBaseline\(true, baseline\)/);
assert.doesNotMatch(bridge, /companionPromptApplyToManager\(manager, snapshot\.states\)/,
  'Restoring an overlay must not reapply new identifiers that are not in the saved role map');

const restoreStart = source.indexOf('function companionPromptRestoreBaseline');
const restoreEnd = source.indexOf('function companionPromptRoleStateExists', restoreStart);
const restore = source.slice(restoreStart, restoreEnd);
assert.match(restore, /companionPromptBaselineRestoreIssue/);
assert.match(restore, /TLE_PROMPT_BASELINE_RESTORE_FAILED/);
assert.ok(restore.indexOf('companionPromptBaselineRestoreIssue') < restore.indexOf('companionPromptApplyToManager'),
  'Baseline restoration must preflight recorded identifiers before mutating the preset');

const preflightStart = source.indexOf('async function companionPromptPreflight');
const preflightEnd = source.indexOf('function companionPromptReapplyActiveOverlay', preflightStart);
const preflight = source.slice(preflightStart, preflightEnd);
assert.match(preflight, /companionPromptRestoreBaseline/);
assert.match(preflight, /TLE_PROMPT_BASELINE_RESTORE_FAILED/);

const applyEntriesStart = source.indexOf('async function companionApplyPromptEntries');
const applyEntriesEnd = source.indexOf('async function companionCatalogs', applyEntriesStart);
assert.match(source.slice(applyEntriesStart, applyEntriesEnd), /companionPromptRestoreBaseline/);


const resetStart = source.indexOf('async function companionPromptResetOverlay');
const resetEnd = source.indexOf('function companionPromptReapplyActiveOverlay', resetStart);
const reset = source.slice(resetStart, resetEnd);
assert.match(reset, /companionPromptRestoreBaseline/);
assert.ok(reset.indexOf('companionPromptRestoreBaseline') < reset.indexOf('companionRuntime.promptOverlay = null'),
  'The active overlay must not be cleared until its native baseline has been restored');
const applyStart = source.indexOf('async function companionApply(');
const applyEnd = source.indexOf('function companionOnChatChanged(', applyStart);
const apply = source.slice(applyStart, applyEnd);
assert.match(apply, /if \(resetResult\.issue\) \{[\s\S]*?throw new Error/,
  'A failed previous-role reset must stop the new plan before it can capture the wrong baseline');
assert.ok(apply.includes('await companionPromptPreflight(plan, role)'),
  'The new plan must validate its prompt baseline before applying any other fields');
assert.ok(apply.includes("error?.code === 'TLE_PROMPT_BASELINE_RESTORE_FAILED'"),
  'A prompt baseline safety failure must escape the per-field skip handler and stop the plan');

console.log('✓ companion prompt-entry integration contract');
