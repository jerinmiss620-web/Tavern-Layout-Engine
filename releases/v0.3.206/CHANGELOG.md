# TLE Core v0.3.206 — 2026-11-21

- 正式接入永久 Bootstrap → Loader Runtime → Core 更新通道，承接 v0.3.205 测试版的原生折叠更新区。
- 默认收起，保留 Core/Loader 当前版本、远程版本、绿色更新提示、共用自动更新开关和手动操作。
- 当前版本从实际运行 API 读取；显示两层更新成功结果与失败原因，包含持久缓存结果。
- 增加初始化完成标记，Loader 不会把尚未完成初始化的实例视为健康版本。
- 不更改右上角诊断按钮、Top Layer、渐隐侠、楼层侠、会话侠、TT ChatSurface 或现有设置结构。
- 完整 Bootstrap、Loader、Core 源码在 DOM/IndexedDB 运行模拟中通过升级、关闭/开启、回滚、离线刷新、迁移和单实例验证。真实 ST/TT/iOS 尚未验证，详见根目录 VALIDATION.md。

作者：小松鼠 & ChatGPT（小松7）。
