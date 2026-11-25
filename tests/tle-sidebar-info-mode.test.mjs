import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync('development/organizer/TLE.js', 'utf8');
new vm.Script(source, { filename: 'development/organizer/TLE.js' });

// The three navigation modes are the sole information-station switch.
assert.match(source, /<option value="icons">极简：仅图标<\/option>/);
assert.match(source, /<option value="labels">标准：图标 \+ 文字<\/option>/);
assert.match(source, /<option value="info">完整：图标 \+ 文字 \+ 信息站<\/option>/);
assert.match(source, /const enabled = navigationMode === 'info'/);
assert.match(source, /enabled: navigationMode === 'info'/);
assert.doesNotMatch(source, /INFO_ENABLED_KEY|data-tle-setting="info-enabled"|infoEnabled|saveInfoEnabled/);

// New installations start with every applicable station option enabled.
assert.match(source, /\{ visible: true, jump: item\.jump, quick: item\.id !== 'characterWorldBook' \}/);

// Existing saved visibility, jump and quick choices remain authoritative.
assert.match(source, /visible: saved\[item\.id\]\.visible !== false/);
assert.match(source, /jump: item\.jump \? saved\[item\.id\]\.jump !== false : false/);
assert.match(source, /quick: item\.id !== 'characterWorldBook' && saved\[item\.id\]\.quick === true/);

// Switching modes must not overwrite or reset the individual option record.
assert.match(source, /function setNavigationMode\(mode\)/);
assert.match(source, /updateInfoStation\(\);/);
assert.match(source, /function saveInfoSettings\(\)/);

console.log('TLE sidebar information-station mode and default-selection tests passed.');
