import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';

// Real, complete Bootstrap/Loader/Core sources execute in a Tavern Helper iframe.
// Only host facilities, network publication and elapsed scheduler time are simulated.
const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const canonicalUrl = url => String(url).replace(
  /^https:\/\/(?:cdn|fastly)\.jsdelivr\.net\/gh\/jerinmiss620-web\/Tavern-Layout-Engine@([^/]+)\//,
  'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/$1/');

const plan = JSON.parse(read('release-plan.json'));
let bootstrap = read(`loader/bootstrap/TLE-Permanent-Bootstrap-${plan.bootstrap}.js`);
let loaderSource = read(`loader/runtime/v${plan.loader}/TLE-Remote-Loader.js`);
let coreSource = read(`releases/v${plan.core}/TLE.js`);
const increment = (version, offset) => { const parts = version.split('.').map(Number); parts[2] += offset; return parts.join('.'); };
const CV = Array.from({length: 6}, (_,i) => increment(plan.core, i));
const LV = Array.from({length: 5}, (_,i) => increment(plan.loader, i));
if (process.argv.includes('--remote')) {
  const base = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/main/';
  const download = async url => { const r = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(30000) }); assert.ok(r.ok); return r.text(); };
  const bootPackage = JSON.parse(await download(base + `loader/bootstrap/TLE-Permanent-Bootstrap-${plan.bootstrap}.json?_tle=${Date.now()}`));
  assert.equal(bootPackage.content, bootstrap); bootstrap = bootPackage.content;
  for (const kind of ['loader','core']) {
    const manifest = JSON.parse(await download(base + (kind === 'loader' ? 'loader/latest.json' : 'latest.json') + '?_tle=' + Date.now()));
    assert.equal(manifest.latest_version, plan[kind]);
    const source = await download(manifest.release.source_url);
    assert.equal(Buffer.byteLength(source), manifest.release.size_bytes);
    assert.equal(createHash('sha256').update(source).digest('hex'), manifest.release.sha256);
    assert.equal(source, kind === 'loader' ? loaderSource : coreSource);
    if (kind === 'loader') loaderSource = source; else coreSource = source;
  }
  console.log('Fetched and verified the published GitHub Bootstrap, Loader and Core; replaying the full-source chain with those bytes.');
}
const B = '__TLE_REMOTE_BOOTSTRAP_V1__', L = '__TLE_REMOTE_LOADER_STABLE_V1__', C = '__TAVERN_LAYOUT_ENGINE_V02__';
const AUTO = 'tle.loader.stable.autoUpdate.v1';
const rootURL = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/';
const sources = new Map();
let loaderManifest, coreManifest, offline = false, corrupt = false;
let db = new IDBFactory(), storage = new Map([['tle.diagnosticMode', 'true']]), dom, host, frame, timers, errors, executed;
let failWrite = () => false;
const originalPut = IDBObjectStore.prototype.put;
IDBObjectStore.prototype.put = function(value, ...args) {
  if (failWrite(this.transaction.db.name, value)) throw new DOMException('simulated storage failure', 'QuotaExceededError');
  return originalPut.call(this, value, ...args);
};
async function writeCache(name, slot, value) {
  const request = db.open(name, 1);
  request.onupgradeneeded = () => request.result.createObjectStore('records', { keyPath: 'slot' });
  const database = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const tx = database.transaction('records', 'readwrite');
  tx.objectStore('records').put({ slot, schema_version: 1, ...value });
  await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); });
  database.close();
}
async function readBootstrapCache() {
  const request = db.open('TLE_Remote_Bootstrap_Cache', 1);
  const database = await new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  const tx = database.transaction('records', 'readonly');
  const all = tx.objectStore('records').getAll();
  const records = await new Promise((resolve, reject) => { all.onsuccess = () => resolve(all.result); all.onerror = () => reject(all.error); });
  database.close();
  return records;
}
function publish(kind, version, suffix = '') {
  const source = (kind === 'loader' ? loaderSource.replaceAll(plan.loader, version) : coreSource.replaceAll(plan.core, version)) + suffix;
  const source_path = kind === 'loader' ? `loader/runtime/v${version}/TLE-Remote-Loader.js` : `releases/v${version}/TLE.js`;
  const source_commit = createHash('sha1').update(source).digest('hex');
  const source_url = rootURL + source_commit + '/' + source_path;
  sources.set(source_url, source);
  const manifest = { schema_version: 1, project: 'Tavern Layout Engine', channel: kind === 'loader' ? 'stable-loader' : 'stable',
    latest_version: version,
    ...(kind === 'loader' ? { minimum_bootstrap_version: '1.0.0' } : { minimum_loader_version: '0.3.4' }),
    release: { version, source_path, source_commit, source_url,
      sha256: createHash('sha256').update(source).digest('hex'), size_bytes: Buffer.byteLength(source) } };
  if (kind === 'loader') loaderManifest = manifest; else coreManifest = manifest;
  return manifest;
}
async function waitFor(predicate, label) {
  for (let i = 0; i < 500; i++) {
    if (predicate()) return;
    await new Promise(r => setTimeout(r, 10));
  }
  throw Error(`Timeout: ${label}\n${JSON.stringify(host[B]?.getInfo())}\n${JSON.stringify(host[L]?.getInfo())}\n${errors.join('\n')}`);
}
async function settled() {
  await waitFor(() => host[B] && !host[B].getInfo().busy && host[L] && !host[L].getInfo().busy, 'settled');
  await new Promise(r => setTimeout(r, 20));
}
function assertSingle() {
  assert.equal(host.document.querySelectorAll('#tle-core-style').length, 1);
  assert.equal(host.document.querySelectorAll('#tle-control-panel').length, 1);
  assert.equal(host[C].state.destroyed, false);
  assert.equal(host[L].diagnostics.destroyed, false);
  const panel = host.document.querySelector('#tle-control-panel');
  assert.equal(panel.querySelector('[data-tle-runtime-version]').textContent, 'v' + host[C].version);
  assert.ok(panel.querySelector('[data-tle-loader-available-version]').textContent.includes(host[L].version));
  const updateSection = panel.querySelector('section.tle-section[data-tle-update-details]');
  assert.ok(updateSection, 'update settings must use the same tle-section as other engine settings');
  const nativeDrawer = updateSection.querySelector(':scope > .inline-drawer');
  const nativeToggle = nativeDrawer?.querySelector(':scope > .inline-drawer-toggle.inline-drawer-header.interactable');
  const nativeContent = nativeDrawer?.querySelector(':scope > .inline-drawer-content');
  assert.ok(nativeToggle, 'update section must reuse the original Tavern drawer heading');
  assert.ok(nativeContent, 'update section must reuse the original Tavern drawer content');
  assert.equal(nativeContent.style.display, 'none', 'update controls are collapsed by default');
  assert.equal(nativeToggle.getAttribute('aria-expanded'), 'false');
  assert.ok(nativeToggle.querySelector('.inline-drawer-icon.fa-circle-chevron-down'), 'the same native arrow icon is used');
  assert.ok(nativeToggle.querySelector('[data-tle-update-summary]'), 'version is visible while collapsed');
  assert.ok(nativeToggle.querySelector('[data-tle-update-alert]'), 'green update state remains in the header');
  assert.ok(host.document.querySelector('#tle-diagnostic-float'), 'diagnostic button retained');
}
async function boot({ empty = false, transient = null } = {}) {
  errors = []; executed = []; timers = new Map();
  const vc = new VirtualConsole();
  vc.on('jsdomError', err => { if (err.type !== 'css-parsing') errors.push(err.message); });
  dom = new JSDOM('<!doctype html><html><head></head><body><div id="top-settings-holder"></div><div id="sheld"><div id="chat"></div><form id="send_form"><textarea id="send_textarea"></textarea></form></div><iframe></iframe></body></html>',
    { url: 'https://tavern.test/', runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
  host = dom.window; frame = host.document.querySelector('iframe').contentWindow;
  Object.defineProperty(host, 'indexedDB', { value: db });
  for (const [k,v] of storage) host.localStorage.setItem(k,v);
  host.matchMedia = query => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} });
  host.CSS = { escape: s => s, supports: () => false };
  host.document.elementsFromPoint = () => [];
  host.console = frame.console = { info() {}, warn() {}, error(...args) { errors.push(args.map(String).join(' ')); } };
  frame.confirm = () => { throw Error('Unexpected confirmation during automatic update'); };
  frame.TextEncoder = TextEncoder; frame.Blob = Blob;
  const blobs = new Map(); let blobID = 0;
  frame.URL.createObjectURL = blob => { const key = 'blob:tle-' + ++blobID; blobs.set(key, blob); return key; };
  frame.URL.revokeObjectURL = url => blobs.delete(url);
  const nativeTimeout = frame.setTimeout.bind(frame), nativeClear = frame.clearTimeout.bind(frame);
  let timerID = 100000;
  frame.setTimeout = (fn, ms, ...args) => {
    if (ms === 21600000 || ms === 60000) { const id = ++timerID; timers.set(id, { fn, ms }); return id; }
    return nativeTimeout(fn, [250, 500, 900, 1000].includes(ms) ? 0 : [8000, 20000].includes(ms) && transient?.type === 'timeout' ? 15 : ms, ...args);
  };
  frame.clearTimeout = id => { timers.delete(id); nativeClear(id); };
  let failedOnce = false;
  let targetedRequests = 0;
  frame.fetch = async (url, options) => {
    url = canonicalUrl(url);
    const target = transient?.resource === 'source' ? String(url).includes('/loader/runtime/') : String(url).includes('/main/loader/latest.json');
    if (transient && target) {
      targetedRequests++;
      if (!failedOnce) {
        failedOnce = true;
        assert.equal(host.document.getElementById('tle-bootstrap-failure-dialog'), null);
        if (transient.type === 'timeout') {
          return await new Promise((resolve, reject) => options.signal.addEventListener('abort',
            () => reject(new frame.DOMException('signal is aborted without reason', 'AbortError')), { once: true }));
        }
        if (transient.type === 'interrupted') throw new frame.DOMException('signal is aborted without reason', 'AbortError');
        throw new TypeError('Failed to fetch');
      }
    }
    if (offline) throw Error('simulated offline');
    const manifest = String(url).includes('/main/loader/latest.json') ? loaderManifest : String(url).includes('/main/latest.json') ? coreManifest : null;
    if (manifest) return { ok: true, text: async () => JSON.stringify(manifest) };
    if (!sources.has(String(url))) return { ok: false, status: 404 };
    return { ok: true, text: async () => sources.get(String(url)) + (corrupt ? '\n// corrupted' : '') };
  };
  const append = frame.document.head.appendChild.bind(frame.document.head);
  frame.document.head.appendChild = script => {
    if (script.tagName !== 'SCRIPT') return append(script);
    nativeTimeout(async () => {
      if (!script.onload) return; // abort removed this pending injection
      try {
        const isBlob = blobs.has(script.src);
        if (!isBlob && offline) throw Error('offline external script');
        const source = isBlob ? await blobs.get(script.src).text() : sources.get(canonicalUrl(script.src));
        assert.ok(source, 'published script exists');
        if (script.integrity) assert.equal(script.integrity, 'sha256-' + createHash('sha256').update(source).digest('base64'));
        try { frame.eval(source); } catch (err) { errors.push(err.message); }
        executed.push(script.src);
        script.onload?.();
      } catch { script.onerror?.(); }
    }, 0);
    return script;
  };
  frame.eval(bootstrap);
  if (empty) await waitFor(() => host[B] && !host[B].getInfo().busy, 'offline bootstrap');
  else await settled();
  if (transient) {
    assert.equal(targetedRequests, 2, 'first failure must recover on the second request');
    assert.equal(host[B].getInfo().remoteFailure, null);
    assert.equal(host.document.getElementById('tle-bootstrap-failure-dialog'), null);
    assert.equal(host.document.getElementById('tle-bootstrap-retry-progress'), null);
  }
}
function close() {
  storage = new Map(Object.keys(host.localStorage).map(k => [k, host.localStorage.getItem(k)]));
  host[B]?.destroy();
  assert.equal(host[B], undefined); assert.equal(host[L], undefined); assert.equal(host[C], undefined);
  assert.equal(timers.size, 0, 'all update timers removed');
  dom.window.close();
}
async function tick() {
  const pending = [...timers.values()]; timers.clear();
  for (const {fn} of pending) fn();
  await settled();
  // A simultaneous Core operation deliberately defers Loader replacement.
  for (const [id, {fn, ms}] of [...timers]) {
    if (ms === 60000) { timers.delete(id); fn(); }
  }
  await settled();
}
async function versions(core, loader) {
  await waitFor(() => host[C]?.version === core && host[L]?.version === loader, `running ${core}/${loader}`);
  await settled(); assertSingle();
}

