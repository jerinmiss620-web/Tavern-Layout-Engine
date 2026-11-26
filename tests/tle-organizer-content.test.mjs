import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { JSDOM } from 'jsdom';
import { OrganizerContent } from '../development/organizer/batch/controller.js';
import { resolveScope, describeResource } from '../development/organizer/batch/catalog.js';
import { BatchService } from '../plugins/global-batch-replace/batch-server.js';
import { BatchService as OriginalService } from './fixtures/upstream-pc-1.1.0/batch-server.js';
import { TtBatchService, ttHash } from '../development/organizer/batch/batch-tt.js';
import { zipSync } from '../development/organizer/batch/vendor/fflate.js';
import { createHash, randomUUID } from 'node:crypto';

function fixture(t, Service = BatchService) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'tle-content-'));
    t.after(() => { if (path.basename(root).startsWith('tle-content-')) fs.rmSync(root, { recursive: true, force: true }); });
    const write = (p, value) => { fs.mkdirSync(path.dirname(path.join(root, p)), { recursive: true }); fs.writeFileSync(path.join(root,p), typeof value === 'string' ? value : JSON.stringify(value)); };
    const read = p => fs.readFileSync(path.join(root,p), 'utf8');
    write('settings.json', { power_user: { personas: { 'a.png': 'Alice', 'b.png': 'Bob' }, persona_descriptions: { 'a.png': { description: 'old text' }, 'b.png': { description: 'old text' } } }, oai_settings: { prompts: [] }, extension_settings: { regex: [] } });
    write('characters/A.json', { data: { description: 'old old text', first_mes: 'old greeting', extensions: { unknown: 'old stays' } }, name: 'old ID untouched' });
    write('worlds/B.json', { entries: { 0: { uid: 0, content: 'old world', key: ['old'] } }, binding: 'old ID' });
    write('OpenAI Settings/P.json', { main_prompt: 'old prompt' });
    write('TextGen Settings/P.json', { main_prompt: 'old other provider' });
    const service = new Service(root), calls = [];
    const client = { host: 'st', async call(name, body = {}) {
        calls.push(name);
        if (name === 'inventory') return service.inventory();
        if (name === 'scan') return service.startScan(body);
        if (name === 'status') return service.status(body.id);
        if (name === 'preview') return service.preview(body.id, body.fileId, body.offset);
        if (name === 'apply') return service.apply(body);
        if (name === 'backups') return service.backups();
        if (name === 'restore') return service.restore(body);
        if (name === 'cancel') { service.job(body.id).cancelled = true; return {}; }
        throw Error(name);
    } };
    const dom = new JSDOM('<main><div id="search"><input type="search" class="tle-search-field"></div><div id="list"></div><small id="status"></small></main>', { url: 'https://tle.test' });
    t.after(() => dom.window.close());
    const d = dom.window.document, node = (tag, cls = '', text = '') => { const n = d.createElement(tag); n.className = cls; n.textContent = text; return n; };
    const button = (text, action) => { const b = node('button', 'menu_button', text); b.type = 'button'; b.addEventListener('click', action); return b; };
    const state = { module: 'character', entries: [{ key: 'A.json', value: 'A.json', label: 'Card A' }], selected: new Set(['A.json']) }; state.filtered = state.entries;
    let saved = { combinations: { legacy: [{ find: 'old', replace: '' }] }, targets: ['preserve-old-selection'], mode: 'local' }, reloaded = false, resume;
    const h = { window: dom.window, search: d.querySelector('input'), searchWrap: d.querySelector('#search'), list: d.querySelector('#list'), status: d.querySelector('#status'), node, button,
        namePlaceholder: '资源名称', context: () => ({ accountStorage: { getItem: () => 'account', setItem() {} } }),
        store: { async get() { return structuredClone(saved); }, async set(key, value) { saved = structuredClone(value); } }, createClient: async () => client,
        scopeState: () => state, render: () => c.renderList(), setContentMode() {}, lock(v) { h.list.inert = v; }, saveResume(value) { resume = value; }, reload() { reloaded = true; }, reloading: () => reloaded,
        resourceRow(entry, s) { const summary = node('summary', 'tle-quick-item'); const check = node('input', 'tle-quick-item-check'); check.type = 'checkbox'; check.checked = s.checked; check.indeterminate = s.indeterminate; check.addEventListener('change', () => s.onSelect(check.checked)); summary.append(check,node('span','tle-quick-item-title',entry.label)); return summary; },
    };
    const c = new OrganizerContent(h); d.querySelector('main').prepend(c.searchRow, c.controls);
    const ready = async (replace = 'new') => { await c.setMode('content'); c.rules = [{ find: 'old', replace }]; c.syncInputs(); };
    return { root, read, write, service, c, h, state, client, calls, ready, saved: () => saved, reloaded: () => reloaded, resume: () => resume, d };
}

