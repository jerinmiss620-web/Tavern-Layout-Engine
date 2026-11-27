# Core v0.3.276 TEST · 桃mini高清头像引擎整合

## 整合内容

- 基于桃mini《哇！头像变清晰啦！》v4.5.13，在作者明确同意后将升级后的完整高清头像能力整合进 TLE；README、更新日志与源码均保留作者署名。
- ST 自动启用，覆盖聊天 Char/User 头像、角色列表、角色预览、User 身份列表，以及 TLE 首页记录预览和记录详情。
- 保留原图 URL、缓存刷新令牌、srcset/sizes 管理、动态头像更新、失败回退和卸载恢复；保留原图 loading/decoding 属性。
- 共享 `__hdAvatar459Cleanup` 实例入口，避免 TLE 与桃mini独立版同时运行两套头像 URL 引擎；TLE 接管时先清理旧实例。
- TT 检测到 `__TAURITAVERN__` / `__TAURI_RUNNING__` 后不启动引擎，完全交给 TT 原生高清头像。
- AvatarDeblur 已改写成 `/characters/` 或 `/User%20Avatars/` 的 URL 可被引擎幂等接管；TLE 不包装 fetch，也不改写背景图。
- 识别旧版 260402 的 `hd-avatar-styles` / `hd-avatar-layer-*` 标记；只避开该脚本接管的聊天头像，其余 TLE 头像区域继续处理。
- 单个 MutationObserver + requestAnimationFrame 合并更新；不增加轮询、Canvas、滤镜或独立全局扫描器。

## 验证边界

自动化模拟覆盖全部目标选择器、动态新增头像、TT 跳过、独立桃mini实例交接、AvatarDeblur直链兼容、旧版图层隔离、失败回退及卸载恢复。AvatarDeblur 与旧版图层脚本未在实机启用；兼容结论以源代码审查和模拟测试为准，仍需 ST/TT 实机验收。

仅更新开发测试分支；正式 Core、Stable Loader 与 Bootstrap 不变。
