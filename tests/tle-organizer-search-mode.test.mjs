import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('channels/test.json'));
const source = read(manifest.release.source_path);
const installer = JSON.parse(read(`releases/v${manifest.release.version}/TLE-${manifest.release.version}-TEST-import.json`));

assert.equal(installer.content, source, 'the disabled test installer must match the pinned source');
new vm.Script(source, { filename: `TLE v${manifest.release.version}` });

function section(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'missing source section: ' + startMarker);
  return text.slice(start, end);
}

const mount = section(
  source,
  '      this.searchRow = n("div", "tle-content-search-row flex-container");',
  '      this.replace = n("input", "text_pole flex1");'
);

assert.match(mount, /this\.target = n\("label", "checkbox_label"\)/);
assert.match(mount, /this\.modeToggle = n\("input", "checkbox"\)/);
assert.match(mount, /this\.modeToggle\.type = "checkbox"/);
assert.match(mount, /this\.modeToggle\.checked = this\.active/);
assert.match(mount, /this\.modeToggle\.addEventListener\("change"/);
assert.match(mount, /this\.setMode\(this\.modeToggle\.checked \? "content" : "name"\)/);
assert.match(mount, /this\.target\.append\(this\.modeToggle, n\("span"/);
assert.doesNotMatch(mount, /role", "group"|aria-pressed|modeButtons|tle-content-mode-button|radio/i,
  'the switch must remain one native checkbox, not a radio group or custom button set');

const setMode = section(source, '    async setMode(mode) {', '    onInput() {');
assert.match(setMode, /this\.modeToggle\.checked = this\.active;/);
assert.doesNotMatch(setMode, /modeButtons|aria-pressed|radio/i,
  'mode state must be synchronized through the native checkbox');

assert.doesNotMatch(source, /tle-content-mode-switch|tle-content-mode-button|tle-content-mode-radio/,
  'no dedicated mode-switch CSS or custom mode-control classes should remain');
assert.doesNotMatch(source, /\.tle-quick-manager \.tle-content-mode-(?:switch|button|radio)/,
  'mode-control appearance must inherit native SillyTavern checkbox styling');

console.log('TLE organizer native checkbox mode checks passed: v' + manifest.release.version + '.');
