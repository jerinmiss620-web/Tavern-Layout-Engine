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
assert.deepEqual(gallery.getLayoutSettings(), { columns: 3, rows: 2, displayMode: 'chatted' },
  'Legacy layout settings migrate to the default chatted-only display mode');
assert.equal(dom.window.document.getElementById('freesiaGalleryDisplayMode').value, 'chatted',
  'The native home settings popup exposes the default display scope');
assert.deepEqual(cardNames(), ['Beta', 'Alpha'],
  'Chatted-only mode excludes characters with no chat and sorts by latest chat first');
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
