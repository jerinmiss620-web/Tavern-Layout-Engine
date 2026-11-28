import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const source = readFileSync(new URL('../development/organizer/TLE.js', import.meta.url), 'utf8');
function section(startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source function: ' + startMarker);
  return source.slice(start, end);
}

const dom = new JSDOM('<div id="chat"><div class="mes" mesid="0" is_user="true"><div class="mes_block"><div class="ch_name"><div class="flex-container"><div class="flex-container"><span class="name_text">Original name</span></div></div></div></div><div class="mes_text"></div><div class="mesAvatarWrapper"><img id="avatar" src="original.png" srcset="original@2x.png 2x" sizes="40px" alt="original"></div></div></div>');
const { window } = dom;
const runtime = {
  observer: null,
  frame: 0,
  textNodes: new Map(),
  nameElements: new Map(),
  floorElements: new Map(),
  imageElements: new Map(),
  objectUrls: new Map(),
  listeners: [],
  applyGeneration: 0,
  appliedConfig: null,
  appliedChatKey: '',
};
const sandbox = {
  HOST_DOC: window.document,
  HOST_WIN: window,
  state: { chatTools: { maskHero: runtime } },
  maskHeroEnabled: true,
  getActiveChatActionContext: () => ({ chatKey: 'test-chat' }),
  maskHeroSetStatus: () => {},
};
const helpers = section('  function maskHeroIsUnsafeRegex(', '  function maskHeroValidateDraft(');
const functions = [
  section('  function maskHeroMessageKind(', '  function maskHeroApplyTextNode('),
  section('  function maskHeroApplyTextNode(', '  function maskHeroApplyImage('),
  section('  function maskHeroApplyImage(', '  function maskHeroApplyFloorReplacement('),
  section('  function maskHeroApplyFloorReplacement(', '  function maskHeroProcessChat('),
  section('  function maskHeroClearEffects(', '  async function maskHeroApplyDraft('),
  section('  function maskHeroProcessChat(', '  function maskHeroScheduleProcess('),
].join('\n');
vm.runInNewContext(helpers + '\n' + functions + `
globalThis.maskHeroDom = {
  maskHeroApplyTextRules,
  maskHeroIsWithinScope,
  maskHeroMessageKind,
  maskHeroApplyNameReplacement,
  maskHeroApplyTextNode,
  maskHeroApplyImage,
  maskHeroApplyFloorReplacement,
  maskHeroProcessChat,
  maskHeroClearEffects,
};
`, sandbox);
const api = sandbox.maskHeroDom;
const body = window.document.querySelector('.mes_text');

// User/Char/System message classification follows the native message attributes.
const userMessage = window.document.createElement('div');
userMessage.className = 'mes';
userMessage.setAttribute('is_user', 'true');
assert.equal(api.maskHeroMessageKind(userMessage), 'user');
const charMessage = window.document.createElement('div');
charMessage.className = 'mes';
assert.equal(api.maskHeroMessageKind(charMessage), 'char');
const systemMessage = window.document.createElement('div');
systemMessage.className = 'mes';
systemMessage.setAttribute('is_system', 'true');
assert.equal(api.maskHeroMessageKind(systemMessage), '');

// Name replacement edits the native .name_text node itself and restores its original child nodes.
const nameElement = window.document.createElement('span');
nameElement.className = 'name_text';
const originalNameMarkup = window.document.createElement('strong');
originalNameMarkup.textContent = 'Original name';
nameElement.appendChild(originalNameMarkup);
api.maskHeroApplyNameReplacement(nameElement, 'Masked name');
assert.equal(nameElement.textContent, 'Masked name');
assert.equal(nameElement.className, 'name_text');
api.maskHeroClearEffects();
assert.equal(nameElement.firstChild, originalNameMarkup, 'name replacement restores original markup, not just its text');
assert.equal(nameElement.textContent, 'Original name');

// Local replacements change only the rendered Text node and preserve its original value.
const textNode = window.document.createTextNode('Contact secret@example.com');
body.appendChild(textNode);
const rules = [{ find: 'secret@example.com', replace: '[email]', regex: false }];
api.maskHeroApplyTextNode(textNode, rules);
assert.equal(textNode.nodeValue, 'Contact [email]');
assert.equal(runtime.textNodes.get(textNode).original, 'Contact secret@example.com');

// If the host updates the same Text node while masked, restore must keep the host's newer value.
textNode.nodeValue = 'Updated secret@example.com';
api.maskHeroApplyTextNode(textNode, rules);
assert.equal(textNode.nodeValue, 'Updated [email]');
api.maskHeroClearEffects();
assert.equal(textNode.nodeValue, 'Updated secret@example.com');

