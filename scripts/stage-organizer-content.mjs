import fs from 'node:fs';
import { createHash } from 'node:crypto';
const version='0.3.236',dir=`releases/v${version}`;
fs.mkdirSync(dir,{recursive:true});
const source=fs.readFileSync('development/organizer/TLE.js','utf8');
fs.writeFileSync(`${dir}/TLE.js`,source);
const installer=JSON.parse(fs.readFileSync('releases/v0.3.233/TLE-0.3.233-TEST-import.json','utf8'));
installer.name=`Tavern Layout Engine · v${version} TEST（整理侠内容处理）`;
installer.info='**简介：** 整理侠在同一个搜索框与资源列表内提供跨资源查找与替换，修复原版 PC 插件兼容性。\n\n**使用方式：** 由现有 TLE Test Loader 更新；此包是手动备用安装包。PC 已安装 Global Batch Replace v1.1.0 服务端即可查找、预览、替换和整份备份恢复；ZIP 导入与按文件恢复使用配套插件。TT 使用内置适配。\n\n**注意事项：** 默认禁用；仅测试通道。正式 Core/Loader/Bootstrap 不变。平台验证范围详见 VALIDATION.md。\n\n**作者：** 小松鼠 & ChatGPT（小松7）。';
installer.content=source;installer.enabled=false;
fs.writeFileSync(`${dir}/TLE-${version}-TEST-import.json`,JSON.stringify(installer,null,2)+'\n');
const notes=`# Core v${version} TEST · 内容结果分组与原生紧凑布局

- “资源名称 / 查找与替换”移到分类标题右侧；宽屏搜索和替换合行，范围和备份合行，窄屏按宿主原生布局换行。
- 新建分组常驻管理区外；重命名和删除分组横排，删除资源与替换确认按钮横排。
- 恢复角色卡、聊天记录、世界书等类型小组；每组可折叠、全选、取消，保留资源和逐处选择，混合选择显示半选。
- 角色内嵌世界书按内容类型进入世界书小组，物理资源总数不重复计数；更改选择后必须重新预览。
- 控件继续继承宿主原生样式与布局工具类；高级提示移入折叠区，不增加控件高度、颜色、背景、边框和字体覆盖。
- 保留 v0.3.235 的原版 PC 接口兼容修复；原版与配套服务端使用实际隔离 PC 酒馆验证。平台范围见 CONTENT-VALIDATION.md。
- 仅更新开发分支测试通道；正式 latest.json、Stable Core/Loader、Bootstrap 不变。

安装、来源与限制详见 development/organizer/CONTENT-INTEGRATION.md；验证矩阵详见 CONTENT-VALIDATION.md。
`;
fs.writeFileSync(`${dir}/CHANGELOG.md`,notes);
const readme=fs.readFileSync('README.md','utf8');
const section=`## 开发分支测试版 v${version} · 整理侠内容处理

测试基线为 **feature/organizer-nav-worldbooks-20261125**，测试清单 [channels/test.json](channels/test.json)。[手动 Core 备用导入包](${dir}/TLE-${version}-TEST-import.json) 默认禁用；不要与现有加载链重复启用。

整理侠“资源名称 / 查找与替换”共用一个搜索框和原资源列表。已安装原版 Global Batch Replace v1.1.0 PC 服务端即可查找、预览、替换及整份恢复；[配套服务端插件](plugins/global-batch-replace/README-TLE.md) 增加 ZIP 导入和按文件恢复。TT 使用 Core 内置原生适配。

[安装和功能说明](development/organizer/CONTENT-INTEGRATION.md) · [测试与实机验收记录](development/organizer/CONTENT-VALIDATION.md) · [本版日志](${dir}/CHANGELOG.md)。正式发布通道仍为下文版本。

`;
if(!readme.includes('## 开发分支测试版 v'+version))fs.writeFileSync('README.md',readme.replace(/## 开发分支测试版[\s\S]*?(?=## 一次安装，后续自动更新)/,section));
const changelog=fs.readFileSync('CHANGELOG.md','utf8');
if(!changelog.includes('Core v'+version))fs.writeFileSync('CHANGELOG.md',`## 2026-11-26 · Core v${version} · 内容结果分组与原生紧凑布局（开发分支）\n\n详见 [本版完整日志](${dir}/CHANGELOG.md)。恢复类型小组及组内选择，调整标题、搜索替换和分组管理布局，沿用宿主原生控件与布局类。\n\n`+changelog);
const provenance={upstream:'https://github.com/jerinmiss620-web/global-batch-replace',commit:'6b4ab84',version:'1.1.0',unchanged:{}};
for(const name of ['batch-engine.js','batch-adapters.js','storage.js','vendor/fflate.js','vendor/fflate-LICENSE'])provenance.unchanged[name]=createHash('sha256').update(fs.readFileSync('development/organizer/batch/'+name,'utf8').replaceAll('\r\n','\n')).digest('hex');
provenance.adapted=['batch-runtime.js: explicit host bridge + PC ZIP import','batch-tt.js: scan hash + paths restore + per-resource errors','server-plugin/batch-server.js: scan hash + verified ZIP import + paths restore'];
fs.writeFileSync('development/organizer/batch/PROVENANCE.json',JSON.stringify(provenance,null,2)+'\n');
fs.copyFileSync('development/organizer/batch/CREDITS.md','plugins/global-batch-replace/CREDITS.md');
for(const file of ['plugins/global-batch-replace/package.json','plugins/global-batch-replace/package-lock.json']){
 const p=JSON.parse(fs.readFileSync(file));p.version='1.1.0-tle.2';if(p.packages?.[''])p.packages[''].version=p.version;fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
}
console.log('Staged v'+version+' Core, disabled import package, changelog and source provenance.');
