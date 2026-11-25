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

assert.equal(plan.core, '0.3.218');
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
assert.match(searchMarkup, /data-organizer-tab="search"/);
assert.match(searchMarkup, /data-organizer-tab="resources"/);
assert.equal((searchMarkup.match(/class="text_pole tle-search-field"/g) || []).length, 1);
assert.match(manager, /const search = state\.globalSearchPanel\.querySelector\('\.tle-search-field'\)/);
assert.doesNotMatch(manager, /quickSearchBox|tle-quick-search-row/);
assert.match(manager, /embedded: true/);

// Existing group data and group-only deletion semantics remain intact.
assert.match(source, /const QUICK_GROUP_KEY = 'tle\.quickGroups\.v2'/);
assert.match(manager, /quickButton\('删除分组'/);
assert.match(manager, /其中项目已恢复为未分组/);

// Only verified resource categories can be batch-deleted.
assert.match(source, /const QUICK_DELETE_MODULES = Object\.freeze\(\{\s*character: true,\s*worldInfo: true,\s*preset: true,\s*reasoning: true,/);
assert.match(source, /API 连接、接口来源与模型属于运行配置，只能分组，不提供删除/);
assert.match(source, /User 身份由酒馆原生身份管理器负责删除/);
assert.match(source, /UI 主题请通过酒馆原生主题管理器删除/);
assert.match(source, /正则继续由正则侠管理/);
assert.match(manager, /quickButton\('批量删除资源'/);
assert.match(manager, /native\.deleteCharacter\(freshChosen\.map\(entry => entry\.value\), \{ deleteChats: false \}\)/);
assert.match(manager, /native\.deleteWorldInfo\(entry\.value\)/);
assert.match(manager, /native\.deletePreset\(entry\.label\.trim\(\)\)/);
assert.match(manager, /至少保留一个预设或推理格式/);
assert.match(source, /请先退出当前角色或群聊/);

// The README carries the agreed third-party layout-plugin boundary.
assert.match(readme, /第三方布局插件兼容性/);
assert.match(readme, /不保证与第三方布局管理插件同时启用时的兼容性/);

console.log('TLE Organizer unified-entry, shared-search, grouping and deletion-safety tests passed.');
