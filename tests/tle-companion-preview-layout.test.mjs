import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const plan = JSON.parse(read('release-plan.json'));
const source = read('releases/v' + plan.core + '/TLE.js');

test('Companion preview uses one shared labeled-field renderer in both plan views', () => {
  const start = source.indexOf('  function companionPlanPreview(plan) {');
  const end = source.indexOf('  function companionTextButton(', start);
  assert.ok(start >= 0 && end > start, 'structured preview renderer exists');
  const helper = source.slice(start, end);
  assert.match(helper, /tle-companion-preview-label/);
  assert.match(helper, /tle-companion-preview-value/);
  assert.match(helper, /field\.id === 'worldInfo'/);
  assert.match(helper, /空方案/);
  assert.equal((source.match(/\.append\(companionPlanPreview\(plan\)\)/g) || []).length, 2,
    'chat plan list and plan manager must share the same preview renderer');
});

test('Companion preview has no horizontal separators and uses compact spacing', () => {
  const start = source.indexOf('.tle-companion-plan {');
  const end = source.indexOf('.tle-companion-list {', start);
  assert.ok(start >= 0 && end > start, 'companion plan layout CSS exists');
  const css = source.slice(start, end);
  assert.match(css, /\.tle-companion-plan\s*\{[^}]*padding:\s*5px 0;/s);
  assert.doesNotMatch(css, /border-(?:top|bottom)\s*:/);
  assert.match(css, /\.tle-companion-preview\s*\{[^}]*gap:\s*2px 8px;/s);
  assert.match(css, /\.tle-companion-preview-item\s*\{[^}]*padding:\s*1px 0;/s);
  assert.match(css, /\.tle-companion-preview-item\.is-world-info\s*\{\s*grid-column:\s*1\s*\/\s*-1;/);
  assert.match(css, /\.tle-companion-preview-value\s*\{[^}]*overflow-wrap:\s*anywhere/s);
});

test('All five update actions use only the native Tavern menu_button class', () => {
  const start = source.indexOf('<div class="tle-version-meta">');
  const end = source.indexOf('</div>', start);
  assert.ok(start >= 0 && end > start, 'engine update action group exists');
  const group = source.slice(start, end);
  for (const action of ['install-update', 'check-update', 'adopt-loader',
    'check-loader-update', 'install-loader-update']) {
    const match = group.match(new RegExp('<button[^>]*class="([^"]*)"[^>]*data-tle-action="' + action + '"'));
    assert.ok(match, 'missing update action: ' + action);
    assert.deepEqual(match[1].split(/\s+/), ['menu_button'], action + ' must inherit the native button style only');
  }
  assert.doesNotMatch(source, /tle-update-pill|tle-update-check/);
  assert.doesNotMatch(source, /#\$\{ID\.panel\} \.tle-update-(?:pill|check)/);
});
