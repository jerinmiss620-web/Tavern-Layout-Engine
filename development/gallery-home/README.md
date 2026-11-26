# Freesia Gallery · 首页画廊原型 v0.1.0 TEST

本目录只包含独立首页画廊原型，不接入 TLE Core，不修改 Bootstrap、导航栏、整理侠、信息站或正式频道。

## 本轮范围

- 读取酒馆聊天列表并按角色头像文件名聚合。
- 首页以角色卡片展示角色头像、角色名、聊天数量、最近聊天标题、最后一条消息预览和最近活动日期。
- 点击角色卡片打开该角色最近一次聊天。
- 提供原生最近聊天／角色画廊切换按钮，随时可以对照原生首页。
- 保留原生 welcomePanel、标题栏、快捷入口和原生最近聊天 DOM；画廊停用后恢复原生列表。
- 复用 recentChat、avatar、recentChatInfo、chatNameContainer、chatMessageContainer、chatStats 等原生结构类名，让主题继续接管头像和控件视觉。

## 数据来源

优先通过 SillyTavern 扩展上下文调用 POST /api/chats/recent，不传 max，读取接口返回的全部聊天记录，再按 avatar 聚合。原生 DOM 中的 .recentChat.hidden 表示原生首页折叠显示的后续条目，不代表聊天被删除；接口模式不依赖这个 CSS 隐藏状态。

当前原型只聚合单角色聊天。群聊和没有角色头像的根目录聊天暂不放进角色卡片。若当前环境无法访问接口，则退回读取原生首页 DOM；这种模式只会拿到原生最近聊天列表中的条目，结果可能不完整。

## 独立测试

在 SillyTavern／TT 首页打开开发者工具 Console，执行以下代码加载测试脚本：

    const s = document.createElement('script');
    s.src = 'https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/feature/gallery-home-standalone-20261126/development/gallery-home/Freesia-Gallery-Home-0.1.0.js';
    s.onload = () => console.log('Freesia Gallery loaded', window.FreesiaGalleryHome);
    document.head.appendChild(s);

脚本加载后会自动识别原生首页并启动画廊。

控制台操作：

- window.FreesiaGalleryHome.refresh()：重新读取聊天并刷新角色卡片。
- window.FreesiaGalleryHome.toggleView()：在画廊和原生最近聊天之间切换。
- window.FreesiaGalleryHome.stop()：完全停用原型，移除新增 UI 和样式，恢复原生最近聊天。
- window.FreesiaGalleryHome.start()：重新启用。

## 当前边界

- 本版本只做首页角色聚合展示，不做角色详情页、全部聊天窗口列表、角色卡编辑跳转或 TLE 集成。
- 点击角色卡片打开该角色最近一次聊天；角色详情页留待首页验收后再做。
- 全量读取会让服务器检查当前账号下的聊天文件；聊天文件数量特别大时，首次加载可能较慢。
- 脚本不重命名、删除、移动或修改任何聊天文件，也不改动酒馆原生最近聊天设置。

作者：小松鼠 & ChatGPT（小松7）。
