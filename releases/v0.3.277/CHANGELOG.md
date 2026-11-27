# Core v0.3.277 TEST · 高清头像旧图层扫描隔离修正

## 修复

- 修正高清头像引擎初始扫描入口：`apply()` 现在与 MutationObserver、错误回退共用同一头像所有权判断；检测到旧版 260402 的 `hd-avatar-styles`、`data-hd-fixed` 或 `hd-avatar-layer-div/canvas` 时，不再改写它接管的聊天头像。
- 旧图层脚本只拥有聊天头像时，TLE 仍继续处理角色列表、角色预览、User 身份列表和记录预览。
- 增加针对全局样式标记与单头像图层标记的独立回归测试。
- 保留 v0.3.276 已整合的桃mini v4.5.13 原图 URL、缓存刷新、失败回退、动态更新、实例交接和 TT 原生分流。

仅更新测试分支；正式 Core、Stable Loader 与 Bootstrap 不变。