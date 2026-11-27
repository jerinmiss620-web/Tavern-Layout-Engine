import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const readRaw = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const test = JSON.parse(readRaw('channels/test.json'));
const legacyFiles = test.release?.version === '0.3.204' ? {
  'releases/v0.3.204/TLE.js': 'tests/fixtures/legacy/core-v0.3.204.js',
  'loader/TLE-Remote-Loader-Test-0.3.0.js': 'tests/fixtures/legacy/test-loader-v0.3.0.js',
  'loader/TLE-Remote-Loader-Test-0.3.0.json': 'tests/fixtures/legacy/test-loader-v0.3.0.json',
} : {};
const read = path => readRaw(legacyFiles[path] || path);
const version = test.latest_version;
const tle = read(test.release.source_path);
const loader = read(test.loader_release.source_path);
const installer = JSON.parse(read(test.loader_release.installer_path));
new vm.Script(tle);
new vm.Script(loader);
assert.equal(test.channel, 'test');
assert.match(loader, /const CHANNEL = 'test'/);
assert.match(loader, /feature\/organizer-nav-worldbooks-20261125\/channels\/test\.json/);
assert.match(loader, /checkRemote: \(\) => checkRemote\(\{ promptUpdate: true \}\)/);
assert.match(loader, /TLE_Organizer_Branch_Test_Cache/);
assert.match(loader, /tle\.loader\.organizerBranchTest\.lastKnownGood\.v1/);
assert.equal(installer.content, loader);
assert.equal(installer.enabled, false);
assert.match(tle, /function getLegacyTestLoader\(\)/);
assert.match(tle, /loader\?\.channel === 'test'/);
assert.match(tle, /function compareReleaseVersions\(a,b\)/);
assert.match(tle, /const candidate = await legacy\.checkRemote\(\)/);
assert.match(tle, /await legacy\.loadRemote\(\)/);
assert.match(tle, /await stable\.loadRemote\(\)/);
assert.match(tle, /Test Loader v/);
assert.match(tle, /检查／安装更新/);
assert.match(tle, /const hasUpdate = Boolean\(latest &&/);
assert.match(tle, /function syncDiagnosticButtonPosition\(\)/);
assert.match(tle, /button\.style\.setProperty\('top'/);
assert.match(tle, /button\.style\.setProperty\('right'/);
assert.doesNotMatch(tle, /width: fit-content !important;/);
assert.match(tle, /organizerEntry\.className = 'drawer'/, 'Organizer must be a native-shaped tenth drawer');
assert.match(tle, /organizerToggle\.className = 'drawer-toggle interactable'/);
assert.match(tle, /organizerIcon\.className = 'drawer-icon fa-solid fa-layer-group interactable closedIcon'/, 'Organizer starts in the native closed-icon state so Tavern opacity rules apply');
assert.match(tle, /panel\.className = 'drawer-content closedDrawer'/, 'Organizer must own its drawer-content');
assert.match(tle, /state\.organizerEntry\?\.appendChild\(panel\)/, 'Organizer content must be nested inside its drawer');
assert.match(tle, /holder\.insertBefore\(state\.organizerEntry, organizerPosition\)/, 'Organizer must follow the nine native drawers');
assert.match(tle, /panel\.className = 'tle-global-search-overlay'/, 'Original global search must retain its independent modal');
const organizerStart = tle.indexOf('function createOrganizerPanel()');
const organizerEnd = tle.indexOf('function createRailControls()', organizerStart);
assert.ok(organizerStart >= 0 && organizerEnd > organizerStart, 'Organizer panel factory must be present');
const organizerSection = tle.slice(organizerStart, organizerEnd);
assert.doesNotMatch(organizerSection, /tle-global-search-overlay|tle-search-surface/, 'Organizer must use its direct drawer content without a nested search surface');
assert.match(tle, /#tle-organizer-panel\.drawer-content\.openDrawer/, 'Organizer must be styled as its native drawer content');
console.log('TLE Organizer branch Test Loader compatibility checks passed: v' + version);