// Whole-floor replacement detaches original DOM nodes rather than destroying their event handlers.
body.replaceChildren();
const originalButton = window.document.createElement('button');
originalButton.textContent = 'original button';
let clicks = 0;
originalButton.addEventListener('click', () => clicks++);
body.append('original text ', originalButton);
api.maskHeroApplyFloorReplacement(body, '[floor hidden]');
assert.equal(body.textContent, '[floor hidden]');
assert.equal(originalButton.isConnected, false);
api.maskHeroClearEffects();
assert.equal(body.textContent, 'original text original button');
originalButton.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
assert.equal(clicks, 1, 'restored original DOM nodes retain their original event listeners');

// Host-added nodes while a floor is masked are retained in the restored DOM.
api.maskHeroApplyFloorReplacement(body, '[floor hidden]');
body.appendChild(window.document.createTextNode(' host update'));
api.maskHeroApplyFloorReplacement(body, '[floor hidden]');
api.maskHeroClearEffects();
assert.equal(body.textContent, 'original text original button host update');

// A host update that replaces the applied Text node becomes the new restorable baseline.
api.maskHeroApplyFloorReplacement(body, '[floor hidden]');
body.firstChild.nodeValue = 'host replaced message';
api.maskHeroApplyFloorReplacement(body, '[floor hidden]');
api.maskHeroClearEffects();
assert.equal(body.textContent, 'host replaced message');

// Avatar overlays restore src/srcset/sizes/alt exactly.
const avatar = window.document.getElementById('avatar');
api.maskHeroApplyImage(avatar, 'blob:mask-hero-avatar');
assert.equal(avatar.getAttribute('src'), 'blob:mask-hero-avatar');
assert.equal(avatar.hasAttribute('srcset'), false);
api.maskHeroClearEffects();
assert.equal(avatar.getAttribute('src'), 'original.png');
assert.equal(avatar.getAttribute('srcset'), 'original@2x.png 2x');
assert.equal(avatar.getAttribute('sizes'), '40px');
assert.equal(avatar.getAttribute('alt'), 'original');

// End-to-end DOM selection: one global scope controls names, avatars, whole-body and partial replacements.
const chat = window.document.getElementById('chat');
function addChatMessage(id, text, kind = 'char') {
  const message = window.document.createElement('div');
  message.className = 'mes';
  message.setAttribute('mesid', String(id));
  if (kind === 'user') message.setAttribute('is_user', 'true');
  if (kind === 'system') message.setAttribute('is_system', 'true');
  const block = window.document.createElement('div');
  block.className = 'mes_block';
  const chName = window.document.createElement('div');
  chName.className = 'ch_name';
  const flexOuter = window.document.createElement('div');
  flexOuter.className = 'flex-container';
  const flexInner = window.document.createElement('div');
  flexInner.className = 'flex-container';
  const name = window.document.createElement('span');
  name.className = 'name_text';
  name.textContent = 'Original ' + id;
  flexInner.appendChild(name);
  flexOuter.appendChild(flexInner);
  chName.appendChild(flexOuter);
  block.appendChild(chName);
  const messageBody = window.document.createElement('div');
  messageBody.className = 'mes_text';
  messageBody.textContent = text;
  const avatarWrap = window.document.createElement('div');
  avatarWrap.className = 'mesAvatarWrapper';
  const avatar = window.document.createElement('img');
  avatar.className = 'message-avatar';
  avatar.src = 'original-' + id + '.png';
  avatarWrap.appendChild(avatar);
  message.append(block, messageBody, avatarWrap);
  chat.appendChild(message);
  return { message, name, body: messageBody, avatar };
}
chat.replaceChildren();
const chatMessages = [
  addChatMessage(0, 'body 0 secret', 'user'),
  addChatMessage(1, 'body 1 secret', 'char'),
  addChatMessage(2, 'body 2 secret', 'user'),
  addChatMessage(3, 'body 3 secret', 'char'),
];
const systemMessageForBatch = addChatMessage(90, 'system body secret', 'system');
runtime.objectUrls.set('user', 'blob:masked-user');
runtime.objectUrls.set('char', 'blob:masked-char');
runtime.appliedConfig = {
  globalScope: { mode: 'latest', count: 2 },
  userName: '匿名用户',
  charName: '匿名角色',
  bodyRule: { enabled: false, replace: '[不应执行整体替换]' },
  floorRules: [],
  textRules: [{ find: 'secret', replace: '[局部已替换]', regex: false }],
};
runtime.appliedChatKey = 'test-chat';
api.maskHeroProcessChat();
assert.deepEqual(chatMessages.map(item => item.body.textContent), [
  'body 0 secret', 'body 1 secret', 'body 2 [局部已替换]', 'body 3 [局部已替换]',
], 'latest-N scope applies local text rules only to the last N User/Char messages');
assert.equal(systemMessageForBatch.body.textContent, 'system body secret', 'system messages are excluded from global scope');
assert.equal(chatMessages[0].name.textContent, 'Original 0');
assert.equal(chatMessages[1].name.textContent, 'Original 1');
assert.equal(chatMessages[2].name.textContent, '匿名用户');
assert.equal(chatMessages[3].name.textContent, '匿名角色');
assert.equal(chatMessages[0].avatar.getAttribute('src'), 'original-0.png');
assert.equal(chatMessages[1].avatar.getAttribute('src'), 'original-1.png');
assert.equal(chatMessages[2].avatar.getAttribute('src'), 'blob:masked-user');
assert.equal(chatMessages[3].avatar.getAttribute('src'), 'blob:masked-char');

