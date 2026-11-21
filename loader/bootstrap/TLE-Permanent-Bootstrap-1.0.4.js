(() => {
  'use strict';
  // 简介：TLE 永久远程更新链。使用方式：仅导入并启用 Bootstrap，由它管理 Loader 与 Core。
  // 注意事项：首次迁移禁用旧独立脚本；首次安装需要联网，自动更新可在原有折叠区域关闭。作者：小松鼠 & ChatGPT（小松7）。
  // Tavern Layout Engine · Permanent Remote Bootstrap 1.0.4
  // Installed once in Tavern Helper. Updates the Loader runtime from GitHub.
  // The Loader runtime in turn maintains TLE Core. No second floating UI.
  const SCRIPT_WIN = window;
  const SCRIPT_DOC = SCRIPT_WIN.document;
  const HOST_WIN = SCRIPT_WIN.parent;
  const HOST_DOC = HOST_WIN?.document;
  if (!HOST_DOC?.documentElement) {
    console.error('[TLE Bootstrap] 无法访问酒馆宿主页面；未更改当前脚本。');
    return;
  }

  const VERSION = '1.0.4';
  const BOOT_KEY = '__TLE_REMOTE_BOOTSTRAP_V1__';
  const LOADER_KEY = '__TLE_REMOTE_LOADER_STABLE_V1__';
  const MANIFEST_URL = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/main/loader/latest.json';
  const AUTO_UPDATE_KEY = 'tle.loader.stable.autoUpdate.v1';
  const PROJECT = 'Tavern Layout Engine';
  const MAX_BYTES = 512 * 1024;
  const DB_NAME = 'TLE_Remote_Bootstrap_Cache';
  const STORE = 'records';
  const CHECK_INTERVAL = 6 * 60 * 60 * 1000;
  const RETRY_INTERVAL = 60 * 1000;
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAYS = [500, 1000];
  const previousBootstrap = HOST_WIN[BOOT_KEY];
  previousBootstrap?.destroy?.();

  let closed = false;
  let busy = false;
  let installing = false;
  let candidate = null;
  let cached = null;
  let checkTimer = 0;
  let dbPromise = null;
  let lastStatus = null;
  let remoteCheckedAt = null;
  let lastStartupFailure = null;
  let failureDialog = null;
  let failureDismissed = false;
  let checkPromise = null;
  let requestState = null;
  let remoteFailure = null;
  let retryProgress = null;
  const stateEvent = 'tle-loader-bootstrap-state-change';
  const controller = new SCRIPT_WIN.AbortController();

  function currentRuntime() {
    try { return HOST_WIN[LOADER_KEY] || null; } catch { return null; }
  }
  function healthy(record) {
    const loader = currentRuntime();
    return Boolean(
      loader && loader.bootstrapManaged === true &&
      loader.version === record.version &&
      loader.channel === 'stable' &&
      typeof loader.getInfo === 'function' &&
      typeof loader.checkRemote === 'function' &&
      typeof loader.loadRemote === 'function' &&
      typeof loader.destroy === 'function' &&
      loader.diagnostics?.destroyed !== true
    );
  }
  function isAutoUpdateEnabled() {
    try { return HOST_WIN.localStorage?.getItem(AUTO_UPDATE_KEY) !== 'false'; }
    catch { return true; }
  }
  function compareVersions(a, b) {
    const A = String(a || '').split(/[.-]/).slice(0, 3).map(v => Number(v) || 0);
    const B = String(b || '').split(/[.-]/).slice(0, 3).map(v => Number(v) || 0);
    for (let i = 0; i < 3; i++) if (A[i] !== B[i]) return A[i] > B[i] ? 1 : -1;
    return 0;
  }
  function notify() {
    try { HOST_WIN.dispatchEvent(new HOST_WIN.CustomEvent(stateEvent)); } catch {}
  }
  function setStatus(message, kind = 'info') {
    if (closed) return;
    lastStatus = { message: String(message).slice(0, 1400), kind, at: new Date().toISOString() };
    notify();
    const method = kind === 'error' ? 'error' : kind === 'warning' ? 'warn' : 'info';
    try { HOST_WIN.console?.[method]?.('[TLE Bootstrap] ' + message); } catch {}
    if (kind === 'error') {
      try { HOST_WIN.toastr?.error?.(String(message).slice(0, 160), 'TLE Loader'); } catch {}
    }
  }
  function getInfo() {
    const runtime = currentRuntime();
    return {
      bootstrapVersion: VERSION,
      currentLoaderVersion: runtime?.bootstrapManaged ? runtime.version : null,
      availableLoaderVersion: candidate?.version || null,
      updateAvailable: Boolean(runtime?.bootstrapManaged && candidate &&
        compareVersions(candidate.version, runtime.version) > 0),
      autoUpdateEnabled: isAutoUpdateEnabled(),
      lastStatus,
      checkedAt: remoteCheckedAt,
      hasCachedLoader: Boolean(cached),
      busy: busy || installing,
      startupFailure: lastStartupFailure,
      request: requestState ? { ...requestState } : null,
      remoteFailure: remoteFailure ? { ...remoteFailure } : null,
    };
  }


  // A startup failure must be visible even if TLE Core and its diagnostic button
  // never loaded. The host document owns this one-off dialog, not the chat panel.
  function coreIsRunning() {
    try {
      const core = HOST_WIN.__TAVERN_LAYOUT_ENGINE_V02__;
      return Boolean(core && core.ready !== false && core.state?.destroyed === false &&
        core.hostWindow === HOST_WIN && core.hostDocument === HOST_DOC);
    } catch { return false; }
  }
  function removeFailureDialog() {
    if (!failureDialog) return;
    const { panel, backdrop } = failureDialog;
    failureDialog = null;
    try { if (panel.open && typeof panel.close === 'function') panel.close(); } catch {}
    try { panel.remove(); } catch {}
    try { backdrop?.remove(); } catch {}
  }
  function clearStartupFailure() {
    lastStartupFailure = null;
    failureDismissed = false;
    removeFailureDialog();
  }
  function showStartupFailure(stage, reason, details = null) {
    if (closed || coreIsRunning()) { if (coreIsRunning()) clearStartupFailure(); return; }
    lastStartupFailure = {
      ...(details || {}),
      stage: String(stage || '启动阶段未知'),
      reason: String(reason || '未收到具体错误，请复制诊断信息。').slice(0, 1100),
      at: new Date().toISOString()
    };
    notify();
    if (failureDismissed) return;
    try {
      if (!failureDialog) {
        const panel = HOST_DOC.createElement('dialog');
        const topLayerAvailable = typeof panel.showModal === 'function';
        panel.id = 'tle-bootstrap-failure-dialog';
        panel.setAttribute('aria-label', 'TLE 启动失败');
        if (!topLayerAvailable) panel.setAttribute('role', 'alertdialog');
        const fixedStyle = {
          position: 'fixed', inset: '0', margin: 'auto',
          width: 'min(430px, calc(100vw - 28px))',
          maxWidth: 'calc(100vw - 28px)',
          maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 24px)',
          padding: '0', border: '0', borderRadius: '18px', overflow: 'auto',
          background: '#fbfaf7', color: '#293443',
          boxShadow: '0 16px 55px rgba(19, 26, 42, .25)',
          zIndex: '2147483647', opacity: '1', visibility: 'visible',
          pointerEvents: 'auto', display: 'block'
        };
        for (const [name, value] of Object.entries(fixedStyle)) {
          panel.style.setProperty(name.replace(/[A-Z]/g, c => '-' + c.toLowerCase()), value, 'important');
        }
        const surface = HOST_DOC.createElement('div');
        panel.appendChild(surface);
        const shadow = surface.attachShadow({ mode: 'open' });
        shadow.innerHTML = [
          '<style>',
          ':host{font-family:-apple-system,BlinkMacSystemFont,"Microsoft YaHei",sans-serif;color:#293443;}',
          '*{box-sizing:border-box;}',
          '.wrap{padding:22px 20px 19px;font-size:14px;line-height:1.65;}',
          'h2{margin:0 0 5px;font-size:19px;line-height:1.4;color:#253346;font-weight:650;}',
          '.hint{margin:0 0 14px;font-size:13px;color:#647386;}',
          '.stage{font-weight:650;font-size:14px;margin-bottom:6px;}',
          '.reason{margin:0 0 13px;white-space:pre-wrap;overflow-wrap:anywhere;}',
          '.report{margin:0 0 14px;padding:10px 12px;max-height:160px;overflow:auto;',
          'white-space:pre-wrap;overflow-wrap:anywhere;user-select:text;-webkit-user-select:text;',
          'background:#f0f2f4;color:#3d4b5d;border-radius:9px;font-size:12px;line-height:1.6;}',
          '.actions{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:9px;}',
          'button{font:inherit;font-size:13px;line-height:1.4;min-height:40px;padding:9px 13px;',
          'border-radius:10px;border:1px solid #d6dce3;background:#fff;color:#354456;',
          'cursor:pointer;touch-action:manipulation;}',
          'button.primary{background:#658fa4;color:#fff;border-color:#658fa4;}',
          'button:focus-visible{outline:2px solid #658fa4;outline-offset:2px;}',
          '.copy-state{margin:8px 0 0;font-size:12px;color:#647386;min-height:18px;}',
          '</style>',
          '<section class="wrap" role="document">',
          '<h2>TLE 未能启动</h2>',
          '<p class="hint">Bootstrap 已执行，但布局引擎没有正常加载。无需清空聊天或缓存。</p>',
          '<div class="stage" data-stage></div>',
          '<p class="reason" data-reason></p>',
          '<pre class="report" data-report></pre>',
          '<div class="actions">',
          '<button type="button" data-action="copy">复制诊断</button>',
          '<button type="button" data-action="close">关闭</button>',
          '<button type="button" class="primary" data-action="reload">刷新重试</button>',
          '</div><p class="copy-state" data-copy-state></p></section>'
        ].join('');
        const closeDialog = () => {
          failureDismissed = true;
          removeFailureDialog();
        };
        shadow.querySelector('[data-action="close"]').addEventListener('click', closeDialog);
        panel.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
        shadow.querySelector('[data-action="reload"]').addEventListener('click', () => {
          try { HOST_WIN.location.reload(); }
          catch (error) {
            shadow.querySelector('[data-copy-state]').textContent =
              '刷新失败：' + (error?.message || error) + '。请手动刷新酒馆页面。';
          }
        });
        shadow.querySelector('[data-action="copy"]').addEventListener('click', () => {
          const report = shadow.querySelector('[data-report]').textContent;
          const status = shadow.querySelector('[data-copy-state]');
          const clipboard = HOST_WIN.navigator?.clipboard || SCRIPT_WIN.navigator?.clipboard;
          if (typeof clipboard?.writeText === 'function') {
            void clipboard.writeText(report).then(() => { status.textContent = '诊断已复制。'; })
              .catch(() => { status.textContent = '复制受限制，可长按上方诊断文字复制。'; });
          } else {
            status.textContent = '当前环境不支持一键复制，可长按上方诊断文字复制。';
          }
        });
        HOST_DOC.documentElement.appendChild(panel);
        let backdrop = null;
        let modalOpened = false;
        if (topLayerAvailable) {
          try { panel.showModal(); modalOpened = true; }
          catch { panel.setAttribute('open', ''); }
        } else {
          panel.setAttribute('open', '');
        }
        if (!modalOpened) {
          backdrop = HOST_DOC.createElement('div');
          backdrop.id = 'tle-bootstrap-failure-backdrop';
          backdrop.style.cssText =
            'position:fixed!important;inset:0!important;background:rgba(20,27,40,.40)!important;' +
            'z-index:2147483646!important;pointer-events:auto!important;';
          HOST_DOC.documentElement.insertBefore(backdrop, panel);
        }
        failureDialog = { panel, backdrop, shadow };
      }
      const { shadow } = failureDialog;
      const loader = currentRuntime();
      const loaderInfo = loader?.getInfo?.();
      const core = HOST_WIN.__TAVERN_LAYOUT_ENGINE_V02__;
      const report = [
        'TLE Bootstrap v' + VERSION,
        '阶段：' + lastStartupFailure.stage,
        '原因：' + lastStartupFailure.reason,
        ...(remoteFailure ? [
          '请求阶段：' + remoteFailure.stage,
          '尝试次数：' + remoteFailure.attempt + '/' + MAX_ATTEMPTS,
          '错误类型：' + remoteFailure.type,
          '请求详情：' + remoteFailure.reason
        ] : []),
        'Loader：' + (loader?.version || '未启动'),
        'Core：' + (core?.version || '未启动'),
        'Loader 状态：' + (loaderInfo?.lastStatus?.message || '无'),
        'Bootstrap 状态：' + (lastStatus?.message || '无'),
        'User-Agent：' + String(HOST_WIN.navigator?.userAgent || '未知').slice(0, 300),
        '记录时间：' + lastStartupFailure.at
      ].join('\n');
      shadow.querySelector('[data-stage]').textContent = '中断阶段：' + lastStartupFailure.stage;
      shadow.querySelector('[data-reason]').textContent = lastStartupFailure.reason;
      shadow.querySelector('[data-report]').textContent = report;
      shadow.querySelector('[data-copy-state]').textContent = '';
    } catch (error) {
      try { HOST_WIN.console?.error?.('[TLE Bootstrap] 启动失败弹窗无法创建', error); } catch {}
      try { HOST_WIN.toastr?.error?.(lastStartupFailure.reason, 'TLE 未能启动'); } catch {}
    }
  }
  async function reportStartupResult() {
    if (closed) return;
    const runtime = currentRuntime();
    if (runtime?.ready) {
      try { await runtime.ready; }
      catch (error) { setStatus('Loader 初始化异常：' + (error?.message || error), 'error'); }
    }
    if (closed) return;
    if (coreIsRunning()) { clearStartupFailure(); return; }
    const info = runtime?.getInfo?.();
    if (runtime?.bootstrapManaged) {
      const reason = info?.lastStatus?.message || 'Loader 已运行，但未收到 Core 的有效实例。';
      showStartupFailure('Core 加载', reason);
    } else {
      const reason = lastStatus?.message ||
        'Bootstrap 没有取得 Loader。请检查 GitHub 访问、酒馆助手和缓存权限。';
      showStartupFailure(remoteFailure?.stage || 'Loader 下载或执行', reason, remoteFailure);
    }
  }
  async function startWithFeedback() {
    try { await startup(); await reportStartupResult(); }
    catch (error) {
      setStatus('Bootstrap 启动异常：' + (error?.message || error), 'error');
      showStartupFailure('Bootstrap 启动', error?.message || String(error));
      if (!closed && currentRuntime()) scheduleCheck(CHECK_INTERVAL);
    }
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
        console.warn('[TLE Loader STABLE] WebCrypto 不可用，切换纯 JS SHA-256。', error);
      }
    }
    return sha256Fallback(bytes);
  }


  function validateManifest(value) {
    if (value?.schema_version !== 1 || value.project !== PROJECT || value.channel !== 'stable-loader') {
      throw new Error('Loader 版本清单不属于受信任的稳定通道');
    }
    if (value.minimum_bootstrap_version && compareVersions(VERSION, value.minimum_bootstrap_version) < 0) {
      throw new Error('当前 Bootstrap 太旧；该 Loader 版本需要新的启动协议');
    }
    const item = value.release;
    const version = value.latest_version;
    if (!item || item.version !== version || !/^\d+\.\d+\.\d+$/.test(version)) {
      throw new Error('Loader 版本号不一致或格式无效');
    }
    const expected = 'loader/runtime/v' + version + '/TLE-Remote-Loader.js';
    if (item.source_path !== expected || !/^[a-f0-9]{40}$/.test(item.source_commit || '') ||
        !/^[a-f0-9]{64}$/.test(item.sha256 || '') ||
        !Number.isSafeInteger(item.size_bytes) || item.size_bytes < 1 || item.size_bytes > MAX_BYTES) {
      throw new Error('Loader 发布信息缺少严格的路径、长度或校验字段');
    }
    const uri = new URL(item.source_url);
    const expectedURL = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/'
      + item.source_commit + '/' + expected;
    if (uri.href !== expectedURL) throw new Error('Loader 源码 URL、仓库或不可变 Commit 不匹配');
    return item;
  }
  async function verify(record) {
    if (!record || typeof record.source !== 'string') throw new Error('Loader 源码缺失');
    validateManifest({ schema_version: 1, project: PROJECT, channel: 'stable-loader',
      latest_version: record.version, release: { ...record,
        source_path: 'loader/runtime/v' + record.version + '/TLE-Remote-Loader.js' } });
    const bytes = encodeUtf8(record.source);
    if (bytes.byteLength !== record.size_bytes || bytes.byteLength > MAX_BYTES) {
      throw new Error('Loader 源码 UTF-8 字节数不匹配');
    }
    if (await sha256(record.source) !== record.sha256) throw new Error('Loader 源码 SHA-256 校验失败');
    return record;
  }
  function requestError(type, message, retryable = false) {
    return Object.assign(new Error(message), { type, retryable });
  }
  function assertActive() {
    if (closed || controller.signal.aborted) throw requestError('cancelled', 'Bootstrap 主动取消请求');
  }
  function removeRetryProgress() {
    try { retryProgress?.remove(); } catch {}
    retryProgress = null;
  }
  function showRetryProgress(message) {
    if (closed || coreIsRunning()) return;
    try {
      if (!retryProgress) {
        retryProgress = HOST_DOC.createElement('div');
        retryProgress.id = 'tle-bootstrap-retry-progress';
        retryProgress.setAttribute('role', 'status');
        retryProgress.style.cssText = 'position:fixed;bottom:16px;left:16px;right:16px;z-index:2147483647;' +
          'padding:12px;border-radius:10px;background:#fbfaf7;color:#293443;font:14px/1.6 sans-serif;pointer-events:none;';
        HOST_DOC.documentElement.appendChild(retryProgress);
      }
      retryProgress.textContent = message;
    } catch {}
  }
  async function waitForRetry(ms) {
    assertActive();
    await new Promise((resolve, reject) => {
      const finish = error => {
        SCRIPT_WIN.clearTimeout(timer);
        controller.signal.removeEventListener('abort', onAbort);
        if (error) reject(error); else resolve();
      };
      const onAbort = () => finish(requestError('cancelled', 'Bootstrap 主动取消重试等待'));
      const timer = SCRIPT_WIN.setTimeout(() => finish(), ms);
      controller.signal.addEventListener('abort', onAbort, { once: true });
      if (controller.signal.aborted) onAbort();
    });
    assertActive();
  }
  async function fetchText(url, stage, timeout = 20000) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      assertActive();
      requestState = { stage, attempt, maxAttempts: MAX_ATTEMPTS, status: 'requesting' };
      const progress = stage + '：第 ' + attempt + '/' + MAX_ATTEMPTS + ' 次请求';
      setStatus(progress);
      if (retryProgress) showRetryProgress(progress);
      const c = new SCRIPT_WIN.AbortController();
      // Track ownership explicitly; an AbortError message alone proves no timeout.
      let timedOut = false;
      const abort = () => c.abort();
      const tid = SCRIPT_WIN.setTimeout(() => { timedOut = true; c.abort(); }, timeout);
      controller.signal.addEventListener('abort', abort, { once: true });
      let failure;
      try {
        assertActive();
        const result = await SCRIPT_WIN.fetch(url, {
          cache: 'no-store', credentials: 'omit', redirect: 'follow', signal: c.signal
        });
        assertActive();
        if (!result.ok) throw requestError('http', 'HTTP ' + result.status,
          result.status === 408 || result.status === 429 || result.status >= 500 && result.status <= 599);
        const text = await result.text();
        assertActive();
        if (timedOut) throw requestError('timeout', 'Bootstrap 请求超时（' + timeout + 'ms）', true);
        requestState = { ...requestState, status: 'success' };
        return text;
      } catch (error) {
        if (closed || controller.signal.aborted) {
          failure = requestError('cancelled', 'Bootstrap 主动取消请求');
        } else if (timedOut && c.signal.aborted) {
          failure = requestError('timeout', 'Bootstrap 请求超时（' + timeout + 'ms）：' + (error?.message || error), true);
        } else if (error.type) {
          failure = error;
        } else if (error?.name === 'AbortError' || /signal is aborted/i.test(error?.message || '')) {
          failure = requestError('interrupted', '请求异常中断（非 Bootstrap 超时或主动取消）：' + (error?.message || error), true);
        } else {
          failure = requestError('network', '网络请求失败：' + (error?.message || error), true);
        }
        Object.assign(failure, { stage, attempt });
        requestState = { ...requestState, status: 'failed', type: failure.type, reason: failure.message };
      } finally {
        SCRIPT_WIN.clearTimeout(tid);
        controller.signal.removeEventListener('abort', abort);
      }
      if (!failure.retryable || attempt === MAX_ATTEMPTS) throw failure;
      requestState = { ...requestState, status: 'waiting' };
      const message = progress + '失败（' + failure.type + '）：' + failure.message +
        '；' + RETRY_DELAYS[attempt - 1] + 'ms 后自动尝试第 ' + (attempt + 1) + '/' + MAX_ATTEMPTS + ' 次。';
      setStatus(message, 'warning');
      showRetryProgress(message);
      await waitForRetry(RETRY_DELAYS[attempt - 1]);
    }
  }
  function getDb() {
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        let request;
        try { request = HOST_WIN.indexedDB.open(DB_NAME, 1); }
        catch (error) { reject(error); return; }
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE)) {
            request.result.createObjectStore(STORE, { keyPath: 'slot' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error('IndexedDB 无法打开'));
        request.onblocked = () => reject(new Error('IndexedDB 被其他页面占用'));
      });
    }
    return dbPromise;
  }
  async function readSlot(slot) {
    const db = await getDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(slot);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('Loader 缓存读取失败'));
      tx.onerror = () => reject(tx.error || new Error('Loader 缓存事务失败'));
    });
  }
  async function writeSlot(slot, record) {
    const db = await getDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put({
        slot, schema_version: 1, version: record.version,
        source: record.source, size_bytes: record.size_bytes, sha256: record.sha256,
        source_url: record.source_url, source_commit: record.source_commit,
        saved_at: new Date().toISOString()
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error || new Error('Loader 缓存写入失败'));
      tx.onabort = () => reject(tx.error || new Error('Loader 缓存写入中断'));
    });
    const readback = await readSlot(slot);
    await verify(readback);
    if (readback.version !== record.version || readback.sha256 !== record.sha256) {
      throw new Error('Loader 缓存读回版本不一致');
    }
    return readback;
  }
  async function readCached(slot) {
    const value = await readSlot(slot);
    if (!value) return null;
    await verify(value);
    if (!/^\d+\.\d+\.\d+$/.test(value.version)) throw new Error('Loader 缓存版本号异常');
    return value;
  }
  function shaToSri(hex) {
    if (typeof SCRIPT_WIN.btoa !== 'function') throw new Error('SRI 编码不可用');
    let binary = '';
    for (let i = 0; i < hex.length; i += 2) binary += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    return 'sha256-' + SCRIPT_WIN.btoa(binary);
  }
  async function injectSource(url, sri) {
    return await new Promise((resolve, reject) => {
      const mount = SCRIPT_DOC.head || SCRIPT_DOC.documentElement;
      const script = SCRIPT_DOC.createElement('script');
      let settled = false;
      const onAbort = () => finish(new Error('Bootstrap 已关闭'));
      const finish = (err) => {
        if (settled) return;
        settled = true;
        controller.signal.removeEventListener('abort', onAbort);
        SCRIPT_WIN.clearTimeout(timer);
        script.onload = script.onerror = null;
        script.remove();
        if (err) reject(err); else resolve();
      };
      const timer = SCRIPT_WIN.setTimeout(() => finish(new Error('Loader 脚本注入超时')), 15000);
      controller.signal.addEventListener('abort', onAbort, { once: true });
      script.async = false;
      script.src = url;
      script.crossOrigin = 'anonymous';
      if (sri) script.integrity = sri;
      script.onload = () => finish(null);
      script.onerror = () => finish(new Error('Loader 脚本加载失败'));
      try { mount.appendChild(script); } catch (error) { finish(error); }
    });
  }
  async function evaluate(record) {
    await verify(record);
    if (closed) throw new Error('Bootstrap 已关闭');
    try {
      await injectSource(record.source_url, shaToSri(record.sha256));
      if (closed) throw new Error('Bootstrap 已关闭');
      if (healthy(record)) {
        await currentRuntime().ready;
        if (healthy(record) && currentRuntime().diagnostics?.scriptInjectionAvailable !== false) return 'immutable-script';
        throw new Error('Loader 初始化失败');
      }
    } catch (error) {
      setStatus('Loader 原地址加载未完成，尝试已校验的 Blob 加载：' + (error?.message || error), 'warning');
    }
    if (closed) throw new Error('Bootstrap 已关闭');
    if (healthy(record)) {
      await currentRuntime().ready;
      if (healthy(record) && currentRuntime().diagnostics?.scriptInjectionAvailable !== false) return 'immutable-script';
    }
    const blob = new SCRIPT_WIN.Blob([record.source], { type: 'text/javascript' });
    const blobURL = SCRIPT_WIN.URL.createObjectURL(blob);
    try {
      await injectSource(blobURL, null);
      if (!healthy(record)) throw new Error('脚本执行后 Loader API 健康检查失败');
      await currentRuntime().ready;
      if (!healthy(record) || currentRuntime().diagnostics?.scriptInjectionAvailable === false) throw new Error('Loader 初始化失败');
      return 'verified-blob';
    } finally { SCRIPT_WIN.URL.revokeObjectURL(blobURL); }
  }

  async function installRecord(record, { manual = false, force = false } = {}) {
    if (!record || closed || installing) return false;
    installing = true;
    notify();
    try {
    const running = currentRuntime();
    if (healthy(record)) return true;
    if (running?.bootstrapManaged && compareVersions(record.version, running.version) < 0 && !force) {
      setStatus('为避免自动降级，忽略远端较旧的 Loader v' + record.version, 'warning');
      return false;
    }
    if (running?.getInfo?.()?.busy) {
      setStatus('Loader 正在执行操作，当前不会强行替换。下次检查将再尝试。', 'warning');
      return false;
    }
    if (manual && !SCRIPT_WIN.confirm('将 Loader 更新至 v' + record.version + '？\n\n已验证源码 SHA-256。更新失败时尝试恢复上一份 Loader。')) {
      return false;
    }
    // Never take over a standalone Loader that the Bootstrap did not create.
    if (running && !running.bootstrapManaged && !running.diagnostics?.destroyed) {
      setStatus('检测到独立 Loader 仍在运行，拒绝自动替换。请禁用旧脚本后刷新。', 'error');
      return false;
    }
    let fallback = cached;
    if (running?.bootstrapManaged && running.version !== fallback?.version) {
      setStatus('当前 Loader 与 Bootstrap 的上一版本缓存不一致，拒绝无备份更新。', 'warning');
      return false;
    }
    if (running?.bootstrapManaged && !fallback) {
      setStatus('没有可靠的上一 Loader 备份；本次不会替换。', 'warning');
      return false;
    }
    if (fallback && fallback.sha256 !== record.sha256) {
      try { await writeSlot('previous', fallback); }
      catch (error) {
        setStatus('无法保存上一 Loader 回滚副本；取消此次更新：' + (error?.message || error), 'error');
        return false;
      }
    }
    try {
      // Confirm durable storage before retiring the current runtime.
      await writeSlot('candidate', record);
      if (closed || (!manual && running && !isAutoUpdateEnabled())) return false;
      if (running?.getInfo?.()?.busy) return false;
      running?.destroy?.();
      const method = await evaluate(record);
      if (!healthy(record)) throw new Error('Loader 自检失败');
      cached = await writeSlot('last', record);
      setStatus('Loader v' + currentRuntime().version + ' 已实际运行（' + method + '），持久缓存已读回校验。', 'success');
      notify();
      return true;
    } catch (error) {
      if (closed) return false;
      setStatus('Loader v' + record.version + ' 启动失败，准备恢复上一版本：' + (error?.message || error), 'error');
      const after = currentRuntime();
      if (after && after !== running) { try { after.destroy?.(); } catch {} }
      if (fallback) {
        try {
          await evaluate(fallback);
          if (healthy(fallback)) {
            cached = await writeSlot('last', fallback);
            setStatus('已恢复之前的 Loader v' + fallback.version, 'warning');
            return false;
          }
        } catch (rollbackError) {
          setStatus('上一 Loader 恢复失败；联网后将自动重试：'
            + (rollbackError?.message || rollbackError), 'error');
        }
      }
      return false;
    }
    } finally { installing = false; notify(); }
  }

  function checkRemote() {
    if (closed) return Promise.resolve(null);
    if (checkPromise) return checkPromise;
    if (installing) return Promise.resolve(candidate);
    busy = true;
    // Publish the shared promise before notifying host listeners (which may re-enter).
    checkPromise = Promise.resolve().then(checkRemoteOnce).finally(() => {
      busy = false;
      checkPromise = null;
      removeRetryProgress();
      notify();
    });
    notify();
    return checkPromise;
  }
  async function checkRemoteOnce() {
    let stage = 'Loader 清单下载';
    remoteFailure = null;
    try {
      const raw = await fetchText(MANIFEST_URL + '?_tle=' + Date.now(), stage);
      assertActive();
      stage = 'Loader 清单安全验证';
      const release = validateManifest(JSON.parse(raw));
      remoteCheckedAt = new Date().toISOString();
      // Reuse verified bytes only when every immutable identity field matches.
      const reusable = [candidate, cached].find(record => record &&
        ['version', 'source_commit', 'source_url', 'size_bytes', 'sha256'].every(key => record[key] === release[key]));
      stage = 'Loader 源码下载';
      const source = reusable ? reusable.source : await fetchText(release.source_url, stage);
      const record = { ...release, source };
      stage = 'Loader 源码安全验证';
      await verify(record);
      assertActive();
      candidate = record;
      setStatus('GitHub Loader v' + record.version + ' 已通过校验。', 'success');
      return candidate;
    } catch (error) {
      if (closed || error.type === 'cancelled') return null;
      candidate = null;
      remoteFailure = {
        stage: error.stage || stage, attempt: error.attempt || requestState?.attempt || 1,
        maxAttempts: MAX_ATTEMPTS, type: error.type || 'security',
        reason: String(error?.message || error), at: new Date().toISOString()
      };
      setStatus('Loader 检查失败，保留已有运行版本：' + remoteFailure.stage +
        '，尝试 ' + remoteFailure.attempt + '/' + MAX_ATTEMPTS +
        '，错误类型 ' + remoteFailure.type + '：' + remoteFailure.reason, 'warning');
      return null;
    }
  }
  async function loadRemote() {
    if (busy || installing || closed) return false;
    const record = candidate || await checkRemote();
    if (!record || closed) return false;
    return await installRecord(record, { manual: true });
  }
  async function refreshAutomatic() {
    if (closed || installing) return;
    const record = await checkRemote();
    if (!record || closed) return;
    const running = currentRuntime();
    if (!running) {
      // First-time initialization is allowed even if auto-update is disabled;
      // the user deliberately enabled this Bootstrap installer.
      await installRecord(record);
    } else if (isAutoUpdateEnabled() && compareVersions(record.version, running.version) > 0) {
      await installRecord(record);
    } else if (compareVersions(record.version, running.version) > 0) {
      setStatus('发现较新 Loader v' + record.version + '；自动更新已关闭，可手动安装。');
    }
  }
  function scheduleCheck(ms = CHECK_INTERVAL) {
    SCRIPT_WIN.clearTimeout(checkTimer);
    if (closed) return;
    checkTimer = SCRIPT_WIN.setTimeout(async () => {
      try { await refreshAutomatic(); await reportStartupResult(); }
      finally { scheduleNextCheck(); }
    }, ms);
  }
  function scheduleNextCheck() {
    // Exhausted first-start failures wait for online/manual action, not a 1-minute loop.
    if (!currentRuntime() && remoteFailure) return;
    const pending = Boolean(!remoteFailure && candidate && currentRuntime() &&
      compareVersions(candidate.version, currentRuntime().version) > 0 && isAutoUpdateEnabled());
    scheduleCheck(pending ? RETRY_INTERVAL : CHECK_INTERVAL);
  }
  async function startup() {
    // A valid hash does not imply a runtime will initialize successfully.
    // Try both durable slots on read, execution or health-check failure.
    for (const slot of ['last', 'previous']) {
      if (closed || currentRuntime()) break;
      try {
        cached = await readCached(slot);
        if (cached && await installRecord(cached)) break;
      } catch (error) {
        setStatus('Loader ' + slot + ' 缓存恢复失败：' + (error?.message || error), 'warning');
      }
    }
    if (!closed) await refreshAutomatic();
    scheduleNextCheck();
  }
  function destroy() {
    if (closed) return;
    closed = true;
    if (busy && requestState) requestState = { ...requestState, status: 'cancelled', type: 'cancelled', reason: 'Bootstrap 主动取消请求' };
    controller.abort();
    SCRIPT_WIN.clearTimeout(checkTimer);
    removeFailureDialog();
    removeRetryProgress();
    const runtime = currentRuntime();
    if (runtime?.bootstrapManaged) runtime.destroy?.();
    const core = HOST_WIN.__TAVERN_LAYOUT_ENGINE_V02__;
    if (core?.remoteLoaderManaged) core.destroy?.();
    dbPromise?.then(db => db.close?.()).catch(() => {});
    if (HOST_WIN[BOOT_KEY] === api) delete HOST_WIN[BOOT_KEY];
  }
  const api = {
    version: VERSION,
    channel: 'stable-loader',
    getInfo,
    checkRemote,
    loadRemote,
    destroy
  };
  HOST_WIN[BOOT_KEY] = api;
  SCRIPT_WIN.addEventListener('pagehide', destroy, { once: true, signal: controller.signal });
  SCRIPT_WIN.addEventListener('beforeunload', destroy, { once: true, signal: controller.signal });
  HOST_WIN.addEventListener('pagehide', destroy, { once: true, signal: controller.signal });
  HOST_WIN.addEventListener('beforeunload', destroy, { once: true, signal: controller.signal });
  HOST_WIN.addEventListener('tle-loader-auto-update-preference', () => {
    notify();
    if (isAutoUpdateEnabled()) void refreshAutomatic();
  }, { signal: controller.signal });
  // When the cached legacy Loader finishes its Core check (even if that check
  // rejects a newer Core requiring a newer Loader), retry Loader upgrade now.
  // Do not race an in-progress installation or trigger from our own events.
  HOST_WIN.addEventListener('tle-loader-state-change', () => {
    if (coreIsRunning()) clearStartupFailure();
    if (closed || busy || installing || !isAutoUpdateEnabled() || !candidate) return;
    const running = currentRuntime();
    if (!running || compareVersions(candidate.version, running.version) <= 0) return;
    if (running.getInfo?.().busy) return;
    scheduleCheck(0);
  }, { signal: controller.signal });
  HOST_WIN.addEventListener('online', () => scheduleCheck(0), { signal: controller.signal });
  HOST_WIN.addEventListener('storage', event => {
    if (event.key === AUTO_UPDATE_KEY) { notify(); if (isAutoUpdateEnabled()) scheduleCheck(0); }
  }, { signal: controller.signal });
  const oldStable = currentRuntime();
  const oldTest = HOST_WIN.__TLE_REMOTE_LOADER_TEST_V1__;
  if (oldStable && !oldStable.bootstrapManaged && !oldStable.diagnostics?.destroyed) {
    setStatus('旧独立 Stable Loader 仍在本次页面运行，Bootstrap 不接管。请停用旧脚本后完整刷新 TT。', 'error');
    showStartupFailure('旧 Loader 冲突', lastStatus.message);
  } else if (oldTest && !oldTest.diagnostics?.destroyed) {
    setStatus('旧 Test Loader 仍在本次页面运行，Bootstrap 暂停启动。请停用旧脚本后完整刷新 TT。', 'error');
    showStartupFailure('旧 Test Loader 冲突', lastStatus.message);
  } else {
    setStatus('TLE Bootstrap v' + VERSION + ' 已启动：检查 Loader 运行时版本。');
    void startWithFeedback();
  }
})();
