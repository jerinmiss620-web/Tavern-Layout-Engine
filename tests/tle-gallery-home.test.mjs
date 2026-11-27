import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('channels/test.json'));
const version = manifest.release.version;
const corePath = manifest.release.source_path;
const core = read(corePath);
const moduleSource = read('development/gallery-home/gallery-home.js');

assert.equal(version, '0.3.293');
assert.ok(core.includes(moduleSource), 'Core must embed the maintained gallery module byte-for-byte');
assert.match(core, /#\$\{ID\.nav\} > button \{\s*position: relative;\s*display: flex;/,
  'nav button positioning must live in the base rule');
assert.doesNotMatch(core, /#\$\{ID\.nav\} > button \{ position: relative; \}/,
  'no late one-property nav override may remain');
assert.match(core, /#\$\{ID\.chatToolsPanel\}\[data-page="recent"\],\s*#\$\{ID\.chatToolsPanel\}\[data-page="plans"\] \{ height: min\(80dvh, 700px\); \}/,
  'identical chat-tools page heights must share one rule');
assert.match(core, /#\$\{ID\.presetSettings\}, #\$\{ID\.presetPrompts\} \{\s*display: block;\s*min-width: 0;/,
  'preset display must be merged into its base rule');
const characterListRuleStart = core.indexOf('body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .character_select {');
const characterListRuleEnd = core.indexOf('\n  }', characterListRuleStart);
const characterListRule = core.slice(characterListRuleStart, characterListRuleEnd);
assert.ok(characterListRuleStart >= 0 && characterListRuleEnd > characterListRuleStart);
assert.doesNotMatch(characterListRule, /min-width:\s*0;/,
  'the repeated character-list min-width declaration must stay removed');

assert.match(moduleSource, /function createTLEGalleryHome\(window, document\)/);
assert.match(moduleSource, /const VERSION = '0.3.289'/);
assert.match(moduleSource, /window\[GLOBAL_NAME\] = api;\s*return api;/);
assert.doesNotMatch(moduleSource, /DOMContentLoaded/, 'TLE Core owns gallery startup; the module does not auto-start itself');
assert.match(core, /galleryHome = createTLEGalleryHome\(HOST_WIN, HOST_DOC\);\s*galleryHome\.setEnabled\(recordPreviewEnabled\);/);
assert.match(core, /galleryHome\.start\(\)/);
assert.match(core, /try \{ galleryHome\?\.stop\(\); \}/, 'TLE destroy must stop the gallery');
assert.ok(core.includes(`version: '${version}',`), 'Core API version must match the test-channel manifest');
assert.match(core, /const VERSION = '4\.5\.14'/, 'The integrated HD avatar engine is updated');
assert.match(core, /const SELECTOR = '[^']*\.freesia-gallery-avatar img, \.freesia-gallery-avatar-frame img, \.freesia-gallery-detail-avatar img';/, 'The HD engine targets both the current isolated gallery avatar frame and the legacy wrapper');

