# 自动更新验证记录 — 2026-11-21

发布组合：Bootstrap 1.0.1 / Loader Runtime 0.3.4 / Core 0.3.206。

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

未验证：真实 SillyTavern、TauriTavern、iOS/WebView 的宿主集成、CSP/CORS/SRI 策略、原生 Popover/Top Layer 实际渲染、长期休眠/后台节流和浏览器存储被系统清除。这些模拟不等于真机通过；自动化不能保证 GitHub、网络和浏览器存储永远可用。

## 2026-11-21 · PC 旧缓存升级修复（Bootstrap 1.0.2）

- 在固定安装脚本内修复：旧 Loader v0.3.3 刚恢复且忙碌时，Bootstrap 已验证新版 v0.3.4 却误把下次重试延后六小时。
- 现在有待安装的较新版本，最迟一分钟重试；旧 Loader 发出空闲状态事件时立即安排重试。
- 增补真实旧 Loader v0.3.3 / Core v0.3.203 IndexedDB 缓存迁移测试，模拟正式清单 `minimum_loader_version: 0.3.4`，验证最终运行 Loader v0.3.4 / Core v0.3.206。
- 单独新增 `tests/tle-bootstrap-busy-retry.test.mjs`；再次回归全部历史测试。
- GitHub 自动回归测试通过不能替代真实 PC Chromium / TT 运行验证。
