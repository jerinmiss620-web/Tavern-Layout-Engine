import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import vm from 'node:vm';

const plan = JSON.parse(readFileSync('release-plan.json', 'utf8'));
const stableManifest = JSON.parse(readFileSync('latest.json', 'utf8'));
const hasWorkingSource = existsSync('development/organizer/TLE.js');
const testManifest = hasWorkingSource
  ? JSON.parse(readFileSync('channels/test.json', 'utf8'))
  : null;
const sourcePath = hasWorkingSource
  ? 'development/organizer/TLE.js'
  : `releases/v${plan.core}/TLE.js`;
const source = readFileSync(sourcePath, 'utf8');
const readme = readFileSync('README.md', 'utf8');
const actualVersion = source.match(/version:\s*'([0-9]+\.[0-9]+\.[0-9]+)'/)?.[1];
const expectedVersion = hasWorkingSource ? testManifest.latest_version : plan.core;

assert.equal(stableManifest.latest_version, plan.core, 'stable manifest and release plan must agree');
assert.equal(actualVersion, expectedVersion, 'test/development source must match its channel version');
new vm.Script(source, { filename: sourcePath });

const managerStart = source.indexOf('function openQuickGroupManager(');
const managerEnd = source.indexOf('const FOLD_STORAGE_KEY', managerStart);
const manager = source.slice(managerStart, managerEnd);
const searchStart = source.indexOf('function createGlobalSearch()');
const organizerStart = source.indexOf('function createOrganizerPanel()', searchStart);
const railStart = source.indexOf('function createRailControls()', organizerStart);
const searchMarkup = source.slice(searchStart, organizerStart);
const organizerMarkup = source.slice(organizerStart, railStart);

assert.ok(managerStart >= 0 && managerEnd > managerStart, 'Organizer resource manager must exist');
assert.ok(searchStart >= 0 && organizerStart > searchStart && railStart > organizerStart);

