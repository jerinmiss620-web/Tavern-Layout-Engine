export function createModuleLoader(options = {}) {
  const PROJECT = 'Tavern Layout Engine';
  const ROOT = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/';
  const ID_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/;
  const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
  const PERMISSION_PATTERN = /^[a-z][a-z0-9-]*(?::[a-z][a-z0-9-]*){0,2}$/;
  const MAX_MANIFEST_BYTES = 256 * 1024;
  const MAX_MODULE_BYTES = 1024 * 1024;
  const channel = options.channel === 'test' ? 'test' : 'stable';
  const kernel = options.kernel;
  if (!kernel || typeof kernel.register !== 'function' || typeof kernel.start !== 'function') {
    throw new Error('[TLE Module Loader] 缺少有效的 Module Kernel。');
  }
  const URLCtor = options.URL || (typeof URL === 'function' ? URL : null);
  const BlobCtor = options.Blob || (typeof Blob === 'function' ? Blob : null);
  const AbortControllerCtor = options.AbortController || (typeof AbortController === 'function' ? AbortController : null);
  const TextEncoderCtor = options.TextEncoder || (typeof TextEncoder === 'function' ? TextEncoder : null);
  const cryptoProvider = options.crypto || (typeof crypto !== 'undefined' ? crypto : null);
  const indexedDBProvider = options.indexedDB || (typeof indexedDB !== 'undefined' ? indexedDB : null);
  const fetcher = options.fetch || (typeof fetch === 'function' ? fetch.bind(globalThis) : null);
  const setTimer = options.setTimeout || (typeof setTimeout === 'function' ? setTimeout : null);
  const clearTimer = options.clearTimeout || (typeof clearTimeout === 'function' ? clearTimeout : null);
  const timeoutMs = Number.isFinite(options.timeoutMs) ? Math.max(1000, options.timeoutMs) : 15000;
  const dbName = String(options.dbName || 'TLE_Core_Module_Cache');
  const dbVersion = 1;
  const fallbackDefinitions = new Map();
  const loadedDefinitions = new Map();
  const memory = {
    modules: new Map(),
    manifests: new Map(),
    states: new Map(),
  };
  const controller = AbortControllerCtor ? new AbortControllerCtor() : null;
  let dbPromise = null;
  let dbInstance = null;
  let persistentCache = false;
  let destroyed = false;
  let started = false;
  let startPromise = null;
  let operationQueue = Promise.resolve();
  let currentManifest = null;
  let lastError = null;

  const manifestUrl = String(options.manifestUrl || (
    channel === 'test'
      ? ROOT + 'feature/core-module-kernel-v0.3.304-20261128/modules/test.json'
      : ROOT + 'main/modules/stable.json'
  ));

  function report(error, details = {}) {
    const normalized = error instanceof Error ? error : new Error(String(error));
    lastError = {
      message: String(normalized.message || normalized).slice(0, 1200),
      details,
      at: new Date().toISOString(),
    };
    try { options.onError?.(normalized, details); } catch {}
  }

  function assertAlive() {
    if (destroyed) throw new Error('[TLE Module Loader] Loader 已销毁。');
  }

  function enqueue(task) {
    const pending = operationQueue.then(task, task);
    operationQueue = pending.catch(() => undefined);
    return pending;
  }

  function encodeUtf8(value) {
    if (TextEncoderCtor) return new TextEncoderCtor().encode(value);
    const binary = unescape(encodeURIComponent(value));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function sha256Fallback(bytes) {
    const K = [
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
      0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
      0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
      0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
      0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
      0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
    ];
    const H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
    const bitLength = bytes.length * 8;
    const paddedLength = Math.ceil((bytes.length + 9) / 64) * 64;
    const data = new Uint8Array(paddedLength);
    data.set(bytes);
    data[bytes.length] = 0x80;
    for (let i = 0; i < 8; i++) data[paddedLength - 1 - i] = Math.floor(bitLength / (2 ** (8 * i))) & 0xff;
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));
    for (let offset = 0; offset < paddedLength; offset += 64) {
      for (let i = 0; i < 16; i++) {
        const j = offset + i * 4;
        w[i] = ((data[j] << 24) | (data[j + 1] << 16) | (data[j + 2] << 8) | data[j + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const x = w[i - 15], y = w[i - 2];
        const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let a=H[0],b=H[1],c=H[2],d=H[3],e=H[4],f=H[5],g=H[6],h=H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h=g; g=f; f=e; e=(d+t1)>>>0; d=c; c=b; b=a; a=(t1+t2)>>>0;
      }
      H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
    }
    return H.map(value => value.toString(16).padStart(8, '0')).join('');
  }

  async function sha256(source) {
    const bytes = encodeUtf8(source);
    if (cryptoProvider?.subtle?.digest) {
      try {
        const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        const digest = await cryptoProvider.subtle.digest('SHA-256', buffer);
        return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        report(error, { type: 'sha256-webcrypto-fallback' });
      }
    }
    return sha256Fallback(bytes);
  }

  function validateManifestUrl() {
    if (!URLCtor) throw new Error('当前宿主缺少 URL API。');
    const url = new URLCtor(manifestUrl);
    if (url.protocol !== 'https:' || url.origin !== 'https://raw.githubusercontent.com' ||
        url.username || url.password || url.search || url.hash) {
      throw new Error('Manifest URL 必须来自受信任的 GitHub Raw HTTPS 地址。');
    }
    const match = /^\/jerinmiss620-web\/Tavern-Layout-Engine\/(main|[a-f0-9]{40}|feature\/[A-Za-z0-9._-]+)\/modules\/(stable|test)\.json$/.exec(url.pathname);
    if (!match || match[2] !== channel) throw new Error('Manifest URL 路径与仓库或更新通道不匹配。');
    return url.href;
  }

  function validateEntry(input, ids) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('模块清单条目必须是对象。');
    const id = String(input.id || '');
    const name = String(input.name || '');
    const version = String(input.version || '');
    const apiVersion = Number(input.api_version);
    const settingsSchemaVersion = Number(input.settings_schema_version);
    const sourceCommit = String(input.source_commit || '');
    const sourcePath = String(input.source_path || '');
    const sourceUrl = String(input.source_url || '');
    const hash = String(input.sha256 || '');
    const sizeBytes = Number(input.size_bytes);
    const parentId = input.parent_id === null ? null : String(input.parent_id || '');
    const dependencies = input.dependencies;
    const permissions = input.permissions;
    if (!ID_PATTERN.test(id) || ids.has(id)) throw new Error('模块 ID 无效或重复：' + id);
    if (!name || name.length > 100) throw new Error('模块名称无效：' + id);
    if (!VERSION_PATTERN.test(version)) throw new Error('模块 SemVer 无效：' + id);
    if (!Number.isInteger(apiVersion) || apiVersion < 1 || apiVersion > kernel.apiVersion) {
      throw new Error('模块 Core API 版本不兼容：' + id);
    }
    if (!Number.isInteger(settingsSchemaVersion) || settingsSchemaVersion < 1) {
      throw new Error('模块设置 Schema 版本无效：' + id);
    }
    if (!/^[a-f0-9]{40}$/.test(sourceCommit)) throw new Error('模块 Commit 必须是完整的 40 位 SHA：' + id);
    if (!sourcePath || sourcePath.startsWith('/') || sourcePath.includes('\\') ||
        !/^[A-Za-z0-9._/-]+$/.test(sourcePath) ||
        sourcePath.split('/').some(part => !part || part === '.' || part === '..')) {
      throw new Error('模块源码路径无效：' + id);
    }
    if (hash !== hash.toLowerCase() || !/^[a-f0-9]{64}$/.test(hash)) throw new Error('模块 SHA-256 格式无效：' + id);
    if (!Number.isSafeInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > MAX_MODULE_BYTES) {
      throw new Error('模块源码字节数超出限制：' + id);
    }
    if (parentId !== null && !ID_PATTERN.test(parentId)) throw new Error('模块父级 ID 无效：' + id);
    if (!Array.isArray(dependencies) || !Array.isArray(permissions)) throw new Error('模块依赖与权限必须是数组：' + id);
    if (dependencies.some(value => typeof value !== 'string' || !ID_PATTERN.test(value) || value === id) ||
        new Set(dependencies).size !== dependencies.length) throw new Error('模块依赖列表无效：' + id);
    if (permissions.some(value => typeof value !== 'string' || !PERMISSION_PATTERN.test(value)) ||
        new Set(permissions).size !== permissions.length) throw new Error('模块权限列表无效：' + id);
    if (typeof input.enabled_by_default !== 'boolean') throw new Error('模块 enabled_by_default 必须是布尔值：' + id);
    const expectedUrl = ROOT + sourceCommit + '/' + sourcePath;
    if (sourceUrl !== expectedUrl) throw new Error('模块源码 URL 必须精确绑定 Commit 与路径：' + id);
    const parsedUrl = new URLCtor(sourceUrl);
    if (parsedUrl.protocol !== 'https:' || parsedUrl.origin !== 'https://raw.githubusercontent.com' ||
        parsedUrl.username || parsedUrl.password || parsedUrl.search || parsedUrl.hash) {
      throw new Error('模块源码 URL 来源无效：' + id);
    }
    return {
      id, name, version, apiVersion, settingsSchemaVersion,
      sourceCommit, sourcePath, sourceUrl, sha256: hash, sizeBytes,
      parentId, dependencies: [...dependencies], permissions: [...permissions],
      enabledByDefault: input.enabled_by_default,
    };
  }

  function validateManifest(raw) {
    if (typeof raw !== 'string' || encodeUtf8(raw).byteLength > MAX_MANIFEST_BYTES) {
      throw new Error('Manifest 缺失或超过大小限制。');
    }
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data) ||
        data.schema_version !== 1 || data.project !== PROJECT ||
        data.channel !== channel || !Number.isInteger(data.core_api_version) ||
        data.core_api_version < 1 || data.core_api_version > kernel.apiVersion ||
        !Array.isArray(data.modules) || data.modules.length > 100) {
      throw new Error('Manifest 结构、通道或 Core API 版本不兼容。');
    }
    const ids = new Set();
    const entries = data.modules.map(item => {
      const entry = validateEntry(item, ids);
      if (entry.apiVersion > data.core_api_version) {
        throw new Error('模块 API 版本不能高于 Manifest 声明的 Core API 版本：' + entry.id);
      }
      ids.add(entry.id);
      return entry;
    });
    const byId = new Map(entries.map(entry => [entry.id, entry]));
    const order = [];
    const visited = new Set();
    const visiting = new Set();
    function visit(id) {
      if (visited.has(id)) return;
      if (visiting.has(id)) throw new Error('Manifest 存在模块依赖环：' + id);
      const entry = byId.get(id);
      if (!entry) throw new Error('Manifest 引用了不存在的模块：' + id);
      visiting.add(id);
      const references = [entry.parentId, ...entry.dependencies].filter(Boolean);
      for (const reference of references) {
        if (!byId.has(reference)) throw new Error('模块 ' + id + ' 引用了未列入 Manifest 的依赖：' + reference);
        visit(reference);
      }
      visiting.delete(id);
      visited.add(id);
      order.push(entry);
    }
    for (const entry of entries) visit(entry.id);
    return {
      schemaVersion: 1,
      channel,
      coreApiVersion: data.core_api_version,
      entries,
      byId,
      order,
      raw,
    };
  }

  async function openDatabase() {
    if (!indexedDBProvider?.open || destroyed) return null;
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDBProvider.open(dbName, dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('modules')) db.createObjectStore('modules', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('manifests')) db.createObjectStore('manifests', { keyPath: 'key' });
        if (!db.objectStoreNames.contains('states')) db.createObjectStore('states', { keyPath: 'key' });
      };
      request.onsuccess = () => {
        dbInstance = request.result;
        dbInstance.onversionchange = () => dbInstance?.close();
        persistentCache = true;
        resolve(dbInstance);
      };
      request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败。'));
      request.onblocked = () => reject(new Error('IndexedDB 被其他页面阻塞。'));
    }).catch(error => {
      report(error, { type: 'indexeddb-open' });
      dbPromise = null;
      return null;
    });
    return dbPromise;
  }

  async function idbRequest(storeName, mode, operation, key, value) {
    const db = await openDatabase();
    if (!db) return undefined;
    return new Promise((resolve, reject) => {
      let result;
      let request;
      const transaction = db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      try {
        if (operation === 'get') request = store.get(key);
        else if (operation === 'put') request = store.put(value);
        else if (operation === 'delete') request = store.delete(key);
        else if (operation === 'getAll') request = store.getAll();
        else throw new Error('未知 IndexedDB 操作：' + operation);
      } catch (error) {
        reject(error);
        return;
      }
      request.onsuccess = () => { result = request.result; };
      request.onerror = () => reject(request.error || new Error('IndexedDB 请求失败。'));
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB 事务失败。'));
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB 事务中止。'));
    });
  }

  async function storeGet(storeName, key) {
    try {
      const value = await idbRequest(storeName, 'readonly', 'get', key);
      if (value !== undefined) return value || null;
    } catch (error) {
      report(error, { type: 'indexeddb-read', store: storeName });
    }
    return memory[storeName].get(key) || null;
  }

  async function storePut(storeName, record) {
    memory[storeName].set(record.key, record);
    try { await idbRequest(storeName, 'readwrite', 'put', null, record); }
    catch (error) { report(error, { type: 'indexeddb-write', store: storeName }); }
    return true;
  }

  async function storeDelete(storeName, key) {
    memory[storeName].delete(key);
    try { await idbRequest(storeName, 'readwrite', 'delete', key); }
    catch (error) { report(error, { type: 'indexeddb-delete', store: storeName }); }
  }

  async function storeGetAll(storeName) {
    try {
      const values = await idbRequest(storeName, 'readonly', 'getAll');
      if (Array.isArray(values)) {
        for (const value of values) memory[storeName].set(value.key, value);
        return values;
      }
    } catch (error) {
      report(error, { type: 'indexeddb-list', store: storeName });
    }
    return [...memory[storeName].values()];
  }

  function stateKey(id) {
    return channel + ':' + id;
  }

  function moduleKey(id, version) {
    return channel + ':' + id + ':' + version;
  }

  async function readState(id) {
    return (await storeGet('states', stateKey(id))) || {
      key: stateKey(id), channel, id, installed: null, disabled: false,
      activeVersion: null, lastKnownGoodVersion: null, lastKnownGoodSha256: null,
      lastKnownGoodCommit: null, previousVersion: null, pendingVersion: null, updatedAt: null,
    };
  }

  async function writeState(id, patch) {
    const previous = await readState(id);
    const next = { ...previous, ...patch, key: stateKey(id), channel, id, updatedAt: new Date().toISOString() };
    await storePut('states', next);
    return next;
  }

  async function fetchText(url, maxBytes) {
    assertAlive();
    if (!fetcher) throw new Error('当前宿主没有 fetch API。');
    if (!AbortControllerCtor || !controller) throw new Error('当前宿主缺少 AbortController。');
    const requestController = new AbortControllerCtor();
    const abort = () => requestController.abort();
    controller.signal.addEventListener('abort', abort, { once: true });
    let timedOut = false;
    const timer = setTimer ? setTimer(() => { timedOut = true; requestController.abort(); }, timeoutMs) : null;
    try {
      const response = await fetcher(url, {
        method: 'GET', cache: 'no-store', credentials: 'omit',
        redirect: 'follow', signal: requestController.signal,
      });
      if (!response?.ok) throw new Error('HTTP ' + (response?.status || 'network error'));
      const body = await response.text();
      assertAlive();
      if (timedOut) throw new Error('模块下载超时。');
      const size = encodeUtf8(body).byteLength;
      if (size > maxBytes) throw new Error('下载内容超过大小限制：' + size);
      return body;
    } finally {
      if (timer !== null && clearTimer) clearTimer(timer);
      controller.signal.removeEventListener('abort', abort);
    }
  }

  async function verifySource(entry, source) {
    if (typeof source !== 'string') throw new Error('模块源码不是文本：' + entry.id);
    const bytes = encodeUtf8(source);
    if (bytes.byteLength !== entry.sizeBytes) {
      throw new Error('模块字节数不匹配：' + entry.id + '，期望 ' + entry.sizeBytes + '，实际 ' + bytes.byteLength);
    }
    const actual = await sha256(source);
    if (actual !== entry.sha256) throw new Error('模块 SHA-256 校验失败：' + entry.id);
    if (/^\s*import\s/m.test(source)) throw new Error('独立模块必须是自包含源码，不能包含静态 import：' + entry.id);
    return true;
  }

  async function getCachedModule(entry) {
    const key = moduleKey(entry.id, entry.version);
    const cached = await storeGet('modules', key);
    if (!cached) return null;
    if (cached.sha256 !== entry.sha256 || cached.sourceCommit !== entry.sourceCommit ||
        cached.sizeBytes !== entry.sizeBytes) {
      throw new Error('模块版本已绑定不同源码摘要，拒绝覆盖不可变版本：' + entry.id + '@' + entry.version);
    }
    try {
      await verifySource(entry, cached.source);
      return cached;
    } catch (error) {
      report(error, { type: 'module-cache-corrupt', id: entry.id, version: entry.version });
      await storeDelete('modules', key);
      return null;
    }
  }

  async function downloadModule(entry) {
    const state = await readState(entry.id);
    if (state.lastKnownGoodVersion === entry.version &&
        ((state.lastKnownGoodSha256 && state.lastKnownGoodSha256 !== entry.sha256) ||
         (state.lastKnownGoodCommit && state.lastKnownGoodCommit !== entry.sourceCommit))) {
      throw new Error('已发布模块版本不可变；相同 SemVer 不允许更换 Commit 或摘要：' + entry.id + '@' + entry.version);
    }
    const cached = await getCachedModule(entry);
    if (cached) return cached;
    const source = await fetchText(entry.sourceUrl, MAX_MODULE_BYTES);
    await verifySource(entry, source);
    const record = {
      key: moduleKey(entry.id, entry.version),
      channel,
      id: entry.id,
      version: entry.version,
      sourceCommit: entry.sourceCommit,
      sha256: entry.sha256,
      sizeBytes: entry.sizeBytes,
      entry,
      source,
      verifiedAt: new Date().toISOString(),
    };
    await storePut('modules', record);
    return record;
  }

  async function getLastKnownGood(id) {
    const state = await readState(id);
    if (!state.lastKnownGoodVersion) return null;
    const cached = await storeGet('modules', moduleKey(id, state.lastKnownGoodVersion));
    if (!cached?.entry || typeof cached.source !== 'string') return null;
    if ((state.lastKnownGoodSha256 && cached.sha256 !== state.lastKnownGoodSha256) ||
        (state.lastKnownGoodCommit && cached.sourceCommit !== state.lastKnownGoodCommit)) return null;
    try {
      await verifySource(cached.entry, cached.source);
      return cached;
    } catch (error) {
      report(error, { type: 'module-lkg-corrupt', id, version: state.lastKnownGoodVersion });
      await storeDelete('modules', cached.key);
      return null;
    }
  }

  async function importSource(source) {
    assertAlive();
    if (typeof options.importModule === 'function') return options.importModule(source);
    if (!BlobCtor || !URLCtor?.createObjectURL || !URLCtor?.revokeObjectURL) {
      throw new Error('当前宿主不支持经过校验的 Blob 模块加载。');
    }
    const blob = new BlobCtor([source], { type: 'text/javascript' });
    const objectUrl = URLCtor.createObjectURL(blob);
    try {
      return await import(objectUrl);
    } finally {
      URLCtor.revokeObjectURL(objectUrl);
    }
  }

  function makeDefinition(entry, factory) {
    if (typeof factory !== 'function') throw new Error('模块必须导出 default factory：' + entry.id);
    return {
      id: entry.id,
      name: entry.name,
      version: entry.version,
      apiVersion: entry.apiVersion,
      parentId: entry.parentId,
      dependencies: [...entry.dependencies],
      permissions: [...entry.permissions],
      settingsSchemaVersion: entry.settingsSchemaVersion,
      enabledByDefault: entry.enabledByDefault,
      init(context) {
        return factory(context);
      },
    };
  }

  async function activate(entry, source) {
    assertAlive();
    const namespace = await importSource(source);
    const factory = namespace?.default || namespace?.createTLEModule;
    const definition = makeDefinition(entry, factory);
    const current = kernel.get(entry.id);
    const previousDefinition = loadedDefinitions.get(entry.id) || fallbackDefinitions.get(entry.id);
    const previousVersion = current?.version || null;
    if (current?.status === 'active') {
      await kernel.replace(definition);
    } else if (current) {
      await kernel.replace(definition);
      try {
        await kernel.start(entry.id);
      } catch (error) {
        if (previousDefinition) {
          try {
            await kernel.replace(previousDefinition);
            await kernel.start(entry.id);
          } catch (rollbackError) {
            report(rollbackError, { type: 'module-inactive-replace-rollback', id: entry.id });
          }
        }
        throw error;
      }
    } else {
      kernel.register(definition);
      try {
        await kernel.start(entry.id);
      } catch (error) {
        try { await kernel.unregister(entry.id); } catch {}
        throw error;
      }
    }
    loadedDefinitions.set(entry.id, definition);
    const state = await readState(entry.id);
    await writeState(entry.id, {
      installed: true,
      disabled: false,
      activeVersion: entry.version,
      previousVersion: state.lastKnownGoodVersion || previousVersion,
      lastKnownGoodVersion: entry.version,
      lastKnownGoodSha256: entry.sha256,
      lastKnownGoodCommit: entry.sourceCommit,
      pendingVersion: null,
    });
    return kernel.get(entry.id);
  }

  async function activateFallback(definition) {
    if (typeof definition.init !== 'function') throw new Error('内置回退模块缺少 init：' + definition.id);
    const state = await readState(definition.id);
    if (state.disabled || state.installed === false) return;
    if (!kernel.has(definition.id)) kernel.register(definition);
    loadedDefinitions.set(definition.id, definition);
    const current = kernel.get(definition.id);
    if (current?.status !== 'active') await kernel.start(definition.id);
    await writeState(definition.id, {
      installed: true,
      activeVersion: definition.version,
    });
  }

  async function loadManifest() {
    let networkError = null;
    try {
      const raw = await fetchText(manifestUrl, MAX_MANIFEST_BYTES);
      const parsed = validateManifest(raw);
      currentManifest = parsed;
      await storePut('manifests', {
        key: channel, channel, raw, verifiedAt: new Date().toISOString(),
      });
      return parsed;
    } catch (error) {
      networkError = error;
      report(error, { type: 'manifest-download-or-validation' });
    }
    const cached = await storeGet('manifests', channel);
    if (cached?.raw) {
      try {
        const parsed = validateManifest(cached.raw);
        currentManifest = parsed;
        return parsed;
      } catch (error) {
        report(error, { type: 'manifest-cache-invalid' });
      }
    }
    throw networkError || new Error('没有可用的 Manifest。');
  }

  async function computeDesired(parsed) {
    const desired = new Set();
    const visiting = new Set();
    const blocked = new Set();
    async function include(id) {
      if (desired.has(id)) return true;
      if (visiting.has(id)) throw new Error('模块依赖环：' + id);
      const entry = parsed.byId.get(id);
      if (!entry) return false;
      const state = await readState(id);
      if (state.disabled || state.installed === false) {
        blocked.add(id);
        return false;
      }
      visiting.add(id);
      const references = [entry.parentId, ...entry.dependencies].filter(Boolean);
      for (const reference of references) {
        if (!await include(reference)) {
          visiting.delete(id);
          blocked.add(id);
          return false;
        }
      }
      visiting.delete(id);
      desired.add(id);
      return true;
    }
    for (const entry of parsed.entries) {
      const state = await readState(entry.id);
      if (entry.enabledByDefault || state.installed === true) await include(entry.id);
    }
    return { desired, blocked };
  }

  async function activateLastKnownGood(id) {
    const cached = await getLastKnownGood(id);
    if (!cached) return false;
    const current = kernel.get(id);
    if (current?.status === 'active' && current.version === cached.version) return true;
    await activate(cached.entry, cached.source);
    return true;
  }

  async function startInternal() {
    assertAlive();
    for (const definition of fallbackDefinitions.values()) {
      try { await activateFallback(definition); }
      catch (error) { report(error, { type: 'fallback-start', id: definition.id }); }
    }
    let parsed;
    try {
      parsed = await loadManifest();
    } catch (error) {
      report(error, { type: 'manifest-unavailable' });
      return list();
    }
    const { desired } = await computeDesired(parsed);
    for (const entry of parsed.order) {
      if (!desired.has(entry.id)) continue;
      const before = kernel.get(entry.id);
      const state = await readState(entry.id);
      if (before?.status === 'active' && before.version === entry.version &&
          state.lastKnownGoodVersion === entry.version) continue;
      try {
        const record = await downloadModule(entry);
        await activate(entry, record.source);
      } catch (error) {
        report(error, { type: 'module-update', id: entry.id, version: entry.version });
        const after = kernel.get(entry.id);
        if (after?.status !== 'active') {
          try {
            if (!await activateLastKnownGood(entry.id)) {
              const fallback = fallbackDefinitions.get(entry.id);
              if (fallback) await activateFallback(fallback);
            }
          } catch (rollbackError) {
            report(rollbackError, { type: 'module-lkg-restore', id: entry.id });
          }
        } else {
          try { await activateLastKnownGood(entry.id); }
          catch (rollbackError) { report(rollbackError, { type: 'module-lkg-restore', id: entry.id }); }
        }
      }
    }
    for (const definition of fallbackDefinitions.values()) {
      if (parsed.byId.has(definition.id) && !desired.has(definition.id)) {
        const current = kernel.get(definition.id);
        if (current?.status === 'active') {
          try { await kernel.stop(definition.id); } catch (error) {
            report(error, { type: 'fallback-disabled-by-manifest', id: definition.id });
          }
        }
      }
    }
    return list();
  }

  async function updateInternal(id, refreshManifest = true) {
    assertAlive();
    if (refreshManifest || !currentManifest) await loadManifest();
    const entry = currentManifest?.byId.get(String(id));
    if (!entry) throw new Error('当前 Manifest 中不存在模块：' + id);
    const state = await readState(entry.id);
    const current = kernel.get(entry.id);
    if (state.installed === false || (!entry.enabledByDefault && state.installed !== true && current?.status !== 'active')) {
      throw new Error('模块尚未安装，请先启用：' + id);
    }
    if (current?.status === 'active' && current.version === entry.version &&
        state.lastKnownGoodVersion === entry.version) return current;
    const record = await downloadModule(entry);
    if (state.disabled || current?.status !== 'active') {
      await writeState(entry.id, { installed: true, pendingVersion: entry.version });
      return { pending: true, id: entry.id, version: entry.version };
    }
    return activate(entry, record.source);
  }

  async function enableInternal(id, stack = new Set(), isDependency = false, refreshManifest = true) {
    assertAlive();
    if (refreshManifest || !currentManifest) {
      try { await loadManifest(); } catch {}
    }
    const normalizedId = String(id);
    if (stack.has(normalizedId)) throw new Error('启用模块时检测到依赖环：' + normalizedId);
    stack.add(normalizedId);
    try {
      const state = await readState(normalizedId);
      if (isDependency && (state.disabled || state.installed === false)) {
        throw new Error('模块依赖当前被停用或已卸载：' + normalizedId);
      }
      const entry = currentManifest?.byId.get(normalizedId);
      if (entry) {
        const references = [entry.parentId, ...entry.dependencies].filter(Boolean);
        for (const dependencyId of references) {
          await enableInternal(dependencyId, stack, true, false);
        }
      }
      await writeState(normalizedId, { installed: true, disabled: false });
      const current = kernel.get(normalizedId);
      if (current?.status === 'active') return current;
      if (entry) {
        try {
          const record = await downloadModule(entry);
          return await activate(entry, record.source);
        } catch (error) {
          report(error, { type: 'module-enable', id: normalizedId });
          if (await activateLastKnownGood(normalizedId)) return kernel.get(normalizedId);
          const fallback = fallbackDefinitions.get(normalizedId);
          if (fallback) {
            await activateFallback(fallback);
            return kernel.get(normalizedId);
          }
          throw error;
        }
      }
      const fallback = fallbackDefinitions.get(normalizedId);
      if (!fallback) throw new Error('找不到可启用的模块：' + normalizedId);
      await activateFallback(fallback);
      return kernel.get(normalizedId);
    } finally {
      stack.delete(normalizedId);
    }
  }

  function isDependentOn(id, targetId, visited = new Set()) {
    if (id === targetId || visited.has(id)) return false;
    visited.add(id);
    const entry = currentManifest?.byId.get(id);
    if (!entry) return false;
    const references = [entry.parentId, ...entry.dependencies].filter(Boolean);
    if (references.includes(targetId)) return true;
    return references.some(reference => isDependentOn(reference, targetId, visited));
  }

  async function restartPreviouslyActiveDependents(targetId) {
    if (!currentManifest) return;
    for (const entry of currentManifest.order) {
      if (entry.id === targetId || !isDependentOn(entry.id, targetId)) continue;
      const state = await readState(entry.id);
      const runtime = kernel.get(entry.id);
      if (state.installed !== true || state.disabled || !state.activeVersion ||
          runtime?.status === 'active') continue;
      try {
        await enableInternal(entry.id, new Set(), false, false);
      } catch (error) {
        report(error, { type: 'module-dependent-restart', id: entry.id, dependency: targetId });
      }
    }
  }

  async function disableInternal(id) {
    assertAlive();
    const normalizedId = String(id);
    if (kernel.has(normalizedId)) await kernel.stop(normalizedId);
    await writeState(normalizedId, { installed: true, disabled: true, activeVersion: null });
    return true;
  }

  async function uninstallInternal(id) {
    assertAlive();
    const normalizedId = String(id);
    if (kernel.has(normalizedId)) await kernel.unregister(normalizedId);
    const records = await storeGetAll('modules');
    for (const record of records) {
      if (record.channel === channel && record.id === normalizedId) {
        await storeDelete('modules', record.key);
      }
    }
    await writeState(normalizedId, {
      installed: false,
      disabled: true,
      activeVersion: null,
      lastKnownGoodVersion: null,
      lastKnownGoodSha256: null,
      lastKnownGoodCommit: null,
      previousVersion: null,
      pendingVersion: null,
    });
    loadedDefinitions.delete(normalizedId);
    return true;
  }

  async function updateAllInternal() {
    assertAlive();
    await loadManifest();
    const { desired } = await computeDesired(currentManifest);
    const results = [];
    for (const entry of currentManifest.order) {
      if (!desired.has(entry.id)) continue;
      try { results.push({ id: entry.id, result: await updateInternal(entry.id, false) }); }
      catch (error) {
        report(error, { type: 'module-update-all', id: entry.id });
        results.push({ id: entry.id, error: String(error.message || error) });
      }
    }
    return results;
  }

  function list() {
    const ids = new Set([
      ...fallbackDefinitions.keys(),
      ...(currentManifest?.entries || []).map(entry => entry.id),
      ...kernel.list().map(item => item.id),
    ]);
    return Promise.all([...ids].map(async id => {
      const state = await readState(id);
      const runtime = kernel.get(id);
      const entry = currentManifest?.byId.get(id);
      return {
        id,
        name: entry?.name || runtime?.name || fallbackDefinitions.get(id)?.name || id,
        version: runtime?.version || entry?.version || fallbackDefinitions.get(id)?.version || null,
        availableVersion: entry?.version || null,
        status: state.installed === false ? 'uninstalled' : (state.disabled ? 'disabled' : (runtime?.status || 'not-loaded')),
        installed: state.installed === true || Boolean(runtime) ||
          (fallbackDefinitions.has(id) && state.installed !== false),
        enabled: !state.disabled && runtime?.status === 'active',
        lastKnownGoodVersion: state.lastKnownGoodVersion,
        previousVersion: state.previousVersion,
        pendingVersion: state.pendingVersion,
        error: runtime?.error || null,
      };
    }));
  }

  function getStatus() {
    return {
      channel,
      started,
      destroyed,
      persistentCache,
      manifestLoaded: Boolean(currentManifest),
      moduleCount: currentManifest?.entries.length || 0,
      lastError,
    };
  }

  function start() {
    assertAlive();
    if (startPromise) return startPromise;
    started = true;
    startPromise = enqueue(startInternal).catch(error => {
      startPromise = null;
      throw error;
    });
    return startPromise;
  }

  function refresh() {
    return enqueue(async () => {
      await loadManifest();
      return list();
    });
  }

  function update(id) {
    return enqueue(() => updateInternal(id, true));
  }

  function updateAll() {
    return enqueue(updateAllInternal);
  }

  function enable(id) {
    return enqueue(async () => {
      const result = await enableInternal(id);
      await restartPreviouslyActiveDependents(String(id));
      return result;
    });
  }

  function disable(id) {
    return enqueue(() => disableInternal(id));
  }

  function uninstall(id) {
    return enqueue(() => uninstallInternal(id));
  }

  function destroy() {
    if (destroyed) return false;
    destroyed = true;
    try { controller?.abort(); } catch {}
    try { dbInstance?.close(); } catch {}
    dbInstance = null;
    return true;
  }

  const fallbacks = Array.isArray(options.fallbackModules) ? options.fallbackModules : [];
  for (const definition of fallbacks) {
    if (!definition?.id || fallbackDefinitions.has(String(definition.id))) {
      throw new Error('[TLE Module Loader] 内置回退模块 ID 缺失或重复。');
    }
    fallbackDefinitions.set(String(definition.id), definition);
  }
  validateManifestUrl();

  return Object.freeze({
    channel,
    start,
    refresh,
    update,
    updateAll,
    enable,
    disable,
    uninstall,
    list,
    getStatus,
    destroy,
  });
}
