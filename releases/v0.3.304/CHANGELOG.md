# v0.3.304

- 建立 Core Module Kernel：注册、依赖拓扑、生命周期、替换与错误隔离。
- 建立独立 Module Loader：Manifest 校验、固定 Commit、SHA-256、字节数验证、IndexedDB 缓存与 Last Known Good 回滚。
- 将 HD Avatar Engine 4.5.14 包装为 `avatar.hd` 独立模块试点，模块版本 `1.0.0`；Test 通道启用，Stable Manifest 保持空清单。
- 保留 Core 内置头像引擎 fallback，TT 继续绕过头像替换。
- 自动化回归通过；ST/TT 真实设备验收仍待完成。此提交位于 Draft PR 分支，未发布到正式 main。
