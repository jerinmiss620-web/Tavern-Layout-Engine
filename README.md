# Tavern Layout Engine (TLE)

酒馆布局引擎，支持 SillyTavern 与 TauriTavern。作者：小松鼠 & ChatGPT（小松7）。

## 一次安装，后续自动更新

正式发布：**Core v0.3.206 / Loader Runtime v0.3.4 / 固定 Bootstrap v1.0.1**。

1. 下载 [Bootstrap 安装包](loader/bootstrap/TLE-Permanent-Bootstrap-1.0.1.json)，在酒馆助手中导入一次。
2. 首次迁移时禁用旧独立 Stable/Test Loader、旧 Bootstrap 和独立 Core，保留为禁用备份；启用新 Bootstrap 并刷新。已有缓存和设置会继续使用。
3. 以后保留 Bootstrap 启用。Core 与 Loader 发布新版本只需更新 GitHub，无需重复导入、下载 Core JSON 或执行控制台命令。

更新链：`固定 Bootstrap → loader/latest.json → Loader Runtime → latest.json → Core`。

两个更新层共用默认开启的持久开关；启动、恢复联网和持续运行期间自动检查。关闭后仍显示更新提示，重新开启立即继续更新。TLE 面板的「版本与更新」使用默认收起的原生折叠区，显示实际运行版本、远程版本、绿色提醒、检查/安装按钮和结果。没有第二套 Loader 面板。

下载和缓存源码都验证固定仓库、来源路径、40 位 Commit、SHA-256 与 UTF-8 字节数；新版本启动并持久写入成功才算更新成功，失败自动恢复 Last Known Good / Previous。首次安装需要网络；已有可用缓存时可离线恢复。浏览器清空站点数据后需要联网重新取得源码，仍不需要重新导入 Bootstrap。

## 发布与验证

- [Core 正式清单](latest.json)、[Loader 正式清单](loader/latest.json)
- [Core 变更日志](releases/v0.3.206/CHANGELOG.md)、[Loader 变更日志](loader/runtime/v0.3.4/CHANGELOG.md)、[Bootstrap 变更日志](loader/bootstrap/CHANGELOG-1.0.1.md)
- [统一发布流程](RELEASING.md)：生成安装包、运行测试、提交不可变源码、生成两份清单后，在一次推送中激活。
- [实际验证范围](VALIDATION.md)：完整源码运行模拟覆盖升级、回滚、持久化、离线刷新、旧版迁移和单实例；**真实 ST/TT/iOS 环境尚未验证**。

右上角诊断按钮、Top Layer、渐隐侠、楼层侠、会话侠和 TT ChatSurface 功能保留。旧 Test 通道及旧独立安装包仅供历史兼容与备份，不是当前安装入口。
