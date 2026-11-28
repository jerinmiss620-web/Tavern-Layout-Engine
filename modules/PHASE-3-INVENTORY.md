# Phase 3 · TLE 现有功能模块盘点与迁移边界

> 状态：第一轮源码盘点已完成；Phase 3.1 Core Services API v2 已在 Draft PR #35 实现并通过自动化 / 远程校验，ST / TT 实机验收待完成；业务模块尚未迁移。
>
> 唯一基线：`main@cb4f241a54a5890f11e0b0f8ac1bbc5f12fb9330`（2026-11-29）。
>
> 原则：保留现有 SillyTavern / TauriTavern 原生面板与交互，不另建一套角色、世界书、预设或设置管理系统；不改变现有 UI 布局和功能语义；所有提取均从权威源码进行，禁止在生成后的 Core 内叠加补丁。

## 1. 审计结论

当前 TLE 已经具备可用的 Module Kernel、Module Loader、独立 Manifest、模块级更新/回滚和父子生命周期能力，但**绝大多数业务功能仍集中在完整 Core 单体源码中**。

- `development/organizer/TLE.js`：25,443 行，UTF-8 文件大小 1,209,522 bytes（Test Core v0.3.305；Stable Core v0.3.304 未修改）。
- 当前 Core 里已经有明确的生成边界：Organizer Batch、Module Kernel、Module Loader、HD Avatar、Gallery Home。
- 其中 Batch、Avatar、Gallery 已有独立权威源码；Kernel / Loader 也由独立源码构建。
- 但除 `avatar.hd@1.0.0` 的 Test-only 试点外，其余组件仍随 Core 一起交付，并不是可由 Manifest 独立更新的远程模块。
- 当前 `modules/stable.json` 为空；本阶段不改变 Stable Manifest，也不推广任何模块。

**Phase 3 的核心工作不是把一个大文件机械切成很多小文件，而是把功能边界、共享服务、生命周期和 UI 挂载接口先定义清楚。** 否则只会把原来的跨文件耦合搬到跨模块耦合，反而增加更新和排错成本。

## 2. 当前源码分层

| Core 区域 | 当前行范围 | 现状 / 权威来源 |
|---|---:|---|
| Organizer Batch bundle | 21–2766 | 由 `development/organizer/batch/controller.js` 及其依赖打包生成，嵌入 `TLE_CONTENT_BUNDLE` |
| Module Kernel bundle | 2767–3484 | 由 `development/core/module-kernel.js` 生成 |
| Module Loader bundle | 3486–4436 | 由 `development/core/module-loader.js` 生成 |
| Core 业务单体 | 4437–22527 | 导航、设置、信息站、资源快切、整理侠、渐隐侠、隐藏楼层保护、配套侠、打码侠、会话侠、诊断、全局搜索、工作区布局等 |
| HD Avatar | 22528–22824 | 由 `development/avatar-engine/avatar-engine.js` 生成；另有远程 Test 模块源码 |
| Gallery Home | 22825–24748 | 由 `development/gallery-home/gallery-home.js` 生成 |
| Core Services registry / 销毁与启动接线 | 24749–25443 | 全局事件、Observer、模块启动、功能清理和 Core destroy |

### 现有独立源码目录

| 源码 | 文件大小（Git Blob） | 当前用途 |
|---|---:|---|
| `development/core/module-kernel.js` | 28,148 bytes | 模块注册、依赖、生命周期、Context、事件与设置 |
| `development/core/module-loader.js` | 38,491 bytes | Manifest、固定 Commit、SHA-256、字节数、IndexedDB、LKG、回滚 |
| `development/organizer/batch/controller.js` | 34,746 bytes | Organizer 内容查找与替换控制器，使用宿主注入接口 |
| `development/organizer/batch/batch-engine.js` | 6,019 bytes | 纯文本规则、匹配、预览与替换算法 |
| `development/organizer/batch/batch-runtime.js` | 2,175 bytes | PC / TT 批处理客户端运行时 |
| `development/organizer/batch/batch-adapters.js` | 9,045 bytes | 明确的可编辑字段与资源适配 |
| `development/organizer/batch/batch-tt.js` | 40,420 bytes | TT 原生资源适配、校验、备份与恢复 |
| `development/organizer/batch/storage.js` | 3,494 bytes | IndexedDB 规则存储 |
| `development/organizer/batch/catalog.js` | 3,447 bytes | 资源身份到 Organizer 目录的映射 |
| `development/avatar-engine/avatar-engine.js` | 13,261 bytes | Core 内置 HD Avatar fallback |
| `modules/src/hd-avatar-engine.js` | 13,717 bytes | Test-only 远程模块 `avatar.hd@1.0.0` |
| `modules/src/core-services-smoke.js` | 2,822 bytes | Test-only `core.services-smoke@1.0.0`，无 UI 服务契约冒烟模块 |
| `development/gallery-home/gallery-home.js` | 107,819 bytes | Gallery Home 独立工厂，具有 start / stop 生命周期 |

