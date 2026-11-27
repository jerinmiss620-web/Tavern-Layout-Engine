import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('development/organizer/TLE.js');

function extractFunction(name, nextMarker) {
  const start = source.indexOf('  function ' + name + '(');
  const end = source.indexOf(nextMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source function: ' + name);
  return source.slice(start, end).trim();
}

const editorStart = source.indexOf('  function companionEditorRow(');
const editorEnd = source.indexOf('  async function companionOpenEditor(', editorStart);
assert.ok(editorStart >= 0 && editorEnd > editorStart, 'companion editor row exists');
const editor = source.slice(editorStart, editorEnd);
assert.match(editor, /select\.multiple = true;/);
assert.doesNotMatch(editor, /select\.size\s*=/,
  'the backing multi-select must not force a visible multi-row listbox');
assert.match(editor, /const picker = isWorldInfo \? companionBuildWorldInfoPicker\(select, toggle\) : null;/);
assert.match(editor, /line\.append\(toggle, name, picker\?\.node \|\| select\)/);
assert.match(source, /row\.select\.selectedOptions/,
  'the existing save path must continue reading the backing select selection');
assert.match(source, /\.tle-companion-worldbook-menu\[popover\]\s*\{[^}]*position:\s*fixed/s);
assert.match(source, /\.tle-companion-worldbook-menu\.is-open\s*\{\s*display:\s*flex;/);
assert.match(source, /\.tle-companion-worldbook-picker > select\[hidden\]\s*\{\s*display:\s*none !important;/);

const dom = new JSDOM('<!doctype html><html><body></body></html>', { pretendToBeVisual: true });
const { window } = dom;
const sandbox = {
  HOST_WIN: window,
  HOST_DOC: window.document,
  quickSequence: 0,
  quickNode(tag, className = '', text = '') {
    const node = window.document.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  },
};
const buildPicker = vm.runInNewContext(
  '(' + extractFunction('companionBuildWorldInfoPicker', '  function companionEditorRow') + ')',
  sandbox,
);

const select = window.document.createElement('select');
select.multiple = true;
for (const [value, label, selected, disabled] of [
  ['a', '世界书 A', true, false],
  ['b', '世界书 B', false, false],
  ['missing', '原配置（当前未读取）：世界书 C', true, true],
]) {
  const option = window.document.createElement('option');
  option.value = value;
  option.textContent = label;
  option.selected = selected;
  option.disabled = disabled;
  select.append(option);
}
const toggle = window.document.createElement('input');
toggle.type = 'checkbox';
toggle.checked = true;

const picker = buildPicker(select, toggle);
window.document.body.append(picker.node);
const checkboxes = [...picker.menu.querySelectorAll('input[type="checkbox"]')];

assert.equal(select.hidden, true, 'the native select is retained as a hidden data source');
assert.equal(select.multiple, true);
assert.equal(picker.trigger.querySelector('span').textContent, '已选 2 本世界书');
assert.equal(checkboxes.length, 3);
assert.equal(checkboxes[0].checked, true);
assert.equal(checkboxes[1].checked, false);
assert.equal(checkboxes[2].checked, true);
assert.equal(checkboxes[2].disabled, true,
  'a saved but currently unavailable worldbook stays selected and unavailable');

picker.trigger.click();
assert.equal(picker.menu.classList.contains('is-open'), true);
checkboxes[1].checked = true;
checkboxes[1].dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(select.options[1].selected, true);
assert.equal(picker.trigger.querySelector('span').textContent, '已选 3 本世界书');

checkboxes[0].checked = false;
checkboxes[0].dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(select.options[0].selected, false);
assert.deepEqual([...select.selectedOptions].map(option => option.value), ['b', 'missing']);
assert.equal(picker.trigger.querySelector('span').textContent, '已选 2 本世界书');

window.document.body.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
assert.equal(picker.menu.classList.contains('is-open'), false,
  'clicking outside closes the fallback dropdown');
picker.trigger.click();
window.document.dispatchEvent(new window.KeyboardEvent('keydown', {
  key: 'Escape', bubbles: true, cancelable: true,
}));
assert.equal(picker.menu.classList.contains('is-open'), false,
  'Escape closes the dropdown');
assert.equal(window.document.activeElement, picker.trigger);

toggle.checked = false;
toggle.dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(picker.trigger.disabled, true);
assert.ok(checkboxes.every(checkbox => checkbox.disabled));
assert.equal(picker.menu.classList.contains('is-open'), false);

toggle.checked = true;
toggle.dispatchEvent(new window.Event('change', { bubbles: true }));
assert.equal(picker.trigger.disabled, false);
assert.equal(checkboxes[1].disabled, false);
assert.equal(checkboxes[2].disabled, true,
  're-enabling the row must not unlock unavailable saved items');

dom.window.close();
console.log('TLE companion worldbook dropdown and multi-select synchronization checks passed.');
