import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('channels/test.json'));
const version = manifest.release.version;
const corePath = manifest.release.source_path;
const core = read(corePath);
const moduleSource = read('development/gallery-home/gallery-home.js');

assert.equal(version, '0.3.264');
assert.ok(core.includes(moduleSource), 'Core must embed the maintained gallery module byte-for-byte');
assert.match(moduleSource, /function createTLEGalleryHome\(window, document\)/);
assert.match(moduleSource, /const VERSION = '0.3.264'/);
assert.match(moduleSource, /window\[GLOBAL_NAME\] = api;\s*return api;/);
assert.doesNotMatch(moduleSource, /DOMContentLoaded|else start\(\)/, 'TLE owns gallery startup');
assert.match(core, /galleryHome = createTLEGalleryHome\(HOST_WIN, HOST_DOC\);\s*galleryHome\.start\(\);/);
assert.match(core, /try \{ galleryHome\?\.stop\(\); \}/, 'TLE destroy must stop the gallery');
assert.match(core, /version: '0\.3\.264'/);

const cssStart = moduleSource.indexOf('    const CSS = [');
const cssEnd = moduleSource.indexOf("    ].join('\\n');", cssStart);
assert.ok(cssStart >= 0 && cssEnd > cssStart);
const selectors = [];
for (const line of moduleSource.slice(cssStart, cssEnd).split('\n')) {
  const match = line.match(/^\s*"(.*)"[,]?$/);
  if (match && match[1].includes('{')) selectors.push(match[1].slice(0, match[1].indexOf('{')).trim());
}
assert.equal(new Set(selectors).size, selectors.length, 'No duplicate CSS selector override layers');
assert.match(moduleSource, /--freesia-gallery-detail-main-gap: 0px/);
assert.match(moduleSource, /--freesia-gallery-detail-columns: 104px minmax\(0, 1fr\)/);
assert.match(moduleSource, /align-self: stretch/);
assert.match(moduleSource, /freesia-gallery-description \{[^}]*flex: 1 1 0/);
assert.match(moduleSource, /Math\.min\(2, state\.layoutSettings\.columns\)/);
new vm.Script(moduleSource, { filename: 'development/gallery-home/gallery-home.js' });
new vm.Script(core, { filename: corePath });
console.log('TLE gallery integration, lifecycle, responsive layout and CSS consolidation checks passed.');