const fifthMessage = addChatMessage(4, 'body 4 secret', 'user');
api.maskHeroProcessChat();
assert.equal(chatMessages[2].body.textContent, 'body 2 secret', 'a message leaving the latest-N window restores its original body');
assert.equal(chatMessages[2].name.textContent, 'Original 2', 'a message leaving the latest-N window restores its original name');
assert.equal(chatMessages[2].avatar.getAttribute('src'), 'original-2.png', 'a message leaving the latest-N window restores its original avatar');
assert.equal(chatMessages[3].body.textContent, 'body 3 [局部已替换]');
assert.equal(fifthMessage.body.textContent, 'body 4 [局部已替换]');
assert.equal(fifthMessage.name.textContent, '匿名用户');
assert.equal(fifthMessage.avatar.getAttribute('src'), 'blob:masked-user');

api.maskHeroClearEffects();
assert.deepEqual(
  [...chat.querySelectorAll('.mes_text')].map(node => node.textContent),
  ['body 0 secret', 'body 1 secret', 'body 2 secret', 'body 3 secret', 'system body secret', 'body 4 secret'],
  'clear restores all local text overlays',
);

runtime.appliedConfig = {
  globalScope: { mode: 'range', start: 1, end: 2 },
  userName: '匿名用户',
  charName: '匿名角色',
  bodyRule: { enabled: false, replace: '[整体不启用]' },
  floorRules: [
    { floor: '0', replace: '[范围外规则不得生效]' },
    { floor: '2', replace: '[指定楼层]' },
  ],
  textRules: [{ find: 'secret', replace: '[局部已替换]', regex: false }],
};
runtime.appliedChatKey = 'test-chat';
api.maskHeroProcessChat();
assert.equal(chatMessages[0].body.textContent, 'body 0 secret', 'single-floor rules cannot bypass the global range');
assert.equal(chatMessages[0].name.textContent, 'Original 0');
assert.equal(chatMessages[1].body.textContent, 'body 1 [局部已替换]');
assert.equal(chatMessages[1].name.textContent, '匿名角色');
assert.equal(chatMessages[2].body.textContent, '[指定楼层]', 'an in-scope single-floor rule takes precedence over partial text rules');
assert.equal(chatMessages[2].name.textContent, '匿名用户');
assert.equal(chatMessages[3].body.textContent, 'body 3 secret', 'messages outside the global range remain unchanged');
assert.equal(chatMessages[3].name.textContent, 'Original 3');
assert.equal(systemMessageForBatch.body.textContent, 'system body secret');

api.maskHeroClearEffects();
runtime.appliedConfig = {
  globalScope: { mode: 'range', start: 1, end: 2 },
  userName: '',
  charName: '',
  bodyRule: { enabled: true, replace: '[批量替换]' },
  floorRules: [
    { floor: '0', replace: '[范围外规则不得生效]' },
    { floor: '2', replace: '[指定楼层]' },
  ],
  textRules: [],
};
runtime.appliedChatKey = 'test-chat';
api.maskHeroProcessChat();
assert.equal(chatMessages[0].body.textContent, 'body 0 secret', 'whole-body and floor rules both respect the global range');
assert.equal(chatMessages[1].body.textContent, '[批量替换]');
assert.equal(chatMessages[2].body.textContent, '[指定楼层]', 'an in-scope single-floor rule overrides the batch replacement');
assert.equal(chatMessages[3].body.textContent, 'body 3 secret');
assert.equal(systemMessageForBatch.body.textContent, 'system body secret');
api.maskHeroClearEffects();
assert.deepEqual(
  [...chat.querySelectorAll('.mes_text')].map(node => node.textContent),
  ['body 0 secret', 'body 1 secret', 'body 2 secret', 'body 3 secret', 'system body secret', 'body 4 secret'],
  'all overlays restore the original message DOM',
);
assert.equal(chatMessages[0].name.textContent, 'Original 0', 'native name node is restored with its original value');
console.log('TLE Mask Hero DOM tests passed: nested native name selector, global latest-N/range scope, dynamic restoration, independent feature toggles, single-floor scope enforcement and avatar restoration.');
