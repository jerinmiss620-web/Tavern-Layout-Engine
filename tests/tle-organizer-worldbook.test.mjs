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

const buildWorldInfoCatalog = vm.runInNewContext(
  '(' + extractFunction('buildWorldInfoCatalog', '\\n  function removeWorldInfoExtraLinks') + ')'
);
const removeWorldInfoExtraLinks = vm.runInNewContext(
  '(' + extractFunction('removeWorldInfoExtraLinks', '\\n  let worldInfoCatalogMeta') + ')'
);

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
assert.equal(byName.get('Global').statusLabel, '已关联');
assert.match(byName.get('Global').detail, /全局/);
assert.match(byName.get('Primary').detail, /主要绑定：Char A/);
assert.match(byName.get('Extra').detail, /额外绑定：Char B/);
assert.equal(byName.get('Orphan').statusLabel, '疑似孤儿');
assert.match(byName.get('Orphan').detail, /遗留角色绑定：deleted-card/);
assert.equal(byName.get('Mixed').statusLabel, '含遗留关联');
assert.match(byName.get('Mixed').detail, /Char B/);
assert.match(byName.get('Mixed').detail, /deleted-card/);
assert.equal(byName.get('Unbound').statusLabel, '未发现角色绑定');
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

const migrationSource = extractFunction('migrateQuickWorldInfoGroupAssignments', '\\n  function quickWorldInfoSelectItems');
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

assert.match(source, /organizerEntry: 'tle-organizer-entry'/);
assert.match(source, /state\\.organizerEntry = organizerEntry/);
assert.match(source, /holder\\.append\\(station, state\\.organizerEntry, state\\.navEntry\\)/);
assert.match(source, /const available = globalSearchEnabled;/);
assert.doesNotMatch(source, /if \\(!globalSearchEnabled \\|\\| navigationMode === 'icons'/);
assert.match(source, /body\\[data-tle-nav="icons"\\] #\\$\\{ID\\.organizerEntry\\}/);
assert.doesNotMatch(source, /<button id="\\$\\{ID\\.searchToggle\\}" class="tle-workspace-icon-button"/);
assert.match(source, /title: '世界书'/);
assert.match(source, /function quickManagerCatalog/);
assert.match(source, /native\\.world_names/);
assert.match(source, /native\\.selected_world_info/);
assert.match(source, /JSON\\.stringify\\(\\['world_info', name\\]\\)/);
assert.match(source, /native\\.deleteWorldInfo\\(entry\\.value\\)/);
assert.match(source, /removeWorldInfoExtraLinks\\(native\\.world_info, entry\\.value\\)/);
assert.match(source, /context\\.unshallowCharacter\\(pending\\[index\\]\\.index\\)/);
assert.match(source, /疑似孤儿/);
console.log('TLE organizer/worldbook development checks passed');
