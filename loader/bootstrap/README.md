# TLE Permanent Bootstrap 1.0.6

[下载固定 Bootstrap 安装包](TLE-Permanent-Bootstrap-1.0.6.json)。在酒馆助手导入一次，禁用旧独立 Stable/Test Loader、旧 Bootstrap 和独立 Core，保留禁用备份，然后启用本 Bootstrap 并刷新。

此后保持 Bootstrap 启用。Loader Runtime 和 Core 从 GitHub 独立清单自动更新，不需要重新导入或控制台操作。仅未来底层启动协议确实不兼容时才可能需要迁移；日常 Core/Loader 更新不更换 Bootstrap。

两层共用「自动安装更新」持久开关，默认开启。启动和每六小时检查，联网恢复立即检查，每个清单/源码请求对临时网络失败最多尝试三次，分别等待 500ms、1000ms。已有健康运行版本的后续检查仍为六小时；首次启动耗尽三次请求后停止自动重试，等待联网恢复或用户重试。已验证的新 Loader 因旧 Loader 忙碌而推迟安装时仍保留一分钟重试及空闲事件恢复。关闭自动更新后继续显示新版本提示，重新开启自动继续。首次安装及恢复既有缓存不受关闭更新影响。

Bootstrap 正常启动不增加面板或按钮；若 Bootstrap 已执行但 Core 未能启动，会在酒馆宿主页面独立显示「TLE 未能启动」诊断弹窗（Loader 冲突、网络或 Core 故障），可长按或复制诊断、关闭、刷新重试。用户关闭后不会循环弹出；健康 Core 启动时立即清除。Bootstrap 本身未被酒馆助手执行时无法弹窗。正常状态仍全部显示在 Core 原有默认收起的「版本与更新」。源码与缓存均校验固定来源、Commit、路径、SHA-256 和 UTF-8 字节数。更新前验证 candidate/Previous，成功后持久保存 Last，失败回滚；禁用 Bootstrap 会清理它持有的运行实例。

首次安装需联网；离线可恢复已验证缓存。不要清除站点数据来处理更新问题。旧版安装包仍可通过原始 Git 提交追溯，当前安装入口为 1.0.4；已发布的 1.0.3 原字节归档至 tests/fixtures/legacy/ 作为回归样本，历史 Git 提交保持不变。

[验证报告](../../VALIDATION.md)：完整源码运行模拟已覆盖实际版本升级与离线刷新；真实 ST/TT/iOS 尚未验证。

**从 1.0.3 或更早版本升级：** 由于 Bootstrap 自身是固定安装器，不能通过远程 Core/Loader 更新替换。请停用旧版 Bootstrap（旧 Loader/Core 也应保持停用），导入并启用 1.0.4，完整刷新酒馆宿主页面；不要清空缓存或聊天。

## 网络恢复与诊断

- `network`：网络请求失败（含 `Failed to fetch`）；`timeout`：Bootstrap 自身 20 秒定时器已触发并取消请求；`interrupted`：请求异常中断，Bootstrap 自身没有超时或主动取消的证据。三者及 HTTP 408/429/5xx 可有限重试；其他 HTTP 错误立即结束本轮。
- `cancelled`：销毁、重新初始化、脚本或宿主卸载。立即取消请求及重试等待，不显示最终失败弹窗。不能仅凭 `signal is aborted without reason` 推断超时。
- `security`：清单、正式仓库来源、固定 Commit、SHA-256 或 UTF-8 字节数验证失败。拒绝执行，不进行网络重试。
- 自动重试期间显示阶段和尝试次数，最终诊断保留原始错误。并发检查共用一个 Promise；相同清单可复用已经验证的 candidate/Last 字节，仍重新校验。
- 本次针对 Android 原版 SillyTavern 已报告的请求错误；iPhone TT 迁移后发送消息才见到界面和首次检查偶发失败的根因仍未确认。没有按 User-Agent 分支，也没有新增聊天消息、发送按钮或聊天 DOM 触发逻辑。

## 首次加载体验与多线路

首次启用等待启动后立即，将出现「TLE 正在努力加载中，请稍候…」非阻塞通知。进入 Core 后自动清除；失败则由独立诊断弹窗显示原因。冷安装优先 jsDelivr、Fastly jsDelivr，最后回退 GitHub Raw；已有健康 Loader 的更新检查优先官方 Raw 约 5 秒，失败再通过 CDN 查找。固定 Commit 与 SHA-256 等安全校验保持不变。jsDelivr @main 的缓存可能令更新提示滞后，不能保证完全实时。

## v1.0.6：立即显示启动反馈

不再延迟 500ms，Bootstrap 启动立即显示非阻塞「TLE 正在努力加载中，请稍候…」，至少保留约 1.2 秒，加载成功自动消失；失败由已有独立诊断弹窗接管。遇到 WebKit IndexedDB 连接丢失时，有限重建一次并重新执行原操作，仍失败提示用户完全退出重启 TT。缓存完整性、回滚与版本校验不变。
