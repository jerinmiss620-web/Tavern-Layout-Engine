# 自动更新验证记录 — 2026-11-29

## 2026-11-29 · Phase 2 统一构建与 Core 模块化试点整合

- 整合基线：正式 `main@46bbf0f` 与统一 Core 构建 PR #32 的 `6f41edb`；独立工作分支：`integration/phase-2-module-system-20261129`。
- PR #31 的 Module Kernel、Module Loader、Manifest、HD Avatar Engine 1.0.0 试点已迁入统一构建入口；权威源码分别保留在 `development/core/`、`modules/src/`，由 `npm run build:core` 自动装配进单文件 Core。
- Test Core 候选固定在 `test-releases/v0.3.304/TLE.js`；不可变 Commit：`acca26dc349ba96e259ec48209ad337d6d289b7f`；SHA-256：`1197e5463df363582e1d55b46a99aa59f3d5b534285c02c93f6b269fb8c2c2b3`；UTF-8 字节数：`1205541`。Gallery 结束标记现在精确落在 Gallery factory 结束处，Module Kernel/Loader 初始化保持在独立区域，`build:core --check` 会验证这一边界。
- Test Loader 0.3.1 固定在 Commit：`88b910120fae5701fd54de8743a5ce0d1e518279`；SHA-256：`639213318c4c6904c32068b3287f9a5b8f971825f5b216edaf3aa050df75d735`；UTF-8 字节数：`39875`。其 Test Manifest URL 固定指向本整合分支，不读取旧主分支测试清单。
- 分支专用 `channels/test.json` 现在指向 `test-releases/v0.3.304/TLE.js`；模块清单中的 HD Avatar Engine 源码则固定到独立 Commit，并校验 SHA-256 与 UTF-8 字节数。Stable Manifest 仍为空。
- 正式 `latest.json`、`release-plan.json`、`releases/v0.3.304/TLE.js`、Bootstrap 1.0.6、Stable Loader Runtime 0.3.6 均与 `main` 的 Git Blob 完全一致；本分支不推进正式版本、不改正式安装链。
- 自动化测试覆盖 Kernel 生命周期、模块下载与完整性校验、IndexedDB Last Known Good、候选 init 失败回滚、离线恢复、父子模块级联、独立模块更新、HD Avatar 单实例接管、TT 原生绕过、旧 Test Loader 兼容及统一构建/发布保护。
- ST 与 TT 实机验收已于 2026-11-29 全部通过（用户确认）：HD Avatar Engine `avatar.hd@1.0.0` 加载、Last Known Good 记录、刷新/重进恢复、断网恢复、错误源码/哈希/初始化失败回滚、模块停用/启用/卸载、TT 原生头像绕过，以及完整卸载 TLE 后的模块资源清理。
- 实机验收使用的 Test Core v0.3.304 固定 Commit：`acca26dc349ba96e259ec48209ad337d6d289b7f`；SHA-256：`1197e5463df363582e1d55b46a99aa59f3d5b534285c02c93f6b269fb8c2c2b3`；UTF-8 字节数：`1205541`。Test Loader 0.3.1 固定 Commit：`88b910120fae5701fd54de8743a5ce0d1e518279`；SHA-256：`639213318c4c6904c32068b3287f9a5b8f971825f5b216edaf3aa050df75d735`；UTF-8 字节数：`39875`。
- GitHub Actions 整合分支 Run `46178475376` 在 Commit `630fc936d9f2d7fa997ae7d1e046333b4094814d` 全量成功；后续构建器/版本同步修正没有改动上述固定 Test Core 与 Test Loader 源码。
- PR #31/#32 仍未合并。PR #31 的旧分支会改动正式 `latest.json` 与 `releases/v0.3.304/TLE.js`，不可直接合并；PR #32 的统一构建器已进入本整合分支并继续修正。正式集成应以本分支为唯一候选。
- 本次实机通过只完成模块运行时试点验收，不自动授权正式推广：`modules/stable.json` 继续保持空，`avatar.hd` 暂留 Test Manifest，待单独审议 Stable promotion。

当前正式发布组合：Bootstrap 1.0.6 / Loader Runtime 0.3.6 / Core v0.3.304。

`npm test` 运行历史兼容性回归、新 Core 的同组诊断/布局回归、安装包/发布元数据检查，以及完整源码运行模拟。

## 2026-11-28 · Core v0.3.304 · Freesia 覆盖侠正式功能包同步

