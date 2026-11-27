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

const helpers = section(
  source,
  '  function maskHeroIsUnsafeRegex(',
  '  function maskHeroCreateEmptyDraft(',
);
const sandbox = {};
vm.runInNewContext(helpers + `
globalThis.maskHeroHelpers = { maskHeroIsUnsafeRegex, maskHeroApplyTextRules, maskHeroValidateDraft };
`, sandbox);
const api = sandbox.maskHeroHelpers;

assert.equal(
  api.maskHeroApplyTextRules('Alice', [
    { find: 'Alice', replace: 'Bob' },
    { find: 'Bob', replace: 'Carol' },
  ]),
  'Bob',
  'replacement output must not be fed into the next rule',
);

assert.equal(
  api.maskHeroApplyTextRules('Alice met Bob', [
    { find: 'Alice', replace: 'Bob' },
    { find: 'Bob', replace: 'Carol' },
  ]),
  'Bob met Carol',
  'all rules match the original text once, not the progressively replaced output',
);

assert.equal(
  api.maskHeroApplyTextRules('abc', [
    { find: 'ab', replace: 'X' },
    { find: 'bc', replace: 'Y' },
  ]),
  'Xc',
  'overlapping matches resolve deterministically by rule order',
);

assert.equal(
  api.maskHeroApplyTextRules('Contact USER@example.com now', [
    { find: 'user@[^\\s]+', replace: '[email]', regex: true, caseInsensitive: true },
  ]),
  'Contact [email] now',
  'regex matching supports case-insensitive replacement',
);

assert.equal(
  api.maskHeroApplyTextRules('A.B A.B', [
    { find: 'A.B', replace: 'assert.equal(
  api.maskHeroApplyTextRules('A.B A.B', [
    { find: 'A.B', replace: '$&', regex: false },
  ]),
  '$& $&',
  'literal matching treats regex punctuation and replacement tokens as ordinary text',
);', regex: false },
  ]),
  'assert.equal(
  api.maskHeroApplyTextRules('A.B A.B', [
    { find: 'A.B', replace: '$&', regex: false },
  ]),
  '$& $&',
  'literal matching treats regex punctuation and replacement tokens as ordinary text',
); assert.equal(
  api.maskHeroApplyTextRules('A.B A.B', [
    { find: 'A.B', replace: '$&', regex: false },
  ]),
  '$& $&',
  'literal matching treats regex punctuation and replacement tokens as ordinary text',
);',
  'literal matching treats regex punctuation and replacement tokens as ordinary text',
);

assert.equal(
  api.maskHeroApplyTextRules('EMAIL email Email', [
    { find: 'email', replace: '[email]', regex: false, caseInsensitive: true },
  ]),
  '[email] [email] [email]',
  'literal matching honors the case-insensitive option',
);

assert.equal(
  api.maskHeroApplyTextRules('abc', [
    { find: 'a*', replace: 'x', regex: true },
  ]),
  'abc',
  'zero-width regex rules are ignored defensively',
);

assert.equal(api.maskHeroIsUnsafeRegex('(a+)+$'), true);
assert.equal(api.maskHeroIsUnsafeRegex('\\\\1'), true);
assert.equal(api.maskHeroIsUnsafeRegex('user@[^\\s]+'), false);

assert.throws(
  () => api.maskHeroValidateDraft({
    userName: '', charName: '',
    floorRules: [{ floor: '', replace: 'hidden' }],
    textRules: [],
  }),
  /填写楼层号/,
  'floor rules require an explicit non-negative message id',
);

assert.throws(
  () => api.maskHeroValidateDraft({
    userName: '', charName: '',
    floorRules: [{ floor: 1, replace: 'a' }, { floor: 1, replace: 'b' }],
    textRules: [],
  }),
  /不能重复/,
  'duplicate floor replacement rules are rejected',
);

assert.throws(
  () => api.maskHeroValidateDraft({
    userName: '', charName: '',
    floorRules: [],
    textRules: [{ find: '^', replace: 'x', regex: true }],
  }),
  /空字符串/,
  'zero-width regex patterns are rejected',
);

assert.throws(
  () => api.maskHeroValidateDraft({
    userName: '', charName: '',
    floorRules: [],
    textRules: [{ find: '(a+)+$', replace: 'x', regex: true }],
  }),
  /高风险/,
  'nested quantified regex patterns are rejected',
);

assert.equal(
  api.maskHeroValidateDraft({
    userName: '匿名用户',
    charName: '匿名角色',
    floorRules: [{ floor: 0, replace: '[首楼内容已隐藏]' }],
    textRules: [{ find: 'secret@example.com', replace: '[邮箱]', regex: false }],
  }),
  true,
  'a normal display-only mask plan validates',
);

// Integration guards: the module is optional, scoped to the active chat, and reversible.
assert.match(source, /getStoredBool\(MASK_HERO_ENABLED_KEY, false\)/);
assert.match(source, /data-tle-setting="mask-hero-enabled"/);
assert.match(source, /data-chat-tools-tab="mask"/);
assert.match(source, /data-chat-tools-page="mask"/);
assert.match(source, /if \(!maskHeroEnabled\) \{\s*maskHeroClearEffects\(\)/);
assert.match(source, /TLEMaskHeroAssets/);
assert.match(source, /new HOST_WIN\.MutationObserver\(\(\) => maskHeroScheduleProcess\(\)\)/);
assert.match(source, /#chat \.mes \.name_text\[data-tle-mask-name\]/);
assert.match(source, /function maskHeroApplyFloorReplacement\(body, replacement\)/);
assert.match(source, /body\.setAttribute\('data-tle-mask-floor', 'true'\)/);
assert.match(source, /element\.replaceChildren\(\.\.\.before, record\.original, \.\.\.after\)/);
assert.match(source, /message\.querySelectorAll\('\.mesAvatarWrapper img, \.avatar img'\)/);
assert.match(source, /#chat \.mes_edit, #chat \.mes_edit_button, #chat \[data-mes-edit\]/);
assert.match(source, /切换聊天会自动卸除/);
assert.match(source, /addEventListener\('click', unmaskBeforeNativeEdit/);
assert.match(source, /runtime\.applyGeneration \+= 1/);
assert.match(source, /已取消旧的应用操作/);

const runtime = section(
  source,
  '  function maskHeroIsUnsafeRegex(',
  '  async function openRecentChatItem(',
);
assert.doesNotMatch(runtime, /saveChatConditional|saveChat\(|writeChat|POST\s*\(/i,
  'Mask Hero must not write to the host chat file or message API');

console.log('TLE Mask Hero tests passed: one-pass replacement, regex safety, floor validation, optional setting, current-chat scope and display-only boundaries.');
