import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const scriptPath = fileURLToPath(new URL('../development/gallery-home/Freesia-Gallery-Home-0.2.7.js', import.meta.url));
const script = readFileSync(scriptPath, 'utf8');

function createHomeMarkup() {
    return '<div id="chat">' +
        '<div class="welcomePanel">' +
            '<div class="welcomeHeaderTitle">' +
                '<img class="welcomeHeaderLogo" src="img/logo.png" alt="SillyTavern Logo">' +
                "<span class=\"welcomeHeaderVersionDisplay\">SillyTavern 1.19.0 'release' (06bde939f)</span>" +
                '<div class="mes_button showRecentChats"></div>' +
                '<div class="mes_button recentChatsSettings"></div>' +
                '<div class="mes_button hideRecentChats"></div>' +
            '</div>' +
            '<div class="welcomeHeader"><div class="recentChatsTitle">Recent Chats</div><div class="welcomeShortcuts">Shortcuts</div></div>' +
            '<div class="welcomeRecent">' +
                '<div class="recentChatList" role="list">' +
                    '<div class="recentChat" data-file="A-old" data-avatar="a.png" data-group="">' +
                        '<div class="avatar"><img src="/a.png" alt="Alpha"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Alpha</strong><span> – </span><span>A-old</span></div><small class="chatDate" title="2026-11-20T10:00:00Z">11/20/2026</small><div class="chatActions"><button class="menu_button menu_button_icon pinChat"><i class="fa-solid fa-thumbtack"></i></button><button class="menu_button menu_button_icon renameChat"><i class="fa-solid fa-pen"></i></button><button class="menu_button menu_button_icon deleteChat"><i class="fa-solid fa-trash"></i></button></div></div><div class="chatMessageContainer"><div class="chatMessage">old message</div><div class="chatStats"><div class="counterBlock"><small>10</small></div><small class="fileSize">2 KB</small></div></div></div>' +
                    '</div>' +
                    '<div class="recentChat hidden" data-file="A-new" data-avatar="a.png" data-group="">' +
                        '<div class="avatar"><img src="/a.png" alt="Alpha"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Alpha</strong><span> – </span><span>A-new</span></div><small class="chatDate" title="2026-11-26T10:00:00Z">11/26/2026</small><div class="chatActions"><button class="menu_button menu_button_icon pinChat active"><i class="fa-solid fa-thumbtack"></i></button><button class="menu_button menu_button_icon renameChat"><i class="fa-solid fa-pen"></i></button><button class="menu_button menu_button_icon deleteChat"><i class="fa-solid fa-trash"></i></button></div></div><div class="chatMessageContainer"><div class="chatMessage">latest native preview</div><div class="chatStats"><div class="counterBlock"><small>25</small></div><small class="fileSize">8 KB</small></div></div></div>' +
                    '</div>' +
                    '<div class="recentChat" data-file="B-one" data-avatar="b.png" data-group="">' +
                        '<div class="avatar"><img src="/b.png" alt="Beta"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Beta</strong><span> – </span><span>B-one</span></div><small class="chatDate" title="2026-11-22T10:00:00Z">11/22/2026</small><div class="chatActions"><button class="menu_button menu_button_icon pinChat"><i class="fa-solid fa-thumbtack"></i></button><button class="menu_button menu_button_icon renameChat"><i class="fa-solid fa-pen"></i></button><button class="menu_button menu_button_icon deleteChat"><i class="fa-solid fa-trash"></i></button></div></div><div class="chatMessageContainer"><div class="chatMessage">beta preview</div><div class="chatStats"><div class="counterBlock"><small>8</small></div><small class="fileSize">1 KB</small></div></div></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function createContext(calls) {
    return {
        characters: [
            {
                avatar: 'a.png',
                name: 'Alpha',
                description: 'Alpha character description. This is read-only character information.',
                data: { extensions: { world: 'Alpha Lorebook' } },
            },
            {
                avatar: 'b.png',
                name: 'Beta',
                description: 'Beta description',
                data: { extensions: {} },
            },
        ],
        groups: [],
        POPUP_TYPE: { INPUT: 1, CONFIRM: 2 },
        callGenericPopup: async (message, type, inputValue) => type === 1 ? calls.popupInput : calls.popupConfirm,
        accountStorage: {
            getItem: key => key === 'recentChatsSettings'
                ? JSON.stringify({ maxDisplayed: 15, collapsedDisplayed: 1 })
                : key === 'pinnedChats' ? null : (calls.storage && calls.storage[key]) || null,
            setItem: (key, value) => {
                calls.storage = calls.storage || {};
                calls.storage[key] = value;
            },
        },
        getRequestHeaders: () => ({ 'Content-Type': 'application/json' }),
        getThumbnailUrl: (type, avatar) => '/thumbnail/' + avatar,
        getWorldInfoNames: () => ['Alpha Lorebook', 'Other Book'],
        unshallowCharacter: async () => {},
        getOneCharacter: async () => {},
        selectCharacterById: async (index, options) => { calls.selected.push({ index, options }); },
        openCharacterChat: async name => { calls.opened.push(name); },
        getCurrentChatId: () => undefined,
        saveSettingsDebounced: () => {},
        eventSource: { on: () => {}, off: () => {}, emit: async (type, data) => { calls.emitted.push({ type, data }); } },
        eventTypes: { CHAT_RENAMED: 'CHAT_RENAMED', CHAT_DELETED: 'CHAT_DELETED' },
    };
}

