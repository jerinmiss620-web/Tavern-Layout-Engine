# Loader Runtime v0.3.5 — 2026-11-22

- Core 清单及固定 Commit 源码新增 jsDelivr、Fastly jsDelivr 与 GitHub Raw 线路回退。
- 运行中 Core 的更新检查优先 GitHub Raw；初次无 Core 时优先 CDN。
- CDN 获取的源码仍执行 SHA-256、来源/路径、固定 Commit、长度校验；固定 Commit CDN 的经典 script 引入保留 SRI 与 Blob 回退。
- 不修改 Core、缓存/回滚/自动更新开关和用户设置。

作者：小松鼠 & ChatGPT（小松7）。