`scripts/build-core.mjs` 是唯一正式 Core 构建入口。它负责装配 Kernel、Loader、Batch、Avatar 和 Gallery。生成区必须继续由 `npm run build:core` 管理，不得手工编辑嵌入后的副本。

## 3. 功能域盘点

### A. Core 基础设施：第一轮不迁移

| 功能域 | 当前实现 | 处理建议 | 原因 |
|---|---|---|---|
| Core 启动 / 销毁 / Host 识别 | Core IIFE、`state`、`destroy()` | 留在 Core | 是所有模块的生命周期根节点 |
| 导航 Drawer / 左侧栏 / 汉堡导航 / 停靠 / 手势 | `createRailControls`、`syncRail` 等 | 留在 Core | 直接管理 ST / TT 原生导航 DOM，影响整个工作区 |
| 预设与角色双栏工作区 | `applyPresetWorkspace`、`applyCharacterWorkspace` 及恢复流程 | 留在 Core | TLE 的基础布局接管能力，不是普通可选页面 |
| 兼容性修复 | 导航图标、结构、背景和主题兼容 | 留在 Core | 直接修改宿主原生 DOM / 样式，必须由 Core 统一协调 |
| 全局诊断 / 移动调试台 | 诊断浮球、事件捕获、报告采集 | 留在 Core | 是模块故障排查和 Core 恢复的基础设施 |
| 折叠侠 | 原生抽屉折叠、预设区域折叠 | 暂留 Core | 直接包裹原生 DOM，跨多个宿主区域 |
| 全局共享 CSS | `createStyle()`，约 3,840 行 | 先拆分归属，不急于远程化 | 目前模块样式与 Core 样式混在同一大段样式表中 |

### B. 会话侠：采用父模块 + 子模块

当前会话侠不是一个独立页面函数，而是由父级浮窗、页面路由、共享聊天上下文和多个功能页组成。

当前页面结构（保持不变）：

- 楼层侠
- 最近聊天
- 配套方案
- 打码侠（默认关闭）

建议模块层级：

```text
session                         会话侠父模块 / 页面容器
├── session.floor               楼层侠
├── session.companion            配套侠
└── session.mask                 打码侠
```

最近聊天先作为父模块的内置页面保留，不在第一轮额外拆成独立远程模块。会话快捷操作也先由父模块管理。

| 模块 | 当前代码范围 | 主要职责 | 主要依赖 / 风险 |
|---|---|---|---|
| `session` | `createChatTools`、`openChatTools`、`closeChatTools`、`setChatToolsPage`，约 19421–19582 | 浮窗、按钮、标题栏、Tab、页面挂载与切换、点击外部关闭 | 需要稳定的页面注册接口；不得由子模块重复创建第二个浮窗 |
| `session.floor` | 聊天操作、范围解析、隐藏楼层保护，约 9177–9370 与 14865–15567 | 跳转 / 隐藏 / 恢复 / 复制范围、隐藏楼层指纹和保护记录 | 需要共享聊天快照、原生 slash command、事件源；保护存储与恢复算法必须原样保留 |
| `session.companion` | 约 15903–17752，约 2,185 行 | 角色方案、预设条目状态、全局世界书、自动套用、日夜计划、手动保持 | 复杂度最高；依赖角色 / 预设 / 快切目录 / 生成状态；异步角色切换、提示词保存桥接和启动恢复必须保持 |
| `session.mask` | 约 17753–18919，约 1,167 行 | 名称、头像、正文与楼层替换；方案；头像资产历史；显示层恢复 | 需要聊天上下文与父页面挂载；必须保留对象 URL、Observer、IndexedDB 和原生编辑前卸除效果 |
| 父模块内置：最近聊天 | 约 15568–15902 中的最近聊天部分 | 最近聊天列表、搜索、当前角色过滤和打开聊天 | 依赖 ST / TT 原生聊天 API；先留父模块，后续再判断是否独立 |

#### 会话侠有一个必须保留的行为边界

当前「启用会话侠」设置是**入口 / 面板可见性开关，不等同于 Module Kernel 的 parent stop**：

