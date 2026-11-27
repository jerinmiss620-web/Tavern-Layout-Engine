# TLE 更新日志

目前正式版：**Core v0.3.291 / Loader Runtime v0.3.6 / Bootstrap v1.0.6**。

本索引只列已记录的发布版本。历史版本的源码及安装包已从展示目录清理；原始 Git 提交仍保留，回归测试必要的旧源码位于 `tests/fixtures/legacy/`。请从 [README](README.md) 进入最新安装流程，不要导入历史测试脚本。

## 2026-11-27 · Core v0.3.291 · 导航图标可见性与透明度完整修复（候选验证通过）

- 修复兼容性规则把 `.closedIcon` 排除在透明度控制之外的问题；闭合状态与打开状态统一应用透明度变量。
- 图标选择器由直接子元素改为后代匹配，兼容主题在图标外增加包装元素的 DOM 结构。
- 对图标内部 glyph 与 `::before` 贴图补充可见性、透明度恢复规则。
- 透明度变量仍由滑杆实时写入 `body` 的 `--tle-nav-icon-opacity`；兼容规则由宿主文档 `<head>` 中的 `#tle-core-style` 注入。
- 新增 JSDOM 回归：模拟主题将 open/closed 图标及内部 glyph 隐藏，验证恢复显示、可见性、透明度与包装层 DOM。
- 候选分支 Node 24 全量回归 Run #46032465127 通过；正式 main 远端更新链核验待整合后执行。
- Loader Runtime v0.3.6、Bootstrap v1.0.6 不变。

## 2026-11-27 · Core v0.3.290 · 导航兼容修复图标居中

- 将导航兼容性修复中 `.drawer-icon` 的 `display: block` 改为 `display: flex`，恢复主题原有的 Flex 图标居中机制。
- 明确设置 `align-items: center` 与 `justify-content: center`，修复开启导航兼容性修复后图标靠上、不居中的问题。
- 保留原有图标尺寸、点击区域、可见性与透明度规则；不改变导航交互和其他兼容性选项。
- 新增回归断言，检查图标 Flex 布局、双轴居中及开发源码与正式源码逐字节一致。
- Loader Runtime v0.3.6、Bootstrap v1.0.6 不变。

Node 24 全量回归、正式清单远端核验及下载发布字节后的更新链重放，以本次正式发布工作流结果为准。ST/TT 全主题实机视觉矩阵仍未全部覆盖；自动化回归不替代真实宿主验收。

## 2026-11-27 · Core v0.3.289 · 记录预览与主样式历史补丁清理（正式发布）

详见 [本版完整日志](releases/v0.3.289/CHANGELOG.md)。清理记录预览未使用状态与等价 CSS 历史覆盖；移动端详情区内部间距保持 5px、头像列宽 104px、列间距 8px。保留高清头像引擎、角色记录、配套侠与整理侠完整功能。Loader Runtime v0.3.6、Bootstrap v1.0.6 不变。

## 2026-11-27 · Core v0.3.264 · 配套侠修复与紧凑预览、更新按钮原生化（正式发布）

详见 [本版完整日志](releases/v0.3.264/CHANGELOG.md)。将全局世界书纳入配套方案完整保存/同步，修复宿主恢复上次聊天时默认方案未自动恢复的问题；方案预览取消横向分割线并压缩间距；五个更新相关操作统一继承酒馆原生按钮。保留整理侠查找替换布局优化。Loader Runtime v0.3.6、Bootstrap v1.0.6 不变。

## 2026-11-26 · Core v0.3.259 · 整理侠分组管理与更新面板原生按钮（正式发布）

详见 [本版完整日志](releases/v0.3.259/CHANGELOG.md)。整理侠分组管理交互重整、世界书状态筛选与内容查找替换继续整合；管理确认图标语义统一，更新面板操作按钮继承酒馆原生 `.menu_button`。Loader Runtime v0.3.6 与 Bootstrap v1.0.6 不变。

## 2026-11-26 · Core v0.3.239 · 整理侠三栏分隔线与稳定性修复（正式发布）

详见 [本版完整日志](releases/v0.3.239/CHANGELOG.md)。PC 三栏改用纵向 HR 分隔；同时包含整理侠工具栏防重复挂载、配套侠逐项应用与缺项提示、渐隐侠壁纸镜像按需同步修复。

## Core 更新记录

- [v0.3.291](releases/v0.3.291/CHANGELOG.md)
- [v0.3.290](releases/v0.3.290/CHANGELOG.md)
- [v0.3.289](releases/v0.3.289/CHANGELOG.md)
- [v0.3.259](releases/v0.3.259/CHANGELOG.md)
- [v0.3.239](releases/v0.3.239/CHANGELOG.md)
- [v0.3.220](releases/v0.3.220/CHANGELOG.md)
- [v0.3.219](releases/v0.3.219/CHANGELOG.md)
- [v0.3.218](releases/v0.3.218/CHANGELOG.md)
- [v0.3.217](releases/v0.3.217/CHANGELOG.md)

