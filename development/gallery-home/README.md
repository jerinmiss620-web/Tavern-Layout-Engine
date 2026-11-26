# Freesia Gallery · 首页角色画廊 v0.2.1 TEST

独立测试模块。当前只改造 SillyTavern 欢迎首页，不接入 TLE Core，不修改 Bootstrap、导航栏、整理侠、信息站或正式频道。

## 产品结构

### 1. 首页角色画廊

- 以酒馆完整角色列表为数据源；即使角色没有最近聊天，也保留角色卡。
- 网格列数可选 2、3、4 列，任何屏幕宽度都不会自动增加到 4 列以上；当前列数由独立设置控制。
- 每页行数可选 1～15 行，默认 3 行；每页最多创建 60 张角色卡（4 列 × 15 行），通过分页浏览完整角色库，避免一次性创建全部卡片 DOM。
- 每页设置保存在独立的账号存储键 `freesiaGallerySettings`，不覆盖酒馆原生 Recent Chats Settings。
- 角色头像统一使用 3:4 竖版比例，图片使用 `object-fit: cover`；画廊卡片与详情页头像采用相同约束。
- 卡片上半区（头像、角色名、聊天数量）点击进入我们自己的角色详情页。
- 卡片下半区（最近聊天日期、聊天预览）点击直达该角色最近一次聊天。
- 最近聊天预览最多两行；显示日期、消息数、文件大小。
- 原生置顶、重命名、删除按钮直接转发给酒馆原生最近聊天 DOM 上的按钮监听器，不复制酒馆的业务逻辑。
- 聊天数量通过 `POST /api/characters/chats` 的 `simple: true` 延迟读取；只为当前可见卡片读取，避免首页一次性请求所有角色。
- 没有最近聊天的角色仍显示卡片，日期显示占位符、预览显示“暂无最近聊天记录”，不会伪造最近聊天入口。

### 2. 角色详情页

点击角色卡上半区进入独立详情页：

- 左侧显示角色头像。
- 右侧显示角色名称、角色主世界书绑定名称（未绑定时不显示）。
- 角色描述以只读 textarea 展示，沿用酒馆 `#description_textarea` 的原生类名、内联样式及可读取的计算高度（不复制其 ID），优先继承 `.text_pole` 与当前主题。
- “详情/管理”按钮只负责跳转到酒馆原生角色编辑界面：调用原生 `selectCharacterById(index, { switchMenu: true })`。角色编辑、世界书绑定管理等全部归酒馆原生界面负责，本项目不重造管理功能。
- 下方显示该角色的聊天文件总数、最新聊天及其他聊天记录。
- 最新聊天和会话条目点击后打开对应聊天。

### 3. 聊天文件页

- 从详情页的“聊天文件”进入。
- 使用酒馆原生 `POST /api/chats/search` 读取该角色全部聊天文件的名称、时间、预览、消息数和文件大小。
- 提供文件名与预览内容搜索。
- 点击任意聊天文件打开对应聊天；若聊天不在首页最近聊天范围内，则使用酒馆上下文的 `selectCharacterById` 和 `openCharacterChat` 打开。

## 原生设置和原生能力

- 欢迎首页顶部隐藏 SillyTavern Logo 和版本号，使用「角色画廊 / 角色详情 / 聊天文件」作为一级标题；原生显示/隐藏最近聊天、Recent Chats Settings 齿轮与画廊/原生视图切换仍保留。
- 返回按钮放在次级标题行，避免与页面标题挤在一起；原生快捷入口保留。
- 直接读取账号存储 `recentChatsSettings`：
  - `maxDisplayed`：传给 `POST /api/chats/recent` 的 `max`，决定用于最近聊天预览与排序的聊天文件数量。
  - `collapsedDisplayed`：仅由酒馆原生最近聊天列表使用，不再控制画廊显示数量。
- 直接读取原生 `pinnedChats`，置顶聊天对应的角色卡优先排序。
- 顶栏增加画廊/原生最近聊天切换入口。原生模式下原始最近聊天列表和群聊仍可访问。
- 详情页会话列表与聊天文件列表使用酒馆原生 `.recentChat` / `.recentChatList` 结构及其子类（`.recentChatInfo`、`.chatNameContainer`、`.chatMessageContainer`、`.chatStats`），不另造卡片底色、边框或圆角。
- 停用脚本会移除新增 DOM、CSS、事件监听，并恢复原生首页；不会改写酒馆角色数据或聊天文件。

## 独立加载测试

在酒馆首页 Console 执行：

    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/gh/jerinmiss620-web/Tavern-Layout-Engine@952ae6e4a6fb608b18ecbe65206581ed5725866a/development/gallery-home/Freesia-Gallery-Home-0.2.1.js';
    s.onload = () => console.log('Freesia Gallery loaded', window.FreesiaGalleryHome?.version);
    s.onerror = error => console.error('Freesia Gallery failed to load', error);
    document.head.appendChild(s);

控制台接口：

- `window.FreesiaGalleryHome.refresh()`：重新读取首页最近聊天与角色卡。
- `window.FreesiaGalleryHome.toggleView()`：画廊/原生最近聊天切换。
- `window.FreesiaGalleryHome.openDetail('角色头像文件名.png')`：打开指定角色详情。
- `window.FreesiaGalleryHome.openFiles()`：打开当前角色聊天文件页。
- `window.FreesiaGalleryHome.getSettings()`：查看当前读取的原生最近聊天设置。
- `window.FreesiaGalleryHome.getPage()`：查看当前页面。
- `window.FreesiaGalleryHome.stop()`：停用并恢复原生首页。
- `window.FreesiaGalleryHome.start()`：重新启用。

## 当前边界

- 本版只处理首页画廊、角色详情和聊天文件浏览。
- 画廊每页最多 15 行；更大的角色库通过分页访问，不会一次性把全部角色卡放进 DOM。
- 角色管理、角色资料编辑、世界书绑定编辑均跳转酒馆原生界面，不在本项目内实现。
- 群聊仍保留在原生最近聊天模式中；本版画廊主体展示单角色卡。
- 暂不与 TLE 整合，先独立完成视觉与交互验收。

作者：小松鼠 & ChatGPT（小松7）。
