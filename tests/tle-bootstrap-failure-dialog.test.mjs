import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';

const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const bootstrap = read('loader/bootstrap/TLE-Permanent-Bootstrap-1.0.4.js');
const legacyBootstrap = read('tests/fixtures/legacy/bootstrap-v1.0.3.js');
assert.equal(JSON.parse(read('tests/fixtures/legacy/bootstrap-v1.0.3.json')).content, legacyBootstrap);
assert.equal(JSON.parse(read('loader/bootstrap/TLE-Permanent-Bootstrap-1.0.4.json')).content, bootstrap);
const B = '__TLE_REMOTE_BOOTSTRAP_V1__';
const L = '__TLE_REMOTE_LOADER_STABLE_V1__';
const C = '__TAVERN_LAYOUT_ENGINE_V02__';
const D = 'tle-bootstrap-failure-dialog';

async function waitFor(fn, label) {
  for (let i = 0; i < 300; i++) {
    if (fn()) return;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  throw Error('Timed out waiting for ' + label);
}
function createHost({ legacy = false, managedLoader = false, healthyCore = false, fetcher = null, legacyVersion = false, fastTimeout = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="sheld"><div id="chat"></div></div><iframe></iframe></body></html>', {
    url: 'https://tavern.test/', runScripts: 'dangerously', pretendToBeVisual: true
  });
  const host = dom.window;
  const frame = host.document.querySelector('iframe').contentWindow;
  Object.defineProperty(host, 'indexedDB', { value: new IDBFactory() });
  const calls = [], statuses = [], scheduled = new Map(), injected = [];
  const nativeTimeout = frame.setTimeout.bind(frame), nativeClear = frame.clearTimeout.bind(frame);
  let timerID = 100000;
  frame.setTimeout = (fn, ms, ...args) => {
    if (ms === 60000 || ms === 21600000) { const id = ++timerID; scheduled.set(id, { fn, ms }); return id; }
    return nativeTimeout(fn, [500, 1000].includes(ms) ? 5 : ms === 20000 && fastTimeout ? 10 : ms, ...args);
  };
  frame.clearTimeout = id => { scheduled.delete(id); nativeClear(id); };
  frame.fetch = async (url, options) => {
    assert.equal(host.document.getElementById(D), null, 'no final dialog while requests are still retrying');
    calls.push({ url, signal: options.signal });
    if (fetcher) return await fetcher(url, options, calls.length);
    throw new TypeError('Failed to fetch');
  };
  host.addEventListener('tle-loader-bootstrap-state-change', () => {
    const info = host[B]?.getInfo();
    if (info) statuses.push(info);
  });
  const append = frame.document.head.appendChild.bind(frame.document.head);
  frame.document.head.appendChild = node => {
    if (node.tagName === 'SCRIPT') injected.push(node.src);
    return append(node);
  };
  host.console = frame.console = { info() {}, warn() {}, error() {} };
  if (legacy) {
    host[L] = { version: '0.3.1', bootstrapManaged: false, diagnostics: { destroyed: false } };
  }
  if (managedLoader) {
    host[L] = {
      version: '0.3.4', channel: 'stable', bootstrapManaged: true,
      diagnostics: { destroyed: false },
      getInfo() { return { busy: false, lastStatus: { message: 'Core 下载失败：模拟网络限制' } }; },
      checkRemote: async () => null, loadRemote: async () => false,
      destroy() { this.diagnostics.destroyed = true; delete host[L]; },
      ready: Promise.resolve()
    };
  }
  if (healthyCore) {
    host[C] = {
      version: '0.3.211', ready: true, state: { destroyed: false },
      hostWindow: host, hostDocument: host.document
    };
  }
  frame.eval(legacyVersion ? legacyBootstrap : bootstrap);
  return { host, frame, dom, calls, statuses, scheduled, injected, cleanup() {
    host[B]?.destroy?.();
    delete host[C];
    delete host[L];
    dom.window.close();
  } };
}

