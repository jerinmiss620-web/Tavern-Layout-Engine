import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const fileUrl = path => new URL(path, root);
const read = path => readFileSync(fileUrl(path), 'utf8');
const json = path => JSON.parse(read(path));

function checkInfo(info, label) {
  assert.equal(typeof info, 'string', label + ': missing info');
  assert.ok(info.length > 50 && info.length < 1600, label + ': info length');
  assert.doesNotMatch(info, /[\r\n]|\\n/, label + ': info must be one line');
  for (const section of ['简介', '使用方式', '注意事项', '作者']) {
    assert.ok(info.includes(section), label + ': missing ' + section);
  }
}

function checkRelease(channel, version, installerFile) {
  const dir = 'releases/v' + version + '/';
  const source = read(dir + 'TLE.js');
  const installer = json(dir + installerFile);
  assert.equal(installer.type, 'script', channel + ': wrong installer type');
  assert.equal(installer.enabled, false, channel + ': importer should be disabled by default');
  assert.ok(installer.id && installer.name, channel + ': missing installer metadata');
  assert.equal(installer.content, source, channel + ': source mismatch');
  assert.ok(source.includes("version: '" + version + "'"), channel + ': version mismatch');
  checkInfo(installer.info, channel + ' v' + version);
  assert.ok(existsSync(fileUrl(dir + 'CHANGELOG.md')), channel + ': no changelog');
  assert.match(read(dir + 'CHANGELOG.md'), new RegExp('v' + version.replaceAll('.', '\\.') + '\\b'), channel + ': wrong changelog version');
}

const stable = json('latest.json');
const test = json('channels/test.json');
assert.equal(stable.channel, 'stable');
assert.equal(test.channel, 'test');
checkRelease('stable', stable.latest_version, 'TLE-' + stable.latest_version + '-import.json');
checkRelease('test', test.latest_version, 'TLE-' + test.latest_version + '-TEST-import.json');

const loaderSource = read('loader/TLE-Remote-Loader-Stable-0.3.1.js');
const loader = json('loader/TLE-Remote-Loader-Stable-0.3.1.json');
assert.equal(loader.type, 'script');
assert.equal(loader.enabled, false);
assert.equal(loader.content, loaderSource);
checkInfo(loader.info, 'Stable Loader 0.3.1');
assert.ok(existsSync(fileUrl('loader/CHANGELOG-Stable-0.3.1.md')), 'Loader changelog missing');

console.log('TLE release metadata checks passed: stable v' + stable.latest_version +
  ', test v' + test.latest_version + ', Loader 0.3.1.');