test('one shared search and list; independent mode queries; legacy combination namespace survives', async t => {
    const f = fixture(t); f.h.search.value = 'Card'; await f.ready();
    await f.c.setMode('name'); assert.equal(f.h.search.value, 'Card');
    await f.c.setMode('content'); assert.equal(f.h.search.value, 'old');
    assert.equal(f.d.querySelectorAll('input[type=search]').length, 1);
    assert.equal(f.d.querySelectorAll('#list').length, 1); assert.equal(f.d.querySelectorAll('dialog,iframe').length, 0);
    assert.equal(f.c.replace.classList.contains('tle-search-field'), false);
    await f.c.persist(); assert.deepEqual(f.saved().targets, ['preserve-old-selection']); assert.ok(f.saved().combinations.legacy);
});
test('all supported scans across categories without writing; preview is mandatory', async t => {
    const f = fixture(t); await f.ready(); const before = f.read('characters/A.json');
    await f.c.scan(); assert.ok(f.c.rows.length >= 8); assert.ok(f.c.groups.some(g => g.module === 'worldInfo'));
    assert.equal(f.calls.includes('apply'), false); assert.equal(fs.existsSync(path.join(f.root,'backups')), false);
    await assert.rejects(f.c.apply(), /预览/); assert.equal(f.read('characters/A.json'), before);
    await assert.rejects(Promise.resolve().then(() => f.service.apply({id:f.c.jobId})), /仅查找/);
});
test('current filter and selected scopes reuse organizer keys; no chat spillover or provider collision', async t => {
    const f = fixture(t); await f.ready(); f.c.scope = 'filtered'; await f.c.scan();
    assert.equal(f.c.groups.length,1); assert.equal(f.c.rows.length,3);
    const inv = f.service.inventory();
    const scope = resolveScope(inv,'selected','preset',[{key:JSON.stringify(['settings_preset_openai','P'])}],new Set([JSON.stringify(['settings_preset_openai','P'])]));
    assert.deepEqual(scope.fileIds, inv.resources.filter(r=>r.relative==='OpenAI Settings/P.json').map(r=>r.id));
    f.state.selected.clear(); f.c.syncScope(); assert.equal(f.c.scopeSelect.querySelector('[value=selected]').disabled, true);
    assert.throws(()=>resolveScope(inv,'selected','character',f.state.entries,f.state.selected),/选择资源/);
    assert.throws(()=>resolveScope(inv,'filtered','theme',[{key:'t'}],new Set()),/不支持/);
});
test('partial match deletion previews original/after in place and leaves IDs, unknown fields and resource selection intact', async t => {
    const f = fixture(t); await f.ready(''); f.c.scope='selected'; await f.c.scan();
    f.c.excluded.add(f.c.rows[1].id); await f.c.preview();
    assert.equal(f.c.confirm.hidden,false); assert.match(f.c.confirmText.textContent,/即将删除 2 处匹配文本，涉及 1 个资源/);
    assert.match(f.h.list.textContent,/原文：old old text/); assert.match(f.h.list.textContent,/改后： old text/);
    assert.equal(f.read('characters/A.json').includes('old old text'),true);
    await f.c.apply(); const after=JSON.parse(f.read('characters/A.json'));
    assert.equal(after.data.description,' old text'); assert.equal(after.data.first_mes,' greeting');
    assert.equal(after.name,'old ID untouched'); assert.equal(after.data.extensions.unknown,'old stays');
    assert.deepEqual([...f.state.selected],['A.json']); assert.equal(f.reloaded(),true); assert.match(f.resume(),/成功 2/);
});
test('resource parent deselects children and mixed selection is indeterminate; selection invalidates preview', async t => {
    const f=fixture(t); await f.ready(); f.c.scope='selected'; await f.c.scan();
    f.c.excluded.add(f.c.rows[0].id); f.c.renderList(); assert.equal(f.h.list.querySelector('summary input').indeterminate,true);
    await f.c.preview(); f.c.selectAll(false); assert.equal(f.c.confirm.hidden,true); await assert.rejects(f.c.apply(),/预览/);
    f.c.selectAll(true); await f.c.preview(); await f.c.apply(); assert.match(f.read('characters/A.json'),/new new text/);
});
test('whole resource exclusion keeps other resources selected and unchanged excluded content', async t => {
    const f=fixture(t); await f.ready(); await f.c.scan();
    const group=f.c.groups.find(g=>g.module==='character'); group.rows.forEach(r=>f.c.excluded.add(r.id));
    await f.c.preview(); await f.c.apply(); assert.match(f.read('characters/A.json'),/old old text/); assert.match(f.read('worlds/B.json'),/new world/);
});
test('multiple rules use upstream longest-overlap/non-cascading semantics', async t=>{
    const f=fixture(t); await f.ready(); f.c.rules=[{find:'old old',replace:'old'},{find:'old',replace:'X'}]; f.c.syncInputs(); f.c.scope='selected';
    await f.c.scan(); await f.c.preview(); await f.c.apply(); const card=JSON.parse(f.read('characters/A.json'));
    assert.equal(card.data.description,'old text'); assert.equal(card.data.first_mes,'X greeting');
});
test('conflict between search and preview requires a new search; execute rechecks after preview', async t=>{
    const f=fixture(t); await f.ready(); f.c.scope='selected'; await f.c.scan();
    f.write('characters/A.json',{data:{description:'old changed'}}); await assert.rejects(f.c.preview(),/发生变化/);
    assert.equal(f.c.confirm.hidden,true); await f.c.scan(); await f.c.preview(); f.write('characters/A.json',{data:{description:'old concurrent'}});
    await f.c.apply(); assert.match(f.read('characters/A.json'),/old concurrent/); assert.match(f.resume(),/失败/);
});
test('changing rules or scoped organizer filters clears stale preview and changing mode does not delete resources',async t=>{
    const f=fixture(t); await f.ready(); f.c.scope='selected'; await f.c.scan(); await f.c.preview();
    f.c.contextChanged(); assert.equal(f.c.snapshot,null); await assert.rejects(f.c.apply(),/预览/);
    await f.c.setMode('name'); assert.equal(f.c.active,false); assert.deepEqual([...f.state.selected],['A.json']); assert.equal(f.calls.includes('apply'),false);
});
test('paged selections beyond 100 matches preserve exclusions through preview and execution', async t=>{
    const f=fixture(t); f.write('characters/A.json',{data:{description:Array(205).fill('old').join(' ')}});
    await f.ready(''); f.c.scope='selected'; await f.c.scan(); assert.equal(f.c.rows.length,205);
    f.c.excluded.add(f.c.rows[204].id); await f.c.preview(); await f.c.apply();
    assert.equal(JSON.parse(f.read('characters/A.json')).data.description,' '.repeat(204)+'old');
});
test('preview cannot silently select new shorter matches hidden by an unchanged longer rule', async t=>{
    const f=fixture(t); await f.ready(); f.c.rules=[{find:'old old',replace:'old old'},{find:'old',replace:'X'}]; f.c.syncInputs(); f.c.scope='selected';
    await f.c.scan(); await assert.rejects(f.c.preview(),/新的匹配/); assert.equal(f.calls.includes('apply'),false);
});
test('missing PC plugin reports install steps, upstream status without optional hash remains supported', async t=>{
    const f=fixture(t); await f.ready(); const call=f.client.call.bind(f.client);
    f.client.call=async(name,body)=>{if(name==='inventory')throw Error('请安装 plugins/global-batch-replace 并启用 enableServerPlugins');return call(name,body);};
    await assert.rejects(f.c.scan(),/enableServerPlugins/); assert.equal(f.c.busy,false); assert.equal(f.calls.includes('apply'),false);
    f.client.call=async(name,body)=>{const r=await call(name,body);if(name==='status')r.files.forEach(f=>delete f.beforeHash);return r;};
    await f.c.scan(); assert.ok(f.c.rows.length > 0); assert.equal(f.calls.includes('apply'),false);
});
test('unmodified upstream v1.1.0 supports search, partial empty replacement, backup and restore', async t=>{
    const f=fixture(t,OriginalService); await f.ready(''); f.c.scope='selected'; const before=f.read('characters/A.json');
    await f.c.scan(); assert.equal(f.c.snapshot.files[0].beforeHash,undefined); assert.equal(f.c.rows.length,3);
    f.c.excluded.add(f.c.rows[1].id); await f.c.preview(); await f.c.apply();
    assert.equal(JSON.parse(f.read('characters/A.json')).data.description,' old text');
    const backups=f.service.backups(); assert.equal(backups.length,1);
    await f.c.backups(); assert.match(f.h.list.textContent,/恢复整份备份/);
    assert.equal(f.h.list.querySelector('input[type=checkbox]').disabled,true);
    assert.equal(f.service.restore({id:backups[0].id}).restored,1);assert.equal(f.read('characters/A.json'),before);
});
test('upstream compatibility detects changed preview context, and original server rejects post-preview conflicts',async t=>{
    const f=fixture(t,OriginalService); await f.ready(); f.c.scope='selected'; await f.c.scan();
    f.write('characters/A.json',{data:{description:'old old changed',first_mes:'old greeting'}});
    await assert.rejects(f.c.preview(),/发生变化/); assert.equal(f.calls.includes('apply'),false);
    await f.c.scan();await f.c.preview();f.write('characters/A.json',{data:{description:'concurrent value'}});
    await f.c.apply();assert.match(f.read('characters/A.json'),/concurrent value/);assert.match(f.resume(),/失败/);
});
test('native content-search checkbox and adjacent controls retain one shared search field', t => {
    const f = fixture(t);
    assert.match(f.c.target.textContent,/查找和替换/);
    assert.equal(f.c.target.tagName,'LABEL');
    assert.ok(f.c.target.classList.contains('checkbox_label'));
    assert.equal(f.c.modeToggle.type,'checkbox');
    assert.equal(f.c.modeToggle.parentElement,f.c.target);
    assert.equal(f.c.findButton.parentElement,f.c.findRow);
    assert.equal(f.h.searchWrap.parentElement,f.c.findRow);
    assert.equal(f.c.previewButton.parentElement,f.c.replaceRow);
    assert.equal(f.d.querySelectorAll('input[type=search]').length,1);
});
test('rule combinations use two compact toolbars; only the JSON path editor spans the full row', t => {
    const f = fixture(t), c = f.c;
    assert.equal(c.addRuleButton.parentElement,c.comboCreateRow);
    assert.equal(c.comboName.parentElement,c.comboCreateRow);
    assert.equal(c.saveComboButton.parentElement,c.comboCreateRow);
    assert.equal(c.comboSelect.parentElement,c.comboManageRow);
    assert.equal(c.loadComboButton.parentElement,c.comboManageRow);
    assert.equal(c.deleteComboButton.parentElement,c.comboManageRow);
    assert.equal(c.comboCreateRow.parentElement,c.ruleDetails);
    assert.equal(c.ruleRows.parentElement,c.ruleDetails);
    assert.equal(c.comboManageRow.parentElement,c.ruleDetails);
    assert.ok(c.comboCreateRow.classList.contains('flexWrap'));
    assert.ok(c.comboManageRow.classList.contains('flexWrap'));
    assert.ok(c.comboName.classList.contains('flex1'));
    assert.ok(c.comboSelect.classList.contains('flex1'));
    assert.equal(c.paths.tagName,'TEXTAREA');
    assert.ok(c.paths.classList.contains('tle-content-rule-paths'));
    c.rules = [{find:'',replace:''},{find:'extra',replace:'value'}];
    c.renderRules();
    const ruleRow = c.ruleRows.firstElementChild;
    assert.ok(ruleRow.classList.contains('flexWrap'));
    assert.ok(ruleRow.children[0].classList.contains('flex1'));
    assert.ok(ruleRow.children[1].classList.contains('flex1'));
    const runtime = fs.readFileSync('development/organizer/TLE.js','utf8');
    assert.match(runtime,/\.tle-content-rule-toolbar > \.text_pole/);
    assert.match(runtime,/\.tle-content-rule-toolbar > button/);
    assert.match(runtime,/\.tle-content-rule-paths \{ width: 100%/);
});

test('TT capabilities exclude unsupported types and descriptor resolves stable world/persona IDs',()=>{
    const inv={supportedScopes:['persona','chats','character','greetings','world'],resources:[],owners:[],scopes:{}};
    assert.deepEqual(resolveScope(inv,'all','preset',[],new Set()).scopes,inv.supportedScopes);
    assert.throws(()=>resolveScope(inv,'filtered','preset',[{key:'p'}],new Set()),/不支持/);
    assert.equal(describeResource({id:'tt:world:a',name:'a',adapter:'world',relative:'世界书 · a'},'','world').key,JSON.stringify(['world_info','a']));
});
test('typed result groups keep embedded lore separate and group selection affects only its matches',async t=>{
    const f=fixture(t);f.write('characters/A.json',{data:{description:'old character',first_mes:'old greeting',character_book:{entries:[{content:'old embedded lore'}]}}});
    f.write('chats/A/test.jsonl',JSON.stringify({user_name:'User',character_name:'A'})+'\n'+JSON.stringify({mes:'old chat',is_user:true})+'\n');
    await f.ready();await f.c.scan();
    const sections=f.c.resultSections();assert.deepEqual(sections.map(s=>s.key),['character','chats','world','persona','presets']);
    const lore=sections.find(s=>s.key==='world');assert.equal(lore.groups.length,2);
    const selectedBefore=f.c.rows.length;
    f.c.selectRows(lore.rows,false);assert.equal(f.c.excluded.size,lore.rows.length);assert.ok(f.c.rows.filter(r=>r.scope!=='world').every(r=>!f.c.excluded.has(r.id)));
    let parent=f.h.list.querySelector('[data-content-section="world"] > summary input');assert.equal(parent.checked,false);
    f.c.selectRows([lore.rows[0]],true);parent=f.h.list.querySelector('[data-content-section="world"] > summary input');assert.equal(parent.indeterminate,true);
    const section=f.h.list.querySelector('[data-content-section="chats"]');section.open=false;
    f.c.selectRows(lore.rows,true);assert.equal(f.h.list.querySelector('[data-content-section="chats"]').open,false);
    assert.equal(f.c.rows.filter(r=>!f.c.excluded.has(r.id)).length,selectedBefore);
    await f.c.preview();f.c.selectRows(lore.rows,false);assert.equal(f.c.confirm.hidden,true);await assert.rejects(f.c.apply(),/预览/);
});
test('PC selected restore and ZIP reimport are verified, isolated, non-overwriting and reject foreign/corrupt archives',async t=>{
    const f=fixture(t); const job=f.service.startScan({rules:[{find:'old',replace:'new'}],scopes:['character','world'],mode:'global'}); await f.service.job(job.id).done;
    const result=f.service.apply(job); const manifest=f.service.manifest(result.id);
    const a=f.service.restore({id:result.id,paths:['characters/A.json']}); assert.equal(a.restored,1); assert.match(f.read('worlds/B.json'),/new world/); assert.equal(f.service.manifest(result.id).status,'partially-restored');
    const bytes={}; const imported={...manifest,id:randomUUID()}; bytes['manifest.json']=Buffer.from(JSON.stringify(imported));
    for(const file of manifest.files) bytes[file.backup]=fs.readFileSync(path.join(f.root,'backups/global-batch-replace',result.id,file.backup));
    const zip=()=>Buffer.from(zipSync(bytes)); const res=await f.service.importBackup(zip()); assert.equal(res.files,2);
    await assert.rejects(f.service.importBackup(zip()),/已存在/);
    bytes['manifest.json']=Buffer.from(JSON.stringify({...imported,id:randomUUID(),dataset:'foreign'})); await assert.rejects(f.service.importBackup(zip()),/当前用户/);
    bytes['manifest.json']=Buffer.from(JSON.stringify({...imported,id:randomUUID()})); bytes['0.bin']=Buffer.from('corrupt'); await assert.rejects(f.service.importBackup(zip()),/完整性/);
    bytes['../escape.bin']=Buffer.from('x'); await assert.rejects(f.service.importBackup(zip()),/路径|invalid/);
});
test('TT specified-resource restore leaves other backup records and business resources intact', async()=>{
    const values=new Map(), store={async setJson(o){values.set(o.key,structuredClone(o.value));},async getJson(o){return values.get(o.key);}};
    const s=new TtBatchService({context:()=>({})}); s.store=store; s.dataset='d'; s.root='root'; s.assertTarget=async()=>{};
    const before={entries:{0:{content:'old'}}}, after={entries:{0:{content:'new'}}};
    const files=['a','b'].map(id=>({resource:{id,relative:id},beforeHash:'',afterHash:'',backup:id,state:'committed'}));
    for(const f of files){f.beforeHash=await ttHash(before); f.afterHash=await ttHash(after);}
    const manifest={id:'test',files}; s.manifest=async()=>manifest; s.inventory=async()=>({resources:files.map(f=>f.resource)});
    const data=new Map(files.map(f=>[f.resource.id,structuredClone(after)])); s.read=async r=>data.get(r.id); s.getValue=async key=> key==='a'||key==='b'?before:after;
    s.write=async(r,v)=>data.set(r.id,v);
    const result=await s.restore({id:'test',paths:['a']}); assert.equal(result.restored,1); assert.deepEqual(data.get('b'),after); assert.equal(manifest.status,'partially-restored');
});

test('development build preserves a single Organizer, protected resource deletion and no independent GBR UI',()=>{
    const s=fs.readFileSync('development/organizer/TLE.js','utf8');
    assert.doesNotMatch(s,/global-batch-replace-dialog|gbr-batch-owner-list|class BatchPanel|class GlobalBatchApp/);
    assert.equal((s.match(/panel.id = ID.organizerPanel/g)||[]).length,1);
    assert.match(s,/if \(content\?\.active\) \{ content.renderList\(\); return; \}/);
    assert.match(s,/content\?\.active \|\| content\?\.busy/);
    assert.match(s,/persona: true/); assert.match(s,/theme: true/);
    assert.doesNotMatch(s,/input\.tle-search-field\[type="search"\]\s*\{/);
    const panel=s.slice(s.indexOf('  function createOrganizerPanel()'),s.indexOf('  function createRailControls()'));
    assert.doesNotMatch(panel,/<button[^>]*tle-search-clear/);
});
