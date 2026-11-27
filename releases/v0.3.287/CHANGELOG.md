## 2026-11-27 · Core v0.3.287 · 移动端记录详情间距微调（测试分支）

- 移动端 `@media screen and (max-width: 820px)` 中，将 `--freesia-gallery-detail-main-gap` 从 `0px` 调整为 `5px`。
- 保持详情区两列宽度 `104px minmax(0, 1fr)` 与列间距 `8px` 不变。
- 不增加新选择器或后置覆盖；修改合并进原有移动端 CSS 自定义属性规则。
- 保留 v0.3.286 的记录详情头像圆角统一、v0.3.285 高清头像兼容修复及内置 4.5.14 引擎。

仅更新测试分支；正式 Core、Stable Loader 与 Bootstrap 不变。
