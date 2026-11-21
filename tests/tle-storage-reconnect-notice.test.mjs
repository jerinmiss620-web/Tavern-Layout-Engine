import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const bootstrap = read('loader/bootstrap/TLE-Permanent-Bootstrap-1.0.6.js');
const loader = read('loader/runtime/v0.3.6/TLE-Remote-Loader.js');
const WEBKIT_LOST = 'Connection to Indexed Database server lost. Refresh the page to try again';
const span = (source, a, b) => {
  const start = source.indexOf(a);
  const end = source.indexOf(b, start);
  assert.ok(start >= 0 && end > start, 'production recovery section exists');
  return source.slice(start, end);
};
const bootstrapDb = span(bootstrap, '  function isLostDbConnection(error) {', '  function shaToSri(hex) {');
const loaderDb = span(loader, '  function isLostDbConnection(error) {', '  function writeCachePointer(');

function makeDb({ fail = 1, message = WEBKIT_LOST } = {}) {
  const factory = new IDBFactory();
  let opens = 0, remaining = fail;
  return {
    get opens() { return opens; },
    factory: {
      open(...args) {
        opens++;
        const request = factory.open(...args);
        request.addEventListener('success', () => {
          const db = request.result;
          const original = db.transaction.bind(db);
          db.transaction = (...params) => {
            if (remaining-- > 0) throw new Error(message);
            return original(...params);
          };
        });
        return request;
      }
    }
  };
}
const bootstrapRecord = {
  version: '0.3.6', source: 'const x = 1;',
  source_url: 'https://raw.githubusercontent.com/example/repo/file',
  source_commit: 'a'.repeat(40), size_bytes: 12, sha256: 'b'.repeat(64),
};
{
  const store = makeDb();
  const statuses = [];
  const api = vm.runInNewContext(bootstrapDb + '\n({ writeSlot, readSlot })', {
    DB_NAME: 'TLE_Recovery_Bootstrap_Test', STORE: 'records', dbPromise: null,
    HOST_WIN: { indexedDB: store.factory },
    setStatus: (...args) => statuses.push(args),
    verify: async record => assert.equal(record?.version, bootstrapRecord.version),
  });
  await api.writeSlot('last', bootstrapRecord);
  const cached = await api.readSlot('last');
  assert.equal(cached.sha256, bootstrapRecord.sha256);
  assert.equal(store.opens, 2, 'Bootstrap reconnects exactly once after WebKit lost-connection error');
  assert.equal(statuses.length, 1, 'single reconnect warning');
}
{
  const store = makeDb({ fail: 3 });
  const api = vm.runInNewContext(bootstrapDb + '\n({ readSlot })', {
    DB_NAME: 'TLE_Recovery_Bootstrap_Fail', STORE: 'records', dbPromise: null,
    HOST_WIN: { indexedDB: store.factory }, setStatus() {}, verify: async () => {},
  });
  await assert.rejects(api.readSlot('last'), /请彻底退出并重新打开 TT/);
  assert.equal(store.opens, 2, 'reconnection is bounded and never loops forever');
}
{
  const store = makeDb();
  const statuses = [];
  const api = vm.runInNewContext(loaderDb + '\n({ idbPut, idbGet })', {
    HOST_WIN: { indexedDB: store.factory }, CACHE_DB_NAME: 'TLE_Recovery_Loader_Test',
    CACHE_DB_VERSION: 1, CACHE_STORE_NAME: 'records', cacheDbPromise: null,
    serializeRecord: record => ({ schema_version: 1, ...record }),
    setStatus: (...args) => statuses.push(args),
  });
  await api.idbPut('lkg', bootstrapRecord);
  const cached = await api.idbGet('lkg');
  assert.equal(cached.sha256, bootstrapRecord.sha256);
  assert.equal(store.opens, 2, 'Loader reconnects exactly once after WebKit lost-connection error');
  assert.equal(statuses.length, 1);
}
{
  const store = makeDb({ fail: 1, message: 'QuotaExceededError: storage capacity reached' });
  const api = vm.runInNewContext(loaderDb + '\n({ idbPut })', {
    HOST_WIN: { indexedDB: store.factory }, CACHE_DB_NAME: 'TLE_Recovery_Quota_Test',
    CACHE_DB_VERSION: 1, CACHE_STORE_NAME: 'records', cacheDbPromise: null,
    serializeRecord: record => ({ schema_version: 1, ...record }), setStatus() {},
  });
  await assert.rejects(api.idbPut('lkg', bootstrapRecord), /QuotaExceededError/);
  assert.equal(store.opens, 1, 'storage quota failure must not trigger reconnection');
}

// Full production Bootstrap: the loading notice must exist immediately, even
// when the engine succeeds before the formerly delayed 500ms timer would fire.
{
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="sheld"><div id="chat"></div></div><iframe></iframe></body></html>', {
    url: 'https://tavern.test/', runScripts: 'dangerously', pretendToBeVisual: true,
  });
  const host = dom.window;
  const frame = host.document.querySelector('iframe').contentWindow;
  Object.defineProperty(host, 'indexedDB', { value: new IDBFactory() });
  frame.fetch = async () => ({ ok: true, text: async () => '{invalid json' });
  host.console = frame.console = { info() {}, warn() {}, error() {} };
  frame.eval(bootstrap);
  const notice = host.document.getElementById('tle-bootstrap-retry-progress');
  assert.ok(notice, 'notice must be present synchronously with initial Bootstrap execution');
  assert.match(notice.textContent, /TLE 正在努力加载中，请稍候/);
  assert.match(notice.style.top, /64px/, 'notice must sit below iOS safe area');
  assert.equal(notice.style.pointerEvents, 'none', 'loading notice cannot block chat controls');
  host.__TAVERN_LAYOUT_ENGINE_V02__ = {
    version: '0.3.211', ready: true, state: { destroyed: false },
    hostWindow: host, hostDocument: host.document,
  };
  host.dispatchEvent(new host.Event('tle-loader-state-change'));
  assert.ok(host.document.getElementById('tle-bootstrap-retry-progress'),
    'successful fast Core startup must not remove the notice before minimum display time');
  await new Promise(resolve => setTimeout(resolve, 1330));
  assert.equal(host.document.getElementById('tle-bootstrap-retry-progress'), null,
    'notice must auto-dismiss without user action');
  host.__TLE_REMOTE_BOOTSTRAP_V1__?.destroy();
  dom.window.close();
}

console.log('Bootstrap/Loader IndexedDB reconnect, bounded failures, quota protection and immediate startup notice passed.');
