import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const manifest = JSON.parse(read('latest.json'));
const source = read(manifest.release.source_path);
const installer = JSON.parse(read(`releases/v${manifest.release.version}/TLE-${manifest.release.version}-import.json`));

assert.equal(installer.content, source, 'the stable backup installer must match the current stable source');
assert.ok(source.includes("const NAV_MODE_STORAGE_KEY = 'tle.navigationMode';"));
assert.doesNotMatch(source, /INFO_ENABLED_KEY|getInfoEnabled|infoEnabled|saveInfoEnabled|info-enabled/,
  'the standalone information-station master switch must be removed');
assert.match(source, /option value="icons">极简：仅图标/);
assert.match(source, /option value="labels">标准：图标 \+ 文字/);
assert.match(source, /option value="info">完整：图标 \+ 文字 \+ 信息站/);
assert.match(source, /item\.id, \{ visible: true, jump: item\.jump, quick: item\.id !== 'characterWorldBook' \}/,
  'new users should get all supported information-station options enabled');
assert.match(source, /visible: saved\[item\.id\]\.visible !== false/);
assert.match(source, /jump: item\.jump \? saved\[item\.id\]\.jump !== false : false/);
assert.match(source, /quick: item\.id !== 'characterWorldBook' && saved\[item\.id\]\.quick === true/,
  'saved per-item choices must be preserved');
assert.match(source, /const enabled = navigationMode === 'info'\s*&& INFO_STATION_MODULES\.some/,
  'navigation mode must be the only information-station master switch');
assert.match(source, /enabled: navigationMode === 'info'/,
  'diagnostics must report the derived navigation state');
assert.match(source, /if \(infoRefreshQueued \|\| state\.destroyed \|\| navigationMode !== 'info'\) return;/);
assert.ok(source.includes('当前角色世界书仅支持跳转。'));
assert.ok(source.includes('下方项目可按需取消。') || source.includes('不需要的项目可在下方取消。'));

console.log('TLE information-station navigation-mode checks passed.');
