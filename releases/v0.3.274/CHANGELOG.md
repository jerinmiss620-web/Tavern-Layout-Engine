# Core v0.3.274 TEST · 渐隐侠识别主题 CSS 背景

## 本次修复

修复渐隐侠将 #bg1 视为唯一背景来源的问题，支持不依赖酒馆壁纸、直接由主题 CSS 绘制背景的主题。

- **背景来源识别：** 检查 body 与 html 的计算背景，支持 background-image、linear-gradient 和非透明 background-color。
- **模式优先级：** 主题明确设置 body/html CSS 背景图（包括渐变）时优先使用页面原生背景；只有酒馆默认纯色底色时，仍优先使用实际可见的 #bg1 壁纸。
- **壁纸有效性：** 忽略 display:none、visibility:hidden、opacity:0 或没有有效尺寸的 #bg1 层，避免镜像不可见壁纸。
- **原生背景模式：** 不复制 body/html 背景，不创建壁纸伪元素，只保留 #chat 的上下透明渐隐遮罩，让原背景自然透出。
- **主题切换：** 背景监听不再依赖 #bg1；独立观察 html/body 属性、页面样式表变化，并在 #bg1 出现、移除或替换时重新识别。
- **主题保护：** 如果 #chat 自身仍有背景装饰，只启用遮罩，不覆盖其背景。
- **性能：** 继续使用 MutationObserver、ResizeObserver 与 requestAnimationFrame；不增加定时轮询，不插入聊天 DOM 子节点。

保留原有壁纸镜像路径、毛玻璃兼容、上下渐隐与底部留白选项。仅更新测试通道，待实机验收后再进入正式版。
