import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createModuleKernel } from '../development/core/module-kernel.js';
import { buildModuleKernelBundle } from '../scripts/build-module-kernel.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFileSync(path.join(root, relative), 'utf8');

function makeKernel(options = {}) {
  return createModuleKernel({ coreVersion: '0.3.304', ...options });
}

test('register validates stable IDs, semantic versions, API compatibility and duplicates', () => {
  const kernel = makeKernel();
  const valid = { id: 'navigation', version: '1.0.0', init: () => ({ api: {} }) };
  assert.equal(kernel.register(valid).status, 'registered');
  assert.throws(() => kernel.register(valid), /ID 已注册/);
  assert.throws(() => kernel.register({ id: 'Bad ID', version: '1.0.0', init() {} }), /无效模块 ID/);
  assert.throws(() => kernel.register({ id: 'broken-version', version: '1', init() {} }), /有效 SemVer/);
  assert.equal(kernel.apiVersion, 2);
  assert.equal(kernel.version, '1.1.0');
  assert.throws(() => kernel.register({ id: 'future-api', version: '1.0.0', apiVersion: 3, init() {} }), /不受支持/);
  assert.throws(() => kernel.register({ id: 'missing-parent', version: '1.0.0', parentId: 'unknown', init() {} }), /父模块尚未注册/);
  kernel.destroy();
});

test('parent and dependency graphs start in order and stop in reverse dependency order', async () => {
  const kernel = makeKernel();
  const calls = [];
  kernel.register({
    id: 'workspace', version: '1.0.0',
    init() {
      calls.push('start:workspace');
      return { api: { name: 'workspace' }, destroy() { calls.push('stop:workspace'); } };
    },
  });
  kernel.register({
    id: 'session.hero', version: '1.0.0', parentId: 'workspace',
    init() {
      calls.push('start:session');
      return { api: { ping: () => 'pong' }, destroy() { calls.push('stop:session'); } };
    },
  });
  kernel.register({
    id: 'floor.hero', version: '1.0.0', parentId: 'session.hero', dependencies: ['session.hero'],
    init(context) {
      assert.equal(context.modules.getAPI('session.hero').ping(), 'pong');
      calls.push('start:floor');
      return { api: {}, destroy() { calls.push('stop:floor'); } };
    },
  });

  await kernel.start('floor.hero');
  assert.deepEqual(calls, ['start:workspace', 'start:session', 'start:floor']);
  assert.equal(kernel.get('workspace').status, 'active');
  assert.equal(kernel.get('session.hero').status, 'active');
  assert.equal(kernel.get('floor.hero').status, 'active');

  await kernel.stop('session.hero');
  assert.deepEqual(calls.slice(-2), ['stop:floor', 'stop:session']);
  assert.equal(kernel.get('floor.hero').status, 'registered');
  assert.equal(kernel.get('session.hero').status, 'registered');
  assert.equal(kernel.get('workspace').status, 'active');

  await kernel.stop('workspace');
  assert.equal(calls.at(-1), 'stop:workspace');
  kernel.destroy();
});

test('stopping a dependency cascades to active dependents without stopping unrelated modules', async () => {
  const kernel = makeKernel();
  const calls = [];
  kernel.register({ id: 'shared', version: '1.0.0', init() { calls.push('shared+'); return () => calls.push('shared-'); } });
  kernel.register({ id: 'consumer', version: '1.0.0', dependencies: ['shared'], init() { calls.push('consumer+'); return () => calls.push('consumer-'); } });
  kernel.register({ id: 'independent', version: '1.0.0', init() { calls.push('independent+'); return () => calls.push('independent-'); } });
  await kernel.start('consumer');
  await kernel.start('independent');
  await kernel.stop('shared');
  assert.deepEqual(calls.slice(-2), ['consumer-', 'shared-']);
  assert.equal(kernel.get('independent').status, 'active');
  kernel.destroy();
});

test('module events require declared capabilities and subscriptions are removed on stop', async () => {
  const kernel = makeKernel();
  let received = 0;
  kernel.register({
    id: 'listener', version: '1.0.0', permissions: ['events:subscribe'],
    init(context) {
      context.events.on('sample:changed', value => { received += value; });
      return {};
    },
  });
  let fire;
  kernel.register({
    id: 'publisher', version: '1.0.0', permissions: ['events:emit'],
    init(context) { fire = value => context.events.emit('sample:changed', value); return {}; },
  });
  await kernel.start('listener');
  await kernel.start('publisher');
  fire(2);
  assert.equal(received, 2);
  await kernel.stop('listener');
  fire(5);
  assert.equal(received, 2);
  kernel.destroy();
});

