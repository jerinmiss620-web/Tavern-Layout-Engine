import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
import { IDBFactory } from 'fake-indexeddb';

const bootstrap = readFileSync(new URL('../loader/bootstrap/TLE-Permanent-Bootstrap-1.0.3.js', import.meta.url), 'utf8');
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
function createHost({ legacy = false, managedLoader = false, healthyCore = false } = {}) {
  const dom = new JSDOM('<!doctype html><html><head></head><body><div id="sheld"><div id="chat"></div></div><iframe></iframe></body></html>', {
    url: 'https://tavern.test/', runScripts: 'dangerously', pretendToBeVisual: true
  });
  const host = dom.window;
  const frame = host.document.querySelector('iframe').contentWindow;
  Object.defineProperty(host, 'indexedDB', { value: new IDBFactory() });
  frame.fetch = async () => { throw new TypeError('模拟 TT 无法连接 GitHub'); };
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
  frame.eval(bootstrap);
  return { host, frame, dom, cleanup() {
    host[B]?.destroy?.();
    delete host[C];
    delete host[L];
    dom.window.close();
  } };
}

{
  const t = createHost();
  await waitFor(() => t.host.document.getElementById(D), 'first-run network failure dialog');
  const node = t.host.document.getElementById(D);
  assert.equal(node.parentNode, t.host.document.documentElement, 'dialog must not be clipped by chat or TT drawer');
  assert.ok(node.firstElementChild?.shadowRoot, 'error UI must be isolated from host themes');
  assert.match(node.firstElementChild.shadowRoot.querySelector('[data-stage]').textContent, /Loader 下载或执行/);
  assert.match(node.firstElementChild.shadowRoot.querySelector('[data-reason]').textContent, /模拟 TT 无法连接 GitHub/);
  assert.match(node.firstElementChild.shadowRoot.querySelector('[data-report]').textContent, /TLE Bootstrap v1\.0\.3/);
  assert.equal(t.host[B].getInfo().startupFailure.stage, 'Loader 下载或执行');
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
  const t = createHost({ legacy: true });
  await waitFor(() => t.host.document.getElementById(D), 'legacy loader collision');
  assert.match(t.host.document.getElementById(D).firstElementChild.shadowRoot.querySelector('[data-stage]').textContent, /旧 Loader 冲突/);
  assert.equal(t.host[B].getInfo().startupFailure.stage, '旧 Loader 冲突');
  t.cleanup();
}
{
  const t = createHost({ managedLoader: true });
  await waitFor(() => t.host.document.getElementById(D), 'Loader succeeds but Core fails');
  assert.match(t.host.document.getElementById(D).firstElementChild.shadowRoot.querySelector('[data-stage]').textContent, /Core 加载/);
  assert.match(t.host.document.getElementById(D).firstElementChild.shadowRoot.querySelector('[data-reason]').textContent, /Core 下载失败/);
  t.cleanup();
}
{
  const t = createHost({ managedLoader: true, healthyCore: true });
  await waitFor(() => t.host[B] && !t.host[B].getInfo().busy, 'successful bootstrap startup');
  await new Promise(resolve => setTimeout(resolve, 50));
  assert.equal(t.host.document.getElementById(D), null, 'working Core must never show failure dialog');
  assert.equal(t.host[B].getInfo().startupFailure, null);
  t.cleanup();
}
console.log('Bootstrap v1.0.3 dialog regression: network failure, old Loader, missing Core and healthy Core passed.');
