import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(new URL('../development/organizer/TLE.js', import.meta.url), 'utf8');
new vm.Script(source, { filename: 'development/organizer/TLE.js' });

function extractFunction(name, nextMarker) {
  const start = source.indexOf('  function ' + name + '(');
  const end = source.indexOf(nextMarker, start);
  assert.ok(start >= 0, 'missing function: ' + name);
  assert.ok(end > start, 'missing end marker after: ' + name);
  return source.slice(start, end).trim();
}

const matchesWorldInfoFilter = vm.runInNewContext(
  '(' + extractFunction('matchesWorldInfoFilter', '  function buildWorldInfoCatalog') + ')'
);
const buildWorldInfoCatalog = vm.runInNewContext(
  '(' + extractFunction('buildWorldInfoCatalog', '  function removeWorldInfoExtraLinks') + ')'
);
const removeWorldInfoExtraLinks = vm.runInNewContext(
  '(' + extractFunction('removeWorldInfoExtraLinks', '  // Match Theme Manager') + ')'
);

const organizerToggleSandbox = {
  state: {
    organizerPanel: {
      classList: {
        values: new Set(['closedDrawer']),
        contains(name) { return this.values.has(name); },
        toggle(name, force) {
          if (force) this.values.add(name);
          else this.values.delete(name);
        },
      },
      setAttribute(name, value) { this.attributes ||= {}; this.attributes[name] = value; },
    },
    organizerEntry: {
      querySelector() { return organizerToggleSandbox.toggle; },
    },
    globalSearchOpen: false,
    mobileNav: { open: false },
    destroyed: false,
  },
  toggle: { setAttribute(name, value) { this.attributes ||= {}; this.attributes[name] = value; } },
  quickPanel: null,
  managerOpens: 0,
  nativeDrawerCloses: 0,
  closeGlobalSearch: () => { organizerToggleSandbox.state.globalSearchOpen = false; },
  closeQuickPanel: () => { throw new Error('unexpected quick-panel close while opening Organizer'); },
  closeMobileNativeDrawers: () => { organizerToggleSandbox.nativeDrawerCloses++; },
  openQuickGroupManager: () => { organizerToggleSandbox.managerOpens++; },
  HOST_WIN: { requestAnimationFrame(callback) { callback(); } },
  isMobileViewport() { return false; },
  setMobileNavOpen() {},
};
const setOrganizerDrawerOpen = vm.runInNewContext(
  '(' + extractFunction('setOrganizerDrawerOpen', '  function toggleOrganizerDrawer') + ')',
  organizerToggleSandbox,
);
const toggleOrganizerDrawer = vm.runInNewContext(
  '(' + extractFunction('toggleOrganizerDrawer', '  function setPanelOpen') + ')',
  { state: organizerToggleSandbox.state, setOrganizerDrawerOpen },
);
toggleOrganizerDrawer();
assert.equal(organizerToggleSandbox.state.organizerPanel.classList.contains('openDrawer'), true);
assert.equal(organizerToggleSandbox.state.organizerPanel.classList.contains('closedDrawer'), false);
assert.equal(organizerToggleSandbox.state.organizerPanel.attributes['aria-hidden'], 'false');
assert.equal(organizerToggleSandbox.toggle.attributes['aria-expanded'], 'true');
assert.equal(organizerToggleSandbox.managerOpens, 1);
assert.equal(organizerToggleSandbox.nativeDrawerCloses, 1);
toggleOrganizerDrawer();
assert.equal(organizerToggleSandbox.state.organizerPanel.classList.contains('openDrawer'), false);
assert.equal(organizerToggleSandbox.state.organizerPanel.classList.contains('closedDrawer'), true);
assert.equal(organizerToggleSandbox.state.organizerPanel.attributes['aria-hidden'], 'true');
assert.equal(organizerToggleSandbox.toggle.attributes['aria-expanded'], 'false');

