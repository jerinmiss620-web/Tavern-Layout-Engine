import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import archiver from 'archiver';
const output=process.argv[2];
if(!output||!path.isAbsolute(output))throw Error('Provide an absolute deliverable output directory.');
fs.mkdirSync(output,{recursive:true});
const manifest=JSON.parse(fs.readFileSync('channels/test.json','utf8')),version=manifest.latest_version;
const head=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const blob=p=>execFileSync('git',['show',`${head}:${p}`],{maxBuffer:8*1024*1024});
const files=p=>execFileSync('git',['ls-files',p],{encoding:'utf8'}).trim().split('\n').filter(Boolean);
const zip=async(name,entries)=>{
 const archive=archiver('zip',{zlib:{level:9}}),target=fs.createWriteStream(path.join(output,name));
 const done=new Promise((resolve,reject)=>{target.on('close',resolve);target.on('error',reject);archive.on('error',reject);});
 archive.pipe(target);for(const [name,data]of entries)archive.append(data,{name});await archive.finalize();await done;
};
const core=blob(manifest.release.source_path);
if(core.length!==manifest.release.size_bytes||createHash('sha256').update(core).digest('hex')!==manifest.release.sha256)throw Error('Core manifest mismatch');
fs.writeFileSync(path.join(output,'TLE.js'),core);
const importer=`TLE-${version}-TEST-import.json`;fs.writeFileSync(path.join(output,importer),blob(`releases/v${version}/${importer}`));
fs.writeFileSync(path.join(output,'test.json'),blob('channels/test.json'));
fs.writeFileSync(path.join(output,'README.md'),blob('development/organizer/CONTENT-INTEGRATION.md'));
fs.writeFileSync(path.join(output,'CHANGELOG.md'),blob(`releases/v${version}/CHANGELOG.md`));
fs.writeFileSync(path.join(output,'VALIDATION.md'),blob('development/organizer/CONTENT-VALIDATION.md'));
const plugin=files('plugins/global-batch-replace').map(p=>[p,blob(p)]);
await zip(`TLE-${version}-PC-server-plugin.zip`,plugin);
const tt=files('development/organizer/batch').map(p=>[p.replace('development/organizer/batch/','tt-adapter/'),blob(p)]);
await zip(`TLE-${version}-TT-adapter-source.zip`,tt);
const sourceName=`TLE-${version}-source.zip`;
execFileSync('git',['archive','--format=zip','--output='+path.join(output,sourceName),head]);
const payload=[['TLE.js',core],[importer,blob(`releases/v${version}/${importer}`)],['channels/test.json',blob('channels/test.json')],...plugin,...tt,
 ['README.md',blob('development/organizer/CONTENT-INTEGRATION.md')],['VALIDATION.md',blob('development/organizer/CONTENT-VALIDATION.md')],['CHANGELOG.md',blob(`releases/v${version}/CHANGELOG.md`)],['source/'+sourceName,fs.readFileSync(path.join(output,sourceName))]];
for(const folder of ['browser-qa','test-results']){
 const dir=path.join(output,folder);if(fs.existsSync(dir))for(const name of fs.readdirSync(dir))if(fs.statSync(path.join(dir,name)).isFile())payload.push([folder+'/'+name,fs.readFileSync(path.join(dir,name))]);
}
const record=([name,data])=>({path:name,size_bytes:data.length,sha256:createHash('sha256').update(data).digest('hex')});
payload.push(['CONTENTS-SHA256.json',Buffer.from(JSON.stringify(payload.map(record),null,2)+'\n')]);
await zip(`TLE-${version}-TEST-complete.zip`,payload);
const artifacts=fs.readdirSync(output).filter(n=>/\.(zip|js|json|md)$/.test(n)&&n!=='artifacts.json').map(n=>record([n,fs.readFileSync(path.join(output,n))]));
fs.writeFileSync(path.join(output,'artifacts.json'),JSON.stringify({version,branch:'feature/organizer-nav-worldbooks-20261125',commit:head,core:manifest.release,artifacts},null,2)+'\n');
fs.writeFileSync(path.join(output,'SHA256SUMS.txt'),artifacts.map(a=>`${a.sha256}  ${a.size_bytes} bytes  ${a.path}`).join('\n')+'\n');
console.log(JSON.stringify({version,head,coreBytes:core.length,coreSHA256:manifest.release.sha256,artifacts:artifacts.filter(a=>a.path.endsWith('.zip'))},null,2));