- [v0.3.215](releases/v0.3.215/CHANGELOG.md)

- [v0.3.214](releases/v0.3.214/CHANGELOG.md)

- [v0.3.213](releases/v0.3.213/CHANGELOG.md)

- [v0.3.212](releases/v0.3.212/CHANGELOG.md)

- [v0.3.211](releases/v0.3.211/CHANGELOG.md)
- [v0.3.210](releases/v0.3.210/CHANGELOG.md)
- [v0.3.209](releases/v0.3.209/CHANGELOG.md)
- [v0.3.208](releases/v0.3.208/CHANGELOG.md)
- [v0.3.207](releases/v0.3.207/CHANGELOG.md)
- [v0.3.206](releases/v0.3.206/CHANGELOG.md)
- [v0.3.205](releases/v0.3.205/CHANGELOG.md)
- [v0.3.204](releases/v0.3.204/CHANGELOG.md)
- [v0.3.203](releases/v0.3.203/CHANGELOG.md)
- [v0.3.202](releases/v0.3.202/CHANGELOG.md)
- [v0.3.198](releases/v0.3.198/CHANGELOG.md)
- [v0.3.197](releases/v0.3.197/CHANGELOG.md)
- [v0.3.196](releases/v0.3.196/CHANGELOG.md)
- [v0.3.195](releases/v0.3.195/CHANGELOG.md)
- [v0.3.194](releases/v0.3.194/CHANGELOG.md)
- [v0.3.193](releases/v0.3.193/CHANGELOG.md)
- [v0.3.192](releases/v0.3.192/CHANGELOG.md)
- [v0.3.191](releases/v0.3.191/CHANGELOG.md)

## Loader / Bootstrap 更新记录

- [Loader Runtime v0.3.6](loader/runtime/v0.3.6/CHANGELOG.md)
- [Loader Runtime v0.3.5](loader/runtime/v0.3.5/CHANGELOG.md)
- [Loader Runtime v0.3.4](loader/runtime/v0.3.4/CHANGELOG.md)
- [Loader Runtime v0.3.3](loader/runtime/v0.3.3/CHANGELOG.md)
- [Stable Loader v0.3.2 测试记录](loader/CHANGELOG-Stable-0.3.2-TEST.md)
- [Stable Loader v0.3.1](loader/CHANGELOG-Stable-0.3.1.md)
- [Test Loader v0.3.0](loader/CHANGELOG-0.3.0.md)
- [Test Loader v0.2.2](loader/CHANGELOG-0.2.2.md)
- [Bootstrap v1.0.6](loader/bootstrap/CHANGELOG-1.0.6.md)
- [Bootstrap v1.0.5](loader/bootstrap/CHANGELOG-1.0.5.md)
- [Bootstrap v1.0.4](loader/bootstrap/CHANGELOG-1.0.4.md)
- [Bootstrap v1.0.3](loader/bootstrap/CHANGELOG-1.0.3.md)
- [Bootstrap v1.0.2](loader/bootstrap/CHANGELOG-1.0.2.md)
- [Bootstrap v1.0.1](loader/bootstrap/CHANGELOG-1.0.1.md)

## 2026-11-21 · 仓库维护

- 清理已弃用的历史 Core 和 Loader 可执行文件与导入包，发布目录只留对应版本更新日志。
- 保留最新正式版与 Bootstrap 安装入口；历史兼容测试样本原字节迁至 `tests/fixtures/legacy/`。
- 保留旧 Test 通道清单兼容历史客户端，修正主仓库版本指引和发布模板。

## 2026-11-27 · 历史发布产物清理

- 按 RELEASING.md 统一规则，移除 v0.3.217、v0.3.218、v0.3.219、v0.3.220、v0.3.239、v0.3.259 中遗留的 Core 可执行源码与导入包；各版本 CHANGELOG.md 保留。
- 第一阶段清理保留了当时仍在使用的 v0.3.264；v0.3.289 晋升后，v0.3.264 源码与导入包也转为历史产物并从发布目录移除，原始不可变 Commit 仍可追溯。
- 不改写 Git 历史；旧版不可变 Commit 仍可追溯，回归所需样本继续保留在 tests/fixtures/legacy/。
- latest.json、旧 Loader 兼容用 channels/test.json、Loader Runtime 与 Bootstrap 均不变。

## 2026-11-24 · 历史产物归档

- v0.3.211～v0.3.215 的旧源码与独立安装包从 main 展示目录移除，各版本 CHANGELOG.md 保留；固定 Commit 中的历史发布字节仍可追溯。
- v0.3.216 独立测试阶段的说明保留于 v0.3.217 更新日志与 VALIDATION.md，不作为公开安装入口。
- 当前 Core v0.3.217、Loader v0.3.6、Bootstrap v1.0.6、旧通道兼容清单与回归样本保持不变。
