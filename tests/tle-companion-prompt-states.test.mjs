import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('development/organizer/TLE.js');
function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker), end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}
const pureSource = section(source, '  function companionPromptStatesNormalize(', '  function companionCurrentPreset(');
const helpers = new Function(pureSource + '\nreturn { normalize: companionPromptStatesNormalize, matches: companionPromptStatesMatchesPreset, reconcile: companionPromptStatesReconcile };')();
const snapshot = helpers.normalize({
  schema: 1, preset: { selectId: 'settings_preset_openai', value: 'shared-preset', label: '通用预设' },
  entries: [
    { identifier: 'prompt-b', enabled: false, name: '旧名称 B', content: '旧正文 B' },
    { identifier: 'prompt-a', enabled: true, name: '旧名称 A', content: '旧正文 A' },
  ],
});
assert.ok(snapshot);
assert.deepEqual(snapshot.entries, [
  { identifier: 'prompt-a', enabled: true },
  { identifier: 'prompt-b', enabled: false },
]);
assert.deepEqual(Object.keys(snapshot.entries[0]).sort(), ['enabled', 'identifier']);
const reordered = helpers.reconcile(snapshot, [
  { identifier: 'prompt-b', enabled: true, toggleable: true, name: '新名称 B', content: '新正文 B' },
  { identifier: 'new-prompt', enabled: true, toggleable: true },
  { identifier: 'prompt-a', enabled: false, toggleable: true, name: '新名称 A', content: '新正文 A' },
]);
assert.equal(reordered.matched, 2);
assert.deepEqual(reordered.changes, [
  { identifier: 'prompt-a', enabled: true },
  { identifier: 'prompt-b', enabled: false },
]);
assert.deepEqual(reordered.untracked, ['new-prompt']);
assert.deepEqual(reordered.skipped, []);
const deleted = helpers.reconcile(snapshot, [{ identifier: 'prompt-a', enabled: false, toggleable: true }]);
assert.equal(deleted.matched, 1);
assert.equal(deleted.skipped.length, 1);
assert.equal(deleted.skipped[0].identifier, 'prompt-b');
const duplicate = helpers.reconcile({
  schema: 1, preset: { selectId: 'settings_preset_openai', value: 'shared-preset' },
  entries: [{ identifier: 'prompt-a', enabled: true }],
}, [
  { identifier: 'prompt-a', enabled: false, toggleable: true },
  { identifier: 'prompt-a', enabled: true, toggleable: true },
]);
assert.equal(duplicate.changes.length, 0);
assert.match(duplicate.skipped[0].reason, /重复/);
const locked = helpers.reconcile({
  schema: 1, preset: { selectId: 'settings_preset_openai', value: 'shared-preset' },
  entries: [{ identifier: 'prompt-a', enabled: true }],
}, [{ identifier: 'prompt-a', enabled: false, toggleable: false }]);
assert.equal(locked.changes.length, 0);
assert.match(locked.skipped[0].reason, /不可切换/);
assert.equal(helpers.matches(snapshot, { selectId: 'settings_preset_openai', value: 'shared-preset' }), true);
assert.equal(helpers.matches(snapshot, { selectId: 'settings_preset_openai', value: 'different-preset' }), false);
assert.ok(source.includes('row.dataset.pmIdentifier'));
assert.ok(source.includes('data-pm-identifier'));
assert.ok(source.includes("row.querySelector('.prompt-manager-toggle-action')"));
assert.ok(source.includes('toggle.click()'));
assert.ok(source.includes('getPresetApplicationPromise'));
assert.ok(source.includes('companionWaitForPromptManagerStable'));
assert.ok(source.includes('await companionApplyPromptStates(plan.fields.promptStates, plan, state.abort.signal)'));
assert.ok(source.includes('不复制预设正文、条目内容或排列顺序'));
assert.ok(source.includes('新增条目未纳入快照'));
const applyHelper = section(source, '  async function companionApplyPromptStates(', '  function companionPlanPreview(');
assert.doesNotMatch(applyHelper, /\.content\s*=|\.innerHTML\s*=/);
assert.doesNotMatch(applyHelper, /prompt_order/);
console.log('TLE role-specific Prompt Manager state tests passed.');
