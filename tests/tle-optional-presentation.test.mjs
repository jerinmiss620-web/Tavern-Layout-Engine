import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const plan = JSON.parse(read('release-plan.json'));
const src = read('releases/v' + plan.core + '/TLE.js');
const manifest = JSON.parse(read('optional-modules/manifest.json'));
const start = src.indexOf('  const OPTIONAL_DISPLAY = Object.freeze({');
const end = src.indexOf('  function optionalOpenDetails(trigger)', start);
assert.ok(start >= 0 && end > start, 'Each optional package must use the shared presentation schema');

const { display, renderCard } = vm.runInNewContext(
  src.slice(start, end) + '\n({ display: OPTIONAL_DISPLAY, renderCard: optionalCardMarkup })',
  {}
);
const associations = { wallpaper: 'theme-wallpaper', override: 'freesia-override' };
assert.deepEqual(Object.keys(display).sort(), Object.keys(associations).sort());
const htmlActions = ['details', 'install', 'enable', 'disable', 'remove', 'refresh'];
for (const [kind, key] of Object.entries(associations)) {
  const item = display[kind];
  const pkg = manifest.packages.find(entry => entry.key === key);
  assert.ok(pkg, kind + ': missing package manifest');
  for (const field of ['name', 'summary', 'version', 'author', 'entry', 'intro']) {
    assert.ok(typeof item[field] === 'string' && item[field].trim(), kind + ': missing ' + field);
  }
  assert.equal(item.summary, pkg.description, kind + ': short summary must match manifest');
  assert.equal(item.author, pkg.author, kind + ': author must match manifest');
  assert.equal(item.entry, pkg.entry_location, kind + ': actual entry must match manifest');
  assert.equal(item.version, 'v' + pkg.version, kind + ': version must match manifest');
  assert.ok(Array.isArray(item.features) && item.features.length >= 3, kind + ': detailed features missing');
  for (const group of item.features) {
    assert.ok(group.title && Array.isArray(group.items) && group.items.length >= 1, kind + ': feature subsection incomplete');
  }
  assert.ok(Array.isArray(item.steps) && item.steps.length >= 4, kind + ': usage steps incomplete');
  assert.ok(Array.isArray(item.notes) && item.notes.length >= 2, kind + ': warnings incomplete');
  const html = renderCard(kind);
  assert.ok(html.includes('tle-optional-summary') && html.includes('tle-optional-meta') && html.includes('tle-optional-entry'), kind + ': inconsistent card layout');
  assert.ok(html.includes('作者：') && html.includes('版本：') && html.includes('入口：'), kind + ': missing visible metadata');
  assert.equal((html.match(/<small /g) || []).length, 3, kind + ': expected summary, version/author and entry');
  const actions = [...html.matchAll(/data-tle-optional-action="([^"]+)"/g)].map(match => match[1]);
  assert.equal(JSON.stringify(actions), JSON.stringify(htmlActions), kind + ': inconsistent card actions');
}
for (const key of Object.keys(associations)) {
  assert.ok(src.includes("${optionalCardMarkup('" + key + "')}"), key + ': card must use shared renderer');
}
assert.match(src, /function optionalDetailsRender\(kind, trigger\)/, 'Both packages must use shared details renderer');
assert.match(src, /optionalDetailsRender\('wallpaper', trigger\)/);
assert.match(src, /optionalDetailsRender\('override', trigger\)/);
const features = display.override.features.flatMap(group => group.items).join('；');
for (const term of ['气泡', '自定义', '行高', '字间距', '首行缩进', '滚动条', '头像', '字体比例', '3 条', '实时预览', '实时使用', 'CSS']) {
  const blob = display.override.summary + ' ' + features;
  assert.ok(blob.includes(term), '覆盖侠功能介绍遗漏：' + term);
}
console.log('TLE optional package presentation standard passed for ' + Object.keys(display).join(', '));
