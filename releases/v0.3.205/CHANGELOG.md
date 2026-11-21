# TLE v0.3.205 TEST — 默认折叠的版本与更新管理

## 新增与布局调整
- 将面板顶部原先散落的版本号、更新按钮、Loader 状态统一移入原生 `<details>` 折叠区，默认关闭，不额外创造悬浮窗口。
- 折叠标题始终显示当前运行中的 Core 版本及简要更新状态；检测到新版本时即使折叠，也显示绿色「可更新」，侧边导航的绿色状态点保持不变。
- 展开后可查看当前版本、远程版本、通道、自动安装更新开关、手动检查、手动安装、接管入口和 Loader 诊断状态。
- 不改变 TLE 诊断按钮的右上角/Top Layer 定位，也不改动渐隐侠、会话侠、楼层侠和 TT ChatSurface。

## 自动更新交互
- 自动安装更新默认为开启，用户可以随时关闭；设置由 Stable Loader 0.3.2 通过独立持久化键维护，刷新后不丢失。
- 仅 Stable Loader v0.3.2（或后续兼容版本）提供自动安装能力。旧 Stable Loader 0.3.1 仍可手动检查/安装，但开关会禁用并说明原因，避免出现「假开关」。
- 采用 Loader 原有的严格源码校验、最后可用版本缓存和回滚保护；自动安装仅在已授权接管、当前运行实例健康、且回滚备份版本匹配时执行。
- 旧 Test Loader 手动更新兼容逻辑保留；不会错误地把 Test Loader 当成正式版自动更新服务。

## 发布状态
- 此版本为独立开发分支上的测试候选，未将 `main/latest.json` 或 `main/channels/test.json` 指向该版本。
- 在 ST、TT 的面板交互、回滚、刷新恢复及自动安装测试通过前，不提升为正式版。
- 作者：小松鼠 & ChatGPT（小松7）。

## 2026-11-21 · 双层版本更新补充
- 折叠区域新增「Loader 最新版本」行，可同时查看当前 Runtime、GitHub Loader 版本和 Bootstrap 版本。
- 新增「检查 Loader 更新」「更新 Loader」入口，并接入 Bootstrap 状态事件；折叠状态下 Core 或 Loader 任一发现更新都会显示绿色提示。
- 完整远程链路改为 Permanent Bootstrap v1.0.0 → Loader Runtime v0.3.3 → TLE Core；Loader Runtime 后续更换不再要求用户下载或重复导入 Tavern Helper JSON。
- Bootstrap 和 Runtime 共用自动更新选项，默认开启、可关闭；缓存、签名替代的固定 Commit + SHA-256 校验、失败回滚独立保留。
- Bootstrap 测试入口已发布到 GitHub main，但 TLE v0.3.205 本身仍在开发分支；正式 Core 指针仍为 v0.3.203，未自动推广给现有用户。
