# Core v0.3.233 · 搜索框尺寸约束与主题样式继承

## 修正
- 保持全局搜索、整理侠资源筛选、快速切换和最近聊天搜索统一使用 `input[type="search"]`。
- 将共享布局规则限定到 `input.tle-search-field[type="search"]`，确保固定 40px 高度和最小高度优先于主题通用搜索框尺寸规则。
- 输入框背景、边框、圆角、内边距、字体及文字颜色继续由当前主题的 `input[type="search"]` 样式决定；TLE 不再覆盖这些视觉属性。
- 保留原有搜索、筛选、清空按钮及输入事件逻辑。

## 保持不变
- 整理侠资源分类、分组、同步、导入/导出、批量操作及世界书绑定管理不变。
- 不修改 Stable Core、Stable Loader、Bootstrap 或正式 `latest.json`。

## 验证
- JavaScript 语法与搜索框静态回归检查已加入测试套件。
- 修正世界书测试中与当前目录实现不符的旧字符串断言，不改动世界书运行逻辑。
- PC／移动端 SillyTavern 与 TauriTavern 的主题继承效果仍需实机验收。
