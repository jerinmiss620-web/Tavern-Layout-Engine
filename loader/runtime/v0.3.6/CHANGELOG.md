# Loader Runtime v0.3.6 — 2026-11-22

- 针对 iOS WebKit `Connection to Indexed Database server lost`：打开失败或事务读写中断后，一次性重建 IndexedDB 连接并重试原始操作。仍失败时明确提示完全重启 TT。
- 连接缓存不再永久保存 rejected Promise，onclose/onversionchange 时失效旧连接；销毁时主动关闭缓存连接。
- 校验安全保护不变：候选与上一版本缓存必须写入并读回、通过 SHA-256 后才能替换运行版本；不清空任何缓存。
- 不修改 Core 0.3.211、CDN 路由、自动更新、回滚或第三方兼容逻辑。

作者：小松鼠 & ChatGPT（小松7）。
