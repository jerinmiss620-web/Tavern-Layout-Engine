# Core v0.3.278 TEST · 旧头像图层所有权判断精确化

## 修复

- 不再把旧脚本的全局样式节点 `hd-avatar-styles` 单独视为所有聊天头像的接管证明；旧脚本可能在已有消息加载后才启用，样式节点存在并不代表每张现有头像都已生成图层。
- 仅当具体聊天头像带有 `data-hd-fixed="true"` 或其 `.mesAvatarWrapper` 内存在 `.hd-avatar-layer-div/.hd-avatar-layer-canvas` 时，TLE 才跳过该图片。
- 增加样式节点存在但没有具体图层时仍正常启用高清头像的回归测试；保留旧图层实际存在时的局部避让测试。
- 同步更新渐隐侠背景测试的 Core 版本断言，避免测试仍固定引用 v0.3.275。

仅更新测试分支；正式 Core、Stable Loader 与 Bootstrap 不变。