- `setChatToolsEnabled(false)` 会隐藏入口、关闭浮窗，并关闭打码侠。
- 它不会调用 `companionCleanup()`；配套侠仍会监听角色 / 聊天变化并执行已配置的自动方案。
- 隐藏楼层保护目前在会话侠创建时启动，Core 完整卸载时才执行停止。
- 配套侠的方案页虽然挂在会话侠里，但它的后台自动套用不依赖浮窗处于打开状态。

因此，未来 `session` 父模块必须常驻运行；用户关闭会话侠入口时，只改变现有 UI / 功能开关，不得直接执行 `moduleKernel.stop('session')`，否则会意外停止配套侠自动套用。父子模块关系用于生命周期归属和级联卸载，不可直接替代现有用户设置语义。

### C. 整理侠：先抽共享服务，再拆父子模块

当前整理侠包括：

1. 导航入口与资源管理抽屉；
2. 资源分类、分组、批量删除；
3. 内容查找与替换；
4. 与侧栏信息站共用的资源目录、快切和分组能力。

建议的目标层级：

```text
organizer                       整理侠父模块 / 原生抽屉
├── organizer.resources         资源分组与批量管理
└── organizer.content           内容查找与替换（Batch）
```

但当前不能直接把 `quick*` 函数整体搬进 Organizer：`quickCatalog`、`quickGroups`、`quickPanel` 等能力同时服务侧栏信息站、配套侠和整理侠。若直接迁移，会造成信息站或配套侠失去资源目录 / 快切能力。

**先建立 Core Resource Catalog / Quick Picker 服务契约，再迁移 Organizer。**

其中 `organizer.content` 是较好的候选：现有 `OrganizerContent` 已采用宿主注入接口，控制器与 Batch Engine / Adapter / Storage / TT Runtime 分文件维护。迁移时必须继续复用整理侠原生搜索框、资源列表、分组筛选和选择状态，不得另建第二套资源管理界面。

### D. 其它独立候选

| 候选模块 | 当前范围 | 可拆程度 | 处理建议 |
|---|---|---|---|
| `chat.fade` 渐隐侠 | 约 14242–14864，另有共享 CSS、设置和宿主事件接线 | 中高 | 有独立开关、状态和 Observer；需先分离样式并提供背景 / 主题变化事件 |
| `chat.scroll-bottom` 回底侠 | 约 19152–19349，另有设置与 DOM 同步入口 | 高 | 有明确 enable / destroy，适合在会话模块之后迁移 |
| `home.gallery` 记录预览 | 已有独立 `gallery-home.js` 工厂 | 高（源码边界已存在） | 先审计其对 Core 全局对象的引用，再决定远程化；保持现有首页开关与原生首页切换 |
| `avatar.hd` 高清头像 | 已有 Test-only 模块和 Core fallback | 已完成试点 | 维持 Test-only；Stable promotion 另行审议 |
| `search.global` 全局搜索 | `createGlobalSearch` 与搜索索引 / 跳转逻辑 | 中 | 与工作区顶栏、导航入口、整理侠跳转存在耦合，待导航扩展 API 稳定后再拆 |
| 可选功能包管理 | 壁纸绑定、覆盖侠脚本下载 / 校验 / 更新 | 中 | 这是独立脚本包管理器，不应与 TLE Core Module Loader 混为一谈；暂留 Core |

## 4. 已确认的跨模块耦合

### 4.1 共享状态

当前 `state` 对象直接保存多个功能的运行状态，包括：

- `state.chatTools`：父浮窗、隐藏楼层保护、最近聊天、打码侠。
- `state.chatFade`：渐隐侠壁纸镜像、伪元素、Observer 和动画帧。
- `state.scrollBottom`：回底按钮、聊天节点、生成状态与事件监听。
- `state.organizerPanel` / `state.organizerObserver`。
- `state.globalSearchPanel` / 搜索索引与跳转状态。
- `state.abort`：当前大量 Core 事件监听共用的 AbortSignal。

迁移后不能让子模块继续读写整个 Core `state`。每个模块应拥有私有状态，只通过父模块或 Core service 暴露的窄 API 访问共享数据。

### 4.2 共享函数

至少以下能力被多个功能共同使用，不能复制成多份：

- `getActiveChatActionContext()`：会话操作、隐藏楼层保护、打码侠、聊天工具都使用。
- `isNativeGenerationVisible()`：配套侠和回底侠等功能使用。
- `quickCatalog()` / `applyQuickChoice()`：配套侠、信息站快切和资源管理共用。
- 原生聊天事件源、角色身份、当前聊天标识、slash command 和通知能力。