for (const legacyVersion of [true, false]) {
{
  const t = createHost({ legacyVersion });
  await waitFor(() => t.host.document.getElementById(D), 'first-run network failure dialog');
  const node = t.host.document.getElementById(D);
  assert.equal(node.parentNode, t.host.document.documentElement, 'dialog must not be clipped by chat or TT drawer');
  assert.ok(node.firstElementChild?.shadowRoot, 'error UI must be isolated from host themes');
  assert.match(node.firstElementChild.shadowRoot.querySelector('[data-stage]').textContent, legacyVersion ? /Loader 下载或执行/ : /Loader 清单下载/);
  assert.match(node.firstElementChild.shadowRoot.querySelector('[data-reason]').textContent, /Failed to fetch/);
  assert.match(node.firstElementChild.shadowRoot.querySelector('[data-report]').textContent, legacyVersion ? /TLE Bootstrap v1\.0\.3/ : /TLE Bootstrap v1\.0\.4/);
  assert.equal(t.host[B].getInfo().startupFailure.stage, legacyVersion ? 'Loader 下载或执行' : 'Loader 清单下载');
  node.firstElementChild.shadowRoot.querySelector('[data-action="copy"]').click();
  assert.match(node.firstElementChild.shadowRoot.querySelector('[data-copy-state]').textContent, /长按/);
  node.firstElementChild.shadowRoot.querySelector('[data-action="close"]').click();
  assert.equal(t.host.document.getElementById(D), null, 'closing must remove dialog');
  assert.ok(t.host[B].getInfo().startupFailure, 'failure remains available via getInfo');
  // Late successful Core initialization must clear a dismissed failure.
  t.host[C] = { version: '0.3.211', ready: true, state: { destroyed: false },
    hostWindow: t.host, hostDocument: t.host.document };
  t.host.dispatchEvent(new t.host.CustomEvent('tle-loader-state-change'));
  assert.equal(t.host[B].getInfo().startupFailure, null);
  t.cleanup();
}
{
  const t = createHost({ legacy: true, legacyVersion });
  await waitFor(() => t.host.document.getElementById(D), 'legacy loader collision');
  assert.match(t.host.document.getElementById(D).firstElementChild.shadowRoot.querySelector('[data-stage]').textContent, /旧 Loader 冲突/);
  assert.equal(t.host[B].getInfo().startupFailure.stage, '旧 Loader 冲突');
  t.cleanup();
}
{
  const t = createHost({ managedLoader: true, legacyVersion });
  await waitFor(() => t.host.document.getElementById(D), 'Loader succeeds but Core fails');
  assert.match(t.host.document.getElementById(D).firstElementChild.shadowRoot.querySelector('[data-stage]').textContent, /Core 加载/);
  assert.match(t.host.document.getElementById(D).firstElementChild.shadowRoot.querySelector('[data-reason]').textContent, /Core 下载失败/);
  t.cleanup();
}
{
  const t = createHost({ managedLoader: true, healthyCore: true, legacyVersion });
  await waitFor(() => t.host[B] && !t.host[B].getInfo().busy, 'successful bootstrap startup');
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(t.host.document.getElementById(D), null, 'working Core must never show failure dialog');
  assert.equal(t.host[B].getInfo().startupFailure, null);
  t.cleanup();
}
}
console.log('Bootstrap v1.0.3/v1.0.4 dialog regressions passed.');

