import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const source=path.resolve(process.env.TLE_ST_SOURCE||'E:/SillyTavern/SillyTavern'),dest=path.resolve(process.env.TLE_ST_FIXTURE||'../st-acceptance');
if(path.basename(dest)!=='st-acceptance'||dest===source||dest.startsWith(source+path.sep))throw Error('Use a separate st-acceptance directory outside the installed host');
fs.mkdirSync(dest,{recursive:true});
for(const name of ['src','public','default'])fs.cpSync(path.join(source,name),path.join(dest,name),{recursive:true,filter:p=>!p.replaceAll('\\','/').includes('/extensions/third-party/')});
for(const name of ['server.js','package.json','webpack.config.js'])fs.copyFileSync(path.join(source,name),path.join(dest,name));
if(!fs.existsSync(path.join(dest,'node_modules')))fs.symlinkSync(path.join(source,'node_modules'),path.join(dest,'node_modules'),'junction');
fs.mkdirSync(path.join(dest,'plugins/global-batch-replace'),{recursive:true});
// Test the exact installed original plugin, without touching its install or data.
for(const name of fs.readdirSync(path.join(source,'plugins/global-batch-replace'))){const p=path.join(source,'plugins/global-batch-replace',name);if(fs.statSync(p).isFile())fs.copyFileSync(p,path.join(dest,'plugins/global-batch-replace',name));}
const require=createRequire(import.meta.url),YAML=require('yaml');
const config=YAML.parse(fs.readFileSync(path.join(dest,'default/config.yaml'),'utf8'));
Object.assign(config,{dataRoot:'./data',port:18765,listen:false,enableServerPlugins:true,enableServerPluginsAutoUpdate:false});
config.browserLaunch={...(config.browserLaunch||{}),enabled:false};config.extensions={...(config.extensions||{}),autoUpdate:false};
fs.writeFileSync(path.join(dest,'config.yaml'),YAML.stringify(config));
console.log(dest);
