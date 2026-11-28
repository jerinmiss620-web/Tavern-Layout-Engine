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
vm.runInNewContext(helpers + '\nglobalThis.maskHeroHelpers = { maskHeroIsUnsafeRegex, maskHeroApplyTextRules, maskHeroIsWithinScope, maskHeroValidateDraft };', sandbox);
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
    { find: 'A.B', replace: '$&', regex: false },
  ]),
  '$& $&',
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

const messageAt = floor => ({ getAttribute: name => name === 'mesid' ? String(floor) : null, dataset: {} });
assert.equal(api.maskHeroIsWithinScope({ mode: 'all' }, messageAt(0), 0, 10), true);
assert.equal(api.maskHeroIsWithinScope({ mode: 'latest', count: 5 }, messageAt(5), 5, 10), true);
assert.equal(api.maskHeroIsWithinScope({ mode: 'latest', count: 5 }, messageAt(4), 4, 10), false);
assert.equal(api.maskHeroIsWithinScope({ mode: 'range', start: 2, end: 4 }, messageAt(3), 3, 10), true);
assert.equal(api.maskHeroIsWithinScope({ mode: 'range', start: 2, end: 4 }, messageAt(5), 5, 10), false);
assert.equal(api.maskHeroIsWithinScope({ mode: 'unknown' }, messageAt(3), 3, 10), false);

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
    globalScope: { mode: 'latest', count: 0 }, bodyRule: { enabled: true, replace: '[hidden]' },
    floorRules: [],
    textRules: [],
  }),
  /最新层数/,
  'latest body replacement requires a positive message count',
);

assert.throws(
  () => api.maskHeroValidateDraft({ userName: '', charName: '', globalScope: { mode: 'range', start: 8, end: 3 }, bodyRule: { enabled: false }, floorRules: [], textRules: [] }),
  /楼层区间/,
  'body range must be a valid inclusive floor interval',
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
    globalScope: { mode: 'latest', count: 5, start: '', end: '' },
    bodyRule: { enabled: true, replace: '[正文已隐藏]' },
    floorRules: [{ floor: 0, replace: '[首楼内容已隐藏]' }],
    textRules: [{ find: 'secret@example.com', replace: '[邮箱]', regex: false }],
  }),
  true,
  'a normal display-only mask plan validates',
);


// Empty plans default to all floors without enabling any masking operation.
const planSection = section(
  source,
  '  function maskHeroCreateEmptyDraft(',
  '  function maskHeroLoadPlans(',
);
const planSandbox = {};
vm.runInNewContext(planSection + '\nglobalThis.maskHeroPlanHelpers = { maskHeroCreateEmptyDraft, maskHeroNormalizePlan };', planSandbox);
const planApi = planSandbox.maskHeroPlanHelpers;
const emptyPlan = JSON.parse(JSON.stringify(planApi.maskHeroCreateEmptyDraft()));
assert.deepEqual(emptyPlan.globalScope, { mode: 'all', count: 5, start: '', end: '' });
assert.equal(emptyPlan.bodyRule.enabled, false, 'default scope must not enable whole-body replacement');

const legacyLatest = JSON.parse(JSON.stringify(planApi.maskHeroNormalizePlan({
  id: 'legacy-latest', name: 'Legacy latest',
  bodyRule: { scope: 'latest', count: 3, replace: '[old mask]' },
  floorRules: [], textRules: [],
})));
assert.deepEqual(legacyLatest.globalScope, { mode: 'latest', count: '3', start: '', end: '' });
assert.equal(legacyLatest.bodyRule.enabled, true, 'legacy body scope must migrate to global scope and preserve its previous whole-body behavior');

const legacyNone = JSON.parse(JSON.stringify(planApi.maskHeroNormalizePlan({
  id: 'legacy-none', name: 'Legacy none',
  bodyRule: { scope: 'none', replace: '[old mask]' },
  floorRules: [], textRules: [],
})));
assert.deepEqual(legacyNone.globalScope, { mode: 'all', count: '5', start: '', end: '' });
assert.equal(legacyNone.bodyRule.enabled, false, 'legacy disabled whole-body replacement must stay disabled');

