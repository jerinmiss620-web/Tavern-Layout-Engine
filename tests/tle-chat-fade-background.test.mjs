import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('channels/test.json'));
const source = read(manifest.release.source_path);

assert.equal(manifest.release.version, '0.3.278');
assert.equal(manifest.latest_version, '0.3.278');
assert.ok(source.includes("version: '0.3.278'"));
new vm.Script(source, { filename: 'TLE v' + manifest.release.version });

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}

const helperSource = section(
  source,
  '  function chatFadeAlphaOf(color) {',
  '  const CHAT_FADE_PSEUDO_BEFORE_CLASS'
);
const helperSandbox = {};
vm.runInNewContext(
  helperSource + '\nglobalThis.fadeHelpers = { chatFadeIsTransparentColor, chatFadeHasPaintedBackground, getChatFadePageBackground, chatFadeSelectBackgroundMode };',
  helperSandbox
);
const helpers = helperSandbox.fadeHelpers;

const gradient = {
  backgroundImage: 'linear-gradient(135deg, #E8F4FC 0%, #F0F0E6 50%, #C2D9E8 100%)',
  backgroundColor: 'rgb(238, 246, 251)',
};
const solid = { backgroundImage: 'none', backgroundColor: 'rgb(238, 246, 251)' };
const transparent = { backgroundImage: 'none', backgroundColor: 'rgba(0, 0, 0, 0)' };

assert.equal(helpers.chatFadeHasPaintedBackground(gradient), true,
  'a CSS gradient on body/html is a valid native page background');
assert.equal(helpers.chatFadeHasPaintedBackground(solid), true,
  'a solid CSS page background is also valid');
assert.equal(helpers.chatFadeHasPaintedBackground(transparent), false,
  'a fully transparent page background is not a valid source');
assert.equal(helpers.chatFadeIsTransparentColor('rgba(0, 0, 0, 0)'), true);
assert.equal(helpers.chatFadeIsTransparentColor('rgb(238, 246, 251)'), false);

const body = { id: 'body', computed: gradient };
const html = { id: 'html', computed: solid };
const pageSandbox = {
  HOST_DOC: { body, documentElement: html },
  HOST_WIN: { getComputedStyle: element => element.computed },
};
vm.runInNewContext(
  helperSource + '\nglobalThis.detectPageBackground = getChatFadePageBackground;',
  pageSandbox
);
assert.equal(pageSandbox.detectPageBackground().element.id, 'body',
  'prefer body background when both body and html have a painted background');
body.computed = transparent;
assert.equal(pageSandbox.detectPageBackground().element.id, 'html',
  'fall back to html when body is transparent');
html.computed = transparent;
assert.equal(pageSandbox.detectPageBackground(), null,
  'return no page source when both body and html are transparent');

assert.equal(helpers.chatFadeSelectBackgroundMode(true, { style: gradient }), 'page',
  'an explicit CSS background image or gradient takes priority over #bg1');
assert.equal(helpers.chatFadeSelectBackgroundMode(true, { style: solid }), 'wallpaper',
  'the default solid body tint must not displace a real wallpaper');
assert.equal(helpers.chatFadeSelectBackgroundMode(false, { style: solid }), 'page',
  'a native page background is selected when no wallpaper exists');
assert.equal(helpers.chatFadeSelectBackgroundMode(false, null), 'none',
  'no background source must not create a fake mirror');
assert.equal(helpers.chatFadeSelectBackgroundMode(false, { style: solid }, true), 'page',
  'an explicit solid body/html background wins over a color-only #bg1');
assert.equal(helpers.chatFadeSelectBackgroundMode(false, null, true), 'wallpaper',
  'a color-only #bg1 remains usable when the page has no painted background');
assert.deepEqual(
  [
    helpers.chatFadeSelectBackgroundMode(true, { style: gradient }, true),
    helpers.chatFadeSelectBackgroundMode(true, { style: solid }, true),
    helpers.chatFadeSelectBackgroundMode(false, { style: solid }, true),
    helpers.chatFadeSelectBackgroundMode(false, null, true),
    helpers.chatFadeSelectBackgroundMode(false, null, false),
  ],
  ['page', 'wallpaper', 'page', 'wallpaper', 'none'],
  'CSS gradient → real wallpaper → CSS solid → fallback tint → none must transition deterministically'
);

const bind = section(source, '  function bindChatFadeWallpaperSync(', '  function createChatFadeMirror(');
assert.doesNotMatch(bind, /if\s*\(!bg1\)\s*return;/,
  'background observers must bind even when #bg1 does not exist');