- 本次 Core 发布同步 Freesia 覆盖侠 v1.88.7 的正式功能包名称、文件名、展示版本与固定清单快照；不改动 TLE 其他功能模块。
- Loader Runtime v0.3.6 与固定 Bootstrap v1.0.6 未修改。
- 不可变 Core 源码 Commit：`68c1a1aec4c2e29c9cb4f2fc0446df05ee4b13dd`；SHA-256：`e8b589a59f130b21583b1c9a2c388ce887f3ad17a73c7c315ff71d5a84dde873`；UTF-8 字节数：`1133611`。
- Freesia 覆盖侠 v1.88.7 固定包 SHA-256：`42602b507ce4b7d789820576d310f1f817cec6605a48ae1a93fe69312c116554`；清单记录字节数：`234373`。
- 正式 main Commit：`230de11e47ade3cb05004cffd1c4497545a72a6a`；GitHub Actions 发布回归 Run #46140775183 通过。
- ST/TT 全主题与设备实机视觉矩阵仍需继续覆盖；自动化回归不替代真实宿主验收。

## 2026-11-28 · Core v0.3.303 · 打码侠与隐藏楼层保护正式整合

- 基线：正式 Core v0.3.294；整合已验收的 Mask Hero Test v0.3.302 功能，未替换 Stable Loader Runtime v0.3.6 或 Bootstrap v1.0.6。
- 打码侠统一作用范围默认「全部楼层」，并支持「最新 N 层」和「指定楼层范围」；范围统一约束 User/Char 名称、头像、正文整体/局部替换及单独楼层规则。正文整体替换保留独立启用开关。
- 修复正文局部替换区异常大留白：通用纵向字段不再设置 `flex: 1 1 140px`；140px 弹性基准仅保留在横向工具栏和头像行。新增回归断言，确保纵向字段不继承该基准、横向字段仍保留弹性布局。
- 隐藏楼层保护按角色/群聊与聊天文件身份隔离保存消息身份元数据和内容哈希，不保存正文副本。优先使用稳定 `extra.gen_id`；身份冲突、重复、缺失或无法唯一定位时拒绝猜测，不回退到旧楼层号。
- 手动恢复前按当前消息身份动态重定位；非连续目标分段恢复，每段恢复后重新读取并核验。外部解除隐藏仅提示用户，默认不自动重新隐藏，不写回原始聊天文件，也不替代酒馆原生隐藏机制。
- 测试通道 v0.3.302 已标记 ARCHIVED；历史测试 Core / Loader / 安装包原字节移入 `tests/fixtures/legacy/`，只供兼容性回归，不作为安装入口。
- 正式源码 Commit：`a8e9c7682d97ed2753c06a2f3be585490e00e099`；固定 Raw URL：`https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/a8e9c7682d97ed2753c06a2f3be585490e00e099/releases/v0.3.303/TLE.js`。
- SHA-256：`0e4c6195afeb2366c1160b9d35952cc50ec15dddd25ed2b84979bdde7859f77f`；UTF-8 字节数：`1133400`。开发源码与正式源码使用相同 Git Blob；禁用状态独立备份包内源码与正式源码逐字节一致。
- 候选分支 Run #46132346194 与正式 main Run #46132433201 均通过。正式 Run 完成全量 `npm test`、发布清单与不可变产物核验，以及下载 GitHub 发布字节后的 Bootstrap → Loader → Core 更新链重放。
- 最终 main Commit：`a9b294d890d842d08dc45b105bcf848d8605aa2b`；Loader Runtime v0.3.6、Bootstrap v1.0.6 未修改。
- ST/TT 全主题与设备实机视觉矩阵仍需继续覆盖；自动化回归不替代真实宿主验收。

## 2026-11-28 · Core v0.3.294 · 角色专属预设条目方案与全局世界书多选