const cssStart = moduleSource.indexOf('    const CSS = [');
const cssEnd = moduleSource.indexOf("    ].join('\\n');", cssStart);
assert.ok(cssStart >= 0 && cssEnd > cssStart);
function splitSelectorList(selector) {
  const result = [];
  let start = 0;
  let parentheses = 0;
  let brackets = 0;
  let quote = '';
  let escaped = false;
  for (let index = 0; index < selector.length; index++) {
    const character = selector[index];
    if (quote) {
      if (escaped) { escaped = false; continue; }
      if (character === '\\') { escaped = true; continue; }
      if (character === quote) quote = '';
      continue;
    }
    if (character === '"' || character === "'") { quote = character; continue; }
    if (character === '(') parentheses++;
    else if (character === ')') parentheses--;
    else if (character === '[') brackets++;
    else if (character === ']') brackets--;
    else if (character === ',' && parentheses === 0 && brackets === 0) {
      result.push(selector.slice(start, index).trim());
      start = index + 1;
    }
  }
  const last = selector.slice(start).trim();
  if (last) result.push(last);
  return result;
}
const selectors = [];
for (const line of moduleSource.slice(cssStart, cssEnd).split('\n')) {
  const fragments = [...line.matchAll(/"(?:\\.|[^"\\])*"/g)].map(match => JSON.parse(match[0]));
  if (!fragments.length) continue;
  let rule = fragments.join('__TLE_DYNAMIC_SELECTOR__').trim();
  let mediaContext = '';
  if (rule.startsWith('@media')) {
    const media = rule.match(/^(@media[^{}]+)\{\s*(.*?)\s*\}\s*$/);
    assert.ok(media, 'Responsive CSS rules must have balanced media wrappers');
    mediaContext = media[1].trim();
    rule = media[2].trim();
  }
  const brace = rule.indexOf('{');
  if (brace < 0) continue;
  for (const selector of splitSelectorList(rule.slice(0, brace))) {
    selectors.push(mediaContext + '|' + selector);
  }
}
assert.equal(new Set(selectors).size, selectors.length,
  'No duplicate CSS selectors within the same responsive context');
assert.doesNotMatch(moduleSource, /\bexpandedAll\b/, 'Unused gallery expansion state must not remain');
assert.doesNotMatch(moduleSource, /\bhdAvatarEngine\b/, 'Gallery module must not own the separate HD-avatar engine lifecycle');
assert.match(moduleSource, /--freesia-gallery-detail-main-gap: 5px/);
assert.match(moduleSource, /--freesia-gallery-avatar-radius: 12px;/, 'The preview and detail avatar surfaces share one radius token');
assert.match(moduleSource, /\.freesia-gallery-detail-avatar \{[^}]*border-radius: var\(--freesia-gallery-avatar-radius, 12px\) !important;/, 'The detail avatar frame uses the shared outer avatar radius');
assert.match(moduleSource, /\.freesia-gallery-detail-avatar img \{[^}]*border-radius: inherit !important;/, 'The detail avatar image inherits the frame radius');
assert.match(moduleSource, /\.freesia-gallery-card \{[^}]*aspect-ratio: 2 \/ 3;[^}]*--freesia-gallery-card-radius: var\(--freesia-gallery-avatar-radius, 12px\);[^}]*border: 0 !important;[^}]*box-shadow: none !important;/, "The TLE card owns a fixed 2:3 frame with 12px radius and no border or shadow");
assert.match(moduleSource, /\.freesia-gallery-card-identity > \.freesia-gallery-avatar-frame \{[^}]*width: 100% !important;[^}]*height: 100% !important;[^}]*border: 0 !important;[^}]*box-shadow: none !important;/, "The dedicated avatar frame fills the TLE card and strips theme decoration");
assert.match(moduleSource, /\.freesia-gallery-card-identity > \.freesia-gallery-avatar-frame > img \{[^}]*width: 100% !important;[^}]*height: 100% !important;[^}]*border: 0 !important;[^}]*box-shadow: none !important;[^}]*object-fit: cover !important;/, "The avatar image fills the frame using cover without borders or shadows");
assert.match(moduleSource, /nativeImage\.cloneNode\(false\)/, "Only the native image node is copied to preserve its high-resolution source");
assert.match(moduleSource, /\['id', 'class', 'style', 'width', 'height', 'border'\]\.forEach\(attribute => image\.removeAttribute\(attribute\)\)/, "Theme classes, inline styling, IDs and intrinsic dimensions are stripped from the cloned image");
assert.match(moduleSource, /const avatar = createElement\('div', 'freesia-gallery-avatar-frame'\)/, "The gallery uses its own wrapper rather than the generic .avatar class");
assert.doesNotMatch(moduleSource, /\.freesia-gallery-card-identity > \.avatar/, "No generic theme avatar selector is used inside the record preview");
assert.match(moduleSource, /\.freesia-gallery-card-overlay \{[^}]*inset: auto 0 0;[^}]*width: auto;[^}]*min-height: 48%;[^}]*max-height: 60%;/, "The gradient uses the fixed avatar frame rather than measuring theme image geometry");

