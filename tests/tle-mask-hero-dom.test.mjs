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

const dom = new JSDOM('<div id="chat"><div class="mes" mesid="0"><span class="name_text">Original name</span><div class="mes_text"></div><div class="mesAvatarWrapper"><img id="avatar" src="original.png" srcset="original@2x.png 2x" sizes="40px" alt="original"></div></div></div>');
const { window } = dom;
const runtime = {
  observer: null,
  frame: 0,
  textNodes: new Map(),
  nameElements: new Set(),
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
};
const helpers = section('  function maskHeroIsUnsafeRegex(', '  function maskHeroValidateDraft(');
const functions = [
  section('  function maskHeroMessageKind(', '  function maskHeroApplyTextNode('),
  section('  function maskHeroApplyTextNode(', '  function maskHeroApplyImage('),
  section('  function maskHeroApplyImage(', '  function maskHeroApplyFloorReplacement('),
  section('  function maskHeroApplyFloorReplacement(', '  function maskHeroProcessChat('),
  section('  function maskHeroClearEffects(', '  async function maskHeroApplyDraft('),
].join('\n');
vm.runInNewContext(helpers + '\n' + functions + `
globalThis.maskHeroDom = {
  maskHeroApplyTextRules,
  maskHeroApplyTextNode,
  maskHeroApplyImage,
  maskHeroApplyFloorReplacement,
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

console.log('TLE Mask Hero DOM tests passed: reversible text edits, whole-floor fragment restoration, host DOM updates and avatar attribute recovery.');