- 基线：正式 main / Core v0.3.291；仅迁入已验收的配套侠预设条目状态和全局世界书选择器，不合并旧开发分支历史及测试 Loader。
- 角色方案以稳定 identifier 保存每个角色的条目启用状态，不复制正文、名称或顺序；共享全局预设通过原始状态基线保护角色隔离。
- 世界书控件保留原生多选数据源及方案保存结构；缺失世界书保留为已选禁用项。
- PR #28 已合并至 `main`，正式合并 Commit：`029e3e6e965e981dcdab29149628de7cb862ea5d`。
- PR 候选 Node 24 Run #46048166362（Run #1232）通过全量 `npm test`；新增的预设条目标识/角色隔离、世界书下拉交互测试均通过。
- 正式 main Node 24 Run #46048318255（Run #1233）通过全量 `npm test`、`npm run verify:remote` 和 `node tests/tle-update-chain.test.mjs --remote`。
- 不可变 Core 源码 Commit：`648da321089e1f9534ccf859c901ab76fbb0f90f`；固定 Raw URL：`https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/648da321089e1f9534ccf859c901ab76fbb0f90f/releases/v0.3.294/TLE.js`。
- SHA-256：`a14149c6525f8ab186d48b59db0183e42f9ae973c7379a541d1a46fb11071a63`；UTF-8 字节数：`1029725`。正式清单、发布计划、开发源码、正式源码、禁用状态备份包与不可变 Commit 固定源码逐字节一致。
- 远端核验从 GitHub 下载固定 Commit 的源码，并完成 Bootstrap → Loader Runtime → Core 的完整更新链重放；Loader Runtime v0.3.6 与 Bootstrap v1.0.6 未修改。
- ST/TT 全主题、设备实机视觉矩阵仍需继续覆盖；自动化测试不替代真实宿主验收。

## 2026-11-27 · Core v0.3.291 · 导航图标可见性与透明度完整修复

- 候选分支 Node 24 全量回归 Run #46032786958 通过；正式 main Run #46032950585 通过全量 npm test、npm run verify:remote 和 node tests/tle-update-chain.test.mjs --remote。
- JSDOM 专项测试模拟主题将 open/closed 图标和内部 glyph 隐藏；新规则恢复图标显示、visibility 与 glyph opacity，并验证图标包装层匹配。
- 修复 `.drawer-icon:not(.closedIcon)` 排除闭合状态的问题；透明度现在直接应用于所有图标状态。
- 图标选择器改为后代匹配；内部 glyph 与 `::before` 贴图纳入恢复规则。
- CSS 由 Core 注入宿主文档 `<head>` 中的 `#tle-core-style`；透明度变量写入 `body` 内联样式 `--tle-nav-icon-opacity`。
- 开发源码、正式源码、备份包内源码与不可变 Commit 固定源码逐字节一致；SHA-256：`acf29b28abeee1cb711879f377876f5965bcff999f9ee3df244766c691b51ca2`；UTF-8 字节数：`979548`。
- Core v0.3.291 已从清理后的 v0.3.290 正式基线快进整合至 main；整合 Commit：`6c62d469aa9e6a11cb4001966ea246b5047b1509`。ST/TT 全主题视觉矩阵仍需实机覆盖。
- Loader Runtime v0.3.6、Bootstrap v1.0.6 不变。

## 2026-11-27 · Core v0.3.290 · 导航兼容修复图标居中

- Core v0.3.290 从清理后的正式基线 v0.3.289 快进整合至 `main`；最终主分支 Commit：`a0b299a2bd02109b945b7691abfed47026701512`。
- 候选分支 Node 24 全量回归 Run #46025419448 通过；正式 `main` Run #46025595786 通过全量 `npm test`、`npm run verify:remote` 及 `node tests/tle-update-chain.test.mjs --remote`。
- 正式源码：`releases/v0.3.290/TLE.js`；不可变源码 Commit：`04cbe3916337c7edc551c48208a166188fc44595`。
- SHA-256：`94faed75baa26048da996b3ceecab14cc4f4f42aad4d7e99a8d8a48052ca14c3`；UTF-8 字节数：`979174`。
- 开发源码、正式源码、禁用状态导入包内源码与不可变 Commit 固定源码逐字节一致；`latest.json` 已指向 v0.3.290。
- 导航兼容性修复中的 `.drawer-icon` 改用 `display: flex !important`，并明确 `align-items: center`、`justify-content: center`；原有尺寸、点击区域、可见性和透明度规则保持不变。回归测试新增对应断言。
- Loader Runtime v0.3.6、Bootstrap v1.0.6 未修改。
- 用户此前在本地临时 CSS 中验证该 Flex 显示方式可恢复图标居中；正式 Core 已包含同一修复。该次验证不扩大为所有主题与设备的实机通过结论，ST/TT 全主题视觉矩阵仍需持续覆盖。

## 2026-11-27 · Core v0.3.289 · 正式整合与历史补丁清理

