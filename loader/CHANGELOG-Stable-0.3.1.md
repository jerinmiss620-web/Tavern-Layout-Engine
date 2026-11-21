# TLE Remote Loader STABLE 0.3.1

- 从已验证的 Headless Test Loader 0.3.0 继承经典 script.src/SRI、Blob 回退、IndexedDB LKG/Previous、SHA-256/UTF-8 校验与失败回滚机制，不恢复独立 Loader 面板或悬浮入口。
- 使用正式通道 `main/latest.json`，公开 `__TLE_REMOTE_LOADER_STABLE_V1__`。
- **启动时静默检查更新**，不弹更新确认，不自动替换。TLE 面板 `检查更新` 使用 `checkRemote()`；`loadRemote()` 在用户主动点击后调用，仍通过浏览器原生确认。
- 提供只读 `getInfo()`（运行版本/可更新版本/检查时间/备份状态/当前通道）及 `tle-loader-state-change` 状态事件给 TLE 自己的 UI。
- 提供显式 `adoptCurrent()` 以将当前已校验且版本相同的 TLE 交由 Loader 管理；只有用户确认、校验并回读缓存后，才保存自动恢复授权。
- 兼容已存在的 Test Loader 0.3.0 IndexedDB 和 LKG 存储，用于平滑迁移；必须禁用旧 Test Loader，避免两份脚本同时检查/安装。
- 只更换 Loader 通道与状态 API；不改导航、诊断按钮和移动端浮窗。

注意：测试用户还需在实际 ST/TT 环境中验证 Loader 接管、刷新自动恢复与失败回滚。