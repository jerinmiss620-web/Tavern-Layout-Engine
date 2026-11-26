import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import express from 'express';
import { chromium } from 'playwright-core';
import { installBatchRoutes } from '../plugins/global-batch-replace/batch-server.js';
const source=fs.readFileSync('development/organizer/TLE.js','utf8');
assert.doesNotMatch(source,/modeButtons|tle-content-mode-switch|tle-content-mode-button/,'No custom mode selector hooks may remain');
assert.match(source,/this\.modeToggle = n\("input"\);/,'Organizer mode uses one native checkbox');
const nativePublic=process.env.TLE_ST_PUBLIC||'E:/SillyTavern/SillyTavern/public';
assert.ok(fs.existsSync(path.join(nativePublic,'style.css')),'Set TLE_ST_PUBLIC to a local SillyTavern public folder for native CSS checks');
const slice=(start,end)=>{const a=source.indexOf(start),b=source.indexOf(end,a);assert.ok(a>=0&&b>a);return source.slice(a,b);};
const root=fs.mkdtempSync(path.join(os.tmpdir(),'tle-browser-'));
const write=(p,v)=>{fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.writeFileSync(path.join(root,p),JSON.stringify(v));};
write('settings.json',{power_user:{personas:{'user.png':'测试身份'},persona_descriptions:{'user.png':{description:'旧签名 user'}}},oai_settings:{prompts:[]},extension_settings:{regex:[]}});
write('characters/A.json',{data:{description:'旧签名 第一段。旧签名 第二段。',first_mes:'你好，旧签名。'},name:'角色 A'});
write('worlds/世界书 B.json',{entries:{0:{content:'世界书旧签名正文',comment:'第一条目',uid:0}}});
write('OpenAI Settings/预设 P.json',{main_prompt:'预设中的旧签名'});
const bundle=slice('  /* TLE_CONTENT_BUNDLE_START */','  /* TLE_CONTENT_BUNDLE_END */');
const script=`
const HOST_WIN=window, HOST_DOC=document;
${source.match(/  const ID = \{[\s\S]*?\n  \};/)[0]}
const state={organizerPanel:null,organizerEntry:document.querySelector('#tle-organizer-entry'),abort:new AbortController(),destroyed:false};
let quickPanel=null,quickSequence=0;
const QUICK_RESOURCE_MODULES=[{id:'preset',title:'预设'},{id:'character',title:'角色卡'},{id:'worldInfo',title:'世界书'},{id:'persona',title:'User 身份'},{id:'theme',title:'UI 主题'},{id:'reasoning',title:'推理格式'}];
const worldInfoCatalogMeta={unloadedCount:0};
const catalog={preset:[{key:JSON.stringify(['settings_preset_openai','预设 P']),value:'预设 P',label:'预设 P'}],character:[{key:'A.json',value:'A.json',label:'角色 A'}],worldInfo:[{key:JSON.stringify(['world_info','世界书 B']),value:'世界书 B',label:'世界书 B'}],persona:[{key:'user.png',value:'user.png',label:'测试身份'}],theme:[{key:'Theme',value:'Theme',label:'Theme'}],reasoning:[]};
const data={groupsByModule:Object.fromEntries(QUICK_RESOURCE_MODULES.map(m=>[m.id,[{id:'favorites',name:'收藏'}]])),assignments:{}};
const readQuickGroups=()=>data,quickGroupsFor=(d,m)=>d.groupsByModule[m],quickAssignment=(d,m,k)=>d.assignments[m]?.[k]||'',quickGroupLabel=g=>g.name;
const quickDeleteDisabledReason=()=>'',quickManagerCatalog=async m=>catalog[m],matchesWorldInfoFilter=()=>true;
const quickAvatarNode=()=>document.createElement('img'),saveQuickGroups=()=>{},closeQuickPanel=()=>{},queueChatShortcutRefresh=()=>{};
window.SillyTavern={getContext:()=>({getRequestHeaders:()=>({'Content-Type':'application/json'}),accountStorage:localStorage,characters:[]})};
${bundle}
${slice('  function quickNode(','  function cleanQuickGroupList')}
${slice('  function quickScrollList(','  async function openQuickPicker')}
${slice('  function createStyle()','  const NAV_LABELS_STORAGE_KEY')}
${slice('  function createOrganizerPanel()','  function createRailControls()')}
${slice('  function openQuickGroupManager(','  const FOLD_STORAGE_KEY')}
createStyle(); createOrganizerPanel(); state.organizerPanel.classList.remove('closedDrawer');state.organizerPanel.classList.add('openDrawer');openQuickGroupManager(null);
window.harness={get content(){return quickPanel.content;},get catalog(){return catalog;}};
`;
const html=`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/css/st-tailwind.css"><style>
body{margin:0}.drawer-content{position:fixed;inset:20px;max-width:1200px;margin:auto}.drawer-content.closedDrawer{display:none}
</style><div id="top-settings-holder"><div id="tle-organizer-entry"><button class="drawer-toggle" hidden></button></div></div><script>${script.replaceAll('</script>','<\\/script>')}</script></html>`;
const app=express();app.use(express.json());app.use((req,res,next)=>{req.user={profile:{handle:'test'},directories:{root}};next();});
const router=express.Router();installBatchRoutes(router);app.use('/api/plugins/global-batch-replace',router);app.get('/',(req,res)=>res.type('html').send(html));
app.use(express.static(nativePublic));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const output=process.env.TLE_QA_OUTPUT||'../../outputs/browser-qa';fs.mkdirSync(output,{recursive:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.harness?.content);
 await page.setViewportSize({width:1440,height:1000});
 const search=page.locator('#tle-organizer-panel input[type=search]');assert.equal(await search.count(),1);
 const modeToggle=page.getByRole('checkbox',{name:'查找和替换',exact:true});
 assert.equal(await modeToggle.count(),1,'One native checkbox controls the content-search module');
 assert.equal(await modeToggle.evaluate(toggle=>toggle.parentElement.matches('label.checkbox_label')),true,'The checkbox uses SillyTavern native checkbox_label markup');
 assert.equal(await modeToggle.isChecked(),false,'Resource management is the default mode');
 assert.equal(await modeToggle.getAttribute('class'),'checkbox','The checkbox uses the host native checkbox class');
 assert.equal(await modeToggle.getAttribute('style'),null,'The native checkbox has no inline styling');
 const nativeCheckboxStyle=await modeToggle.evaluate(toggle=>{
  const probe=document.createElement('input');probe.type='checkbox';probe.className='checkbox';toggle.parentElement.append(probe);
  const properties=['appearance','accentColor','backgroundColor','borderTopColor','borderTopStyle','borderTopWidth','borderTopLeftRadius','width','height','marginTop','marginRight','color','boxShadow'];
  const actual=getComputedStyle(toggle),expected=getComputedStyle(probe);
  const matches=properties.every(property=>actual[property]===expected[property]);
  probe.remove();return matches;
 });
 assert.equal(nativeCheckboxStyle,true,'The mode toggle inherits the host checkbox appearance');
 assert.equal(await page.locator('.tle-organizer-pane-title.standoutHeader').count(),2,'Resource type and group headings inherit standoutHeader');
 assert.equal(await page.locator('.tle-content-heading.standoutHeader').count(),1,'The resource heading and mode switch share standoutHeader');
 assert.equal(await page.locator('.tle-organizer-divider').count(),0,'Organizer columns have no divider elements');
 await search.fill('预设');assert.equal(await page.locator('.tle-quick-list>.tle-quick-item').count(),1);
 await modeToggle.check();await page.waitForFunction(()=>!harness.content.busy);
 assert.equal(await modeToggle.isChecked(),true);
 await search.fill('旧签名');await page.getByLabel('替换为',{exact:true}).fill('');
 await page.getByRole('button',{name:'查找',exact:true}).click();await page.waitForFunction(()=>!harness.content.busy&&harness.content.snapshot?.status==='ready');
 assert.equal(await page.locator('#tle-organizer-panel .tle-quick-list').count(),1);
 assert.equal(await page.getByRole('button',{name:'批量删除资源',exact:true}).isVisible(),false);
 assert.equal(await page.locator('.tle-quick-list details[data-content-key]').count(),4);
 await page.locator('.tle-quick-list details[data-content-key]').filter({hasText:'A.json'}).locator('summary').click();
 await page.locator('.tle-content-match input').first().uncheck();
 await page.getByRole('button',{name:'预览替换',exact:true}).click();await page.waitForFunction(()=>!harness.content.busy&&harness.content.previewed);
 assert.equal(await page.getByRole('button',{name:'确认删除匹配文本',exact:true}).isVisible(),true);
 assert.match(await page.locator('.tle-quick-list').innerText(),/改后：/);
 await page.screenshot({path:path.join(output,'desktop-preview.png'),fullPage:true});
 await page.getByRole('button',{name:'返回选择',exact:true}).click();
 for(const width of [320,375,390,768]){
  await page.setViewportSize({width,height:844});
  assert.equal(await modeToggle.isVisible(),true);
  const bounds=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth,search:document.querySelector('#tle-organizer-panel input[type=search]').getBoundingClientRect().toJSON(),list:document.querySelector('.tle-quick-list').getBoundingClientRect().toJSON()}));
  assert.ok(bounds.document<=bounds.viewport+1,`horizontal page overflow at ${width}: ${JSON.stringify(bounds)}`);
  assert.ok(bounds.search.width>70&&bounds.search.height>15,`search size at ${width}: ${JSON.stringify(bounds)}`);
  assert.ok(bounds.list.height>50,`list remains usable at ${width}: ${JSON.stringify(bounds)}`);
  await page.screenshot({path:path.join(output,`mobile-${width}.png`),fullPage:true});
 }
 await modeToggle.uncheck();await page.waitForFunction(()=>!harness.content.busy);
 assert.equal(await modeToggle.isChecked(),false);assert.equal(await search.inputValue(),'预设');
 assert.equal(await page.getByRole('button',{name:'批量删除资源',exact:true}).isVisible(),true);
 await page.locator('.tle-quick-list .tle-quick-item-check').check();assert.equal(await page.getByRole('button',{name:'批量删除资源',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'批量删除资源',exact:true}).click();assert.equal(await page.getByRole('button',{name:'确认删除 1 项',exact:true}).isVisible(),true);
 const confirmBox=await page.getByRole('button',{name:'确认删除 1 项',exact:true}).boundingBox(),cancelBox=await page.getByRole('button',{name:'取消',exact:true}).boundingBox();
 assert(Math.abs(confirmBox.y-cancelBox.y)<6,'Resource delete confirmation buttons share a row');
 await page.screenshot({path:path.join(output,'resource-delete-confirmation.png'),fullPage:true});
 await page.getByRole('button',{name:'取消',exact:true}).click();
 await page.setViewportSize({width:1440,height:1000});
 const initialGroup=page.locator('.tle-quick-filter[data-group-id="favorites"]');
 const renameAction=page.getByRole('button',{name:'重命名',exact:true});
 const deleteAction=page.getByRole('button',{name:'删除分组',exact:true});
 assert.equal(await renameAction.isVisible(),true,'Rename action must remain visible without a selection');
 assert.equal(await deleteAction.isVisible(),true,'Delete action must remain visible without a selection');
 assert.equal(await renameAction.isDisabled(),true,'Rename action is disabled without a selected custom group');
 assert.equal(await deleteAction.isDisabled(),true,'Delete action is disabled without a selected custom group');
 assert.equal(await initialGroup.isEnabled(),true,'Group directory rows must be clickable when idle');
 await page.evaluate(()=>{harness.content.lock(true);harness.content.lock(true);});
 assert.equal(await initialGroup.isDisabled(),true,'A running content operation may temporarily lock navigation');
 await page.evaluate(()=>harness.content.lock(false));
 assert.equal(await initialGroup.isEnabled(),true,'Repeated lock acquisition must restore the original clickable state');
 await initialGroup.click();
 assert.equal(await page.locator('.tle-quick-group-selection-name').textContent(),'收藏');
 assert.equal(await renameAction.isVisible(),true);
 assert.equal(await deleteAction.isVisible(),true);
 assert.equal(await renameAction.isEnabled(),true,'Selecting a custom group enables rename');
 assert.equal(await deleteAction.isEnabled(),true,'Selecting a custom group enables delete');

 await page.getByRole('button',{name:'新建分组',exact:true}).click();
 await page.getByLabel('新分组名称',{exact:true}).fill('测试分组 A');
 await page.getByRole('button',{name:'创建',exact:true}).click();
 const groupA=page.locator('.tle-quick-filter[data-group-id]').filter({hasText:'测试分组 A'});
 const groupAId=await groupA.getAttribute('data-group-id');
 assert.ok(groupAId);
 await page.getByRole('button',{name:'新建分组',exact:true}).click();
 await page.getByLabel('新分组名称',{exact:true}).fill('测试分组 B');
 await page.getByRole('button',{name:'创建',exact:true}).click();
 const groupB=page.locator('.tle-quick-filter[data-group-id]').filter({hasText:'测试分组 B'});
 const groupBId=await groupB.getAttribute('data-group-id');
 assert.ok(groupBId);
 await page.locator('.tle-quick-filter[data-group-id="'+groupAId+'"]').click();
 assert.equal(await page.locator('.tle-quick-group-selection-name').textContent(),'测试分组 A');
 const batchTarget=page.getByLabel('批量操作目标分组',{exact:true});
 await batchTarget.selectOption(groupBId);
 assert.equal(await page.locator('.tle-quick-group-selection-name').textContent(),'测试分组 A',
   'Batch target changes must not replace the viewed/managed group');
 await page.getByRole('button',{name:'重命名',exact:true}).click();
 await page.getByLabel('修改后的分组名称',{exact:true}).fill('测试分组 A 改');
 await page.getByRole('button',{name:'确认重命名',exact:true}).click();
 assert.equal(await page.locator('.tle-quick-group-selection-name').textContent(),'测试分组 A 改');
 await page.screenshot({path:path.join(output,'group-management.png'),fullPage:true});
 await page.getByRole('button',{name:'删除分组',exact:true}).click();
 assert.match(await page.locator('.tle-quick-group-delete-message').textContent(),/不会删除其中的资源/);
 await page.getByRole('button',{name:'确认删除分组',exact:true}).click();
 assert.equal(await page.locator('.tle-quick-group-selection-name').textContent(),'未选择');
 assert.equal(await batchTarget.inputValue(),groupBId,'Deleting the viewed group must preserve a different batch target');
 assert.equal(await page.locator('.tle-quick-filter[data-group-id="'+groupAId+'"]').count(),0);
 assert.equal(await page.locator('.tle-quick-filter[data-group-id="'+groupBId+'"]').count(),1);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,viewports:[1440,320,375,390,768],browser:await browser.version(),realPlatformsTested:[],errors},null,2));
 console.log('Real Chromium Organizer wiring/preview/mobile/name-delete regression passed. Host APIs are fixtures; this is not ST/TT device acceptance.');
}finally{await browser.close();await new Promise(r=>server.close(r));if(path.basename(root).startsWith('tle-browser-'))fs.rmSync(root,{recursive:true,force:true});}
