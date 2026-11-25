# TLE 整理侠配套服务端 · 1.1.0-tle.1

来源：Global Batch Replace v1.1.0，提交 6b4ab84。安装到 SillyTavern 根目录的 `plugins/global-batch-replace/`，在 config.yaml 开启 `enableServerPlugins: true` 并重启。

定制酒馆缺少依赖时在此目录运行 `npm ci --omit=dev`。TauriTavern 不安装此插件。

保留原 API、用户目录隔离、字段白名单、备份/恢复和扫描算法。为 TLE v0.3.234 增加扫描文件指纹、ZIP 导入、指定文件恢复、逐项错误记录。旧 namespace 与旧备份不清理；已存在备份拒绝覆盖。

ZIP 导入只接受同一用户资料根目录导出的包。原 v1.1.0 历史备份仍可查看/恢复，重新导出后可使用本版导入。恢复会检查当前文件与备份预期哈希，存在新修改时先停下，只有明确确认才跳过冲突恢复其余所选文件。

完整来源与许可见同目录 `CREDITS.md`。
