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
