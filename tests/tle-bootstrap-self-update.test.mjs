import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const bootstrap = read('loader/bootstrap/TLE-Permanent-Bootstrap-1.0.0.js');
const bootstrapPackage = JSON.parse(read('loader/bootstrap/TLE-Permanent-Bootstrap-1.0.0.json'));
const loader = read('loader/runtime/v0.3.3/TLE-Remote-Loader.js');
const latest = JSON.parse(read('loader/latest.json'));
const core = read('releases/v0.3.205/TLE.js');
new vm.Script(bootstrap);
new vm.Script(loader);
new vm.Script(core);
assert.equal(bootstrapPackage.content, bootstrap);
for (const section of ['简介', '使用方式', '注意事项', '作者'])
  assert.ok(bootstrapPackage.info.includes(section), 'bootstrap info lacks ' + section);
assert.doesNotMatch(bootstrapPackage.info, /[\r\n]|\\n/);
assert.equal(latest.channel, 'stable-loader');
assert.equal(latest.latest_version, '0.3.3');
assert.equal(latest.release.source_path, 'loader/runtime/v0.3.3/TLE-Remote-Loader.js');
assert.equal(latest.release.size_bytes, Buffer.byteLength(loader));
assert.equal(latest.release.sha256, createHash('sha256').update(loader).digest('hex'));
assert.match(latest.release.source_commit, /^[a-f0-9]{40}$/);
assert.ok(latest.release.source_url.endsWith('/' + latest.release.source_path));
assert.match(bootstrap, /main\/loader\/latest\.json/);
assert.match(bootstrap, /TLE_Remote_Bootstrap_Cache/);
assert.match(bootstrap, /readCached\('previous'\)/);
assert.match(bootstrap, /writeSlot\('previous', fallback\)/);
assert.match(bootstrap, /SHA-256 校验失败/);
assert.match(bootstrap, /function isAutoUpdateEnabled\(\)/);
assert.match(bootstrap, /getItem\(AUTO_UPDATE_KEY\) !== 'false'/);
assert.match(bootstrap, /function validateManifest\(value\)/);
assert.match(bootstrap, /uri\.href !== expectedURL/);
assert.match(bootstrap, /if \(running && !running\.bootstrapManaged/);
assert.match(bootstrap, /function healthy\(record\)/);
assert.match(bootstrap, /await evaluate\(fallback\)/);
assert.match(loader, /bootstrapManaged: true/);
assert.match(loader, /Bootstrap 首次安装/);
assert.match(loader, /AUTO_UPDATE_KEY = 'tle\.loader\.stable\.autoUpdate\.v1'/);
assert.match(core, /data-tle-update-details/);
assert.match(core, /data-tle-loader-available-version/);
assert.match(core, /data-tle-action="check-loader-update"/);
assert.match(core, /data-tle-action="install-loader-update"/);
assert.match(core, /tle-loader-bootstrap-state-change/);
assert.match(core, /function syncDiagnosticButtonPosition\(\)/);

// Isolated host simulation: verify that a single installed Bootstrap can move
// between remote Loader versions, obey the toggle and recover from offline cache.
const LOADER_KEY = '__TLE_REMOTE_LOADER_STABLE_V1__';
const BOOT_KEY = '__TLE_REMOTE_BOOTSTRAP_V1__';
const AUTO_KEY = 'tle.loader.stable.autoUpdate.v1';
const dbData = new Map();
const localData = new Map();
let remotelyPublished = structuredClone(latest);
let offline = false;
const hostEvents = new Map();
const loadedVersions = [];
const host = {
  document: { documentElement: {}, body: {} },
  console: { info() {}, warn() {}, error() {} },
  localStorage: {
    getItem(key) { return localData.has(key) ? localData.get(key) : null; },
    setItem(key, val) { localData.set(key, String(val)); }
  },
  toastr: { error() {} },
  addEventListener(type, listener) {
    if (!hostEvents.has(type)) hostEvents.set(type, []);
    hostEvents.get(type).push(listener);
  },
  dispatchEvent(event) { for (const fn of hostEvents.get(event.type) || []) fn(event); },
  CustomEvent: class { constructor(type) { this.type = type; } },
  indexedDB: {
    open() {
      const req = { result: db, onupgradeneeded: null, onsuccess: null, onerror: null };
      setTimeout(() => req.onsuccess?.(), 0);
      return req;
    }
  },
};
const db = {
  objectStoreNames: { contains: () => true },
  createObjectStore() {},
  transaction() {
    const tx = { oncomplete: null, onerror: null, onabort: null };
    tx.objectStore = () => ({
      get(slot) {
        const req = { result: null, onsuccess: null, onerror: null };
        setTimeout(() => {
          req.result = dbData.has(slot) ? structuredClone(dbData.get(slot)) : null;
          req.onsuccess?.();
        }, 0);
        return req;
      },
      put(value) {
        dbData.set(value.slot, structuredClone(value));
        setTimeout(() => tx.oncomplete?.(), 0);
      }
    });
    return tx;
  }
};
const scriptDoc = {
  documentElement: {},
  createElement() {
    return { src: '', onload: null, onerror: null, async: false, remove() {} };
  },
  head: {
    appendChild(script) {
      setTimeout(() => {
        const match = script.src.match(/\/loader\/runtime\/v(\d+\.\d+\.\d+)\//);
        if (!match) { script.onerror?.(); return; }
        const version = match[1], previous = host[LOADER_KEY];
        previous?.destroy?.();
        const runtime = {
          version, channel: 'stable', bootstrapManaged: true,
          diagnostics: { destroyed: false },
          getInfo: () => ({ busy: false }),
          checkRemote() {}, loadRemote() {},
          destroy() {
            runtime.diagnostics.destroyed = true;
            if (host[LOADER_KEY] === runtime) delete host[LOADER_KEY];
          }
        };
        host[LOADER_KEY] = runtime;
        loadedVersions.push(version);
        script.onload?.();
      }, 0);
      return script;
    }
  }
};
const scriptWin = {
  parent: host, document: scriptDoc,
  AbortController, TextEncoder, Blob,
  URL: { createObjectURL: () => 'blob:mock', revokeObjectURL() {} },
  setTimeout, clearTimeout,
  btoa: text => Buffer.from(text, 'binary').toString('base64'),
  CustomEvent: host.CustomEvent,
  addEventListener() {},
  async fetch(url) {
    if (offline) throw Error('offline');
    if (String(url).includes('/loader/latest.json')) {
      return { ok: true, text: async () => JSON.stringify(remotelyPublished) };
    }
    if (String(url).includes('/loader/runtime/')) {
      return { ok: true, text: async () => loader };
    }
    throw Error('unexpected fetch URL: ' + url);
  }
};
scriptDoc.documentElement.appendChild = scriptDoc.head.appendChild;
const waitFor = async (test, message) => {
  for (let i = 0; i < 200; i++) {
    if (test()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw Error('timeout: ' + message);
};
const execute = () => vm.runInNewContext(bootstrap, {
  window: scriptWin, console, URL, Date, Uint8Array, Uint32Array,
  TextEncoder, unescape, encodeURIComponent
}, { timeout: 3000 });
const fakeManifest = version => {
  const item = structuredClone(latest);
  item.latest_version = version;
  item.release.version = version;
  item.release.source_path = 'loader/runtime/v' + version + '/TLE-Remote-Loader.js';
  item.release.source_commit = 'a'.repeat(40);
  item.release.source_url = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/'
    + item.release.source_commit + '/' + item.release.source_path;
  return item;
};
execute();
await waitFor(() => host[LOADER_KEY]?.version === '0.3.3', 'first Bootstrap installation');
assert.equal(loadedVersions.at(-1), '0.3.3');
assert.equal(host[BOOT_KEY].getInfo().bootstrapVersion, '1.0.0');
await waitFor(() => dbData.get('last')?.version === '0.3.3', 'first cache promotion');
remotelyPublished = fakeManifest('0.3.4');
host.dispatchEvent(new host.CustomEvent('tle-loader-auto-update-preference'));
await waitFor(() => host[LOADER_KEY]?.version === '0.3.4', 'unattended Loader upgrade');
await waitFor(() => dbData.get('last')?.version === '0.3.4', 'upgraded cache promotion');
assert.equal(dbData.get('previous')?.version, '0.3.3');
assert.ok(loadedVersions.includes('0.3.4'));

localData.set(AUTO_KEY, 'false');
remotelyPublished = fakeManifest('0.3.5');
await host[BOOT_KEY].checkRemote();
assert.equal(host[BOOT_KEY].getInfo().updateAvailable, true);
host.dispatchEvent(new host.CustomEvent('tle-loader-auto-update-preference'));
await new Promise(resolve => setTimeout(resolve, 30));
assert.equal(host[LOADER_KEY].version, '0.3.4', 'disabled auto-update must not install');
assert.equal(host[BOOT_KEY].getInfo().autoUpdateEnabled, false);

// Offline recovery from a saved Loader copy must still work after page reload.
host[BOOT_KEY].destroy();
host[LOADER_KEY].destroy();
offline = true;
execute();
await waitFor(() => host[LOADER_KEY]?.version === '0.3.4', 'offline cached recovery');
assert.equal(host[BOOT_KEY].getInfo().currentLoaderVersion, '0.3.4');
host[BOOT_KEY].destroy();
console.log('Permanent Bootstrap self-update, no-reimport, opt-out and offline restore tests passed.');
