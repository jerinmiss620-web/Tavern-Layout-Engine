import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('channels/test.json'));
const source = read(manifest.release.source_path);
const installer = JSON.parse(read(`releases/v${manifest.release.version}/TLE-${manifest.release.version}-TEST-import.json`));

assert.equal(installer.content, source, 'the disabled test installer must match the pinned source');
new vm.Script(source, { filename: `TLE v${manifest.release.version}` });

assert.match(source, /const resourceTab = quickButton\('资源整理', \(\) => switchOrganizerView\('resources'\), 'menu_button tle-organizer-tab'\);/);
assert.match(source, /const findReplaceTab = quickButton\('查找替换', \(\) => switchOrganizerView\('findreplace'\), 'menu_button tle-organizer-tab'\);/);
assert.match(source, /viewTabs\.append\(resourceTab, findReplaceTab\);/);
assert.match(source, /resourcePage\.append\(workspace\);/);
assert.match(source, /findReplacePage\.append\(content\.searchRow, content\.controls, contentList, contentStatus\);/);
assert.match(source, /body\.append\(resourcePage, findReplacePage\);/);

const switchView = source.slice(
  source.indexOf('    function switchOrganizerView(view) {'),
  source.indexOf('    function ', source.indexOf('    function switchOrganizerView(view) {') + 20)
);
assert.match(switchView, /activeView = view === 'findreplace' \? 'findreplace' : 'resources';/);
assert.match(switchView, /resourcePage\.hidden = activeView !== 'resources';/);
assert.match(switchView, /findReplacePage\.hidden = activeView !== 'findreplace';/);
assert.match(switchView, /resourceTab\.setAttribute\('aria-pressed', String\(activeView === 'resources'\)\);/);
assert.match(switchView, /findReplaceTab\.setAttribute\('aria-pressed', String\(activeView === 'findreplace'\)\);/);
assert.match(switchView, /headingTools\.hidden = activeView !== 'resources';/);
assert.match(switchView, /if \(activeView === 'findreplace'\) \{\s*content\.renderList\(\);\s*void content\.run\(\(\) => content\.activate\(\)\);\s*\} else \{\s*render\(\);\s*\}/);
assert.match(source, /if \(activeView === 'findreplace'\) content\?\.renderList\(\);/);

assert.doesNotMatch(source, /this\.target = n\("label", "checkbox_label"\)|this\.modeToggle = n\("input", "checkbox"\)/,
  'the retired inline checkbox mode control must not return');
assert.doesNotMatch(source, /tle-content-mode-switch|tle-content-mode-button|tle-content-mode-radio/,
  'the separated tabs must not introduce a second custom mode-control system');

console.log('TLE Organizer separated resource/find-replace tabs passed: v' + manifest.release.version + '.');