- PR #25 已合并至 `main`，合并 Commit：`7072ac86ca1618597a1adb81bc9bec25d57f9523`；基线为清理后的正式分支，不合并旧测试分支历史。
- Node 24 GitHub Actions Run #45976588736 通过：全量 `npm test`、完整源码更新模拟、兼容性与发布保护均成功。
- 正式源码：`releases/v0.3.289/TLE.js`；不可变源码 Commit：`a04d010339851eba863da30a7639547b978b5734`。
- SHA-256：`67ddb8eaebe10a84f3eaf7b36f07bfe27183191200fd8b1c0e4f67feba2e4d84`；UTF-8 字节数：`979103`。
- 合并后核对：`release-plan.json` 与 `latest.json` 均指向 v0.3.289；开发源码、正式源码、默认禁用备用导入包及不可变 Commit 固定源码逐字节一致。旧 v0.3.264 Core 源码已从发布目录移入隔离回归夹具；历史发布目录仅保留日志。
- Loader Runtime v0.3.6、Bootstrap v1.0.6 未修改。GitHub 主分支的远端清单/下载字节运行链工作流尚待本次文档推送触发并完成，结果将追加记录。
- ST/TT 全主题与设备的实机视觉矩阵仍未全部覆盖；自动化测试不等同于实机验收。

## 2026-11-27 · Core v0.3.264 · 配套侠修复与紧凑预览、更新按钮原生化

- 正式候选源码：`releases/v0.3.264/TLE.js`；不可变源码 Commit：`804252af14dd0d28c862c1e53016bae34055744e`。
- SHA-256：`8dc60be7d05f0d0928ca5e1e0cb26b81fa0b70f3ca7c501ee165071b93d5c728`；UTF-8 字节数：`848818`。
- 配套方案全局世界书保存/完整同步、TT/ST 新宿主启动默认方案恢复、同页面 Core 热更新保护均有独立回归断言。
- 方案预览采用无横线紧凑双列布局；列表与管理页共用同一组件；五个更新相关按钮仅使用酒馆原生 `menu_button`。
- 保留 v0.3.262 整理侠查找替换布局及 v0.3.259 更新面板原生按钮修复。
- PR #23 的两次 Node 24 检查 Run #45858640146 / #45858631816 均通过：完整源码更新模拟、兼容性/发布保护、配套侠世界书/启动恢复 4 项测试、紧凑预览/原生更新按钮 3 项测试及整理侠回归全部成功。
- 合并后 main Run #45858811032 全部通过：Node 24 全量回归、正式清单与不可变 GitHub 文件远端核验、下载发布字节后的更新链重放均成功。
- 远端 Core v0.3.264：848818 UTF-8 字节；SHA-256 `8dc60be7d05f0d0928ca5e1e0cb26b81fa0b70f3ca7c501ee165071b93d5c728`；不可变 Commit `804252af14dd0d28c862c1e53016bae34055744e`。远端 Loader Runtime v0.3.6 也完成 Commit、SHA-256 与字节数核验；Bootstrap v1.0.6 未变。
- 更新链测试从 GitHub 实际下载并校验 Bootstrap、Loader、Core 字节后完成全流程重放；离线页面重载继续从已验证 IndexedDB 恢复更新后的 Loader/Core。
- ST/TT 全主题实机视觉矩阵仍未全部覆盖；本记录不把自动化验证扩大为全设备实测。

## 2026-11-26 · Core v0.3.259 整理侠分组管理与更新面板原生按钮

- 正式候选源码：`releases/v0.3.259/TLE.js`；不可变源码 Commit：`0396a756dac17c9f411b23bdde1b28fbb638a5da`。
- SHA-256：`b7b62743e7ea01c90e810de9623ef3b504649c15dc78b09f26bd63c1a472c7c9`；UTF-8 字节数：`830439`。
- 禁用状态酒馆助手备份安装包与 Core 源码逐字节一致；正式 Core 清单与 release-plan 指向 v0.3.259；Loader Runtime v0.3.6、Bootstrap v1.0.6 不变。
- 源码静态核对：三个更新操作按钮使用 `menu_button`；已删除 `.tle-update-check` 自定义样式，不留下覆盖主题按钮外观的旧规则。
- 分组管理回归覆盖：创建/自动/管理顺序、文件夹图标状态、重命名单选目标、批量删除多选目标、系统目录保护、确认/取消图标及删除后资源归回「未分组」。
- 测试分支 v0.3.258 完整源码回归工作流 #45820842565 已通过。
- 正式发布 PR #22 / GitHub Actions Run #45823850373（Node 24）通过：依赖安装、完整源码更新模拟、兼容性和发布守卫全部成功。PR 阶段的远端步骤按工作流条件跳过。
- 合并后 main Run #45823965333 全部通过：完整源码回归成功；「已发布清单与不可变 GitHub 文件验证」成功；「下载发布字节后的运行链重放」成功，实际使用 GitHub 下载并校验的发布字节执行 Bootstrap → Loader → Core 模拟。
- 合并后的 `latest.json` 与 `release-plan.json` 均为 Core v0.3.259；正式源文件 Commit、固定 Raw URL、SHA-256、UTF-8 字节数及禁用安装包内容逐项一致。Loader Runtime v0.3.6 与 Bootstrap v1.0.6 未变。

