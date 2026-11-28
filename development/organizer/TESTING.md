# TLE 开发与验收说明

## 当前正式基线（2026-11-28）

- **Stable Core：v0.3.304**
- **Loader Runtime：v0.3.6**
- **Permanent Bootstrap：v1.0.6**
- **唯一开发基线：** 本 PR 合并后的 `main`；后续功能分支必须从该正式基线创建。
- **可编辑 Core 源码：** `development/organizer/TLE.js`。它是完整 TLE Core 源码，不是单独的整理侠模块。
- **不可变发布快照：** `releases/v0.3.304/TLE.js`。不得直接修改已发布快照；下一版从开发源码生成新版本目录。
- **源码边界：** `development/organizer/TLE.js` 目前仍是完整 TLE Core 单体源码，不是独立的整理侠模块。模块化完成前不得把该文件当作 Organizer 子模块随意拆分或改名。
- **独立组件源码：** `development/gallery-home/gallery-home.js` 与 `development/avatar-engine/avatar-engine.js` 各自保留组件版本标记；对应回归会核对它们与 Core 内嵌实现的同步关系，不得仅因组件版本号低于 Core 版本就认定为漂移。
- `latest.json` 与 `release-plan.json` 是正式版本指针；正常 Core 发布沿用 Loader v0.3.6 和 Bootstrap v1.0.6。

旧测试分支 `feature/organizer-nav-worldbooks-20261125` 及其 Test Loader 仅作历史回溯，不再作为新功能开发基线。主分支的 `channels/test.json` 刻意保留 v0.3.204 供旧 Test Loader 兼容，**不是当前测试入口，也不得据此回退 Core**。

## 新功能开发流程

1. 从当前 `main` 创建新的功能分支；不要从 v0.3.239、v0.3.259、v0.3.263、v0.3.264 或旧测试分支创建。
2. 修改权威开发源码：`development/organizer/TLE.js` 是完整 Core；Batch、Avatar、Gallery 分别维护在各自独立源码目录。`releases/v0.3.304/TLE.js` 只作为不可变发布快照，禁止直接编辑。
3. 运行 `npm run build:core`，统一装配 Organizer Batch、HD Avatar Engine 与 Gallery Home；需要只核对而不写入时运行 `npm run build:core -- --check`。
4. 同步更新专项回归测试；运行 `npm ci`、`npm test`，再按需运行真实 ST/TT 验收。
5. 测试版必须使用新功能分支自己的测试清单、独立 Test Loader 与独立缓存；不要修改主分支的旧兼容 `channels/test.json`。
6. 正式发布只使用 `RELEASING.md` 规定的流程：先从权威开发源码执行 Core stage，再运行 `npm run release`；不得手工编辑生成的发布快照.

## Core 模块化开发（Phase 2）

- 当前开发分支从正式 main v0.3.304 创建；Stable Core、Loader Runtime、Bootstrap 与正式清单不得随模块化测试改动。
- Core Module API 当前为 1；Kernel 源码位于 development/core/module-kernel.js，通过 npm run build:core 嵌入 development/organizer/TLE.js。
- Core 公开 api.modules；Core destroy 必须先同步销毁已启动模块，再恢复自身原生 DOM、样式和布局。
- Stable 模块清单 modules/stable.json 当前必须保持空，直到第一个模块完成独立源码、固定 Commit、SHA-256/字节数、依赖和回滚验收。
- 每个模块必须有稳定 ID、独立 SemVer、API 版本、父模块、技术依赖、权限声明和设置 Schema 版本。
- init 可以异步，但必须监听 AbortSignal；destroy 与 init 返回的 cleanup 必须同步，不能把 Core 的 DOM 恢复挂在异步清理之后。
- Core 在异步 init 仍进行时卸载，会立即调用定义级 destroy 清理部分初始化；init 结束后再执行返回值 cleanup。定义级 destroy 必须幂等，不能假设 init 已完整结束。
- 需要宿主页面的模块必须在 Manifest 声明 host:script-window / host:window / host:document；Kernel 只通过 Context 的受权限 getter 暴露对应引用。
- 必须验证父子级联、技术依赖级联、错误隔离、模块事件订阅自动清理、模块设置隔离、更新失败恢复旧版本。
- permissions 只是 Core API 能力门槛，不是 JavaScript 沙箱；模块源码必须由 Loader 通过不可变 Commit、SHA-256、字节数和来源校验。
- 除 HD Avatar 作为受控试点外，本阶段不迁移现有导航、会话侠、楼层侠、整理侠、兼容修复、渐隐侠或 Gallery；其余模块待试点验收后再迁移。
- 自动化通过不等于 ST/TT 实机验收；模块试点仍须覆盖 PC、移动端、ST、TT 及全局卸载。



## 记录预览功能历史验收清单（v0.3.287–v0.3.289）

