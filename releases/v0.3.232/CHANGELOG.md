# Core v0.3.232 · 搜索框统一继承主题原生样式

## 修正
- 全局搜索、整理侠资源筛选、快速切换和最近聊天搜索统一使用 `input[type="search"]`，移除搜索输入框上的 `text_pole` 通用样式类。
- `.tle-search-field` 只保留布局尺寸、宽度约束和固定的 40px 高度／最小高度。
- 删除 TLE 自定义的输入框 padding、圆角和字体覆盖；背景、边框、圆角、字体及文字颜色交由当前主题的 `input[type="search"]` 样式决定。
- 保留原有搜索、筛选、清空按钮及输入事件逻辑。

## 保持不变
- 整理侠原全局搜索入口、资源分类、分组、同步、导入/导出、批量操作及世界书绑定管理不变。
- 快速切换、最近聊天和其他 TLE 功能行为不变。
- 不修改 Stable Core、Stable Loader、Bootstrap 或正式 `latest.json`。

## 验证
- JavaScript 语法检查与搜索框样式静态回归检查通过。
- 测试通道 SHA-256 与 UTF-8 字节数固定记录。
- PC／移动端 SillyTavern 与 TauriTavern 的主题继承效果仍需实机验收。
