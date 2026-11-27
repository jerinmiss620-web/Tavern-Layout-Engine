import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const source = read('development/gallery-home/gallery-home.js');
const dom = new JSDOM(`<!doctype html><html><head></head><body>
  <div id="chat">
    <section class="welcomePanel">
      <header class="welcomeHeader">
        <span class="recentChatsTitle">Recent Chats</span>
        <div class="welcomeHeaderTitle"></div>
        <div class="welcomeShortcuts"></div>
      </header>
      <div class="welcomeRecent"><div class="recentChatList"></div></div>
    </section>
  </div>
  <dialog class="popup">
    <div class="popup-body">
      <div class="popup-inputs">
        <input id="maxRecentChats"><input id="collapsedRecentChats">
      </div>
      <div class="popup-controls"><button type="button" class="popup-button-ok">确定</button></div>
    </div>
  </dialog>
</body></html>`, { url: 'https://tavern.test/', pretendToBeVisual: true });

const stored = new Map([
  ['freesiaGallerySettings', JSON.stringify({ columns: 3, rows: 2 })],
]);
const requests = [];
const context = {
  characters: [
    { avatar: 'alpha.png', name: 'Alpha' },
    { avatar: 'beta.png', name: 'Beta' },
    { avatar: 'gamma.png', name: 'Gamma' },
  ],
  accountStorage: {
    getItem(key) { return stored.has(key) ? stored.get(key) : null; },
    setItem(key, value) { stored.set(key, String(value)); },
  },
  getRequestHeaders() { return { 'Content-Type': 'application/json' }; },
  getThumbnailUrl(type, avatar) { return '/' + type + '/' + avatar; },
};
const records = [
  { avatar: 'alpha.png', file_name: 'alpha-chat.jsonl', char_name: 'Alpha', last_mes: '2026-11-25T10:00:00Z', mes: 'Alpha recent message' },
  { avatar: 'beta.png', file_name: 'beta-chat.jsonl', char_name: 'Beta', last_mes: '2026-11-26T10:00:00Z', mes: 'Beta recent message' },
];
let avatarRectLeft = 112;
const nativeGetBoundingClientRect = dom.window.Element.prototype.getBoundingClientRect;
dom.window.Element.prototype.getBoundingClientRect = function () {
  if (this.classList?.contains('freesia-gallery-card')) {
    return { x: 100, y: 50, left: 100, top: 50, right: 300, bottom: 350, width: 200, height: 300, toJSON() {} };
  }
  if (this.matches?.('.freesia-gallery-card-identity > .avatar img')) {
    return { x: avatarRectLeft, y: 60, left: avatarRectLeft, top: 60, right: avatarRectLeft + 176, bottom: 340, width: 176, height: 280, toJSON() {} };
  }
  return nativeGetBoundingClientRect.call(this);
};
const nativeGetComputedStyle = dom.window.getComputedStyle.bind(dom.window);
dom.window.getComputedStyle = element => {
  if (element.matches?.('.freesia-gallery-card-identity > .avatar img')) {
    return { borderBottomLeftRadius: '12px', borderBottomRightRadius: '14px' };
  }
  return nativeGetComputedStyle(element);
};

dom.window.SillyTavern = { getContext: () => context };
dom.window.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
dom.window.fetch = async (url, options = {}) => {
  if (url === '/api/chats/recent') {
    requests.push({ url, body: JSON.parse(options.body || '{}') });
    return { ok: true, json: async () => records };
  }
  if (url === '/api/characters/chats') return { ok: true, json: async () => [] };
  throw new Error('Unexpected request: ' + url);
};

const sandbox = { window: dom.window, document: dom.window.document, console: { log() {}, warn() {}, error() {} } };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: 'gallery-home.js' });
const gallery = sandbox.createTLEGalleryHome(dom.window, dom.window.document);
const wait = () => new Promise(resolve => setTimeout(resolve, 25));
const cardNames = () => Array.from(dom.window.document.querySelectorAll('.freesia-gallery-card .characterName')).map(node => node.textContent);