这些应先形成 Core service 接口，再由模块声明需要的权限 / 能力。

### 4.3 共享样式

当前 `createStyle()` 约 3,840 行，包含导航、会话侠、整理侠、渐隐侠、回底侠、诊断、搜索和其他 UI 样式。若只拆 JS 而把模块样式继续硬编码在 Core，模块将无法完整独立更新或卸载。

迁移前需建立样式归属表：

- Core 基础布局、导航、原生兼容规则留在 Core；
- 子模块专属样式随模块源码交付；
- 模块停止 / 卸载时移除自己的 style 节点；
- 不新增全局强制统一主题，不覆盖 ST / TT 原生控件样式。

### 4.4 设置面板与事件路由

当前 `createPanel()` 一次性生成大量功能设置；Core 的集中 `change` 监听按 `data-tle-setting` 分发所有功能开关。模块化后需要提供注册接口，让模块把设置行挂进**现有 TLE 原生控制面板**，并由模块自身处理其设置事件；不新建第二个设置管理器。

### 4.5 生命周期与清理

当前 Core `destroy()` 显式调用：

- `hiddenFloorGuardStop()`
- `maskHeroClearEffects()`
- `closeChatTools()`
- `companionCleanup()`
- 渐隐侠清理
- `destroyScrollBottom()`
- Organizer / Search Observer 清理

迁移后应逐项移交给模块自己的 `destroy` / cleanup，并验证 Kernel 在 Core DOM 恢复前完成同步卸载。不能让 Core 与模块同时清理同一资源，也不能留下重复监听、Observer、计时器、Object URL、IndexedDB 连接或 DOM 标记。

## 5. Phase 3 需要先建立的 Core service 契约

第一轮业务功能提取前，Core service 契约状态如下：

1. **Host Context / `chat-context`：已实现 API v2**。提供冻结聊天 / 消息快照、当前角色快照、生成状态，以及通过预期 `chatKey` 校验后执行原生 slash command。User Persona、完整 eventSource 订阅与 toast 仍需按模块迁移需求补齐。
2. **Session Page Registry：待实现**。子模块注册 / 注销页面、标签、顺序、挂载点；父模块负责唯一浮窗和 Tab 切换。
3. **Settings Registry：待实现**。模块向现有 TLE 控制面板注册设置区 / 控件；设置数据使用模块独立命名空间。
4. **Resource Catalog / `resource-catalog`：已实现 API v2**。提供统一目录、管理目录与快切接口；异步调用必须传入模块自己的 AbortSignal。后续迁移仍须验证旧 UI 与原生资源适配语义不变。
5. **Navigation Registry：待实现**。需要导航入口的模块通过 Core 注册；导航 DOM 和 ST / TT Drawer 仍由 Core 唯一管理。
6. **Style Ownership：待实现**。模块专属样式由模块创建和清理；Core 样式保留在 Core。
7. **Lifecycle Helpers：部分具备**。Kernel 已提供模块 AbortSignal 与同步 destroy/cleanup 机制；Observer、计时器、RAF、Object URL、DB 连接的便捷注册器仍待补齐。

Kernel Context API v2 已在 Draft PR #35 实现：除 `signal`、权限化 host 引用、事件订阅和模块设置命名空间外，增加权限门控的 `context.services.get(id)`。Core 提供 `chat-context` 与 `resource-catalog`；Test Manifest 中的 `core.services-smoke` 自动检查权限、冻结快照和 AbortSignal 契约。该候选已通过 CI 与远程 Commit / SHA-256 / 字节数校验，ST / TT 实机验收仍待完成。Session Page Registry、Settings Registry、Navigation Registry 和模块样式注册仍待后续实现。

## 6. 建议迁移顺序

### Phase 3.1 · Core Services API v2 与测试候选

- 已实现 `chat-context` 与 `resource-catalog` 两项权限门控共享服务，Kernel API v2 / 1.1.0。
- 已建立 Test Core v0.3.305、Test Loader 0.3.2 和自动启动的 `core.services-smoke`；CI、main 基线与远程固定源码校验通过。
- 当前等待 ST / TT 实机验证；通过前不合并 PR #35、不提升 Stable Manifest。
- Session Page Registry、Settings Registry、Navigation Registry 与 Style Ownership 仍是下一轮待实现接口。
- 所有业务功能仍由 Core 启动；本阶段没有迁移任何用户功能，不改变 UI、开关默认值和数据格式。

### Phase 3.2 · 会话侠父模块 + 楼层侠

