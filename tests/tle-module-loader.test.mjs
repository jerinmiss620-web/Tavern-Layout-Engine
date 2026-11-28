import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { indexedDB } from 'fake-indexeddb';
import { createModuleKernel } from '../development/core/module-kernel.js';
import { createModuleLoader } from '../development/core/module-loader.js';

const ROOT = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/';
const MANIFEST_URL = ROOT + 'integration/phase-2-module-system-20261129/modules/test.json';
let databaseSequence = 0;

function moduleSource(version, shouldFail = false) {
  if (shouldFail) {
    return "export default function createModule() { throw new Error('candidate-failed'); }";
  }
  return "export default function createModule() { return { api: { version: '" + version + "' }, destroy() {} }; }";
}

function makeEntry(id, version, source, commit = 'a'.repeat(40), overrides = {}) {
  const sourcePath = 'modules/src/' + id.replaceAll('.', '-') + '.js';
  return {
    id,
    name: id,
    version,
    api_version: 1,
    settings_schema_version: 1,
    source_commit: commit,
    source_path: sourcePath,
    source_url: ROOT + commit + '/' + sourcePath,
    sha256: createHash('sha256').update(source, 'utf8').digest('hex'),
    size_bytes: Buffer.byteLength(source, 'utf8'),
    parent_id: null,
    dependencies: [],
    permissions: [],
    enabled_by_default: true,
    ...overrides,
  };
}

function makeManifest(entries, channel = 'test') {
  return JSON.stringify({
    schema_version: 1,
    project: 'Tavern Layout Engine',
    channel,
    core_api_version: 1,
    modules: entries,
  });
}

function fallbackDefinition(id, log = []) {
  return {
    id,
    name: id,
    version: '0.0.0',
    apiVersion: 1,
    init() {
      log.push(id + ':fallback-start');
      return {
        api: { version: '0.0.0' },
        destroy() { log.push(id + ':fallback-stop'); },
      };
    },
  };
}

function createFetch(manifest, entries, sources, failures = new Set()) {
  const responses = new Map([[MANIFEST_URL, manifest]]);
  for (const entry of entries) {
    if (sources.has(entry.source_url)) responses.set(entry.source_url, sources.get(entry.source_url));
  }
  return async url => {
    if (failures.has(url)) throw new Error('network-offline');
    if (!responses.has(url)) return { ok: false, status: 404, text: async () => '' };
    return { ok: true, status: 200, text: async () => responses.get(url) };
  };
}

function createHarness({
  manifest,
  entries = [],
  sources = new Map(),
  failures = new Set(),
  fallbackModules = [],
  dbName,
} = {}) {
  const kernel = createModuleKernel({ coreVersion: '0.3.304' });
  const loader = createModuleLoader({
    kernel,
    channel: 'test',
    manifestUrl: MANIFEST_URL,
    fetch: createFetch(manifest, entries, sources, failures),
    indexedDB,
    dbName: dbName || 'tle-module-test-' + (++databaseSequence),
    importModule(source) {
      return import('data:text/javascript;charset=utf-8,' + encodeURIComponent(source));
    },
    crypto: {},
    fallbackModules,
    timeoutMs: 3000,
  });
  return { kernel, loader };
}

test('integration branch manifests are accepted only by the Test channel', () => {
  const kernel = createModuleKernel({ coreVersion: '0.3.304' });
  assert.throws(
    () => createModuleLoader({ kernel, channel: 'stable', manifestUrl: MANIFEST_URL }),
    /Manifest URL/,
  );
  kernel.destroy();
});

test('verified manifest source replaces the fallback and becomes Last Known Good', async () => {
  const source = moduleSource('1.0.0');
  const entry = makeEntry('avatar.hd', '1.0.0', source);
  const log = [];
  const { kernel, loader } = createHarness({
    manifest: makeManifest([entry]),
    entries: [entry],
    sources: new Map([[entry.source_url, source]]),
    fallbackModules: [fallbackDefinition('avatar.hd', log)],
  });

  await loader.start();
  assert.equal(kernel.get('avatar.hd').status, 'active');
  assert.equal(kernel.get('avatar.hd').version, '1.0.0');
  assert.equal(kernel.getAPI('avatar.hd').version, '1.0.0');
  assert.deepEqual(log, ['avatar.hd:fallback-start', 'avatar.hd:fallback-stop']);
  const [item] = await loader.list();
  assert.equal(item.lastKnownGoodVersion, '1.0.0');
  assert.equal(loader.getStatus().persistentCache, true);

  loader.destroy();
  kernel.destroy();
});

