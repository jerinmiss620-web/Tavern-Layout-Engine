import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const scriptPath = fileURLToPath(new URL('../development/gallery-home/Freesia-Gallery-Home-0.1.0.js', import.meta.url));
const script = readFileSync(scriptPath, 'utf8');

function createHomeMarkup() {
    return '<div id="chat">' +
        '<div class="welcomePanel">' +
            '<div class="welcomeHeaderTitle"><span class="welcomeHeaderVersionDisplay">SillyTavern</span></div>' +
            '<div class="welcomeHeader"><div class="recentChatsTitle">Recent Chats</div></div>' +
            '<div class="welcomeRecent">' +
                '<div class="recentChatList" role="list">' +
                    '<div class="recentChat" data-file="A-old" data-avatar="a.png" data-group="">' +
                        '<div class="avatar"><img src="/a.png" alt="Alpha"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Alpha</strong></div><small class="chatDate" title="2026-11-20">11/20/2026</small></div><div class="chatMessageContainer"><div class="chatMessage">old message</div></div></div>' +
                    '</div>' +
                    '<div class="recentChat hidden" data-file="A-new" data-avatar="a.png" data-group="">' +
                        '<div class="avatar"><img src="/a.png" alt="Alpha"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Alpha</strong></div><small class="chatDate" title="2026-11-26">11/26/2026</small></div><div class="chatMessageContainer"><div class="chatMessage">new message</div></div></div>' +
                    '</div>' +
                    '<div class="recentChat" data-file="B-one" data-avatar="b.png" data-group="">' +
                        '<div class="avatar"><img src="/b.png" alt="Beta"></div>' +
                        '<div class="recentChatInfo"><div class="chatNameContainer"><div class="chatName"><strong class="characterName">Beta</strong></div><small class="chatDate" title="2026-11-22">11/22/2026</small></div><div class="chatMessageContainer"><div class="chatMessage">beta message</div></div></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
}

function createContext(openCalls) {
    return {
        characters: [
            { avatar: 'a.png', name: 'Alpha' },
            { avatar: 'b.png', name: 'Beta' },
        ],
        accountStorage: { getItem: () => null },
        getRequestHeaders: () => ({ 'Content-Type': 'application/json' }),
        getThumbnailUrl: (type, avatar) => '/thumbnails/' + avatar,
        selectCharacterById: async (id) => { openCalls.selected = id; },
        openCharacterChat: async (chatName) => { openCalls.opened = chatName; },
        getCurrentChatId: () => undefined,
        saveSettingsDebounced: () => {},
        eventSource: { on: () => {}, off: () => {} },
        eventTypes: {},
    };
}

test('groups every returned character chat by avatar and sorts the latest session first', () => {
    const dom = new JSDOM(createHomeMarkup(), { url: 'http://localhost/', runScripts: 'outside-only' });
    const context = createContext({});
    dom.window.SillyTavern = { getContext: () => context };
    dom.window.fetch = async () => ({ ok: true, json: async () => [] });
    dom.window.eval(script);
    const api = dom.window.FreesiaGalleryHome;

    const result = api._groupChats([
        { avatar: 'a.png', file_id: 'A-old', file_name: 'A-old.jsonl', last_mes: '2026-11-20T10:00:00Z', mes: 'old', group: '' },
        { avatar: 'a.png', file_id: 'A-new', file_name: 'A-new.jsonl', last_mes: '2026-11-26T10:00:00Z', mes: 'new', group: '' },
        { avatar: 'b.png', file_id: 'B-one', file_name: 'B-one.jsonl', last_mes: '2026-11-22T10:00:00Z', mes: 'beta', group: '' },
        { avatar: '', file_id: 'root', file_name: 'root.jsonl', group: '' },
        { avatar: 'a.png', group: 'group-1', file_id: 'group-chat', file_name: 'group-chat.jsonl' },
    ], context, []);

    assert.equal(result.length, 2);
    assert.equal(result[0].name, 'Alpha');
    assert.equal(result[0].chats.length, 2);
    assert.equal(result[0].latestChat.chatName, 'A-new');
    assert.equal(result[1].name, 'Beta');
    dom.window.FreesiaGalleryHome.stop();
    dom.window.close();
});

test('renders grouped cards, opens the latest chat, toggles native view, and restores the native list', async () => {
    const dom = new JSDOM(createHomeMarkup(), { url: 'http://localhost/', runScripts: 'outside-only' });
    const openCalls = {};
    const context = createContext(openCalls);
    const records = [
        { avatar: 'a.png', file_id: 'A-old', file_name: 'A-old.jsonl', last_mes: '2026-11-20T10:00:00Z', mes: 'old message', group: '' },
        { avatar: 'a.png', file_id: 'A-new', file_name: 'A-new.jsonl', last_mes: '2026-11-26T10:00:00Z', mes: 'new message', group: '' },
        { avatar: 'b.png', file_id: 'B-one', file_name: 'B-one.jsonl', last_mes: '2026-11-22T10:00:00Z', mes: 'beta message', group: '' },
    ];
    dom.window.SillyTavern = { getContext: () => context };
    dom.window.fetch = async () => ({ ok: true, json: async () => records });
    dom.window.eval(script);
    const api = dom.window.FreesiaGalleryHome;
    api.start();
    await api.refresh();

    const panel = dom.window.document.querySelector('.welcomePanel');
    const nativeList = panel.querySelector('.welcomeRecent > .recentChatList:not(.freesia-gallery-list)');
    const cards = panel.querySelectorAll('.freesia-gallery-card');

    assert.equal(cards.length, 2);
    assert.equal(cards[0].querySelector('.characterName').textContent, 'Alpha');
    assert.match(cards[0].textContent, /2/);
    assert.equal(nativeList.isConnected, true);
    assert.equal(panel.classList.contains('freesia-gallery-active'), true);

    cards[0].dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    await new Promise(resolve => dom.window.setTimeout(resolve, 0));
    assert.equal(openCalls.selected, 0);
    assert.equal(openCalls.opened, 'A-new');

    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), true);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, 'Recent Chats');
    api.toggleView();
    assert.equal(panel.classList.contains('freesia-gallery-native'), false);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, '角色画廊');

    api.stop();
    assert.equal(panel.classList.contains('freesia-gallery-active'), false);
    assert.equal(panel.querySelector('.freesia-gallery-list'), null);
    assert.equal(nativeList.isConnected, true);
    assert.equal(panel.querySelector('.recentChatsTitle').textContent, 'Recent Chats');
    dom.window.close();
});

test('fallback mode includes native collapsed items marked with the hidden class', async () => {
    const dom = new JSDOM(createHomeMarkup(), { url: 'http://localhost/', runScripts: 'outside-only' });
    dom.window.fetch = async () => { throw new Error('API unavailable'); };
    dom.window.eval(script);
    const api = dom.window.FreesiaGalleryHome;
    api.start();
    await api.refresh();

    const cards = dom.window.document.querySelectorAll('.freesia-gallery-card');
    assert.equal(cards.length, 2);
    const alpha = Array.from(cards).find(card => card.dataset.avatar === 'a.png');
    assert.ok(alpha);
    assert.match(alpha.textContent, /2/);
    assert.match(alpha.textContent, /A-new/);

    api.stop();
    dom.window.close();
});
