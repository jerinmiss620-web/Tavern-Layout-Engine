# Core v0.3.230 · 恢复常驻 UI 主题分组同步入口

## 修正
- 保留原有 Theme Manager 本机分组读取逻辑：读取 `__ThemeManagerLite_groups_v2`，兼容旧版「已标记」数据。
- 同步按钮始终显示在整理侠标题右侧，与全部分组导入、导出并排；不再要求先选择 UI 主题分类。
- 点击同步仍会显示确认信息，只替换 TLE 的 UI 主题分组与归属；不会修改预设、世界书、角色卡等其他分类。完成后自动切换到 UI 主题分类。
- 清理同步按钮移出分类栏后遗留的旧 CSS 规则。

## 保持不变
- JSON 全分类备份导入/导出功能独立保留。
- 其他整理侠分类、PC 三栏布局、移动端滚动指示条、批量删除权限不变。
- 不修改 Stable Core、Stable Loader、Bootstrap 或正式 `latest.json`。

## 验证
- JavaScript 语法检查通过。
- 静态检查确认同步按钮仍调用 `importThemeManagerGroups()`，读取 `readThemeManagerLocalGroups()`，并且只写入 `groupsByModule.theme` / `assignments.theme`。
- 测试通道 SHA-256 与 UTF-8 字节数已记录。
- ST/TT 实机显示、同步确认及数据保留验收待完成。