test('a candidate init failure restores the active fallback and does not advance LKG', async () => {
  const source = moduleSource('2.0.0', true);
  const entry = makeEntry('avatar.hd', '2.0.0', source, 'b'.repeat(40));
  const log = [];
  const { kernel, loader } = createHarness({
    manifest: makeManifest([entry]),
    entries: [entry],
    sources: new Map([[entry.source_url, source]]),
    fallbackModules: [fallbackDefinition('avatar.hd', log)],
  });

  await loader.start();
  assert.equal(kernel.get('avatar.hd').status, 'active');
  assert.equal(kernel.get('avatar.hd').version, '0.0.0');
  assert.equal(kernel.getAPI('avatar.hd').version, '0.0.0');
  const [item] = await loader.list();
  assert.equal(item.lastKnownGoodVersion, null);
  assert.ok(log.includes('avatar.hd:fallback-start'));

  loader.destroy();
  kernel.destroy();
});

test('offline startup restores the last verified module from IndexedDB', async () => {
  const dbName = 'tle-module-lkg-' + (++databaseSequence);
  const sourceV1 = moduleSource('1.0.0');
  const entryV1 = makeEntry('pilot', '1.0.0', sourceV1, 'c'.repeat(40));
  const first = createHarness({
    manifest: makeManifest([entryV1]),
    entries: [entryV1],
    sources: new Map([[entryV1.source_url, sourceV1]]),
    dbName,
  });
  await first.loader.start();
  assert.equal(first.kernel.get('pilot').version, '1.0.0');
  first.loader.destroy();
  first.kernel.destroy();

  const sourceV2 = moduleSource('2.0.0');
  const entryV2 = makeEntry('pilot', '2.0.0', sourceV2, 'd'.repeat(40));
  const second = createHarness({
    manifest: makeManifest([entryV2]),
    entries: [entryV2],
    sources: new Map(),
    failures: new Set([entryV2.source_url]),
    dbName,
  });
  await second.loader.start();
  assert.equal(second.kernel.get('pilot').status, 'active');
  assert.equal(second.kernel.get('pilot').version, '1.0.0');
  assert.equal(second.kernel.getAPI('pilot').version, '1.0.0');

  second.loader.destroy();
  second.kernel.destroy();
});

test('disabling one module persists across reload without affecting an unrelated module', async () => {
  const dbName = 'tle-module-disable-' + (++databaseSequence);
  const sourceA = moduleSource('1.0.0');
  const sourceB = moduleSource('1.0.0');
  const entryA = makeEntry('module.a', '1.0.0', sourceA, 'e'.repeat(40));
  const entryB = makeEntry('module.b', '1.0.0', sourceB, 'f'.repeat(40));
  const manifest = makeManifest([entryA, entryB]);
  const sources = new Map([[entryA.source_url, sourceA], [entryB.source_url, sourceB]]);
  const first = createHarness({ manifest, entries: [entryA, entryB], sources, dbName });
  await first.loader.start();
  await first.loader.disable('module.a');
  assert.equal(first.kernel.get('module.a').status, 'registered');
  assert.equal(first.kernel.get('module.b').status, 'active');
  first.loader.destroy();
  first.kernel.destroy();

  const second = createHarness({ manifest, entries: [entryA, entryB], sources, dbName });
  await second.loader.start();
  assert.equal(second.kernel.get('module.a'), null);
  assert.equal(second.kernel.get('module.b').status, 'active');

  second.loader.destroy();
  second.kernel.destroy();
});