- 用户截图确认了分组管理的目标布局；本次更新按钮的主题继承由源码和自动化断言验证。没有将这些结果扩大为 PC/TT、iPhone/Android 全平台实机通过。其他主题和宿主的视觉矩阵仍待逐步验收。

## 2026-11-26 · Core v0.3.239 整理侠三栏分隔线与稳定性修复

- 正式候选源码：`releases/v0.3.239/TLE.js`；不可变源码 Commit：`ea96c1af669108507fc1c3773d1bcbab42e20821`。
- SHA-256：`cf10fec53fccedeb62364e358fdca6b1747a3b76e8726e2c9d1eb66996edd98b`；UTF-8 字节数：`810236`。
- 禁用状态酒馆助手备份安装包与 Core 源码逐字节一致；正式 Core 清单与 release-plan 已指向 v0.3.239；Loader Runtime v0.3.6、Bootstrap v1.0.6 不变。
- 用户已提供 PC 整理侠三栏 HR 分隔线布局截图并接受该视觉方案；这只确认该次 PC 界面布局，不代表配套侠、渐隐侠及所有资源操作已完成全平台实机验收。
- GitHub Actions 正式发布 PR #21 / Run #633（Node 24）已通过：依赖安装、完整源码更新模拟、兼容性检查及发布守卫全部成功。PR 工作流中的「已发布清单与不可变 GitHub 文件验证」和「下载发布字节后的运行链重放」步骤按工作流条件跳过；合并后已从 main 重新读取源码与导入包，确认导入包内容逐字节匹配源码，SHA-256 与 UTF-8 字节数均和 latest.json 一致。未声称已执行 raw URL 运行链重放。ST/TT 的配套侠部分应用、壁纸同步、重复打开整理侠工具栏等真实运行验收仍需持续补充。

## 2026-11-25 · Core v0.3.220 整理侠资源管理界面重排

- 桌面端将「搜索 / 资源管理」导航并入标题行；窄屏下导航独立换行，关闭按钮保持在标题行右侧。
- 资源分类、主题分组同步与全部分组导入/导出合并为一行；分组筛选与目标分组/管理分组/自动分组控件合并为一行。
- 批量操作保留独立工具行；移除重复的常驻说明行，完整删除权限说明改由批量删除按钮的 title 与 aria-description 提供。
- 资源列表保持 flex 占用剩余高度并独立滚动；分组筛选区域横向滚动，桌面端与窄屏采用不同布局。
- 新增 Organizer DOM 层级、标题导航位置、桌面分组控制网格、窄屏堆叠和说明文本可访问性断言。
- GitHub Actions PR #20（run 45539940010，job `validate`）通过：完整源码运行模拟、兼容性与发布保护检查成功。合并后复核 main 正式清单：Core v0.3.220、Loader v0.3.6；Core 源码 Commit、固定 URL、SHA-256、UTF-8 字节数及导入包内源码逐项一致。桌面 ST 与 TT、移动端 ST 与 TT 的真实视觉验收仍待完成；不将源码结构断言视为真实布局通过。

## 2026-11-25 · Core v0.3.219 整理侠删除权限校正

- 批量删除范围按酒馆原生能力开放：角色卡、全局世界书、预设、推理格式、User 身份、UI 主题。
- API/模型等原生不可删除的运行配置仅允许搜索，不进入整理侠资源管理分类；完整 `QUICK_MODULES` 数据结构及既有分组备份保留，搜索专用分类的旧分组数据不清空。
- 移除角色卡删除前必须退出当前会话的额外限制；由酒馆原生角色删除函数处理当前会话，聊天记录保留。
- 移除“至少保留一个预设/推理格式”的人为限制；GUI 预设仍遵循酒馆原生保护规则。
- User 身份使用原生 `persona-delete` 静默命令；UI 主题使用原生删除接口，删除后自动刷新以同步主题模块内部列表。
- 本版本新增的自动化断言覆盖删除权限、原生删除调用、隐藏分类分组数据保留和主题刷新。GitHub Actions PR #19（run 45537245052、45537371308，job `validate`）均通过；完整源码更新模拟、兼容性与发布保护检查成功。合并后手动复核 main 正式清单：Core v0.3.219、Loader v0.3.6；Core 源码 Commit、固定 URL、SHA-256、UTF-8 字节数及导入包内源码逐项一致。PR 阶段的远端下载字节重放未执行；ST/TT 实机删除流程仍待验收。

