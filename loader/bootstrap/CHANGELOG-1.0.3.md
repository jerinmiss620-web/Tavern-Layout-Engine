# Permanent Bootstrap v1.0.3 — 2026-11-21

- 修复 Bootstrap 已执行但加载失败时，iPhone TT 用户只看到原始酒馆页面而无法判断原因的问题。
- 旧独立 Stable / Test Loader 在同一页面仍运行时，显示独立诊断弹窗；旧版本脚本停用后必须完整刷新。
- Loader 首次下载失败且没有可用缓存时，展示真实的网络或校验错误；Loader 已启动但 Core 未启动时展示 Loader 最近的错误状态。
- 弹窗直接挂载宿主文档根节点，优先使用原生 dialog Top Layer，未支持时回退固定层；与 TLE 主面板、侧栏和诊断按钮解耦，适配 iPhone 安全区域与狭窄视窗。
- 提供复制诊断、长按文字复制、关闭、刷新重试；正常启动不显示弹窗，成功恢复时自动撤除。
- 保留来源路径 / Commit / SHA-256 / UTF-8 校验、LKG/Previous 回滚、自动更新行为；不修改 Core、Loader、主题或聊天 DOM。
- Bootstrap 自身必须实际执行、可以访问宿主页面才能弹窗；本修复不能诊断酒馆助手从未执行脚本的情况。
- 旧 Bootstrap 固定安装包不自动升级；需停用 1.0.2 后重新导入 1.0.3 一次。尚需受影响 iPhone TT 的真实环境验证。

作者：小松鼠 & ChatGPT（小松7）。