try {
  publish('core', CV[0]); publish('loader', LV[0]);
  for (const transient of [
    { type: 'network', resource: 'manifest' }, { type: 'timeout', resource: 'manifest' },
    { type: 'interrupted', resource: 'manifest' }, { type: 'network', resource: 'source' },
    { type: 'timeout', resource: 'source' }
  ]) {
    db = new IDBFactory();
    await boot({ transient }); await versions(CV[0], LV[0]);
    assert.deepEqual(errors, [], 'automatic recovery executes real sources without exceptions');
    console.log('PASS first ' + transient.resource + ' ' + transient.type + ' failure automatically starts actual Loader/Core on second attempt');
    close();
  }
  db = new IDBFactory();
  await boot(); await versions(CV[0], LV[0]);
  assert.deepEqual(errors, [], 'real source startup must not throw');
  console.log('PASS Bootstrap-only first install executes actual Loader and Core, UI reflects live APIs');

  const liveLoader = host[L], liveCore = host[C];
  const durableBefore = await readBootstrapCache();
  const healthyFetch = frame.fetch;
  let unavailableCalls = 0;
  frame.fetch = async (url, options) => {
    if (canonicalUrl(url).includes('/main/loader/latest.json')) {
      unavailableCalls++;
      return { ok: false, status: 503 };
    }
    return await healthyFetch(url, options);
  };
  await Promise.all([host[B].checkRemote(), host[B].checkRemote(), host[B].checkRemote()]);
  assert.equal(unavailableCalls, 3, 'overlapping update checks share one bounded retry sequence');
  assert.equal(host[L], liveLoader); assert.equal(host[C], liveCore);
  assert.deepEqual(await readBootstrapCache(), durableBefore, 'server failure must not write or clear any cache slot');
  assert.equal(host.document.getElementById('tle-bootstrap-failure-dialog'), null);
  assert.equal(host.document.getElementById('tle-bootstrap-retry-progress'), null);
  assertSingle();
  frame.fetch = healthyFetch;
  console.log('PASS three HTTP 503 responses preserve actual healthy Loader/Core and all durable Bootstrap cache slots');

  publish('core', CV[1]); await tick(); await versions(CV[1], LV[0]);
  publish('loader', LV[1]); await tick(); await versions(CV[1], LV[1]);
  console.log('PASS periodic unattended Core and Loader upgrade, without reimport or API installation calls');

  host[L].setAutoUpdateEnabled(false);
  publish('core', CV[2]); publish('loader', LV[2]);
  await tick(); await versions(CV[1], LV[1]);
  assert.ok(host[B].getInfo().updateAvailable && host[L].getInfo().updateAvailable);
  assert.equal(host.document.querySelector('[data-tle-update-alert]').hidden, false);
  host[L].setAutoUpdateEnabled(true);
  await waitFor(() => host[C]?.version === CV[2], 'reenable immediately installs Core');
  await tick(); await versions(CV[2], LV[2]);
  console.log('PASS shared persisted opt-out, green notification, re-enable resumes both layers');

  close(); offline = true; await boot(); await versions(CV[2], LV[2]);
  console.log('PASS offline page reload keeps upgraded Loader and Core from verified IndexedDB');
  offline = false; errors = [];
  publish('core', CV[3]); corrupt = true; await tick();
  await versions(CV[2], LV[2]); corrupt = false;
  host.dispatchEvent(new host.Event('online'));
  await versions(CV[3], LV[2]);
  console.log('PASS corruption rejected, reconnection recovers automatically');

  publish('core', CV[4], `\nwindow.parent.${C}.destroy(); throw Error('intentional Core initialization failure');`);
  await tick(); await versions(CV[3], LV[2]);
  assert.match(host[L].getInfo().lastStatus.message, /恢复/);
  publish('core', CV[3]);
  publish('loader', LV[3], `\nwindow.parent.${L}.destroy(); throw Error('intentional Loader initialization failure');`);
  await tick(); await versions(CV[3], LV[2]);
  assert.match(host[B].getInfo().lastStatus.message, /恢复/);
  close(); offline = true; await boot(); await versions(CV[3], LV[2]);
  console.log('PASS failed Core and Loader execution roll back; reload keeps the last working releases');

  offline = false; publish('core', CV[0]); publish('loader', LV[0]);
  await tick(); await versions(CV[3], LV[2]);
  console.log('PASS stale remote manifests cannot downgrade live versions');
  publish('core', CV[5]);
  failWrite = (name, value) => name.includes('Loader_Test') && value.slot === 'lkg' && value.version === CV[5];
  await tick(); await versions(CV[3], LV[2]);
  assert.match(host[L].getInfo().lastStatus.message, /恢复/);
  failWrite = () => false;
  publish('core', CV[3]); publish('loader', LV[4]);
  failWrite = (name, value) => name.includes('Bootstrap') && value.slot === 'last' && value.version === LV[4];
  await tick(); await versions(CV[3], LV[2]);
  assert.match(host[B].getInfo().lastStatus.message, /恢复/);
  failWrite = () => false;
  close(); offline = true; await boot(); await versions(CV[3], LV[2]);
  console.log('PASS failed durable promotion in either layer rolls back, with no false success or refresh downgrade');
  close();

  // Existing pre-Bootstrap installations retain their old DB, settings and source.
  db = new IDBFactory(); storage = new Map([['tle.diagnosticMode', 'true'], ['tle.loader.test.autoRestore.v1', 'true'], ['user.unrelated', 'keep']]);
  const oldCore = read('tests/fixtures/legacy/core-v0.3.203.js');
  const oldRecord = { version: '0.3.203', source: oldCore, size_bytes: Buffer.byteLength(oldCore),
    sha256: createHash('sha256').update(oldCore).digest('hex'), source_commit: '65ed78df9d23c12d1d49300f92e2f43c2ee49cdd',
    source_url: rootURL + '65ed78df9d23c12d1d49300f92e2f43c2ee49cdd/releases/v0.3.203/TLE.js' };
  await writeCache('TLE_Remote_Loader_Test_Cache', 'lkg', oldRecord);
  offline = false; publish('core', CV[0]); publish('loader', LV[0]);
  await boot(); await versions(CV[0], LV[0]);
  assert.equal(host.localStorage.getItem('user.unrelated'), 'keep');
  assert.equal(host.localStorage.getItem('tle.diagnosticMode'), 'true');
  // Re-evaluating the single installed bootstrap cleans the prior owner first.
  const priorCore = host[C], priorLoader = host[L];
  frame.eval(bootstrap); await settled(); await versions(CV[0], LV[0]);
  assert.equal(priorCore.state.destroyed, true); assert.equal(priorLoader.diagnostics.destroyed, true);
  console.log('PASS legacy 0.3.203 cache migration, preserved settings and singleton reinitialization');
  close();

  db = new IDBFactory(); storage = new Map([['tle.diagnosticMode', 'true'], [AUTO, 'false']]);
  await boot(); await versions(CV[0], LV[0]);
  assert.equal(host[L].getInfo().autoUpdateEnabled, false);
  close(); await boot(); await versions(CV[0], LV[0]);
  assert.equal(host[L].getInfo().autoUpdateEnabled, false);
  console.log('PASS first installation remains possible with updates disabled, and opt-out survives reload');
  close();

  db = new IDBFactory(); storage = new Map([['tle.diagnosticMode', 'true']]); offline = true;
  await boot({ empty: true });
  assert.equal(host[L], undefined); assert.equal(host[C], undefined);
  offline = false; host.dispatchEvent(new host.Event('online'));
  await versions(CV[0], LV[0]);
  console.log('PASS offline first start recovers automatically on reconnection');

  // PC regression: durable Bootstrap cache still contains Loader v0.3.3 and
  // Core v0.3.203. The old Loader starts checking Core v0.3.206, which rejects
  // it because minimum_loader_version is 0.3.4. Bootstrap must retry Loader
  // replacement within one minute, NOT quietly wait six hours.
  close();
  db = new IDBFactory();
  storage = new Map([['tle.diagnosticMode', 'true'],
    ['tle.loader.test.autoRestore.v1', 'true']]);
  const oldLoaderSource = read('tests/fixtures/legacy/runtime-v0.3.3.js');
  const oldLoaderCommit = 'c88ba23fb540152de041110f506421bd6a835088';
  const oldLoaderRecord = {
    version: '0.3.3', source: oldLoaderSource,
    size_bytes: Buffer.byteLength(oldLoaderSource),
    sha256: createHash('sha256').update(oldLoaderSource).digest('hex'),
    source_commit: oldLoaderCommit,
    source_url: rootURL + oldLoaderCommit + '/loader/runtime/v0.3.3/TLE-Remote-Loader.js'
  };
  await writeCache('TLE_Remote_Bootstrap_Cache', 'last', oldLoaderRecord);
  await writeCache('TLE_Remote_Loader_Test_Cache', 'lkg', oldRecord);
  offline = false;
  publish('core', CV[0]); publish('loader', LV[0]);
  await boot();
  if (host[L]?.version === '0.3.3') {
    // boot() may observe the idle gap between cached Loader recovery and
    // remote manifest verification. Wait for either a prompt upgrade or
    // a scheduled short retry before asserting the update policy.
    await waitFor(() => host[L]?.version === LV[0] ||
      [...timers.values()].some(t => t.ms === 60000),
      'cached Loader must upgrade or schedule a 1-minute retry');
    if (host[L]?.version === '0.3.3') {
      assert.ok([...timers.values()].some(t => t.ms === 60000),
        'pending Loader v0.3.4 must use a 1-minute retry, not six hours');
      await tick();
    }
  }
  await versions(CV[0], LV[0]);
  console.log('PASS PC legacy Loader v0.3.3 + Core v0.3.203 cache upgrades to current versions without waiting six hours');

  // Closing while an async request is pending must never resurrect the owner.
  let finishFetch;
  const realFetch = frame.fetch;
  frame.fetch = url => new Promise(resolve => { finishFetch = async () => resolve(await realFetch(url)); });
  const pending = host[L].checkRemote();
  await waitFor(() => finishFetch, 'pending request');
  const retiredCore = host[C], retiredLoader = host[L];
  host[B].destroy();
  await finishFetch(); await pending;
  assert.equal(retiredCore.state.destroyed, true, JSON.stringify({
    coreManaged: retiredCore.remoteLoaderManaged, loaderManaged: retiredLoader.bootstrapManaged,
    coreVersion: retiredCore.version, loaderVersion: retiredLoader.version,
    currentCore: host[C]?.version, currentLoader: host[L]?.version
  })); assert.equal(retiredLoader.diagnostics.destroyed, true);
  assert.equal(host[B], undefined); assert.equal(host[L], undefined); assert.equal(host[C], undefined);
  assert.equal(timers.size, 0);
  console.log('PASS destruction during pending work cannot resurrect Loader or Core');
  close();
} finally { IDBObjectStore.prototype.put = originalPut; dom?.window.close(); }

