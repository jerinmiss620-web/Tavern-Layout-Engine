import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('development/organizer/TLE.js', 'utf8');

test('Organizer find/replace does not create a nested scrolling controls viewport', () => {
    const start = source.indexOf('#tle-organizer-panel .tle-organizer-findreplace-page {');
    const end = source.indexOf('.tle-worldbook-filter-bar {', start);
    assert.ok(start >= 0 && end > start, 'find/replace layout rules exist');
    const css = source.slice(start, end);
    assert.match(css, /\.tle-content-controls\s*\{[^}]*overflow:\s*visible/s);
    assert.doesNotMatch(css, /max-height:\s*min\(42vh,\s*360px\)/);
    assert.match(css, /\.tle-content-result-list\s*\{[^}]*overflow:\s*auto/s);
    assert.match(css, /\.tle-content-action-row/);
    assert.match(css, /\.tle-content-scope-select/);
});

test('Organizer mobile heading reads title, page tabs, then tools', () => {
    const afterBase = source.indexOf('.tle-worldbook-filter-bar {');
    const start = source.indexOf('@media (max-width: 700px)', afterBase);
    const end = source.indexOf('.tle-search-highlight {', start);
    assert.ok(start >= 0 && end > start, 'mobile heading rules exist');
    const css = source.slice(start, end);
    assert.match(css, /\.tle-search-heading-copy\s*\{\s*order:\s*0;/);
    assert.match(css, /\.tle-organizer-tabs\s*\{\s*order:\s*1;/);
    assert.match(css, /\.tle-search-heading-tools\s*\{\s*order:\s*2;/);
});

test('Companion plan default/apply actions are mounted in the title row', () => {
    const start = source.indexOf('  function companionRefreshList() {');
    const end = source.indexOf('  function companionEditorRow(', start);
    assert.ok(start >= 0 && end > start, 'companion plan renderer exists');
    const renderer = source.slice(start, end);
    assert.match(renderer, /const headingRow = quickNode\('div', 'tle-companion-heading-row'\)/);
    assert.match(renderer, /headingRow\.append\(titleRow, controls\)/);
    assert.match(renderer, /summary\.append\(headingRow\)/);
    assert.match(renderer, /row\.append\(summary\)/);
    assert.doesNotMatch(renderer, /row\.append\(summary,\s*controls\)/);
    assert.match(source, /\.tle-companion-heading-row > \.tle-companion-actions/);
});
