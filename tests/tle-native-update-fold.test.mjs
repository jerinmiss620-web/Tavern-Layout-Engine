import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('channels/test.json'));
const source = read(manifest.release.source_path);
const pack = JSON.parse(read(`releases/v${manifest.release.version}/TLE-${manifest.release.version}-TEST-import.json`));
new vm.Script(source);
assert.equal(pack.content, source, 'test installer must match the current test Core');
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
const prevSource = read('tests/fixtures/legacy/core-v0.3.207.js');
const compatSelectorStart = 'body[data-tle-nav][data-tle-compat-nav-repair] #top-settings-holder#top-settings-holder > .drawer > .drawer-toggle {';
const compatSelectorEnd = '/* Optional structural layout repair.';
const compatNavTextStart = '/* Opt-in sidebar text only.';
function compatRules(text) {
  const start = text.indexOf(compatSelectorStart);
  assert.ok(start >= 0, 'opt-in native navigation repair rules missing');
  const nextStructural = text.indexOf(compatSelectorEnd, start);
  const nextTextColor = text.indexOf(compatNavTextStart, start);
  // New opt-in text-colour rules are separate from the unchanged layout repair.
  // Compare ONLY the old repair block; do not accidentally include the next feature.
  const end = nextTextColor >= 0 && nextTextColor < nextStructural ? nextTextColor : nextStructural;
  assert.ok(end > start, 'opt-in native navigation repair block has no endpoint');
  return text.slice(start, end);
}
assert.equal(compatRules(source), compatRules(prevSource), 'existing opt-in navigation repair behavior must remain unchanged');
const helpStart = source.indexOf('#${ID.chatToolsPanel} .tle-chat-tools-range-help {');
const helpBlock = source.slice(helpStart, source.indexOf('\n}', helpStart) + 2);
assert.match(helpBlock, /grid-column: 1 \/ -1;/, 'range hint must span both input grid columns');
assert.doesNotMatch(helpBlock, /grid-column: 2 \/ -1;/);

const groupManagerStart = source.indexOf('function openQuickGroupManager(');
const groupManagerEnd = source.indexOf('const FOLD_STORAGE_KEY', groupManagerStart);
const manager = source.slice(groupManagerStart, groupManagerEnd);
const backupStart = manager.indexOf("const backupRow = quickNode('div', 'tle-quick-backup-row')");
const backupEnd = manager.indexOf("const themeImportRow = quickNode('div', 'tle-quick-theme-import')", backupStart);
const globalBackup = manager.slice(backupStart, backupEnd);
assert.match(globalBackup, /backupRow\.append\(importBackupButton, exportBackupButton, backupFile\)/,
  'full-scheme import/export controls must remain grouped in the backup row');
assert.doesNotMatch(globalBackup, /readThemeManagerButton/,
  'theme sync must remain a distinct control, not be nested inside the backup row');
assert.match(manager, /const themeImportRow = quickNode\('div', 'tle-quick-theme-import'\);/);
assert.match(manager, /themeImportRow\.append\(readThemeManagerButton\)/);
assert.match(manager, /const headingTools = state\.organizerPanel\.querySelector\('\.tle-search-heading-tools'\)/);
assert.match(manager, /headingTools\.replaceChildren\(themeImportRow, backupRow\)/,
  'theme sync and full-scheme backup controls must be mounted together in the persistent title toolbar');
assert.doesNotMatch(manager, /themeImportRow\.hidden/,
  'theme sync remains visible for every resource category');
assert.match(manager, /const search = state\.organizerPanel\.querySelector\('\.tle-search-field'\)/,
  'resource management must reuse the Organizer search field');
assert.match(manager, /toolbar\.append\(targetSelect\)/,
  'resource toolbar should contain only the target-group selector, not another search field');
assert.match(manager, /groupActions\.append\(manageButton, autoGroupButton\)/,
  'group management actions belong in the middle group pane');
assert.match(manager, /const categoryRow = quickNode\('div', 'tle-quick-category-row'\);/);
assert.match(manager, /categoryRow\.append\(tabs\)/);
assert.doesNotMatch(manager, /categoryRow\.append\(tabs, themeImportRow, backupRow\)/,
  'title toolbar actions must not consume the resource-category row');