// Integration guards: the module is optional, scoped to the active chat, and reversible.
assert.match(source, /getStoredBool\(MASK_HERO_ENABLED_KEY, false\)/);
assert.match(source, /data-tle-setting="mask-hero-enabled"/);
assert.match(source, /data-chat-tools-tab="mask"/);
assert.match(source, /data-chat-tools-page="mask"/);
assert.match(source, /if \(!maskHeroEnabled\) \{\s*maskHeroClearEffects\(\)/);
assert.match(source, /TLEMaskHeroAssets/);
assert.match(source, /new HOST_WIN\.MutationObserver\(\(\) => maskHeroScheduleProcess\(\)\)/);
assert.match(source, /message\.querySelector\('\.mes_block > \.ch_name \.name_text'\)/);
assert.match(source, /function maskHeroApplyNameReplacement\(element, replacement\)/);
assert.match(source, /function maskHeroIsWithinScope\(scopeConfig, message, index, total\)/);
assert.doesNotMatch(source, /\.name_text\[data-tle-mask-name\].*visibility:hidden/);
assert.match(source, /data-mask-avatar-history/);
assert.match(source, /最近上传的图片（最多 6 张）/);
assert.match(source, /data-mask-avatar-type/);
assert.match(source, /data-mask-global-scope-field="mode"/);
assert.match(source, /maskHeroCreateButton\('应用范围', 'toggle-scope'/);
assert.match(source, /maskHeroCreateButton\('卸除', 'restore'\)/);
assert.match(source, /maskHeroCreateButton\('保存方案', 'save'\)/);
assert.match(source, /maskHeroCreateButton\('删除方案', 'delete'\)/);
assert.match(source, /actions\.append\(\s*maskHeroCreateButton\('应用', 'apply'\),\s*maskHeroCreateButton\('卸除', 'restore'\),\s*maskHeroCreateButton\('保存方案', 'save'\),\s*maskHeroCreateButton\('删除方案', 'delete'\),\s*scopeToggle\s*\)/);
assert.match(source, /scopeExpanded: false/);
assert.match(source, /scopeSection\.hidden = !maskHeroRuntime\.scopeExpanded/);
assert.match(source, /root\.replaceChildren\(toolbar, actions, scopeSection, status/);
assert.match(source, /maskHeroRuntime\.scopeExpanded = expanded/);
assert.match(source, /data-mask-body-field="enabled"/);
assert.doesNotMatch(source, /data-mask-body-field="scope"/);
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

// Layout regression: a vertical textarea must not inherit the 140px flex basis
// intended only for fields inside horizontal rows.
const genericFieldRule = source.match(/#\\$\\{ID\\.chatToolsPanel\\} \\.tle-mask-hero-field \\{([^}]*)\\}/)?.[1] || '';
assert.ok(genericFieldRule, 'Mask Hero field base rule must exist');
assert.doesNotMatch(genericFieldRule, /flex\\s*:\\s*1\\s+1\\s+140px/,
  'vertical fields must keep their natural height instead of reserving a 140px flex basis');
const horizontalFieldRule = source.match(/#\\$\\{ID\\.chatToolsPanel\\} \\.tle-mask-hero-toolbar > \\.tle-mask-hero-field,\\s*#\\$\\{ID\\.chatToolsPanel\\} \\.tle-mask-hero-avatar-row > \\.tle-mask-hero-field \\{([^}]*)\\}/)?.[1] || '';
assert.match(horizontalFieldRule, /flex\\s*:\\s*1\\s+1\\s+140px/,
  'the 140px flex basis must remain limited to horizontal field rows');

console.log('TLE Mask Hero tests passed: global scope validation and migration, one-pass replacement, literal/regex matching, regex safety, optional setting, current-chat scope and display-only boundaries.');
