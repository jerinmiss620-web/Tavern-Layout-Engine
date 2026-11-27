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
  + '\nthis.promptStateHelpers = { companionPromptMergeStateMaps, companionPromptExtendStateMap, companionPromptApplyStateMap };';
new vm.Script(helperSource, { filename: 'TLE companion prompt-state helpers' }).runInContext(sandbox);
const helpers = sandbox.promptStateHelpers;
const plain = value => JSON.parse(JSON.stringify(value));

const tests = [
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

console.log('✓ companion prompt-entry integration contract');
