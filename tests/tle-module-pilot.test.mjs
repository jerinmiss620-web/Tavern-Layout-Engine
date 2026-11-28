import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const originalEngine = read('development/avatar-engine/avatar-engine.js');
const moduleSource = read('modules/src/hd-avatar-engine.js');
const core = read('development/organizer/TLE.js');
const stable = JSON.parse(read('modules/stable.json'));
const test = JSON.parse(read('modules/test.json'));

assert.ok(moduleSource.endsWith(originalEngine), 'The independent pilot must preserve the audited avatar engine source byte-for-byte');
assert.match(moduleSource, /export default function createHDAvatarModule\(context\)/);
assert.match(moduleSource, /context\.host\.scriptWindow/);
assert.match(moduleSource, /context\.host\.window/);
assert.match(moduleSource, /context\.host\.document/);
assert.match(moduleSource, /createTLEHDAvatarEngine\(SCRIPT_WIN, WIN, DOC\)/);
assert.match(core, /id: 'avatar\.hd'/);
assert.match(core, /name: 'HD Avatar Engine'/);
assert.match(core, /permissions: \['host:script-window', 'host:window', 'host:document'\]/);
assert.match(core, /moduleLoader\.start\(\)/);
assert.deepEqual(stable.modules, [], 'Stable manifest must remain empty until the pilot passes real-host validation');
assert.equal(test.channel, 'test');
assert.equal(test.modules.length, 1);
assert.equal(test.modules[0].id, 'avatar.hd');
const pilot = test.modules[0];
assert.match(pilot.source_commit, /^[a-f0-9]{40}$/);
assert.equal(pilot.source_path, 'modules/src/hd-avatar-engine.js');
assert.equal(pilot.source_url,
  'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/' +
  pilot.source_commit + '/' + pilot.source_path);
assert.equal(pilot.sha256, createHash('sha256').update(moduleSource, 'utf8').digest('hex'));
assert.equal(pilot.size_bytes, Buffer.byteLength(moduleSource, 'utf8'));

const namespace = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(moduleSource));
assert.equal(typeof namespace.default, 'function');
const thumbnail = '/thumbnail?type=avatar&file=module-pilot.png';
const dom = new JSDOM(
  '<div class="freesia-gallery-avatar"><img id="pilot" src="' + thumbnail + '"></div>',
  { url: 'https://tavern.test/', pretendToBeVisual: true }
);
const context = {
  host: {
    scriptWindow: dom.window,
    window: dom.window,
    document: dom.window.document,
  },
};
const instance = namespace.default(context);
const image = dom.window.document.getElementById('pilot');
assert.equal(instance.api.active, true);
assert.equal(instance.api.host, 'st');
assert.equal(new URL(image.getAttribute('src'), dom.window.location.href).pathname, '/characters/module-pilot.png');
instance.destroy();
assert.equal(image.getAttribute('src'), thumbnail, 'Module cleanup must restore the original thumbnail');
dom.window.close();

const ttDom = new JSDOM(
  '<div class="mesAvatarWrapper"><img id="tt" src="' + thumbnail + '"></div>',
  { url: 'https://tavern.test/', pretendToBeVisual: true }
);
ttDom.window.__TAURITAVERN__ = {};
const ttInstance = namespace.default({
  host: {
    scriptWindow: ttDom.window,
    window: ttDom.window,
    document: ttDom.window.document,
  },
});
assert.equal(ttInstance.api.active, false);
assert.equal(ttInstance.api.host, 'tt');
assert.equal(ttDom.window.document.getElementById('tt').getAttribute('src'), thumbnail);
ttInstance.destroy();
ttDom.window.close();

console.log('HD Avatar Engine pilot packaging, independent module factory, cleanup and TT-native bypass passed.');
