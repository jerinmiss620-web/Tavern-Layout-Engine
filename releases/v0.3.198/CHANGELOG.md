# TLE v0.3.198 — Icon vs Label Click Diagnostics

## 继承 v0.3.197

- 保留兼容性修复仅在「图标 + 文字」与「图标 + 文字 + 信息站」模式下设置 `margin-inline: 15px !important`。
- 保留仅图标模式与普通导航模式不受该间距规则影响。
- 保留原生导航按钮宽度、图标可见性兼容修复，以及楼层侠 / 会话侠相关功能。

## Host Diagnostics：图标与文字点击路径分离诊断

- 结合 SillyTavern 原生结构，分别识别 `.drawer-toggle`、内部 `.drawer-icon` 与同级 `.tle-drawer-label`。
- 对图标中心、按钮中心、文字中心分别执行命中测试，记录最上层命中节点，以及图标、按钮、文字各自是否真正接收命中。
- 采集图标本体与 `::before / ::after` 的 `pointer-events`、可见性、透明度、定位与层级。
- 实际 pointerdown / click 记录新增命中区域分类：
  - `icon`：真实事件目标位于图标内
  - `icon-region-hit-target-outside-icon`：指针位于图标区域，但实际命中其他元素
  - `toggle-wrapper`：命中原生按钮容器
  - `label`：命中文字
- 记录点击位置的完整命中栈与事件传播路径，比较文字程序化触发与图标物理点击。
- 诊断只观察，不阻止、模拟或重放用户事件，不自动修改第三方 CSS。

## 排查说明

SillyTavern 原生导航点击监听绑定在 `.drawer-toggle`；TLE 的文字标签则通过程序化调用 `.drawer-toggle.click()`。因此文字可用并不能证明图标区域的物理命中正常。本版用于确定是否为按钮命中区域被 CSS 禁用、透明层遮挡，或事件传播/处理异常。

## 验证状态

- JavaScript 静态语法解析通过。
- 测试通道清单包含源码 SHA-256 与 UTF-8 字节数。
- 仍需反馈者在实际异常主题中分别点击图标与文字，并提交 Host Diagnostics 报告。
- 稳定通道保持 v0.3.195。

## 作者

小松鼠 & ChatGPT（小松7）
