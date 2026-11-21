# Permanent Bootstrap v1.0.5 — 2026-11-22

- 冷启动超过 500ms 时展示「TLE 正在努力加载中，请稍候…」，不阻挡点击，成功即消失，失败由诊断弹窗接管。
- Loader 清单和固定 Commit 源码下载提供 jsDelivr、Fastly jsDelivr 和 GitHub Raw 三线路；有限次数切换，不放宽校验。
- 健康 Loader 的更新检查优先 GitHub 官方清单，失败后回退 CDN；CDN @main 缓存可能导致短暂更新滞后。
- 配套 Loader Runtime v0.3.5 解决 Core 下载单线路问题；Core v0.3.211 保持不变。
- 保留诊断、原缓存、SHA-256、安全路径、回滚和自动更新开关。

作者：小松鼠 & ChatGPT（小松7）。
