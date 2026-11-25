import fs from 'node:fs';
import { createHash } from 'node:crypto';
const version='0.3.234',dir=`releases/v${version}`;
fs.mkdirSync(dir,{recursive:true});
const source=fs.readFileSync('development/organizer/TLE.js','utf8');
fs.writeFileSync(`${dir}/TLE.js`,source);
const installer=JSON.parse(fs.readFileSync('releases/v0.3.233/TLE-0.3.233-TEST-import.json','utf8'));
installer.name=`Tavern Layout Engine · v${version} TEST（整理侠内容处理）`;
installer.info='**简介：** 整理侠在同一个搜索框与资源列表内提供跨资源内容查找、多规则替换、删除匹配文本、逐处选择、原位预览及备份恢复。\n\n**安装：** PC 需安装配套 plugins/global-batch-replace 并启用服务端插件；TT 使用内置原生适配。\n\n**注意：** 默认禁用；仅测试通道。正式 Core/Loader/Bootstrap 不变。四类 ST/TT 实机尚未验收。';
installer.content=source;installer.enabled=false;
fs.writeFileSync(`${dir}/TLE-${version}-TEST-import.json`,JSON.stringify(installer,null,2)+'\n');
const notes=`# Core v${version} TEST · 整理侠跨资源内容处理

- 整理侠唯一入口、共享名称/内容搜索框和原资源列表；桌面三栏、移动紧凑布局保留。
- 增加全部支持资源/当前筛选/已选范围、多规则组合、逐资源/逐匹配选择、原位预览和明确确认。空替换只删除选中文字。
- 原资源分组、主题同步、分组备份、世界书绑定/孤儿识别及 User/UI 主题等原资源删除能力保留；文字选择与资源删除状态隔离。
- 复用 Global Batch Replace v1.1.0 核心引擎、字段白名单、PC 服务、TT ABI 2/资料集/PNG 备份/提交校验/失败恢复。原独立 UI 和样式未装载。
- 配套 PC 插件增加扫描指纹、验证 ZIP 导入和指定文件恢复；TT 增加指定资源恢复。原存储命名空间和历史备份保留。
- 执行后自动重新载入并恢复整理侠当前分组与筛选，避免原生旧缓存覆盖已提交资料。
- 51 项内容相关自动化测试、TLE 原回归及真实 Chromium 模拟宿主检查通过。PC ST、PC TT、iPhone TT、Android ST 均未实机验证。
- 仅更新开发分支测试通道；正式 latest.json、Stable Core/Loader、Bootstrap 不变。

安装、来源与限制详见 development/organizer/CONTENT-INTEGRATION.md；验证矩阵详见 CONTENT-VALIDATION.md。
`;
fs.writeFileSync(`${dir}/CHANGELOG.md`,notes);
const readme=fs.readFileSync('README.md','utf8');
const section=`## 开发分支测试版 v${version} · 整理侠内容处理

测试基线为 **feature/organizer-nav-worldbooks-20261125**，测试清单 [channels/test.json](channels/test.json)。[手动 Core 备用导入包](${dir}/TLE-${version}-TEST-import.json) 默认禁用；不要与现有加载链重复启用。

整理侠名称/内容共用一个搜索框和原资源列表。支持跨资源查找、多规则、逐处选择、原位预览、确认替换及空字符串删除；原资源批量删除继续留在名称模式。PC 需安装 [配套服务端插件](plugins/global-batch-replace/README-TLE.md) 并重启；TT 使用 Core 内置原生适配。

[安装和功能说明](development/organizer/CONTENT-INTEGRATION.md) · [测试与实机验收记录](development/organizer/CONTENT-VALIDATION.md) · [本版日志](${dir}/CHANGELOG.md)。四类 ST/TT 平台本次均未实机验证；正式发布通道仍为下文版本。

`;
if(!readme.includes('## 开发分支测试版 v'+version))fs.writeFileSync('README.md',readme.replace('## 一次安装，后续自动更新',section+'## 一次安装，后续自动更新'));
const changelog=fs.readFileSync('CHANGELOG.md','utf8');
if(!changelog.includes('Core v'+version))fs.writeFileSync('CHANGELOG.md',`## 2026-11-25 · Core v${version} · 整理侠跨资源内容处理（开发分支）\n\n详见 [本版完整日志](${dir}/CHANGELOG.md)。复用原引擎，单搜索框、单列表、逐处预览确认及 PC/TT 备份恢复；仅测试通道，实机验收待完成。\n\n`+changelog);
const provenance={upstream:'https://github.com/jerinmiss620-web/global-batch-replace',commit:'6b4ab84',version:'1.1.0',unchanged:{}};
for(const name of ['batch-engine.js','batch-adapters.js','storage.js','vendor/fflate.js','vendor/fflate-LICENSE'])provenance.unchanged[name]=createHash('sha256').update(fs.readFileSync('development/organizer/batch/'+name)).digest('hex');
provenance.adapted=['batch-runtime.js: explicit host bridge + PC ZIP import','batch-tt.js: scan hash + paths restore + per-resource errors','server-plugin/batch-server.js: scan hash + verified ZIP import + paths restore'];
fs.writeFileSync('development/organizer/batch/PROVENANCE.json',JSON.stringify(provenance,null,2)+'\n');
fs.copyFileSync('development/organizer/batch/CREDITS.md','plugins/global-batch-replace/CREDITS.md');
for(const file of ['plugins/global-batch-replace/package.json','plugins/global-batch-replace/package-lock.json']){
 const p=JSON.parse(fs.readFileSync(file));p.version='1.1.0-tle.1';if(p.packages?.[''])p.packages[''].version=p.version;fs.writeFileSync(file,JSON.stringify(p,null,2)+'\n');
}
console.log('Staged v'+version+' Core, disabled import package, changelog and source provenance.');
