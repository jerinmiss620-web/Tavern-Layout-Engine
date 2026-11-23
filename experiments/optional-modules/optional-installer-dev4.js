// TLE 可选功能包 · Dev4。只安装经 SHA-256 校验的作者原版完整脚本。
  // 不直接执行下载源码，不替换用户全局脚本树，不修改同名/同 ID 的已有源码。
  const OPTIONAL_PACKAGE_ID = 'd354e7f5-1719-4942-a63d-71f6db16c059';
  const OPTIONAL_PACKAGE_NAME = '🎨 主题壁纸绑定 (终极存储版) · 原生图库多选 v4.1';
  const OPTIONAL_REPO = 'jerinmiss620-web/Tavern-Layout-Engine';
  const OPTIONAL_MANIFEST_URLS = [
    { label: 'GitHub Raw · 开发分支', url: 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/refs/heads/feature/companion-profiles-20261123/optional-modules/manifest.json' },
    { label: 'GitHub Raw · 固定快照', url: 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/49570194e2a160c18f082970e78cfe04ff776ce3/optional-modules/manifest.json' },
    { label: 'jsDelivr · 固定快照', url: 'https://cdn.jsdelivr.net/gh/jerinmiss620-web/Tavern-Layout-Engine@49570194e2a160c18f082970e78cfe04ff776ce3/optional-modules/manifest.json' },
    { label: 'Fastly · 固定快照', url: 'https://fastly.jsdelivr.net/gh/jerinmiss620-web/Tavern-Layout-Engine@49570194e2a160c18f082970e78cfe04ff776ce3/optional-modules/manifest.json' },
  ];
  const OPTIONAL_RUNTIME = { busy: false, source: '', lastError: '', status: '' };
  function optionalUtf8(text) {
    const Encoder = SCRIPT_WIN.TextEncoder || HOST_WIN.TextEncoder;
    if (typeof Encoder === 'function') return new Encoder().encode(text);
    // TT 非标准 WebView 的后备 UTF-8 转换，不改变原字符串。
    const out = [];
    for (const ch of text) {
      let n = ch.codePointAt(0);
      if (n >= 0xd800 && n <= 0xdfff) n = 0xfffd;
      if (n < 0x80) out.push(n);
      else if (n < 0x800) out.push(0xc0 | (n >> 6), 0x80 | (n & 63));
      else if (n < 0x10000) out.push(0xe0 | (n >> 12), 0x80 | ((n >> 6) & 63), 0x80 | (n & 63));
      else out.push(0xf0 | (n >> 18), 0x80 | ((n >> 12) & 63), 0x80 | ((n >> 6) & 63), 0x80 | (n & 63));
    }
    return new Uint8Array(out);
  }
  function optionalSha256Fallback(bytes) {
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
    const len = bytes.length;
    const total = Math.ceil((len + 9) / 64) * 64;
    const data = new Uint8Array(total);
    data.set(bytes);
    data[len] = 0x80;
    const dv = new DataView(data.buffer);
    dv.setUint32(total - 8, Math.floor(len / 0x20000000) >>> 0);
    dv.setUint32(total - 4, (len * 8) >>> 0);
    const rr = (v, n) => (v >>> n) | (v << (32 - n));
    for (let offset = 0; offset < total; offset += 64) {
      const W = new Uint32Array(64);
      for (let i = 0; i < 16; i++) W[i] = dv.getUint32(offset + 4 * i);
      for (let i = 16; i < 64; i++) {
        const x = W[i - 15], y = W[i - 2];
        const s0 = rr(x, 7) ^ rr(x, 18) ^ (x >>> 3);
        const s1 = rr(y, 17) ^ rr(y, 19) ^ (y >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
      }
      let [a,b,c,d,e,f,g,h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + W[i]) >>> 0;
        const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      const next = [a,b,c,d,e,f,g,h];
      for (let i = 0; i < 8; i++) H[i] = (H[i] + next[i]) >>> 0;
    }
    return H.map(v => v.toString(16).padStart(8, '0')).join('');
  }
  async function optionalSha256(bytes) {
    const subtle = SCRIPT_WIN.crypto?.subtle || HOST_WIN.crypto?.subtle;
    if (subtle) {
      try {
        const digest = await subtle.digest('SHA-256', bytes);
        return [...new Uint8Array(digest)].map(v => v.toString(16).padStart(2, '0')).join('');
      } catch {}
    }
    return optionalSha256Fallback(bytes);
  }
  function optionalBridge() {
    const binding = [SCRIPT_WIN, SCRIPT_WIN.TavernHelper, HOST_WIN.TavernHelper, HOST_WIN];
    const directRead = typeof getScriptTrees === 'function' ? getScriptTrees : null;
    const directWrite = typeof updateScriptTreesWith === 'function' ? updateScriptTreesWith : null;
    for (const item of binding) {
      const read = directRead || item?.getScriptTrees;
      const write = directWrite || item?.updateScriptTreesWith;
      if (typeof read === 'function' && typeof write === 'function') {
        return { read: read.bind(item || SCRIPT_WIN), write: write.bind(item || SCRIPT_WIN) };
      }
    }
    return null;
  }
  function optionalWalk(trees, visit) {
    for (const item of trees || []) {
      if (item?.type === 'script') visit(item);
      else if (item?.type === 'folder' && Array.isArray(item.scripts)) optionalWalk(item.scripts, visit);
    }
  }
  function optionalFind(trees) {
    const matchingIds = [], matchingNames = [];
    optionalWalk(trees, item => {
      if (item.id === OPTIONAL_PACKAGE_ID) matchingIds.push(item);
      if (item.name === OPTIONAL_PACKAGE_NAME && item.id !== OPTIONAL_PACKAGE_ID) matchingNames.push(item);
    });
    return { matchingIds, matchingNames };
  }
  function optionalSetStatus(message) {
    OPTIONAL_RUNTIME.status = String(message);
    const node = state.panel?.querySelector('[data-tle-optional-status]');
    if (node) node.textContent = OPTIONAL_RUNTIME.status;
  }
  function optionalRefreshUI() {
    const panel = state.panel?.querySelector('[data-tle-optional-wallpaper]');
    if (!panel) return;
    const statusNode = panel.querySelector('[data-tle-optional-status]');
    const action = id => panel.querySelector('[data-tle-optional-action="' + id + '"]');
    let mode = 'unavailable', desc = '未检测到酒馆助手脚本管理接口，请确认酒馆助手已启用。';
    const bridge = optionalBridge();
    if (bridge) {
      try {
        const trees = bridge.read({ type: 'global' });
        if (!Array.isArray(trees)) throw new Error('全局脚本列表不可用');
        const matches = optionalFind(trees);
        if (matches.matchingIds.length > 1) {
          mode = 'collision'; desc = '检测到多个相同脚本 ID，请先到酒馆助手内整理。';
        } else if (matches.matchingIds.length === 1) {
          mode = matches.matchingIds[0].enabled ? 'enabled' : 'disabled';
          desc = matches.matchingIds[0].enabled
            ? '已安装并启用 · 可直接在酒馆助手管理'
            : '已安装但未启用 · 可通过 TLE 启用';
          if (matches.matchingIds[0].name !== OPTIONAL_PACKAGE_NAME) desc += '（脚本已改名）';
        } else if (matches.matchingNames.length) {
          mode = 'collision'; desc = '存在同名但 ID 不同的脚本，请在酒馆助手核对后手动处理。';
        } else {
          mode = 'uninstalled'; desc = '未安装 · 仅点击安装才会下载远程源码';
        }
      } catch (error) {
        desc = '读取酒馆助手脚本列表失败：' + (error?.message || error);
      }
    }
    for (const id of ['install','enable','disable','remove']) {
      const button = action(id);
      if (!button) continue;
      const visible = id === 'install' ? mode === 'uninstalled'
        : id === 'enable' ? mode === 'disabled'
        : id === 'disable' ? mode === 'enabled'
        : mode === 'disabled' || mode === 'enabled';
      button.hidden = !visible;
      button.disabled = OPTIONAL_RUNTIME.busy;
    }
    panel.dataset.optionalMode = mode;
    if (statusNode && !OPTIONAL_RUNTIME.busy) {
      statusNode.textContent = desc + (OPTIONAL_RUNTIME.lastError ? ' · 最近操作失败：' + OPTIONAL_RUNTIME.lastError
        : OPTIONAL_RUNTIME.source ? ' · 最近下载来源：' + OPTIONAL_RUNTIME.source : '');
    }
  }
  function optionalSourceAllowed(url) {
    try {
      const u = new URL(url);
      if (u.protocol !== 'https:' || u.username || u.password || u.port) return false;
      if (u.hostname === 'raw.githubusercontent.com') {
        return /^\/jerinmiss620-web\/Tavern-Layout-Engine\/[a-f0-9]{40}\/optional-modules\/theme-wallpaper\/theme-wallpaper-v\d+(?:\.\d+)*\.json$/.test(u.pathname);
      }
      if (['cdn.jsdelivr.net','fastly.jsdelivr.net','testingcf.jsdelivr.net'].includes(u.hostname)) {
        return /^\/gh\/jerinmiss620-web\/Tavern-Layout-Engine@[a-f0-9]{40}\/optional-modules\/theme-wallpaper\/theme-wallpaper-v\d+(?:\.\d+)*\.json$/.test(u.pathname);
      }
      return false;
    } catch { return false; }
  }
  async function optionalTrySources(sources, validate) {
    const errors = [];
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      if (state.destroyed) throw new Error('TLE 已退出');
      const control = new HOST_WIN.AbortController();
      const timeout = HOST_WIN.setTimeout(() => control.abort(), 8000);
      optionalSetStatus('正在下载（' + (i + 1) + '/' + sources.length + '）：' + src.label);
      try {
        const fetcher = typeof SCRIPT_WIN.fetch === 'function'
          ? SCRIPT_WIN.fetch.bind(SCRIPT_WIN) : HOST_WIN.fetch?.bind(HOST_WIN);
        if (!fetcher) throw new Error('当前宿主不支持 fetch 网络接口');
        const response = await fetcher(src.url, {
          method: 'GET', redirect: 'follow', cache: 'no-store', credentials: 'omit', signal: control.signal,
        });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const txt = await response.text();
        if (txt.length > 500000) throw new Error('响应内容超过大小限制');
        const value = await validate(txt, src);
        HOST_WIN.clearTimeout(timeout);
        OPTIONAL_RUNTIME.source = src.label;
        return value;
      } catch (error) {
        errors.push(src.label + '：' + (error?.message || error));
        console.warn('[TLE 可选功能包] 镜像失败，尝试备用地址：', src.label, error);
      } finally {
        HOST_WIN.clearTimeout(timeout);
      }
    }
    throw new Error('所有镜像均失败。' + errors.map(x => '\n' + x).join(''));
  }
  async function optionalGetManifest() {
    return optionalTrySources(OPTIONAL_MANIFEST_URLS, async txt => {
      const manifest = JSON.parse(txt);
      const entry = manifest?.packages?.find(x => x.key === 'theme-wallpaper');
      if (manifest?.schema !== 1 || !entry || entry.script_id !== OPTIONAL_PACKAGE_ID
          || !/^[a-f0-9]{64}$/.test(entry.sha256 || '')
          || !Number.isInteger(entry.size_bytes) || entry.size_bytes < 1000 || entry.size_bytes > 200000
          || !Array.isArray(entry.sources) || entry.sources.length < 2
          || entry.sources.some(src => !src?.label || !optionalSourceAllowed(src.url))) {
        throw new Error('功能清单不合法或包含非受信任下载地址');
      }
      return entry;
    });
  }
  async function optionalGetPackage(entry) {
    return optionalTrySources(entry.sources, async txt => {
      const bytes = optionalUtf8(txt);
      if (bytes.length !== entry.size_bytes) throw new Error('文件长度与清单不符');
      if ((await optionalSha256(bytes)) !== entry.sha256) throw new Error('SHA-256 校验失败');
      const file = JSON.parse(txt);
      if (file.type !== 'script' || file.id !== OPTIONAL_PACKAGE_ID || file.name !== OPTIONAL_PACKAGE_NAME
          || typeof file.content !== 'string' || file.content.length < 100
          || !file.button || !file.data || !file.export_with) throw new Error('不是预期的原版酒馆助手脚本');
      return file;
    });
  }
  function optionalRewriteTrees(trees, transform) {
    let changed = 0;
    const remap = items => items.flatMap(item => {
      if (item?.type === 'script' && item.id === OPTIONAL_PACKAGE_ID) {
        changed++;
        const next = transform(item);
        return next ? [next] : [];
      }
      if (item?.type === 'folder' && Array.isArray(item.scripts)) {
        const children = remap(item.scripts);
        return children === item.scripts ? [item] : [{ ...item, scripts: children }];
      }
      return [item];
    });
    const result = remap(trees);
    if (changed !== 1) throw new Error('脚本已被移除或出现重名 ID，请刷新后重试');
    return result;
  }
  async function optionalChange(action) {
    if (OPTIONAL_RUNTIME.busy) return;
    const bridge = optionalBridge();
    if (!bridge) { optionalSetStatus('未找到酒馆助手脚本管理接口。'); return; }
    if (action === 'remove' && !HOST_WIN.confirm(
      '确认从酒馆助手卸载「主题绑定壁纸」？\n不会删除原生图库图片，也不会主动清空已保存的主题壁纸绑定数据。'
    )) return;
    OPTIONAL_RUNTIME.busy = true;
    OPTIONAL_RUNTIME.lastError = '';
    OPTIONAL_RUNTIME.source = '';
    optionalRefreshUI();
    try {
      const trees = await Promise.resolve(bridge.read({ type: 'global' }));
      if (!Array.isArray(trees)) throw new Error('酒馆助手脚本列表不可用');
      const matches = optionalFind(trees);
      if (matches.matchingIds.length > 1 || matches.matchingNames.length) throw new Error('脚本 ID / 名称发生冲突，请到酒馆助手处理');
      if (action === 'install') {
        if (matches.matchingIds.length) throw new Error('已安装该脚本，不会重复导入');
        const manifest = await optionalGetManifest();
        const file = await optionalGetPackage(manifest);
        optionalSetStatus('下载与 SHA-256 校验通过，正在导入酒馆助手…');
        await Promise.resolve(bridge.write(existing => {
          const match = optionalFind(existing);
          if (match.matchingIds.length || match.matchingNames.length) throw new Error('安装期间已有其他同名脚本，请勿重复安装');
          return [...existing, { ...file, enabled: true }];
        }, { type: 'global' }));
      } else {
        if (matches.matchingIds.length !== 1) throw new Error('没有检测到目标脚本');
        const enabled = action === 'enable';
        await Promise.resolve(bridge.write(existing => optionalRewriteTrees(existing,
          script => action === 'remove' ? null : { ...script, enabled }
        ), { type: 'global' }));
      }
      const after = await Promise.resolve(bridge.read({ type: 'global' }));
      const item = optionalFind(after).matchingIds;
      const success = action === 'remove' ? item.length === 0
        : item.length === 1 && item[0].enabled === (action !== 'disable');
      if (!success) throw new Error('酒馆助手尚未确认操作结果；请在脚本列表中检查状态');
      const label = action === 'install' ? '安装并启用' : action === 'remove' ? '卸载'
        : action === 'enable' ? '启用' : '停用';
      if (action === 'disable' || action === 'remove') {
        // The script's existing singleton exposes cleanup; never erase its saved bindings.
        try { HOST_WIN['theme-bg-binder']?.cleanup?.(); } catch {}
      }
      optionalSetStatus('主题绑定壁纸已' + label + '。建议刷新酒馆确认脚本运行状态。'
        + (OPTIONAL_RUNTIME.source ? ' · 镜像：' + OPTIONAL_RUNTIME.source : ''));
      HOST_WIN.toastr?.success?.('主题绑定壁纸已' + label + '。', 'TLE 可选功能');
    } catch (error) {
      OPTIONAL_RUNTIME.lastError = String(error?.message || error).slice(0, 340);
      optionalSetStatus('操作未完成：' + OPTIONAL_RUNTIME.lastError);
      HOST_WIN.toastr?.error?.(error?.message || '请检查网络与酒馆助手脚本管理接口', 'TLE 可选功能');
      console.warn('[TLE 可选功能包] 操作失败', error);
    } finally {
      OPTIONAL_RUNTIME.busy = false;
      optionalRefreshUI();
    }
  }
