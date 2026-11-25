# Core v0.3.234 TEST · 整理侠跨资源内容处理

- 整理侠唯一入口、共享名称/内容搜索框和原资源列表；桌面三栏、移动紧凑布局保留。
- 增加全部支持资源/当前筛选/已选范围、多规则组合、逐资源/逐匹配选择、原位预览和明确确认。空替换只删除选中文字。
- 原资源分组、主题同步、分组备份、世界书绑定/孤儿识别及 User/UI 主题等原资源删除能力保留；文字选择与资源删除状态隔离。
- 复用 Global Batch Replace v1.1.0 核心引擎、字段白名单、PC 服务、TT ABI 2/资料集/PNG 备份/提交校验/失败恢复。原独立 UI 和样式未装载。
- 配套 PC 插件增加扫描指纹、验证 ZIP 导入和指定文件恢复；TT 增加指定资源恢复。原存储命名空间和历史备份保留。
- 执行后自动重新载入并恢复整理侠当前分组与筛选，避免原生旧缓存覆盖已提交资料。
- 51 项内容相关自动化测试、TLE 原回归及真实 Chromium 模拟宿主检查通过。PC ST、PC TT、iPhone TT、Android ST 均未实机验证。
- 仅更新开发分支测试通道；正式 latest.json、Stable Core/Loader、Bootstrap 不变。

安装、来源与限制详见 development/organizer/CONTENT-INTEGRATION.md；验证矩阵详见 CONTENT-VALIDATION.md。
