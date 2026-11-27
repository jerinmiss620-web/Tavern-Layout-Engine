import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../development/organizer/TLE.js', import.meta.url), 'utf8');

test('Companion plan preview is structured into labeled fields, not a prose summary', () => {
    const start = source.indexOf('  function companionPlanPreview(plan, role) {');
    const end = source.indexOf('  function companionTextButton(', start);
    assert.ok(start >= 0 && end > start, 'structured preview renderer exists');
    const helper = source.slice(start, end);
    assert.match(helper, /tle-companion-preview/);
    assert.match(helper, /tle-companion-preview-label/);
    assert.match(helper, /tle-companion-preview-value/);
    assert.match(helper, /field\.id === 'worldInfo'/);
    assert.match(helper, /空方案/);
    assert.doesNotMatch(source, /companionPlanDetails\(/);
    assert.equal((source.match(/\.append\(companionPlanPreview\(plan\)\)/g) || []).length, 2,
        'chat plan list and plan manager must share the same preview renderer');
});

test('Companion preview uses a compact responsive grid and gives World Info a full row', () => {
    assert.match(source, /\.tle-companion-preview\s*\{[^}]*display:\s*grid/s);
    assert.match(source, /\.tle-companion-preview\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit/s);
    assert.match(source, /\.tle-companion-preview-item\.is-world-info\s*\{\s*grid-column:\s*1\s*\/\s*-1;/);
    assert.match(source, /\.tle-companion-preview-value\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});

test('All engine update actions inherit the native Tavern menu_button class', () => {
    const start = source.indexOf('<div class="tle-version-meta">');
    const end = source.indexOf('</div>', start);
    assert.ok(start >= 0 && end > start, 'engine update button group exists');
    const group = source.slice(start, end);
    const actions = ['install-update', 'check-update', 'adopt-loader',
        'check-loader-update', 'install-loader-update'];
    for (const action of actions) {
        const match = group.match(new RegExp('<button[^>]*class="([^"]*)"[^>]*data-tle-action="' + action + '"'));
        assert.ok(match, 'missing update action: ' + action);
        assert.ok(match[1].split(/\s+/).includes('menu_button'),
            action + ' must use the native Tavern button class');
    }
});

test('Update button selectors no longer override native button appearance', () => {
    assert.doesNotMatch(source, /#\$\{ID\.panel\} \.tle-update-(?:pill|check)(?::disabled)?\s*\{/);
    assert.match(source, /#\$\{ID\.panel\} \.tle-version-meta > button \{ white-space: nowrap; \}/);
});
