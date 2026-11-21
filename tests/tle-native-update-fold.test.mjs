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
assert.match(source, /#\$\{ID\.chatToolsPanel\}\[data-page="recent"\] \{ height: min\(80dvh, 700px\); \}/);
assert.match(source, /#\$\{ID\.chatToolsPanel\} \.tle-chat-tools-range-value \{ max-height: 22dvh; \}/);
const floorGridStart = source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-action {');
const floorGridEnd = source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-control {', floorGridStart);
const floorGrid = source.slice(floorGridStart, floorGridEnd);
assert.match(floorGrid, /grid-template-columns: max-content minmax\(0, 1fr\);/);
assert.match(floorGrid, /width: max-content;/);
assert.match(floorGrid, /margin: 0;/);
assert.doesNotMatch(floorGrid, /5\.8em/);
assert.match(source, /正常主题不要开启：此修复会强制调整按钮与图标尺寸，可能造成图文错位/);
const prevSource = read('releases/v0.3.207/TLE.js');
const compatSelectorStart = 'body[data-tle-nav][data-tle-compat-nav-repair] #top-settings-holder#top-settings-holder > .drawer > .drawer-toggle {';
const compatSelectorEnd = '/* Optional structural layout repair.';
function compatRules(text) {
  const start = text.indexOf(compatSelectorStart);
  return text.slice(start, text.indexOf(compatSelectorEnd, start));
}
assert.equal(compatRules(source), compatRules(prevSource), 'existing opt-in navigation repair behavior must remain unchanged');
const helpStart = source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-range-help {');
const helpBlock = source.slice(helpStart, source.indexOf('\n}', helpStart) + 2);
assert.match(helpBlock, /grid-column: 1 \/ -1;/, 'range hint must span both input grid columns');
assert.doesNotMatch(helpBlock, /grid-column: 2 \/ -1;/);

const groupManagerStart = source.indexOf('function openQuickGroupManager(');
const groupManagerEnd = source.indexOf("HOST_DOC.addEventListener('click',event=>", groupManagerStart);
const manager = source.slice(groupManagerStart, groupManagerEnd);
const backupStart = manager.indexOf("const backupRow = quickNode('div', 'tle-quick-backup-row')");
const backupEnd = manager.indexOf('current.headingActions.append(backupRow)', backupStart);
const globalBackup = manager.slice(backupStart, backupEnd);
assert.match(globalBackup, /backupRow\.append\(importBackupButton, exportBackupButton, backupFile\)/,
  'global header must retain only full-scheme import/export');
assert.doesNotMatch(globalBackup, /readThemeManagerButton/,
  'category-specific theme import must be absent from global header');
assert.match(manager, /const themeImportRow = quickNode\('div', 'tle-quick-theme-import'\);/);
assert.match(manager, /themeImportRow\.append\(readThemeManagerButton\)/);
assert.match(manager, /themeImportRow\.hidden = true;/);
assert.match(manager, /themeImportRow\.hidden = module !== 'theme';/,
  'category-specific action must appear only in the Theme tab');
assert.match(manager, /searchRow\.append\(themeImportRow, search\)/,
  'theme sync must appear before the search box');
assert.match(manager, /toolbar\.append\(searchRow, targetSelect, manageButton, autoGroupButton\)/,
  'search row must share the existing toolbar with controls');
assert.match(manager, /hint, tabs, groupFilters, toolbar, manageRow/,
  'group filter pills must take their full-width scrolling row');
assert.doesNotMatch(manager, /groupFiltersWrap|tle-quick-filters-wrap/,
  'old filter/sync wrapper must be removed');
assert.match(manager, /const readThemeManagerButton = quickButton\('', \(\) => void importThemeManagerGroups\(\)\)/);
assert.match(manager, /readThemeManagerButton\.setAttribute\('aria-label', '读取主题管理分组，仅替换当前 UI 主题分类'\)/);
assert.match(manager, /readThemeManagerButton\.append\(themeImportIcon, HOST_DOC\.createTextNode\('同步'\)\)/);
assert.match(manager, /if \(!await confirmGroupTransfer\(message, '导入 UI 主题分组'\)\) return;/,
  'existing confirmation must remain');
assert.match(source, /\.tle-quick-manager \.tle-quick-theme-import\[hidden\] \{ display: none !important; \}/,
  'hidden must override author-level flex display');

const managerHeading = source.slice(
  source.indexOf('.tle-quick-manager .tle-quick-heading {'),
  source.indexOf('.tle-quick-manager .tle-quick-hint,')
);
assert.match(managerHeading, /flex-wrap: nowrap;/);
assert.match(managerHeading, /\.tle-quick-title \{[\s\S]*?flex: 1 1 auto;/);
assert.match(managerHeading, /\.tle-quick-heading-actions \{[\s\S]*?flex: 0 0 auto;/);
assert.doesNotMatch(managerHeading, /order: 3;[\s\S]*?flex: 1 1 100%;/,
  'mobile must never force the global icon actions to a second row');
assert.match(source, /\.tle-quick-backup-row > \.tle-quick-icon-action \{/);
assert.match(globalBackup, /fa-solid fa-file-import/);
assert.match(globalBackup, /fa-solid fa-file-export/);
assert.match(globalBackup, /importBackupButton\.setAttribute\('aria-label', '导入全部分组方案文件'\)/);
assert.match(globalBackup, /exportBackupButton\.setAttribute\('aria-label', '导出全部快切分类的分组方案'\)/);
assert.match(manager, /const searchRow = quickNode\('div', 'tle-quick-search-row'\)/);
assert.match(source, /\.tle-quick-manager \.tle-quick-search-row \{/);
assert.match(source, /\.tle-quick-manager \.tle-quick-toolbar > \.tle-quick-search-row \{\s*grid-column: 1 \/ -1;/);
assert.match(source, /\.tle-quick-manager \.tle-quick-search \{\s*flex: 1 1 0;/);
assert.doesNotMatch(source, /\.tle-quick-manager \.tle-quick-filters-wrap \{/);
assert.doesNotMatch(manager, /backupHint/);
assert.doesNotMatch(manager, /search\.focus\(\{ preventScroll: true \}\);/);
assert.match(source, /\.tle-quick-manager \.tle-quick-manage-row > input \{ grid-column: 1 \/ -1; \}/);
// All TLE-generated scroll regions leave scrollbar appearance to the host's
// global theme rules. Width/color and WebKit pseudo-element rules are not
// inherited like normal text properties; TLE must not override them.
assert.doesNotMatch(source, /scrollbar-width\s*:/,
  'TLE must not force thin/default scrollbar widths on Firefox or Chromium');
assert.doesNotMatch(source, /scrollbar-color\s*:/,
  'TLE must not override theme thumb and track colors');
assert.doesNotMatch(source, /::-(?:webkit|moz)-scrollbar(?:-[a-z-]+)?\s*\{/,
  'TLE must not generate competing vendor-specific scrollbar style rules');
const scrollableSurfaces = [
  '#${ID.chatToolsPanel} .tle-chat-tools-page {',
  '#${ID.chatToolsPanel} .tle-chat-tools-range-value {',
  '#${ID.chatToolsPanel} .tle-chat-tools-recent-root .welcomeRecent {',
  '#tle-global-search-panel .tle-search-results {',
  '#top-settings-holder > .tle-sidebar-info {',
  '.tle-quick-manager .tle-quick-tabs {',
  '.tle-quick-manager .tle-quick-filter-bar {',
  '.tle-quick-manager .tle-quick-operations {',
  '.tle-quick-manager .tle-quick-list {',
  '.tle-quick-picker-surface .scrollableInner {',
  '#tle-mobile-debugger pre {',
];
for (const selector of scrollableSurfaces) {
  assert.ok(source.includes(selector), 'scrollable TLE surface missing: ' + selector);
}
assert.equal((source.match(/scrollbar-gutter: stable;/g) || []).length, 2,
  'preserve wide workspace scroll layout, which is not a scrollbar skin');
console.log('Core 0.3.211: Theme sync beside search, full-width group pills, scrollbar skin audit passed.');

