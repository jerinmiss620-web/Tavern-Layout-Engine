# TLE 历史回归测试样本

此目录保存自动化测试仍需要的历史版本原始字节，**不是安装或下载入口**。

旧 Core、Stable/Test Loader、旧 Bootstrap 的原版脚本与导入包从发布版本目录迁入此处，只供 `npm test`、旧缓存迁移、回退和诊断相关测试使用。

历史正式版本在 `releases/v*/` 仅保留 `CHANGELOG.md`，当前正式版本仍保留完整源码和安装包；历史 Git Commit 不做重写。

请使用 [仓库首页](../../../README.md) 的当前 Bootstrap 安装方式。

Bootstrap 1.0.2 的源码与安装包用于保留旧版忙碌重试回归；Bootstrap 1.0.3 的源码与安装包保留原字节，供历史诊断弹窗回归；当前安装版本为 1.0.4。

- `bootstrap-v1.0.4.js/json`：已发布 Bootstrap v1.0.4 原字节样本，验证旧版弹窗行为。
- `loader-v0.3.4.js`：已发布 Loader Runtime v0.3.4 原字节样本，保留历史对照。
