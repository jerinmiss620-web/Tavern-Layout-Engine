import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import express from 'express';
import { chromium } from 'playwright-core';
import { installBatchRoutes } from '../plugins/global-batch-replace/batch-server.js';
const source=fs.readFileSync('development/organizer/TLE.js','utf8');
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
const html=`<!doctype html><html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
:root{--SmartThemeBlurTintColor:#222733;--SmartThemeBodyColor:#eee;--SmartThemeQuoteColor:#9daec6;--SmartThemeBorderColor:#505b70;--topBarBlockSize:40px;--nav-bar-width:40px;--sheldWidth:100%;font-family:Arial,sans-serif;color:#eee;background:#151923}body{margin:0}input,select,textarea,button{font:inherit;color:inherit;background:#293140;border:1px solid #68758b;border-radius:4px;padding:6px;box-sizing:border-box}button{cursor:pointer}.flex-container{display:flex;gap:6px}.flexWrap{flex-wrap:wrap}.flexFlowColumn{flex-direction:column}.checkbox_label{display:flex;align-items:center;gap:6px}.drawer-content{position:fixed;inset:20px;max-width:1200px;margin:auto}.menu_button{width:auto;margin:0}.drawer-content.closedDrawer{display:none}
</style><div id="top-settings-holder"><div id="tle-organizer-entry"><button class="drawer-toggle" hidden></button></div></div><script>${script.replaceAll('</script>','<\\/script>')}</script></html>`;
const app=express();app.use(express.json());app.use((req,res,next)=>{req.user={profile:{handle:'test'},directories:{root}};next();});
const router=express.Router();installBatchRoutes(router);app.use('/api/plugins/global-batch-replace',router);app.get('/',(req,res)=>res.type('html').send(html));
const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const output=process.env.TLE_QA_OUTPUT||'../../outputs/browser-qa';fs.mkdirSync(output,{recursive:true});
try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.harness?.content);
 await page.setViewportSize({width:1440,height:1000});
 const search=page.locator('#tle-organizer-panel input[type=search]');assert.equal(await search.count(),1);
 await search.fill('预设');assert.equal(await page.locator('.tle-quick-list>.tle-quick-item').count(),1);
 await page.getByLabel('搜索目标',{exact:true}).selectOption('content');await page.waitForFunction(()=>!harness.content.busy);
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
  const bounds=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:innerWidth,search:document.querySelector('#tle-organizer-panel input[type=search]').getBoundingClientRect().toJSON(),list:document.querySelector('.tle-quick-list').getBoundingClientRect().toJSON()}));
  assert.ok(bounds.document<=bounds.viewport+1,`horizontal page overflow at ${width}: ${JSON.stringify(bounds)}`);
  assert.ok(bounds.search.width>70&&bounds.search.height===40,`search size at ${width}: ${JSON.stringify(bounds)}`);
  assert.ok(bounds.list.height>50,`list remains usable at ${width}: ${JSON.stringify(bounds)}`);
  await page.screenshot({path:path.join(output,`mobile-${width}.png`),fullPage:true});
 }
 await page.getByLabel('搜索目标',{exact:true}).selectOption('name');assert.equal(await search.inputValue(),'预设');
 assert.equal(await page.getByRole('button',{name:'批量删除资源',exact:true}).isVisible(),true);
 await page.locator('.tle-quick-list .tle-quick-item-check').check();assert.equal(await page.getByRole('button',{name:'批量删除资源',exact:true}).isEnabled(),true);
 await page.getByRole('button',{name:'批量删除资源',exact:true}).click();assert.equal(await page.getByRole('button',{name:'确认删除 1 项',exact:true}).isVisible(),true);
 await page.getByRole('button',{name:'取消',exact:true}).click();
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,viewports:[1440,320,375,390,768],browser:await browser.version(),realPlatformsTested:[],errors},null,2));
 console.log('Real Chromium Organizer wiring/preview/mobile/name-delete regression passed. Host APIs are fixtures; this is not ST/TT device acceptance.');
}finally{await browser.close();await new Promise(r=>server.close(r));if(path.basename(root).startsWith('tle-browser-'))fs.rmSync(root,{recursive:true,force:true});}