test('uninstall removes the module cache and prevents automatic reinstall', async () => {
  const dbName = 'tle-module-uninstall-' + (++databaseSequence);
  const sourceA = moduleSource('1.0.0');
  const sourceB = moduleSource('1.0.0');
  const entryA = makeEntry('module.a', '1.0.0', sourceA, '1'.repeat(40));
  const entryB = makeEntry('module.b', '1.0.0', sourceB, '2'.repeat(40));
  const manifest = makeManifest([entryA, entryB]);
  const sources = new Map([[entryA.source_url, sourceA], [entryB.source_url, sourceB]]);
  const first = createHarness({ manifest, entries: [entryA, entryB], sources, dbName });
  await first.loader.start();
  await first.loader.uninstall('module.a');
  assert.equal(first.kernel.has('module.a'), false);
  assert.equal(first.kernel.get('module.b').status, 'active');
  first.loader.destroy();
  first.kernel.destroy();

  const second = createHarness({ manifest, entries: [entryA, entryB], sources, dbName });
  await second.loader.start();
  assert.equal(second.kernel.has('module.a'), false);
  assert.equal(second.kernel.get('module.b').status, 'active');

  second.loader.destroy();
  second.kernel.destroy();
});

test('a bad hash is isolated to its module while the fallback and other modules stay healthy', async () => {
  const badSource = moduleSource('1.0.0');
  const goodSource = moduleSource('1.0.0');
  const badEntry = makeEntry('module.bad', '1.0.0', badSource, '3'.repeat(40), {
    sha256: '0'.repeat(64),
  });
  const goodEntry = makeEntry('module.good', '1.0.0', goodSource, '4'.repeat(40));
  const log = [];
  const { kernel, loader } = createHarness({
    manifest: makeManifest([badEntry, goodEntry]),
    entries: [badEntry, goodEntry],
    sources: new Map([[badEntry.source_url, badSource], [goodEntry.source_url, goodSource]]),
    fallbackModules: [fallbackDefinition('module.bad', log)],
  });

  await loader.start();
  assert.equal(kernel.get('module.bad').status, 'active');
  assert.equal(kernel.get('module.bad').version, '0.0.0');
  assert.equal(kernel.get('module.good').status, 'active');
  assert.equal(kernel.get('module.good').version, '1.0.0');

  loader.destroy();
  kernel.destroy();
});

test('a cyclic dependency manifest is rejected before any module source executes', async () => {
  const sourceA = moduleSource('1.0.0');
  const sourceB = moduleSource('1.0.0');
  const entryA = makeEntry('module.a', '1.0.0', sourceA, '5'.repeat(40), {
    dependencies: ['module.b'],
  });
  const entryB = makeEntry('module.b', '1.0.0', sourceB, '6'.repeat(40), {
    dependencies: ['module.a'],
  });
  const { kernel, loader } = createHarness({
    manifest: makeManifest([entryA, entryB]),
    entries: [entryA, entryB],
    sources: new Map([[entryA.source_url, sourceA], [entryB.source_url, sourceB]]),
  });

  await loader.start();
  assert.equal(kernel.has('module.a'), false);
  assert.equal(kernel.has('module.b'), false);
  assert.equal(loader.getStatus().manifestLoaded, false);

  loader.destroy();
  kernel.destroy();
});

test('same SemVer cannot silently point to a different immutable source after LKG is established', async () => {
  const dbName = 'tle-module-immutable-' + (++databaseSequence);
  const sourceV1 = moduleSource('1.0.0');
  const entryV1 = makeEntry('pilot', '1.0.0', sourceV1, '7'.repeat(40));
  const first = createHarness({
    manifest: makeManifest([entryV1]),
    entries: [entryV1],
    sources: new Map([[entryV1.source_url, sourceV1]]),
    dbName,
  });
  await first.loader.start();
  first.loader.destroy();
  first.kernel.destroy();

  const mutatedSource = "export default function createModule() { return { api: { version: 'tampered' }, destroy() {} }; }";
  const mutatedEntry = makeEntry('pilot', '1.0.0', mutatedSource, '8'.repeat(40));
  const second = createHarness({
    manifest: makeManifest([mutatedEntry]),
    entries: [mutatedEntry],
    sources: new Map([[mutatedEntry.source_url, mutatedSource]]),
    dbName,
  });
  await second.loader.start();
  assert.equal(second.kernel.get('pilot').version, '1.0.0');
  assert.equal(second.kernel.getAPI('pilot').version, '1.0.0');

  second.loader.destroy();
  second.kernel.destroy();
});