- 先抽出唯一会话侠浮窗、Tab 容器和页面注册 API。
- 将楼层操作与隐藏楼层保护迁移为 `session.floor`。
- 最近聊天先留在父模块，配套侠和打码侠仍使用原实现，避免一次改动三个复杂子系统。
- 验证隐藏楼层恢复 / 接受当前状态、聊天切换、刷新、卸载和父子级联。

### Phase 3.3 · 打码侠

- 将方案、规则、消息显示层替换、头像资产、IndexedDB 和清理逻辑迁移为 `session.mask`。
- 保持默认关闭、原始聊天数据不写入、进入原生编辑前自动卸除、关闭后保留方案。
- 验证快速切换聊天、重复应用、图片 Object URL 清理和 TT 虚拟化。

### Phase 3.4 · 配套侠

- 在 Quick Catalog / Host Context API 稳定后迁移 `session.companion`。
- 保留角色切换触发规则、启动恢复、日夜计划、手动保持、提示词条目基线和保存桥接。
- 特别验证：会话侠面板关闭时，配套侠的后台自动套用仍正常工作。
- 这是本组风险最高的迁移，不与其他子模块同时改动。

### Phase 3.5 · Organizer Content / Batch

- 先确认 Organizer 父容器和共享资源目录服务。
- 再把现有 Batch 控制器注册为 `organizer.content`。
- 保留同一个搜索框、模式复选框、资源列表、范围选择、预览、备份和原有 PC / TT 适配。
- 不重复开发资源管理 UI，也不改变原扩展的文件 / 数据协议。

### Phase 3.6 · Gallery / Fade / Scroll Bottom

- 分别迁移 Gallery Home、渐隐侠、回底侠。
- 每个模块单独 Test Manifest、固定 Commit、SHA-256、字节数和回滚验证。
- Gallery 和 Avatar 保留经审计的 Core fallback，直到独立远程加载和离线恢复经过实际验证。

## 7. 每个模块的独立验收门槛

每次只迁移一个功能模块，独立 PR / 测试分支，不把多个功能一起改：

- 模块源码有唯一权威来源；Core 不再保留未同步的第二份业务实现。
- Manifest 固定完整 Commit、source path、SHA-256 和 UTF-8 字节数。
- 父模块 / 技术依赖分别声明；不能把 parent_id 当成技术依赖。
- 单独 enable / disable / update / uninstall；无关模块保持运行。
- 初始化失败、下载错误、哈希错误、字节数错误、运行时异常均能回滚。
- LKG 只在初始化成功后推进。
- 刷新、重进、断网和 TT / ST 宿主行为符合既有语义。
- DOM、CSS、Observer、监听、计时器、RAF、Object URL、IndexedDB 和事件订阅完整清理。
- 模块设置和用户数据跨升级保留；不得因拆文件而重置现有配置。
- Core 全量卸载后恢复原生布局，且无模块残留。
- 只有 Test 通道与 ST / TT 实机验收通过，才单独审议 Stable promotion。

## 8. 本轮不做的事情

- 不直接拆改 `development/organizer/TLE.js`。
- 不把整个导航、布局、兼容修复或诊断系统远程化。
- 不重新开发角色、世界书、预设、设置等酒馆已有管理功能。
- 不重写整理侠 UI，不改变现有三栏 / 移动端布局。
- 不把 `permissions` 当作 JavaScript 沙箱。
- 不把旧测试分支作为开发基线。
- 不修改 Stable Core v0.3.304、Loader Runtime v0.3.6、Bootstrap v1.0.6、`latest.json` 或 Stable Module Manifest。
- 不在本轮将 `avatar.hd` 推广到 Stable。

## 9. 当前阶段结论

**Core Services API v2 的代码与自动化验收已经完成；当前首要门槛是 ST / TT 实机验证 Test Core v0.3.305。**

实机通过后，下一项代码任务是建立 Session Page Registry 与唯一父容器接口，再迁移 `session` 父模块和 `session.floor`。之后才处理打码侠与配套侠。必须保留：关闭会话侠入口只影响面板可见性，不得停止配套侠后台自动套用；父子级联卸载也不能直接替代现有用户设置语义。


## Phase 3.1 device smoke check

- Test-only `core.services-smoke@1.0.0` is enabled by default in the Phase 3 Test manifest. It has no UI and does not mutate chat state.
- A successful load logs `[TLE Core Services Smoke] PASS`, confirming the remote module can retrieve the permission-gated `chat-context` and `resource-catalog` services, read frozen snapshots and observe AbortSignal enforcement.
- The smoke module is test scaffolding only; it must not be added to `modules/stable.json`.
