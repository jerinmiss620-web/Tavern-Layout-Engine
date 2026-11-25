import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const plan = JSON.parse(readFileSync('release-plan.json', 'utf8'));
const source = readFileSync(`releases/v${plan.core}/TLE.js`, 'utf8');
const readme = readFileSync('README.md', 'utf8');
const managerStart = source.indexOf('function openQuickGroupManager');
const managerEnd = source.indexOf('const FOLD_STORAGE_KEY', managerStart);
const manager = source.slice(managerStart, managerEnd);
const searchStart = source.indexOf('function createGlobalSearch()');
const searchEnd = source.indexOf('function createRailControls()', searchStart);
const searchMarkup = source.slice(searchStart, searchEnd);

assert.equal(plan.core, '0.3.220');
new vm.Script(source, { filename: 'TLE.js' });

// One existing rail control is renamed; no second Organizer button is introduced.
assert.equal((source.match(/id="\$\{ID\.searchToggle\}"/g) || []).length, 1);
assert.match(source, /aria-label="打开整理侠"/);
assert.doesNotMatch(source, /organizerToggle|data-tle-quick-groups/);

// The original search page remains the default and the Organizer has one shared input.
assert.match(source, /globalSearchView: 'search'/);
assert.match(source, /function openGlobalSearch\(\)/);
assert.match(source, /function renderGlobalSearchResults\(/);
assert.match(source, /function setGlobalSearchView\(view\)/);
assert.match(searchMarkup, /<strong class="tle-search-title">整理侠<\/strong>/);
assert.match(searchMarkup, /<header class="tle-search-heading">[\s\S]*<nav class="tle-organizer-tabs"[\s\S]*data-organizer-tab="search"[\s\S]*data-organizer-tab="resources"[\s\S]*tle-search-close[\s\S]*<\/header>/);
assert.equal((searchMarkup.match(/<nav class="tle-organizer-tabs"/g) || []).length, 1);
assert.equal((searchMarkup.match(/class="text_pole tle-search-field"/g) || []).length, 1);
assert.match(manager, /const search = state\.globalSearchPanel\.querySelector\('\.tle-search-field'\)/);
assert.doesNotMatch(manager, /quickSearchBox|tle-quick-search-row/);
assert.match(manager, /embedded: true/);

// Existing group data and group-only deletion semantics remain intact.
assert.match(source, /const QUICK_GROUP_KEY = 'tle\.quickGroups\.v2'/);
assert.match(manager, /quickButton\('删除分组'/);
assert.match(manager, /其中项目已恢复为未分组/);

// Resource-management tabs are limited to resources with native delete operations.
// The complete QUICK_MODULES schema still preserves hidden search-only group data.
assert.ok(source.includes("persona: true,\n    theme: true,"));
assert.ok(source.includes("const QUICK_RESOURCE_MODULES = QUICK_MODULES.filter(item => QUICK_DELETE_MODULES[item.id] === true);"));
assert.ok(source.includes("const QUICK_MODULES = INFO_MODULES.filter(item => item.id !== 'characterWorldBook');"));
assert.ok(source.includes("for (const item of QUICK_MODULES) groupsByModule[item.id]"));
assert.ok(manager.includes("for (const item of QUICK_RESOURCE_MODULES)"));
assert.ok(!manager.includes("for (const item of QUICK_MODULES) {\n      const button = quickButton(item.title"));
assert.ok(source.includes("API 连接、接口来源与模型仅允许搜索，不参与分组或删除。"));
assert.ok(!source.includes("整理侠暂不开放批量删除"));
assert.match(source, /正则继续由正则侠管理/);
assert.match(manager, /quickButton\('批量删除资源'/);
assert.ok(manager.includes("const categoryRow = quickNode('div', 'tle-quick-category-row');"));
assert.ok(manager.includes("categoryRow.append(tabs, themeImportRow, backupRow);"));
assert.ok(manager.includes("const groupControlsRow = quickNode('div', 'tle-quick-group-controls');"));
assert.ok(manager.includes("groupControlsRow.append(groupFilters, toolbar);"));
assert.ok(manager.includes("body.append(\\n      categoryRow, groupControlsRow, manageRow, transferConfirm, deleteConfirm,\\n      operations, list, status\\n    );"));
assert.ok(!manager.includes("deleteHint, list, status"));
assert.ok(!manager.includes("hint, backupRow, tabs, groupFilters"));
assert.ok(source.includes(".tle-quick-category-row .tle-quick-tabs"));
assert.ok(source.includes("grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);"));
assert.ok(source.includes(".tle-quick-group-controls {\\n          grid-template-columns: minmax(0, 1fr);"));
assert.ok(source.includes("margin-inline-start: auto;"));
assert.ok(source.includes("order: 3;\\n    flex: 0 0 100%;"));
assert.ok(manager.includes("deleteSelectedButton.setAttribute('aria-description', deleteScopeHint);"));
assert.ok(!manager.includes("const deleteHint = quickNode"));
assert.ok(manager.includes("categoryRow.title = hint.title;"));
assert.ok(manager.includes("native.deleteCharacter(freshChosen.map(entry => entry.value), { deleteChats: false })"));
assert.ok(manager.includes("native.deleteWorldInfo(entry.value)"));
assert.ok(manager.includes("native.deletePreset(entry.label.trim())"));
assert.ok(manager.includes("/persona-delete persona=" + "$" + "{JSON.stringify(String(entry.value))} silent=true"));
assert.ok(manager.includes("executeTLESlashCommand(command, context)"));
assert.ok(manager.includes("'/api/themes/delete'"));
assert.ok(manager.includes("HOST_WIN.setTimeout(() => HOST_WIN.location.reload(), 900)"));
assert.ok(!source.includes("quickHasActiveConversation"));
assert.ok(!source.includes("请先退出当前角色或群聊"));
assert.ok(!source.includes("至少保留一个预设或推理格式"));
assert.ok(source.includes("GUI 预设是酒馆原生保留项，不能删除"));
assert.ok(source.includes("const isGuiPreset = module === 'preset' || module === 'reasoning';"));
// The README carries the agreed third-party layout-plugin boundary.
assert.match(readme, /第三方布局插件兼容性/);
assert.match(readme, /不保证与第三方布局管理插件同时启用时的兼容性/);

console.log('TLE Organizer unified-entry, shared-search, grouping and deletion-safety tests passed.');
