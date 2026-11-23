# 自动更新验证记录 — 2026-11-22

当前发布组合：Bootstrap 1.0.6 / Loader Runtime 0.3.6 / Core 0.3.211。

`npm test` 运行历史兼容性回归、新 Core 的同组诊断/布局回归、安装包/发布元数据检查，以及完整源码运行模拟。

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