test('module settings persist in an ID- and schema-version-scoped namespace', async () => {
  const values = new Map();
  const storage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    get length() { return values.size; },
    key(index) { return [...values.keys()][index] ?? null; },
  };
  const kernel = makeKernel({ storage });
  let settings;
  kernel.register({
    id: 'theme-tools', version: '1.0.0', settingsSchemaVersion: 2,
    permissions: ['settings:read', 'settings:write'],
    init(context) {
      settings = context.settings;
      context.settings.set('layout', { columns: 3 });
      return {};
    },
  });
  await kernel.start('theme-tools');
  assert.deepEqual(settings.get('layout'), { columns: 3 });
  assert.ok([...values.keys()][0].startsWith('tle.module.theme-tools.settings.v2.'));
  await kernel.stop('theme-tools');
  await kernel.start('theme-tools');
  assert.deepEqual(settings.get('layout'), { columns: 3 });
  kernel.destroy();
});

test('host references are explicitly permission-gated in module context', async () => {
  const scriptWindow = { kind: 'script-window' };
  const hostWindow = { kind: 'host-window' };
  const hostDocument = { kind: 'host-document' };
  const kernel = makeKernel({ host: { scriptWindow, window: hostWindow, document: hostDocument } });
  let context;
  kernel.register({
    id: 'host-enabled', version: '1.0.0',
    permissions: ['host:script-window', 'host:window', 'host:document'],
    init(value) {
      context = value;
      assert.equal(value.host.scriptWindow, scriptWindow);
      assert.equal(value.host.window, hostWindow);
      assert.equal(value.host.document, hostDocument);
      return {};
    },
  });
  kernel.register({
    id: 'host-denied', version: '1.0.0',
    init(value) { return { api: { readHost: () => value.host.window } }; },
  });
  await kernel.start('host-enabled');
  await kernel.start('host-denied');
  assert.throws(() => kernel.getAPI('host-denied').readHost(), /未声明所需权限：host:window/);
  assert.equal(Object.isFrozen(context.host), true);
  kernel.destroy();
});

test('undeclared settings and event permissions are rejected', async () => {
  const kernel = makeKernel();
  kernel.register({
    id: 'unprivileged', version: '1.0.0',
    init(context) {
      context.settings.set('x', 1);
      return {};
    },
  });
  await assert.rejects(kernel.start('unprivileged'), /未声明所需权限：settings:write/);
  assert.equal(kernel.get('unprivileged').status, 'failed');
  kernel.destroy();
});

test('failed module initialization rolls back only newly started dependencies', async () => {
  const kernel = makeKernel();
  let dependencyCleanups = 0;
  let failedCleanup = 0;
  kernel.register({
    id: 'base', version: '1.0.0',
    init() { return { destroy() { dependencyCleanups++; } }; },
  });
  kernel.register({
    id: 'broken-child', version: '1.0.0', dependencies: ['base'],
    destroy() { failedCleanup++; },
    init() { throw new Error('intentional-init-failure'); },
  });
  kernel.register({ id: 'healthy', version: '1.0.0', init() { return {}; } });

  await assert.rejects(kernel.start('broken-child'), /intentional-init-failure/);
  assert.equal(kernel.get('base').status, 'registered');
  assert.equal(kernel.get('broken-child').status, 'failed');
  assert.equal(dependencyCleanups, 1);
  assert.equal(failedCleanup, 1);
  await kernel.start('healthy');
  assert.equal(kernel.get('healthy').status, 'active');
  kernel.destroy();
});

test('replace upgrades an active module and restores the old version if candidate init fails', async () => {
  const kernel = makeKernel();
  let oldCleanup = 0;
  let newCleanup = 0;
  const definition = (version, shouldFail = false) => ({
    id: 'pilot', version,
    init() {
      if (shouldFail) throw new Error('candidate-failed');
      return {
        api: { version },
        destroy() {
          if (version === '1.0.0') oldCleanup++;
          if (version === '2.0.0') newCleanup++;
        },
      };
    },
  });
  kernel.register(definition('1.0.0'));
  await kernel.start('pilot');
  await kernel.replace(definition('2.0.0'));
  assert.equal(kernel.getAPI('pilot').version, '2.0.0');
  assert.equal(oldCleanup, 1);

  await assert.rejects(kernel.replace(definition('3.0.0', true)), /candidate-failed/);
  assert.equal(kernel.get('pilot').version, '2.0.0');
  assert.equal(kernel.get('pilot').status, 'active');
  assert.equal(kernel.getAPI('pilot').version, '2.0.0');
  assert.equal(newCleanup, 1);
  await kernel.stop('pilot');
  assert.equal(newCleanup, 2);
  kernel.destroy();
});

