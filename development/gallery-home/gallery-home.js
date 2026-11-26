function createTLEGalleryHome(window, document) {
    'use strict';

    const GLOBAL_NAME = 'FreesiaGalleryHome';
    const VERSION = '0.3.265';
    const STYLE_ID = 'freesia-gallery-home-style';
    const ACTIVE_CLASS = 'freesia-gallery-active';
    const NATIVE_CLASS = 'freesia-gallery-native';
    const PAGE_CLASSES = ['freesia-gallery-page-gallery', 'freesia-gallery-page-detail', 'freesia-gallery-page-files'];
    const GRID_CLASS = 'freesia-gallery-grid';
    const API_RECENT = '/api/chats/recent';
    const API_CHARACTER_CHATS = '/api/characters/chats';
    const API_CHAT_SEARCH = '/api/chats/search';
    const DEFAULT_MAX_DISPLAYED = 15;
    const DEFAULT_COLLAPSED_DISPLAYED = 3;
    const GALLERY_SETTINGS_KEY = 'freesiaGallerySettings';
    const DETAIL_PINNED_CHATS_KEY = 'freesiaGalleryDetailPinnedChats';
    const DEFAULT_GALLERY_COLUMNS = 4;
    const DEFAULT_GALLERY_ROWS = 3;
    const MAX_GALLERY_ROWS = 15;

    const previous = window[GLOBAL_NAME];
    if (previous && typeof previous.stop === 'function') {
        try { previous.stop(); } catch (error) { console.warn('[Freesia Gallery] Previous instance cleanup failed.', error); }
    }

    const state = {
        started: false,
        enabled: true,
        avatarCompatibility: { disablePseudo: true, disableBorderImage: true },
        panel: null,
        welcomeRecent: null,
        nativeList: null,
        grid: null,
        paginationRoot: null,
        columnsSelect: null,
        rowsSelect: null,
        settingsPopupObserver: null,
        settingsPopupDialog: null,
        settingsPopupClickHandler: null,
        detailRoot: null,
        filesRoot: null,
        title: null,
        titleGroup: null,
        detailManageButton: null,
        nativeTitle: null,
        originalTitle: null,
        backButton: null,
        viewToggle: null,
        viewToggleIcon: null,
        summary: null,
        observer: null,
        waitObserver: null,
        countObserver: null,
        refreshTimer: null,
        requestController: null,
        generation: 0,
        eventCleanups: [],
        expandedAll: false,
        page: 'gallery',
        galleryPage: 0,
        galleryGroups: [],
        galleryBaseOrder: new Map(),
        layoutSettings: { columns: DEFAULT_GALLERY_COLUMNS, rows: DEFAULT_GALLERY_ROWS },
        selectedAvatar: '',
        detailCharacter: null,
        detailChats: [],
        fileSearch: '',
        countCache: new Map(),
        countRequests: new Map(),
        resizeHandler: null,
        settings: { maxDisplayed: DEFAULT_MAX_DISPLAYED, collapsedDisplayed: DEFAULT_COLLAPSED_DISPLAYED },
        source: 'none',
        lastError: null,
    };

    const CSS = [
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeRecent > .recentChatList:not(." + GRID_CLASS + ") { display: none !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " { display: grid; grid-template-columns: repeat(var(--freesia-gallery-columns, 4), minmax(0, 1fr)); grid-auto-rows: 1fr; align-items: stretch; justify-content: stretch; gap: clamp(5px, 0.7vw, 8px); width: 100%; min-width: 0; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card { position: relative; display: grid; grid-template-rows: auto auto minmax(0, 1fr); align-content: start; align-items: stretch; gap: 4px; width: 100%; height: 100%; min-width: 0; min-height: 0; box-sizing: border-box; padding: 5px; cursor: default; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-identity { position: relative; display: block; width: 100%; min-width: 0; cursor: pointer; outline-offset: 3px; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-identity > .avatar { display: block; width: 100% !important; height: auto !important; aspect-ratio: 3 / 4 !important; min-width: 0; min-height: 0; overflow: hidden; position: relative; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-identity > .avatar img { display: block; position: absolute; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-disable-avatar-pseudo .freesia-gallery-avatar::before, #chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-disable-avatar-pseudo .freesia-gallery-avatar::after { content: none !important; display: none !important; background: none !important; border: 0 !important; box-shadow: none !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-disable-avatar-border-image .freesia-gallery-avatar, #chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-disable-avatar-border-image .freesia-gallery-avatar img { border-image: none !important; border-image-source: none !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-heading { display: block; width: 100%; min-width: 0; cursor: pointer; outline-offset: 3px; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-heading .chatName { display: block; width: 100%; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-heading .characterName { display: block; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; text-align: var(--freesia-gallery-character-align, left); }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-chat-count { position: absolute; inset-inline: 0; bottom: 0; z-index: 2; display: block; box-sizing: border-box; width: 100%; padding: 0 8px 3px; overflow: hidden; color: #fff; background: none; filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.78)); white-space: nowrap; text-overflow: ellipsis; font-size: clamp(12px, 0.86em, 14px); font-weight: 500; line-height: 1.35; pointer-events: auto; -webkit-user-select: text; user-select: text; cursor: pointer; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-chat-actions { display: flex; flex: 0 0 auto; align-items: center; justify-content: flex-end; gap: 3px; margin-inline-start: auto; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-chat-actions button { flex: 0 0 auto; width: var(--freesia-gallery-action-size, auto); min-width: var(--freesia-gallery-action-size, auto); height: var(--freesia-gallery-action-size, auto); min-height: var(--freesia-gallery-action-size, 0); padding: var(--freesia-gallery-action-padding, initial); }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-date-row { display: flex !important; align-items: center; justify-content: space-between !important; gap: var(--freesia-gallery-date-gap, 6px); min-height: var(--freesia-gallery-date-height, 0); }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-chat-actions .freesia-gallery-character-pin.active { color: var(--SmartThemeQuoteColor, var(--SmartThemeBodyColor)); }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-actions-placeholder { visibility: hidden; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " .freesia-gallery-card .freesia-gallery-card-latest { display: grid !important; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(2.6em, 2.6em) minmax(1.35em, auto); align-content: start; align-items: stretch !important; justify-items: stretch !important; align-self: stretch !important; width: 100% !important; min-width: 0; min-height: 0; gap: 3px; overflow: visible; text-align: left !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " .freesia-gallery-card .freesia-gallery-card-latest > .freesia-gallery-card-date-row { display: flex !important; align-items: center; justify-content: flex-start !important; justify-self: stretch !important; align-self: stretch !important; width: 100% !important; min-width: 0; margin: 0 !important; overflow: visible; text-align: left !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " .freesia-gallery-card .freesia-gallery-card-latest > .freesia-gallery-card-date-row .chatDate { display: block !important; flex: 0 0 auto; width: auto !important; min-width: 0; margin: 0 !important; overflow: visible; white-space: normal; overflow-wrap: anywhere; text-overflow: clip; text-align: left !important; font-size: 0.78em; line-height: 1.25; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " .freesia-gallery-card .freesia-gallery-card-latest > .chatMessageContainer { display: flex !important; align-items: flex-start !important; justify-content: flex-start !important; justify-self: stretch !important; align-self: stretch !important; width: 100% !important; min-width: 0; min-height: 2.6em; max-height: 2.6em; margin: 0 !important; overflow: hidden; text-align: left !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " .freesia-gallery-card .freesia-gallery-card-latest > .chatMessageContainer > .chatMessage { display: -webkit-box !important; flex: 1 1 auto; width: 100% !important; min-width: 0; min-height: 2.6em; max-height: 2.6em; margin: 0 !important; padding: 0; overflow: hidden; white-space: normal; overflow-wrap: anywhere; text-align: left !important; -webkit-box-orient: vertical; -webkit-box-pack: start; -webkit-line-clamp: 2; line-clamp: 2; line-height: 1.3em; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " .freesia-gallery-card .freesia-gallery-card-latest > .chatStats { display: flex !important; flex-direction: row; align-items: center !important; justify-content: flex-end !important; justify-self: stretch !important; align-self: stretch !important; width: 100% !important; min-width: 0; min-height: 1.35em; max-height: none; margin: 0 !important; padding: 1px 0 2px; box-sizing: border-box; overflow: visible; white-space: nowrap; line-height: 1.35; text-align: right !important; font-size: 0.72em; gap: 6px; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " .freesia-gallery-card .freesia-gallery-card-latest > .chatStats .counterBlock { display: flex !important; flex: 0 0 auto; align-items: center !important; justify-content: flex-end !important; margin: 0 !important; text-align: right !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " ." + GRID_CLASS + " .freesia-gallery-card .freesia-gallery-card-latest > .chatStats .fileSize { display: inline-block; flex: 0 0 auto; margin: 0 !important; text-align: right !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-summary { display: inline-block; margin-inline-end: var(--freesia-gallery-summary-gap, 8px); font-size: 0.78em; opacity: 0.7; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeader > .freesia-gallery-back { order: 1; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeader > .freesia-gallery-summary { order: 2; flex: 0 0 auto; white-space: nowrap; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeader > .welcomeShortcuts { order: 3; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeader { display: flex; align-items: center; justify-content: space-between; flex-wrap: var(--freesia-gallery-header-wrap, wrap); gap: var(--freesia-gallery-header-gap, 8px 12px); width: 100%; min-width: 0; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeader .welcomeShortcuts { display: flex; flex: 0 1 auto; align-items: center; justify-content: flex-end; margin-inline-start: auto; max-width: 100%; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-back { flex: 0 0 auto; margin-inline-end: 6px; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-view-toggle { cursor: pointer; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " [hidden] { display: none !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-pagination { display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px; margin-block: 10px; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-title-group { display: inline-flex; flex: 1 1 auto; align-items: baseline; flex-wrap: nowrap; gap: 0; min-width: 0; max-width: 100%; vertical-align: baseline; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-title { display: inline; font-size: calc(var(--mainFontSize) * 1.3); font-weight: 600; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeaderLogo, #chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeaderVersionDisplay { display: none !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .recentChatsTitle { display: none !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeaderTitle { display: flex; align-items: center; justify-content: space-between; flex-wrap: nowrap; gap: 8px; width: 100%; min-width: 0; box-sizing: border-box; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .welcomeHeaderTitle > .mes_button { flex: 0 0 auto; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " ." + GRID_CLASS + ", #chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .freesia-gallery-detail, #chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .freesia-gallery-files, #chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .freesia-gallery-pagination { display: none !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .welcomeRecent > .recentChatList:not(." + GRID_CLASS + ") { display: flex !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .freesia-gallery-summary, #chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .freesia-gallery-back, #chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .freesia-gallery-title-group { display: none !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .welcomeHeaderLogo { display: block !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .welcomeHeaderVersionDisplay { display: block !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + "." + NATIVE_CLASS + " .recentChatsTitle { display: block !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-page-gallery .freesia-gallery-detail, #chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-page-gallery .freesia-gallery-files { display: none; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-page-detail ." + GRID_CLASS + ", #chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-page-files ." + GRID_CLASS + " { display: none; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-page-detail .freesia-gallery-files, #chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-page-files .freesia-gallery-detail { display: none; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-page-detail .freesia-gallery-detail, #chat .welcomePanel." + ACTIVE_CLASS + ".freesia-gallery-page-files .freesia-gallery-files { display: block; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-hero { display: grid; grid-template-columns: var(--freesia-gallery-detail-columns, minmax(180px, 262px) minmax(0, 1fr)); gap: var(--freesia-gallery-detail-gap, 24px); align-items: stretch; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-avatar { display: block; align-self: start; grid-column: 1; grid-row: 1; width: 100% !important; height: auto !important; aspect-ratio: 3 / 4 !important; min-width: 0; min-height: 0; overflow: hidden; position: relative; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-avatar img { display: block; position: absolute; inset: 0; width: 100% !important; height: 100% !important; object-fit: cover !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-main { display: flex; flex-direction: column; align-self: stretch; width: 100%; height: auto; min-width: 0; min-height: 0; gap: var(--freesia-gallery-detail-main-gap, 8px); box-sizing: border-box; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-description { display: block; flex: 1 1 0; width: 100%; min-width: 0; min-height: 0 !important; height: 0 !important; max-height: none !important; margin: var(--freesia-gallery-description-margin, initial); padding: var(--freesia-gallery-description-padding, initial); box-sizing: border-box; font-size: var(--freesia-gallery-description-size, inherit); line-height: var(--freesia-gallery-description-line, normal); overflow: auto; resize: none; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-heading { display: flex; flex: 0 0 auto; align-items: center; justify-content: flex-start; text-align: left !important; flex-wrap: var(--freesia-gallery-detail-heading-wrap, wrap); gap: var(--freesia-gallery-detail-heading-gap, 8px 12px); min-width: 0; min-height: 0; overflow: var(--freesia-gallery-detail-heading-overflow, visible); }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-session-card .chatNameContainer { display: flex; align-items: center; gap: 8px; min-width: 0; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-session-card .chatName { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-session-card .chatName { text-align: left !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-file-session-card .chatName { text-align: left !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-session-card .chatDate { flex: 0 0 auto; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-session-actions { display: flex; flex: 0 0 auto; align-items: center; gap: 3px; margin-inline-start: auto; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-name { flex: var(--freesia-gallery-detail-name-flex, 0 1 auto); min-width: 0; max-width: var(--freesia-gallery-detail-name-max, 100%); margin: 0; font-size: var(--freesia-gallery-detail-name-size, 1.5em); font-weight: 500; line-height: var(--freesia-gallery-detail-name-line, normal); white-space: var(--freesia-gallery-detail-name-white-space, normal); overflow: var(--freesia-gallery-detail-name-overflow, visible); text-overflow: var(--freesia-gallery-detail-name-text-overflow, clip); overflow-wrap: var(--freesia-gallery-detail-name-wrap, anywhere); text-align: left !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-lorebook { flex: var(--freesia-gallery-lorebook-flex, 0 1 auto); min-width: 0; font-size: 0.9em; opacity: 0.76; white-space: var(--freesia-gallery-lorebook-white-space, normal); overflow: var(--freesia-gallery-lorebook-overflow, visible); text-overflow: var(--freesia-gallery-lorebook-text-overflow, clip); overflow-wrap: anywhere; text-align: left !important; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-description-header { display: flex; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: var(--freesia-gallery-description-header-gap, 8px); width: 100%; min-width: 0; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-description-header .freesia-gallery-manage { flex: 0 0 auto; margin-inline-start: auto; white-space: nowrap; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-description-label { display: block; flex: 1 1 auto; min-width: 0; margin: 0; font-size: 0.82em; opacity: 0.68; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-chat-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: var(--freesia-gallery-detail-chat-margin, 12px 0 10px); }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-detail-chat-count { font-size: 1.05em; font-weight: 500; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-files-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; margin-bottom: 8px; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-file-search { flex: 1 1 12em; min-width: 0; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-empty { padding: 24px 12px; text-align: center; opacity: 0.7; }",
        "#chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-identity:focus-visible, #chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-heading:focus-visible, #chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-chat-count:focus-visible, #chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-card-latest:focus-visible, #chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-session-card:focus-visible, #chat .welcomePanel." + ACTIVE_CLASS + " .freesia-gallery-file-row:focus-visible { outline: 2px solid var(--SmartThemeQuoteColor, currentColor); outline-offset: 3px; }",
        "@media screen and (min-width: 821px) { #chat .welcomePanel." + ACTIVE_CLASS + " { --freesia-gallery-header-wrap: nowrap; --freesia-gallery-header-gap: 8px; --freesia-gallery-summary-gap: 2px; } }",
        "@media screen and (max-width: 820px) { #chat .welcomePanel." + ACTIVE_CLASS + " { --freesia-gallery-detail-columns: 104px minmax(0, 1fr); --freesia-gallery-detail-gap: 8px; --freesia-gallery-detail-main-gap: 0px; --freesia-gallery-detail-heading-wrap: nowrap; --freesia-gallery-detail-heading-gap: 4px; --freesia-gallery-detail-heading-overflow: hidden; --freesia-gallery-detail-name-flex: 0 1 auto; --freesia-gallery-detail-name-max: 100%; --freesia-gallery-detail-name-size: 1.05em; --freesia-gallery-detail-name-line: 1.2; --freesia-gallery-detail-name-white-space: nowrap; --freesia-gallery-detail-name-overflow: hidden; --freesia-gallery-detail-name-text-overflow: ellipsis; --freesia-gallery-detail-name-wrap: normal; --freesia-gallery-lorebook-white-space: nowrap; --freesia-gallery-lorebook-overflow: hidden; --freesia-gallery-lorebook-text-overflow: ellipsis; --freesia-gallery-description-header-gap: 4px; --freesia-gallery-description-margin: 0; --freesia-gallery-description-padding: 6px 8px; --freesia-gallery-description-size: 0.86em; --freesia-gallery-description-line: 1.3; --freesia-gallery-detail-chat-margin: 10px 0 10px; --freesia-gallery-date-height: 22px; --freesia-gallery-date-gap: 4px; --freesia-gallery-action-size: 22px; --freesia-gallery-action-padding: 0; --freesia-gallery-character-align: center; } }",
    ].join('\n');

    function createElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined && text !== null) element.textContent = String(text);
        return element;
    }

    function getContext() {
        try {
            return window.SillyTavern && typeof window.SillyTavern.getContext === 'function'
                ? window.SillyTavern.getContext()
                : null;
        } catch (error) {
            console.warn('[Freesia Gallery] Could not read SillyTavern context.', error);
            return null;
        }
    }

    function readSettings(context) {
        const defaults = { maxDisplayed: DEFAULT_MAX_DISPLAYED, collapsedDisplayed: DEFAULT_COLLAPSED_DISPLAYED };
        try {
            const raw = context && context.accountStorage && context.accountStorage.getItem('recentChatsSettings');
            if (!raw) return defaults;
            const parsed = JSON.parse(raw);
            const maxDisplayed = Math.min(1000, Math.max(1, parseInt(parsed.maxDisplayed, 10) || defaults.maxDisplayed));
            const collapsedDisplayed = Math.min(maxDisplayed, Math.max(1, parseInt(parsed.collapsedDisplayed, 10) || defaults.collapsedDisplayed));
            return { maxDisplayed, collapsedDisplayed };
        } catch (error) {
            console.warn('[Freesia Gallery] Could not read native recent chat settings.', error);
            return defaults;
        }
    }

    function readGallerySettings(context) {
        const defaults = { columns: DEFAULT_GALLERY_COLUMNS, rows: DEFAULT_GALLERY_ROWS };
        try {
            const raw = context && context.accountStorage && context.accountStorage.getItem(GALLERY_SETTINGS_KEY);
            if (!raw) return defaults;
            const parsed = JSON.parse(raw);
            const columnsValue = parseInt(parsed.columns, 10);
            const rowsValue = parseInt(parsed.rows, 10);
            return {
                columns: [2, 3, 4].includes(columnsValue) ? columnsValue : defaults.columns,
                rows: Math.min(MAX_GALLERY_ROWS, Math.max(1, Number.isFinite(rowsValue) ? rowsValue : defaults.rows)),
            };
        } catch (error) {
            console.warn('[Freesia Gallery] Could not read gallery layout settings.', error);
            return defaults;
        }
    }

    function saveGallerySettings() {
        const context = getContext();
        const storage = context && context.accountStorage;
        if (!storage || typeof storage.setItem !== 'function') return false;
        try {
            storage.setItem(GALLERY_SETTINGS_KEY, JSON.stringify(state.layoutSettings));
            return true;
        } catch (error) {
            console.warn('[Freesia Gallery] Could not save gallery layout settings.', error);
            return false;
        }
    }

    function isNarrowGalleryViewport() {
        if (typeof window.matchMedia === 'function') return window.matchMedia('(max-width: 480px)').matches;
        return Number(window.innerWidth || 0) <= 480;
    }

    function getEffectiveGalleryColumns() {
        return isNarrowGalleryViewport() ? Math.min(2, state.layoutSettings.columns) : state.layoutSettings.columns;
    }

    function syncResponsiveLayoutControls() {
        const narrow = isNarrowGalleryViewport();
        if (state.columnsSelect) {
            [3, 4].forEach(value => {
                const option = state.columnsSelect.querySelector('option[value="' + value + '"]');
                if (!option) return;
                option.disabled = narrow;
                option.textContent = narrow ? value + ' 列（桌面）' : value + ' 列';
            });
        }
        if (state.grid) state.grid.style.setProperty('--freesia-gallery-columns', String(getEffectiveGalleryColumns()));
    }

    function getGalleryPageSize() {
        return getEffectiveGalleryColumns() * state.layoutSettings.rows;
    }

    function getPinnedCharacterState() {
        const context = getContext();
        const storage = context && context.accountStorage;
        if (!storage || typeof storage.getItem !== 'function') return {};
        try {
            const raw = storage.getItem('freesiaGalleryPinnedCharacters');
            if (!raw) return {};
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            console.warn('[Freesia Gallery] Could not read pinned character state.', error);
            return {};
        }
    }

    function savePinnedCharacterState(value) {
        const context = getContext();
        const storage = context && context.accountStorage;
        if (!storage || typeof storage.setItem !== 'function') {
            reportError('当前环境无法保存角色置顶状态。');
            return false;
        }
        try {
            storage.setItem('freesiaGalleryPinnedCharacters', JSON.stringify(value));
            return true;
        } catch (error) {
            reportError('保存角色置顶状态失败。', error);
            return false;
        }
    }

    function isCharacterPinned(avatar) {
        return Object.prototype.hasOwnProperty.call(getPinnedCharacterState(), String(avatar || ''));
    }

    function toggleCharacterPin(avatar) {
        const pinned = getPinnedCharacterState();
        const key = String(avatar || '');
        if (!key) return;
        if (Object.prototype.hasOwnProperty.call(pinned, key)) delete pinned[key];
        else pinned[key] = Date.now();
        if (!savePinnedCharacterState(pinned)) return;
        renderGallery(state.galleryGroups, state.source, state.lastError);
    }

    function orderPinnedCharacters(groups) {
        const pinned = getPinnedCharacterState();
        return (Array.isArray(groups) ? groups : [])
            .map((group, index) => ({
                group: group,
                index: state.galleryBaseOrder.has(String(group.avatar || ''))
                    ? state.galleryBaseOrder.get(String(group.avatar || ''))
                    : index,
                pinnedAt: Number(pinned[String(group.avatar || '')] || 0),
            }))
            .sort((a, b) => {
                if (!!a.pinnedAt !== !!b.pinnedAt) return a.pinnedAt ? -1 : 1;
                if (a.pinnedAt && b.pinnedAt && a.pinnedAt !== b.pinnedAt) return b.pinnedAt - a.pinnedAt;
                return a.index - b.index;
            })
            .map(item => item.group);
    }

    function createCharacterPinButton(group) {
        const pinned = isCharacterPinned(group.avatar);
        const button = createElement('button', 'menu_button menu_button_icon freesia-gallery-character-pin');
        button.type = 'button';
        button.title = pinned ? '取消置顶角色' : '置顶角色';
        button.setAttribute('aria-label', button.title);
        button.setAttribute('aria-pressed', pinned ? 'true' : 'false');
        button.classList.toggle('active', pinned);
        button.append(createElement('i', 'fa-solid fa-thumbtack fa-fw'));
        button.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleCharacterPin(group.avatar);
        });
        return button;
    }

    function getPinnedChats(context) {
        try {
            const value = context && context.accountStorage && context.accountStorage.getItem('pinnedChats');
            if (!value) return [];
            const parsed = typeof value === 'string' ? JSON.parse(value) : value;
            return parsed && typeof parsed === 'object' ? Object.values(parsed) : [];
        } catch (error) {
            console.warn('[Freesia Gallery] Could not read native pinned chat state.', error);
            return [];
        }
    }

    function parseTimestamp(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value > 0 && value < 1000000000000 ? value * 1000 : value;
        }
        const result = Date.parse(String(value || ''));
        return Number.isFinite(result) ? result : 0;
    }

    function formatDate(value) {
        const timestamp = parseTimestamp(value);
        if (!timestamp) return '日期未知';
        return new Date(timestamp).toLocaleDateString();
    }

    function formatLongDate(value) {
        const timestamp = parseTimestamp(value);
        if (!timestamp) return '';
        return new Date(timestamp).toLocaleString();
    }

    function chatNameOf(raw) {
        const source = raw && (raw.chat_name || raw.file_id || raw.file_name);
        return String(source || '').replace(/\.jsonl$/i, '');
    }

    function isPinned(raw, pinnedChats) {
        return pinnedChats.some(function (item) {
            if (!item) return false;
            const itemName = String(item.file_name || '').replace(/\.jsonl$/i, '');
            return String(item.avatar || '') === String(raw.avatar || '')
                && String(item.group || '') === String(raw.group || '')
                && itemName === chatNameOf(raw);
        }) || !!raw.pinned;
    }

    function normaliseRecentChat(raw, context, pinnedChats) {
        const avatar = String(raw.avatar || '');
        const chatName = chatNameOf(raw);
        const character = context && Array.isArray(context.characters)
            ? context.characters.find(item => item && item.avatar === avatar)
            : null;
        const fileName = String(raw.file_name || (chatName + '.jsonl'));
        return {
            avatar: avatar,
            chatName: chatName,
            fileName: fileName,
            characterName: String(raw.char_name || (character && character.name) || avatar.replace(/\.png$/i, '') || '未命名角色'),
            thumbnail: String(raw.char_thumbnail || ''),
            preview: String(raw.mes || raw.preview_message || ''),
            timestamp: parseTimestamp(raw.last_mes),
            dateShort: String(raw.date_short || formatDate(raw.last_mes)),
            dateLong: String(raw.date_long || formatLongDate(raw.last_mes)),
            messageCount: raw.chat_items == null ? '' : String(raw.chat_items),
            fileSize: String(raw.file_size || ''),
            pinned: isPinned(raw, pinnedChats),
        };
    }

    function findNativeEntry(chat) {
        if (!state.nativeList || !chat) return null;
        const rows = state.nativeList.querySelectorAll('.recentChat');
        for (const row of rows) {
            const file = row.getAttribute('data-file') || '';
            const avatar = row.getAttribute('data-avatar') || '';
            if (file === chat.chatName && avatar === chat.avatar) return row;
        }
        return null;
    }

    function groupCharacterChats(records, context, pinnedChats) {
        const recentByAvatar = new Map();
        (Array.isArray(records) ? records : []).forEach(function (raw) {
            if (!raw || !raw.avatar || raw.group) return;
            const chat = normaliseRecentChat(raw, context, pinnedChats);
            if (!chat.chatName) return;
            if (!recentByAvatar.has(chat.avatar)) recentByAvatar.set(chat.avatar, []);
            recentByAvatar.get(chat.avatar).push(chat);
        });

        const characters = context && Array.isArray(context.characters) ? context.characters : [];
        const result = [];
        const included = new Set();

        characters.forEach(function (character) {
            if (!character || !character.avatar || character.avatar === 'none') return;
            const avatar = String(character.avatar);
            const chats = recentByAvatar.get(avatar) || [];
            chats.sort((a, b) => b.timestamp - a.timestamp);
            result.push({
                avatar: avatar,
                name: String(character.name || chats[0]?.characterName || avatar.replace(/\.png$/i, '')),
                thumbnail: chats.find(chat => chat.thumbnail)?.thumbnail || '',
                chats: chats,
                latestChat: chats[0] || null,
                lastActive: chats.reduce((latest, chat) => Math.max(latest, chat.timestamp), 0),
                pinned: chats.some(chat => chat.pinned),
                totalCount: null,
            });
            included.add(avatar);
        });

        // If context.characters is unavailable or incomplete, retain characters
        // represented by the native recent-chat API rather than dropping them.
        recentByAvatar.forEach(function (chats, avatar) {
            if (included.has(avatar)) return;
            chats.sort((a, b) => b.timestamp - a.timestamp);
            result.push({
                avatar: avatar,
                name: chats[0]?.characterName || avatar.replace(/\.png$/i, ''),
                thumbnail: chats.find(chat => chat.thumbnail)?.thumbnail || '',
                chats: chats,
                latestChat: chats[0] || null,
                lastActive: chats.reduce((latest, chat) => Math.max(latest, chat.timestamp), 0),
                pinned: chats.some(chat => chat.pinned),
                totalCount: null,
            });
        });

        result.sort(function (a, b) {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            if (a.lastActive !== b.lastActive) return b.lastActive - a.lastActive;
            return a.name.localeCompare(b.name);
        });
        result.forEach((group, index) => {
            group.hidden = index >= state.settings.collapsedDisplayed;
        });
        return result;
    }

    function groupFallbackChats() {
        if (!state.nativeList) return [];
        const records = [];
        state.nativeList.querySelectorAll('.recentChat[data-avatar]').forEach(function (row) {
            const avatar = row.getAttribute('data-avatar') || '';
            if (!avatar || row.getAttribute('data-group')) return;
            const file = row.getAttribute('data-file') || '';
            if (!file) return;
            const date = row.querySelector('.chatDate');
            const message = row.querySelector('.chatMessage');
            records.push({
                avatar: avatar,
                file_name: file + '.jsonl',
                char_name: (row.querySelector('.characterName') || {}).textContent || avatar,
                mes: message ? message.textContent : '',
                last_mes: date && (date.getAttribute('title') || date.textContent),
                chat_items: (row.querySelector('.counterBlock small') || {}).textContent || '',
                file_size: (row.querySelector('.fileSize') || {}).textContent || '',
                pinned: !!row.querySelector('.pinChat.active, .recentChatPinned'),
            });
        });
        return groupCharacterChats(records, getContext(), []);
    }

    function createAvatar(avatarKey, thumbnail, name, nativeRow) {
        const nativeAvatar = nativeRow && nativeRow.querySelector('.avatar');
        if (nativeAvatar) {
            const clone = nativeAvatar.cloneNode(true);
            clone.classList.add('freesia-gallery-avatar');
            clone.removeAttribute('id');
            clone.setAttribute('aria-hidden', 'true');
            clone.title = name;
            const clonedImage = clone.querySelector('img');
            if (clonedImage) {
                clonedImage.loading = 'lazy';
                clonedImage.decoding = 'async';
            }
            return clone;
        }

        const avatar = createElement('div', 'avatar freesia-gallery-avatar');
        avatar.title = name;
        const image = createElement('img');
        const context = getContext();
        image.src = thumbnail || (avatarKey === 'none' ? 'img/ai4.png' : (context && typeof context.getThumbnailUrl === 'function'
            ? context.getThumbnailUrl('avatar', avatarKey)
            : ''));
        image.alt = name;
        image.loading = 'lazy';
        image.decoding = 'async';
        avatar.append(image);
        return avatar;
    }

    function createNativeActions(chat) {
        const nativeRow = findNativeEntry(chat);
        const nativeActions = nativeRow && nativeRow.querySelector('.chatActions');
        const actions = createElement('div', 'chatActions');
        if (nativeActions) {
            Array.from(nativeActions.querySelectorAll('button')).filter(button => !button.classList.contains('pinChat')).forEach(function (nativeButton) {
                const clone = nativeButton.cloneNode(true);
                clone.addEventListener('click', function (event) {
                    event.preventDefault();
                    event.stopPropagation();
                    nativeButton.click();
                    scheduleRefresh(300);
                });
                actions.append(clone);
            });
            return actions;
        }

        [
            { className: 'renameChat', icon: 'fa-solid fa-pen-to-square fa-fw', title: '重命名聊天' },
            { className: 'deleteChat', icon: 'fa-solid fa-trash fa-fw', title: '删除聊天' },
        ].forEach(function (item) {
            const button = createElement('button', 'menu_button menu_button_icon ' + item.className);
            button.type = 'button';
            button.title = item.title;
            button.append(createElement('i', item.icon));
            button.disabled = true;
            actions.append(button);
        });
        return actions;
    }

    function openCharacterChat(avatar, chatName) {
        const context = getContext();
        if (!context || !Array.isArray(context.characters)) return Promise.reject(new Error('当前酒馆上下文不可用。'));
        const characterIndex = context.characters.findIndex(character => character && character.avatar === avatar);
        if (characterIndex < 0) return Promise.reject(new Error('找不到对应角色。'));

        const nativeRow = findNativeEntry({ avatar: avatar, chatName: chatName });
        if (nativeRow) {
            nativeRow.click();
            return Promise.resolve(true);
        }

        return Promise.resolve(context.selectCharacterById(characterIndex))
            .then(() => {
                if (typeof context.openCharacterChat !== 'function') throw new Error('当前酒馆未提供打开聊天的方法。');
                return context.openCharacterChat(chatName);
            })
            .then(() => true);
    }

    function reportError(message, error) {
        console.error('[Freesia Gallery]', message, error || '');
        if (window.toastr && typeof window.toastr.error === 'function') window.toastr.error(message);
    }

    function activateSurface(element, callback) {
        element.setAttribute('role', 'button');
        element.setAttribute('tabindex', '0');
        element.addEventListener('click', callback);
        element.addEventListener('keydown', function (event) {
            if (event.target !== element && event.target.closest && event.target.closest('button, a, input, select, textarea, [contenteditable="true"]')) {
                return;
            }
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                callback(event);
            }
        });
    }

    function createGalleryCard(group) {
        const latest = group.latestChat;
        const nativeRow = latest && findNativeEntry(latest);
        const card = createElement('article', 'recentChat freesia-gallery-card');
        card.dataset.avatar = group.avatar;
        card.dataset.galleryAvatar = group.avatar;

        const identity = createElement('div', 'freesia-gallery-card-identity');
        identity.append(createAvatar(group.avatar, group.thumbnail, group.name, nativeRow));
        const count = createElement('span', 'freesia-gallery-chat-count', (group.totalCount ?? group.chats.length) + ' 个聊天');
        identity.append(count);
        activateSurface(identity, function () { void openDetail(group.avatar); });

        const characterPin = createCharacterPinButton(group);

        const heading = createElement('div', 'chatNameContainer freesia-gallery-card-heading');
        const name = createElement('div', 'chatName');
        name.append(createElement('strong', 'characterName', group.name));
        heading.append(name);
        activateSurface(heading, function () { void openDetail(group.avatar); });

        const latestArea = createElement('div', 'recentChatInfo freesia-gallery-card-latest');
        const dateRow = createElement('div', 'chatNameContainer freesia-gallery-card-date-row');
        const date = createElement('small', 'chatDate', latest ? latest.dateShort : '—');
        date.title = latest ? latest.dateLong : '';
        dateRow.append(date);

        const actions = latest ? createNativeActions(latest) : createElement('div', 'chatActions');
        actions.classList.add('freesia-gallery-chat-actions');
        actions.prepend(characterPin);
        dateRow.append(actions);

        const openLatestChat = function () {
            if (!latest) return;
            openCharacterChat(group.avatar, latest.chatName).catch(error => reportError('打开最近聊天失败。', error));
        };
        if (latest) activateSurface(date, openLatestChat);

        const messageContainer = createElement('div', 'chatMessageContainer');
        const preview = createElement('div', 'chatMessage', latest ? latest.preview : '暂无最近聊天记录');
        preview.title = latest ? latest.preview : '';
        messageContainer.append(preview);
        if (latest) activateSurface(messageContainer, openLatestChat);

        const stats = createElement('div', 'chatStats');
        if (latest && latest.messageCount) {
            const counter = createElement('div', 'counterBlock');
            counter.append(createElement('i', 'fa-solid fa-comment fa-xs'));
            counter.append(createElement('small', '', latest.messageCount));
            stats.append(counter);
        }
        if (latest && latest.fileSize) stats.append(createElement('small', 'fileSize', latest.fileSize));
        if (latest && (latest.messageCount || latest.fileSize)) activateSurface(stats, openLatestChat);

        latestArea.append(dateRow, messageContainer, stats);
        card.append(identity, heading, latestArea);
        return card;
    }

    async function fetchChatCount(avatar) {
        if (state.countCache.has(avatar)) return state.countCache.get(avatar);
        if (state.countRequests.has(avatar)) return state.countRequests.get(avatar);
        const context = getContext();
        if (!context || typeof context.getRequestHeaders !== 'function') return null;

        const request = window.fetch(API_CHARACTER_CHATS, {
            method: 'POST',
            headers: context.getRequestHeaders(),
            body: JSON.stringify({ avatar_url: avatar, simple: true }),
            cache: 'no-cache',
        }).then(async response => {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            const data = await response.json();
            if (!Array.isArray(data)) throw new Error('聊天文件列表格式不正确。');
            state.countCache.set(avatar, data.length);
            return data.length;
        }).catch(error => {
            console.warn('[Freesia Gallery] Could not read total chat count for', avatar, error);
            return null;
        }).finally(() => state.countRequests.delete(avatar));

        state.countRequests.set(avatar, request);
        return request;
    }

    async function updateCardCount(card) {
        if (!card || !card.isConnected || card.dataset.countRequested === 'true') return;
        card.dataset.countRequested = 'true';
        const avatar = card.dataset.galleryAvatar;
        const count = await fetchChatCount(avatar);
        if (count === null || !card.isConnected) return;
        const label = card.querySelector('.freesia-gallery-chat-count');
        if (label) label.textContent = count + ' 个聊天';
    }

    function observeCardCounts() {
        if (state.countObserver) state.countObserver.disconnect();
        state.countObserver = null;
        if (!state.grid) return;

        const cards = Array.from(state.grid.querySelectorAll('.freesia-gallery-card:not(.freesia-gallery-collapsed)'));
        if (typeof window.IntersectionObserver === 'function') {
            state.countObserver = new window.IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (!entry.isIntersecting) return;
                    state.countObserver.unobserve(entry.target);
                    void updateCardCount(entry.target);
                });
            }, { root: document.getElementById('chat'), rootMargin: '120px' });
            cards.forEach(card => state.countObserver.observe(card));
        } else {
            cards.slice(0, 12).forEach(card => { void updateCardCount(card); });
        }
    }

    function renderPagination(total) {
        if (!state.paginationRoot) return;
        const pageSize = getGalleryPageSize();
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        state.galleryPage = Math.min(Math.max(0, state.galleryPage), pageCount - 1);
        state.paginationRoot.replaceChildren();
        state.paginationRoot.hidden = state.page !== 'gallery' || pageCount <= 1;

        if (pageCount <= 1) return;
        const previous = createElement('button', 'menu_button menu_button_icon');
        previous.type = 'button';
        previous.textContent = '‹ 上一页';
        previous.disabled = state.galleryPage <= 0;
        previous.addEventListener('click', function () {
            if (state.galleryPage <= 0) return;
            state.galleryPage -= 1;
            renderGallery(state.galleryGroups, state.source, state.lastError);
        });

        const pageLabel = createElement('small', '', '第 ' + (state.galleryPage + 1) + ' / ' + pageCount + ' 页');
        const next = createElement('button', 'menu_button menu_button_icon');
        next.type = 'button';
        next.textContent = '下一页 ›';
        next.disabled = state.galleryPage >= pageCount - 1;
        next.addEventListener('click', function () {
            if (state.galleryPage >= pageCount - 1) return;
            state.galleryPage += 1;
            renderGallery(state.galleryGroups, state.source, state.lastError);
        });
        state.paginationRoot.append(previous, pageLabel, next);
    }

    function renderGallery(groups, source, error) {
        if (!state.grid || !state.panel) return;
        state.source = source;
        state.lastError = error || null;
        state.galleryGroups = orderPinnedCharacters(groups);

        const pageSize = getGalleryPageSize();
        const pageCount = Math.max(1, Math.ceil(state.galleryGroups.length / pageSize));
        state.galleryPage = Math.min(Math.max(0, state.galleryPage), pageCount - 1);
        syncResponsiveLayoutControls();

        const start = state.galleryPage * pageSize;
        const visibleGroups = state.galleryGroups.slice(start, start + pageSize);
        const fragment = document.createDocumentFragment();
        visibleGroups.forEach(function (group, index) {
            const card = createGalleryCard(group);
            card.dataset.galleryIndex = String(start + index);
            fragment.append(card);
        });

        if (!state.galleryGroups.length) {
            fragment.append(createElement('div', 'freesia-gallery-empty', source === 'api'
                ? '还没有可展示的角色。'
                : '无法从原生角色列表中读取角色。'));
        }

        state.grid.replaceChildren(fragment);
        renderPagination(state.galleryGroups.length);

        if (state.summary) {
            state.summary.textContent = state.galleryGroups.length + ' 位角色'
                + (pageCount > 1 ? ' · 第 ' + (state.galleryPage + 1) + ' / ' + pageCount + ' 页' : '');
            state.summary.title = '使用原生最近聊天设置齿轮调整记录预览列数与每页行数；每页最多显示 ' + pageSize + ' 位角色';
        }
        observeCardCounts();
    }

    async function fetchRecentChats(context, settings, signal) {
        if (!context || typeof context.getRequestHeaders !== 'function') throw new Error('当前环境未提供酒馆请求上下文。');
        const response = await window.fetch(API_RECENT, {
            method: 'POST',
            headers: context.getRequestHeaders(),
            body: JSON.stringify({ max: settings.maxDisplayed, pinned: getPinnedChats(context) }),
            cache: 'no-cache',
            signal: signal,
        });
        if (!response.ok) throw new Error('读取最近聊天失败（HTTP ' + response.status + '）。');
        const records = await response.json();
        if (!Array.isArray(records)) throw new Error('最近聊天接口返回的数据格式不正确。');
        return records;
    }

    async function refresh() {
        if (!state.panel || !state.grid) {
            syncPanel();
            if (!state.panel || !state.grid) return false;
        }
        if (state.panel.classList.contains(NATIVE_CLASS) || state.page !== 'gallery') return false;

        const generation = ++state.generation;
        if (state.requestController) {
            try { state.requestController.abort(); } catch (error) { /* ignore */ }
        }
        state.requestController = window.AbortController ? new window.AbortController() : null;

        const context = getContext();
        state.settings = readSettings(context);
        state.countCache.clear();
        try {
            const records = await fetchRecentChats(context, state.settings, state.requestController ? state.requestController.signal : undefined);
            if (generation !== state.generation || !state.panel) return false;
            const groups = groupCharacterChats(records, context, getPinnedChats(context));
            state.galleryBaseOrder = new Map(groups.map((group, index) => [String(group.avatar || ''), index]));
            renderGallery(groups, 'api');
            return true;
        } catch (error) {
            if (error && error.name === 'AbortError') return false;
            console.warn('[Freesia Gallery] Recent chat API failed; using native DOM fallback.', error);
            if (generation !== state.generation || !state.panel) return false;
            const groups = groupFallbackChats();
            state.galleryBaseOrder = new Map(groups.map((group, index) => [String(group.avatar || ''), index]));
            renderGallery(groups, 'fallback', error);
            return groups.length > 0;
        }
    }

    function setHeader(title, backLabel, backAction) {
        if (state.title) state.title.textContent = title;
        if (state.backButton) {
            state.backButton.hidden = !backAction;
            state.backButton.title = backLabel || '';
            state.backButton.setAttribute('aria-label', backLabel || '返回');
            state.backButton.onclick = backAction || null;
        }
        if (state.viewToggle) state.viewToggle.hidden = state.page !== 'gallery';
        if (state.detailManageButton) state.detailManageButton.hidden = state.page !== 'detail';
        if (state.panel) {
            PAGE_CLASSES.forEach(name => state.panel.classList.remove(name));
            state.panel.classList.add('freesia-gallery-page-' + state.page);
        }
        if (state.paginationRoot) state.paginationRoot.hidden = state.page !== 'gallery';
    }

    function setPage(page) {
        state.page = page;
        if (page === 'gallery') {
            setHeader('记录预览', '返回记录预览', null);
            if (state.summary) state.summary.hidden = false;
            renderPagination(state.galleryGroups.length);
        } else if (page === 'detail') {
            setHeader('记录详情', '返回记录预览', () => setPage('gallery'));
            if (state.summary) state.summary.hidden = true;
        } else {
            setHeader('聊天文件', '返回记录详情', () => setPage('detail'));
            if (state.summary) state.summary.hidden = true;
        }
    }

    function toggleView() {
        if (!state.panel || state.page !== 'gallery') return false;
        state.panel.classList.toggle(NATIVE_CLASS);
        const nativeMode = state.panel.classList.contains(NATIVE_CLASS);
        if (state.title) state.title.textContent = '记录预览';
        if (state.viewToggle) {
            const label = nativeMode ? '切换到记录预览' : '切换到酒馆默认首页';
            state.viewToggle.title = label;
            state.viewToggle.setAttribute('aria-label', label);
        }
        if (state.viewToggleIcon) state.viewToggleIcon.className = 'fa-solid ' + (nativeMode ? 'fa-images' : 'fa-list') + ' fa-fw fa-lg';
        if (state.paginationRoot) state.paginationRoot.hidden = nativeMode || state.galleryGroups.length <= getGalleryPageSize();
        if (state.summary) state.summary.hidden = nativeMode;
        return !nativeMode;
    }

    function createViewToggle(header) {
        const toggle = createElement('div', 'mes_button freesia-gallery-view-toggle');
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('tabindex', '0');
        toggle.title = '切换到酒馆默认首页';
        toggle.setAttribute('aria-label', toggle.title);
        const icon = createElement('i', 'fa-solid fa-list fa-fw fa-lg');
        toggle.append(icon);
        toggle.addEventListener('click', toggleView);
        toggle.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleView();
            }
        });
        header.append(toggle);
        state.viewToggle = toggle;
        state.viewToggleIcon = icon;
    }

    function createBackButton(header) {
        const button = createElement('button', 'menu_button menu_button_icon freesia-gallery-back');
        button.type = 'button';
        button.hidden = true;
        button.append(createElement('i', 'fa-solid fa-arrow-left fa-fw'));
        const nativeTitle = header.querySelector('.recentChatsTitle');
        header.insertBefore(button, nativeTitle || header.firstChild);
        state.backButton = button;
    }

    function clearNativeSettingsPopup(dialog) {
        const target = dialog || state.settingsPopupDialog;
        if (!target) return;
        if (state.settingsPopupClickHandler) {
            target.removeEventListener('click', state.settingsPopupClickHandler, true);
        }
        target.querySelectorAll('.freesia-gallery-popup-layout-title, .freesia-gallery-popup-layout-inputs').forEach(element => element.remove());
        delete target.dataset.freesiaGalleryLayoutAttached;
        if (!dialog || state.settingsPopupDialog === target) {
            state.settingsPopupDialog = null;
            state.settingsPopupClickHandler = null;
            state.columnsSelect = null;
            state.rowsSelect = null;
        }
    }

    function attachGallerySettingsToNativePopup(dialog) {
        if (!dialog || dialog.dataset.freesiaGalleryLayoutAttached === 'true') return false;
        if (!dialog.querySelector('#maxRecentChats') || !dialog.querySelector('#collapsedRecentChats')) return false;
        const nativeInputs = dialog.querySelector('.popup-inputs');
        const popupBody = dialog.querySelector('.popup-body');
        if (!nativeInputs || !popupBody) return false;

        const title = createElement('div', 'popup-content freesia-gallery-popup-layout-title', '记录预览布局');
        const galleryInputs = createElement('div', 'popup-inputs freesia-gallery-popup-layout-inputs');

        const columnsLabel = createElement('label', 'text_label justifyCenter');
        columnsLabel.append(createElement('span', '', '每行列数（手机端最多2列）'));
        const columns = createElement('select', 'text_pole');
        columns.id = 'freesiaGalleryColumns';
        columns.setAttribute('aria-label', '每行列数');
        [2, 3, 4].forEach(value => {
            const option = createElement('option', '', value === 4 ? '4 列' : value + ' 列');
            option.value = String(value);
            columns.append(option);
        });
        columns.value = String(state.layoutSettings.columns);
        columnsLabel.append(columns);

        const rowsLabel = createElement('label', 'text_label justifyCenter');
        rowsLabel.append(createElement('span', '', '每页显示行数（1–15）'));
        const rows = createElement('select', 'text_pole');
        rows.id = 'freesiaGalleryRows';
        rows.setAttribute('aria-label', '每页显示行数');
        for (let value = 1; value <= MAX_GALLERY_ROWS; value += 1) {
            const option = createElement('option', '', value + ' 行');
            option.value = String(value);
            rows.append(option);
        }
        rows.value = String(state.layoutSettings.rows);
        rowsLabel.append(rows);

        galleryInputs.append(columnsLabel, rowsLabel);
        const popupControls = popupBody.querySelector('.popup-controls');
        const insertBefore = popupControls || null;
        popupBody.insertBefore(title, insertBefore);
        popupBody.insertBefore(galleryInputs, insertBefore);

        state.settingsPopupDialog = dialog;
        state.columnsSelect = columns;
        state.rowsSelect = rows;
        dialog.dataset.freesiaGalleryLayoutAttached = 'true';

        state.settingsPopupClickHandler = function (event) {
            const saveButton = event.target && event.target.closest
                ? event.target.closest('.popup-button-ok')
                : null;
            if (!saveButton || !dialog.contains(saveButton)) return;

            const nextColumns = parseInt(columns.value, 10);
            const nextRows = parseInt(rows.value, 10);
            if (![2, 3, 4].includes(nextColumns) || !Number.isInteger(nextRows)
                || nextRows < 1 || nextRows > MAX_GALLERY_ROWS) {
                reportError('记录预览布局设置无效，请检查列数和行数。');
                return;
            }

            state.layoutSettings = { columns: nextColumns, rows: nextRows };
            state.galleryPage = 0;
            saveGallerySettings();
            syncResponsiveLayoutControls();
            renderGallery(state.galleryGroups, state.source, state.lastError);
        };
        dialog.addEventListener('click', state.settingsPopupClickHandler, true);

        const cleanup = function () { clearNativeSettingsPopup(dialog); };
        dialog.addEventListener('close', cleanup, { once: true });
        dialog.addEventListener('cancel', cleanup, { once: true });
        syncResponsiveLayoutControls();
        return true;
    }

    function observeNativeSettingsPopups() {
        if (state.settingsPopupObserver) state.settingsPopupObserver.disconnect();
        if (!document.body || !window.MutationObserver) return;

        const inspect = function (node) {
            if (!node || node.nodeType !== 1) return;
            const closestDialog = node.closest && node.closest('dialog.popup');
            if (closestDialog) attachGallerySettingsToNativePopup(closestDialog);
            if (node.matches && node.matches('dialog.popup')) attachGallerySettingsToNativePopup(node);
            if (node.querySelectorAll) {
                node.querySelectorAll('dialog.popup').forEach(attachGallerySettingsToNativePopup);
            }
        };

        state.settingsPopupObserver = new window.MutationObserver(function (records) {
            records.forEach(record => {
                if (record.target && record.target.nodeType === 1) inspect(record.target);
                record.addedNodes.forEach(inspect);
                record.removedNodes.forEach(node => {
                    if (state.settingsPopupDialog && node === state.settingsPopupDialog) {
                        clearNativeSettingsPopup(state.settingsPopupDialog);
                    } else if (state.settingsPopupDialog && node.nodeType === 1
                        && node.contains && node.contains(state.settingsPopupDialog)) {
                        clearNativeSettingsPopup(state.settingsPopupDialog);
                    }
                });
            });
        });
        state.settingsPopupObserver.observe(document.body, { childList: true, subtree: true });
        document.querySelectorAll('dialog.popup').forEach(attachGallerySettingsToNativePopup);
    }

    function findCharacter(avatar) {
        const context = getContext();
        if (!context || !Array.isArray(context.characters)) return { context, character: null, index: -1 };
        const index = context.characters.findIndex(item => item && item.avatar === avatar);
        return { context, character: index >= 0 ? context.characters[index] : null, index };
    }

    async function loadFullCharacter(avatar) {
        let found = findCharacter(avatar);
        if (found.index < 0) throw new Error('找不到对应角色。');
        if (found.character && found.character.shallow && found.context && typeof found.context.unshallowCharacter === 'function') {
            await found.context.unshallowCharacter(String(found.index));
            found = findCharacter(avatar);
        } else if (found.character && !found.character.data && found.context && typeof found.context.getOneCharacter === 'function') {
            await found.context.getOneCharacter(avatar);
            found = findCharacter(avatar);
        }
        return found;
    }

    async function fetchCharacterChatFiles(avatar) {
        const context = getContext();
        if (!context || typeof context.getRequestHeaders !== 'function') throw new Error('当前环境未提供请求头。');
        const response = await window.fetch(API_CHAT_SEARCH, {
            method: 'POST',
            headers: context.getRequestHeaders(),
            body: JSON.stringify({ query: '', avatar_url: avatar, group_id: null }),
            cache: 'no-cache',
        });
        if (!response.ok) throw new Error('读取聊天文件失败（HTTP ' + response.status + '）。');
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('聊天文件接口返回的数据格式不正确。');
        return data.map(function (item) {
            const chatName = String(item.file_name || item.file_id || '').replace(/\.jsonl$/i, '');
            return {
                chatName: chatName,
                fileName: chatName + '.jsonl',
                fileSize: String(item.file_size || ''),
                messageCount: item.message_count == null ? '' : String(item.message_count),
                timestamp: parseTimestamp(item.last_mes),
                dateShort: formatDate(item.last_mes),
                dateLong: formatLongDate(item.last_mes),
                preview: String(item.preview_message || ''),
            };
        }).filter(item => item.chatName).sort((a, b) => b.timestamp - a.timestamp);
    }

    function showLorebook(character, context) {
        const name = String(character && (character.data?.extensions?.world || character.extensions?.world) || '').trim();
        if (!name) return '';
        const names = context && typeof context.getWorldInfoNames === 'function' ? context.getWorldInfoNames() : [];
        if (Array.isArray(names) && names.length && !names.includes(name)) return name;
        return name;
    }

    function getDetailPinnedState() {
        const context = getContext();
        const storage = context && context.accountStorage;
        if (!storage || typeof storage.getItem !== 'function') return {};
        try {
            const raw = storage.getItem(DETAIL_PINNED_CHATS_KEY);
            if (!raw) return {};
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch (error) {
            console.warn('[Freesia Gallery] Could not read detail-page pinned chats.', error);
            return {};
        }
    }

    function setDetailPinnedState(value) {
        const context = getContext();
        const storage = context && context.accountStorage;
        if (!storage || typeof storage.setItem !== 'function') return false;
        try {
            storage.setItem(DETAIL_PINNED_CHATS_KEY, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('[Freesia Gallery] Could not save detail-page pinned chats.', error);
            reportError('保存聊天置顶状态失败。', error);
            return false;
        }
    }

    function detailPinnedKey(avatar, chatName) {
        return JSON.stringify([String(avatar || ''), String(chatName || '')]);
    }

    function isDetailChatPinned(chat) {
        return !!getDetailPinnedState()[detailPinnedKey(state.selectedAvatar, chat.chatName)];
    }

    function sortDetailChats() {
        const pinned = getDetailPinnedState();
        state.detailChats.sort(function (a, b) {
            const aPinned = !!pinned[detailPinnedKey(state.selectedAvatar, a.chatName)];
            const bPinned = !!pinned[detailPinnedKey(state.selectedAvatar, b.chatName)];
            if (aPinned !== bPinned) return aPinned ? -1 : 1;
            return b.timestamp - a.timestamp;
        });
    }

    function toggleDetailChatPin(chat) {
        const pinned = getDetailPinnedState();
        const key = detailPinnedKey(state.selectedAvatar, chat.chatName);
        if (pinned[key]) delete pinned[key];
        else pinned[key] = { avatar: state.selectedAvatar, chatName: chat.chatName };
        if (!setDetailPinnedState(pinned)) return;
        sortDetailChats();
        renderDetail();
    }

    function migrateDetailChatPin(oldName, newName) {
        const pinned = getDetailPinnedState();
        const oldKey = detailPinnedKey(state.selectedAvatar, oldName);
        if (!pinned[oldKey]) return;
        delete pinned[oldKey];
        pinned[detailPinnedKey(state.selectedAvatar, newName)] = {
            avatar: state.selectedAvatar,
            chatName: newName,
        };
        setDetailPinnedState(pinned);
    }

    function removeDetailChatPin(chatName) {
        const pinned = getDetailPinnedState();
        const key = detailPinnedKey(state.selectedAvatar, chatName);
        if (!pinned[key]) return;
        delete pinned[key];
        setDetailPinnedState(pinned);
    }

    async function requestChatRename(chatName) {
        const context = getContext();
        if (context && typeof context.callGenericPopup === 'function' && context.POPUP_TYPE) {
            const value = await context.callGenericPopup('重命名聊天文件', context.POPUP_TYPE.INPUT, chatName);
            return typeof value === 'string' ? value.trim() : '';
        }
        return typeof window.prompt === 'function' ? String(window.prompt('重命名聊天文件', chatName) || '').trim() : '';
    }

    async function requestChatDelete(chatName) {
        const context = getContext();
        if (context && typeof context.callGenericPopup === 'function' && context.POPUP_TYPE) {
            return !!(await context.callGenericPopup('确定删除聊天文件「' + chatName + '」？此操作不可撤销。', context.POPUP_TYPE.CONFIRM));
        }
        return typeof window.confirm === 'function' && window.confirm('确定删除聊天文件「' + chatName + '」？此操作不可撤销。');
    }

    async function emitChatEvent(name, data) {
        const context = getContext();
        const source = context && context.eventSource;
        const types = context && (context.eventTypes || context.event_types);
        const type = types && types[name];
        if (source && typeof source.emit === 'function' && type) {
            await source.emit(type, data);
        }
    }

    async function updateCharacterChatPointer(character, chatName, context) {
        const response = await window.fetch('/api/characters/merge-attributes', {
            method: 'POST',
            headers: context.getRequestHeaders(),
            body: JSON.stringify({ avatar: character.avatar, chat: chatName }),
        });
        if (!response.ok) {
            console.warn('[Freesia Gallery] Could not update the character current-chat pointer.', response.status);
            return false;
        }
        character.chat = chatName;
        return true;
    }

    async function renameDetailChat(chat) {
        const context = getContext();
        if (!context || typeof context.getRequestHeaders !== 'function') {
            reportError('当前环境无法重命名聊天文件。');
            return;
        }
        const requestedName = await requestChatRename(chat.chatName);
        if (!requestedName || requestedName === chat.chatName) return;

        const characterIndex = Array.isArray(context.characters)
            ? context.characters.findIndex(character => character && character.avatar === state.selectedAvatar)
            : -1;
        if (characterIndex < 0) {
            reportError('找不到当前角色，无法重命名聊天文件。');
            return;
        }

        try {
            const oldName = chat.chatName;
            const body = {
                is_group: false,
                avatar_url: state.selectedAvatar,
                original_file: oldName + '.jsonl',
                renamed_file: requestedName + '.jsonl',
            };
            const response = await window.fetch('/api/chats/rename', {
                method: 'POST',
                headers: context.getRequestHeaders(),
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error('重命名请求失败（HTTP ' + response.status + '）。');
            const data = await response.json();
            if (data && data.error) throw new Error('酒馆拒绝了重命名请求。');

            const newName = String(data && data.sanitizedFileName || requestedName).replace(/\.jsonl$/i, '');
            const character = context.characters[characterIndex];
            if (character && character.chat === oldName) {
                await updateCharacterChatPointer(character, newName, context);
            }

            migrateDetailChatPin(oldName, newName);
            chat.chatName = newName;
            chat.fileName = newName + '.jsonl';
            await emitChatEvent('CHAT_RENAMED', {
                avatarId: state.selectedAvatar,
                oldFileName: body.original_file,
                newFileName: body.renamed_file,
            });
            sortDetailChats();
            renderDetail();
            scheduleRefresh(260);
            if (window.toastr && typeof window.toastr.success === 'function') window.toastr.success('聊天已重命名。');
        } catch (error) {
            reportError('重命名聊天失败。', error);
        }
    }

    async function deleteDetailChat(chat) {
        const context = getContext();
        if (!context || typeof context.getRequestHeaders !== 'function') {
            reportError('当前环境无法删除聊天文件。');
            return;
        }
        if (!(await requestChatDelete(chat.chatName))) return;

        const characterIndex = Array.isArray(context.characters)
            ? context.characters.findIndex(character => character && character.avatar === state.selectedAvatar)
            : -1;
        if (characterIndex < 0) {
            reportError('找不到当前角色，无法删除聊天文件。');
            return;
        }

        try {
            const character = context.characters[characterIndex];
            const response = await window.fetch('/api/chats/delete', {
                method: 'POST',
                headers: context.getRequestHeaders(),
                body: JSON.stringify({
                    chatfile: chat.chatName + '.jsonl',
                    avatar_url: state.selectedAvatar,
                }),
            });
            if (!response.ok) throw new Error('删除请求失败（HTTP ' + response.status + '）。');

            if (character && character.chat === chat.chatName) {
                const chatsResponse = await window.fetch(API_CHARACTER_CHATS, {
                    method: 'POST',
                    headers: context.getRequestHeaders(),
                    body: JSON.stringify({ avatar_url: state.selectedAvatar }),
                });
                if (!chatsResponse.ok) throw new Error('聊天已删除，但读取剩余聊天列表失败。');
                const remaining = Object.values(await chatsResponse.json()).filter(item => item && item.file_name);
                remaining.sort((a, b) => parseTimestamp(b.last_mes) - parseTimestamp(a.last_mes));
                const nextName = remaining.length
                    ? String(remaining[0].file_name).replace(/\.jsonl$/i, '')
                    : String(character.name || '新聊天') + ' - ' + new Date().toLocaleString();
                await updateCharacterChatPointer(character, nextName, context);
            }

            removeDetailChatPin(chat.chatName);
            state.detailChats = state.detailChats.filter(item => item.chatName !== chat.chatName);
            await emitChatEvent('CHAT_DELETED', chat.chatName);
            renderDetail();
            scheduleRefresh(260);
            if (window.toastr && typeof window.toastr.success === 'function') window.toastr.success('聊天已删除。');
        } catch (error) {
            reportError('删除聊天失败。', error);
        }
    }

    function createDetailChatActions(chat) {
        const actions = createElement('div', 'chatActions freesia-gallery-session-actions');
        const pin = createElement('button', 'menu_button menu_button_icon pinChat');
        pin.type = 'button';
        pin.title = isDetailChatPinned(chat) ? '取消置顶' : '置顶聊天';
        pin.setAttribute('aria-label', pin.title);
        pin.classList.toggle('active', isDetailChatPinned(chat));
        pin.append(createElement('i', 'fa-solid fa-thumbtack fa-fw'));
        pin.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            toggleDetailChatPin(chat);
        });

        const rename = createElement('button', 'menu_button menu_button_icon renameChat');
        rename.type = 'button';
        rename.title = '重命名聊天';
        rename.setAttribute('aria-label', rename.title);
        rename.append(createElement('i', 'fa-solid fa-pen-to-square fa-fw'));
        rename.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            void renameDetailChat(chat);
        });

        const remove = createElement('button', 'menu_button menu_button_icon deleteChat');
        remove.type = 'button';
        remove.title = '删除聊天';
        remove.setAttribute('aria-label', remove.title);
        remove.append(createElement('i', 'fa-solid fa-trash fa-fw'));
        remove.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            void deleteDetailChat(chat);
        });
        actions.append(pin, rename, remove);
        return actions;
    }

    function createNativeSessionCard(chat, label, index, variant) {
        const cardClass = variant === 'file'
            ? 'recentChat freesia-gallery-session-card freesia-gallery-file-session-card'
            : 'recentChat freesia-gallery-session-card freesia-gallery-detail-session-card';
        const card = createElement('article', cardClass);
        card.dataset.file = chat.chatName;
        card.dataset.avatar = state.selectedAvatar;
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');

        const info = createElement('div', 'recentChatInfo');
        const top = createElement('div', 'chatNameContainer');
        const name = createElement('div', 'chatName');
        name.append(createElement('strong', 'characterName', label || chat.chatName));
        const date = createElement('small', 'chatDate', chat.dateShort);
        date.title = chat.dateLong || '';
        top.append(name, date, createDetailChatActions(chat));

        const messageContainer = createElement('div', 'chatMessageContainer');
        const preview = createElement('div', 'chatMessage', chat.preview || '暂无消息预览');
        const stats = createElement('div', 'chatStats');
        if (chat.messageCount) {
            const counter = createElement('div', 'counterBlock');
            counter.append(createElement('i', 'fa-solid fa-comment fa-xs'));
            counter.append(createElement('small', '', chat.messageCount));
            stats.append(counter);
        }
        if (chat.fileSize) stats.append(createElement('small', 'fileSize', chat.fileSize));
        messageContainer.append(preview, stats);
        info.append(top, messageContainer);
        card.append(info);

        activateSurface(card, function () {
            openCharacterChat(state.selectedAvatar, chat.chatName).catch(error => reportError('打开聊天失败。', error));
        });
        return card;
    }

    function createDetailSession(chat, index) {
        return createNativeSessionCard(chat, chat.chatName, index, 'detail');
    }

    async function openDetail(avatar) {
        if (!state.panel) return false;
        state.selectedAvatar = avatar;
        state.fileSearch = '';
        if (state.detailManageButton) {
            state.detailManageButton.remove();
            state.detailManageButton = null;
        }
        state.detailCharacter = null;
        state.detailChats = [];
        setPage('detail');
        state.detailRoot.replaceChildren(createElement('div', 'freesia-gallery-empty', '正在读取角色资料与聊天文件…'));

        try {
            const found = await loadFullCharacter(avatar);
            const chats = await fetchCharacterChatFiles(avatar);
            if (!state.panel || state.selectedAvatar !== avatar) return false;
            state.detailCharacter = found.character;
            state.detailChats = chats;
            sortDetailChats();
            renderDetail();
            return true;
        } catch (error) {
            console.error('[Freesia Gallery] Could not load character details.', error);
            if (state.detailRoot) state.detailRoot.replaceChildren(createElement('div', 'freesia-gallery-empty', '角色资料读取失败：' + (error.message || '未知错误')));
            return false;
        }
    }

    function renderDetail() {
        if (!state.detailRoot || !state.detailCharacter) return;
        const character = state.detailCharacter;
        const context = getContext();
        const fragment = document.createDocumentFragment();

        const hero = createElement('section', 'freesia-gallery-detail-hero');
        const nativeRow = state.nativeList && Array.from(state.nativeList.querySelectorAll('.recentChat[data-avatar]')).find(row => row.getAttribute('data-avatar') === character.avatar);
        const avatar = createAvatar(
            character.avatar,
            context && typeof context.getThumbnailUrl === 'function' ? context.getThumbnailUrl('avatar', character.avatar) : '',
            character.name,
            nativeRow
        );
        avatar.classList.add('freesia-gallery-detail-avatar');

        const main = createElement('div', 'freesia-gallery-detail-main');
        const heading = createElement('div', 'freesia-gallery-detail-heading');
        heading.append(createElement('h2', 'freesia-gallery-detail-name', character.name || '未命名角色'));

        const lorebook = showLorebook(character, context);
        if (lorebook) heading.append(createElement('div', 'freesia-gallery-lorebook', lorebook));

        if (state.detailManageButton) state.detailManageButton.remove();
        const manage = createElement('button', 'menu_button freesia-gallery-manage');
        manage.type = 'button';
        manage.textContent = '详情/管理';
        manage.setAttribute('aria-label', '打开酒馆原生角色详情与管理');
        manage.addEventListener('click', async function (event) {
            event.preventDefault();
            event.stopPropagation();
            const found = findCharacter(character.avatar);
            if (found.index < 0 || !found.context || typeof found.context.selectCharacterById !== 'function') {
                reportError('当前环境无法打开酒馆原生角色管理界面。');
                return;
            }
            try {
                await found.context.selectCharacterById(found.index, { switchMenu: true });
            } catch (error) {
                reportError('打开酒馆原生角色管理界面失败。', error);
            }
        });
        const descriptionHeader = createElement('div', 'freesia-gallery-description-header');
        const descriptionLabel = createElement('div', 'freesia-gallery-description-label', '角色描述');
        descriptionHeader.append(descriptionLabel, manage);
        state.detailManageButton = manage;
        const description = createElement('textarea', 'text_pole freesia-gallery-description');
        description.readOnly = true;
        description.rows = 3;
        description.setAttribute('aria-label', '角色描述');
        description.spellcheck = false;
        description.value = String(character.description || character.data?.description || '暂无角色描述');

        const nativeDescription = document.getElementById('description_textarea');
        if (nativeDescription && nativeDescription.className) {
            // Reuse native classes for theme styling, but never inherit its fixed height or inline sizing.
            description.className = nativeDescription.className + ' freesia-gallery-description';
        }

        main.append(heading, descriptionHeader, description);
        hero.append(avatar, main);
        fragment.append(hero);

        const chatHeader = createElement('div', 'freesia-gallery-detail-chat-header');
        chatHeader.append(createElement('strong', 'freesia-gallery-detail-chat-count', state.detailChats.length + ' 个聊天'));
        const filesButton = createElement('button', 'menu_button menu_button_icon');
        filesButton.type = 'button';
        filesButton.textContent = '聊天文件';
        filesButton.addEventListener('click', function () { setPage('files'); renderFiles(); });
        chatHeader.append(filesButton);
        fragment.append(chatHeader);

        const sessions = createElement('div', 'recentChatList freesia-gallery-session-list');
        if (!state.detailChats.length) {
            sessions.append(createElement('div', 'freesia-gallery-empty', '这个角色还没有聊天文件。'));
        } else {
            state.detailChats.slice(0, 3).forEach((chat, index) => sessions.append(createDetailSession(chat, index)));
        }
        fragment.append(sessions);
        state.detailRoot.replaceChildren(fragment);
    }

    function renderFiles() {
        if (!state.filesRoot) return;
        const fragment = document.createDocumentFragment();
        const toolbar = createElement('div', 'freesia-gallery-files-toolbar');
        const search = createElement('input', 'text_pole freesia-gallery-file-search');
        search.type = 'search';
        search.placeholder = '搜索聊天文件名称或内容';
        search.value = state.fileSearch;
        const count = createElement('small', '', state.detailChats.length + ' 个聊天文件');
        toolbar.append(search, count);
        fragment.append(toolbar);

        const list = createElement('div', 'recentChatList freesia-gallery-file-list');
        const query = state.fileSearch.trim().toLocaleLowerCase();
        const filtered = state.detailChats.filter(chat => !query
            || chat.chatName.toLocaleLowerCase().includes(query)
            || chat.preview.toLocaleLowerCase().includes(query));

        if (!filtered.length) {
            list.append(createElement('div', 'freesia-gallery-empty', query ? '没有匹配的聊天文件。' : '没有聊天文件。'));
        } else {
            filtered.forEach(function (chat) {
                list.append(createNativeSessionCard(chat, chat.chatName, -1, 'file'));
            });
        }

        fragment.append(list);
        state.filesRoot.replaceChildren(fragment);
        const input = state.filesRoot.querySelector('.freesia-gallery-file-search');
        if (input) {
            input.addEventListener('input', function () {
                state.fileSearch = input.value;
                const cursor = input.selectionStart;
                renderFiles();
                const nextInput = state.filesRoot.querySelector('.freesia-gallery-file-search');
                if (nextInput) {
                    nextInput.focus();
                    try { nextInput.setSelectionRange(cursor, cursor); } catch (error) { /* ignore */ }
                }
            });
        }
    }

    function scheduleRefresh(delay) {
        if (!state.started || !state.panel || state.page !== 'gallery') return;
        if (state.refreshTimer) window.clearTimeout(state.refreshTimer);
        state.refreshTimer = window.setTimeout(function () {
            state.refreshTimer = null;
            void refresh();
        }, Number.isFinite(delay) ? delay : 180);
    }

    function syncAvatarCompatibility() {
        if (!state.panel) return;
        state.panel.classList.toggle('freesia-gallery-disable-avatar-pseudo', state.avatarCompatibility.disablePseudo);
        state.panel.classList.toggle('freesia-gallery-disable-avatar-border-image', state.avatarCompatibility.disableBorderImage);
    }

    function mountPanel(panel) {
        const welcomeRecent = panel.querySelector('.welcomeRecent');
        if (!welcomeRecent) return;
        const nativeList = Array.from(welcomeRecent.children).find(element =>
            element.classList.contains('recentChatList') && !element.classList.contains(GRID_CLASS)
        );
        if (!nativeList) return;

        state.panel = panel;
        state.welcomeRecent = welcomeRecent;
        state.nativeList = nativeList;
        state.nativeTitle = panel.querySelector('.recentChatsTitle');
        state.originalTitle = state.nativeTitle ? state.nativeTitle.textContent : 'Recent Chats';
        state.layoutSettings = readGallerySettings(getContext());
        state.galleryPage = 0;
        state.resizeHandler = function () {
            syncResponsiveLayoutControls();
            if (state.page === 'gallery' && state.grid && state.panel && !state.panel.classList.contains(NATIVE_CLASS)) {
                renderGallery(state.galleryGroups, state.source, state.lastError);
            }
        };
        window.addEventListener('resize', state.resizeHandler, { passive: true });

        const grid = createElement('div', 'recentChatList ' + GRID_CLASS);
        grid.setAttribute('role', 'list');
        nativeList.insertAdjacentElement('afterend', grid);
        state.grid = grid;

        const pagination = createElement('div', 'freesia-gallery-pagination');
        grid.insertAdjacentElement('afterend', pagination);
        state.paginationRoot = pagination;

        const detailRoot = createElement('section', 'freesia-gallery-detail');
        const filesRoot = createElement('section', 'freesia-gallery-files');
        welcomeRecent.append(detailRoot, filesRoot);
        state.detailRoot = detailRoot;
        state.filesRoot = filesRoot;

        const headerTitle = panel.querySelector('.welcomeHeaderTitle');
        if (headerTitle) {
            const titleGroup = createElement('div', 'freesia-gallery-title-group');
            const galleryTitle = createElement('span', 'freesia-gallery-title', '记录预览');
            titleGroup.append(galleryTitle);
            headerTitle.insertBefore(titleGroup, headerTitle.firstChild);
            state.titleGroup = titleGroup;
            state.title = galleryTitle;
            createViewToggle(headerTitle);
        }

        const header = panel.querySelector('.welcomeHeader');
        if (header) {
            createBackButton(header);
            const summary = createElement('small', 'freesia-gallery-summary', '');
            const shortcuts = header.querySelector('.welcomeShortcuts');
            header.insertBefore(summary, shortcuts || null);
            state.summary = summary;
        }

        panel.classList.add(ACTIVE_CLASS);
        syncAvatarCompatibility();
        state.page = 'gallery';
        setPage('gallery');
        void refresh();
    }

    function unmountPanel() {
        if (state.resizeHandler) {
            window.removeEventListener('resize', state.resizeHandler);
            state.resizeHandler = null;
        }
        if (state.requestController) {
            try { state.requestController.abort(); } catch (error) { /* ignore */ }
        }
        state.generation += 1;
        if (state.countObserver) state.countObserver.disconnect();
        state.countObserver = null;

        if (state.grid) state.grid.remove();
        if (state.paginationRoot) state.paginationRoot.remove();
        if (state.detailRoot) state.detailRoot.remove();
        if (state.filesRoot) state.filesRoot.remove();
        if (state.viewToggle) state.viewToggle.remove();
        if (state.backButton) state.backButton.remove();
        if (state.summary) state.summary.remove();
        if (state.titleGroup) state.titleGroup.remove();
        if (state.panel) {
            state.panel.classList.remove(ACTIVE_CLASS, NATIVE_CLASS, ...PAGE_CLASSES,
                'freesia-gallery-disable-avatar-pseudo', 'freesia-gallery-disable-avatar-border-image');
        }

        state.panel = null;
        state.welcomeRecent = null;
        state.nativeList = null;
        state.grid = null;
        state.paginationRoot = null;
        state.detailRoot = null;
        state.filesRoot = null;
        state.title = null;
        state.titleGroup = null;
        state.detailManageButton = null;
        state.nativeTitle = null;
        state.originalTitle = null;
        state.backButton = null;
        state.viewToggle = null;
        state.viewToggleIcon = null;
        state.summary = null;
        state.page = 'gallery';
        state.galleryPage = 0;
        state.galleryGroups = [];
        state.galleryBaseOrder = new Map();
        state.selectedAvatar = '';
        state.detailCharacter = null;
        state.detailChats = [];
        state.fileSearch = '';
    }

    function syncPanel() {
        if (typeof document === 'undefined') return;
        if (!state.enabled) {
            if (state.panel) unmountPanel();
            return;
        }
        const panel = document.querySelector('#chat > .welcomePanel') || document.querySelector('#chat .welcomePanel');
        if (panel && panel !== state.panel) {
            unmountPanel();
            mountPanel(panel);
        } else if (!panel && state.panel) {
            unmountPanel();
        }
    }

    function observeChatRoot() {
        if (typeof document === 'undefined' || !window.MutationObserver) return;
        const chatRoot = document.getElementById('chat');
        if (!chatRoot) {
            if (document.body) {
                state.waitObserver = new window.MutationObserver(function () {
                    if (document.getElementById('chat')) {
                        state.waitObserver.disconnect();
                        state.waitObserver = null;
                        observeChatRoot();
                    }
                });
                state.waitObserver.observe(document.body, { childList: true, subtree: true });
            }
            return;
        }

        state.observer = new window.MutationObserver(function (records) {
            const changed = records.some(record => {
                const nodes = Array.from(record.addedNodes).concat(Array.from(record.removedNodes));
                return nodes.some(node => node.nodeType === 1
                    && (node.matches('.welcomePanel') || (node.querySelector && node.querySelector('.welcomePanel'))));
            });
            if (changed) syncPanel();
        });
        state.observer.observe(chatRoot, { childList: true });
        syncPanel();
    }

    function subscribeContextEvents() {
        const context = getContext();
        const source = context && context.eventSource;
        const types = context && (context.eventTypes || context.event_types);
        if (!source || typeof source.on !== 'function' || !types) return;

        ['APP_READY', 'CHAT_CHANGED', 'CHAT_RENAMED', 'CHAT_DELETED', 'CHARACTER_RENAMED', 'CHARACTER_DELETED'].forEach(name => {
            const type = types[name];
            if (!type) return;
            const handler = () => scheduleRefresh(220);
            source.on(type, handler);
            state.eventCleanups.push(function () {
                if (typeof source.off === 'function') source.off(type, handler);
                else if (typeof source.removeListener === 'function') source.removeListener(type, handler);
            });
        });
    }

    function start() {
        if (state.started || !state.enabled || typeof document === 'undefined') return window[GLOBAL_NAME];
        state.started = true;
        if (!document.getElementById(STYLE_ID)) {
            const style = createElement('style');
            style.id = STYLE_ID;
            style.textContent = CSS;
            (document.head || document.documentElement).append(style);
        }
        observeChatRoot();
        observeNativeSettingsPopups();
        subscribeContextEvents();
        return window[GLOBAL_NAME];
    }

    function stop() {
        state.started = false;
        if (state.settingsPopupObserver) state.settingsPopupObserver.disconnect();
        state.settingsPopupObserver = null;
        clearNativeSettingsPopup();
        if (state.observer) state.observer.disconnect();
        if (state.waitObserver) state.waitObserver.disconnect();
        state.observer = null;
        state.waitObserver = null;
        if (state.refreshTimer) window.clearTimeout(state.refreshTimer);
        state.refreshTimer = null;
        state.eventCleanups.forEach(cleanup => {
            try { cleanup(); } catch (error) { /* ignore */ }
        });
        state.eventCleanups = [];
        unmountPanel();
        const style = document.getElementById(STYLE_ID);
        if (style) style.remove();
        return true;
    }

    const api = {
        version: VERSION,
        start: start,
        stop: stop,
        refresh: refresh,
        toggleView: toggleView,
        setEnabled: function (enabled) {
            const next = Boolean(enabled);
            if (state.enabled === next) return next;
            state.enabled = next;
            if (!next) stop();
            else start();
            return next;
        },
        setAvatarCompatibility: function (settings) {
            if (!settings || typeof settings !== 'object') return false;
            if (settings.disablePseudo !== undefined) state.avatarCompatibility.disablePseudo = Boolean(settings.disablePseudo);
            if (settings.disableBorderImage !== undefined) state.avatarCompatibility.disableBorderImage = Boolean(settings.disableBorderImage);
            syncAvatarCompatibility();
            return Object.assign({}, state.avatarCompatibility);
        },
        openDetail: openDetail,
        openFiles: function () { setPage('files'); renderFiles(); },
        getSettings: function () { return Object.assign({}, state.settings); },
        getLayoutSettings: function () { return Object.assign({}, state.layoutSettings); },
        setLayoutSettings: function (settings) {
            if (!settings || typeof settings !== 'object') return false;
            const columns = parseInt(settings.columns, 10);
            const rows = parseInt(settings.rows, 10);
            if (settings.columns !== undefined && ![2, 3, 4].includes(columns)) return false;
            if (settings.rows !== undefined && (!Number.isInteger(rows) || rows < 1 || rows > MAX_GALLERY_ROWS)) return false;
            state.layoutSettings = {
                columns: settings.columns === undefined ? state.layoutSettings.columns : columns,
                rows: settings.rows === undefined ? state.layoutSettings.rows : rows,
            };
            syncResponsiveLayoutControls();
            if (state.columnsSelect) state.columnsSelect.value = String(state.layoutSettings.columns);
            if (state.rowsSelect) state.rowsSelect.value = String(state.layoutSettings.rows);
            state.galleryPage = 0;
            saveGallerySettings();
            renderGallery(state.galleryGroups, state.source, state.lastError);
            return Object.assign({}, state.layoutSettings);
        },
        getPage: function () { return state.page; },
        _groupCharacterChats: groupCharacterChats,
        _groupFallbackChats: groupFallbackChats,
    };

    window[GLOBAL_NAME] = api;
    return api;
}