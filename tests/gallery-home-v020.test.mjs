import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const scriptPath = fileURLToPath(new URL('../development/gallery-home/Freesia-Gallery-Home-0.2.0.js', import.meta.url));
const script = readFileSync(scriptPath, 'utf8');

function createHomeMarkup() {
    return '<div id="chat">' +
        '<div class="welcomePanel">' +
            '<div class="welcomeHeaderTitle">' +
                '<span class="welcomeHeaderVersionDisplay">SillyTavern</span>' +
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
        accountStorage: {
            getItem: key => key === 'recentChatsSettings'
                ? JSON.stringify({ maxDisplayed: 15, collapsedDisplayed: 1 })
                : key === 'pinnedChats' ? null : null,
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
        eventSource: { on: () => {}, off: () => {} },
        eventTypes: {},
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
    const calls = { selected: [], opened: [], nativeOpened: 0, pinned: 0 };
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
        throw new Error('Unexpected request: ' + url);
    };

    const nativeRows = dom.window.document.querySelectorAll('.welcomeRecent .recentChat');
    nativeRows.forEach(row => {
        row.addEventListener('click', () => { calls.nativeOpened += 1; });
        row.querySelector('.pinChat').addEventListener('click', event => {
            event.stopPropagation();
            calls.pinned += 1;
        });
    });

    dom.window.eval(script);
    const api = dom.window.FreesiaGalleryHome;
    api.start();
    return { dom, api, calls, context };
}

test('renders a portrait-first four-column gallery with independent identity and latest-chat zones', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const cards = panel.querySelectorAll('.freesia-gallery-card');
    const css = dom.window.document.getElementById('freesia-gallery-home-style').textContent;

    assert.equal(calls.recentBody.max, 15);
    assert.equal(api.getSettings().collapsedDisplayed, 1);
    assert.equal(cards.length, 2);
    assert.equal(cards[0].querySelector('.freesia-gallery-card-identity .avatar').isConnected, true);
    assert.equal(cards[0].querySelector('.freesia-gallery-card-name').textContent, 'Alpha');
    assert.match(cards[0].querySelector('.freesia-gallery-chat-count').textContent, /2 个聊天/);
    assert.match(cards[0].querySelector('.freesia-gallery-card-preview').textContent, /latest preview/);
    assert.ok(cards[1].classList.contains('freesia-gallery-collapsed'));
    assert.match(css, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
    assert.match(css, /aspect-ratio: 3 \/ 4/);
    assert.doesNotMatch(css, /grid-template-columns: 136px/);
    assert.ok(panel.querySelector('.recentChatsSettings'));
    assert.ok(panel.querySelector('.recentChatList:not(.freesia-gallery-grid)').isConnected);

    cards[0].querySelector('.freesia-gallery-card-identity').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    assert.equal(api.getPage(), 'detail');
    assert.equal(calls.nativeOpened, 0);

    api.stop();
    dom.window.close();
});

test('detail page shows description and lorebook, while management jumps to the native character editor', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();
    await api.openDetail('a.png');

    const panel = dom.window.document.querySelector('.welcomePanel');
    assert.equal(api.getPage(), 'detail');
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, '角色详情');
    assert.equal(panel.querySelector('.freesia-gallery-detail-name').textContent, 'Alpha');
    assert.match(panel.querySelector('.freesia-gallery-lorebook').textContent, /Alpha Lorebook/);
    assert.match(panel.querySelector('.freesia-gallery-description').textContent, /read-only character information/);
    assert.equal(panel.querySelectorAll('.freesia-gallery-session-card').length, 3);
    assert.match(panel.querySelector('.freesia-gallery-detail-chat-count').textContent, /3 个聊天/);

    panel.querySelector('.freesia-gallery-manage').click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    assert.equal(calls.selected.length, 1);
    assert.equal(calls.selected[0].index, 0);
    assert.equal(calls.selected[0].options.switchMenu, true);
    assert.equal(calls.opened.length, 0);

    api.stop();
    dom.window.close();
});

test('chat files page lists all sessions and opens an older chat through the native context', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();
    await api.openDetail('a.png');

    dom.window.document.querySelector('.freesia-gallery-detail-chat-header button').click();
    assert.equal(api.getPage(), 'files');
    assert.equal(dom.window.document.querySelectorAll('.freesia-gallery-file-row').length, 3);
    assert.equal(dom.window.document.querySelector('.recentChatsTitle').textContent, '聊天文件');

    const oldFile = Array.from(dom.window.document.querySelectorAll('.freesia-gallery-file-row'))
        .find(row => row.textContent.includes('A-archive'));
    oldFile.click();
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));

    assert.deepEqual(calls.opened, ['A-archive']);
    assert.equal(calls.selected.length, 1);

    api.stop();
    dom.window.close();
});

test('latest-chat area opens the recent chat and cloned native actions forward to original buttons', async () => {
    const { dom, api, calls } = setup();
    await api.refresh();

    const card = dom.window.document.querySelector('.freesia-gallery-card');
    card.querySelector('.freesia-gallery-card-latest').click();
    assert.equal(calls.nativeOpened, 1);

    card.querySelector('.pinChat').click();
    assert.equal(calls.pinned, 1);

    api.stop();
    dom.window.close();
});

test('native recent-chat view and original settings remain available; stop restores the original page', async () => {
    const { dom, api } = setup();
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const nativeList = panel.querySelector('.welcomeRecent > .recentChatList:not(.freesia-gallery-grid)');
    assert.ok(panel.querySelector('.recentChatsSettings'));

    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), true);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, 'Recent Chats');

    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), false);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, '角色画廊');

    api.stop();
    assert.equal(panel.classList.contains('freesia-gallery-active'), false);
    assert.equal(panel.querySelector('.freesia-gallery-grid'), null);
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
    assert.equal(cards[0].querySelector('.freesia-gallery-card-name').textContent, 'Alpha');
    assert.match(cards[0].querySelector('.freesia-gallery-chat-count').textContent, /2 个聊天/);

    api.stop();
    dom.window.close();
});