assert.match(manager, /const workspace = quickNode\('div', 'tle-organizer-workspace'\);/);
assert.match(manager, /categoryPane\.append\(categoryHeading, categoryRow\)/);
assert.match(manager, /groupPane\.append\(groupHeader, groupActions, groupEditor, groupFilters\)/);
assert.match(manager, /resourcePane\.append\(\s*resourceHeader, content\.searchRow, content\.controls, worldFilterBar, toolbar, transferConfirm, deleteConfirm,\s*operations, list, status/);
assert.match(manager, /workspace\.append\(categoryPane, categoryDivider, groupPane, groupDivider, resourcePane\)/);
assert.match(manager, /body\.append\(workspace\)/,
  'resource manager must use the three-pane workspace with two dividers');
assert.doesNotMatch(manager, /body\.append\(\s*hint, backupRow, tabs, groupFilters/,
  'standalone hint and backup rows must not consume list height');
assert.doesNotMatch(manager, /quickSearchBox|tle-quick-search-row/,
  'resource manager must not create a second custom search row; the content engine owns the single search row');
assert.doesNotMatch(manager, /groupFiltersWrap|tle-quick-filters-wrap/,
  'old filter/sync wrapper must be removed');
assert.match(manager, /const readThemeManagerButton = quickButton\('', \(\) => void importThemeManagerGroups\(\)\)/);
assert.match(manager, /readThemeManagerButton\.setAttribute\('aria-label', '同步 UI 主题分组，仅替换 TLE 当前 UI 主题分类'\)/);
assert.match(manager, /readThemeManagerButton\.append\(themeImportIcon, HOST_DOC\.createTextNode\('同步'\)\)/);
assert.match(manager, /if \(!await confirmGroupTransfer\(message, '导入 UI 主题分组'\)\) return;/,
  'existing confirmation must remain');


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
assert.doesNotMatch(manager, /quickSearchBox|tle-quick-search-row/);
assert.doesNotMatch(source, /\.tle-quick-manager \.tle-quick-search-row \{/);
assert.doesNotMatch(source, /\.tle-quick-manager \.tle-quick-toolbar > \.tle-quick-search-row/);
assert.doesNotMatch(source, /\.tle-quick-manager \.tle-quick-search \{/);
assert.match(source, /\.tle-quick-manager \.tle-quick-toolbar \{\s*display: grid;\s*grid-template-columns: minmax\(0, 1fr\);/);
assert.doesNotMatch(source, /\.tle-quick-manager \.tle-quick-filters-wrap \{/);
assert.doesNotMatch(manager, /backupHint/);
assert.doesNotMatch(manager, /search\.focus\(\{ preventScroll: true \}\);/);
assert.match(source, /\.tle-quick-manager \.tle-quick-group-editor \{ grid-area: manage; \}/,
  'group editor must occupy the dedicated middle-pane management area');
// Vertical scroll surfaces inherit the host theme. Only the three horizontal
// category/filter strips suppress native bars to show their dedicated 3px scroll indicator.
const scrollbarWidthValues = [...source.matchAll(/scrollbar-width\s*:\s*([^;]+);/g)]
  .map(match => match[1].trim()).sort();
assert.deepEqual(scrollbarWidthValues, ['none', 'none', 'none', 'thin'],
  'only the horizontal filter strip may use a thin native bar; compact horizontal strips hide theirs for the 3px indicator');
assert.doesNotMatch(source, /scrollbar-color\s*:/,
  'TLE must not override theme thumb and track colors');
assert.match(source, /\.tle-quick-manager \.tle-quick-category-row \.tle-quick-tabs::-webkit-scrollbar,\s*\.tle-quick-manager \.tle-quick-filter-bar::-webkit-scrollbar,\s*\.tle-quick-manager \.tle-worldbook-filter-bar::-webkit-scrollbar\s*\{\s*display: none;/,
  'vendor scrollbar suppression is limited to the horizontal indicator strips');
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
console.log('Core 0.3.239: three-pane Organizer workspace, persistent title tools, shared search and scrollbar skin audit passed.');