assert.match(bind, /new Set\(\[HOST_DOC\.documentElement, HOST_DOC\.body\]/,
  'observe root page elements independently from #bg1');
assert.match(bind, /if \(ancestor === HOST_DOC\.body\) options\.childList = true;/,
  'notice a #bg1 layer being added or replaced at the body root');
assert.match(bind, /if \(hostSurface\) themeAncestors\.add\(hostSurface\)/,
  'observe #sheld even without a current #bg1');
assert.match(bind, /if \(ancestor === hostSurface\) options\.childList = true;/,
  'notice nested wallpaper layer insertions within #sheld');
assert.match(bind, /containsHostSurfaceNode/,
  'observe #sheld replacement to reattach background listeners');
assert.match(bind, /state\.chatFade\.themeSurface === hostSurface/,
  'skip rebinding only when the host surface has not changed');
assert.match(bind, /HOST_DOC\.head/,
  'watch stylesheet changes so a theme CSS background is re-detected');
assert.match(bind, /if \(bg1\) \{/,
  'bind the wallpaper observer only when a wallpaper layer exists');

const create = section(source, '  function createChatFadeMirror() {', '  function scheduleChatFadeWallpaperSync() {');
assert.match(create, /const pageBackground = getChatFadePageBackground\(\)/);
assert.match(create, /const bgLayerVisible = Boolean\(/);
assert.match(create, /chatFadeSelectBackgroundMode\(hasWallpaperImage, pageBackground, hasWallpaperSurface\)/);
assert.match(create, /const hasWallpaperImage = bgLayerVisible && \(hasBgImage \|\| hasSourceImg\)/);
assert.match(create, /const hasWallpaperSurface = hasWallpaperImage \|\| \(bgLayerVisible && hasBgColor\)/);
assert.match(create, /if \(backgroundMode === 'page'\)/);
assert.match(create, /renderMode = 'page-background'/);
assert.match(create, /renderMode = 'page-background-mask-only'/);
assert.match(create, /backgroundSource = 'page'/);
assert.match(create, /backgroundSource = 'wallpaper'/);
const pageMode = section(create, "    if (backgroundMode === 'page') {", "    if (!bg1 || !bgCss || !bgRect) {");
assert.doesNotMatch(pageMode, /setChatFadeWallpaperVariables|CHAT_FADE_PSEUDO_BEFORE_CLASS|CHAT_FADE_PSEUDO_AFTER_CLASS/,
  'native page background mode must not create or copy a wallpaper mirror');
assert.match(pageMode, /chat\.classList\.add\(CHAT_FADE_CLASS\)/,
  'native page background mode keeps only the original transparent fade mask');

const schedule = section(source, '  function scheduleChatFadeWallpaperSync() {', '  function scheduleChatFadeRefresh() {');
assert.match(schedule, /const currentBg = getChatFadeBg1\(\)/);
assert.match(schedule, /bindChatFadeWallpaperSync\(currentBg\)/);
assert.match(schedule, /createChatFadeMirror\(\)/);
assert.doesNotMatch(schedule, /if\s*\(!currentBg\)/,
  'the sync scheduler must not stop merely because #bg1 is absent');

assert.match(source, /backgroundSource: state\.chatFade\.backgroundSource/);

const cleanupSource = section(source, '  function clearChatFadeVisual() {', '  function chatFadePseudoIsFree(');
const cssClasses = [
  'tle-chat-fade-active',
  'tle-chat-fade-pseudo-before',
  'tle-chat-fade-pseudo-after',
  'tle-chat-fade-fixed',
  'tle-chat-fade-background-fallback',
];
function fakeChat() {
  const css = new Set(cssClasses);
  return {
    classList: {
      remove: (...names) => names.forEach(name => css.delete(name)),
      has: name => css.has(name),
    },
    css,
    propertiesCleaned: false,
  };
}
const previousChat = fakeChat();
const nextChat = fakeChat();
const fadeState = { chatFade: {
  chat: previousChat, active: true, pseudo: 'before',
  renderMode: 'sticky-pseudo', backgroundSource: 'wallpaper',
} };
const cleanupSandbox = {
  state: fadeState,
  getChatFadeChat: () => nextChat,
  clearChatFadeWallpaperVariables: chat => { chat.propertiesCleaned = true; },
  CHAT_FADE_CLASS: cssClasses[0],
  CHAT_FADE_PSEUDO_BEFORE_CLASS: cssClasses[1],
  CHAT_FADE_PSEUDO_AFTER_CLASS: cssClasses[2],
  CHAT_FADE_FIXED_CLASS: cssClasses[3],
  CHAT_FADE_BACKGROUND_FALLBACK_CLASS: cssClasses[4],
};
vm.runInNewContext(cleanupSource + '\nglobalThis.resetVisual = clearChatFadeVisual;', cleanupSandbox);
cleanupSandbox.resetVisual();
for (const chat of [previousChat, nextChat]) {
  assert.equal(chat.css.size, 0, 'mode switches must clear all mirror and fade classes');
  assert.equal(chat.propertiesCleaned, true, 'mode switches must clear all old wallpaper variables');
}
assert.equal(fadeState.chatFade.active, false);
assert.equal(fadeState.chatFade.backgroundSource, null);
assert.equal(fadeState.chatFade.renderMode, null);
assert.equal(fadeState.chatFade.chat, null);
assert.match(source, /主题明确设置 CSS 背景图（包括渐变）时优先透出主题背景/);
assert.doesNotMatch(create + bind + schedule, /setInterval\(/,
  'background recognition must not add polling');

console.log('TLE fade background source detection and no-wallpaper theme checks passed: v' + manifest.release.version + '.');
