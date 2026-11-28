# TLE 历史回归测试样本

此目录保存自动化测试仍需要的历史版本原始字节，**不是安装或下载入口**。

旧 Core、Stable/Test Loader、旧 Bootstrap 的原版脚本与导入包从发布版本目录迁入此处，只供自动化回归、旧缓存迁移、回退和诊断相关测试使用。每个样本应至少有一项明确的测试引用；没有测试引用的历史副本不在这里长期保留。

历史正式版本在 `releases/v*/` 仅保留 `CHANGELOG.md`，当前正式版本保留完整源码和禁用状态安装包；历史 Git Commit 不做重写。

请使用 [仓库首页](../../../README.md) 的当前 Bootstrap 安装方式。

## 保留样本

- `bootstrap-v1.0.0.js/json`、`bootstrap-v1.0.2.js/json`：旧版启动、忙碌重试及存储兼容回归。
- `bootstrap-v1.0.4.js/json`：历史诊断弹窗行为回归。
- `core-v0.3.203.js/json`、`core-v0.3.204.js/json`、`core-v0.3.205.js`、`core-v0.3.207.js`、`core-v0.3.260.js`：旧 Core 结构、兼容迁移及诊断回归。
- `stable-loader-v0.3.1.js/json`、`stable-loader-v0.3.2.js/json`、`test-loader-v0.3.0.js/json`、`runtime-v0.3.3.js`：旧更新链与缓存迁移回归。
- `mask-hero-test-core-v0.3.302.js`：已归档的 Mask Hero 测试 Core；仅供兼容性回归，不作为安装入口。
- `mask-hero-test-loader-v0.3.0.js/json`：Mask Hero 独立测试 Loader 与匹配安装包的原始字节，仅供通道兼容回归。

不要重新安装这些历史样本。当前正式安装入口、版本和更新说明以仓库首页及正式清单为准。
