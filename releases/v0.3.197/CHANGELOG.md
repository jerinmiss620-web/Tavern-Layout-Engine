# TLE v0.3.197 — Compatibility Navigation Spacing and Click Diagnostics

## 继承 v0.3.196

- 保留楼层侠双输入框与清除按钮、导航按钮宽度/图标可见性兼容修复、会话侠原生聊天快捷操作。
- 保留实例公开 API 的版本字段与发布版本号一致的启动注册修复，避免 Remote Loader 因版本字段遗漏而拒绝健康实例。

## 兼容性修复：导航间距

- 仅在「兼容性修复 → 修复侧边导航按钮宽度与图标可见性」开启时生效。
- 仅对「图标 + 文字」（`labels`）和「图标 + 文字 + 信息站」（`info`）模式的原生 `.drawer-toggle` 设置 `margin-inline: 15px !important`。
- 极简纯图标模式不增加该间距。
- 关闭兼容性修复后不生效；不改变普通导航模式的布局规则。

## Host Diagnostics：原生导航点击诊断

- 为 `#top-settings-holder` 下每个原生抽屉按钮采集计算样式、几何位置、`::before / ::after` 伪元素状态。
- 采集按钮及祖先节点的 `pointer-events`、`visibility`、`opacity`、`display`、定位、层级、变换、滤镜与溢出状态。
- 对按钮中心和图标中心执行 `elementsFromPoint()` 命中测试，记录最上层命中元素与实际按钮是否接收命中。
- 增加被动事件追踪：记录按钮区域的 pointerdown / click 目标、事件是否到达 document/window 冒泡阶段、`defaultPrevented` 状态，以及抽屉点击前后的 `openDrawer` 状态。
- 诊断仅观察，不阻止或重放事件，不修改第三方 CSS，不枚举或猜测外部事件监听器。

## 验证状态

- JavaScript 静态语法解析通过。
- UTF-8 源码字节数与 SHA-256 已计算并写入测试通道清单。
- 发布测试通道；仍需在 ST / TT、PC / 手机端进行实际点击回归。
- 稳定通道保持 v0.3.195，不随本次测试版本更新。

## 作者

小松鼠 & ChatGPT（小松7）