function recentRecords() {
    return [
        { avatar: 'a.png', file_id: 'A-old', file_name: 'A-old.jsonl', last_mes: '2026-11-20T10:00:00Z', mes: 'old preview', chat_items: 10, file_size: '2 KB', group: '' },
        { avatar: 'a.png', file_id: 'A-new', file_name: 'A-new.jsonl', last_mes: '2026-11-26T10:00:00Z', mes: 'latest preview with two lines of useful content', chat_items: 25, file_size: '8 KB', group: '' },
        { avatar: 'b.png', file_id: 'B-one', file_name: 'B-one.jsonl', last_mes: '2026-11-22T10:00:00Z', mes: 'beta preview', chat_items: 8, file_size: '1 KB', group: '' },
    ];
}

function allCharacterChats() {
    return [
        { file_name: 'A-new', file_size: '8 KB', message_count: 25, last_mes: '2026-11-26T10:00:00Z', preview_message: 'latest preview' },
        { file_name: 'A-old', file_size: '2 KB', message_count: 10, last_mes: '2026-11-20T10:00:00Z', preview_message: 'old preview' },
        { file_name: 'A-archive', file_size: '5 KB', message_count: 17, last_mes: '2026-10-10T10:00:00Z', preview_message: 'archived chat preview' },
    ];
}

function setup() {
    const dom = new JSDOM(createHomeMarkup(), { url: 'http://localhost/', runScripts: 'outside-only' });
    const calls = { selected: [], opened: [], nativeOpened: 0, pinned: 0, popupInput: 'A-renamed', popupConfirm: true, renamed: null, deleted: null, emitted: [] };
    const context = createContext(calls);
    dom.window.SillyTavern = { getContext: () => context };
    dom.window.fetch = async (url, options = {}) => {
        if (url === '/api/chats/recent') {
            calls.recentBody = JSON.parse(options.body);
            return { ok: true, json: async () => recentRecords() };
        }
        if (url === '/api/characters/chats') {
            return { ok: true, json: async () => [{ file_name: 'A-new.jsonl' }, { file_name: 'A-old.jsonl' }, { file_name: 'A-archive.jsonl' }] };
        }
        if (url === '/api/chats/search') {
            return { ok: true, json: async () => allCharacterChats() };
        }
        if (url === '/api/chats/rename') {
            calls.renamed = JSON.parse(options.body);
            return { ok: true, json: async () => ({}) };
        }
        if (url === '/api/chats/delete') {
            calls.deleted = JSON.parse(options.body);
            return { ok: true, json: async () => ({}) };
        }
        if (url === '/api/characters/merge-attributes') {
            calls.merged = JSON.parse(options.body);
            return { ok: true, json: async () => ({}) };
        }
        throw new Error('Unexpected request: ' + url);
    };

    const nativeRows = dom.window.document.querySelectorAll('.welcomeRecent .recentChat');
    nativeRows.forEach(row => {
        row.addEventListener('click', () => { calls.nativeOpened += 1; });
        row.querySelector('.pinChat').addEventListener('click', event => {
            event.stopPropagation();
            calls.pinned += 1;
        });
        row.querySelector('.renameChat').addEventListener('click', event => {
            event.stopPropagation();
            calls.renamedNative = (calls.renamedNative || 0) + 1;
        });
        row.querySelector('.deleteChat').addEventListener('click', event => {
            event.stopPropagation();
            calls.deletedNative = (calls.deletedNative || 0) + 1;
        });
    });

    dom.window.eval(script);
    const api = dom.window.FreesiaGalleryHome;
    api.start();
    return { dom, api, calls, context };
}

