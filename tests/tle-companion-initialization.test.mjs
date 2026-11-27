import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const plan = JSON.parse(read('release-plan.json'));
const source = read('releases/v' + plan.core + '/TLE.js');

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}

test('Global World Info is captured as a complete multi-select field', () => {
  const fields = section(source, '  const COMPANION_FIELDS = [', '  const companionRuntime = {');
  const entry = section(source, '  function companionEntryId(', '  async function companionCatalogs(');
  const snapshot = section(source, '  function companionSnapshot(', '  function companionPlanPreview(');
  const sandbox = {};
  vm.runInNewContext(fields + '\n' + entry + '\n' + snapshot
    + '\nglobalThis.capture = companionSnapshot;', sandbox);
  const result = sandbox.capture({
    worldInfo: [
      { selected: true, disabled: false, value: 'book-a', label: 'Book A' },
      { selected: true, disabled: false, value: 'book-b', label: 'Book B' },
      { selected: true, disabled: true, value: 'book-disabled', label: 'Disabled Book' },
      { selected: false, disabled: false, value: 'book-off', label: 'Off Book' },
    ],
    api: [
      { selectId: 'connection_profiles', value: 'profile-a', label: 'Profile A', selected: true },
      { selectId: 'chat_completion_source', value: 'openai', label: 'OpenAI', selected: true },
      { selectId: 'model', value: 'gpt-model', label: 'GPT Model', section: '模型', selected: true },
    ],
    preset: [{ selectId: 'settings_preset_openai', value: 'Default', label: 'Default', selected: true }],
    reasoning: [{ selectId: 'reasoning_select', value: 'draft', label: 'Draft', selected: true }],
    theme: [{ selectId: 'theme_select', value: 'Everbloom', label: 'Everbloom', selected: true }],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(result.worldInfo)), {
    selectId: 'world_info',
    value: ['book-a', 'book-b'],
    items: [{ value: 'book-a', label: 'Book A' }, { value: 'book-b', label: 'Book B' }],
    label: '已选 2 本：Book A、Book B',
  });
  assert.equal(result.theme.value, 'Everbloom');
});

test('Applying a World Info plan synchronizes the full saved selection and reports missing books', () => {
  const helper = section(source, '  function companionApplyWorldInfo(', '  async function companionApply(');
  const events = [];
  const select = {
    disabled: false,
    multiple: true,
    options: [
      { value: 'book-a', selected: true, hidden: false, disabled: false, textContent: 'Book A', parentElement: null },
      { value: 'book-b', selected: false, hidden: false, disabled: false, textContent: 'Book B', parentElement: null },
      { value: 'book-c', selected: true, hidden: false, disabled: false, textContent: 'Book C', parentElement: null },
    ],
    dispatchEvent(event) { events.push(event.type); },
  };
  const sandbox = {
    HOST_WIN: { Event: class { constructor(type) { this.type = type; } } },
    withQuickWorldInfoControl: callback => callback(select),
  };
  vm.runInNewContext(helper + '\nglobalThis.apply = companionApplyWorldInfo;', sandbox);
  const result = sandbox.apply({
    value: ['book-b', 'book-missing'],
    items: [{ value: 'book-missing', label: 'Missing Book' }],
  });
  assert.deepEqual(select.options.map(option => option.selected), [false, true, false],
    'available world books must match the saved set exactly');
  assert.deepEqual(JSON.parse(JSON.stringify(result.issues)), [
    { value: 'book-missing', label: 'Missing Book' },
  ]);
  assert.deepEqual(events, ['change']);
});

test('Fresh host startup restores the current role default; same-page Core reload does not replay it', () => {
  const startup = section(source, '  function companionIsFreshHostStartup(', '  function companionCurrentRole(');
  const startupSandbox = {};
  vm.runInNewContext(startup + '\nglobalThis.evaluate = companionIsFreshHostStartup;', startupSandbox);
  assert.equal(startupSandbox.evaluate(null, false), true);
  assert.equal(startupSandbox.evaluate({}, false), false);
  assert.equal(startupSandbox.evaluate(null, true), false);

  const decision = section(source, '  function companionShouldAutoApply(', '  async function companionApply(');
  const decisionSandbox = {};
  vm.runInNewContext(decision + '\nglobalThis.evaluate = companionShouldAutoApply;', decisionSandbox);
  const shouldApply = decisionSandbox.evaluate;
  const defaultChoice = { id: 'default', slot: null };
  const scheduledChoice = { id: 'day', slot: { token: 'avatar-a|day-start|day' } };
  assert.equal(shouldApply({ choice: defaultChoice }), false);
  assert.equal(shouldApply({ choice: defaultChoice, startupRestore: true }), true);
  assert.equal(shouldApply({ choice: null, startupRestore: true }), false);
  assert.equal(shouldApply({ choice: defaultChoice, changed: true }), true);
  assert.equal(shouldApply({ choice: defaultChoice, force: true }), true);
  assert.equal(shouldApply({ choice: scheduledChoice }), false);
  assert.equal(shouldApply({ choice: scheduledChoice, startupRestore: true }), true);
  assert.equal(shouldApply({ choice: scheduledChoice, boundaryChanged: true }), true);
  assert.equal(shouldApply({ choice: scheduledChoice, boundaryChanged: true, manualHold: true }), false);
});

test('Delayed startup restore is bounded and uses existing host events without synthetic role changes', () => {
  const queue = section(source, '  function companionQueueStartupRestore(', '  function companionBindEvents(');
  const bind = section(source, '  function companionBindEvents(', '  function companionCleanup(');
  const onChange = section(source, '  function companionOnChatChanged(', '  function companionQueueStartupRestore(');
  assert.match(queue, /attempt >= 30/);
  assert.match(queue, /setTimeout/);
  assert.match(queue, /}, 500\)/);
  assert.match(bind, /const freshHostStartup = companionIsFreshHostStartup/);
  assert.match(bind, /companionRuntime\.startupRestorePending = freshHostStartup/);
  assert.match(bind, /if \(freshHostStartup && !initialRole\) companionQueueStartupRestore\(\)/);
  assert.match(bind, /CHAT_CHANGED/);
  assert.match(bind, /CHAT_LOADED/);
  assert.doesNotMatch(bind, /emit\(['"]CHAT_CHANGED/);
  assert.match(onChange, /const startupRestore = companionRuntime\.startupRestorePending/);
  assert.match(onChange, /companionShouldAutoApply\(\{ choice, force, changed, boundaryChanged, manualHold, startupRestore \}\)/);
});
