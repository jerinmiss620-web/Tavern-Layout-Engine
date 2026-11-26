(function () {
    'use strict';

    const GLOBAL_NAME = 'FreesiaGalleryHome';
    const VERSION = '0.1.1-TEST';
    const STYLE_ID = 'freesia-gallery-home-style';
    const ACTIVE_CLASS = 'freesia-gallery-active';
    const NATIVE_CLASS = 'freesia-gallery-native';
    const LIST_CLASS = 'freesia-gallery-list';
    const SHOW_MORE_CLASS = 'freesia-gallery-show-more';
    const API_PATH = '/api/chats/recent';
    const DEFAULT_MAX_DISPLAYED = 15;
    const DEFAULT_COLLAPSED_DISPLAYED = 3;

    const previous = window[GLOBAL_NAME];
    if (previous && typeof previous.stop === 'function') {
        try { previous.stop(); } catch (error) { console.warn('[Freesia Gallery] Previous instance cleanup failed.', error); }
    }

    const state = {
        started: false, panel: null, nativeList: null, galleryList: null,
        title: null, originalTitle: null, summary: null, toggle: null,
        toggleIcon: null, observer: null, waitObserver: null, refreshTimer: null,
        requestController: null, generation: 0, eventCleanups: [],
        expandedGroups: new Set(), expandedAll: false, source: 'none',
        lastError: null,
        settings: { maxDisplayed: DEFAULT_MAX_DISPLAYED, collapsedDisplayed: DEFAULT_COLLAPSED_DISPLAYED },
    };

    const CSS = [
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .welcomeRecent > .recentChatList:not(.' + LIST_CLASS + ') { display: none !important; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr)); align-items: stretch; gap: 12px; width: 100%; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .recentChat.freesia-gallery-card { display: grid; grid-template-columns: 136px minmax(0, 1fr); align-items: stretch; gap: 12px; min-width: 0; min-height: 190px; padding: 12px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .freesia-gallery-card > .avatar { width: 136px; height: 160px; min-width: 0; min-height: 0; flex: 0 0 136px; align-self: stretch; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .freesia-gallery-card > .avatar img { display: block; width: 100%; height: 100%; object-fit: cover; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .recentChatInfo { min-width: 0; width: 100%; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatNameContainer { min-width: 0; flex-wrap: wrap; align-items: center; gap: 5px 8px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatName { min-width: 0; white-space: normal; overflow-wrap: anywhere; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatActions { flex: 0 0 auto; margin-inline-start: auto; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatMessageContainer { display: flex; flex-direction: column; align-items: stretch; gap: 7px; min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatMessage { width: 100%; min-width: 0; white-space: normal; overflow-wrap: anywhere; -webkit-line-clamp: 4; line-clamp: 4; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatStats { align-self: flex-end; flex-wrap: wrap; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-chat-count { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-summary { display: inline-block; margin-inline-start: 8px; font-size: 0.78em; font-weight: 400; opacity: 0.72; white-space: normal; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-view-toggle { cursor: pointer; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .' + LIST_CLASS + ', #chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .freesia-gallery-show-more { display: none !important; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .welcomeRecent > .recentChatList:not(.' + LIST_CLASS + ') { display: flex !important; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + '.' + NATIVE_CLASS + ' .freesia-gallery-summary { display: none; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-list { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 6px; min-width: 0; margin-top: 8px; padding-top: 10px; border-top: 1px solid var(--SmartThemeBorderColor); }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-row { display: flex; align-items: center; min-width: 0; padding: 8px; gap: 9px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-row > .avatar { width: 48px; height: 48px; flex: 0 0 48px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-row > .avatar img { width: 100%; height: 100%; object-fit: cover; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-row .recentChatInfo { min-width: 0; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-row .chatNameContainer { flex-wrap: wrap; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-row .chatMessage { -webkit-line-clamp: 2; line-clamp: 2; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-card:focus-visible, #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-session-row:focus-visible { outline: 2px solid var(--SmartThemeQuoteColor, currentColor); outline-offset: 2px; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-show-more { justify-self: center; grid-column: 1 / -1; }',
        '#chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .noRecentChat { grid-column: 1 / -1; }',
        '@media screen and (max-width: 820px) {',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' { display: flex; flex-direction: column; gap: 7px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .recentChat.freesia-gallery-card { grid-template-columns: 82px minmax(0, 1fr); min-height: 0; padding: 8px; gap: 9px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .freesia-gallery-card > .avatar { width: 82px; height: 104px; flex-basis: 82px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatNameContainer { align-items: flex-start; gap: 4px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatDate { white-space: nowrap; font-size: 0.78em; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatActions { margin-inline-start: 0; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .chatMessage { -webkit-line-clamp: 3; line-clamp: 3; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .freesia-gallery-summary { font-size: 0.74em; margin-inline-start: 5px; }',
        '}',
        '@media screen and (max-width: 390px) {',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .recentChat.freesia-gallery-card { grid-template-columns: 68px minmax(0, 1fr); gap: 7px; padding: 7px; }',
        '  #chat .welcomePanel.' + ACTIVE_CLASS + ' .' + LIST_CLASS + ' .freesia-gallery-card > .avatar { width: 68px; height: 90px; flex-basis: 68px; }',
        '}',
    ].join('\n');

    function getContext() {
        try {
            return window.SillyTavern && typeof window.SillyTavern.getContext === 'function' ? window.SillyTavern.getContext() : null;
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
            console.warn('[Freesia Gallery] Could not read native recent chat settings; using defaults.', error);
            return defaults;
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
        if (typeof value === 'number' && Number.isFinite(value)) return value > 0 && value < 1000000000000 ? value * 1000 : value;
        const parsed = Date.parse(String(value || ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function chatNameOf(raw) {
        return String((raw && (raw.chat_name || raw.file_id || raw.file_name)) || '').replace(/\.jsonl$/i, '');
    }

    function isPinned(raw, pinnedChats) {
        return pinnedChats.some(function (item) {
            if (!item) return false;
            return item.avatar === (raw.avatar || '')
                && item.group === (raw.group || '')
                && (item.file_name === raw.file_name || item.file_name === chatNameOf(raw) || item.file_name === chatNameOf(raw) + '.jsonl');
        }) || !!raw.pinned;
    }

    function formatDate(timestamp) {
        if (!timestamp) return '日期未知';
        const date = new Date(timestamp);
        return Number.isNaN(date.getTime()) ? '日期未知' : date.toLocaleDateString();
    }

    function formatLongDate(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
    }

    function findNativeEntry(chat) {
        if (!state.nativeList || !chat) return null;
        for (const row of state.nativeList.querySelectorAll('.recentChat')) {
            if ((row.getAttribute('data-file') || '') !== chat.chatName) continue;
            if (chat.isGroup ? (row.getAttribute('data-group') || '') === chat.groupId : (row.getAttribute('data-avatar') || '') === chat.avatar) return row;
        }
        return null;
    }

    function normaliseChat(raw, context, pinnedChats, nativeElement) {
        const chatName = chatNameOf(raw);
        const timestamp = parseTimestamp(raw.last_mes);
        const avatar = String(raw.avatar || '');
        const groupId = String(raw.group || '');
        const character = avatar && context && Array.isArray(context.characters) ? context.characters.find(item => item && item.avatar === avatar) : null;
        const group = groupId && context && Array.isArray(context.groups) ? context.groups.find(item => item && item.id === groupId) : null;
        let thumbnail = '';
        try {
            if (character && context && typeof context.getThumbnailUrl === 'function') thumbnail = context.getThumbnailUrl('avatar', avatar) || '';
        } catch (error) {
            console.warn('[Freesia Gallery] Avatar thumbnail lookup failed.', error);
        }

        return {
            key: groupId ? 'group:' + groupId : 'character:' + avatar,
            chatName: chatName,
            fileName: String(raw.file_name || (chatName + '.jsonl')),
            avatar: avatar,
            groupId: groupId,
            isGroup: !!groupId,
            name: String((character && character.name) || (group && group.name) || raw.char_name || avatar || groupId),
            thumbnail: thumbnail,
            preview: String(raw.mes || ''),
            timestamp: timestamp,
            dateShort: String(raw.date_short || formatDate(timestamp)),
            dateLong: String(raw.date_long || formatLongDate(timestamp)),
            messageCount: raw.chat_items == null ? '' : String(raw.chat_items),
            fileSize: String(raw.file_size || ''),
            pinned: isPinned(raw, pinnedChats),
            nativeElement: nativeElement || null,
        };
    }

    function groupChats(records, context, pinnedChats) {
        const grouped = new Map();
        (Array.isArray(records) ? records : []).forEach(function (raw) {
            if (!raw || (!raw.avatar && !raw.group)) return;
            const chatName = chatNameOf(raw);
            if (!chatName) return;
            const isGroup = !!raw.group;
            const nativeElement = findNativeEntry({ chatName, avatar: String(raw.avatar || ''), groupId: String(raw.group || ''), isGroup });
            const chat = normaliseChat(raw, context, pinnedChats, nativeElement);
            if (!chat.name || chat.name === 'undefined') return;

            let item = grouped.get(chat.key);
            if (!item) {
                item = {
                    key: chat.key, avatar: chat.avatar, groupId: chat.groupId, isGroup: chat.isGroup,
                    name: chat.name, thumbnail: chat.thumbnail, chats: [], latestChat: null,
                    lastActive: 0, pinned: false, hidden: false,
                };
                grouped.set(chat.key, item);
            }
            item.chats.push(chat);
            item.lastActive = Math.max(item.lastActive, chat.timestamp);
            item.pinned = item.pinned || chat.pinned;
        });

        const result = Array.from(grouped.values());
        result.forEach(function (item) {
            item.chats.sort((a, b) => b.timestamp - a.timestamp);
            item.latestChat = item.chats[0] || null;
            if (!item.thumbnail && item.latestChat && item.latestChat.nativeElement) {
                const img = item.latestChat.nativeElement.querySelector('.avatar img');
                item.thumbnail = img ? img.src : '';
            }
        });
        result.sort(function (a, b) {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.lastActive - a.lastActive;
        });
        result.forEach((item, index) => { item.hidden = index >= state.settings.collapsedDisplayed; });
        return result;
    }

    function groupFallbackChats(panel) {
        const recent = panel && panel.querySelector('.welcomeRecent');
        const nativeList = recent && Array.from(recent.children).find(el => el.classList.contains('recentChatList') && !el.classList.contains(LIST_CLASS));
        if (!nativeList) return [];

        const grouped = new Map();
        Array.from(nativeList.querySelectorAll('.recentChat')).forEach(function (row) {
            const avatar = row.getAttribute('data-avatar') || '';
            const groupId = row.getAttribute('data-group') || '';
            if (!avatar && !groupId) return;
            const file = row.getAttribute('data-file') || '';
            if (!file) return;

            const dateElement = row.querySelector('.chatDate');
            const timestamp = parseTimestamp(dateElement && (dateElement.getAttribute('title') || dateElement.textContent));
            const raw = {
                avatar, group: groupId, file_name: file + '.jsonl', chat_name: file,
                char_name: (row.querySelector('.characterName') || {}).textContent || avatar || groupId,
                mes: (row.querySelector('.chatMessage') || {}).textContent || '',
                last_mes: timestamp,
                chat_items: (row.querySelector('.counterBlock small') || {}).textContent || '',
                file_size: (row.querySelector('.fileSize') || {}).textContent || '',
                pinned: !!row.querySelector('.pinChat.active, .recentChatPinned'),
            };
            const chat = normaliseChat(raw, null, [], row);
            chat.thumbnail = row.querySelector('.avatar img')?.src || '';
            chat.name = raw.char_name;
            let item = grouped.get(chat.key);
            if (!item) {
                item = {
                    key: chat.key, avatar, groupId, isGroup: !!groupId, name: chat.name,
                    thumbnail: chat.thumbnail, chats: [], latestChat: null, lastActive: 0,
                    pinned: false, hidden: false,
                };
                grouped.set(chat.key, item);
            }
            item.chats.push(chat);
            item.lastActive = Math.max(item.lastActive, timestamp);
            item.pinned = item.pinned || chat.pinned;
        });

        const result = Array.from(grouped.values());
        result.forEach(function (item) {
            item.chats.sort((a, b) => b.timestamp - a.timestamp);
            item.latestChat = item.chats[0] || null;
        });
        result.sort(function (a, b) {
            if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
            return b.lastActive - a.lastActive;
        });
        result.forEach((item, index) => { item.hidden = index >= state.settings.collapsedDisplayed; });
        return result;
    }

    function createElement(tagName, className, text) {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text !== undefined && text !== null) element.textContent = String(text);
        return element;
    }

    function createAvatar(group, chat) {
        const native = chat && chat.nativeElement && chat.nativeElement.querySelector('.avatar');
        if (native) {
            const clone = native.cloneNode(true);
            clone.removeAttribute('id');
            return clone;
        }
        const avatar = createElement('div', 'avatar');
        if (group.thumbnail) {
            const image = createElement('img');
            image.src = group.thumbnail;
            image.alt = group.name;
            image.loading = 'lazy';
            avatar.append(image);
        } else {
            avatar.append(createElement('i', 'fa-solid fa-user'));
        }
        return avatar;
    }

    function forwardNativeAction(chat, action) {
        const native = findNativeEntry(chat);
        const button = native && native.querySelector('.' + action);
        if (!button) {
            console.warn('[Freesia Gallery] Native action unavailable:', action, chat && chat.chatName);
            if (window.toastr && typeof window.toastr.warning === 'function') window.toastr.warning('找不到对应的酒馆原生操作入口，请刷新首页后重试。');
            return;
        }
        button.click();
    }

    function createActionButtons(chat) {
        const native = findNativeEntry(chat);
        const nativeActions = native && native.querySelector('.chatActions');
        const actions = createElement('div', 'chatActions');
        [
            { className: 'pinChat', icon: 'fa-solid fa-thumbtack fa-fw', title: '置顶聊天' },
            { className: 'renameChat', icon: 'fa-solid fa-pen-to-square fa-fw', title: '重命名聊天' },
            { className: 'deleteChat', icon: 'fa-solid fa-trash fa-fw', title: '删除聊天' },
        ].forEach(function (definition) {
            const original = nativeActions && nativeActions.querySelector('.' + definition.className);
            const button = original ? original.cloneNode(true) : createElement('button', 'menu_button menu_button_icon ' + definition.className);
            if (!original) {
                button.type = 'button';
                button.title = definition.title;
                button.append(createElement('i', definition.icon));
            }
            button.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                forwardNativeAction(chat, definition.className);
            });
            actions.append(button);
        });
        return actions;
    }

    function createStats(chat) {
        const stats = createElement('div', 'chatStats');
        const counter = createElement('div', 'counterBlock');
        counter.append(createElement('i', 'fa-solid fa-comment fa-xs'), createElement('small', '', chat.messageCount || '—'));
        stats.append(counter, createElement('small', 'fileSize', chat.fileSize || ''));
        return stats;
    }

    function reportOpenError(error) {
        console.error('[Freesia Gallery] Native chat action failed.', error);
        if (window.toastr && typeof window.toastr.error === 'function') window.toastr.error('打开聊天失败：' + (error && error.message ? error.message : '请检查控制台'));
    }

    function openNativeChat(chat) {
        if (!chat) return;
        const native = findNativeEntry(chat);
        if (native) {
            native.click();
            return;
        }
        const context = getContext();
        if (!chat.isGroup && context && Array.isArray(context.characters)
            && typeof context.selectCharacterById === 'function' && typeof context.openCharacterChat === 'function') {
            const characterId = context.characters.findIndex(character => character && character.avatar === chat.avatar);
            if (characterId >= 0) {
                Promise.resolve(context.selectCharacterById(characterId))
                    .then(() => context.openCharacterChat(chat.chatName))
                    .catch(reportOpenError);
                return;
            }
        }
        reportOpenError(new Error('找不到对应的原生聊天入口。'));
    }

    function createSessionRow(chat, group) {
        const row = createElement('div', 'recentChat freesia-gallery-session-row');
        row.setAttribute('role', 'button');
        row.setAttribute('tabindex', '0');
        row.dataset.avatar = chat.avatar;
        row.dataset.group = chat.groupId;
        row.dataset.file = chat.chatName;
        row.append(createAvatar(group, chat));

        const info = createElement('div', 'recentChatInfo');
        const nameContainer = createElement('div', 'chatNameContainer');
        const name = createElement('div', 'chatName');
        name.append(createElement('strong', 'characterName', group.name), createElement('span', '', ' – '), createElement('span', '', chat.chatName));
        const date = createElement('small', 'chatDate', chat.dateShort);
        date.title = chat.dateLong;
        nameContainer.append(name, date, createActionButtons(chat));

        const messageContainer = createElement('div', 'chatMessageContainer');
        messageContainer.append(createElement('div', 'chatMessage', chat.preview), createStats(chat));
        info.append(nameContainer, messageContainer);
        row.append(info);

        row.addEventListener('click', function (event) {
            if (event.target.closest('button')) return;
            event.stopPropagation();
            openNativeChat(chat);
        });
        row.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                event.stopPropagation();
                openNativeChat(chat);
            }
        });
        return row;
    }

    function createCard(group) {
        const latest = group.latestChat;
        const card = createElement('article', 'recentChat freesia-gallery-card' + (group.hidden && !state.expandedAll ? ' hidden' : ''));
        card.setAttribute('role', 'group');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', group.name + '，' + group.chats.length + ' 个聊天');
        card.dataset.galleryKey = group.key;
        card.append(createAvatar(group, latest));

        const info = createElement('div', 'recentChatInfo');
        const nameContainer = createElement('div', 'chatNameContainer');
        const name = createElement('div', 'chatName');
        name.append(
            createElement('strong', 'characterName', group.name),
            createElement('span', '', ' – '),
            createElement('span', 'freesia-gallery-latest-title', latest ? latest.chatName : '暂无聊天')
        );
        const date = createElement('small', 'chatDate', latest ? latest.dateShort : '—');
        date.title = latest ? latest.dateLong : '';
        nameContainer.append(name, date, latest ? createActionButtons(latest) : createElement('span'));

        const messageContainer = createElement('div', 'chatMessageContainer');
        const message = createElement('div', 'chatMessage', latest ? latest.preview : '暂无消息预览');
        message.title = latest ? latest.preview : '';
        const stats = createStats(latest || { messageCount: '', fileSize: '' });
        const countButton = createElement('button', 'menu_button menu_button_icon freesia-gallery-chat-count');
        countButton.type = 'button';
        countButton.setAttribute('aria-expanded', state.expandedGroups.has(group.key) ? 'true' : 'false');
        countButton.append(
            createElement('i', 'fa-solid fa-comments fa-fw'),
            document.createTextNode(' ' + group.chats.length + ' 个聊天 '),
            createElement('i', 'fa-solid ' + (state.expandedGroups.has(group.key) ? 'fa-chevron-up' : 'fa-chevron-down') + ' fa-fw')
        );
        countButton.addEventListener('click', function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (state.expandedGroups.has(group.key)) state.expandedGroups.delete(group.key);
            else state.expandedGroups.add(group.key);
            void refresh();
        });
        messageContainer.append(message, stats, countButton);
        info.append(nameContainer, messageContainer);
        card.append(info);

        card.addEventListener('click', function (event) {
            if (event.target.closest('button')) return;
            openNativeChat(latest);
        });
        card.addEventListener('keydown', function (event) {
            if (event.key === 'Enter' || event.key === ' ') {
                if (event.target.closest('button')) return;
                event.preventDefault();
                openNativeChat(latest);
            }
        });

        if (state.expandedGroups.has(group.key)) {
            const sessions = createElement('div', 'freesia-gallery-session-list');
            group.chats.forEach(chat => sessions.append(createSessionRow(chat, group)));
            card.append(sessions);
        }
        return card;
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
            fragment.append(createElement('div', 'noRecentChat', source === 'api' ? '当前设置范围内没有可展示的聊天记录' : '原生最近聊天列表中没有可展示的聊天记录'));
        }

        if (groups.length > state.settings.collapsedDisplayed) {
            const button = createElement('button', 'menu_button menu_button_icon ' + SHOW_MORE_CLASS);
            button.type = 'button';
            button.title = state.expandedAll ? '收起角色画廊' : '展开全部角色';
            button.append(createElement('i', 'fa-solid ' + (state.expandedAll ? 'fa-chevron-up' : 'fa-chevron-down') + ' fa-fw'));
            button.addEventListener('click', function () {
                state.expandedAll = !state.expandedAll;
                void refresh();
            });
            fragment.append(button);
        }

        state.galleryList.replaceChildren(fragment);
        if (state.summary) {
            state.summary.textContent = state.settings.maxDisplayed + ' 条最近聊天 · ' + state.settings.collapsedDisplayed + ' 个角色入口初始显示 · ' + groups.length + ' 位角色/群组 · ' + chatCount + ' 个会话';
            state.summary.title = source === 'api'
                ? '沿用酒馆 Recent Chats Settings：Max recent chats / Collapsed recent chats'
                : '接口不可用，当前仅展示原生首页 DOM 中已加载的聊天记录';
        }
    }

    async function fetchRecentChats(context, settings, signal) {
        if (!context || typeof context.getRequestHeaders !== 'function') throw new Error('当前环境未提供酒馆请求上下文。');
        const response = await window.fetch(API_PATH, {
            method: 'POST',
            headers: context.getRequestHeaders(),
            body: JSON.stringify({ max: settings.maxDisplayed, pinned: getPinnedChats(context) }),
            cache: 'no-cache',
            signal: signal,
        });
        if (!response.ok) throw new Error('读取聊天列表失败（HTTP ' + response.status + '）。');
        const records = await response.json();
        if (!Array.isArray(records)) throw new Error('聊天列表接口返回的数据格式不正确。');
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
        state.requestController = window.AbortController ? new window.AbortController() : null;
        const context = getContext();
        state.settings = readSettings(context);

        try {
            const records = await fetchRecentChats(context, state.settings, state.requestController ? state.requestController.signal : undefined);
            if (generation !== state.generation || !state.panel) return false;
            render(groupChats(records, context, getPinnedChats(context)), 'api');
            return true;
        } catch (error) {
            if (error && error.name === 'AbortError') return false;
            console.warn('[Freesia Gallery] API loading failed; falling back to native recent chats.', error);
            if (generation !== state.generation || !state.panel) return false;
            const groups = groupFallbackChats(state.panel);
            render(groups, 'fallback', error);
            return groups.length > 0;
        }
    }

    function updateView() {
        if (!state.panel) return;
        const nativeMode = state.panel.classList.contains(NATIVE_CLASS);
        if (state.title) state.title.textContent = nativeMode ? state.originalTitle : '角色画廊';
        if (state.toggle) {
            const label = nativeMode ? '切换到角色画廊' : '切换到原生最近聊天';
            state.toggle.title = label;
            state.toggle.setAttribute('aria-label', label);
        }
        if (state.toggleIcon) state.toggleIcon.className = 'fa-solid ' + (nativeMode ? 'fa-images' : 'fa-list') + ' fa-fw fa-lg';
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
        const nativeList = Array.from(welcomeRecent.children).find(el => el.classList.contains('recentChatList') && !el.classList.contains(LIST_CLASS));
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

        // Preserve the original native gear, popup, and event handler.
        panel.classList.add(ACTIVE_CLASS);
        updateView();
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
        if (state.title && state.originalTitle !== null) state.title.textContent = state.originalTitle;
        if (state.panel) state.panel.classList.remove(ACTIVE_CLASS, NATIVE_CLASS);

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
        const panel = document.querySelector('#chat > .welcomePanel') || document.querySelector('#chat .welcomePanel');
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
            const changed = records.some(function (record) {
                const nodes = Array.from(record.addedNodes).concat(Array.from(record.removedNodes));
                return nodes.some(node => node.nodeType === 1 && (node.matches('.welcomePanel') || (node.querySelector && node.querySelector('.welcomePanel'))));
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
        ['APP_READY', 'CHAT_CHANGED', 'CHAT_RENAMED', 'CHARACTER_RENAMED', 'GROUP_CHAT_CREATED'].forEach(function (name) {
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
        state.eventCleanups.forEach(cleanup => { try { cleanup(); } catch (error) { /* ignore */ } });
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
        getSettings: () => Object.assign({}, state.settings),
        _groupChats: groupChats,
        _groupFallbackChats: groupFallbackChats,
    };
    window[GLOBAL_NAME] = api;

    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
        else start();
    }
})();