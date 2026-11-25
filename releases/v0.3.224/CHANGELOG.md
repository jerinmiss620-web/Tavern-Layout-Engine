# Core v0.3.224 · 整理侠抽屉激活修复 / 移除嵌套容器

## 修复整理侠无法打开

- 根因是新增的整理侠点击回调只读取抽屉状态，没有实际切换 `openDrawer / closedDrawer`；动态插入的自定义抽屉未可靠接入酒馆原生静态点击监听。
- 新增显式的 `setOrganizerDrawerOpen()` / `toggleOrganizerDrawer()`，由整理侠自己维护抽屉开合类及 `aria-expanded / aria-hidden`。
- 导航图标、文字标签和全局搜索弹窗内的整理侠跳转入口最终进入同一套开合控制器。
- 打开整理侠时关闭全局搜索、其他普通原生抽屉和 TLE 控制面板；移动端收起导航继续使用现有导航事件流程。
- 整理侠关闭按钮和嵌入管理器的关闭路径也统一走显式控制器。

## 移除第二层视觉容器

- 删除整理侠内部的 `.tle-search-surface`。
- 标题栏、独立资源筛选框和资源列表直接成为 `#tle-organizer-panel.drawer-content` 的子元素。
- 不再为 Organizer 内层 wrapper 另设宽高与滚动容器；原生 `.drawer-content` 负责面板定位、尺寸与滚动。
- 全局搜索弹窗仍保留自己的 `.tle-search-surface`，不受本次改动影响。

## 验证

- Core 源码通过 JavaScript 语法解析。
- 更新后的 `tests/tle-organizer-worldbook.test.mjs` 在隔离 JS harness 通过，覆盖 Organizer 开/关、class 与 ARIA 同步、管理器启动/关闭、搜索/Organizer 分离和世界书分类。
- 完整 `npm test`、CI 及 PC/移动端 ST/TT 真实界面验收仍待执行。
- 正式 Stable Core、Stable Loader、Bootstrap 与正式发布清单均未修改。
