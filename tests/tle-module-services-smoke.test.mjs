import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../modules/src/core-services-smoke.js', import.meta.url), 'utf8');
const namespace = await import('data:text/javascript;charset=utf-8,' + encodeURIComponent(source));
assert.equal(typeof namespace.default, 'function');

const message = Object.freeze({ is_system: false, is_user: true, mes: 'smoke', extra: Object.freeze({ gen_id: 'g1' }) });
const snapshot = Object.freeze({ chatKey: 'test-chat', lastMessageId: 1, chat: Object.freeze([message]) });
const chatContext = Object.freeze({
  getActive: () => snapshot,
  getCurrentRole: () => null,
  isGenerating: () => false,
  executeSlashCommand: async () => undefined,
});
const resourceCatalog = Object.freeze({
  list(_id, options = {}) {
    if (!options.signal || typeof options.signal.aborted !== 'boolean') {
      throw new Error('Resource Catalog 必须接收模块 AbortSignal。');
    }
    return Promise.resolve([]);
  },
  listForManagement: async () => [],
  applyChoice: async () => undefined,
});
const services = Object.freeze({
  get(id) {
    if (id === 'chat-context') return chatContext;
    if (id === 'resource-catalog') return resourceCatalog;
    throw new Error('Unknown service: ' + id);
  },
});
const instance = namespace.default({
  apiVersion: 2,
  signal: new AbortController().signal,
  services,
});
const status = instance.api.getStatus();
assert.equal(status.apiVersion, 2);
assert.equal(status.activeChat, true);
assert.equal(status.messageCount, 1);
assert.equal(status.isGenerating, false);
assert.equal(status.roleAvailable, false);
assert.deepEqual(status.services, ['chat-context', 'resource-catalog']);
assert.equal(status.abortSignalRequired, true);
instance.destroy();

console.log('Core Services API v2 smoke module factory and read-only service contract passed.');