const organizerClosePanel = {
  classList: {
    values: new Set(['openDrawer']),
    contains(name) { return this.values.has(name); },
    toggle(name, force) {
      if (force) this.values.add(name);
      else this.values.delete(name);
    },
  },
  setAttribute(name, value) { this.attributes ||= {}; this.attributes[name] = value; },
};
const organizerCloseSandbox = {
  state: {
    organizerPanel: organizerClosePanel,
    organizerEntry: { querySelector: () => ({ setAttribute() {} }) },
    globalSearchOpen: false,
    mobileNav: { open: false },
    destroyed: false,
  },
  quickPanel: { embedded: true, module: 'groups', node: organizerClosePanel },
  closeQuickPanel: () => { organizerCloseSandbox.quickPanel = null; organizerCloseSandbox.managerCloses++; },
  managerCloses: 0,
  closeGlobalSearch() {},
  closeMobileNativeDrawers() {},
  openQuickGroupManager() {},
  HOST_WIN: { requestAnimationFrame(callback) { callback(); } },
  isMobileViewport() { return false; },
  setMobileNavOpen() {},
};
const closeOrganizerDrawer = vm.runInNewContext(
  '(' + extractFunction('setOrganizerDrawerOpen', '  function toggleOrganizerDrawer') + ')',
  organizerCloseSandbox,
);
closeOrganizerDrawer(false);
assert.equal(organizerClosePanel.classList.contains('openDrawer'), false);
assert.equal(organizerClosePanel.classList.contains('closedDrawer'), true);
assert.equal(organizerClosePanel.attributes['aria-hidden'], 'true');
assert.equal(organizerCloseSandbox.managerCloses, 1);

const worldNames = ['Global', 'Primary', 'Extra', 'Orphan', 'Mixed', 'Unbound'];
const select = {
  options: worldNames.map((name, index) => ({ textContent: name, value: String(index) })),
};
const catalog = buildWorldInfoCatalog(
  worldNames,
  {
    characters: [
      { name: 'Char A', avatar: 'char-a.png', data: { extensions: { world: 'Primary' } } },
      { name: 'Char B', avatar: 'char-b.png', data: { extensions: { world: '' } } },
    ],
  },
  {
    globalSelect: ['Global'],
    charLore: [
      { name: 'char-b', extraBooks: ['Extra', 'Mixed'] },
      { name: 'deleted-card', extraBooks: ['Orphan', 'Mixed'] },
    ],
  },
  ['Global'],
  select,
);

const byName = new Map(catalog.entries.map(entry => [entry.value, entry]));
assert.equal(catalog.meta.totalCharacters, 2);
assert.equal(catalog.meta.unloadedCount, 0);
assert.equal(byName.get('Global').statusLabel, '未绑定');
assert.equal(byName.get('Global').binding.bound, false);
assert.equal(byName.get('Global').binding.global, true);
assert.match(byName.get('Global').detail, /全局启用/);
assert.equal(matchesWorldInfoFilter(byName.get('Global'), 'bound', 0), false);
assert.equal(matchesWorldInfoFilter(byName.get('Global'), 'unbound', 0), true);
assert.equal(matchesWorldInfoFilter(byName.get('Global'), 'global', 0), true);
assert.equal(matchesWorldInfoFilter(byName.get('Global'), 'orphan', 0), false);
assert.equal(byName.get('Primary').statusLabel, '已绑定');
assert.equal(byName.get('Primary').binding.bound, true);
assert.equal(matchesWorldInfoFilter(byName.get('Primary'), 'bound', 0), true);
assert.equal(matchesWorldInfoFilter(byName.get('Primary'), 'unbound', 0), false);
assert.equal(matchesWorldInfoFilter(byName.get('Primary'), 'global', 0), false);
assert.match(byName.get('Primary').detail, /主要绑定：Char A/);
assert.equal(byName.get('Extra').statusLabel, '已绑定');
assert.equal(matchesWorldInfoFilter(byName.get('Extra'), 'bound', 0), true);
assert.match(byName.get('Extra').detail, /额外绑定：Char B/);
assert.equal(byName.get('Orphan').statusLabel, '疑似孤儿');
assert.equal(matchesWorldInfoFilter(byName.get('Orphan'), 'orphan', 0), true);
assert.equal(matchesWorldInfoFilter(byName.get('Orphan'), 'unbound', 0), false);
assert.match(byName.get('Orphan').detail, /遗留角色绑定：deleted-card/);
assert.equal(byName.get('Mixed').statusLabel, '含遗留关联');
assert.equal(matchesWorldInfoFilter(byName.get('Mixed'), 'orphan', 0), true);
assert.equal(matchesWorldInfoFilter(byName.get('Mixed'), 'bound', 0), true);
assert.match(byName.get('Mixed').detail, /Char B/);
assert.match(byName.get('Mixed').detail, /deleted-card/);
assert.equal(byName.get('Unbound').statusLabel, '未绑定');
assert.equal(matchesWorldInfoFilter(byName.get('Unbound'), 'unbound', 0), true);
assert.equal(matchesWorldInfoFilter(byName.get('Unbound'), 'global', 0), false);
assert.match(byName.get('Unbound').detail, /可能是独立世界书/);
assert.equal(byName.get('Global').key, JSON.stringify(['world_info', 'Global']));
assert.equal(byName.get('Global').legacyKey, JSON.stringify(['world_info', '0']));
assert.equal(byName.get('Global').selectValue, '0');

