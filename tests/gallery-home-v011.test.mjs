import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const scriptPath = fileURLToPath(new URL('../development/gallery-home/Freesia-Gallery-Home-0.1.1.js', import.meta.url));
const script = readFileSync(scriptPath, 'utf8');

function createHomeMarkup() {
    return '<div id="chat">' +
        '<div class="welcomePanel">' +
            '<div class="welcomeHeaderTitle"><span class="welcomeHeaderVersionDisplay">SillyTavern</span><div class="mes_button recentChatsSettings"><i class="fa-solid fa-gear"></i></div></div>' +
            '<div class="welcomeHeader"><div class="recentChatsTitle">Recent Chats</div></div>' +
            '<div class="welcomeRecent">' +
                '<div class="recentChatList" role="list">' +
                    '<div class="recentChat" data-file="A-old" data-avatar="a.png" data-group="">' +
                        '<div class="avatar"><img src="/a.png" alt="Alpha"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Alpha</strong><span> – </span><span>A-old</span></div><small class="chatDate" title="2026-11-20">11/20/2026</small><div class="chatActions"><button class="menu_button menu_button_icon pinChat"><i class="fa-solid fa-thumbtack"></i></button><button class="menu_button menu_button_icon renameChat"><i class="fa-solid fa-pen"></i></button><button class="menu_button menu_button_icon deleteChat"><i class="fa-solid fa-trash"></i></button></div></div><div class="chatMessageContainer"><div class="chatMessage">old message</div><div class="chatStats"><div class="counterBlock"><small>10</small></div><small class="fileSize">2 KB</small></div></div></div>' +
                    '</div>' +
                    '<div class="recentChat hidden" data-file="A-new" data-avatar="a.png" data-group="">' +
                        '<div class="avatar"><img src="/a.png" alt="Alpha"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Alpha</strong><span> – </span><span>A-new</span></div><small class="chatDate" title="2026-11-26">11/26/2026</small><div class="chatActions"><button class="menu_button menu_button_icon pinChat"><i class="fa-solid fa-thumbtack"></i></button><button class="menu_button menu_button_icon renameChat"><i class="fa-solid fa-pen"></i></button><button class="menu_button menu_button_icon deleteChat"><i class="fa-solid fa-trash"></i></button></div></div><div class="chatMessageContainer"><div class="chatMessage">new message with a longer preview</div><div class="chatStats"><div class="counterBlock"><small>25</small></div><small class="fileSize">8 KB</small></div></div></div>' +
                    '</div>' +
                    '<div class="recentChat" data-file="B-one" data-avatar="b.png" data-group="">' +
                        '<div class="avatar"><img src="/b.png" alt="Beta"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Beta</strong><span> – </span><span>B-one</span></div><small class="chatDate" title="2026-11-22">11/22/2026</small><div class="chatActions"><button class="menu_button menu_button_icon pinChat"><i class="fa-solid fa-thumbtack"></i></button><button class="menu_button menu_button_icon renameChat"><i class="fa-solid fa-pen"></i></button><button class="menu_button menu_button_icon deleteChat"><i class="fa-solid fa-trash"></i></button></div></div><div class="chatMessageContainer"><div class="chatMessage">beta message</div><div class="chatStats"><div class="counterBlock"><small>8</small></div><small class="fileSize">1 KB</small></div></div></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function createContext() {
    return {
        characters: [{ avatar: 'a.png', name: 'Alpha' }, { avatar: 'b.png', name: 'Beta' }],
        groups: [],
        accountStorage: {
            getItem: key => key === 'recentChatsSettings'
                ? JSON.stringify({ maxDisplayed: 15, collapsedDisplayed: 1 })
                : null,
        },
        getRequestHeaders: () => ({ 'Content-Type': 'application/json' }),
        getThumbnailUrl: (type, avatar) => '/thumbnails/' + avatar,
        selectCharacterById: async () => {},
        openCharacterChat: async () => {},
        getCurrentChatId: () => undefined,
        saveSettingsDebounced: () => {},
        eventSource: { on: () => {}, off: () => {} },
        eventTypes: {},
    };
}

function createRecords() {
    return [
        { avatar: 'a.png', file_id: 'A-old', file_name: 'A-old.jsonl', last_mes: '2026-11-20T10:00:00Z', mes: 'old message', chat_items: 10, file_size: '2 KB', group: '' },
        { avatar: 'a.png', file_id: 'A-new', file_name: 'A-new.jsonl', last_mes: '2026-11-26T10:00:00Z', mes: 'new message with a longer preview', chat_items: 25, file_size: '8 KB', group: '' },
        { avatar: 'b.png', file_id: 'B-one', file_name: 'B-one.jsonl', last_mes: '2026-11-22T10:00:00Z', mes: 'beta message', chat_items: 8, file_size: '1 KB', group: '' },
    ];
}