test('unregister protects referenced modules unless cascade is explicit', async () => {
  const kernel = makeKernel();
  kernel.register({ id: 'parent', version: '1.0.0', init() { return {}; } });
  kernel.register({ id: 'child', version: '1.0.0', parentId: 'parent', init() { return {}; } });
  await assert.rejects(kernel.unregister('parent'), /显式设置 cascade/);
  await kernel.unregister('parent', { cascade: true });
  assert.equal(kernel.has('parent'), false);
  assert.equal(kernel.has('child'), false);
  kernel.destroy();
});

test('destroy aborts an in-flight init and disposes its late result exactly once', async () => {
  const kernel = makeKernel();
  let signal;
  let enter;
  let release;
  let cleanupCount = 0;
  let definitionCleanupCount = 0;
  const entered = new Promise(resolve => { enter = resolve; });
  const pending = new Promise(resolve => { release = resolve; });
  kernel.register({
    id: 'slow-module', version: '1.0.0',
    destroy() { definitionCleanupCount++; },
    async init(context) {
      signal = context.signal;
      enter();
      return pending;
    },
  });
  const startPromise = kernel.start('slow-module');
  await entered;
  kernel.destroy();
  assert.equal(signal.aborted, true);
  assert.equal(definitionCleanupCount, 1, 'definition destroy must clean partial setup immediately');
  release({ destroy() { cleanupCount++; } });
  await assert.rejects(startPromise, /初始化已取消/);
  assert.equal(cleanupCount, 1, 'late init result cleanup must run once');
  assert.equal(definitionCleanupCount, 1, 'definition destroy must not run twice');
  assert.equal(kernel.get('slow-module').status, 'destroyed');
});


test('Core services are permission-gated, immutable and isolated from undeclared modules', async () => {
  const sampleService = Object.freeze({ ping: () => 'pong' });
  const kernel = makeKernel({ services: { 'sample-service': sampleService } });
  let allowedContext;
  kernel.register({
    id: 'service-consumer', version: '1.0.0',
    permissions: ['services:sample-service'],
    init(context) {
      allowedContext = context;
      const service = context.services.get('sample-service');
      assert.equal(service.ping(), 'pong');
      return { api: { ping: () => service.ping() } };
    },
  });
  kernel.register({
    id: 'service-denied', version: '1.0.0',
    init(context) {
      return { api: { get: () => context.services.get('sample-service') } };
    },
  });
  await kernel.start('service-consumer');
  await kernel.start('service-denied');
  assert.equal(kernel.getAPI('service-consumer').ping(), 'pong');
  assert.throws(() => kernel.getAPI('service-denied').get(), /未声明所需权限：services:sample-service/);
  assert.equal(Object.isFrozen(allowedContext.services), true);
  assert.equal(Object.isFrozen(sampleService), true);
  kernel.destroy();
});

test('Core service registry rejects invalid IDs and non-object services', () => {
  assert.throws(() => makeKernel({ services: { 'Bad ID': {} } }), /无效 Core service ID/);
  assert.throws(() => makeKernel({ services: { 'invalid-service': null } }), /Core service 必须是对象/);
  assert.throws(() => makeKernel({ services: [] }), /Core services 必须是对象/);
});

test('Core embeds the exact current kernel source and exposes its lifecycle API', () => {
  const moduleSource = read('development/core/module-kernel.js');
  const coreSource = read('development/organizer/TLE.js');
  const expected = buildModuleKernelBundle(moduleSource);
  const start = coreSource.indexOf('  /* TLE_MODULE_KERNEL_START */');
  const endMarker = '  /* TLE_MODULE_KERNEL_END */';
  const end = coreSource.indexOf(endMarker, start);
  assert.ok(start >= 0 && end > start, 'Core module-kernel marker pair is missing');
  assert.equal(coreSource.slice(start, end + endMarker.length), expected);
  assert.match(coreSource, /const moduleKernel = TLEModuleKernelBundle\.createModuleKernel/);
  assert.match(coreSource, /modules: moduleKernel/);
  assert.match(coreSource, /const coreModuleServices = Object\\.freeze/);
  assert.match(coreSource, /'chat-context': Object\\.freeze/);
  assert.match(coreSource, /'resource-catalog': Object\\.freeze/);
  assert.match(coreSource, /services: coreModuleServices/);
  assert.match(coreSource, /moduleKernel\.destroy\(\)/);
  assert.match(coreSource, /host: \{ scriptWindow: SCRIPT_WIN, window: HOST_WIN, document: HOST_DOC \}/);
});