const shallowCatalog = buildWorldInfoCatalog(
  ['Orphan'],
  { characters: [{ name: 'Char C', avatar: 'char-c.png', shallow: true }] },
  { charLore: [{ name: 'deleted-card', extraBooks: ['Orphan'] }] },
  [],
  { options: [{ textContent: 'Orphan', value: '0' }] },
);
assert.equal(shallowCatalog.meta.unloadedCount, 1);
assert.equal(shallowCatalog.entries[0].statusLabel, '待核对');
assert.match(shallowCatalog.entries[0].detail, /1 张角色卡未加载/);
assert.notEqual(shallowCatalog.entries[0].statusLabel, '疑似孤儿');
assert.equal(matchesWorldInfoFilter(shallowCatalog.entries[0], 'orphan', 1), false);
assert.equal(matchesWorldInfoFilter(shallowCatalog.entries[0], 'unbound', 1), false);

const worldInfoForCleanup = {
  charLore: [
    { name: 'current-card', extraBooks: ['Target', 'Keep'] },
    { name: 'deleted-card', extraBooks: ['Target'] },
    { name: 'other-card', extraBooks: ['Keep'] },
  ],
};
assert.equal(removeWorldInfoExtraLinks(worldInfoForCleanup, 'Target'), true);
assert.deepEqual(worldInfoForCleanup.charLore, [
  { name: 'current-card', extraBooks: ['Keep'] },
  { name: 'other-card', extraBooks: ['Keep'] },
]);
assert.equal(removeWorldInfoExtraLinks(worldInfoForCleanup, 'Missing'), false);

const migrationSource = extractFunction('migrateQuickWorldInfoGroupAssignments', '  function quickWorldInfoSelectItems');
const groupData = {
  assignments: {
    worldInfo: {
      [JSON.stringify(['world_info', '0'])]: 'Favorites',
      [JSON.stringify(['world_info', '2'])]: 'Archive',
    },
  },
};
let savedData = null;
const migrateGroups = vm.runInNewContext('(' + migrationSource + ')', {
  readQuickGroups: () => groupData,
  saveQuickGroups: value => { savedData = JSON.parse(JSON.stringify(value)); },
  console: { warn() {} },
});
migrateGroups([
  { legacyKey: JSON.stringify(['world_info', '0']), key: JSON.stringify(['world_info', 'Global']) },
  { legacyKey: JSON.stringify(['world_info', '2']), key: JSON.stringify(['world_info', 'Extra']) },
]);
assert.equal(savedData.assignments.worldInfo[JSON.stringify(['world_info', 'Global'])], 'Favorites');
assert.equal(savedData.assignments.worldInfo[JSON.stringify(['world_info', 'Extra'])], 'Archive');
assert.equal(Object.hasOwn(savedData.assignments.worldInfo, JSON.stringify(['world_info', '0'])), false);