const source = '// verified UTF-8 源码';
const release = {
  version: '0.3.4', source_path: 'loader/runtime/v0.3.4/TLE-Remote-Loader.js', source_commit: 'a'.repeat(40),
  source_url: 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/' + 'a'.repeat(40) + '/loader/runtime/v0.3.4/TLE-Remote-Loader.js',
  size_bytes: Buffer.byteLength(source), sha256: createHash('sha256').update(source).digest('hex')
};
const manifest = { schema_version: 1, project: 'Tavern Layout Engine', channel: 'stable-loader', latest_version: '0.3.4', release };
const response = text => ({ ok: true, text: async () => text });
async function failed(t) {
  await waitFor(() => t.host[B]?.getInfo().remoteFailure && !t.host[B].getInfo().busy, 'exhausted request');
  await waitFor(() => t.host.document.getElementById(D), 'final diagnostic');
  return t.host[B].getInfo().remoteFailure;
}
for (const [kind, fetcher, count] of [
  ['network', async () => { throw new TypeError('Failed to fetch'); }, 3],
  ['interrupted', async () => { throw new DOMException('signal is aborted without reason', 'AbortError'); }, 3],
  ['timeout', async (url, { signal }) => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('signal is aborted without reason', 'AbortError')))), 3],
  ...[408, 429, 500, 503, 599, 400, 401, 403, 404].map(status => ['http', async () => ({ ok: false, status }), [408, 429, 500, 503, 599].includes(status) ? 3 : 1])
]) {
  const t = createHost({ fetcher, fastTimeout: true });
  const failure = await failed(t);
  assert.equal(failure.type, kind);
  assert.equal(failure.attempt, count);
  assert.equal(t.calls.length, count);
  assert.equal(t.scheduled.size, 0, 'exhausted first-start failure must not loop every minute');
  assert.equal(t.injected.length, 0);
  const report = t.host.document.getElementById(D).firstElementChild.shadowRoot.querySelector('[data-report]').textContent;
  assert.ok(report.includes('尝试次数：' + count + '/3'));
  assert.ok(report.includes('错误类型：' + kind));
  if (count === 3) assert.ok(t.statuses.some(info => info.request?.status === 'waiting'));
  t.cleanup();
}
// Cancellation must stop both a pending request/body and a backoff timer.
for (const mode of ['request', 'body', 'waiting', 'host-pagehide', 'frame-beforeunload']) {
  let started = false;
  const t = createHost({ fetcher: async (url, { signal }) => {
    started = true;
    if (mode === 'waiting') throw new TypeError('Failed to fetch');
    const pending = () => new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new DOMException('signal is aborted without reason', 'AbortError'))));
    return mode === 'body' ? { ok: true, text: pending } : await pending();
  } });
  const api = t.host[B];
  await waitFor(() => started && (mode !== 'waiting' || api.getInfo().request?.status === 'waiting'), mode);
  const before = t.calls.length;
  if (mode === 'host-pagehide') t.host.dispatchEvent(new t.host.Event('pagehide'));
  else if (mode === 'frame-beforeunload') t.frame.dispatchEvent(new t.frame.Event('beforeunload'));
  else api.destroy();
  await new Promise(resolve => setTimeout(resolve, 30));
  assert.equal(t.calls.length, before);
  assert.equal(api.getInfo().remoteFailure, null);
  assert.equal(api.getInfo().startupFailure, null);
  assert.equal(api.getInfo().request.type, 'cancelled');
  assert.equal(t.host.document.getElementById(D), null);
  assert.equal(t.host.document.getElementById('tle-bootstrap-retry-progress'), null);
  assert.equal(t.scheduled.size, 0);
  assert.equal(t.calls.at(-1).signal.aborted, mode !== 'waiting');
  t.cleanup();
}
for (const tamper of ['sha256', 'source_url', 'source_commit', 'size_bytes', 'json']) {
  const modified = structuredClone(manifest);
  if (tamper === 'sha256') modified.release.sha256 = '0'.repeat(64);
  if (tamper === 'source_url') modified.release.source_url = 'https://untrusted.test/loader.js';
  if (tamper === 'source_commit') modified.release.source_commit = 'b'.repeat(40);
  if (tamper === 'size_bytes') modified.release.size_bytes++;
  const t = createHost({ fetcher: async url => response(url.includes('/main/') ? (tamper === 'json' ? '{bad json' : JSON.stringify(modified)) : source) });
  const failure = await failed(t);
  assert.equal(failure.type, 'security', tamper);
  assert.equal(failure.attempt, 1);
  assert.equal(t.calls.length, ['sha256', 'size_bytes'].includes(tamper) ? 2 : 1);
  assert.equal(t.injected.length, 0, 'untrusted bytes must never reach script injection');
  assert.equal(t.scheduled.size, 0);
  t.cleanup();
}
// Updating a healthy runtime only checks the manifest and retains identities/cache on failure.
{
  const t = createHost({ managedLoader: true, healthyCore: true });
  const loader = t.host[L], core = t.host[C];
  await waitFor(() => t.host[B].getInfo().remoteFailure, 'healthy update failure');
  assert.equal(t.calls.length, 3);
  assert.equal(t.host[L], loader); assert.equal(t.host[C], core);
  assert.equal(loader.diagnostics.destroyed, false); assert.equal(core.state.destroyed, false);
  assert.equal(t.injected.length, 0);
  assert.equal(t.host.document.getElementById(D), null);
  assert.deepEqual([...t.scheduled.values()].map(timer => timer.ms), [21600000]);
  t.cleanup();
}
// All overlapping checks await one request sequence; an already verified candidate is reused.
{
  let releaseFetch;
  const t = createHost({ managedLoader: true, healthyCore: true, fetcher: async url => {
    if (url.includes('/main/')) return await new Promise(resolve => { releaseFetch = () => resolve(response(JSON.stringify(manifest))); });
    return response(source);
  } });
  await waitFor(() => releaseFetch, 'shared manifest request');
  const a = t.host[B].checkRemote(), b = t.host[B].checkRemote();
  assert.equal(a, b);
  assert.equal(t.calls.length, 1);
  releaseFetch(); await Promise.all([a, b]);
  assert.equal(t.calls.length, 2);
  releaseFetch = null;
  const c = t.host[B].checkRemote();
  await waitFor(() => releaseFetch, 'second check manifest');
  releaseFetch(); await c;
  assert.equal(t.calls.length, 3, 'unchanged verified source must not be downloaded twice');
  assert.equal(t.injected.length, 0);
  t.cleanup();
}
console.log('Bootstrap v1.0.4: bounded retries, HTTP classes, cancellation, security, healthy runtime and single-flight checks passed.');