test('manual refresh discovers a new module release and updates only the selected module', async () => {
  const dbName = 'tle-module-manual-update-' + (++databaseSequence);
  const sourceA1 = moduleSource('1.0.0');
  const sourceB1 = moduleSource('1.0.0');
  const entryA1 = makeEntry('module.a', '1.0.0', sourceA1, '9'.repeat(40));
  const entryB1 = makeEntry('module.b', '1.0.0', sourceB1, '8'.repeat(40));
  const responses = new Map([
    [MANIFEST_URL, makeManifest([entryA1, entryB1])],
    [entryA1.source_url, sourceA1],
    [entryB1.source_url, sourceB1],
  ]);
  const kernel = createModuleKernel({ coreVersion: '0.3.304' });
  const loader = createModuleLoader({
    kernel,
    channel: 'test',
    manifestUrl: MANIFEST_URL,
    fetch: async url => responses.has(url)
      ? { ok: true, status: 200, text: async () => responses.get(url) }
      : { ok: false, status: 404, text: async () => '' },
    indexedDB,
    dbName,
    importModule(source) {
      return import('data:text/javascript;charset=utf-8,' + encodeURIComponent(source));
    },
    crypto: {},
  });

  await loader.start();
  assert.equal(kernel.get('module.a').version, '1.0.0');
  assert.equal(kernel.get('module.b').version, '1.0.0');

  const sourceA2 = moduleSource('1.1.0');
  const entryA2 = makeEntry('module.a', '1.1.0', sourceA2, 'a'.repeat(40));
  responses.set(MANIFEST_URL, makeManifest([entryA2, entryB1]));
  responses.set(entryA2.source_url, sourceA2);

  const refreshed = await loader.refresh();
  const refreshedA = refreshed.find(item => item.id === 'module.a');
  assert.equal(refreshedA.version, '1.0.0', 'refresh must not execute or replace a module');
  assert.equal(refreshedA.availableVersion, '1.1.0');

  await loader.update('module.a');
  assert.equal(kernel.get('module.a').version, '1.1.0');
  assert.equal(kernel.getAPI('module.a').version, '1.1.0');
  assert.equal(kernel.get('module.b').status, 'active');
  assert.equal(kernel.get('module.b').version, '1.0.0');
  assert.equal(kernel.getAPI('module.b').version, '1.0.0');

  loader.destroy();
  kernel.destroy();
});


test('nested parent modules cascade safely and re-enable previously active children', async () => {
  const sourceParent = moduleSource('1.0.0');
  const sourceChild = moduleSource('1.0.0');
  const sourceIndependent = moduleSource('1.0.0');
  const entryParent = makeEntry('group.parent', '1.0.0', sourceParent, 'b'.repeat(40), {
    enabled_by_default: false,
  });
  const entryChild = makeEntry('module.child', '1.0.0', sourceChild, 'c'.repeat(40), {
    parent_id: 'group.parent',
  });
  const entryIndependent = makeEntry('module.independent', '1.0.0', sourceIndependent, 'd'.repeat(40));
  const entries = [entryChild, entryParent, entryIndependent];
  const sources = new Map([
    [entryParent.source_url, sourceParent],
    [entryChild.source_url, sourceChild],
    [entryIndependent.source_url, sourceIndependent],
  ]);
  const { kernel, loader } = createHarness({
    manifest: makeManifest(entries),
    entries,
    sources,
  });

  await loader.start();
  assert.equal(kernel.get('group.parent').status, 'active');
  assert.equal(kernel.get('module.child').status, 'active');
  assert.equal(kernel.get('module.independent').status, 'active');

  await loader.disable('group.parent');
  assert.equal(kernel.get('group.parent').status, 'registered');
  assert.equal(kernel.get('module.child').status, 'registered');
  assert.equal(kernel.get('module.independent').status, 'active');
  const disabledRows = await loader.list();
  assert.equal(disabledRows.find(item => item.id === 'group.parent').status, 'disabled');

  await loader.enable('group.parent');
  assert.equal(kernel.get('group.parent').status, 'active');
  assert.equal(kernel.get('module.child').status, 'active');
  assert.equal(kernel.get('module.independent').status, 'active');

  await loader.disable('module.child');
  assert.equal(kernel.get('group.parent').status, 'active');
  assert.equal(kernel.get('module.child').status, 'registered');
  assert.equal(kernel.get('module.independent').status, 'active');
  await assert.rejects(loader.uninstall('group.parent'));

  loader.destroy();
  kernel.destroy();
});

console.log('TLE Module Loader: manifest validation, immutable source verification, IndexedDB LKG, independent lifecycle and rollback isolation passed.');