## 2026-11-25 · Core v0.3.218 整理侠候选

- 原全局搜索入口升级为整理侠唯一入口；默认显示原搜索页面，资源管理与搜索共用同一搜索框。
- 原快速切换分组管理迁入同一面板，保留分组存储键与全部分组方案导入/导出。
- 批量删除采用白名单和酒馆原生接口：角色卡（保留聊天记录、要求退出当前聊天）、全局世界书、预设、推理格式。API/模型、User 身份、UI 主题不开放批量删除；正则继续由正则侠管理。
- 新增 `tests/tle-organizer.test.mjs` 检查唯一入口、单一搜索框、原搜索保留、分组数据键和删除权限。
- GitHub Actions CI（PR #18，run 45532897681）已通过；PC ST、Android ST、iPhone TT 的真实宿主验收仍待执行，不以源码模拟代替实机测试。

`tests/tle-update-chain.test.mjs` 在 jsdom 宿主页和实际 iframe 中执行完整 Bootstrap、Loader、Core 源码；使用 fake-indexeddb 提供事务、持久槽位及故障注入。模拟网络提供清单和按 Commit 固定的源文件；script-src 和 Blob 路径均实际执行源码，检查 SRI 摘要。测试不把一个预设版本号的假 Loader/Core 对象当成运行成功。

覆盖：

- 仅执行 Bootstrap，首次安装 Loader 和 Core；运行 API、折叠 UI、诊断按钮、单实例一致。
- 推出更高测试 Core 和 Loader 清单，只推进定期检查时钟即可自动升级，不调用安装 API，不重新导入。
- 共用默认开启的开关；关闭只显示绿色提示，重新开启恢复自动安装；关闭状态跨刷新持久保存。
- 模拟完整页面刷新，保留 IndexedDB/localStorage；离线恢复升级后的两个实际版本。
- 损坏下载拒绝执行；重新联网自动恢复更新。
- 两层执行失败都回滚；两层最终持久写入失败都回滚；刷新后仍为最后正常版本。
- 远端清单回退不会自动降级。
- 旧 v0.3.203 LKG、旧自动恢复授权和用户设置保留，自动迁移到正式版本。
- 重复执行 Bootstrap 清理旧实例；卸载清理定时器和实例。

测试发布的更高版本只存在于模拟网络中，不上传 GitHub 正式通道。

发布后的 `node scripts/release.mjs verify --remote` 下载 GitHub 两份清单、Commit 固定源文件和安装包，逐项检查版本、URL、Commit、字节数、SHA-256 和完整源码相等。`node tests/tle-update-chain.test.mjs --remote` 使用从 GitHub 下载并校验的发布字节重放完整运行模拟。

实机反馈已覆盖 Windows PC 的 SillyTavern、Android Pad 的 SillyTavern 和 iPhone 的 TauriTavern（成功启动，用户反馈速度很快）。尚未实机覆盖：主动注入 WebKit IndexedDB 断连后的一次重建、完整的 CSP/CORS/SRI 异常矩阵、原生 Popover/Top Layer 细节、长期休眠／后台节流及浏览器存储被系统清除。自动化不能保证所有设备、网络和浏览器存储永远可用。

## 2026-11-21 · PC 旧缓存升级修复（Bootstrap 1.0.2）

- 在固定安装脚本内修复：旧 Loader v0.3.3 刚恢复且忙碌时，Bootstrap 已验证新版 v0.3.4 却误把下次重试延后六小时。
- 现在有待安装的较新版本，最迟一分钟重试；旧 Loader 发出空闲状态事件时立即安排重试。
- 增补真实旧 Loader v0.3.3 / Core v0.3.203 IndexedDB 缓存迁移测试，模拟正式清单 `minimum_loader_version: 0.3.4`，验证最终运行 Loader v0.3.4 / Core v0.3.206。
- 单独新增 `tests/tle-bootstrap-busy-retry.test.mjs`；再次回归全部历史测试。
- GitHub 自动回归测试通过不能替代真实 PC Chromium / TT 运行验证。

## 2026-11-21 · iPhone TT 启动失败可见性修复（Bootstrap 1.0.3）

