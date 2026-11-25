## 2026-11-25 · Core v0.3.230 · 恢复常驻 UI 主题分组同步入口（开发分支）

- 保留「从主题管理读取分组」原有实现与 `importThemeManagerGroups()` 调用，不改数据读取、转换、确认和保存流程。
- 移除同步按钮仅在 UI 主题分类显示的限制；现在「同步」始终与全部分组「导入 / 导出」并排显示在整理侠标题右侧。
- 点击同步仍只读取主题管理本机已有分组，只替换 TLE 的 `theme` 分组与归属，不会覆盖预设、世界书、角色卡等其他分类；成功后自动切换到 UI 主题分类查看结果。
- 清理移动端同步入口从分类栏移出后遗留的旧分类栏 CSS 规则。
- JavaScript 语法检查及同步函数保留性检查通过；ST/TT 实机验收待完成。正式 Stable Core 仍为 v0.3.220。

## 2026-11-25 · Core v0.3.229 · 整理侠工具栏归位与滚动条修正（开发分支）

- 移除整理侠标题右侧重复的关闭 X，继续使用原生 `.drawer-content` 的关闭方式；全局搜索弹窗的关闭按钮不变。
- 将主题分组同步、全部分组导入、全部分组导出三个工具统一移至整理侠标题右侧，不再占用分类栏和分组筛选栏空间。
- 移动端分类与分组筛选改为常驻 3px 横向滚动指示条，保留原生横向触摸滚动，不再显示 15px 系统滚动条，也不再完全没有滚动反馈。
- 批量操作区按钮固定 30px 高，重置按钮默认外边距，改用 3px 行间距与 4px 列间距；资源列表继续占据剩余高度。
- PC 三栏结构、分组数据、搜索、世界书绑定识别和批量删除权限不变；JavaScript 语法检查通过，ST/TT 实机视觉验收待完成。正式 Stable Core 仍为 v0.3.220。

## 2026-11-25 · Core v0.3.228 · 整理侠移动端布局优化（开发分支）

- 整理侠标题与简介改为同行显示，简介仅保留「资源分组 · 批量管理」。
- 移动端分类与分组筛选栏限制高度并隐藏横向滚动条；备份入口与分组筛选共用一行，目标分组与分组管理操作共用一行。
- 批量操作改为三列两排，资源列表占据剩余高度；PC 三栏布局保留。
- 整理侠面板底色透明度由 0.20 调整为 0.12；不改动分组数据、搜索能力、世界书绑定逻辑或批量删除权限。
- JavaScript 语法检查通过；PC/移动端 ST/TT 真实界面验收待完成。正式 Stable Core 仍为 v0.3.220。

## 2026-11-25 · Core v0.3.227 · 修复整理侠初始化中断（开发分支）

- 修复分组标题栏初始化时先引用后声明 groupHeading，导致 ReferenceError 中断整理侠渲染的问题。
- 原有分组数据、搜索、世界书绑定信息与批量操作权限不变；正式 Stable Core 仍为 v0.3.220。

## 2026-11-25 · Core v0.3.222 · 整理侠第十个原生导航抽屉（开发分支）

- 整理侠作为第十个 `.drawer` 插入原生九个导航抽屉之后，位置在角色管理下方；拥有独立 `.drawer-toggle` 和 `.drawer-content`，按原生抽屉状态展开/收起。
- 原全局搜索页面迁入该 `.drawer-content` 并保持默认视图；资源管理仍嵌入同一面板；移除旧居中 popup/modal 结构与遮罩。
- 导航行高、紧凑双列布局和移动端汉堡导航改为按十个抽屉计数；TLE Engine Hub 仍保留底部位置。
- GitHub Actions run 45557624063（job `validate`）通过：全量回归、release metadata、原生第十抽屉结构断言及远端测试通道 SHA/字节数校验通过；正式 Stable Core 保持 v0.3.220。

## 2026-11-25 · Core v0.3.225 · 整理侠 PC 三栏资源工作区（开发分支）

- PC 宽屏改为「资源类型 / 分组目录 / 资源列表」三栏，搜索框位于右侧资源栏。
- 左侧分类、中间分组和右侧资源列表分别独立滚动；保留原有分组数据、世界书筛选和批量操作。
- 1000px 及以下展平为原有移动端单栏流程，不新增第二套管理器。
- 正式 Stable Core 仍为 v0.3.220；本候选仅用于独立 Test 通道。GitHub Actions run `45570073432` 的完整 `npm test` 与 Organizer Test 通道校验通过；PC/移动端 ST/TT 实机验收仍待执行。

# TLE 更新日志

目前正式版：**Core v0.3.220 / Loader Runtime v0.3.6 / Bootstrap v1.0.6**。

本索引只列已记录的发布版本。历史版本的源码及安装包已从展示目录清理；原始 Git 提交仍保留，回归测试必要的旧源码位于 `tests/fixtures/legacy/`。请从 [README](README.md) 进入最新安装流程，不要导入历史测试脚本。

## Core 更新记录

- [v0.3.230](releases/v0.3.230/CHANGELOG.md)
- [v0.3.229](releases/v0.3.229/CHANGELOG.md)
- [v0.3.228](releases/v0.3.228/CHANGELOG.md)
- [v0.3.227](releases/v0.3.227/CHANGELOG.md)
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

## 2026-11-24 · 历史产物归档

- v0.3.211～v0.3.215 的旧源码与独立安装包从 main 展示目录移除，各版本 CHANGELOG.md 保留；固定 Commit 中的历史发布字节仍可追溯。
- v0.3.216 独立测试阶段的说明保留于 v0.3.217 更新日志与 VALIDATION.md，不作为公开安装入口。
- 当前 Core v0.3.217、Loader v0.3.6、Bootstrap v1.0.6、旧通道兼容清单与回归样本保持不变。
