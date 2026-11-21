# TLE Remote Loader Runtime v0.3.3 — Bootstrap 接管

- Stable Loader 从需要手动导入的版本更新为由 Permanent Bootstrap 自动装载的远程 Runtime，增加 `bootstrapManaged` 标记。
- 自动更新默认开启，`tle.loader.stable.autoUpdate.v1` 与 Bootstrap 共用，关闭后两层更新均不自动安装。
- 首次没有运行中的 TLE Core 时，允许自动安装已验证的正式 Core；已有 Core 时必须具备匹配的可验证回滚备份。
- 继续保留 SHA-256/UTF-8、IndexedDB LKG/Previous、手动确认、自动回滚、ST/TT 诊断接口。
- 固定发布路径：`loader/runtime/vX.Y.Z/TLE-Remote-Loader.js`；由 `loader/latest.json` 提供不可变 Commit 指针。
- ST、TT 和 iOS 真机流程尚待测试，不视为已完成正式发布。
- 作者：小松鼠 & ChatGPT（小松7）。