test('renders a bounded portrait gallery with native card structure and independent layout controls', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const cards = panel.querySelectorAll('.freesia-gallery-card');
    const css = dom.window.document.getElementById('freesia-gallery-home-style').textContent;

    assert.equal(calls.recentBody.max, 15);
    assert.equal(cards.length, 2);
    assert.equal(cards[0].querySelector('.freesia-gallery-card-identity .avatar').isConnected, true);
    assert.equal(cards[0].querySelector('.freesia-gallery-card-heading .characterName').textContent, 'Alpha');
    assert.match(cards[0].querySelector('.freesia-gallery-chat-count').textContent, /2 个聊天/);
    assert.match(cards[0].querySelector('.freesia-gallery-card-latest .chatMessage').textContent, /latest preview/);
    assert.equal(cards[0].classList.contains('recentChat'), true);
    assert.equal(cards[0].querySelector('.chatActions .pinChat'), null, 'home pin is a character-level action, not a native chat pin');
    assert.ok(cards[0].querySelector('.chatActions .freesia-gallery-character-pin'));
    assert.ok(cards[0].querySelector('.chatActions .renameChat'));
    assert.ok(cards[0].querySelector('.chatActions .deleteChat'));
    assert.match(css, /grid-template-columns: repeat\(var\(--freesia-gallery-columns, 4\), minmax\(0, 1fr\)\)/);
    assert.match(css, /grid-auto-rows: 1fr; align-items: stretch/);
    assert.match(css, /gap: clamp\(5px, 0\.7vw, 8px\)/);
    assert.match(css, /aspect-ratio: 3 \/ 4 !important/);
    assert.match(css, /\.freesia-gallery-card-toolbar \{ display: grid; grid-template-columns: minmax\(0, 1fr\)/);
    assert.match(css, /\.freesia-gallery-title-separator \{ display: none !important/);
    assert.match(css, /\.freesia-gallery-detail-avatar \{ grid-column: 1; grid-row: 1/);
    assert.match(css, /\.freesia-gallery-card-latest > \.chatMessageContainer \{ display: flex !important/);
    assert.match(css, /text-align: left !important/);
    assert.match(css, /justify-content: flex-start !important/);
    assert.match(css, /justify-content: flex-end !important/);
    assert.match(css, /grid-template-rows: auto minmax\(2\.6em, 2\.6em\) minmax\(1\.35em, auto\)/);
    assert.match(css, /\.chatStats \{[^}]*max-height: none;[^}]*overflow: visible/);
    assert.match(css, /justify-self: stretch !important/);
    assert.match(css, /min-height: 2\.6em; max-height: 2\.6em/);
    assert.match(css, /\.freesia-gallery-card-toolbar \.chatActions/);
    assert.doesNotMatch(css, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
    assert.doesNotMatch(css, /\.freesia-gallery-session-card \{[^}]*background/);
    assert.equal(cards[0].querySelector('.avatar img').loading, 'lazy');
    assert.doesNotMatch(css, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
    assert.ok(panel.querySelector('.recentChatsSettings'));
    assert.ok(panel.querySelector('.recentChatList:not(.freesia-gallery-grid)').isConnected);
    assert.equal(panel.querySelector('.freesia-gallery-title').textContent, '角色画廊');
    assert.match(panel.querySelector('.freesia-gallery-version').textContent, /SillyTavern 1\.19\.0/);
    assert.match(css, /\.welcomeHeaderTitle \{[^}]*justify-content: space-between;[^}]*width: 100%/);
    assert.match(css, /\.freesia-gallery-title-group \{[^}]*flex: 1 1 auto/);
    assert.match(css, /\.welcomeHeader \.welcomeShortcuts \{[^}]*justify-content: flex-end;[^}]*margin-inline-start: auto/);
    assert.match(css, /@media screen and \(min-width: 821px\)/);
    assert.doesNotMatch(css, /freesia-gallery-layout-controls/);
    assert.match(css, /\[hidden\] \{ display: none !important; \}/);
    assert.equal(panel.querySelector('.welcomeHeaderLogo').isConnected, true);
    assert.doesNotMatch(panel.querySelector('.freesia-gallery-summary').textContent, /每页.*列.*行/);
    assert.ok(cards[0].querySelector('.freesia-gallery-card-toolbar .chatActions'));
    assert.ok(cards[0].querySelector('.freesia-gallery-card-date-row .chatDate'));
    assert.ok(cards[0].querySelector('.freesia-gallery-card-latest .chatMessageContainer'));
    assert.equal(api.getLayoutSettings().columns, 4);
    assert.equal(api.getLayoutSettings().rows, 3);
    assert.equal(panel.querySelector('.freesia-gallery-layout-controls'), null);

    cards[0].querySelector('.freesia-gallery-card-identity').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    assert.equal(api.getPage(), 'detail');

    api.stop();
    dom.window.close();
});

test('gallery character pin is independent from native chat pins and sorts the character card first', async () => {
    const { dom, api, context } = setup();
    await api.refresh();
    const panel = dom.window.document.querySelector('.welcomePanel');
    const initial = Array.from(panel.querySelectorAll('.freesia-gallery-card')).map(card => card.dataset.avatar);
    assert.equal(initial[0], 'a.png');

    const betaPin = panel.querySelector('.freesia-gallery-card[data-avatar="b.png"] .freesia-gallery-character-pin');
    assert.ok(betaPin);
    betaPin.click();

    const reordered = Array.from(panel.querySelectorAll('.freesia-gallery-card')).map(card => card.dataset.avatar);
    assert.equal(reordered[0], 'b.png');
    const stored = JSON.parse(context.accountStorage.getItem('freesiaGalleryPinnedCharacters'));
    assert.ok(stored['b.png']);
    assert.equal(context.accountStorage.getItem('pinnedChats'), null);

    panel.querySelector('.freesia-gallery-card[data-avatar="b.png"] .freesia-gallery-character-pin').click();
    const restored = Array.from(panel.querySelectorAll('.freesia-gallery-card')).map(card => card.dataset.avatar);
    assert.equal(restored[0], 'a.png');
    assert.equal(JSON.parse(context.accountStorage.getItem('freesiaGalleryPinnedCharacters'))['b.png'], undefined);

    api.stop();
    dom.window.close();
});

test('limits gallery to at most three columns at viewport widths of 480px and below', async () => {
    const { dom, api } = setup();
    Object.defineProperty(dom.window, 'innerWidth', { value: 480, configurable: true });
    await api.setLayoutSettings({ columns: 4, rows: 2 });
    const panel = dom.window.document.querySelector('.welcomePanel');
    assert.equal(panel.querySelector('.freesia-gallery-grid').style.getPropertyValue('--freesia-gallery-columns'), '3');
    assert.equal(api.getLayoutSettings().columns, 4);

    Object.defineProperty(dom.window, 'innerWidth', { value: 481, configurable: true });
    dom.window.dispatchEvent(new dom.window.Event('resize'));
    assert.equal(panel.querySelector('.freesia-gallery-grid').style.getPropertyValue('--freesia-gallery-columns'), '4');
    assert.equal(api.getLayoutSettings().columns, 4);

    api.stop();
    dom.window.close();
});

test('detail page reuses native recent-chat rows and a readonly native text field; management jumps to the native editor', async () => {
    const { dom, api, calls, context } = setup();
    await api.refresh();
    await api.openDetail('a.png');

    const panel = dom.window.document.querySelector('.welcomePanel');
    assert.equal(api.getPage(), 'detail');
    assert.equal(panel.querySelector('.freesia-gallery-title').textContent, '角色详情');
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, 'Recent Chats');
    assert.equal(panel.querySelector('.freesia-gallery-back').hidden, false);
    assert.equal(panel.querySelector('.freesia-gallery-pagination').hidden, true);
    assert.equal(panel.querySelector('.freesia-gallery-layout-controls'), null);
    assert.equal(panel.querySelector('.freesia-gallery-summary').hidden, true);
    assert.equal(panel.querySelector('.freesia-gallery-detail-name').textContent, 'Alpha');
    assert.match(panel.querySelector('.freesia-gallery-lorebook').textContent, /Alpha Lorebook/);
    assert.doesNotMatch(panel.querySelector('.freesia-gallery-lorebook').textContent, /Char's lorebook/);
    assert.ok(panel.querySelector('.freesia-gallery-description-header .freesia-gallery-manage'));
    assert.equal(panel.querySelector('.freesia-gallery-detail-heading .freesia-gallery-manage'), null);
    assert.equal(panel.querySelector('.freesia-gallery-title-group .freesia-gallery-manage'), null);
    assert.equal(panel.querySelector('.freesia-gallery-description-header .freesia-gallery-manage').textContent, '详情/管理');
    assert.doesNotMatch(panel.querySelector('.freesia-gallery-description-header .freesia-gallery-manage').textContent, />/);
    const descriptionHeader = panel.querySelector('.freesia-gallery-description-header');
    assert.ok(descriptionHeader);
    assert.equal(descriptionHeader.children.length, 2);
    assert.equal(descriptionHeader.children[0].classList.contains('freesia-gallery-description-label'), true);
    assert.equal(descriptionHeader.children[1].classList.contains('freesia-gallery-manage'), true);
    assert.match(descriptionHeader.textContent, /角色描述/);
    const detailCss = dom.window.document.getElementById('freesia-gallery-home-style').textContent;
    assert.match(detailCss, /\.freesia-gallery-description-header \{ display: flex/);
    assert.match(detailCss, /\.freesia-gallery-description-header \.freesia-gallery-manage/);
    assert.match(detailCss, /\.freesia-gallery-description \{ grid-column: 1 \/ -1/);
    assert.match(detailCss, /\.freesia-gallery-detail-main \{ display: contents/);

    assert.match(detailCss, /\.freesia-gallery-detail-hero \{ display: grid;[^}]*align-items: start/);
    assert.match(detailCss, /\.freesia-gallery-detail-avatar \{ display: block; align-self: start;[^}]*aspect-ratio: 3 \/ 4 !important/);
    const description = panel.querySelector('.freesia-gallery-description');
    assert.match(description.value, /read-only character information/);
    assert.equal(description.tagName, 'TEXTAREA');
    assert.equal(description.readOnly, true);
    assert.ok(description.classList.contains('text_pole'));

    const sessions = panel.querySelectorAll('.freesia-gallery-session-card');
    assert.equal(sessions.length, 3);
    assert.ok(sessions[0].classList.contains('recentChat'));
    assert.ok(sessions[0].querySelector('.chatActions .pinChat'));
    assert.ok(sessions[0].querySelector('.chatActions .renameChat'));
    assert.ok(sessions[0].querySelector('.chatActions .deleteChat'));
    assert.match(detailCss, /\.freesia-gallery-session-card \.chatName \{[^}]*text-align: center/);
    const actionKey = new dom.window.KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    sessions[0].querySelector('.renameChat').dispatchEvent(actionKey);
    assert.equal(calls.opened.length, 0, 'keyboard interaction on nested action must not open the chat');
    assert.ok(panel.querySelector('.freesia-gallery-session-list').classList.contains('recentChatList'));
    assert.match(panel.querySelector('.freesia-gallery-detail-chat-count').textContent, /3 个聊天/);

    const firstBeforePin = sessions[0].dataset.file;
    const secondBeforePin = sessions[1].dataset.file;
    sessions[1].querySelector('.pinChat').click();
    const pinnedSessions = panel.querySelectorAll('.freesia-gallery-session-card');
    assert.equal(pinnedSessions[0].dataset.file, secondBeforePin);
    assert.equal(pinnedSessions[0].querySelector('.pinChat').classList.contains('active'), true);
    assert.notEqual(pinnedSessions[0].dataset.file, firstBeforePin);
    const pinnedStorage = JSON.parse(context.accountStorage.getItem('freesiaGalleryDetailPinnedChats'));
    assert.ok(Object.values(pinnedStorage).some(item => item.avatar === 'a.png' && item.chatName === secondBeforePin));

    panel.querySelector('.freesia-gallery-manage').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    assert.equal(calls.selected.length, 1);
    assert.equal(calls.selected[0].index, 0);
    assert.equal(calls.selected[0].options.switchMenu, true);
    assert.equal(calls.opened.length, 0);

    api.stop();
    dom.window.close();
});

test('detail rename and delete actions use native chat endpoints and update the detail list', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();
    await api.openDetail('a.png');
    const panel = dom.window.document.querySelector('.welcomePanel');

    const first = panel.querySelector('.freesia-gallery-session-card');
    first.querySelector('.renameChat').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    assert.equal(calls.renamed.avatar_url, 'a.png');
    assert.equal(calls.renamed.original_file, 'A-new.jsonl');
    assert.equal(calls.renamed.renamed_file, 'A-renamed.jsonl');
    assert.equal(panel.querySelector('.freesia-gallery-session-card').dataset.file, 'A-renamed');

    const second = panel.querySelector('.freesia-gallery-session-card');
    second.querySelector('.deleteChat').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    assert.equal(calls.deleted.avatar_url, 'a.png');
    assert.equal(calls.deleted.chatfile, 'A-renamed.jsonl');
    assert.equal(panel.querySelectorAll('.freesia-gallery-session-card').length, 2);

    api.stop();
    dom.window.close();
});

test('chat files page uses native recent-chat rows and opens an older chat through the native context', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();
    await api.openDetail('a.png');

    const filesButton = dom.window.document.querySelector('.freesia-gallery-detail-chat-header button');
    assert.equal(filesButton.textContent, '聊天文件');
    assert.doesNotMatch(filesButton.textContent, />/);
    filesButton.click();
    assert.equal(api.getPage(), 'files');
    assert.equal(dom.window.document.querySelectorAll('.freesia-gallery-file-list .recentChat').length, 3);
    assert.equal(dom.window.document.querySelector('.freesia-gallery-title').textContent, '聊天文件');
    assert.ok(dom.window.document.querySelector('.freesia-gallery-file-list').classList.contains('recentChatList'));

    const oldFile = Array.from(dom.window.document.querySelectorAll('.freesia-gallery-file-list .recentChat'))
        .find(row => row.textContent.includes('A-archive'));
    oldFile.click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));

    assert.deepEqual(calls.opened, ['A-archive']);
    assert.equal(calls.selected.length, 1);

    api.stop();
    dom.window.close();
});

test('latest-chat area opens the recent chat; home card actions forward rename and delete without pinning', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();

    const card = dom.window.document.querySelector('.freesia-gallery-card');
    card.querySelector('.freesia-gallery-card-latest').click();
    assert.equal(calls.nativeOpened, 1);

    assert.equal(card.querySelector('.pinChat'), null, 'pinning is only available in character detail');
    card.querySelector('.renameChat').click();
    card.querySelector('.deleteChat').click();
    assert.equal(calls.renamedNative, 1);
    assert.equal(calls.deletedNative, 1);
    assert.equal(calls.pinned, 0);

    api.stop();
    dom.window.close();
});

