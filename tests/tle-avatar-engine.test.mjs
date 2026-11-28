import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('latest.json'));
const moduleSource = read('development/avatar-engine/avatar-engine.js');
const stableCore = read(manifest.release.source_path);
const developmentCore = read('development/organizer/TLE.js');

assert.match(manifest.release.version, /^\d+\.\d+\.\d+$/, 'Stable Core version must be valid semantic versioning');
assert.ok(stableCore.includes(`version: '${manifest.release.version}',`), 'Stable Core API version must match the stable manifest');
assert.ok(stableCore.includes(moduleSource), 'Stable Core must embed the maintained avatar engine byte-for-byte');
assert.ok(developmentCore.includes(moduleSource), 'Development Core must embed the maintained avatar engine byte-for-byte');
assert.match(developmentCore, /fallbackModules:\s*\[\{\s*id: 'avatar\.hd'/);
assert.match(developmentCore, /init\(context\)\s*\{\s*const engine = createTLEHDAvatarEngine\(context\.host\.scriptWindow, context\.host\.window, context\.host\.document\)/);
assert.match(developmentCore, /moduleLoader\.start\(\)/);
assert.match(developmentCore, /moduleLoader\.destroy\(\)/);
assert.match(moduleSource, /const VERSION = '4\.5\.14'/);
for (const selector of [
  '.mesAvatarWrapper img',
  '#right-nav-panel #avatar-and-name-block .expander #avatar_div img',
  '#right-nav-panel #rm_print_characters_block .character_select > .avatar img',
  '#user_avatar_block > .avatar-container > .avatar img',
  '.freesia-gallery-avatar img',
  '.freesia-gallery-avatar-frame img',
  '.freesia-gallery-detail-avatar img',
]) assert.ok(moduleSource.includes(selector), 'Missing supported avatar region: ' + selector);
assert.doesNotMatch(moduleSource, /window\.fetch\s*=|createElement\(['"]canvas|setInterval\(/,
  'The integrated engine must not wrap fetch, create Canvas layers or poll');
assert.match(moduleSource, /new WIN\.MutationObserver/);
assert.match(moduleSource, /requestAnimationFrame/);
new vm.Script(moduleSource, { filename: 'development/avatar-engine/avatar-engine.js' });
new vm.Script(core, { filename: manifest.release.source_path });

function makeDom(body, head = '') {
  const dom = new JSDOM('<!doctype html><html><head>' + head + '</head><body>' + body + '</body></html>', {
    url: 'https://tavern.test/',
    pretendToBeVisual: true,
  });
  const sandbox = {
    window: dom.window,
    document: dom.window.document,
    console: { log() {}, warn() {}, error() {} },
  };
  vm.createContext(sandbox);
  vm.runInContext(moduleSource, sandbox, { filename: 'avatar-engine.js' });
  return { dom, sandbox, create: () => sandbox.createTLEHDAvatarEngine(dom.window, dom.window, dom.window.document) };
}
const thumb = (type, file) => '/thumbnail?type=' + type + '&file=' + encodeURIComponent(file);
const pathOf = img => new URL(img.getAttribute('src'), 'https://tavern.test/').pathname;

{
  const html =
    '<div class="mesAvatarWrapper"><img id="chat-char" src="' + thumb('avatar', 'char.png') + '" loading="lazy" decoding="async" srcset="/thumbnail?type=avatar&amp;file=char.png 2x" sizes="64px"></div>' +
    '<div class="mesAvatarWrapper"><img id="chat-user" src="' + thumb('persona', 'user.png') + '"></div>' +
    '<div id="right-nav-panel"><div id="avatar-and-name-block"><div class="expander"><div id="avatar_div"><img id="role-preview" src="' + thumb('avatar', 'preview.png') + '"></div></div></div>' +
    '<div id="rm_print_characters_block"><div class="character_select"><div class="avatar"><img id="char-list" src="' + thumb('avatar', 'list.png') + '"></div></div></div></div>' +
    '<div id="user_avatar_block"><div class="avatar-container"><div class="avatar"><img id="user-list" src="' + thumb('persona', 'persona.png') + '"></div></div></div>' +
    '<div class="freesia-gallery-avatar"><img id="gallery" src="' + thumb('avatar', 'gallery.png') + '"></div>' +
    '<div class="freesia-gallery-avatar-frame"><img id="gallery-frame" src="' + thumb('avatar', 'gallery-frame.png') + '"></div>' +
    '<div class="freesia-gallery-detail-avatar"><img id="gallery-detail" src="' + thumb('avatar', 'gallery-detail.png') + '"></div>';
  const { dom, create } = makeDom(html);
  let observerCount = 0;
  const NativeObserver = dom.window.MutationObserver;
  dom.window.MutationObserver = class extends NativeObserver {
    constructor(callback) { observerCount++; super(callback); }
  };
  const originalFetch = function originalFetch() {};
  dom.window.fetch = originalFetch;
  const engine = create();
  assert.equal(engine.active, true);
  assert.equal(engine.owner, 'TLE');
  assert.equal(observerCount, 1, 'All avatar regions share one MutationObserver');
  assert.equal(dom.window.fetch, originalFetch, 'TLE must not wrap fetch');
  const expected = [
    ['chat-char', '/characters/char.png'],
    ['chat-user', '/User%20Avatars/user.png'],
    ['role-preview', '/characters/preview.png'],
    ['char-list', '/characters/list.png'],
    ['user-list', '/User%20Avatars/persona.png'],
    ['gallery', '/characters/gallery.png'],
    ['gallery-frame', '/characters/gallery-frame.png'],
    ['gallery-detail', '/characters/gallery-detail.png'],
  ];
  for (const [id, path] of expected) assert.equal(pathOf(dom.window.document.getElementById(id)), path, id + ' must load the original avatar');
  const chatChar = dom.window.document.getElementById('chat-char');
  assert.equal(chatChar.hasAttribute('srcset'), false);
  assert.equal(chatChar.hasAttribute('sizes'), false);
  assert.equal(chatChar.getAttribute('loading'), 'lazy');
  assert.equal(chatChar.getAttribute('decoding'), 'async');

  const added = dom.window.document.createElement('div');
  added.className = 'freesia-gallery-avatar';
  added.innerHTML = '<img id="dynamic-gallery" src="' + thumb('avatar', 'dynamic.png') + '">';
  dom.window.document.body.append(added);
  await new Promise(resolve => setTimeout(resolve, 35));
  assert.equal(pathOf(dom.window.document.getElementById('dynamic-gallery')), '/characters/dynamic.png',
    'New gallery avatars must be upgraded without polling');

  const addedFrame = dom.window.document.createElement('div');
  addedFrame.className = 'freesia-gallery-avatar-frame';
  addedFrame.innerHTML = '<img id="dynamic-gallery-frame" src="' + thumb('avatar', 'dynamic-frame.png') + '">';
  const addedDetail = dom.window.document.createElement('div');
  addedDetail.className = 'freesia-gallery-detail-avatar';
  addedDetail.innerHTML = '<img id="dynamic-gallery-detail" src="' + thumb('avatar', 'dynamic-detail.png') + '">';
  dom.window.document.body.append(addedFrame, addedDetail);
  await new Promise(resolve => setTimeout(resolve, 35));
  assert.equal(pathOf(dom.window.document.getElementById('dynamic-gallery-frame')), '/characters/dynamic-frame.png',
    'New isolated gallery avatar frames must be upgraded without polling');
  assert.equal(pathOf(dom.window.document.getElementById('dynamic-gallery-detail')), '/characters/dynamic-detail.png',
    'New detail avatars must be upgraded without polling');

  engine.stop();
  assert.equal(chatChar.getAttribute('src'), thumb('avatar', 'char.png'), 'Cleanup restores the original thumbnail');
  assert.equal(chatChar.getAttribute('srcset'), '/thumbnail?type=avatar&file=char.png 2x');
  assert.equal(chatChar.getAttribute('sizes'), '64px');
  assert.equal(chatChar.getAttribute('loading'), 'lazy');
  assert.equal(chatChar.getAttribute('decoding'), 'async');
  dom.window.close();
}

{
  // AvatarDeblur rewrites /thumbnail to direct /characters/ URLs before TLE runs.
  const u = new URL(thumb('avatar', 'from-deblur.png'), 'https://tavern.test/');
  const folder = { avatar: 'characters', persona: 'User Avatars' }[u.searchParams.get('type')];
  const avatarDeblurUrl = '/' + encodeURIComponent(folder) + '/' + u.searchParams.get('file');
  const { dom, create } = makeDom('<div class="mesAvatarWrapper"><img id="deblur" src="' + avatarDeblurUrl + '"></div>');
  const engine = create();
  assert.equal(pathOf(dom.window.document.getElementById('deblur')), '/characters/from-deblur.png',
    'Already-rewritten AvatarDeblur URLs must be safely re-adopted');
  engine.stop();
  dom.window.close();
}

{
  // The 260402 Div/Canvas renderer owns chat avatars only; TLE continues on other regions.
  const { dom, create } = makeDom(
    '<div class="mesAvatarWrapper"><img id="legacy-chat" src="' + thumb('avatar', 'legacy.png') + '"></div>' +
    '<div class="freesia-gallery-avatar"><img id="legacy-gallery" src="' + thumb('avatar', 'gallery.png') + '"></div>',
    '<style id="hd-avatar-styles"></style>'
  );
  const engine = create();
  assert.equal(pathOf(dom.window.document.getElementById('legacy-chat')), '/characters/legacy.png', 'A style marker alone does not prove the legacy script owns this image');
  assert.equal(pathOf(dom.window.document.getElementById('legacy-gallery')), '/characters/gallery.png');
  engine.stop();
  dom.window.close();
}

{
  // Error fallback restores the thumbnail and responsive attributes.
  const { dom, create } = makeDom('<div class="freesia-gallery-avatar"><img id="fallback" src="' + thumb('avatar', 'fallback.png') + '" srcset="/fallback-2x.png 2x" sizes="80px"></div>');
  const img = dom.window.document.getElementById('fallback');
  const engine = create();
  Object.defineProperty(img, 'complete', { configurable: true, get: () => true });
  Object.defineProperty(img, 'naturalWidth', { configurable: true, get: () => 0 });
  img.dispatchEvent(new dom.window.Event('error'));
  assert.equal(img.getAttribute('src'), thumb('avatar', 'fallback.png'));
  assert.equal(img.getAttribute('srcset'), '/fallback-2x.png 2x');
  assert.equal(img.getAttribute('sizes'), '80px');
  assert.equal(img.dataset.hd55Bound, undefined);
  engine.stop();
  dom.window.close();
}

{
  // TT has native high-resolution avatar handling and must not start a second engine.
  const { dom, create } = makeDom('<div class="mesAvatarWrapper"><img id="tt" src="' + thumb('avatar', 'tt.png') + '"></div>');
  dom.window.__TAURITAVERN__ = {};
  const engine = create();
  assert.equal(engine.host, 'tt');
  assert.equal(engine.active, false);
  assert.equal(dom.window.document.getElementById('tt').getAttribute('src'), thumb('avatar', 'tt.png'));
  assert.equal(dom.window.__hdAvatar459Cleanup, undefined);
  dom.window.close();
}

{
  // An already-running standalone 桃mini engine is cleaned before TLE takes ownership.
  const { dom, create } = makeDom('<div class="freesia-gallery-avatar"><img id="handoff" src="' + thumb('avatar', 'handoff.png') + '"></div>');
  let stopped = 0;
  dom.window.__hdAvatar459Cleanup = function () { stopped++; delete dom.window.__hdAvatar459Cleanup; };
  const engine = create();
  assert.equal(stopped, 1);
  assert.equal(engine.owner, 'TLE');
  assert.equal(typeof dom.window.__hdAvatar459Cleanup, 'function');
  engine.stop();
  dom.window.close();
}

{
  // The layer markers alone also protect a chat avatar if the style node was removed.
  const { dom, create } = makeDom(
    '<div class="mesAvatarWrapper"><img id="legacy-layer" src="' + thumb('avatar', 'legacy-layer.png') + '" data-hd-fixed="true"><div class="hd-avatar-layer-canvas"></div></div>' +
    '<div class="freesia-gallery-avatar"><img id="layer-gallery" src="' + thumb('avatar', 'layer-gallery.png') + '"></div>'
  );
  const engine = create();
  assert.equal(pathOf(dom.window.document.getElementById('legacy-layer')), '/thumbnail');
  assert.equal(pathOf(dom.window.document.getElementById('layer-gallery')), '/characters/layer-gallery.png');
  engine.stop();
  dom.window.close();
}

console.log('TLE 桃mini HD avatar engine: all regions, TT bypass, single-instance handoff, legacy overlay isolation, AvatarDeblur URL compatibility, dynamic loading and failure fallback passed.');