- 首页画廊默认仅显示有聊天记录的角色；切换显示全部角色时，未聊天角色也能正常显示。检查最近聊天合并、折叠数量、排序和详情入口。
- 角色记录详情头像保持 2:3 比例、统一 12px 圆角；高清头像引擎为 4.5.14。切换圆形、方形、圆角主题及 `big-avatars` 后，头像不得变窄、变形或与渐变层错位。
- 记录详情移动端断点为 820px：头像列 104px、列间距 8px、资料区内部间距 5px。分别在 320、375、390、402、480、820px 检查；描述区高度应与头像对齐，不出现横向滚动。
- 记录预览样式只作用于 TLE 首页记录展示；不得改写聊天消息头像、酒馆原生角色列表头像或原生头像预览区域。
- 角色名、绑定世界书和聊天数量入口应分别跳转到角色编辑、绑定世界书管理和该角色聊天文件；保留酒馆原生角色管理功能。
- 切换多个 UI 主题后，检查头像比例、圆角、渐变裁切、详情布局和原生按钮继承；PC 与移动端分别验收。
- 运行 `npm test`；自动化通过不等于所有 ST/TT 主题组合均已实机验收。

## 历史功能验收清单（v0.3.261–v0.3.263）

### Companion plan startup restoration (v0.3.261)

- In TT, enable the native **自动加载上次聊天** setting, fully exit and reopen TT, and let it restore the previous character chat without manually opening or switching characters.
- Confirm the restored character's default companion plan is applied once, including the saved global World Info selection and UI theme.
- Confirm a same-page TLE Core update/reload does **not** reapply the default or overwrite settings manually changed after startup.
- Disable and re-enable TLE in the same host page; confirm it is not treated as a new host-page startup.
- Switch to another character and confirm that character's default still applies; a character without a default must leave the current settings unchanged.
- With day/night scheduling enabled, confirm the current time-slot plan takes priority on a fresh host-page startup, while an unexpired manual hold remains in control.
- Repeat in ST and TT where available. Automated regression checks do not replace real-host acceptance.


- Confirm the original **全局搜索** button is restored in the workspace header in every navigation mode. It opens its own centered modal and retains the original search index, search field, result navigation, and clear behavior.
- Confirm the global-search modal contains a compact **整理侠** jump entry. Activating it closes the search modal and opens the Organizer drawer; it must not switch the search modal into a resource-management tab.
- Confirm this candidate does not merge search and replacement workflows; that follow-up remains a separate Codex integration task.
- Confirm **整理侠** is the tenth `.drawer` directly below **角色管理**, with its own `.drawer-toggle` and `.drawer-content`; it opens/closes like a native drawer, not a centered popup. Its resource filter input and manager state are independent from global search.
- Confirm the Organizer's `.drawer-content` is the direct content root: the heading, resource filter and resource list are direct children; there is no nested `.tle-search-surface` wrapper.
- Click the Organizer icon, then the navigation text label to open and close the native drawer. Each action must add/remove `openDrawer / closedDrawer` and update `aria-expanded` correctly; the Organizer heading has no duplicate X close button.
- From the global-search modal, click **整理侠**. The search modal should close and the same Organizer `.drawer-content` should open; verify this works on both desktop and mobile.
- Confirm the tenth icon participates in icon-only, icon+label, compact two-column, and mobile hamburger navigation modes. On mobile, the rail folds away while the opened drawer remains visible.
- Open the Organizer's **世界书** category. Verify quick filters for **全部 / 已绑定 / 未绑定 / 疑似孤儿 / 全局启用** and their counts. Primary/extra character bindings define **已绑定**; global enablement is independent and may overlap either bound state.
- Verify a globally enabled book with no character binding appears in both **未绑定** and **全局启用**. Verify stale extra-book references are marked **疑似孤儿** (or **含遗留关联** when the book also has a current character binding).
- Use **扫描绑定** only when you want to load the remaining character-card metadata. It is opt-in and may increase session memory use.
- Test grouping, searching, selection, and batch deletion only on disposable test resources first. Verify native Tavern behavior and the remaining bindings after each deletion.
- On PC (viewport wider than 1000px), confirm the Organizer has three columns: **资源类型** at left, **分组目录** in the middle, and **资源列表** at right. Selecting a resource type refreshes the middle group list; selecting **未分组** or a named group filters only the right-hand list.
- Confirm the resource search field is inside the right-hand resource column; worldbook status filters, target-group selection and batch actions remain in that column. The left category list, middle group list and right resource list must scroll independently without horizontal overflow.
- At 1000px and narrower, confirm the three pane wrappers flatten back into the original single-column mobile flow; category/group navigation remains available and no desktop sidebars consume the resource list height.
- On mobile, confirm the Organizer title and short description stay on one line; the description reads only **资源分组 · 批量管理**.
- Confirm category tabs and group filters remain horizontally swipeable and show a persistent **3px** scroll indicator; no 15px native scrollbar is reserved.
- Confirm the header has no redundant close X. The **同步 / 导入 / 导出** controls are always visible together at the right side of the title row, regardless of the currently selected resource category. All three are native `menu_button` controls: verify their background, border, radius, padding, font, text/icon color and hover/focus states come from the active SillyTavern theme, with no TLE-authored button surface.
- Click **同步** from a non-theme category. Confirm it reads the existing Theme Manager groups, asks for confirmation, changes only TLE's UI theme groups/assignments, then switches to the UI theme category. Confirm preset, worldbook, character, and other group data are unchanged.
- Confirm the target-group selector shares a row with **管理分组 / 自动分组**.
- Confirm batch actions use a compact **three-column** layout; buttons are 30px high with no default margins or oversized row gaps, and the resource list expands into the remaining panel height.
- On desktop, confirm the original three-column workspace remains unchanged and pane tint uses `rgb(from var(--SmartThemeQuoteColor) r g b / .12)`.
- Check PC and mobile layouts separately, then repeat in ST and TT as applicable.

