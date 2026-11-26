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

assert.match(mount, /tle-content-mode-options/);
assert.match(mount, /setAttribute\("role", "radiogroup"\)/);
assert.match(mount, /tle-content-mode-option/);
assert.match(mount, /tle-content-mode-radio/);
assert.match(mount, /radio\.type = "radio"/,
  'the control must retain native radio semantics and mutual exclusion');
assert.match(mount, /radio\.name = "tle-organizer-search-mode"/);
assert.match(mount, /tle-content-mode-label/);
assert.match(mount, /label\.append\(radio, caption\)/);
assert.match(mount, /radio\.addEventListener\("change"/);

const css = section(
  source,
  '      .tle-quick-manager .tle-content-mode-options {',
  '      /* Organizer workspace: desktop gets three independently scrollable columns.'
);
assert.match(css, /gap:\s*12px/);
assert.match(css, /border-radius:\s*3px/);
assert.match(css, /\.tle-content-mode-radio:checked \+ \.tle-content-mode-label::after/);
assert.match(css, /border-right:\s*2px solid var\(--SmartThemeQuoteColor/);
assert.match(css, /:focus-visible \+ \.tle-content-mode-label::before/);
assert.match(css, /clip-path:\s*inset\(50%\)/);

console.log('TLE organizer search mode checkbox-look radio checks passed: v' + manifest.release.version + '.');
