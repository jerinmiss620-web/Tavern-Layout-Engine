(() => {
  'use strict';
  // 简介：TLE 永久远程更新链。使用方式：仅导入并启用 Bootstrap，由它管理 Loader 与 Core。
  // 注意事项：首次迁移禁用旧独立脚本；首次安装需要联网，自动更新可在原有折叠区域关闭。作者：小松鼠 & ChatGPT（小松7）。

  // Tavern Layout Engine · Host Diagnostics 2.0 · v0.3.221
  // Created collaboratively by 小松鼠 & ChatGPT（小松7）.
  const SCRIPT_WIN = window;
  let HOST_WIN;
  let HOST_DOC;

  try {
    HOST_WIN = SCRIPT_WIN.parent;
    HOST_DOC = HOST_WIN.document;
    if (!HOST_DOC?.documentElement) throw new Error('宿主页面 document 不可访问');
  } catch (error) {
    console.error('[Tavern Layout Engine] 无法访问 SillyTavern 宿主页面。', error);
    return;
  }

  const INSTANCE_KEY = '__TAVERN_LAYOUT_ENGINE_V02__';
  const STABLE_LOADER_KEY = '__TLE_REMOTE_LOADER_STABLE_V1__';
  const LEGACY_TEST_LOADER_KEY = '__TLE_REMOTE_LOADER_TEST_V1__';
  const previousInstance = HOST_WIN[INSTANCE_KEY];
  previousInstance?.destroy?.();
  // The standalone Fade Engine Lab is superseded by the integrated optional module.
  // Stop its observers, mask and mirror before TLE installs its own implementation.
  try { HOST_WIN.__TLE_FADE_ENGINE_LAB_V020__?.destroy?.(); } catch {}
  // v0.3.136 did not release optional folds on destroy. Restore its misplaced
  // preset wrapper when upgrading in the same page before selecting our region.
  for (const wrapper of HOST_DOC.querySelectorAll('[data-tle-fold-wrapper="preset-model-settings"]')) {
    const content = wrapper.querySelector(':scope > .inline-drawer-content');
    if (content?.querySelector('#SystemPromptColumn, #completion_prompt_manager')) {
      wrapper.replaceWith(...content.childNodes);
    }
  }
  // Unwrap the obsolete rail only when it is still present after an upgrade.
  for (const wrapper of HOST_DOC.querySelectorAll('#top-settings-holder .tle-nav-scroll')) {
    wrapper.replaceWith(...wrapper.childNodes);
  }
  HOST_DOC.querySelectorAll('#top-settings-holder .tle-drawer-label, #top-settings-holder > .tle-sidebar-info, #tle-workspace-header, #tle-organizer-entry, #tle-global-search-panel, #tle-chat-tools-toggle, #tle-chat-tools-panel').forEach(node => node.remove());
  HOST_DOC.querySelectorAll('#top-settings-holder .tle-chat-actions, #top-settings-holder [data-tle-chat-actions]').forEach(node => node.remove());
  HOST_DOC.getElementById('tle-chat-fade-wallpaper-anchor')?.remove();
  HOST_DOC.getElementById('tle-floor-zero-spacer')?.remove();
  try { HOST_WIN.localStorage.removeItem('tle.chatActions.v1'); } catch {}
  HOST_DOC.body.classList.remove('tle-global-search-open', 'tle-quick-modal-open');
  HOST_DOC.body.removeAttribute('data-tle-search-available');
  HOST_DOC.body.removeAttribute('data-tle-compat-layer-repair');
  HOST_DOC.body.removeAttribute('data-tle-compat-nav-repair');
  HOST_DOC.body.removeAttribute('data-tle-compat-structure-repair');
  HOST_DOC.body.removeAttribute('data-tle-compat-panel-bg');
  HOST_DOC.body.removeAttribute('data-tle-compat-panel-bg-mode');
  HOST_DOC.body.style.removeProperty('--tle-compat-panel-bg-custom');
    HOST_DOC.body.removeAttribute('data-tle-compat-nav-text');
    HOST_DOC.body.style.removeProperty('--tle-nav-text-color');
  HOST_DOC.body.style.removeProperty('--tle-nav-icon-opacity');

  const ID = {
    style: 'tle-core-style',
    nav: 'tle-nav-entry',
    organizerEntry: 'tle-organizer-entry',
    panel: 'tle-control-panel',
    presetGrid: 'tle-preset-workspace',
    presetSettings: 'tle-preset-settings',
    presetPrompts: 'tle-preset-prompts',
    characterGrid: 'tle-character-workspace',
    characterIdentity: 'tle-character-identity',
    characterContent: 'tle-character-content',
    mobileToggle: 'tle-mobile-hamburger',
    dockToggle: 'tle-navigation-dock-toggle',
    workspaceHeader: 'tle-workspace-header',
    greetingToggle: 'tle-workspace-greeting-toggle',
    searchToggle: 'tle-workspace-search',
    chatShortcut: 'tle-chat-shortcut',
    chatToolsButton: 'tle-chat-tools-toggle',
    chatToolsPanel: 'tle-chat-tools-panel',
    scrollBottom: 'tle-scroll-bottom',
    diagnosticButton: 'tle-diagnostic-float',
    compatibilitySection: 'tle-compatibility-section',
  };

  const diagnosticErrors = [];
  const DIAGNOSTIC_ERROR_LIMIT = 30;
  const DIAGNOSTIC_MODE_KEY = 'tle.diagnosticMode';
  const COMPAT_LAYER_REPAIR_KEY = 'tle.compatibility.layerRepair';
  const COMPAT_NAV_REPAIR_KEY = 'tle.compatibility.navigationRepair';
  const COMPAT_PANEL_BG_KEY = 'tle.compatibility.panelBackground';
  const COMPAT_PANEL_BG_MODE_KEY = 'tle.compatibility.panelBackgroundMode';
  const COMPAT_PANEL_BG_COLOR_KEY = 'tle.compatibility.panelBackgroundColor';
  const COMPAT_NAV_TEXT_KEY = 'tle.compatibility.navTextEnabled';
  const COMPAT_NAV_TEXT_COLOR_KEY = 'tle.compatibility.navTextColor';
  const NAV_EDGE_SWIPE_KEY = 'tle.navigation.edgeSwipe';
  // Only retain a restoration marker if TLE changed ST's native gesture from on to off.
  const NAV_NATIVE_GESTURE_RESTORE_KEY = 'tle.navigation.restoreNativeGestures';
  const NAV_DOCKED_KEY = 'tle.navigationDocked';
  const NAV_ICON_OPACITY_KEY = 'tle.navigation.iconOpacity';

  function getStoredBool(key, fallback = false) {
    try {
      const value = HOST_WIN.localStorage.getItem(key);
      return value == null ? fallback : value === 'true';
    } catch {
      return fallback;
    }
  }

  function getStoredString(key, fallback = '') {
    try {
      return HOST_WIN.localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback;
    }
  }

  let compatibilityLayerRepair = getStoredBool(COMPAT_LAYER_REPAIR_KEY, false);
  let compatibilityNavigationRepair = getStoredBool(COMPAT_NAV_REPAIR_KEY, false);
  // Structural repair is session-only: it defaults off and is never persisted.
  let compatibilityStructureRepair = false;
  let compatibilityPanelBackground = getStoredBool(COMPAT_PANEL_BG_KEY, false);
  let compatibilityPanelBackgroundMode = getStoredString(COMPAT_PANEL_BG_MODE_KEY, 'smart');
  let compatibilityPanelBackgroundColor = getStoredString(COMPAT_PANEL_BG_COLOR_KEY, '#282027');
  if (!/^#[0-9a-f]{6}$/i.test(compatibilityPanelBackgroundColor)) {
    compatibilityPanelBackgroundColor = '#282027';
  }

  let compatibilityNavText = getStoredBool(COMPAT_NAV_TEXT_KEY, false);
  let compatibilityNavTextColor = getStoredString(COMPAT_NAV_TEXT_COLOR_KEY, '#ffffff');
  if (!/^#[0-9a-f]{6}$/i.test(compatibilityNavTextColor)) compatibilityNavTextColor = '#ffffff';
  // The setting can be tested from a PC; touch listeners remain mobile-only.
  let navEdgeSwipeEnabled = getStoredBool(NAV_EDGE_SWIPE_KEY, false);

  // Snapshot only the pre-gesture state for diagnostic reporting.
  // The debugger never rewrites native drawer classes or navigation state.
  let diagnosticPreInteractionSnapshot = null;
  let diagnosticCaptureSnapshot = null;
  let diagnosticClientHints = { status: 'not-requested' };
  let diagnosticClientHintsRequested = false;
  const navigationInteractionProbe = {
    lastPointerDown: null,
    lastClickCapture: null,
    activeClickEvent: null,
  };
  function getDiagnosticMode() {
    try { return HOST_WIN.localStorage.getItem(DIAGNOSTIC_MODE_KEY) === 'true'; }
    catch { return false; }
  }
  let diagnosticMode = getDiagnosticMode();

  function sanitizeDiagnosticText(value, limit = 500) {
    return String(value || '')
      .replace(/https?:\/\/[^\s\"'<>]+/gi, raw => {
        try { const url = new URL(raw); return `${url.origin}${url.pathname}`; }
        catch { return '[URL redacted]'; }
      })
      .replace(/([\"']?(?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|password|passwd|secret|cookie)[\"']?\s*[:=]\s*[\"']?)[^\s,;\"'}]+/gi, '$1[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi, 'Bearer [REDACTED]')
      .replace(/\bsk-[A-Za-z0-9_-]{16,}\b/g, '[REDACTED_KEY]')
      .replace(/([\"'`])[^\"'`\r\n]{60,}\1/g, '$1[LONG_TEXT_REDACTED]$1')
      .slice(0, limit);
  }

  function requestDiagnosticClientHints() {
    if (diagnosticClientHintsRequested) return;
    diagnosticClientHintsRequested = true;
    let data = null;
    try { data = HOST_WIN.navigator?.userAgentData || null; } catch {}
    if (!data) { diagnosticClientHints = { status: 'unsupported' }; return; }
    diagnosticClientHints = {
      status: 'low-entropy-only',
      brands: Array.isArray(data.brands) ? data.brands.filter(item => !/not.?a.?brand/i.test(item.brand || '')).map(item => ({ brand: item.brand, version: item.version })) : [],
      mobile: typeof data.mobile === 'boolean' ? data.mobile : null,
      platform: data.platform || null,
    };
    if (typeof data.getHighEntropyValues !== 'function') return;
    diagnosticClientHints.status = 'pending';
    let hintsPromise;
    try { hintsPromise = data.getHighEntropyValues(['architecture', 'bitness', 'model', 'platformVersion', 'fullVersionList']); }
    catch (error) { diagnosticClientHints = { ...diagnosticClientHints, status: 'high-entropy-unavailable', error: sanitizeDiagnosticText(error?.message || error, 180) }; return; }
    Promise.resolve(hintsPromise)
      .then(hints => {
        diagnosticClientHints = {
          status: 'available',
          brands: Array.isArray(data.brands) ? data.brands.filter(item => !/not.?a.?brand/i.test(item.brand || '')).map(item => ({ brand: item.brand, version: item.version })) : [],
          mobile: typeof data.mobile === 'boolean' ? data.mobile : null,
          platform: data.platform || null,
          platformVersion: hints.platformVersion || null,
          model: hints.model || null,
          architecture: hints.architecture || null,
          bitness: hints.bitness || null,
          fullVersionList: Array.isArray(hints.fullVersionList) ? hints.fullVersionList.filter(item => !/not.?a.?brand/i.test(item.brand || '')).map(item => ({ brand: item.brand, version: item.version })) : [],
        };
      })
      .catch(error => {
        diagnosticClientHints = { ...diagnosticClientHints, status: 'high-entropy-unavailable', error: sanitizeDiagnosticText(error?.message || error, 180) };
      });
  }

  function rememberDiagnosticError(type, message, source = '', line = 0, column = 0) {
    diagnosticErrors.push({
      time: new Date().toISOString(),
      type: sanitizeDiagnosticText(type, 80),
      message: sanitizeDiagnosticText(message, 500),
      source: sanitizeDiagnosticText(String(source || '').split('?')[0].split('#')[0], 180),
      line: Number(line) || 0,
      column: Number(column) || 0,
    });
    if (diagnosticErrors.length > DIAGNOSTIC_ERROR_LIMIT) {
      diagnosticErrors.splice(0, diagnosticErrors.length - DIAGNOSTIC_ERROR_LIMIT);
    }
  }

  const state = {
    destroyed: false,
    active: true,
    observer: null,
    themeObserver: null,
    abort: new HOST_WIN.AbortController(),
    diagnosticAbort: null,
    navEntry: null,
    organizerEntry: null,
    workspaceHeader: null,
    panel: null,
    style: null,
    preset: {
      applied: false,
      applying: false,
      root: null,
      grid: null,
      left: null,
      right: null,
      records: [],
      promptRecord: null,
    },
    character: newCharacterState(),
    mobileNav: { open: false, toggle: null, docked: getStoredBool(NAV_DOCKED_KEY, false), dockToggle: null },
    chatShortcut: null,
    chatTools: {
      button: null,
      panel: null,
      open: false,
      page: 'tools',
      chatKey: '',
      observer: null,
      refreshFrame: 0,
      suppressObserver: false,
      recent: {
        list: null,
        search: null,
        refreshButton: null,
        items: [],
        requestId: 0,
        loading: false,
        onlyCurrent: false,
        filterButton: null,
      },
    },
    floorZeroClearanceChat: null,
    floorZeroClearanceFrame: 0,
    chatFade: {
      active: false,
      chat: null,
      paddingChat: null,
      bg1: null,
      pseudo: null,
      renderMode: null,
      wallpaperObserver: null,
      wallpaperParentObserver: null,
      wallpaperParent: null,
      resizeObserver: null,
      resizeChat: null,
      wallpaperRaf: 0,
      refreshRaf: 0,
    },
    diagnosticButton: null,
    diagnosticButtonObserver: null,
    diagnosticButtonRepairFrame: 0,
    globalSearchPanel: null,
    globalSearchOpen: false,
    globalSearchView: 'search',
    globalSearchIndex: [],
    chatShortcutObserver: null,
    chatShortcutFrame: 0,
    scrollBottom: {
      chat: null,
      form: null,
      button: null,
      frame: 0,
      generating: false,
      onScroll: null,
      eventSource: null,
      eventListeners: [],
    },
    layoutFrame: 0,
  };

  function saveCompatibilitySettings() {
    try {
      HOST_WIN.localStorage.setItem(COMPAT_LAYER_REPAIR_KEY, String(compatibilityLayerRepair));
      HOST_WIN.localStorage.setItem(COMPAT_NAV_REPAIR_KEY, String(compatibilityNavigationRepair));
      HOST_WIN.localStorage.setItem(COMPAT_PANEL_BG_KEY, String(compatibilityPanelBackground));
      HOST_WIN.localStorage.setItem(COMPAT_PANEL_BG_MODE_KEY, compatibilityPanelBackgroundMode);
      HOST_WIN.localStorage.setItem(COMPAT_PANEL_BG_COLOR_KEY, compatibilityPanelBackgroundColor);
      HOST_WIN.localStorage.setItem(COMPAT_NAV_TEXT_KEY, String(compatibilityNavText));
      HOST_WIN.localStorage.setItem(COMPAT_NAV_TEXT_COLOR_KEY, compatibilityNavTextColor);
    } catch {}
  }

  function applyCompatibilitySettings() {
    const body = HOST_DOC.body;
    if (!body) return;

    body.toggleAttribute('data-tle-compat-layer-repair', compatibilityLayerRepair);
    body.toggleAttribute('data-tle-compat-nav-repair', compatibilityNavigationRepair);
    body.toggleAttribute('data-tle-compat-structure-repair', compatibilityStructureRepair);
    body.toggleAttribute('data-tle-compat-panel-bg', compatibilityPanelBackground);
    body.setAttribute('data-tle-compat-panel-bg-mode',
      compatibilityPanelBackgroundMode === 'custom' ? 'custom' : 'smart');

    body.style.setProperty('--tle-compat-panel-bg-custom', compatibilityPanelBackgroundColor);

    const layerInput = state.panel?.querySelector('[data-tle-setting="compat-layer-repair"]');
    if (layerInput) layerInput.checked = compatibilityLayerRepair;

    const navInput = state.panel?.querySelector('[data-tle-setting="compat-nav-repair"]');
    if (navInput) navInput.checked = compatibilityNavigationRepair;
    applyNavIconOpacity();

    const structureInput = state.panel?.querySelector('[data-tle-setting="compat-structure-repair"]');
    if (structureInput) structureInput.checked = compatibilityStructureRepair;

    const bgInput = state.panel?.querySelector('[data-tle-setting="compat-panel-bg"]');
    if (bgInput) bgInput.checked = compatibilityPanelBackground;

    const bgMode = state.panel?.querySelector('[data-tle-setting="compat-panel-bg-mode"]');
    if (bgMode) bgMode.value = compatibilityPanelBackgroundMode;

    const colorInput = state.panel?.querySelector('[data-tle-setting="compat-panel-bg-color"]');
    if (colorInput) colorInput.value = compatibilityPanelBackgroundColor;

    const colorText = state.panel?.querySelector('[data-tle-setting="compat-panel-bg-hex"]');
    if (colorText) colorText.value = compatibilityPanelBackgroundColor;

    const customRow = state.panel?.querySelector('[data-tle-compat-custom-color]');
    if (customRow) customRow.hidden = !compatibilityPanelBackground || compatibilityPanelBackgroundMode !== 'custom';

    body.toggleAttribute('data-tle-compat-nav-text', compatibilityNavText);
    if (compatibilityNavText) body.style.setProperty('--tle-nav-text-color', compatibilityNavTextColor);
    else body.style.removeProperty('--tle-nav-text-color');
    const textToggle = state.panel?.querySelector('[data-tle-setting="compat-nav-text"]');
    if (textToggle) textToggle.checked = compatibilityNavText;
    const textRow = state.panel?.querySelector('[data-tle-compat-nav-text-fields]');
    if (textRow) textRow.hidden = !compatibilityNavText;
    for (const setting of ['compat-nav-text-color','compat-nav-text-hex']) {
      const input = state.panel?.querySelector('[data-tle-setting="' + setting + '"]');
      if (input && input.value.toLowerCase() !== compatibilityNavTextColor.toLowerCase()) input.value = compatibilityNavTextColor;
    }
    saveCompatibilitySettings();
  }

  function setCompatibilityNavText(enabled) {
    compatibilityNavText = Boolean(enabled);
    applyCompatibilitySettings();
  }
  function setCompatibilityNavTextColor(value) {
    const color = String(value || '').trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(color)) return;
    compatibilityNavTextColor = color;
    applyCompatibilitySettings();
  }

  function setCompatibilityLayerRepair(enabled) {
    compatibilityLayerRepair = Boolean(enabled);
    applyCompatibilitySettings();
  }

  function setCompatibilityNavigationRepair(enabled) {
    compatibilityNavigationRepair = Boolean(enabled);
    applyCompatibilitySettings();
  }

  function setCompatibilityStructureRepair(enabled) {
    compatibilityStructureRepair = Boolean(enabled);
    applyCompatibilitySettings();
  }

  function setCompatibilityPanelBackground(enabled) {
    compatibilityPanelBackground = Boolean(enabled);
    applyCompatibilitySettings();
  }

  function setCompatibilityPanelBackgroundMode(mode) {
    compatibilityPanelBackgroundMode = mode === 'custom' ? 'custom' : 'smart';
    applyCompatibilitySettings();
  }

  function setCompatibilityPanelBackgroundColor(value) {
    const normalized = String(value || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(normalized)) return;
    compatibilityPanelBackgroundColor = normalized;
    applyCompatibilitySettings();
  }

  function createStyle() {
    let style = HOST_DOC.getElementById(ID.style);
    if (!style) {
      style = HOST_DOC.createElement('style');
      style.id = ID.style;
      HOST_DOC.head.appendChild(style);
    }

    style.textContent = `
/* Navigation geometry. Native drawers are never wrapped or reparented. */
body[data-tle-nav] {
  --tle-rail-width: min(var(--tle-requested-width, 68px), calc(100vw - 16px));
  --tle-rail-top: env(safe-area-inset-top, 0px);
  --tle-rail-bottom: max(6px, env(safe-area-inset-bottom, 0px));
  --tle-rail-header: 72px;
  --tle-row-gap: 2px;
  --tle-row-preferred: 44px;
  --tle-engine-size: 36px;
  --tle-organizer-size: 36px;
  --tle-row-height: min(var(--tle-row-preferred), calc((100dvh - var(--tle-rail-top) - var(--tle-rail-bottom) - var(--tle-rail-header) - var(--tle-engine-size) - var(--tle-organizer-size) - 22px) / var(--tle-rows, 9) - var(--tle-row-gap)));
  --tle-row-align: center;
  --tle-first-row-end: 0px;
  --tle-hamburger-left: 8px;
  --tle-native-left: var(--tle-rail-width);
  --tle-native-top: 0px;
  --tle-native-width: min(calc(var(--sheldWidth, 70vw) + 25vw), 75vw, calc(100vw - var(--tle-rail-width) - 12px));
  --tle-preset-panel-width: min(calc(var(--sheldWidth, 737px) + 20vw), 82vw, calc(100vw - var(--tle-rail-width) - 12px));
  --tle-panel-left: calc(var(--tle-rail-width) + 12px);
  --tle-panel-top: max(12px, var(--tle-rail-top));
  --tle-panel-bottom: max(12px, var(--tle-rail-bottom));
}
body[data-tle-nav]:not([data-tle-nav="icons"]) { --tle-row-align: flex-start; }

body[data-tle-nav] :is(#top-bar#top-bar, #top-settings-holder#top-settings-holder) {
  position: absolute !important;
  inset: 0 auto auto 0 !important;
  width: var(--tle-rail-width) !important;
  min-width: 0 !important;
  max-width: none !important;
  height: 100dvh !important;
  min-height: 0 !important;
  max-height: none !important;
  margin: 0 !important;
  border-radius: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
  transform: none !important;
  translate: none !important;
}
body[data-tle-nav] #top-bar#top-bar {
  display: block !important;
  z-index: 3005 !important;
  pointer-events: none !important;
}
body[data-tle-nav] #top-settings-holder#top-settings-holder {
    z-index: 3005 !important;
    display: flex !important;
    flex-flow: column nowrap !important;
    align-items: stretch !important;
    justify-content: flex-start !important;
    gap: var(--tle-row-gap) !important;
    padding: calc(var(--tle-rail-top) + 2px) 6px var(--tle-rail-bottom) !important;
}

/* Workspace header: identity on the left, search and drawer control on the right. */
#${ID.workspaceHeader} {
  display: flex;
  flex: 0 0 var(--tle-rail-header);
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  min-width: 0;
  height: var(--tle-rail-header);
  margin: 0 0 2px;
  padding: 2px 8px 5px;
  box-sizing: border-box;
  color: var(--SmartThemeBodyColor, inherit);
}
#${ID.workspaceHeader} .tle-workspace-brand {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  gap: 4px;
}
#${ID.workspaceHeader} .tle-workspace-greeting {
  display: flex;
  align-items: center;
  gap: 7px;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  appearance: none;
  -webkit-appearance: none;
  color: var(--SmartThemeBodyColor, inherit);
  background: transparent;
  box-shadow: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
#${ID.workspaceHeader} .tle-workspace-greeting [data-tle-greeting-text] {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: inherit;
  font-size: clamp(17px, 1.2em, 21px);
  font-weight: 650;
  line-height: 1.12;
  letter-spacing: -.025em;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#${ID.workspaceHeader} .tle-workspace-greeting > i {
  flex: 0 0 auto;
  font-size: 10px;
  line-height: 1;
  opacity: .48;
  transition: transform .16s ease, opacity .16s ease;
}
#${ID.workspaceHeader} .tle-workspace-greeting:hover,
#${ID.workspaceHeader} .tle-workspace-greeting:focus-visible {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
  outline: none;
}
#${ID.workspaceHeader} .tle-workspace-greeting:hover > i,
#${ID.workspaceHeader} .tle-workspace-greeting:focus-visible > i {
  opacity: .9;
}
#${ID.workspaceHeader} .tle-workspace-subtitle {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--SmartThemeBodyColor, inherit);
  font-size: 9px;
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: .105em;
  opacity: .55;
  text-overflow: ellipsis;
  white-space: nowrap;
}
#${ID.workspaceHeader} .tle-workspace-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
#${ID.workspaceHeader} [hidden] { display: none !important; }
#${ID.workspaceHeader} .tle-workspace-icon-button {
  display: grid;
  flex: 0 0 30px;
  place-items: center;
  width: 30px;
  min-width: 30px;
  height: 30px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 8px;
  color: var(--SmartThemeBodyColor, inherit);
  background: transparent;
  box-shadow: none;
  font-size: 15px;
  line-height: 1;
  opacity: .78;
  cursor: pointer;
  transition: color .16s ease, background .16s ease, opacity .16s ease;
}
#${ID.workspaceHeader} .tle-workspace-icon-button:hover,
#${ID.workspaceHeader} .tle-workspace-icon-button:focus-visible {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
  background: color-mix(in srgb, var(--SmartThemeQuoteColor, currentColor) 12%, transparent);
  opacity: 1;
}
#${ID.workspaceHeader} #${ID.mobileToggle} {
  position: static;
  inset: auto;
  z-index: auto;
  flex: 0 0 30px;
  width: 30px;
  min-width: 30px;
  height: 30px;
  border-radius: 8px;
  color: var(--SmartThemeBodyColor, inherit);
  background: transparent;
  font-size: 17px;
}
#${ID.workspaceHeader} #${ID.mobileToggle}:hover,
#${ID.workspaceHeader} #${ID.mobileToggle}:focus-visible {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
  background: color-mix(in srgb, var(--SmartThemeQuoteColor, currentColor) 12%, transparent);
}
#${ID.workspaceHeader} #${ID.dockToggle}[aria-pressed="true"] {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
  background: color-mix(in srgb, var(--SmartThemeQuoteColor, currentColor) 13%, transparent);
  opacity: 1;
}
#${ID.workspaceHeader} #${ID.dockToggle} > i { transition: transform .16s ease; }
#${ID.workspaceHeader} #${ID.dockToggle}[aria-pressed="true"] > i { transform: rotate(-35deg); }
body[data-tle-nav="icons"] #${ID.workspaceHeader} {
  --tle-rail-header: 50px;
  justify-content: flex-end;
  padding-inline: 0;
}
body[data-tle-nav="icons"] #${ID.workspaceHeader} .tle-workspace-brand { display: none !important; }
body[data-tle-nav="icons"]:not([data-tle-overlay]) {
  --tle-rail-header: 0px;
}
body[data-tle-nav="icons"]:not([data-tle-overlay]) #${ID.workspaceHeader} { display: none !important; }
body[data-tle-nav="icons"][data-tle-docked]:not([data-tle-overlay]) { --tle-rail-header: 50px; }
body[data-tle-nav="icons"][data-tle-docked]:not([data-tle-overlay]) #${ID.workspaceHeader} { display: flex !important; }
body[data-tle-nav] :is(#top-bar#top-bar, #top-settings-holder#top-settings-holder)::before,
body[data-tle-nav] :is(#top-bar#top-bar, #top-settings-holder#top-settings-holder)::after { content: none !important; }
body[data-tle-overlay="closed"] :is(#top-bar#top-bar, #top-settings-holder#top-settings-holder) {
  visibility: hidden !important;
  pointer-events: none !important;
}
body[data-tle-overlay="closed"] #top-settings-holder#top-settings-holder > .drawer:not(:has(> .openDrawer)),
body[data-tle-overlay="closed"] #top-settings-holder > :is(.tle-sidebar-info, #${ID.organizerEntry}, #${ID.nav}) {
  display: none !important;
}
body[data-tle-overlay="closed"] #top-settings-holder > .drawer:has(> .openDrawer) {
  visibility: hidden !important;
  pointer-events: none !important;
}
body[data-tle-nav] #top-settings-holder#top-settings-holder > .drawer {
  position: static !important;
  display: flex !important;
  flex: 0 0 max(1px, var(--tle-row-height)) !important;
  flex-flow: row nowrap !important;
  align-items: center !important;
  justify-content: var(--tle-row-align) !important;
  gap: 8px !important;
  width: 100% !important;
  min-width: 0 !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  overflow: visible !important;
  box-sizing: border-box !important;
}
body[data-tle-nav] #top-settings-holder > .drawer:first-child { padding-right: var(--tle-first-row-end); }
#top-settings-holder > .drawer > .tle-drawer-label {
  display: none;
  flex: 1 1 auto;
  min-width: 0;
  overflow: hidden;
  color: inherit;
  font: inherit;
  font-size: clamp(13px, 1em, 16px);
  line-height: 1.35;
  text-align: start;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}
body[data-tle-nav]:not([data-tle-nav="icons"]) #top-settings-holder > .drawer > .tle-drawer-label {
  display: block;
}
/* Highlight the native Tavern navigation label while its own drawer is selected. */
body[data-tle-nav] #top-settings-holder > .drawer:has(> .drawer-content.openDrawer) > .tle-drawer-label {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
  font-weight: 650;
}
body[data-tle-nav] #top-settings-holder > .drawer:has(> .drawer-content.openDrawer) > .drawer-toggle {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
}
body[data-tle-nav] #top-settings-holder#top-settings-holder > .drawer > .drawer-content.openDrawer {
  position: absolute !important;
  inset: var(--tle-native-top) auto auto var(--tle-native-left) !important;
  width: var(--tle-drawer-width, var(--tle-native-width)) !important;
  min-width: 0 !important;
  max-width: none !important;
  height: calc(100dvh - var(--tle-native-top)) !important;
  min-height: 0 !important;
  max-height: none !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  overflow: auto !important;
  visibility: visible !important;
  pointer-events: auto !important;
}
  #${ID.organizerEntry} {
    display: flex;
    flex: 0 0 var(--tle-organizer-size);
    align-self: stretch;
    width: 100%;
    min-width: 0;
    height: var(--tle-organizer-size);
    margin: 0;
    padding: 0 8px;
    box-sizing: border-box;
  }
  #${ID.organizerEntry}[hidden] { display: none !important; }
  #${ID.organizerEntry} > button {
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    width: 100%;
    min-width: 0;
    height: 100%;
    padding: 3px 7px;
    border: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 24%));
    border-radius: 11px;
    color: var(--SmartThemeBodyColor, inherit);
    background: var(--SmartThemeBlurTintColor, rgb(127 127 127 / 9%));
    box-shadow: 0 1px 3px rgb(0 0 0 / 12%);
    text-align: start;
    cursor: pointer;
    transition: background-color .16s ease, border-color .16s ease, transform .16s ease;
  }
  #${ID.organizerEntry} > button:hover,
  #${ID.organizerEntry} > button:focus-visible {
    border-color: var(--SmartThemeQuoteColor, currentColor);
    background: color-mix(in srgb, var(--SmartThemeQuoteColor, currentColor) 10%, var(--SmartThemeBlurTintColor, transparent));
    outline: none;
  }
  #${ID.organizerEntry} > button:active { transform: translateY(1px); }
  #${ID.organizerEntry} > button[aria-expanded="true"] { border-color: var(--SmartThemeQuoteColor, currentColor); background: color-mix(in srgb, var(--SmartThemeQuoteColor, currentColor) 12%, var(--SmartThemeBlurTintColor, transparent)); }
  #${ID.organizerEntry} .tle-organizer-mark {
    display: grid;
    flex: 0 0 30px;
    place-items: center;
    width: 30px;
    height: 30px;
    font-size: 16px;
    opacity: .88;
  }
  #${ID.organizerEntry} .tle-organizer-copy {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    flex-direction: column;
    align-items: flex-start;
    gap: 1px;
    text-align: left;
    line-height: 1.1;
  }
  #${ID.organizerEntry} .tle-organizer-copy strong { font-size: 11px; font-weight: 750; }
  #${ID.organizerEntry} .tle-organizer-copy small { font-size: 9px; opacity: .62; letter-spacing: .035em; }
  body[data-tle-nav="icons"] #${ID.organizerEntry} {
    align-self: center;
    justify-self: center;
    width: var(--tle-organizer-size);
    margin-inline: auto;
    padding: 0;
  }
  body[data-tle-nav="icons"] #${ID.organizerEntry} > button {
    justify-content: center;
    margin-inline: auto;
    padding: 2px;
    border-radius: 11px;
  }
  body[data-tle-nav="icons"] #${ID.organizerEntry} .tle-organizer-copy { display: none !important; }
#${ID.nav} {
  display: flex;
  flex: 0 0 var(--tle-engine-size);
  align-self: stretch;
  width: 100%;
  min-width: 0;
  height: var(--tle-engine-size);
  margin: auto 0 0;
  padding: 0 8px 6px;
  box-sizing: border-box;
}
#${ID.nav} > button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  width: 100%;
  min-width: 0;
  height: 100%;
  padding: 3px;
  border: 1px solid var(--SmartThemeBorderColor, currentColor);
  border-color: color-mix(in srgb, var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, currentColor)) 24%, transparent);
  border-radius: 12px;
  color: var(--SmartThemeBodyColor, inherit);
  background: color-mix(in srgb, var(--SmartThemeBlurTintColor, var(--SmartThemeBodyColor, #777)) 18%, transparent);
  cursor: pointer;
  transition: background .18s ease, border-color .18s ease, box-shadow .18s ease, transform .18s ease, color .18s ease;
}
#${ID.nav} > button:hover, #${ID.nav} > button:focus-visible {
  border-color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, currentColor));
  background: color-mix(in srgb, var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, #888)) 12%, var(--SmartThemeBlurTintColor, transparent));
  box-shadow: 0 0 12px color-mix(in srgb, var(--SmartThemeQuoteColor, #888) 18%, transparent);
}
#${ID.nav} > button[aria-expanded="true"] {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
  border-color: var(--SmartThemeQuoteColor, currentColor);
  background: color-mix(in srgb, var(--SmartThemeQuoteColor, #888) 13%, var(--SmartThemeBlurTintColor, transparent));
  box-shadow: 0 0 12px color-mix(in srgb, var(--SmartThemeQuoteColor, #888) 16%, transparent);
}
#${ID.nav} > button[aria-expanded="true"] .tle-engine-copy strong,
#${ID.nav} > button[aria-expanded="true"] .tle-engine-copy small {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
  opacity: 1;
}
#${ID.nav} > button:active { transform: translateY(1px); }
#${ID.nav} .tle-engine-mark { display: grid; place-items: center; flex: 0 0 30px; width: 30px; height: 30px; }
#${ID.nav} .tle-engine-mark svg { display: block; width: 100%; height: 100%; overflow: visible; }
#${ID.nav} .tle-engine-copy { display: flex; flex: 1 1 auto; min-width: 0; flex-direction: column; align-items: flex-start; gap: 1px; text-align: left; line-height: 1.1; }
#${ID.nav} .tle-engine-copy strong { font-size: 11px; font-weight: 750; letter-spacing: .12em; }
#${ID.nav} .tle-engine-copy small { font-size: 9px; opacity: .62; letter-spacing: .035em; }
body[data-tle-nav="icons"] #${ID.nav} {
  align-self: center;
  justify-self: center;
  width: var(--tle-engine-size);
  margin-inline: auto;
  padding: 0;
}
body[data-tle-nav="icons"] #${ID.nav} > button {
  justify-content: center;
  margin-inline: auto;
  padding: 2px;
  border-radius: 11px;
}
body[data-tle-nav="icons"] #${ID.nav} .tle-engine-mark { width: 30px; height: 30px; flex-basis: 30px; }
body[data-tle-nav="icons"] #${ID.nav} .tle-engine-copy { display: none !important; }
body[data-tle-nav="labels"] #${ID.nav}, body[data-tle-nav="info"] #${ID.nav} { --tle-engine-size: 48px; }
body[data-tle-nav="labels"] #${ID.organizerEntry}, body[data-tle-nav="info"] #${ID.organizerEntry} { --tle-organizer-size: 48px; }
#${ID.mobileToggle} {
  position: absolute;
  inset: calc(var(--tle-rail-top) + 4px) auto auto var(--tle-hamburger-left);
  z-index: 3006;
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  box-sizing: border-box;
  color: var(--SmartThemeBodyColor, inherit);
  background-color: var(--SmartThemeBlurTintColor, #282027);
  background-color: rgb(from var(--SmartThemeBlurTintColor, #282027) r g b / 1);
  box-shadow: 0 0 2px rgba(0 0 0 / 22%);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
body[data-tle-nav] #${ID.mobileToggle}:not([hidden]) { display: grid; }
/* A generic external fullscreen surface may suppress navigation toggles,
   but must never suppress the diagnostic escape hatch. */
body[data-tle-external-surface] #${ID.mobileToggle} {
  display: none !important;
  pointer-events: none !important;
}

/* Compact icon-only mode: reserve a dedicated hamburger row and center both controls. */
body[data-tle-nav="icons"] {
  --tle-rail-header: 50px;
  --tle-hamburger-left: calc((var(--tle-rail-width) - 36px) / 2);
}
body[data-tle-nav="icons"] #${ID.mobileToggle} {
  inset-inline-start: calc((var(--tle-rail-width) - 36px) / 2);
}
#${ID.chatShortcut} {
  position: fixed;
  inset: calc(env(safe-area-inset-top, 0px) + 4px) 8px auto auto;
  z-index: 10040;
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  box-sizing: border-box;
  color: var(--SmartThemeBodyColor, inherit);
  background-color: var(--SmartThemeBlurTintColor, #282027);
  background-color: rgb(from var(--SmartThemeBlurTintColor, #282027) r g b / 1);
  box-shadow: 0 0 2px rgba(0 0 0 / 22%);
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}
body[data-tle-nav] #${ID.chatShortcut}:not([hidden]) { display: grid; }

#${ID.chatToolsButton} {
  position: fixed;
  inset: calc(env(safe-area-inset-top, 0px) + 4px) 8px auto auto;
  z-index: 10042;
  display: none;
  place-items: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  box-sizing: border-box;
  color: var(--SmartThemeBodyColor, inherit);
  background-color: var(--SmartThemeBlurTintColor, #282027);
  background-color: rgb(from var(--SmartThemeBlurTintColor, #282027) r g b / 1);
  box-shadow: 0 0 2px rgba(0 0 0 / 22%);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: color .16s ease, background-color .16s ease, transform .16s ease;
}
#${ID.chatToolsButton}:not([hidden]) { display: grid; }
#${ID.chatToolsButton}:hover,
#${ID.chatToolsButton}:focus-visible,
#${ID.chatToolsButton}[aria-expanded="true"] {
  color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
  outline: none;
}
#${ID.chatToolsButton}:active { transform: translateY(1px); }

#${ID.chatToolsPanel} {
  position: fixed;
  inset: calc(env(safe-area-inset-top, 0px) + 46px) 8px auto auto;
  z-index: 10043;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 0;
  width: min(460px, calc(100vw - 16px));
  height: auto;
  min-height: 0;
  max-height: min(80dvh, 700px);
  min-width: 0;
  box-sizing: border-box;
  overflow: visible;
  padding-block: 12px;
  text-align: start;
}
#${ID.chatToolsPanel}[hidden] { display: none !important; }
#${ID.chatToolsPanel}[data-page="recent"] { height: min(80dvh, 700px); }
#${ID.chatToolsPanel}[data-page="plans"] { height: min(80dvh, 700px); }
#${ID.chatToolsPanel} [hidden] { display: none !important; }
#${ID.chatToolsPanel} .tle-chat-tools-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
#${ID.chatToolsPanel} .tle-chat-tools-header > strong {
  flex: 0 0 auto;
  white-space: nowrap;
}
#${ID.chatToolsPanel} .tle-chat-tools-header-actions {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  min-width: 0;
}
#${ID.chatToolsPanel} .tle-chat-tools-header-actions[hidden] { display: none !important; }
#${ID.chatToolsPanel} .tle-chat-quick-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-width: 0;
  padding: 5px 7px;
  font-size: 12px;
  line-height: 1.2;
  white-space: nowrap;
}
#${ID.chatToolsPanel} .tle-chat-tools-header > [data-chat-tools-close] { flex: 0 0 auto; }
#${ID.chatToolsPanel} .tle-chat-tools-tabs {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
#${ID.chatToolsPanel} .tle-chat-tools-page {
  display: flex;
  flex: 0 1 auto;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}
#${ID.chatToolsPanel} [data-chat-tools-page="recent"] {
  flex: 1 1 auto;
  overflow: hidden;
}


#tle-chat-tools-panel [data-chat-tools-page="plans"] { flex: 1 1 auto; overflow-y: auto; }
#tle-chat-tools-panel .tle-companion-toolbar,
.tle-companion-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
#tle-chat-tools-panel .tle-companion-toolbar > strong { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.tle-companion-plan { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; padding: 10px 0; border-bottom: 1px solid var(--SmartThemeBorderColor, #8886); }
.tle-companion-copy { display: flex; flex: 1 1 170px; flex-direction: column; min-width: 0; gap: 4px; overflow-wrap: anywhere; }
.tle-companion-copy > small { opacity: .8; }
.tle-companion-list { min-height: 0; }
.tle-companion-plan.is-default {
  border-inline-start: 3px solid var(--SmartThemeQuoteColor, currentColor);
  padding-inline-start: 10px;
}
.tle-companion-title { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; min-width: 0; }
.tle-companion-default-badge {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 7px; border: 1px solid currentColor; border-radius: 20px;
  color: var(--SmartThemeQuoteColor, currentColor);
  font-size: .75em; font-weight: 700; line-height: 1.4; white-space: nowrap;
}
.tle-companion-editor, .tle-companion-manager { display: flex; flex-direction: column; gap: 12px; min-width: 0; max-width: 100%; box-sizing: border-box; overflow-wrap: anywhere; max-height: min(70dvh, 640px); overflow-y: auto; overscroll-behavior: contain; }
.tle-companion-editor > label { display: flex; flex-direction: column; gap: 5px; }
.tle-companion-field { display: grid; grid-template-columns: auto minmax(64px, .6fr) minmax(0, 2fr); align-items: center; gap: 7px; min-width: 0; }
.tle-companion-field > .text_pole { width: 100%; min-width: 0; }
.tle-companion-field-label { font-size: .88em; }
.tle-companion-default { display: flex; flex-direction: row !important; align-items: center; gap: 8px; }
.tle-companion-actions > .menu_button { white-space: nowrap; }

#${ID.panel} .tle-optional-card { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding-block: 8px; }
#${ID.panel} .tle-optional-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; min-width: 0; }
#${ID.panel} .tle-optional-heading-copy { display: flex; flex: 1 1 auto; flex-direction: column; gap: 3px; min-width: 0; }
#${ID.panel} .tle-optional-heading-copy > small { font-size: .83em; line-height: 1.45; overflow-wrap: anywhere; }
#${ID.panel} .tle-optional-summary { line-height: 1.5; }
#${ID.panel} .tle-optional-entry { overflow-wrap: anywhere; }
#${ID.panel} .tle-optional-more { flex: 0 0 auto; min-width: 34px; min-height: 28px; padding: 4px 8px; white-space: nowrap; }
#${ID.panel} .tle-optional-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
#${ID.panel} .tle-optional-actions > .menu_button { white-space: nowrap; }
#${ID.panel} .tle-optional-actions > [hidden] { display: none !important; }
#tle-quick-picker[data-tle-quick-panel="optional-details"] .tle-optional-detail-content {
  display: flex; flex: 1 1 auto; flex-direction: column; gap: 12px;
  min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding-inline-end: 2px;
}
#tle-quick-picker[data-tle-quick-panel="optional-details"] .tle-optional-detail-section {
  display: flex; flex-direction: column; gap: 6px; min-width: 0;
}
#tle-quick-picker[data-tle-quick-panel="optional-details"] .tle-optional-detail-section :is(ul, ol) {
  margin: 0; padding-inline-start: 1.5em;
}
#tle-quick-picker[data-tle-quick-panel="optional-details"] .tle-optional-detail-section li {
  margin-block: 0 6px; overflow-wrap: anywhere;
}
#tle-quick-picker[data-tle-quick-panel="optional-details"] .tle-optional-detail-content > p {
  margin: 0; overflow-wrap: anywhere;
}


.tle-companion-schedule {
  display: flex; flex-direction: column; gap: 10px; min-width: 0; padding-block: 12px;
  border-top: 1px solid var(--SmartThemeBorderColor, #8886);
}
.tle-companion-schedule > .tle-companion-title { justify-content: space-between; }
.tle-companion-schedule-row {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.5fr);
  align-items: center; gap: 7px; min-width: 0;
}
.tle-companion-schedule-row > select.text_pole {
  width: 100%; min-width: 0; max-width: 100%; box-sizing: border-box;
}
#tle-quick-picker#tle-quick-picker .tle-companion-schedule-row > input[type="time"].text_pole {
  box-sizing: border-box !important;
  width: auto !important;
  min-width: 0 !important;
  max-width: 100% !important;
  justify-self: stretch !important;
  margin-inline: 0 !important;
}
.tle-companion-schedule-badge {
  display: inline-flex; border-radius: 20px; padding: 2px 7px;
  background: var(--SmartThemeQuoteColor, #8883); color: var(--SmartThemeBodyColor, inherit);
  font-size: .75em; font-weight: 650; line-height: 1.4; white-space: nowrap;
}
@media (max-width: 600px) {
  .tle-companion-schedule-row { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
  .tle-companion-schedule-row > select { grid-column: 1 / -1; }
}


#${ID.chatToolsPanel} .tle-chat-tools-actions {
  display: grid;
  gap: 10px;
}
#${ID.chatToolsPanel} .tle-chat-tools-action {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  min-width: 0;
}
#${ID.chatToolsPanel} .tle-chat-tools-action > label {
  width: max-content;
  max-width: 100%;
  min-width: 0;
  margin: 0;
  white-space: nowrap;
}
#${ID.chatToolsPanel} .tle-chat-tools-control {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
}
#${ID.chatToolsPanel} .tle-chat-tools-input-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
}
#${ID.chatToolsPanel} .tle-chat-tools-range-inputs {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 12px minmax(0, 1fr);
  align-items: center;
  gap: 4px;
  min-width: 0;
  width: 100%;
}
#${ID.chatToolsPanel} .tle-chat-tools-range-separator {
  text-align: center;
  white-space: nowrap;
  user-select: none;
  pointer-events: none;
}
#${ID.chatToolsPanel} .tle-chat-tools-range-help {
  grid-column: 1 / -1;
  min-width: 0;
  font-size: .78em;
  line-height: 1.35;
  opacity: .75;
}
#${ID.chatToolsPanel} [data-chat-action-input] {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: none;
  padding-inline-end: 2.5em;
  box-sizing: border-box;
}
#${ID.chatToolsPanel} .tle-chat-tools-clear {
  position: absolute;
  inset-inline-end: 3px;
  top: 50%;
  display: grid;
  place-items: center;
  width: 26px;
  min-width: 26px;
  height: 26px;
  min-height: 26px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  transform: translateY(-50%);
}
#${ID.chatToolsPanel} .tle-chat-tools-clear[hidden] { display: none !important; }
#${ID.chatToolsPanel} .tle-chat-tools-submit-group {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
  min-width: 0;
}
#${ID.chatToolsPanel} [data-chat-action-submit] {
  min-width: 3.2em;
  box-sizing: border-box;
  text-align: center;
  white-space: nowrap;
}
#${ID.chatToolsPanel} .tle-chat-tools-range {
  display: grid;
  gap: 7px;
  min-width: 0;
}
#${ID.chatToolsPanel} .tle-chat-tools-range-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}
#${ID.chatToolsPanel} .tle-chat-tools-range-value {
  max-height: 150px;
  min-width: 0;
  overflow: auto;
  overflow-wrap: anywhere;
  white-space: normal;
  user-select: text;
}
#${ID.chatToolsPanel} .tle-chat-tools-recent-toolbar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
#${ID.chatToolsPanel} [data-chat-tools-recent-search] {
  flex: 1 1 auto;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}
#${ID.chatToolsPanel} .tle-chat-tools-recent-count {
  flex: 0 0 auto;
  white-space: nowrap;
}
#${ID.chatToolsPanel} .welcomePanel { padding: 0; }
#${ID.chatToolsPanel} .tle-chat-tools-recent-root {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}
#${ID.chatToolsPanel} .tle-chat-tools-recent-root .welcomeRecent {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
}
#${ID.chatToolsPanel} .tle-chat-tools-recent-root .recentChatList {
  min-width: 0;
}
@media (max-width: 480px) {
  #${ID.chatToolsPanel} {
    width: calc(100vw - 16px);
    max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 58px);
  }
  #${ID.chatToolsPanel}[data-page="recent"] {
    height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 58px);
  }
  #${ID.chatToolsPanel} .tle-chat-tools-range-value { max-height: 22dvh; }
  #${ID.chatToolsPanel} .tle-chat-tools-header { gap: 5px; }
  #${ID.chatToolsPanel} .tle-chat-tools-header-actions { gap: 3px; }
  #${ID.chatToolsPanel} .tle-chat-quick-action { gap: 3px; padding: 5px; font-size: 11px; }
  #${ID.chatToolsPanel} .tle-chat-tools-control { gap: 4px; }
  #${ID.chatToolsPanel} .tle-chat-tools-submit-group { gap: 3px; }
  #${ID.chatToolsPanel} [data-chat-action-submit] { min-width: 2.9em; padding-inline: 5px; }
}
/* Diagnostic escape hatch:
   - fixed top-right only; never anchor critical controls in bottom corners.
   - Popover Top Layer is preferred. Unsupported/failed Popover uses a document-root
     fixed fallback, explicitly displayed by its data attribute.
   - syncDiagnosticButtonPosition() writes measured VisualViewport offsets inline. */
#${ID.diagnosticButton} {
  position: fixed !important;
  top: calc(env(safe-area-inset-top, 0px) + 52px) !important;
  right: calc(env(safe-area-inset-right, 0px) + 12px) !important;
  bottom: auto !important;
  left: auto !important;
  z-index: 2147483647 !important;
  display: none;
  place-items: center;
  width: 42px !important;
  min-width: 42px !important;
  height: 42px !important;
  min-height: 42px !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 1px solid rgb(255 255 255 / 18%) !important;
  border-radius: 50% !important;
  box-sizing: border-box !important;
  color: var(--SmartThemeBodyColor, #f4e9e2) !important;
  background: rgb(42 31 35 / 96%) !important;
  box-shadow: 0 3px 14px rgb(0 0 0 / 35%) !important;
  -webkit-backdrop-filter: none !important;
  backdrop-filter: none !important;
  font-size: 16px !important;
  line-height: 1 !important;
  cursor: pointer !important;
  touch-action: manipulation !important;
  pointer-events: auto !important;
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
}
#${ID.diagnosticButton}:popover-open { display: grid !important; }
#${ID.diagnosticButton}[data-tle-positioning="fixed-document-root-fallback"] { display: grid !important; }
#${ID.diagnosticButton}:active { transform: scale(.94) !important; }
/* Core panel layer: TLE itself must always stay above the 3005 navigation rail.
   This is part of the normal engine baseline, not an optional compatibility repair. */
body[data-tle-nav] #${ID.panel}#${ID.panel}#${ID.panel}.drawer-content {
  position: absolute !important;
  inset: var(--tle-panel-top) auto auto var(--tle-panel-left) !important;
  display: none !important;
  width: min(420px, calc(100vw - var(--tle-panel-left) - 12px)) !important;
  min-width: 0 !important;
  max-width: none !important;
  height: calc(100dvh - var(--tle-panel-top) - var(--tle-panel-bottom)) !important;
  min-height: 0 !important;
  max-height: none !important;
  margin: 0 !important;
  overflow: auto !important;
  padding: 14px !important;
  box-sizing: border-box !important;
  z-index: 3006 !important;
}
body[data-tle-nav] #${ID.panel}#${ID.panel}#${ID.panel}.drawer-content.openDrawer {
  display: block !important;
  z-index: 3006 !important;
}
body[data-tle-nav] :is(.TH-popup[role="dialog"], .vfm[role="dialog"], .modal-overlay) { z-index: 10020 !important; }

/* Optional compatibility repair. Disabled by default.
   Layer repair restores the documented Tavern baseline without touching
   TLE's own 3006 core panel. Background repair is independently opt-in. */
body[data-tle-compat-layer-repair] #top-settings-holder#top-settings-holder#top-settings-holder {
  z-index: 3005 !important;
}
body[data-tle-compat-layer-repair] #top-bar#top-bar#top-bar {
  z-index: 3005 !important;
}
body[data-tle-compat-layer-repair] #left-nav-panel#left-nav-panel#left-nav-panel {
  z-index: 3000 !important;
}
body[data-tle-compat-layer-repair] .fillRight.fillRight.fillRight {
  z-index: 3000 !important;
}
body[data-tle-compat-layer-repair] .popup {
  z-index: auto !important;
}
body[data-tle-compat-layer-repair] .drawer-content.openDrawer:not(#${ID.panel}):not(#completion_prompt_manager_popup) {
  z-index: auto !important;
}
body[data-tle-compat-layer-repair] #completion_prompt_manager_popup#completion_prompt_manager_popup#completion_prompt_manager_popup {
  z-index: 3010 !important;
}
body[data-tle-compat-layer-repair] #${ID.panel}#${ID.panel}#${ID.panel}.drawer-content,
body[data-tle-compat-layer-repair] #${ID.panel}#${ID.panel}#${ID.panel}.drawer-content.openDrawer {
  z-index: 3006 !important;
}

/* Opt-in navigation hitbox compatibility for image-backed themes:
   native icons may use an empty absolute ::before sprite and 100% widths.
   Preserve theme artwork while restoring real, nonzero native click boxes. */
body[data-tle-nav][data-tle-compat-nav-repair] #top-settings-holder#top-settings-holder > .drawer > .drawer-toggle {
  display: flex !important;
  position: relative !important;
  flex: 0 0 min(44px, var(--tle-row-height)) !important;
  width: min(44px, var(--tle-row-height)) !important;
  min-width: min(44px, var(--tle-row-height)) !important;
  max-width: min(44px, var(--tle-row-height)) !important;
  height: min(44px, var(--tle-row-height)) !important;
  min-height: min(44px, var(--tle-row-height)) !important;
  max-height: min(44px, var(--tle-row-height)) !important;
  align-self: center !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  pointer-events: auto !important;
}
body[data-tle-nav][data-tle-compat-nav-repair] #top-settings-holder#top-settings-holder > .drawer > .drawer-toggle > .drawer-icon {
  display: block !important;
  position: relative !important;
  flex: 0 0 100% !important;
  width: 100% !important;
  min-width: 100% !important;
  max-width: 100% !important;
  height: 100% !important;
  min-height: 100% !important;
  max-height: 100% !important;
  padding: 0 !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  pointer-events: auto !important;
  opacity: var(--tle-nav-icon-opacity, 0.7) !important;
  visibility: visible !important;
}
body[data-tle-nav][data-tle-compat-nav-repair]:not([data-tle-nav="icons"]) #top-settings-holder#top-settings-holder > .drawer > .tle-drawer-label {
  display: block !important;
  flex: 1 1 auto !important;
  min-width: 0 !important;
  margin: 0 !important;
  align-self: center !important;
  text-align: left !important;
}

/* Opt-in sidebar text only. Never set color on the native drawer or icon tree. */
body[data-tle-nav][data-tle-compat-nav-text] #top-settings-holder#top-settings-holder > .drawer > .tle-drawer-label,
body[data-tle-nav][data-tle-compat-nav-text] #top-settings-holder#top-settings-holder > #${ID.workspaceHeader} :is(.tle-workspace-greeting, [data-tle-greeting-text], .tle-workspace-subtitle, .tle-workspace-icon-button, #${ID.mobileToggle}),
body[data-tle-nav][data-tle-compat-nav-text] #top-settings-holder#top-settings-holder > .tle-sidebar-info :is(.tle-info-title, .tle-info-value, .tle-info-copy, .tle-info-arrow, .tle-info-empty),
body[data-tle-nav][data-tle-compat-nav-text] #top-settings-holder#top-settings-holder > #${ID.nav} .tle-engine-copy :is(strong, small) {
  color: var(--tle-nav-text-color) !important;
}
/* Optional structural layout repair. Manual opt-in only; never scans theme CSS.
   Restore #chat and #form_sheld as normal flex items under TLE's #sheld.
   Deliberately leave background, backdrop-filter, mask and message internals untouched. */
body[data-tle-compat-structure-repair] #sheld#sheld#sheld #chat#chat {
  position: relative !important;
  inset: auto !important;
  flex: 1 1 auto !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow-y: auto !important;
}
body[data-tle-compat-structure-repair] #sheld#sheld#sheld #form_sheld#form_sheld {
  position: relative !important;
  inset: auto !important;
  flex: 0 0 auto !important;
}

/* Optional solid surface repair: only TLE-owned rail and engine panel. */
body[data-tle-compat-panel-bg] #top-settings-holder#top-settings-holder#top-settings-holder,
body[data-tle-compat-panel-bg] #${ID.panel}#${ID.panel}#${ID.panel}.drawer-content {
  background-color: rgb(from var(--SmartThemeBlurTintColor, #282027) r g b / 1) !important;
}
body[data-tle-compat-panel-bg][data-tle-compat-panel-bg-mode="custom"] #top-settings-holder#top-settings-holder#top-settings-holder,
body[data-tle-compat-panel-bg][data-tle-compat-panel-bg-mode="custom"] #${ID.panel}#${ID.panel}#${ID.panel}.drawer-content {
  background-color: var(--tle-compat-panel-bg-custom, #282027) !important;
}


/* Mobile prompt editor: keep the panel flush to the viewport and place safe-area
   spacing inside the editor rather than adding an external bottom gap. */
@media (max-width: 1000px) {
  body[data-tle-nav] #completion_prompt_manager_popup.drawer-content.openDrawer {
    top: 0 !important;
    bottom: 0 !important;
    height: auto !important;
    box-sizing: border-box !important;
    padding-block-start: var(--topBarBlockSize) !important;
    padding-block-end: 0 !important;
  }
}

#sheld#sheld#sheld {
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  height: 100dvh !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow: hidden !important;
}
#sheld#sheld#sheld #chat {
  flex: 1 1 auto !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: none !important;
  overflow-y: auto;
}

/*
 * ChatSurface-safe floor-0 clearance.
 * The extra space is real #chat padding, not an unmanaged child node.
 * TT's virtualizer already reads paddingBlockStart as part of its geometry.
 */
body[data-tle-nav]:not([data-tle-floor-zero-measuring]) #chat {
  padding-block-start: calc(
    var(--tle-floor-zero-padding-base, 0px) +
    max(0px, env(safe-area-inset-top, 0px) + 48px
      - var(--tle-floor-zero-message-margin, 0px)
      - var(--tle-floor-zero-row-gap, 0px))
  ) !important;
}

/* Optional Fade Engine: active only when the user enables 渐隐侠. */
#chat.tle-chat-fade-active {
  --tle-chat-fade-edge: clamp(28px, 8vh, 76px);
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--tle-chat-fade-edge),
    #000 calc(100% - var(--tle-chat-fade-edge)),
    transparent 100%
  ) !important;
  mask-image: linear-gradient(
    to bottom,
    transparent 0,
    #000 var(--tle-chat-fade-edge),
    #000 calc(100% - var(--tle-chat-fade-edge)),
    transparent 100%
  ) !important;
  -webkit-mask-repeat: no-repeat !important;
  mask-repeat: no-repeat !important;
  -webkit-mask-size: 100% 100% !important;
  mask-size: 100% 100% !important;
  mask-mode: alpha;
}

/* Optional latest-message clearance. Applied only while 渐隐侠 is enabled and its sub-option is checked. */
#chat.tle-chat-fade-bottom-padding {
  padding-block-end: 70px !important;
}

/*
 * Wallpaper mirror is painted by a free #chat pseudo-element.
 * It never creates a DOM child, so TT's bounded ChatSurface projection stays owned by TT.
 */
#chat.tle-chat-fade-active.tle-chat-fade-pseudo-before::before,
#chat.tle-chat-fade-active.tle-chat-fade-pseudo-after::after {
  content: "" !important;
  position: sticky !important;
  inset-block-start: 0 !important;
  order: -2147483648 !important;
  display: block !important;
  flex: 0 0 auto !important;
  align-self: flex-start !important;
  box-sizing: border-box !important;
  width: var(--tle-chat-fade-wallpaper-width, 0px) !important;
  height: var(--tle-chat-fade-wallpaper-height, 0px) !important;
  min-height: 0 !important;
  max-height: none !important;
  margin-block: 0 calc(-1 * var(--tle-chat-fade-wallpaper-height, 0px)) !important;
  margin-inline: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  overflow: hidden !important;
  transform: translate(
    var(--tle-chat-fade-wallpaper-left, 0px),
    var(--tle-chat-fade-wallpaper-top, 0px)
  ) !important;
  z-index: -1 !important;
  pointer-events: none !important;
  contain: none !important;
  background-color: var(--tle-chat-fade-wallpaper-color, transparent) !important;
  background-image: var(--tle-chat-fade-wallpaper-image, none) !important;
  background-size: var(--tle-chat-fade-wallpaper-size, auto) !important;
  background-position: var(--tle-chat-fade-wallpaper-position, 0 0) !important;
  background-repeat: var(--tle-chat-fade-wallpaper-repeat, repeat) !important;
  background-attachment: var(--tle-chat-fade-wallpaper-attachment, scroll) !important;
  background-origin: var(--tle-chat-fade-wallpaper-origin, padding-box) !important;
  background-clip: var(--tle-chat-fade-wallpaper-clip, border-box) !important;
  background-blend-mode: var(--tle-chat-fade-wallpaper-blend, normal) !important;
  filter: var(--tle-chat-fade-wallpaper-filter, none) !important;
  opacity: var(--tle-chat-fade-wallpaper-opacity, 1) !important;
  mix-blend-mode: var(--tle-chat-fade-wallpaper-mix, normal) !important;
}

/* Grid/row layouts use a fixed pseudo-layer and are clipped to the chat viewport. */
#chat.tle-chat-fade-active.tle-chat-fade-fixed.tle-chat-fade-pseudo-before::before,
#chat.tle-chat-fade-active.tle-chat-fade-fixed.tle-chat-fade-pseudo-after::after {
  position: fixed !important;
  inset: auto !important;
  left: var(--tle-chat-fade-wallpaper-left, 0px) !important;
  top: var(--tle-chat-fade-wallpaper-top, 0px) !important;
  width: var(--tle-chat-fade-wallpaper-width, 0px) !important;
  height: var(--tle-chat-fade-wallpaper-height, 0px) !important;
  margin: 0 !important;
  transform: none !important;
  clip-path: inset(
    var(--tle-chat-fade-clip-top, 0px)
    var(--tle-chat-fade-clip-right, 0px)
    var(--tle-chat-fade-clip-bottom, 0px)
    var(--tle-chat-fade-clip-left, 0px)
  ) !important;
}

/* Only used when both theme pseudo-elements are occupied and #chat has no image of its own. */
#chat.tle-chat-fade-active.tle-chat-fade-background-fallback {
  background-image: var(--tle-chat-fade-wallpaper-image, none) !important;
  background-size: var(--tle-chat-fade-wallpaper-size, auto) !important;
  background-position: var(--tle-chat-fade-wallpaper-position, 0 0) !important;
  background-repeat: var(--tle-chat-fade-wallpaper-repeat, no-repeat) !important;
  background-attachment: fixed !important;
  background-origin: var(--tle-chat-fade-wallpaper-origin, padding-box) !important;
  background-clip: var(--tle-chat-fade-wallpaper-clip, border-box) !important;
  background-blend-mode: var(--tle-chat-fade-wallpaper-blend, normal) !important;
}

#sheld#sheld#sheld #form_sheld {
  flex: 0 0 auto !important;
  position: relative !important;
  z-index: 31 !important;
}

/* Return-to-latest control: anchored to the composer, never part of its layout. */
#${ID.scrollBottom} {
  position: absolute !important;
  inset: auto auto calc(100% + 10px) 50% !important;
  z-index: 40 !important;
  display: grid !important;
  place-items: center !important;
  width: 30px !important;
  min-width: 30px !important;
  height: 30px !important;
  min-height: 30px !important;
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
  appearance: none !important;
  -webkit-appearance: none !important;
  border: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, var(--SmartThemeBodyColor, #fff)) 62%, transparent) !important;
  border-radius: 50% !important;
  color: var(--SmartThemeBodyColor, #f4eee9) !important;
  background: color-mix(in srgb, var(--SmartThemeBlurTintColor, #292326) 92%, transparent) !important;
  box-shadow: 0 1px 2px rgb(0 0 0 / 12%) !important;
  font: inherit !important;
  font-size: 17px !important;
  line-height: 1 !important;
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transform: translate(-50%, 5px);
  transition: opacity .18s ease, transform .18s ease, visibility .18s ease;
  cursor: pointer;
  touch-action: manipulation;
}
#${ID.scrollBottom}[data-visible="true"] {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
  transform: translate(-50%, 0);
}
#${ID.scrollBottom}:disabled {
  cursor: default;
  opacity: 1;
}
#${ID.scrollBottom} > .tle-scroll-arrow {
  display: block;
  font-size: 16px;
  line-height: 1;
}
#${ID.scrollBottom} > .tle-scroll-dots {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 12px;
}
#${ID.scrollBottom} > .tle-scroll-dots > i {
  display: block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: currentColor;
  opacity: .45;
  animation: tle-scroll-dot-pulse 1.05s ease-in-out infinite;
}
#${ID.scrollBottom} > .tle-scroll-dots > i:nth-child(2) { animation-delay: .15s; }
#${ID.scrollBottom} > .tle-scroll-dots > i:nth-child(3) { animation-delay: .3s; }
@keyframes tle-scroll-dot-pulse {
  0%, 65%, 100% { opacity: .35; transform: translateY(0); }
  32% { opacity: 1; transform: translateY(-2px); }
}
@media (prefers-reduced-motion: reduce) {
  #${ID.scrollBottom} { transition: none; }
  #${ID.scrollBottom} > .tle-scroll-dots > i { animation: none; opacity: .85; }
}
@media (width > 1000px) {
  #sheld#sheld#sheld {
    width: min(var(--sheldWidth, 100%), 100%) !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    box-sizing: border-box;
  }
  #sheld#sheld#sheld :is(#chat, #form_sheld) {
    align-self: center !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-inline: auto !important;
  }
}
@media (max-width: 1000px) {
  body[data-tle-nav] {
    --tle-rail-width: min(var(--tle-requested-width, 68px), calc(100vw - 44px));
    --tle-row-gap: 1px;
    --tle-row-preferred: 36px;
    --tle-panel-left: 12px;
    --tle-panel-bottom: calc(var(--tle-rail-bottom) + var(--tle-engine-size) + 6px);
    --tle-native-left: 0px;
    --tle-native-top: 0px;
    --tle-native-width: 100vw;
  }
  /* Keep the drawer full-height; reserve only an internal strip for the hamburger. */
  body[data-tle-nav] #top-settings-holder > .drawer > .drawer-content.openDrawer {
    padding-block-start: calc(var(--tle-rail-top) + 44px) !important;
  }
  /* Native drawers are closed through their own toggle before the rail opens.
     Do not leave visibility-hidden openDrawer layers underneath the navigation. */
  #sheld#sheld#sheld { padding-bottom: env(safe-area-inset-bottom, 0px); box-sizing: border-box; }
}

@media (max-width: 480px) {
  body[data-tle-nav]:not([data-tle-nav="icons"]) {
    --tle-rail-width: min(85dvw, calc(100vw - 44px));
  }
}

@media (max-height: 530px) {
  body[data-tle-nav][data-tle-compact] {
    --tle-row-height: min(var(--tle-row-preferred), calc((100dvh - var(--tle-rail-top) - var(--tle-rail-bottom) - var(--tle-rail-header) - var(--tle-engine-size) - var(--tle-organizer-size) - 28px) / var(--tle-half-rows, 6) - var(--tle-row-gap)));
  }
  body[data-tle-nav="icons"][data-tle-compact] { --tle-rail-width: 96px; }
  body[data-tle-nav][data-tle-compact] #${ID.workspaceHeader} {
    position: absolute;
    inset: var(--tle-rail-top) 6px auto;
    width: auto;
    margin: 0;
  }
  body[data-tle-nav][data-tle-compact] #top-settings-holder#top-settings-holder {
    padding-top: calc(var(--tle-rail-top) + var(--tle-rail-header) + 2px) !important;
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(var(--tle-half-rows, 6), max(1px, var(--tle-row-height))) minmax(0, 1fr) auto auto;
    align-content: start;
    column-gap: 4px !important;
  }
  body[data-tle-compact] #top-settings-holder > .drawer:first-child { padding-right: 0; }
  body[data-tle-compact] #top-settings-holder > .tle-sidebar-info { grid-area: -4 / 1 / -3 / -1; align-self: start; max-height: 100%; }
  body[data-tle-compact] #${ID.organizerEntry} { grid-area: -3 / 1 / -2 / -1; }
  body[data-tle-compact] #${ID.nav} { grid-area: -2 / 1 / -1 / -1; }
}


/* Global search: a centered modal independent from the navigation rail. */
body.tle-global-search-open { overflow: hidden !important; }
#tle-global-search-panel {
  position: fixed;
  inset: 0;
  z-index: 10090;
  display: grid;
  place-items: center;
  padding: 16px;
  box-sizing: border-box;
  color: var(--SmartThemeBodyColor, inherit);
  /* The scrim only dims the page; the dialog surface itself is opaque. */
  background: rgb(0 0 0 / 48%);
}
#tle-global-search-panel[hidden] { display: none !important; }
#tle-global-search-panel .tle-search-surface {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: min(560px, calc(100vw - 32px));
  height: min(700px, 70dvh);
  max-height: calc(100dvh - 32px);
  min-height: 280px;
  min-width: 0;
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
  text-align: left;
  color: var(--SmartThemeBodyColor, inherit);
}
#tle-global-search-panel .tle-search-heading {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 22%));
}
#tle-global-search-panel .tle-search-heading-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  gap: 3px;
}
#tle-global-search-panel .tle-search-title { font-size: 1.08em; font-weight: 700; }
#tle-global-search-panel .tle-search-subtitle { font-size: .78em; opacity: .62; }
#tle-global-search-panel .tle-search-close {
  display: grid;
  flex: 0 0 34px;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  color: inherit;
  background: rgb(127 127 127 / 12%);
  font-size: 21px;
  line-height: 1;
  cursor: pointer;
}
#tle-global-search-panel .tle-search-close:hover { background: rgb(127 127 127 / 22%); }
.tle-search-field {
  display: block;
  flex: 0 0 auto;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  height: 40px;
  min-height: 40px;
  margin: 0;
  padding: 7px 12px;
  box-sizing: border-box;
  border-radius: 10px;
  font: inherit;
}
.tle-search-field-wrap {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.tle-search-field-wrap > .fa-magnifying-glass {
  flex: 0 0 auto;
  opacity: .68;
  font-size: 14px;
}
.tle-search-field-wrap input.tle-search-field { flex: 1 1 auto; }
#tle-global-search-panel button { color: inherit; border: 0; cursor: pointer; font: inherit; }
#tle-global-search-panel .tle-search-clear {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  padding: 0;
  border-radius: 50%;
  background: rgb(127 127 127 / 16%);
  font-size: 21px;
  line-height: 1;
}
#tle-global-search-panel [hidden] { display: none !important; }
#tle-global-search-panel .tle-search-results {
  display: block;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 4px 2px 10px;
}
#tle-global-search-panel .tle-search-status {
  padding: 10px 4px;
  font-size: 12px;
  opacity: .7;
}
#tle-global-search-panel .tle-search-result {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
  min-height: 52px;
  padding: 10px;
  margin: 0 0 5px;
  border-radius: 10px;
  background: rgb(127 127 127 / 10%);
  text-align: start;
  overflow-wrap: anywhere;
}
#tle-global-search-panel .tle-search-result small { font-size: 11px; opacity: .65; }
#tle-global-search-panel .tle-search-result:hover,
#tle-global-search-panel .tle-search-result:focus-visible {
  background: rgb(127 127 127 / 25%);
  outline: 2px solid var(--SmartThemeQuoteColor, #8bbcff);
  outline-offset: -2px;
}
#tle-global-search-panel .tle-search-more {
  width: 100%;
  padding: 12px 4px;
  background: transparent;
}
#tle-global-search-panel .tle-organizer-tabs {
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
  min-width: 0;
  margin-inline-start: auto;
  padding: 1px 0;
}
#tle-global-search-panel .tle-organizer-tabs > button {
  flex: 0 0 auto;
  padding: 6px 12px;
  border: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 20%));
  border-radius: 8px;
  background: rgb(127 127 127 / 8%);
  font-size: .9em;
}
#tle-global-search-panel .tle-organizer-tabs > button[aria-pressed="true"] {
  border-color: var(--SmartThemeQuoteColor, currentColor);
  color: var(--SmartThemeQuoteColor, inherit);
  background: rgb(127 127 127 / 14%);
}
#tle-global-search-panel .tle-organizer-search-view,
#tle-global-search-panel .tle-organizer-resources {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
#tle-global-search-panel .tle-organizer-resources { gap: 5px; }
#tle-global-search-panel .tle-organizer-search-view[hidden],
#tle-global-search-panel .tle-organizer-resources[hidden] { display: none !important; }
#tle-global-search-panel.is-resource-view .tle-search-surface {
  width: min(960px, calc(100vw - 32px));
  max-width: min(960px, calc(100vw - 32px));
  height: min(780px, calc(100dvh - 40px));
  max-height: calc(100dvh - 32px);
}
#tle-global-search-panel .tle-quick-manager .tle-quick-list { flex: 1 1 auto; min-height: 0; }

@media (max-width: 700px) {
  #tle-global-search-panel { padding: 8px; }
  #tle-global-search-panel .tle-search-surface {
    width: 85dvw;
    height: 80dvh;
    max-width: 85dvw;
    max-height: 80dvh;
    min-height: 240px;
    padding: 12px;
    gap: 10px;
    border-radius: 12px;
  }
  #tle-global-search-panel.is-resource-view .tle-search-surface {
    width: calc(100vw - 16px);
    height: calc(100dvh - 16px);
    max-width: calc(100vw - 16px);
    max-height: calc(100dvh - 16px);
    min-height: 240px;
  }
  #tle-global-search-panel .tle-search-heading { flex-wrap: wrap; row-gap: 8px; }
  #tle-global-search-panel .tle-search-heading-copy {
    order: 1;
    flex: 1 1 calc(100% - 48px);
  }
  #tle-global-search-panel .tle-search-close {
    order: 2;
    margin-inline-start: auto;
  }
  #tle-global-search-panel .tle-organizer-tabs {
    order: 3;
    flex: 0 0 100%;
    margin-inline-start: 0;
  }
}
.tle-search-highlight {
  outline: 3px solid var(--SmartThemeQuoteColor, #78b7ff) !important;
  outline-offset: -2px !important;
  box-shadow: 0 0 0 5px rgb(120 183 255 / 22%) !important;
  scroll-margin-block: 64px;
}
.tle-search-location {
  padding: 8px 10px;
  margin: 6px 0;
  border-radius: 8px;
  background: rgb(120 183 255 / 18%);
  overflow-wrap: anywhere;
}

      #${ID.panel} .tle-header {
        display: flex; align-items: center; justify-content: space-between;
        gap: 12px; margin-bottom: 14px;
      }
      #${ID.panel} .tle-title { margin: 0; font-size: 1.15rem; font-weight: 700; }
      #${ID.panel} .tle-update-heading {
        display: flex; flex: 1 1 auto; align-items: center; flex-wrap: wrap;
        gap: 4px 9px; min-width: 0;
      }
      #${ID.panel} .tle-update-summary { font-size: .85em; opacity: .76; overflow-wrap: anywhere; }
      #${ID.panel} .tle-update-alert { font-size: .79em; font-weight: 650; color: #63ae84; border-radius: 999px; padding: 2px 7px; background: color-mix(in srgb, #63ae84 12%, transparent); }
      #${ID.panel} .tle-update-alert[hidden] { display: none !important; }
      #${ID.panel} .tle-update-content {
        display: grid; gap: 9px; padding: 10px 0 2px; min-width: 0;
      }
      #${ID.panel} .tle-update-content .tle-row { min-width: 0; flex-wrap: wrap; }
      #${ID.panel} .tle-update-content .tle-row > :last-child { overflow-wrap: anywhere; }
      #${ID.panel} .tle-update-toggle { padding: 5px 0; cursor: pointer; }
      #${ID.panel} .tle-update-toggle input { flex: 0 0 auto; margin: 0; }
      #${ID.panel} .tle-update-policy { margin: -5px 0 2px; }
      #${ID.panel} .tle-version-meta { display: flex; flex-wrap: wrap; gap: 6px 9px; align-items: center; min-width: 0; margin-top: 3px; }
      #${ID.panel} .tle-version-meta [hidden] { display: none !important; }
      #${ID.panel} .tle-update-pill { display: inline-flex; align-items: center; max-width: 100%; border: 1px solid color-mix(in srgb, #63ae84 45%, transparent); border-radius: 999px; padding: 3px 8px; background: color-mix(in srgb, #63ae84 12%, transparent); color: #63ae84; font: inherit; font-size: .83em; font-weight: 650; cursor: pointer; white-space: nowrap; }
      #${ID.panel} .tle-update-pill:disabled { opacity: .55; cursor: default; }
      #${ID.panel} .tle-update-check { display: inline-flex; align-items: center; background: transparent; border: 0; padding: 3px 5px; border-radius: 6px; cursor: pointer; color: inherit; font-size: .8em; opacity: .75; }
      #${ID.panel} .tle-update-check:disabled { opacity: .45; cursor: default; }
      #${ID.nav} > button { position: relative; }
      #${ID.nav} .tle-engine-update-dot { position: absolute; top: 2px; right: 2px; width: 7px; height: 7px; border-radius: 50%; background: #63ae84; pointer-events: none; box-shadow: 0 0 0 1px var(--SmartThemeBlurTintColor, #282027); }
      #${ID.nav} .tle-engine-update-dot[hidden] { display: none !important; }
      #${ID.panel} .tle-section {
        padding: 12px 0;
        border-top: 1px solid var(--SmartThemeBorderColor, rgba(127,127,127,.3));
      }
      #${ID.panel} .tle-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
      #${ID.panel} .tle-muted { opacity: .72; font-size: .88em; }
      #${ID.panel} .tle-author-credit { font-size: .76em; opacity: .5; letter-spacing: .015em; }
      #${ID.panel} footer.tle-author-credit { margin-top: 8px; padding-top: 7px; text-align: right; border-top: 1px solid color-mix(in srgb, var(--SmartThemeBorderColor, rgba(127,127,127,.3)) 45%, transparent); }
      #${ID.panel} .tle-select-heading {
        display: flex;
        flex-wrap: wrap;
        align-items: baseline;
        gap: 2px 10px;
      }
      #${ID.panel} .tle-select-heading label { margin: 0; }
      #${ID.panel} .tle-section-select {
        display: block;
        width: 100%;
        min-width: 0;
        max-width: 100%;
        margin: 6px 0;
        box-sizing: border-box;
      }
      #${ID.panel} .tle-action-group {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 8px;
        margin-block: 7px 12px;
      }
      #${ID.panel} .tle-action-group + .tle-muted,
      #${ID.panel} .tle-muted:has(+ .tle-action-group) { margin: 0; }
      #${ID.panel} .tle-action-group .tle-action { margin: 0; max-width: 100%; }
      #${ID.panel} .tle-action[data-tle-action="emergency-restore"] {
        border-color: var(--toast-error, #a44);
      }
      #${ID.panel} button { cursor: pointer; }
      #${ID.panel} .tle-action {
        padding: 7px 12px; border: 1px solid var(--SmartThemeBorderColor, rgba(127,127,127,.4));
        border-radius: 7px; color: inherit; background: var(--SmartThemeBlurTintColor, transparent);
      }
      #top-settings-holder > .tle-sidebar-info[hidden] { display: none !important; }
      #top-settings-holder > .tle-sidebar-info {
        pointer-events: auto;
        display: grid;
        flex: 0 1 auto;
        align-content: start;
        gap: 2px;
        width: 100%;
        min-width: 0;
        min-height: 0;
        max-height: none;
        overflow-x: hidden;
        overflow-y: auto;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
        margin: 2px 0 0;
        padding: 2px 0 0;
        box-sizing: border-box;
      }
      #top-settings-holder > .tle-sidebar-info .tle-info-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 22px;
        align-items: center;
        gap: 6px;
        width: 100%;
        min-width: 0;
        padding: 5px 2px;
        margin: 0;
        border: 0;
        border-radius: 0;
        color: inherit;
        background: transparent;
        text-align: left;
        font: inherit;
        box-shadow: none;
      }
      #top-settings-holder > .tle-sidebar-info button.tle-info-copy {
        display: flex;
        flex-direction: row;
        align-items: baseline;
        justify-content: flex-start;
        gap: 6px;
        width: 100%;
        min-width: 0;
        margin: 0;
        padding: 1px 0;
        border: 0 !important;
        border-radius: 0 !important;
        color: inherit;
        background: transparent !important;
        box-shadow: none !important;
        font: inherit;
        text-align: left;
        cursor: default;
      }
      #top-settings-holder > .tle-sidebar-info button.tle-info-copy:enabled { cursor: pointer; }
      #top-settings-holder > .tle-sidebar-info button.tle-info-copy:hover,
      #top-settings-holder > .tle-sidebar-info button.tle-info-copy:focus-visible {
        color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
        background: transparent !important;
        box-shadow: none !important;
      }
      #top-settings-holder > .tle-sidebar-info button.tle-info-copy:disabled {
        opacity: 1;
      }
      #top-settings-holder > .tle-sidebar-info .tle-info-copy { min-width: 0; }
      #top-settings-holder > .tle-sidebar-info .tle-info-title {
        display: block;
        flex: 0 1 auto;
        min-width: 0;
        max-width: 44%;
        margin: 0;
        overflow: hidden;
        font-size: .80em;
        line-height: 1.25;
        letter-spacing: .015em;
        opacity: .58;
        white-space: nowrap;
        text-overflow: ellipsis;
      }
      #top-settings-holder > .tle-sidebar-info .tle-info-value {
        display: block;
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        font-size: .95em;
        line-height: 1.3;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      #top-settings-holder > .tle-sidebar-info button.tle-info-arrow {
        display: grid;
        place-items: center;
        width: 22px;
        min-width: 22px;
        height: 26px;
        margin: 0;
        padding: 0;
        border: 0 !important;
        border-radius: 5px !important;
        color: inherit;
        background: transparent !important;
        box-shadow: none !important;
        font-size: .8em;
        line-height: 1;
        opacity: .52;
        cursor: pointer;
        transition: color .16s ease, opacity .16s ease, transform .16s ease;
      }
      #top-settings-holder > .tle-sidebar-info button.tle-info-arrow:hover,
      #top-settings-holder > .tle-sidebar-info button.tle-info-arrow:focus-visible {
        color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit));
        background: transparent !important;
        opacity: 1;
      }
      #top-settings-holder > .tle-sidebar-info .tle-info-item[data-jump="false"] .tle-info-arrow { display: none; }
      #top-settings-holder > .tle-sidebar-info .tle-info-empty {
        margin: 2px 6px;
        font-size: .8em;
        opacity: .65;
      }
      #${ID.panel} .tle-info-settings {
        display: grid;
        gap: 8px;
        margin-top: 10px;
      }
      #${ID.panel} .tle-info-setting {
        display: grid;
        grid-template-columns: minmax(0,1fr) auto auto auto;
        align-items: center;
        gap: 10px;
        font-size: .9em;
      }
      #${ID.panel} .tle-info-setting small { opacity: .65; }
      #${ID.panel} .tle-info-setting input { margin: 0; }
      #${ID.panel} .tle-info-subheading {
        display: block;
        margin-top: 14px;
      }
      #${ID.panel} .tle-info-width-setting {
        display: grid;
        grid-template-columns: minmax(0,1fr) auto;
        gap: 6px 12px;
        margin-top: 12px;
        align-items: center;
      }
      #${ID.panel} .tle-info-width-setting input { grid-column: 1 / -1; width: 100%; }
      #${ID.panel} .tle-info-width-setting small { grid-column: 1 / -1; opacity: .65; }
      #${ID.panel} [data-tle-compat-nav-opacity][hidden] { display: none !important; }

      /* ==========================================
         USER LAYOUT CSS — canonical base layer
         Integrated from the supplied current stylesheet.
         Keep base shell, gallery, character detail, hotswap and persona rules here.
         ========================================== */
/* ==========================================
   TAVERN LAYOUT ENGINE
   DESKTOP WORKSPACE
   ========================================== */

/* ==========================================
   § 00. GLOBAL VARIABLES
   ========================================== */

:root {
  --gallery-card-min-width: 190px;
  --gallery-card-gap: 16px;
  --gallery-image-ratio: 2 / 3;

  --tle-persona-card-min: 160px;
  --tle-persona-card-gap: 14px;
  --tle-persona-avatar-ratio: 2 / 3;
}

@media screen and (width > 1000px) {

  /* ==========================================
     § 01. CHARACTER GALLERY
     ========================================== */

  /* ---------- 01.1 Grid mode ---------- */

  body.charListGrid #right-nav-panel #rm_print_characters_block {
    display: grid;
    grid-template-columns: repeat( auto-fill, minmax(min(100%, var(--gallery-card-min-width)), 1fr) );
    grid-auto-flow: row;
    grid-auto-rows: max-content;
    align-content: start;
    align-items: center !important;
    gap: var(--gallery-card-gap);
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }

  body.charListGrid #right-nav-panel #rm_print_characters_block > .character_select,
  body.charListGrid #right-nav-panel #rm_print_characters_block > .group_select,
  body.charListGrid #right-nav-panel #rm_print_characters_block > .bogus_folder_select {
    width: 100%;
    min-width: 0;
    max-width: none;
    margin: 0;
    box-sizing: border-box;
  }

  body.charListGrid #right-nav-panel #rm_print_characters_block > .bogus_folder_select { grid-column: 1 / -1; }

  body.charListGrid #right-nav-panel #rm_print_characters_block > .character_select {
    display: flex;
    flex-direction: column;
    align-items: center !important;
    align-self: start;
    height: auto;
    min-height: 0;
    padding: 0;
  }

  body.charListGrid #right-nav-panel .character_select > .avatar {
    display: block;
    position: relative;
    flex: 0 0 auto;
    width: 100%;
    max-width: none;
    height: auto;
    aspect-ratio: var(--gallery-image-ratio);
    overflow: hidden;
  }

  body.charListGrid #right-nav-panel .character_select > .avatar img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    object-fit: cover;
    object-position: center;
  }

  body.charListGrid #right-nav-panel .character_select > .character_select_container {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    align-items: center;
    align-self: stretch;
    width: 100%;
    min-width: 0;
    max-width: none;
    height: auto;
    margin: 0;
    padding: 12px;
    box-sizing: border-box;
  }

  body.charListGrid #right-nav-panel .character_select .character_name_block {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 5px;
    width: 100%;
    min-width: 0;
    max-width: none;
  }

  body.charListGrid #right-nav-panel .character_select .ch_name {
    display: block;
    width: 100%;
    min-width: 0;
    font-size: 1.05em;
    font-weight: 650;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  body.charListGrid #right-nav-panel .character_select .ch_avatar_url { display: none !important; }

  body.charListGrid #right-nav-panel .character_select .ch_description:not(:empty) {
    display: -webkit-box !important;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-height: 1.55;
  }

  /* ---------- 01.2 Compact list mode ---------- */

  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-flow: row;
    grid-auto-rows: max-content;
    align-content: start;
    align-items: start;
    gap: 8px 12px;
    width: 100%;
    padding: 8px;
    box-sizing: border-box;
  }

  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .character_select,
  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .group_select,
  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .bogus_folder_select {
    width: 100%;
    min-width: 0;
    max-width: none;
    margin: 0;
    box-sizing: border-box;
  }

  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .bogus_folder_select { grid-column: 1 / -1; }

  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .character_select {
    display: flex;
    flex-direction: row;
    flex-wrap: nowrap;
    align-items: center;
    align-self: start;
    height: auto;
    min-height: 90px;
    min-width: 0;
  }

  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .character_select > .avatar {
    display: block;
    position: relative;
    flex: 0 0 60px;
    width: 60px;
    min-width: 60px;
    max-width: 60px;
    height: 90px;
    margin: 0;
    overflow: hidden;
  }

  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .character_select > .avatar img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  body:not(.charListGrid) #right-nav-panel #rm_print_characters_block > .character_select > .character_select_container {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    align-items: flex-start;
    width: auto;
    min-width: 0;
    max-width: none;
    height: auto;
    padding: 8px 10px;
    box-sizing: border-box;
  }

  body:not(.charListGrid) #right-nav-panel .character_select .character_name_block {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px;
    width: 100%;
    min-width: 0;
  }

  body:not(.charListGrid) #right-nav-panel .character_select .ch_name {
    min-width: 0;
    max-width: 100%;
    overflow-wrap: anywhere;
  }
}

/* ==========================================
   § 02. CHARACTER DETAIL
   ========================================== */

/* ---------- 02.1 Form columns ---------- */

#right-nav-panel #rm_ch_create_block #form_create {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 16px;

  #avatar-and-name-block,
  #spoiler_free_desc,
  #creators_note_desc_hidden,
  #hidden-divs { grid-column: 1 / -1; }

  #descriptionWrapper {
    grid-column: 1;
    min-width: 0;
  }

  #firstMessageWrapper {
    grid-column: 2;
    min-width: 0;
  }
}

/* ---------- 02.2 Avatar and identity ---------- */

#right-nav-panel #avatar-and-name-block .expander {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  align-items: start;
  gap: 12px 18px !important;
}

#right-nav-panel #avatar-and-name-block .expander #avatar_div { display: contents !important; }

#right-nav-panel #avatar-and-name-block #avatar_div_div {
  grid-column: 1;
  grid-row: 1 / span 2;
  width: 150px;
  height: auto;
  aspect-ratio: 2 / 3;
  margin: 0;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: 100%;
    aspect-ratio: 2 / 3;
    object-fit: cover;
  }
}

/* ---------- 02.3 Avatar controls ---------- */

#right-nav-panel #avatar-and-name-block #avatar_controls {
  grid-column: 2;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  min-width: 0;

  .form_create_bottom_buttons_block {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  label {
    width: 100%;
    min-width: 0;
  }
}

/* ---------- 02.4 Tags ---------- */

#right-nav-panel #avatar-and-name-block #tags_div {
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
}

/* ---------- 02.5 Narrow detail layout ---------- */

@media screen and (max-width: 650px) {
  #right-nav-panel #rm_ch_create_block #form_create {
    grid-template-columns: minmax(0, 1fr);

    #descriptionWrapper,
    #firstMessageWrapper { grid-column: 1; }
  }

  #right-nav-panel #avatar-and-name-block .expander {
    grid-template-columns: 105px minmax(0, 1fr);
    gap: 10px 12px;
  }

  #right-nav-panel #avatar-and-name-block #avatar_div_div { width: 105px; }
}

/* ==========================================
   § 03. CHARACTER HOTSWAP
   ========================================== */

/* ---------- 03.1 Wrapper ---------- */

#HotSwapWrapper {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  margin: 0;
}

/* ---------- 03.2 Horizontal avatar strip ---------- */

#HotSwapWrapper .avatars_inline:has(.avatar) {
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  gap: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding-bottom: 5px;
  overflow-x: auto;
  overflow-y: hidden;
}

body.big-avatars #HotSwapWrapper .avatars_inline:has(.avatar) { min-height: calc(6px + var(--avatar-base-height) * var(--big-avatar-height-factor) + 2 * var(--avatar-base-border-radius)); }

/* ==========================================
   § 04. USER PERSONA GALLERY
   ========================================== */

@media screen and (width > 1000px) {

  /* ---------- 04.1 Grid mode ---------- */

  #user_avatar_block.gridView {
    display: grid;
    grid-template-columns: repeat( auto-fill, minmax(min(100%, var(--tle-persona-card-min)), 1fr) );
    grid-auto-rows: max-content;
    align-content: start;
    align-items: start;
    gap: var(--tle-persona-card-gap);
    width: 100%;
    min-width: 0;
  }

  #user_avatar_block.gridView > .avatar-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    min-width: 0;
    max-width: none;
    height: auto;
    margin: 0;
    box-sizing: border-box;
  }

  #user_avatar_block.gridView > .avatar-container > .avatar {
    flex: 0 0 auto;
    align-self: stretch;
    width: 100%;
    min-width: 0;
    max-width: none;
    height: auto;
    aspect-ratio: var(--tle-persona-avatar-ratio);
    overflow: hidden;
  }

  #user_avatar_block.gridView > .avatar-container > .avatar img {
    display: block;
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    object-fit: cover;
  }

  #user_avatar_block.gridView .character_select_container {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    width: 100%;
    min-width: 0;
    max-width: none;
    height: auto;
  }

  #user_avatar_block.gridView .character_name_block {
    width: 100%;
    min-width: 0;
  }

  #user_avatar_block.gridView .ch_name { overflow-wrap: anywhere; }

  /* ---------- 04.2 Compact list mode ---------- */

  #user_avatar_block:not(.gridView) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-auto-rows: max-content;
    align-content: start;
    gap: 8px 12px;
    width: 100%;
    min-width: 0;
  }

  #user_avatar_block:not(.gridView) > .avatar-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    min-width: 0;
    max-width: none;
    height: auto;
    margin: 0;
    box-sizing: border-box;
  }

  #user_avatar_block:not(.gridView) > .avatar-container > .avatar {
    flex: 0 0 60px;
    width: 60px;
    min-width: 60px;
    height: 90px;
    overflow: hidden;
  }

  #user_avatar_block:not(.gridView) > .avatar-container > .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  #user_avatar_block:not(.gridView) .character_select_container {
    flex: 1 1 auto;
    width: auto;
    min-width: 0;
    max-width: none;
  }
}

@media screen and (max-width: 1000px) {
  .welcomePanel:has(.showMoreChats) { margin-block-start: var(--topBarBlockSize); }
}

      /* ==========================================
         ENGINE WORKSPACE LAYER
         Runtime-only rules for the preset/character split workspaces.
         ========================================== */

      /* Preset workspace: retain native controls and prompt-manager nodes; only reorganize their containers. */
      @media screen and (width > 1000px) {
        #left-nav-panel.tle-preset-wide {
          --tle-drawer-width: var(--tle-preset-panel-width);
          min-width: 0 !important;
          max-width: none !important;
          overflow-x: hidden;
        }
        /*
         * Scroll ownership:
         * #left-nav-panel is the fixed viewport.
         * .scrollableInner and #ai_response_configuration become layout shells,
         * not scroll containers. Each workspace column owns its own scrollbar.
         */
        /* 保留酒馆原生抽屉开关：闭合时必须隐藏，展开时才启用双栏布局。 */
        #left-nav-panel.tle-preset-wide.closedDrawer {
          display: none !important;
        }
        #left-nav-panel.tle-preset-wide.openDrawer {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        #left-nav-panel.tle-preset-wide > .scrollableInner {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-height: 0;
          height: auto;
          overflow: hidden;
        }
        #left-nav-panel.tle-preset-wide #ai_response_configuration {
          display: flex;
          flex: 1 1 auto;
          flex-direction: column;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }
        #${ID.presetGrid} {
          display: grid;
          grid-template-columns: minmax(340px, .88fr) minmax(480px, 1.12fr);
          align-items: stretch;
          gap: clamp(12px, 1.4vw, 22px);
          flex: 1 1 auto;
          min-height: 0;
          height: 100%;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
          overflow: hidden;
        }
        #${ID.presetSettings}, #${ID.presetPrompts} {
          min-width: 0;
          min-height: 0;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
        }
        #${ID.presetSettings},
        #${ID.presetPrompts} {
          display: block;
        }
        #${ID.presetPrompts} > .range-block { width: 100%; min-width: 0; }
        #${ID.presetPrompts} #completion_prompt_manager { width: 100%; min-width: 0; }

        /* Character workspace: use a dedicated wide shell for its two-column content. */
        #right-nav-panel.tle-character-wide {
          width: min(calc(var(--sheldWidth, 737px) + 20vw), 82vw, calc(100dvw - 104px)) !important;
          min-width: 0 !important;
          max-width: none !important;
        }
        #right-nav-panel.tle-character-wide.openDrawer {
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        #right-nav-panel.tle-character-wide.closedDrawer { display: none !important; }
        #right-nav-panel.tle-character-wide > .scrollableInner {
          flex: 1 1 0;
          align-self: stretch;
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
          min-height: 0;
          height: auto;
          box-sizing: border-box;
          overflow: auto;
        }
        #right-nav-panel.tle-character-wide #rm_ch_create_block,
        #right-nav-panel.tle-character-wide #form_create,
        #right-nav-panel.tle-character-wide #rm_characters_block,
        #right-nav-panel.tle-character-wide #rm_character_import {
          width: 100% !important;
          max-width: none !important;
          min-width: 0 !important;
          box-sizing: border-box;
          align-self: stretch;
        }
        /* Never set display on native editor/form/field wrappers: native toggles own it. */
        #right-nav-panel.tle-character-wide[data-tle-character-selected="true"] > .scrollableInner,
        #right-nav-panel.tle-character-wide #rm_ch_create_block,
        #right-nav-panel.tle-character-wide #form_create {
          min-height: 0;
          overflow: hidden;
        }
        #right-nav-panel.tle-character-wide #rm_ch_create_block,
        #right-nav-panel.tle-character-wide #form_create {
          height: 100%;
          flex: 1 1 auto;
        }
        #right-nav-panel.tle-character-wide #rm_ch_create_block #form_create {
          /* A theme may make the native form a grid. Keep its visibility,
             but make that ancestor a single track rather than a second split. */
          grid-template-columns: minmax(0, 1fr) !important;
          align-items: stretch;
        }
        #${ID.characterGrid} {
          display: grid;
          grid-column: 1 / -1;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: clamp(14px, 1.5vw, 24px);
          align-items: stretch;
          flex: 1 1 0;
          width: 100%;
          max-width: none;
          height: 100%;
          min-width: 0;
          min-height: 0;
          box-sizing: border-box;
          overflow: hidden;
        }
        #${ID.characterIdentity}, #${ID.characterContent} {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          min-width: 0;
          min-height: 0;
          box-sizing: border-box;
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: contain;
          scrollbar-gutter: stable;
        }
        #${ID.characterIdentity} > *, #${ID.characterContent} > * { flex-shrink: 0; }
        #${ID.characterIdentity} #CharListButtonAndHotSwaps,
        #${ID.characterIdentity} #HotSwapWrapper,
        #${ID.characterIdentity} #avatar-and-name-block,
        #${ID.characterIdentity} #avatar-and-name-block > div,
        #${ID.characterIdentity} #avatar_div,
        #${ID.characterIdentity} #avatar_controls,
        #${ID.characterIdentity} #tags_div,
        #${ID.characterIdentity} #spoiler_free_desc,
        #${ID.characterContent} #descriptionWrapper,
        #${ID.characterContent} #firstMessageWrapper {
          min-width: 0 !important;
          width: 100% !important;
          max-width: none !important;
          box-sizing: border-box;
        }
        #${ID.characterIdentity} #avatar-and-name-block {
          flex-direction: column !important;
          flex-wrap: nowrap !important;
          gap: 10px;
        }
        #${ID.characterIdentity} #avatar-and-name-block > .expander {
          /* Supports both native flex and the theme's grid + display:contents.
             Do not force native display values or interfere with hide/show. */
          grid-template-columns: minmax(0, 1fr) !important;
          grid-template-rows: none !important;
          grid-auto-flow: row;
          row-gap: 10px !important;
        }
        #${ID.characterIdentity} #avatar_div_div,
        #${ID.characterIdentity} #avatar_controls,
        #${ID.characterIdentity} #tags_div {
          grid-column: 1 !important;
          grid-row: auto !important;
        }
        #${ID.characterIdentity} #avatar_div {
          flex: 0 0 auto !important;
          flex-direction: column !important;
          flex-wrap: nowrap !important;
          align-items: stretch !important;
          justify-content: flex-start !important;
          height: auto !important;
          gap: 10px;
        }
        #${ID.characterIdentity} #avatar_div_div {
          flex: 0 0 auto !important;
          width: min(100%, 320px) !important;
          max-width: 100% !important;
          min-width: 0 !important;
          height: auto !important;
          min-height: 0 !important;
          max-height: none !important;
          aspect-ratio: 2 / 3 !important;
          align-self: center !important;
          justify-self: center;
          margin: 0 !important;
          padding: 0;
          box-sizing: border-box;
          overflow: hidden;
          position: relative;
        }
        #${ID.characterIdentity} #avatar_load_preview {
          width: 100% !important;
          height: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          max-height: none !important;
          position: absolute;
          inset: 0;
          object-fit: cover;
          box-sizing: border-box;
        }
        #${ID.characterIdentity} #avatar_controls {
          flex: 0 0 auto !important;
          flex-direction: column !important;
          height: auto !important;
          padding: 0;
          gap: 8px;
          align-items: stretch !important;
        }
        #${ID.characterIdentity} #avatar_controls > .buttons_block {
          flex: 0 0 auto !important;
          flex-direction: row !important;
          flex-wrap: wrap !important;
          justify-content: center !important;
          width: 100%;
          min-width: 0;
          height: auto !important;
          gap: 6px;
        }
        #${ID.characterIdentity} #avatar_controls > label {
          flex: 0 0 auto !important;
          width: 100%;
          min-width: 0;
          height: auto !important;
        }
        #${ID.characterIdentity} #char-management-dropdown,
        #${ID.characterIdentity} #tagInput,
        #${ID.characterContent} textarea {
          width: 100%;
          min-width: 0;
          max-width: 100%;
          box-sizing: border-box;
        }
        #${ID.characterContent} #descriptionWrapper,
        #${ID.characterContent} #firstMessageWrapper { flex: 0 0 auto; }
        #${ID.characterContent} #description_textarea { min-height: 280px; }
        #${ID.characterContent} #firstmessage_textarea { min-height: 180px; }
        #${ID.characterContent} .title_restorable { flex-wrap: wrap; gap: 6px; }
      }

    `;
    style.textContent += `
      [data-tle-fold-wrapper] { width: 100%; }
      [data-tle-fold-wrapper] > .inline-drawer-toggle { cursor: pointer; }
      [data-tle-fold-wrapper] > .inline-drawer-content { min-width: 0; }
      #${ID.panel} .tle-fold-options {
        display: grid;
        gap: 8px;
        margin-top: 12px;
      }
      #${ID.panel} .tle-fold-options > strong {
        margin-top: 5px;
        font-size: .88em;
        opacity: .72;
      }

      /* Mobile debugger uses native dialog Top Layer; its body scrolls independently. */
      #tle-mobile-debugger {
        position: fixed !important;
        inset: calc(env(safe-area-inset-top, 0px) + 8px) 8px calc(env(safe-area-inset-bottom, 0px) + 8px) 8px !important;
        width: min(920px, calc(100vw - 16px)) !important;
        height: min(84dvh, 820px) !important;
        max-width: calc(100vw - 16px) !important;
        max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 16px) !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: auto !important;
        padding: 0 !important;
        display: none !important;
        flex-direction: column !important;
        background: #171518 !important;
        color: #f2e9e8 !important;
        border: 1px solid #75636b !important;
        border-radius: 14px !important;
        box-shadow: 0 8px 32px #0009 !important;
        overflow: hidden !important;
        font: 14px/1.45 system-ui, sans-serif !important;
      }
      #tle-mobile-debugger[open] { display: flex !important; }
      #tle-mobile-debugger::backdrop { background: rgb(8 7 9 / 58%); }
      #tle-mobile-debugger .tle-debug-head {
        display: flex; flex: 0 0 auto; align-items: center; gap: 9px; padding: 12px;
        border-bottom: 1px solid #51454a;
      }
      #tle-mobile-debugger .tle-debug-head span { opacity: .7; font-size: 12px; }
      #tle-mobile-debugger .tle-debug-head button {
        margin-left: auto; font-size: 24px; background: transparent;
        color: inherit; border: 0; padding: 0 8px;
      }
      #tle-mobile-debugger .tle-debug-body {
        display: flex; flex: 1 1 auto; min-height: 0; flex-direction: column;
        gap: 9px; padding: 10px; overflow: auto; overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      #tle-mobile-debugger .tle-debug-hint { margin: 0; font-size: 12px; opacity: .75; }
      #tle-mobile-debugger textarea {
        width: 100%; min-height: 150px; max-height: 34vh; resize: vertical;
        box-sizing: border-box; background: #242126; color: #f5eeee;
        border: 1px solid #62545c; border-radius: 8px; padding: 10px;
        font: 12px/1.5 ui-monospace, monospace;
      }
      #tle-mobile-debugger .tle-debug-actions { display: flex; flex-wrap: wrap; gap: 7px; flex: 0 0 auto; }
      #tle-mobile-debugger button {
        background: #393038; color: #f7eeee; border: 1px solid #796670;
        border-radius: 7px; padding: 8px 10px; font-size: 12px;
      }
      #tle-mobile-debugger .tle-debug-label { font-weight: 650; font-size: 12px; opacity: .85; }
      #tle-mobile-debugger pre {
        margin: 0; min-height: 100px; max-height: 34vh; overflow: auto;
        white-space: pre-wrap; overflow-wrap: anywhere; background: #100f12;
        border: 1px solid #40383e; border-radius: 8px; padding: 10px;
        font: 11px/1.5 ui-monospace, monospace; user-select: text;
      }
      @media (max-width: 480px) {
        #tle-mobile-debugger {
          width: calc(100vw - 16px) !important;
          height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 16px) !important;
          max-width: calc(100vw - 16px) !important;
          max-height: calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 16px) !important;
        }
      }

      /* Centered modal surfaces for the group manager and information-station quick pickers. */
      body.tle-quick-modal-open { overflow: hidden !important; }
      .tle-quick-overlay {
        position: fixed;
        inset: 0;
        z-index: 10080;
        display: grid;
        place-items: center;
        padding: 16px;
        box-sizing: border-box;
        /* The scrim dims the page without blurring the popup or its contents. */
        background: rgb(0 0 0 / 48%);
      }
      .tle-quick-surface {
        display: flex;
        flex-direction: column;
        gap: 7px;
        width: min(960px, calc(100vw - 32px));
        height: min(780px, calc(100dvh - 40px));
        max-height: calc(100dvh - 32px);
        min-height: 280px;
        min-width: 0;
        padding: 14px;
        box-sizing: border-box;
        overflow: hidden;
        text-align: left;
        color: var(--SmartThemeBodyColor, inherit);
      }

      /* All TLE popup bodies use an opaque theme-aware surface. This explicitly
         overrides host .popup glass skins without changing native or third-party popups. */
      #${ID.chatToolsPanel},
      #tle-global-search-panel > .tle-search-surface,
      #tle-quick-picker > .tle-quick-surface {
        color: var(--SmartThemeBodyColor, inherit) !important;
        background: rgb(from var(--SmartThemeBlurTintColor, #282027) r g b / 1) !important;
        background-image: none !important;
        background-blend-mode: normal !important;
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
        opacity: 1 !important;
      }

      #tle-quick-picker > .tle-quick-picker-surface {
        width: min(560px, calc(100vw - 32px));
        height: min(680px, 70dvh);
        max-height: calc(100dvh - 32px);
        min-height: 280px;
        min-width: 0;
        padding: 14px;
        gap: 10px;
        box-sizing: border-box;
        overflow: visible;
      }
      /* Companion plan management uses the Session Tools plan-page height.
         Desktop stays 560px wide (wider than Session Tools' 460px). */
      #tle-quick-picker[data-tle-quick-panel="companion-manager"] > .tle-quick-picker-surface {
        height: min(80dvh, 700px);
        max-height: min(80dvh, 700px);
      }
.tle-quick-picker-surface .tle-quick-heading {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 22%));
}
.tle-quick-picker-surface .tle-quick-title {
  min-width: 0;
  font-size: 1.08em;
  font-weight: 700;
}
.tle-quick-picker-surface .tle-quick-close {
  display: grid;
  flex: 0 0 34px;
  place-items: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  color: inherit;
  background: rgb(127 127 127 / 12%);
  font-size: 21px;
  line-height: 1;
  cursor: pointer;
}
.tle-quick-picker-surface .tle-quick-close:hover { background: rgb(127 127 127 / 22%); }
.tle-quick-picker-surface .tle-search-field { flex: 0 0 auto; }
.tle-quick-picker-surface .scrollableInner {
  flex: 1 1 auto;
  min-height: 0 !important;
  overflow: auto;
  overscroll-behavior: contain;
}

      .tle-quick-manager .tle-quick-heading {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: nowrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
        padding-bottom: 8px;
        border-bottom: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 22%));
      }
      .tle-quick-manager .tle-quick-title {
        flex: 1 1 auto;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 1.12em;
        font-weight: 700;
      }
      .tle-quick-manager .tle-quick-heading-actions {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        min-width: 0;
        margin-left: auto;
      }
      .tle-quick-manager .tle-quick-heading-actions[hidden] { display: none !important; }
      .tle-quick-manager .tle-quick-heading-actions > button {
        flex: 0 0 auto;
        white-space: nowrap;
      }
      .tle-quick-manager .tle-quick-close {
        display: grid;
        place-items: center;
        flex: 0 0 36px;
        width: 36px;
        height: 36px;
        padding: 0;
        border: 0;
        border-radius: 8px;
        color: inherit;
        background: rgb(127 127 127 / 12%);
        font-size: 20px;
        line-height: 1;
        cursor: pointer;
      }
      .tle-quick-manager .tle-quick-close:hover { background: rgb(127 127 127 / 22%); }
      .tle-quick-manager .tle-quick-hint,
      .tle-quick-manager .tle-quick-status {
        flex: 0 0 auto;
        opacity: .68;
        font-size: .82em;
      }
      .tle-quick-manager .tle-quick-tabs,
      .tle-quick-manager .tle-quick-operations {
        flex: 0 0 auto;
        gap: 5px;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;
        padding-bottom: 3px;
      }
      .tle-quick-manager .tle-quick-tabs > button { flex: 0 0 auto; }
      .tle-quick-manager .tle-quick-tabs > button[aria-pressed="true"],
      .tle-quick-manager .tle-quick-group-bar > button[aria-pressed="true"] {
        border-color: var(--SmartThemeQuoteColor, currentColor);
        color: var(--SmartThemeQuoteColor, inherit);
      }
      .tle-quick-manager .tle-quick-group-bar {
        flex: 0 0 auto;
        flex-wrap: nowrap;
        gap: 6px;
        min-width: 0;
        overflow-x: auto;
        padding: 3px 0 8px;
        border-bottom: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 18%));
      }
      .tle-quick-manager .tle-quick-group-bar > button { flex: 0 0 auto; }
      .tle-quick-manager .tle-quick-edit {
        display: grid;
        grid-template-columns: minmax(0, 1fr) repeat(3, auto);
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-edit > input { width: 100%; min-width: 0; }
      .tle-quick-manager .tle-quick-list .checkbox_label {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        width: 100%;
        min-width: 0;
        margin: 0;
        padding: 8px 4px;
        border-bottom: 1px solid rgb(127 127 127 / 12%);
        box-sizing: border-box;
      }
      .tle-quick-manager .tle-quick-list .checkbox_label:last-child { border-bottom: 0; }
      .tle-quick-manager .tle-quick-list .checkbox_label > span {
        min-width: 0;
        overflow-wrap: anywhere;
      }

      /* Organizer controls: category navigation and backup share one row;
         group filters and target-group actions share another. */
      .tle-quick-manager .tle-quick-category-row {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-category-row .tle-quick-tabs {
        flex: 1 1 auto;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-category-row .tle-quick-backup-row,
      .tle-quick-manager .tle-quick-category-row .tle-quick-theme-import {
        flex: 0 0 auto;
      }
      .tle-quick-manager .tle-quick-group-controls {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(360px, 420px);
        align-items: center;
        gap: 8px;
        flex: 0 0 auto;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-filter-bar {
        display: flex;
        flex: 1 1 auto;
        flex-wrap: nowrap;
        gap: 6px;
        min-width: 0;
        max-height: none;
        overflow-x: auto;
        overflow-y: hidden;
        padding: 0 0 2px;
      }
      .tle-quick-manager .tle-quick-toolbar {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-toolbar > select {
        width: 100%;
        min-width: 0;
        margin: 0;
      }
      .tle-quick-manager .tle-quick-backup-row {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: flex-end;
        gap: 4px;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-backup-row > .tle-quick-icon-action {
        display: grid;
        place-items: center;
        flex: 0 0 32px;
        width: 32px;
        min-width: 32px;
        height: 32px;
        padding: 0;
        margin: 0;
        font-size: 1em;
        line-height: 1;
        cursor: pointer;
      }
      .tle-quick-manager .tle-quick-theme-import {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-theme-import[hidden] { display: none !important; }
      .tle-quick-manager .tle-quick-theme-import > button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 32px;
        padding: 5px 8px;
        margin: 0;
        white-space: nowrap;
        font-size: .9em;
      }
      .tle-quick-manager .tle-quick-transfer-confirm {
        display: flex;
        flex: 0 0 auto;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
        padding: 9px;
        border: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 24%));
        border-radius: 8px;
        background: rgb(127 127 127 / 7%);
      }
      .tle-quick-manager .tle-quick-transfer-confirm[hidden] { display: none !important; }
      .tle-quick-manager .tle-quick-transfer-message {
        margin: 0;
        white-space: pre-line;
        overflow-wrap: anywhere;
        font-size: .88em;
        line-height: 1.45;
      }
      .tle-quick-manager .tle-quick-transfer-actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 6px;
      }
      .tle-quick-manager .tle-quick-transfer-actions > button { white-space: nowrap; }
      .tle-quick-manager .tle-quick-manage-row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto auto auto;
        align-items: center;
        gap: 7px;
        flex: 0 0 auto;
        min-width: 0;
        padding: 7px;
        border: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 20%));
        border-radius: 8px;
        background: rgb(127 127 127 / 4%);
      }
      .tle-quick-manager .tle-quick-manage-row[hidden] { display: none !important; }
      .tle-quick-manager .tle-quick-manage-row > input {
        width: 100%;
        min-width: 0;
        margin: 0;
      }
      .tle-quick-manager .tle-quick-operations {
        flex-wrap: wrap;
        overflow: visible;
        padding-bottom: 2px;
      }
      .tle-quick-manager .tle-quick-operations > button {
        flex: 0 0 auto;
      }
      @media (max-width: 680px) {
        .tle-quick-manager .tle-quick-group-controls {
          grid-template-columns: minmax(0, 1fr);
          gap: 5px;
        }
        .tle-quick-manager .tle-quick-toolbar {
          grid-template-columns: minmax(0, 1fr) auto auto;
        }
        .tle-quick-manager .tle-quick-toolbar > select {
          grid-column: 1;
        }
        .tle-quick-manager .tle-quick-manage-row {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 5px;
          padding: 5px;
        }
        .tle-quick-manager .tle-quick-manage-row > input { grid-column: 1 / -1; }
        .tle-quick-manager .tle-quick-manage-row > button {
          min-width: 0;
          padding-inline: 6px;
        }
      }

      .tle-quick-manager .tle-quick-filter,
      .tle-quick-manager .tle-quick-group-tag {
        appearance: none;
        -webkit-appearance: none;
        flex: 0 0 auto;
        max-width: 100%;
        padding: 4px 9px;
        border: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 24%));
        border-radius: 999px;
        color: var(--SmartThemeBodyColor, inherit);
        background: rgb(127 127 127 / 7%);
        font: inherit;
        font-size: .8em;
        line-height: 1.3;
        cursor: pointer;
      }
      .tle-quick-manager .tle-quick-filter[aria-pressed="true"] {
        border-color: var(--SmartThemeQuoteColor, currentColor);
        color: var(--SmartThemeQuoteColor, inherit);
        background: color-mix(in srgb, var(--SmartThemeQuoteColor, currentColor) 9%, transparent);
      }
      .tle-quick-manager .tle-quick-list {
        flex: 1 1 auto;
        min-height: 100px !important;
        padding: 5px 8px;
        border: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 22%));
        border-radius: 10px;
        box-sizing: border-box;
        overflow: auto;
        overscroll-behavior: contain;
        background: rgb(127 127 127 / 5%);
      }
      .tle-quick-manager .tle-quick-item {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        min-width: 0;
        margin: 0;
        padding: 7px 3px;
        border-bottom: 1px solid rgb(127 127 127 / 11%);
        box-sizing: border-box;
      }
      .tle-quick-manager .tle-quick-item:last-child { border-bottom: 0; }
      .tle-quick-manager .tle-quick-item-check { flex: 0 0 auto; margin: 0; }
      .tle-quick-manager .tle-quick-item-copy {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .tle-quick-manager .tle-quick-item-title {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tle-quick-manager 
.tle-quick-item-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}
.tle-quick-item-title-row .tle-quick-item-title { min-width: 0; }
.tle-quick-item-status {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  padding: 1px 6px;
  border: 1px solid var(--SmartThemeBorderColor, rgb(127 127 127 / 25%));
  border-radius: 999px;
  font-size: 10px;
  line-height: 1.35;
  white-space: nowrap;
  opacity: .82;
}
.tle-quick-item-status.is-orphan {
  color: var(--SmartThemeEmColor, #c66);
  border-color: color-mix(in srgb, var(--SmartThemeEmColor, #c66) 38%, transparent);
}
.tle-quick-item-status.is-warning { color: var(--SmartThemeQuoteColor, currentColor); }
.tle-quick-item-status.is-pending { opacity: .64; }
.tle-quick-manager .tle-quick-item-worldbook .tle-quick-item-detail {
  white-space: normal;
  overflow-wrap: anywhere;
  line-height: 1.35;
}
.tle-quick-item-detail {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: .8em;
        opacity: .62;
      }
      .tle-quick-manager .tle-quick-group-tag {
        flex: 0 0 auto;
        max-width: min(34%, 180px);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin-left: auto;
        font-size: .76em;
      }
      .tle-quick-manager .tle-quick-group-tag:hover {
        border-color: var(--SmartThemeQuoteColor, currentColor);
        color: var(--SmartThemeQuoteColor, inherit);
      }
      .tle-quick-manager .tle-quick-empty {
        margin: 12px 4px;
        opacity: .62;
        text-align: center;
        font-size: .88em;
      }
      .tle-quick-avatar {
        display: inline-flex;
        flex: 0 0 32px;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        overflow: hidden;
        border-radius: 7px;
        background: rgb(127 127 127 / 13%);
      }
      .tle-quick-avatar img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }
      .tle-quick-avatar.is-fallback::before {
        content: '♙';
        font-size: 17px;
        opacity: .5;
      }

      /* Quick picker entries are plain list rows, not Tavern menu buttons.
         Keep the native popup surface and group headings; remove only the
         inherited button skin from each selectable option. */
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option {
        appearance: none !important;
        -webkit-appearance: none !important;
        display: flex !important;
        align-items: flex-start !important;
        justify-content: flex-start !important;
        width: 100% !important;
        min-width: 0 !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 7px 8px !important;
        border: 0 !important;
        border-radius: 0 !important;
        outline: 0;
        box-shadow: none !important;
        background: transparent !important;
        color: var(--SmartThemeBodyColor, inherit) !important;
        font: inherit !important;
        font-weight: 400;
        line-height: 1.4;
        text-align: left !important;
        text-decoration: none !important;
        cursor: pointer;
      }
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option:hover,
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option:focus-visible {
        border: 0 !important;
        outline: 0 !important;
        box-shadow: none !important;
        background: color-mix(in srgb, var(--SmartThemeQuoteColor, currentColor) 8%, transparent) !important;
        color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit)) !important;
      }
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option[aria-pressed="true"] {
        color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor, inherit)) !important;
        font-weight: 600;
      }
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option:disabled {
        opacity: .45;
        cursor: not-allowed;
        background: transparent !important;
      }
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option-row {
        display: flex;
        align-items: center;
        gap: 9px;
        width: 100%;
        min-width: 0;
      }
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option-copy {
        display: flex;
        flex: 1 1 auto;
        flex-direction: column;
        align-items: flex-start;
        min-width: 0;
        gap: 2px;
      }
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option-name {
        display: block;
        width: 100%;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #tle-quick-picker[data-tle-quick-panel]:not([data-tle-quick-panel="groups"]) .tle-quick-option small {
        font-size: .8em;
        opacity: .62;
      }

      @media (max-width: 700px) {
        .tle-quick-overlay { padding: 8px; }
        .tle-quick-surface {
          width: 100%;
          height: calc(100dvh - 16px);
          max-height: calc(100dvh - 16px);
          min-height: 220px;
          padding: 12px;
          gap: 10px;
          border-radius: 12px;
        }

        .tle-quick-manager .tle-quick-edit {
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
        }
        .tle-quick-manager .tle-quick-edit > input { grid-column: 1 / -1; }
        .tle-quick-manager .tle-quick-create-row {
          grid-template-columns: minmax(0, 1fr) auto;
        }
        .tle-quick-manager .tle-quick-target-row {
          grid-template-columns: minmax(0, 1fr) repeat(2, auto);
          gap: 5px;
        }
        .tle-quick-manager .tle-quick-target-row > button,
        .tle-quick-manager .tle-quick-create-row > button {
          padding-inline: 8px;
        }
        .tle-quick-manager .tle-quick-operations > button {
          flex: 1 1 calc(50% - 6px);
        }
        .tle-quick-manager .tle-quick-group-tag {
          max-width: 38%;
          padding-inline: 6px;
        }
        .tle-quick-manager .tle-quick-item {
          gap: 7px;
          padding-block: 8px;
        }
        .tle-quick-avatar {
          flex-basis: 29px;
          width: 29px;
          height: 29px;
          border-radius: 6px;
        }
        .tle-quick-manager .tle-quick-edit > button {
          min-width: 0;
          padding-inline: 6px;
        }
        .tle-quick-picker-surface {
          translate: 0 clamp(16px, 2.5dvh, 24px);
          width: 85dvw;
          height: 80dvh;
          max-width: 85dvw;
          max-height: 80dvh;
          min-height: 240px;
          padding: 12px;
          gap: 9px;
          border-radius: 12px;
          overflow: visible;
        }
        /* Companion management/editing needs the same usable mobile width as
           the Session Tools panel. Keep their 560px desktop width unchanged. */
        #tle-quick-picker:is([data-tle-quick-panel="companion-manager"], [data-tle-quick-panel="companion-editor"]) > .tle-quick-picker-surface {
          width: calc(100vw - 16px);
          max-width: calc(100vw - 16px);
        }
      }

      /* TLE-owned button labels never wrap. Native Tavern controls outside these roots are untouched. */
      #${ID.panel} button,
      #${ID.nav} button,
      #${ID.workspaceHeader} button,
      #${ID.mobileToggle},
      #${ID.dockToggle},
      #${ID.chatShortcut},
      #${ID.chatToolsButton},
      #${ID.chatToolsPanel} button,
      #${ID.scrollBottom},
      #${ID.diagnosticButton},
      #tle-quick-picker button,
      #tle-mobile-debugger button,
      #tle-global-search-panel button,
      .tle-sidebar-info button {
        white-space: nowrap;
      }

      /* Hide in place: TT owns parameter parents, order and source visibility. */
      [data-tle-preset-folded] { display: none !important; }

      /* Search is a centered modal; the rail always keeps its navigation and information visible. */


    `;
    state.style = style;
  }

  const NAV_LABELS_STORAGE_KEY = 'tle.desktopNavLabels';
  const NAV_MODE_STORAGE_KEY = 'tle.navigationMode';
  const GLOBAL_SEARCH_ENABLED_KEY = 'tle.globalSearch.enabled';
  function getGlobalSearchEnabled() {
    try { return HOST_WIN.localStorage.getItem(GLOBAL_SEARCH_ENABLED_KEY) !== 'false'; }
    catch { return true; }
  }
  let globalSearchEnabled = getGlobalSearchEnabled();
  function applyGlobalSearchAvailability() {
    const available = globalSearchEnabled;
    HOST_DOC.body.toggleAttribute('data-tle-search-available', available);
    if (state.organizerEntry) state.organizerEntry.hidden = !available;
    const searchButton = state.organizerEntry?.querySelector('#' + ID.searchToggle);
    if (searchButton) searchButton.hidden = !available;
    if (!available && state.globalSearchOpen) closeGlobalSearch();
    const setting = state.panel?.querySelector('[data-tle-setting="global-search"]');
    if (setting) setting.checked = globalSearchEnabled;
  }
  function setGlobalSearchEnabled(enabled) {
    globalSearchEnabled = Boolean(enabled);
    try { HOST_WIN.localStorage.setItem(GLOBAL_SEARCH_ENABLED_KEY, String(globalSearchEnabled)); } catch {}
    applyGlobalSearchAvailability();
  }
  const PC_HAMBURGER_KEY = 'tle.pcHamburgerEnabled';
  function getPcHamburgerEnabled() {
    try { return HOST_WIN.localStorage.getItem(PC_HAMBURGER_KEY) === 'true'; }
    catch { return false; }
  }
  let pcHamburgerEnabled = getPcHamburgerEnabled();

  const CHAT_SHORTCUT_DESTINATION_KEY = 'tle.chatShortcutDestination';
  function getChatShortcutDestination() {
    try {
      return HOST_WIN.localStorage.getItem(CHAT_SHORTCUT_DESTINATION_KEY) === 'welcome'
        ? 'welcome' : 'chat';
    } catch {
      return 'chat';
    }
  }
  let chatShortcutDestination = getChatShortcutDestination();
  function setChatShortcutDestination(destination) {
    chatShortcutDestination = destination === 'welcome' ? 'welcome' : 'chat';
    try {
      HOST_WIN.localStorage.setItem(CHAT_SHORTCUT_DESTINATION_KEY, chatShortcutDestination);
    } catch {}
  }

  const CHAT_TOOLS_ENABLED_KEY = 'tle.chatTools.enabled';
  const CHAT_QUICK_ACTIONS_ENABLED_KEY = 'tle.chatQuickActions.enabled';
  const CHAT_FADE_ENABLED_KEY = 'tle.chatFade.enabled';
  const SCROLL_BOTTOM_ENABLED_KEY = 'tle.scrollBottom.enabled';
  const CHAT_FADE_BOTTOM_PADDING_KEY = 'tle.chatFade.bottomPadding';
  let chatToolsEnabled = getStoredBool(CHAT_TOOLS_ENABLED_KEY, true);
  let chatQuickActionsEnabled = getStoredBool(CHAT_QUICK_ACTIONS_ENABLED_KEY, true);
  let chatFadeEnabled = getStoredBool(CHAT_FADE_ENABLED_KEY, false);
  let scrollBottomEnabled = getStoredBool(SCROLL_BOTTOM_ENABLED_KEY, true);
  let chatFadeBottomPaddingEnabled = getStoredBool(CHAT_FADE_BOTTOM_PADDING_KEY, true);

  function setChatToolsEnabled(enabled) {
    chatToolsEnabled = Boolean(enabled);
    try { HOST_WIN.localStorage.setItem(CHAT_TOOLS_ENABLED_KEY, String(chatToolsEnabled)); } catch {}
    const input = state.panel?.querySelector('[data-tle-setting="chat-tools-enabled"]');
    if (input) input.checked = chatToolsEnabled;
    if (!chatToolsEnabled) closeChatTools(false);
    queueChatShortcutRefresh();
  }

  function setChatQuickActionsEnabled(enabled) {
    chatQuickActionsEnabled = Boolean(enabled);
    try { HOST_WIN.localStorage.setItem(CHAT_QUICK_ACTIONS_ENABLED_KEY, String(chatQuickActionsEnabled)); } catch {}
    const input = state.panel?.querySelector('[data-tle-setting="chat-quick-actions-enabled"]');
    if (input) input.checked = chatQuickActionsEnabled;
    const actions = state.chatTools.panel?.querySelector('[data-chat-quick-actions]');
    if (actions) actions.hidden = !chatQuickActionsEnabled;
  }

  function setScrollBottomEnabled(enabled) {
    scrollBottomEnabled = Boolean(enabled);
    try { HOST_WIN.localStorage.setItem(SCROLL_BOTTOM_ENABLED_KEY, String(scrollBottomEnabled)); } catch {}
    const input = state.panel?.querySelector('[data-tle-setting="scroll-bottom-enabled"]');
    if (input) input.checked = scrollBottomEnabled;
    if (scrollBottomEnabled) {
      syncScrollBottomElements();
      bindScrollBottomEvents();
    } else {
      destroyScrollBottom();
    }
  }

  function setPcHamburgerEnabled(enabled) {
    pcHamburgerEnabled = Boolean(enabled);
    try { HOST_WIN.localStorage.setItem(PC_HAMBURGER_KEY, String(pcHamburgerEnabled)); } catch {}
    if (!isMobileViewport()) setMobileNavOpen(false);
    updateDockToggle();
  }

  function getNavigationMode() {
    try {
      const saved = HOST_WIN.localStorage.getItem(NAV_MODE_STORAGE_KEY);
      if (saved === 'icons' || saved === 'labels' || saved === 'info') return saved;
    } catch {}
    // Migrate the former PC label checkbox without turning the information station on.
    return getDesktopNavLabelsEnabled() ? 'labels' : 'icons';
  }
  let navigationMode = getNavigationMode();
  /* Image-backed icon opacity applies only when the user enables native
     navigation compatibility repair. Normal themes keep their own CSS opacity. */
  const NAV_ICON_OPACITY_MIN = 0.4;
  const NAV_ICON_OPACITY_MAX = 1;
  function normalizeNavIconOpacity(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0.7;
    return Math.round(Math.min(NAV_ICON_OPACITY_MAX, Math.max(NAV_ICON_OPACITY_MIN, number)) * 20) / 20;
  }
  function readNavIconOpacity() {
    try { return normalizeNavIconOpacity(HOST_WIN.localStorage.getItem(NAV_ICON_OPACITY_KEY) ?? 0.7); }
    catch { return 0.7; }
  }
  let navIconOpacity = readNavIconOpacity();
  function applyNavIconOpacity(save = false) {
    const body = HOST_DOC.body;
    if (compatibilityNavigationRepair) {
      body.style.setProperty('--tle-nav-icon-opacity', String(navIconOpacity));
    } else {
      body.style.removeProperty('--tle-nav-icon-opacity');
    }
    const wrap = state.panel?.querySelector('[data-tle-compat-nav-opacity]');
    if (wrap) wrap.hidden = !compatibilityNavigationRepair;
    const input = state.panel?.querySelector('#tle-nav-icon-opacity');
    if (input) {
      if (Number(input.value) !== navIconOpacity) input.value = String(navIconOpacity);
      input.disabled = !compatibilityNavigationRepair;
    }
    const output = state.panel?.querySelector('[data-tle-nav-icon-opacity-value]');
    if (output) output.textContent = `${Math.round(navIconOpacity * 100)}%`;
    if (save) {
      try { HOST_WIN.localStorage.setItem(NAV_ICON_OPACITY_KEY, String(navIconOpacity)); } catch {}
    }
  }
  function setNavIconOpacity(value, save = false) {
    navIconOpacity = normalizeNavIconOpacity(value);
    applyNavIconOpacity(save);
  }
  applyNavIconOpacity();

  HOST_DOC.body.toggleAttribute('data-tle-search-available', globalSearchEnabled && navigationMode !== 'icons');

  function setNavigationMode(mode) {
    navigationMode = ['icons', 'labels', 'info'].includes(mode) ? mode : 'icons';
    if (HOST_DOC.body.dataset.tleNav) HOST_DOC.body.dataset.tleNav = navigationMode;
    try { HOST_WIN.localStorage.setItem(NAV_MODE_STORAGE_KEY, navigationMode); } catch {}
    applyInfoNavWidth();
    updateInfoStation();
    applyGlobalSearchAvailability();
    applyEngineHubMode();
  }

  function getDesktopNavLabelsEnabled() {
    try {
      return HOST_WIN.localStorage.getItem(NAV_LABELS_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  }

  const INFO_STORAGE_KEY = 'tle.sidebarInfo.v1';
  const INFO_ENABLED_KEY = 'tle.sidebarInfo.enabled';
  function getInfoEnabled() {
    try { return HOST_WIN.localStorage.getItem(INFO_ENABLED_KEY) === 'true'; }
    catch { return false; }
  }
  let infoEnabled = getInfoEnabled();
  const INFO_MODULES = [
    { id: 'preset', title: '当前预设', jump: true },
    { id: 'api', title: 'API 连接与模型', jump: true },
    { id: 'reasoning', title: '当前推理格式', jump: true },
    { id: 'worldInfo', title: '全局世界书', jump: true },
    { id: 'theme', title: '当前 UI 主题', jump: true },
    { id: 'character', title: '当前角色', jump: true },
    { id: 'characterWorldBook', title: '当前角色世界书', jump: true },
    { id: 'persona', title: '当前User身份', jump: true },
  ];
  const INFO_STATION_MODULES = INFO_MODULES.filter(item => item.id !== 'persona');

  // Chat tools are independent of the information station. All mutations still
  // go through SillyTavern's native STscript executor.
  const CHAT_ACTIONS = [
    {
      id: 'jump',
      title: '楼层跳转',
      placeholder: '输入楼层数字（mesid）',
      inputMode: 'numeric',
      maxLength: 10,
      buttons: [{ id: 'jump', label: '跳转' }],
    },
    {
      id: 'range',
      title: '楼层范围',
      placeholder: '起点',
      inputMode: 'numeric',
      maxLength: 10,
      buttons: [{ id: 'hide', label: '隐藏' }, { id: 'unhide', label: '恢复' }],
    },
  ];

  function readInfoSettings() {
    const defaults = Object.fromEntries(INFO_MODULES.map(item => [
      item.id, { visible: false, jump: item.jump, quick: false }
    ]));
    try {
      const saved = JSON.parse(HOST_WIN.localStorage.getItem(INFO_STORAGE_KEY) || '{}');
      for (const item of INFO_MODULES) {
        if (saved[item.id]) {
          defaults[item.id] = {
            visible: saved[item.id].visible !== false,
            jump: item.jump ? saved[item.id].jump !== false : false,
            quick: item.id !== 'characterWorldBook' && saved[item.id].quick === true,
          };
        }
      }
    } catch (error) {
      console.warn('[Tavern Layout Engine] 信息站配置读取失败，使用默认设置。', error);
    }
    return defaults;
  }

  let infoSettings = readInfoSettings();
  const NAV_WIDTH_KEY = 'tle.sidebarInfo.navWidth';
  function readInfoNavWidth() {
    try {
      const value = Number(HOST_WIN.localStorage.getItem(NAV_WIDTH_KEY));
      return Number.isFinite(value) && value >= 160 && value <= 420 ? value : 220;
    } catch { return 220; }
  }
  let infoNavWidth = readInfoNavWidth();
  function applyInfoNavWidth() {
    HOST_DOC.body.style.setProperty('--tle-requested-width', navigationMode === 'icons' ? '68px' : `${infoNavWidth}px`);
    const input = state.panel?.querySelector('#tle-info-nav-width');
    if (input) input.disabled = navigationMode === 'icons';
  }
  function saveInfoNavWidth() {
    try { HOST_WIN.localStorage.setItem(NAV_WIDTH_KEY, String(infoNavWidth)); } catch {}
  }

  function saveInfoEnabled() {
    try { HOST_WIN.localStorage.setItem(INFO_ENABLED_KEY, String(infoEnabled)); }
    catch (error) { console.warn('[Tavern Layout Engine] 信息站总开关保存失败。', error); }
  }

  function saveInfoSettings() {
    try {
      HOST_WIN.localStorage.setItem(INFO_STORAGE_KEY, JSON.stringify(infoSettings));
    } catch (error) {
      console.warn('[Tavern Layout Engine] 信息站配置保存失败。', error);
    }
  }

  function selectedText(selector) {
    const elements = [...HOST_DOC.querySelectorAll(selector)];
    if (!elements.length) return '';

    // Some mobile clients keep hidden/legacy copies of controls in the DOM.
    // Prefer the visible, currently selected control instead of the first ID match.
    const ranked = elements.map((el, index) => {
      const selected = el.tagName === 'SELECT'
        ? (el.selectedOptions?.[0]?.textContent?.trim() || el.value?.trim() || '')
        : (el.value || el.textContent || '').trim();
      const rect = el.getBoundingClientRect();
      const visible = Boolean(el.getClientRects().length && rect.width > 0 && rect.height > 0
        && HOST_WIN.getComputedStyle(el).display !== 'none'
        && HOST_WIN.getComputedStyle(el).visibility !== 'hidden');
      return { selected, visible, index };
    });

    return ranked
      .filter(item => item.selected)
      .sort((a, b) => Number(b.visible) - Number(a.visible) || a.index - b.index)[0]
      ?.selected || '';
  }

  let powerUserRequested = false;
  let powerUserModule = null;
  function getCurrentThemeInfo() {
    // The working cross-client Theme Manager reads the active theme from
    // power_user.js -> power_user.theme. #themes is the theme catalog, not
    // the authoritative active-theme state on every TT build.
    try {
      const active = HOST_WIN.power_user?.theme
        || HOST_WIN.powerUserSettings?.theme
        || HOST_WIN.SillyTavern?.getContext?.()?.powerUserSettings?.theme
        || powerUserModule?.power_user?.theme;
      if (typeof active === 'string' && active.trim()) return active.trim();
    } catch {}

    // Read a live module reference after a single import, including in TT.
    if (!powerUserRequested) {
      powerUserRequested = true;
      try {
        const importHost = HOST_WIN.Function('url', 'return import(url)');
        const url = new URL('/scripts/power-user.js', HOST_WIN.location.href).href;
        importHost(url).then(module => {
          powerUserModule = module;
          queueInfoRefresh();
          quickPanel?.refreshThemeCatalog?.();
        }).catch(() => {});
      } catch {}
    }

    const select = HOST_DOC.getElementById('themes');
    if (!select || select.tagName !== 'SELECT') return '';
    const selected = select.selectedOptions?.[0]
      || (select.selectedIndex >= 0 ? select.options?.[select.selectedIndex] : null);
    return select.value?.trim()
      || selected?.value?.trim()
      || selected?.textContent?.trim()
      || '';
  }

  function getCurrentCharacterInfo() {
    try {
      const context = HOST_WIN.SillyTavern?.getContext?.();
      if (!context || context.groupId != null) return '';
      const id = context.characterId;
      if (id === undefined || id === null || id === '') return '';
      return context.characters?.[id]?.name || context.name2 || '';
    } catch {
      return '';
    }
  }

  function getCurrentCharacterWorldBookInfo() {
    try {
      const context = HOST_WIN.SillyTavern?.getContext?.();
      if (!context || context.groupId != null) return '';
      const id = context.characterId;
      if (id === undefined || id === null || id === '') return '';
      const character = context.characters?.[id];
      if (!character) return '';
      const worldName = character.data?.extensions?.world;
      return typeof worldName === 'string' && worldName.trim()
        ? worldName.trim()
        : '未绑定角色世界书';
    } catch {
      return '';
    }
  }

  function getCurrentPersonaInfo() {
    const name = HOST_DOC.querySelector('#PersonaManagement #your_name')?.textContent?.trim();
    // The visible Persona management panel can retain an edited name that is not active.
    // Prefer the host's current context field when it exists; otherwise display the known current-name node.
    try {
      const context = HOST_WIN.SillyTavern?.getContext?.();
      const contextName = context?.name1;
      if (typeof contextName === 'string' && contextName.trim()) return contextName.trim();
    } catch {}
    return name || '';
  }

  function getApiInfo() {
    const profile = selectedText('#rm_api_block #connection_profiles, #connection_profiles');
    const source = selectedText('#rm_api_block #chat_completion_source, #chat_completion_source');
    const apiPanel = HOST_DOC.querySelector('#rm_api_block');
    let model = '';
    if (apiPanel) {
      const candidates = [...apiPanel.querySelectorAll('select')].filter(el => {
        if (el.id === 'connection_profiles' || el.id === 'chat_completion_source') return false;
        if (el.disabled || el.closest('[style*="display: none"]')) return false;
        const id = (el.id || '').toLowerCase();
        const label = el.labels?.[0]?.textContent || el.getAttribute('aria-label') || '';
        return /model/i.test(id) || /model|模型/i.test(label);
      });
      const active = candidates.find(el => el.getClientRects().length > 0) || candidates[0];
      model = active?.selectedOptions?.[0]?.textContent?.trim() || '';
    }
    return {
      profile: profile || '未读取到连接配置',
      model: model || source || '未读取到模型',
    };
  }

  function getWorldInfo() {
    const select = HOST_DOC.querySelector('#WorldInfo #world_info, #world_info');
    if (!select) return '';
    const names = [...(select.selectedOptions || [])]
      .map(option => option.textContent.trim())
      .filter(Boolean);
    if (names.length) return names.join('、');
    return '未选择全局世界书';
  }

  // TT 2.4 parks AdvancedFormatting's controls outside the live DOM while
  // its drawer is closed. Persist the last actual selection so it survives both
  // DOM unmounts and TLE reloads. Never invent a default format.
  const REASONING_CACHE_KEY = 'tle.sidebarInfo.reasoningFormat.v1';
  function readReasoningFormatCache() {
    try {
      const value = HOST_WIN.localStorage.getItem(REASONING_CACHE_KEY);
      return typeof value === 'string' ? value.trim() : '';
    } catch { return ''; }
  }
  let lastKnownReasoningFormat = readReasoningFormatCache();
  function rememberReasoningFormat(value) {
    const normalized = String(value || '').trim();
    if (!normalized) return lastKnownReasoningFormat;
    lastKnownReasoningFormat = normalized;
    try { HOST_WIN.localStorage.setItem(REASONING_CACHE_KEY, normalized); } catch {}
    return lastKnownReasoningFormat;
  }
  function getActiveReasoningName() {
    try {
      const power = HOST_WIN.SillyTavern?.getContext?.()?.powerUserSettings
        || powerUserModule?.power_user || HOST_WIN.power_user || HOST_WIN.powerUserSettings;
      return typeof power?.reasoning?.name === 'string' ? power.reasoning.name : '';
    } catch { return ''; }
  }
  function getReasoningFormat() {
    const current = selectedText('#reasoning_select');
    if (current) return rememberReasoningFormat(current);
    // TT keeps the active preset name in settings even while its DOM is parked.
    // Preserve the existing persisted label as the fallback for older clients.
    const active = getActiveReasoningName();
    if (active) return rememberReasoningFormat(active);
    return lastKnownReasoningFormat;
  }

  // TT may lazy-mount #reasoning_select only after its nested disclosure is
  // expanded. When Advanced Formatting first opens, expand that disclosure
  // programmatically, capture the real value, then restore its prior state.
  // This avoids requiring the user to manually open the Reasoning Formatting
  // section while keeping the original UI disclosure state unchanged.
  let reasoningDisclosureInitPending = false;
  let reasoningDisclosureInitDone = false;
  function initializeReasoningDisclosure() {
    if (state.destroyed || reasoningDisclosureInitPending || reasoningDisclosureInitDone) return;
    const panel = HOST_DOC.querySelector('#AdvancedFormatting.openDrawer, #advanced_formatting.openDrawer');
    if (!panel) return;

    const mountedSelect = panel.querySelector('#reasoning_select') || HOST_DOC.querySelector('#reasoning_select');
    if (mountedSelect?.value) {
      rememberReasoningFormat(mountedSelect.selectedOptions?.[0]?.textContent?.trim() || mountedSelect.value);
      reasoningDisclosureInitDone = true;
      queueInfoRefresh();
      return;
    }

    const details = [...panel.querySelectorAll('details')];
    const target = details.find(item => {
      const summary = item.querySelector(':scope > summary');
      const label = (summary?.textContent || '').trim();
      return /reasoning\s*format|推理.{0,8}格式/i.test(label);
    });
    if (!target) return; // Content may be parked/lazy-mounted; retry on the next panel mutation.

    reasoningDisclosureInitPending = true;
    const wasOpen = target.open;
    if (!wasOpen) target.open = true;

    const finish = () => {
      if (state.destroyed) return;
      const select = panel.querySelector('#reasoning_select') || HOST_DOC.querySelector('#reasoning_select');
      if (select?.value) {
        rememberReasoningFormat(select.selectedOptions?.[0]?.textContent?.trim() || select.value);
        reasoningDisclosureInitDone = true;
      }
      // Restore the user's original collapsed/expanded state after capturing.
      if (!wasOpen && target.isConnected) target.open = false;
      reasoningDisclosureInitPending = false;
      queueInfoRefresh();
    };
    HOST_WIN.requestAnimationFrame(() => HOST_WIN.requestAnimationFrame(finish));
  }
  // Capture change before TT parks/unmounts the settings panel. The delegated
  // listener also works when the select is recreated on every drawer opening.
  HOST_DOC.addEventListener('change', event => {
    if (event.target?.id === 'themes') queueFloorZeroClearanceSync();
    if (event.target?.id === 'reasoning_select') {
      rememberReasoningFormat(event.target.selectedOptions?.[0]?.textContent?.trim() || event.target.value);
      updateInfoStation();
    }
  }, { capture: true, signal: state.abort.signal });

  function getInfoValues() {
    const theme = infoSettings.theme.visible ? getCurrentThemeInfo() || '主题列表加载中…' : '';
    const preset = selectedText('#settings_preset_openai') || '未读取到预设';
    return {
      preset,
      api: getApiInfo(),
      reasoning: infoSettings.reasoning.visible ? getReasoningFormat() : '',
      worldInfo: getWorldInfo(),
      theme,
      character: getCurrentCharacterInfo(),
      characterWorldBook: getCurrentCharacterWorldBookInfo(),
    };
  }

  function getActiveChatActionContext() {
    try {
      const context = HOST_WIN.SillyTavern?.getContext?.();
      if (!context) return null;
      const groupActive = context.groupId !== undefined && context.groupId !== null && context.groupId !== '';
      const characterId = Number(context.characterId);
      const characterActive = context.characterId !== undefined && context.characterId !== null
        && context.characterId !== '' && Number.isInteger(characterId) && characterId >= 0
        && (Boolean(context.characters?.[characterId]) || Boolean(context.name2));
      const chat = Array.isArray(context.chat) ? context.chat : null;
      if ((!groupActive && !characterActive) || !chat) return null;
      const currentChatId = typeof context.getCurrentChatId === 'function'
        ? context.getCurrentChatId()
        : context.chatId;
      const ownerKey = groupActive ? `group:${context.groupId}` : `character:${context.characterId}`;
      return {
        context, chat, lastMessageId: chat.length - 1,
        chatKey: `${ownerKey}:${currentChatId ?? ''}`,
      };
    } catch {
      return null;
    }
  }

  function syncChatActionClearButton(input, button) {
    if (button) button.hidden = !String(input?.value || '').length;
  }

  function makeChatActionInput(action, part = '') {
    const inputId = part ? `${action.id}-${part}` : action.id;
    const wrap = HOST_DOC.createElement('div');
    wrap.className = 'tle-chat-tools-input-wrap';

    const input = HOST_DOC.createElement('input');
    input.id = `tle-chat-tools-${inputId}`;
    input.className = 'text_pole';
    input.type = 'text';
    input.inputMode = action.inputMode;
    input.maxLength = action.maxLength;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = part === 'end' ? '终点数字' : part === 'start' ? '起点数字' : action.placeholder;
    input.setAttribute('aria-label', part === 'start' ? '范围起点 mesid' :
      part === 'end' ? '范围终点 mesid' : action.title);
    input.dataset.chatActionInput = inputId;

    const clearButton = HOST_DOC.createElement('button');
    clearButton.type = 'button';
    clearButton.className = 'menu_button menu_button_icon tle-chat-tools-clear';
    clearButton.dataset.chatActionClear = inputId;
    clearButton.hidden = true;
    clearButton.title = '清除输入';
    clearButton.setAttribute('aria-label', '清除' + (part === 'start' ? '范围起点' :
      part === 'end' ? '范围终点' : action.title));
    clearButton.innerHTML = '<i class="fa-solid fa-xmark" aria-hidden="true"></i>';

    input.addEventListener('input', () => syncChatActionClearButton(input, clearButton));
    wrap.append(input, clearButton);
    return { wrap, input, clearButton };
  }

  function createChatActionRow(action) {
    const row = HOST_DOC.createElement('section');
    row.className = 'tle-chat-tools-action';
    row.dataset.chatActionRow = action.id;

    const label = HOST_DOC.createElement('label');
    label.htmlFor = action.id === 'range' ? 'tle-chat-tools-range-start' : `tle-chat-tools-${action.id}`;
    label.textContent = action.title;

    const control = HOST_DOC.createElement('div');
    control.className = 'tle-chat-tools-control';

    let primaryInput;
    let inputContent;
    if (action.id === 'range') {
      const start = makeChatActionInput(action, 'start');
      const end = makeChatActionInput(action, 'end');
      const inputs = HOST_DOC.createElement('div');
      inputs.className = 'tle-chat-tools-range-inputs';
      const separator = HOST_DOC.createElement('span');
      separator.className = 'tle-chat-tools-range-separator';
      separator.textContent = '-';
      separator.setAttribute('aria-hidden', 'true');
      inputs.append(start.wrap, separator, end.wrap);
      primaryInput = start.input;
      inputContent = inputs;
    } else {
      const single = makeChatActionInput(action);
      primaryInput = single.input;
      inputContent = single.wrap;
    }

    const submitGroup = HOST_DOC.createElement('div');
    submitGroup.className = 'tle-chat-tools-submit-group';
    const submitButtons = [];
    for (const item of action.buttons) {
      const submit = HOST_DOC.createElement('button');
      submit.type = 'button';
      submit.className = 'menu_button';
      submit.dataset.chatActionSubmit = item.id;
      submit.textContent = item.label;
      submit.setAttribute('aria-label', item.label + action.title);
      submitGroup.appendChild(submit);
      submitButtons.push(submit);
    }
    if (action.id === 'jump') {
      primaryInput.addEventListener('keydown', event => {
        if (event.key !== 'Enter' || event.isComposing) return;
        event.preventDefault();
        void runChatAction('jump', primaryInput, submitButtons[0]);
      });
    }
    control.append(inputContent, submitGroup);
    row.append(label, control);
    if (action.id === 'range') {
      const hint = HOST_DOC.createElement('small');
      hint.id = 'tle-chat-tools-range-hint';
      hint.className = 'tle-chat-tools-range-help';
      hint.textContent = '两框均输入数字；只隐藏或恢复 1 层时，两框填同一个数字（例如 90 - 90）。';
      row.appendChild(hint);
      row.querySelectorAll('[data-chat-action-input]').forEach(item => {
        item.setAttribute('aria-describedby', hint.id);
      });
    }
    return row;
  }

  async function executeTLESlashCommand(command, context) {
    let executor = context?.executeSlashCommandsWithOptions;
    if (typeof executor !== 'function') {
      const slashModule = await quickImport('/scripts/slash-commands.js');
      executor = slashModule.executeSlashCommandsWithOptions || slashModule.executeSlashCommands;
    }
    if (typeof executor !== 'function') {
      throw new Error('当前酒馆没有提供可用的斜杠命令执行接口。');
    }
    return await executor.call(context, command);
  }

  async function runChatAction(actionId, input, button) {
    const inputId = actionId === 'jump' ? 'jump' : 'range';
    const action = CHAT_ACTIONS.find(item => item.id === inputId);
    const expectedInput = inputId === 'range' ? 'range-start' : 'jump';
    if (!action || !['jump', 'hide', 'unhide'].includes(actionId)
      || input?.dataset.chatActionInput !== expectedInput || !button || button.disabled) return;

    const snapshot = getActiveChatActionContext();
    if (!snapshot) {
      chatActionNotify('error', '请先进入一个角色或群聊。');
      return;
    }
    if (snapshot.lastMessageId < 0) {
      chatActionNotify('error', '当前聊天还没有消息。');
      return;
    }

    let command = '';
    let successMessage = '';
    const row = input.closest('[data-chat-action-row]');
    if (actionId === 'jump') {
      const raw = input.value.trim();
      if (!/^\d+$/.test(raw)) {
        chatActionNotify('error', '请输入有效的 mesid（非负整数）。');
        input.focus();
        return;
      }
      const messageId = Number(raw);
      if (!Number.isSafeInteger(messageId) || messageId > snapshot.lastMessageId) {
        chatActionNotify('error', `楼层范围为 0–${snapshot.lastMessageId}。`);
        input.focus();
        return;
      }
      command = `/chat-jump ${messageId}`;
      successMessage = `已跳转到第 ${messageId} 楼。`;
    } else {
      const endInput = row?.querySelector('[data-chat-action-input="range-end"]');
      const startRaw = input.value.trim();
      const endRaw = endInput?.value.trim() || '';
      if (!/^\d+$/.test(startRaw)) {
        chatActionNotify('error', '请输入有效的起始楼层（非负整数）。');
        input.focus();
        return;
      }
      if (!/^\d+$/.test(endRaw)) {
        chatActionNotify('error', '请输入有效的结束楼层（非负整数）。');
        endInput?.focus();
        return;
      }
      const start = Number(startRaw);
      const end = Number(endRaw);
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
        chatActionNotify('error', '楼层编号超出有效范围。');
        input.focus();
        return;
      }
      if (start > end) {
        chatActionNotify('error', '起始楼层不能大于结束楼层。');
        input.focus();
        return;
      }
      if (end > snapshot.lastMessageId) {
        chatActionNotify('error', `当前聊天最后一楼为 ${snapshot.lastMessageId}。`);
        endInput?.focus();
        return;
      }
      // Slash commands always receive x-y, including a single floor as 90-90.
      command = `/${actionId} ${start}-${end}`;
      successMessage = actionId === 'hide'
        ? `已隐藏 ${start}–${end} 楼。`
        : `已恢复 ${start}–${end} 楼。`;
    }

    const inputs = [...(row?.querySelectorAll('[data-chat-action-input]') || [])];
    const clearButtons = [...(row?.querySelectorAll('[data-chat-action-clear]') || [])];
    const submitButtons = [...(row?.querySelectorAll('[data-chat-action-submit]') || [])];
    inputs.forEach(item => { item.disabled = true; });
    clearButtons.forEach(item => { item.disabled = true; });
    submitButtons.forEach(item => { item.disabled = true; });
    button.dataset.busy = 'true';
    state.chatTools.suppressObserver = true;
    try {
      const result = await executeTLESlashCommand(command, snapshot.context);
      if (result?.isError) throw new Error(result.errorMessage || '酒馆执行命令失败。');
      if (result?.isAborted || result?.isQuietlyAborted) throw new Error(result.abortReason || '命令已中止。');
      chatActionNotify('success', successMessage);
    } catch (error) {
      chatActionNotify('error', error?.message || '命令执行失败。');
    } finally {
      state.chatTools.suppressObserver = false;
      inputs.forEach(item => { item.disabled = false; });
      clearButtons.forEach(item => { item.disabled = false; });
      submitButtons.forEach(item => { item.disabled = false; });
      delete button.dataset.busy;
      queueChatToolsRangeRefresh();
    }
  }

  function updateInfoStation() {
    updateWorkspaceHeader();
    const station = HOST_DOC.querySelector('#top-settings-holder > .tle-sidebar-info');
    const list = station?.querySelector('[data-tle-info-list]');
    if (!list) return;

    // Legacy chat controls belonged to the information station in older builds.
    // Remove them even when the station is disabled or its rows are not rendered.
    station.querySelectorAll('.tle-chat-actions, [data-tle-chat-actions], [data-chat-action-row]').forEach(node => node.remove());

    const enabled = infoEnabled && navigationMode === 'info'
      && INFO_STATION_MODULES.some(item => infoSettings[item.id].visible);
    if (!enabled) { station.hidden = true; return; }
    const values = getInfoValues();

    list.querySelector('[data-info-item="persona"]')?.remove();
    for (const item of INFO_STATION_MODULES) {
      const setting = infoSettings[item.id];
      let row = list.querySelector(`[data-info-item="${item.id}"]`);

      // A role/persona is contextual. Do not leave an empty placeholder on the welcome screen.
      const value = values[item.id];
      const shouldShow = setting.visible && Boolean(value);

      if (!shouldShow) {
        row?.remove();
        continue;
      }

      if (!row) {
        row = HOST_DOC.createElement('div');
        row.className = 'tle-info-item';
        row.dataset.infoItem = item.id;
        row.innerHTML = '<button type="button" class="tle-info-copy"><span class="tle-info-title"></span><span class="tle-info-value"></span></button><button type="button" class="tle-info-arrow fa-solid fa-chevron-right" data-info-jump aria-label="跳转"></button>';
        list.appendChild(row);
      }
      row.dataset.jump = String(setting.jump);
      row.dataset.quick = String(setting.quick);
      const main = row.querySelector('.tle-info-copy');
      main.disabled = !setting.quick && !setting.jump;
      main.setAttribute('aria-haspopup', setting.quick ? 'dialog' : 'false');
      main.setAttribute('aria-expanded', String(quickPanel?.module === item.id));
      const jumpButton = row.querySelector('[data-info-jump]');
      jumpButton.hidden = !setting.jump;
      jumpButton.title = '跳转到' + item.title.replace('当前', '');
      const titleNode = row.querySelector('.tle-info-title');
      const displayTitle = item.id === 'api' ? '当前模型' : item.title;
      if (titleNode.textContent !== displayTitle) titleNode.textContent = displayTitle;
      const valueNode = row.querySelector('.tle-info-value');
      if (item.id === 'api' && value && typeof value === 'object') {
        const modelName = String(value.model || '');
        if (valueNode.textContent !== modelName) valueNode.textContent = modelName;
        row.title = modelName;
      } else {
        if (valueNode.textContent !== value) valueNode.textContent = value;
        row.title = String(value);
      }
    }

    const orderedRows = INFO_STATION_MODULES
      .map(item => list.querySelector(`[data-info-item="${item.id}"]`))
      .filter(Boolean);
    const currentRows = [...list.querySelectorAll(':scope > [data-info-item]')];
    if (orderedRows.some((row, index) => row !== currentRows[index])) {
      for (const row of orderedRows) list.appendChild(row);
    }
    station.hidden = orderedRows.length === 0;
  }

  function openCharacterWorldBook() {
    const context = HOST_WIN.SillyTavern?.getContext?.();
    if (!context || context.groupId != null) return;

    const id = context.characterId;
    const character = id !== undefined && id !== null
      ? context.characters?.[id] : null;
    const worldName = character?.data?.extensions?.world?.trim?.();

    // If the current character has no bound world, open character management
    // and let SillyTavern handle binding through its native #world_button.
    if (!worldName) {
      openNativePanelForInfo('character');
      return;
    }

    const openBoundWorldEditor = () => {
      const select = HOST_DOC.querySelector('#WorldInfo #world_editor_select, #world_editor_select');
      if (!select) {
        console.warn('[Tavern Layout Engine] 找不到原生世界书编辑器选择器 #world_editor_select。');
        return;
      }

      const option = [...select.options].find(
        item => item.textContent.trim() === worldName
      );
      if (!option) {
        console.warn(`[Tavern Layout Engine] 当前角色绑定的世界书未出现在编辑器列表中：${worldName}`);
        return;
      }

      const jquery = HOST_WIN.jQuery || HOST_WIN.$;
      if (typeof jquery !== 'function') {
        console.warn('[Tavern Layout Engine] 无法触发酒馆原生世界书编辑事件：jQuery 不可用。');
        return;
      }

      // #world_editor_select's native change handler calls showWorldEditor()
      // for the selected world. #world_info is only the global enable-list
      // and must not be used to open the editor.
      jquery(select).val(option.value).trigger('change');
    };

    openNativePanelForInfo('worldInfo');

    // Wait until the native drawer has opened and its editor controls are ready.
    HOST_WIN.requestAnimationFrame(() => {
      HOST_WIN.requestAnimationFrame(openBoundWorldEditor);
    });
  }

  function openNativePanelForInfo(id) {
    if (id === 'characterWorldBook') {
      openCharacterWorldBook();
      return;
    }

    const targets = {
      preset: '#left-nav-panel.drawer-content',
      api: '#rm_api_block',
      reasoning: '#AdvancedFormatting, #advanced_formatting',
      worldInfo: '#WorldInfo',
      theme: '#user-settings-block',
      character: '#right-nav-panel',
      persona: '#PersonaManagement',
    };
    const selector = targets[id];
    const target = selector && HOST_DOC.querySelector(selector);
    const drawer = target?.closest('.drawer');
    const toggle = drawer?.querySelector(':scope > .drawer-toggle');
    const panel = drawer?.querySelector(':scope > .drawer-content');
    if (!toggle) return;
    if (!panel?.classList.contains('openDrawer')) toggle.click();
    else if (isMobileViewport()) setMobileNavOpen(false);
    if (id === 'reasoning') {
      HOST_WIN.requestAnimationFrame(() => revealReasoningSelect(panel));
    }
  }

  function revealReasoningSelect(panel) {
    const select = panel?.querySelector('#reasoning_select');
    if (!select || state.destroyed || !panel.classList.contains('openDrawer')) return;

    // Use native disclosure controls, without changing the selected preset.
    const disclosures = [];
    for (let el = select.parentElement; el && el !== panel; el = el.parentElement) {
      if (el.tagName === 'DETAILS') disclosures.unshift(el);
      if (el.classList.contains('inline-drawer-content')) disclosures.unshift(el);
    }
    for (const el of disclosures) {
      if (el.tagName === 'DETAILS') el.open = true;
      else if (HOST_WIN.getComputedStyle(el).display === 'none') {
        el.parentElement?.querySelector(':scope > .inline-drawer-toggle')?.click();
      }
    }

    HOST_WIN.requestAnimationFrame(() => {
      if (!state.destroyed && panel.classList.contains('openDrawer')) {
        select.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      }
    });
  }

  function renderInfoSettings() {
    const host = state.panel?.querySelector('[data-tle-info-settings]');
    if (!host) return;
    host.innerHTML = INFO_STATION_MODULES.map(item => {
      const setting = infoSettings[item.id];
      return `
        <div class="tle-info-setting" data-info-setting="${item.id}">
          <span>${item.title}</span>
          <label><small>显示</small> <input type="checkbox" data-info-option="visible" ${setting.visible ? 'checked' : ''}></label>
          ${item.id !== 'characterWorldBook' ? `<label><small>快切</small> <input type="checkbox" data-info-option="quick" ${setting.quick ? 'checked' : ''} ${setting.visible ? '' : 'disabled'}></label>` : '<small>仅跳转</small>'}
          ${item.jump
            ? `<label><small>跳转</small> <input type="checkbox" data-info-option="jump" ${setting.jump ? 'checked' : ''} ${setting.visible ? '' : 'disabled'}></label>`
            : '<span></span>'}
        </div>
      `;
    }).join('');
  }


  // Shared TLE picker. Information-station selectors use the same centered
  // modal shell and search-field treatment as the global search dialog.
  const QUICK_MODULES = INFO_MODULES.filter(item => item.id !== 'characterWorldBook').map(item => item.id === 'worldInfo' ? { ...item, title: '世界书' } : item);
  const QUICK_GROUP_KEY = 'tle.quickGroups.v2';
  const QUICK_GROUP_LEGACY_KEY = 'tle.quickGroups.v1';
  let quickPanel = null;
  let quickSequence = 0;
  const quickImports = new Map();
  function quickImport(path) {
    if (!quickImports.has(path)) {
      const task = HOST_WIN.Function('url', 'return import(url)')(new URL(path, HOST_WIN.location.href).href)
        .catch(error => { quickImports.delete(path); throw error; });
      quickImports.set(path, task);
    }
    return quickImports.get(path);
  }
  function quickNode(tag, className = '', text = '') {
    const node = HOST_DOC.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }
  function quickButton(text, action, className = 'menu_button') {
    const button = quickNode('button', className, text);
    button.type = 'button';
    button.addEventListener('click', action);
    return button;
  }
  function cleanQuickGroupList(value) {
    return Array.isArray(value)
      ? value.filter(group => group && typeof group.id === 'string' && typeof group.name === 'string')
        .map(group => ({
          id: group.id,
          name: group.name,
          keyword: typeof group.keyword === 'string' ? group.keyword : '',
          icon: typeof group.icon === 'string' ? group.icon.trim() : '',
          collapsed: group.collapsed === true
        }))
      : [];
  }
  function quickGroupLabel(group) {
    const icon = typeof group?.icon === 'string' ? group.icon.trim() : '';
    return `${icon ? `${icon} ` : ''}${group?.name || ''}`;
  }
  function readQuickGroups() {
    try {
      const current = JSON.parse(HOST_WIN.localStorage.getItem(QUICK_GROUP_KEY) || 'null');
      if (current?.schema === 2 && current.groupsByModule && typeof current.groupsByModule === 'object') {
        const groupsByModule = Object.create(null);
        for (const item of QUICK_MODULES) groupsByModule[item.id] = cleanQuickGroupList(current.groupsByModule[item.id]);
        const assignments = Object.create(null);
        for (const item of QUICK_MODULES) {
          const map = current.assignments?.[item.id];
          assignments[item.id] = map && typeof map === 'object' ? { ...map } : Object.create(null);
        }
        return { schema: 2, groupsByModule, assignments };
      }

      // One-time migration: v1 stored one shared group list and per-category
      // assignments. Rebuild independent group lists for each category while
      // preserving every existing assignment. Empty legacy groups are kept
      // under Presets, the manager's original default category.
      const legacy = JSON.parse(HOST_WIN.localStorage.getItem(QUICK_GROUP_LEGACY_KEY) || '{}');
      const legacyGroups = cleanQuickGroupList(legacy.groups);
      const legacyAssignments = legacy.assignments && typeof legacy.assignments === 'object' ? legacy.assignments : {};
      const groupsByModule = Object.create(null);
      const assignments = Object.create(null);
      const usedGroupIds = new Set();

      for (const item of QUICK_MODULES) {
        const map = legacyAssignments[item.id] && typeof legacyAssignments[item.id] === 'object'
          ? { ...legacyAssignments[item.id] } : Object.create(null);
        const assignedIds = new Set(Object.values(map).filter(value => typeof value === 'string' && value));
        groupsByModule[item.id] = legacyGroups.filter(group => assignedIds.has(group.id)).map(group => ({ ...group }));
        for (const group of groupsByModule[item.id]) usedGroupIds.add(group.id);
        assignments[item.id] = map;
      }

      const orphaned = legacyGroups.filter(group => !usedGroupIds.has(group.id));
      if (orphaned.length) {
        groupsByModule.preset ||= [];
        const existing = new Set(groupsByModule.preset.map(group => group.id));
        for (const group of orphaned) if (!existing.has(group.id)) groupsByModule.preset.push({ ...group });
      }

      const migrated = { schema: 2, groupsByModule, assignments };
      try {
        HOST_WIN.localStorage.setItem(QUICK_GROUP_KEY, JSON.stringify(migrated));
      } catch (saveError) {
        // Keep the migrated data usable for this session even if storage is unavailable.
        console.warn('[Tavern Layout Engine] 分组数据迁移暂时无法写入本地存储。', saveError);
      }
      return migrated;
    } catch (error) {
      console.warn('[Tavern Layout Engine] 快速切换分组数据读取失败，使用空分组配置。', error);
      return { schema: 2, groupsByModule: Object.create(null), assignments: Object.create(null) };
    }
  }
  function saveQuickGroups(data) {
    // Group definitions and assignments are isolated by resource category.
    const payload = { schema: 2, groupsByModule: data.groupsByModule || {}, assignments: data.assignments || {} };
    HOST_WIN.localStorage.setItem(QUICK_GROUP_KEY, JSON.stringify(payload));
  }

  // Theme Manager Lite stores its actual group configuration in localStorage,
  // not inside the script JSON. TLE reads this key directly when both scripts
  // run in the same SillyTavern origin.
  const THEME_MANAGER_GROUP_KEY = '__ThemeManagerLite_groups_v2';
  const THEME_MANAGER_LEGACY_FAV_KEY = '__ThemeManagerLite_favs';
  const THEME_MANAGER_LEGACY_ICON_KEY = '__ThemeManagerLite_icon';

  function convertThemeManagerGroups(raw) {
    if (!raw || raw.version !== 2 || !Array.isArray(raw.groups) ||
        !raw.map || typeof raw.map !== 'object' || Array.isArray(raw.map) ||
        typeof raw.enabled !== 'boolean') {
      throw new Error('不是有效的美化主题管理 v2 分组备份。');
    }

    const ids = new Set();
    const names = new Set();
    const groups = raw.groups.map(group => {
      if (!group || typeof group.id !== 'string' || !group.id || ids.has(group.id) ||
          typeof group.name !== 'string' || !group.name.trim() ||
          names.has(group.name.trim())) {
        throw new Error('主题管理分组名称或 ID 无效、重复。');
      }
      if (group.icon !== undefined && typeof group.icon !== 'string') {
        throw new Error('主题管理分组图标格式错误。');
      }
      if (group.keyword !== undefined && typeof group.keyword !== 'string') {
        throw new Error('主题管理分组关键词格式错误。');
      }
      ids.add(group.id);
      names.add(group.name.trim());
      return {
        id: group.id,
        name: group.name.trim(),
        keyword: typeof group.keyword === 'string' ? group.keyword : '',
        icon: typeof group.icon === 'string' ? group.icon.trim() : '',
        collapsed: group.collapsed === true
      };
    });

    const assignments = Object.create(null);
    for (const [themeName, groupId] of Object.entries(raw.map)) {
      if (!themeName || typeof groupId !== 'string' || !ids.has(groupId)) {
        throw new Error('主题管理中存在无效的主题分组归属。');
      }
      // TLE's preset catalog key is JSON.stringify(['themes', themeName]).
      assignments[JSON.stringify(['themes', themeName])] = groupId;
    }
    return { groups, assignments };
  }

  function readThemeManagerLocalGroups() {
    const stored = HOST_WIN.localStorage.getItem(THEME_MANAGER_GROUP_KEY);
    if (stored !== null) return JSON.parse(stored);

    // Compatibility with Theme Manager Lite's older single "已标记" group.
    const legacyText = HOST_WIN.localStorage.getItem(THEME_MANAGER_LEGACY_FAV_KEY);
    if (legacyText !== null) {
      const names = JSON.parse(legacyText);
      if (!Array.isArray(names) || names.some(name => typeof name !== 'string')) {
        throw new Error('旧版主题标记数据格式错误。');
      }
      const icon = HOST_WIN.localStorage.getItem(THEME_MANAGER_LEGACY_ICON_KEY) || '★';
      const map = Object.create(null);
      names.filter(Boolean).forEach(name => { map[name] = 'legacy'; });
      return {
        version: 2,
        enabled: true,
        groups: names.length ? [{ id: 'legacy', name: '已标记', icon, keyword: '', collapsed: false }] : [],
        map
      };
    }

    throw new Error('没有找到美化主题管理的本机分组数据。请先运行该脚本，或先在它的分组管理中导出备份。');
  }

  function normalizeTLEGroupBackup(raw) {
    if (!raw || raw.schema !== 2 ||
        !raw.groupsByModule || typeof raw.groupsByModule !== 'object' || Array.isArray(raw.groupsByModule) ||
        !raw.assignments || typeof raw.assignments !== 'object' || Array.isArray(raw.assignments)) {
      throw new Error('不是有效的 TLE 快速切换分组备份。');
    }

    const groupsByModule = Object.create(null);
    const assignments = Object.create(null);
    for (const item of QUICK_MODULES) {
      const rawGroups = raw.groupsByModule[item.id] ?? [];
      if (!Array.isArray(rawGroups)) throw new Error(`「${item.title}」分组列表格式错误。`);
      const groups = cleanQuickGroupList(rawGroups);
      if (groups.length !== rawGroups.length) throw new Error(`「${item.title}」包含无效分组。`);

      const ids = new Set();
      const names = new Set();
      for (const group of groups) {
        const name = group.name.trim().toLocaleLowerCase();
        if (!group.id || !group.name.trim() || ids.has(group.id) || names.has(name)) {
          throw new Error(`「${item.title}」存在重复或空白的分组名称 / ID。`);
        }
        ids.add(group.id);
        names.add(name);
        group.name = group.name.trim();
      }
      groupsByModule[item.id] = groups;

      const rawMap = raw.assignments[item.id] ?? {};
      if (!rawMap || typeof rawMap !== 'object' || Array.isArray(rawMap)) {
        throw new Error(`「${item.title}」主题归属数据格式错误。`);
      }
      const map = Object.create(null);
      for (const [key, groupId] of Object.entries(rawMap)) {
        if (typeof key === 'string' && typeof groupId === 'string' && ids.has(groupId)) {
          map[key] = groupId;
        }
      }
      assignments[item.id] = map;
    }
    return { schema: 2, groupsByModule, assignments };
  }

  function quickGroupsFor(data, module) {
    return Array.isArray(data.groupsByModule?.[module]) ? data.groupsByModule[module] : [];
  }
  function quickAssignment(data, module, key) {
    const id = data.assignments?.[module]?.[key];
    return quickGroupsFor(data, module).some(group => group.id === id) ? id : '';
  }
  function quickThumbnailUrl(type, file, context = null) {
    try {
      const hostContext = context || HOST_WIN.SillyTavern?.getContext?.() || {};
      const helper = hostContext.getThumbnailUrl || HOST_WIN.getThumbnailUrl;
      return typeof helper === 'function' && file ? String(helper(type, file) || '') : '';
    } catch { return ''; }
  }
  function quickAvatarNode(entry) {
    const holder = quickNode('span', 'tle-quick-avatar');
    holder.dataset.kind = entry.avatarKind || '';
    if (entry.avatarUrl) {
      const image = quickNode('img');
      image.src = entry.avatarUrl;
      image.alt = '';
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('error', () => {
        holder.classList.add('is-fallback');
        image.remove();
      }, { once: true });
      holder.append(image);
    } else {
      holder.classList.add('is-fallback');
    }
    return holder;
  }
  function quickSelect(id) {
    return HOST_DOC.getElementById(id)?.tagName === 'SELECT' ? HOST_DOC.getElementById(id) : null;
  }
  function quickSelectItems(id, section = '') {
    const select = quickSelect(id);
    if (!select) return [];
    return [...select.options].filter(option => !option.hidden).map(option => ({
      key: JSON.stringify([id, option.value]), value: option.value, selectId: id,
      label: option.textContent.trim() || '（未选择）', section: section || option.parentElement?.label || '',
      selected: option.selected, disabled: select.disabled || option.disabled || option.parentElement?.disabled === true,
      multiple: select.multiple,
    }));
  }

  function migrateQuickWorldInfoGroupAssignments(items) {
    try {
      const data = readQuickGroups();
      const map = data.assignments?.worldInfo || Object.create(null);
      let changed = false;
      for (const item of items) {
        const legacyKey = item.legacyKey;
        if (!legacyKey || legacyKey === item.key || !Object.hasOwn(map, legacyKey)) continue;
        if (!Object.hasOwn(map, item.key)) map[item.key] = map[legacyKey];
        delete map[legacyKey];
        changed = true;
      }
      if (changed) {
        data.assignments.worldInfo = map;
        saveQuickGroups(data);
      }
    } catch (error) {
      console.warn('[TLE] Worldbook group-key migration failed:', error);
    }
  }

  function quickWorldInfoSelectItems() {
    const items = quickSelectItems('world_info').map(item => ({
      ...item,
      legacyKey: item.key,
      key: JSON.stringify(['world_info', item.label]),
      resourceName: item.label,
      selectValue: item.value,
    }));
    migrateQuickWorldInfoGroupAssignments(items);
    return items;
  }

  function buildWorldInfoCatalog(worldNames, context, worldInfo, selectedWorldInfo, worldInfoSelect) {
    const names = [...new Set((Array.isArray(worldNames) ? worldNames : [])
      .map(value => String(value || '').trim()).filter(Boolean))];
    const options = worldInfoSelect ? [...worldInfoSelect.options] : [];
    const optionValues = new Map(options.map(option => [String(option.textContent || '').trim(), String(option.value)]));
    const globalNames = new Set([
      ...(Array.isArray(selectedWorldInfo) ? selectedWorldInfo : []),
      ...(Array.isArray(worldInfo?.globalSelect) ? worldInfo.globalSelect : []),
    ].map(value => String(value || '').trim()).filter(Boolean));
    const characters = Array.isArray(context?.characters) ? context.characters : [];
    const currentByFilename = new Map();
    const primaryByBook = new Map(names.map(name => [name, new Set()]));
    const extraByBook = new Map(names.map(name => [name, new Set()]));
    const orphanByBook = new Map(names.map(name => [name, new Set()]));
    const unloadedIndices = [];

    for (const [index, character] of characters.entries()) {
      const avatar = String(character?.avatar || '').trim();
      const filename = avatar.replace(/\.[^/.]+$/, '');
      if (filename) currentByFilename.set(filename, character);
      if (character?.shallow === true) {
        unloadedIndices.push(index);
        continue;
      }
      const primary = String(character?.data?.extensions?.world || character?.json_data?.extensions?.world || '').trim();
      if (primary && primaryByBook.has(primary)) {
        primaryByBook.get(primary).add(String(character?.name || avatar || filename).trim());
      }
    }

    for (const record of Array.isArray(worldInfo?.charLore) ? worldInfo.charLore : []) {
      const ownerName = String(record?.name || '').trim();
      if (!ownerName) continue;
      const currentOwner = currentByFilename.get(ownerName);
      for (const rawBook of Array.isArray(record?.extraBooks) ? record.extraBooks : []) {
        const bookName = String(rawBook || '').trim();
        if (!extraByBook.has(bookName)) continue;
        (currentOwner ? extraByBook : orphanByBook).get(bookName).add(
          currentOwner ? String(currentOwner.name || currentOwner.avatar || ownerName).trim() : ownerName
        );
      }
    }

    const entries = names.map((name, index) => {
      const primary = [...(primaryByBook.get(name) || [])];
      const extra = [...(extraByBook.get(name) || [])];
      const orphan = [...(orphanByBook.get(name) || [])];
      const global = globalNames.has(name);
      const hasCurrent = global || primary.length > 0 || extra.length > 0;
      let statusLabel = '未绑定';
      let statusTone = 'neutral';
      if (orphan.length && !hasCurrent && unloadedIndices.length === 0) {
        statusLabel = '疑似孤儿';
        statusTone = 'orphan';
      } else if (orphan.length && hasCurrent) {
        statusLabel = '含遗留关联';
        statusTone = 'warning';
      } else if (unloadedIndices.length) {
        statusLabel = hasCurrent ? '部分扫描' : '待核对';
        statusTone = 'pending';
      } else if (hasCurrent) {
        statusLabel = '已关联';
        statusTone = 'linked';
      } else if (orphan.length) {
        statusLabel = '待核对';
        statusTone = 'pending';
      }

      const details = [];
      if (global) details.push('全局');
      if (primary.length) details.push('主要绑定：' + primary.join('、'));
      if (extra.length) details.push('额外绑定：' + extra.join('、'));
      if (orphan.length) details.push('遗留角色绑定：' + orphan.join('、'));
      if (unloadedIndices.length) details.push('尚有 ' + unloadedIndices.length + ' 张角色卡未加载，主要绑定待核对');
      if (!details.length) details.push('未发现全局或角色卡绑定；可能是独立世界书，也可能是删除角色卡后遗留，请人工核对');

      const optionValue = optionValues.get(name) ?? String(index);
      const detail = details.join(' · ');
      return {
        key: JSON.stringify(['world_info', name]),
        legacyKey: JSON.stringify(['world_info', optionValue]),
        value: name,
        selectValue: optionValue,
        selectId: 'world_info',
        label: name,
        detail,
        search: [name, detail, statusLabel].join(' '),
        selected: global,
        disabled: false,
        multiple: true,
        statusLabel,
        statusTone,
        binding: { global, primary, extra, orphan },
      };
    });

    return {
      entries,
      meta: {
        totalCharacters: characters.length,
        unloadedCount: unloadedIndices.length,
        unloadedIndices,
      },
    };
  }

  function removeWorldInfoExtraLinks(worldInfo, worldName) {
    const records = worldInfo?.charLore;
    if (!Array.isArray(records)) return false;
    let changed = false;
    for (let index = records.length - 1; index >= 0; index--) {
      const record = records[index];
      if (!Array.isArray(record?.extraBooks) || !record.extraBooks.includes(worldName)) continue;
      const remaining = record.extraBooks.filter(name => name !== worldName);
      if (remaining.length) record.extraBooks = remaining;
      else records.splice(index, 1);
      changed = true;
    }
    return changed;
  }
  // Match Theme Manager's catalog contract: every non-empty native value is a
  // theme name. A hidden option/select (including an iOS shield) is not a
  // missing theme. Keep the existing keys so saved quick groups still match.
  function quickThemeItems() {
    const select = quickSelect('themes');
    if (!select) return [];
    const active = getCurrentThemeInfo();
    const hasActive = [...select.options].some(option => option.value === active);
    return [...select.options].filter(option => Boolean(option.value)).map(option => ({
      key: JSON.stringify(['themes', option.value]), value: option.value, selectId: 'themes',
      label: option.textContent.trim() || option.value, section: '',
      selected: hasActive ? option.value === active : option.selected,
      disabled: select.disabled || option.disabled || option.parentElement?.disabled === true,
      multiple: false,
    }));
  }
  function isQuickThemeMutation(record) {
    const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
    return Boolean(target?.closest?.('select#themes')) ||
      [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 &&
        (node.matches?.('select#themes') || node.querySelector?.('select#themes')));
  }
  function withQuickThemeControl(action) {
    const connected = quickSelect('themes');
    if (connected) return action(connected);
    const panel = HOST_DOC.getElementById('user-settings-block');
    const runtime = HOST_WIN.__TAURITAVERN_PANEL_RUNTIME__;
    const slot = panel?.dataset.ttRuntimeSlotId;
    if (!slot || typeof runtime?.setVisible !== 'function' || typeof runtime?.reconcile !== 'function') {
      return action(null);
    }
    // TT's panel runtime can hydrate a closed drawer without opening it. Keep
    // this lease synchronous: read/dispatch against the real connected control,
    // then restore residency to the drawer's current native open state.
    // Clicking its toggle would close our .openDrawer picker via doNavbarIconClick.
    try {
      runtime.setVisible(slot, true);
      runtime.reconcile();
      return action(quickSelect('themes'));
    } finally {
      runtime.setVisible(slot, panel.classList.contains('openDrawer'));
      runtime.reconcile();
    }
  }
  async function quickThemeCatalog(signal) {
    if (state.destroyed || signal.aborted) return [];
    const initial = withQuickThemeControl(() => quickThemeItems());
    if (initial.length) return initial;
    // Never turn a quick-switch click into a navigation action. Wait only for
    // host initialization; the separate arrow remains the explicit jump action.
    await new Promise(resolve => {
      let timer;
      const finish = () => {
        observer.disconnect();
        HOST_WIN.clearTimeout(timer);
        signal.removeEventListener('abort', finish);
        resolve();
      };
      const check = () => {
        if (state.destroyed || signal.aborted || quickThemeItems().length) finish();
      };
      const observer = new HOST_WIN.MutationObserver(records => {
        if (records.some(isQuickThemeMutation)) check();
      });
      observer.observe(HOST_DOC.body, { childList: true, subtree: true,
        attributes: true, attributeFilter: ['value'] });
      signal.addEventListener('abort', finish, { once: true });
      // Wait for options, not just an empty select. Late additions after this
      // bound are still picked up by the open picker's catalog observer.
      timer = HOST_WIN.setTimeout(finish, 2500);
      check();
    });
    if (state.destroyed || signal.aborted) return [];
    const entries = withQuickThemeControl(() => quickThemeItems());
    if (!entries.length && !quickSelect('themes')) {
      throw new Error('主题控件尚未挂载，且当前 TT 未提供可用的静默挂载接口。可用右侧箭头打开用户设置后重试。');
    }
    return entries;
  }
  function quickReasoningItems() {
    const select = quickSelect('reasoning_select');
    if (!select) return [];
    const active = getActiveReasoningName();
    const selected = select.selectedOptions?.[0];
    // Snapshot while connected: TT may remove the entire subtree before the
    // information station's scheduled observer runs.
    if (selected?.value) rememberReasoningFormat(selected.textContent.trim() || selected.value);
    return [...select.options].filter(option => Boolean(option.value)).map(option => ({
      key: JSON.stringify(['reasoning_select', option.value]), value: option.value, selectId: 'reasoning_select',
      label: option.textContent.trim() || option.value, section: '',
      selected: active ? option.value === active : option.selected,
      disabled: select.disabled || option.disabled || option.parentElement?.disabled === true,
      multiple: false,
    }));
  }
  function isQuickReasoningMutation(record) {
    const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
    return Boolean(target?.closest?.('select#reasoning_select')) ||
      [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 &&
        (node.matches?.('select#reasoning_select') || node.querySelector?.('select#reasoning_select')));
  }
  function waitQuickReasoningControl(signal) {
    return new Promise(resolve => {
      let timer;
      const finish = () => {
        observer.disconnect();
        HOST_WIN.clearTimeout(timer);
        signal.removeEventListener('abort', finish);
        resolve();
      };
      const check = () => {
        const select = quickSelect('reasoning_select');
        if (state.destroyed || signal.aborted || [...(select?.options || [])].some(option => option.value)) finish();
      };
      const observer = new HOST_WIN.MutationObserver(records => {
        if (records.some(isQuickReasoningMutation)) check();
      });
      observer.observe(HOST_DOC.body, { childList: true, subtree: true,
        attributes: true, attributeFilter: ['value'] });
      signal.addEventListener('abort', finish, { once: true });
      timer = HOST_WIN.setTimeout(finish, 2500);
      check();
    });
  }
  // Serialize refresh/activation so one async disclosure load cannot release
  // another operation's temporary mount. No navigation or preset writes here.
  let quickReasoningQueue = Promise.resolve();
  function withQuickReasoningControl(action, signal = state.abort.signal) {
    const task = quickReasoningQueue.then(async () => {
      if (state.destroyed || signal.aborted) return null;
      const panel = HOST_DOC.querySelector('#AdvancedFormatting, #advanced_formatting');
      const runtime = HOST_WIN.__TAURITAVERN_PANEL_RUNTIME__;
      const slot = panel?.dataset.ttRuntimeSlotId;
      let leased = false, disclosure = null;
      try {
        if ((!quickSelect('reasoning_select') || !panel?.classList.contains('openDrawer'))
            && slot && typeof runtime?.setVisible === 'function'
            && typeof runtime?.reconcile === 'function') {
          runtime.setVisible(slot, true);
          leased = true;
          runtime.reconcile();
        }
        const ready = () => [...(quickSelect('reasoning_select')?.options || [])].some(option => option.value);
        if (!ready()) {
          // Some clients/extensions defer the nested controls until details opens.
          const target = [...(panel?.querySelectorAll('details') || [])].find(item => {
            const summary = item.querySelector(':scope > summary');
            return /reasoning\s*format|推理.{0,8}格式/i.test(
              (summary?.getAttribute('data-i18n') || '') + ' ' + (summary?.textContent || ''));
          });
          if (target && !target.open) { disclosure = target; target.open = true; }
          await waitQuickReasoningControl(signal);
        }
        if (state.destroyed || signal.aborted) return null;
        const select = quickSelect('reasoning_select');
        if (!select) throw new Error('推理格式控件尚未挂载。可用右侧箭头打开高级格式化后重试。');
        if (!ready()) throw new Error('推理格式列表尚未加载，请稍后刷新。');
        return action(select);
      } finally {
        if (disclosure) disclosure.open = false;
        if (leased) {
          runtime.setVisible(slot, panel.classList.contains('openDrawer'));
          runtime.reconcile();
        }
      }
    });
    quickReasoningQueue = task.catch(() => {});
    return task;
  }
  function quickModelSelects() {
    const root = HOST_DOC.querySelector('#rm_api_block');
    if (!root) return [];
    return [...root.querySelectorAll('select[id]')].filter(select => {
      if (!/model/i.test(select.id)) return false;
      // Ignore the outer drawer being closed, but respect hidden provider sections.
      for (let node = select; node && node !== root; node = node.parentElement) {
        if (node.hidden || HOST_WIN.getComputedStyle(node).display === 'none') return false;
      }
      return true;
    });
  }
  let worldInfoCatalogMeta = { totalCharacters: 0, unloadedCount: 0, unloadedIndices: [] };

  async function quickCatalog(id, mount = true, signal = state.abort.signal) {
    if (id === 'theme') return quickThemeCatalog(signal);
    if (id === 'reasoning') return (await withQuickReasoningControl(quickReasoningItems, signal)) || [];
    const context = HOST_WIN.SillyTavern?.getContext?.() || {};
    if (id === 'character') {
      return (context.characters || []).filter(c => c?.avatar).map(c => {
        const rawTags = Array.isArray(c.tags) ? c.tags
          : Array.isArray(c.data?.tags) ? c.data.tags
          : Array.isArray(c.json_data?.tags) ? c.json_data.tags : [];
        const tags = [...new Set(rawTags.map(tag => typeof tag === 'string' ? tag : String(tag?.name || '')).map(tag => tag.trim()).filter(Boolean))];
        const visibleTags = tags.slice(0, 3);
        const tagLine = visibleTags.join(' · ') + (tags.length > 3 ? ` +${tags.length - 3}` : '');
        return {
          key: c.avatar, value: c.avatar, label: c.name || c.avatar,
          detail: tagLine, search: tags.join(' '),
          avatarKind: 'character', avatarUrl: quickThumbnailUrl('avatar', c.avatar, context),
          selected: context.groupId == null && context.characters[context.characterId]?.avatar === c.avatar,
        };
      });
    }
    if (id === 'persona') {
      const power = context.powerUserSettings || powerUserModule?.power_user || (await quickImport('/scripts/power-user.js')).power_user;
      const personas = await quickImport('/scripts/personas.js');
      return Object.entries(power.personas || {}).map(([avatar, name]) => {
        // Tavern's persona title is the user-visible remark; the filename is
        // retained only as an internal key, not shown as secondary text.
        const data = power.persona_descriptions?.[avatar] || {};
        const remark = String(data.title || '').trim();
        const description = String(data.description || '');
        return {
          key: avatar, value: avatar, label: String(name || '未命名身份'),
          detail: `备注：${remark || '未填写'}`, search: remark + '\n' + description,
          avatarKind: 'persona', avatarUrl: quickThumbnailUrl('persona', avatar, context),
          selected: personas.user_avatar === avatar,
        };
      });
    }
    const ids = { preset: 'settings_preset_openai', worldInfo: 'world_info', api: 'connection_profiles' };
    if (!(id in ids)) return [];
    if (!quickSelect(ids[id]) && mount) {
      openNativePanelForInfo(id);
      // Native TT drawers may mount asynchronously. Do not manufacture a second
      // catalog or write directly to host settings when a control is parked.
      for (let i = 0; i < 20 && !state.destroyed && !quickSelect(ids[id]); i++) {
        await new Promise(resolve => HOST_WIN.setTimeout(resolve, 50));
      }
    }
    if (id === 'api') {
      return [
        ...quickSelectItems('connection_profiles', '连接配置'),
        ...quickSelectItems('chat_completion_source', '接口来源'),
        ...quickModelSelects().flatMap(select => quickSelectItems(select.id, '模型')),
      ];
    }
    if (id === 'worldInfo') return quickWorldInfoSelectItems();
    return quickSelectItems(ids[id]);
  }
  async function quickManagerCatalog(id, signal = state.abort.signal) {
    if (id !== 'worldInfo') return quickCatalog(id, false, signal);
    if (state.destroyed || signal?.aborted) return [];
    const native = await quickImport('/scripts/world-info.js');
    if (state.destroyed || signal?.aborted) return [];
    const context = HOST_WIN.SillyTavern?.getContext?.() || {};
    const select = quickSelect('world_info');
    const fallbackNames = select
      ? [...select.options].map(option => String(option.textContent || '').trim()).filter(Boolean)
      : [];
    const names = Array.isArray(native.world_names) && native.world_names.length
      ? native.world_names
      : fallbackNames;
    const catalog = buildWorldInfoCatalog(
      names,
      context,
      native.world_info || {},
      native.selected_world_info || [],
      select
    );
    worldInfoCatalogMeta = catalog.meta;
    migrateQuickWorldInfoGroupAssignments(catalog.entries);
    return catalog.entries;
  }

  async function applyQuickChoice(id, item, signal = state.abort.signal) {
    if (state.destroyed || signal.aborted) return;
    const context = HOST_WIN.SillyTavern?.getContext?.() || {};
    if (id === 'character') {
      const index = context.characters?.findIndex(c => c.avatar === item.value);
      if (index == null || index < 0 || typeof context.selectCharacterById !== 'function') throw new Error('角色列表已变化，请刷新列表。');
      await context.selectCharacterById(index);
      companionOnChatChanged(); // native quick switch fallback
    } else if (id === 'persona') {
      const module = await quickImport('/scripts/personas.js');
      if (state.destroyed) return;
      const power = context.powerUserSettings || powerUserModule?.power_user;
      if (power && !Object.hasOwn(power.personas || {}, item.value)) throw new Error('身份已不存在，请刷新列表。');
      await module.setUserAvatar(item.value);
    } else if (id === 'reasoning') {
      await withQuickReasoningControl(select => {
        const option = [...select.options].find(option => option.value === item.value);
        if (!option || select.disabled || option.disabled || option.parentElement?.disabled) {
          throw new Error('推理格式已变化或不可用，请刷新列表。');
        }
        const active = getActiveReasoningName();
        if (select.value !== item.value || (active && active !== item.value)) {
          select.value = item.value;
          // Use the host handler to update name/prefix/suffix/separator and save.
          select.dispatchEvent(new HOST_WIN.Event('change', { bubbles: true }));
        }
        rememberReasoningFormat(option.textContent.trim() || option.value);
      }, signal);
    } else if (id === 'theme') {
      withQuickThemeControl(select => {
        const option = select && [...select.options].find(option => option.value === item.value);
        if (!option || select.disabled || option.disabled || option.parentElement?.disabled) {
          throw new Error('主题已变化或控件不可用，请刷新列表。');
        }
        if (select.value === item.value && getCurrentThemeInfo() === item.value) return;
        select.value = item.value;
        select.dispatchEvent(new HOST_WIN.Event('change', { bubbles: true }));
      });
    } else {
      const select = quickSelect(item.selectId);
      const option = select && [...select.options].find(option => option.value === item.value);
      if (!option || select.disabled || option.disabled || option.parentElement?.disabled) throw new Error('选项已变化或不可用，请刷新列表。');
      if (select.multiple) option.selected = !option.selected;
      else {
        if (select.value === item.value) return;
        select.value = item.value;
      }
      // One native event reaches both DOM and jQuery listeners, as in the
      // supplied theme manager. Never dispatch input + change or trigger twice.
      select.dispatchEvent(new HOST_WIN.Event('change', { bubbles: true }));
    }
    queueInfoRefresh();
    if (id === 'persona') updateWorkspaceHeader();
  }
  function closeQuickPanel(restoreFocus = true) {
    quickSequence++;
    const current = quickPanel;
    quickPanel = null;
    if (!current) return;
    current.abort.abort();
    if (current.embedded) {
      current.body?.replaceChildren();
      current.body?.classList.remove('tle-quick-manager');
      current.trigger?.setAttribute('aria-pressed', 'false');
      queueChatShortcutRefresh();
      return;
    }
    current.node.remove();
    HOST_DOC.body.classList.remove('tle-quick-modal-open');
    current.trigger?.setAttribute('aria-expanded', 'false');
    if (restoreFocus && current.trigger?.isConnected) current.trigger.focus({ preventScroll: true });
    queueChatShortcutRefresh();
  }
  function makeQuickPanel(title, trigger, module) {
    closeQuickPanel(false);
    if (state.globalSearchOpen) closeGlobalSearch();
    const isManager = module === 'groups';
    const node = quickNode('div', 'tle-quick-overlay');
    node.id = 'tle-quick-picker';
    node.dataset.tleQuickPanel = module;
    node.setAttribute('role', 'presentation');

    const body = quickNode('div', isManager
      ? 'popup tle-quick-surface tle-quick-manager'
      : 'popup tle-quick-surface tle-quick-picker-surface');
    body.setAttribute('role', 'dialog');
    body.setAttribute('aria-modal', 'true');
    body.setAttribute('aria-label', title);
    node.appendChild(body);
    HOST_DOC.body.classList.add('tle-quick-modal-open');

    const abort = new HOST_WIN.AbortController();
    const current = { node, body, trigger, module, abort, sequence: quickSequence };
    quickPanel = current;
    trigger?.setAttribute('aria-expanded', 'true');

    const heading = quickNode('div', 'flex-container alignItemsCenter justifySpaceBetween tle-quick-heading');
    const headingTitle = quickNode('b', 'tle-quick-title', title);
    const headingActions = quickNode('div', 'tle-quick-heading-actions');
    headingActions.hidden = true;
    const closeButton = quickButton('×', () => closeQuickPanel(), 'tle-quick-close');
    closeButton.setAttribute('aria-label', '关闭');
    heading.append(headingTitle, headingActions, closeButton);
    current.headingActions = headingActions;
    body.append(heading);

    // All information-station pickers and the group manager use the same
    // centered modal interaction; only their internal content and sizing differ.
    for (const type of ['pointerdown', 'mousedown', 'touchstart', 'click', 'dblclick']) {
      node.addEventListener(type, event => event.stopPropagation());
    }
    node.addEventListener('click', event => {
      if (event.target === node) closeQuickPanel();
    });
    node.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      if (event.isComposing) { event.stopPropagation(); return; }
      event.preventDefault();
      event.stopPropagation();
      closeQuickPanel();
    });
    HOST_DOC.addEventListener('pointerdown', event => {
      if (!node.contains(event.target) && !trigger?.contains(event.target)) closeQuickPanel(false);
    }, { capture: true, signal: abort.signal });

    HOST_DOC.body.appendChild(node);
    queueChatShortcutRefresh();
    return current;
  }
  function quickSearchBox(placeholder) {
    const search = quickNode('input', 'text_pole wide100p tle-search-field');
    search.type = 'search'; search.placeholder = placeholder;
    search.setAttribute('aria-label', placeholder); search.autocomplete = 'off';
    return search;
  }
  function quickScrollList() {
    const list = quickNode('div', 'flex-container flexFlowColumn flexNoGap scrollableInner');
    Object.assign(list.style, { overflowY:'auto', minHeight:'0', flex:'1 1 auto' });
    return list;
  }
  async function openQuickPicker(id, trigger) {
    if (!QUICK_MODULES.some(item => item.id === id)) return;
    if (quickPanel?.module === id) { closeQuickPanel(); return; }
    const current = makeQuickPanel(QUICK_MODULES.find(item => item.id === id).title + ' · 快速切换', trigger, id);
    const { node, body } = current;
    const search = quickSearchBox(id === 'persona' ? '搜索身份、备注或分组…' : '搜索选项或分组…');
    const searchWrap = quickNode('div', 'tle-search-field-wrap');
    const searchIcon = quickNode('i', 'fa-solid fa-magnifying-glass');
    searchIcon.setAttribute('aria-hidden', 'true');
    searchWrap.append(searchIcon, search);
    const status = quickNode('small', '', '正在读取…'); status.setAttribute('role','status');
    const list = quickScrollList(); list.setAttribute('role','group');
    const footer = quickNode('div','flex-container');
    footer.append(quickButton('刷新', () => void load()));
    if (infoSettings[id].jump) footer.append(quickButton('跳转原面板', () => { closeQuickPanel(false); openNativePanelForInfo(id); }));
    body.append(searchWrap, list, status, footer);
    let entries = [], busy = false, request = 0;
    const collapsed = new Set(quickGroupsFor(readQuickGroups(), id).filter(group => group.collapsed).map(group => group.id));
    const render = () => {
      if (quickPanel !== current) return;
      const groups = readQuickGroups(), query = search.value.trim().toLocaleLowerCase();
      const sections = [...quickGroupsFor(groups, id), {id:'',name:'未分组'}];
      list.replaceChildren();
      let total = 0;
      for (const group of sections) {
        const matches = entries.filter(entry => quickAssignment(groups,id,entry.key) === group.id &&
          `${entry.label} ${entry.detail || ''} ${entry.search || ''} ${entry.section || ''} ${group.name}`.toLocaleLowerCase().includes(query));
        if (!matches.length) continue;
        total += matches.length;
        const details = quickNode('details', 'wide100p');
        details.open = Boolean(query) || !collapsed.has(group.id);
        const summary = quickNode('summary', 'inline-drawer-header', `${quickGroupLabel(group)}（${matches.length}）`);
        details.append(summary);
        details.addEventListener('toggle', () => { if (!query) { if(details.open) collapsed.delete(group.id); else collapsed.add(group.id); } });
        for (const entry of matches) {
          const button = quickButton('', () => void choose(entry), 'tle-quick-option');
          button.dataset.quickKey = entry.key;
          button.setAttribute('aria-pressed', String(entry.selected));
          button.disabled = busy || entry.disabled;
          const row = quickNode('span', 'tle-quick-option-row');
          if (entry.avatarKind) row.append(quickAvatarNode(entry));
          const copy = quickNode('span', 'tle-quick-option-copy');
          copy.append(quickNode('span','tle-quick-option-name',`${entry.selected ? '✓ ' : ''}${entry.section ? entry.section + ' · ' : ''}${entry.label}`));
          if (entry.detail) copy.append(quickNode('small','',entry.detail));
          row.append(copy);
          button.append(row); details.append(button);
        }
        list.append(details);
      }
      status.textContent = entries.length ? `${total} 项${id === 'worldInfo' ? ' · 点击勾选或取消，保留其他世界书' : ''}` : '未读取到可用选项，可刷新或跳转原面板。';
      if (!total && entries.length) list.append(quickNode('p','','没有匹配的选项'));
    };
    async function load() {
      const token = ++request;
      try {
        const next = await quickCatalog(id, true, current.abort.signal);
        if (quickPanel !== current || token !== request) return;
        entries = next; render();
      } catch(error) { if(quickPanel === current) status.textContent = '读取失败：' + error.message; }
    }
    async function choose(entry) {
      if (busy || entry.disabled) return;
      busy = true; render();
      try {
        // Re-resolve identity/source at activation; never apply a stale model row.
        // A TT theme control may have been parked since this picker opened.
        const fresh = await quickCatalog(id, id === 'theme', current.abort.signal);
        if (quickPanel !== current || state.destroyed) return;
        const choice = fresh.find(item => item.key === entry.key);
        if (!choice || choice.disabled) throw new Error('选项已变化，请刷新后重试。');
        await applyQuickChoice(id, choice, current.abort.signal);
        if (quickPanel !== current) return;
        if (choice.multiple || id === 'api') { busy = false; await load(); }
        else closeQuickPanel();
      } catch (error) {
        busy = false; render();
        if (quickPanel === current) status.textContent = '切换失败：' + error.message;
      }
    }
    if (id === 'theme' || id === 'reasoning') {
      const selectId = id === 'theme' ? 'themes' : 'reasoning_select';
      let frame = 0;
      current.refreshThemeCatalog = () => {
        if (frame || quickPanel !== current) return;
        frame = HOST_WIN.requestAnimationFrame(() => {
          frame = 0;
          if (quickPanel !== current || !quickSelect(selectId)) return;
          // A parked catalog remains visible until remount; activation always
          // revalidates against the live select before dispatching change.
          entries = id === 'theme' ? quickThemeItems() : quickReasoningItems();
          render();
        });
      };
      const observer = new HOST_WIN.MutationObserver(records => {
        if (records.some(id === 'theme' ? isQuickThemeMutation : isQuickReasoningMutation)) current.refreshThemeCatalog();
      });
      observer.observe(HOST_DOC.body, { childList: true, subtree: true, characterData: true,
        attributes: true, attributeFilter: ['value', 'label', 'selected', 'disabled'] });
      HOST_DOC.addEventListener('change', event => {
        if (event.target?.id === selectId) current.refreshThemeCatalog();
      }, { capture: true, signal: current.abort.signal });
      current.abort.signal.addEventListener('abort', () => {
        observer.disconnect();
        HOST_WIN.cancelAnimationFrame(frame);
      }, { once: true });
    }
    search.addEventListener('input', event => { if(!event.isComposing) render(); });
    search.addEventListener('compositionend', render);
    node.addEventListener('keydown', event => {
      if (event.isComposing || !['ArrowDown','ArrowUp','Enter'].includes(event.key)) return;
      const buttons = [...list.querySelectorAll('details[open] button:not(:disabled)')];
      if (!buttons.length) return;
      if (event.key === 'Enter') {
        if (event.target === search) { event.preventDefault(); buttons[0].click(); }
        return;
      }
      event.preventDefault();
      const index = buttons.indexOf(HOST_DOC.activeElement), step = event.key === 'ArrowDown' ? 1 : -1;
      buttons[(index + step + buttons.length) % buttons.length].focus();
    });
    await load();
    // Keep the picker list fully visible on mobile; focus the search field only
    // when the user explicitly taps it, otherwise iOS/Android may open the keyboard.
  }

  const QUICK_DELETE_MODULES = Object.freeze({
    character: true,
    worldInfo: true,
    preset: true,
    reasoning: true,
    persona: true,
    theme: true,
  });
  // Keep QUICK_MODULES as the complete persisted data schema so hidden search-only
  // categories retain their existing group data and backup entries.
  const QUICK_RESOURCE_MODULES = QUICK_MODULES.filter(item => QUICK_DELETE_MODULES[item.id] === true);

  function quickDeleteDisabledReason(module, selectedEntries = []) {
    if (QUICK_DELETE_MODULES[module] !== true) {
      if (module === 'api') return 'API 连接、接口来源与模型仅允许搜索，不参与分组或删除。';
      return '此类内容仅允许搜索，不提供分组或删除。';
    }
    if (module === 'preset' || module === 'reasoning') {
      const deletable = selectedEntries.some(entry =>
        String(entry.value).toLocaleLowerCase() !== 'gui' &&
        String(entry.label).toLocaleLowerCase() !== 'gui'
      );
      if (selectedEntries.length && !deletable) return 'GUI 预设是酒馆原生保留项，不能删除。';
    }
    return '';
  }

  function openQuickGroupManager(trigger) {
    if (!state.globalSearchOpen) openGlobalSearch();
    if (!state.globalSearchOpen || !state.globalSearchPanel) return;
    if (quickPanel?.embedded && quickPanel.module === 'groups') {
      setGlobalSearchView('resources');
      return;
    }
    if (quickPanel) closeQuickPanel(false);
    const body = state.globalSearchPanel.querySelector('.tle-organizer-resources');
    if (!body) return;
    const current = {
      node: state.globalSearchPanel,
      body,
      trigger,
      module: 'groups',
      abort: new HOST_WIN.AbortController(),
      sequence: quickSequence,
      embedded: true,
    };
    quickPanel = current;
    body.replaceChildren();
    body.classList.add('tle-quick-manager');
    setGlobalSearchView('resources');

    let module = 'preset';
    let targetGroup = '';
    let viewGroup = '*';
    let entries = [];
    let loading = 0;
    let statusMessage = '';
    let scanBusy = false;
    let scanProgress = '';
    const selected = new Set();

    const hint = quickNode(
      'small',
      'tle-quick-hint',
      '仅管理酒馆原生支持删除的资源；不可删除配置仍可在搜索页查找。'
    );
    hint.title = '资源管理只显示酒馆原生支持删除的资源；模型、API 与其他不可删除配置仅保留在搜索页。现有隐藏分类分组数据仍保留在全部分组备份中。右上角图标可导入/导出全部分组方案。';
    const tabs = quickNode('div', 'flex-container flexWrap tle-quick-tabs');
    const groupFilters = quickNode('div', 'flex-container flexWrap tle-quick-filter-bar');

    const groupName = quickNode('input', 'text_pole');
    groupName.placeholder = '新分组名称 / 重命名名称';
    groupName.setAttribute('aria-label', '新分组名称或重命名名称');
    const createButton = quickButton('创建', () => createGroup());
    const renameButton = quickButton('重命名', () => renameGroup());
    const deleteButton = quickButton('删除分组', () => deleteGroup());
    const manageRow = quickNode('div', 'tle-quick-manage-row');
    manageRow.hidden = true;
    manageRow.append(groupName, createButton, renameButton, deleteButton);

    const search = state.globalSearchPanel.querySelector('.tle-search-field');
    if (!search) return;
    search.placeholder = '筛选当前分类资源名称、备注或标签…';
    search.setAttribute('aria-label', '筛选当前分类资源名称、备注或标签');

    const targetSelect = quickNode('select', 'text_pole');
    targetSelect.setAttribute('aria-label', '批量操作目标分组');

    const manageButton = quickButton('管理分组', () => {
      manageRow.hidden = !manageRow.hidden;
      manageButton.textContent = manageRow.hidden ? '管理分组' : '收起管理';
      manageButton.setAttribute('aria-expanded', String(!manageRow.hidden));
      if (!manageRow.hidden) groupName.focus({ preventScroll: true });
    });
    manageButton.setAttribute('aria-expanded', 'false');

    const autoGroupButton = quickButton('自动分组', () => autoGroupByPrefix());
    autoGroupButton.title = '识别当前分类中名称具有相同开头的项目；只整理未分组项目，不覆盖已有分组归属。';

    const toolbar = quickNode('div', 'tle-quick-toolbar');
    toolbar.append(targetSelect, manageButton, autoGroupButton);

    const groupControlsRow = quickNode('div', 'tle-quick-group-controls');
    groupControlsRow.append(groupFilters, toolbar);

    const operations = quickNode('div', 'flex-container flexWrap tle-quick-operations');
    const selectVisibleButton = quickButton('全选当前结果', () => {
      const data = readQuickGroups();
      getVisibleEntries(data).forEach(entry => selected.add(entry.key));
      render();
    });
    const clearSelectionButton = quickButton('清空选择', () => {
      selected.clear();
      render();
    });
    const assignButton = quickButton('归入目标分组', () => assignSelected());
    const ungroupButton = quickButton('移回未分组', () => ungroupSelected());
    const deleteSelectedButton = quickButton('批量删除资源', () => requestDeleteSelected());
    const deleteScopeHint = '可批量删除：角色卡、世界书、预设、推理格式、User 身份、UI 主题。API/模型及其他不可删除配置仅支持搜索；正则继续由正则侠管理。';
    deleteSelectedButton.title = deleteScopeHint;
    deleteSelectedButton.setAttribute('aria-description', deleteScopeHint);
    const refreshButton = quickButton('刷新列表', () => void load());
    const scanButton = quickButton('扫描绑定', () => void scanWorldInfoBindings());
    scanButton.hidden = true;
    scanButton.title = '逐张加载尚未读取的角色卡元数据，以核对主要世界书绑定。只读取、不修改角色卡；可能增加当前会话内存占用。';
    operations.append(selectVisibleButton, clearSelectionButton, assignButton, ungroupButton, deleteSelectedButton, refreshButton, scanButton);

    const backupRow = quickNode('div', 'tle-quick-backup-row');
    const importBackupButton = quickButton('', () => backupFile.click(), 'menu_button tle-quick-icon-action');
    importBackupButton.title = '导入方案文件（全部快切分类）';
    importBackupButton.setAttribute('aria-label', '导入全部分组方案文件');
    const importIcon = quickNode('i', 'fa-solid fa-file-import');
    importIcon.setAttribute('aria-hidden', 'true');
    importBackupButton.append(importIcon);
    const exportBackupButton = quickButton('', () => exportQuickGroupBackup(), 'menu_button tle-quick-icon-action');
    exportBackupButton.title = '导出全部分组';
    exportBackupButton.setAttribute('aria-label', '导出全部快切分类的分组方案');
    const exportIcon = quickNode('i', 'fa-solid fa-file-export');
    exportIcon.setAttribute('aria-hidden', 'true');
    exportBackupButton.append(exportIcon);
    const backupFile = quickNode('input');
    backupFile.type = 'file';
    backupFile.accept = '.json,application/json';
    backupFile.hidden = true;
    backupFile.setAttribute('aria-label', '导入分组方案文件');
    backupRow.append(importBackupButton, exportBackupButton, backupFile);

    const themeImportRow = quickNode('div', 'tle-quick-theme-import');
    const readThemeManagerButton = quickButton('', () => void importThemeManagerGroups());
    readThemeManagerButton.title = '从主题管理读取分组（仅当前 UI 主题）';
    readThemeManagerButton.setAttribute('aria-label', '读取主题管理分组，仅替换当前 UI 主题分类');
    const themeImportIcon = quickNode('i', 'fa-solid fa-arrows-rotate');
    themeImportIcon.setAttribute('aria-hidden', 'true');
    readThemeManagerButton.append(themeImportIcon, HOST_DOC.createTextNode('同步'));
    themeImportRow.append(readThemeManagerButton);
    themeImportRow.hidden = true;

    const categoryRow = quickNode('div', 'tle-quick-category-row');
    categoryRow.title = hint.title;
    categoryRow.setAttribute('aria-label', '资源分类、主题分组同步与全部分组备份');
    categoryRow.append(tabs, themeImportRow, backupRow);

    const deleteConfirm = quickNode('div', 'tle-quick-transfer-confirm');
    deleteConfirm.hidden = true;
    const deleteMessage = quickNode('p', 'tle-quick-transfer-message');
    const deleteActions = quickNode('div', 'tle-quick-transfer-actions');
    const deleteCancelButton = quickButton('取消', () => { deleteConfirm.hidden = true; });
    const deleteConfirmButton = quickButton('确认删除', () => void deleteSelectedResources());
    deleteActions.append(deleteCancelButton, deleteConfirmButton);
    deleteConfirm.append(deleteMessage, deleteActions);
    let deleteBusy = false;

    const transferConfirm = quickNode('div', 'tle-quick-transfer-confirm');
    transferConfirm.hidden = true;
    const transferMessage = quickNode('p', 'tle-quick-transfer-message');
    const transferActions = quickNode('div', 'tle-quick-transfer-actions');
    const transferCancelButton = quickButton('取消', () => settleTransferConfirm(false));
    const transferConfirmButton = quickButton('确认导入', () => settleTransferConfirm(true));
    transferActions.append(transferCancelButton, transferConfirmButton);
    transferConfirm.append(transferMessage, transferActions);
    let resolveTransferConfirm = null;

    const list = quickScrollList();
    list.classList.add('tle-quick-list');
    const status = quickNode('small', 'tle-quick-status');
    status.setAttribute('role', 'status');

    for (const item of QUICK_RESOURCE_MODULES) {
      const button = quickButton(item.title, () => {
        if (module === item.id) return;
        module = item.id;
        targetGroup = '';
        viewGroup = '*';
        selected.clear();
        groupName.value = '';
        search.value = '';
        deleteConfirm.hidden = true;
        manageRow.hidden = true;
        manageButton.textContent = '管理分组';
        manageButton.setAttribute('aria-expanded', 'false');
        statusMessage = '';
        void load();
      });
      button.dataset.quickCategory = item.id;
      tabs.append(button);
    }

    function currentGroups(data = readQuickGroups()) {
      return quickGroupsFor(data, module);
    }

    function refreshTargetSelect(data = readQuickGroups()) {
      const groups = currentGroups(data);
      targetSelect.replaceChildren();
      const placeholder = quickNode('option', '', '选择目标分组…');
      placeholder.value = '';
      targetSelect.append(placeholder);
      for (const group of groups) {
        const option = quickNode('option', '', quickGroupLabel(group));
        option.value = group.id;
        targetSelect.append(option);
      }
      if (!groups.some(group => group.id === targetGroup)) targetGroup = '';
      targetSelect.value = targetGroup;
      targetSelect.disabled = groups.length === 0;
      renameButton.disabled = !targetGroup;
      deleteButton.disabled = !targetGroup;
      assignButton.disabled = !targetGroup || selected.size === 0;
      ungroupButton.disabled = selected.size === 0;
      clearSelectionButton.disabled = selected.size === 0;
      const selectedEntries = entries.filter(entry => selected.has(entry.key));
      const blockedReason = quickDeleteDisabledReason(module, selectedEntries, entries.length);
      deleteSelectedButton.disabled = deleteBusy || selectedEntries.length === 0 || Boolean(blockedReason);
      deleteSelectedButton.title = blockedReason || (selectedEntries.length
        ? '删除所选资源。' + deleteScopeHint
        : '请先勾选需要删除的资源。' + deleteScopeHint);
    }

    function getVisibleEntries(data = readQuickGroups()) {
      const query = search.value.trim().toLocaleLowerCase();
      const groups = currentGroups(data);
      return entries.filter(entry => {
        const assigned = quickAssignment(data, module, entry.key);
        if (viewGroup !== '*' && assigned !== viewGroup) return false;
        if (!query) return true;
        const group = groups.find(item => item.id === assigned);
        const haystack = `${entry.label} ${entry.detail || ''} ${entry.search || ''} ${entry.section || ''} ${group?.name || '未分组'}`.toLocaleLowerCase();
        return haystack.includes(query);
      });
    }

    function setViewGroup(id) {
      viewGroup = id;
      const group = currentGroups().find(item => item.id === id);
      targetGroup = group?.id || '';
      groupName.value = group?.name || '';
      search.value = '';
      selected.clear();
      statusMessage = '';
      render();
    }

    function renderGroupFilters(data) {
      const groups = currentGroups(data);
      const assignedCount = new Map(groups.map(group => [group.id, 0]));
      let ungroupedCount = 0;
      for (const entry of entries) {
        const id = quickAssignment(data, module, entry.key);
        if (id) assignedCount.set(id, (assignedCount.get(id) || 0) + 1);
        else ungroupedCount++;
      }

      groupFilters.replaceChildren();
      const filters = [
        { id: '*', label: `全部项目 · ${entries.length}` },
        { id: '', label: `未分组 · ${ungroupedCount}` },
        ...groups.map(group => ({ id: group.id, label: `${quickGroupLabel(group)} · ${assignedCount.get(group.id) || 0}` })),
      ];
      for (const filter of filters) {
        const button = quickButton(filter.label, () => setViewGroup(filter.id), 'tle-quick-filter');
        const group = groups.find(item => item.id === filter.id);
        button.title = group
          ? '查看并选中此分组；可在「管理分组」中重命名或删除，包括空分组。'
          : filter.id === ''
            ? '查看尚未归组的项目。'
            : '查看当前分类的全部项目。';
        button.setAttribute('aria-pressed', String(viewGroup === filter.id));
        groupFilters.append(button);
      }
    }

    function renderList(data) {
      const previousScrollTop = list.scrollTop;
      list.replaceChildren();
      const visible = getVisibleEntries(data);
      for (const entry of visible) {
        const row = quickNode('div', 'tle-quick-item');
        const checkbox = quickNode('input', 'tle-quick-item-check');
        checkbox.type = 'checkbox';
        checkbox.checked = selected.has(entry.key);
        checkbox.setAttribute('aria-label', `选择 ${entry.label}`);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selected.add(entry.key);
          else selected.delete(entry.key);
          statusMessage = '';
          assignButton.disabled = !targetGroup || selected.size === 0;
          ungroupButton.disabled = selected.size === 0;
          clearSelectionButton.disabled = selected.size === 0;
          refreshTargetSelect();
          status.textContent = `${getVisibleEntries().length} / ${entries.length} 项 · 已选 ${selected.size} 项${viewGroup === '*' ? '' : ' · 已按分组筛选'}`;
        });
        row.append(checkbox);

        if (entry.avatarKind) row.append(quickAvatarNode(entry));

        const copy = quickNode('div', 'tle-quick-item-copy');
        copy.title = entry.detail || entry.label;
        const title = quickNode('span', 'tle-quick-item-title', `${entry.section ? entry.section + ' · ' : ''}${entry.label}`);
        if (entry.statusLabel) {
          const titleRow = quickNode('div', 'tle-quick-item-title-row');
          titleRow.append(title);
          const statusBadge = quickNode('span', 'tle-quick-item-status is-' + (entry.statusTone || 'neutral'), entry.statusLabel);
          statusBadge.title = entry.detail || entry.statusLabel;
          titleRow.append(statusBadge);
          copy.append(titleRow);
        } else {
          copy.append(title);
        }
        if (entry.detail) copy.append(quickNode('small', 'tle-quick-item-detail', entry.detail));
        row.classList.toggle('tle-quick-item-worldbook', module === 'worldInfo');
        row.append(copy);

        const assigned = quickAssignment(data, module, entry.key);
        const group = currentGroups(data).find(item => item.id === assigned);
        const tag = quickButton(group ? quickGroupLabel(group) : '未分组', () => setViewGroup(assigned), 'tle-quick-group-tag');
        tag.title = '点击查看该分组中的全部项目';
        tag.setAttribute('aria-label', `筛选分组：${group?.name || '未分组'}`);
        row.append(tag);
        list.append(row);
      }

      if (!visible.length) {
        list.append(quickNode('p', 'tle-quick-empty', entries.length
          ? '当前筛选条件下没有项目。'
          : '该分类暂时没有读取到项目。'));
      }
      list.scrollTop = previousScrollTop;
      status.textContent = `${visible.length} / ${entries.length} 项 · 已选 ${selected.size} 项${viewGroup === '*' ? '' : ' · 已按分组筛选'}`;
      if (module === 'worldInfo' && worldInfoCatalogMeta.unloadedCount) status.textContent += ` · ${worldInfoCatalogMeta.unloadedCount} 张角色卡尚未加载，主要绑定待核对`;
      if (statusMessage) status.textContent += ` · ${statusMessage}`;
    }

    function render() {
      if (quickPanel !== current) return;
      const clear = state.globalSearchPanel?.querySelector('.tle-search-clear');
      if (clear) clear.hidden = !search.value;
      const data = readQuickGroups();
      const groups = currentGroups(data);

      tabs.querySelectorAll('button').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.quickCategory === module));
      });
      themeImportRow.hidden = module !== 'theme';
      scanButton.hidden = module !== 'worldInfo' || !worldInfoCatalogMeta.unloadedCount;
      scanButton.disabled = scanBusy;
      scanButton.textContent = scanBusy ? '扫描 ' + scanProgress : '扫描绑定';

      if (viewGroup !== '*' && viewGroup !== '' && !groups.some(group => group.id === viewGroup)) viewGroup = '*';
      renderGroupFilters(data);
      refreshTargetSelect(data);

      const target = groups.find(group => group.id === targetGroup);
      if (target && HOST_DOC.activeElement !== groupName) groupName.value = target.name;
      if (!target && HOST_DOC.activeElement !== groupName) groupName.value = '';
      renderList(data);
    }

    function saveAndRender(data, message) {
      try {
        saveQuickGroups(data);
        statusMessage = message || '已保存。';
        render();
      } catch (error) {
        statusMessage = `保存失败：${error.message}`;
        render();
      }
    }

    function requestDeleteSelected() {
      const chosen = entries.filter(entry => selected.has(entry.key));
      if (!chosen.length) {
        statusMessage = '请先勾选需要删除的资源。';
        render();
        return;
      }
      const blockedReason = quickDeleteDisabledReason(module, chosen);
      if (blockedReason) {
        statusMessage = blockedReason;
        render();
        return;
      }
      if (resolveTransferConfirm) settleTransferConfirm(false);
      const isGuiPreset = module === 'preset' || module === 'reasoning';
      const deletable = chosen.filter(entry => !(isGuiPreset &&
        (String(entry.value).toLocaleLowerCase() === 'gui' ||
         String(entry.label).toLocaleLowerCase() === 'gui')
      ));
      const protectedCount = chosen.length - deletable.length;
      const names = deletable.slice(0, 5).map(entry => entry.label).join('、');
      const extra = deletable.length > 5 ? ` 等另外 ${deletable.length - 5} 项` : '';
      const warnings = {
        character: '通过酒馆原生角色删除接口处理；聊天记录会保留，当前会话由酒馆原生逻辑关闭或切换。',
        worldInfo: '将通过酒馆原生世界书删除接口处理，并同步清理额外世界书绑定记录。删除前请核对列表中的角色主绑定关系。',
        preset: '将通过酒馆原生预设管理器删除；若包含当前预设，酒馆会按原生逻辑切换，GUI 预设受原生保护。',
        reasoning: '将通过酒馆原生推理格式管理器删除；GUI 预设受原生保护。',
        persona: '将通过酒馆原生 User 身份删除命令处理；默认身份及聊天绑定信息由酒馆原生逻辑清理。',
        theme: '将通过酒馆原生 UI 主题删除接口处理；若删除当前主题，将按原生逻辑切换到剩余主题。',
      };
      deleteMessage.textContent = `确认删除 ${deletable.length} 项资源？${names ? `（${names}${extra}）` : ''}${protectedCount ? `；另有 ${protectedCount} 项酒馆保留项将跳过` : ''}。 ${warnings[module] || '此操作不可撤销。'}`;
      deleteConfirmButton.textContent = `确认删除 ${deletable.length} 项`;
      deleteConfirm.hidden = false;
      deleteConfirmButton.disabled = false;
      deleteCancelButton.disabled = false;
    }

    async function deleteSelectedResources() {
      if (deleteBusy || scanBusy) return;
      const selectedKeys = [...selected];
      const chosen = entries.filter(entry => selected.has(entry.key));
      const blockedReason = quickDeleteDisabledReason(module, chosen);
      if (!chosen.length || blockedReason) {
        statusMessage = blockedReason || '请先勾选需要删除的资源。';
        deleteConfirm.hidden = true;
        render();
        return;
      }

      deleteBusy = true;
      deleteConfirm.hidden = true;
      deleteConfirmButton.disabled = true;
      deleteCancelButton.disabled = true;
      const busyControls = [
        ...tabs.querySelectorAll('button'),
        ...operations.querySelectorAll('button'),
        ...manageRow.querySelectorAll('button'),
        targetSelect, manageButton, autoGroupButton,
      ];
      const busyDisabled = busyControls.map(control => control.disabled);
      busyControls.forEach(control => { control.disabled = true; });
      statusMessage = '正在通过酒馆原生接口删除资源…';
      render();

      const successfulKeys = new Set();
      let failed = 0;
      let skipped = 0;
      let reloadAfterThemeDelete = false;
      try {
        const freshEntries = await quickManagerCatalog(module, current.abort.signal);
        const freshChosen = freshEntries.filter(entry => selectedKeys.includes(entry.key));
        skipped += chosen.length - freshChosen.length;
        if (!freshChosen.length) throw new Error('所选资源已变化或不存在，请刷新列表后重试。');
        const freshBlockedReason = quickDeleteDisabledReason(module, freshChosen);
        if (freshBlockedReason) throw new Error(freshBlockedReason);

        if (module === 'character') {
          const native = await quickImport('/script.js');
          if (typeof native.deleteCharacter !== 'function') {
            throw new Error('当前酒馆未提供可用的原生角色卡删除接口，未执行删除。');
          }
          const ok = await native.deleteCharacter(freshChosen.map(entry => entry.value), { deleteChats: false });
          if (!ok) {
            failed += freshChosen.length;
          } else {
            const remaining = await quickCatalog('character', false, state.abort.signal);
            const remainingKeys = new Set(remaining.map(entry => entry.key));
            for (const entry of freshChosen) if (!remainingKeys.has(entry.key)) successfulKeys.add(entry.key);
          }
        } else if (module === 'worldInfo') {
          const native = await quickImport('/scripts/world-info.js');
          if (typeof native.deleteWorldInfo !== 'function') {
            throw new Error('当前酒馆未提供可用的原生世界书删除接口，未执行删除。');
          }
          const context = HOST_WIN.SillyTavern?.getContext?.() || {};
          for (const entry of freshChosen) {
            try {
              const hasExtraLink = Array.isArray(native.world_info?.charLore) && native.world_info.charLore.some(record => Array.isArray(record?.extraBooks) && record.extraBooks.includes(entry.value));
              if (hasExtraLink && typeof context.saveSettingsDebounced !== 'function') {
                throw new Error('无法保存世界书额外绑定清理，已跳过该项删除。');
              }
              if (removeWorldInfoExtraLinks(native.world_info, entry.value)) context.saveSettingsDebounced();
              if (await native.deleteWorldInfo(entry.value)) successfulKeys.add(entry.key);
              else failed++;
            } catch { failed++; }
          }
        } else if (module === 'preset' || module === 'reasoning') {
          const context = HOST_WIN.SillyTavern?.getContext?.() || {};
          const apiId = module === 'preset' ? 'openai' : 'reasoning';
          const native = context.getPresetManager?.(apiId) ||
            (await quickImport('/scripts/preset-manager.js')).getPresetManager(apiId);
          if (typeof native?.deletePreset !== 'function') {
            throw new Error('当前酒馆未提供可用的原生预设删除接口，未执行删除。');
          }
          for (const entry of freshChosen) {
            if (String(entry.value).toLocaleLowerCase() === 'gui' ||
                String(entry.label).toLocaleLowerCase() === 'gui') {
              skipped++;
              continue;
            }
            try {
              if (await native.deletePreset(entry.label.trim())) successfulKeys.add(entry.key);
              else failed++;
            } catch { failed++; }
          }
        } else if (module === 'persona') {
          const context = HOST_WIN.SillyTavern?.getContext?.() || {};
          for (const entry of freshChosen) {
            try {
              const command = `/persona-delete persona=${JSON.stringify(String(entry.value))} silent=true`;
              const result = await executeTLESlashCommand(command, context);
              if (result?.isError) throw new Error(result.errorMessage || '酒馆原生身份删除命令执行失败。');
              if (result?.isAborted || result?.isQuietlyAborted) {
                throw new Error(result.abortReason || '身份删除命令已中止。');
              }
              successfulKeys.add(entry.key);
            } catch { failed++; }
          }
        } else if (module === 'theme') {
          const context = HOST_WIN.SillyTavern?.getContext?.() || {};
          if (typeof context.getRequestHeaders !== 'function') {
            throw new Error('当前酒馆未提供原生请求凭证，未执行主题删除。');
          }
          const hasThemeControl = withQuickThemeControl(select => Boolean(select));
          if (!hasThemeControl) throw new Error('当前酒馆主题控件不可用，未执行主题删除。');
          for (const entry of freshChosen) {
            const themeName = String(entry.value);
            try {
              const wasActive = getCurrentThemeInfo() === themeName;
              const response = await HOST_WIN.fetch('/api/themes/delete', {
                method: 'POST',
                headers: context.getRequestHeaders(),
                body: JSON.stringify({ name: themeName }),
                cache: 'no-cache',
              });
              if (!response.ok) {
                failed++;
                continue;
              }
              reloadAfterThemeDelete = true;
              withQuickThemeControl(select => {
                if (!select) return;
                const option = [...select.options].find(option => option.value === themeName);
                if (option) option.remove();
                if (wasActive) {
                  const fallback = [...select.options].find(option => Boolean(option.value));
                  if (fallback) {
                    select.value = fallback.value;
                    select.dispatchEvent(new HOST_WIN.Event('change', { bubbles: true }));
                  } else {
                    const powerUser = context.powerUserSettings || powerUserModule?.power_user;
                    if (powerUser) powerUser.theme = undefined;
                    if (typeof context.saveSettingsDebounced === 'function') context.saveSettingsDebounced();
                  }
                }
              });
              successfulKeys.add(entry.key);
            } catch { failed++; }
          }
        }
        const refreshed = await quickManagerCatalog(module, current.abort.signal);
        const refreshedKeys = new Set(refreshed.map(entry => entry.key));
        const removedKeys = [...successfulKeys].filter(key => !refreshedKeys.has(key));
        failed += successfulKeys.size - removedKeys.length;
        const data = readQuickGroups();
        const map = data.assignments[module] || Object.create(null);
        for (const key of removedKeys) delete map[key];
        data.assignments[module] = map;
        try { saveQuickGroups(data); }
        catch (error) { statusMessage = `资源已删除，但分组归属清理失败：${error.message}`; }
        entries = refreshed;
        selected.clear();
        for (const key of selectedKeys) if (refreshedKeys.has(key)) selected.add(key);
        if (!statusMessage.startsWith('资源已删除')) {
          statusMessage = `批量删除完成：成功 ${removedKeys.length} 项${failed ? `，失败或未确认 ${failed} 项` : ''}${skipped ? `，跳过 ${skipped} 项` : ''}。`;
        }
        if (reloadAfterThemeDelete) statusMessage += ' 酒馆将自动刷新以同步原生主题列表。';
      } catch (error) {
        statusMessage = `批量删除未完成：${error?.message || error}`;
        try { entries = await quickManagerCatalog(module, current.abort.signal); } catch {}
      } finally {
        deleteBusy = false;
        busyControls.forEach((control, index) => { control.disabled = busyDisabled[index]; });
        deleteConfirmButton.disabled = false;
        deleteCancelButton.disabled = false;
        if (quickPanel === current) render();
        if (reloadAfterThemeDelete) {
          HOST_WIN.setTimeout(() => HOST_WIN.location.reload(), 900);
        }
      }
    }

    function createGroup() {
      const name = groupName.value.trim();
      if (!name) { statusMessage = '请填写新分组名称。'; render(); return; }
      const data = readQuickGroups();
      const groups = currentGroups(data);
      if (groups.some(group => group.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        statusMessage = '当前分类中已有同名分组。';
        render();
        return;
      }
      const id = HOST_WIN.crypto?.randomUUID?.() || `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
      groups.push({ id, name, keyword: '' });
      targetGroup = id;
      viewGroup = '*';
      manageRow.hidden = true;
      manageButton.textContent = '管理分组';
      manageButton.setAttribute('aria-expanded', 'false');
      saveAndRender(data, `已创建「${name}」分组。`);
      groupName.value = name;
    }

    function renameGroup() {
      const data = readQuickGroups();
      const groups = currentGroups(data);
      const group = groups.find(item => item.id === targetGroup);
      const name = groupName.value.trim();
      if (!group) { statusMessage = '请先选择需要重命名的分组。'; render(); return; }
      if (!name) { statusMessage = '分组名称不能为空。'; render(); return; }
      if (groups.some(item => item.id !== targetGroup && item.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        statusMessage = '当前分类中已有同名分组。';
        render();
        return;
      }
      group.name = name;
      saveAndRender(data, '分组名称已更新。');
    }

    function deleteGroup() {
      const data = readQuickGroups();
      const groups = currentGroups(data);
      const group = groups.find(item => item.id === targetGroup);
      if (!group) { statusMessage = '请先选择需要删除的分组。'; render(); return; }
      const removedId = group.id;
      groups.splice(groups.indexOf(group), 1);
      const map = data.assignments[module] || Object.create(null);
      for (const key of Object.keys(map)) if (map[key] === removedId) delete map[key];
      data.assignments[module] = map;
      if (viewGroup === removedId) viewGroup = '*';
      targetGroup = '';
      groupName.value = '';
      saveAndRender(data, `已删除「${group.name}」；其中项目已恢复为未分组，其他分类不受影响。`);
    }

    function assignSelected() {
      if (!targetGroup) { statusMessage = '请先选择目标分组。'; render(); return; }
      if (!selected.size) { statusMessage = '请先勾选需要归组的项目。'; render(); return; }
      const data = readQuickGroups();
      const map = data.assignments[module] || Object.create(null);
      let moved = 0;
      for (const key of selected) {
        if (map[key] !== targetGroup) { map[key] = targetGroup; moved++; }
      }
      data.assignments[module] = map;
      selected.clear();
      viewGroup = targetGroup;
      search.value = '';
      saveAndRender(data, `已将 ${moved} 项归入「${currentGroups(data).find(group => group.id === targetGroup)?.name || '目标分组'}」。`);
    }

    function ungroupSelected() {
      if (!selected.size) { statusMessage = '请先勾选需要移出分组的项目。'; render(); return; }
      const data = readQuickGroups();
      const map = data.assignments[module] || Object.create(null);
      let moved = 0;
      for (const key of selected) {
        if (map[key]) { delete map[key]; moved++; }
      }
      data.assignments[module] = map;
      selected.clear();
      viewGroup = '';
      search.value = '';
      saveAndRender(data, `已将 ${moved} 项移回未分组。`);
    }

    function inferQuickGroupPrefix(label) {
      const text = String(label || '').trim();
      if (!text) return '';

      // Bracketed creator/provider tags are strong, unambiguous prefixes:
      // [ako] Preset v1, 【秦素】主题 A, etc.
      const bracketPatterns = [
        /^\[([^\]]{1,32})\]\s*/u,
        /^【([^】]{1,32})】\s*/u,
        /^（([^）]{1,32})）\s*/u,
        /^\(([^)]{1,32})\)\s*/u,
        /^《([^》]{1,32})》\s*/u,
        /^「([^」]{1,32})」\s*/u,
        /^『([^』]{1,32})』\s*/u,
      ];
      for (const pattern of bracketPatterns) {
        const match = text.match(pattern);
        const prefix = match?.[1]?.trim();
        if (prefix) return prefix;
      }

      // Otherwise use the leading name segment before a common separator.
      // Examples: 秦素-主题, Gemini-v3, Gemini 2.5, LiK_主题.
      const match = text.match(/^(.{2,28}?)(?=[\s\-‐‑‒–—_＿|｜:：/／·•])/u);
      const prefix = match?.[1]?.trim() || '';
      if (Array.from(prefix).length < 2 || /^\d+$/u.test(prefix)) return '';
      return prefix;
    }

    function autoGroupByPrefix() {
      const data = readQuickGroups();
      const groups = currentGroups(data);
      const map = data.assignments[module] || Object.create(null);
      let keywordMoved = 0;

      // Imported Theme Manager keyword rules are retained and applied first.
      // Existing assignments are never overwritten; unmatched new entries can
      // therefore be organized without disturbing the user's manual grouping.
      for (const group of groups) {
        const keyword = String(group.keyword || '').trim().toLocaleLowerCase();
        if (!keyword) continue;
        for (const entry of entries) {
          if (quickAssignment(data, module, entry.key)) continue;
          if (String(entry.label || '').toLocaleLowerCase().includes(keyword)) {
            map[entry.key] = group.id;
            keywordMoved++;
          }
        }
      }
      data.assignments[module] = map;

      const buckets = new Map();
      for (const entry of entries) {
        const prefix = inferQuickGroupPrefix(entry.label);
        if (!prefix) continue;
        const normalized = prefix.toLocaleLowerCase();
        if (!buckets.has(normalized)) buckets.set(normalized, { name: prefix, entries: [] });
        buckets.get(normalized).entries.push(entry);
      }

      const candidates = [...buckets.values()]
        .filter(bucket => bucket.entries.length >= 2)
        .sort((a, b) => b.entries.length - a.entries.length);

      if (!candidates.length && !keywordMoved) {
        statusMessage = '没有发现可应用的分组关键词，也没有至少两个项目共享的名称开头。';
        render();
        return;
      }

      let created = 0;
      let moved = 0;
      let preserved = 0;
      let skipped = 0;

      for (const bucket of candidates) {
        let group = groups.find(item =>
          item.name.toLocaleLowerCase() === bucket.name.toLocaleLowerCase()
        );
        const ungrouped = bucket.entries.filter(entry =>
          !quickAssignment(data, module, entry.key)
        );

        // Do not create one-item groups, and never overwrite a user's
        // existing manual assignment. Existing same-name groups are reused.
        if (!group && ungrouped.length < 2) {
          skipped += bucket.entries.length;
          continue;
        }

        if (!group) {
          const id = HOST_WIN.crypto?.randomUUID?.() ||
            `g_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
          group = { id, name: bucket.name, keyword: '', icon: '', collapsed: false };
          groups.push(group);
          created++;
        }

        for (const entry of bucket.entries) {
          const assigned = quickAssignment(data, module, entry.key);
          if (assigned === group.id) {
            preserved++;
            continue;
          }
          if (assigned) {
            preserved++;
            continue;
          }
          map[entry.key] = group.id;
          moved++;
        }
      }

      data.assignments[module] = map;
      selected.clear();
      viewGroup = '*';
      search.value = '';

      if (!created && !moved && !keywordMoved) {
        statusMessage = `识别到 ${candidates.length} 组共同开头，但没有可自动归组的未分组项目；已有分组归属保持不变。`;
      } else {
        statusMessage = `自动分组完成：关键词规则归入 ${keywordMoved} 项；识别 ${candidates.length} 组共同开头，创建 ${created} 个分组，按前缀归入 ${moved} 项；保留 ${preserved + skipped} 项已有归属或不足以成组的项目。`;
      }
      saveAndRender(data, statusMessage);
    }

    async function load() {
      const token = ++loading;
      statusMessage = '正在读取当前分类…';
      status.textContent = statusMessage;
      try {
        // Only read the active category's existing catalog; never open or mutate
        // native resource panels just to manage grouping metadata.
        const next = await quickManagerCatalog(module, current.abort.signal);
        if (quickPanel !== current || token !== loading) return;
        entries = next;
        statusMessage = '';
        render();
        if (!entries.length) statusMessage = '列表尚未加载；可先打开该分类的原生面板，再回来刷新。';
        if (!entries.length) render();
      } catch (error) {
        if (quickPanel === current) {
          statusMessage = `读取失败：${error.message}`;
          render();
        }
      }
    }

    async function scanWorldInfoBindings() {
      if (scanBusy || deleteBusy || module !== 'worldInfo') return;
      const context = HOST_WIN.SillyTavern?.getContext?.() || {};
      const characters = Array.isArray(context.characters) ? context.characters : [];
      const pending = characters
        .map((character, index) => ({ character, index }))
        .filter(item => item.character?.shallow === true);
      if (!pending.length) {
        statusMessage = '没有尚未加载的角色卡需要扫描。';
        await load();
        render();
        return;
      }
      if (typeof context.unshallowCharacter !== 'function') {
        statusMessage = '当前酒馆未提供角色卡懒加载读取接口，无法完整扫描。';
        render();
        return;
      }

      scanBusy = true;
      const controls = [
        ...tabs.querySelectorAll('button'),
        ...operations.querySelectorAll('button'),
        ...manageRow.querySelectorAll('button'),
        targetSelect, manageButton, autoGroupButton,
      ].filter(Boolean);
      const disabledBefore = controls.map(control => control.disabled);
      controls.forEach(control => { control.disabled = true; });
      let loaded = 0;
      let failed = 0;
      try {
        for (let index = 0; index < pending.length; index++) {
          if (quickPanel !== current || current.abort.signal.aborted) break;
          scanProgress = (index + 1) + '/' + pending.length;
          scanButton.textContent = '扫描 ' + scanProgress;
          status.textContent = '正在读取角色卡元数据 ' + scanProgress + '…';
          try {
            await context.unshallowCharacter(pending[index].index);
            loaded++;
          } catch {
            failed++;
          }
        }
        if (quickPanel !== current || current.abort.signal.aborted) return;
        await load();
        const remaining = worldInfoCatalogMeta.unloadedCount || 0;
        statusMessage = remaining
          ? '扫描结束：已读取 ' + loaded + ' 张，仍有 ' + remaining + ' 张未加载。'
          : '已读取 ' + loaded + ' 张角色卡，主要世界书绑定已重新核对。';
        if (failed) statusMessage += ' 读取失败 ' + failed + ' 张。';
        render();
      } catch (error) {
        statusMessage = '扫描失败：' + (error?.message || error);
        render();
      } finally {
        scanBusy = false;
        scanProgress = '';
        controls.forEach((control, index) => { control.disabled = disabledBefore[index]; });
        if (quickPanel === current) render();
      }
    }

    function settleTransferConfirm(confirmed) {
      const resolve = resolveTransferConfirm;
      resolveTransferConfirm = null;
      transferConfirm.hidden = true;
      resolve?.(confirmed);
    }

    function confirmGroupTransfer(message, okButton) {
      if (resolveTransferConfirm) settleTransferConfirm(false);
      deleteConfirm.hidden = true;
      transferMessage.textContent = message;
      transferConfirmButton.textContent = okButton;
      transferConfirm.hidden = false;
      return new Promise(resolve => { resolveTransferConfirm = resolve; });
    }

    current.abort.signal.addEventListener(
      'abort',
      () => settleTransferConfirm(false),
      { once: true }
    );

    function countAssignments(map) {
      return Object.keys(map || {}).length;
    }

    async function applyThemeManagerGroupImport(converted, statusText) {
      const data = readQuickGroups();
      data.groupsByModule.theme = converted.groups;
      data.assignments.theme = converted.assignments;
      saveQuickGroups(data);
      module = 'theme';
      targetGroup = '';
      viewGroup = '*';
      selected.clear();
      search.value = '';
      await load();
      if (quickPanel === current) {
        statusMessage = statusText;
        render();
      }
    }

    async function importThemeManagerGroups() {
      try {
        const converted = convertThemeManagerGroups(readThemeManagerLocalGroups());
        const assignmentCount = countAssignments(converted.assignments);
        if (!converted.groups.length) {
          throw new Error('本机主题管理分组为空，没有可导入的分组。');
        }
        const present = new Set(quickThemeItems().map(entry => entry.key));
        const missing = Object.keys(converted.assignments).filter(key => !present.has(key)).length;
        const current = readQuickGroups();
        const message = [
          `检测到 ${converted.groups.length} 个分组、${assignmentCount} 条主题归属。`,
          `将替换 TLE「当前 UI 主题」分类现有的 ${current.groupsByModule.theme?.length || 0} 个分组及其归属；其他快切分类不会改变。`,
          missing
            ? `${missing} 个主题目前未安装或未出现在主题列表中；它们的归属仍会保留，日后出现同名主题即可生效。`
            : '所有主题归属均能在当前主题列表中找到。'
        ].join('\\n');
        if (!await confirmGroupTransfer(message, '导入 UI 主题分组')) return;
        await applyThemeManagerGroupImport(
          converted,
          `已导入 ${converted.groups.length} 个 UI 主题分组、${assignmentCount} 条主题归属。`
        );
      } catch (error) {
        statusMessage = `读取失败：${error.message}`;
        render();
      }
    }

    function exportQuickGroupBackup() {
      try {
        const data = readQuickGroups();
        const backup = {
          app: 'Tavern Layout Engine',
          type: 'quick-group-backup',
          schema: 2,
          exportedAt: new Date().toISOString(),
          groupsByModule: data.groupsByModule,
          assignments: data.assignments
        };
        const blob = new HOST_WIN.Blob([JSON.stringify(backup, null, 2)], {
          type: 'application/json'
        });
        const url = HOST_WIN.URL.createObjectURL(blob);
        const anchor = HOST_DOC.createElement('a');
        anchor.href = url;
        anchor.download = `TLE-快速切换分组备份-${new Date().toISOString().slice(0, 10)}.json`;
        HOST_DOC.body.append(anchor);
        anchor.click();
        anchor.remove();
        HOST_WIN.setTimeout(() => HOST_WIN.URL.revokeObjectURL(url), 1000);
        statusMessage = '已导出全部分类的分组方案。';
        render();
      } catch (error) {
        statusMessage = `导出失败：${error.message}`;
        render();
      }
    }

    async function importQuickGroupFile(file) {
      try {
        const raw = JSON.parse(await file.text());

        if (raw?.type === 'script' && /美化主题管理/.test(raw?.name || '')) {
          throw new Error('你选择的是脚本本体，不包含浏览器里的实际分组数据。若脚本已安装，请点「读取主题管理分组」；跨设备迁移则先在原脚本中导出分组备份。');
        }

        if (raw?.schema === 2 && raw.groupsByModule && raw.assignments) {
          const incoming = normalizeTLEGroupBackup(raw);
          const groupCount = Object.values(incoming.groupsByModule).reduce((sum, groups) => sum + groups.length, 0);
          const assignmentCount = Object.values(incoming.assignments).reduce((sum, map) => sum + countAssignments(map), 0);
          const current = readQuickGroups();
          const currentCount = Object.values(current.groupsByModule).reduce((sum, groups) => sum + groups.length, 0);
          const message = [
            `备份包含 ${groupCount} 个分组、${assignmentCount} 条项目归属，覆盖范围为全部快切分类。`,
            `导入将替换 TLE 当前全部分类的 ${currentCount} 个分组及归属；未包含在备份中的分类将清空。`,
            '建议先导出当前方案作为备份。'
          ].join('\\n');
          if (!await confirmGroupTransfer(message, '替换全部分组')) return;
          saveQuickGroups(incoming);
          statusMessage = `已恢复全部分类：${groupCount} 个分组、${assignmentCount} 条项目归属。`;
          render();
          return;
        }

        if (raw?.version === 2 && Array.isArray(raw.groups) && raw.map &&
            typeof raw.map === 'object' && !Array.isArray(raw.map)) {
          const converted = convertThemeManagerGroups(raw);
          if (!converted.groups.length) throw new Error('备份中没有可导入的主题分组。');
          const assignmentCount = countAssignments(converted.assignments);
          const present = new Set(quickThemeItems().map(entry => entry.key));
          const missing = Object.keys(converted.assignments).filter(key => !present.has(key)).length;
          const current = readQuickGroups();
          const message = [
            `备份包含 ${converted.groups.length} 个主题分组、${assignmentCount} 条主题归属。`,
            `导入只替换 TLE「当前 UI 主题」分类现有的 ${current.groupsByModule.theme?.length || 0} 个分组；其他快切分类不会改变。`,
            missing
              ? `${missing} 个主题当前未安装或不可见，归属会保留，之后可自动匹配同名主题。`
              : '所有主题归属均能在当前主题列表中找到。'
          ].join('\\n');
          if (!await confirmGroupTransfer(message, '导入 UI 主题分组')) return;
          await applyThemeManagerGroupImport(
            converted,
            `已导入 ${converted.groups.length} 个 UI 主题分组、${assignmentCount} 条主题归属。`
          );
          return;
        }

        throw new Error('无法识别文件格式。请选择美化主题管理 v2 分组备份，或 TLE 快速切换分组备份。');
      } catch (error) {
        statusMessage = `导入失败：${error.message}`;
        render();
      }
    }

    backupFile.addEventListener('change', async () => {
      const file = backupFile.files?.[0];
      backupFile.value = '';
      if (file) await importQuickGroupFile(file);
    });

    targetSelect.addEventListener('change', () => {
      targetGroup = targetSelect.value;
      const group = currentGroups().find(item => item.id === targetGroup);
      groupName.value = group?.name || '';
      if (group) viewGroup = group.id;
      render();
    });
    groupName.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        if (targetGroup) renameGroup();
        else createGroup();
      }
    });
    current.onSearchInput = () => {
      if (quickPanel !== current) return;
      list.scrollTop = 0;
      render();
    };

    body.append(
      categoryRow, groupControlsRow, manageRow, transferConfirm, deleteConfirm,
      operations, list, status
    );
    void load();
    // The Organizer reuses the single search field above the view; it never creates a second one.
  }
  const FOLD_STORAGE_KEY = 'tle.optionalFolds.v2';
  const FOLD_LABELS = {
    'user-theme-toggles': '界面行为设置',
    'user-character': '角色处理',
    'user-misc': '杂项',
    'user-chat': '聊天/消息处理',
    'preset-model-settings': '模型与请求选项',
  };
  function readFoldConfig() {
    try {
      const saved = JSON.parse(HOST_WIN.localStorage.getItem(FOLD_STORAGE_KEY) || '{}');
      return {
        enabled: saved.enabled === true,
        options: Object.fromEntries(Object.keys(FOLD_LABELS).map(key => [key, saved.options?.[key] === true])),
      };
    } catch {
      return { enabled: false, options: Object.fromEntries(Object.keys(FOLD_LABELS).map(key => [key, false])) };
    }
  }
  const foldConfig = readFoldConfig();
  const foldRecords = new Map();
  function saveFoldConfig() {
    try { HOST_WIN.localStorage.setItem(FOLD_STORAGE_KEY, JSON.stringify(foldConfig)); } catch {}
  }
  function syncFoldSettingsUI() {
    const panel = state.panel;
    if (!panel) return;
    const master = panel.querySelector('[data-tle-fold-master]');
    if (master) master.checked = foldConfig.enabled;
    panel.querySelectorAll('[data-tle-fold-option]').forEach(input => {
      const key = input.dataset.tleFoldOption;
      input.checked = foldConfig.options[key] === true;
      input.disabled = !foldConfig.enabled;
    });
  }
  function foldTarget(key) {
    const doc = HOST_DOC;
    const selectors = {
      'user-theme-toggles': '#UI-Theme-Block [name=\"themeToggles\"]',
      'user-character': '[name=\"CharacterHandlingToggles\"]',
      'user-misc': '[name=\"MiscellaneousToggles\"]',
      'user-chat': '[name=\"ChatMessageHandlingToggles\"]',
    };
    return doc.querySelector(selectors[key]) || null;
  }
  function makeNativeFold(key, target) {
    if (!target?.parentElement || target.closest('[data-tle-fold-wrapper]')) return;
    if (target.classList.contains('inline-drawer')) return;

    const previousHeading = target.previousElementSibling?.matches('h4')
      ? target.previousElementSibling : null;
    const headingText = previousHeading?.innerText?.trim() || FOLD_LABELS[key];
    const wrapper = HOST_DOC.createElement('div');
    wrapper.className = 'inline-drawer wide100p flexFlowColumn';
    wrapper.dataset.tleFoldWrapper = key;
    const header = HOST_DOC.createElement('div');
    header.className = 'inline-drawer-toggle inline-drawer-header interactable';
    header.tabIndex = 0;
    header.setAttribute('role', 'button');
    header.setAttribute('aria-expanded', 'false');
    const title = HOST_DOC.createElement('b');
    title.textContent = headingText;
    const icon = HOST_DOC.createElement('div');
    icon.className = 'fa-solid fa-circle-chevron-down inline-drawer-icon down interactable';
    icon.setAttribute('aria-hidden', 'true');
    header.append(title, icon);
    const content = HOST_DOC.createElement('div');
    content.className = 'inline-drawer-content';

    const parent = target.parentElement;
    parent.insertBefore(wrapper, previousHeading || target);
    wrapper.append(header, content);
    if (previousHeading) previousHeading.remove();
    content.appendChild(target);
    foldRecords.set(key, { wrapper, target, parent, previousHeading, headingText });
  }
  // Both hosts keep these controls beside the native name/postfix drawers.
  // #SystemPromptColumn belongs to Advanced Formatting; the prompt manager is
  // the prompt list. Neither is the parameter region below Continue Postfix.
  const PRESET_OPTION_IDS = [
    'continue_prefill', 'squash_system_messages', 'use_sysprompt', 'claude_fast_mode',
    'openai_enable_web_search', 'openai_function_calling', 'tool_reasoning_mode',
    'openai_media_inlining', 'openai_request_images', 'openai_show_thoughts',
    'openai_reasoning_effort', 'openai_verbosity',
  ];
  const PRESET_OPTION_SELECTOR = PRESET_OPTION_IDS.map(id => '#' + id).join(',');

  function presetOptionBlocks() {
    const root = HOST_DOC.querySelector('#left-nav-panel #openai_settings');
    if (!root) return [];
    const blocks = new Set();
    for (const control of root.querySelectorAll(PRESET_OPTION_SELECTOR)) {
      // TT identifies the whole parameter (including its description) explicitly.
      // ST uses range-block, except the effort/verbosity select rows.
      // Prefer the semantic outer block over nested flex rows (notably
      // Interleaved Thinking, whose help text is outside its select row).
      const block = control.closest('.tt-gp-block') || control.closest('.range-block') ||
        control.closest('.flexFlowColumn');
      if (!block || block === root || !root.contains(block)) continue;
      // Never accidentally hide a whole settings ancestor after a DOM change.
      if (block.querySelector('#continue_postfix, #names_behavior, #completion_prompt_manager')) continue;
      blocks.add(block);
    }
    return [...blocks];
  }

  function syncPresetOptionsFold(key) {
    const blocks = presetOptionBlocks();
    let record = foldRecords.get(key);
    if (!blocks.length) {
      removeNativeFold(key);
      return;
    }
    if (!record) {
      const header = HOST_DOC.createElement('div');
      header.className = 'inline-drawer-toggle inline-drawer-header interactable';
      header.setAttribute('role', 'button');
      header.tabIndex = 0;
      header.dataset.tlePresetFoldHeader = key;
      const title = HOST_DOC.createElement('b');
      title.textContent = FOLD_LABELS[key];
      const icon = HOST_DOC.createElement('div');
      icon.setAttribute('aria-hidden', 'true');
      header.append(title, icon);
      record = { presetOptions: true, header, icon, blocks: new Set(), expanded: false };
      foldRecords.set(key, record);
      // Preserve the native theme hooks; own only this in-place fold's events.
      header.addEventListener('click', event => {
        event.stopImmediatePropagation();
        record.expanded = !record.expanded;
        syncPresetOptionsFold(key);
      }, { capture: true, signal: state.abort.signal });
      header.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) header.click();
      }, { signal: state.abort.signal });
    }
    const nextBlocks = new Set(blocks);
    for (const block of record.blocks) {
      if (!nextBlocks.has(block)) block.removeAttribute('data-tle-preset-folded');
    }
    record.blocks = nextBlocks;
    // Reattach on lazy mount/replacement and follow TT's current parameter order.
    const first = blocks[0];
    if (record.header.nextElementSibling !== first) first.before(record.header);
    record.header.setAttribute('aria-expanded', String(record.expanded));
    record.header.title = record.expanded ? '收起模型与请求选项，防止误触' : '展开模型与请求选项';
    record.icon.className = 'fa-solid inline-drawer-icon interactable ' + (record.expanded ? 'fa-circle-chevron-up up' : 'fa-circle-chevron-down down');
    for (const block of blocks) {
      // Only our own attribute changes. Native hidden/style/class and all values
      // remain intact, including TT inactive parameters and data-source filters.
      block.toggleAttribute('data-tle-preset-folded', !record.expanded);
    }
  }

  function removeNativeFold(key) {
    const record = foldRecords.get(key);
    if (!record) return;
    if (record.presetOptions) {
      for (const block of record.blocks) block.removeAttribute('data-tle-preset-folded');
      record.header.remove();
      foldRecords.delete(key);
      return;
    }
    const { wrapper, target, previousHeading } = record;
    if (wrapper.parentNode && wrapper.contains(target)) {
      wrapper.before(target);
      if (previousHeading) target.before(previousHeading);
      wrapper.remove();
    }
    foldRecords.delete(key);
  }
  function applyOptionalFolds() {
    if (state.destroyed) return;
    for (const key of Object.keys(FOLD_LABELS)) {
      const shouldFold = foldConfig.enabled && foldConfig.options[key];
      if (!shouldFold) {
        removeNativeFold(key);
        continue;
      }
      if (key === 'preset-model-settings') {
        syncPresetOptionsFold(key);
        continue;
      }
      if (foldRecords.has(key)) continue;

      const target = foldTarget(key);
      if (target) makeNativeFold(key, target);
    }
  }
  function setFoldConfig(enabled, key, value) {
    if (typeof key === 'string' && key in foldConfig.options) foldConfig.options[key] = Boolean(value);
    if (typeof enabled === 'boolean') foldConfig.enabled = enabled;
    saveFoldConfig();
    syncFoldSettingsUI();
    applyOptionalFolds();
  }

  function compatibilitySectionMarkup() {
    return `
      <section class="tle-section" id="${ID.compatibilitySection}">
        <div class="inline-drawer">
          <div class="inline-drawer-toggle inline-drawer-header interactable" tabindex="0" role="button" aria-expanded="false">
            <b>兼容性修复</b>
            <div class="fa-solid fa-circle-chevron-down inline-drawer-icon down interactable" aria-hidden="true"></div>
          </div>
          <div class="inline-drawer-content">
            <p class="tle-muted">仅在遇到主题修改 TLE / 酒馆原生层级、面板透明或侧边栏文字看不清时启用。默认全部关闭，正常主题不会受到这些修复规则影响。</p>
            <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:10px;">
              <input type="checkbox" data-tle-setting="compat-layer-repair">
              <span>恢复酒馆 / TLE 标准层级</span>
            </label>
            <p class="tle-muted">强制恢复：#left-nav-panel / .fillRight = 3000；#top-bar / #top-settings-holder = 3005；TLE 引擎面板 = 3006；普通 .drawer-content.openDrawer / .popup = auto；补全管理器 = 3010。</p>
            <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:12px;">
              <input type="checkbox" data-tle-setting="compat-nav-repair">
              <span>修复侧边导航按钮宽度与图标可见性</span>
            </label>
            <p class="tle-muted">默认关闭，仅用于图标被主题隐藏、拉宽或点击区域错位的情况。正常主题不要开启：此修复会强制调整按钮与图标尺寸，可能造成图文错位。关闭后不干预主题原有透明度。</p>
            <div class="tle-info-width-setting" data-tle-compat-nav-opacity hidden>
              <label for="tle-nav-icon-opacity">恢复导航图标透明度</label>
              <output data-tle-nav-icon-opacity-value>${Math.round(navIconOpacity * 100)}%</output>
              <input id="tle-nav-icon-opacity" type="range" min="0.4" max="1" step="0.05" value="${navIconOpacity}" aria-label="导航图标兼容修复透明度">
              <small>仅在本项兼容修复开启后生效。默认 70%，可调 40%–100%，实时预览；不会改变主题贴图。</small>
            </div>
            <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:12px;">
              <input type="checkbox" data-tle-setting="compat-structure-repair">
              <span>修复聊天区 / 底栏绝对定位冲突</span>
            </label>
            <p class="tle-muted">仅在主题将 #chat 或 #form_sheld 设为 absolute / fixed，导致聊天区脱离 Flex 布局或底栏跑位时启用。恢复两个核心容器的正常布局流；不扫描主题 CSS，不修改消息内部定位、背景、毛玻璃、Mask 或渐隐效果。默认关闭，不写入长期设置；切换 UI 主题时自动关闭。</p>
            <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:12px;">
              <input type="checkbox" data-tle-setting="compat-panel-bg">
              <span>修复 TLE 面板透明背景</span>
            </label>
            <p class="tle-muted">只处理 TLE 自己的侧边导航和引擎面板。开启后才会覆盖背景色，不影响正常主题的原有配色。</p>
            <div class="tle-info-width-setting" style="margin-top:10px;">
              <label for="tle-compat-panel-bg-mode">背景颜色来源</label>
              <select class="tle-section-select" id="tle-compat-panel-bg-mode" data-tle-setting="compat-panel-bg-mode">
                <option value="smart">SmartThemeBlurTintColor（实色）</option>
                <option value="custom">自定义颜色</option>
              </select>
            </div>
            <div data-tle-compat-custom-color hidden style="margin-top:10px;">
              <label for="tle-compat-panel-bg-color">自定义面板颜色</label>
              <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
                <input id="tle-compat-panel-bg-color" type="color" data-tle-setting="compat-panel-bg-color" value="${compatibilityPanelBackgroundColor}" aria-label="自定义面板颜色">
                <input type="text" class="text_pole" data-tle-setting="compat-panel-bg-hex" value="${compatibilityPanelBackgroundColor}" maxlength="7" inputmode="text" spellcheck="false" aria-label="自定义面板颜色 HEX">
              </div>
              <small class="tle-muted">支持 #RRGGBB。颜色只在“修复 TLE 面板透明背景”开启且来源选择“自定义颜色”时生效。</small>
            </div>
            <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:12px;">
              <input type="checkbox" data-tle-setting="compat-nav-text">
              <span>自定义侧边栏文字颜色</span>
            </label>
            <p class="tle-muted">仅覆盖侧边栏问候语、导航名称、信息站和引擎入口文字，以及 TLE 自己的栏内按钮。不会修改原生导航图标、聊天正文或其他面板。关闭即恢复主题颜色。</p>
            <div data-tle-compat-nav-text-fields hidden>
              <label for="tle-compat-nav-text-color">文字颜色</label>
              <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
                <input id="tle-compat-nav-text-color" type="color" data-tle-setting="compat-nav-text-color" value="${compatibilityNavTextColor}" aria-label="侧边栏文字颜色">
                <input class="text_pole" type="text" data-tle-setting="compat-nav-text-hex" maxlength="7" value="${compatibilityNavTextColor}" spellcheck="false" aria-label="侧边栏文字颜色 HEX">
              </div>
              <small class="tle-muted">支持 #RRGGBB，实时生效。深色背景可先尝试 #FFFFFF；设置跨刷新保留。</small>
            </div>
          </div>
        </div>
      </section>`;
  }

  function ensureCompatibilitySection(panel) {
    if (!panel || panel.querySelector('#' + ID.compatibilitySection)) return;
    const diagnosticSection = [...panel.querySelectorAll('.tle-section')].find(section =>
      section.querySelector('[data-tle-setting="diagnostic-mode"]'));
    diagnosticSection?.insertAdjacentHTML('beforebegin', compatibilitySectionMarkup());
  }

// TLE 可选功能包 · 正式版。仅安装经 SHA-256 校验的独立脚本。
  // 不直接执行下载源码，不替换用户全局脚本树，不修改同名/同 ID 的已有源码。
  const OPTIONAL_PACKAGE_ID = 'd354e7f5-1719-4942-a63d-71f6db16c059';
  const OPTIONAL_PACKAGE_NAME = '🎨 主题壁纸绑定 (终极存储版) · 原生图库多选 v4.1';
  const OPTIONAL_REPO = 'jerinmiss620-web/Tavern-Layout-Engine';
  const OPTIONAL_MANIFEST_URLS = [
    { label: 'GitHub Raw · 正式清单', url: 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/refs/heads/main/optional-modules/manifest.json' },
    { label: 'GitHub Raw · 固定快照', url: 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/46fbe9010fdccd9911bccc35be25a588bf07740f/optional-modules/manifest.json' },
    { label: 'jsDelivr · 固定快照', url: 'https://cdn.jsdelivr.net/gh/jerinmiss620-web/Tavern-Layout-Engine@46fbe9010fdccd9911bccc35be25a588bf07740f/optional-modules/manifest.json' },
    { label: 'Fastly · 固定快照', url: 'https://fastly.jsdelivr.net/gh/jerinmiss620-web/Tavern-Layout-Engine@46fbe9010fdccd9911bccc35be25a588bf07740f/optional-modules/manifest.json' },
  ];
  const OPTIONAL_RUNTIME = { busy: false, source: '', lastError: '', status: '', controller: null };
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


  // 可选功能包展示协议 v1：两个独立包共用卡片、元信息及说明弹窗的渲染器。
  // 新增功能包时必须完整提供：名称、具体能力短句、版本、原作者、入口、
  // 核心功能分组、使用步骤、注意事项。安装/下载逻辑仍按目标 UUID 独立处理。
  const OPTIONAL_DISPLAY = Object.freeze({
    wallpaper: {
      name: '🎨 主题绑定壁纸',
      summary: '主题绑定壁纸／多图随机切换／跨文件夹选图／配套侠联动',
      version: 'v4.1',
      author: '小松鼠 & Gemini',
      entry: '酒馆原生「背景」面板 → 顶部工具栏 → 主题壁纸绑定管理器',
      intro: '给不同 UI 主题保存各自的壁纸。切换主题时，从已绑定的原生图库图片中自动选择背景。',
      features: [
        { title: '主题壁纸绑定', items: [
          '每个 UI 主题可以绑定一张或多张背景图片；切换到对应主题时，从已绑定图片中随机选择。',
          '不需要为每位角色重复设置壁纸，图片来自酒馆原生背景图库。'
        ]},
        { title: '原生图库选图', items: [
          '通过「看图多选」在原生图库勾选图片，支持跨文件夹继续挑选、批量追加与解绑。',
          '管理面板提供主题搜索、重复图片过滤；选图时不会立即应用壁纸。'
        ]},
        { title: '配置保存与联动', items: [
          '绑定信息保存到全局变量；脚本暂停或版本更新不会主动清空记录。',
          '配套侠切换 UI 主题后，本脚本可让背景跟随对应主题变化。'
        ]}
      ],
      steps: [
        '在 TLE →「可选功能包」找到此脚本，点击「安装并启用」；已安装时只需启用。首次安装后刷新酒馆。',
        '进入酒馆原生「背景」面板，点击顶部工具栏「🎨 主题壁纸绑定管理器」。',
        '选择需要绑定壁纸的 UI 主题，也可使用搜索查找主题，然后点击「看图多选」。',
        '在原生图库中勾选图片；可以更换文件夹继续选，勾选不代表立即更换当前背景。',
        '点击底部「返回并追加」，回到管理面板后再点击「💾 保存设置」。',
        '以后手动切换该 UI 主题，或让配套侠切换主题，已绑定的壁纸就会跟随。'
      ],
      notes: [
        '需先在酒馆原生背景图库里准备可用图片；聊天独立背景锁定可能覆盖全局背景。',
        '停用或卸载脚本不会主动删除原生图片和绑定信息；需要清除绑定请在原脚本中操作。',
        'TLE 只管理此独立脚本的安装与启停；网络下载先经过来源、文件大小与 SHA-256 校验。'
      ]
    },
    override: {
      name: '🔤 Freesia 覆盖侠',
      summary: '气泡居中／自定义字体／行高与字间距／滚动条宽度／头像定位',
      version: 'v1.88.6',
      author: '小松鼠 & ChatGPT（小松7）',
      entry: '酒馆底栏 → 扩展菜单（魔法棒）→ Freesia 覆盖侠',
      intro: '独立的主题调校工具：可以边看聊天边调整布局和字体。不想修改主题 CSS，也能仅开启实时使用。',
      features: [
        { title: '气泡居中与留白测算', items: [
          '通过滑块调整聊天消息正文的左右留白，观察气泡/正文的居中效果，并按需选择测算范围。',
          '开启测算时，最多为当前可见的 3 条消息显示边界辅助线；退出测算后不持续绘制辅助线。'
        ]},
        { title: '自定义字体与字体库', items: [
          '可切换现有字体预设、添加在线字体方案，也可上传 WOFF2、WOFF、TTF、OTF 字体本体。',
          '支持字体预览、实时使用、方案管理与删除。本地上传字体保存到当前设备的 IndexedDB。'
        ]},
        { title: '正文排版与字体比例', items: [
          '分别调节正文行高、文字字间距、段落首行缩进（跟随主题或 2em），支持实时预览与常驻使用。',
          '字体比例直接联动酒馆「用户设置」里的原生数值，在 iPhone TT 已可调节；字体比例不写入主题 CSS。'
        ]},
        { title: '滚动条与头像定位', items: [
          '调整聊天滚动条宽度、全局滚动条宽度和 scrollbar-gutter 的留位方式。',
          '分别调节 Char 与 User 头像的位置，便于适配不同主题排版。'
        ]},
        { title: '实时效果与 CSS 写入', items: [
          '点击「实时预览」可暂时查看效果，按钮会变为「取消预览」；点击「实时使用」后可常驻，按钮会变为「取消使用」。',
          '字体、排版、留白、滚动条、头像可分别管理实时效果；不写入 CSS 也能使用。',
          '需要固化到主题时，再单独使用 CSS 写入及撤销功能；最小化面板后仍可观察聊天布局。'
        ]}
      ],
      steps: [
        '在 TLE →「可选功能包」中安装并启用覆盖侠；首次安装后刷新酒馆。',
        '打开酒馆底栏扩展菜单（魔法棒），点击「Freesia 覆盖侠」。',
        '在对应区域调整气泡留白、字体、行高、字间距、滚动条宽度或头像位置。',
        '先点「实时预览」观察效果；要退出预览，点同一个按钮上的「取消预览」。',
        '要让效果持续生效，点「实时使用」；不再需要时点「取消使用」。',
        '如果是主题作者，再按需要使用独立的「写入主题 CSS」及撤销操作；字体比例始终通过酒馆原生设置同步。'
      ],
      notes: [
        '覆盖侠是独立脚本，TLE 不提供它的调校界面；入口始终位于底栏扩展菜单。',
        '本地字体只在当前浏览器或 TT 的本地库中保存，PC、Android 和 iPhone 不会自动互相同步。',
        '停用/卸载不会主动清空已写入的主题 CSS 或已导入的字体文件。',
        '部分字形数据异常的字体可能被浏览器拒绝解析；全局滚动条宽度/Gutter 可能影响其他可滚动面板。'
      ]
    }
  });
  function optionalEscapeText(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }
  function optionalCardMarkup(kind) {
    const data = OPTIONAL_DISPLAY[kind];
    if (!data) throw new Error('未知可选功能包的展示配置');
    const esc = optionalEscapeText;
    const extra = kind === 'override' ? ' data-tle-optional-override' : '';
    return [
      '<section class="tle-optional-card"' + extra + '>',
      '<div class="tle-optional-heading">',
        '<div class="tle-optional-heading-copy">',
          '<strong>' + esc(data.name) + '</strong>',
          '<small class="tle-muted tle-optional-summary">' + esc(data.summary) + '</small>',
          '<small class="tle-muted tle-optional-meta">版本：' + esc(data.version) + ' · 作者：' + esc(data.author) + '</small>',
          '<small class="tle-muted tle-optional-entry">入口：' + esc(data.entry) + '</small>',
        '</div>',
        '<button type="button" class="menu_button tle-optional-more" data-tle-optional-action="details" aria-label="更多：查看' + esc(data.name) + '完整介绍和使用方式" title="更多 · 功能与使用说明"><span aria-hidden="true">···</span></button>',
      '</div>',
      '<p class="tle-muted" data-tle-optional-status aria-live="polite">正在检查酒馆助手脚本库…</p>',
      '<div class="tle-optional-actions">',
        '<button type="button" class="menu_button" data-tle-optional-action="install">安装并启用</button>',
        '<button type="button" class="menu_button" data-tle-optional-action="enable" hidden>启用</button>',
        '<button type="button" class="menu_button" data-tle-optional-action="disable" hidden>停用</button>',
        '<button type="button" class="menu_button" data-tle-optional-action="remove" hidden>卸载脚本</button>',
        '<button type="button" class="menu_button" data-tle-optional-action="refresh">刷新状态</button>',
      '</div>',
      '</section>'
    ].join('');
  }
  function optionalDetailsRender(kind, trigger) {
    const data = OPTIONAL_DISPLAY[kind];
    if (!data) throw new Error('未知可选功能包的说明配置');
    const popup = makeQuickPanel(data.name + ' · 功能与使用说明', trigger, 'optional-details');
    const body = quickNode('div', 'tle-optional-detail-content');
    body.append(
      quickNode('p', '', data.intro),
      quickNode('p', 'tle-muted', '版本：' + data.version + ' · 作者：' + data.author),
      quickNode('p', 'tle-muted', '入口：' + data.entry),
      quickNode('strong', 'tle-optional-detail-title', '主要功能')
    );
    const addSection = (heading, values, numbered = false) => {
      const group = quickNode('section', 'tle-optional-detail-section');
      group.append(quickNode('strong', '', heading));
      const list = quickNode(numbered ? 'ol' : 'ul');
      for (const value of values) list.append(quickNode('li', '', value));
      group.append(list);
      body.append(group);
    };
    for (const feature of data.features) addSection(feature.title, feature.items);
    addSection('使用方法', data.steps, true);
    addSection('注意事项', data.notes);
    popup.body.append(body);
  }

  function optionalOpenDetails(trigger) { optionalDetailsRender('wallpaper', trigger); }
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
  async function optionalTrySources(sources, validate, report = optionalSetStatus) {
    const errors = [];
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      if (state.destroyed) throw new Error('TLE 已退出');
      const control = new HOST_WIN.AbortController();
      OPTIONAL_RUNTIME.controller = control;
      const timeout = HOST_WIN.setTimeout(() => control.abort(), 8000);
      report('正在下载（' + (i + 1) + '/' + sources.length + '）：' + src.label);
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
        if (OPTIONAL_RUNTIME.controller === control) OPTIONAL_RUNTIME.controller = null;
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
        if (state.destroyed) throw new Error('TLE 已关闭，取消导入');
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
  function optionalCleanup() {
    try { OPTIONAL_RUNTIME.controller?.abort?.(); } catch {}
    OPTIONAL_RUNTIME.controller = null;
  }


  // Optional package #2: Freesia Override; it remains an independently managed script.
  const OVERRIDE_PKG = {
    key:'freesia-override', id:'66c0243c-e963-48a3-a960-ed641bbb332e',
    name:'Freesia 覆盖侠 v1.88.6', filename:'freesia-override-v1.88.6.json',
  };
  function overrideCard() { return state.panel?.querySelector('[data-tle-optional-override]'); }
  function overrideStatus(message) {
    const el = overrideCard()?.querySelector('[data-tle-optional-status]');
    if (el) el.textContent = String(message);
  }
  function overrideFind(trees) {
    const ids=[],names=[];
    optionalWalk(trees,item=>{
      if(item.id===OVERRIDE_PKG.id)ids.push(item);
      else if(item.name===OVERRIDE_PKG.name)names.push(item);
    });
    return {ids,names};
  }
  function overrideRefresh() {
    const card=overrideCard(); if(!card)return;
    let mode='unavailable', desc='酒馆助手全局脚本管理接口不可用';
    const bridge=optionalBridge();
    if(bridge)try{
      const trees=bridge.read({type:'global'});
      if(!Array.isArray(trees))throw Error('无法读取全局脚本库');
      const x=overrideFind(trees);
      if(x.ids.length>1||x.names.length){mode='collision';desc='脚本 ID 或名称冲突，请手动处理';}
      else if(x.ids.length===1){mode=x.ids[0].enabled?'enabled':'disabled';desc=x.ids[0].enabled?'已安装并启用':'已安装但未启用';}
      else{mode='uninstalled';desc='尚未安装 · 安装后从底栏扩展菜单打开';}
    }catch(err){desc='读取脚本库失败：'+(err?.message||err);}
    for(const action of ['install','enable','disable','remove']){
      const el=card.querySelector('[data-tle-optional-action="'+action+'"]');
      if(!el)continue;
      el.hidden=action==='install'?mode!=='uninstalled':action==='enable'?mode!=='disabled':action==='disable'?mode!=='enabled':!['enabled','disabled'].includes(mode);
      el.disabled=OPTIONAL_RUNTIME.busy;
    }
    if(!OPTIONAL_RUNTIME.busy)overrideStatus(desc);
  }
  function overrideAllowed(url) {
    try{
      const u=new URL(url),p=u.pathname.split('/');
      if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||p.length!==7)return false;
      const raw=u.hostname==='raw.githubusercontent.com'&&p[1]==='jerinmiss620-web'&&p[2]==='Tavern-Layout-Engine'&&/^[a-f0-9]{40}$/.test(p[3]);
      const cdn=['cdn.jsdelivr.net','fastly.jsdelivr.net','testingcf.jsdelivr.net'].includes(u.hostname)&&p[1]==='gh'&&p[2]==='jerinmiss620-web'&&p[3].startsWith('Tavern-Layout-Engine@')&&/^[a-f0-9]{40}$/.test(p[3].slice(21));
      return (raw||cdn)&&p[4]==='optional-modules'&&p[5]==='freesia-override'&&p[6]===OVERRIDE_PKG.filename;
    }catch{return false;}
  }
  async function overrideGetPackage() {
    const pkg=await optionalTrySources(OPTIONAL_MANIFEST_URLS,async txt=>{
      const manifest=JSON.parse(txt),item=manifest?.packages?.find(p=>p.key===OVERRIDE_PKG.key);
      if(manifest?.schema!==1||!item||item.script_id!==OVERRIDE_PKG.id||item.filename!==OVERRIDE_PKG.filename||
        !/^[a-f0-9]{64}$/.test(item.sha256||'')||!Number.isInteger(item.size_bytes)||item.size_bytes<10000||item.size_bytes>400000||
        !Array.isArray(item.sources)||item.sources.length<2||item.sources.some(s=>!s?.label||!overrideAllowed(s.url)))
        throw Error('功能包清单不合法或下载地址不受信任');
      return item;
    },overrideStatus);
    return optionalTrySources(pkg.sources,async txt=>{
      const bytes=optionalUtf8(txt);
      if(bytes.length!==pkg.size_bytes)throw Error('文件字节大小不符');
      if(await optionalSha256(bytes)!==pkg.sha256)throw Error('SHA-256 校验失败');
      const file=JSON.parse(txt);
      if(file.type!=='script'||file.id!==OVERRIDE_PKG.id||file.name!==OVERRIDE_PKG.name||
        typeof file.content!=='string'||!file.button||!file.data||!file.export_with)
        throw Error('文件不是预期的覆盖侠脚本');
      return file;
    },overrideStatus);
  }
  async function overrideChange(action) {
    if(OPTIONAL_RUNTIME.busy)return;
    const bridge=optionalBridge();
    if(!bridge){overrideStatus('找不到酒馆助手脚本管理接口');return;}
    if(action==='remove'&&!HOST_WIN.confirm('确认卸载覆盖侠？保存的字体、主题 CSS 不会主动清除。'))return;
    OPTIONAL_RUNTIME.busy=true;overrideRefresh();
    try{
      const trees=await Promise.resolve(bridge.read({type:'global'}));
      if(!Array.isArray(trees))throw Error('无法读取全局脚本库');
      const m=overrideFind(trees);
      if(m.ids.length>1||m.names.length)throw Error('存在脚本 ID 或名称冲突');
      if(action==='install'){
        if(m.ids.length)throw Error('脚本已安装，不会重复导入');
        const file=await overrideGetPackage();
        if(state.destroyed)throw Error('TLE 已关闭，终止安装');
        await Promise.resolve(bridge.write(existing=>{
          const m=overrideFind(existing);
          if(m.ids.length||m.names.length)throw Error('发现重复脚本，不会覆盖');
          return [...existing,{...file,enabled:true}];
        },{type:'global'}));
      }else{
        if(m.ids.length!==1)throw Error('没有检测到覆盖侠');
        let count=0;
        const rewrite=items=>items.flatMap(item=>{
          if(item?.type==='script'&&item.id===OVERRIDE_PKG.id){count++;return action==='remove'?[]:[{...item,enabled:action==='enable'}];}
          if(item?.type==='folder'&&Array.isArray(item.scripts))return [{...item,scripts:rewrite(item.scripts)}];
          return [item];
        });
        await Promise.resolve(bridge.write(existing=>{
          const result=rewrite(existing);
          if(count!==1)throw Error('脚本 ID 不唯一，操作取消');
          return result;
        },{type:'global'}));
      }
      const after=overrideFind(await Promise.resolve(bridge.read({type:'global'}))).ids;
      if(action==='remove'?after.length!==0:after.length!==1||after[0].enabled!==(action!=='disable'))
        throw Error('未确认最终状态，请在脚本列表中核对');
      if(action==='remove'||action==='disable')try{HOST_WIN.__FreesiaOverrideRuntime?.cleanup?.();}catch{}
      overrideStatus('覆盖侠已'+({install:'安装并启用',enable:'启用',disable:'停用',remove:'卸载'}[action])+'，刷新酒馆后可确认运行状态。');
      HOST_WIN.toastr?.success?.('覆盖侠操作成功','TLE 可选功能');
    }catch(err){overrideStatus('操作未完成：'+(err?.message||err));HOST_WIN.toastr?.error?.(err?.message||String(err),'TLE 可选功能');console.warn('[TLE 功能包·覆盖侠]',err);}
    finally{OPTIONAL_RUNTIME.busy=false;overrideRefresh();optionalRefreshUI();}
  }
  function overrideDetails(trigger) { optionalDetailsRender('override', trigger); }

  function createPanel() {
    let panel = HOST_DOC.getElementById(ID.panel);
    if (panel) {
      state.panel = panel;
      panel.querySelectorAll('[data-tle-chat-action-settings], .tle-chat-action-settings, .tle-chat-action-setting').forEach(node => node.remove());
      ensureCompatibilitySection(panel);
      return panel;
    }

    panel = HOST_DOC.createElement('section');
    panel.id = ID.panel;
    panel.className = 'drawer-content';
    panel.setAttribute('aria-label', 'Tavern Layout Engine 控制面板');
    panel.dataset.open = 'false';
    panel.innerHTML = `
      <header class="tle-header">
        <div>
          <h2 class="tle-title">Tavern Layout Engine</h2>
          <small class="tle-muted tle-author-credit">作者：小松鼠 &amp; ChatGPT（小松7）</small>
        </div>
      </header>
      <section class="tle-section" data-tle-update-details>
        <div class="inline-drawer">
          <div class="inline-drawer-toggle inline-drawer-header interactable" tabindex="0" role="button" aria-expanded="false">
            <span class="tle-update-heading">
              <b>版本与更新</b>
              <span class="tle-update-summary" data-tle-update-summary>v0.3.221 · TT 滑屏与原生手势同步修复</span>
              <span class="tle-update-alert" data-tle-update-alert hidden>可更新</span>
            </span>
            <div class="fa-solid fa-circle-chevron-down inline-drawer-icon down interactable" aria-hidden="true"></div>
          </div>
          <div class="inline-drawer-content" style="display:none;">
            <div class="tle-update-content">
          <div class="tle-row"><span>当前版本</span><strong data-tle-runtime-version>v0.3.221</strong></div>
          <div class="tle-row"><span>远程版本</span><span data-tle-available-version>等待检查</span></div>
          <div class="tle-row"><span>更新通道</span><span data-tle-update-channel>正在连接 Loader</span></div>
          <div class="tle-row"><span>Loader 最新版本</span><span data-tle-loader-available-version>等待检查</span></div>
          <label class="tle-row tle-update-toggle">
            <span>自动安装更新（默认开启）</span>
            <input type="checkbox" data-tle-setting="auto-update" checked>
          </label>
          <p class="tle-muted tle-update-policy" data-tle-update-policy>仅自动安装校验通过的正式版，失败时保留回滚；不支持时会明确提示。</p>
          <div class="tle-version-meta">
            <button type="button" class="tle-update-pill" data-tle-action="install-update" hidden>可更新</button>
            <button type="button" class="tle-update-check" data-tle-action="check-update" hidden>检查更新</button>
            <button type="button" class="tle-update-check" data-tle-action="adopt-loader" hidden>启用 Loader 接管</button>
            <button type="button" class="tle-update-check" data-tle-action="check-loader-update" hidden>检查 Loader 更新</button>
            <button type="button" class="tle-update-pill" data-tle-action="install-loader-update" hidden>更新 Loader</button>
          </div>
          <small class="tle-muted" data-tle-loader-status aria-live="polite">正在连接远程更新服务…</small>
            </div>
          </div>
        </div>
      </section>
      <section class="tle-section">
        <div class="tle-row"><strong>引擎状态</strong><span data-tle-status>核心已启动</span></div>
        <p class="tle-muted">预设双栏模块已接入：左侧保留原生参数设置，右侧承载原生提示词管理器。</p>
        <div class="tle-action-group">
          <button class="tle-action" type="button" data-tle-action="pause">暂停核心</button>
          <button class="tle-action" type="button" data-tle-action="emergency-restore">紧急恢复布局</button>
        </div>
        <p class="tle-muted">紧急恢复会撤销布局引擎搬运的 DOM、移除布局接管标记，并恢复酒馆原生抽屉的控制权。</p>
      </section>
      <section class="tle-section">
        <strong>导航交互</strong>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:10px;">
          <input type="checkbox" data-tle-setting="pc-hamburger">
          <span>PC 端启用汉堡式隐藏导航栏</span>
        </label>
        <p class="tle-muted">关闭时 PC 保持常驻侧边栏；开启后默认收起为左上角汉堡，点击展开所选导航方案。点击空白处或再次点击汉堡即可收起。手机端始终使用汉堡交互。</p>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:10px;">
          <input type="checkbox" data-tle-setting="nav-edge-swipe">
          <span data-tle-swipe-setting-label>滑动开关侧栏（自动关闭原生翻页）</span>
        </label>
        <p class="tle-muted">默认关闭。开启时自动关闭酒馆「用户设置」里的原生左右翻页手势；关闭时仅恢复 TLE 曾自动关闭的设置，回复切换箭头不受影响。支持在 PC 浏览器的移动设备模拟模式中使用模拟触摸测试展开/关闭侧栏（普通鼠标拖动不算触摸）；安卓真机可能与系统返回手势冲突，测试失败请关闭。PC 宽屏测试时需启用上方汉堡模式。</p>
        <small class="tle-muted" data-tle-native-gesture-status aria-live="polite" hidden></small>
      </section>
      <section class="tle-section">
        <div class="tle-select-heading">
          <strong>快捷聊天按钮</strong>
          <label class="tle-muted" for="tle-chat-shortcut-destination">点击后的目标</label>
        </div>
        <select class="tle-section-select" id="tle-chat-shortcut-destination" data-tle-setting="chat-shortcut-destination">
          <option value="chat">当前聊天界面（保留当前对话）</option>
          <option value="welcome">欢迎界面（关闭当前聊天）</option>
        </select>
        <p class="tle-muted">当前聊天模式只关闭抽屉和弹窗；欢迎界面模式会在关闭面板后调用酒馆原生「关闭聊天」操作。不会删除聊天记录。</p>
      </section>
      <section class="tle-section">
        <strong>聊天界面功能</strong>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:10px;">
          <input type="checkbox" data-tle-setting="chat-tools-enabled">
          <span>启用会话侠</span>
        </label>
        <p class="tle-muted">默认开启。关闭后隐藏聊天界面右上角的会话侠入口，并关闭已打开的面板；楼层侠和最近聊天功能一并停用。</p>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:12px;">
          <input type="checkbox" data-tle-setting="chat-quick-actions-enabled">
          <span>在会话侠标题栏显示聊天快捷操作</span>
        </label>
        <p class="tle-muted">默认开启。会话侠标题栏提供「新建聊天」「关闭聊天」「管理聊天文件」三个原生操作；可手动关闭，仅在聊天界面有效。</p>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:12px;">
          <input type="checkbox" data-tle-setting="scroll-bottom-enabled">
          <span>启用回底侠</span>
        </label>
        <p class="tle-muted">默认开启。离开最新消息位置时显示快速回到底部按钮；AI 回复期间也会显示状态提示。关闭后移除按钮并停止相关滚动与生成事件监听。</p>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:12px;">
          <input type="checkbox" data-tle-setting="chat-fade-enabled">
          <span>启用渐隐侠 · 上下透明渐隐</span>
        </label>
        <p class="tle-muted">默认关闭。开启后将 #bg1 壁纸镜像到 #chat 内部，保留消息原有毛玻璃，并对聊天区域进行上下透明渐隐；壁纸变化会自动同步。若当前主题的壁纸结构无法镜像，会保留开关状态但不强行启用遮罩。</p>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin:10px 0 0 24px;">
          <input type="checkbox" data-tle-setting="chat-fade-bottom-padding">
          <span>增加最新消息免遮挡留白（70px）</span>
        </label>
        <p class="tle-muted" style="margin-left:24px;">默认勾选。仅在渐隐侠开启时，为 #chat 增加 padding-block-end: 70px；取消勾选即可关闭这段额外留白。</p>
        <small class="tle-muted" data-tle-fade-status aria-live="polite">渐隐侠默认关闭。</small>
      </section>
      <section class="tle-section">
        <div class="tle-select-heading">
          <strong>导航栏样式</strong>
          <label class="tle-muted" for="tle-navigation-mode">显示模式</label>
        </div>
        <select class="tle-section-select" id="tle-navigation-mode" data-tle-setting="navigation-mode">
          <option value="icons">极简：仅图标</option>
          <option value="labels">标准：图标 + 文字</option>
          <option value="info">完整：图标 + 文字 + 信息站</option>
        </select>
        <p class="tle-muted">极简模式固定为窄侧栏。完整模式下，信息站由下方总开关和各项复选框控制。导航图标透明度按主题原样显示；仅在“兼容性修复”开启时才会覆盖。</p>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin:12px 0 4px;">
          <input type="checkbox" data-tle-setting="global-search">
          <span>启用整理侠导航入口（所有导航模式显示）</span>
        </label>
        <p class="tle-muted">整理侠现在是独立导航项：默认打开原全局搜索，也可切换到资源管理。搜索与资源整理共用同一个搜索框；关闭此选项会隐藏导航入口。</p>
        <div class="tle-info-width-setting">
          <label for="tle-info-nav-width">导航栏宽度（PC / 平板）</label>
          <output data-info-nav-width-value>${infoNavWidth}px</output>
          <input id="tle-info-nav-width" type="range" min="160" max="420" step="2" value="${infoNavWidth}">
          <small>标准和完整模式可调；≤480px 手机窄屏固定为 85dvw，右侧保留空白用于收起导航。</small>
        </div>
      </section>
      <section class="tle-section">
        <div class="inline-drawer">
          <div class="inline-drawer-toggle inline-drawer-header interactable" tabindex="0" role="button">
            <b>侧栏信息站设置</b>
            <div class="fa-solid fa-circle-chevron-down inline-drawer-icon down interactable" aria-hidden="true"></div>
          </div>
          <div class="inline-drawer-content">
            <label class="tle-row" style="justify-content:flex-start;gap:10px;margin:10px 0;">
              <input type="checkbox" data-tle-setting="info-enabled">
              <span>启用信息站</span>
            </label>
            <p class="tle-muted">只在完整模式显示。关闭或未选中任何内容时，分割线也不显示。</p>
            <div class="tle-info-settings" data-tle-info-settings></div>
            <p class="tle-muted">快切：点击信息打开居中选择弹窗；右侧箭头仍可跳转。分组整理与批量删除统一进入侧边导航栏「整理侠」。User 身份切换已移至导航顶部的 Hello 问候按钮。</p>
            <div class="tle-companion-actions">
              <button type="button" class="menu_button" data-tle-companion-open="new">配套侠 · 保存当前</button>
              <button type="button" class="menu_button" data-tle-companion-open="manage">配套侠 · 管理方案</button>
            </div>
          </div>
        </div>
      </section>
      <section class="tle-section" data-tle-optional-wallpaper>
        <div class="inline-drawer">
          <div class="inline-drawer-toggle inline-drawer-header interactable" tabindex="0" role="button">
            <b>可选功能包</b>
            <div class="fa-solid fa-circle-chevron-down inline-drawer-icon down interactable" aria-hidden="true"></div>
          </div>
          <div class="inline-drawer-content">
            <p class="tle-muted">按需下载独立脚本，安装到酒馆助手的全局脚本库。未安装的功能不会执行；安装后仍可在酒馆助手中独立管理。</p>
            ${optionalCardMarkup('wallpaper')}
            ${optionalCardMarkup('override')}
          </div>
        </div>
      </section>
      <section class="tle-section" data-tle-fold-settings>
        <div class="inline-drawer">
          <div class="inline-drawer-toggle inline-drawer-header interactable" tabindex="0" role="button">
            <b>折叠侠设置</b>
            <div class="fa-solid fa-circle-chevron-down inline-drawer-icon down interactable" aria-hidden="true"></div>
          </div>
          <div class="inline-drawer-content">
            <strong>原生区域折叠</strong>
            <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:10px;">
              <input type="checkbox" data-tle-fold-master>
              <span>启用折叠侠</span>
            </label>
            <p class="tle-muted">仅为勾选的区域增加酒馆原生折叠标题。默认全部关闭；不修改内部控件值、事件或设置逻辑。</p>
            <div class="tle-fold-options">
              <strong>用户设置</strong>
              <label class="tle-row"><input type="checkbox" data-tle-fold-option="user-theme-toggles">界面行为设置（19 项复选框）</label>
              <label class="tle-row"><input type="checkbox" data-tle-fold-option="user-character">角色处理</label>
              <label class="tle-row"><input type="checkbox" data-tle-fold-option="user-misc">杂项</label>
              <label class="tle-row"><input type="checkbox" data-tle-fold-option="user-chat">聊天/消息处理</label>
              <strong>对话补全预设</strong>
              <label class="tle-row"><input type="checkbox" data-tle-fold-option="preset-model-settings">模型与请求选项（续写预填充、思维链、推理强度等）</label>
            </div>
          </div>
        </div>
      </section>
      <section class="tle-section">
        <strong>布局模块</strong>
        <div class="tle-row"><span>预设双栏工作区</span><span data-tle-preset-status>等待预设面板</span></div>
        <div class="tle-row"><span>角色浏览 / 编辑双栏</span><span data-tle-character-status>等待角色面板</span></div>
      </section>
      <section class="tle-section">
        <strong>引擎体检仪</strong>
        <label class="tle-row" style="justify-content:flex-start;gap:10px;margin-top:10px;">
          <input type="checkbox" data-tle-setting="diagnostic-mode">
          <span>诊断模式（开启后显示悬浮诊断按钮）</span>
        </label>
        <p class="tle-muted">正常模式不显示悬浮按钮，也不监听页面运行错误。仅在诊断模式开启期间记录最近 30 条错误；关闭后立即停止监听并移除悬浮按钮。</p>
        <p class="tle-muted">悬浮按钮单击即可采集并复制完整报告。报告包含设备/宿主/视口、TLE 模块、斜杠命令接口、布局层级与近期错误；不会收集聊天正文、提示词、角色设定、表单内容或密钥。</p>
        <div class="tle-action-group">
          <button class="tle-action" type="button" data-tle-action="copy-diagnostic">复制诊断报告</button>
          <button class="tle-action" type="button" data-tle-action="open-debugger">打开调试台</button>
          <button class="tle-action" type="button" data-tle-action="clear-diagnostic-errors">清空错误记录</button>
        </div>
        <p class="tle-muted" data-tle-diagnostic-status aria-live="polite">错误记录仅保存在当前页面内存中，最多保留最近 30 条。</p>
      </section>
      <section class="tle-section">
        <strong>宿主环境</strong>
        <div class="tle-row"><span>iframe 宿主访问</span><span>已连接</span></div>
        <div class="tle-row"><span>主页面 document</span><span>已连接</span></div>
      </section>
      <footer class="tle-muted tle-author-credit" aria-label="TLE 作者署名"><small>小松鼠 &amp; ChatGPT（小松7） · Tavern Layout Engine</small></footer>
    `;
    // The control panel owns its lifecycle; native TT drawers may be parked.
    HOST_DOC.body.appendChild(panel);
    state.panel = panel;
    ensureCompatibilitySection(panel);
    const pcHamburgerInput = panel.querySelector('[data-tle-setting="pc-hamburger"]');
    if (pcHamburgerInput) pcHamburgerInput.checked = pcHamburgerEnabled;
    const edgeSwipeInput = panel.querySelector('[data-tle-setting="nav-edge-swipe"]');
    if (edgeSwipeInput) {
      edgeSwipeInput.checked = navEdgeSwipeEnabled;
      edgeSwipeInput.disabled = false;
      edgeSwipeInput.title = isAndroidHost()
        ? '安卓实验功能：可能与系统返回、系统导航冲突'
        : (!supportsTouchNavSwipe()
            ? 'PC 可用移动设备模拟模式发送 touch 事件测试；普通鼠标拖动不触发'
            : '');
    }
    const chatShortcutDestinationInput = panel.querySelector('[data-tle-setting="chat-shortcut-destination"]');
    if (chatShortcutDestinationInput) chatShortcutDestinationInput.value = chatShortcutDestination;
    const chatToolsEnabledInput = panel.querySelector('[data-tle-setting="chat-tools-enabled"]');
    if (chatToolsEnabledInput) chatToolsEnabledInput.checked = chatToolsEnabled;
    const chatQuickActionsEnabledInput = panel.querySelector('[data-tle-setting="chat-quick-actions-enabled"]');
    if (chatQuickActionsEnabledInput) chatQuickActionsEnabledInput.checked = chatQuickActionsEnabled;
    const chatFadeEnabledInput = panel.querySelector('[data-tle-setting="chat-fade-enabled"]');
    if (chatFadeEnabledInput) chatFadeEnabledInput.checked = chatFadeEnabled;
    const scrollBottomEnabledInput = panel.querySelector('[data-tle-setting="scroll-bottom-enabled"]');
    if (scrollBottomEnabledInput) scrollBottomEnabledInput.checked = scrollBottomEnabled;
    const chatFadeBottomPaddingInput = panel.querySelector('[data-tle-setting="chat-fade-bottom-padding"]');
    if (chatFadeBottomPaddingInput) chatFadeBottomPaddingInput.checked = chatFadeBottomPaddingEnabled;
    const modeInput = panel.querySelector('[data-tle-setting="navigation-mode"]');
    if (modeInput) modeInput.value = navigationMode;
    applyNavIconOpacity();
    const infoInput = panel.querySelector('[data-tle-setting="info-enabled"]');
    if (infoInput) infoInput.checked = infoEnabled;
    const diagnosticModeInput = panel.querySelector('[data-tle-setting="diagnostic-mode"]');
    if (diagnosticModeInput) diagnosticModeInput.checked = diagnosticMode;
    const globalSearchInput = panel.querySelector('[data-tle-setting="global-search"]');
    if (globalSearchInput) globalSearchInput.checked = globalSearchEnabled;
    renderInfoSettings();
    optionalRefreshUI();
    overrideRefresh();
    syncFoldSettingsUI();
    applyOptionalFolds();
    applyInfoNavWidth();
    applyGlobalSearchAvailability();
    applyEngineHubMode();
    return panel;
  }

  function isMobileViewport() {
    return HOST_WIN.matchMedia('(max-width: 1000px)').matches;
  }

  function supportsHamburgerNavigation() {
    return isMobileViewport() || pcHamburgerEnabled;
  }

  function usesHamburger() {
    return supportsHamburgerNavigation() && !state.mobileNav.docked;
  }

  function updateDockToggle() {
    const button = state.mobileNav.dockToggle;
    if (!button) return;
    const docked = Boolean(state.mobileNav.docked);
    button.hidden = !(supportsHamburgerNavigation() || docked);
    button.setAttribute('aria-pressed', String(docked));
    button.setAttribute('aria-label', docked ? '取消停靠侧边导航栏' : '停靠侧边导航栏');
    button.title = docked ? '停靠侠：已停靠，点击取消停靠' : '停靠侠：固定侧边导航栏';
    button.classList.toggle('active', docked);
  }

  function setNavigationDocked(docked) {
    const next = Boolean(docked);
    if (state.mobileNav.docked === next) return;
    state.mobileNav.docked = next;
    try { HOST_WIN.localStorage.setItem(NAV_DOCKED_KEY, String(next)); } catch {}
    HOST_DOC.body.toggleAttribute('data-tle-docked', next);
    // A dock-state change always closes the floating engine/search surfaces.
    closeGlobalSearch();
    setPanelOpen(false);
    setMobileNavOpen(false);
    updateDockToggle();
  }

  function closeMobileNativeDrawers() {
    // When the hamburger reveals the navigation rail, close the currently
    // expanded native drawer instead of merely hiding it with visibility.
    // Keeping an openDrawer alive underneath the rail can leave native
    // backdrop/blur layers composited on iOS Safari after the transition.
    const openDrawers = HOST_DOC.querySelectorAll(
      '#top-settings-holder > .drawer > .drawer-content.openDrawer:not(.pinnedOpen)'
    );
    for (const content of openDrawers) {
      const drawer = content.closest('.drawer');
      const icon = drawer?.querySelector(':scope > .drawer-toggle .drawer-icon');
      if (icon) icon.click();
    }
  }

  function updateWorkspaceHeader() {
    const header = state.workspaceHeader;
    if (!header) return;
    const name = String(getCurrentPersonaInfo() || '').trim() || 'User';
    const greeting = header.querySelector('[data-tle-greeting-text]');
    if (greeting) greeting.textContent = `Hello, ${name}.`;
    updateDockToggle();
  }

  function setMobileNavOpen(open) {
    const mode = usesHamburger();
    const nextOpen = mode && Boolean(open);

    // On mobile, returning to navigation must dismiss the native drawer
    // through SillyTavern's own handler before exposing the rail. Do not leave
    // hidden .openDrawer panels or their backdrop effects mounted underneath.
    if (nextOpen && isMobileViewport()) closeMobileNativeDrawers();

    if (!nextOpen) closeGlobalSearch();
    state.mobileNav.open = nextOpen;
    const body = HOST_DOC.body;
    body.toggleAttribute('data-tle-docked', state.mobileNav.docked);
    if (mode) body.dataset.tleOverlay = state.mobileNav.open ? 'open' : 'closed';
    else delete body.dataset.tleOverlay;

    const button = state.mobileNav.toggle;
    if (button) {
      button.hidden = !mode;
      button.setAttribute('aria-expanded', String(state.mobileNav.open));
      button.setAttribute('aria-label', state.mobileNav.open ? '收起导航' : '展开导航');
      button.innerHTML = state.mobileNav.open
        ? '<i class="fa-solid fa-xmark" aria-hidden="true"></i>'
        : '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
      const actions = state.workspaceHeader?.querySelector('.tle-workspace-actions');
      if (state.mobileNav.open && actions) actions.appendChild(button);
      else body.appendChild(button);
    }

    updateWorkspaceHeader();
    if (!state.mobileNav.open && mode) setPanelOpen(false);
  }

  // Opt-in touch navigation. Android is experimental and NEVER bypasses system Back.
  // iPadOS desktop UA is recognized only with multi-touch, excluding normal Macs.
  function isIOSHost() {
    const nav = HOST_WIN.navigator;
    const ua = String(nav?.userAgent || '');
    const platform = String(nav?.platform || '');
    if (/Android/i.test(ua) || /Android/i.test(platform)) return false;
    return /iPhone|iPad|iPod/i.test(ua) ||
      /iPhone|iPad|iPod/i.test(platform) ||
      (/Macintosh/i.test(ua) && /MacIntel/i.test(platform) &&
        Number(nav?.maxTouchPoints || 0) > 1);
  }

  function isAndroidHost() {
    const nav = HOST_WIN.navigator;
    const ua = String(nav?.userAgent || '');
    const platform = String(nav?.userAgentData?.platform || nav?.platform || '');
    return (/Android/i.test(ua) || /Android/i.test(platform)) &&
      ('ontouchstart' in HOST_WIN || Number(nav?.maxTouchPoints || 0) > 0);
  }
  function supportsTouchNavSwipe() {
    return isIOSHost() || isAndroidHost();
  }

  function nativeGestureCheckbox() {
    const checkbox = HOST_DOC.getElementById('gestures-checkbox') ||
      HOST_DOC.querySelector('input#gestures-checkbox');
    return checkbox?.tagName?.toLowerCase() === 'input' && checkbox.type === 'checkbox' ? checkbox : null;
  }
  // Native settings can be available before TT mounts the corresponding drawer.
  function getNativeGestureSetting() {
    try {
      const context = HOST_WIN.SillyTavern?.getContext?.();
      const power = context?.powerUserSettings;
      if (typeof power?.gestures === 'boolean' && typeof context.saveSettingsDebounced === 'function') {
        return { context, power };
      }
    } catch {}
    return null;
  }
  function readNativeGestureChecked() {
    return nativeGestureCheckbox()?.checked ?? getNativeGestureSetting()?.power.gestures ?? nativeGestureLastKnown;
  }
  function reportNativeGestureSync(message = '') {
    const label = state.panel?.querySelector('[data-tle-native-gesture-status]');
    if (!label) return;
    label.hidden = !message;
    label.textContent = message;
  }
  function setNativeGestureChecked(checked) {
    const checkbox = nativeGestureCheckbox();
    if (!checkbox) {
      const setting = getNativeGestureSetting();
      if (!setting) return false;
      const previous = setting.power.gestures;
      if (previous === checked) return true;
      try {
        setting.power.gestures = checked;
        if (setting.power.gestures !== checked) return false;
        setting.context.saveSettingsDebounced();
        nativeGestureLastKnown = checked;
        return true;
      } catch {
        try { setting.power.gestures = previous; } catch {}
        return false;
      }
    }
    if (checkbox.checked === checked) return true;
    // ST listens to this exact change event to update power_user.gestures AND
    // saveSettingsDebounced(); changing .checked alone would not persist.
    checkbox.checked = checked;
    checkbox.dispatchEvent(new HOST_WIN.Event('change', { bubbles:true }));
    nativeGestureLastKnown = checkbox.checked;
    return checkbox.checked === checked;
  }
  function syncNativeGesturesForSwipe() {
    // Changes ONLY ST's own Gestures checkbox; NEVER touches OS Back/navigation.
    // Also supported in desktop DevTools touch emulation; never requires OS checks.
    const checkbox = nativeGestureCheckbox();
    const setting = checkbox ? null : getNativeGestureSetting();
    const actual = checkbox?.checked ?? setting?.power.gestures;
    if (typeof actual !== 'boolean') {
      const pending = getStoredBool(NAV_NATIVE_GESTURE_RESTORE_KEY, false);
      reportNativeGestureSync(navEdgeSwipeEnabled
        ? (nativeGestureLastKnown === true ? '原生翻页此前处于开启状态；等待原生设置加载。' : '原生手势控件暂不可见；TLE 滑屏仍可用，控件加载后自动同步。若原生翻页仍开启，请先手动关闭。')
        : (pending ? '等待原生手势控件加载后恢复原设置。' : ''));
      return false;
    }
    nativeGestureLastKnown = actual;
    if (navEdgeSwipeEnabled) {
      if (actual) {
        // Store the marker BEFORE triggering ST's debounced setting save.
        // Preserve an earlier marker across reloads and TLE Core upgrades.
        try { HOST_WIN.localStorage.setItem(NAV_NATIVE_GESTURE_RESTORE_KEY, 'true'); } catch {}
        if (!setNativeGestureChecked(false)) {
          reportNativeGestureSync('未能关闭酒馆原生翻页手势，请检查设置。');
          return false;
        }
      }
      const off = readNativeGestureChecked() === false;
      reportNativeGestureSync(off
        ? (checkbox ? '已同步：酒馆原生左右翻页手势已关闭。' : '已同步：通过酒馆设置接口关闭原生左右翻页手势。')
        : '同步失败：酒馆原生左右翻页仍然开启。');
      return off;
    }
    // Restore only when TLE itself disabled a previously enabled setting.
    const restore = getStoredBool(NAV_NATIVE_GESTURE_RESTORE_KEY, false);
    if (restore && !setNativeGestureChecked(true)) {
      reportNativeGestureSync('原生翻页手势尚未恢复，请检查酒馆用户设置。');
      return false;
    }
    try { HOST_WIN.localStorage.removeItem(NAV_NATIVE_GESTURE_RESTORE_KEY); } catch {}
    reportNativeGestureSync(restore ? '已同步：酒馆原生左右翻页手势已恢复。'
      : 'TLE 已关闭，酒馆原生手势设置保持原样。');
    return true;
  }
  let navEdgeSwipeAbort = null;
  let nativeGestureLastKnown = null;
  let nativeGestureMountObserver = null;
  let nativeGestureObserved = null;
  let nativeGestureRetryTimer = 0;
  function stopNativeGestureRetry() {
    HOST_WIN.clearTimeout(nativeGestureRetryTimer);
    nativeGestureRetryTimer = 0;
  }
  function watchNativeGestureMount() {
    stopNativeGestureRetry();
    nativeGestureMountObserver?.disconnect();
    nativeGestureMountObserver = null;
    nativeGestureObserved = nativeGestureCheckbox();
    if (!navEdgeSwipeEnabled && !getStoredBool(NAV_NATIVE_GESTURE_RESTORE_KEY, false)) return;
    nativeGestureMountObserver = new HOST_WIN.MutationObserver(() => {
      if (state.destroyed) return;
      const current = nativeGestureCheckbox();
      if (current === nativeGestureObserved) return;
      nativeGestureObserved = current;
      if (current) syncNativeGesturesForSwipe();
      if (!navEdgeSwipeEnabled && !getStoredBool(NAV_NATIVE_GESTURE_RESTORE_KEY, false)) {
        nativeGestureMountObserver?.disconnect();
        nativeGestureMountObserver = null;
      }
    });
    nativeGestureMountObserver.observe(HOST_DOC.body, {childList:true, subtree:true});
    // Bounded retry covers delayed host context initialization without polling forever.
    if (!nativeGestureObserved && !getNativeGestureSetting()) {
      let attempts = 0;
      const retry = () => {
        nativeGestureRetryTimer = 0;
        if (state.destroyed || (!navEdgeSwipeEnabled && !getStoredBool(NAV_NATIVE_GESTURE_RESTORE_KEY, false))) return;
        if (nativeGestureCheckbox() || getNativeGestureSetting()) {
          nativeGestureObserved = nativeGestureCheckbox();
          syncNativeGesturesForSwipe();
          return;
        }
        if (++attempts < 20) nativeGestureRetryTimer = HOST_WIN.setTimeout(retry, 500);
      };
      nativeGestureRetryTimer = HOST_WIN.setTimeout(retry, 500);
    }
  }
  HOST_DOC.addEventListener('change', event => {
    const checkbox = nativeGestureCheckbox();
    if (!checkbox || event.target !== checkbox) return;
    nativeGestureLastKnown = checkbox.checked;
    if (navEdgeSwipeEnabled) reportNativeGestureSync(checkbox.checked
      ? '原生翻页手势已开启；TLE 滑屏暂停以避免冲突。'
      : '已同步：酒馆原生左右翻页手势已关闭。');
  }, {capture:true, signal:state.abort.signal});
  state.abort.signal.addEventListener('abort', () => {
    stopNativeGestureRetry();
    nativeGestureMountObserver?.disconnect();
    nativeGestureMountObserver = null;
    nativeGestureObserved = null;
  }, {once:true});
  function edgeSwipeDirection(start, end, elapsed) {
    if (!start || !end || elapsed > 800 || elapsed < 0) return false;
    const dx = end.clientX - start.clientX, dy = end.clientY - start.clientY;
    return (start.open ? dx <= -64 : dx >= 64) && Math.abs(dy) <= 38 && Math.abs(dx) >= Math.abs(dy) * 1.8;
  }
  function navEdgeSwipeAllowed() {
    const body = HOST_DOC.body;
    // Do NOT gate by userAgent or touch capability: Chrome DevTools can emit
    // touch events while the host UA still identifies as Windows/macOS.
    if (!navEdgeSwipeEnabled || state.destroyed || !state.active ||
        !usesHamburger() || state.mobileNav.docked) return false;
    if (body.hasAttribute('data-tle-external-surface') || body.classList.contains('tle-global-search-open') || body.classList.contains('tle-quick-modal-open')) return false;
    if (state.panel?.dataset.open === 'true' || state.chatTools.open ||
        HOST_DOC.querySelector('dialog[open], .popup.openDrawer')) return false;
    // A hidden native drawer can retain openDrawer even after TLE closes the rail;
    // its stale class must not permanently block subsequent swipe openings.
    for (const drawer of HOST_DOC.querySelectorAll('.drawer-content.openDrawer:not(.pinnedOpen)')) {
      if (drawer === state.panel || drawer.closest('#top-settings-holder')) continue;
      const computed = HOST_WIN.getComputedStyle(drawer);
      if (drawer.getClientRects().length && computed.display !== 'none' && computed.visibility !== 'hidden') return false;
    }
    // Respect ST if its native gesture was manually switched back on.
    if (readNativeGestureChecked() === true) return false;
    const vv = HOST_WIN.visualViewport;
    if (vv && (vv.scale > 1.05 || vv.height < HOST_DOC.documentElement.clientHeight * .75)) return false;
    // Touching an actual form control is filtered in blockedTarget().
    // A textarea retaining focus after its keyboard closes is not a gesture blocker.
    return true;
  }
  function syncNavEdgeSwipe() {
    navEdgeSwipeAbort?.abort();
    navEdgeSwipeAbort = null;
    // Installing passive touch listeners on desktop is harmless. They only fire
    // for real touchscreens or DevTools mobile/touch emulation, not mouse drags.
    if (state.destroyed) return;
    syncNativeGesturesForSwipe();
    watchNativeGestureMount();
    if (!navEdgeSwipeEnabled) return;
    // The live/cached native state is checked when a gesture actually starts.
    const controller = new HOST_WIN.AbortController();
    navEdgeSwipeAbort = controller;
    const options = { capture: true, passive: true, signal: controller.signal };
    let start = null;
    const clear = () => { start = null; };
    const touchById = (list, id) => Array.from(list || []).find(touch => touch.identifier === id);
    const blockedTarget = target => {
      if (!target?.closest) return true;
      if (target.closest('input, textarea, select, button, a, [contenteditable], pre, code, table, .swipe_left, .swipe_right, [role="slider"], [data-tle-quick-panel], .popup, dialog, #form_sheld')) return true;
      // Check only touched ancestors, only for a candidate gesture; avoid hijacking horizontal content.
      for (let el = target; el && el !== HOST_DOC.body; el = el.parentElement) {
        if (el.scrollWidth <= el.clientWidth + 2) continue;
        const overflow = HOST_WIN.getComputedStyle(el).overflowX;
        if (overflow === 'auto' || overflow === 'scroll') return true;
      }
      return false;
    };
    HOST_DOC.addEventListener('touchstart', event => {
      clear();
      if (!navEdgeSwipeAllowed() || event.touches.length !== 1) return;
      const touch = event.touches[0], open = state.mobileNav.open;
      if (open) {
        if (!event.target?.closest?.('#top-settings-holder')) return;
      } else if (touch.clientX < 0 || touch.clientX > 28) return;
      if (blockedTarget(event.target)) return;
      start = { identifier:touch.identifier, clientX:touch.clientX, clientY:touch.clientY, open, time:HOST_WIN.performance.now() };
    }, options);
    HOST_DOC.addEventListener('touchmove', event => {
      if (!start) return;
      const touch = touchById(event.touches,start.identifier);
      if (event.touches.length !== 1 || !touch) return clear();
      const dx = touch.clientX - start.clientX, dy = touch.clientY - start.clientY;
      if (Math.abs(dy) > 38 || (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.2) || (start.open ? dx > 16 : dx < -16)) clear();
    }, options);
    HOST_DOC.addEventListener('touchend', event => {
      const origin = start;
      clear();
      if (!origin || event.touches.length || !navEdgeSwipeAllowed() || origin.open !== state.mobileNav.open) return;
      const touch = touchById(event.changedTouches, origin.identifier);
      if (edgeSwipeDirection(origin, touch, HOST_WIN.performance.now() - origin.time)) setMobileNavOpen(!origin.open);
    }, options);
    HOST_DOC.addEventListener('touchcancel', clear, options);
    HOST_WIN.addEventListener('blur', clear, options);
    state.abort.signal.addEventListener('abort', () => controller.abort(), { once:true, signal:controller.signal });
  }
  function setNavEdgeSwipeEnabled(enabled) {
    navEdgeSwipeEnabled = Boolean(enabled);
    try { HOST_WIN.localStorage.setItem(NAV_EDGE_SWIPE_KEY, String(navEdgeSwipeEnabled)); } catch {}
    // The native setting is synchronized once by syncNavEdgeSwipe.
    syncNavEdgeSwipe();
  }

  const drawerLabels = {
    'left-nav-panel': '预设管理',
    rm_api_block: 'API 连接配置',
    AdvancedFormatting: '高级格式化设置',
    WorldInfo: '世界/知识书',
    'user-settings-block': '用户设置',
    Backgrounds: '背景',
    'bg-menu': '背景',
    rm_extensions_block: '扩展程序',
    extensions_settings: '扩展程序',
    PersonaManagement: '用户设定管理',
    'right-nav-panel': '角色管理',
  };
  const drawerButtonLabels = {
    'leftNavDrawer': '预设管理',
    'WI-SP-button': '世界/知识书',
    'backgrounds-button': '背景',
    'extensions-settings-button': '扩展程序',
    'persona-management-button': '用户设定管理',
    'rightNavHolder': '角色管理',
  };
  const drawerFallbackLabels = ['预设管理', 'API 连接配置', '高级格式化设置', '世界/知识书',
    '用户设置', '背景', '扩展程序', '用户设定管理', '角色管理'];

  function getDrawerLabel(drawer, toggle, index, count) {
    const panel = drawer.querySelector(':scope > .drawer-content');
    const known = drawerLabels[panel?.id] || drawerButtonLabels[drawer.id];
    if (known) return known;
    const title = [toggle, toggle.querySelector('.drawer-icon'), drawer, panel]
      .flatMap(el => [el?.getAttribute('aria-label'), el?.getAttribute('title')])
      .find(value => value?.trim())?.trim();
    if (/^(更改背景图片|change background image|backgrounds?)$/i.test(title || '')) return '背景';
    if (/^(user\s*身份|user persona|persona management)$/i.test(title || '')) return '用户设定管理';
    if (/^(世界书|world info|world lore)$/i.test(title || '')) return '世界/知识书';
    return title || (count === 9 ? drawerFallbackLabels[index] : null) || `导航 ${index + 1}`;
  }

  function ensureNavInfoStation() {
    const holder = HOST_DOC.getElementById('top-settings-holder');
    if (!holder) return null;
    let station = holder.querySelector(':scope > .tle-sidebar-info');
    if (!station) {
      station = HOST_DOC.createElement('section');
      station.className = 'tle-sidebar-info';
      station.setAttribute('aria-label', '侧栏信息站');
      station.hidden = true;
      station.innerHTML = '<hr data-tle-info-divider><div class="tle-info-list" data-tle-info-list></div>';
      holder.appendChild(station);
    }
    station.querySelectorAll('.tle-chat-actions, [data-tle-chat-actions], [data-chat-action-row]').forEach(node => node.remove());
    return station;
  }

  /*
   * Floor-zero clearance is expressed as #chat padding.
   * This preserves the previous 48px + safe-area target without inserting a node
   * into TT's bounded ChatSurface root.
   */
  const FLOOR_ZERO_MEASURING_ATTRIBUTE = 'data-tle-floor-zero-measuring';
  const FLOOR_ZERO_PADDING_BASE_VAR = '--tle-floor-zero-padding-base';
  const FLOOR_ZERO_MESSAGE_MARGIN_VAR = '--tle-floor-zero-message-margin';
  const FLOOR_ZERO_ROW_GAP_VAR = '--tle-floor-zero-row-gap';

  function clearFloorZeroClearance() {
    const body = HOST_DOC.body;
    body?.removeAttribute(FLOOR_ZERO_MEASURING_ATTRIBUTE);
    body?.style.removeProperty(FLOOR_ZERO_PADDING_BASE_VAR);
    body?.style.removeProperty(FLOOR_ZERO_MESSAGE_MARGIN_VAR);
    body?.style.removeProperty(FLOOR_ZERO_ROW_GAP_VAR);
    state.floorZeroClearanceChat = null;
  }

  function syncFloorZeroClearance() {
    if (state.destroyed) return;

    const body = HOST_DOC.body;
    const chat = HOST_DOC.getElementById('chat');
    if (!body?.hasAttribute('data-tle-nav') || !chat) {
      clearFloorZeroClearance();
      return;
    }

    const wasMeasuring = body.hasAttribute(FLOOR_ZERO_MEASURING_ATTRIBUTE);
    body.setAttribute(FLOOR_ZERO_MEASURING_ATTRIBUTE, '');
    let basePadding = 0;
    const chatStyle = HOST_WIN.getComputedStyle(chat);
    try {
      const rawPadding = chatStyle.paddingBlockStart || chatStyle.paddingTop || '0';
      const parsedPadding = Number.parseFloat(rawPadding);
      basePadding = Number.isFinite(parsedPadding) ? parsedPadding : 0;
    } finally {
      if (!wasMeasuring) body.removeAttribute(FLOOR_ZERO_MEASURING_ATTRIBUTE);
    }

    // TT virtualizes floor 0 out of the DOM. Any resident direct .mes has the
    // active theme's message margin, so this also works when only the tail is mounted.
    const residentMessage = chat.querySelector(':scope > .mes');
    const messageStyle = residentMessage ? HOST_WIN.getComputedStyle(residentMessage) : null;
    const rawMargin = messageStyle
      ? (messageStyle.marginBlockStart || messageStyle.marginTop || '0')
      : '0';
    const parsedMargin = Number.parseFloat(rawMargin);
    const messageMargin = Number.isFinite(parsedMargin) ? parsedMargin : 0;
    const display = chatStyle.display || '';
    const isGrid = display === 'grid' || display === 'inline-grid';
    const isFlexColumn = display.includes('flex') && chatStyle.flexDirection.startsWith('column');
    const parsedRowGap = Number.parseFloat(chatStyle.rowGap || chatStyle.gap || '0');
    const rowGap = (isGrid || isFlexColumn) && Number.isFinite(parsedRowGap) ? parsedRowGap : 0;

    for (const [property, value] of [
      [FLOOR_ZERO_PADDING_BASE_VAR, basePadding + 'px'],
      [FLOOR_ZERO_MESSAGE_MARGIN_VAR, messageMargin + 'px'],
      [FLOOR_ZERO_ROW_GAP_VAR, rowGap + 'px'],
    ]) {
      if (body.style.getPropertyValue(property) !== value) {
        body.style.setProperty(property, value);
      }
    }
    state.floorZeroClearanceChat = chat;
  }

  function queueFloorZeroClearanceSync() {
    if (state.destroyed || state.floorZeroClearanceFrame) return;
    state.floorZeroClearanceFrame = HOST_WIN.requestAnimationFrame(() => {
      state.floorZeroClearanceFrame = 0;
      syncFloorZeroClearance();
    });
  }

  function syncRail() {
    const holder = HOST_DOC.getElementById('top-settings-holder');
    if (!holder) return;
    const drawers = [...holder.querySelectorAll(':scope > .drawer')];
    // A replacement holder can arrive before its native children. Leave the
    // native UI alone until at least one real toggle is present.
    if (!drawers.some(drawer => drawer.querySelector(':scope > .drawer-toggle'))) return;
    HOST_DOC.body.dataset.tleNav = navigationMode;
    const count = String(drawers.length);
    if (HOST_DOC.body.style.getPropertyValue('--tle-rows') !== count) {
      HOST_DOC.body.style.setProperty('--tle-rows', count);
      HOST_DOC.body.style.setProperty('--tle-half-rows', String(Math.ceil(drawers.length / 2)));
    }
    HOST_DOC.body.toggleAttribute('data-tle-compact', drawers.length >= 10 || HOST_WIN.innerHeight < 415);
    for (const [index, drawer] of drawers.entries()) {
      const toggle = drawer.querySelector(':scope > .drawer-toggle');
      if (!toggle) continue;
      let label = drawer.querySelector(':scope > .tle-drawer-label');
      if (!label) {
        label = HOST_DOC.createElement('span');
        label.className = 'tle-drawer-label';
        label.setAttribute('role', 'button');
        label.tabIndex = 0;
        drawer.appendChild(label);
      }
      const name = getDrawerLabel(drawer, toggle, index, drawers.length);
      if (label.textContent !== name) label.textContent = name;
    }
    if (state.workspaceHeader && holder.firstElementChild !== state.workspaceHeader) {
      holder.prepend(state.workspaceHeader);
    }
    updateWorkspaceHeader();
    const station = ensureNavInfoStation();
    if (holder.lastElementChild !== state.navEntry || state.navEntry.previousElementSibling !== state.organizerEntry || state.organizerEntry.previousElementSibling !== station) {
      holder.append(station, state.organizerEntry, state.navEntry);
    }
    syncFloorZeroClearance();
  }

  const CHAT_SHORTCUT_OVERLAY_SELECTOR = [
    '.drawer-content.openDrawer:not([data-tle-quick-panel])',
    '#completion_prompt_manager_popup',
    '.popup:not([data-tle-chat-tools-panel])',
    '.modal',
    '.modal-overlay',
    '.ui-dialog',
    '.swal2-container',
    '[role="dialog"]:not([data-tle-quick-panel]):not([data-tle-chat-tools-panel])',
  ].join(',');

  function isActuallyVisible(element) {
    if (!element || element.hidden || HOST_WIN.getComputedStyle(element).visibility !== 'visible') return false;
    let node = element;
    while (node && node !== HOST_DOC) {
      const style = HOST_WIN.getComputedStyle(node);
      if (style.display === 'none' || (style.opacity !== '' && Number(style.opacity) === 0)) {
        return false;
      }
      node = node.parentElement;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function hasOpenChatOverlay() {
    // Drawer state is represented by the host's own openDrawer class.
    if (HOST_DOC.querySelector('.drawer-content.openDrawer:not([data-tle-quick-panel])')) return true;

    // Other modal/popup systems do not necessarily use drawer classes.
    return [...HOST_DOC.querySelectorAll(
      '#completion_prompt_manager_popup, .popup:not([data-tle-chat-tools-panel]), .modal, .modal-overlay, .ui-dialog, .swal2-container, [role="dialog"]:not([data-tle-chat-tools-panel])'
    )].some(isActuallyVisible);
  }

  const TLE_OWNED_OVERLAY_SELECTOR = [
    `#${ID.chatShortcut}`,
    `#${ID.chatToolsButton}`,
    `#${ID.chatToolsPanel}`,
    `#${ID.nav}`,
    `#${ID.organizerEntry}`,
    `#${ID.panel}`,
    `#${ID.workspaceHeader}`,
    `#${ID.mobileToggle}`,
    `#${ID.dockToggle}`,
    `#${ID.diagnosticButton}`,
    `#${ID.scrollBottom}`,
    '#tle-global-search-panel',
    '#tle-mobile-debugger',
    '#tle-quick-picker',
  ].join(',');

  function isTleOwnedOverlayElement(element) {
    return Boolean(
      element?.matches?.(TLE_OWNED_OVERLAY_SELECTOR) ||
      element?.closest?.(TLE_OWNED_OVERLAY_SELECTOR)
    );
  }

  function isViewportCoveringFixedSurface(element, viewportWidth, viewportHeight) {
    if (!element || element.id === 'bg1' || element.closest?.('#bg1') ||
        isTleOwnedOverlayElement(element)) return false;

    const style = HOST_WIN.getComputedStyle(element);
    if (
      style.position !== 'fixed' ||
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity || 1) <= 0.01 ||
      !isActuallyVisible(element)
    ) return false;

    const rect = element.getBoundingClientRect();
    const horizontalTolerance = Math.max(8, viewportWidth * 0.08);
    const verticalTolerance = Math.max(8, viewportHeight * 0.08);

    // The fixed surface must cover almost the entire viewport, not merely
    // be a small floating widget or an ordinary dropdown.
    return (
      rect.width >= viewportWidth * 0.84 &&
      rect.height >= viewportHeight * 0.84 &&
      rect.left <= horizontalTolerance &&
      rect.top <= verticalTolerance &&
      rect.right >= viewportWidth - horizontalTolerance &&
      rect.bottom >= viewportHeight - verticalTolerance
    );
  }

  function isExternalFullscreenSurface(element, viewportWidth, viewportHeight) {
    let node = element;

    while (node && node !== HOST_DOC.body && node !== HOST_DOC.documentElement) {
      if (isViewportCoveringFixedSurface(node, viewportWidth, viewportHeight)) return true;
      node = node.parentElement;
    }

    return false;
  }

  function hasExternalFullscreenSurfaceInShadowTree(shadowRoot, viewportWidth, viewportHeight) {
    if (!shadowRoot?.querySelectorAll) return false;

    // document.elementFromPoint() returns the shadow host, not the element
    // inside its open Shadow DOM. Inspect that root only after the hit-test
    // lands on a shadow host, avoiding a page-wide shadow-tree scan.
    const pendingRoots = [shadowRoot];
    while (pendingRoots.length) {
      const root = pendingRoots.pop();
      for (const candidate of root.querySelectorAll('*')) {
        if (candidate.shadowRoot) pendingRoots.push(candidate.shadowRoot);
        if (isViewportCoveringFixedSurface(candidate, viewportWidth, viewportHeight)) {
          return true;
        }
      }
    }
    return false;
  }

  function hasExternalFullscreenSurfaceAtChatToolsButton() {
    const button = state.chatTools.button;
    if (!button?.isConnected) return false;

    const viewportWidth = HOST_DOC.documentElement.clientWidth || HOST_WIN.innerWidth;
    const viewportHeight = HOST_DOC.documentElement.clientHeight || HOST_WIN.innerHeight;
    if (!viewportWidth || !viewportHeight) return false;

    // Read the actual CSS position so safe-area insets and theme overrides are
    // respected, even while the button is currently hidden.
    const buttonStyle = HOST_WIN.getComputedStyle(button);
    const readPx = (value, fallback) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const width = readPx(buttonStyle.width, 36);
    const height = readPx(buttonStyle.height, 36);
    const right = readPx(buttonStyle.right, 8);
    const top = readPx(buttonStyle.top, 4);
    const x = Math.min(viewportWidth - 1, Math.max(0, viewportWidth - right - width / 2));
    const y = Math.min(viewportHeight - 1, Math.max(0, top + height / 2));

    // The TLE button has a higher z-index than some third-party full-screen
    // shells. Temporarily let hit-testing pass through our own top-right
    // controls, then restore their exact inline pointer-events declarations.
    const temporarilyDisabled = [
      state.chatTools.button,
      state.chatShortcut,
      state.chatTools.panel,
    ].filter(element => element?.isConnected);
    const previousPointerEvents = temporarilyDisabled.map(element => ({
      element,
      value: element.style.getPropertyValue('pointer-events'),
      priority: element.style.getPropertyPriority('pointer-events'),
    }));

    try {
      for (const element of temporarilyDisabled) {
        element.style.setProperty('pointer-events', 'none', 'important');
      }

      const hit = HOST_DOC.elementFromPoint(x, y);
      if (!hit) return false;
      if (isExternalFullscreenSurface(hit, viewportWidth, viewportHeight)) return true;
      return hasExternalFullscreenSurfaceInShadowTree(hit.shadowRoot, viewportWidth, viewportHeight);
    } catch (error) {
      // Hit-testing is an enhancement; failure must not break chat controls.
      return false;
    } finally {
      for (const previous of previousPointerEvents) {
        if (previous.value) {
          previous.element.style.setProperty('pointer-events', previous.value, previous.priority);
        } else {
          previous.element.style.removeProperty('pointer-events');
        }
      }
    }
  }

  function queueChatShortcutRefresh() {
    if (state.destroyed || state.chatShortcutFrame) return;
    state.chatShortcutFrame = HOST_WIN.requestAnimationFrame(() => {
      state.chatShortcutFrame = 0;
      if (state.destroyed) return;

      // Preserve the existing return-to-chat behavior for Tavern drawers and
      // recognized modal systems. A generic full-screen third-party surface
      // hides only 会话侠; it must not summon another TLE button over that app.
      const hasOverlay = hasOpenChatOverlay();
      const hasExternalSurface = !hasOverlay && hasExternalFullscreenSurfaceAtChatToolsButton();
      HOST_DOC.body.toggleAttribute('data-tle-external-surface', hasExternalSurface);
      if (state.chatShortcut) state.chatShortcut.hidden = !hasOverlay;

      if (!chatToolsEnabled) {
        if (state.chatTools.button) state.chatTools.button.hidden = true;
        if (state.chatTools.open) closeChatTools(false);
        return;
      }

      const hasBlockingSurface = hasOverlay || hasExternalSurface;
      const snapshot = getActiveChatActionContext();
      const shouldShowTools = Boolean(snapshot) && !hasBlockingSurface;
      if (state.chatTools.button) state.chatTools.button.hidden = !shouldShowTools;

      if (!shouldShowTools) {
        if (state.chatTools.open) closeChatTools(false);
      } else if (state.chatTools.open) {
        if (state.chatTools.chatKey && state.chatTools.chatKey !== snapshot.chatKey) {
          closeChatTools(false);
        } else {
          updateChatToolsPanel(snapshot);
        }
      }
    });
  }

  // Optional Fade Engine. No mask, mirror DOM, or wallpaper observer is created
  // unless the user explicitly enables this feature in the TLE settings panel.
  const CHAT_FADE_CLASS = 'tle-chat-fade-active';
  const CHAT_FADE_BOTTOM_PADDING_CLASS = 'tle-chat-fade-bottom-padding';

  function setChatFadeStatus(message) {
    const status = state.panel?.querySelector('[data-tle-fade-status]');
    if (status) status.textContent = message;
  }

  function getChatFadeChat() {
    return HOST_DOC.getElementById('chat');
  }

  function getChatFadeBg1() {
    return HOST_DOC.getElementById('bg1');
  }

  function chatFadeAlphaOf(color) {
    const value = String(color || '').trim();
    const match = value.match(/\/\s*([0-9.]+)\s*\)$/) || value.match(/,\s*([0-9.]+)\s*\)$/);
    return match ? Number(match[1]) : 1;
  }

  const CHAT_FADE_PSEUDO_BEFORE_CLASS = 'tle-chat-fade-pseudo-before';
  const CHAT_FADE_PSEUDO_AFTER_CLASS = 'tle-chat-fade-pseudo-after';
  const CHAT_FADE_FIXED_CLASS = 'tle-chat-fade-fixed';
  const CHAT_FADE_BACKGROUND_FALLBACK_CLASS = 'tle-chat-fade-background-fallback';
  const CHAT_FADE_WALLPAPER_VARIABLES = Object.freeze([
    '--tle-chat-fade-wallpaper-image',
    '--tle-chat-fade-wallpaper-size',
    '--tle-chat-fade-wallpaper-position',
    '--tle-chat-fade-wallpaper-repeat',
    '--tle-chat-fade-wallpaper-attachment',
    '--tle-chat-fade-wallpaper-origin',
    '--tle-chat-fade-wallpaper-clip',
    '--tle-chat-fade-wallpaper-color',
    '--tle-chat-fade-wallpaper-blend',
    '--tle-chat-fade-wallpaper-filter',
    '--tle-chat-fade-wallpaper-opacity',
    '--tle-chat-fade-wallpaper-mix',
    '--tle-chat-fade-wallpaper-left',
    '--tle-chat-fade-wallpaper-top',
    '--tle-chat-fade-wallpaper-width',
    '--tle-chat-fade-wallpaper-height',
    '--tle-chat-fade-clip-top',
    '--tle-chat-fade-clip-right',
    '--tle-chat-fade-clip-bottom',
    '--tle-chat-fade-clip-left',
  ]);

  function stopChatFadeWallpaperObservers() {
    state.chatFade.wallpaperObserver?.disconnect();
    state.chatFade.wallpaperObserver = null;
    state.chatFade.wallpaperParentObserver?.disconnect();
    state.chatFade.wallpaperParentObserver = null;
    state.chatFade.resizeObserver?.disconnect();
    state.chatFade.resizeObserver = null;
    state.chatFade.resizeChat = null;
    state.chatFade.wallpaperParent = null;

    if (state.chatFade.wallpaperRaf) {
      HOST_WIN.cancelAnimationFrame(state.chatFade.wallpaperRaf);
      state.chatFade.wallpaperRaf = 0;
    }
  }

  function clearChatFadeWallpaperVariables(chat) {
    if (!chat) return;
    for (const property of CHAT_FADE_WALLPAPER_VARIABLES) {
      chat.style.removeProperty(property);
    }
  }

  function syncChatFadeBottomPadding() {
    const chat = getChatFadeChat();
    const previous = state.chatFade.paddingChat;
    if (previous && previous !== chat) previous.classList.remove(CHAT_FADE_BOTTOM_PADDING_CLASS);
    if (chat) {
      chat.classList.toggle(
        CHAT_FADE_BOTTOM_PADDING_CLASS,
        chatFadeEnabled && chatFadeBottomPaddingEnabled
      );
    }
    state.chatFade.paddingChat = chat || null;
  }

  function clearChatFadeBottomPadding() {
    state.chatFade.paddingChat?.classList.remove(CHAT_FADE_BOTTOM_PADDING_CLASS);
    getChatFadeChat()?.classList.remove(CHAT_FADE_BOTTOM_PADDING_CLASS);
    state.chatFade.paddingChat = null;
  }

  function setChatFadeBottomPaddingEnabled(enabled) {
    chatFadeBottomPaddingEnabled = Boolean(enabled);
    try {
      HOST_WIN.localStorage.setItem(CHAT_FADE_BOTTOM_PADDING_KEY, String(chatFadeBottomPaddingEnabled));
    } catch {}
    const input = state.panel?.querySelector('[data-tle-setting="chat-fade-bottom-padding"]');
    if (input) input.checked = chatFadeBottomPaddingEnabled;
    syncChatFadeBottomPadding();
  }

  function clearChatFadeVisual() {
    const chats = new Set([state.chatFade.chat, getChatFadeChat()]);
    for (const chat of chats) {
      if (!chat) continue;
      chat.classList.remove(
        CHAT_FADE_CLASS,
        CHAT_FADE_PSEUDO_BEFORE_CLASS,
        CHAT_FADE_PSEUDO_AFTER_CLASS,
        CHAT_FADE_FIXED_CLASS,
        CHAT_FADE_BACKGROUND_FALLBACK_CLASS
      );
      clearChatFadeWallpaperVariables(chat);
    }
    state.chatFade.active = false;
    state.chatFade.chat = null;
    state.chatFade.pseudo = null;
    state.chatFade.renderMode = null;
  }

  function chatFadePseudoIsFree(chat, pseudo) {
    try {
      const style = HOST_WIN.getComputedStyle(chat, '::' + pseudo);
      const content = String(style?.content || '').trim();
      return !content || content === 'none' || content === 'normal';
    } catch {
      return false;
    }
  }

  function chatFadeHasFixedContainingBlock(chat) {
    let current = chat;
    while (current && current !== HOST_DOC.documentElement) {
      const style = HOST_WIN.getComputedStyle(current);
      const backdrop = style.backdropFilter || style.webkitBackdropFilter || 'none';
      if (
        style.transform !== 'none'
        || style.perspective !== 'none'
        || style.filter !== 'none'
        || backdrop !== 'none'
        || /paint|layout|strict|content/.test(style.contain || '')
        || /\b(transform|perspective|filter)\b/.test(style.willChange || '')
      ) return true;
      current = current.parentElement;
    }
    return false;
  }

  function setChatFadeWallpaperVariables(chat, bgCss, sourceImg, geometry, mode) {
    let image = bgCss.backgroundImage;
    let size = bgCss.backgroundSize;
    let position = bgCss.backgroundPosition;
    let repeat = bgCss.backgroundRepeat;
    let attachment = bgCss.backgroundAttachment;
    let origin = bgCss.backgroundOrigin;
    let clip = bgCss.backgroundClip;
    let color = bgCss.backgroundColor;
    let blend = bgCss.backgroundBlendMode;

    if ((!image || image === 'none') && sourceImg) {
      const rawUrl = String(sourceImg.currentSrc || sourceImg.src || '');
      const safeUrl = rawUrl.replace(/["\\\n\r]/g, '\\$&');
      image = 'url("' + safeUrl + '")';
      const imageStyle = HOST_WIN.getComputedStyle(sourceImg);
      const objectFit = imageStyle.objectFit || 'cover';
      size = objectFit === 'fill'
        ? '100% 100%'
        : (objectFit === 'none' ? 'auto' : (objectFit === 'scale-down' ? 'contain' : objectFit));
      position = imageStyle.objectPosition || '50% 50%';
      repeat = 'no-repeat';
      attachment = 'scroll';
      origin = 'border-box';
      clip = 'border-box';
    }

    const chatRect = geometry.chatRect;
    const bgRect = geometry.bgRect;
    let left;
    let top;
    let clipTop = 0;
    let clipRight = 0;
    let clipBottom = 0;
    let clipLeft = 0;

    if (mode === 'sticky') {
      const borderLeft = Number.parseFloat(geometry.chatCss.borderLeftWidth) || 0;
      const borderTop = Number.parseFloat(geometry.chatCss.borderTopWidth) || 0;
      const paddingLeft = Number.parseFloat(geometry.chatCss.paddingLeft) || 0;
      const paddingTop = Number.parseFloat(geometry.chatCss.paddingTop) || 0;
      left = bgRect.left - (chatRect.left + borderLeft + paddingLeft);
      top = bgRect.top - (chatRect.top + borderTop + paddingTop);
    } else {
      left = bgRect.left;
      top = bgRect.top;
      clipTop = Math.max(0, chatRect.top - bgRect.top);
      clipRight = Math.max(0, bgRect.right - chatRect.right);
      clipBottom = Math.max(0, bgRect.bottom - chatRect.bottom);
      clipLeft = Math.max(0, chatRect.left - bgRect.left);
    }

    const values = [
      ['--tle-chat-fade-wallpaper-image', image || 'none'],
      ['--tle-chat-fade-wallpaper-size', size || 'auto'],
      ['--tle-chat-fade-wallpaper-position', position || '0 0'],
      ['--tle-chat-fade-wallpaper-repeat', repeat || 'repeat'],
      ['--tle-chat-fade-wallpaper-attachment', attachment || 'scroll'],
      ['--tle-chat-fade-wallpaper-origin', origin || 'padding-box'],
      ['--tle-chat-fade-wallpaper-clip', clip || 'border-box'],
      ['--tle-chat-fade-wallpaper-color', color || 'transparent'],
      ['--tle-chat-fade-wallpaper-blend', blend || 'normal'],
      ['--tle-chat-fade-wallpaper-filter', bgCss.filter || 'none'],
      ['--tle-chat-fade-wallpaper-opacity', bgCss.opacity || '1'],
      ['--tle-chat-fade-wallpaper-mix', bgCss.mixBlendMode || 'normal'],
      ['--tle-chat-fade-wallpaper-left', left + 'px'],
      ['--tle-chat-fade-wallpaper-top', top + 'px'],
      ['--tle-chat-fade-wallpaper-width', bgRect.width + 'px'],
      ['--tle-chat-fade-wallpaper-height', bgRect.height + 'px'],
      ['--tle-chat-fade-clip-top', clipTop + 'px'],
      ['--tle-chat-fade-clip-right', clipRight + 'px'],
      ['--tle-chat-fade-clip-bottom', clipBottom + 'px'],
      ['--tle-chat-fade-clip-left', clipLeft + 'px'],
    ];
    for (const [property, value] of values) {
      const nextValue = String(value);
      if (chat.style.getPropertyValue(property) !== nextValue) {
        chat.style.setProperty(property, nextValue);
      }
    }
  }

  function bindChatFadeWallpaperSync(bg1 = getChatFadeBg1()) {
    if (!bg1) return;

    const chat = getChatFadeChat();
    const hasResizeObserver = typeof HOST_WIN.ResizeObserver === 'function';
    const resizeBindingReady = !hasResizeObserver
      || Boolean(state.chatFade.resizeObserver && state.chatFade.resizeChat === chat);
    if (state.chatFade.bg1 === bg1 &&
        state.chatFade.wallpaperObserver &&
        state.chatFade.wallpaperParent === bg1.parentElement &&
        resizeBindingReady) return;

    state.chatFade.wallpaperObserver?.disconnect();
    state.chatFade.wallpaperParentObserver?.disconnect();
    state.chatFade.resizeObserver?.disconnect();
    state.chatFade.wallpaperObserver = null;
    state.chatFade.wallpaperParentObserver = null;
    state.chatFade.resizeObserver = null;
    state.chatFade.resizeChat = null;

    state.chatFade.bg1 = bg1;

    const observer = new HOST_WIN.MutationObserver(scheduleChatFadeWallpaperSync);
    observer.observe(bg1, {
      attributes: true,
      attributeFilter: ['style', 'class', 'src', 'srcset'],
      childList: true,
      subtree: true,
    });
    state.chatFade.wallpaperObserver = observer;

    const parent = bg1.parentElement;
    state.chatFade.wallpaperParent = parent;

    if (parent) {
      const parentObserver = new HOST_WIN.MutationObserver(() => {
        const currentBg = getChatFadeBg1();
        if (currentBg && (
          currentBg !== state.chatFade.bg1 ||
          currentBg.parentElement !== state.chatFade.wallpaperParent
        )) {
          bindChatFadeWallpaperSync(currentBg);
          scheduleChatFadeWallpaperSync();
        } else if (!currentBg) {
          scheduleChatFadeWallpaperSync();
        }
      });
      parentObserver.observe(parent, { childList: true });
      state.chatFade.wallpaperParentObserver = parentObserver;
    }

    if (hasResizeObserver) {
      const resizeObserver = new HOST_WIN.ResizeObserver(scheduleChatFadeWallpaperSync);
      resizeObserver.observe(bg1);
      if (chat) resizeObserver.observe(chat);
      state.chatFade.resizeObserver = resizeObserver;
      state.chatFade.resizeChat = chat;
    }
  }

  function createChatFadeMirror() {
    if (!chatFadeEnabled || state.destroyed) return false;
    syncChatFadeBottomPadding();

    const chat = getChatFadeChat();
    const bg1 = getChatFadeBg1();

    if (!chat) {
      clearChatFadeVisual();
      setChatFadeStatus('渐隐侠已开启，等待聊天区域加载。');
      return false;
    }
    if (!bg1) {
      clearChatFadeVisual();
      setChatFadeStatus('渐隐侠已开启，但当前页面未找到 #bg1 壁纸层。');
      return false;
    }

    const bgCss = HOST_WIN.getComputedStyle(bg1);
    const chatCss = HOST_WIN.getComputedStyle(chat);
    const backgroundImage = bgCss.backgroundImage;
    const hasBgImage = Boolean(backgroundImage && backgroundImage !== 'none');
    const sourceImg = bg1.querySelector('img');
    const hasSourceImg = Boolean(sourceImg && (sourceImg.currentSrc || sourceImg.src));
    const maskSupported = Boolean(
      HOST_WIN.CSS?.supports?.('mask-image', 'linear-gradient(to bottom, transparent, black)') ||
      HOST_WIN.CSS?.supports?.('-webkit-mask-image', 'linear-gradient(to bottom, transparent, black)')
    );
    const transparentChat = chatFadeAlphaOf(chatCss.backgroundColor) < 0.01;

    bindChatFadeWallpaperSync(bg1);

    if (!hasBgImage && !hasSourceImg) {
      clearChatFadeVisual();
      setChatFadeStatus('渐隐侠暂不可用：当前 #bg1 没有可镜像的 CSS 背景图或 img。未改变聊天显示。');
      return false;
    }
    if (!transparentChat) {
      clearChatFadeVisual();
      setChatFadeStatus('渐隐侠暂不可用：当前主题的 #chat 背景不透明。未改变聊天显示。');
      return false;
    }
    if (!maskSupported) {
      clearChatFadeVisual();
      setChatFadeStatus('渐隐侠暂不可用：当前浏览器不支持 CSS Mask。未改变聊天显示。');
      return false;
    }

    const bgRect = bg1.getBoundingClientRect();
    const chatRect = chat.getBoundingClientRect();
    if (!(bgRect.width > 0 && bgRect.height > 0 && chatRect.width > 0 && chatRect.height > 0)) {
      clearChatFadeVisual();
      setChatFadeStatus('渐隐侠正在等待壁纸层与聊天区域完成布局。');
      return false;
    }

    clearChatFadeVisual();

    const beforeFree = chatFadePseudoIsFree(chat, 'before');
    const afterFree = chatFadePseudoIsFree(chat, 'after');
    const pseudo = beforeFree ? 'before' : (afterFree ? 'after' : null);
    const display = chatCss.display || '';
    const flexColumn = display.includes('flex') && chatCss.flexDirection === 'column';
    const gridLayout = display === 'grid' || display === 'inline-grid';
    const rtlLayout = chatCss.direction === 'rtl';
    const afterNeedsFixed = pseudo === 'after' && !flexColumn;
    const fixedMode = gridLayout || (display.includes('flex') && !flexColumn) || rtlLayout || afterNeedsFixed;
    const fixedContainingBlock = fixedMode && chatFadeHasFixedContainingBlock(chat);

    if (pseudo && !fixedContainingBlock) {
      setChatFadeWallpaperVariables(
        chat,
        bgCss,
        hasBgImage ? null : sourceImg,
        { bgRect, chatRect, chatCss },
        fixedMode ? 'fixed' : 'sticky'
      );
      chat.classList.add(
        CHAT_FADE_CLASS,
        pseudo === 'before' ? CHAT_FADE_PSEUDO_BEFORE_CLASS : CHAT_FADE_PSEUDO_AFTER_CLASS
      );
      if (fixedMode) chat.classList.add(CHAT_FADE_FIXED_CLASS);
      state.chatFade.chat = chat;
      state.chatFade.bg1 = bg1;
      state.chatFade.active = true;
      state.chatFade.pseudo = pseudo;
      state.chatFade.renderMode = fixedMode ? 'fixed-pseudo' : 'sticky-pseudo';
      setChatFadeStatus('渐隐侠已启用：CSS 伪元素壁纸镜像、上下透明渐隐及主题毛玻璃采样均已运行；未向 #chat 插入节点。');
      return true;
    }

    const fallbackSafe = chatCss.backgroundImage === 'none'
      && bgCss.filter === 'none'
      && bgCss.opacity === '1'
      && bgCss.mixBlendMode === 'normal';

    if (fallbackSafe) {
      setChatFadeWallpaperVariables(
        chat,
        bgCss,
        hasBgImage ? null : sourceImg,
        { bgRect, chatRect, chatCss },
        'fixed'
      );
      chat.classList.add(CHAT_FADE_CLASS, CHAT_FADE_BACKGROUND_FALLBACK_CLASS);
      state.chatFade.chat = chat;
      state.chatFade.bg1 = bg1;
      state.chatFade.active = true;
      state.chatFade.pseudo = null;
      state.chatFade.renderMode = 'background-fallback';
      setChatFadeStatus('渐隐侠已启用：当前主题无法安全使用伪元素，已改用透明聊天背景绘制壁纸；未覆盖主题装饰或插入节点。');
      return true;
    }

    chat.classList.add(CHAT_FADE_CLASS);
    state.chatFade.chat = chat;
    state.chatFade.bg1 = bg1;
    state.chatFade.active = true;
    state.chatFade.pseudo = null;
    state.chatFade.renderMode = 'mask-only';
    setChatFadeStatus('渐隐遮罩已启用；当前主题无法安全使用 #chat 伪元素或背景回退。为保护主题装饰，暂不绘制壁纸镜像。');
    return true;
  }

  function scheduleChatFadeWallpaperSync() {
    if (!chatFadeEnabled || state.destroyed || state.chatFade.wallpaperRaf) return;

    state.chatFade.wallpaperRaf = HOST_WIN.requestAnimationFrame(() => {
      state.chatFade.wallpaperRaf = 0;
      if (!chatFadeEnabled || state.destroyed) return;

      const currentBg = getChatFadeBg1();
      if (!currentBg) {
        clearChatFadeVisual();
        setChatFadeStatus('渐隐侠已开启，但暂时找不到 #bg1。等待壁纸层恢复。');
        return;
      }

      if (currentBg !== state.chatFade.bg1 ||
          currentBg.parentElement !== state.chatFade.wallpaperParent) {
        bindChatFadeWallpaperSync(currentBg);
      }

      createChatFadeMirror();
    });
  }

  function scheduleChatFadeRefresh() {
    if (!chatFadeEnabled || state.destroyed || state.chatFade.refreshRaf) return;

    state.chatFade.refreshRaf = HOST_WIN.requestAnimationFrame(() => {
      state.chatFade.refreshRaf = 0;
      if (chatFadeEnabled && !state.destroyed) createChatFadeMirror();
    });
  }

  function setChatFadeEnabled(enabled) {
    chatFadeEnabled = Boolean(enabled);
    try { HOST_WIN.localStorage.setItem(CHAT_FADE_ENABLED_KEY, String(chatFadeEnabled)); } catch {}

    const input = state.panel?.querySelector('[data-tle-setting="chat-fade-enabled"]');
    if (input) input.checked = chatFadeEnabled;
    syncChatFadeBottomPadding();

    if (chatFadeEnabled) {
      setChatFadeStatus('正在初始化渐隐侠…');
      createChatFadeMirror();
    } else {
      clearChatFadeVisual();
      stopChatFadeWallpaperObservers();
      if (state.chatFade.refreshRaf) HOST_WIN.cancelAnimationFrame(state.chatFade.refreshRaf);
      state.chatFade.refreshRaf = 0;
      setChatFadeStatus('渐隐侠已关闭。聊天区域、壁纸和毛玻璃均恢复主题原样。');
    }
  }

  function getHiddenMessageRangeSummary(snapshot) {
    const indices = [];
    for (let index = 0; index < snapshot.chat.length; index++) {
      const message = snapshot.chat[index];
      if (message?.is_system === true || message?.is_system === 'true' || message?.is_system === 1) indices.push(index);
    }

    if (!indices.length) return { count: 0, text: '' };

    const ranges = [];
    let start = indices[0];
    let previous = start;
    for (let i = 1; i < indices.length; i++) {
      const current = indices[i];
      if (current === previous + 1) {
        previous = current;
        continue;
      }
      ranges.push(start === previous ? String(start) : `${start}–${previous}`);
      start = previous = current;
    }
    ranges.push(start === previous ? String(start) : `${start}–${previous}`);
    return { count: indices.length, text: ranges.join('，') };
  }

  function readRecentChatSettings(accountStorage) {
    try {
      const raw = accountStorage?.getItem?.('recentChatsSettings');
      const parsed = raw ? JSON.parse(raw) : {};
      const max = Number.parseInt(parsed?.maxDisplayed, 10);
      return { maxDisplayed: Number.isFinite(max) ? Math.min(1000, Math.max(1, max)) : 15 };
    } catch {
      return { maxDisplayed: 15 };
    }
  }

  function readPinnedRecentChats(accountStorage) {
    try {
      const raw = accountStorage?.getItem?.('pinnedChats');
      const parsed = raw ? JSON.parse(raw) : {};
      const values = Array.isArray(parsed) ? parsed : Object.values(parsed || {});
      return values.filter(item => item && typeof item.file_name === 'string');
    } catch {
      return [];
    }
  }

  function formatRecentChatDate(timestamp, context) {
    try {
      const value = context?.timestampToMoment?.(timestamp);
      if (value?.format && (typeof value.isValid !== 'function' || value.isValid())) {
        return { short: value.format('l'), long: value.format('LL LT') };
      }
    } catch {}
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return { short: '', long: '' };
    return { short: date.toLocaleDateString(), long: date.toLocaleString() };
  }

  async function fetchRecentChatItems() {
    const context = HOST_WIN.SillyTavern?.getContext?.();
    if (!context?.accountStorage || typeof context.getRequestHeaders !== 'function') {
      throw new Error('无法读取酒馆账户存储或请求凭证。');
    }

    const settings = readRecentChatSettings(context.accountStorage);
    const pinned = readPinnedRecentChats(context.accountStorage);
    const response = await HOST_WIN.fetch('/api/chats/recent', {
      method: 'POST',
      headers: context.getRequestHeaders(),
      body: JSON.stringify({ max: settings.maxDisplayed, pinned }),
      cache: 'no-cache',
    });
    if (!response.ok) throw new Error(`最近聊天读取失败（HTTP ${response.status}）。`);

    const records = await response.json();
    if (!Array.isArray(records)) throw new Error('酒馆返回的最近聊天数据格式无效。');

    const characters = Array.isArray(context.characters) ? context.characters : [];
    const groups = Array.isArray(context.groups) ? context.groups : [];
    return records.map(record => {
      const character = record.avatar ? characters.find(item => item.avatar === record.avatar) : null;
      const group = record.group ? groups.find(item => String(item.id) === String(record.group)) : null;
      if (!character && !group) return null;

      const fileName = String(record.file_name || '');
      const chatName = String(record.file_id || fileName.replace(/\.jsonl$/i, ''));
      const isPinned = pinned.some(item => item.file_name === fileName
        && String(item.avatar || '') === String(record.avatar || '')
        && String(item.group || '') === String(record.group || ''));
      const date = formatRecentChatDate(record.last_mes, context);
      return {
        ...record,
        file_name: fileName,
        chat_name: chatName,
        avatar: String(record.avatar || ''),
        group: String(record.group || ''),
        is_group: Boolean(record.group),
        char_name: character?.name || group?.name || '未知角色',
        character_data: character,
        group_data: group,
        date_short: date.short,
        date_long: date.long,
        pinned: isPinned,
        mes: String(record.mes || ''),
        chat_items: Number(record.chat_items) || 0,
        file_size: String(record.file_size || ''),
      };
    }).filter(Boolean);
  }

  function createRecentChatAvatar(item, context) {
    const group = item.group_data;
    if (group) {
      const groupRow = [...HOST_DOC.querySelectorAll('.group_select[data-grid]')]
        .find(node => node.getAttribute('data-grid') === String(group.id));
      const nativeAvatar = groupRow?.querySelector('.avatar, .missing-avatar');
      if (nativeAvatar) return nativeAvatar.cloneNode(true);

      const customAvatar = typeof group.avatar_url === 'string'
        && (group.avatar_url.startsWith('data:') || group.avatar_url.startsWith('user') || group.avatar_url.startsWith('/user'))
        ? group.avatar_url : '';
      if (customAvatar) {
        const avatar = quickNode('div', 'avatar');
        avatar.title = `[Group] ${group.name}`;
        const image = quickNode('img');
        image.src = customAvatar;
        image.alt = group.name || '';
        avatar.appendChild(image);
        return avatar;
      }

      const memberUrls = (Array.isArray(group.members) ? group.members : [])
        .map(member => context.characters?.find(character => character.avatar === member))
        .filter(character => character && character.avatar && character.avatar !== 'none')
        .slice(0, 4)
        .map(character => context.getThumbnailUrl?.('avatar', character.avatar) || '');
      const collageTemplate = memberUrls.length
        ? HOST_DOC.querySelector(`#group_avatars_template .collage_${memberUrls.length}`)
        : null;
      if (collageTemplate) {
        const avatar = collageTemplate.cloneNode(true);
        avatar.title = `[Group] ${group.name}`;
        memberUrls.forEach((url, index) => {
          const image = avatar.querySelector(`.img_${index + 1}`);
          if (image) image.src = url;
        });
        return avatar;
      }

      if (!memberUrls.length) {
        const missing = quickNode('div', 'missing-avatar fa-solid fa-user-slash');
        missing.title = `[Group] ${group.name}`;
        return missing;
      }
      const fallback = quickNode('div', 'avatar');
      fallback.title = `[Group] ${group.name}`;
      const image = quickNode('img');
      image.src = memberUrls[0];
      image.alt = group.name || '';
      fallback.appendChild(image);
      return fallback;
    }

    const avatar = quickNode('div', 'avatar');
    avatar.title = `[Character] ${item.char_name}\nFile: ${item.avatar}`;
    const image = quickNode('img');
    image.alt = item.char_name || '';
    const source = item.character_data?.avatar;
    if (source && source !== 'none') image.src = context.getThumbnailUrl?.('avatar', source) || '';
    avatar.appendChild(image);
    return avatar;
  }

  function createRecentChatRow(item, context, currentIdentity) {
    const row = quickNode('div', `recentChat${item.is_group ? ' group' : ''}`);
    row.dataset.recentChatItem = '';
    row.dataset.file = item.chat_name;
    row.dataset.avatar = item.avatar;
    row.dataset.group = item.group;
    row.setAttribute('role', 'button');
    row.tabIndex = 0;

    const isCurrent = item.chat_name === currentIdentity.chatId
      && (item.is_group
        ? item.group === currentIdentity.groupId
        : !currentIdentity.groupId && item.avatar === currentIdentity.avatar);
    row.dataset.current = String(isCurrent);
    row.title = isCurrent ? '当前聊天' : '点击切换到此聊天';
    row.setAttribute('aria-label', `${isCurrent ? '当前聊天：' : '打开聊天：'}${item.char_name} - ${item.chat_name}`);
    row.dataset.searchText = [item.char_name, item.chat_name, item.mes, item.file_name].join(' ').toLocaleLowerCase();

    if (item.pinned) {
      const pinned = quickNode('div', 'recentChatPinned');
      const icon = quickNode('i', 'fa-solid fa-thumbtack fa-fw fa-xs');
      icon.title = '已置顶';
      pinned.appendChild(icon);
      row.appendChild(pinned);
    }

    row.appendChild(createRecentChatAvatar(item, context));

    const info = quickNode('div', 'recentChatInfo');
    const nameLine = quickNode('div', 'chatNameContainer');
    const name = quickNode('div', 'chatName');
    name.title = item.file_name;
    const characterName = quickNode('strong', 'characterName', item.char_name);
    const separator = quickNode('span', '', '–');
    const chatName = quickNode('span', '', item.chat_name);
    name.append(characterName, separator, chatName);
    const date = quickNode('small', 'chatDate', isCurrent ? '当前' : item.date_short);
    date.title = isCurrent ? '当前聊天' : item.date_long;
    nameLine.append(name, date);

    const messageLine = quickNode('div', 'chatMessageContainer');
    const preview = quickNode('div', 'chatMessage', item.mes || '（暂无消息预览）');
    preview.title = item.mes || '';
    const stats = quickNode('div', 'chatStats');
    const counter = quickNode('div', 'counterBlock');
    counter.appendChild(quickNode('i', 'fa-solid fa-comment fa-xs'));
    counter.appendChild(quickNode('small', '', String(item.chat_items)));
    stats.append(counter, quickNode('small', 'fileSize', item.file_size));
    messageLine.append(preview, stats);
    info.append(nameLine, messageLine);
    row.appendChild(info);
    return row;
  }

  function filterRecentChatRows() {
    const recent = state.chatTools.recent;
    if (!recent.list) return;
    const term = String(recent.search?.value || '').trim().toLocaleLowerCase();
    const context = HOST_WIN.SillyTavern?.getContext?.();
    const groupId = String(context?.groupId || '');
    const characterId = Number(context?.characterId);
    const character = Number.isInteger(characterId) && characterId >= 0 ? context?.characters?.[characterId] : null;
    const avatarId = String(character?.avatar || '');
    const rows = [...recent.list.querySelectorAll('.recentChat[data-recent-chat-item]')];
    let visible = 0;
    rows.forEach(row => {
      const matchesSearch = !term || String(row.dataset.searchText || '').includes(term);
      const matchesCurrent = !recent.onlyCurrent || (groupId
        ? row.dataset.group === groupId
        : Boolean(avatarId) && !row.dataset.group && row.dataset.avatar === avatarId);
      const matches = matchesSearch && matchesCurrent;
      row.classList.toggle('hidden', !matches);
      if (matches) visible++;
    });
    const noResults = recent.list.querySelector('[data-tle-recent-no-results]');
    if (noResults) noResults.hidden = (!term && !recent.onlyCurrent) || visible > 0;
    const count = state.chatTools.panel?.querySelector('[data-tle-recent-count]');
    if (count) count.textContent = visible === rows.length ? `${rows.length} 条` : `${visible}/${rows.length} 条`;
  }

  function renderRecentChatRows(items, context) {
    const recent = state.chatTools.recent;
    if (!recent.list) return;
    recent.items = items;
    recent.list.replaceChildren();

    if (!items.length) {
      recent.list.appendChild(quickNode('div', 'noRecentChat', '暂无最近聊天'));
      const count = state.chatTools.panel?.querySelector('[data-tle-recent-count]');
      if (count) count.textContent = '0 条';
      return;
    }

    const currentId = typeof context.getCurrentChatId === 'function'
      ? context.getCurrentChatId()
      : context.chatId;
    const characterId = Number(context.characterId);
    const currentCharacter = Number.isInteger(characterId) && characterId >= 0
      ? context.characters?.[characterId]
      : null;
    const currentIdentity = {
      chatId: String(currentId || ''),
      groupId: String(context.groupId || ''),
      avatar: String(currentCharacter?.avatar || ''),
    };
    if (state.chatTools.recent.filterButton) {
      state.chatTools.recent.filterButton.textContent = currentIdentity.groupId ? '当前群组' : '当前角色';
      state.chatTools.recent.filterButton.disabled = !currentIdentity.groupId && !currentIdentity.avatar;
    }

    for (const item of items) {
      recent.list.appendChild(createRecentChatRow(item, context, currentIdentity));
    }
    const noResults = quickNode('div', 'noRecentChat', '没有匹配的聊天');
    noResults.dataset.tleRecentNoResults = '';
    noResults.hidden = true;
    recent.list.appendChild(noResults);
    filterRecentChatRows();
  }

  async function refreshRecentChats() {
    const tools = state.chatTools;
    const recent = tools.recent;
    if (!tools.open || tools.page !== 'recent' || !recent.list || recent.loading) return;

    const requestId = ++recent.requestId;
    recent.loading = true;
    if (recent.refreshButton) recent.refreshButton.disabled = true;
    recent.list.replaceChildren(quickNode('div', 'noRecentChat', '正在读取最近聊天…'));

    try {
      const context = HOST_WIN.SillyTavern?.getContext?.();
      if (!context) throw new Error('无法读取酒馆上下文。');
      const items = await fetchRecentChatItems();
      if (requestId !== recent.requestId || !tools.open || tools.page !== 'recent') return;
      renderRecentChatRows(items, context);
    } catch (error) {
      if (requestId !== recent.requestId || !tools.open || tools.page !== 'recent') return;
      recent.list.replaceChildren(quickNode('div', 'noRecentChat', error?.message || '最近聊天读取失败。'));
      const count = tools.panel?.querySelector('[data-tle-recent-count]');
      if (count) count.textContent = '读取失败';
    } finally {
      if (requestId === recent.requestId) {
        recent.loading = false;
        if (recent.refreshButton) recent.refreshButton.disabled = false;
      }
    }
  }

// 配套侠：角色方案与当前宿主快切控件共享同一套原生切换器。
  const COMPANION_KEY = 'tle.companion.v1';
  const COMPANION_FIELDS = [
    { id: 'profile', name: '连接配置', type: 'api' },
    { id: 'source', name: '接口来源', type: 'api' },
    { id: 'model', name: '模型', type: 'api' },
    { id: 'preset', name: '预设', type: 'preset' },
    { id: 'reasoning', name: '推理格式', type: 'reasoning' },
    { id: 'theme', name: 'UI 主题', type: 'theme' },
  ];
  const companionRuntime = {
    lastRole: '', lastApplied: new Map(), applying: false, timer: 0,
    pending: null, source: null, listeners: [], scheduleTimer: 0,
    generationRetryTimer: 0, lastScheduleToken: '',
  };
  function companionCurrentRole() {
    try {
      const context = HOST_WIN.SillyTavern?.getContext?.();
      if (!context || context.groupId != null) return null;
      const char = context.characters?.[context.characterId];
      return char?.avatar ? { key: String(char.avatar), name: String(char.name || '未命名角色') } : null;
    } catch { return null; }
  }
  function companionRead() {
    try {
      const raw = JSON.parse(HOST_WIN.localStorage.getItem(COMPANION_KEY) || 'null');
      if (raw?.schema === 1 && Array.isArray(raw.plans)) {
        return {
          schema: 1,
          plans: raw.plans.filter(p => p && typeof p.id === 'string' && typeof p.name === 'string'
            && Array.isArray(p.roles) && p.fields && typeof p.fields === 'object'),
          defaults: raw.defaults && typeof raw.defaults === 'object' ? raw.defaults : {},
          schedules: raw.schedules && typeof raw.schedules === 'object' ? raw.schedules : {},
          manualHolds: raw.manualHolds && typeof raw.manualHolds === 'object' ? raw.manualHolds : {},
        };
      }
    } catch (error) { console.warn('[配套侠] 读取方案失败', error); }
    return { schema: 1, plans: [], defaults: {}, schedules: {}, manualHolds: {} };
  }
  function companionSave(data) {
    try {
      HOST_WIN.localStorage.setItem(COMPANION_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      HOST_WIN.toastr?.error?.('方案保存失败：浏览器存储空间不足或被禁用。');
      console.warn('[配套侠] 保存失败', error);
      return false;
    }
  }
  function companionNotice(type, message) {
    if (typeof HOST_WIN.toastr?.[type] === 'function') HOST_WIN.toastr[type](message, '配套侠');
    else console.info('[配套侠]', message);
  }
  function companionId() {
    return 'kit-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 9);
  }
  function companionForRole(role = companionCurrentRole()) {
    return role ? companionRead().plans.filter(p => p.roles.includes(role.key)) : [];
  }
  function companionEntryId(field, item) {
    if (field.id === 'profile') return item.selectId === 'connection_profiles';
    if (field.id === 'source') return item.selectId === 'chat_completion_source';
    if (field.id === 'model') return item.section === '模型';
    return true;
  }
  async function companionCatalogs() {
    const catalogs = {};
    for (const type of ['api', 'preset', 'reasoning', 'theme']) {
      try {
        // Catalogs are read from TLE's own host-aware quick-switch resolvers.
        catalogs[type] = await quickCatalog(type, false, state.abort.signal);
      } catch (error) {
        catalogs[type] = [];
        console.warn('[配套侠] 无法读取 ' + type + ' 列表', error);
      }
    }
    return catalogs;
  }
  function companionSnapshot(catalogs) {
    const fields = {};
    for (const field of COMPANION_FIELDS) {
      const item = (catalogs[field.type] || []).find(e => e.selected && companionEntryId(field, e));
      if (item) fields[field.id] = { selectId: item.selectId, value: item.value, label: item.label };
    }
    return fields;
  }
  function companionPlanDetails(plan) {
    return COMPANION_FIELDS.filter(field => plan.fields[field.id])
      .map(field => field.name + '：' + (plan.fields[field.id].label || plan.fields[field.id].value)).join(' · ');
  }
  function companionTextButton(label, action) {
    return quickButton(label, action, 'menu_button');
  }

  function companionClockTime(value) {
    if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return null;
    const h = Number(value.slice(0, 2)), m = Number(value.slice(3, 5));
    return h <= 23 && m <= 59 ? [h, m] : null;
  }
  function companionScheduleState(data, role, now = new Date()) {
    const rule = data.schedules?.[role?.key];
    if (!rule?.enabled || !role) return null;
    const day = companionClockTime(rule.dayStart), night = companionClockTime(rule.nightStart);
    if (!day || !night || rule.dayStart === rule.nightStart) return null;
    const valid = id => data.plans.some(p => p.id === id && p.roles.includes(role.key));
    if (!valid(rule.dayPlanId) || !valid(rule.nightPlanId)) return null;
    const boundaries = [];
    // Calendar days, not fixed 24-hour offsets, to accommodate local DST.
    for (let offset = -1; offset <= 2; offset++) {
      for (const [period, [h, m], id] of [
        ['day', day, rule.dayPlanId], ['night', night, rule.nightPlanId],
      ]) {
        const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, h, m).getTime();
        boundaries.push({ period, id, at });
      }
    }
    boundaries.sort((a, b) => a.at - b.at);
    const current = [...boundaries].reverse().find(p => p.at <= now.getTime());
    const next = boundaries.find(p => p.at > now.getTime());
    return current && next
      ? { period: current.period, planId: current.id, startedAt: current.at,
          nextAt: next.at, nextPeriod: next.period, nextPlanId: next.id,
          token: role.key + '|' + current.at + '|' + current.period }
      : null;
  }
  function companionManualHold(data, role, slot, now = Date.now()) {
    const hold = data.manualHolds?.[role?.key];
    return Boolean(slot && hold && Number(hold.until) > now && Number(hold.until) <= slot.nextAt);
  }
  function companionAutoTarget(data, role, now = new Date()) {
    if (!role) return null;
    const slot = companionScheduleState(data, role, now);
    const id = slot?.planId || (!data.schedules?.[role.key]?.enabled ? data.defaults[role.key] : '');
    const plan = data.plans.find(p => p.id === id && p.roles.includes(role.key));
    return plan ? { id: plan.id, plan, slot } : null;
  }
  function companionArmSchedule(slot) {
    HOST_WIN.clearTimeout(companionRuntime.scheduleTimer);
    companionRuntime.scheduleTimer = 0;
    if (!slot || state.destroyed) return;
    const delay = Math.min(2147000000, Math.max(250, slot.nextAt - Date.now() + 120));
    companionRuntime.scheduleTimer = HOST_WIN.setTimeout(() => {
      companionRuntime.scheduleTimer = 0;
      companionOnChatChanged();
    }, delay);
  }
  function companionQueueGenerationRetry() {
    if (state.destroyed || companionRuntime.generationRetryTimer) return;
    companionRuntime.generationRetryTimer = HOST_WIN.setTimeout(() => {
      companionRuntime.generationRetryTimer = 0;
      if (state.destroyed || !companionRuntime.pending) return;
      if (isNativeGenerationVisible()) companionQueueGenerationRetry();
      else companionOnChatChanged(true);
    }, 12000);
  }
  function companionScheduleStatus(data, role) {
    const slot = companionScheduleState(data, role);
    if (!slot) return '';
    const plan = data.plans.find(p => p.id === slot.planId);
    const next = data.plans.find(p => p.id === slot.nextPlanId);
    const nextTime = new Date(slot.nextAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (slot.period === 'day' ? '☀ 日间' : '☾ 夜间') + '：' + (plan?.name || '未知方案')
      + ' · 下次 ' + nextTime + ' → ' + (next?.name || '未知方案');
  }

  function companionRefreshList() {
    const list = state.chatTools.panel?.querySelector('[data-companion-list]');
    const heading = state.chatTools.panel?.querySelector('[data-companion-role]');
    if (!list) return;
    const role = companionCurrentRole();
    const data = companionRead();
    list.replaceChildren();
    if (heading) heading.textContent = role ? role.name + ' · ' + data.plans.filter(p => p.roles.includes(role.key)).length + ' 套方案' : '当前不是单角色聊天';
    if (!role) {
      list.append(quickNode('p', 'tle-quick-empty', '请先切换到一个角色。群聊暂不关联配套方案。'));
      return;
    }
    const plans = data.plans.filter(p => p.roles.includes(role.key));
    if (!plans.length) {
      list.append(quickNode('p', 'tle-quick-empty', '还没有绑定方案。可将当前配置直接保存为第一套方案。'));
      return;
    }
    for (const plan of plans) {
      const isDefault = data.defaults[role.key] === plan.id;
      const rule = data.schedules?.[role.key];
      const isDay = rule?.enabled && rule.dayPlanId === plan.id;
      const isNight = rule?.enabled && rule.nightPlanId === plan.id;
      const row = quickNode('div', 'tle-companion-plan' + (isDefault ? ' is-default' : ''));
      const summary = quickNode('div', 'tle-companion-copy');
      const titleRow = quickNode('div', 'tle-companion-title');
      titleRow.append(quickNode('strong', '', plan.name));
      if (isDefault) titleRow.append(quickNode('span', 'tle-companion-default-badge', '★ 角色默认'));
      if (isDay) titleRow.append(quickNode('span', 'tle-companion-schedule-badge', '☀ 日间'));
      if (isNight) titleRow.append(quickNode('span', 'tle-companion-schedule-badge', '☾ 夜间'));
      summary.append(titleRow);
      summary.append(quickNode('small', '', companionPlanDetails(plan) || '空方案'));
      const controls = quickNode('div', 'tle-companion-actions');
      const apply = companionTextButton('应用', () => { void companionApply(plan.id); });
      apply.disabled = companionRuntime.applying;
      controls.append(apply);
      row.append(summary, controls);
      list.append(row);
    }
  }
  function companionEditorRow(field, catalogs, saved) {
    const line = quickNode('div', 'tle-companion-field');
    const toggle = quickNode('input');
    toggle.type = 'checkbox';
    toggle.checked = Boolean(saved);
    const name = quickNode('span', 'tle-companion-field-label', field.name);
    const select = quickNode('select', 'text_pole');
    select.setAttribute('aria-label', field.name);
    const choices = (catalogs[field.type] || []).filter(item => companionEntryId(field, item) && !item.disabled);
    const known = new Set();
    for (const item of choices) {
      const signature = JSON.stringify([item.selectId, item.value]);
      if (known.has(signature)) continue;
      known.add(signature);
      const option = quickNode('option', '', item.label);
      option.value = signature;
      select.append(option);
    }
    const savedSignature = saved && JSON.stringify([saved.selectId, saved.value]);
    if (savedSignature && !known.has(savedSignature)) {
      const old = quickNode('option', '', '原配置（当前未读取）：' + (saved.label || saved.value));
      old.value = savedSignature;
      select.prepend(old);
    }
    if (savedSignature) select.value = savedSignature;
    else {
      const active = choices.find(item => item.selected);
      if (active) select.value = JSON.stringify([active.selectId, active.value]);
    }
    if (!select.options.length) {
      const missing = quickNode('option', '', '当前无法读取该项，请先打开原生设置');
      missing.value = '';
      select.append(missing);
      toggle.checked = false;
      toggle.disabled = true;
    }
    select.disabled = !toggle.checked;
    toggle.addEventListener('change', () => { select.disabled = !toggle.checked; });
    line.append(toggle, name, select);
    return { line, toggle, select, choices, saved };
  }
  async function companionOpenEditor(planId = '', duplicate = false, replaceCurrent = false) {
    const role = companionCurrentRole();
    if (!role) { companionNotice('warning', '请先进入单角色聊天。'); return; }
    if (companionRuntime.applying) return;
    closeChatTools(false);
    const savedData = companionRead();
    const source = savedData.plans.find(p => p.id === planId && p.roles.includes(role.key));
    if (planId && !source) { companionNotice('warning', '方案已不存在。'); return; }
    const shell = makeQuickPanel(source ? (duplicate ? '复制配套方案' : '编辑配套方案') : '保存当前配套方案', null, 'companion-editor');
    const pending = quickNode('p', 'tle-muted', '读取当前快切项目中…');
    shell.body.append(pending);
    const catalogs = await companionCatalogs();
    if (quickPanel !== shell || state.destroyed) return;
    pending.remove();
    const defaults = savedData.defaults;
    const fields = source && !replaceCurrent ? source.fields : companionSnapshot(catalogs);
    const form = quickNode('div', 'tle-companion-editor');
    const nameLabel = quickNode('label', '', '方案名称');
    const nameInput = quickNode('input', 'text_pole');
    nameInput.maxLength = 64;
    nameInput.value = source ? source.name + (duplicate ? ' · 副本' : '') : '新方案';
    nameLabel.append(nameInput);
    form.append(nameLabel, quickNode('p', 'tle-muted', '未勾选的项目保持原样。壁纸自动跟随主题绑定，不单独保存。'));
    const rows = COMPANION_FIELDS.map(field => {
      const item = companionEditorRow(field, catalogs, fields[field.id]);
      form.append(item.line);
      return { field, ...item };
    });
    const defaultRow = quickNode('label', 'tle-companion-default');
    const defaultToggle = quickNode('input');
    defaultToggle.type = 'checkbox';
    defaultToggle.checked = source && !duplicate ? defaults[role.key] === source.id : false;
    defaultRow.append(defaultToggle, quickNode('span', '', '设为角色默认（日夜定时关闭时自动应用）'));
    form.append(defaultRow);
    const actions = quickNode('div', 'tle-companion-actions');
    const saveButton = companionTextButton('保存方案', () => {
      const name = nameInput.value.trim();
      if (!name) { companionNotice('warning', '请填写方案名称。'); return; }
      const nextFields = {};
      for (const row of rows) {
        if (!row.toggle.checked) continue;
        let signature;
        try { signature = JSON.parse(row.select.value); } catch {}
        if (!signature || !signature[0] || signature[1] == null) continue;
        const selected = row.choices.find(item => item.selectId === signature[0] && item.value === signature[1]);
        nextFields[row.field.id] = {
          selectId: signature[0], value: signature[1],
          label: selected?.label || (row.saved?.label || String(signature[1])),
        };
      }
      if (!Object.keys(nextFields).length) { companionNotice('warning', '没有可保存的配置项。'); return; }
      const fresh = companionRead();
      const id = source && !duplicate ? source.id : companionId();
      const old = fresh.plans.find(p => p.id === id);
      const next = { id, name, roles: old?.roles || [role.key], fields: nextFields };
      fresh.plans = old ? fresh.plans.map(p => p.id === id ? next : p) : [...fresh.plans, next];
      if (defaultToggle.checked) fresh.defaults[role.key] = id;
      else if (fresh.defaults[role.key] === id) delete fresh.defaults[role.key];
      if (!companionSave(fresh)) return;
      closeQuickPanel(false);
      companionRefreshList();
      companionNotice('success', '方案已保存：' + name + (defaultToggle.checked ? '（已设角色默认）' : ''));
    });
    const cancel = companionTextButton('取消', () => closeQuickPanel(false));
    actions.append(saveButton, cancel);
    form.append(actions);
    shell.body.append(form);
  }

  function companionRenderSchedule(host, role, data, rerender) {
    const section = quickNode('section', 'tle-companion-schedule');
    const heading = quickNode('div', 'tle-companion-title');
    heading.append(quickNode('strong', '', '日夜定时 · 当前角色'));
    const rule = data.schedules?.[role.key] || {};
    const enableLabel = quickNode('label', 'tle-companion-default');
    const enabled = quickNode('input');
    enabled.type = 'checkbox';
    enabled.checked = rule.enabled === true;
    enableLabel.append(enabled, quickNode('span', '', '启用自动切换'));
    heading.append(enableLabel);
    section.append(heading);
    const plans = data.plans.filter(p => p.roles.includes(role.key));
    const rows = [];
    for (const part of [
      { period: 'day', label: '☀ 日间开始', time: rule.dayStart || '07:00', planId: rule.dayPlanId || data.defaults[role.key] || plans[0]?.id || '' },
      { period: 'night', label: '☾ 夜间开始', time: rule.nightStart || '19:00', planId: rule.nightPlanId || plans.find(p => p.id !== data.defaults[role.key])?.id || plans[0]?.id || '' },
    ]) {
      const row = quickNode('label', 'tle-companion-schedule-row');
      const caption = quickNode('span', '', part.label);
      const time = quickNode('input', 'text_pole');
      time.type = 'time';
      time.value = part.time;
      time.setAttribute('aria-label', part.label + '时间');
      const select = quickNode('select', 'text_pole');
      select.setAttribute('aria-label', part.label + '方案');
      const empty = quickNode('option', '', '选择方案');
      empty.value = '';
      select.append(empty);
      for (const plan of plans) {
        const option = quickNode('option', '', plan.name);
        option.value = plan.id;
        select.append(option);
      }
      select.value = part.planId;
      row.append(caption, time, select);
      rows.push({ period: part.period, time, select });
      section.append(row);
    }
    section.append(quickNode('small', 'tle-muted',
      '日间、夜间只是时间段名称，可任意搭配方案。手动应用其他方案后，会保持到下一次时间点。'));
    const status = quickNode('small', 'tle-muted', rule.enabled
      ? (companionScheduleStatus(data, role) || '定时方案失效，请重新选择并保存。')
      : '未启用：切换角色时使用角色默认方案。');
    section.append(status);
    const save = companionTextButton('保存日夜设置', () => {
      const next = {
        enabled: enabled.checked,
        dayStart: rows[0].time.value, nightStart: rows[1].time.value,
        dayPlanId: rows[0].select.value, nightPlanId: rows[1].select.value,
      };
      if (next.enabled && (!companionClockTime(next.dayStart)
        || !companionClockTime(next.nightStart) || next.dayStart === next.nightStart
        || !plans.some(p => p.id === next.dayPlanId)
        || !plans.some(p => p.id === next.nightPlanId))) {
        companionNotice('warning', '请选择不同的日间/夜间时间，并分别指定有效方案。');
        return;
      }
      const fresh = companionRead();
      fresh.schedules[role.key] = next;
      delete fresh.manualHolds[role.key];
      if (!companionSave(fresh)) return;
      companionRuntime.lastScheduleToken = '';
      companionNotice('success', next.enabled
        ? '日夜定时已保存，现在按当前时段应用方案。'
        : '日夜定时已关闭；原有角色默认方案仍保留。');
      companionOnChatChanged(next.enabled);
      companionRefreshList();
      rerender();
    });
    save.disabled = !plans.length;
    section.append(save);
    host.append(section);
  }

  function companionOpenManager() {
    closeChatTools(false);
    const role = companionCurrentRole();
    const shell = makeQuickPanel('配套侠 · 方案管理', null, 'companion-manager');
    const body = quickNode('div', 'tle-companion-manager');
    shell.body.append(body);
    const render = () => {
      if (quickPanel !== shell) return;
      body.replaceChildren();
      const data = companionRead();
      body.append(quickNode('p', 'tle-muted', role ? '当前角色：' + role.name : '请先进入一个角色，才能关联和编辑配套方案。'));
      body.append(quickNode('p', 'tle-muted', '角色默认方案：未启用日夜定时时自动应用。启用日夜定时后，以当前时段设置为准。'));
      if (!role) return;
      const add = companionTextButton('保存当前配置', () => void companionOpenEditor());
      body.append(add);
      const plans = data.plans.filter(p => p.roles.includes(role.key));
      for (const plan of plans) {
        const isDefault = data.defaults[role.key] === plan.id;
        const card = quickNode('section', 'tle-companion-plan' + (isDefault ? ' is-default' : ''));
        const copy = quickNode('div', 'tle-companion-copy');
        const titleRow = quickNode('div', 'tle-companion-title');
        titleRow.append(quickNode('strong', '', plan.name));
        if (isDefault) titleRow.append(quickNode('span', 'tle-companion-default-badge', '★ 角色默认'));
        if (data.schedules?.[role.key]?.enabled && data.schedules[role.key].dayPlanId === plan.id)
          titleRow.append(quickNode('span', 'tle-companion-schedule-badge', '☀ 日间'));
        if (data.schedules?.[role.key]?.enabled && data.schedules[role.key].nightPlanId === plan.id)
          titleRow.append(quickNode('span', 'tle-companion-schedule-badge', '☾ 夜间'));
        copy.append(titleRow);
        copy.append(quickNode('small', '', companionPlanDetails(plan)));
        const actions = quickNode('div', 'tle-companion-actions');
        const buttons = [
          ['编辑', () => void companionOpenEditor(plan.id)],
          ['复制', () => void companionOpenEditor(plan.id, true)],
          ['覆盖当前', () => void companionOpenEditor(plan.id, false, true)],
          [isDefault ? '取消默认' : '设为默认', () => {
            const fresh = companionRead();
            if (isDefault) delete fresh.defaults[role.key];
            else fresh.defaults[role.key] = plan.id;
            if (companionSave(fresh)) {
              render();
              companionRefreshList();
              companionNotice('success', isDefault
                ? '已取消角色默认；日夜定时规则不受影响。'
                : '已设为角色默认「' + plan.name + '」；如启用日夜定时则按时段优先。');
            }
          }],
          ['删除', () => {
            if (!HOST_WIN.confirm('确认删除方案「' + plan.name + '」？不会删除角色或原生配置。')) return;
            const fresh = companionRead();
            fresh.plans = fresh.plans.filter(p => p.id !== plan.id);
            for (const key of Object.keys(fresh.defaults)) if (fresh.defaults[key] === plan.id) delete fresh.defaults[key];
            for (const key of Object.keys(fresh.schedules)) {
              const slot = fresh.schedules[key];
              if (slot && (slot.dayPlanId === plan.id || slot.nightPlanId === plan.id)) slot.enabled = false;
            }
            if (companionSave(fresh)) {
              render();
              companionOnChatChanged();
              companionRefreshList();
            }
          }],
        ];
        for (const [label, handler] of buttons) actions.append(companionTextButton(label, handler));
        card.append(copy, actions);
        body.append(card);
      }
      if (!plans.length) body.append(quickNode('p', 'tle-quick-empty', '当前角色没有配套方案。'));
      companionRenderSchedule(body, role, data, render);
    };
    render();
  }
  async function companionApply(id, automatic = false) {
    if (state.destroyed) return;
    const role = companionCurrentRole();
    const plan = companionRead().plans.find(p => p.id === id && role && p.roles.includes(role.key));
    if (!plan) { if (!automatic) companionNotice('warning', '该方案已失效或不属于当前角色。'); return; }
    if (companionRuntime.applying) {
      // A second role change can arrive while the prior plan is still in flight.
      // The newer request supersedes the old; drain after its finally block.
      if (automatic) companionRuntime.pending = { id, roleKey: role.key };
      else companionNotice('info', '正在应用另一套方案，请稍后重试。');
      return;
    }
    if (isNativeGenerationVisible()) {
      if (automatic) {
        companionRuntime.pending = { id, roleKey: role.key };
        companionQueueGenerationRetry();
      } else companionNotice('warning', '正在生成回复，请在结束后手动应用。');
      return;
    }
    if (automatic) companionRuntime.pending = null;
    companionRuntime.applying = true;
    companionRefreshList();
    let finished = 0;
    try {
      for (const field of COMPANION_FIELDS) {
        const target = plan.fields[field.id];
        if (!target) continue;
        if (state.destroyed || companionCurrentRole()?.key !== role.key) throw new Error('角色已切换，停止应用旧方案。');
        const catalog = await quickCatalog(field.type, field.type === 'api' || field.type === 'preset', state.abort.signal);
        if (state.destroyed || companionCurrentRole()?.key !== role.key) throw new Error('角色已切换，停止应用旧方案。');
        const fresh = catalog.find(item => item.selectId === target.selectId && item.value === target.value && companionEntryId(field, item));
        if (!fresh || fresh.disabled) throw new Error(field.name + ' 不存在或当前不可用：' + (target.label || target.value));
        await applyQuickChoice(field.type, fresh, state.abort.signal);
        finished++;
      }
      if (state.destroyed || companionCurrentRole()?.key !== role.key) throw new Error('角色已切换，停止应用旧方案。');
      companionRuntime.lastApplied.set(role.key, id);
      if (!automatic) {
        const fresh = companionRead();
        const slot = companionScheduleState(fresh, role);
        if (slot) {
          fresh.manualHolds[role.key] = { until: slot.nextAt, selectedId: id };
          companionSave(fresh);
        }
      }
      companionNotice('success', '已应用「' + plan.name + '」；绑定壁纸跟随 UI 主题。');
    } catch (error) {
      const superseded = automatic && companionCurrentRole()?.key !== role.key;
      if (superseded) {
        // Switching away is expected; don't alarm the user when a newer role supersedes this request.
        console.info('[配套侠] 已取消前一角色的待完成方案。');
      } else {
        companionNotice('warning', '方案只完成 ' + finished + ' 项，已停止：' + (error?.message || error));
        console.warn('[配套侠] 应用中断', error);
      }
    } finally {
      companionRuntime.applying = false;
      companionRefreshList();
      const next = companionRuntime.pending;
      companionRuntime.pending = null;
      if (!state.destroyed && next && companionCurrentRole()?.key === next.roleKey) {
        const data = companionRead();
        const roleNow = companionCurrentRole();
        const choice = companionAutoTarget(data, roleNow);
        if (choice?.id === next.id && !companionManualHold(data, roleNow, choice.slot)) {
          void companionApply(next.id, true);
        }
      }
    }
  }
  function companionOnChatChanged(force = false) {
    HOST_WIN.clearTimeout(companionRuntime.timer);
    companionRuntime.timer = HOST_WIN.setTimeout(() => {
      if (state.destroyed) return;
      const role = companionCurrentRole();
      const key = role?.key || '';
      const changed = key !== companionRuntime.lastRole;
      companionRuntime.lastRole = key;
      if (state.chatTools.open && state.chatTools.page === 'plans') companionRefreshList();
      const data = companionRead();
      const choice = companionAutoTarget(data, role);
      companionArmSchedule(choice?.slot);
      if (!key) { companionRuntime.lastScheduleToken = ''; return; }
      const token = choice?.slot?.token || '';
      const boundaryChanged = Boolean(token && companionRuntime.lastScheduleToken !== token);
      companionRuntime.lastScheduleToken = token;
      if (!choice || (!force && !changed && !boundaryChanged)) return;
      if (choice.slot && companionManualHold(data, role, choice.slot)) return;
      if (!choice.slot && !changed && !force) return;
      console.info('[配套侠] 自动应用角色「' + role.name + '」方案：' + choice.plan.name);
      void companionApply(choice.id, true);
    }, 350);
  }
  function companionBindEvents() {
    const context = HOST_WIN.SillyTavern?.getContext?.();
    const source = context?.eventSource;
    const types = context?.eventTypes || context?.event_types;
    if (source && typeof source.on === 'function' && types) {
      // CHAT_CHANGED is the primary host signal; CHAT_LOADED is used when provided
      // by TT and helps when the character context arrives after the first signal.
      for (const key of ['CHAT_CHANGED', 'CHAT_LOADED']) {
        if (typeof types[key] !== 'string' || !types[key]) continue;
        if (companionRuntime.listeners.some(l => l.type === types[key])) continue;
        const handler = () => companionOnChatChanged();
        source.on(types[key], handler);
        companionRuntime.listeners.push({ type: types[key], handler });
      }
      for (const key of ['GENERATION_ENDED', 'GENERATION_STOPPED']) {
        if (typeof types[key] !== 'string' || !types[key]) continue;
        if (companionRuntime.listeners.some(l => l.type === types[key])) continue;
        const handler = () => { if (companionRuntime.pending) companionOnChatChanged(true); };
        source.on(types[key], handler);
        companionRuntime.listeners.push({ type: types[key], handler });
      }
      companionRuntime.source = source;
    }
    const resume = () => { if (HOST_DOC.visibilityState !== 'hidden') companionOnChatChanged(); };
    HOST_DOC.addEventListener('visibilitychange', resume, { signal: state.abort.signal });
    HOST_WIN.addEventListener('focus', resume, { signal: state.abort.signal });
    HOST_WIN.addEventListener('pageshow', resume, { signal: state.abort.signal });
    // On script reload, apply the selected role's explicit default once.
    // This also covers environments that mounted before the eventSource was ready.
    companionRuntime.lastRole = '';
    companionOnChatChanged();
  }
  function companionCleanup() {
    HOST_WIN.clearTimeout(companionRuntime.timer);
    HOST_WIN.clearTimeout(companionRuntime.scheduleTimer);
    HOST_WIN.clearTimeout(companionRuntime.generationRetryTimer);
    companionRuntime.scheduleTimer = 0;
    companionRuntime.generationRetryTimer = 0;
    companionRuntime.pending = null;
    if (companionRuntime.source) {
      const remove = companionRuntime.source.removeListener || companionRuntime.source.off;
      if (typeof remove === 'function') {
        for (const { type, handler } of companionRuntime.listeners) {
          remove.call(companionRuntime.source, type, handler);
        }
      }
    }
    companionRuntime.listeners = [];
    companionRuntime.source = null;
  }

  function setChatToolsPage(page, refresh = true) {
    const tools = state.chatTools;
    const panel = tools.panel;
    if (!panel || !['tools', 'recent', 'plans'].includes(page)) return;
    tools.page = page;
    panel.dataset.page = page;
    panel.querySelectorAll('[data-chat-tools-tab]').forEach(button => {
      const active = button.dataset.chatToolsTab === page;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    panel.querySelectorAll('[data-chat-tools-page]').forEach(section => {
      section.hidden = section.dataset.chatToolsPage !== page;
    });
    if (page === 'plans' && refresh) {
      companionRefreshList();
      companionOnChatChanged(); // catch up if the host did not dispatch a chat event
    }
    if (page === 'recent' && refresh) {
      tools.recent.loading = false;
      void refreshRecentChats();
    }
  }

  async function openRecentChatItem(row) {
    if (!row || row.dataset.opening === 'true') return;
    const avatarId = row.dataset.avatar || '';
    const groupId = row.dataset.group || '';
    const fileName = row.dataset.file || '';
    if (!fileName || (!avatarId && !groupId)) return;

    if (isNativeGenerationVisible()) {
      chatActionNotify('info', '请等待当前生成结束后再切换聊天。');
      return;
    }

    const context = HOST_WIN.SillyTavern?.getContext?.();
    if (!context) {
      chatActionNotify('error', '无法读取酒馆上下文。');
      return;
    }
    const currentId = typeof context.getCurrentChatId === 'function' ? context.getCurrentChatId() : context.chatId;
    const currentCharacter = context.characters?.[Number(context.characterId)];
    const alreadyCurrent = String(currentId || '') === fileName
      && (groupId ? String(context.groupId || '') === groupId
        : !context.groupId && currentCharacter?.avatar === avatarId);
    if (alreadyCurrent) {
      chatActionNotify('info', '当前已经是这个聊天。');
      return;
    }

    row.dataset.opening = 'true';
    try {
      const scriptModule = await quickImport('/script.js');
      if (scriptModule.isGenerating?.()) {
        delete row.dataset.opening;
        chatActionNotify('info', '请等待当前生成结束后再切换聊天。');
        return;
      }
      if (groupId) {
        const group = context.groups?.find(item => String(item.id) === groupId);
        if (!group) throw new Error('找不到对应的群组，可能已被删除。');
        const groupModule = await quickImport('/scripts/group-chats.js');
        await groupModule.openGroupById(groupId);
        const selectedGroupId = HOST_WIN.SillyTavern?.getContext?.()?.groupId;
        if (String(selectedGroupId || '') !== groupId) {
          throw new Error('酒馆暂时无法切换群组，请确认当前聊天已保存后重试。');
        }
        scriptModule.setActiveGroup(groupId);
        scriptModule.saveSettingsDebounced();
        if (scriptModule.getCurrentChatId() !== fileName) {
          await groupModule.openGroupChat(groupId, fileName);
        }
      } else {
        const characterId = context.characters?.findIndex(item => item.avatar === avatarId) ?? -1;
        if (characterId < 0) throw new Error('找不到对应的角色，可能已被删除。');
        await scriptModule.selectCharacterById(characterId);
        const selectedContext = HOST_WIN.SillyTavern?.getContext?.();
        const selectedCharacter = selectedContext?.characters?.[Number(selectedContext.characterId)];
        if (selectedCharacter?.avatar !== avatarId || selectedContext?.groupId) {
          throw new Error('酒馆暂时无法切换角色，请确认当前聊天已保存后重试。');
        }
        scriptModule.setActiveCharacter(avatarId);
        scriptModule.saveSettingsDebounced();
        if (scriptModule.getCurrentChatId() !== fileName) {
          await scriptModule.openCharacterChat(fileName);
        }
      }
      closeChatTools(false);
      queueChatShortcutRefresh();
    } catch (error) {
      delete row.dataset.opening;
      chatActionNotify('error', error?.message || '切换聊天失败。');
    }
  }

  function updateChatToolsPanel(snapshot = getActiveChatActionContext()) {
    const tools = state.chatTools;
    const panel = tools.panel;
    if (!panel || !snapshot) return;

    if (tools.chatKey !== snapshot.chatKey) {
      tools.chatKey = snapshot.chatKey;
      panel.querySelectorAll('[data-chat-action-input]').forEach(input => {
        input.value = '';
        const clearButton = input.closest('.tle-chat-tools-input-wrap')?.querySelector('[data-chat-action-clear]');
        syncChatActionClearButton(input, clearButton);
      });
    }

    const hasMessages = snapshot.lastMessageId >= 0;
    panel.querySelectorAll('[data-chat-action-input]').forEach(input => { input.disabled = !hasMessages; });
    panel.querySelectorAll('[data-chat-action-submit], [data-chat-action-clear]').forEach(button => { button.disabled = !hasMessages; });

    const chatMeta = panel.querySelector('[data-tle-chat-tools-chat-meta]');
    if (chatMeta) {
      chatMeta.textContent = hasMessages
        ? `当前共 ${snapshot.chat.length} 条消息 · mesid 0–${snapshot.lastMessageId}`
        : '当前聊天还没有消息';
    }

    const summary = getHiddenMessageRangeSummary(snapshot);
    const value = panel.querySelector('[data-tle-hidden-range]');
    const meta = panel.querySelector('[data-tle-hidden-meta]');
    const copy = panel.querySelector('[data-chat-tools-copy]');
    if (value) value.textContent = summary.text || '暂无隐藏楼层';
    if (meta) meta.textContent = summary.count ? `已隐藏 ${summary.count} 条消息` : '当前没有隐藏消息';
    if (copy) copy.disabled = summary.count === 0;
    panel.dataset.hiddenCount = String(summary.count);
  }

  function queueChatToolsRangeRefresh() {
    const tools = state.chatTools;
    if (state.destroyed || !tools.open || tools.refreshFrame) return;
    tools.refreshFrame = HOST_WIN.requestAnimationFrame(() => {
      tools.refreshFrame = 0;
      if (state.destroyed || !tools.open || tools.suppressObserver) return;
      const snapshot = getActiveChatActionContext();
      if (!snapshot || (tools.chatKey && snapshot.chatKey !== tools.chatKey)) {
        closeChatTools(false);
        queueChatShortcutRefresh();
        return;
      }
      updateChatToolsPanel(snapshot);
    });
  }

  function observeChatToolsHiddenState() {
    const tools = state.chatTools;
    tools.observer?.disconnect();
    tools.observer = null;
    const chat = HOST_DOC.getElementById('chat');
    if (!chat) return;
    tools.observer = new HOST_WIN.MutationObserver(() => {
      if (!tools.suppressObserver) queueChatToolsRangeRefresh();
    });
    tools.observer.observe(chat, {
      subtree: true,
      attributes: true,
      attributeFilter: ['is_system'],
    });
  }

  function openChatTools() {
    if (!chatToolsEnabled) return;
    const tools = state.chatTools;
    const snapshot = getActiveChatActionContext();
    if (!tools.button || !tools.panel || !snapshot) return;
    if (hasOpenChatOverlay() || hasExternalFullscreenSurfaceAtChatToolsButton()) return;

    updateChatToolsPanel(snapshot);
    tools.page = 'tools';
    tools.recent.onlyCurrent = false;
    if (tools.recent.filterButton) {
      tools.recent.filterButton.classList.remove('active');
      tools.recent.filterButton.setAttribute('aria-pressed', 'false');
    }
    setChatToolsPage('tools', false);
    tools.open = true;
    tools.panel.hidden = false;
    tools.button.setAttribute('aria-expanded', 'true');
    tools.button.setAttribute('aria-label', '关闭会话侠');
    observeChatToolsHiddenState();
    queueChatShortcutRefresh();
  }

  function closeChatTools(restoreFocus = false) {
    const tools = state.chatTools;
    if (!tools.open && tools.panel?.hidden !== false) return;
    tools.open = false;
    tools.recent.requestId++;
    tools.recent.loading = false;
    tools.observer?.disconnect();
    tools.observer = null;
    if (tools.refreshFrame) HOST_WIN.cancelAnimationFrame(tools.refreshFrame);
    tools.refreshFrame = 0;
    if (tools.panel) tools.panel.hidden = true;
    tools.button?.setAttribute('aria-expanded', 'false');
    tools.button?.setAttribute('aria-label', '打开会话侠');
    if (restoreFocus && tools.button?.isConnected && !tools.button.hidden) {
      tools.button.focus({ preventScroll: true });
    }
  }

  function toggleChatTools() {
    if (!chatToolsEnabled) return;
    if (state.chatTools.open) closeChatTools(false);
    else openChatTools();
  }

  async function copyHiddenMessageRanges() {
    const snapshot = getActiveChatActionContext();
    if (!snapshot) {
      chatActionNotify('error', '当前没有可用的聊天。');
      return;
    }
    const summary = getHiddenMessageRangeSummary(snapshot);
    if (!summary.count) {
      chatActionNotify('info', '当前聊天没有隐藏楼层。');
      return;
    }

    try {
      let copied = false;
      if (HOST_WIN.navigator.clipboard?.writeText) {
        try {
          await HOST_WIN.navigator.clipboard.writeText(summary.text);
          copied = true;
        } catch {}
      }
      if (!copied) {
        const textarea = HOST_DOC.createElement('textarea');
        textarea.value = summary.text;
        textarea.setAttribute('readonly', '');
        textarea.style.cssText = 'position:fixed;inset:0 auto auto -9999px;opacity:0;';
        HOST_DOC.body.appendChild(textarea);
        try {
          textarea.select();
          copied = HOST_DOC.execCommand('copy');
        } finally {
          textarea.remove();
        }
      }
      if (!copied) throw new Error('当前环境不允许访问剪贴板。');
      chatActionNotify('success', '已复制隐藏楼层范围。');
    } catch (error) {
      chatActionNotify('error', error?.message || '复制失败。');
    }
  }

  const SCROLL_BOTTOM_THRESHOLD = 100;

  function queueScrollBottomUpdate() {
    const scroll = state.scrollBottom;
    if (state.destroyed || scroll.frame) return;
    scroll.frame = HOST_WIN.requestAnimationFrame(() => {
      scroll.frame = 0;
      if (!state.destroyed) updateScrollBottomButton();
    });
  }

  function updateScrollBottomButton() {
    const scroll = state.scrollBottom;
    const chat = scroll.chat;
    const button = scroll.button;
    if (!chat?.isConnected || !button?.isConnected) return;

    const hasMessages = Boolean(chat.querySelector('.mes'));
    const distanceFromBottom = hasMessages
      ? Math.max(0, chat.scrollHeight - chat.clientHeight - chat.scrollTop)
      : 0;
    const isAwayFromBottom = hasMessages && distanceFromBottom > SCROLL_BOTTOM_THRESHOLD;
    const isGenerating = Boolean(scroll.generating && hasMessages);
    const shouldShow = hasMessages && (isAwayFromBottom || isGenerating);
    const mode = isGenerating ? 'generating' : 'return';

    if (button.dataset.mode !== mode) {
      button.dataset.mode = mode;
      button.innerHTML = isGenerating
        ? '<span class="tle-scroll-dots" aria-hidden="true"><i></i><i></i><i></i></span>'
        : '<i class="fa-solid fa-arrow-down tle-scroll-arrow" aria-hidden="true"></i>';
    }

    button.dataset.visible = String(shouldShow);
    button.disabled = !isAwayFromBottom;
    button.setAttribute('aria-hidden', String(!shouldShow));
    button.setAttribute('aria-label', isGenerating
      ? (isAwayFromBottom ? 'AI 正在回复，点击回到底部' : 'AI 正在回复')
      : '回到底部');
    button.title = isGenerating
      ? (isAwayFromBottom ? 'AI 正在回复 · 点击回到底部' : 'AI 正在回复')
      : '回到底部';
  }

  function onScrollBottomClick(event) {
    event.preventDefault();
    event.stopPropagation();

    const chat = state.scrollBottom.chat;
    if (!chat?.isConnected || !state.scrollBottom.button || state.scrollBottom.button.disabled) return;

    const reducedMotion = HOST_WIN.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    try {
      chat.scrollTo({
        top: chat.scrollHeight,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    } catch {
      chat.scrollTop = chat.scrollHeight;
    }
    queueScrollBottomUpdate();
  }

  function isNativeGenerationVisible() {
    const stop = HOST_DOC.querySelector('#mes_stop');
    if (!stop || stop.hidden) return false;
    const style = HOST_WIN.getComputedStyle(stop);
    return style.display !== 'none' && style.visibility !== 'hidden' && stop.getClientRects().length > 0;
  }

  function syncScrollBottomElements() {
    if (state.destroyed || !scrollBottomEnabled) return;
    const scroll = state.scrollBottom;
    const chat = HOST_DOC.getElementById('chat');
    const form = HOST_DOC.getElementById('form_sheld');

    if (scroll.chat !== chat) {
      if (scroll.chat && scroll.onScroll) {
        scroll.chat.removeEventListener('scroll', scroll.onScroll);
      }
      scroll.chat = chat || null;
      if (scroll.chat) {
        scroll.onScroll ||= queueScrollBottomUpdate;
        scroll.chat.addEventListener('scroll', scroll.onScroll, { passive: true });
      }
    }

    if (scroll.form !== form) {
      scroll.button?.remove();
      scroll.button = null;
      scroll.form = form || null;
    }

    if (!form) {
      scroll.button?.remove();
      scroll.button = null;
      queueScrollBottomUpdate();
      return;
    }

    if (!scroll.button || !scroll.button.isConnected || scroll.button.parentElement !== form) {
      scroll.button?.remove();
      const button = HOST_DOC.createElement('button');
      button.id = ID.scrollBottom;
      button.type = 'button';
      button.className = 'tle-scroll-bottom';
      button.dataset.visible = 'false';
      button.setAttribute('aria-label', '回到底部');
      button.setAttribute('aria-hidden', 'true');
      button.title = '回到底部';
      button.addEventListener('click', onScrollBottomClick);
      form.appendChild(button);
      scroll.button = button;
    }

    queueScrollBottomUpdate();
  }

  function bindScrollBottomEvents() {
    const scroll = state.scrollBottom;
    if (!scrollBottomEnabled || scroll.eventSource) return;

    const context = HOST_WIN.SillyTavern?.getContext?.();
    const source = context?.eventSource;
    const types = context?.eventTypes || context?.event_types;
    if (!source || typeof source.on !== 'function' || !types) return;

    const listeners = [];
    const add = (key, handler) => {
      const type = types[key];
      if (typeof type !== 'string' || !type) return;
      source.on(type, handler);
      listeners.push({ type, handler });
    };

    add('GENERATION_STARTED', (type, _details, dryRun) => {
      const generationType = String(type || '').toLowerCase();
      if (dryRun || generationType === 'quiet' || generationType === 'impersonate') return;
      scroll.generating = true;
      queueScrollBottomUpdate();
    });

    const finishGeneration = () => {
      scroll.generating = false;
      queueScrollBottomUpdate();
    };
    add('GENERATION_ENDED', finishGeneration);
    add('GENERATION_STOPPED', finishGeneration);

    add('CHAT_CHANGED', () => {
      scroll.generating = isNativeGenerationVisible();
      queueScrollBottomUpdate();
    });
    add('CHAT_LOADED', () => {
      scroll.generating = isNativeGenerationVisible();
      queueScrollBottomUpdate();
    });

    const refreshAfterMessageChange = () => queueScrollBottomUpdate();
    for (const key of [
      'MESSAGE_SENT',
      'MESSAGE_RECEIVED',
      'MESSAGE_UPDATED',
      'MESSAGE_SWIPED',
      'MESSAGE_DELETED',
      'MORE_MESSAGES_LOADED',
      'USER_MESSAGE_RENDERED',
      'CHARACTER_MESSAGE_RENDERED',
    ]) {
      add(key, refreshAfterMessageChange);
    }

    scroll.eventSource = source;
    scroll.eventListeners = listeners;
    scroll.generating = isNativeGenerationVisible();
  }

  function destroyScrollBottom() {
    const scroll = state.scrollBottom;
    if (scroll.chat && scroll.onScroll) {
      scroll.chat.removeEventListener('scroll', scroll.onScroll);
    }
    if (scroll.frame) HOST_WIN.cancelAnimationFrame(scroll.frame);
    if (scroll.eventSource) {
      const remove = scroll.eventSource.removeListener || scroll.eventSource.off;
      if (typeof remove === 'function') {
        for (const { type, handler } of scroll.eventListeners) {
          remove.call(scroll.eventSource, type, handler);
        }
      }
    }
    scroll.button?.remove();
    scroll.chat = null;
    scroll.form = null;
    scroll.button = null;
    scroll.frame = 0;
    scroll.eventSource = null;
    scroll.eventListeners = [];
    scroll.generating = false;
  }

  function closePromptEditorSafely(element) {
    if (!element?.isConnected) return;
    // Prefer the editor's own explicit close control, never its save/undo controls.
    const close = element.querySelector(
      '.fa-xmark.interactable, .fa-times.interactable, [aria-label="关闭"], [title="关闭"], [aria-label="Close"], [title="Close"]'
    );
    if (close) close.click();
  }

  function returnToChat() {
    // Close engine-owned panel through its state-aware API.
    setPanelOpen(false);

    // Close native drawers through their original drawer-icon handlers.
    const openDrawers = [...HOST_DOC.querySelectorAll(
      '#top-settings-holder > .drawer > .drawer-content.openDrawer, #left-nav-panel.openDrawer, #right-nav-panel.openDrawer'
    )];
    for (const content of openDrawers) {
      const drawer = content.closest('.drawer');
      const icon = drawer?.querySelector(':scope > .drawer-toggle .drawer-icon');
      if (icon) icon.click();
    }

    // The prompt editor is a body-level drawer without a native .drawer-toggle.
    closePromptEditorSafely(HOST_DOC.getElementById('completion_prompt_manager_popup'));

    // Ask other modal implementations to use their standard Escape close path.
    HOST_DOC.dispatchEvent(new HOST_WIN.KeyboardEvent('keydown', {
      key: 'Escape',
      code: 'Escape',
      bubbles: true,
      cancelable: true,
    }));

    // Fold the navigation rail after native close handlers have run.
    HOST_WIN.requestAnimationFrame(() => {
      if (state.destroyed) return;

      // Optional destination: invoke the exact same jQuery action used by
      // SillyTavern's native /closechat slash command.
      // The native DOM contains duplicate #option_close_chat IDs, so
      // getElementById() can select the hidden copy. Keep this call aligned
      // with the verified native command implementation instead.
      if (chatShortcutDestination === 'welcome') {
        const jquery = HOST_WIN.jQuery || HOST_WIN.$;
        if (typeof jquery === 'function') {
          jquery('#option_close_chat').trigger('click');
        } else {
          console.error('[Tavern Layout Engine] 无法调用酒馆原生 /closechat：jQuery 不可用。');
        }
      }

      setMobileNavOpen(false);
      queueChatShortcutRefresh();
      HOST_DOC.getElementById('send_textarea')?.blur();
    });
  }

  function createChatShortcut() {
    const button = HOST_DOC.createElement('button');
    button.id = ID.chatShortcut;
    button.type = 'button';
    button.hidden = true;
    button.title = '返回聊天界面';
    button.setAttribute('aria-label', '返回聊天界面');
    button.innerHTML = '<i class="fa-solid fa-comments" aria-hidden="true"></i>';
    HOST_DOC.body.appendChild(button);
    state.chatShortcut = button;
  }

  function createChatTools() {
    const button = HOST_DOC.createElement('button');
    button.id = ID.chatToolsButton;
    button.type = 'button';
    button.hidden = true;
    button.title = '会话侠';
    button.setAttribute('aria-label', '打开会话侠');
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', ID.chatToolsPanel);
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = '<i class="fa-solid fa-ellipsis" aria-hidden="true"></i>';

    const panel = HOST_DOC.createElement('section');
    panel.id = ID.chatToolsPanel;
    panel.className = 'popup';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', '会话侠');
    panel.setAttribute('aria-modal', 'false');
    panel.dataset.tleChatToolsPanel = '';
    panel.innerHTML = `
      <header class="tle-chat-tools-header">
        <strong>会话侠</strong>
        <div class="tle-chat-tools-header-actions" data-chat-quick-actions hidden>
          <button type="button" class="menu_button tle-chat-quick-action" data-chat-quick-action="new" title="新建聊天" aria-label="新建聊天">
            <i class="fa-solid fa-comments" aria-hidden="true"></i><span>新建</span>
          </button>
          <button type="button" class="menu_button tle-chat-quick-action" data-chat-quick-action="close" title="关闭当前聊天" aria-label="关闭当前聊天">
            <i class="fa-solid fa-times" aria-hidden="true"></i><span>关闭</span>
          </button>
          <button type="button" class="menu_button tle-chat-quick-action" data-chat-quick-action="files" title="管理聊天文件" aria-label="管理聊天文件">
            <i class="fa-solid fa-address-book" aria-hidden="true"></i><span>文件</span>
          </button>
        </div>
        <button type="button" class="menu_button menu_button_icon" data-chat-tools-close aria-label="关闭会话侠">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>
      <nav class="tle-chat-tools-tabs" aria-label="会话侠页面">
        <button type="button" class="menu_button tle-chat-tools-tab active" data-chat-tools-tab="tools" aria-pressed="true">楼层侠</button>
        <button type="button" class="menu_button tle-chat-tools-tab" data-chat-tools-tab="recent" aria-pressed="false">最近聊天</button>
        <button type="button" class="menu_button tle-chat-tools-tab" data-chat-tools-tab="plans" aria-pressed="false">配套方案</button>
      </nav>
      <section class="tle-chat-tools-page" data-chat-tools-page="tools">
        <div class="tle-chat-tools-actions" data-tle-chat-tools-actions></div>
        <section class="tle-chat-tools-range">
          <div class="tle-chat-tools-range-heading">
            <div>
              <strong>已隐藏楼层范围</strong>
              <div class="tle-chat-tools-range-meta" data-tle-hidden-meta>读取中…</div>
            </div>
            <button type="button" class="menu_button" data-chat-tools-copy disabled>
              <i class="fa-regular fa-copy" aria-hidden="true"></i>
              <span>复制范围</span>
            </button>
          </div>
          <div class="tle-chat-tools-range-value" data-tle-hidden-range aria-live="polite">读取中…</div>
          <div class="tle-chat-tools-chat-meta" data-tle-chat-tools-chat-meta></div>
        </section>
      </section>
      <section class="tle-chat-tools-page" data-chat-tools-page="recent" hidden>
        <div class="tle-chat-tools-recent-toolbar">
          <input type="search" class="text_pole" data-chat-tools-recent-search placeholder="搜索角色名、聊天名称或消息" autocomplete="off" spellcheck="false" aria-label="搜索最近聊天">
          <button type="button" class="menu_button" data-chat-tools-current-filter aria-pressed="false">当前角色</button>
          <button type="button" class="menu_button menu_button_icon" data-chat-tools-recent-refresh title="刷新最近聊天" aria-label="刷新最近聊天">
            <i class="fa-solid fa-rotate" aria-hidden="true"></i>
          </button>
          <small class="tle-chat-tools-recent-count" data-tle-recent-count>—</small>
        </div>
        <div class="welcomePanel tle-chat-tools-recent-root">
          <div class="welcomeRecent">
            <div class="recentChatList" data-tle-recent-chat-list>
              <div class="noRecentChat">切换到此页面后读取最近聊天</div>
            </div>
          </div>
        </div>
      </section>
      <section class="tle-chat-tools-page" data-chat-tools-page="plans" hidden>
        <div class="tle-companion-toolbar">
          <strong data-companion-role>当前角色</strong>
          <button type="button" class="menu_button" data-companion-action="save">保存当前</button>
        </div>
        <div data-companion-list class="tle-companion-list"></div>
        <div class="tle-companion-actions">
          <button type="button" class="menu_button" data-companion-action="manager">管理方案</button>
        </div>
      </section>`;

    for (const action of CHAT_ACTIONS) {
      panel.querySelector('[data-tle-chat-tools-actions]').appendChild(createChatActionRow(action));
    }

    const quickActions = panel.querySelector('[data-chat-quick-actions]');
    if (quickActions) quickActions.hidden = !chatQuickActionsEnabled;

    state.chatTools.recent.list = panel.querySelector('[data-tle-recent-chat-list]');
    state.chatTools.recent.search = panel.querySelector('[data-chat-tools-recent-search]');
    state.chatTools.recent.refreshButton = panel.querySelector('[data-chat-tools-recent-refresh]');
    state.chatTools.recent.filterButton = panel.querySelector('[data-chat-tools-current-filter]');
    state.chatTools.recent.search?.addEventListener('input', filterRecentChatRows);
    panel.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const row = event.target?.closest?.('[data-recent-chat-item]');
      if (!row || event.target !== row) return;
      event.preventDefault();
      void openRecentChatItem(row);
    });

    HOST_DOC.body.append(button, panel);
    state.chatTools.button = button;
    state.chatTools.panel = panel;

    HOST_DOC.addEventListener('pointerdown', event => {
      if (!state.chatTools.open) return;
      const target = event.target;
      if (target?.closest?.('#' + ID.chatToolsPanel + ', #' + ID.chatToolsButton)) return;
      closeChatTools(false);
    }, { capture: true, signal: state.abort.signal });
  }

  function getNativeChatMenuActionElement(id) {
    const candidates = [...HOST_DOC.querySelectorAll(`#options [id="${id}"]`)];
    if (!candidates.length) return null;

    // ST currently has two option_close_chat anchors. The first is a hidden
    // compatibility copy; prefer the actual menu item without displayNone.
    return candidates.find(element => !element.classList.contains('displayNone'))
      || (id === 'option_close_chat' ? candidates[candidates.length - 1] : candidates[0]);
  }

  function runChatQuickAction(actionId) {
    if (!chatToolsEnabled || !chatQuickActionsEnabled) return;
    if (!getActiveChatActionContext()) {
      chatActionNotify('error', '请先进入一个角色或群聊。');
      return;
    }

    const nativeIds = {
      new: 'option_start_new_chat',
      close: 'option_close_chat',
      files: 'option_select_chat',
    };
    const nativeId = nativeIds[actionId];
    if (!nativeId) return;

    const target = getNativeChatMenuActionElement(nativeId);
    if (!target) {
      chatActionNotify('error', '当前酒馆未找到对应的原生聊天操作入口。');
      return;
    }

    closeChatTools(false);
    try {
      target.click();
      queueChatShortcutRefresh();
    } catch (error) {
      chatActionNotify('error', error?.message || '无法调用酒馆原生聊天操作。');
    }
  }

  const DEBUGGER_ID = 'tle-mobile-debugger';
  function openMobileDebugger() {
    let panel = HOST_DOC.getElementById(DEBUGGER_ID);
    if (panel) {
      if (typeof panel.showModal === 'function' && !panel.open) {
        try { panel.showModal(); } catch { panel.setAttribute('open', ''); }
      } else if (!panel.open) panel.setAttribute('open', '');
      return panel;
    }
    panel = HOST_DOC.createElement('dialog');
    panel.id = DEBUGGER_ID;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'TLE 移动端调试台');
    panel.innerHTML = `
      <header class="tle-debug-head">
        <strong>TLE Debugger</strong>
        <span>移动端调试台</span>
        <button type="button" data-debug-action="close" aria-label="关闭">×</button>
      </header>
      <div class="tle-debug-body">
        <p class="tle-debug-hint">在宿主酒馆页面执行 JS。可使用 window、document，以及下方提供的 TLE 辅助对象。</p>
        <textarea data-debug-code spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="// 示例：\nreturn [...document.querySelectorAll('#reasoning_select')].map(el => ({tag:el.tagName,value:el.value,html:el.outerHTML}));"></textarea>
        <div class="tle-debug-actions">
          <button type="button" data-debug-action="run">运行 JS</button>
          <button type="button" data-debug-action="copy">复制结果</button>
          <button type="button" data-debug-action="clear">清空</button>
          <button type="button" data-debug-action="report">复制完整诊断</button>
        </div>
        <div class="tle-debug-label">执行结果 / console 输出</div>
        <pre data-debug-output>等待执行。可使用 TLE.inspect(selector)、TLE.ancestors(selector)、TLE.styles(selector)。</pre>
        <div class="tle-debug-label">快捷查询</div>
        <div class="tle-debug-actions">
          <button type="button" data-debug-action="reasoning">检查推理控件</button>
          <button type="button" data-debug-action="station">检查信息站</button>
        </div>
      </div>`;
    // IMPORTANT: when AdvancedFormatting is open, mount the debugger inside it.
    // TT treats taps/focus outside a native drawer as a dismissal gesture. A
    // body-level fixed dialog is still an outside target, even if it visually
    // covers the drawer. Mounting inside makes the textarea and its controls
    // descendants of the active drawer in the actual event path.
    const nativeDrawerHost = HOST_DOC.querySelector('#AdvancedFormatting.openDrawer, #advanced_formatting.openDrawer');
    const debuggerMount = nativeDrawerHost || HOST_DOC.body;
    debuggerMount.appendChild(panel);
    panel.dataset.tleMount = nativeDrawerHost ? 'advanced-formatting' : 'body-fallback';
    // Do not install capture-phase stopPropagation handlers on this panel.
    // They run before child buttons' target handlers and make every button inert.
    // The debugger is mounted inside #AdvancedFormatting when that drawer is open,
    // so its DOM ancestry already keeps it inside the native drawer boundary.
    // Snapshot the currently open drawers when the debugger opens as a final
    // fallback; the continuous observer below retains the state if TT already
    // closed a drawer during the pointer/touch sequence.
    panel.addEventListener('cancel', event => {
      event.preventDefault();
      try { panel.close(); } catch { panel.removeAttribute('open'); }
    });
    panel.addEventListener('click', async event => {
      const button = event.target.closest('[data-debug-action]');
      if (!button) return;
      const action = button.dataset.debugAction;
      const output = panel.querySelector('[data-debug-output]');
      const code = panel.querySelector('[data-debug-code]');
      if (action === 'close') { try { panel.close(); } catch { panel.removeAttribute('open'); } return; }
      if (action === 'clear') { output.textContent = ''; return; }
      if (action === 'copy') {
        try { await HOST_WIN.navigator.clipboard.writeText(output.textContent); output.textContent += '\n\n[已复制]'; }
        catch (e) { output.textContent += '\n复制失败：' + e.message; }
        return;
      }
      if (action === 'report') { copyDiagnosticReport(); return; }
      if (action === 'reasoning') {
        code.value = `return [...document.querySelectorAll('#reasoning_select, #AdvancedFormatting select, #openai_reasoning_effort')].map(el => ({tag:el.tagName,id:el.id,value:el.value,selectedText:el.selectedOptions?.[0]?.textContent?.trim(),options:[...(el.options||[])].map(o=>({value:o.value,text:o.textContent.trim(),selected:o.selected})),html:el.outerHTML.slice(0,3000)}));`;
      } else if (action === 'station') {
        code.value = `return [...document.querySelectorAll('.tle-sidebar-info, .tle-sidebar-info *')].slice(0,100).map(el => {const s=getComputedStyle(el),r=el.getBoundingClientRect();return {tag:el.tagName,id:el.id,className:typeof el.className==='string'?el.className:'',text:el.children.length?'':el.textContent?.trim().slice(0,120),display:s.display,visibility:s.visibility,opacity:s.opacity,color:s.color,rect:{x:r.x,y:r.y,width:r.width,height:r.height}}});`;
      }
      if (action === 'run' || action === 'reasoning' || action === 'station') {
        const logs = [];
        const original = {};
        const methods = ['log','info','warn','error','debug'];
        for (const method of methods) {
          original[method] = HOST_WIN.console[method];
          HOST_WIN.console[method] = (...args) => {
            logs.push(`[console.${method}] ` + args.map(v => {
              try { return typeof v === 'string' ? v : JSON.stringify(v); } catch { return String(v); }
            }).join(' '));
            if (logs.length > 100) logs.shift();
          };
        }
        const TLE = {
          inspect(selector, root = HOST_DOC) {
            return [...root.querySelectorAll(selector)].slice(0,100).map(el => ({
              tag:el.tagName,id:el.id,className:typeof el.className==='string'?el.className:'',
              text:el.children.length?'':(el.textContent||'').trim().slice(0,200),
              html:el.outerHTML?.slice(0,4000),value:'value' in el?el.value:undefined,
              rect:(r=>({x:r.x,y:r.y,width:r.width,height:r.height}))(el.getBoundingClientRect())
            }));
          },
          styles(selector, root = HOST_DOC) {
            return [...root.querySelectorAll(selector)].slice(0,100).map(el => {
              const s=HOST_WIN.getComputedStyle(el),r=el.getBoundingClientRect();
              return {selector,tag:el.tagName,id:el.id,className:typeof el.className==='string'?el.className:'',
                display:s.display,visibility:s.visibility,opacity:s.opacity,color:s.color,
                background:s.backgroundColor,position:s.position,zIndex:s.zIndex,overflow:s.overflow,
                pointerEvents:s.pointerEvents,rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
            });
          },
          ancestors(selector) {
            const el=HOST_DOC.querySelector(selector); if(!el)return [];
            const rows=[];let n=el;
            while(n&&rows.length<20){const s=HOST_WIN.getComputedStyle(n),r=n.getBoundingClientRect();rows.push({
              tag:n.tagName,id:n.id,className:typeof n.className==='string'?n.className:'',
              display:s.display,visibility:s.visibility,opacity:s.opacity,position:s.position,zIndex:s.zIndex,
              overflow:s.overflow,rect:{x:r.x,y:r.y,width:r.width,height:r.height}});n=n.parentElement;}
            return rows;
          }
        };
        try {
          const runner = HOST_WIN.Function('TLE','window','document', `return (async()=>{${code.value}\n})()`);
          const result = await runner(TLE, HOST_WIN, HOST_DOC);
          let rendered;
          try { rendered = JSON.stringify(result, null, 2); } catch { rendered = String(result); }
          output.textContent = [rendered ?? String(result), ...logs].filter(Boolean).join('\n\n') || '执行完成（无返回值）。';
        } catch (error) {
          output.textContent = `${error?.name || 'Error'}: ${error?.message || error}\n${error?.stack || ''}`;
        } finally {
          for (const method of methods) HOST_WIN.console[method] = original[method];
        }
      }
    });
    try {
      if (typeof panel.showModal === 'function') {
        panel.showModal();
        panel.dataset.tleTopLayer = 'native-dialog';
      } else {
        panel.setAttribute('open', '');
        panel.dataset.tleTopLayer = 'open-attribute-fallback';
      }
    } catch (error) {
      panel.setAttribute('open', '');
      panel.dataset.tleTopLayer = 'open-attribute-fallback';
      rememberDiagnosticError('debugger-dialog-open', error?.message || error);
    }
    return panel;
  }

  function syncDiagnosticButtonPosition() {
    const button = state.diagnosticButton;
    if (!button?.isConnected) return;
    const viewport = HOST_WIN.visualViewport;
    const layoutWidth = HOST_DOC.documentElement.clientWidth || HOST_WIN.innerWidth || 0;
    const visualLeft = Math.max(0, Number(viewport?.offsetLeft) || 0);
    const visualTop = Math.max(0, Number(viewport?.offsetTop) || 0);
    const visualWidth = Number(viewport?.width) || layoutWidth;
    const rightGap = Math.max(0, layoutWidth - visualLeft - visualWidth);

    button.style.setProperty('top',
      `calc(env(safe-area-inset-top, 0px) + ${visualTop}px + 52px)`, 'important');
    button.style.setProperty('right',
      `calc(env(safe-area-inset-right, 0px) + ${rightGap}px + 12px)`, 'important');
    button.style.setProperty('bottom', 'auto', 'important');
    button.style.setProperty('left', 'auto', 'important');
  }

  function createDiagnosticButton() {
    if (!diagnosticMode || state.diagnosticButton?.isConnected) return;

    const staleButton = HOST_DOC.getElementById(ID.diagnosticButton);
    if (staleButton && staleButton !== state.diagnosticButton) {
      try { staleButton.hidePopover?.(); } catch {}
      staleButton.remove();
    }

    const button = HOST_DOC.createElement('button');
    button.id = ID.diagnosticButton;
    button.type = 'button';
    button.title = '一键采集并复制完整诊断报告';
    button.setAttribute('aria-label', '一键采集并复制完整诊断报告');
    button.innerHTML = '<i class="fa-solid fa-stethoscope" aria-hidden="true"></i>';
    HOST_DOC.body.appendChild(button);
    state.diagnosticButton = button;

    let popoverError = null;
    if (typeof button.showPopover === 'function') {
      button.setAttribute('popover', 'manual');
      try {
        button.showPopover();
        if (!button.matches(':popover-open')) {
          throw new Error('showPopover() returned without entering the Top Layer');
        }
        button.dataset.tlePositioning = 'top-layer-popover';
      } catch (error) {
        popoverError = error;
        try { button.hidePopover?.(); } catch {}
        button.removeAttribute('popover');
      }
    } else {
      popoverError = new Error('Popover API unavailable');
    }

    if (!button.dataset.tlePositioning) {
      // A failed/unsupported Popover must not retain the popover attribute:
      // a closed popover is UA-hidden regardless of ordinary display styling.
      button.removeAttribute('popover');
      button.dataset.tlePositioning = 'fixed-document-root-fallback';
      button.dataset.tlePositioningError = String(popoverError?.message || popoverError || 'Popover unavailable').slice(0, 220);
      // Move outside body-level transforms/overflow before using fixed positioning.
      HOST_DOC.documentElement.appendChild(button);
      button.style.setProperty('position', 'fixed', 'important');
      button.style.setProperty('z-index', '2147483647', 'important');
      button.style.setProperty('visibility', 'visible', 'important');
      button.style.setProperty('pointer-events', 'auto', 'important');
      rememberDiagnosticError('diagnostic-button-top-layer-fallback', button.dataset.tlePositioningError);
    }

    syncDiagnosticButtonPosition();
  }

  function watchDiagnosticButton() {
    if (state.diagnosticButtonObserver || typeof HOST_WIN.MutationObserver !== 'function') return;
    const observer = new HOST_WIN.MutationObserver(records => {
      if (state.destroyed || !diagnosticMode) return;
      const button = state.diagnosticButton;
      if (button?.isConnected) return;
      const removedCurrentButton = records.some(record =>
        [...record.removedNodes].some(node =>
          node === button || (node?.nodeType === 1 && node.contains?.(button))
        )
      );
      if (!removedCurrentButton || state.diagnosticButtonRepairFrame) return;
      state.diagnosticButtonRepairFrame = HOST_WIN.requestAnimationFrame(() => {
        state.diagnosticButtonRepairFrame = 0;
        if (state.destroyed || !diagnosticMode || state.diagnosticButton?.isConnected) return;
        state.diagnosticButton = null;
        createDiagnosticButton();
      });
    });
    if (HOST_DOC.body) observer.observe(HOST_DOC.body, { childList: true });
    if (HOST_DOC.documentElement) observer.observe(HOST_DOC.documentElement, { childList: true });
    state.diagnosticButtonObserver = observer;
  }

  function collectDiagnosticPreInteractionSnapshot(eventType) {
    const advanced = HOST_DOC.querySelector('#AdvancedFormatting, #advanced_formatting');
    const drawerIds = ['AdvancedFormatting', 'advanced_formatting', 'left-nav-panel', 'rm_api_block'];
    const drawers = drawerIds.map(id => {
      const el = HOST_DOC.getElementById(id);
      if (!el) return { id, exists: false };
      const style = HOST_WIN.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        id,
        exists: true,
        className: typeof el.className === 'string' ? el.className.slice(0, 180) : '',
        open: el.classList.contains('openDrawer'),
        display: style.display,
        visibility: style.visibility,
        rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      };
    });

    const controls = advanced
      ? [...advanced.querySelectorAll('select, input, textarea, button, [role="combobox"], [role="listbox"], [aria-haspopup], [data-select], [class*="select"], [class*="dropdown"]')]
          .slice(0, 160).map((el, index) => {
            const style = HOST_WIN.getComputedStyle(el);
            const rect = el.getBoundingClientRect();
            const isReasoningControl = el.id === 'reasoning_select' || el.id === 'openai_reasoning_effort';
            return {
              index,
              tag: el.tagName,
              id: el.id || '',
              className: typeof el.className === 'string' ? el.className.slice(0, 180) : '',
              type: el.getAttribute('type') || '',
              role: el.getAttribute('role') || '',
              ariaHaspopup: el.getAttribute('aria-haspopup') || '',
              dataAttributeNames: [...el.attributes].filter(a => a.name.startsWith('data-')).slice(0, 12).map(a => a.name),
              selectedIndex: isReasoningControl && el.tagName === 'SELECT' ? el.selectedIndex : null,
              optionCount: el.tagName === 'SELECT' ? el.options.length : null,
              visible: Boolean(el.getClientRects().length && rect.width > 0 && rect.height > 0
                && style.display !== 'none' && style.visibility !== 'hidden'),
              display: style.display,
              rect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
            };
          })
      : [];

    const structure = [];
    if (advanced) {
      const walk = (root, depth = 0) => {
        if (depth > 7 || structure.length >= 220) return;
        for (const child of [...root.children]) {
          structure.push({
            depth,
            tag: child.tagName,
            id: child.id || '',
            className: typeof child.className === 'string' ? child.className.slice(0, 180) : '',
            role: child.getAttribute('role') || '',
            childCount: child.children?.length || 0,
          });
          walk(child, depth + 1);
          if (structure.length >= 220) break;
        }
      };
      walk(advanced);
    }

    const active = HOST_DOC.activeElement;
    return {
      capturedAt: new Date().toISOString(),
      eventType,
      activeElement: active ? {
        tag: active.tagName,
        id: active.id || '',
        className: typeof active.className === 'string' ? active.className.slice(0, 120) : '',
        type: active.getAttribute?.('type') || '',
        contentEditable: Boolean(active.isContentEditable),
      } : null,
      drawers,
      advancedFormattingExists: Boolean(advanced),
      advancedFormattingControls: controls,
      advancedFormattingStructure: structure,
      privacy: '仅记录控件结构与几何信息；不读取 input/textarea/select 的输入值或任意选项文本。',
    };
  }

  function captureDiagnosticBeforeDismiss(event) {
    if (!diagnosticMode || !state.diagnosticButton?.isConnected) return;
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    if (!target?.closest?.('#' + ID.diagnosticButton)) return;

    // Preserve the exact pre-click现场 before focus, keyboard, or native-drawer
    // dismissal can alter it. touchstart/pointerdown/mousedown share one snapshot.
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    else event.stopPropagation();
    const now = Date.now();
    if (!diagnosticCaptureSnapshot || now - diagnosticCaptureSnapshot.capturedAtMs > 2500) {
      try {
        const pre = collectDiagnosticPreInteractionSnapshot(event.type);
        const report = collectDiagnosticReport();
        report.preInteractionSnapshot = pre;
        report.capture = { trigger: 'floating-diagnostic-button', eventType: event.type, capturedBeforeClick: true };
        diagnosticPreInteractionSnapshot = pre;
        diagnosticCaptureSnapshot = { capturedAtMs: now, report };
      } catch (error) {
        diagnosticCaptureSnapshot = { capturedAtMs: now, report: null, error: sanitizeDiagnosticText(error?.message || error, 240) };
      }
    }
  }

  function handleDiagnosticButtonClick(event) {
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    if (!target?.closest?.('#' + ID.diagnosticButton)) return;
    event.preventDefault();
    if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation();
    else event.stopPropagation();
    void copyDiagnosticReport();
  }

  function setDiagnosticMode(enabled) {
    diagnosticMode = Boolean(enabled);
    try { HOST_WIN.localStorage.setItem(DIAGNOSTIC_MODE_KEY, String(diagnosticMode)); } catch {}

    if (diagnosticMode) {
      try { requestDiagnosticClientHints(); } catch { diagnosticClientHints = { status: 'client-hints-error' }; }
      if (!state.diagnosticAbort) {
        state.diagnosticAbort = new HOST_WIN.AbortController();
        const positionSignal = state.diagnosticAbort.signal;
        const syncPosition = () => syncDiagnosticButtonPosition();
        HOST_WIN.addEventListener('resize', syncPosition, { passive: true, signal: positionSignal });
        if (HOST_WIN.visualViewport?.addEventListener) {
          HOST_WIN.visualViewport.addEventListener('resize', syncPosition, { passive: true, signal: positionSignal });
          HOST_WIN.visualViewport.addEventListener('scroll', syncPosition, { passive: true, signal: positionSignal });
        }
        HOST_WIN.addEventListener('click', handleDiagnosticButtonClick, {
          capture: true, signal: state.diagnosticAbort.signal,
        });
        // Guard the diagnostic gesture at window capture so it never reaches
        // document-level TT/ST outside-tap handlers that dismiss native drawers.
        // Keep the listeners passive and do not preventDefault, so click still fires.
        HOST_WIN.addEventListener('touchstart', captureDiagnosticBeforeDismiss, { capture: true, passive: true, signal: state.diagnosticAbort.signal });
        HOST_WIN.addEventListener('pointerdown', captureDiagnosticBeforeDismiss, { capture: true, passive: true, signal: state.diagnosticAbort.signal });
        HOST_WIN.addEventListener('mousedown', captureDiagnosticBeforeDismiss, { capture: true, passive: true, signal: state.diagnosticAbort.signal });
        HOST_WIN.addEventListener('error', event => {
          rememberDiagnosticError(
            'error', event.message || event.error?.message || 'Resource or script error',
            event.filename || '', event.lineno, event.colno,
          );
        }, { capture: true, signal: state.diagnosticAbort.signal });
        HOST_WIN.addEventListener('unhandledrejection', event => {
          const reason = event.reason;
          rememberDiagnosticError('unhandledrejection',
            typeof reason?.message === 'string' ? reason.message : (typeof reason === 'string' ? '[string rejection omitted for privacy]' : 'Unhandled Promise rejection'));
        }, { signal: state.diagnosticAbort.signal });
      }
      // Enabling diagnostic mode must create and protect the floating entry immediately.
      createDiagnosticButton();
      watchDiagnosticButton();
    } else {
      state.diagnosticAbort?.abort();
      state.diagnosticAbort = null;
      state.diagnosticButtonObserver?.disconnect();
      state.diagnosticButtonObserver = null;
      if (state.diagnosticButtonRepairFrame) HOST_WIN.cancelAnimationFrame(state.diagnosticButtonRepairFrame);
      state.diagnosticButtonRepairFrame = 0;
      diagnosticPreInteractionSnapshot = null;
      diagnosticCaptureSnapshot = null;
      try { state.diagnosticButton?.hidePopover?.(); } catch {}
      state.diagnosticButton?.remove();
      state.diagnosticButton = null;
    }

    const status = state.panel?.querySelector('[data-tle-diagnostic-status]');
    if (status) status.textContent = diagnosticMode
      ? '诊断模式已开启：悬浮按钮可采集报告，当前页面错误开始记录。'
      : '诊断模式已关闭：悬浮按钮已移除，页面错误监听已停止。';
  }

  function flashDiagnosticButton(success) {
    const button = state.diagnosticButton;
    if (!button) return;
    button.dataset.result = success ? 'success' : 'error';
    button.innerHTML = success
      ? '<i class="fa-solid fa-check" aria-hidden="true"></i>'
      : '<i class="fa-solid fa-triangle-exclamation" aria-hidden="true"></i>';
    button.title = success ? '诊断报告已复制' : '复制失败，已尝试打开备用报告';
    HOST_WIN.setTimeout(() => {
      if (!button.isConnected) return;
      delete button.dataset.result;
      button.innerHTML = '<i class="fa-solid fa-stethoscope" aria-hidden="true"></i>';
      button.title = '一键采集并复制完整诊断报告';
    }, 1800);
  }

  // Sidebar search: host data is read through getContext, never imported into
  // this script's iframe (importing script.js there would boot a second host).
  const GLOBAL_SEARCH_ID = 'tle-global-search-panel';
  const SEARCH_PANELS = {
    'left-nav-panel': '预设管理', rm_api_block: 'API 连接配置',
    AdvancedFormatting: '高级格式化设置', WorldInfo: '世界书管理',
    'user-settings-block': '用户设置', Backgrounds: '背景设置',
    'bg-menu': '背景设置', rm_extensions_block: '扩展程序',
    PersonaManagement: 'User 身份管理', 'right-nav-panel': '角色管理',
    [ID.panel]: '布局引擎设置',
  };
  const search = {
    controls: new Map(), observer: null, refreshTimer: 0, renderTimer: 0,
    jumpAbort: null, highlight: null, highlightResolver: null, catalogPromise: null, limit: 60,
    matches: [], composing: false, lastIndexAt: 0,
  };
  const searchText = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
  const searchContext = () => HOST_WIN.SillyTavern?.getContext?.() || {};
  const searchSelector = id => '#' + HOST_WIN.CSS.escape(id);

  function searchLabel(node) {
    if (!node) return '';
    const copy = node.cloneNode(true);
    copy.querySelectorAll('input, select, textarea, button, script, style, .notes, .description').forEach(el => el.remove());
    return (copy.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 150);
  }

  function collectSearchControls(doc = HOST_DOC) {
    // Keep stable identifiers, not references to unmounted TT controls.
    for (const [panelId, panelName] of Object.entries(SEARCH_PANELS)) {
      const root = doc.getElementById(panelId);
      if (!root) continue;
      const labels = new Map([...root.querySelectorAll('label[for]')].map(label => [label.htmlFor, label]));
      for (const control of root.querySelectorAll('input[id]:not([type="hidden"]):not([type="password"]):not([type="file"]), select[id], textarea[id], button[id], [role="button"][id]')) {
        if (control.closest('#' + GLOBAL_SEARCH_ID + ', #character_template, #avatar_template, .popup')) continue;
        if (control.hasAttribute('data-for')) continue; // range + numeric counter represent one setting
        const label = labels.get(control.id) || control.closest('label');
        const rangeTitle = control.closest('.range-block')?.querySelector('.range-block-title');
        const title = searchLabel(label) || searchLabel(rangeTitle) || control.getAttribute('aria-label') || control.getAttribute('title') ||
          searchLabel(control.previousElementSibling) || control.getAttribute('placeholder');
        if (!title || title.length > 150) continue;
        const disclosures = [];
        for (let el = control.parentElement; el && el !== root; el = el.parentElement) {
          if (el.matches('details, .inline-drawer')) {
            const toggle = el.querySelector(':scope > summary, :scope > .inline-drawer-toggle');
            disclosures.unshift({ id: el.id, title: searchLabel(toggle) });
          }
        }
        let translated = title;
        try { translated = searchContext().translate?.(title) || title; } catch {}
        const apiBlock = control.closest('[id$="_api-settings"], [id$="_api-presets"], #openai_settings, #range_block_openai, #range_block_novel');
        const apiId = apiBlock?.id.match(/^(kobold|novel|openai|textgenerationwebui)_/)?.[1] ||
          apiBlock?.id.match(/^range_block_(openai|novel)$/)?.[1] ||
          (panelId === 'left-nav-panel' ? control.id.match(/_(openai|novel|textgenerationwebui)$/)?.[1] : null);
        const entry = { category: '设置', title: translated, subtitle: panelName, apiId,
          keywords: `${title} ${control.id} ${control.getAttribute('data-i18n') || ''}`,
          kind: 'control', panelId, targetId: control.id, disclosures };
        // Static HTML fills gaps; mounted, translated controls take precedence.
        if (doc === HOST_DOC || !search.controls.has(control.id)) search.controls.set(control.id, entry);
      }
    }
  }

  function buildGlobalSearchIndex() {
    collectSearchControls();
    const entries = [], keys = new Set();
    const add = entry => {
      if (!String(entry.title || '').trim()) return;
      const key = `${entry.kind}:${entry.panelId || ''}:${entry.targetId || entry.identity || entry.title}`;
      if (keys.has(key)) return;
      keys.add(key);
      entries.push({ ...entry, titleKey: searchText(entry.title),
        keywords: searchText(`${entry.category} ${entry.title} ${entry.subtitle || ''} ${entry.keywords || ''}`) });
    };
    for (const [panelId, title] of Object.entries(SEARCH_PANELS)) {
      if (HOST_DOC.getElementById(panelId)) add({ kind: 'panel', panelId, title, category: '导航', subtitle: '打开面板', keywords: panelId });
    }
    const ctx = searchContext();
    const activeApi = ctx.mainApi === 'koboldhorde' ? 'kobold' : ctx.mainApi;
    for (const entry of search.controls.values()) {
      if (entry.apiId && activeApi && entry.apiId !== activeApi) continue;
      add(entry);
    }
    for (const [setting, title] of [['pc-hamburger', 'PC 汉堡导航'], ['diagnostic-mode', '诊断模式 引擎体检仪'],
      ['info-enabled', '侧栏信息站设置'], ['compat-layer-repair', '兼容性修复 标准层级'],
      ['compat-panel-bg', '兼容性修复 面板背景']]) {
      add({ kind: 'control', targetId: `tle-setting-${setting}`, selector: `[data-tle-setting="${setting}"]`,
        category: '设置', panelId: ID.panel, title, subtitle: '布局引擎设置' });
    }
    for (const character of ctx.characters || []) {
      if (!character?.avatar) continue;
      add({ kind: 'character', identity: character.avatar, title: character.name || character.avatar,
        category: '角色卡', subtitle: character.avatar, panelId: 'right-nav-panel', keywords: '角色 character' });
    }
    for (const [identity, name] of Object.entries(ctx.powerUserSettings?.personas || {})) {
      add({ kind: 'persona', identity, title: name || identity, category: 'User 身份',
        subtitle: ctx.powerUserSettings?.persona_descriptions?.[identity]?.title || identity,
        panelId: 'PersonaManagement', keywords: '用户 人设 persona' });
    }
    const presets = [
      ['openai', 'settings_preset_openai', '对话补全预设', 'left-nav-panel'],
      ['textgenerationwebui', 'settings_preset_textgenerationwebui', '文本补全预设', 'left-nav-panel'],
      ['context', 'context_presets', '上下文模板', 'AdvancedFormatting'],
      ['instruct', 'instruct_presets', '指令模板', 'AdvancedFormatting'],
      ['sysprompt', 'sysprompt_select', '系统提示词', 'AdvancedFormatting'],
      ['reasoning', 'reasoning_select', '推理格式', 'AdvancedFormatting'],
    ];
    for (const [apiId, targetId, category, panelId] of presets) {
      const select = HOST_DOC.getElementById(targetId);
      let names = [...(select?.options || [])].filter(o => o.value !== '' && !o.disabled).map(o => o.textContent.trim());
      try {
        const list = ctx.getPresetManager?.(apiId)?.getPresetList?.(apiId)?.preset_names;
        if (list) names = Array.isArray(list) ? list : Object.keys(list);
      } catch (error) { console.debug('[TLE Search] 预设索引暂不可用', apiId); }
      for (const title of names) add({ kind: 'preset', identity: `${apiId}:${title}`, targetId: `${targetId}:${title}`,
        selectId: targetId, apiId, title, category, panelId, subtitle: '定位预设选择器', keywords: 'preset 预设' });
    }
    for (const select of HOST_DOC.querySelectorAll('#themes, #world_editor_select')) {
      for (const option of select.options) {
        if (!option.value || option.disabled) continue;
        add({ kind: 'option', identity: `${select.id}:${option.value}`, selectId: select.id,
          title: option.textContent.trim(), category: select.id === 'themes' ? '主题' : '世界书',
          panelId: select.closest('.drawer-content')?.id, subtitle: '定位选择器' });
      }
    }
    const currentCharacter = ctx.characters?.[ctx.characterId];
    let presetRegex = [];
    try { presetRegex = ctx.getPresetManager?.()?.readPresetExtensionField?.({ path: 'regex_scripts' }) || []; } catch {}
    for (const [scripts, container, subtitle] of [
      [ctx.extensionSettings?.regex, 'saved_regex_scripts', '全局正则'],
      [currentCharacter?.data?.extensions?.regex_scripts, 'saved_scoped_scripts', '当前角色正则'],
      [presetRegex, 'saved_preset_scripts', '当前预设正则'],
    ]) {
      if (!Array.isArray(scripts)) continue;
      for (const rule of scripts) add({ kind: 'regex', identity: `${container}:${rule.id || rule.scriptName}`,
        ruleId: rule.id, title: rule.scriptName, category: '正则', subtitle,
        panelId: 'rm_extensions_block', container, keywords: 'regex 正则表达式' });
    }
    for (const row of HOST_DOC.querySelectorAll('#regex_container .regex-script-label')) {
      const container = row.closest('#saved_regex_scripts, #saved_scoped_scripts, #saved_preset_scripts')?.id;
      if (!container) continue;
      add({ kind: 'regex', identity: `${container}:${row.id || searchLabel(row.querySelector('.regex_script_name'))}`,
        ruleId: row.id, title: searchLabel(row.querySelector('.regex_script_name')), category: '正则',
        subtitle: '正则规则', panelId: 'rm_extensions_block', container });
    }
    search.lastIndexAt = Date.now();
    return entries;
  }

  function refreshSearchIndex() {
    if (state.destroyed) return;
    try {
      state.globalSearchIndex = buildGlobalSearchIndex();
      const input = state.globalSearchPanel?.querySelector('input');
      if (state.globalSearchView === 'search' && input?.value) renderGlobalSearchResults(input.value);
    } catch (error) { console.warn('[TLE Search] 索引刷新失败', error); }
  }

  function loadSearchCatalog() {
    // TT may park unopened settings outside document. Read markup only, using
    // the current host's same-origin page; never run scripts in the parsed HTML.
    if (search.catalogPromise) return search.catalogPromise;
    search.catalogPromise = HOST_WIN.fetch(HOST_WIN.location.pathname, { signal: state.abort.signal })
      .then(response => { if (!response.ok) throw new Error('设置目录不可用'); return response.text(); })
      .then(html => {
        if (state.destroyed) return;
        collectSearchControls(new HOST_WIN.DOMParser().parseFromString(html, 'text/html'));
        refreshSearchIndex();
      }).catch(error => {
        if (error.name !== 'AbortError') console.debug('[TLE Search] 使用已加载设置目录', error.message);
      });
    return search.catalogPromise;
  }

  function clearSearchHighlight() {
    search.highlight?.classList.remove('tle-search-highlight');
    search.highlight = null;
    search.highlightResolver = null;
    HOST_DOC.getElementById('tle-search-location')?.remove();
  }

  function revealSearchAncestors(target) {
    const ancestors = [];
    for (let el = target?.parentElement; el && el !== HOST_DOC.body; el = el.parentElement) ancestors.unshift(el);
    for (const el of ancestors) {
      if (el.tagName === 'DETAILS' && !el.open) el.open = true;
      if (el.classList.contains('inline-drawer-content') && HOST_WIN.getComputedStyle(el).display === 'none') {
        el.parentElement?.querySelector(':scope > .inline-drawer-toggle')?.click();
      }
      // The installed regex grouping UI uses its own disclosure, separate from
      // the enable/disable toggle. Only open the group; never toggle its rules.
      if (el.classList.contains('rgm-content') && HOST_WIN.getComputedStyle(el).display === 'none') {
        el.parentElement?.querySelector(':scope > .rgm-header > .rgm-title[aria-expanded="false"]')?.click();
      }
    }
  }

  function openSearchPanel(panelId) {
    if (panelId === ID.panel) { setPanelOpen(true); return state.panel; }
    const panel = HOST_DOC.getElementById(panelId);
    const drawer = panel?.closest('.drawer');
    if (!panel || !drawer) throw new Error('目标面板尚未加载');
    if (!panel.classList.contains('openDrawer')) {
      const toggle = drawer.querySelector(':scope > .drawer-toggle');
      (toggle?.querySelector('.drawer-icon') || toggle)?.click();
    }
    return panel;
  }

  function waitSearchTarget(find, signal, timeout = 4500) {
    return new Promise((resolve, reject) => {
      let timer, frame, done = false;
      const finish = (value, error) => {
        if (done) return;
        done = true;
        observer.disconnect(); HOST_WIN.clearTimeout(timer); HOST_WIN.cancelAnimationFrame(frame);
        signal.removeEventListener('abort', abort);
        error ? reject(error) : resolve(value);
      };
      const abort = () => finish(null, new HOST_WIN.DOMException('已取消定位', 'AbortError'));
      const check = () => {
        frame = 0;
        if (signal.aborted || state.destroyed) return abort();
        try { const target = find(); if (target) finish(target); } catch (error) { finish(null, error); }
      };
      const observer = new HOST_WIN.MutationObserver(() => {
        if (!frame && !done) frame = HOST_WIN.requestAnimationFrame(check);
      });
      observer.observe(HOST_DOC.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style', 'open', 'hidden'] });
      signal.addEventListener('abort', abort, { once: true });
      timer = HOST_WIN.setTimeout(() => finish(null, new Error('目标未显示，可能被当前筛选条件隐藏或已被删除')), timeout);
      check();
    });
  }

  function revealSearchDisclosurePath(entry, root) {
    for (const step of entry.disclosures || []) {
      const el = (step.id && HOST_DOC.getElementById(step.id)) || [...root.querySelectorAll('details, .inline-drawer')]
        .find(node => searchLabel(node.querySelector(':scope > summary, :scope > .inline-drawer-toggle')) === step.title);
      if (!el) continue;
      if (el.tagName === 'DETAILS') { if (!el.open) el.open = true; }
      else {
        const content = el.querySelector(':scope > .inline-drawer-content');
        if (content && HOST_WIN.getComputedStyle(content).display === 'none') el.querySelector(':scope > .inline-drawer-toggle')?.click();
      }
    }
  }

  function searchPageForItem(paginationId, predicate) {
    const jq = HOST_WIN.jQuery;
    if (!jq?.fn?.pagination) return;
    const pagination = jq(searchSelector(paginationId));
    const data = pagination.data('pagination');
    const items = data?.attributes?.dataSource;
    if (!Array.isArray(items)) return;
    const index = items.findIndex(predicate), pageSize = Number(data.model?.pageSize || data.attributes.pageSize);
    if (index < 0 || !pageSize) return;
    const page = Math.floor(index / pageSize) + 1;
    if (Number(pagination.pagination('getSelectedPageNum')) !== page) pagination.pagination('go', page);
  }

  async function jumpToSearchResult(entry) {
    search.jumpAbort?.abort();
    const controller = new HOST_WIN.AbortController();
    search.jumpAbort = controller;
    const signal = controller.signal;
    clearSearchHighlight();
    closeGlobalSearch();
    try {
      // Hide the rail first: setMobileNavOpen also closes the TLE panel.
      if (usesHamburger()) setMobileNavOpen(false);
      const root = openSearchPanel(entry.panelId);
      let target;
      if (entry.kind === 'character' || entry.kind === 'persona') {
        const character = entry.kind === 'character';
        if (character) HOST_DOC.getElementById('rm_button_characters')?.click();
        const inputId = character ? 'character_search_bar' : 'persona_search_bar';
        const input = await waitSearchTarget(() => HOST_DOC.getElementById(inputId), signal);
        // Native filtering and pagination reveal the item without selecting a
        // different chat or changing the active User identity.
        input.value = entry.title;
        input.dispatchEvent(new HOST_WIN.Event('input', { bubbles: true }));
        target = await waitSearchTarget(() => {
          const ctx = searchContext();
          const id = character ? ctx.characters?.findIndex(c => c.avatar === entry.identity) : -1;
          searchPageForItem(character ? 'rm_print_characters_pagination' : 'persona_pagination_container',
            item => character ? item?.item?.avatar === entry.identity : item === entry.identity);
          const node = character ? HOST_DOC.getElementById(`CharID${id}`) :
            [...root.querySelectorAll('.avatar-container[data-avatar-id]')].find(el => el.dataset.avatarId === entry.identity);
          return node && isActuallyVisible(node) ? node : null;
        }, signal);
      } else if (entry.kind === 'regex') {
        const regexRoot = await waitSearchTarget(() => HOST_DOC.getElementById('regex_container'), signal);
        const disclosure = regexRoot.querySelector('.inline-drawer-content');
        if (disclosure) revealSearchAncestors(disclosure.firstElementChild || disclosure);
        const container = await waitSearchTarget(() => HOST_DOC.getElementById(entry.container), signal);
        revealSearchAncestors(container);
        target = await waitSearchTarget(() => {
          const rows = [...container.querySelectorAll('.regex-script-label')];
          const row = rows.find(row => entry.ruleId ? row.id === entry.ruleId : searchLabel(row.querySelector('.regex_script_name')) === entry.title);
          if (row) revealSearchAncestors(row);
          return row?.isConnected && isActuallyVisible(row) ? row : null;
        }, signal);
      } else if (entry.kind === 'preset' || entry.kind === 'option') {
        const descriptor = search.controls.get(entry.selectId);
        target = await waitSearchTarget(() => {
          if (descriptor) revealSearchDisclosurePath(descriptor, root);
          return HOST_DOC.getElementById(entry.selectId);
        }, signal);
        const option = [...target.options].find(o => o.textContent.trim() === entry.title);
        if (!option) throw new Error('该条目已被删除，请重新搜索');
        // Highlight the native select and identify the desired option. Opening
        // a search result never dispatches change or silently applies a preset.
        const note = HOST_DOC.createElement('div');
        note.id = 'tle-search-location'; note.className = 'tle-search-location';
        note.textContent = `已找到：${entry.title} · 点击下方选择器选择此项`;
        target.before(note);
      } else if (entry.kind === 'control') {
        target = await waitSearchTarget(() => {
          revealSearchDisclosurePath(entry, root);
          return entry.selector ? root.querySelector(entry.selector) : HOST_DOC.getElementById(entry.targetId);
        }, signal);
      } else target = root;
      if (signal.aborted || state.destroyed) return;
      revealSearchAncestors(target);
      await waitSearchTarget(() => isActuallyVisible(target) ? target : null, signal);
      if (signal.aborted || state.destroyed) return;
      search.highlightResolver = () => {
        if (entry.kind === 'character') {
          const id = searchContext().characters?.findIndex(c => c.avatar === entry.identity);
          return HOST_DOC.getElementById(`CharID${id}`);
        }
        if (entry.kind === 'persona') return [...HOST_DOC.querySelectorAll('#user_avatar_block .avatar-container[data-avatar-id]')]
          .find(el => el.dataset.avatarId === entry.identity);
        if (entry.selector) return HOST_DOC.querySelector(entry.selector);
        return target.id ? HOST_DOC.getElementById(target.id) : target.isConnected ? target : null;
      };
      target.classList.add('tle-search-highlight'); search.highlight = target;
      target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
      if (target.matches('input, select, textarea, button')) target.focus({ preventScroll: true });
    } catch (error) {
      if (error.name === 'AbortError' || state.destroyed) return;
      clearSearchHighlight();
      openGlobalSearch();
      const input = state.globalSearchPanel?.querySelector('input');
      if (input) {
        input.value = entry.title;
        renderGlobalSearchResults(input.value);
      }
      const status = state.globalSearchPanel?.querySelector('.tle-search-status');
      if (status) status.textContent = `无法定位：${error.message}`;
      console.warn('[TLE Search] 跳转失败', error);
    }
  }

  function renderGlobalSearchResults(query = '', preserveLimit = false) {
    const panel = state.globalSearchPanel;
    if (!panel) return;
    const results = panel.querySelector('.tle-search-results');
    const q = searchText(query), tokens = q.split(' ').filter(Boolean);
    panel.classList.toggle('has-query', Boolean(q));
    panel.querySelector('.tle-search-clear').hidden = !query;
    if (!preserveLimit) search.limit = 60;
    results.replaceChildren();

    const status = HOST_DOC.createElement('div');
    status.className = 'tle-search-status';
    status.setAttribute('role', 'status');
    if (!q) {
      search.matches = [];
      status.textContent = '输入关键词，搜索设置、角色、身份、预设和正则';
      results.append(status);
      return;
    }

    const score = item => item.titleKey === q ? 0 : item.titleKey.startsWith(q) ? 1 : item.titleKey.includes(q) ? 2 : 3;
    search.matches = state.globalSearchIndex.filter(item => tokens.every(token => item.keywords.includes(token)))
      .sort((a, b) => score(a) - score(b) || a.category.localeCompare(b.category, 'zh-CN'));
    status.textContent = search.matches.length ? `找到 ${search.matches.length} 项` : '无结果';
    results.append(status);

    const fragment = HOST_DOC.createDocumentFragment();
    for (const [index, item] of search.matches.slice(0, search.limit).entries()) {
      const button = HOST_DOC.createElement('button');
      button.type = 'button';
      button.className = 'tle-search-result';
      button.dataset.searchResult = String(index);
      const title = HOST_DOC.createElement('span'), subtitle = HOST_DOC.createElement('small');
      title.textContent = item.title;
      subtitle.textContent = `${item.category} · ${item.subtitle || ''}`;
      button.append(title, subtitle);
      fragment.append(button);
    }
    if (search.matches.length > search.limit) {
      const more = HOST_DOC.createElement('button');
      more.type = 'button';
      more.className = 'tle-search-more';
      more.textContent = `显示更多（还剩 ${search.matches.length - search.limit} 项）`;
      fragment.append(more);
    }
    results.append(fragment);
  }

  function setGlobalSearchView(view) {
    const panel = state.globalSearchPanel;
    if (!panel) return;
    const next = view === 'resources' ? 'resources' : 'search';
    state.globalSearchView = next;
    panel.classList.toggle('is-resource-view', next === 'resources');
    const searchView = panel.querySelector('.tle-organizer-search-view');
    const resourcesView = panel.querySelector('.tle-organizer-resources');
    if (searchView) searchView.hidden = next !== 'search';
    if (resourcesView) resourcesView.hidden = next !== 'resources';
    panel.querySelectorAll('[data-organizer-tab]').forEach(button => {
      const active = button.dataset.organizerTab === next;
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-selected', String(active));
    });
    const input = panel.querySelector('.tle-search-field');
    const clear = panel.querySelector('.tle-search-clear');
    if (input) {
      input.value = '';
      input.placeholder = next === 'resources'
        ? '筛选当前分类资源名称、备注或标签…'
        : '搜索设置、角色、User 身份、预设和正则…';
      input.setAttribute('aria-label', next === 'resources'
        ? '筛选当前分类资源名称、备注或标签'
        : '搜索设置、角色、User 身份、预设和正则');
    }
    if (clear) clear.hidden = true;
    if (next === 'search') {
      renderGlobalSearchResults('');
      refreshSearchIndex();
      loadSearchCatalog();
    } else {
      quickPanel?.onSearchInput?.();
    }
  }

  function closeGlobalSearch(restoreFocus = false) {
    if (quickPanel?.embedded) closeQuickPanel(false);
    HOST_WIN.clearTimeout(search.renderTimer);
    const input = state.globalSearchPanel?.querySelector('input');
    if (input) input.value = '';
    state.globalSearchView = 'search';
    state.globalSearchPanel?.classList.remove('is-resource-view');
    renderGlobalSearchResults('');
    if (state.globalSearchPanel) {
      state.globalSearchPanel.hidden = true;
      state.globalSearchPanel.setAttribute('aria-hidden', 'true');
    }
    HOST_DOC.body.classList.remove('tle-global-search-open');
    state.globalSearchOpen = false;
    state.organizerEntry?.querySelector('#' + ID.searchToggle)?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) {
      state.organizerEntry?.querySelector('#' + ID.searchToggle)?.focus({ preventScroll: true });
    }
  }

  function openGlobalSearch() {
    if (!globalSearchEnabled || !state.globalSearchPanel) return;
    if (quickPanel && !quickPanel.embedded) closeQuickPanel(false);
    search.jumpAbort?.abort();
    const panel = state.globalSearchPanel;
    panel.hidden = false;
    panel.setAttribute('aria-hidden', 'false');
    state.globalSearchOpen = true;
    state.organizerEntry?.querySelector('#' + ID.searchToggle)?.setAttribute('aria-expanded', 'true');
    HOST_DOC.body.classList.add('tle-global-search-open');
    const input = panel.querySelector('input');
    setGlobalSearchView('search');
    if (input?.isConnected) input.focus({ preventScroll: true });
  }

  function createGlobalSearch() {
    try {
      if (state.globalSearchPanel) return;
      const panel = HOST_DOC.createElement('section');
      state.globalSearchPanel = panel;
      panel.id = GLOBAL_SEARCH_ID;
      panel.className = 'tle-global-search-overlay';
      panel.setAttribute('aria-label', '整理侠');
      panel.setAttribute('aria-hidden', 'true');
      panel.hidden = true;
      panel.innerHTML = `
        <div class="popup tle-search-surface" role="dialog" aria-modal="true" aria-label="整理侠">
          <header class="tle-search-heading">
            <div class="tle-search-heading-copy">
              <strong class="tle-search-title">整理侠</strong>
              <span class="tle-search-subtitle">全局搜索 · 资源分组 · 批量管理</span>
            </div>
            <nav class="tle-organizer-tabs" role="tablist" aria-label="整理侠功能">
              <button type="button" data-organizer-tab="search" role="tab" aria-selected="true" aria-pressed="true">搜索</button>
              <button type="button" data-organizer-tab="resources" role="tab" aria-selected="false" aria-pressed="false">资源管理</button>
            </nav>
            <button type="button" class="tle-search-close" aria-label="关闭整理侠">×</button>
          </header>
          <div class="tle-search-input-wrap tle-search-field-wrap">
            <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input class="text_pole tle-search-field" type="text" role="searchbox" enterkeyhint="search"
              autocomplete="off" spellcheck="false" placeholder="搜索设置、角色、User 身份、预设和正则…"
              aria-label="搜索设置、角色、User 身份、预设和正则" aria-controls="tle-search-results" />
            <button type="button" class="tle-search-clear" aria-label="清除搜索" hidden>×</button>
          </div>
          <div class="tle-organizer-search-view">
            <div id="tle-search-results" class="tle-search-results" role="list"></div>
          </div>
          <div class="tle-organizer-resources" hidden></div>
        </div>`;

      const input = panel.querySelector('input');
      input.addEventListener('focus', () => {
        if (state.globalSearchView !== 'search') return;
        search.jumpAbort?.abort();
        refreshSearchIndex();
        loadSearchCatalog();
      }, { signal: state.abort.signal });
      const onInput = () => {
        const clear = panel.querySelector('.tle-search-clear');
        if (clear) clear.hidden = !input.value;
        if (state.globalSearchView === 'resources') {
          quickPanel?.onSearchInput?.();
          return;
        }
        HOST_WIN.clearTimeout(search.renderTimer);
        renderGlobalSearchResults(input.value);
        if (Date.now() - search.lastIndexAt > 1500 && !search.composing) {
          search.renderTimer = HOST_WIN.setTimeout(refreshSearchIndex, 100);
        }
      };
      input.addEventListener('input', onInput, { signal: state.abort.signal });
      input.addEventListener('search', onInput, { signal: state.abort.signal });
      input.addEventListener('compositionstart', () => { search.composing = true; }, { signal: state.abort.signal });
      input.addEventListener('compositionend', () => { search.composing = false; onInput(); }, { signal: state.abort.signal });

      panel.addEventListener('click', event => {
        if (event.target === panel) {
          closeGlobalSearch(true);
          return;
        }
        const organizerTab = event.target.closest('[data-organizer-tab]');
        if (organizerTab) {
          if (organizerTab.dataset.organizerTab === 'resources') openQuickGroupManager(organizerTab);
          else setGlobalSearchView('search');
          return;
        }
        const result = event.target.closest('[data-search-result]');
        if (result && state.globalSearchView === 'search') {
          const entry = search.matches[Number(result.dataset.searchResult)];
          if (entry) void jumpToSearchResult(entry);
        } else if (event.target.closest('.tle-search-clear')) {
          input.value = '';
          panel.querySelector('.tle-search-clear').hidden = true;
          if (state.globalSearchView === 'resources') quickPanel?.onSearchInput?.();
          else renderGlobalSearchResults('');
          input.focus({ preventScroll: true });
        } else if (event.target.closest('.tle-search-more') && state.globalSearchView === 'search') {
          search.limit += 60;
          renderGlobalSearchResults(input.value, true);
        } else if (event.target.closest('.tle-search-close')) {
          closeGlobalSearch(true);
        }
      }, { signal: state.abort.signal });

      panel.addEventListener('keydown', event => {
        if (event.isComposing) return;
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          closeGlobalSearch(true);
        } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && state.globalSearchView === 'search') {
          const buttons = [...panel.querySelectorAll('.tle-search-result, .tle-search-more')];
          if (!buttons.length) return;
          event.preventDefault();
          const index = buttons.indexOf(HOST_DOC.activeElement);
          buttons[(index + (event.key === 'ArrowDown' ? 1 : buttons.length - 1) + buttons.length) % buttons.length]?.focus();
        } else if (event.key === 'Enter' && event.target === input && state.globalSearchView === 'search') {
          event.preventDefault();
          if (search.matches[0]) void jumpToSearchResult(search.matches[0]);
        }
      }, { signal: state.abort.signal });

      HOST_DOC.addEventListener('click', event => {
        const highlight = search.highlight;
        if (highlight && (highlight.contains(event.target) || event.target.closest?.('label')?.control === highlight)) clearSearchHighlight();
      }, { capture: true, signal: state.abort.signal });

      search.observer = new HOST_WIN.MutationObserver(records => {
        // Character/persona lists finish debounced filtering after navigation.
        // Transfer the highlight to the same resource's replacement row.
        if (!state.destroyed && search.highlight && !search.highlight.isConnected) {
          const replacement = search.highlightResolver?.();
          if (replacement) {
            search.highlight = replacement;
            replacement.classList.add('tle-search-highlight');
            replacement.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
          }
        }
        if (state.destroyed || !state.globalSearchOpen || state.globalSearchView !== 'search' || !records.some(record => {
          const el = record.target.nodeType === 1 ? record.target : record.target.parentElement;
          return el?.closest('.drawer-content') && !el.closest('#' + GLOBAL_SEARCH_ID);
        })) return;
        HOST_WIN.clearTimeout(search.refreshTimer);
        search.refreshTimer = HOST_WIN.setTimeout(refreshSearchIndex, 180);
      });
      search.observer.observe(HOST_DOC.body, { childList: true, subtree: true, characterData: true });

      HOST_DOC.body.appendChild(panel);
      applyGlobalSearchAvailability();
      renderGlobalSearchResults('');
    } catch (error) {
      state.globalSearchPanel?.remove();
      state.globalSearchPanel = null;
      console.warn('[TLE Search] 搜索创建失败，导航保持可用', error);
    }
  }

  function createRailControls() {
    const header = HOST_DOC.createElement('header');
    header.id = ID.workspaceHeader;
    header.className = 'tle-workspace-header';
    header.innerHTML = `
      <div class="tle-workspace-brand">
        <button id="${ID.greetingToggle}" class="tle-workspace-greeting" type="button"
          aria-label="切换当前 User 身份" aria-haspopup="dialog" aria-controls="tle-quick-picker" title="切换当前 User 身份">
          <span data-tle-greeting-text>Hello, User.</span>
          <i class="fa-solid fa-chevron-down" aria-hidden="true"></i>
        </button>
        <span class="tle-workspace-subtitle">SILLYTAVERN WORKSPACE</span>
      </div>
      <div class="tle-workspace-actions">
        <button id="${ID.dockToggle}" class="tle-workspace-icon-button" type="button"
          aria-label="停靠侧边导航栏" aria-pressed="false" title="停靠侠：固定侧边导航栏">
          <i class="fa-solid fa-thumbtack" aria-hidden="true"></i>
        </button>
      </div>`;
    state.workspaceHeader = header;
    state.mobileNav.dockToggle = header.querySelector('#' + ID.dockToggle);
    HOST_DOC.getElementById('top-settings-holder')?.prepend(header);
    updateWorkspaceHeader();

    const hamburger = HOST_DOC.createElement('button');
    hamburger.id = ID.mobileToggle;
    hamburger.type = 'button';
    hamburger.setAttribute('aria-controls', 'top-settings-holder');
    hamburger.innerHTML = '<i class="fa-solid fa-bars" aria-hidden="true"></i>';
    HOST_DOC.body.appendChild(hamburger);
    state.mobileNav.toggle = hamburger;
    const entry = HOST_DOC.createElement('section');
    entry.id = ID.nav;
    entry.innerHTML = `
      <button type="button" title="Tavern Layout Engine" aria-label="TLE 控制中心"
        aria-controls="${ID.panel}" aria-expanded="false">
        <span class="tle-engine-mark" aria-hidden="true">
          <svg viewBox="0 0 64 64" focusable="false">
            <defs>
              <linearGradient id="tle-engine-petal" x1="20" y1="14" x2="45" y2="51" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="var(--SmartThemeQuoteColor, #E8C7D4)"/><stop offset=".55" stop-color="var(--SmartThemeQuoteColor, #C994A7)" stop-opacity=".82"/><stop offset="1" stop-color="var(--SmartThemeBodyColor, #986176)" stop-opacity=".72"/>
              </linearGradient>
              <linearGradient id="tle-engine-ring" x1="15" y1="13" x2="49" y2="51" gradientUnits="userSpaceOnUse">
                <stop offset="0" stop-color="var(--SmartThemeQuoteColor, #E8C7D4)"/><stop offset="1" stop-color="var(--SmartThemeBodyColor, #89566A)"/>
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="24" fill="none" stroke="url(#tle-engine-ring)" stroke-width="1.7" opacity=".9"/>
            <circle cx="32" cy="32" r="18.5" fill="none" stroke="currentColor" stroke-opacity=".16"/>
            <g transform="translate(32 32)" fill="url(#tle-engine-petal)">
              <path d="M0-15C7-15 10-8 7-2C5 2 2 4 0 9C-2 4-5 2-7-2C-10-8-7-15 0-15Z"/>
              <path d="M0-15C7-15 10-8 7-2C5 2 2 4 0 9C-2 4-5 2-7-2C-10-8-7-15 0-15Z" transform="rotate(90)"/>
              <path d="M0-15C7-15 10-8 7-2C5 2 2 4 0 9C-2 4-5 2-7-2C-10-8-7-15 0-15Z" transform="rotate(180)"/>
              <path d="M0-15C7-15 10-8 7-2C5 2 2 4 0 9C-2 4-5 2-7-2C-10-8-7-15 0-15Z" transform="rotate(270)"/>
            </g>
            <rect x="27.5" y="27.5" width="9" height="9" rx="2" transform="rotate(45 32 32)" fill="var(--SmartThemeBodyColor, #FFF4F8)" stroke="var(--SmartThemeQuoteColor, #A9788B)" stroke-width=".8"/>
            <circle cx="49" cy="48" r="4.2" fill="var(--SmartThemeBlurTintColor, #21181D)" stroke="var(--SmartThemeQuoteColor, #C994A7)" stroke-width="1.3"/>
            <circle cx="49" cy="48" r="2" fill="var(--SmartThemeQuoteColor, #E6B5C5)"/>
          </svg>
        </span>
        <span class="tle-engine-copy"><strong>TLE</strong><small>Engine Hub</small></span>
        <span class="tle-engine-update-dot" data-tle-engine-update hidden aria-hidden="true"></span>
      </button>`;
    state.navEntry = entry;
    const organizerEntry = HOST_DOC.createElement('section');
    organizerEntry.id = ID.organizerEntry;
    organizerEntry.innerHTML = '<button id="' + ID.searchToggle + '" type="button" title="整理侠 · 搜索与资源管理" aria-label="打开整理侠" aria-haspopup="dialog" aria-controls="' + GLOBAL_SEARCH_ID + '" aria-expanded="false"><span class="tle-organizer-mark" aria-hidden="true"><i class="fa-solid fa-layer-group"></i></span><span class="tle-organizer-copy"><strong>整理侠</strong><small>RESOURCE ORGANIZER</small></span></button>';
    state.organizerEntry = organizerEntry;
    setMobileNavOpen(false);
  }

  function applyEngineHubMode() {
    const entry = state.navEntry;
    if (!entry) return;
    const compact = navigationMode === 'icons';
    entry.classList.toggle('tle-engine-compact', compact);
    const copy = entry.querySelector('.tle-engine-copy');
    if (copy) copy.hidden = compact;
    const button = entry.querySelector('button');
    if (button) button.setAttribute('aria-label', compact ? 'TLE 控制中心' : 'Tavern Layout Engine 控制中心');
  }

  // Legacy Test Loader 0.3.0 can still update v0.3.198 without another import.
  // Its checkRemote() prompts, so it must only be called on a user click.
  let legacyCandidate = null;
  function compareReleaseVersions(a,b) {
    const v = x => String(x||'').split(/[.-]/).slice(0,3).map(n=>Number(n)||0);
    const A=v(a),B=v(b);
    for(let i=0;i<3;i++) if(A[i]!==B[i]) return A[i]>B[i]?1:-1;
    return 0;
  }
  function getLegacyTestLoader() {
    const loader = HOST_WIN[LEGACY_TEST_LOADER_KEY];
    return loader?.channel === 'test' && typeof loader.checkRemote === 'function'
      ? loader : null;
  }
  function getStableLoader() {
    const loader = HOST_WIN[STABLE_LOADER_KEY];
    return loader?.channel === 'stable' && typeof loader.getInfo === 'function'
      ? loader : null;
  }

  function syncRemoteUpdateUI() {
    if (state.destroyed) return;
    const panel = state.panel;
    const runningVersion = HOST_WIN[INSTANCE_KEY]?.version || '未运行';
    const loader = getStableLoader();
    const legacy = loader ? null : getLegacyTestLoader();
    const info = loader?.getInfo?.();
    const bootstrap = HOST_WIN.__TLE_REMOTE_BOOTSTRAP_V1__;
    const bootstrapInfo = bootstrap?.getInfo?.();
    const legacyInfo = legacy?.diagnostics;
    const latest = info?.availableVersion || (legacy && legacyCandidate?.version) || null;
    const hasUpdate = Boolean(latest &&
      (loader ? info?.updateAvailable : compareReleaseVersions(latest, runningVersion) > 0));
    const canAutoUpdate = Boolean(loader && typeof loader.setAutoUpdateEnabled === 'function');
    const needsAdoption = Boolean(loader && info && !info.autoRestoreAuthorized
      && info.availableVersion === runningVersion);
    const isBusy = Boolean(loader ? info?.busy : legacyInfo?.busy);
    const hasLoaderUpdate = Boolean(bootstrapInfo?.updateAvailable);
    const loaderAvailable = panel?.querySelector('[data-tle-loader-available-version]');
    if (loaderAvailable) loaderAvailable.textContent = bootstrapInfo
      ? ((bootstrapInfo.currentLoaderVersion ? '当前 v' + bootstrapInfo.currentLoaderVersion : '未运行')
        + ' · GitHub ' + (bootstrapInfo.availableLoaderVersion ? 'v' + bootstrapInfo.availableLoaderVersion : '尚未获取')
        + ' · Bootstrap v' + bootstrapInfo.bootstrapVersion)
      : '尚未安装永久 Bootstrap（旧 Loader 不支持自身远程更新）';
    const checkLoader = panel?.querySelector('[data-tle-action="check-loader-update"]');
    const installLoader = panel?.querySelector('[data-tle-action="install-loader-update"]');
    if (checkLoader) {
      checkLoader.hidden = !bootstrap;
      checkLoader.disabled = Boolean(bootstrapInfo?.busy);
    }
    if (installLoader) {
      installLoader.hidden = !hasLoaderUpdate;
      installLoader.disabled = Boolean(bootstrapInfo?.busy);
      if (hasLoaderUpdate) installLoader.textContent = '更新 Loader · v' + bootstrapInfo.availableLoaderVersion;
    }
    const current = panel?.querySelector('[data-tle-runtime-version]');
    if (current) current.textContent = 'v' + runningVersion;
    const remote = panel?.querySelector('[data-tle-available-version]');
    if (remote) remote.textContent = latest ? 'v' + latest : '尚未获取';
    const channel = panel?.querySelector('[data-tle-update-channel]');
    if (channel) channel.textContent = loader
      ? 'Stable · Loader v' + info.loaderVersion
      : legacy ? 'Test · Loader v' + (legacy.version || '未知') : '未连接';
    const autoInput = panel?.querySelector('[data-tle-setting="auto-update"]');
    if (autoInput) {
      autoInput.disabled = !canAutoUpdate;
      autoInput.checked = canAutoUpdate ? info.autoUpdateEnabled !== false : false;
    }
    const policy = panel?.querySelector('[data-tle-update-policy]');
    if (policy) policy.textContent = canAutoUpdate
      ? '默认开启；启动、恢复联网及页面运行期间定期检查并安装经过验证的正式版。关闭后仍可手动更新。没有可靠回滚备份时不会自动替换。'
      : '当前 Loader 不支持自动安装；需要 Stable Loader v0.3.2 或更新版本。现有手动更新仍可使用。';
    const summary = panel?.querySelector('[data-tle-update-summary]');
    if (summary) summary.textContent = 'Core v' + runningVersion + ' · '
      + (isBusy || bootstrapInfo?.busy ? '检查中…' : hasUpdate ? '发现 Core v' + latest
        : hasLoaderUpdate ? '发现 Loader v' + bootstrapInfo.availableLoaderVersion
        : info?.checkedAt ? '已是最新或暂无更新' : '等待更新检查');
    const alert = panel?.querySelector('[data-tle-update-alert]');
    if (alert) alert.hidden = !hasUpdate && !hasLoaderUpdate;
    const update = panel?.querySelector('[data-tle-action="install-update"]');
    const check = panel?.querySelector('[data-tle-action="check-update"]');
    const adopt = panel?.querySelector('[data-tle-action="adopt-loader"]');
    const status = panel?.querySelector('[data-tle-loader-status]');
    const dot = state.navEntry?.querySelector('[data-tle-engine-update]');
    if (update) {
      update.hidden = !hasUpdate;
      update.disabled = isBusy;
      if (hasUpdate) update.textContent = '可更新 · v' + latest;
    }
    if (check) {
      check.hidden = !loader && !legacy;
      check.disabled = isBusy;
      check.textContent = isBusy ? '检查中…'
        : loader ? '检查更新' : '检查／安装更新';
      check.title = legacy
        ? '旧 Test Loader 检查后可能立即请求确认安装；不会静默替换'
        : '手动检查正式版更新';
    }
    if (adopt) {
      adopt.hidden = !needsAdoption;
      adopt.disabled = isBusy;
    }
    if (dot) dot.hidden = !hasUpdate && !hasLoaderUpdate;
    const engineButton = state.navEntry?.querySelector(':scope > button');
    if (engineButton) engineButton.title = hasUpdate
      ? 'TLE v' + runningVersion + ' · 可更新至 v' + latest
      : hasLoaderUpdate ? 'TLE Loader 可更新至 v' + bootstrapInfo.availableLoaderVersion
      : 'Tavern Layout Engine v' + runningVersion;
    if (status) {
      status.textContent = loader
        ? ('Stable Loader v' + info.loaderVersion + ' · ' + (isBusy ? '检查中'
          : hasUpdate ? '已发现正式版更新'
          : info.checkedAt ? '已是最新或暂无可用更新' : '尚未完成远程检查')
          + (info.lastStatus?.message ? ' · ' + info.lastStatus.message : '')
          + (bootstrapInfo?.lastStatus?.message ? ' · Loader：' + bootstrapInfo.lastStatus.message : ''))
        : legacy ? ('Test Loader v' + (legacy.version || '0.3.0') + ' · 测试通道 · '
          + (isBusy ? '检查中' : hasUpdate ? '已验证新版本' : '可手动检查并安装更新')
          + (legacyInfo?.lastStatus?.kind === 'error'
            ? ' · ' + String(legacyInfo.lastStatus.message).slice(0,180) : ''))
        : '尚未连接 Loader。安装 Stable Loader 后可在此查看和安装更新。';
    }
  }

  async function runLoaderUpdateAction(action) {
    const bootstrap = HOST_WIN.__TLE_REMOTE_BOOTSTRAP_V1__;
    if (action === 'check-loader-update' || action === 'install-loader-update') {
      try {
        if (action === 'check-loader-update') await bootstrap?.checkRemote?.();
        else await bootstrap?.loadRemote?.();
      } catch (error) {
        console.error('[TLE] Loader 自更新失败', error);
      } finally {
        if (!state.destroyed) syncRemoteUpdateUI();
      }
      return;
    }
    const stable = getStableLoader();
    const legacy = stable ? null : getLegacyTestLoader();
    if ((!stable && !legacy) || state.destroyed) {
      syncRemoteUpdateUI();
      return;
    }
    try {
      if (stable) {
        if (action === 'check-update') await stable.checkRemote();
        if (action === 'install-update') await stable.loadRemote();
        if (action === 'adopt-loader') await stable.adoptCurrent();
      } else if (legacy && action !== 'adopt-loader') {
        if (action === 'install-update' && legacyCandidate) {
          await legacy.loadRemote();
        } else if (action === 'check-update' || action === 'install-update') {
          // Older checkRemote() is not a silent check. It may prompt to install.
          const candidate = await legacy.checkRemote();
          if (candidate?.version && typeof candidate.sha256 === 'string')
            legacyCandidate = {version:candidate.version,sha256:candidate.sha256};
        }
      }
    } catch (error) {
      const status = state.panel?.querySelector('[data-tle-loader-status]');
      if (status) status.textContent = 'Loader 操作失败：' + (error?.message || error);
    } finally {
      if (!state.destroyed) syncRemoteUpdateUI();
    }
  }

  function setPanelOpen(open) {
    const panel = state.panel;
    if (!panel) return;
    const expanded = Boolean(open);
    panel.dataset.open = String(expanded);
    panel.classList.toggle('openDrawer', expanded);
    panel.classList.toggle('closedDrawer', !expanded);

    // Core baseline: never let a theme lower the TLE engine panel below
    // the 3005 navigation rail. This is always-on and is not a compatibility
    // repair toggle.
    panel.style.setProperty('z-index', '3006', 'important');

    state.navEntry?.querySelector('button')?.setAttribute('aria-expanded', String(expanded));
    if (expanded) syncRemoteUpdateUI();
  }

  function setActive(active) {
    state.active = Boolean(active);
    const status = state.panel?.querySelector('[data-tle-status]');
    const button = state.panel?.querySelector('[data-tle-action="pause"]');
    if (status) status.textContent = state.active ? '核心已启动' : '核心已暂停';
    if (button) button.textContent = state.active ? '暂停核心' : '恢复核心';
  }

  function makeRecord(node, label) {
    const marker = HOST_DOC.createComment(`TLE:${label}:original-position`);
    const parent = node.parentNode;
    if (!parent) return null;
    parent.insertBefore(marker, node);
    return { node, marker, parent };
  }

  function restoreRecord(record) {
    if (!record?.node || !record.marker?.parentNode) return;
    record.marker.parentNode.insertBefore(record.node, record.marker);
    record.marker.remove();
  }

  function isDesktopViewport() {
    return !isMobileViewport();
  }

  function applyPresetWorkspace() {
    if (!isDesktopViewport()) return false;
    if (state.destroyed || !state.active || state.preset.applied || state.preset.applying) return false;

    const panel = HOST_DOC.querySelector('#left-nav-panel');
    const scrollable = panel?.querySelector(':scope > .scrollableInner');
    const config = scrollable?.querySelector('#ai_response_configuration');
    const promptManager = config?.querySelector('#completion_prompt_manager');
    if (!panel || !scrollable || !config || !promptManager) return false;

    state.preset.applying = true;

    try {
      const promptWrapper = promptManager.parentElement;
      if (!promptWrapper) return false;

      const grid = HOST_DOC.createElement('div');
      grid.id = ID.presetGrid;
      const left = HOST_DOC.createElement('div');
      left.id = ID.presetSettings;
      const right = HOST_DOC.createElement('div');
      right.id = ID.presetPrompts;

      const topLevelBlocks = [...config.children];
      const records = topLevelBlocks.map((node, index) => makeRecord(node, `preset-block-${index}`)).filter(Boolean);
      const promptRecord = makeRecord(promptWrapper, 'prompt-manager-wrapper');

      Object.assign(state.preset, { root: config, grid, left, right, records, promptRecord });
      config.appendChild(grid);
      grid.append(left, right);

      for (const record of records) left.appendChild(record.node);
      right.appendChild(promptWrapper);

      panel.classList.add('tle-preset-wide');

      state.preset = {
        ...state.preset,
        applied: true,
        applying: false,
        root: config,
        grid,
        left,
        right,
        records,
        promptRecord,
      };

      const status = state.panel?.querySelector('[data-tle-preset-status]');
      if (status) status.textContent = '已应用';
      console.info('[Tavern Layout Engine] 预设双栏已应用。');
      return true;
    } catch (error) {
      console.error('[Tavern Layout Engine] 预设双栏应用失败。', error);
      restorePresetWorkspace();
      return false;
    } finally {
      state.preset.applying = false;
    }
  }

  function restorePresetWorkspace() {
    const preset = state.preset;

    // 即使状态记录不完整，也必须先解除会影响原生抽屉显示的 class。
    HOST_DOC.querySelector('#left-nav-panel')?.classList.remove('tle-preset-wide');

    if (preset.promptRecord) restoreRecord(preset.promptRecord);
    for (const record of [...preset.records].reverse()) restoreRecord(record);

    for (const column of [preset.left, preset.right]) {
      if (column && preset.root?.isConnected) {
        while (column.firstChild) preset.root.insertBefore(column.firstChild, preset.grid);
      }
    }
    preset.grid?.remove();

    state.preset = {
      applied: false,
      applying: false,
      root: null,
      grid: null,
      left: null,
      right: null,
      records: [],
      promptRecord: null,
    };

    const status = state.panel?.querySelector('[data-tle-preset-status]');
    if (status) status.textContent = '已恢复原生布局';
  }

  function newCharacterState() {
    return {
      applied: false, applying: false, panel: null, root: null, form: null,
      grid: null, identity: null, content: null, editBlock: null,
      hotSwap: null, hotSwapRecord: null, records: [], owners: [],
      detailObserver: null, selected: null, nullOwnerId: null,
    };
  }

  const characterMedia = HOST_WIN.matchMedia('(min-width: 1001px)');
  characterMedia.addEventListener('change', () => {
    if (!characterMedia.matches) restoreCharacterWorkspace();
    else if (state.active && !state.destroyed) applyCharacterWorkspace();
  }, { signal: state.abort.signal });

  function updateCharacterMode() {
    const c = state.character;
    if (!c.applied || c.applying) return;
    // Read native visibility. Do not write display/hidden on native elements.
    const selected = !c.editBlock.hidden && !c.form.hidden
      && HOST_WIN.getComputedStyle(c.editBlock).display !== 'none'
      && HOST_WIN.getComputedStyle(c.form).display !== 'none';
    if (selected === c.selected) return;
    c.selected = selected;
    c.panel.dataset.tleCharacterSelected = String(selected);
    if (selected) {
      // The hot-swap pin originally has no form. Moving it must not silently
      // add it (or any other hot-swap control) to form_create's submission.
      c.owners = [...c.hotSwap.querySelectorAll('button,fieldset,input,object,output,select,textarea')]
        .map(node => ({ node, attribute: node.getAttribute('form'), owner: node.form }));
      for (const record of c.owners) {
        if (!record.owner && record.attribute === null) record.node.setAttribute('form', c.nullOwnerId);
      }
      c.identity.prepend(c.hotSwap);
    } else {
      returnCharacterHotSwap(c);
    }
    const status = state.panel?.querySelector('[data-tle-character-status]');
    if (status) status.textContent = selected ? '角色详情 · 双栏' : '角色列表 · 全宽';
  }

  function returnCharacterHotSwap(c) {
    const record = c.hotSwapRecord;
    if (record?.marker.parentNode) record.marker.after(record.node);
    for (const { node, attribute } of c.owners) {
      if (attribute === null) node.removeAttribute('form');
      else node.setAttribute('form', attribute);
    }
    c.owners = [];
  }

  function applyCharacterWorkspace() {
    if (!isDesktopViewport()) return false;
    if (state.destroyed || !state.active || !characterMedia.matches
      || state.character.applied || state.character.applying) return false;
    const panel = HOST_DOC.querySelector('#right-nav-panel');
    const root = panel?.querySelector(':scope > .scrollableInner');
    const editBlock = root?.querySelector('#rm_ch_create_block');
    const form = editBlock?.querySelector('#form_create');
    const hotSwap = panel?.querySelector('#CharListButtonAndHotSwaps');
    const avatar = form?.querySelector('#avatar-and-name-block');
    const notes = form?.querySelector('#spoiler_free_desc');
    const description = form?.querySelector('#descriptionWrapper');
    const firstMessage = form?.querySelector('#firstMessageWrapper');
    if (!panel || !root || !form || !hotSwap || !avatar || !notes || !description || !firstMessage) return false;
    // These native top-level anchors are the supported structure. Fail without
    // changing DOM on an incompatible host rather than flattening unknown editors.
    if ([avatar, notes, description, firstMessage].some(node => node.parentNode !== form)) return false;
    // Existing externally associated hot-swap controls retain their association.
    // A control owned by another ancestor form without an explicit ID binding
    // is not safe to relocate; leave that host's layout untouched.
    if ([...hotSwap.querySelectorAll('button,fieldset,input,object,output,select,textarea')]
      .some(node => node.form && !node.hasAttribute('form'))) return false;

    // Remove empty engine-owned containers left by an interrupted prior teardown.
    // Never remove a container that still holds content or native controls.
    for (const id of [ID.characterIdentity, ID.characterContent]) {
      const leftover = HOST_DOC.getElementById(id);
      if (leftover && (leftover.parentNode !== form || leftover.childNodes.length)) return false;
    }
    for (const id of [ID.characterIdentity, ID.characterContent]) HOST_DOC.getElementById(id)?.remove();

    const c = newCharacterState();
    Object.assign(c, { applying: true, panel, root, editBlock, form, hotSwap });
    state.character = c; // Register rollback state BEFORE the first DOM mutation.
    try {
      c.grid = HOST_DOC.createElement('div');
      c.grid.id = ID.characterGrid;
      c.identity = HOST_DOC.createElement('section');
      c.identity.id = ID.characterIdentity;
      c.identity.setAttribute('aria-label', '角色身份与作者注释');
      c.content = HOST_DOC.createElement('section');
      c.content.id = ID.characterContent;
      c.content.setAttribute('aria-label', '角色描述与开场白');
      // An existing non-form element is a deterministic null form-owner target.
      c.nullOwnerId = ID.characterIdentity;
      c.hotSwapRecord = makeRecord(hotSwap, 'character-hotswap');
      const originalChildren = [...form.children];
      c.grid.append(c.identity, c.content);
      form.appendChild(c.grid); // form itself NEVER moves and keeps its display state.
      for (const node of originalChildren) {
        const record = makeRecord(node, `character-child-${c.records.length}`);
        c.records.push(record);
        const isContent = node === description || node === firstMessage || node.id === 'creators_note_desc_hidden';
        (isContent ? c.content : c.identity).appendChild(node);
      }
      panel.classList.add('tle-character-wide');
      c.applied = true;
      c.applying = false;
      c.detailObserver = new HOST_WIN.MutationObserver(updateCharacterMode);
      c.detailObserver.observe(editBlock, { attributes: true, subtree: true, attributeFilter: ['style', 'class', 'hidden'] });
      updateCharacterMode();
      return true;
    } catch (error) {
      console.error('[Tavern Layout Engine] 角色工作区应用失败，正在还原。', error);
      restoreCharacterWorkspace();
      return false;
    } finally {
      c.applying = false;
    }
  }

  function restoreCharacterWorkspace() {
    const c = state.character;
    c.detailObserver?.disconnect();
    c.panel?.classList.remove('tle-character-wide');
    if (c.panel) delete c.panel.dataset.tleCharacterSelected;
    returnCharacterHotSwap(c);
    for (const record of [...c.records].reverse()) restoreRecord(record);
    if (c.hotSwapRecord) restoreRecord(c.hotSwapRecord);
    // Preserve controls injected by extensions while the workspace was active.
    for (const column of [c.identity, c.content]) {
      if (column && c.form) while (column.firstChild) c.form.insertBefore(column.firstChild, c.grid);
    }
    if (c.grid && c.form) {
      for (const node of [...c.grid.childNodes]) {
        if (node !== c.identity && node !== c.content) c.form.insertBefore(node, c.grid);
      }
    }
    c.grid?.remove();
    state.character = newCharacterState();
    const status = state.panel?.querySelector('[data-tle-character-status]');
    if (status) status.textContent = '已恢复原生布局';
  }

  function emergencyRestore() {
    // Emergency recovery is a full release, not a pause. It must behave identically
    // at desktop and mobile breakpoints and leave no engine-owned layout residue.
    if (state.destroyed) return true;
    destroy();
    console.warn('[Tavern Layout Engine] 紧急恢复完成：已卸载布局引擎并恢复酒馆原生布局（PC / 手机通用）。');
    return true;
  }

  const NAV_LABEL_SELECTOR = '#top-settings-holder > .drawer > .tle-drawer-label';
  const NATIVE_TOGGLE_SELECTOR = '#top-settings-holder > .drawer > .drawer-toggle';

  function protectRailPress(event) {
    const target = event.target;
    if (!target?.closest || target.matches('.drawer-icon') || !HOST_DOC.querySelector('.openDrawer:not(.pinnedOpen)')) return;
    // ST closes drawers on touchstart/mousedown before click. It exempts only
    // a target with .drawer-icon, not labels, padding, or themed icon children.
    // A diagnostic tap is also an outside tap from SillyTavern's point of view.
    // Protect it at touchstart/mousedown: stopping the later click is too late
    // because mobile drawer dismissal happens before click on iOS.
    if (target.closest('#' + ID.chatShortcut + ', #' + ID.chatToolsButton + ', #' + ID.chatToolsPanel + ', #' + ID.diagnosticButton + ', #' + ID.mobileToggle + ', #' + ID.dockToggle + ', #' + ID.nav + ', #' + ID.organizerEntry + ', #' + ID.workspaceHeader + ', ' + NAV_LABEL_SELECTOR +
        ', #' + GLOBAL_SEARCH_ID + ', [data-tle-quick-panel], .tle-sidebar-info, ' + NATIVE_TOGGLE_SELECTOR)) event.stopPropagation();
  }

  function onClickCapture(event) {
    const target = event.target;
    if (!target?.closest) return;
    if (target.closest('[data-tle-quick-panel], #' + GLOBAL_SEARCH_ID)) return;

    const chatToolsPanel = target.closest('#' + ID.chatToolsPanel);
    if (chatToolsPanel) {
      const quickAction = target.closest('[data-chat-quick-action]');
      if (quickAction) {
        event.preventDefault();
        event.stopPropagation();
        runChatQuickAction(quickAction.dataset.chatQuickAction);
        return;
      }

      const companionAction = target.closest('[data-companion-action]')?.dataset.companionAction;
      if (companionAction) {
        event.preventDefault();
        event.stopPropagation();
        if (companionAction === 'save') void companionOpenEditor();
        if (companionAction === 'manager') companionOpenManager();
        return;
      }
      const clearButton = target.closest('[data-chat-action-clear]');
      if (clearButton) {
        event.preventDefault();
        event.stopPropagation();
        const row = clearButton.closest('[data-chat-action-row]');
        const input = clearButton.closest('.tle-chat-tools-input-wrap')?.querySelector('[data-chat-action-input]');
        if (input && !input.disabled) {
          input.value = '';
          syncChatActionClearButton(input, clearButton);
          input.focus({ preventScroll: true });
        }
        return;
      }

      const tab = target.closest('[data-chat-tools-tab]');
      if (tab) {
        event.preventDefault();
        event.stopPropagation();
        setChatToolsPage(tab.dataset.chatToolsTab);
        return;
      }
      if (target.closest('[data-chat-tools-current-filter]')) {
        event.preventDefault();
        event.stopPropagation();
        const recent = state.chatTools.recent;
        recent.onlyCurrent = !recent.onlyCurrent;
        const filterButton = recent.filterButton;
        if (filterButton) {
          filterButton.classList.toggle('active', recent.onlyCurrent);
          filterButton.setAttribute('aria-pressed', String(recent.onlyCurrent));
        }
        filterRecentChatRows();
        return;
      }
      const submit = target.closest('[data-chat-action-submit]');
      if (submit) {
        event.preventDefault();
        event.stopPropagation();
        const row = submit.closest('[data-chat-action-row]');
        const input = row?.querySelector('[data-chat-action-input="jump"], [data-chat-action-input="range-start"]');
        void runChatAction(submit.dataset.chatActionSubmit, input, submit);
        return;
      }
      if (target.closest('[data-chat-tools-copy]')) {
        event.preventDefault();
        event.stopPropagation();
        void copyHiddenMessageRanges();
        return;
      }
      if (target.closest('[data-chat-tools-recent-refresh]')) {
        event.preventDefault();
        event.stopPropagation();
        state.chatTools.recent.loading = false;
        void refreshRecentChats();
        return;
      }
      const recentRow = target.closest('[data-recent-chat-item]');
      if (recentRow) {
        event.preventDefault();
        event.stopPropagation();
        void openRecentChatItem(recentRow);
        return;
      }
      if (target.closest('[data-chat-tools-close]')) {
        event.preventDefault();
        event.stopPropagation();
        closeChatTools(false);
        return;
      }
      return;
    }
    if (target.closest('#' + ID.chatToolsButton)) {
      event.preventDefault();
      event.stopPropagation();
      toggleChatTools();
      return;
    }

    // Native icon clicks must pass untouched, including delegated handlers.
    // For script-owned controls only, consume the original click before the
    // host's outside-click handlers interpret it as an unrelated click.
    if (target.closest('#' + ID.chatShortcut)) {
      event.preventDefault();
      event.stopPropagation();
      returnToChat();
      return;
    }
    if (target.closest('#' + ID.greetingToggle)) {
      event.preventDefault();
      event.stopPropagation();
      void openQuickPicker('persona', target.closest('#' + ID.greetingToggle));
      return;
    }
    if (target.closest('#' + ID.searchToggle)) {
      event.preventDefault();
      event.stopPropagation();
      openGlobalSearch();
      return;
    }
    if (target.closest('#' + ID.dockToggle)) {
      event.preventDefault();
      event.stopPropagation();
      setNavigationDocked(!state.mobileNav.docked);
      return;
    }
    if (target.closest('#' + ID.mobileToggle)) {
      event.preventDefault();
      event.stopPropagation();
      setMobileNavOpen(!state.mobileNav.open);
      if (state.mobileNav.open) queueInfoRefresh();
      return;
    }
    if (target.closest('#' + ID.nav + ' > button')) {
      event.stopPropagation();
      setPanelOpen(!state.panel?.classList.contains('openDrawer'));
      return;
    }
    const label = target.closest(NAV_LABEL_SELECTOR);
    const info = target.closest('.tle-sidebar-info [data-info-item]');
    if (label || info) {
      event.stopPropagation();
      if (label) label.parentElement.querySelector(':scope > .drawer-toggle')?.click();
      else {
        const id = info.dataset.infoItem;
        if (target.closest('[data-info-jump]')) openNativePanelForInfo(id);
        else if (infoSettings[id].quick) void openQuickPicker(id, info.querySelector('.tle-info-copy'));
        else if (infoSettings[id].jump) openNativePanelForInfo(id);
      }
      return;
    }

    const inPanel = state.panel?.contains(target);
    if (state.panel?.classList.contains('openDrawer') && !inPanel) setPanelOpen(false);
    if (state.mobileNav.open && !inPanel && !target.closest('#top-settings-holder')) {
      setMobileNavOpen(false);
    }

    // Mobile drawers fill the screen. Fold away the rail only after the
    // native event finishes. On PC leave it open so a second click can close.
    if (state.mobileNav.open && isMobileViewport() && target.closest(NATIVE_TOGGLE_SELECTOR)) {
      HOST_WIN.requestAnimationFrame(() => {
        if (!state.destroyed && isMobileViewport()) setMobileNavOpen(false);
      });
    }
  }

  function describeNavigationEventNode(node) {
    if (!node) return null;
    return {
      tag: node.tagName || null,
      id: node.id || '',
      className: typeof node.className === 'string' ? node.className.slice(0, 160) : String(node.getAttribute?.('class') || '').slice(0, 160),
      role: node.getAttribute?.('role') || null,
    };
  }

  function getNavigationControlParts(button) {
    const drawer = button?.parentElement || null;
    const icon = button?.querySelector(':scope > .drawer-icon') ||
      button?.querySelector('.drawer-icon, i, svg, [class*="icon"]') ||
      (button?.matches?.('.drawer-icon') ? button : null);
    const label = drawer?.querySelector(':scope > .tle-drawer-label') || null;
    const content = drawer?.querySelector(':scope > .drawer-content') || null;
    return { drawer, icon, label, content };
  }

  function rectContainsPoint(rect, x, y) {
    return Boolean(rect && Number.isFinite(x) && Number.isFinite(y) &&
      x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom);
  }

  function findNavigationControlForEvent(event) {
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const direct = target?.closest?.(NATIVE_TOGGLE_SELECTOR);
    if (direct) return direct;

    // Labels are siblings of the native toggle. Map them to the same control so
    // their programmatic-click path can be compared with a physical icon click.
    const label = target?.closest?.(NAV_LABEL_SELECTOR);
    if (label) return label.parentElement?.querySelector(':scope > .drawer-toggle') || null;

    const x = Number(event.clientX);
    const y = Number(event.clientY);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    const root = HOST_DOC.getElementById('top-settings-holder');
    if (!root) return null;
    for (const drawer of root.children) {
      if (!drawer.matches?.('.drawer')) continue;
      const button = drawer.querySelector(':scope > .drawer-toggle');
      const parts = getNavigationControlParts(button);
      const buttonRect = button?.getBoundingClientRect?.();
      const iconRect = parts.icon?.getBoundingClientRect?.();
      const labelRect = parts.label?.getBoundingClientRect?.();
      if (rectContainsPoint(buttonRect, x, y) ||
          rectContainsPoint(iconRect, x, y) ||
          rectContainsPoint(labelRect, x, y)) return button;
    }
    return null;
  }

  function getNavigationEventDetails(button, event) {
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const { icon, label } = getNavigationControlParts(button);
    const x = Number(event.clientX);
    const y = Number(event.clientY);
    const iconRect = diagnosticSafe(() => icon?.getBoundingClientRect?.(), null);
    const buttonRect = diagnosticSafe(() => button.getBoundingClientRect(), null);
    const labelRect = diagnosticSafe(() => label?.getBoundingClientRect?.(), null);
    const targetInsideIcon = Boolean(target && icon && (target === icon || icon.contains(target)));
    const targetInsideButton = Boolean(target && (target === button || button.contains(target)));
    const targetInsideLabel = Boolean(target && label && (target === label || label.contains(target)));
    let targetArea = 'unclassified';
    if (targetInsideIcon) targetArea = 'icon';
    else if (targetInsideButton) targetArea = 'toggle-wrapper';
    else if (targetInsideLabel) targetArea = 'label';
    else if (rectContainsPoint(iconRect, x, y)) targetArea = 'icon-region-hit-target-outside-icon';
    else if (rectContainsPoint(buttonRect, x, y)) targetArea = 'toggle-region-hit-target-outside-toggle';
    else if (rectContainsPoint(labelRect, x, y)) targetArea = 'label-region-hit-target-outside-label';

    const hitNodes = Number.isFinite(x) && Number.isFinite(y)
      ? diagnosticSafe(() => HOST_DOC.elementsFromPoint(x, y), []).slice(0, 8)
      : [];
    const topNode = Number.isFinite(x) && Number.isFinite(y)
      ? diagnosticSafe(() => HOST_DOC.elementFromPoint(x, y), null)
      : null;
    const containsHit = (node, parent) => Boolean(node && parent && (node === parent || parent.contains(node)));

    return {
      targetArea,
      targetInsideIcon,
      targetInsideButton,
      targetInsideLabel,
      iconRect: iconRect ? { x: Math.round(iconRect.x), y: Math.round(iconRect.y), width: Math.round(iconRect.width), height: Math.round(iconRect.height) } : null,
      labelRect: labelRect ? { x: Math.round(labelRect.x), y: Math.round(labelRect.y), width: Math.round(labelRect.width), height: Math.round(labelRect.height) } : null,
      hitTest: {
        topHit: describeNavigationEventNode(topNode),
        iconReceivesHit: containsHit(topNode, icon),
        buttonReceivesHit: containsHit(topNode, button),
        labelReceivesHit: containsHit(topNode, label),
        iconPresentInHitStack: hitNodes.some(node => containsHit(node, icon)),
        buttonPresentInHitStack: hitNodes.some(node => containsHit(node, button)),
        stack: hitNodes.map(describeNavigationEventNode),
      },
      eventPath: diagnosticSafe(() => event.composedPath?.().slice(0, 8).map(describeNavigationEventNode), []),
    };
  }

  function recordNavigationPointerDown(event) {
    const button = findNavigationControlForEvent(event);
    if (!button) return;
    const target = event.target?.nodeType === 1 ? event.target : event.target?.parentElement;
    const rect = button.getBoundingClientRect();
    navigationInteractionProbe.lastPointerDown = {
      at: new Date().toISOString(),
      pointerType: event.pointerType || null,
      isTrusted: Boolean(event.isTrusted),
      label: getNavigationControlParts(button).label?.textContent?.trim().slice(0, 80) || '',
      point: { x: Number.isFinite(event.clientX) ? Math.round(event.clientX) : null, y: Number.isFinite(event.clientY) ? Math.round(event.clientY) : null },
      target: describeNavigationEventNode(target),
      ...getNavigationEventDetails(button, event),
      controlRect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
    };
  }

  function recordNavigationClickCapture(event) {
    const button = findNavigationControlForEvent(event);
    if (!button) return;
    const rect = button.getBoundingClientRect();
    const parts = getNavigationControlParts(button);
    const record = {
      at: new Date().toISOString(),
      isTrusted: Boolean(event.isTrusted),
      label: parts.label?.textContent?.trim().slice(0, 80) || '',
      point: { x: Number.isFinite(event.clientX) ? Math.round(event.clientX) : null, y: Number.isFinite(event.clientY) ? Math.round(event.clientY) : null },
      target: describeNavigationEventNode(event.target?.nodeType === 1 ? event.target : event.target?.parentElement),
      ...getNavigationEventDetails(button, event),
      controlRect: { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) },
      drawerOpenAtCapture: Boolean(parts.content?.classList.contains('openDrawer')),
      drawerOpenAfterDispatch: null,
      defaultPreventedAtWindowCapture: Boolean(event.defaultPrevented),
      defaultPreventedAtDocumentBubble: null,
      defaultPreventedAfterDispatch: null,
      documentBubbleReached: false,
      windowBubbleReached: false,
    };
    navigationInteractionProbe.lastClickCapture = record;
    navigationInteractionProbe.activeClickEvent = event;
    Promise.resolve().then(() => {
      if (navigationInteractionProbe.lastClickCapture === record) {
        record.defaultPreventedAfterDispatch = Boolean(event.defaultPrevented);
        record.drawerOpenAfterDispatch = Boolean(parts.content?.classList.contains('openDrawer'));
      }
      if (navigationInteractionProbe.activeClickEvent === event) navigationInteractionProbe.activeClickEvent = null;
    });
  }

  function recordNavigationClickDocumentBubble(event) {
    const record = navigationInteractionProbe.lastClickCapture;
    if (!record || navigationInteractionProbe.activeClickEvent !== event) return;
    record.documentBubbleReached = true;
    record.defaultPreventedAtDocumentBubble = Boolean(event.defaultPrevented);
  }

  function recordNavigationClickWindowBubble(event) {
    const record = navigationInteractionProbe.lastClickCapture;
    if (!record || navigationInteractionProbe.activeClickEvent !== event) return;
    record.windowBubbleReached = true;
  }


  function collectDiagnosticReport() {
    const now = new Date();
    const body = HOST_DOC.body;
    const html = HOST_DOC.documentElement;
    const nav = HOST_WIN.navigator || {};
    const ua = String(nav.userAgent || '');
    const context = (() => {
      try { return HOST_WIN.SillyTavern?.getContext?.() || null; } catch { return null; }
    })();
    const ttRuntime = (() => { try { return HOST_WIN.__TAURITAVERN_PANEL_RUNTIME__ || null; } catch { return null; } })();
    const stApi = (() => { try { return HOST_WIN.SillyTavern || null; } catch { return null; } })();

    const safeString = value => (typeof value === 'string' || typeof value === 'number') && String(value).trim()
      ? String(value).trim().slice(0, 120) : null;
    const readVersion = (object, keys) => {
      if (!object) return null;
      for (const key of keys) {
        try {
          const value = safeString(object[key]);
          if (value && /^[0-9a-z][0-9a-z.+_-]{0,60}$/i.test(value)) return { value, source: key };
        } catch {}
      }
      return null;
    };
    const hostVersion = [
      ['TauriTavern runtime', ttRuntime],
      ['SillyTavern API', stApi],
      ['SillyTavern context', context],
    ].map(([label, object]) => {
      const found = readVersion(object, ['version', 'appVersion', 'buildVersion', 'versionString']);
      return found ? { ...found, source: `${label}.${found.source}` } : null;
    }).find(Boolean);
    const helperGlobals = (() => {
      try { return Object.getOwnPropertyNames(HOST_WIN).filter(name => /tavern.*helper|helper.*tavern/i.test(name)).slice(0, 20); }
      catch { return []; }
    })();
    const helperObject = (() => {
      try { return HOST_WIN.TavernHelper || HOST_WIN.tavernHelper || HOST_WIN.TAVERN_HELPER || null; }
      catch { return null; }
    })();
    const helperVersionRaw = readVersion(helperObject, ['version', 'VERSION', 'appVersion', 'buildVersion']);
    const helperVersion = helperVersionRaw ? { ...helperVersionRaw, source: `TavernHelper.${helperVersionRaw.source}` } : null;

    const clientHints = diagnosticClientHints || { status: 'unavailable' };
    const browserFromUA = (() => {
      const tests = [
        ['Microsoft Edge', /EdgA?\/([\d.]+)/],
        ['Opera', /OPR\/([\d.]+)/],
        ['Samsung Internet', /SamsungBrowser\/([\d.]+)/],
        ['Firefox', /(?:Firefox|FxiOS)\/([\d.]+)/],
        ['Chrome', /(?:Chrome|CriOS)\/([\d.]+)/],
        ['Safari', /Version\/([\d.]+).*Safari/],
      ];
      for (const [name, regex] of tests) { const match = ua.match(regex); if (match) return { name, version: match[1], source: 'userAgent' }; }
      return { name: 'Unknown', version: null, source: 'unparsed userAgent' };
    })();
    const browser = (() => {
      const full = clientHints.fullVersionList?.find(item => item.brand && item.version);
      const brand = clientHints.brands?.find(item => item.brand && item.version && !/chromium/i.test(item.brand));
      const preferred = full || brand;
      if (preferred) return { name: preferred.brand, version: preferred.version, source: 'User-Agent Client Hints' };
      return browserFromUA;
    })();
    const osFromUA = (() => {
      let m;
      if ((m = ua.match(/Android\s+([\d.]+)/i))) return { name: 'Android', version: m[1], source: 'userAgent', confidence: 'medium' };
      if ((m = ua.match(/(?:iPhone|iPad|iPod).*?OS\s([\d_]+)/i)) || (m = ua.match(/CPU(?: iPhone)? OS\s([\d_]+)/i))) return { name: 'iOS/iPadOS', version: m[1].replace(/_/g, '.'), source: 'userAgent', confidence: 'medium' };
      if ((m = ua.match(/Windows NT\s([\d.]+)/i))) {
        const map = { '10.0': '10/11 family', '6.3': '8.1', '6.2': '8', '6.1': '7' };
        return { name: 'Windows', version: map[m[1]] || m[1], source: 'userAgent', confidence: 'medium' };
      }
      if (/Macintosh/i.test(ua) && Number(nav.maxTouchPoints || 0) > 1) return { name: 'iPadOS/macOS touch-capable UA (ambiguous)', version: null, source: 'userAgent + maxTouchPoints', confidence: 'low' };
      if ((m = ua.match(/Mac OS X\s([\d_]+)/i))) return { name: 'macOS', version: m[1].replace(/_/g, '.'), source: 'userAgent', confidence: 'medium' };
      if (/CrOS/i.test(ua)) return { name: 'ChromeOS', version: null, source: 'userAgent', confidence: 'low' };
      if (/Linux/i.test(ua)) return { name: 'Linux', version: null, source: 'userAgent', confidence: 'low' };
      return { name: 'Unknown', version: null, source: 'unavailable', confidence: 'none' };
    })();
    const os = clientHints.platform
      ? { name: clientHints.platform, version: clientHints.platformVersion || osFromUA.version, source: clientHints.platformVersion ? 'User-Agent Client Hints' : osFromUA.source, confidence: clientHints.platformVersion ? 'high' : osFromUA.confidence }
      : osFromUA;
    const touchPoints = Number(nav.maxTouchPoints || 0);
    const deviceClass = clientHints.mobile === true || /Android|iPhone|iPod|Mobile/i.test(ua)
      ? (/iPad|Tablet/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua)) ? 'tablet' : 'mobile')
      : (clientHints.mobile === false ? 'desktop' : (touchPoints > 0 && /MacIntel/i.test(String(nav.platform || '')) ? 'touch-capable desktop/tablet-class' : 'desktop/unknown'));
    const browserEngine = (() => {
      if (/Firefox|FxiOS/i.test(ua)) return { name: 'Gecko', version: (ua.match(/rv:([\d.]+)/i) || [])[1] || null };
      if (/AppleWebKit\/([\d.]+)/i.test(ua)) {
        const webkit = (ua.match(/AppleWebKit\/([\d.]+)/i) || [])[1] || null;
        return { name: /Chrome|CriOS|Edg|OPR/i.test(ua) ? 'Blink' : 'WebKit', version: webkit };
      }
      return { name: 'Unknown', version: null };
    })();

    const rectOf = el => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) };
    };
    const measureSafeArea = () => {
      try {
        const probe = HOST_DOC.createElement('div');
        probe.setAttribute('aria-hidden', 'true');
        probe.style.cssText = 'position:fixed;left:-10000px;top:0;width:0;height:0;visibility:hidden;pointer-events:none;contain:strict;padding-top:env(safe-area-inset-top, 0px);padding-right:env(safe-area-inset-right, 0px);padding-bottom:env(safe-area-inset-bottom, 0px);padding-left:env(safe-area-inset-left, 0px);';
        body.appendChild(probe);
        try {
          const cs = HOST_WIN.getComputedStyle(probe);
          return { top: cs.paddingTop, right: cs.paddingRight, bottom: cs.paddingBottom, left: cs.paddingLeft };
        } finally { probe.remove(); }
      } catch { return { status: 'unavailable' }; }
    };
    const safeArea = measureSafeArea();
    const vv = HOST_WIN.visualViewport;
    const active = HOST_DOC.activeElement;
    const activeTag = active?.tagName || '';
    const activeType = active?.getAttribute?.('type') || '';
    const activeIsTextEntry = Boolean(active && (
      activeTag === 'TEXTAREA' || (activeTag === 'INPUT' && !/^(button|submit|reset|checkbox|radio|range|color|file|hidden)$/i.test(activeType)) || active.isContentEditable
    ));
    const keyboardDelta = vv ? Math.max(0, Math.round(HOST_WIN.innerHeight - vv.height - Math.max(0, vv.offsetTop))) : null;
    const keyboardLikelyOpen = Boolean(activeIsTextEntry && keyboardDelta !== null && keyboardDelta > 100);
    const screenOrientation = (() => {
      try { return { type: HOST_WIN.screen?.orientation?.type || null, angle: HOST_WIN.screen?.orientation?.angle ?? null }; }
      catch { return { type: null, angle: null }; }
    })();
    const viewport = {
      window: { innerWidth: HOST_WIN.innerWidth, innerHeight: HOST_WIN.innerHeight, outerWidth: HOST_WIN.outerWidth, outerHeight: HOST_WIN.outerHeight, devicePixelRatio: HOST_WIN.devicePixelRatio || 1 },
      document: { clientWidth: html.clientWidth, clientHeight: html.clientHeight, scrollWidth: html.scrollWidth, scrollHeight: html.scrollHeight, scrollX: HOST_WIN.scrollX || 0, scrollY: HOST_WIN.scrollY || 0 },
      screen: { width: HOST_WIN.screen?.width ?? null, height: HOST_WIN.screen?.height ?? null, availWidth: HOST_WIN.screen?.availWidth ?? null, availHeight: HOST_WIN.screen?.availHeight ?? null, colorDepth: HOST_WIN.screen?.colorDepth ?? null, pixelDepth: HOST_WIN.screen?.pixelDepth ?? null },
      visualViewport: vv ? { width: vv.width, height: vv.height, offsetTop: vv.offsetTop, offsetLeft: vv.offsetLeft, pageTop: vv.pageTop, pageLeft: vv.pageLeft, scale: vv.scale } : null,
      orientation: screenOrientation,
      pointer: { coarse: diagnosticSafe(() => HOST_WIN.matchMedia('(pointer: coarse)').matches, null), fine: diagnosticSafe(() => HOST_WIN.matchMedia('(pointer: fine)').matches, null), hover: diagnosticSafe(() => HOST_WIN.matchMedia('(hover: hover)').matches, null), reducedMotion: diagnosticSafe(() => HOST_WIN.matchMedia('(prefers-reduced-motion: reduce)').matches, null) },
      focusedElement: active ? { tag: active.tagName, id: active.id || '', className: typeof active.className === 'string' ? active.className.slice(0, 120) : '', type: activeType || '', contentEditable: Boolean(active.isContentEditable), rect: rectOf(active) } : null,
      portraitMedia: diagnosticSafe(() => HOST_WIN.matchMedia('(orientation: portrait)').matches, null),
      fullscreen: Boolean(HOST_DOC.fullscreenElement),
      safeAreaInsets: safeArea,
      keyboard: { focusedElementIsTextEntry: activeIsTextEntry, likelyOpen: keyboardLikelyOpen, estimatedViewportDeltaPx: keyboardDelta, estimateMethod: 'innerHeight - visualViewport.height - visualViewport.offsetTop; heuristic only, not a directly measured keyboard height' },
    };

    const selectors = [
      'body', '#chat', '#sheld', '#form_sheld', '#send_form', '#send_textarea', '#send_but',
      '#top-bar', '#top-settings-holder', '#left-nav-panel', '.fillRight', '#right-nav-panel', '.drawer-content',
      '#tle-control-panel', '#tle-nav-entry', '#tle-mobile-hamburger', '#tle-chat-shortcut', '#tle-chat-tools-toggle',
      '#tle-chat-tools-panel', '#tle-scroll-bottom', '#tle-diagnostic-float', '#tle-global-search-panel',
      '#WorldInfo', '#completion_prompt_manager_popup', '#character_popup', '#user-settings-block',
      '#rm_api_block', '#advanced_formatting', '#AdvancedFormatting', '#reasoning_select', '#themes',
    ];
    const styleFields = [
      'display', 'visibility', 'opacity', 'position', 'zIndex', 'isolation', 'overflow', 'overflowX', 'overflowY',
      'pointerEvents', 'boxSizing', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
      'margin', 'padding', 'flex', 'flexDirection', 'flexWrap', 'alignItems', 'alignContent', 'justifyContent',
      'gap', 'rowGap', 'columnGap', 'gridTemplateColumns', 'gridTemplateRows', 'transform', 'translate',
      'filter', 'backdropFilter', 'perspective', 'contain', 'willChange',
    ];
    const describeElement = (el, selector) => {
      try {
        const style = HOST_WIN.getComputedStyle(el);
        const rect = rectOf(el);
        const computed = {};
        for (const field of styleFields) computed[field] = style[field] || '';
        return { selector, tag: el.tagName, id: el.id || '', className: typeof el.className === 'string' ? el.className.slice(0, 220) : '', connected: el.isConnected, visible: Boolean(el.getClientRects().length && rect?.width > 0 && rect?.height > 0), rect, computed, scroll: { scrollTop: el.scrollTop, scrollLeft: el.scrollLeft, scrollWidth: el.scrollWidth, scrollHeight: el.scrollHeight, clientWidth: el.clientWidth, clientHeight: el.clientHeight } };
      } catch (error) { return { selector, error: sanitizeDiagnosticText(error?.message || error, 160) }; }
    };
    const keyElements = [];
    for (const selector of selectors) {
      try {
        const nodes = [...HOST_DOC.querySelectorAll(selector)].slice(0, selector === '.drawer-content' ? 30 : 12);
        for (const node of nodes) keyElements.push(describeElement(node, selector));
      } catch {}
    }

    const ancestorChains = [];
    for (const selector of ['#sheld', '#chat', '#form_sheld', '#send_form', '#send_textarea', '#top-settings-holder', '#left-nav-panel', '.fillRight']) {
      try {
        const target = HOST_DOC.querySelector(selector);
        if (!target) { ancestorChains.push({ selector, found: false }); continue; }
        const chain = [];
        for (let node = target; node && node !== HOST_DOC && chain.length < 12; node = node.parentElement) {
          const style = HOST_WIN.getComputedStyle(node);
          const rect = rectOf(node);
          const createsStackingContext = style.position !== 'static' && style.zIndex !== 'auto'
            || Number(style.opacity) < 1 || style.transform !== 'none' || style.filter !== 'none'
            || (style.backdropFilter && style.backdropFilter !== 'none') || style.isolation === 'isolate'
            || style.perspective !== 'none' || /paint|layout|strict|content/.test(style.contain);
          chain.push({ tag: node.tagName, id: node.id || '', className: typeof node.className === 'string' ? node.className.slice(0, 180) : '', position: style.position, zIndex: style.zIndex, display: style.display, overflow: `${style.overflow}/${style.overflowX}/${style.overflowY}`, transform: style.transform, filter: style.filter, backdropFilter: style.backdropFilter || style.webkitBackdropFilter || 'none', opacity: style.opacity, isolation: style.isolation, contain: style.contain, createsStackingContext: Boolean(createsStackingContext), rect });
        }
        ancestorChains.push({ selector, found: true, chain });
      } catch (error) { ancestorChains.push({ selector, error: sanitizeDiagnosticText(error?.message || error, 160) }); }
    }

    const occlusion = [];
    if (typeof HOST_DOC.elementsFromPoint === 'function') {
      for (const selector of ['#send_form', '#form_sheld', '#chat', '#top-settings-holder', '#tle-control-panel']) {
        const el = HOST_DOC.querySelector(selector);
        const rect = rectOf(el);
        if (!el || !rect || rect.width <= 0 || rect.height <= 0) { occlusion.push({ selector, found: Boolean(el), status: 'not-visible' }); continue; }
        const x = Math.max(0, Math.min(HOST_WIN.innerWidth - 1, Math.round(rect.left + rect.width / 2)));
        const y = Math.max(0, Math.min(HOST_WIN.innerHeight - 1, Math.round(rect.top + rect.height / 2)));
        const stack = HOST_DOC.elementsFromPoint(x, y).slice(0, 6).map(node => {
          const style = HOST_WIN.getComputedStyle(node);
          return { tag: node.tagName, id: node.id || '', className: typeof node.className === 'string' ? node.className.slice(0, 140) : '', position: style.position, zIndex: style.zIndex, pointerEvents: style.pointerEvents };
        });
        occlusion.push({ selector, sample: { x, y }, stack, targetInStack: stack.some(item => item.id === el.id || (el.id === '' && item.tag === el.tagName)) });
      }
    } else occlusion.push({ status: 'elementsFromPoint-unavailable' });

    const visualCandidates = [];
    let visualNodesScanned = 0;
    try {
      const all = HOST_DOC.querySelectorAll('body *');
      for (const el of all) {
        visualNodesScanned++;
        if (visualNodesScanned > 3500 || visualCandidates.length >= 180) break;
        let style;
        try { style = HOST_WIN.getComputedStyle(el); } catch { continue; }
        const opacity = Number.parseFloat(style.opacity);
        const backdrop = style.backdropFilter || style.webkitBackdropFilter || 'none';
        const hasEffect = style.filter !== 'none' || (backdrop && backdrop !== 'none')
          || (Number.isFinite(opacity) && opacity < 0.99) || style.transform !== 'none'
          || style.perspective !== 'none' || /paint|layout|strict|content/.test(style.contain)
          || style.isolation === 'isolate' || (style.position !== 'static' && style.zIndex !== 'auto');
        if (!hasEffect) continue;
        const rect = rectOf(el);
        if (!rect || (!rect.width && !rect.height && style.display === 'none')) continue;
        visualCandidates.push({ tag: el.tagName, id: el.id || '', className: typeof el.className === 'string' ? el.className.slice(0, 180) : '', display: style.display, visibility: style.visibility, opacity: style.opacity, filter: style.filter, backdropFilter: backdrop, transform: style.transform, perspective: style.perspective, contain: style.contain, isolation: style.isolation, position: style.position, zIndex: style.zIndex, overflow: `${style.overflow}/${style.overflowX}/${style.overflowY}`, willChange: style.willChange, rect });
      }
    } catch {}

    const drawers = [...HOST_DOC.querySelectorAll('.drawer-content')].slice(0, 80).map(el => ({ id: el.id || '', className: typeof el.className === 'string' ? el.className.slice(0, 160) : '', open: el.classList.contains('openDrawer'), display: HOST_WIN.getComputedStyle(el).display, visibility: HOST_WIN.getComputedStyle(el).visibility, zIndex: HOST_WIN.getComputedStyle(el).zIndex, rect: rectOf(el) }));

    const navigationControlDiagnostics = (() => {
      const root = HOST_DOC.getElementById('top-settings-holder');
      if (!root) return { status: 'missing-top-settings-holder', mode: navigationMode, controls: [] };

      const describeNode = node => {
        if (!node) return null;
        const style = diagnosticSafe(() => HOST_WIN.getComputedStyle(node), null);
        const rect = diagnosticSafe(() => rectOf(node), null);
        return {
          tag: node.tagName || null,
          id: node.id || '',
          className: typeof node.className === 'string' ? node.className.slice(0, 160) : String(node.getAttribute?.('class') || '').slice(0, 160),
          role: node.getAttribute?.('role') || null,
          tabIndex: Number.isFinite(node.tabIndex) ? node.tabIndex : null,
          disabled: Boolean(node.disabled),
          ariaDisabled: node.getAttribute?.('aria-disabled') || null,
          display: style?.display || null,
          visibility: style?.visibility || null,
          opacity: style?.opacity || null,
          pointerEvents: style?.pointerEvents || null,
          cursor: style?.cursor || null,
          position: style?.position || null,
          zIndex: style?.zIndex || null,
          transform: style?.transform || null,
          filter: style?.filter || null,
          overflow: style ? [style.overflow, style.overflowX, style.overflowY].join('/') : null,
          rect,
        };
      };

      const drawers = [...root.children].filter(node => node.matches?.('.drawer'));
      const controls = drawers.map((drawer, index) => {
        const button = drawer.querySelector(':scope > .drawer-toggle');
        if (!button) return { index, status: 'missing-direct-drawer-toggle' };
        const label = drawer.querySelector(':scope > .tle-drawer-label')?.textContent?.trim().slice(0, 80) || '';
        const buttonRect = rectOf(button);
        const parts = getNavigationControlParts(button);
        const icon = parts.icon;
        const labelElement = parts.label;
        const iconRect = rectOf(icon);
        const labelRect = rectOf(labelElement);
        const points = [];
        if (buttonRect && buttonRect.width > 0 && buttonRect.height > 0) {
          points.push({
            name: 'button-center',
            x: Math.round(buttonRect.left + buttonRect.width / 2),
            y: Math.round(buttonRect.top + buttonRect.height / 2),
          });
        }
        if (iconRect && iconRect.width > 0 && iconRect.height > 0) {
          points.push({
            name: 'icon-center',
            x: Math.round(iconRect.left + iconRect.width / 2),
            y: Math.round(iconRect.top + iconRect.height / 2),
          });
        }
        if (labelRect && labelRect.width > 0 && labelRect.height > 0) {
          points.push({
            name: 'label-center',
            x: Math.round(labelRect.left + labelRect.width / 2),
            y: Math.round(labelRect.top + labelRect.height / 2),
          });
        }
        const hitTests = points.map(point => {
          const hitNodes = diagnosticSafe(() => HOST_DOC.elementsFromPoint(point.x, point.y), []).slice(0, 6);
          const stack = hitNodes.map(describeNode);
          const top = stack[0] || null;
          const topNode = diagnosticSafe(() => HOST_DOC.elementFromPoint(point.x, point.y), null);
          return {
            name: point.name,
            point: { x: point.x, y: point.y },
            topHit: top,
            buttonReceivesHit: Boolean(topNode && (topNode === button || button.contains(topNode))),
            buttonPresentInHitStack: hitNodes.some(node => node === button || button.contains(node)),
            iconReceivesHit: Boolean(topNode && icon && (topNode === icon || icon.contains(topNode))),
            iconPresentInHitStack: hitNodes.some(node => node === icon || icon?.contains(node)),
            labelReceivesHit: Boolean(topNode && labelElement && (topNode === labelElement || labelElement.contains(topNode))),
            labelPresentInHitStack: hitNodes.some(node => node === labelElement || labelElement?.contains(node)),
            stack,
          };
        });
        const ancestors = [];
        for (let node = button, depth = 0; node && node !== HOST_DOC && depth < 9; node = node.parentElement, depth++) {
          ancestors.push(describeNode(node));
        }
        const readPseudoElements = element => ['::before', '::after'].map(pseudo => {
          const style = diagnosticSafe(() => HOST_WIN.getComputedStyle(element, pseudo), null);
          return style ? {
            pseudo,
            content: style.content,
            display: style.display,
            visibility: style.visibility,
            opacity: style.opacity,
            pointerEvents: style.pointerEvents,
            position: style.position,
            zIndex: style.zIndex,
          } : { pseudo, status: 'unavailable' };
        });
        const pseudoElements = readPseudoElements(button);
        const iconPseudoElements = icon ? readPseudoElements(icon) : [];
        const buttonStyle = diagnosticSafe(() => HOST_WIN.getComputedStyle(button), null);
        const iconStyle = diagnosticSafe(() => icon && HOST_WIN.getComputedStyle(icon), null);
        return {
          index,
          label,
          drawerOpen: Boolean(drawer.querySelector(':scope > .drawer-content')?.classList.contains('openDrawer')),
          element: describeNode(button),
          icon: describeNode(icon),
          marginInline: buttonStyle ? { start: buttonStyle.marginInlineStart, end: buttonStyle.marginInlineEnd } : null,
          pseudoElements,
          iconPseudoElements,
          ancestors,
          hitTests,
          clickability: {
            iconPointerEvents: iconStyle?.pointerEvents || null,
            iconVisible: Boolean(iconStyle && iconStyle.display !== 'none' && iconStyle.visibility !== 'hidden' && Number(iconStyle.opacity) !== 0),
            iconCenterReceivesHit: hitTests.find(item => item.name === 'icon-center')?.iconReceivesHit ?? null,
            iconCenterButtonReceivesHit: hitTests.find(item => item.name === 'icon-center')?.buttonReceivesHit ?? null,
            labelCenterReceivesHit: hitTests.find(item => item.name === 'label-center')?.labelReceivesHit ?? null,
          },
          likelyCssBlockers: {
            selfPointerEventsNone: buttonStyle?.pointerEvents === 'none',
            selfHidden: Boolean(buttonStyle && (buttonStyle.display === 'none' || buttonStyle.visibility === 'hidden' || Number(buttonStyle.opacity) === 0)),
            iconPointerEventsNone: iconStyle?.pointerEvents === 'none',
            iconHidden: Boolean(iconStyle && (iconStyle.display === 'none' || iconStyle.visibility === 'hidden' || Number(iconStyle.opacity) === 0)),
            ancestorPointerEventsNone: ancestors.slice(1).some(item => item.pointerEvents === 'none'),
            ancestorHidden: ancestors.slice(1).some(item => item.display === 'none' || item.visibility === 'hidden' || Number(item.opacity) === 0),
            iconHitTestBlocked: hitTests.some(item => item.name === 'icon-center' && !item.buttonReceivesHit),
            hitTestBlocked: hitTests.some(item => !item.buttonReceivesHit),
          },
        };
      });

      return {
        status: 'captured',
        mode: navigationMode,
        compatibilityRepairEnabled: compatibilityNavigationRepair,
        expectedMarginInline: 'not-forced',
        count: controls.length,
        controls,
      };
    })();

    const reasoningControls = [...HOST_DOC.querySelectorAll('#reasoning_select, #openai_reasoning_effort')].slice(0, 12).map(el => ({ id: el.id || '', tag: el.tagName, type: el.getAttribute('type') || '', className: typeof el.className === 'string' ? el.className.slice(0, 160) : '', disabled: Boolean(el.disabled), selectedIndex: el.tagName === 'SELECT' ? el.selectedIndex : null, selectedLabel: el.tagName === 'SELECT' ? (el.selectedOptions?.[0]?.textContent?.trim().slice(0, 100) || '') : null, optionCount: el.tagName === 'SELECT' ? el.options.length : null, visible: Boolean(el.getClientRects().length && rectOf(el)?.width > 0 && HOST_WIN.getComputedStyle(el).display !== 'none' && HOST_WIN.getComputedStyle(el).visibility !== 'hidden'), rect: rectOf(el) }));
    const infoStation = HOST_DOC.querySelector('#top-settings-holder > .tle-sidebar-info');
    const reasoningRow = infoStation?.querySelector('[data-info-item="reasoning"]');
    const reasoningRowValue = reasoningRow?.querySelector('.tle-info-value')?.textContent?.trim().slice(0, 100) || '';
    const infoStationDiagnostic = {
      enabled: infoEnabled,
      navigationMode,
      stationExists: Boolean(infoStation),
      stationHidden: infoStation ? infoStation.hidden : null,
      listExists: Boolean(infoStation?.querySelector('[data-tle-info-list]')),
      visibleModules: Object.fromEntries(Object.entries(infoSettings || {}).map(([key, value]) => [key, { visible: value.visible === true, jump: value.jump === true, quick: value.quick === true }])),
      reasoningRowExists: Boolean(reasoningRow),
      reasoningRowVisible: Boolean(reasoningRow && reasoningRow.getClientRects().length && rectOf(reasoningRow)?.width > 0),
      reasoningRowValue,
      reasoningControls,
      reasoningResolverResult: diagnosticSafe(() => selectedText('#reasoning_select'), null),
    };

    const quickGroupSummary = diagnosticSafe(() => {
      const raw = JSON.parse(HOST_WIN.localStorage.getItem(QUICK_GROUP_KEY) || 'null');
      if (!raw || raw.schema !== 2 || !raw.groupsByModule) return { status: raw ? 'unrecognized-schema' : 'not-configured', groupCounts: {}, assignmentCounts: {} };
      const groupCounts = {};
      const assignmentCounts = {};
      for (const item of QUICK_MODULES) {
        groupCounts[item.id] = Array.isArray(raw.groupsByModule[item.id]) ? raw.groupsByModule[item.id].length : 0;
        assignmentCounts[item.id] = raw.assignments?.[item.id] && typeof raw.assignments[item.id] === 'object' ? Object.keys(raw.assignments[item.id]).length : 0;
      }
      return { status: 'schema-v2', groupCounts, assignmentCounts, legacyV1Present: HOST_WIN.localStorage.getItem(QUICK_GROUP_LEGACY_KEY) !== null };
    }, { status: 'unavailable', groupCounts: {}, assignmentCounts: {} });
    const hostName = ttRuntime ? 'TauriTavern' : (typeof stApi?.getContext === 'function' ? 'SillyTavern' : 'Unknown');
    const slashContextAvailable = Boolean(context && typeof context === 'object');
    const slashExecutorAvailable = typeof context?.executeSlashCommandsWithOptions === 'function';
    const slashCommandDiagnostics = {
      hostContextAvailable: slashContextAvailable,
      contextExecutorAvailable: slashExecutorAvailable,
      fallbackDynamicImportConfigured: true,
      fallbackFunctionConstructorAvailable: typeof HOST_WIN.Function === 'function',
      commandsUsedByTLE: CHAT_ACTIONS.map(item => `/${item.id === 'jump' ? 'chat-jump' : item.id}`),
      registryInspection: '当前源码未确认可安全读取的公开只读命令注册表；未执行任何命令，避免修改聊天或楼层状态。',
      executionProbe: 'not-run (non-destructive diagnostics only)',
      status: slashExecutorAvailable ? 'executor-api-present' : (typeof HOST_WIN.Function === 'function' ? 'context-executor-absent; dynamic-import fallback configured but not probed' : 'executor-api-unavailable'),
    };

    const requiredNodes = ['#chat', '#sheld', '#form_sheld', '#send_form', '#send_textarea', '#top-bar', '#top-settings-holder', '#left-nav-panel', '.fillRight', '#themes', '#reasoning_select'];
    const requiredNodeStatus = Object.fromEntries(requiredNodes.map(selector => [selector, Boolean(diagnosticSafe(() => HOST_DOC.querySelector(selector), null))]));
    const themeControl = HOST_DOC.querySelector('#themes');
    const currentTheme = themeControl?.selectedOptions?.[0]?.textContent?.trim().slice(0, 120) || null;
    const activeTheme = diagnosticSafe(() => {
      const candidates = [
        ['power_user.theme', HOST_WIN.power_user?.theme],
        ['powerUserSettings.theme', HOST_WIN.powerUserSettings?.theme],
        ['SillyTavern context.powerUserSettings.theme', context?.powerUserSettings?.theme],
        ['powerUserModule.power_user.theme', powerUserModule?.power_user?.theme],
      ];
      const found = candidates.find(([, value]) => typeof value === 'string' && value.trim());
      return found ? { name: found[1].trim().slice(0, 120), source: found[0], status: 'detected' } : { name: null, source: null, status: 'not-exposed-without-import' };
    }, { name: null, source: null, status: 'unavailable' });

    const engine = {
      version: api.version,
      instanceKey: '__TAVERN_LAYOUT_ENGINE_V02__',
      lifecycle: { registeredOnHost: HOST_WIN['__TAVERN_LAYOUT_ENGINE_V02__'] === api, hostWindowReferenceValid: api.hostWindow === HOST_WIN, hostDocumentReferenceValid: api.hostDocument === HOST_DOC, destroyMethodAvailable: typeof api.destroy === 'function', destroyed: state.destroyed, active: state.active },
      remoteLoaderTestVersion: diagnosticSafe(() => HOST_WIN.__TLE_REMOTE_LOADER_TEST_V1__?.version || null, null),
      active: state.active,
      destroyed: state.destroyed,
      navigation: {
        mode: navigationMode,
        docked: state.mobileNav.docked,
        mobileNavOpen: state.mobileNav.open,
        pcHamburgerEnabled,
        desktopNavLabels: getDesktopNavLabelsEnabled(),
        globalSearchEnabled,
        globalSearchOpen: state.globalSearchOpen,
        searchPanelPresent: Boolean(state.globalSearchPanel?.isConnected),
        navEntryPresent: Boolean(state.navEntry?.isConnected),
        searchObserverPresent: Boolean(search.observer),
        searchControlCount: search.controls?.size || 0,
        searchResultCount: search.matches?.length || 0,
        nativeControls: navigationControlDiagnostics,
        interactionProbe: {
          lastPointerDown: navigationInteractionProbe.lastPointerDown,
          lastClick: navigationInteractionProbe.lastClickCapture,
        },
      },
      workspace: { presetApplied: state.preset.applied, presetRootPresent: Boolean(state.preset.root?.isConnected), characterApplied: state.character.applied, characterRootPresent: Boolean(state.character.root?.isConnected) },
      informationStation: infoStationDiagnostic,
      quickSwitch: { moduleIds: QUICK_MODULES.map(item => item.id), groups: quickGroupSummary, groupManagerOpen: Boolean(quickPanel?.embedded && state.globalSearchOpen && state.globalSearchView === 'resources'), pickerOpen: Boolean(HOST_DOC.querySelector('#tle-quick-picker')) },
      optionalFolds: { enabled: foldConfig.enabled, options: { ...foldConfig.options }, activeFoldCount: foldRecords.size, observerPresent: Boolean(state.presetFoldObserver) },
      chatTools: { enabled: chatToolsEnabled, quickActionsEnabled: chatQuickActionsEnabled, open: state.chatTools.open, buttonPresent: Boolean(state.chatTools.button?.isConnected), panelPresent: Boolean(state.chatTools.panel?.isConnected), recentLoading: state.chatTools.recent.loading, recentItemCount: state.chatTools.recent.items?.length || 0, currentChatFilter: state.chatTools.recent.onlyCurrent, actions: CHAT_ACTIONS.map(item => item.id) },
      chatShortcut: { present: Boolean(state.chatShortcut?.isConnected), destination: chatShortcutDestination },
      chatFade: {
        enabled: chatFadeEnabled,
        active: state.chatFade.active,
        bottomPaddingEnabled: chatFadeBottomPaddingEnabled,
        pseudo: state.chatFade.pseudo,
        renderMode: state.chatFade.renderMode,
        wallpaperObserverPresent: Boolean(state.chatFade.wallpaperObserver),
        parentObserverPresent: Boolean(state.chatFade.wallpaperParentObserver),
        resizeObserverPresent: Boolean(state.chatFade.resizeObserver),
        legacyMirrorNodePresent: Boolean(HOST_DOC.getElementById('tle-chat-fade-wallpaper-anchor')?.isConnected),
      },
      chatSurface: (() => {
        const api = HOST_WIN.__TAURITAVERN__?.api?.chatSurface || null;
        const root = HOST_DOC.getElementById('chat');
        const children = root ? [...root.children].slice(0, 30).map(child => ({
          tag: child.tagName.toLowerCase(),
          id: child.id || '',
          className: typeof child.className === 'string' ? child.className.slice(0, 120) : '',
          isMessageRoot: child.matches('.mes'),
        })) : [];
        return {
          apiPresent: Boolean(api),
          protocolVersion: api?.protocolVersion ?? null,
          managedOwnershipRequired: diagnosticSafe(() => api?.isManagedOwnershipRequired?.() === true, null),
          scrollChatSurfaceToAvailable: typeof context?.scrollChatSurfaceTo === 'function',
          directChildCount: root?.children.length ?? 0,
          directChildren: children,
        };
      })(),
      scrollBottom: { enabled: scrollBottomEnabled, buttonPresent: Boolean(state.scrollBottom.button?.isConnected), generating: state.scrollBottom.generating, eventSourcePresent: Boolean(state.scrollBottom.eventSource), listenerCount: state.scrollBottom.eventListeners?.length || 0 },
      compatibility: { layerRepairEnabled: compatibilityLayerRepair, navigationRepairEnabled: compatibilityNavigationRepair, navIconOpacity, structureRepairEnabled: compatibilityStructureRepair, panelBackgroundRepairEnabled: compatibilityPanelBackground, panelBackgroundMode: compatibilityPanelBackgroundMode, panelBackgroundColor: compatibilityPanelBackgroundColor },
      diagnostics: (() => {
        const button = state.diagnosticButton;
        const rect = rectOf(button);
        const center = rect && rect.width > 0 && rect.height > 0
          ? { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) }
          : null;
        const hit = center && typeof HOST_DOC.elementFromPoint === 'function'
          ? diagnosticSafe(() => HOST_DOC.elementFromPoint(center.x, center.y), null)
          : null;
        const style = button ? diagnosticSafe(() => HOST_WIN.getComputedStyle(button), null) : null;
        const debuggerPanel = HOST_DOC.getElementById(DEBUGGER_ID);
        return {
          enabled: diagnosticMode,
          floatingButtonPresent: Boolean(button?.isConnected),
          errorListenerActive: Boolean(state.diagnosticAbort),
          recentErrorCount: diagnosticErrors.length,
          externalSurfaceFlag: body.hasAttribute('data-tle-external-surface'),
          floatingButton: {
            parent: button?.parentElement ? { tag: button.parentElement.tagName, id: button.parentElement.id || '' } : null,
            positioningMode: button?.dataset.tlePositioning || 'not-mounted',
            popoverSupported: Boolean(button && typeof button.showPopover === 'function'),
            popoverOpen: Boolean(button?.matches?.(':popover-open')),
            popoverAttribute: button?.getAttribute('popover') || null,
            positioningError: button?.dataset.tlePositioningError || null,
            disabled: Boolean(button?.disabled),
            hidden: Boolean(button?.hidden),
            position: style?.position || null,
            top: style?.top || null,
            right: style?.right || null,
            display: style?.display || null,
            visibility: style?.visibility || null,
            opacity: style?.opacity || null,
            pointerEvents: style?.pointerEvents || null,
            zIndex: style?.zIndex || null,
            rect,
            hitTest: center ? {
              point: center,
              target: hit ? { tag: hit.tagName, id: hit.id || '', className: typeof hit.className === 'string' ? hit.className.slice(0, 120) : '' } : null,
              buttonReceivesHit: Boolean(hit && (hit === button || button?.contains(hit))),
            } : null,
          },
          debuggerPanel: {
            present: Boolean(debuggerPanel?.isConnected),
            tag: debuggerPanel?.tagName || null,
            nativeDialog: Boolean(debuggerPanel && typeof debuggerPanel.showModal === 'function'),
            open: Boolean(debuggerPanel?.open),
            topLayerMode: debuggerPanel?.dataset.tleTopLayer || null,
            mount: debuggerPanel?.dataset.tleMount || null,
          },
        };
      })(),
      observers: { mainLayout: Boolean(state.observer), theme: Boolean(state.themeObserver), panel: Boolean(state.panelObserver), diagnosticButton: Boolean(state.diagnosticButtonObserver), presetFolds: Boolean(state.presetFoldObserver), advancedFormattingInit: Boolean(state.advancedFormattingInitObserver), reasoningFormat: Boolean(state.reasoningFormatObserver), globalSearch: Boolean(search.observer), characterWorkspace: Boolean(state.character.detailObserver), chatShortcut: Boolean(state.chatShortcutObserver), chatTools: Boolean(state.chatTools.observer), chatFadeWallpaper: Boolean(state.chatFade.wallpaperObserver), chatFadeParent: Boolean(state.chatFade.wallpaperParentObserver), chatFadeResize: Boolean(state.chatFade.resizeObserver) },
      requiredNodes: requiredNodeStatus,
      missingRequiredNodes: Object.entries(requiredNodeStatus).filter(([, exists]) => !exists).map(([selector]) => selector),
    };

    const hostVersionResult = hostVersion ? { ...hostVersion, status: 'detected' } : { value: null, source: null, status: 'not-exposed-by-detected-runtime' };
    const helperVersionResult = helperVersion ? { ...helperVersion, status: 'detected' } : { value: null, source: null, status: helperGlobals.length ? 'helper-global-found-version-not-exposed' : 'not-exposed' };
    let storageReadable = false;
    try { HOST_WIN.localStorage.getItem(DIAGNOSTIC_MODE_KEY); storageReadable = true; } catch {}
    const performanceInfo = (() => {
      const result = { longTaskApiAvailable: false, longTaskCount: null, longTaskDurationMs: null, memory: null };
      try {
        if (typeof HOST_WIN.performance?.getEntriesByType === 'function') {
          const entries = HOST_WIN.performance.getEntriesByType('longtask');
          result.longTaskApiAvailable = true;
          result.longTaskCount = entries.length;
          result.longTaskDurationMs = Math.round(entries.reduce((sum, entry) => sum + (Number(entry.duration) || 0), 0));
        }
      } catch {}
      try {
        const memory = HOST_WIN.performance?.memory;
        if (memory) result.memory = { usedJSHeapSize: memory.usedJSHeapSize, totalJSHeapSize: memory.totalJSHeapSize, jsHeapSizeLimit: memory.jsHeapSizeLimit };
      } catch {}
      return result;
    })();

    return {
      reportType: 'Tavern Layout Engine Host Diagnostics',
      reportVersion: 2,
      generatedAt: now.toISOString(),
      captureMode: 'one-click floating-button snapshot; pre-click state preferred',
      privacy: {
        collected: ['设备与浏览器识别信息（UA/可用 Client Hints）', '宿主类型与实际暴露的版本字段', '屏幕、视口、安全区、焦点与键盘高度估算', 'TLE 功能开关与模块健康状态', '关键 DOM 几何、计算样式、祖先层叠上下文与遮挡命中', '原生导航按钮计算样式、命中测试与点击事件传播状态', '斜杠命令执行接口可用性（不执行命令）', '页面本次生命周期内最近 30 条脱敏 JS 错误', '低开销性能摘要（浏览器支持时）'],
        excluded: ['聊天正文、消息内容、角色卡、世界书正文、提示词', 'input/textarea 内容、表单值、API Key、令牌、Cookie、密码', 'localStorage/sessionStorage 原始数据', '任意 DOM innerText/innerHTML 与资源请求 URL 查询参数'],
        note: '设备型号、系统版本、宿主版本只在浏览器或宿主明确暴露时填写；UA 解析值会标注来源与置信度。',
      },
      environment: {
        host: { name: hostName, signals: { tauriTavernRuntimePresent: Boolean(ttRuntime), sillyTavernApiPresent: Boolean(stApi), sillyTavernGetContextPresent: typeof stApi?.getContext === 'function' }, version: hostVersionResult, tavernHelper: { scriptType: 'Tavern Helper script (package type=script)', version: helperVersionResult, matchingGlobalNames: helperGlobals } },
        device: { class: deviceClass, model: clientHints.model || null, modelSource: clientHints.model ? 'User-Agent Client Hints explicit model' : 'not-exposed; not inferred', touchSupported: 'ontouchstart' in HOST_WIN || touchPoints > 0, maxTouchPoints: touchPoints, platform: nav.platform || null },
        operatingSystem: os,
        browser: { ...browser, engine: browserEngine, userAgent: ua, clientHints },
        locale: { language: nav.language || null, languages: Array.isArray(nav.languages) ? nav.languages.slice(0, 10) : [], online: nav.onLine ?? null, cookieEnabled: nav.cookieEnabled ?? null, isSecureContext: HOST_WIN.isSecureContext ?? null },
        hardware: { hardwareConcurrency: nav.hardwareConcurrency ?? null, deviceMemoryGB: nav.deviceMemory ?? null, connection: diagnosticSafe(() => ({ effectiveType: nav.connection?.effectiveType || null, rtt: nav.connection?.rtt ?? null, downlinkMbps: nav.connection?.downlink ?? null, saveData: nav.connection?.saveData ?? null }), null) },
        capabilities: { visualViewport: Boolean(vv), userAgentClientHints: Boolean(nav.userAgentData), clipboardWrite: typeof nav.clipboard?.writeText === 'function', mutationObserver: typeof HOST_WIN.MutationObserver === 'function', resizeObserver: typeof HOST_WIN.ResizeObserver === 'function', intersectionObserver: typeof HOST_WIN.IntersectionObserver === 'function', elementsFromPoint: typeof HOST_DOC.elementsFromPoint === 'function', css: diagnosticSafe(() => ({ maskImage: HOST_WIN.CSS?.supports?.('mask-image', 'linear-gradient(to bottom, black, transparent)') || false, webkitMaskImage: HOST_WIN.CSS?.supports?.('-webkit-mask-image', 'linear-gradient(to bottom, black, transparent)') || false, backdropFilter: HOST_WIN.CSS?.supports?.('backdrop-filter', 'blur(2px)') || false, dynamicViewportUnit: HOST_WIN.CSS?.supports?.('height', '100dvh') || false, hasSelector: HOST_WIN.CSS?.supports?.('selector(:has(*))') || false }), null) },
        document: { readyState: HOST_DOC.readyState, compatMode: HOST_DOC.compatMode, visibilityState: HOST_DOC.visibilityState, hasFocus: diagnosticSafe(() => HOST_DOC.hasFocus(), null), htmlClass: html.className, bodyClass: body.className, htmlOverflow: HOST_WIN.getComputedStyle(html).overflow, bodyOverflow: HOST_WIN.getComputedStyle(body).overflow },
        viewport,
        theme: { activeTheme, themeSelectCatalogLabel: currentTheme, themeSelectPresent: Boolean(themeControl) },
        storage: { localStorageReadable: storageReadable, rawStorageCollected: false },
      },
      slashCommands: slashCommandDiagnostics,
      engine,
      drawers,
      keyElements,
      ancestorChains,
      occlusion,
      visualCandidates: { scannedNodes: visualNodesScanned, capturedCandidates: visualCandidates.length, candidates: visualCandidates },
      performance: performanceInfo,
      recentErrors: [...diagnosticErrors],
      notes: [
        '键盘高度为 visualViewport 差值估算，不是直接读取操作系统输入法高度。',
        'Slash command 检测只检查执行接口，不执行 /chat-jump、/hide、/unhide，避免修改聊天状态。',
        '宿主/Helper 版本若未由运行时公开则标记 unavailable，不从文件名或 UA 猜测。',
        '视觉候选最多 180 个，最多扫描 3500 个 DOM 节点；复杂页面可能截断。',
        'FPS 未进行主动采样，避免诊断动作自身增加负载。',
      ],
    };
  }

  function diagnosticSafe(fn, fallback = null) {
    try { return fn(); } catch { return fallback; }
  }

  function collectDiagnosticReportWithPanelHidden() {
    const panel = state.panel;
    const button = state.diagnosticButton;
    // Snapshot native drawers before touching any engine-owned diagnostic UI.
    // This is important on iOS, where touchstart can dismiss a drawer before click.
    const nativeDrawerStateBeforeCapture = [...HOST_DOC.querySelectorAll('.drawer-content')].map(el => ({
      id: el.id || '',
      open: el.classList.contains('openDrawer'),
      display: HOST_WIN.getComputedStyle(el).display,
      visibility: HOST_WIN.getComputedStyle(el).visibility,
    }));
    const panelWasOpen = Boolean(panel?.classList.contains('openDrawer'));
    const panelDisplay = panel?.style.getPropertyValue('display') || '';
    const panelPriority = panel?.style.getPropertyPriority('display') || '';
    const buttonWasHidden = !button || button.hidden;
    const buttonDisplay = button?.style.getPropertyValue('display') || '';
    const buttonDisplayPriority = button?.style.getPropertyPriority('display') || '';

    try {
      // Hide only engine-owned diagnostic controls. Keep the native drawer,
      // selected controls, and all navigation state untouched during capture.
      if (panel?.isConnected) panel.style.setProperty('display', 'none', 'important');
      if (button?.isConnected) button.style.setProperty('display', 'none', 'important');
      void HOST_DOC.body.getBoundingClientRect();
      const report = collectDiagnosticReport();
      report.preInteractionSnapshot = diagnosticPreInteractionSnapshot;
      report.preInteractionSnapshotMissing = !diagnosticPreInteractionSnapshot;
      diagnosticPreInteractionSnapshot = null;
      report.diagnosticCapture = {
        panelTemporarilyHidden: Boolean(panel?.isConnected),
        panelWasOpen,
        floatingButtonTemporarilyHidden: Boolean(button?.isConnected),
        nativeDrawerStateBeforeCapture,
        nativeDrawerStateAfterCapture: [...HOST_DOC.querySelectorAll('.drawer-content')].map(el => ({
          id: el.id || '',
          open: el.classList.contains('openDrawer'),
          display: HOST_WIN.getComputedStyle(el).display,
          visibility: HOST_WIN.getComputedStyle(el).visibility,
        })),
        diagnosticControlsRestoredAfterCapture: true,
      };
      return report;
    } finally {
      if (panel?.isConnected) {
        if (panelDisplay) panel.style.setProperty('display', panelDisplay, panelPriority);
        else panel.style.removeProperty('display');
      }
      if (button?.isConnected) {
        if (buttonDisplay) button.style.setProperty('display', buttonDisplay, buttonDisplayPriority);
        else button.style.removeProperty('display');
        button.hidden = buttonWasHidden;
      }
    }
  }

  async function copyDiagnosticReport() {
    const status = state.panel?.querySelector('[data-tle-diagnostic-status]');
    try {
      let report = null;
      if (diagnosticCaptureSnapshot && Date.now() - diagnosticCaptureSnapshot.capturedAtMs < 5000) {
        report = diagnosticCaptureSnapshot.report;
      }
      diagnosticCaptureSnapshot = null;
      diagnosticPreInteractionSnapshot = null;
      if (!report) report = collectDiagnosticReportWithPanelHidden();
      const text = JSON.stringify(report, null, 2);
      let copied = false;
      try {
        if (HOST_WIN.navigator.clipboard?.writeText) {
          await HOST_WIN.navigator.clipboard.writeText(text);
          copied = true;
        }
      } catch {}
      if (!copied) {
        try {
          const textarea = HOST_DOC.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.setAttribute('aria-label', 'TLE 诊断报告复制备用文本');
          textarea.style.cssText = 'position:fixed;left:-10000px;top:0;width:1px;height:1px;opacity:0;';
          HOST_DOC.body.appendChild(textarea);
          textarea.select();
          copied = HOST_DOC.execCommand('copy');
          textarea.remove();
        } catch {}
      }
      if (!copied) {
        const panel = openMobileDebugger();
        const output = panel?.querySelector('[data-debug-output]');
        if (output) {
          output.textContent = text;
          output.style.userSelect = 'text';
          output.style.webkitUserSelect = 'text';
        }
        throw new Error('浏览器拒绝自动复制；完整报告已放入调试台，可长按/选择后手动复制。');
      }
      const kb = Math.max(1, Math.round(text.length / 1024));
      if (status) status.textContent = `诊断报告已复制（${kb} KB，${report.recentErrors?.length || 0} 条错误记录）。`;
      flashDiagnosticButton(true);
      try { HOST_WIN.toastr?.success?.(`完整诊断报告已复制（${kb} KB）`, 'TLE'); } catch {}
      console.info(`[Tavern Layout Engine] Host Diagnostics 2.0 已复制（${kb} KB）。`);
    } catch (error) {
      if (status) status.textContent = `复制失败：${error?.message || error}`;
      flashDiagnosticButton(false);
      console.error('[Tavern Layout Engine] 诊断报告复制失败。', error);
    }
  }

  function onClick(event) {
    const optionalButton = event.target.closest?.('#' + ID.panel + ' [data-tle-optional-action]');
    if (optionalButton?.closest('[data-tle-optional-override]')) {
      const action=optionalButton.dataset.tleOptionalAction;
      if(action==='details')overrideDetails(optionalButton);
      else if(action==='refresh')overrideRefresh();
      else if(['install','enable','disable','remove'].includes(action))void overrideChange(action);
      return;
    }
    if (optionalButton) {
      const action = optionalButton.dataset.tleOptionalAction;
      if (action === 'details') { optionalOpenDetails(optionalButton); return; }
      if (action === 'refresh') { optionalRefreshUI(); return; }
      if (['install','enable','disable','remove'].includes(action)) {
        void optionalChange(action);
        return;
      }
    }
    const companionAction = event.target.closest?.('#' + ID.panel + ' [data-tle-companion-open]')?.dataset.tleCompanionOpen;
    if (companionAction === 'new') { void companionOpenEditor(); return; }
    if (companionAction === 'manage') { companionOpenManager(); return; }
    const action = event.target.closest?.('#' + ID.panel + ' [data-tle-action]')?.dataset.tleAction;
    if (action === 'check-update' || action === 'install-update' || action === 'adopt-loader'
        || action === 'check-loader-update' || action === 'install-loader-update') {
      void runLoaderUpdateAction(action);
      return;
    }
    if (action === 'emergency-restore') emergencyRestore();
    if (action === 'copy-diagnostic') copyDiagnosticReport();
    if (action === 'open-debugger') openMobileDebugger();
    if (action === 'clear-diagnostic-errors') {
      diagnosticErrors.length = 0;
      const status = state.panel?.querySelector('[data-tle-diagnostic-status]');
      if (status) status.textContent = '当前页面内存中的错误记录已清空。';
    }
    if (action === 'pause') {
      setActive(!state.active);
      if (state.active) scan();
      else {
        restoreCharacterWorkspace();
        restorePresetWorkspace();
      }
    }
  }

  function scan() {
    if (state.destroyed) return;
    if (!isDesktopViewport()) {
      if (state.character.applied) restoreCharacterWorkspace();
      if (state.preset.applied) restorePresetWorkspace();
      return;
    }
    if (!state.active) return;
    applyPresetWorkspace();
    applyCharacterWorkspace();
  }

  function destroy() {
    if (state.destroyed) return;

    // Stop every observer/listener before moving DOM back. Otherwise the observer can
    // see the restoration itself and immediately re-apply the engine workspace.
    state.destroyed = true;
    navEdgeSwipeAbort?.abort();
    navEdgeSwipeAbort = null;
    if (state.floorZeroClearanceFrame) HOST_WIN.cancelAnimationFrame(state.floorZeroClearanceFrame);
    state.floorZeroClearanceFrame = 0;
    clearFloorZeroClearance();
    closeQuickPanel(false);
    closeChatTools(false);
    companionCleanup();
    optionalCleanup();
    clearChatFadeBottomPadding();
    clearChatFadeVisual();
    stopChatFadeWallpaperObservers();
    if (state.chatFade.refreshRaf) HOST_WIN.cancelAnimationFrame(state.chatFade.refreshRaf);
    state.chatFade.refreshRaf = 0;
    search.observer?.disconnect();
    search.jumpAbort?.abort();
    HOST_WIN.clearTimeout(search.refreshTimer);
    HOST_WIN.clearTimeout(search.renderTimer);
    clearSearchHighlight();
    search.controls.clear();
    state.globalSearchIndex = [];
    search.matches = [];
    state.observer?.disconnect();
    state.themeObserver?.disconnect();
    state.panelObserver?.disconnect();
    state.character?.detailObserver?.disconnect();
    state.chatShortcutObserver?.disconnect();
    if (state.chatShortcutFrame) HOST_WIN.cancelAnimationFrame(state.chatShortcutFrame);
    destroyScrollBottom();
    state.abort.abort();
    state.diagnosticAbort?.abort();
    state.diagnosticAbort = null;
    state.diagnosticButtonObserver?.disconnect();
    state.diagnosticButtonObserver = null;
    if (state.diagnosticButtonRepairFrame) HOST_WIN.cancelAnimationFrame(state.diagnosticButtonRepairFrame);
    state.diagnosticButtonRepairFrame = 0;

    // Restore all native DOM nodes before removing the engine stylesheet.
    for (const key of [...foldRecords.keys()]) removeNativeFold(key);
    restoreCharacterWorkspace();
    restorePresetWorkspace();

    HOST_WIN.cancelAnimationFrame(state.layoutFrame);
    HOST_DOC.querySelectorAll('#top-settings-holder > .drawer > .tle-drawer-label, #top-settings-holder > .tle-sidebar-info').forEach(node => node.remove());
    state.navEntry?.remove();
    state.organizerEntry?.remove();
    state.mobileNav.toggle?.remove();
    state.workspaceHeader?.remove();
    state.globalSearchPanel?.remove();
    HOST_DOC.body.classList.remove('tle-global-search-open', 'tle-quick-modal-open');
    HOST_DOC.body.removeAttribute('data-tle-external-surface');
    HOST_DOC.body.removeAttribute('data-tle-search-available');
    HOST_DOC.body.removeAttribute('data-tle-compat-layer-repair');
    HOST_DOC.body.removeAttribute('data-tle-compat-nav-repair');
    HOST_DOC.body.removeAttribute('data-tle-compat-structure-repair');
    HOST_DOC.body.removeAttribute('data-tle-compat-panel-bg');
    HOST_DOC.body.removeAttribute('data-tle-compat-panel-bg-mode');
    HOST_DOC.body.style.removeProperty('--tle-compat-panel-bg-custom');
    HOST_DOC.body.removeAttribute('data-tle-compat-nav-text');
    HOST_DOC.body.style.removeProperty('--tle-nav-text-color');
    HOST_DOC.body.style.removeProperty('--tle-nav-icon-opacity');
    state.chatShortcut?.remove();
    state.chatTools.button?.remove();
    state.chatTools.panel?.remove();
    try { state.diagnosticButton?.hidePopover?.(); } catch {}
    state.diagnosticButton?.remove();
    const debuggerPanel = HOST_DOC.getElementById(DEBUGGER_ID);
    try { if (debuggerPanel?.open) debuggerPanel.close(); } catch {}
    debuggerPanel?.remove();
    state.panel?.remove();
    state.style?.remove();
    delete HOST_DOC.body.dataset.tleNav;
    delete HOST_DOC.body.dataset.tleOverlay;
    delete HOST_DOC.body.dataset.tleDocked;
    delete HOST_DOC.body.dataset.tleCompact;
    HOST_DOC.body.style.removeProperty('--tle-half-rows');
    HOST_DOC.body.style.removeProperty('--tle-requested-width');
    HOST_DOC.body.style.removeProperty('--tle-rows');

    if (HOST_WIN[INSTANCE_KEY] === api) delete HOST_WIN[INSTANCE_KEY];
    console.info('[Tavern Layout Engine] 已完整卸载：原生 DOM、导航结构、样式与布局变量均已恢复。');
  }

  const api = {
    version: '0.3.221',
    ready: false,
    destroy,
    state,
    emergencyRestore,
    restorePresetWorkspace,
    restoreCharacterWorkspace,
    applyCharacterWorkspace,
    hostWindow: HOST_WIN,
    hostDocument: HOST_DOC,
  };
  HOST_WIN[INSTANCE_KEY] = api;

  HOST_DOC.addEventListener('click', event => {
    if (event.target.closest?.('#top-settings-holder .drawer-toggle, #openai_settings, #user-settings-block')) {
      HOST_WIN.requestAnimationFrame(applyOptionalFolds);
    }
  }, { capture: true, signal: state.abort.signal });
  HOST_DOC.addEventListener('click', onClickCapture, { capture: true, signal: state.abort.signal });
  HOST_DOC.addEventListener('click', onClick, { signal: state.abort.signal });
  HOST_DOC.addEventListener('click', queueChatShortcutRefresh, { signal: state.abort.signal });
  HOST_DOC.addEventListener('keydown', queueChatShortcutRefresh, { signal: state.abort.signal });
  // Passive observation only: record hit-target and propagation outcomes for native
  // sidebar clicks without preventing, stopping, or replaying any host interaction.
  HOST_WIN.addEventListener('pointerdown', recordNavigationPointerDown, { capture: true, passive: true, signal: state.abort.signal });
  HOST_WIN.addEventListener('click', recordNavigationClickCapture, { capture: true, passive: true, signal: state.abort.signal });
  HOST_DOC.addEventListener('click', recordNavigationClickDocumentBubble, { passive: true, signal: state.abort.signal });
  HOST_WIN.addEventListener('click', recordNavigationClickWindowBubble, { passive: true, signal: state.abort.signal });
  state.chatShortcutObserver = new HOST_WIN.MutationObserver(records => {
    if (state.destroyed) return;

    const isRoutineChatNode = node =>
      node?.nodeType === 1 &&
      (node.matches?.('.mes, #show_more_messages, #tle-scroll-bottom') ||
       node.closest?.('.mes'));

    const relevant = records.some(record => {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;

      // Keep all existing Tavern modal/drawer detection paths intact.
      if (target?.matches?.(CHAT_SHORTCUT_OVERLAY_SELECTOR) ||
          target?.closest?.(CHAT_SHORTCUT_OVERLAY_SELECTOR)) return true;

      // Ignore TLE-owned surfaces and their internal state changes.
      if (target && isTleOwnedOverlayElement(target)) return false;

      // Ordinary chat message rendering is frequent and cannot create the
      // body-level full-screen app shell this detector is looking for.
      if (target?.closest?.('#form_sheld')) return false;
      if (target?.closest?.('#chat')) {
        if (record.type === 'attributes' || target.closest?.('.mes')) return false;

        const changedNodes = [...record.addedNodes, ...record.removedNodes]
          .filter(node => node.nodeType === 1);
        return changedNodes.some(node =>
          !isRoutineChatNode(node) && !isTleOwnedOverlayElement(node)
        );
      }

      if (record.type === 'attributes') return Boolean(target);

      if (record.type === 'childList') {
        return [...record.addedNodes, ...record.removedNodes].some(node =>
          node.nodeType === 1 && !isTleOwnedOverlayElement(node)
        );
      }

      return false;
    });

    if (relevant) queueChatShortcutRefresh();
  });
  state.chatShortcutObserver.observe(HOST_DOC.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'style', 'hidden', 'aria-hidden'],
  });
  HOST_DOC.addEventListener('change', (event) => {
    if (event.target?.matches?.('#themes') && compatibilityStructureRepair) {
      setCompatibilityStructureRepair(false);
    }

    const autoUpdateInput = event.target.closest?.('[data-tle-setting="auto-update"]');
    if (autoUpdateInput) {
      const loader = getStableLoader();
      if (typeof loader?.setAutoUpdateEnabled === 'function') {
        try { loader.setAutoUpdateEnabled(autoUpdateInput.checked); }
        catch (error) { console.error('[TLE] 自动更新设置保存失败', error); }
      }
      syncRemoteUpdateUI();
    }

    const foldMaster = event.target.closest?.('[data-tle-fold-master]');
    if (foldMaster) setFoldConfig(foldMaster.checked);
    const foldOption = event.target.closest?.('[data-tle-fold-option]');
    if (foldOption) setFoldConfig(undefined, foldOption.dataset.tleFoldOption, foldOption.checked);

    const chatShortcutDestinationSetting = event.target.closest?.('[data-tle-setting="chat-shortcut-destination"]');
    if (chatShortcutDestinationSetting) setChatShortcutDestination(chatShortcutDestinationSetting.value);

    const chatToolsEnabledSetting = event.target.closest?.('[data-tle-setting="chat-tools-enabled"]');
    if (chatToolsEnabledSetting) setChatToolsEnabled(chatToolsEnabledSetting.checked);

    const chatQuickActionsSetting = event.target.closest?.('[data-tle-setting="chat-quick-actions-enabled"]');
    if (chatQuickActionsSetting) setChatQuickActionsEnabled(chatQuickActionsSetting.checked);

    const chatFadeEnabledSetting = event.target.closest?.('[data-tle-setting="chat-fade-enabled"]');
    if (chatFadeEnabledSetting) setChatFadeEnabled(chatFadeEnabledSetting.checked);

    const scrollBottomEnabledSetting = event.target.closest?.('[data-tle-setting="scroll-bottom-enabled"]');
    if (scrollBottomEnabledSetting) setScrollBottomEnabled(scrollBottomEnabledSetting.checked);

    const chatFadeBottomPaddingSetting = event.target.closest?.('[data-tle-setting="chat-fade-bottom-padding"]');
    if (chatFadeBottomPaddingSetting) setChatFadeBottomPaddingEnabled(chatFadeBottomPaddingSetting.checked);

    const pcHamburgerSetting = event.target.closest?.('[data-tle-setting="pc-hamburger"]');
    if (pcHamburgerSetting) setPcHamburgerEnabled(pcHamburgerSetting.checked);
    const edgeSwipeSetting = event.target.closest?.('[data-tle-setting="nav-edge-swipe"]');
    if (edgeSwipeSetting) setNavEdgeSwipeEnabled(edgeSwipeSetting.checked);
    const navTextSetting = event.target.closest?.('[data-tle-setting="compat-nav-text"]');
    if (navTextSetting) setCompatibilityNavText(navTextSetting.checked);
    const navTextValue = event.target.closest?.('[data-tle-setting="compat-nav-text-color"], [data-tle-setting="compat-nav-text-hex"]');
    if (navTextValue) {
      if (/^#[0-9a-f]{6}$/i.test(navTextValue.value.trim())) setCompatibilityNavTextColor(navTextValue.value);
      else navTextValue.value = compatibilityNavTextColor;
    }

    const modeSetting = event.target.closest?.('[data-tle-setting="navigation-mode"]');
    if (modeSetting) setNavigationMode(modeSetting.value);
    if (event.target?.id === 'tle-nav-icon-opacity') setNavIconOpacity(event.target.value, true);

    const globalSearchSetting = event.target.closest?.('[data-tle-setting="global-search"]');
    if (globalSearchSetting) setGlobalSearchEnabled(globalSearchSetting.checked);

    const infoMaster = event.target.closest?.('[data-tle-setting="info-enabled"]');
    if (infoMaster) {
      infoEnabled = infoMaster.checked;
      saveInfoEnabled();
      updateInfoStation();
    }

    const diagnosticModeInput = event.target.closest('[data-tle-setting="diagnostic-mode"]');
    if (diagnosticModeInput) setDiagnosticMode(diagnosticModeInput.checked);

    const compatLayerInput = event.target.closest('[data-tle-setting="compat-layer-repair"]');
    if (compatLayerInput) setCompatibilityLayerRepair(compatLayerInput.checked);

    const compatNavInput = event.target.closest('[data-tle-setting="compat-nav-repair"]');
    if (compatNavInput) setCompatibilityNavigationRepair(compatNavInput.checked);

    const compatStructureInput = event.target.closest('[data-tle-setting="compat-structure-repair"]');
    if (compatStructureInput) setCompatibilityStructureRepair(compatStructureInput.checked);

    const compatBgInput = event.target.closest('[data-tle-setting="compat-panel-bg"]');
    if (compatBgInput) setCompatibilityPanelBackground(compatBgInput.checked);

    const compatBgMode = event.target.closest('[data-tle-setting="compat-panel-bg-mode"]');
    if (compatBgMode) setCompatibilityPanelBackgroundMode(compatBgMode.value);

    const compatBgColor = event.target.closest('[data-tle-setting="compat-panel-bg-color"]');
    if (compatBgColor) setCompatibilityPanelBackgroundColor(compatBgColor.value);

    const compatBgHex = event.target.closest('[data-tle-setting="compat-panel-bg-hex"]');
    if (compatBgHex && /^#[0-9a-f]{6}$/i.test(compatBgHex.value.trim())) {
      setCompatibilityPanelBackgroundColor(compatBgHex.value.trim());
    }

    if (event.target?.id === 'tle-info-nav-width') {
      infoNavWidth = Number(event.target.value);
      saveInfoNavWidth();
      applyInfoNavWidth();
    }

    const option = event.target.closest?.('[data-info-option]');
    const row = option?.closest('[data-info-setting]');
    if (option && row) {
      const id = row.dataset.infoSetting;
      const key = option.dataset.infoOption;
      infoSettings[id][key] = option.checked;
      if (key === 'visible') {
        row.querySelectorAll('[data-info-option="jump"], [data-info-option="quick"]').forEach(input => { input.disabled = !option.checked; });
      }
      closeQuickPanel(false);
      saveInfoSettings();
      updateInfoStation();
    }
  }, { signal: state.abort.signal });
  HOST_DOC.addEventListener('keydown', (event) => {
    const label = event.target.closest?.(NAV_LABEL_SELECTOR);
    if (label && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      if (!event.repeat) label.click();
      return;
    }
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    if (state.chatTools.open) {
      event.preventDefault();
      event.stopPropagation();
      closeChatTools(true);
      return;
    }
    if (state.panel?.classList.contains('openDrawer')) {
      setPanelOpen(false);
      state.navEntry?.querySelector('button')?.focus();
    } else if ((isMobileViewport() || pcHamburgerEnabled) && state.mobileNav.open) {
      setMobileNavOpen(false);
    }
  }, { signal: state.abort.signal });
  HOST_DOC.addEventListener('input', event => {
    if (event.target?.matches?.('[data-tle-setting="compat-nav-text-color"], [data-tle-setting="compat-nav-text-hex"]')) {
      if (/^#[0-9a-f]{6}$/i.test(event.target.value.trim())) setCompatibilityNavTextColor(event.target.value);
      return;
    }
    if (event.target?.id === 'tle-nav-icon-opacity') {
      setNavIconOpacity(event.target.value);
      return;
    }
    if (event.target?.id === 'tle-info-nav-width') {
      infoNavWidth = Number(event.target.value);
      applyInfoNavWidth();
      const output = state.panel.querySelector('[data-info-nav-width-value]');
      if (output) output.textContent = `${infoNavWidth}px`;
      return;
    }
    if (event.target?.matches?.('[data-tle-setting="compat-panel-bg-hex"]')) {
      const value = String(event.target.value || '').trim();
      if (/^#[0-9a-f]{6}$/i.test(value)) setCompatibilityPanelBackgroundColor(value);
    }
  }, { signal: state.abort.signal });

  for (const type of ['mousedown', 'touchstart']) {
    HOST_DOC.addEventListener(type, protectRailPress, { capture: true, passive: true, signal: state.abort.signal });
  }
  HOST_WIN.addEventListener('resize', () => {
    if (state.destroyed) return;
    const rows = Number(HOST_DOC.body.style.getPropertyValue('--tle-rows'));
    HOST_DOC.body.toggleAttribute('data-tle-compact', rows >= 10 || HOST_WIN.innerHeight < 415);
    scheduleChatFadeRefresh();
  }, { passive: true, signal: state.abort.signal });
  HOST_WIN.addEventListener('orientationchange', scheduleChatFadeRefresh, {
    passive: true,
    signal: state.abort.signal,
  });

  const mobileMedia = HOST_WIN.matchMedia('(max-width: 1000px)');
  mobileMedia.addEventListener('change', () => {
    setPanelOpen(false);
    setMobileNavOpen(false);
    scan();
  }, { signal: state.abort.signal });

  createStyle();
  createPanel();
  applyCompatibilitySettings();
  createRailControls();
  syncNavEdgeSwipe();
  applyEngineHubMode();
  syncRemoteUpdateUI();
  HOST_WIN.addEventListener('tle-loader-state-change', syncRemoteUpdateUI, { signal: state.abort.signal });
  HOST_WIN.addEventListener('tle-loader-bootstrap-state-change', syncRemoteUpdateUI, { signal: state.abort.signal });
  createGlobalSearch();
  createChatShortcut();
  createChatTools();
  companionBindEvents();
  queueChatShortcutRefresh();
  if (chatFadeEnabled) scheduleChatFadeRefresh();
  else setChatFadeStatus('渐隐侠默认关闭。');
  if (scrollBottomEnabled) {
    syncScrollBottomElements();
    bindScrollBottomEvents();
  }
  setDiagnosticMode(diagnosticMode);
  syncRail();
  state.panelObserver = new HOST_WIN.MutationObserver(() => {
    const open = String(state.panel.classList.contains('openDrawer'));
    state.panel.dataset.open = open;
    state.navEntry.querySelector('button')?.setAttribute('aria-expanded', open);
  });
  state.panelObserver.observe(state.panel, { attributes: true, attributeFilter: ['class'] });
  scan();
  queueChatShortcutRefresh();

  // One coalesced structural update per frame, only for relevant DOM changes.
  const structuralSelector = '#top-settings-holder, .drawer, #left-nav-panel, #right-nav-panel, #completion_prompt_manager, #character_popup, #chat, #form_sheld';
  state.observer = new HOST_WIN.MutationObserver(records => {
    if (state.destroyed || state.layoutFrame) return;

    const changedNodes = records.flatMap(record => [...record.addedNodes, ...record.removedNodes]);
    const chatRootChanged = changedNodes.some(node => node.nodeType === 1
      && (node.matches?.('#chat') || node.querySelector?.('#chat')));
    const structuralChanged = records.some(record =>
      record.target.id === 'top-settings-holder'
      || record.target.matches?.('.drawer')
      || [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1
        && (node.matches(structuralSelector) || node.querySelector(structuralSelector)))
    );
    if (!structuralChanged) return;

    state.layoutFrame = HOST_WIN.requestAnimationFrame(() => {
      state.layoutFrame = 0;
      syncRail();
      scan();
      syncScrollBottomElements();
      queueInfoRefresh();
      if (chatRootChanged && chatFadeEnabled) scheduleChatFadeRefresh();
    });
  });
  state.observer.observe(HOST_DOC.body, { childList: true, subtree: true });

  // TT may park/remount settings or rebuild a parameter without a click. Watch
  // structure only; native source visibility changes must remain native-owned.
  let presetFoldFrame = 0;
  const presetFoldObserver = new HOST_WIN.MutationObserver(records => {
    if (state.destroyed || presetFoldFrame || !foldConfig.enabled ||
        !foldConfig.options['preset-model-settings']) return;
    const relevant = records.some(record => record.target.closest?.('#openai_settings') ||
      [...record.addedNodes, ...record.removedNodes].some(node => node.nodeType === 1 &&
        (node.matches('#openai_settings') || node.querySelector('#openai_settings'))));
    if (!relevant) return;
    presetFoldFrame = HOST_WIN.requestAnimationFrame(() => {
      presetFoldFrame = 0;
      applyOptionalFolds();
    });
  });
  presetFoldObserver.observe(HOST_DOC.body, { childList: true, subtree: true });
  state.presetFoldObserver = presetFoldObserver;
  state.abort.signal.addEventListener('abort', () => {
    presetFoldObserver.disconnect();
    HOST_WIN.cancelAnimationFrame(presetFoldFrame);
  }, { once: true });

  // Track late-loaded or replaced controls without polling or observing unrelated changes.
  const infoControlSelector = '#themes, #UI-Theme-Block, #reasoning_select';
  state.themeObserver = new HOST_WIN.MutationObserver((records) => {
    if (state.destroyed) return;
    const floorZeroStyleChanged = records.some(record => {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (target?.id === 'chat') return true;
      return Boolean(target?.matches?.('.mes') && target.parentElement?.id === 'chat');
    });
    if (floorZeroStyleChanged) queueFloorZeroClearanceSync();
    const relevant = records.some(record => {
      const target = record.target.nodeType === 1
        ? record.target
        : record.target.parentElement;
      if (target?.closest?.(infoControlSelector)) return true;
      if (record.type === 'attributes' &&
          (target?.matches?.('.drawer-content, #reasoning_select, #themes, #UI-Theme-Block')
            || target?.closest?.('.drawer-content'))) return true;
      return [...record.addedNodes, ...record.removedNodes].some(node => {
        if (node.nodeType !== 1) return false;
        return node.matches?.(infoControlSelector)
          || Boolean(node.querySelector?.(infoControlSelector));
      });
    });
    if (relevant) queueInfoRefresh();
  });
  state.themeObserver.observe(HOST_DOC.body, {
    childList: true,
    subtree: true,
    characterData: true,
    // TT may reveal an already-mounted Advanced Formatting drawer without
    // inserting new nodes. Refresh when its drawer state changes.
    attributes: true,
    attributeFilter: ['class', 'open', 'style'],
  });

  // Refresh only on host UI mutations/events; no timer or continuous DOM polling.
  let infoRefreshQueued = false;
  const queueInfoRefresh = () => {
    if (infoRefreshQueued || state.destroyed || !infoEnabled || navigationMode !== 'info') return;
    infoRefreshQueued = true;
    HOST_WIN.requestAnimationFrame(() => {
      infoRefreshQueued = false;
      if (!state.destroyed) updateInfoStation();
    });
  };
  // Initialize the nested reasoning disclosure automatically when TT opens
  // Advanced Formatting. Also retry if TT inserts the parked panel contents later.
  const advancedFormattingInitObserver = new HOST_WIN.MutationObserver(records => {
    if (state.destroyed || reasoningDisclosureInitDone) return;
    const panel = HOST_DOC.querySelector('#AdvancedFormatting, #advanced_formatting');
    if (!panel?.classList.contains('openDrawer')) return;
    const relevant = records.some(record => {
      const target = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      return target === panel || panel.contains(target)
        || [...record.addedNodes].some(node => node.nodeType === 1 && (node === panel || panel.contains(node) || node.contains?.(panel)));
    });
    if (relevant) initializeReasoningDisclosure();
  });
  advancedFormattingInitObserver.observe(HOST_DOC.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  state.abort.signal.addEventListener('abort', () => advancedFormattingInitObserver.disconnect(), { once: true });
  state.advancedFormattingInitObserver = advancedFormattingInitObserver;
  // Handle the case where the drawer was already open when TLE initialized.
  initializeReasoningDisclosure();
  HOST_DOC.addEventListener('change', queueInfoRefresh, { signal: state.abort.signal });
  HOST_DOC.addEventListener('input', queueInfoRefresh, { signal: state.abort.signal });
  HOST_DOC.addEventListener('click', queueInfoRefresh, { signal: state.abort.signal });
  // Watch TT's parked-panel lifecycle: controls may be inserted/removed without
  // emitting a change event. Cache a mounted select and refresh the station on
  // either mount or unmount; the cached value keeps the row alive on unmount.
  const reasoningFormatObserver = new HOST_WIN.MutationObserver(records => {
    if (state.destroyed) return;
    let relevant = false;
    for (const record of records) {
      for (const node of [...record.addedNodes, ...record.removedNodes]) {
        if (node.nodeType !== 1) continue;
        if (node.id === 'reasoning_select' || node.querySelector?.('#reasoning_select')) {
          relevant = true;
          break;
        }
      }
      if (relevant) break;
    }
    const mounted = HOST_DOC.querySelector('#reasoning_select');
    if (mounted?.value) rememberReasoningFormat(mounted.selectedOptions?.[0]?.textContent?.trim() || mounted.value);
    if (relevant) queueInfoRefresh();
  });
  reasoningFormatObserver.observe(HOST_DOC.body, { childList: true, subtree: true });
  state.reasoningFormatObserver = reasoningFormatObserver;
  state.abort.signal.addEventListener('abort', () => reasoningFormatObserver.disconnect(), { once: true });
  HOST_WIN.addEventListener('chat_changed', queueInfoRefresh, { signal: state.abort.signal });
  HOST_WIN.addEventListener('chat_changed', queueFloorZeroClearanceSync, { signal: state.abort.signal });
  HOST_WIN.addEventListener('chat_changed', queueChatShortcutRefresh, { signal: state.abort.signal });
  HOST_WIN.addEventListener('chat_changed', scheduleChatFadeRefresh, { signal: state.abort.signal });
  HOST_WIN.addEventListener('character_selected', queueInfoRefresh, { signal: state.abort.signal });
  HOST_WIN.addEventListener('character_selected', queueChatShortcutRefresh, { signal: state.abort.signal });
  HOST_WIN.addEventListener('persona_changed', queueInfoRefresh, { signal: state.abort.signal });
  HOST_WIN.addEventListener('chat_changed', updateWorkspaceHeader, { signal: state.abort.signal });
  HOST_WIN.addEventListener('persona_changed', updateWorkspaceHeader, { signal: state.abort.signal });
  HOST_DOC.addEventListener('input', event => {
    if (event.target?.id === 'your_name') updateWorkspaceHeader();
  }, { signal: state.abort.signal });
  HOST_DOC.addEventListener('change', event => {
    if (event.target?.id === 'your_name') updateWorkspaceHeader();
  }, { signal: state.abort.signal });
  HOST_WIN.addEventListener('preset_changed', queueInfoRefresh, { signal: state.abort.signal });
  HOST_WIN.addEventListener('resize', queueFloorZeroClearanceSync, { passive: true, signal: state.abort.signal });

  queueInfoRefresh();
  SCRIPT_WIN.addEventListener('pagehide', destroy, { once: true, signal: state.abort.signal });
  SCRIPT_WIN.addEventListener('beforeunload', destroy, { once: true, signal: state.abort.signal });

  api.ready = true;
  console.info('[Tavern Layout Engine] Core v0.3.221 · Host Diagnostics 2.0 已启动 · 作者：小松鼠 & ChatGPT（小松7）。');
})();