gallery.start();
await wait();
const initialLayout = gallery.getLayoutSettings();
assert.equal(initialLayout.columns, 3, 'Legacy column setting is preserved');
assert.equal(initialLayout.rows, 2, 'Legacy row setting is preserved');
assert.equal(initialLayout.displayMode, 'chatted', 'Legacy layout settings migrate to the default chatted-only display mode');
assert.equal(dom.window.document.getElementById('freesiaGalleryDisplayMode').value, 'chatted',
  'The native home settings popup exposes the default display scope');
assert.deepEqual(cardNames(), ['Beta', 'Alpha'],
  'Chatted-only mode excludes characters with no chat and sorts by latest chat first');

const firstOverlay = dom.window.document.querySelector('.freesia-gallery-card-overlay');
assert.equal(firstOverlay.style.left, '12px', 'The gradient starts at the avatar image left edge');
assert.equal(firstOverlay.style.right, '12px', 'The gradient ends at the avatar image right edge');
assert.equal(firstOverlay.style.bottom, '10px', 'The gradient bottom follows the avatar image bottom edge');
assert.equal(firstOverlay.style.width, 'auto', 'The gradient stretches only between the measured avatar edges');
assert.match(firstOverlay.style.borderBottomLeftRadius, /^12px(?: 12px)?$/, 'The gradient copies the avatar bottom-left radius');
assert.match(firstOverlay.style.borderBottomRightRadius, /^14px(?: 14px)?$/, 'The gradient copies the avatar bottom-right radius');
assert.ok(Math.abs(parseFloat(firstOverlay.style.getPropertyValue('--freesia-gallery-overlay-min-height')) - 134.4) < 0.01);
assert.ok(Math.abs(parseFloat(firstOverlay.style.getPropertyValue('--freesia-gallery-overlay-max-height')) - 168) < 0.01);

avatarRectLeft = 120;
dom.window.dispatchEvent(new dom.window.Event('resize'));
await wait();
const resizedOverlay = dom.window.document.querySelector('.freesia-gallery-card-overlay');
assert.equal(resizedOverlay.style.left, '20px', 'Responsive rerender recalculates the avatar-relative gradient position');
assert.equal(resizedOverlay.style.right, '4px', 'Responsive rerender recalculates the avatar-relative gradient width');
assert.equal(requests[0]?.body?.max, 1000,
  'The gallery reads a broad recent-chat window so its character filter is not limited by the native home preview count');

stored.set('freesiaGalleryPinnedCharacters', JSON.stringify({ 'gamma.png': 999999 }));
const modeSelect = dom.window.document.getElementById('freesiaGalleryDisplayMode');
modeSelect.value = 'all';
dom.window.document.querySelector('.popup-button-ok').dispatchEvent(
  new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }),
);
await wait();
assert.equal(gallery.getLayoutSettings().displayMode, 'all');
assert.equal(JSON.parse(stored.get('freesiaGallerySettings')).displayMode, 'all',
  'The selected display scope is persisted with the grid settings');
assert.deepEqual(cardNames(), ['Beta', 'Alpha', 'Gamma'],
  'All mode keeps chatted characters ahead of unchatted characters even when an unchatted character is pinned');

modeSelect.value = 'chatted';
dom.window.document.querySelector('.popup-button-ok').dispatchEvent(
  new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }),
);
await wait();
assert.deepEqual(cardNames(), ['Beta', 'Alpha'],
  'Switching back to chatted-only mode refreshes the data source and removes unchatted characters');
assert.equal(gallery.getLayoutSettings().displayMode, 'chatted');

gallery.stop();
dom.window.close();
console.log('TLE gallery display-scope settings, legacy-setting migration, chat filtering, ordering and refresh behavior passed.');
