# 整理侠内容处理整合 · v0.3.234 TEST

## 基线与结构

- TLE 开发分支：`feature/organizer-nav-worldbooks-20261125`；开始时远程 HEAD 为 `bb2dba27d06c39f28617af1ba386381aca1d58d5`，测试 Core v0.3.233。
- Global Batch Replace v1.1.0：`6b4ab84`。保留 `batch-engine.js`、`batch-adapters.js` 和 `storage.js` 的原始内容；完整 TT 原生服务和 Node 服务端沿用原项目，在以下边界增补接口。
- `batch/catalog.js` 只把适配器 ID 映射到整理侠原有资源键。适配器 inventory 是一次读写操作的描述，不维护另一个 UI 目录。
- `batch/controller.js` 接收整理侠既有搜索框、列表、资源项目工厂、分组筛选和资源选择；内容匹配单独使用 `excluded` 集合。
- `TLE.js` 保持现有整理侠入口和三栏/移动布局。名称资源与内容结果共用 `quickResourceItemFrame`。未加载原扩展入口、面板、资源选择器或样式。
- `scripts/build-organizer-content.mjs` 将控制器、原引擎、TT 和 ZIP 库打包到 Core 的标记区。运行时不需要另装原扩展前端，也不从可变网络地址加载这些模块。

## 使用与安装

测试通道使用 `channels/test.json`；手动备用安装包为 `releases/v0.3.234/TLE-0.3.234-TEST-import.json`（默认禁用）。只启用一条 TLE 加载链，避免独立 Core 与 Test Loader 重复执行。

PC SillyTavern：把配套 ZIP 的 `plugins/global-batch-replace` 放入酒馆根目录，在 `config.yaml` 中启用 `enableServerPlugins: true`，重启酒馆。定制酒馆缺少依赖时在插件目录执行 `npm ci --omit=dev`。旧 v1.1.0 插件需更新为本包，以提供扫描指纹、ZIP 导入和指定文件恢复；旧备份仍保留。

TT：Core 已内置 `batch-tt.js`，不用安装 Node 插件。不支持的 ABI、缺失的原生接口、未知 Tauri 宿主和资料集不一致均停止处理，不回退到 PC。迁移后在整理侠内容工具中核对新旧目录并登记资料集。

在整理侠右栏把「名称」切换为「内容」，填写同一搜索框和替换框。替换框为空表示删除匹配文本。依次查找、选择资源或逐处匹配、预览替换、确认执行。预览显示在原资源列表项目内；改变规则、范围或匹配选择后必须重新预览。

默认范围「全部支持资源」跨当前平台支持的类型；「当前筛选范围」遵循现有资源类型、分组及世界书状态；「已选资源」使用名称模式明确勾选的资源，未选择时禁用。原名称查询与内容查询分别保存。内容模式不显示资源删除工具；切回名称模式恢复原工具和选择。

「添加规则」展开原位规则编辑区；「规则组合与高级选项」默认折叠。规则为区分大小写的普通文本，沿用最长匹配优先、同长度按规则顺序、原文非级联算法，最多 200 条。JSON/YAML 必须按资源相对路径填写明确字段路径，例如 `{"user/files/example.json":[["content"]]}`；未指定的自定义 JSON/YAML 不参与扫描。TXT 只限原适配器的 `user/files` 目录。

「备份与恢复」在同一列表中显示备份。可导出 ZIP、导入并验证 ZIP、勾选需要恢复的数据文件、检查冲突后确认恢复。PC 恢复以物理文件为单位；多个身份可能共享 `settings.json`，确认恢复前应核对文件范围。TT 沿用逐原生资源的恢复单位。

## 数据与兼容性

- 查找创建服务端/TT 只读任务，处理层拒绝对此任务提交。预览另建可提交任务，并核对查找指纹及匹配身份；不会自动接受新出现的命中。
- 执行仍由原服务负责重读、冲突校验、备份、提交、复读和失败恢复。白名单之外字段、头像 ID、引用关系、未知扩展数据不参与递归替换。
- PC 保留 `/api/plugins/global-batch-replace` 和登录用户根目录隔离。新增 `POST /import` 接收 `application/zip`，验证目录绑定、路径、重复记录、展开预算及内容哈希，清单最后发布，不覆盖旧备份。
- 新增 `restore.paths` 可指定备份内的文件/资源路径；缺省时保留原全量恢复行为。冲突保留仍要求第二次明确确认。
- TT 保留 ABI 2、当前数据根目录/资料集绑定、原始角色 PNG、提交前后校验、逐资源回滚、ZIP 导入导出及迁移登记。未开放预设、提示词、正则、自定义文件。
- IndexedDB、账号键、PC/TT 备份 namespace 均为原 `global-batch-replace`。保存规则时保留原扩展其他配置键和已有组合。
- 修改/恢复后沿用原项目重新载入机制，避免旧原生缓存覆盖已写入数据。通过当前会话记录恢复整理侠分类、分组、世界书筛选和名称查询，并显示处理结果；不持久化过期预览。

## 验证与限制

自动化验证使用临时 PC 数据目录、模拟 TT 原生接口和真实 Chromium 的模拟宿主。详见 `CONTENT-VALIDATION.md`。这些测试不代替实机验收：PC SillyTavern、PC TauriTavern、iPhone TauriTavern、Android SillyTavern 本次均未实机验证。

TT 逐资源保存，不提供跨资源原子事务。执行期间应暂停其他窗口、设备和同步编辑。PC ZIP 只允许导回同一用户资料根目录；原备份可重新导出获得当前目录绑定。TT ZIP 继续只允许同一资料集导入。

匹配页沿用原接口每页 100 条；控制器收集匹配身份以支持完整选择，详情按 100 条逐步显示。整批上限仍由原引擎控制（十万处），非常大的结果集需要分批处理以减少浏览器内存占用。

原服务端依赖链的 `npm audit` 报告仍有 moderate 告警（archiver/glob 等）；本次未进行原项目依赖的跨主版本升级。报告保留在交付验证资料中。

## 开发

```text
npm ci
node scripts/build-organizer-content.mjs
npm test
node tests/organizer-browser.mjs
node loader/verify-test-channel.mjs --remote
```

浏览器检查默认使用 Windows Chrome；其他环境可设置 `CHROME_PATH`。`TLE_QA_OUTPUT` 指定截图目录。来源与权利归属见 `batch/CREDITS.md`；fflate 许可见 `batch/vendor/fflate-LICENSE`。