- 旧独立 Stable/Test Loader 冲突，之前控制台警告或静默退出，现由 Bootstrap 独立弹窗解释。
- 首次联网失败、无可恢复 Loader、Loader 已启动但 Core 未运行：等待 Loader ready 后按失败阶段显示原因、可复制状态及 User-Agent。
- 成功启动不增加悬浮控件，回归健康状态立即清理弹窗；支持手动关闭及刷新重试，不删除缓存、不改现有 SHA-256/Commit 校验。
- 新增 jsdom iframe 模拟网络失败、旧 Loader 冲突、Core 启动失败、Core 正常的自动化测试；保留原 1.0.2 忙碌重试回归样本。
- 仅 Bootstrap 自身真正被酒馆助手执行、能够访问宿主 DOM 时可以显示提示；脚本未执行或宿主完全不可访问无法用自身弹窗诊断。
- 尚未由出问题的 iPhone TT 用户完成实机复测，不能宣称已经解决其设备上的根本故障。


## 2026-11-22 · Bootstrap 1.0.4 网络容错

- `tle-update-chain.test.mjs`：在空 IndexedDB 下执行完整 Bootstrap、Loader 0.3.4、Core 0.3.211 源码。清单首次 Failed to fetch / 超时 / 无原因 AbortError，源码首次 Failed to fetch / 超时，均第二次请求成功并自动完成整个启动；不触发聊天事件、不调用手动安装 API。
- `tle-bootstrap-failure-dialog.test.mjs`：保留 1.0.3 历史弹窗测试，同时覆盖 1.0.4 三次失败、HTTP 408/429/5xx 与 4xx 分类、取消请求/响应体/等待、宿主及 iframe 卸载、重新初始化时旧请求迟到、安全校验拒绝、健康运行时保留、共享在途检查及源码复用。首次失败期间没有最终失败弹窗；耗尽后报告真实阶段/次数/类型。
- `tle-bootstrap-busy-retry.test.mjs`：历史 1.0.2 和当前 1.0.4 均验证旧 Loader 忙碌后的一分钟升级恢复和自动更新开关。
- 保留完整更新链的离线 LKG 恢复、Previous 回滚、存储故障、旧缓存升级和单实例回归。新安装包内嵌源码与 JS 一致；已发布 1.0.3、Core、Loader 及清单不变。
- 测试使用加速时钟及模拟网络，不能证明真实设备的网络/CSP/CORS 行为已修复。PR 尚未合并时不对 main 执行 1.0.4 的远端发布校验。

实机验收：Android 原版 SillyTavern 分别验证首次清单/源码临时失败后自动恢复、连续失败诊断、重试中停用、已有健康版本更新服务器不可用；iPhone TT 验证旧版迁移后直接启动（不发送消息）、检查更新、后台恢复及弹窗/复制。TT 现象根因仍待确认，不能把其验收结果作为 Android 错误根因证据。

## 2026-11-22 · Bootstrap 1.0.5 / Loader 0.3.5 多线路候选

- 冷安装 CDN 优先，已运行健康实例优先短时核对 GitHub Raw；CDN 只承担传输，Source URL 固定 Commit、SHA-256、UTF-8 校验保留。
- Bootstrap 首次加载超过 500ms 展示非阻塞提示，成功自动清除，失败沿用独立诊断。
- 通过 CI 模拟下载/回退/缓存后才能宣布代码验证通过；Android SillyTavern 与 iPhone TT 需要实机访问新线路并观察通知位置与启动耗时。

## 2026-11-22 · IndexedDB 断连兼容（候选 v1.0.6 / v0.3.6）

- 回归验证：即时启动提示、至少可见 1.2 秒、成功后自动消失；失败的原诊断保持不变。
- 回归验证：WebKit `Connection to Indexed Database server lost` 单次重连成功、连续失败中止、配额异常不重试、重读校验仍执行。
- iPhone TT 真机和 Android Pad 真机验证仍需另行完成；自动化通过不能称为设备实测。

## 2026-11-22 · 三种宿主实机启动反馈（Bootstrap v1.0.6 / Loader v0.3.6）

- Windows PC · SillyTavern：用户确认 TLE 启动成功且很快。
- Android Pad · SillyTavern：用户确认 TLE 启动成功且很快。
- iPhone（iOS 18.7）· TauriTavern：用户确认 TLE 启动成功且很快；先前 IndexedDB 断连在彻底关闭 TT 并重启后恢复。
- 这些属于用户实际使用反馈，不是独立测速或稳定性认证；加载中提示的准确文字和持续时长没有逐帧截图验证。新版 Bootstrap 的即时通知及有限重连通过自动化模拟测试；实际断连恢复能力仍需遇到真实故障时验证。

