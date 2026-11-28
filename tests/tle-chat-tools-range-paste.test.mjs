import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const source = readFileSync(new URL('../development/organizer/TLE.js', import.meta.url), 'utf8');

function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return source.slice(start, end);
}

const dom = new JSDOM('<!doctype html><html><body></body></html>');
const notifications = [];
const sandbox = {
  HOST_WIN: dom.window,
  chatActionNotify: (kind, message) => notifications.push({ kind, message }),
};
const helpers = section(
  '  function parseChatActionRangePaste(',
  '  function syncChatActionClearButton(',
);
vm.runInNewContext(
  helpers + '\nglobalThis.rangePasteApi = { parseChatActionRangePaste, bindChatActionRangePaste };',
  sandbox,
);
const api = sandbox.rangePasteApi;

function assertRange(value, start, end) {
  const parsed = api.parseChatActionRangePaste(value);
  assert.equal(parsed?.start, String(start), 'range start should be parsed');
  assert.equal(parsed?.end, String(end), 'range end should be parsed');
  assert.equal(parsed?.error, undefined, 'valid range should not produce an error');
}

assertRange('20 - 35', 20, 35);
assertRange('20–35', 20, 35);
assertRange('20—35', 20, 35);
assertRange('20－35', 20, 35);
assertRange('20−35', 20, 35);
assertRange('00020 – 00035', 20, 35);
assertRange('90', 90, 90);
assertRange('0', 0, 0);

assert.match(api.parseChatActionRangePaste('35–20')?.error || '', /起始楼层不能大于结束楼层/);
assert.match(api.parseChatActionRangePaste('9007199254740992')?.error || '', /超出有效范围/);
assert.match(api.parseChatActionRangePaste('20–25，30–35')?.error || '', /多个不连续范围/);
assert.match(api.parseChatActionRangePaste('20, 25, 30')?.error || '', /多个不连续范围/);
assert.equal(api.parseChatActionRangePaste('not a range'), null);
assert.equal(api.parseChatActionRangePaste(''), null);

const startInput = dom.window.document.createElement('input');
const endInput = dom.window.document.createElement('input');
let startInputEvents = 0;
let endInputEvents = 0;
startInput.addEventListener('input', () => startInputEvents++);
endInput.addEventListener('input', () => endInputEvents++);

// Both fields receive the same handler, so pasting into either one has identical behavior.
api.bindChatActionRangePaste(startInput, startInput, endInput);
api.bindChatActionRangePaste(endInput, startInput, endInput);

function paste(target, text) {
  const event = new dom.window.Event('paste', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: type => type === 'text/plain' ? text : '' },
  });
  target.dispatchEvent(event);
  return event;
}

let event = paste(startInput, '20 – 35');
assert.equal(event.defaultPrevented, true);
assert.equal(startInput.value, '20');
assert.equal(endInput.value, '35');
assert.equal(startInputEvents, 1);
assert.equal(endInputEvents, 1);

event = paste(endInput, '90');
assert.equal(event.defaultPrevented, true);
assert.equal(startInput.value, '90');
assert.equal(endInput.value, '90');
assert.equal(startInputEvents, 2);
assert.equal(endInputEvents, 2);

startInput.value = '4';
endInput.value = '8';
event = paste(endInput, '20–25，30–35');
assert.equal(event.defaultPrevented, true, 'multi-range paste must be intercepted rather than inserted into one numeric field');
assert.equal(startInput.value, '4', 'multi-range paste must not overwrite the current start value');
assert.equal(endInput.value, '8', 'multi-range paste must not overwrite the current end value');
assert.match(notifications.at(-1)?.message || '', /多个不连续范围/);

event = paste(startInput, '35-20');
assert.equal(event.defaultPrevented, true, 'reversed ranges must be intercepted');
assert.equal(startInput.value, '4');
assert.equal(endInput.value, '8');
assert.match(notifications.at(-1)?.message || '', /起始楼层不能大于结束楼层/);

event = paste(startInput, 'plain text');
assert.equal(event.defaultPrevented, false, 'unrecognized clipboard text should retain native paste behavior');

assert.match(source, /bindChatActionRangePaste\(start\.input, start\.input, end\.input\)/);
assert.match(source, /bindChatActionRangePaste\(end\.input, start\.input, end\.input\)/);
assert.match(source, /复制的单段范围可粘贴到任一框自动拆分/);

console.log('TLE chat range paste passed: either input accepts one range; single floors mirror to both fields; multi-range and invalid values are safely rejected.');
