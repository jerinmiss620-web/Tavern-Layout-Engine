# TLE Core Module System · Phase 2

## 目标与交付边界

TLE 继续以**单份 SillyTavern Assistant JSON**作为用户安装入口。Core 内置 Module Kernel，负责模块注册、依赖解析、生命周期、事件、模块设置命名空间与更新替换回滚。模块源码与版本清单可以独立发布；Loader 在后续阶段按清单下载、校验并交给 Core 注册。

本阶段先建立 Kernel，不迁移任何现有功能。当前正式 Core v0.3.304、Loader Runtime v0.3.6、Bootstrap v1.0.6 与 Stable Manifest 均保持不变。开发分支中的 Core 单体源码只增加 Kernel 入口；现有导航、会话侠、楼层侠、整理侠、兼容修复、渐隐侠、画廊、头像引擎等行为暂不拆动。

## 当前实现

- Kernel 源码：development/core/module-kernel.js
- 嵌入构建：node scripts/build-module-kernel.mjs
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
- events.on/emit：事件订阅和发布，分别要求 events:subscribe、events:emit 权限；模块停止时自动移除订阅。
- settings.get/set/remove/clear：按模块 ID 与设置 Schema 版本隔离的 JSON 存储；分别要求 settings:read、settings:write 权限。
- modules.getAPI(id)：仅可读取已声明为直接父模块或直接依赖、且当前处于 active 状态的模块 API。
- hasPermission/requirePermission：能力声明检查。

模块 destroy 与 init 返回的 cleanup 必须同步完成，不能依赖异步清理。异步初始化应监听 context.signal；若 Core 在初始化完成前卸载，Kernel 会中止初始化，并在异步结果返回后立即执行其同步 cleanup。

## 权限边界说明

permissions 是 Core API 的能力声明与调用门槛，**不是 JavaScript 沙箱**。模块脚本与 TLE 在同一宿主页面执行；恶意或被篡改的脚本仍可能直接访问页面全局对象。因此安全更新必须依赖不可变 Commit URL、SHA-256、字节数、来源校验与 Loader 的已验证加载链。不能把权限数组宣传为浏览器级隔离。

## 尚未实现（后续阶段）

1. Manifest 下载器：获取 Stable/Test 清单，校验 Schema、Core API 兼容性、依赖图、来源、Commit、SHA-256 和字节数。
2. 模块源码加载器：只执行通过校验的固定源码；避免重复加载、并发更新和跨通道污染。
3. 模块版本缓存：模块级 Last Known Good、previous version、候选隔离与失败回滚。
4. Engine Hub：展示模块版本、状态、依赖、更新/停用入口；继续继承酒馆原生 UI，不另造一套管理系统。
5. 试点迁移：选择一个依赖少、边界清楚的现有功能；通过 ST/TT 实机验证后再迁移会话侠/楼层侠等父子模块。
6. 全量迁移与旧代码清理：只有模块独立启停、独立更新、失败隔离、全局卸载和回滚全部通过后才逐项执行。