test('native recent-chat view remains available and gallery header restores correctly', async () => {
    const { dom, api } = setup();
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const nativeList = panel.querySelector('.welcomeRecent > .recentChatList:not(.freesia-gallery-grid)');
    assert.ok(panel.querySelector('.recentChatsSettings'));

    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), true);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, 'Recent Chats');
    assert.equal(panel.querySelector('.freesia-gallery-layout-controls'), null);

    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), false);
    assert.equal(panel.querySelector('.freesia-gallery-title').textContent, '角色画廊');

    api.stop();
    assert.equal(panel.classList.contains('freesia-gallery-active'), false);
    assert.equal(panel.querySelector('.freesia-gallery-grid'), null);
    assert.equal(panel.querySelector('.freesia-gallery-title'), null);
    assert.equal(panel.querySelector('.freesia-gallery-detail'), null);
    assert.equal(nativeList.isConnected, true);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, 'Recent Chats');

    dom.window.close();
});

test('fallback mode groups native rows by character and still provides portrait cards', async () => {
    const { dom, api } = setup();
    dom.window.fetch = async () => { throw new Error('API unavailable'); };
    await api.refresh();

    const cards = dom.window.document.querySelectorAll('.freesia-gallery-card');
    assert.equal(cards.length, 2);
    assert.equal(cards[0].querySelector('.freesia-gallery-card-heading .characterName').textContent, 'Alpha');
    assert.match(cards[0].querySelector('.freesia-gallery-chat-count').textContent, /2 个聊天/);

    api.stop();
    dom.window.close();
});