// Global Search and Organizer are separate native entry points and surfaces.
// The original global search remains intact; its only Organizer integration is a direct jump.
assert.match(source, /function openGlobalSearch\(\)/);
assert.match(searchMarkup, /panel\.className = 'tle-global-search-overlay'/);
assert.match(searchMarkup, /<strong class="tle-search-title">全局搜索<\/strong>/);
assert.match(searchMarkup, /data-search-organizer-jump/);
assert.match(searchMarkup, /renderGlobalSearchResults\(/);
assert.match(searchMarkup, /jumpToSearchResult\(/);
assert.match(searchMarkup, /state\.organizerEntry\?\.querySelector\(':scope > \.drawer-toggle'\)\?\.click\(\)/);
assert.match(organizerMarkup, /panel\.className = 'drawer-content closedDrawer'/);
assert.match(organizerMarkup, /class="tle-search-field text_pole flex1"/);
assert.match(organizerMarkup, /state\.organizerEntry\?\.appendChild\(panel\)/);
assert.match(source, /organizerEntry\.className = 'drawer'/);
assert.match(source, /organizerToggle\.setAttribute\('aria-label', '整理侠'\)/);
assert.match(source, /holder\.insertBefore\(state\.organizerEntry, organizerPosition\)/);
assert.match(manager, /const search = state\.organizerPanel\.querySelector\('\.tle-search-field'\)/);
assert.doesNotMatch(manager, /state\.globalSearchPanel|globalSearchView|setGlobalSearchView/);
assert.match(source, /function setGlobalSearchEnabled\(enabled\)/);
assert.match(source, /data-tle-setting="global-search"/);

// Group storage keeps the complete schema, including search-only categories,
// while the visible resource manager only exposes resources with native delete APIs.
assert.match(source, /const QUICK_GROUP_KEY = 'tle\.quickGroups\.v2'/);
assert.match(source, /const QUICK_MODULES = INFO_MODULES\.filter\(item => item\.id !== 'characterWorldBook'\)/);
assert.match(source, /const QUICK_DELETE_MODULES = Object\.freeze\(\{/);
assert.match(source, /const QUICK_RESOURCE_MODULES = QUICK_MODULES\.filter\(item => QUICK_DELETE_MODULES\[item\.id\] === true\)/);
assert.match(source, /for \(const item of QUICK_MODULES\) groupsByModule\[item\.id\]/);
assert.match(manager, /for \(const item of QUICK_RESOURCE_MODULES\)/);
assert.doesNotMatch(manager, /for \(const item of QUICK_MODULES\) \{\s*const button = quickButton\(item\.title/);
assert.match(source, /API 连接、接口来源与模型仅允许搜索，不参与分组或删除。/);
assert.match(source, /正则继续由正则侠管理/);
assert.match(manager, /quickButton\('重命名'/);
assert.match(manager, /quickButton\('删除分组'/);
assert.match(manager, /selectedGroupActions\.append\(selectedGroupActionsLabel, renameGroupButton, deleteGroupButton\)/);
assert.match(manager, /selectedGroupActions\.hidden = false/);
assert.doesNotMatch(manager, /selectedGroupActions\.hidden = !managedGroup/);
assert.match(manager, /function refreshGroupManagement/);
assert.match(manager, /const managedGroup = groups\.find\(group => group\.id === viewGroup\)/);
assert.match(manager, /renameInput\.setAttribute\('aria-label', '修改后的分组名称'\)/);
assert.match(manager, /不会删除其中的资源/);
assert.match(manager, /项会移回「未分组」/);
assert.match(manager, /button\.dataset\.groupId = filter\.id/);
assert.match(manager, /menu_button tle-quick-filter/);
assert.doesNotMatch(manager, /manageTargetName|manageRow|manageButton|groupName/);
assert.match(manager, /targetSelect\.addEventListener\('change', \(\) => \{\s*targetGroup = targetSelect\.value;\s*render\(\);\s*\}\)/s);
assert.doesNotMatch(manager, /targetSelect\.addEventListener\('change'[\s\S]*?viewGroup\s*=/);
assert.match(source, /\.tle-quick-manager \.tle-quick-category-row \.tle-quick-tabs\s*\{[^}]*align-items:\s*flex-start;/s);
assert.match(source, /\.tle-quick-manager \.tle-quick-category-row \.tle-quick-tabs > button\s*\{[^}]*align-self:\s*flex-start;[^}]*width:\s*auto;/s);
const categoryButtonRule = source.match(/\.tle-quick-manager \.tle-quick-category-row \.tle-quick-tabs > button\s*\{([^}]*)\}/s)?.[1] || '';
assert.match(categoryButtonRule, /(^|;)\s*width:\s*auto\s*;/,
  'Desktop category buttons must use their natural width');
assert.doesNotMatch(categoryButtonRule, /(^|;)\s*width:\s*100%\s*;/,
  'Desktop category buttons must not be forced to fill the entire category column');
assert.match(manager, /quickButton\('批量删除资源'/);

// Resource deletion is delegated to the host's native operations with safeguards.
assert.match(manager, /native\.deleteCharacter\(freshChosen\.map\(entry => entry\.value\), \{ deleteChats: false \}\)/);
assert.match(manager, /native\.deleteWorldInfo\(entry\.value\)/);
assert.match(manager, /native\.deletePreset\(entry\.label\.trim\(\)\)/);
assert.match(manager, /\/persona-delete persona=\$\{JSON\.stringify\(String\(entry\.value\)\)\} silent=true/);
assert.match(manager, /HOST_WIN\.fetch\('\/api\/themes\/delete'/);
assert.match(manager, /const isGuiPreset = module === 'preset' \|\| module === 'reasoning'/);
assert.match(manager, /deleteSelectedButton\.setAttribute\('aria-description', deleteScopeHint\)/);
assert.doesNotMatch(source, /quickHasActiveConversation|请先退出当前角色或群聊|至少保留一个预设或推理格式/);
assert.match(source, /GUI 预设是酒馆原生保留项，不能删除/);

// Organizer title actions mount idempotently; the desktop workspace uses three
// adjacent panes without decorative divider elements or reserved 1px tracks.
assert.match(manager, /headingTools\.replaceChildren\(themeImportRow, backupRow\)/);
assert.doesNotMatch(manager, /headingTools\.append\(themeImportRow, backupRow\)/);
assert.match(manager, /toolbar\.append\(targetSelect\)/);
assert.match(manager, /groupActions\.append\(newGroupToggle, autoGroupButton\)/);
assert.doesNotMatch(manager, /categoryDivider|groupDivider|tle-organizer-divider/);
assert.match(manager, /categoryPane\.append\(categoryHeading, categoryRow\)/);
assert.match(manager, /groupPane\.append\(groupHeader, groupActions, groupEditor, groupFilters\)/);
assert.match(manager, /resourcePane\.append\(\s*resourceHeader, content\.searchRow, content\.controls, worldFilterBar, toolbar, transferConfirm, deleteConfirm,\s*operations, list, status/);
assert.match(manager, /workspace\.append\(categoryPane, groupPane, resourcePane\)/);
assert.match(manager, /body\.append\(workspace\)/);
assert.match(source, /grid-template-columns: minmax\(138px, \.78fr\) minmax\(168px, \.92fr\) minmax\(360px, 2\.3fr\)/);
assert.match(source, /\.tle-quick-manager \.tle-quick-filter\s*\{[^}]*width:\s*100%/s);
assert.match(source, /el\.dataset\.contentDisabled === undefined/);
assert.match(source, /el\.dataset\.contentLockDisabled === undefined/);
assert.match(source, /\.tle-quick-manager \.tle-organizer-pane-title\s*\{\s*display:\s*block;\s*flex:\s*0 0 auto;\s*width:\s*100%;\s*min-width:\s*0;\s*box-sizing:\s*border-box;\s*\}/,
  'Both Organizer pane titles must fill the width of their own pane');
assert.doesNotMatch(source, /\.tle-organizer-group-pane\s+\.tle-organizer-pane-title/,
  'Do not give the group heading a separate fixed-width or one-off selector');
assert.doesNotMatch(source, /tle-organizer-divider|writing-mode:\s*vertical-rl/);
assert.match(readme, /第三方布局插件兼容性/);
assert.match(readme, /不保证与第三方布局管理插件同时启用时的兼容性/);

console.log(`TLE Organizer ${actualVersion}: separate global search, native Organizer drawer, divider-free three-pane layout, grouping and deletion-safety tests passed.`);
