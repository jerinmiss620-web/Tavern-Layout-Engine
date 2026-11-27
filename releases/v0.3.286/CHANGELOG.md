## 2026-11-27 · Core v0.3.286 · 统一记录详情头像圆角（测试分支）

- 新增共享头像圆角变量 `--freesia-gallery-avatar-radius: 12px`，由记录预览卡片与记录详情页共同继承。
- 记录详情页 `.freesia-gallery-detail-avatar` 外层容器增加统一圆角与溢出裁切。
- 内部头像图片增加 `border-radius: inherit !important`，不再出现图片直角、外框圆角不一致的问题。
- 保留 v0.3.285 的高清头像选择器兼容修复及 4.5.14 内置高清头像引擎。

仅更新测试分支；正式 Core、Stable Loader 与 Bootstrap 不变。
- 同步维护源码 `development/avatar-engine/avatar-engine.js` 与 Core 内置 4.5.14 引擎，新增记录预览头像框、记录详情头像及动态插入场景的高清替换回归覆盖。