test('gallery includes characters that have no recent chat records', async () => {
    const { dom, api, context } = setup();
    context.characters.push({
        avatar: 'c.png',
        name: 'No Recent Chat',
        description: 'This character has not started a chat yet.',
        data: { extensions: {} },
    });
    await api.refresh();

    const cards = Array.from(dom.window.document.querySelectorAll('.freesia-gallery-card'));
    assert.equal(cards.length, 3);
    const emptyCharacter = cards.find(card => card.dataset.avatar === 'c.png');
    assert.ok(emptyCharacter);
    assert.equal(emptyCharacter.querySelector('.freesia-gallery-card-heading .characterName').textContent, 'No Recent Chat');
    assert.equal(emptyCharacter.querySelector('.freesia-gallery-card-latest .chatMessage').textContent, '暂无最近聊天记录');

    api.stop();
    dom.window.close();
});

test('empty-chat cards reserve the same two-line preview region and keep all metadata rows', async () => {
    const { dom, api, context } = setup();
    context.characters.push({
        avatar: 'c.png',
        name: 'No Recent Chat',
        description: 'No chat yet',
        data: { extensions: {} },
    });
    await api.refresh();

    const card = dom.window.document.querySelector('.freesia-gallery-card[data-avatar="c.png"]');
    assert.ok(card);
    assert.equal(card.querySelector('.freesia-gallery-card-heading .characterName').textContent, 'No Recent Chat');
    assert.equal(card.querySelector('.freesia-gallery-chat-count').textContent, '0 个聊天');
    assert.equal(card.querySelector('.freesia-gallery-card-toolbar .chatActions').getAttribute('aria-hidden'), null);
    assert.ok(card.querySelector('.freesia-gallery-card-toolbar .freesia-gallery-character-pin'));
    assert.equal(card.querySelector('.freesia-gallery-card-toolbar .renameChat').disabled, true);
    assert.equal(card.querySelector('.freesia-gallery-card-toolbar .deleteChat').disabled, true);
    assert.equal(card.querySelector('.freesia-gallery-card-date-row .chatDate').textContent, '—');
    assert.equal(card.querySelector('.freesia-gallery-card-latest .chatMessage').textContent, '暂无最近聊天记录');
    assert.ok(card.querySelector('.freesia-gallery-card-latest .chatStats'));
    assert.equal(card.children.length, 4);

    const css = dom.window.document.getElementById('freesia-gallery-home-style').textContent;
    assert.match(css, /grid-template-rows: auto minmax\(2\.6em, 2\.6em\) minmax\(1\.35em, auto\)/);
    assert.match(css, /grid-auto-rows: 1fr/);

    api.stop();
    dom.window.close();
});

