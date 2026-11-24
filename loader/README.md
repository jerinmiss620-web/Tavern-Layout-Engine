# TLE 自动更新运行时

当前安装入口是 [固定 Bootstrap 1.0.6](bootstrap/TLE-Permanent-Bootstrap-1.0.6.json)。它通过 [独立清单](latest.json) 加载 Loader Runtime v0.3.6；Loader 通过根目录 latest.json 自动维护 Core v0.3.217。

首次迁移只需最后导入一次 Bootstrap，禁用旧独立 Loader/Core 并保留备份；以后常规更新不再导入 JSON，不需要控制台命令。保留旧数据库、LKG/Previous 和用户设置。两个更新层共用默认开启的自动安装开关。

更新信息和操作全部位于原有 TLE「版本与更新」折叠区域。失败保留或回滚旧版；成功以实际运行版本和可读回的持久缓存为准。

- [安装说明](bootstrap/README.md)
- [Loader 变更日志](runtime/v0.3.6/CHANGELOG.md)
- [统一发布流程](../RELEASING.md)
- [验证范围与未验证项](../VALIDATION.md)

旧 Stable/Test Loader 的回归测试样本移至 `tests/fixtures/legacy/`；旧 Test 通道清单只为已安装旧 Loader 保持兼容。不要重新安装旧 Loader，更不要与当前 Bootstrap 同时启用。SHA-256 和固定 Commit 防止内容/地址不一致，不是发行者数字签名；信任根仍为此 GitHub 仓库。

Bootstrap 1.0.6 对临时网络失败、请求超时、未知来源中断及 HTTP 408/429/5xx 最多尝试三次，销毁/卸载立即取消，来源或 SHA-256 等安全校验失败不重试。失败后沿用独立诊断弹窗，可复制阶段、次数、错误类型、具体原因和设备 User-Agent；已有健康版本不因检查失败而被替换。不能代替尚未执行的酒馆助手脚本本身；如果无布局也无弹窗，请先检查酒馆助手是否执行脚本。

多线路下载：Loader/Core 清单与固定 Commit 源码优先 CDN，备用 GitHub Raw；健康实例会优先短暂核对官方 Raw 清单。下载镜像不改变 Manifest 可信路径与 SHA-256 校验。首次启动立即出现、至少短暂显示约 1.2 秒的非阻塞加载中提示；成功自动消失。

WebKit IndexedDB 连接错误处理：仅在明确连接断开时重建并重试一次；始终读回并校验缓存；普通配额错误不得重试或降级安全措施。
