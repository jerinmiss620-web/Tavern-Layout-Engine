(function () {
    'use strict';

    const GLOBAL_NAME = 'FreesiaGalleryHome';
    const VERSION = '0.2.0-TEST';
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

    const previous = window[GLOBAL_NAME];
    if (previous && typeof previous.stop === 'function') {
        try { previous.stop(); } catch (error) { console.warn('[Freesia Gallery] Previous instance cleanup failed.', error); }
    }

    const state = {
        started: false,
        panel: null,
        welcomeRecent: null,
        nativeList: null,
        grid: null,
        detailRoot: null,
        filesRoot: null,
        title: null,
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
        selectedAvatar: '',
        detailCharacter: null,
        detailChats: [],
        fileSearch: '',
        countCache: new Map(),
        countRequests: new Map(),
        settings: { maxDisplayed: DEFAULT_MAX_DISPLAYED, collapsedDisplayed: DEFAULT_COLLAPSED_DISPLAYED },
        source: 'none',
        lastError: null,
    };

    const CSS = [
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .welcomeRecent > .recentChatList:not(.' + GRID_CLASS + ') { display: none !important; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + GRID_CLASS + ' { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); align-items: start; gap: 24px; width: 100%; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card { display: flex; flex-direction: column; align-items: stretch; min-width: 0; width: 100%; padding: 0; margin: 0; border: 0; background: transparent; box-shadow: none; cursor: default; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-identity { display: flex; flex-direction: column; gap: 10px; min-width: 0; cursor: pointer; outline-offset: 3px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-identity > .avatar { display: block; width: 100% !important; height: auto !important; aspect-ratio: 3 / 4; min-width: 0; min-height: 0; flex: none; overflow: hidden; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-identity > .avatar img { display: block; width: 100% !important; height: 100% !important; object-fit: cover; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; min-width: 0; padding-inline: 2px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-name { min-width: 0; overflow-wrap: anywhere; font-size: 1.12em; font-weight: 500; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-chat-count { flex: 0 0 auto; white-space: nowrap; font-size: 0.9em; opacity: 0.88; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-latest { display: flex; flex-direction: column; gap: 5px; min-width: 0; margin-top: 4px; padding: 0 2px; cursor: pointer; outline-offset: 3px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-latest-head { display: flex; align-items: center; justify-content: space-between; gap: 7px; min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-date { flex: 0 1 auto; min-width: 0; font-size: 0.82em; opacity: 0.78; white-space: nowrap; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card .chatActions { display: flex; flex: 0 0 auto; align-items: center; gap: 3px; margin-inline-start: auto; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card .chatActions > button { flex: 0 0 auto; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-preview { display: -webkit-box; min-width: 0; overflow: hidden; white-space: normal; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; font-size: 0.9em; line-height: 1.55; opacity: 0.9; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-stats { display: flex; align-items: center; justify-content: flex-end; gap: 8px; font-size: 0.76em; opacity: 0.68; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card.freesia-gallery-collapsed { display: none !important; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-show-more { grid-column: 1 / -1; justify-self: center; margin: 8px auto; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-summary { display: inline-block; margin-inline-start: 8px; font-size: 0.78em; opacity: 0.7; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-view-toggle { cursor: pointer; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .' + GRID_CLASS + ', #chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .freesia-gallery-detail, #chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .freesia-gallery-files { display: none !important; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .welcomeRecent > .recentChatList:not(.' + GRID_CLASS + ') { display: flex !important; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-page-gallery .freesia-gallery-detail, #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-page-gallery .freesia-gallery-files { display: none; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.freesia-gallery-page-detail .' + GRID_CLASS + ', #chat .welcomePanel.' + ACTIVE_CLASS + '.freesia-gallery-page-files .' + GRID_CLASS + ' { display: none; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.freesia-gallery-page-detail .freesia-gallery-files, #chat .welcomePanel.' + ACTIVE_CLASS + '.freesia-gallery-page-files .freesia-gallery-detail { display: none; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.freesia-gallery-page-detail .freesia-gallery-detail, #chat .welcomePanel.' + ACTIVE_CLASS + '.freesia-gallery-page-files .freesia-gallery-files { display: block; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-subpage-header { display: flex; align-items: center; gap: 10px; min-width: 0; margin-bottom: 16px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-back { flex: 0 0 auto; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-hero { display: grid; grid-template-columns: minmax(180px, 262px) minmax(0, 1fr); gap: 28px; align-items: stretch; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-avatar { display: block; width: 100% !important; height: auto !important; aspect-ratio: 3 / 4; min-width: 0; overflow: hidden; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-avatar img { display: block; width: 100% !important; height: 100% !important; object-fit: cover; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-main { display: flex; flex-direction: column; min-width: 0; gap: 12px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-heading { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 16px; min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-name { min-width: 0; margin: 0; font-size: 1.5em; font-weight: 500; overflow-wrap: anywhere; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-lorebook { min-width: 0; font-size: 0.9em; opacity: 0.76; overflow-wrap: anywhere; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-manage { flex: 0 0 auto; margin-inline-start: auto; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-description { flex: 1 1 auto; min-height: 180px; max-height: 360px; overflow: hidden; padding: 18px; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.65; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-description-label { display: block; margin-bottom: 8px; font-size: 0.82em; opacity: 0.68; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-chat-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 20px 0 10px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-chat-count { font-size: 1.05em; font-weight: 500; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-list { display: flex; flex-direction: column; gap: 12px; min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-card { display: flex; flex-direction: column; gap: 8px; min-width: 0; padding: 16px 18px; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); cursor: pointer; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-card.is-latest { border-inline-start: 4px solid var(--SmartThemeQuoteColor); }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-title { min-width: 0; font-weight: 500; overflow-wrap: anywhere; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-date { flex: 0 0 auto; font-size: 0.82em; opacity: 0.75; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-preview { display: -webkit-box; overflow: hidden; white-space: normal; overflow-wrap: anywhere; -webkit-box-orient: vertical; -webkit-line-clamp: 3; line-clamp: 3; line-height: 1.55; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-stats { display: flex; justify-content: flex-end; gap: 10px; font-size: 0.78em; opacity: 0.72; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-files-toolbar { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-file-search { flex: 1 1 auto; min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-file-list { display: flex; flex-direction: column; gap: 8px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-file-row { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 12px 14px; border: 1px solid var(--SmartThemeBorderColor); background: var(--SmartThemeBlurTintColor); cursor: pointer; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-empty { padding: 24px 12px; text-align: center; opacity: 0.7; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-identity:focus-visible, #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-latest:focus-visible, #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-card:focus-visible, #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-file-row:focus-visible { outline: 2px solid var(--SmartThemeQuoteColor, currentColor); outline-offset: 3px; }',
        '@media screen and (max-width: 1100px) {',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + GRID_CLASS + ' { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }',
        '}',
        '@media screen and (max-width: 820px) {',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + GRID_CLASS + ' { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 12px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-hero { grid-template-columns: minmax(112px, 34%) minmax(0, 1fr); gap: 14px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-description { min-height: 150px; max-height: 260px; padding: 12px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-name { font-size: 1.2em; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-card { padding: 12px; }',
        '}',
        '@media screen and (max-width: 420px) {',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + GRID_CLASS + ' { gap: 14px 9px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-heading { align-items: flex-start; flex-direction: column; gap: 2px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-name { font-size: 1em; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card-latest-head { align-items: flex-start; flex-direction: column; gap: 4px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card .chatActions { margin-inline-start: 0; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-hero { grid-template-columns: 104px minmax(0, 1fr); gap: 10px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-manage { margin-inline-start: 0; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-description { grid-column: 1 / -1; min-height: 120px; max-height: 220px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-detail-chat-header { margin-top: 14px; }',
        '}',
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
        const grouped = new Map();
        (Array.isArray(records) ? records : []).forEach(function (raw) {
            if (!raw || !raw.avatar || raw.group) return;
            const chat = normaliseRecentChat(raw, context, pinnedChats);
            if (!chat.chatName) return;
            const character = context && Array.isArray(context.characters)
                ? context.characters.find(item => item && item.avatar === chat.avatar)
                : null;
            const key = chat.avatar;
            let group = grouped.get(key);
            if (!group) {
                group = {
                    avatar: chat.avatar,
                    name: character && character.name ? character.name : chat.characterName,
                    thumbnail: chat.thumbnail,
                    chats: [],
                    latestChat: null,
                    lastActive: 0,
                    pinned: false,
                    totalCount: null,
                };
                grouped.set(key, group);
            }
            group.chats.push(chat);
            group.lastActive = Math.max(group.lastActive, chat.timestamp);
            group.pinned = group.pinned || chat.pinned;
            if (!group.thumbnail && chat.thumbnail) group.thumbnail = chat.thumbnail;
        });

        const result = Array.from(grouped.values());
        result.forEach(function (group) {
            group.chats.sort((a, b) => b.timestamp - a.timestamp);
            group.latestChat = group.chats[0] || null;
        });
        result.sort(function (a, b) {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.lastActive - a.lastActive;
        });
        result.forEach((group, index) => {
            group.hidden = index >= state.settings.collapsedDisplayed;
        });
        return result;
    }

    function groupFallbackChats() {
        if (!state.nativeList) return [];
        const grouped = new Map();
        state.nativeList.querySelectorAll('.recentChat[data-avatar]').forEach(function (row) {
            const avatar = row.getAttribute('data-avatar') || '';
            if (!avatar || row.getAttribute('data-group')) return;
            const file = row.getAttribute('data-file') || '';
            if (!file) return;
            const date = row.querySelector('.chatDate');
            const message = row.querySelector('.chatMessage');
            const stats = row.querySelector('.chatStats');
            const raw = {
                avatar: avatar,
                file_name: file + '.jsonl',
                char_name: (row.querySelector('.characterName') || {}).textContent || avatar,
                mes: message ? message.textContent : '',
                last_mes: date && (date.getAttribute('title') || date.textContent),
                chat_items: (row.querySelector('.counterBlock small') || {}).textContent || '',
                file_size: (row.querySelector('.fileSize') || {}).textContent || '',
                pinned: !!row.querySelector('.pinChat.active, .recentChatPinned'),
            };
            const chat = normaliseRecentChat(raw, null, []);
            const key = avatar;
            let group = grouped.get(key);
            if (!group) {
                const image = row.querySelector('.avatar img');
                group = {
                    avatar: avatar,
                    name: chat.characterName,
                    thumbnail: image ? image.src : '',
                    chats: [],
                    latestChat: null,
                    lastActive: 0,
                    pinned: false,
                    totalCount: null,
                };
                grouped.set(key, group);
            }
            group.chats.push(chat);
            group.lastActive = Math.max(group.lastActive, chat.timestamp);
            group.pinned = group.pinned || chat.pinned;
        });

        const result = Array.from(grouped.values());
        result.forEach(group => {
            group.chats.sort((a, b) => b.timestamp - a.timestamp);
            group.latestChat = group.chats[0] || null;
        });
        result.sort((a, b) => {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.lastActive - a.lastActive;
        });
        result.forEach((group, index) => { group.hidden = index >= state.settings.collapsedDisplayed; });
        return result;
    }

    function createAvatar(avatarKey, thumbnail, name, nativeRow) {
        const nativeAvatar = nativeRow && nativeRow.querySelector('.avatar');
        if (nativeAvatar) {
            const clone = nativeAvatar.cloneNode(true);
            clone.removeAttribute('id');
            clone.setAttribute('aria-hidden', 'true');
            clone.title = name;
            return clone;
        }

        const avatar = createElement('div', 'avatar');
        avatar.title = name;
        const image = createElement('img');
        const context = getContext();
        image.src = thumbnail || (context && typeof context.getThumbnailUrl === 'function'
            ? context.getThumbnailUrl('avatar', avatarKey)
            : '');
        image.alt = name;
        image.loading = 'lazy';
        avatar.append(image);
        return avatar;
    }

    function createNativeActions(chat) {
        const nativeRow = findNativeEntry(chat);
        const nativeActions = nativeRow && nativeRow.querySelector('.chatActions');
        const actions = createElement('div', 'chatActions');
        if (nativeActions) {
            Array.from(nativeActions.querySelectorAll('button')).forEach(function (nativeButton) {
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
            { className: 'pinChat', icon: 'fa-solid fa-thumbtack fa-fw', title: '置顶聊天' },
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

        const heading = createElement('div', 'freesia-gallery-card-heading');
        heading.append(createElement('strong', 'freesia-gallery-card-name characterName', group.name));
        const count = createElement('span', 'freesia-gallery-chat-count', (group.totalCount ?? group.chats.length) + ' 个聊天 ›');
        heading.append(count);
        identity.append(heading);
        activateSurface(identity, function () { void openDetail(group.avatar); });

        const latestArea = createElement('div', 'freesia-gallery-card-latest');
        const top = createElement('div', 'freesia-gallery-card-latest-head');
        const date = createElement('small', 'freesia-gallery-card-date chatDate', latest ? latest.dateShort : '—');
        date.title = latest ? latest.dateLong : '';
        top.append(date, latest ? createNativeActions(latest) : createElement('span'));
        const preview = createElement('div', 'freesia-gallery-card-preview chatMessage', latest ? latest.preview : '暂无聊天记录');
        preview.title = latest ? latest.preview : '';
        const stats = createElement('div', 'freesia-gallery-card-stats chatStats');
        if (latest && latest.messageCount) stats.append(createElement('span', 'counterBlock', latest.messageCount + ' 条消息'));
        if (latest && latest.fileSize) stats.append(createElement('span', 'fileSize', latest.fileSize));
        latestArea.append(top, preview, stats);
        if (latest) activateSurface(latestArea, function (event) {
            if (event && event.target && event.target.closest && event.target.closest('button')) return;
            openCharacterChat(group.avatar, latest.chatName).catch(error => reportError('打开最近聊天失败。', error));
        });

        card.append(identity, latestArea);
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
        if (label) label.textContent = count + ' 个聊天 ›';
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

    function renderGallery(groups, source, error) {
        if (!state.grid || !state.panel) return;
        state.source = source;
        state.lastError = error || null;

        const fragment = document.createDocumentFragment();
        groups.forEach(function (group, index) {
            const card = createGalleryCard(group);
            if (group.hidden && !state.expandedAll) card.classList.add('freesia-gallery-collapsed');
            card.dataset.galleryIndex = String(index);
            fragment.append(card);
        });

        if (!groups.length) {
            fragment.append(createElement('div', 'freesia-gallery-empty', source === 'api'
                ? '还没有可展示的角色聊天记录。'
                : '无法从原生最近聊天列表中读取角色。'));
        }

        if (groups.length > state.settings.collapsedDisplayed) {
            const button = createElement('button', 'menu_button menu_button_icon freesia-gallery-show-more');
            button.type = 'button';
            button.textContent = state.expandedAll
                ? '收起角色'
                : '显示全部角色（' + groups.length + '）';
            button.addEventListener('click', function () {
                state.expandedAll = !state.expandedAll;
                renderGallery(groups, source, error);
            });
            fragment.append(button);
        }

        state.grid.replaceChildren(fragment);
        if (state.summary) {
            state.summary.textContent = groups.length + ' 位角色 · 最多读取 ' + state.settings.maxDisplayed + ' 条最近聊天';
            state.summary.title = '沿用酒馆原生 Recent Chats Settings';
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
        try {
            const records = await fetchRecentChats(context, state.settings, state.requestController ? state.requestController.signal : undefined);
            if (generation !== state.generation || !state.panel) return false;
            const groups = groupCharacterChats(records, context, getPinnedChats(context));
            renderGallery(groups, 'api');
            return true;
        } catch (error) {
            if (error && error.name === 'AbortError') return false;
            console.warn('[Freesia Gallery] Recent chat API failed; using native DOM fallback.', error);
            if (generation !== state.generation || !state.panel) return false;
            const groups = groupFallbackChats();
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
        if (state.panel) {
            PAGE_CLASSES.forEach(name => state.panel.classList.remove(name));
            state.panel.classList.add('freesia-gallery-page-' + state.page);
        }
    }

    function setPage(page) {
        state.page = page;
        if (page === 'gallery') {
            setHeader('角色画廊', '返回角色画廊', null);
            if (state.summary) state.summary.hidden = false;
        } else if (page === 'detail') {
            setHeader('角色详情', '返回角色画廊', () => setPage('gallery'));
            if (state.summary) state.summary.hidden = true;
        } else {
            setHeader('聊天文件', '返回角色详情', () => setPage('detail'));
            if (state.summary) state.summary.hidden = true;
        }
    }

    function toggleView() {
        if (!state.panel || state.page !== 'gallery') return false;
        state.panel.classList.toggle(NATIVE_CLASS);
        const nativeMode = state.panel.classList.contains(NATIVE_CLASS);
        if (state.title) state.title.textContent = nativeMode ? state.originalTitle : '角色画廊';
        if (state.viewToggle) {
            const label = nativeMode ? '切换到角色画廊' : '切换到原生最近聊天';
            state.viewToggle.title = label;
            state.viewToggle.setAttribute('aria-label', label);
        }
        if (state.viewToggleIcon) state.viewToggleIcon.className = 'fa-solid ' + (nativeMode ? 'fa-images' : 'fa-list') + ' fa-fw fa-lg';
        return !nativeMode;
    }

    function createViewToggle(header) {
        const toggle = createElement('div', 'mes_button freesia-gallery-view-toggle');
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('tabindex', '0');
        toggle.title = '切换到原生最近聊天';
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
        header.insertBefore(button, state.title || header.firstChild);
        state.backButton = button;
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

    function createDetailSession(chat, index) {
        const card = createElement('article', 'freesia-gallery-session-card' + (index === 0 ? ' is-latest' : ''));
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        const top = createElement('div', 'freesia-gallery-session-top');
        top.append(
            createElement('strong', 'freesia-gallery-session-title', index === 0 ? '最新聊天 · ' + chat.chatName : chat.chatName),
            createElement('small', 'freesia-gallery-session-date', chat.dateShort)
        );
        const preview = createElement('div', 'freesia-gallery-session-preview', chat.preview || '暂无消息预览');
        const stats = createElement('div', 'freesia-gallery-session-stats');
        if (chat.messageCount) stats.append(createElement('span', '', chat.messageCount + ' 条消息'));
        if (chat.fileSize) stats.append(createElement('span', '', chat.fileSize));
        card.append(top, preview, stats);
        activateSurface(card, function () {
            openCharacterChat(state.selectedAvatar, chat.chatName).catch(error => reportError('打开聊天失败。', error));
        });
        return card;
    }

    async function openDetail(avatar) {
        if (!state.panel) return false;
        state.selectedAvatar = avatar;
        state.fileSearch = '';
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
        if (lorebook) heading.append(createElement('div', 'freesia-gallery-lorebook', "Char's lorebook · " + lorebook));

        const manage = createElement('button', 'menu_button menu_button_icon freesia-gallery-manage');
        manage.type = 'button';
        manage.textContent = '详情/管理  ›';
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
        heading.append(manage);

        const description = createElement('div', 'freesia-gallery-description');
        description.append(createElement('span', 'freesia-gallery-description-label', '角色描述 · 只读'));
        description.append(document.createTextNode(String(character.description || character.data?.description || '暂无角色描述')));

        main.append(heading, description);
        hero.append(avatar, main);
        fragment.append(hero);

        const chatHeader = createElement('div', 'freesia-gallery-detail-chat-header');
        chatHeader.append(createElement('strong', 'freesia-gallery-detail-chat-count', state.detailChats.length + ' 个聊天'));
        const filesButton = createElement('button', 'menu_button menu_button_icon');
        filesButton.type = 'button';
        filesButton.textContent = '聊天文件  ›';
        filesButton.addEventListener('click', function () { setPage('files'); renderFiles(); });
        chatHeader.append(filesButton);
        fragment.append(chatHeader);

        const sessions = createElement('div', 'freesia-gallery-session-list');
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

        const list = createElement('div', 'freesia-gallery-file-list');
        const query = state.fileSearch.trim().toLocaleLowerCase();
        const filtered = state.detailChats.filter(chat => !query
            || chat.chatName.toLocaleLowerCase().includes(query)
            || chat.preview.toLocaleLowerCase().includes(query));

        if (!filtered.length) {
            list.append(createElement('div', 'freesia-gallery-empty', query ? '没有匹配的聊天文件。' : '没有聊天文件。'));
        } else {
            filtered.forEach(function (chat) {
                const row = createElement('article', 'freesia-gallery-file-row');
                row.setAttribute('role', 'button');
                row.setAttribute('tabindex', '0');
                const top = createElement('div', 'freesia-gallery-session-top');
                top.append(
                    createElement('strong', 'freesia-gallery-session-title', chat.chatName),
                    createElement('small', 'freesia-gallery-session-date', chat.dateShort)
                );
                const preview = createElement('div', 'freesia-gallery-session-preview', chat.preview || '暂无消息预览');
                const stats = createElement('div', 'freesia-gallery-session-stats');
                if (chat.messageCount) stats.append(createElement('span', '', chat.messageCount + ' 条消息'));
                if (chat.fileSize) stats.append(createElement('span', '', chat.fileSize));
                row.append(top, preview, stats);
                activateSurface(row, function () {
                    openCharacterChat(state.selectedAvatar, chat.chatName).catch(error => reportError('打开聊天失败。', error));
                });
                list.append(row);
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
        state.title = panel.querySelector('.recentChatsTitle');
        state.originalTitle = state.title ? state.title.textContent : 'Recent Chats';

        const grid = createElement('div', 'recentChatList ' + GRID_CLASS);
        grid.setAttribute('role', 'list');
        nativeList.insertAdjacentElement('afterend', grid);
        state.grid = grid;

        const detailRoot = createElement('section', 'freesia-gallery-detail');
        const filesRoot = createElement('section', 'freesia-gallery-files');
        welcomeRecent.append(detailRoot, filesRoot);
        state.detailRoot = detailRoot;
        state.filesRoot = filesRoot;

        if (state.title) {
            const summary = createElement('small', 'freesia-gallery-summary', '');
            state.title.insertAdjacentElement('afterend', summary);
            state.summary = summary;
        }

        const headerTitle = panel.querySelector('.welcomeHeaderTitle');
        if (headerTitle) createViewToggle(headerTitle);
        const header = panel.querySelector('.welcomeHeader');
        if (header) createBackButton(header);

        panel.classList.add(ACTIVE_CLASS);
        state.page = 'gallery';
        setPage('gallery');
        void refresh();
    }

    function unmountPanel() {
        if (state.requestController) {
            try { state.requestController.abort(); } catch (error) { /* ignore */ }
        }
        state.generation += 1;
        if (state.countObserver) state.countObserver.disconnect();
        state.countObserver = null;

        if (state.grid) state.grid.remove();
        if (state.detailRoot) state.detailRoot.remove();
        if (state.filesRoot) state.filesRoot.remove();
        if (state.viewToggle) state.viewToggle.remove();
        if (state.backButton) state.backButton.remove();
        if (state.summary) state.summary.remove();
        if (state.title && state.originalTitle !== null) state.title.textContent = state.originalTitle;
        if (state.panel) {
            state.panel.classList.remove(ACTIVE_CLASS, NATIVE_CLASS, ...PAGE_CLASSES);
        }

        state.panel = null;
        state.welcomeRecent = null;
        state.nativeList = null;
        state.grid = null;
        state.detailRoot = null;
        state.filesRoot = null;
        state.title = null;
        state.originalTitle = null;
        state.backButton = null;
        state.viewToggle = null;
        state.viewToggleIcon = null;
        state.summary = null;
        state.page = 'gallery';
        state.selectedAvatar = '';
        state.detailCharacter = null;
        state.detailChats = [];
        state.fileSearch = '';
    }

    function syncPanel() {
        if (typeof document === 'undefined') return;
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
        if (state.started || typeof document === 'undefined') return window[GLOBAL_NAME];
        state.started = true;
        if (!document.getElementById(STYLE_ID)) {
            const style = createElement('style');
            style.id = STYLE_ID;
            style.textContent = CSS;
            (document.head || document.documentElement).append(style);
        }
        observeChatRoot();
        subscribeContextEvents();
        return window[GLOBAL_NAME];
    }

    function stop() {
        state.started = false;
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
        openDetail: openDetail,
        openFiles: function () { setPage('files'); renderFiles(); },
        getSettings: function () { return Object.assign({}, state.settings); },
        getPage: function () { return state.page; },
        _groupCharacterChats: groupCharacterChats,
        _groupFallbackChats: groupFallbackChats,
    };

    window[GLOBAL_NAME] = api;
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
        else start();
    }
})();