test('gallery title keeps SillyTavern version text without the spider logo and restores native header in native mode', async () => {
    const { dom, api } = setup();
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const titleGroup = panel.querySelector('.freesia-gallery-title-group');
    assert.match(titleGroup.textContent, /角色画廊 · SillyTavern/);
    assert.match(titleGroup.textContent, /SillyTavern 1\.19\.0 'release' \(06bde939f\)/);
    assert.equal(panel.querySelector('.welcomeHeaderLogo').isConnected, true);

    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), true);
    assert.equal(panel.querySelector('.freesia-gallery-title-group').isConnected, true);
    assert.equal(panel.querySelector('.welcomeHeaderVersionDisplay').textContent, "SillyTavern 1.19.0 'release' (06bde939f)");

    api.stop();
    assert.equal(panel.querySelector('.freesia-gallery-title-group'), null);
    assert.equal(panel.querySelector('.welcomeHeaderVersionDisplay').textContent, "SillyTavern 1.19.0 'release' (06bde939f)");

    dom.window.close();
});

test('native recent-chat settings gear opens the original popup with gallery layout controls appended', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const gear = panel.querySelector('.recentChatsSettings');
    assert.ok(gear, 'the original recent-chat settings entry remains the only settings entry');
    assert.equal(panel.querySelector('.freesia-gallery-layout-controls'), null);

    const dialog = dom.window.document.createElement('dialog');
    dialog.className = 'popup popup--animation-fast';
    dialog.innerHTML = '<div class="popup-body">'
        + '<div class="popup-content">Recent Chats Settings</div>'
        + '<div class="popup-inputs">'
        + '<label class="text_label justifyCenter"><span>Max recent chats</span><input class="text_pole result-control" id="maxRecentChats" value="15"></label>'
        + '<label class="text_label justifyCenter"><span>Collapsed recent chats</span><input class="text_pole result-control" id="collapsedRecentChats" value="1"></label>'
        + '</div>'
        + '<div class="popup-controls"><div class="popup-button-ok menu_button" data-result="1">保存</div><div class="popup-button-cancel menu_button" data-result="0">取消</div></div>'
        + '</div>';
    gear.addEventListener('click', () => dom.window.document.body.append(dialog), { once: true });
    gear.click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));

    assert.ok(dialog.querySelector('#maxRecentChats'));
    assert.ok(dialog.querySelector('#collapsedRecentChats'));
    assert.ok(dialog.querySelector('.freesia-gallery-popup-layout-title'));
    assert.equal(dialog.querySelector('.freesia-gallery-popup-layout-title').textContent, '角色画廊布局');
    assert.ok(dialog.querySelector('#freesiaGalleryColumns'));
    assert.ok(dialog.querySelector('#freesiaGalleryRows'));
    assert.equal(dialog.querySelectorAll('.popup-button-ok').length, 1);
    assert.equal(dialog.querySelectorAll('.popup-button-cancel').length, 1);
    assert.equal(dialog.querySelectorAll('.popup-inputs').length, 2);
    assert.equal(dialog.querySelector('#maxRecentChats').value, '15');
    assert.equal(dialog.querySelector('#collapsedRecentChats').value, '1');

    dialog.querySelector('#freesiaGalleryColumns').value = '2';
    dialog.querySelector('#freesiaGalleryRows').value = '5';
    dialog.querySelector('.popup-button-ok').click();

    assert.deepEqual(JSON.parse(JSON.stringify(api.getLayoutSettings())), { columns: 2, rows: 5 });
    assert.deepEqual(JSON.parse(calls.storage.freesiaGallerySettings), { columns: 2, rows: 5 });
    assert.equal(dialog.querySelector('#maxRecentChats').value, '15');
    assert.equal(dialog.querySelector('#collapsedRecentChats').value, '1');

    api.stop();
    assert.equal(dialog.querySelector('.freesia-gallery-popup-layout-title'), null);
    dom.window.close();
});