## 2026-11-23 · v0.3.212 配套侠／功能包验收说明

- 用户反馈：覆盖侠 v1.88.6 在 iPhone TT 调整原生字体比例成功。
- 用户反馈：配套侠及主题绑定壁纸正常工作，已批准纳入 TLE 正式版。
- 将两项独立脚本纳入可选功能包不代表其远程安装流程已由三种宿主分别完成验证；Core 自动更新链仍需发布后在 ST/TT 检查。

## 2026-11-23 · v0.3.213 功能包卡片与说明统一

- 可选功能包更新为共用展示结构和共用「更多」弹窗结构，功能短句、真实作者、版本、入口对齐。
- 新增自动化 UI 展示契约测试，包含必填字段、细分功能、步骤、注意事项及 manifest 同步校验。
- 独立脚本 UUID/源码/现有数据不变；本轮正式新版 Core 的 ST/TT 手动验收仍需刷新后验证。

## 2026-11-24 · Core v0.3.214 导航滑屏／原生手势联动

- 用户反馈：PC 浏览器模拟触摸与 iPhone TT 端的侧栏滑动功能可使用；包括在酒馆内设置原生翻页手势联动的新版测试组合。
- 安卓 Pad 实测此前版本存在系统级手势抢占：慢滑调出系统导航，快滑可能退出应用。现版本允许安卓用户自愿开启实验，但未确认能可靠展开；不能把 PC 模拟测试等同安卓真机验证。
- 默认关闭 TLE 滑屏；开启时调用酒馆原生 `#gestures-checkbox` 的 `change` 保存，关闭时按 TLE 记录恢复原设置。系统导航不被更改。
- 正式发布的静态语法、版本、安装包源码一致性与发布清单校验由仓库测试和 CI 覆盖；实际安卓宿主以及长期手势冲突仍待分别验收。

## 2026-11-24 · Core v0.3.215 配套侠管理窗横向溢出

- 用户诊断报告：管理区 clientWidth 356px / scrollWidth 368px；两个原生 time 控件各超出 Grid 列 12px。
- 用户确认第二种 CSS 方案（width:auto + justify-self:stretch 等）有效，并确认删除临时 CSS 后的独立整合测试版可用。
- 正式 Core 沿用已验证布局，删除专用临时宽度诊断；保留宿主诊断系统。正式版本的其他宿主实机覆盖仍待验证。

## 2026-11-24 · Core v0.3.217 TT 原生手势初始化同步

- iPhone TT（iOS 18.7）用户确认：v0.3.215 在原生控件不可读取时阻止滑屏；v0.3.216 恢复滑屏，手动切换原生手势后同步；v0.3.217 无需手动切换即可正常工作。
- 正式 Core 与 v0.3.217 真机验证源码一致，仅调整版本说明。新增自动回归覆盖原生复选框、宿主设置接口、延迟加载、恢复、明确冲突、重试上限及卸载清理。
- 本轮未额外验证安卓真机、其他 TT 版本或所有 ST 宿主；保持既有兼容性说明。

## Phase 3.1 · Core Services API v2 Test candidate

- Test Core: `v0.3.305`, Commit `f191d73f154b55e8d31651dbb6e91f545da76150`.
- Core SHA-256: `33bd97d21ec785242a47486fcc93ef792c60a2160bad5d44d8ef3ffc8f18807b`; UTF-8 size: `1,209,522` bytes.
- Test Loader: `0.3.2`, Commit `b3fb21966e7f1c3b134621b4508798135c659a07`.
- Loader SHA-256: `daa0c0fd2165d58e7a24b1e08f27a5a4e293a0fe632d931554699a054b60a9e3`; UTF-8 size: `39,875` bytes.
- Test manifest requires Core API v2 and points to this Phase 3 branch. It includes the auto-starting no-UI `core.services-smoke` module (Commit `20b2a0c43aba06f151a58530af3356426e1f5526`, SHA-256 `184f645c0b1866144006bd0c44a9c0f8191a9ca3f49b9700303c6253d825c038`, 2,822 UTF-8 bytes), which verifies permission-gated `chat-context` and `resource-catalog` access, immutable snapshots and AbortSignal enforcement. No Session / Organizer feature has been migrated yet.
- ST / TT real-device validation for this new candidate is pending. Stable Core v0.3.304, Stable Loader Runtime v0.3.6, Bootstrap v1.0.6, `latest.json` and the empty Stable Module Manifest remain unchanged.
