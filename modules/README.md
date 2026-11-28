# TLE Core Module System · Phase 2

## Phase 3 现有功能盘点

现有功能的源码边界、跨模块依赖、会话侠父子模块设计及迁移顺序见 [PHASE-3-INVENTORY.md](./PHASE-3-INVENTORY.md)。该文件是架构审计与计划记录；未获独立验收前，不代表已迁移或已进入 Stable。

## 目标与交付边界

TLE 继续以**单份 SillyTavern Assistant JSON**作为用户安装入口。Core 内置 Module Kernel，负责模块注册、依赖解析、生命周期、事件、模块设置命名空间与更新替换回滚。模块源码与版本清单可以独立发布；Loader 在后续阶段按清单下载、校验并交给 Core 注册。

本阶段建立 Kernel 与 Loader，并以 HD Avatar 作为受控试点；其他现有功能暂不迁移。当前正式 Core v0.3.304、Loader Runtime v0.3.6、Bootstrap v1.0.6 与 Stable Manifest 均保持不变。开发分支中的 Core 单体源码只增加 Kernel 入口；除 HD Avatar 试点外，现有导航、会话侠、楼层侠、整理侠、兼容修复、渐隐侠与 Gallery 暂不拆动。

## 当前实现

统一构建入口为 `npm run build:core`；使用 `npm run build:core -- --check` 进行只读一致性核验。底层 Kernel / Loader 构建脚本由统一入口调用，不需要分别执行。

- Kernel 源码：development/core/module-kernel.js
- 嵌入构建：npm run build:core
- 嵌入位置：TLE_MODULE_KERNEL_START / TLE_MODULE_KERNEL_END
- Core API：api.modules
- Kernel API：1
- Kernel 版本：1.0.0
- Stable 模块清单：modules/stable.json
- 清单 Schema：modules/manifest.schema.json
- 回归：tests/tle-module-kernel.test.mjs、tests/tle-module-manifest.test.mjs

Stable 清单当前故意为空。只有模块完成独立源码提取、固定 Commit、SHA-256/字节数核验、依赖检查、生命周期回归和失败回滚测试后，才允许加入清单。空清单不代表现有 TLE 功能被删除；它代表目前还没有任何功能被正式迁移为可独立下载的模块。

## 模块定义

模块定义至少包含：

- id：永久稳定 ID，不随显示名称或版本变化。
- name：面向用户/开发者的名称。
- version：独立 SemVer 版本。
- apiVersion：所依赖的 Core Module API 版本。
- parentId：可选父模块 ID，用于功能层级和生命周期归属。
- dependencies：必须先启动的模块依赖。
- permissions：声明使用的 Core 能力。
- settingsSchemaVersion：模块设置结构版本。
- init(context)：初始化入口，可异步；收到 AbortSignal。
- destroy(context)：同步清理入口，可选。

## 生命周期与依赖语义

- register(definition)：注册但不自动启动。
- start(id)：先启动父模块与依赖，再启动目标模块。
- stop(id)：停止目标模块及所有依赖它或归属于它的活动子模块；逆依赖顺序清理。
- unregister(id)：默认拒绝删除仍被引用的模块；只有显式 { cascade: true } 才级联卸载。
- replace(definition)：原子替换同 ID 模块。先停止目标及其活动子树/依赖方，再启动候选版本；候选失败时恢复旧定义并重新启动此前活动的模块集合。
- destroy()：Core 退出时同步终止模块、AbortSignal 和事件订阅，再由 Core 执行自身 DOM 恢复。

parentId 表示层级归属，不等同于技术依赖。比如会话侠可以是楼层侠的父模块；楼层侠停止不应卸载会话侠，停止会话侠则会级联停止楼层侠。技术依赖使用 dependencies 单独表达。

## Context API

模块初始化时接收冻结的 Context：

- signal：模块生命周期 AbortSignal。
- host.scriptWindow / host.window / host.document：分别要求 host:script-window、host:window、host:document 权限；用于兼容现有组件的宿主访问。该能力声明仍不是沙箱。
- events.on/emit：事件订阅和发布，分别要求 events:subscribe、events:emit 权限；模块停止时自动移除订阅。
- settings.get/set/remove/clear：按模块 ID 与设置 Schema 版本隔离的 JSON 存储；分别要求 settings:read、settings:write 权限。
- modules.getAPI(id)：仅可读取已声明为直接父模块或直接依赖、且当前处于 active 状态的模块 API。
- hasPermission/requirePermission：能力声明检查。

