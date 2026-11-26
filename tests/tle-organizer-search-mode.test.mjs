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

assert.match(mount, /tle-content-mode-switch/);
assert.match(mount, /setAttribute\("role", "group"\)/);
assert.match(mount, /this\.button\(text, \(\) => this\.setMode\(value\)\)/);
assert.match(mount, /tle-content-mode-button/);
assert.match(mount, /button\.type = "button"/);
assert.match(mount, /button\.setAttribute\("aria-pressed", String\(value === this\.mode\)\)/);
assert.match(mount, /this\.modeButtons\.set\(value, button\)/);
assert.doesNotMatch(mount, /radio|checkbox|<input|\.hidden/i,
  'mode controls must be visible buttons, not radio/checkbox inputs');

const setMode = section(source, '    async setMode(mode) {', '    onInput() {');
assert.match(setMode, /for \(const \[value, button\] of this\.modeButtons\)/);
assert.match(setMode, /button\.setAttribute\("aria-pressed", String\(value === this\.mode\)\)/);
assert.doesNotMatch(setMode, /this\.target\.hidden|this\.target\.style\.display/,
  'both mode buttons must remain visible after switching');

const css = section(
  source,
  '      .tle-quick-manager .tle-content-mode-switch {',
  '      /* Organizer workspace: desktop gets three independently scrollable columns.'
);
assert.match(css, /flex-wrap:\s*nowrap/);
assert.match(css, /min-height:\s*28px/);
assert.match(css, /border-radius:\s*6px/);
assert.match(css, /background:\s*color-mix\(/);
assert.match(css, /\[aria-pressed="true"\]/);
assert.match(css, /:focus-visible/);
assert.match(css, /--SmartThemeQuoteColor/);
assert.match(css, /--SmartThemeBorderColor/);
assert.doesNotMatch(css, /tle-content-mode-radio|tle-content-mode-label|clip-path/);

console.log('TLE organizer search mode button-switch checks passed: v' + manifest.release.version + '.');
