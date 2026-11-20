(() => {
  'use strict';

  // Tavern Layout Engine · Remote Loader TEST 0.2.1
  // This test loader never updates silently. The production TLE script remains separate.

  const SCRIPT_WIN = window;
  let HOST_WIN;
  let HOST_DOC;

  try {
    HOST_WIN = SCRIPT_WIN.parent;
    HOST_DOC = HOST_WIN.document;
    if (!HOST_DOC?.documentElement || !HOST_DOC.body) {
      throw new Error('无法访问酒馆宿主页面');
    }
  } catch (error) {
    console.error('[TLE Loader TEST] 无法访问宿主页面。', error);
    return;
  }

  const LOADER_VERSION = '0.2.1';
  const PROJECT = 'Tavern Layout Engine';
  const CHANNEL = 'test';
  const MANIFEST_URL = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/main/channels/test.json';
  const INSTANCE_KEY = '__TAVERN_LAYOUT_ENGINE_V02__';
  const LOADER_KEY = '__TLE_REMOTE_LOADER_TEST_V1__';
  const LKG_KEY = 'tle.loader.test.lastKnownGood.v1';
  const PREVIOUS_KEY = 'tle.loader.test.previousKnownGood.v1';
  const AUTO_RESTORE_KEY = 'tle.loader.test.autoRestore.v1';
  const AUTO_RESTORE_DELAY = 900;
  const PROBE_KEY = '__TLE_REMOTE_LOADER_MODULE_PROBE__';
  const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
  const CACHE_DB_NAME = 'TLE_Remote_Loader_Test_Cache';
  const CACHE_DB_VERSION = 1;
  const CACHE_STORE_NAME = 'records';
  let cacheDbPromise = null;
  const cacheFlags = { lkg: false, previous: false };

  const previousLoader = HOST_WIN[LOADER_KEY];
  previousLoader?.destroy?.();

  const controller = new SCRIPT_WIN.AbortController();
  let candidate = null;
  let busy = false;
  let moduleProbePassed = false;
  let startupConflict = false;
  let closed = false;

  const panel = HOST_DOC.createElement('section');
  panel.id = 'tle-remote-loader-test-panel';
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', 'TLE Remote Loader test panel');
  panel.style.cssText = [
    'position:fixed!important',
    'right:16px!important',
    'bottom:16px!important',
    'z-index:2147483000!important',
    'width:min(360px,calc(100vw - 32px))!important',
    'max-height:calc(100dvh - 32px)!important',
    'overflow:auto!important',
    'box-sizing:border-box!important',
    'padding:14px!important',
    'border:1px solid rgba(150,150,150,.42)!important',
    'border-radius:12px!important',
    'background:rgba(24,25,29,.97)!important',
    'color:#f2f2f2!important',
    'font:13px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif!important',
    'box-shadow:0 8px 28px rgba(0,0,0,.28)!important',
    'backdrop-filter:blur(12px)!important',
  ].join(';');

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px">
      <strong style="font-size:14px;letter-spacing:.02em">TLE Remote Loader <span style="color:#d6a96a;font-size:11px">TEST 0.2.1</span></strong>
      <button type="button" data-action="close" aria-label="关闭" style="border:0;background:transparent;color:#bbb;font-size:20px;line-height:1;cursor:pointer;padding:0 3px">×</button>
    </div>
    <div data-status style="padding:9px 10px;border-radius:8px;background:rgba(255,255,255,.07);white-space:pre-wrap;overflow-wrap:anywhere">Loader 正在启动……</div>
    <div data-meta style="margin:8px 0 10px;color:#b8b8b8;font-size:11px;white-space:pre-wrap">Loader ${LOADER_VERSION} · channel ${CHANNEL}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
      <button type="button" data-action="check">检查更新</button>
      <button type="button" data-action="probe">测试模块加载</button>
      <button type="button" data-action="load" style="grid-column:1/-1">确认加载新版 TLE</button>
      <button type="button" data-action="rollback" style="grid-column:1/-1">恢复上一版本</button>
      <button type="button" data-action="autoRestore" style="grid-column:1/-1">关闭自动恢复</button>
    </div>
    <div style="margin-top:9px;color:#999;font-size:10px">大体积源码优先保存在 IndexedDB；localStorage 仅保留小型索引。升级前先验证回滚备份；缓存写入失败不会误判健康的新版本启动失败。请保持旧版本地 TLE 脚本禁用，不要删除备份。</div>
  `;

  const statusNode = panel.querySelector('[data-status]');
  const metaNode = panel.querySelector('[data-meta]');
  const buttons = Object.fromEntries(
    [...panel.querySelectorAll('button[data-action]')].map(button => [button.dataset.action, button])
  );

  for (const button of Object.values(buttons)) {
    button.style.cssText = [
      'min-height:34px',
      'padding:7px 9px',
      'border:1px solid rgba(255,255,255,.18)',
      'border-radius:7px',
      'background:rgba(255,255,255,.09)',
      'color:#f2f2f2',
      'font:inherit',
      'cursor:pointer',
    ].join(';');
  }
  buttons.close.style.background = 'transparent';
  buttons.close.style.border = '0';
  buttons.close.style.minHeight = 'auto';
  buttons.close.style.fontSize = '20px';
  buttons.close.style.padding = '0 3px';

  HOST_DOC.body.appendChild(panel);

  function setStatus(message, kind = 'info') {
    if (closed || !statusNode.isConnected) return;
    statusNode.textContent = message;
    const colors = {
      info: 'rgba(255,255,255,.07)',
      success: 'rgba(57,145,103,.20)',
      warning: 'rgba(190,137,54,.20)',
      error: 'rgba(190,70,70,.20)',
    };
    statusNode.style.background = colors[kind] || colors.info;
  }

  function setMeta(message) {
    if (!closed && metaNode.isConnected) metaNode.textContent = message;
  }

  function setBusy(value) {
    busy = value;
    for (const [name, button] of Object.entries(buttons)) {
      if (name !== 'close') button.disabled = value;
      if (name !== 'close') button.style.opacity = value ? '.55' : '1';
    }
    refreshButtons();
  }

  function getActiveInstance() {
    try { return HOST_WIN[INSTANCE_KEY] || null; }
    catch { return null; }
  }

  function isHealthy(api, expectedVersion) {
    return Boolean(
      api &&
      api.version === expectedVersion &&
      typeof api.destroy === 'function' &&
      api.state &&
      api.state.destroyed === false &&
      api.hostWindow === HOST_WIN &&
      api.hostDocument === HOST_DOC
    );
  }

  function encodeUtf8(value) {
    if (SCRIPT_WIN.TextEncoder) return new SCRIPT_WIN.TextEncoder().encode(value);
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
        const x = w[i - 15];
        const y = w[i - 2];
        const s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);
        const s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a,b,c,d,e,f,g,h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0]=(H[0]+a)>>>0; H[1]=(H[1]+b)>>>0; H[2]=(H[2]+c)>>>0; H[3]=(H[3]+d)>>>0;
      H[4]=(H[4]+e)>>>0; H[5]=(H[5]+f)>>>0; H[6]=(H[6]+g)>>>0; H[7]=(H[7]+h)>>>0;
    }
    return H.map(value => value.toString(16).padStart(8, '0')).join('');
  }

  async function sha256(text) {
    const bytes = encodeUtf8(text);
    const subtle = SCRIPT_WIN.crypto?.subtle;
    if (subtle?.digest) {
      try {
        const digest = await subtle.digest('SHA-256', bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
        return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
      } catch (error) {
        console.warn('[TLE Loader TEST] WebCrypto 不可用，切换纯 JS SHA-256。', error);
      }
    }
    return sha256Fallback(bytes);
  }

  async function verifySource(record) {
    if (!record || typeof record.source !== 'string') throw new Error('源码内容缺失');
    const bytes = encodeUtf8(record.source);
    if (bytes.byteLength > MAX_SOURCE_BYTES) throw new Error('源码超过安全大小限制');
    if (bytes.byteLength !== record.size_bytes) {
      throw new Error(`源码长度不匹配：期望 ${record.size_bytes}，实际 ${bytes.byteLength}`);
    }
    const actualHash = await sha256(record.source);
    if (actualHash !== record.sha256) throw new Error('SHA-256 校验失败');
    return true;
  }

  async function fetchText(url, timeoutMs = 20000) {
    const requestController = new SCRIPT_WIN.AbortController();
    const timer = SCRIPT_WIN.setTimeout(() => requestController.abort(), timeoutMs);
    try {
      const response = await SCRIPT_WIN.fetch(url, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        signal: requestController.signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return await response.text();
    } finally {
      SCRIPT_WIN.clearTimeout(timer);
    }
  }

  function validateManifest(manifest) {
    if (!manifest || manifest.schema_version !== 1) throw new Error('版本清单 schema_version 不受支持');
    if (manifest.project !== PROJECT || manifest.channel !== CHANNEL) throw new Error('版本清单项目或更新通道不匹配');
    if (manifest.minimum_loader_version && compareVersions(LOADER_VERSION, manifest.minimum_loader_version) < 0) {
      throw new Error(`当前 Loader v${LOADER_VERSION} 低于清单要求的 v${manifest.minimum_loader_version}`);
    }
    const release = manifest.release;
    if (!release || typeof release.version !== 'string' || release.version !== manifest.latest_version) {
      throw new Error('版本清单中的版本号不一致');
    }
    if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(release.version)) throw new Error('版本号格式无效');
    if (!/^([a-f0-9]{64})$/.test(release.sha256 || '')) throw new Error('SHA-256 字段无效');
    if (!Number.isSafeInteger(release.size_bytes) || release.size_bytes < 1 || release.size_bytes > MAX_SOURCE_BYTES) {
      throw new Error('源码大小字段无效');
    }
    let sourceUrl;
    try { sourceUrl = new URL(release.source_url); }
    catch { throw new Error('源码 URL 无效'); }
    const expectedPath = /^\/jerinmiss620-web\/Tavern-Layout-Engine\/[a-f0-9]{40}\/releases\/v\d+\.\d+\.\d+\/TLE\.js$/;
    if (sourceUrl.protocol !== 'https:' || sourceUrl.hostname !== 'raw.githubusercontent.com' || !expectedPath.test(sourceUrl.pathname)) {
      throw new Error('源码地址不在受信任的仓库与版本路径内');
    }
    if (!sourceUrl.pathname.includes(`/releases/v${release.version}/TLE.js`)) {
      throw new Error('源码 URL 版本目录与清单版本号不一致');
    }
    if (release.source_path !== `releases/v${release.version}/TLE.js`) {
      throw new Error('源码路径字段与版本号不一致');
    }
    const commitMatch = sourceUrl.pathname.match(/^\/jerinmiss620-web\/Tavern-Layout-Engine\/([a-f0-9]{40})\/releases\/v\d+\.\d+\.\d+\/TLE\.js$/);
    if (!commitMatch || (release.source_commit && release.source_commit !== commitMatch[1])) {
      throw new Error('源码 Commit 与固定下载地址不一致');
    }
    return release;
  }

  function getStorage() {
    try { return HOST_WIN.localStorage; }
    catch { return null; }
  }

  function serializeRecord(record) {
    return {
      schema_version: 1,
      version: record.version,
      sha256: record.sha256,
      size_bytes: record.size_bytes,
      source: record.source,
      saved_at: new Date().toISOString(),
    };
  }

  function slotForKey(key) {
    if (key === LKG_KEY) return 'lkg';
    if (key === PREVIOUS_KEY) return 'previous';
    throw new Error('未知的 Loader 缓存槽位');
  }

  function getCacheDb() {
    if (!cacheDbPromise) {
      cacheDbPromise = new Promise((resolve, reject) => {
        let factory;
        try { factory = HOST_WIN.indexedDB; }
        catch (error) { reject(error); return; }
        if (!factory?.open) {
          reject(new Error('当前宿主不支持 IndexedDB'));
          return;
        }
        let request;
        try { request = factory.open(CACHE_DB_NAME, CACHE_DB_VERSION); }
        catch (error) { reject(error); return; }
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(CACHE_STORE_NAME)) {
            db.createObjectStore(CACHE_STORE_NAME, { keyPath: 'slot' });
          }
        };
        request.onsuccess = () => {
          const db = request.result;
          db.onversionchange = () => { try { db.close(); } catch {} };
          resolve(db);
        };
        request.onerror = () => reject(request.error || new Error('IndexedDB 打开失败'));
        request.onblocked = () => reject(new Error('IndexedDB 数据库升级被其他页面阻塞'));
      });
    }
    return cacheDbPromise;
  }

  async function idbGet(slot) {
    const db = await getCacheDb();
    return new Promise((resolve, reject) => {
      let result = null;
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        reject(error || new Error('IndexedDB 读取失败'));
      };
      let transaction;
      try {
        transaction = db.transaction(CACHE_STORE_NAME, 'readonly');
        const request = transaction.objectStore(CACHE_STORE_NAME).get(slot);
        request.onsuccess = () => { result = request.result || null; };
        request.onerror = () => fail(request.error);
        transaction.oncomplete = () => {
          if (settled) return;
          settled = true;
          resolve(result);
        };
        transaction.onerror = () => fail(transaction.error);
        transaction.onabort = () => fail(transaction.error || new Error('IndexedDB 读取事务中止'));
      } catch (error) { fail(error); }
    });
  }

  async function idbPut(slot, record) {
    const db = await getCacheDb();
    const payload = { ...serializeRecord(record), slot };
    return new Promise((resolve, reject) => {
      let settled = false;
      const fail = error => {
        if (settled) return;
        settled = true;
        reject(error || new Error('IndexedDB 写入失败'));
      };
      let transaction;
      try {
        transaction = db.transaction(CACHE_STORE_NAME, 'readwrite');
        transaction.objectStore(CACHE_STORE_NAME).put(payload);
        transaction.oncomplete = () => {
          if (settled) return;
          settled = true;
          resolve(true);
        };
        transaction.onerror = () => fail(transaction.error);
        transaction.onabort = () => fail(transaction.error || new Error('IndexedDB 写入事务中止'));
      } catch (error) { fail(error); }
    });
  }

  function writeCachePointer(key, slot, record) {
    const storage = getStorage();
    if (!storage) return false;
    try {
      // The large legacy source is removed only after the IndexedDB copy has been read back and verified.
      storage.removeItem(key);
      storage.setItem(key, JSON.stringify({
        schema_version: 2,
        backend: 'indexedDB',
        slot,
        version: record.version,
        sha256: record.sha256,
        size_bytes: record.size_bytes,
        saved_at: new Date().toISOString(),
      }));
      return true;
    } catch (error) {
      // The IndexedDB record is already durable and verified; a tiny pointer is best-effort only.
      console.warn('[TLE Loader TEST] IndexedDB 缓存已验证，但 localStorage 索引写入失败。', error);
      return false;
    }
  }

  async function writeIndexedRecord(slot, record) {
    await verifySource(record);
    await idbPut(slot, record);
    const stored = await idbGet(slot);
    if (!stored) throw new Error('IndexedDB 写入后未能读取缓存记录');
    await verifySource(stored);
    return stored;
  }

  async function saveRecord(key, record) {
    const slot = slotForKey(key);
    await verifySource(record);

    // If IndexedDB opens, it is the authoritative backend. A quota/transaction error must not
    // create a newer localStorage copy that would be shadowed by an older IndexedDB record.
    let dbAvailable = false;
    let openError = null;
    try {
      await getCacheDb();
      dbAvailable = true;
    } catch (error) {
      openError = error;
    }

    if (dbAvailable) {
      try {
        const stored = await writeIndexedRecord(slot, record);
        cacheFlags[slot] = true;
        writeCachePointer(key, slot, stored);
        return true;
      } catch (indexedError) {
        throw new Error(`IndexedDB 已可用，但缓存写入或读回校验失败；为避免缓存版本分叉，没有改写 localStorage：${indexedError?.message || indexedError}`);
      }
    }

    // Compatibility fallback only when IndexedDB itself cannot be opened.
    const storage = getStorage();
    if (!storage) {
      throw new Error(`IndexedDB 不可用（${openError?.message || '未知原因'}），且 localStorage 不可用`);
    }
    try {
      storage.setItem(key, JSON.stringify(serializeRecord(record)));
      const readback = JSON.parse(storage.getItem(key) || 'null');
      await verifySource(readback);
      cacheFlags[slot] = true;
      console.warn('[TLE Loader TEST] IndexedDB 无法打开，已回退到 localStorage 源码缓存。', openError);
      return true;
    } catch (storageError) {
      throw new Error(`IndexedDB 无法打开：${openError?.message || openError}；localStorage 回退也失败：${storageError?.message || storageError}`);
    }
  }

  async function readRecord(key, label) {
    const slot = slotForKey(key);

    // IndexedDB is the primary source store. A localStorage pointer is not required to read it.
    try {
      const indexedRecord = await idbGet(slot);
      if (indexedRecord) {
        await verifySource(indexedRecord);
        cacheFlags[slot] = true;
        writeCachePointer(key, slot, indexedRecord);
        return indexedRecord;
      }
    } catch (error) {
      console.warn(`[TLE Loader TEST] ${label} IndexedDB 读取失败，尝试兼容缓存。`, error);
    }

    const storage = getStorage();
    if (!storage) return null;
    let payload;
    try { payload = JSON.parse(storage.getItem(key) || 'null'); }
    catch { return null; }
    if (!payload) return null;

    // Version-2 pointers only refer to IndexedDB. If IndexedDB cannot be read, do not mistake the pointer for source.
    if (payload.schema_version === 2 && payload.backend === 'indexedDB') return null;
    if (payload.schema_version !== 1 || typeof payload.source !== 'string') return null;

    try {
      await verifySource(payload);
      cacheFlags[slot] = true;
      // One-time migration: copy, read back, and hash-check before deleting the old localStorage source.
      try {
        const migrated = await writeIndexedRecord(slot, payload);
        writeCachePointer(key, slot, migrated);
        return migrated;
      } catch (migrationError) {
        console.warn(`[TLE Loader TEST] ${label} 迁移到 IndexedDB 失败，暂时保留原始 localStorage 缓存。`, migrationError);
        return payload;
      }
    } catch (error) {
      cacheFlags[slot] = false;
      console.warn(`[TLE Loader TEST] ${label} 缓存校验失败。`, error);
      return null;
    }
  }

  async function saveLastKnownGood(record) {
    return saveRecord(LKG_KEY, record);
  }

  async function readLastKnownGood() {
    return readRecord(LKG_KEY, 'Last Known Good');
  }

  async function savePreviousKnownGood(record) {
    return saveRecord(PREVIOUS_KEY, record);
  }

  async function readPreviousKnownGood() {
    return readRecord(PREVIOUS_KEY, 'Previous Known Good');
  }

  function isAutoRestoreEnabled() {
    try { return getStorage()?.getItem(AUTO_RESTORE_KEY) === 'true'; }
    catch { return false; }
  }

  function setAutoRestoreEnabled(enabled) {
    const storage = getStorage();
    if (!storage) throw new Error('宿主 localStorage 不可用，无法保存自动恢复设置');
    storage.setItem(AUTO_RESTORE_KEY, enabled ? 'true' : 'false');
    refreshButtons();
  }

  async function importModuleSource(source) {
    if (!SCRIPT_WIN.Blob || !SCRIPT_WIN.URL?.createObjectURL) {
      throw new Error('当前浏览器不支持 Blob 模块加载');
    }
    const blob = new SCRIPT_WIN.Blob([source], { type: 'text/javascript;charset=utf-8' });
    const moduleUrl = SCRIPT_WIN.URL.createObjectURL(blob);
    try {
      // Dynamic import keeps execution in this script's realm, preserving window/parent access.
      await import(moduleUrl);
    } finally {
      SCRIPT_WIN.URL.revokeObjectURL(moduleUrl);
    }
  }

  async function testModuleLoading() {
    const token = `tle-loader-probe-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const probeSource = `globalThis[${JSON.stringify(PROBE_KEY)}] = ${JSON.stringify(token)};`;
    await importModuleSource(probeSource);
    const passed = SCRIPT_WIN[PROBE_KEY] === token;
    try { delete SCRIPT_WIN[PROBE_KEY]; } catch {}
    if (!passed) throw new Error('模块已执行，但没有在 Loader 所在的同一 JavaScript 环境中完成握手');
    moduleProbePassed = true;
    return true;
  }

  function hasStoredLkg() {
    if (cacheFlags.lkg) return true;
    try { return Boolean(getStorage()?.getItem(LKG_KEY)); }
    catch { return false; }
  }

  function hasStoredPrevious() {
    if (cacheFlags.previous) return true;
    try { return Boolean(getStorage()?.getItem(PREVIOUS_KEY)); }
    catch { return false; }
  }

  function refreshButtons() {
    if (closed) return;
    const active = getActiveInstance();
    const activeVersion = active?.version || '未检测到';
    const hasCandidate = Boolean(candidate);
    const hasLkg = hasStoredLkg();
    const hasPrevious = hasStoredPrevious();
    const updateAvailable = Boolean(candidate && candidate.version !== active?.version);
    buttons.check.disabled = busy;
    buttons.probe.disabled = busy;
    buttons.load.disabled = busy || !hasCandidate || !moduleProbePassed || !hasLkg || !updateAvailable;
    buttons.rollback.disabled = busy || !hasPrevious || !moduleProbePassed;
    buttons.autoRestore.disabled = busy;
    buttons.autoRestore.textContent = isAutoRestoreEnabled() ? '关闭自动恢复' : '开启自动恢复';
    for (const name of ['check', 'probe', 'load', 'rollback', 'autoRestore']) {
      buttons[name].style.opacity = buttons[name].disabled ? '.45' : '1';
      buttons[name].style.cursor = buttons[name].disabled ? 'not-allowed' : 'pointer';
    }
    const remoteVersion = candidate?.version || '尚未检查';
    const restoreState = isAutoRestoreEnabled() ? '已授权自动恢复' : '自动恢复关闭';
    setMeta(`Loader ${LOADER_VERSION} · ${CHANNEL} 通道
当前运行：${activeVersion} · 远程候选：${remoteVersion}
模块测试：${moduleProbePassed ? '通过' : '未通过'} · ${restoreState}`);
  }

  async function checkRemote() {
    if (busy) return;
    setBusy(true);
    candidate = null;
    setStatus('正在读取测试通道版本清单……');
    try {
      const manifestUrl = `${MANIFEST_URL}?_tle=${Date.now()}`;
      const manifestText = await fetchText(manifestUrl);
      let manifest;
      try { manifest = JSON.parse(manifestText); }
      catch { throw new Error('远程版本清单不是有效 JSON'); }
      const release = validateManifest(manifest);
      setStatus(`已找到远程版本 v${release.version}，正在下载并校验源码……`);
      const source = await fetchText(`${release.source_url}?_tle=${Date.now()}`);
      const record = {
        version: release.version,
        sha256: release.sha256,
        size_bytes: release.size_bytes,
        source,
      };
      await verifySource(record);

      const active = getActiveInstance();
      const activeVersion = active?.version || null;
      if (activeVersion && compareVersions(release.version, activeVersion) < 0) {
        setStatus(`远程版本 v${release.version} 低于当前运行版本 v${activeVersion}，为避免意外降级已忽略。`, 'warning');
        candidate = null;
        return;
      }

      candidate = record;
      if (isHealthy(active, record.version)) {
        let cacheWarning = '';
        try {
          const currentLkg = await readLastKnownGood();
          if (currentLkg && currentLkg.sha256 !== record.sha256) {
            await savePreviousKnownGood(currentLkg);
          }
          if (!currentLkg || currentLkg.sha256 !== record.sha256) {
            await saveLastKnownGood(record);
          }
        } catch (cacheError) {
          cacheWarning = `\n当前 TLE 已正常运行，但缓存维护失败：${cacheError?.message || cacheError}`;
          console.warn('[TLE Loader TEST] 当前实例健康；缓存维护失败，不影响运行。', cacheError);
        }
        setStatus(startupConflict
          ? `检测到已有 TLE v${record.version} 正在运行，自动恢复已跳过。\n远程源码校验通过，但无法仅凭版本号判断当前实例来自本地脚本还是远程缓存。请确认原始本地 TLE 已禁用。${cacheWarning}`
          : `远程源码校验通过：v${record.version}。\n当前运行版本已经是最新版本，无需重新加载。${cacheWarning}`, cacheWarning ? 'warning' : (startupConflict ? 'warning' : 'success'));
      } else {
        const lkg = await readLastKnownGood();
        if (lkg) {
          const isNewer = activeVersion ? compareVersions(record.version, activeVersion) > 0 : true;
          setStatus(isNewer
            ? `发现可用更新：v${activeVersion || '未运行'} → v${record.version}。
源码校验通过，已保留当前 Last Known Good：v${lkg.version}。
点击「确认加载新版 TLE」后才会替换。`
            : `远程源码校验通过：v${record.version}。
当前没有运行中的 TLE，可从已验证缓存 v${lkg.version} 恢复。`, 'success');
        } else {
          setStatus(`远程源码校验通过：v${record.version}。
但没有 Last Known Good 缓存，不能安全替换当前实例。请先保留并启动原始 TLE，再重新检查。`, 'warning');
        }
      }
    } catch (error) {
      setStatus(`检查失败：${error?.message || error}
现有 TLE 不会被修改。`, 'error');
      console.error('[TLE Loader TEST] 远程检查失败。', error);
    } finally {
      setBusy(false);
      refreshButtons();
    }
  }

  function compareVersions(a, b) {
    const parse = value => String(value).split(/[.-]/).slice(0, 3).map(part => Number(part) || 0);
    const av = parse(a);
    const bv = parse(b);
    for (let i = 0; i < 3; i++) {
      if (av[i] > bv[i]) return 1;
      if (av[i] < bv[i]) return -1;
    }
    return 0;
  }

  async function loadRecord(record, label) {
    if (busy) return;
    if (!moduleProbePassed) throw new Error('请先通过「测试模块加载」');
    await verifySource(record);

    const previous = getActiveInstance();
    const lkg = await readLastKnownGood();
    if (!lkg && !(isHealthy(previous, record.version))) {
      throw new Error('没有可用的 Last Known Good 缓存。请保留当前 TLE，不要继续加载。');
    }
    if (isHealthy(previous, record.version)) {
      setStatus(`当前已经运行 TLE v${record.version}，无需再次加载。`, 'success');
      return;
    }

    const confirmed = SCRIPT_WIN.confirm(
      `${label}

即将加载 TLE v${record.version}。
升级前会先验证上一版本回滚备份；备份无法建立时不会替换当前 TLE。
新版通过健康检查后，即使后续缓存写入失败，也不会销毁正在运行的新版本。

继续吗？`
    );
    if (!confirmed) return;

    setBusy(true);
    setStatus(`正在为 TLE v${record.version} 准备回滚备份……`);

    let rollbackBackupReady = false;
    try {
      if (lkg && lkg.sha256 !== record.sha256) {
        const existingPrevious = await readPreviousKnownGood();
        if (!existingPrevious || existingPrevious.sha256 !== lkg.sha256) {
          // Critical preflight: do not replace the healthy current TLE unless its rollback source is durable.
          await savePreviousKnownGood(lkg);
        }
        const verifiedPrevious = await readPreviousKnownGood();
        if (!verifiedPrevious || verifiedPrevious.sha256 !== lkg.sha256) {
          throw new Error('上一版本回滚备份未能完成读回校验；当前 TLE 保持不变。');
        }
        rollbackBackupReady = true;
      } else if (lkg) {
        rollbackBackupReady = true;
      }
    } catch (backupError) {
      setStatus(`无法安全升级：上一版本备份建立失败。\n${backupError?.message || backupError}\n当前 TLE 未被替换。请检查 IndexedDB 存储权限或空间后重试。`, 'error');
      setBusy(false);
      refreshButtons();
      return;
    }

    setStatus(`回滚备份${rollbackBackupReady ? '已验证' : '无需更换'}，正在加载 TLE v${record.version}……`);

    // Only module execution and TLE health verification decide whether the candidate itself failed.
    let active;
    try {
      await importModuleSource(record.source);
      active = getActiveInstance();
      if (!isHealthy(active, record.version)) {
        throw new Error('模块导入已完成，但 TLE 实例健康检查未通过');
      }
    } catch (error) {
      console.error('[TLE Loader TEST] 远程模块启动或健康检查失败。', error);
      const current = getActiveInstance();
      if (current && current !== previous) {
        try { current.destroy?.(); }
        catch (destroyError) { console.error('[TLE Loader TEST] 清理失败实例时发生错误。', destroyError); }
      }
      const previousStillRunning = previous && HOST_WIN[INSTANCE_KEY] === previous && previous.state?.destroyed === false;
      if (previousStillRunning) {
        setStatus(`远程加载失败：${error?.message || error}\n原有 TLE 仍在运行，没有执行回滚。`, 'error');
      } else {
        const fallbacks = [await readLastKnownGood(), await readPreviousKnownGood()]
          .filter(item => item && item.sha256 !== record.sha256);
        let recovered = false;
        const rollbackErrors = [];
        for (const fallback of fallbacks) {
          try {
            setStatus(`新版本启动失败，正在恢复缓存版本 v${fallback.version}……`, 'warning');
            await importModuleSource(fallback.source);
            if (!isHealthy(getActiveInstance(), fallback.version)) throw new Error('缓存版本健康检查未通过');
            try { await saveLastKnownGood(fallback); }
            catch (cacheError) { console.warn('[TLE Loader TEST] 已恢复，但无法提升 LKG 缓存。', cacheError); }
            setStatus(`新版本启动失败，已自动恢复到 TLE v${fallback.version}。\n原始错误：${error?.message || error}`, 'warning');
            recovered = true;
            break;
          } catch (rollbackError) {
            rollbackErrors.push(`v${fallback.version}: ${rollbackError?.message || rollbackError}`);
            console.error('[TLE Loader TEST] 尝试缓存回滚失败。', rollbackError);
          }
        }
        if (!recovered) {
          setStatus(`远程加载与自动回滚均失败。\n加载错误：${error?.message || error}\n回滚错误：${rollbackErrors.join('；') || '没有不同于候选版本的缓存源码'}\n请重新启用原始 TLE 脚本并刷新酒馆。`, 'error');
        }
      }
      setBusy(false);
      refreshButtons();
      return;
    }

    // The new TLE is healthy now. Cache/authorization failures are warnings, never startup failures.
    const cacheWarnings = [];
    try {
      await saveLastKnownGood(record);
    } catch (cacheError) {
      cacheWarnings.push(`新版源码缓存未能更新：${cacheError?.message || cacheError}`);
      console.warn('[TLE Loader TEST] 新版 TLE 已健康运行，但 LKG 缓存写入失败。', cacheError);
    }
    try {
      if (!isAutoRestoreEnabled()) setAutoRestoreEnabled(true);
    } catch (authError) {
      cacheWarnings.push(`自动恢复授权未能保存：${authError?.message || authError}`);
      console.warn('[TLE Loader TEST] 新版 TLE 已健康运行，但自动恢复授权写入失败。', authError);
    }

    if (cacheWarnings.length) {
      setStatus(`远程加载成功：TLE v${record.version}\n实例、宿主引用与卸载接口均通过检查。\n但缓存维护存在警告：\n${cacheWarnings.join('\n')}\n当前新版不会被销毁；刷新前请不要关闭酒馆，先处理缓存问题。`, 'warning');
    } else {
      setStatus(`远程加载成功：TLE v${record.version}\n实例、宿主引用与卸载接口均通过检查。\n上一版本备份已验证；Last Known Good 已更新；自动恢复已授权。`, 'success');
    }
    console.info(`[TLE Loader TEST] 远程加载成功：v${record.version}`);

    setBusy(false);
    refreshButtons();
  }

  async function rollback() {
    if (busy) return;
    const record = await readPreviousKnownGood();
    if (!record) {
      setStatus('没有通过完整性校验的上一版本缓存。', 'error');
      refreshButtons();
      return;
    }
    try {
      await loadRecord(record, `恢复上一版本 v${record.version}`);
    } catch (error) {
      setStatus(`回滚失败：${error?.message || error}`, 'error');
    }
  }

  function delay(ms) {
    return new Promise(resolve => SCRIPT_WIN.setTimeout(resolve, ms));
  }

  async function autoRestore() {
    if (!isAutoRestoreEnabled()) {
      setStatus('首次安装或自动恢复已关闭。请手动确认首次加载；远程检查不会替换当前 TLE。', 'info');
      return false;
    }

    // Let Tavern Helper finish its other startup scripts before checking for a local TLE instance.
    await delay(AUTO_RESTORE_DELAY);
    const active = getActiveInstance();
    if (active && active.state?.destroyed === false) {
      startupConflict = true;
      setStatus(`检测到已有 TLE v${active.version || '未知'} 正在运行。为避免重复实例或覆盖本地脚本，自动恢复已跳过。
如需使用远程版，请确认原始本地 TLE 已禁用后刷新。`, 'warning');
      return false;
    }

    let record = await readLastKnownGood();
    if (!record) {
      record = await readPreviousKnownGood();
      if (record) setStatus(`主缓存不可用，尝试上一份已验证版本 v${record.version}……`, 'warning');
    }
    if (!record) {
      setStatus('自动恢复授权存在，但没有可用的完整性校验缓存。请重新启用原始 TLE 脚本并检查 Loader 缓存。', 'error');
      return false;
    }

    try {
      if (!moduleProbePassed) await testModuleLoading();
      setStatus(`正在自动恢复 Last Known Good：TLE v${record.version}……`);
      await importModuleSource(record.source);
      if (!isHealthy(getActiveInstance(), record.version)) {
        throw new Error('缓存源码已执行，但 TLE 健康检查未通过');
      }
      setStatus(`自动恢复成功：TLE v${record.version}
实例、宿主引用与卸载接口均通过检查。正在后台检查更新……`, 'success');
      return true;
    } catch (error) {
      console.error('[TLE Loader TEST] 自动恢复失败。', error);
      const current = getActiveInstance();
      try { current?.destroy?.(); } catch {}
      const fallback = await readPreviousKnownGood();
      if (fallback && fallback.sha256 !== record.sha256) {
        try {
          setStatus(`主缓存启动失败，正在尝试上一版本 v${fallback.version}……`, 'warning');
          await importModuleSource(fallback.source);
          if (!isHealthy(getActiveInstance(), fallback.version)) throw new Error('上一版本健康检查未通过');
          try { await saveLastKnownGood(fallback); }
          catch (cacheError) { console.warn('[TLE Loader TEST] 已恢复上一版本，但无法更新 LKG 缓存。', cacheError); }
          setStatus(`已从上一版本恢复：TLE v${fallback.version}
主缓存错误：${error?.message || error}
已尝试将成功恢复的版本提升为 Last Known Good。`, 'warning');
          return true;
        } catch (fallbackError) {
          console.error('[TLE Loader TEST] 上一版本自动恢复也失败。', fallbackError);
        }
      }
      setStatus(`自动恢复失败：${error?.message || error}
请重新启用原始 TLE 脚本并刷新酒馆。`, 'error');
      return false;
    }
  }

  async function startup() {
    setBusy(true);
    try {
      setStatus('正在测试动态模块环境……');
      await testModuleLoading();
      setStatus('模块环境测试通过。', 'success');
      if (moduleProbePassed) await autoRestore();
    } catch (error) {
      moduleProbePassed = false;
      setStatus(`模块环境测试失败：${error?.message || error}
自动恢复已暂停，当前不会替换 TLE。`, 'error');
      console.error('[TLE Loader TEST] 启动模块探针或自动恢复发生错误。', error);
    } finally {
      setBusy(false);
      refreshButtons();
    }

    await checkRemote();
  }

  function destroy() {
    if (closed) return;
    closed = true;
    controller.abort();
    panel.remove();
    if (HOST_WIN[LOADER_KEY] === api) delete HOST_WIN[LOADER_KEY];
  }

  const api = {
    version: LOADER_VERSION,
    destroy,
    checkRemote,
    testModuleLoading,
    loadRemote: () => candidate ? loadRecord(candidate, '远程加载测试') : Promise.reject(new Error('请先检查远程版本')),
    rollback,
  };
  HOST_WIN[LOADER_KEY] = api;

  buttons.check.addEventListener('click', checkRemote, { signal: controller.signal });
  buttons.probe.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    setStatus('正在测试 Blob 动态模块加载与同一 JavaScript 环境握手……');
    try {
      await testModuleLoading();
      setStatus('模块加载测试通过。远程模块可以在 Loader 所在的 JavaScript 环境中执行；尚未替换当前 TLE。', 'success');
    } catch (error) {
      moduleProbePassed = false;
      setStatus(`模块加载测试失败：${error?.message || error}\n当前 TLE 未被替换。`, 'error');
      console.error('[TLE Loader TEST] 模块加载测试失败。', error);
    } finally {
      setBusy(false);
      refreshButtons();
    }
  }, { signal: controller.signal });
  buttons.load.addEventListener('click', async () => {
    if (!candidate) return;
    try { await loadRecord(candidate, '远程加载测试'); }
    catch (error) { setStatus(`无法加载：${error?.message || error}`, 'error'); }
  }, { signal: controller.signal });
  buttons.rollback.addEventListener('click', rollback, { signal: controller.signal });
  buttons.autoRestore.addEventListener('click', async () => {
    try {
      const next = !isAutoRestoreEnabled();
      if (next && !(await readLastKnownGood())) {
        setStatus('当前没有通过完整性校验的 Last Known Good 缓存，无法开启自动恢复。请先成功加载一次远程 TLE。', 'warning');
        return;
      }
      setAutoRestoreEnabled(next);
      setStatus(next ? '已开启自动恢复。下次启动时会先检查现有 TLE，再恢复已验证缓存。' : '已关闭自动恢复。当前运行中的 TLE 不受影响。', 'success');
    } catch (error) {
      setStatus(`设置失败：${error?.message || error}`, 'error');
    }
  }, { signal: controller.signal });
  buttons.close.addEventListener('click', destroy, { signal: controller.signal });
  SCRIPT_WIN.addEventListener('pagehide', destroy, { once: true, signal: controller.signal });

  setStatus('Loader 已启动。正在检查模块环境，并按授权状态恢复 TLE……');
  refreshButtons();
  void startup();
  console.info(`[TLE Loader TEST] Loader v${LOADER_VERSION} 已启动。自动恢复由用户授权控制；新版更新始终需要手动确认。`);
})();