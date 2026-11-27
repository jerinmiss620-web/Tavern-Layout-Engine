## 2026-11-27 · Core v0.3.288 · 正式版修复回灌与记录详情间距（测试分支）

- 回灌正式版 v0.3.264 的配套方案紧凑预览：恢复 `5px 0` 外间距、紧凑字段间距，并移除横向分割线。
- 恢复五个更新操作按钮仅使用酒馆原生 `menu_button`，移除 `tle-update-pill` 与 `tle-update-check` 类。
- 移动端 820px 断点内，将 `--freesia-gallery-detail-main-gap` 从 `0px` 调整为 `5px`；头像列宽 104px、列间距 8px 不变。
- 将正式版 v0.3.264 的配套侠初始化、预览布局、原生更新按钮及整理侠回归测试纳入测试分支。
- 不新增后置 CSS 覆盖规则；仅更新测试分支，正式 Core、Stable Loader 与 Bootstrap 不变。
