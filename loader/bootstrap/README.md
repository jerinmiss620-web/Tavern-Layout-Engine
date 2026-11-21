# TLE Permanent Bootstrap 1.0.3

[下载固定 Bootstrap 安装包](TLE-Permanent-Bootstrap-1.0.3.json)。在酒馆助手导入一次，禁用旧独立 Stable/Test Loader、旧 Bootstrap 和独立 Core，保留禁用备份，然后启用本 Bootstrap 并刷新。

此后保持 Bootstrap 启用。Loader Runtime 和 Core 从 GitHub 独立清单自动更新，不需要重新导入或控制台操作。仅未来底层启动协议确实不兼容时才可能需要迁移；日常 Core/Loader 更新不更换 Bootstrap。

两层共用「自动安装更新」持久开关，默认开启。启动和每六小时检查，联网恢复立即检查，网络失败或运行时忙碌时稍后重试。关闭自动更新后继续显示新版本提示，重新开启自动继续。首次安装及恢复既有缓存不受关闭更新影响。

Bootstrap 正常启动不增加面板或按钮；若 Bootstrap 已执行但 Core 未能启动，会在酒馆宿主页面独立显示「TLE 未能启动」诊断弹窗（Loader 冲突、网络或 Core 故障），可长按或复制诊断、关闭、刷新重试。用户关闭后不会循环弹出；健康 Core 启动时立即清除。Bootstrap 本身未被酒馆助手执行时无法弹窗。正常状态仍全部显示在 Core 原有默认收起的「版本与更新」。源码与缓存均校验固定来源、Commit、路径、SHA-256 和 UTF-8 字节数。更新前验证 candidate/Previous，成功后持久保存 Last，失败回滚；禁用 Bootstrap 会清理它持有的运行实例。

首次安装需联网；离线可恢复已验证缓存。不要清除站点数据来处理更新问题。旧版安装包仍可通过原始 Git 提交追溯，当前分支只提供 1.0.3 安装包；旧版启动脚本保留为回归测试样本。

[验证报告](../../VALIDATION.md)：完整源码运行模拟已覆盖实际版本升级与离线刷新；真实 ST/TT/iOS 尚未验证。

**从 1.0.2 升级：** 由于 Bootstrap 自身是固定安装器，不能通过远程 Core/Loader 更新替换。请停用旧版 1.0.2（旧 Loader/Core 也应保持停用），导入并启用 1.0.3，完整刷新 TT；不要清空缓存或聊天。
