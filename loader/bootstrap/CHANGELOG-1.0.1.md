# Permanent Bootstrap v1.0.1 — 2026-11-21

本次修复后固定安装此版本。常规 Core/Loader 发布不再更换或重新导入 Bootstrap。

- Loader 注入后等待实际初始化完成，确认真实版本与 API 健康。
- 更新前写入并回读 candidate 和 Previous；Last 缓存提升失败恢复旧 Loader，不报告假成功。
- 缓存恢复逐一尝试 Last/Previous；校验包括来源路径、Commit、SHA-256 和字节数。
- 忙碌的 Loader 稍后重试，避免与 Core 更新同时替换；联网恢复立即检查。
- 完整停止 Bootstrap 持有的运行实例、网络请求、注入、监听器、定时器和数据库连接。
- 沿用原 Bootstrap 脚本 ID，保留用户设置和旧缓存。

作者：小松鼠 & ChatGPT（小松7）。
