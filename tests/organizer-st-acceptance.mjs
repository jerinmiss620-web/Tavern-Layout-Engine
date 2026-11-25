import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {chromium} from 'playwright-core';
const root=path.resolve(process.env.TLE_ST_FIXTURE||'../st-acceptance');
assert.equal(path.basename(root),'st-acceptance','Use only an isolated acceptance install');
const output=path.resolve(process.env.TLE_QA_OUTPUT||'../../outputs/v0.3.235/pc-acceptance');fs.mkdirSync(output,{recursive:true});
const settingsFile=path.join(root,'data/default-user/settings.json'),settings=JSON.parse(fs.readFileSync(settingsFile,'utf8'));
settings.firstRun=false;settings.username='TLE isolated acceptance';fs.writeFileSync(settingsFile,JSON.stringify(settings));
const file=path.join(root,'data/default-user/worlds/TLE验收.json');
const before=JSON.stringify({entries:{0:{uid:0,key:['TLE验收'],comment:'仅测试资料',content:'TLE验收旧词 第一段。TLE验收旧词 第二段。',constant:false,disable:false,order:100}}});
fs.writeFileSync(file,before);
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[],requests=[];
page.on('pageerror',e=>errors.push(e.message));
page.on('request',r=>{if(r.url().includes('/api/plugins/global-batch-replace/'))requests.push({endpoint:r.url().split('/').pop(),body:r.postDataJSON()});});
const source=fs.readFileSync('development/organizer/TLE.js','utf8');
const boot=async()=>{
 await page.waitForFunction(()=>window.SillyTavern?.getContext?.().accountStorage);
 await page.locator('dialog[open]').waitFor({state:'hidden',timeout:30000});
 console.log('Native host ready');
 await page.addScriptTag({content:source});
 await page.locator('#tle-organizer-entry > .drawer-toggle').click();
 await page.getByRole('radio',{name:'查找与替换',exact:true}).check();
 await page.waitForFunction(()=>!document.querySelector('#tle-organizer-panel input[type=search]').disabled);
};
try{
 await page.goto('http://127.0.0.1:18765/',{waitUntil:'domcontentloaded'});await boot();
 const search=page.locator('#tle-organizer-panel input[type=search]');
 await search.fill('TLE验收旧词');await search.focus();
 const searchBox=await search.boundingBox();await page.screenshot({path:path.join(output,'native-clear-control.png'),fullPage:true});
 await page.mouse.click(searchBox.x+searchBox.width-13,searchBox.y+searchBox.height/2);
 assert.equal(await search.inputValue(),'','Native in-field clear button must clear the shared query');
 await search.fill('TLE验收旧词');await page.getByLabel('替换为',{exact:true}).fill('');
 await page.getByRole('button',{name:'查找',exact:true}).click();
 await page.locator('.tle-quick-list details[data-content-key]').waitFor();
 assert.equal(fs.readFileSync(file,'utf8'),before);
 await page.locator('.tle-quick-list details[data-content-key] summary').click();
 assert.equal(await page.locator('.tle-content-match input[type=checkbox]').count(),2);
 await page.locator('.tle-content-match input[type=checkbox]').last().uncheck();
 await page.getByRole('button',{name:'预览替换',exact:true}).click();
 await page.getByRole('button',{name:'确认删除匹配文本',exact:true}).waitFor();
 await page.screenshot({path:path.join(output,'desktop-preview.png'),fullPage:true});
 const layouts=[];
 for(const theme of ['Dark Lite','Celestial Macaron']){
 await page.locator('#themes').selectOption({label:theme},{force:true});
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:1000});
  const bounds=await page.evaluate(()=>{
   const input=document.querySelector('#tle-organizer-panel input[type=search]'),row=input.closest('.tle-content-search-row');
   const find=[...row.querySelectorAll('button')].find(b=>b.textContent==='查找');
   const peer=document.createElement('input');peer.type='search';peer.className='text_pole';input.parentElement.append(peer);
   const props=['height','fontSize','paddingTop','paddingBottom','borderRadius','backgroundColor','color'];
   const equal=props.every(p=>getComputedStyle(input)[p]===getComputedStyle(peer)[p]);peer.remove();
   return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,input:input.getBoundingClientRect().toJSON(),find:find.getBoundingClientRect().toJSON(),nativeSearchStyle:equal,customClear:!!row.querySelector('.tle-search-clear')};
  });
  assert.equal(bounds.nativeSearchStyle,true);assert.equal(bounds.customClear,false);
  assert(bounds.scrollWidth<=width+1,JSON.stringify(bounds));
  assert(bounds.input.width>70,JSON.stringify(bounds));
  assert(Math.abs(bounds.find.y+bounds.find.height/2-bounds.input.y-bounds.input.height/2)<6,JSON.stringify(bounds));
  layouts.push({theme,...bounds});await page.screenshot({path:path.join(output,`${theme.replaceAll(' ','-')}-${width}.png`),fullPage:true});
 }
 }
 await page.getByRole('button',{name:'确认删除匹配文本',exact:true}).click();
 await page.waitForEvent('load');await boot();
 const after=JSON.parse(fs.readFileSync(file,'utf8'));assert.equal(after.entries[0].content,' 第一段。TLE验收旧词 第二段。');
 await page.getByRole('button',{name:'备份与恢复',exact:true}).click();
 const backup=page.locator('.tle-quick-list details').filter({hasText:'已完成'}).first();await backup.locator('summary').click();
 await backup.getByRole('button',{name:/恢复整份备份…|恢复所选资源…/}).click();
 await backup.getByRole('button',{name:'确认检查并恢复',exact:true}).click();
 await page.waitForEvent('load');assert.equal(fs.readFileSync(file,'utf8'),before);
 await boot();await search.fill('TLE验收旧词');await page.getByLabel('替换为',{exact:true}).fill('TLE验收新词');
 await page.getByRole('button',{name:'查找',exact:true}).click();await page.locator('.tle-quick-list details[data-content-key]').waitFor();
 await page.getByRole('button',{name:'预览替换',exact:true}).click();await page.getByRole('button',{name:'确认替换',exact:true}).click();
 await page.waitForEvent('load');assert.equal(JSON.parse(fs.readFileSync(file,'utf8')).entries[0].content,'TLE验收新词 第一段。TLE验收新词 第二段。');
 await boot();await page.getByRole('button',{name:'备份与恢复',exact:true}).click();
 const secondBackup=page.locator('.tle-quick-list details').filter({hasText:'已完成'}).first();await secondBackup.locator('summary').click();
 await secondBackup.getByRole('button',{name:/恢复整份备份…|恢复所选资源…/}).click();await secondBackup.getByRole('button',{name:'确认检查并恢复',exact:true}).click();
 await page.waitForEvent('load');assert.equal(fs.readFileSync(file,'utf8'),before);
 assert(requests.some(r=>r.endpoint==='apply'));assert(requests.some(r=>r.endpoint==='restore'));
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({passed:true,host:'SillyTavern 1.19.0, actual application with isolated default profile',plugin:process.env.TLE_PC_PLUGIN_LABEL||'Exact original installed Global Batch Replace v1.1.0',browser:await browser.version(),nativeClearVerified:true,searchReadOnly:true,partialEmptyReplacement:true,replacement:true,restoreByteIdentical:true,layouts,requests,errors},null,2));
 console.log(`Actual PC SillyTavern + ${process.env.TLE_PC_PLUGIN_LABEL||'original installed v1.1.0 plugin'}: search, replacement, partial text deletion, backup restore and native-theme layouts passed.`);
}catch(e){await page.screenshot({path:path.join(output,'failure.png'),fullPage:true});fs.writeFileSync(path.join(output,'failure.txt'),e.stack+'\n'+await page.locator('body').innerText()+'\n'+JSON.stringify(errors));throw e;}
finally{await browser.close();}
