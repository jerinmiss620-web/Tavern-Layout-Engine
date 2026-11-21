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
assert.match(manager, /tabs, groupFilters, themeImportRow, toolbar, manageRow,/,
  'theme import belongs between theme group filters and management toolbar');
assert.match(manager, /const readThemeManagerButton = quickButton\('读取主题管理分组', \(\) => void importThemeManagerGroups\(\)\)/);
assert.match(manager, /if \(!await confirmGroupTransfer\(message, '导入 UI 主题分组'\)\) return;/,
  'existing confirmation must remain');
assert.match(source, /\.tle-quick-manager \.tle-quick-theme-import\[hidden\] \{ display: none !important; \}/,
  'hidden must override author-level flex display');

console.log('Core 0.3.209: native update drawer, compact Floor Tools, two-column hint and contextual theme import passed.');