### Organizer layout refinements (v0.3.263)

- In the Companion Plans tab, confirm each plan's name and status badges remain on the left, with **设为默认 / 取消默认** and **应用** aligned on the right of the same title row.
- Confirm the plan configuration summary is displayed below the title row; long names and badges must not overlap the action buttons.
- In Organizer, confirm the header order is **整理侠 → 资源整理 / 查找替换 → 同步 / 导入 / 导出**.
- Open **查找替换** at 320, 375, 402, and 768px widths. Confirm search and replacement inputs each have a clear row; scope and backup controls wrap only when necessary.
- Confirm the controls area has no independent vertical scrollbar. The result list occupies the remaining height and owns its scrolling.
- Confirm advanced rules remain collapsed initially and still expose combinations, extra rules, and JSON/YAML paths when expanded.
- Repeat in ST and TT where available; source-level tests do not replace real-host visual acceptance.

### Companion preview and native update buttons (v0.3.263)

- Open the Companion Plans list. Confirm connection profile, API source, model, preset, reasoning format, UI theme and saved World Info are displayed as separate labeled fields, not one continuous prose paragraph.
- Confirm the preview uses a compact two-column layout where space permits; long values wrap without horizontal overflow. The World Info item spans the full preview width.
- Open **配套侠 · 方案管理** and confirm its plan previews use the same structured layout as the compact list.
- Open TLE → **版本与更新**. Confirm all five update-related actions (Core install, Core check, Loader adoption, Loader check, Loader install) visibly inherit the host's native `menu_button` appearance.
- Confirm hidden/disabled states, dynamic button labels and click handlers remain unchanged.
- Repeat in ST and TT with the active themes; verify narrow mobile widths and both light/dark themes.

## 回到当前正式版

如果仍在使用旧 Organizer Branch Test Loader：

1. 禁用 **TLE Organizer Branch Test Loader 0.3.1**。
2. 重新启用 **TLE Permanent Bootstrap 1.0.6**。
3. 完整刷新 ST/TT 宿主页面。
4. 在 TLE → **版本与更新** 核对 Stable 通道、Core **v0.3.304**、Loader **v0.3.6**。

不要再以旧测试 Loader 或旧 Stable Core 作为新开发入口。旧脚本只保留为禁用回滚备份。

## 旧测试分支说明

旧分支 `feature/organizer-nav-worldbooks-20261125` 的测试清单与 Loader 缓存相互隔离。它可以用于追溯历史测试，但不代表当前正式版本，也不应继续承载新功能。需要新的测试环境时，从当前 `main` 创建独立测试分支，重新生成独立清单与 Test Loader；正式 `latest.json`、`loader/latest.json` 和 Bootstrap 不参与测试发布。

## Phase 2.2 Module Loader

- `development/core/module-loader.js` 必须与 Core 中的 `TLE_MODULE_LOADER_START/END` bundle 完全一致。
- Stable 与 Test Manifest 必须按 Loader 通道选择，不能交叉读取。
- 模块源码必须来自仓库 Raw HTTPS，URL 必须精确绑定完整 Commit SHA 与 source_path。
- 必须在执行前验证 SHA-256 与 UTF-8 字节数；相同模块 SemVer 不得更换 Commit 或源码摘要。
- IndexedDB 只把成功初始化的版本标记为 Last Known Good；下载成功不等于更新成功。
- 候选模块 init 失败时，旧模块实例必须继续可用；独立模块的更新/停用/卸载不得影响无依赖关系的模块。
- Core 内置 HD Avatar Engine fallback 必须保留，直到 ST/TT 实机验证通过并完成正式迁移验收。


## Core Module Loader · Test Candidate v0.3.304

1. 使用现有 Test Loader 0.3.1 的 Test 通道更新到 v0.3.304；Stable Loader 与正式 main 不参与本轮测试。
2. Core 启动后应先启用内置 HD Avatar Engine fallback，再从 `modules/test.json` 校验并尝试加载 `avatar.hd@1.0.0`。
3. 在模块状态中核对 `avatar.hd` 的 active version、Last Known Good、Test channel 与持久化缓存状态。
4. 验证刷新/重进、角色切换、断网启动、错误源码回滚、模块停用/启用/卸载；独立模块不得影响无依赖关系的模块。
5. TT 必须保持原生头像处理，不启动额外头像替换逻辑。
6. 未完成 ST 与 TT 实机矩阵前，不合并 PR、不更新正式 main。
