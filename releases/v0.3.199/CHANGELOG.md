# TLE v0.3.199 TEST — 基于 v0.3.198 恢复功能并整合导航兼容修复

**仅测试分支；正式版与 stable/latest.json 未修改。**

- 完整继承 v0.3.198：楼层侠双输入框/清空、跳转与隐藏恢复；会话侠新建聊天、关闭聊天、管理聊天文件原生快捷操作；v0.3.198 图标/文字点击诊断、渐隐侠及 TT ChatSurface 兼容功能。
- 直接替换兼容规则旧的 `width:fit-content`，保留原来的 `data-tle-compat-nav-repair` 开关与持久化设置，不添加第二套并行兼容开关。
- 原生 `.drawer-toggle` 与 `.drawer-icon` 在兼容修复启用时获得 44px 或当前行高的稳定非零点击槽位；文字保持在图标右侧左对齐。
- 删除先前仅在文字/信息模式的 `margin-inline:15px`：对狭窄侧栏会导致拥挤；同步更新诊断预期为 `not-forced`。
- 所有 TLE 导航模式的原生图标容器 `opacity:1!important`，保留主题 `::before` 的背景图案与绘制，不替换贴图。
- 静态语法、关键功能保留及源码和导入 JSON 一致性已检查；完整 ST/TT/移动端真实交互尚需验证。

作者：小松鼠 & ChatGPT（小松7）
