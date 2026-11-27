import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const plan = JSON.parse(read('release-plan.json'));
const source = read('releases/v' + plan.core + '/TLE.js');
const pack = JSON.parse(read('releases/v' + plan.core + '/TLE-' + plan.core + '-import.json'));
new vm.Script(source);
assert.equal(pack.content, source, 'published installer must match the current Core source');
assert.match(source, /<section class="tle-section" data-tle-update-details>/);
assert.match(source, /<div class="inline-drawer">[\s\S]*?<div class="inline-drawer-toggle inline-drawer-header interactable" tabindex="0" role="button" aria-expanded="false">/);
assert.match(source, /data-tle-update-summary/);
assert.match(source, /data-tle-update-alert hidden>可更新/);
assert.match(source, /<div class="fa-solid fa-circle-chevron-down inline-drawer-icon down interactable" aria-hidden="true"><\/div>/);
assert.match(source, /<div class="inline-drawer-content" style="display:none;">[\s\S]*?<div class="tle-update-content">/);
assert.match(source, /data-tle-setting="auto-update"/);
assert.match(source, /data-tle-action="check-loader-update"/);
assert.match(source, /data-tle-action="install-loader-update"/);
assert.match(source, /data-tle-action="install-update"/);
assert.match(source, /tle-loader-bootstrap-state-change/);
assert.match(source, /data-tle-fold-settings>[\s\S]*?<div class="inline-drawer">/);
assert.match(source, /<b>折叠侠设置<\/b>[\s\S]*?<div class="fa-solid fa-circle-chevron-down inline-drawer-icon down interactable"/);
assert.doesNotMatch(source, /tle-update-section/);
assert.doesNotMatch(source, /tle-update-body/);
assert.doesNotMatch(source, /tle-update-section > summary|tle-update-section\[open\]/);
assert.doesNotMatch(source, /<details class="tle-update-section"/);
assert.match(source, /#\$\{ID\.panel\} \.tle-update-content \{/);
assert.doesNotMatch(source, /#\$\{ID\.panel\} \.inline-drawer-content\s*\{[^}]*display:\s*grid/);
// Floor Tools must shrink to its content; Recent Chats alone fills the panel.
const panelStart = source.indexOf('#${ID.chatToolsPanel} {');
const panelRule = source.slice(panelStart, source.indexOf('#${ID.chatToolsPanel}[hidden]', panelStart));
assert.match(panelRule, /height: auto;/);
assert.match(panelRule, /min-height: 0;/);
assert.match(panelRule, /justify-content: flex-start;/);
const toolsStart = source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-page {');
const toolsRule = source.slice(toolsStart, source.indexOf('#${ID.chatToolsPanel} [data-chat-tools-page="recent"] {', toolsStart));
assert.match(toolsRule, /flex: 0 1 auto;/);
assert.doesNotMatch(toolsRule, /flex: 1 1 auto;/);
const recentStart = source.indexOf('#${ID.chatToolsPanel} [data-chat-tools-page="recent"] {');
const recentRule = source.slice(recentStart, source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-actions {', recentStart));
assert.match(recentRule, /flex: 1 1 auto;/);
assert.match(recentRule, /overflow: hidden;/);
assert.match(source, /#\$\{ID\.chatToolsPanel\}\[data-page="recent"\],\s*#\$\{ID\.chatToolsPanel\}\[data-page="plans"\] \{ height: min\(80dvh, 700px\); \}/);
assert.match(source, /#\$\{ID\.chatToolsPanel\} \.tle-chat-tools-range-value \{ max-height: 22dvh; \}/);
const floorGridStart = source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-action {');
const floorGridEnd = source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-control {', floorGridStart);
const floorGrid = source.slice(floorGridStart, floorGridEnd);
assert.match(floorGrid, /grid-template-columns: max-content minmax\(0, 1fr\);/);
assert.match(floorGrid, /width: max-content;/);
assert.match(floorGrid, /margin: 0;/);
assert.doesNotMatch(floorGrid, /5\.8em/);
assert.match(source, /正常主题不要开启：此修复会强制调整按钮与图标尺寸，可能造成图文错位/);
const prevSource = read('tests/fixtures/legacy/core-v0.3.207.js');
const compatSelectorStart = 'body[data-tle-nav][data-tle-compat-nav-repair] #top-settings-holder#top-settings-holder > .drawer > .drawer-toggle {';
function compatRules(text) {
  const start = text.indexOf(compatSelectorStart);
  assert.ok(start >= 0, 'opt-in native navigation repair rules missing');
  const end = text.indexOf('\n}', start);
  assert.ok(end > start, 'opt-in native navigation repair rule has no endpoint');
  return text.slice(start, end + 2);
}
assert.equal(compatRules(source), compatRules(prevSource), 'existing opt-in navigation repair behavior must remain unchanged');
const helpStart = source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-range-help {');
const helpBlock = source.slice(helpStart, source.indexOf('\n}', helpStart) + 2);
assert.match(helpBlock, /grid-column: 1 \/ -1;/, 'range hint must span both input grid columns');
assert.doesNotMatch(helpBlock, /grid-column: 2 \/ -1;/);


assert.ok(source.includes('<button type="button" class="menu_button" data-tle-action="check-update" hidden>检查更新</button>'));
assert.ok(source.includes('<button type="button" class="menu_button" data-tle-action="adopt-loader" hidden>启用 Loader 接管</button>'));
assert.ok(source.includes('<button type="button" class="menu_button" data-tle-action="check-loader-update" hidden>检查 Loader 更新</button>'));
assert.doesNotMatch(source, /tle-update-check/,
  'update actions must inherit the native menu_button appearance without a custom visual override');
assert.ok(source.includes('#${ID.panel} .tle-version-meta [hidden] { display: none !important; }'));
console.log(`Core ${plan.core}: native update drawer, native update action buttons and floor-tools layout checks passed.`);