// A replaced Bootstrap owns a different controller; late resolution cannot restart the old one.
{
  let completeOld;
  const t = createHost({ fetcher: async () => new Promise(resolve => { completeOld = resolve; }) });
  const old = t.host[B];
  await waitFor(() => completeOld, 'old pending fetch');
  t.frame.fetch = async () => { throw new TypeError('Failed to fetch'); };
  t.frame.eval(bootstrap);
  const replacement = t.host[B];
  assert.notEqual(replacement, old);
  completeOld(response(JSON.stringify(manifest)));
  await failed(t);
  assert.equal(old.getInfo().request.type, 'cancelled');
  assert.equal(old.getInfo().remoteFailure, null);
  assert.equal(t.injected.length, 0);
  assert.equal(t.host[B], replacement);
  t.cleanup();
}
console.log('Bootstrap replacement aborts the old owner even when fetch ignores cancellation.');

// Source download exhaustion reports its own three attempts, without restarting the manifest.
{
  const t = createHost({ fetcher: async url => {
    if (url.includes('/main/')) return response(JSON.stringify(manifest));
    throw new TypeError('Failed to fetch');
  } });
  const failure = await failed(t);
  assert.equal(failure.stage, 'Loader 源码下载');
  assert.equal(failure.attempt, 3);
  assert.equal(t.calls.length, 4);
  assert.equal(t.calls.filter(call => call.url.includes('/main/')).length, 1);
  assert.equal(t.injected.length, 0);
  t.cleanup();
}
// The timeout covers the response body as well as receipt of response headers.
{
  const t = createHost({ fastTimeout: true, fetcher: async (url, { signal }) => ({
    ok: true, text: () => new Promise((resolve, reject) => signal.addEventListener('abort',
      () => reject(new DOMException('signal is aborted without reason', 'AbortError'))))
  }) });
  const failure = await failed(t);
  assert.equal(failure.type, 'timeout');
  assert.equal(failure.attempt, 3);
  assert.equal(t.calls.length, 3);
  t.cleanup();
}
console.log('Source exhaustion and response-body timeout diagnostics passed.');