assert.ok(source.includes("organizerEntry: 'tle-organizer-entry'"));
assert.ok(source.includes("organizerPanel: 'tle-organizer-panel'"));
assert.ok(source.includes('state.organizerEntry = organizerEntry'));
assert.ok(source.includes("organizerEntry.className = 'drawer'"), 'Organizer must be the tenth native-shaped drawer');
assert.ok(source.includes("organizerToggle.className = 'drawer-toggle interactable'"));
assert.ok(source.includes("organizerIcon.className = 'drawer-icon fa-solid fa-layer-group interactable'"));
assert.ok(source.includes("panel.className = 'drawer-content closedDrawer'"), 'Organizer must own its drawer-content');
assert.ok(source.includes('state.organizerEntry?.appendChild(panel)'), 'Organizer owns its independent resource panel');
assert.ok(source.includes('holder.insertBefore(state.organizerEntry, organizerPosition)'), 'Organizer must be positioned after the nine native drawers');
assert.ok(source.includes("panel.className = 'tle-global-search-overlay'"), 'Global search must remain its own modal overlay');
assert.ok(source.includes('z-index: 10090'), 'Global search modal must retain its scrim layer');
assert.ok(source.includes('HOST_DOC.body.appendChild(panel)'), 'Global search modal must be independent from the Organizer drawer');
assert.ok(source.includes('data-search-organizer-jump'), 'Global search modal must link to Organizer');
assert.ok(source.includes('function createOrganizerPanel()'));
assert.ok(source.includes("organizerToggle.addEventListener('click', event =>"), 'Organizer must own its click activation');
assert.ok(source.includes('function setOrganizerDrawerOpen(open)'), 'Organizer must explicitly toggle its drawer classes');
assert.ok(source.includes("panel.classList.toggle('openDrawer', expanded)"));
assert.ok(source.includes("panel.classList.toggle('closedDrawer', !expanded)"));
assert.equal(source.includes('#tle-organizer-panel .tle-search-surface'), false, 'Organizer must not have a nested visual shell');
assert.equal(source.includes('<div class="tle-search-surface">'), false, 'Only the global-search modal may use the search surface wrapper');
assert.ok(source.includes("state.organizerPanel.querySelector('.tle-search-field')"), 'Organizer has its own resource filter field');
assert.ok(source.includes('const available = globalSearchEnabled;'));
assert.ok(source.includes('if (!globalSearchEnabled || !state.globalSearchPanel) return;'));
assert.ok(source.includes('body[data-tle-nav="icons"]'));
assert.ok(source.includes('tle-organizer-entry'));
assert.ok(source.includes('<button id="${ID.searchToggle}" class="tle-workspace-icon-button"'), 'The original global-search header button must be restored');
assert.ok(source.includes('function matchesWorldInfoFilter'));
assert.equal(source.includes('setGlobalSearchView'), false, 'Global search and Organizer must not share a tabbed view');
assert.equal(source.includes('tle-organizer-tabs'), false, 'Organizer must not be embedded as a global-search tab');
assert.equal(source.includes('state.organizerEntry.hidden = !available'), false, 'The global-search toggle must not hide Organizer');
assert.ok(source.includes('tle-worldbook-filter-bar'));
assert.ok(source.includes('全局启用'));
assert.ok(source.includes('疑似孤儿'));
assert.ok(source.includes("title: '世界书'"));
assert.ok(source.includes("id: 'worldInfo', title: '全局世界书'"));
assert.ok(source.includes('function quickManagerCatalog'));
assert.ok(source.includes('native.world_names'));
assert.ok(source.includes('native.selected_world_info'));
assert.ok(source.includes("JSON.stringify(['world_info', name])"));
assert.ok(source.includes('native.deleteWorldInfo(entry.value)'));
assert.ok(source.includes('removeWorldInfoExtraLinks(native.world_info, entry.value)'));
assert.ok(source.includes('context.unshallowCharacter(pending[index].index)'));
assert.ok(source.includes('疑似孤儿'));

console.log('TLE organizer/worldbook development checks passed');
