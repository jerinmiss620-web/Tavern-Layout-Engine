# TLE Permanent Bootstrap · 一次安装的 Loader 自更新

首次从旧独立 Loader 迁移时，在 Tavern Helper 导入 `TLE-Permanent-Bootstrap-1.0.0.json`；**禁用**旧 Stable/Test Loader 和独立 TLE Core，保留为禁用的应急备份，然后启用 Bootstrap 并刷新。

## 更新链路

`Bootstrap 1.0.0（固定脚本） → loader/latest.json → Loader Runtime → latest.json → TLE Core`

- Bootstrap 校验 GitHub 不可变 Commit、固定仓库及路径、SHA-256、UTF-8 长度后执行 Loader Runtime；未来升级 Loader Runtime 不需要再次导入酒馆助手脚本。
- Loader Runtime 继续负责 Core 正式版的自动更新/手动更新、缓存和回滚。
- Bootstrap 与 Loader 共享一个「自动安装更新」开关：默认开启，关闭则两层均不自动安装，但仍能查找远程版本。
- Bootstrap 持有独立 IndexedDB Last/Previous 缓存；升级前保存并回读旧 Loader，失败时恢复。
- 旧独立 Loader 未被禁用时 Bootstrap 拒绝抢占，避免双实例。
- 页面启动时检查，在持续打开页面的情况下约每 6 小时再次检查 Loader；忙碌时不强行热替换。
- Core 的折叠更新区显示 Core/Loader 当前和远程版本，提供两层手动检查与安装入口。
- 不新增 Loader 悬浮窗，也不改变右上角诊断按钮、渐隐侠和原有布局。

旧独立 Loader 0.3.2 本身没有自更新机制，因此迁入 Bootstrap 必须**最后一次**导入。以后只需更新远程 Loader Runtime 与清单，Bootstrap 仍保留不变。极少数底层协议升级时可能另需迁移。

测试前保留禁用状态的旧 Loader / Core 备份。实际 ST/TT/iOS 运行、网络失败与回滚需验证后才能对外正式推广。所有脚本安装包须有单行 `info` 的简介、使用方式、注意事项、作者，以及独立更新日志。