test('groups character sessions and preserves latest preview and native metadata', () => {
    const dom = new JSDOM(createHomeMarkup(), { url: 'http://localhost/', runScripts: 'outside-only' });
    dom.window.SillyTavern = { getContext: () => createContext() };
    dom.window.fetch = async () => ({ ok: true, json: async () => createRecords() });
    dom.window.eval(script);

    const api = dom.window.FreesiaGalleryHome;
    const groups = api._groupChats(createRecords(), createContext(), []);

    assert.equal(groups.length, 2);
    assert.equal(groups[0].name, 'Alpha');
    assert.equal(groups[0].chats.length, 2);
    assert.equal(groups[0].latestChat.chatName, 'A-new');
    assert.equal(groups[0].latestChat.preview, 'new message with a longer preview');
    assert.equal(groups[0].latestChat.messageCount, '25');
    assert.equal(groups[0].latestChat.fileSize, '8 KB');

    api.stop();
    dom.window.close();
});

test('renders rich gallery, forwards native actions, expands sessions and applies native collapsed setting', async () => {
    const dom = new JSDOM(createHomeMarkup(), { url: 'http://localhost/', runScripts: 'outside-only' });
    const context = createContext();
    let requestBody = null;
    dom.window.SillyTavern = { getContext: () => context };
    dom.window.fetch = async (_url, options) => {
        requestBody = JSON.parse(options.body);
        return { ok: true, json: async () => createRecords() };
    };

    let nativeOpenCount = 0;
    let nativePinCount = 0;
    dom.window.document.querySelectorAll('.welcomeRecent .recentChat').forEach(row => {
        row.addEventListener('click', () => { nativeOpenCount += 1; });
        row.querySelector('.pinChat').addEventListener('click', () => { nativePinCount += 1; });
    });

    dom.window.eval(script);
    const api = dom.window.FreesiaGalleryHome;
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const nativeList = panel.querySelector('.welcomeRecent > .recentChatList:not(.freesia-gallery-list)');
    const cards = panel.querySelectorAll('.freesia-gallery-card');

    assert.equal(requestBody.max, 15);
    assert.equal(api.getSettings().collapsedDisplayed, 1);
    assert.equal(cards.length, 2);
    assert.equal(cards[0].querySelector('.characterName').textContent, 'Alpha');
    assert.match(cards[0].querySelector('.chatMessage').textContent, /new message with a longer preview/);
    assert.equal(cards[0].querySelector('.fileSize').textContent, '8 KB');
    assert.equal(cards[1].classList.contains('hidden'), true);
    assert.equal(nativeList.isConnected, true);
    assert.ok(panel.querySelector('.recentChatsSettings'));
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, '角色画廊');

    cards[0].querySelector('.pinChat').click();
    assert.equal(nativePinCount, 1);

    cards[0].querySelector('.freesia-gallery-chat-count').click();
    await api.refresh();
    const expanded = panel.querySelector('.freesia-gallery-session-list');
    assert.ok(expanded);
    assert.equal(expanded.querySelectorAll('.freesia-gallery-session-row').length, 2);

    expanded.querySelector('.freesia-gallery-session-row').click();
    assert.equal(nativeOpenCount, 1);

    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), true);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, 'Recent Chats');
    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), false);

    api.stop();
    assert.equal(panel.classList.contains('freesia-gallery-active'), false);
    assert.equal(panel.querySelector('.freesia-gallery-list'), null);
    assert.equal(nativeList.isConnected, true);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, 'Recent Chats');
    dom.window.close();
});

test('fallback mode groups all native rows including collapsed hidden rows', async () => {
    const dom = new JSDOM(createHomeMarkup(), { url: 'http://localhost/', runScripts: 'outside-only' });
    dom.window.fetch = async () => { throw new Error('API unavailable'); };
    dom.window.eval(script);
    const api = dom.window.FreesiaGalleryHome;
    await api.refresh();

    const cards = dom.window.document.querySelectorAll('.freesia-gallery-card');
    assert.equal(cards.length, 2);
    const alpha = Array.from(cards).find(card => card.querySelector('.characterName').textContent === 'Alpha');
    assert.ok(alpha);
    assert.match(alpha.querySelector('.freesia-gallery-chat-count').textContent, /2 个聊天/);

    api.stop();
    dom.window.close();
});
