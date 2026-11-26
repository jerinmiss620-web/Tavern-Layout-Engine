(function () {
    'use strict';

    const GLOBAL_NAME = 'FreesiaGalleryHome';
    const VERSION = '0.1.0-TEST';
    const STYLE_ID = 'freesia-gallery-home-style';
    const ACTIVE_CLASS = 'freesia-gallery-active';
    const NATIVE_CLASS = 'freesia-gallery-native';
    const LIST_CLASS = 'freesia-gallery-list';
    const API_PATH = '/api/chats/recent';

    const previous = window[GLOBAL_NAME];
    if (previous && typeof previous.stop === 'function') {
        try { previous.stop(); } catch (error) { console.warn('[Freesia Gallery] Previous instance cleanup failed.', error); }
    }

    const state = {
        started: false,
        panel: null,
        nativeList: null,
        galleryList: null,
        title: null,
        originalTitle: null,
        summary: null,
        toggle: null,
        toggleIcon: null,
        observer: null,
        waitObserver: null,
        refreshTimer: null,
        requestController: null,
        generation: 0,
        eventCleanups: [],
        source: 'none',
        lastError: null,
    };

    const CSS = [
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .welcomeRecent > .recentChatList:not(.' + LIST_CLASS + ') { display: none !important; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); align-items: stretch; gap: 8px; width: 100%; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .recentChat { min-width: 0; min-height: 106px; align-items: center; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .recentChatInfo { min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatNameContainer { min-width: 0; align-items: center; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatName { min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatMessageContainer { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatMessage { width: 100%; min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatStats { align-self: flex-end; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-summary { display: inline-block; margin-inline-start: 8px; font-size: 0.78em; font-weight: 400; opacity: 0.72; white-space: nowrap; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-view-toggle { cursor: pointer; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .' + LIST_CLASS + ' { display: none; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .welcomeRecent > .recentChatList:not(.' + LIST_CLASS + ') { display: flex; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .freesia-gallery-summary { display: none; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session { opacity: 0.72; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .freesia-gallery-card { cursor: pointer; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .freesia-gallery-card:focus-visible { outline: 2px solid var(--SmartThemeQuoteColor, currentColor); outline-offset: 2px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .freesia-gallery-empty { grid-column: 1 / -1; }',
        '@media screen and (max-width: 640px) {',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .recentChat { gap: 7px; padding: 6px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatNameContainer { flex-wrap: wrap; gap: 2px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatDate { white-space: nowrap; font-size: 0.76em; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatMessageContainer { gap: 3px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatMessage { font-size: 0.82em; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-summary { font-size: 0.72em; margin-inline-start: 5px; }',
        '}',
        '@media screen and (max-width: 360px) {',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' { grid-template-columns: minmax(0, 1fr); }',
        '}',
    ].join('\n');

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

    function getPinnedChats(context) {
        try {
            const stored = context && context.accountStorage && context.accountStorage.getItem('pinnedChats');
            if (!stored) return [];
            const parsed = typeof stored === 'string' ? JSON.parse(stored) : stored;
            return parsed && typeof parsed === 'object' ? Object.values(parsed) : [];
        } catch (error) {
            console.warn('[Freesia Gallery] Could not read pinned chat state.', error);
            return [];
        }
    }

    function parseTimestamp(value) {
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value > 0 && value < 1000000000000 ? value * 1000 : value;
        }
        const parsed = Date.parse(String(value || ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function normaliseChatName(raw) {
        const value = String((raw && (raw.file_id || raw.file_name)) || '');
        return value.replace(/\.jsonl$/i, '');
    }

    function isPinned(raw, pinnedChats) {
        const fileName = String((raw && raw.file_name) || (normaliseChatName(raw) + '.jsonl'));
        return pinnedChats.some(function (item) {
            return item
                && item.avatar === raw.avatar
                && (item.file_name === fileName || item.file_name === normaliseChatName(raw));
        });
    }

    function truncatePreview(value, maxLength) {
        const text = String(value || '').replace(/\s+/g, ' ').trim();
        if (!text) return '暂无消息预览';
        return text.length > maxLength ? text.slice(0, maxLength - 1) + '…' : text;
    }

    function findExistingThumbnail(avatar) {
        if (typeof document === 'undefined') return '';
        const items = document.querySelectorAll('.welcomeRecent .recentChat[data-avatar]');
        for (const item of items) {
            if (item.getAttribute('data-avatar') !== avatar) continue;
            const image = item.querySelector('.avatar img');
            if (image) return image.currentSrc || image.src || image.getAttribute('src') || '';
        }
        return '';
    }

    function groupChats(records, context, pinnedChats) {
        const characters = context && Array.isArray(context.characters) ? context.characters : [];
        const characterByAvatar = new Map();
        characters.forEach(function (character) {
            if (character && character.avatar) characterByAvatar.set(character.avatar, character);
        });

        const pins = Array.isArray(pinnedChats) ? pinnedChats : [];
        const grouped = new Map();

        (Array.isArray(records) ? records : []).forEach(function (raw) {
            if (!raw || !raw.avatar || raw.group) return;

            const character = characterByAvatar.get(raw.avatar);
            if (!character) return;

            const chatName = normaliseChatName(raw);
            if (!chatName) return;

            const timestamp = parseTimestamp(raw.last_mes);
            const chat = {
                chatName: chatName,
                fileName: String(raw.file_name || (chatName + '.jsonl')),
                timestamp: timestamp,
                preview: truncatePreview(raw.mes, 150),
                pinned: isPinned(raw, pins),
            };

            let group = grouped.get(raw.avatar);
            if (!group) {
                let thumbnail = '';
                try {
                    if (context && typeof context.getThumbnailUrl === 'function') {
                        thumbnail = context.getThumbnailUrl('avatar', raw.avatar) || '';
                    }
                } catch (error) {
                    console.warn('[Freesia Gallery] Avatar thumbnail lookup failed.', error);
                }

                group = {
                    avatar: raw.avatar,
                    name: String(character.name || raw.char_name || raw.avatar),
                    thumbnail: thumbnail || findExistingThumbnail(raw.avatar),
                    chats: [],
                    latestChat: null,
                    lastActive: 0,
                    pinned: false,
                };
                grouped.set(raw.avatar, group);
            }

            group.chats.push(chat);
            if (timestamp > group.lastActive) group.lastActive = timestamp;
            if (chat.pinned) group.pinned = true;
        });

        const result = Array.from(grouped.values());
        result.forEach(function (group) {
            group.chats.sort(function (a, b) {
                return b.timestamp - a.timestamp;
            });
            group.latestChat = group.chats[0] || null;
        });

        result.sort(function (a, b) {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.lastActive - a.lastActive;
        });

        return result;
    }

    function groupFallbackChats(panel) {
        const recent = panel && panel.querySelector('.welcomeRecent');
        const nativeList = recent && Array.from(recent.children).find(function (element) {
            return element.classList.contains('recentChatList') && !element.classList.contains(LIST_CLASS);
        });
        if (!nativeList) return [];

        const grouped = new Map();
        const items = Array.from(nativeList.querySelectorAll('.recentChat'));
        items.forEach(function (item, index) {
            const avatar = item.getAttribute('data-avatar') || '';
            const groupId = item.getAttribute('data-group') || '';
            if (!avatar || groupId) return;

            const nameElement = item.querySelector('.characterName');
            const dateElement = item.querySelector('.chatDate');
            const messageElement = item.querySelector('.chatMessage');
            const chatName = item.getAttribute('data-file') || '';
            if (!chatName) return;

            const chat = {
                chatName: chatName,
                fileName: chatName,
                timestamp: parseTimestamp(dateElement && (dateElement.getAttribute('title') || dateElement.textContent)) || (items.length - index),
                preview: truncatePreview(messageElement && messageElement.textContent, 150),
                pinned: !!item.querySelector('.recentChatPinned, .pinChat.active'),
                nativeElement: item,
            };

            let group = grouped.get(avatar);
            if (!group) {
                const image = item.querySelector('.avatar img');
                group = {
                    avatar: avatar,
                    name: String((nameElement && nameElement.textContent) || avatar),
                    thumbnail: image ? (image.currentSrc || image.src || image.getAttribute('src') || '') : '',
                    chats: [],
                    latestChat: null,
                    lastActive: 0,
                    pinned: false,
                };
                grouped.set(avatar, group);
            }

            group.chats.push(chat);
            if (chat.timestamp > group.lastActive) group.lastActive = chat.timestamp;
            if (chat.pinned) group.pinned = true;
        });

        const result = Array.from(grouped.values());
        result.forEach(function (group) {
            group.chats.sort(function (a, b) {
                return b.timestamp - a.timestamp;
            });
            group.latestChat = group.chats[0] || null;
        });
        result.sort(function (a, b) {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.lastActive - a.lastActive;
        });
        return result;
    }

    function createElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined && text !== null) element.textContent = String(text);
        return element;
    }

    function formatDate(timestamp) {
        if (!timestamp) return '日期未知';
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return '日期未知';
        return date.toLocaleDateString();
    }

    function formatLongDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
    }

    function createCard(group) {
        const card = createElement('div', 'recentChat freesia-gallery-card');
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', group.name + '，共 ' + group.chats.length + ' 个聊天，点击打开最近聊天');
        card.dataset.avatar = group.avatar;
        card.title = '点击打开最近聊天：' + (group.latestChat ? group.latestChat.chatName : '');

        if (group.pinned) {
            const pinned = createElement('div', 'recentChatPinned');
            const pinIcon = createElement('i', 'fa-solid fa-thumbtack fa-fw fa-xs');
            pinIcon.title = '该角色有置顶聊天';
            pinned.append(pinIcon);
            card.append(pinned);
        }

        const avatar = createElement('div', 'avatar');
        avatar.title = '[Character] ' + group.name + '\nFile: ' + group.avatar;
        if (group.thumbnail) {
            const image = createElement('img');
            image.src = group.thumbnail;
            image.alt = group.name;
            image.loading = 'lazy';
            avatar.append(image);
        } else {
            avatar.append(createElement('i', 'fa-solid fa-user'));
        }

        const info = createElement('div', 'recentChatInfo');
        const nameContainer = createElement('div', 'chatNameContainer');
        const name = createElement('div', 'chatName');
        name.append(createElement('strong', 'characterName', group.name));
        if (group.latestChat) {
            name.append(createElement('span', 'freesia-gallery-session', ' · ' + group.latestChat.chatName));
        }
        const date = createElement('small', 'chatDate', group.latestChat ? formatDate(group.latestChat.timestamp) : '—');
        date.title = group.latestChat ? formatLongDate(group.latestChat.timestamp) : '';
        nameContainer.append(name, date);

        const messageContainer = createElement('div', 'chatMessageContainer');
        const message = createElement('div', 'chatMessage', group.latestChat ? group.latestChat.preview : '暂无聊天记录');
        message.title = group.latestChat ? group.latestChat.preview : '';
        const stats = createElement('div', 'chatStats');
        const counter = createElement('div', 'counterBlock');
        counter.append(
            createElement('i', 'fa-solid fa-comment fa-xs'),
            createElement('small', '', String(group.chats.length))
        );
        stats.append(counter, createElement('small', 'fileSize', '个聊天'));
        messageContainer.append(message, stats);

        info.append(nameContainer, messageContainer);
        card.append(avatar, info);

        card.addEventListener('click', function () {
            void openLatestChat(group);
        });
        card.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                void openLatestChat(group);
            }
        });

        return card;
    }

    async function openLatestChat(group) {
        if (!group || !group.latestChat) return;

        try {
            const context = getContext();
            if (context && Array.isArray(context.characters)
                && typeof context.selectCharacterById === 'function'
                && typeof context.openCharacterChat === 'function') {
                const characterId = context.characters.findIndex(function (character) {
                    return character && character.avatar === group.avatar;
                });
                if (characterId < 0) throw new Error('找不到对应角色卡：' + group.name);

                await context.selectCharacterById(characterId);
                if (typeof context.saveSettingsDebounced === 'function') {
                    context.saveSettingsDebounced();
                }

                const currentChatId = typeof context.getCurrentChatId === 'function'
                    ? context.getCurrentChatId()
                    : undefined;
                if (currentChatId !== group.latestChat.chatName) {
                    await context.openCharacterChat(group.latestChat.chatName);
                }
                return;
            }

            const nativeElement = group.latestChat.nativeElement
                || (state.nativeList && Array.from(state.nativeList.querySelectorAll('.recentChat[data-avatar]')).find(function (item) {
                    return item.getAttribute('data-avatar') === group.avatar
                        && item.getAttribute('data-file') === group.latestChat.chatName;
                }));

            if (nativeElement) {
                nativeElement.click();
                return;
            }

            throw new Error('当前环境没有可用的原生聊天跳转接口。');
        } catch (error) {
            console.error('[Freesia Gallery] Failed to open recent chat.', error);
            if (window.toastr && typeof window.toastr.error === 'function') {
                window.toastr.error('打开聊天失败：' + (error && error.message ? error.message : '请检查控制台'));
            }
        }
    }

    function renderEmpty(message) {
        const empty = createElement('div', 'noRecentChat freesia-gallery-empty', message);
        state.galleryList.replaceChildren(empty);
    }

    function render(groups, source, error) {
        if (!state.galleryList || !state.panel) return;

        state.source = source;
        state.lastError = error || null;
        const fragment = document.createDocumentFragment();
        let chatCount = 0;

        groups.forEach(function (group) {
            chatCount += group.chats.length;
            fragment.append(createCard(group));
        });

        if (groups.length === 0) {
            const emptyText = source === 'api'
                ? '暂时没有可展示的角色聊天记录'
                : '原生最近聊天列表中没有可展示的角色聊天记录';
            fragment.append(createElement('div', 'noRecentChat freesia-gallery-empty', emptyText));
        }

        state.galleryList.replaceChildren(fragment);
        if (state.summary) {
            state.summary.textContent = groups.length + ' 位角色 · ' + chatCount + ' 个聊天';
            state.summary.title = source === 'api'
                ? '从酒馆聊天列表接口读取的角色聊天记录'
                : '当前环境无法读取完整聊天列表，仅使用原生最近聊天列表中的记录';
        }
    }

    function renderLoading() {
        if (!state.galleryList) return;
        renderEmpty('正在整理角色聊天…');
    }

    async function fetchAllChats(context, signal) {
        if (!context || typeof context.getRequestHeaders !== 'function') {
            throw new Error('当前环境未提供酒馆请求上下文。');
        }

        const response = await fetch(API_PATH, {
            method: 'POST',
            headers: context.getRequestHeaders(),
            body: JSON.stringify({ pinned: getPinnedChats(context) }),
            cache: 'no-cache',
            signal: signal,
        });

        if (!response.ok) {
            throw new Error('读取聊天列表失败（HTTP ' + response.status + '）。');
        }

        const records = await response.json();
        if (!Array.isArray(records)) {
            throw new Error('聊天列表接口返回的数据格式不正确。');
        }
        return records;
    }

    async function refresh() {
        if (!state.panel || !state.galleryList) {
            syncPanel();
            if (!state.panel || !state.galleryList) return false;
        }
        if (state.panel.classList.contains(NATIVE_CLASS)) return false;

        const generation = ++state.generation;
        if (state.requestController) {
            try { state.requestController.abort(); } catch (error) { /* ignore */ }
        }
        const Controller = window.AbortController;
        state.requestController = Controller ? new Controller() : null;

        const context = getContext();
        try {
            const records = await fetchAllChats(context, state.requestController ? state.requestController.signal : undefined);
            if (generation !== state.generation || !state.panel) return false;
            const groups = groupChats(records, context, getPinnedChats(context));
            render(groups, 'api');
            return true;
        } catch (error) {
            if (error && error.name === 'AbortError') return false;
            console.warn('[Freesia Gallery] API loading failed; falling back to native recent chats.', error);
            if (generation !== state.generation || !state.panel) return false;
            const fallbackGroups = groupFallbackChats(state.panel);
            render(fallbackGroups, 'fallback', error);
            return fallbackGroups.length > 0;
        }
    }

    function updateView() {
        if (!state.panel) return;
        const nativeMode = state.panel.classList.contains(NATIVE_CLASS);

        if (state.title) {
            state.title.textContent = nativeMode ? state.originalTitle : '角色画廊';
        }
        if (state.toggle) {
            const label = nativeMode ? '切换到角色画廊' : '切换到原生最近聊天';
            state.toggle.title = label;
            state.toggle.setAttribute('aria-label', label);
        }
        if (state.toggleIcon) {
            state.toggleIcon.className = 'fa-solid ' + (nativeMode ? 'fa-images' : 'fa-list') + ' fa-fw fa-lg';
        }
    }

    function toggleView() {
        if (!state.panel) return false;
        state.panel.classList.toggle(NATIVE_CLASS);
        updateView();
        return !state.panel.classList.contains(NATIVE_CLASS);
    }

    function createToggle(header) {
        const toggle = createElement('div', 'mes_button freesia-gallery-view-toggle');
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('tabindex', '0');
        toggle.title = '切换到原生最近聊天';
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
        state.toggle = toggle;
        state.toggleIcon = icon;
    }

    function mountPanel(panel) {
        const welcomeRecent = panel.querySelector('.welcomeRecent');
        if (!welcomeRecent) return;

        const nativeList = Array.from(welcomeRecent.children).find(function (element) {
            return element.classList.contains('recentChatList') && !element.classList.contains(LIST_CLASS);
        });
        if (!nativeList) return;

        state.panel = panel;
        state.nativeList = nativeList;
        state.title = panel.querySelector('.recentChatsTitle');
        state.originalTitle = state.title ? state.title.textContent : 'Recent Chats';

        const galleryList = createElement('div', 'recentChatList ' + LIST_CLASS);
        galleryList.setAttribute('role', 'list');
        nativeList.insertAdjacentElement('afterend', galleryList);
        state.galleryList = galleryList;

        if (state.title) {
            const summary = createElement('small', 'freesia-gallery-summary', '');
            state.title.insertAdjacentElement('afterend', summary);
            state.summary = summary;
        }

        const header = panel.querySelector('.welcomeHeaderTitle');
        if (header) createToggle(header);

        panel.classList.add(ACTIVE_CLASS);
        updateView();
        renderLoading();
        void refresh();
    }

    function unmountPanel() {
        if (state.requestController) {
            try { state.requestController.abort(); } catch (error) { /* ignore */ }
        }
        state.generation += 1;

        if (state.galleryList) state.galleryList.remove();
        if (state.toggle) state.toggle.remove();
        if (state.summary) state.summary.remove();

        if (state.title && state.originalTitle !== null) {
            state.title.textContent = state.originalTitle;
        }
        if (state.panel) {
            state.panel.classList.remove(ACTIVE_CLASS, NATIVE_CLASS);
        }

        state.panel = null;
        state.nativeList = null;
        state.galleryList = null;
        state.title = null;
        state.originalTitle = null;
        state.summary = null;
        state.toggle = null;
        state.toggleIcon = null;
    }

    function syncPanel() {
        if (typeof document === 'undefined') return;
        const panel = document.querySelector('#chat > .welcomePanel')
            || document.querySelector('#chat .welcomePanel');

        if (panel && panel !== state.panel) {
            unmountPanel();
            mountPanel(panel);
        } else if (!panel && state.panel) {
            unmountPanel();
        }
    }

    function scheduleRefresh() {
        if (!state.started || !state.panel) return;
        if (state.refreshTimer) window.clearTimeout(state.refreshTimer);
        state.refreshTimer = window.setTimeout(function () {
            state.refreshTimer = null;
            void refresh();
        }, 180);
    }

    function observeChatRoot() {
        if (typeof document === 'undefined' || !window.MutationObserver) return;
        const chatRoot = document.getElementById('chat');

        if (!chatRoot) {
            if (document.body) {
                state.waitObserver = new MutationObserver(function () {
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

        state.observer = new MutationObserver(function (records) {
            const changed = records.some(function (record) {
                const nodes = Array.from(record.addedNodes).concat(Array.from(record.removedNodes));
                return nodes.some(function (node) {
                    return node.nodeType === 1
                        && (node.matches('.welcomePanel') || (node.querySelector && node.querySelector('.welcomePanel')));
                });
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

        ['APP_READY', 'CHAT_CHANGED', 'CHAT_RENAMED', 'CHARACTER_RENAMED'].forEach(function (name) {
            const type = types[name];
            if (!type) return;
            const handler = scheduleRefresh;
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

        state.eventCleanups.forEach(function (cleanup) {
            try { cleanup(); } catch (error) { /* ignore */ }
        });
        state.eventCleanups = [];

        unmountPanel();
        if (typeof document !== 'undefined') {
            const style = document.getElementById(STYLE_ID);
            if (style) style.remove();
        }
        return true;
    }

    const api = {
        version: VERSION,
        start: start,
        stop: stop,
        refresh: refresh,
        toggleView: toggleView,
        _groupChats: groupChats,
        _groupFallbackChats: groupFallbackChats,
    };

    window[GLOBAL_NAME] = api;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', start, { once: true });
        } else {
            start();
        }
    }
})();