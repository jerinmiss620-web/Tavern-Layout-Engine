# TLE 自动更新运行时

当前安装入口是 [固定 Bootstrap 1.0.3](bootstrap/TLE-Permanent-Bootstrap-1.0.3.json)。它通过 [独立清单](latest.json) 加载 Loader Runtime v0.3.4；Loader 通过根目录 latest.json 自动维护 Core v0.3.211。

首次迁移只需最后导入一次 Bootstrap，禁用旧独立 Loader/Core 并保留备份；以后常规更新不再导入 JSON，不需要控制台命令。保留旧数据库、LKG/Previous 和用户设置。两个更新层共用默认开启的自动安装开关。

更新信息和操作全部位于原有 TLE「版本与更新」折叠区域。失败保留或回滚旧版；成功以实际运行版本和可读回的持久缓存为准。

- [安装说明](bootstrap/README.md)
- [Loader 变更日志](runtime/v0.3.4/CHANGELOG.md)
- [统一发布流程](../RELEASING.md)
- [验证范围与未验证项](../VALIDATION.md)

旧 Stable/Test Loader 的回归测试样本移至 `tests/fixtures/legacy/`；旧 Test 通道清单只为已安装旧 Loader 保持兼容。不要重新安装旧 Loader，更不要与当前 Bootstrap 同时启用。SHA-256 和固定 Commit 防止内容/地址不一致，不是发行者数字签名；信任根仍为此 GitHub 仓库。

Bootstrap 1.0.3 在启动不成功时独立显示错误弹窗，可复制 Loader/Core 阶段、错误详情和设备 User-Agent。不能代替尚未执行的酒馆助手脚本本身；如果无布局也无弹窗，请先检查酒馆助手是否执行脚本。
