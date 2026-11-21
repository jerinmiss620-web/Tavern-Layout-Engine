# TLE v0.3.202 TEST — 导航图标透明度仅在兼容性修复中启用

- 基于 v0.3.201 的功能和已通过维护者验证的 44px 原生导航命中修复。
- **删除全局原生图标 opacity 覆盖**，将透明度变量直接整合到 `body[data-tle-nav][data-tle-compat-nav-repair]` 对应的原生 `.drawer-icon` 规则。默认主题和未开启兼容选项的其他主题不受到 TLE 的不透明度干预。
- 将 40%–100%（默认 70%）的滑块从「导航栏样式」移到「兼容性修复 → 修复侧边导航按钮宽度与图标可见性」下方。只有开启修复才能看到与调节滑块，退出兼容修复时移除内联 CSS 变量。
- 清理过期的全局 opacity 规则与导航栏样式区的旧滑块节点，不增加第二套覆盖规则；保留 `::before` 主题图案。
- 保留范围双输入 / 单层同值提示、会话侠三项原生快捷操作、渐隐侠与 TT ChatSurface 支持。
- 诊断按钮保护：`syncDiagnosticButtonPosition` 和 `createDiagnosticButton` 的实现经源码逐字比较保持不变；右上角 + Top Layer/fixed-document-root 备用方案不回退到右下角。
- 静态 JS 语法与针对功能的结构校验通过；完整 ST/TT/移动端实际交互仍需验收。

作者：小松鼠 & ChatGPT（小松7）