test('canceling the native recent-chat settings popup does not save gallery layout changes', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();

    const dialog = dom.window.document.createElement('dialog');
    dialog.className = 'popup';
    dialog.innerHTML = '<div class="popup-body"><div class="popup-content">Recent Chats Settings</div>'
        + '<div class="popup-inputs"><input id="maxRecentChats"><input id="collapsedRecentChats"></div>'
        + '<div class="popup-controls"><div class="popup-button-ok">保存</div><div class="popup-button-cancel">取消</div></div></div>';
    dom.window.document.body.append(dialog);
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));

    dialog.querySelector('#freesiaGalleryColumns').value = '2';
    dialog.querySelector('#freesiaGalleryRows').value = '9';
    dialog.querySelector('.popup-button-cancel').click();

    assert.equal(api.getLayoutSettings().columns, 4);
    assert.equal(api.getLayoutSettings().rows, 3);
    assert.equal(calls.storage?.freesiaGallerySettings, undefined);

    api.stop();
    dom.window.close();
});

test('mobile gallery popup preserves the desktop four-column preference while capping the actual grid at three', async () => {
    const { dom, api, calls } = setup();
    dom.window.innerWidth = 390;
    dom.window.dispatchEvent(new dom.window.Event('resize'));
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const dialog = dom.window.document.createElement('dialog');
    dialog.className = 'popup';
    dialog.innerHTML = '<div class="popup-body"><div class="popup-content">Recent Chats Settings</div>'
        + '<div class="popup-inputs"><input id="maxRecentChats"><input id="collapsedRecentChats"></div>'
        + '<div class="popup-controls"><div class="popup-button-ok">保存</div></div></div>';
    dom.window.document.body.append(dialog);
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));

    const columns = dialog.querySelector('#freesiaGalleryColumns');
    assert.equal(columns.value, '4');
    assert.equal(columns.querySelector('option[value="4"]').disabled, true);
    assert.equal(panel.querySelector('.freesia-gallery-grid').style.getPropertyValue('--freesia-gallery-columns'), '3');

    dialog.querySelector('#freesiaGalleryRows').value = '4';
    dialog.querySelector('.popup-button-ok').click();
    assert.deepEqual(JSON.parse(JSON.stringify(api.getLayoutSettings())), { columns: 4, rows: 4 });
    assert.deepEqual(JSON.parse(calls.storage.freesiaGallerySettings), { columns: 4, rows: 4 });
    assert.equal(panel.querySelector('.freesia-gallery-grid').style.getPropertyValue('--freesia-gallery-columns'), '3');

    api.stop();
    dom.window.close();
});

