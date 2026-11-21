# TLE Core v0.3.207 — 更新面板折叠样式归一

## 界面修正
- 将原来的独立 `<details>/<summary>`「版本与更新」折叠组件，直接改成与引擎面板「折叠侠设置」「兼容性修复」一致的 SillyTavern 原生 `inline-drawer` DOM：`inline-drawer-toggle inline-drawer-header interactable` + `inline-drawer-content`。
- 标题、向下箭头、折叠动画和主题继承使用现有原生类，版本号与「可更新」提醒保留在标题一侧；默认折叠。
- 删除自定义三角形伪元素、旋转状态及旧 `.tle-update-section` / `.tle-update-body` 布局规则；在原位置整合必要的版本摘要/内容排版规则，**未追加 CSS 补丁**。
- 外层统一使用 `tle-section`，承袭面板原有区块边框、上下间距；下拉内容保留原始按钮和设置选择器，`tle-update-content` 的网格仅影响内部布局，不接管原生折叠隐藏机制。
- 保留 Core、Loader、Bootstrap 版本显示和自动更新开关、检查/安装操作、绿色更新提示与引擎侧边栏状态点。

## 楼层侠移动端留白修复
- 修正会话侠「楼层侠」页沿用最近聊天页的 `flex: 1 1 auto`，在主题或宿主给予弹窗高度时把内容区无意义拉伸，形成大块空白。
- 弹窗本体采用内容自适应高度，并显式取消不必要的最小高度；楼层侠页使用 `flex: 0 1 auto`，只按当前操作行和已隐藏楼层范围占位。
- 「最近聊天」页单独保留 `flex: 1 1 auto` 与固定可滚动高度；不影响聊天列表搜索和滚动，也不更改弹窗右上角按钮与操作逻辑。
- 修复直接整合在现有会话侠 CSS 原规则中，没有额外追加 `!important` 覆盖补丁。

## 不变内容
- 不改 Loader Runtime v0.3.4、Permanent Bootstrap v1.0.2、自动更新清单格式、IndexedDB 缓存及回滚。
- 不改诊断按钮右上角及 Top Layer 位置、渐隐侠、楼层侠、会话侠、TT ChatSurface 和紧急恢复。
- 回归测试检查原生 DOM、默认关闭、旧折叠 CSS 清除与版本提醒仍存在；ST/TT 页面真实的酒馆原生展开行为仍需运行时确认。

作者：小松鼠 & ChatGPT（小松7）。