模块 destroy 与 init 返回的 cleanup 必须同步完成，不能依赖异步清理。异步初始化应监听 context.signal；若 Core 在初始化完成前卸载，Kernel 会立即调用定义级 destroy 清理部分初始化，再在异步结果返回后执行返回值 cleanup。定义级 destroy 必须可重复调用且能安全处理部分初始化状态；Kernel 会避免对同一个定义级 destroy 重复调用。

## 权限边界说明

permissions 是 Core API 的能力声明与调用门槛，**不是 JavaScript 沙箱**。模块脚本与 TLE 在同一宿主页面执行；恶意或被篡改的脚本仍可能直接访问页面全局对象。因此安全更新必须依赖不可变 Commit URL、SHA-256、字节数、来源校验与 Loader 的已验证加载链。不能把权限数组宣传为浏览器级隔离。

## Phase 2.2 当前实现

- Module Loader 源码：development/core/module-loader.js
- Core 嵌入构建：npm run build:core
- Core 嵌入位置：TLE_MODULE_LOADER_START / TLE_MODULE_LOADER_END
- Core API：api.moduleLoader（refresh / update / updateAll / enable / disable / uninstall；Kernel 仍通过 api.modules 暴露）
- Manifest：modules/stable.json 与 modules/test.json 分通道管理
- 缓存：IndexedDB，分别保存模块源码、Manifest 与模块安装状态
- LKG：仅在模块成功初始化后推进；失败候选不会覆盖 Last Known Good
- 依赖生命周期：按 parent/dependencies 拓扑加载；停用父模块会级联停用依赖模块，重新启用父模块会恢复此前处于启用状态的子模块
- 模块源码：必须绑定完整 Commit SHA、仓库内路径、SHA-256 与 UTF-8 字节数；相同 SemVer 不允许更换源码摘要
- 加载方式：只对校验后的源码创建 Blob ESM URL，不使用 eval / new Function；模块源码必须自包含，不允许静态 import
- 回退：Core 内置 HD Avatar Engine 4.5.14 作为离线 fallback；远程候选失败时保留或恢复可用版本
- 试点：avatar.hd，模块自身版本独立于引擎显示版本；TT 保留原生绕过

## 隔离边界

模块错误隔离指加载、初始化、替换、停止和依赖生命周期隔离，不是安全沙箱。模块以 Blob ESM 运行在 Core 所在的页面 JavaScript Realm；因此只加载仓库内固定 Commit 且通过摘要验证的可信模块。模块必须遵守 Kernel 的宿主能力接口，并在 destroy 中清理事件、观察器、计时器和 DOM 改动。不能把权限列表描述为对任意恶意代码的安全隔离。

## Phase 2.2 实机验收结果与后续边界

- 2026-11-29，ST 与 TT 实机验收全部通过。验收覆盖 Manifest 获取、Blob ESM 模块加载、HD Avatar 显示与切换、Last Known Good、刷新/重进恢复、断网恢复、错误哈希/字节数/初始化失败回滚、模块独立停用/启用/卸载、TT 原生头像绕过，以及完整卸载 TLE 后的模块资源清理。
- 本轮验收对象为 Test Core v0.3.304 与 Test Loader 0.3.1；固定源码 Commit、SHA-256 与字节数记录在 `VALIDATION.md`。
- 实机通过只代表试点运行链验收完成，不自动构成正式推广决定。`modules/stable.json` 继续保持空，`avatar.hd@1.0.0` 暂留 `modules/test.json`；只有单独完成 Stable promotion 审查与正式发布后，才考虑加入 Stable Manifest。
- Core 内置 HD Avatar Engine 4.5.14 fallback 继续保留，确保离线与模块加载失败时仍有可用头像处理。
- Gallery Home、会话侠、楼层侠及其他模块暂不迁移；后续按模块边界单独规划、开发和验收。