test('layout settings persist, allow only 2/3/4 columns and 1-15 rows, and paginate without rendering every character', async () => {
    const { dom, api, calls, context } = setup();
    for (let index = 0; index < 65; index += 1) {
        context.characters.push({
            avatar: 'extra-' + index + '.png',
            name: 'Extra ' + index,
            description: '',
            data: { extensions: {} },
        });
    }
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    assert.equal(panel.querySelectorAll('.freesia-gallery-card').length, 12);
    assert.equal(panel.querySelectorAll('.freesia-gallery-pagination button').length, 2);
    assert.equal(api.getLayoutSettings().columns, 4);
    assert.equal(api.getLayoutSettings().rows, 3);
    assert.equal(panel.querySelector('.freesia-gallery-layout-controls'), null);

    assert.deepEqual(JSON.parse(JSON.stringify(api.setLayoutSettings({ columns: 2 }))), { columns: 2, rows: 3 });
    assert.equal(panel.querySelectorAll('.freesia-gallery-card').length, 6);
    assert.equal(JSON.parse(calls.storage.freesiaGallerySettings).columns, 2);

    assert.deepEqual(JSON.parse(JSON.stringify(api.setLayoutSettings({ rows: 15 }))), { columns: 2, rows: 15 });
    assert.equal(panel.querySelectorAll('.freesia-gallery-card').length, 30);
    assert.equal(JSON.parse(calls.storage.freesiaGallerySettings).rows, 15);

    assert.deepEqual(JSON.parse(JSON.stringify(api.setLayoutSettings({ columns: 4 }))), { columns: 4, rows: 15 });
    assert.equal(panel.querySelectorAll('.freesia-gallery-card').length, 60);
    assert.equal(panel.querySelectorAll('.freesia-gallery-pagination button').length, 2);
    assert.equal(panel.querySelector('.freesia-gallery-summary').textContent.includes('第 1 / 2 页'), true);

    panel.querySelectorAll('.freesia-gallery-pagination button')[1].click();
    assert.equal(panel.querySelectorAll('.freesia-gallery-card').length, 7);
    assert.equal(panel.querySelector('.freesia-gallery-summary').textContent.includes('第 2 / 2 页'), true);

    assert.equal(api.setLayoutSettings({ columns: 5 }), false);
    assert.equal(api.setLayoutSettings({ rows: 16 }), false);
    const updatedSettings = api.setLayoutSettings({ columns: 3, rows: 1 });
    assert.equal(updatedSettings.columns, 3);
    assert.equal(updatedSettings.rows, 1);
    assert.equal(panel.querySelectorAll('.freesia-gallery-card').length, 3);

    api.stop();
    dom.window.close();
});
