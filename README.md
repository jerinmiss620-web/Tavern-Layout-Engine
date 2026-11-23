# Tavern Layout Engine (TLE)

酒馆布局引擎，支持 SillyTavern 与 TauriTavern。作者：小松鼠 & ChatGPT（小松7）。

## 一次安装，后续自动更新

正式发布：**Core v0.3.213 / Loader Runtime v0.3.6 / 固定 Bootstrap v1.0.6**。

1. 下载 [Bootstrap 安装包](loader/bootstrap/TLE-Permanent-Bootstrap-1.0.6.json)，在酒馆助手中导入一次。已安装旧 Bootstrap（包括 v1.0.3）的用户也需停用旧版并重新导入 v1.0.6 一次；以后 Core/Loader 依旧自动更新。
2. 首次迁移时禁用旧独立 Stable/Test Loader、旧 Bootstrap 和独立 Core，保留为禁用备份；启用 v1.0.6 并完整刷新酒馆／重新打开 TT。已有缓存和设置会继续使用。
3. 以后保留 Bootstrap 启用。Core 与 Loader 发布新版本只需更新 GitHub，无需重复导入、下载 Core JSON 或执行控制台命令。

更新链：`固定 Bootstrap → loader/latest.json → Loader Runtime → latest.json → Core`。

两个更新层共用默认开启的持久开关；启动、恢复联网和持续运行期间自动检查。关闭后仍显示更新提示，重新开启立即继续更新。TLE 面板的「版本与更新」使用默认收起的原生折叠区，显示实际运行版本、远程版本、绿色提醒、检查/安装按钮和结果。没有第二套 Loader 面板。

下载和缓存源码都验证固定仓库、来源路径、40 位 Commit、SHA-256 与 UTF-8 字节数；新版本启动并持久写入成功才算更新成功，失败自动恢复 Last Known Good / Previous。首次安装需要网络；已有可用缓存时可离线恢复。Bootstrap 自 v1.0.4 起提供有限重试；当前 v1.0.6 对清单和源码请求最多尝试三条线路，失败间隔为 250ms、500ms，仅自身定时器触发才认定超时；主动取消不重试，安全验证失败拒绝执行。首次临时失败恢复后自动继续 Loader/Core 启动，无需发送消息。沿用启动失败独立诊断弹窗，区分旧 Loader 冲突、Loader 未加载与 Core 未加载，并显示请求阶段、尝试次数、错误类型，支持复制诊断和刷新重试。此提示只在 Bootstrap 确实执行、能访问宿主 DOM、且启动失败时出现。浏览器清空站点数据后需要联网重新取得源码，仍不需要重新导入 Bootstrap。

## 发布与验证

- [Core 正式清单](latest.json)、[Loader 正式清单](loader/latest.json)
- [Core 变更日志](releases/v0.3.213/CHANGELOG.md)、[Loader 变更日志](loader/runtime/v0.3.6/CHANGELOG.md)、[Bootstrap 变更日志](loader/bootstrap/CHANGELOG-1.0.6.md)
- [统一发布流程](RELEASING.md)：生成安装包、运行测试、提交不可变源码、生成两份清单后，在一次推送中激活。
- [实际验证范围](VALIDATION.md)：完整源码运行模拟覆盖升级、回滚、持久化、离线刷新、旧版迁移和单实例；PC SillyTavern、Android Pad SillyTavern、iPhone TauriTavern 已有用户实机启动成功反馈；故障注入及长期可靠性仍未实机覆盖。

右上角诊断按钮、Top Layer、渐隐侠、楼层侠、会话侠和 TT ChatSurface 功能保留。旧 Test 通道清单仅为已安装的旧 Loader 提供兼容，不是安装入口。历史版本在发布目录中只保留更新日志；回归测试必要的旧源码隔离在 `tests/fixtures/legacy/`，正式运行只使用以上最新版本。历史提交仍可在 GitHub 中追溯。

完整版本日志索引见 [CHANGELOG.md](CHANGELOG.md)。

### 首次加载提示与下载线路

Bootstrap v1.0.6 启动后立即显示「TLE 正在努力加载中，请稍候…」非阻塞提示；成功后自动消失，失败转交独立诊断弹窗。Loader/Core 均从 jsDelivr、Fastly jsDelivr、GitHub Raw 三线路获取受信任仓库文件；固定 Commit、SHA-256、UTF-8 字节数校验不变。更新检查在已有健康实例时先用短时间核对官方 GitHub Raw 清单，再回退 CDN；CDN @main 清单可能缓存旧内容，不保证绝对实时。旧 Bootstrap 必须一次性重新导入 v1.0.6，Loader/Core 后续自行更新。

### 首次启动提示及 WebKit 存储连接恢复（v1.0.6）

Bootstrap 启动即出现「TLE 正在努力加载中，请稍候…」，至少短暂可见约 1.2 秒；提示不影响运行速度，加载成功后自动消失。iOS TT 或 Android 宿主若发生 IndexedDB 连接失效，Bootstrap / Loader 有限重建连接一次，失败明确提示完全重启宿主。不清空或绕过缓存校验、版本保护与回滚。

## 配套侠与独立可选功能包（Core v0.3.213）

**配套侠**已经成为 TLE 内置功能，可在 TLE 控制面板保存、关联和管理角色配置，并自动联动预设、模型、推理格式及 UI 主题，无须另装脚本。

两款独立可选脚本可以从「可选功能包」中按需安装：**Freesia 覆盖侠 v1.88.6**（实际入口：底栏扩展菜单／魔法棒）和 **主题绑定壁纸 v4.1**（实际入口：酒馆原生背景面板顶部工具栏）。功能包只负责脚本安装与管理，**实际操作不在 TLE 面板中**。详见 [可选功能包使用说明](optional-modules/README.md) 和 [统一展示规范](optional-modules/DISPLAY-STANDARD.md)。

### Core v0.3.213 · 功能包展示统一

两款功能包统一按「名称 → 具体功能短句 → 版本/作者 → 操作入口 → 状态按钮」显示；「··· 更多」介绍功能分组、操作步骤与注意事项。覆盖侠介绍明确列出气泡居中、自定义字体、行高、字间距、滚动条宽度、头像定位等具体控制项。两个功能包本体与安装 UUID 不变。