assert.match(moduleSource, /\.freesia-gallery-card-identity \{[^}]*border-radius: inherit !important;/, "The identity layer inherits the card radius");
assert.match(moduleSource, /--freesia-gallery-detail-columns: 104px minmax\(0, 1fr\)/);
assert.match(moduleSource, /align-self: stretch/);
assert.match(moduleSource, /freesia-gallery-description \{[^}]*flex: 1 1 0/);
assert.match(moduleSource, /Math\.min\(2, state\.layoutSettings\.columns\)/);

assert.match(moduleSource, /const DEFAULT_DISPLAY_MODE = 'chatted'/);
assert.match(moduleSource, /const MAX_GALLERY_RECENT_CHATS = 1000/);
assert.match(moduleSource, /displayMode: parsed\.displayMode === 'all' \? 'all' : DEFAULT_DISPLAY_MODE/);
assert.match(moduleSource, /id = 'freesiaGalleryDisplayMode'/);
assert.match(moduleSource, /只显示有聊天记录的角色/);
assert.match(moduleSource, /显示全部角色/);
assert.match(moduleSource, /body: JSON\.stringify\(\{ max: MAX_GALLERY_RECENT_CHATS/);
assert.match(moduleSource, /const showAllCharacters = state\.layoutSettings\.displayMode === 'all'/);
assert.match(moduleSource, /if \(showAllCharacters && aHasChats !== bHasChats\)/);
assert.match(moduleSource, /if \(displayModeChanged\) void refresh\(\)/);

assert.match(moduleSource, /setEnabled: function \(enabled\)/);
assert.match(moduleSource, /if \(state\.started \|\| !state\.enabled \|\| typeof document === 'undefined'\)/);
assert.match(moduleSource, /if \(!next\) stop\(\);\s*else start\(\);/);
assert.ok(moduleSource.includes("document.querySelectorAll('dialog.popup').forEach(attachGallerySettingsToNativePopup)"));
assert.match(moduleSource, /setHeader\('记录预览'/);
assert.match(moduleSource, /setHeader\('记录详情'/);
assert.match(moduleSource, /切换到酒馆默认首页/);
assert.match(moduleSource, /border-image: none !important/);
assert.match(moduleSource, /text-align: left !important/);
assert.match(moduleSource, /freesia-gallery-detail-session-card \.chatName/);
assert.match(moduleSource, /freesia-gallery-file-session-card \.chatName/);
assert.ok(moduleSource.includes("nativeVersion.cloneNode(true)"), "Preserve the native SillyTavern version below the Record Preview title");
assert.ok(moduleSource.includes(".freesia-gallery-title-group > .welcomeHeaderVersionDisplay"), "Render the version as a compact subtitle");
assert.match(moduleSource, /createElement\('article', 'freesia-gallery-card'\)/, "Gallery cards use the TLE-owned outer card, not native recentChat styling");
assert.doesNotMatch(moduleSource, /createElement\('article', 'recentChat freesia-gallery-card'\)/);
assert.match(moduleSource, /aspect-ratio: 2 \/ 3/, "Record preview cards use a 2:3 portrait ratio");
assert.match(moduleSource, /grid-auto-rows: auto; align-items: start; align-content: start;/, "Grid rows must size to card content instead of stretching to fill the grid container");
assert.match(moduleSource, /\.freesia-gallery-card \{[^}]*aspect-ratio: 2 \/ 3; align-self: start;/, "Each card keeps its 2:3 aspect ratio without grid-item stretching");
assert.doesNotMatch(moduleSource, /GRID_CLASS \+ " \{[^"]*(?:grid-auto-rows: 1fr|align-items: stretch)/, "Gallery grid must not force portrait cards into equal stretched row heights");
assert.match(moduleSource, /const overlay = createElement\('div', 'freesia-gallery-card-overlay'\)/);
assert.match(moduleSource, /overlay\.append\(heading, dateRow, messageContainer, stats\);/);
assert.match(moduleSource, /card\.append\(identity, overlay\);/);
assert.doesNotMatch(moduleSource, /freesia-gallery-card-latest|--freesia-gallery-action-size|--freesia-gallery-action-padding/);
assert.match(moduleSource, /-webkit-line-clamp: 2; line-clamp: 2;/, "The recent-chat preview is capped at exactly two lines");
assert.doesNotMatch(moduleSource, /-webkit-line-clamp: 12|line-clamp: 12/, "The preview must not expand into a long paragraph");
assert.match(moduleSource, /\.freesia-gallery-card-overlay \{[^}]*inset: auto 0 0;[^}]*width: auto;[^}]*min-height: 48%;[^}]*height: auto;[^}]*max-height: 60%;[^}]*linear-gradient\(180deg/, "The gradient uses a fixed overlay area attached to the TLE avatar card");
assert.match(moduleSource, /\.freesia-gallery-card-overlay \{[^}]*gap: 2px;[^}]*padding: 30px 5px 5px;/, "The overlay uses compact vertical spacing and five-pixel side/bottom padding");
assert.match(moduleSource, /rgba\(0, 0, 0, 0\) 0%, rgba\(0, 0, 0, 0\.035\) 14%, rgba\(0, 0, 0, 0\.12\) 30%, rgba\(0, 0, 0, 0\.32\) 46%, rgba\(0, 0, 0, 0\.56\) 64%, rgba\(0, 0, 0, 0\.78\) 82%, rgba\(0, 0, 0, 0\.92\) 100%/, "The gradient fades gradually across an expanded area with multiple intermediate stops");
assert.doesNotMatch(moduleSource, /\.freesia-gallery-card-overlay \{[^}]*inset: 0;/, "The overlay must not cover the full card");
assert.match(moduleSource, /\.freesia-gallery-card-overlay > \.chatStats \{[^}]*flex-direction: row;[^}]*align-items: end !important;[^}]*justify-content: flex-end !important;[^}]*font-size: 0\.85em; gap: 6px;/, "Message count and file size stay right-aligned and bottom-aligned");
assert.doesNotMatch(moduleSource, /\.freesia-gallery-card-overlay > \.chatStats \{[^}]*line-height:/, "The stats row does not force a custom line-height");
assert.match(moduleSource, /\.freesia-gallery-chat-actions button \{[^}]*background: transparent !important;[^}]*background-image: none !important;[^}]*border: 0 !important;[^}]*box-shadow: none !important;/, "Action icons have no button base, background, border or shadow");
assert.match(moduleSource, /freesia-gallery-card-date-row \{[^}]*justify-content: flex-start;[^}]*gap: 0;/, "The date row uses zero gap to preserve the full date width");
assert.match(moduleSource, /freesia-gallery-card-date-row \.chatDate \{[^}]*flex: 1 1 auto;/, "The date expands into the available row width");
assert.match(moduleSource, /freesia-gallery-chat-actions \{[^}]*gap: 2px; margin-inline-start: 0;/, "The action group stays compact and does not push the date away");
assert.match(moduleSource, /freesia-gallery-chat-actions button \{[^}]*flex: 0 0 24px;[^}]*width: 24px !important;[^}]*height: 24px !important;[^}]*padding: 0 !important;/, "Native actions retain their behavior but use compact 24px icon buttons");
assert.match(moduleSource, /--freesia-gallery-overlay-color: #fff;[^\n]*color: var\(--freesia-gallery-overlay-color, #fff\)/, "The card overlay owns a fixed high-contrast text color");
assert.match(moduleSource, /freesia-gallery-card-date-row \.chatDate \{[^}]*color: var\(--freesia-gallery-overlay-color, #fff\) !important;/, "The date ignores inherited theme text colors");
assert.match(moduleSource, /freesia-gallery-chat-actions button \{[^}]*color: var\(--freesia-gallery-overlay-color, #fff\) !important;/, "All card action buttons use the fixed overlay color");
assert.match(moduleSource, /freesia-gallery-character-pin\.active \{[^}]*color: var\(--freesia-gallery-overlay-color, #fff\) !important;/, "The active pin does not inherit a potentially low-contrast theme accent");
assert.match(moduleSource, /freesia-gallery-card-overlay > \.chatStats \{[^}]*color: var\(--freesia-gallery-overlay-color, #fff\) !important;/, "Bottom statistics use the same fixed overlay color");
assert.match(moduleSource, /\.freesia-gallery-card-overlay > \.chatMessageContainer \{[^}]*flex: 0 0 auto;[^}]*max-height: 2\.7em;/, "The preview container is limited to two lines and does not consume the card's remaining height");
assert.ok(moduleSource.includes("justify-content: space-between; text-align: left !important; flex-wrap: var(--freesia-gallery-detail-heading-wrap"), "Keep character and lorebook at opposite ends of one heading row");
assert.ok(moduleSource.includes("text-align: right !important; }"), "Right-align the bound lorebook");
assert.match(moduleSource, /async function openCharacterManagement\(avatar\)/);
assert.match(moduleSource, /selectCharacterById\(found\.index, \{ switchMenu: true \}\)/);
assert.match(moduleSource, /async function openBoundLorebook\(worldName\)/);
assert.match(moduleSource, /await import\('\/scripts\/world-info\.js'\)/);
assert.match(moduleSource, /openWorldInfoEditor\(name\)/);
assert.match(moduleSource, /world_editor_select/);
assert.match(moduleSource, /createNavigationLink\(/);
assert.match(moduleSource, /freesia-gallery-character-link/);
assert.match(moduleSource, /freesia-gallery-lorebook/);
assert.match(moduleSource, /freesia-gallery-detail-chat-count/);
assert.match(moduleSource, /\.freesia-gallery-chat-count \{[^}]*font-size: clamp\(10px,0\.72em,12px\);/, "The chat count uses a bounded readable font size");
assert.ok(moduleSource.includes("main.append(heading, description);"), "Description begins directly below the name/lorebook row");
assert.match(moduleSource, /setPage\('files'\);\s*renderFiles\(\)/);
assert.doesNotMatch(moduleSource, /detailManageButton|freesia-gallery-manage|freesia-gallery-description-header|freesia-gallery-description-label|const filesButton/, "Remove redundant action buttons and description title row");


assert.doesNotMatch(moduleSource, /freesia-gallery-version/);
assert.doesNotMatch(moduleSource, /setHeader\('角色画廊'/);
assert.match(core, /getStoredBool\(RECORD_PREVIEW_ENABLED_KEY, true\)/);
assert.match(core, /data-tle-setting="record-preview-enabled"/);
assert.match(core, /点击首页右上角的切换图标/);
assert.match(core, /galleryHome\.setEnabled\(recordPreviewEnabled\)/);
assert.match(core, /home-avatar-pseudo-disabled/);
assert.match(core, /home-avatar-border-image-disabled/);
assert.doesNotMatch(moduleSource, /syncAvatarCompatibility|avatarCompatibility|setAvatarCompatibility|hdAvatarEngine/, 'The fixed TLE avatar style has no retired compatibility toggle or HD-engine lifecycle runtime');
assert.match(moduleSource, /function renderPagination\(total\)/, 'Gallery pagination remains part of the preview runtime');
assert.match(moduleSource, /function renderGallery\(groups, source, error\)/, 'Gallery rendering remains part of the preview runtime');
new vm.Script(moduleSource, { filename: 'development/gallery-home/gallery-home.js' });
new vm.Script(core, { filename: corePath });
console.log('TLE gallery integration, independent 2:3 card radius, display-scope filtering, recency ordering, pagination settings and native action behavior checks passed.');
