# TLE Core v0.3.207 — 更新面板折叠样式归一

## 界面修正
- 将原来的独立 `<details>/<summary>`「版本与更新」折叠组件，直接改成与引擎面板「折叠侠设置」「兼容性修复」一致的 SillyTavern 原生 `inline-drawer` DOM：`inline-drawer-toggle inline-drawer-header interactable` + `inline-drawer-content`。
- 标题、向下箭头、折叠动画和主题继承使用现有原生类，版本号与「可更新」提醒保留在标题一侧；默认折叠。
- 删除自定义三角形伪元素、旋转状态及旧 `.tle-update-section` / `.tle-update-body` 布局规则；在原位置整合必要的版本摘要/内容排版规则，**未追加 CSS 补丁**。
- 外层统一使用 `tle-section`，承袭面板原有区块边框、上下间距；下拉内容保留原始按钮和设置选择器，`tle-update-content` 的网格仅影响内部布局，不接管原生折叠隐藏机制。
- 保留 Core、Loader、Bootstrap 版本显示和自动更新开关、检查/安装操作、绿色更新提示与引擎侧边栏状态点。

## 不变内容
- 不改 Loader Runtime v0.3.4、Permanent Bootstrap v1.0.2、自动更新清单格式、IndexedDB 缓存及回滚。
- 不改诊断按钮右上角及 Top Layer 位置、渐隐侠、楼层侠、会话侠、TT ChatSurface 和紧急恢复。
- 回归测试检查原生 DOM、默认关闭、旧折叠 CSS 清除与版本提醒仍存在；ST/TT 页面真实的酒馆原生展开行为仍需运行时确认。

作者：小松鼠 & ChatGPT（小松7）。
