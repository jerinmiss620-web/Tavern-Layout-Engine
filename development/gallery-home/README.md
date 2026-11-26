# Freesia Gallery · 首页角色画廊 v0.1.1 TEST

独立测试模块。只处理 SillyTavern 欢迎首页的角色画廊，不接入 TLE Core，不修改 Bootstrap、导航栏、整理侠、信息站或正式频道。

## 本版修正

上一版错误地把角色入口压缩成只有头像、名字、一句话和日期的小摘要卡。本版改回昨天确定的角色画廊形态：

- PC 端以角色画廊网格展示，角色头像明显放大；继续复用原生 \`.recentChat\`、\`.avatar\`、\`.recentChatInfo\`、\`.chatNameContainer\`、\`.chatMessageContainer\`、\`.chatActions\`、\`.chatStats\` 和原生按钮类名。
- 每个角色只显示一个代表入口，代表该角色最近活动的聊天；卡片保留角色名、聊天标题、时间、最后一条消息的完整接口预览（不再截成 150 字）、消息数、文件大小、置顶/重命名/删除按钮。
- 头像节点优先从对应原生最近聊天条目克隆，以继承主题作者对头像的装饰；点击卡片主体转发到原生最近聊天条目的点击事件。
- 点击“X 个聊天”展开该角色在当前原生最近聊天范围内的全部聊天记录。每条会话保留标题、日期、消息预览、消息数、文件大小及原生置顶/重命名/删除操作；所有操作转发给原生 DOM 上已有的监听器，不复制或伪造酒馆业务逻辑。
- 群聊也保留为独立聚合入口，不再被静默丢弃。
- 手机端不照搬 PC 多列画廊；821px 以下使用单列、缩小头像的列表式布局，继续继承主题头像外观。
- 原生首页、标题栏、快捷入口、显示/隐藏最近聊天按钮和齿轮设置入口全部保留；随时可切回原生最近聊天，也可完全停用并恢复。

## 与原生 Recent Chats Settings 同步

不创建第二套设置，也不写入另一份设置数据。

直接读取酒馆账号存储中的 \`recentChatsSettings\`，字段为 \`maxDisplayed\` 和 \`collapsedDisplayed\`：

- Max recent chats：作为 \`POST /api/chats/recent\` 的 \`max\` 参数，限制参与聚合的聊天窗口数量。
- Collapsed recent chats：控制画廊首页初始显示的角色/群组入口数量；点“展开全部角色”显示其余入口。
- 继续使用原生 \`.recentChatsSettings\` 齿轮及酒馆原生 Recent Chats Settings 弹窗。保存后酒馆刷新欢迎首页，画廊监听到首页节点替换并重新读取同一份设置。
- 置顶数据同样读取原生账号存储 \`pinnedChats\`，并传给原生聊天列表接口。

截图中“Max recent chats = 15 / Collapsed recent chats = 1”是酒馆原生设置弹窗。它不是欢迎首页初始 DOM 的一部分，而是点击齿轮后由原生代码动态创建的弹窗，所以只提取欢迎首页 DOM 时不会看到弹窗内部结构。本版保留原生齿轮与弹窗，不另造设置窗口。

## 加载测试

在酒馆首页 Console 执行：

    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/gh/jerinmiss620-web/Tavern-Layout-Engine@e57e3ebbed8ec2f4d5c858babc734efbf60fe55d/development/gallery-home/Freesia-Gallery-Home-0.1.1.js';
    s.onload = () => console.log('Freesia Gallery loaded', window.FreesiaGalleryHome);
    s.onerror = (error) => console.error('Freesia Gallery failed to load', error);
    document.head.appendChild(s);

控制台：

- \`window.FreesiaGalleryHome.refresh()\`：重新读取并刷新。
- \`window.FreesiaGalleryHome.toggleView()\`：画廊/原生最近聊天切换。
- \`window.FreesiaGalleryHome.getSettings()\`：查看本次实际读取的原生设置。
- \`window.FreesiaGalleryHome.stop()\`：停用并恢复原生首页。
- \`window.FreesiaGalleryHome.start()\`：重新启用。

## 当前边界

当前版本只完成首页角色画廊、首页会话展开和原生设置同步；不做独立角色详情页、角色卡编辑跳转或 TLE 集成。角色卡编辑仍由酒馆原生角色管理面板负责，后续只提供跳转入口，不重造角色管理系统。

作者：小松鼠 & ChatGPT（小松7）。
