# 统一正式发布流程

使用 Node 24 和有仓库写权限的 Git 凭据。保持独立的 main 发布工作副本，开始时 HEAD 必须等于 origin/main。

1. `npm ci`。
2. **只修改权威开发源码**：完整 Core 位于 `development/organizer/TLE.js`；独立组件分别位于 `development/organizer/batch/`、`development/avatar-engine/avatar-engine.js`、`development/gallery-home/gallery-home.js`。不要直接编辑 `releases/v*/` 中的发布快照。
3. 运行 `npm run build:core`。统一构建器会从 Batch、Avatar、Gallery 三份组件源码重新装配 Core，并保持可重复、幂等；`npm run build:core -- --check` 只检查、不写入。旧命令 `node scripts/build-organizer-content.mjs` 仅作为兼容别名，实际调用统一构建器。
4. 准备变更日志文件，再运行 `node scripts/release.mjs stage core 0.3.305 notes.md` 或 `node scripts/release.mjs stage loader 0.3.7 notes.md`。版本号仅为示例，必须高于当前版本且目录不存在。Core stage 会再次运行统一构建器，从 `development/organizer/TLE.js` 生成新发布源码并更新 `release-plan.json`；**生成后不要再手工修改发布目录**。
5. 运行 `npm run release`。发布前会逐字节核对候选 Core 是否由当前权威开发源码生成，再生成匹配安装包、校验候选版本、运行全部测试、提交不可变产物、取得真实 Commit、计算两份清单中的真实 UTF-8 长度与 SHA-256、再次运行完整测试，最后将产物提交和清单提交在同一次 fast-forward push 中发布到 main。
6. 发布命令随后核验 GitHub 两份远程清单、Commit 固定地址、安装包和源码，并用远程发布字节重放更新链模拟。远程核验失败时命令失败，不宣告发布成功.

两个清单在同一最终提交中激活。已有版本保留原 Commit pin；只有增加版本号的新源码可以获得新 pin。任何缺失清单更新、源码/安装包不匹配、未推进 release-plan、哈希/字节数错误、缺失日志都会使校验失败。发布期间远端 main 有变化时 Git 拒绝非 fast-forward 推送，需整合后重新运行。

分步骤恢复入口：`prepare` 只生成安装包；`pin <artifact-commit>` 核对 Git 中源码字节并生成清单；`verify` 校验本地发布组合；`verify --remote` 核验远端。不要单独推送产物提交到 main。通过 GitHub API 发布时同样先创建不可变产物提交，再创建同时更新两份清单的子提交，最后只移动一次 main 引用。

CI 对 main 和 PR 运行全部测试与清单守卫；main 还核验 GitHub 远端。真实 ST/TT 手动验证范围记录在 VALIDATION.md，不能把源码模拟称为真机通过。

## 历史产物维护

正式发布后，`releases/v*/` 下的历史版本仅保留 `CHANGELOG.md`；当前正式版本保留 `TLE.js` 和可导入 JSON。对自动化回归确有必要的旧源码，按原字节移至 `tests/fixtures/legacy/`，并同步修改测试引用。旧版本不可变 Commit URL 仍可用于检验与追溯，不要重写发布历史。Loader 和 Bootstrap 采用相同原则；兼容旧版的 Test 通道清单暂时保留，不再作为下载入口。`npm test` / `release.mjs verify` 必须同时检查：所有低于当前版本的历史发布目录仅含 `CHANGELOG.md`；当前 Core 目录仅含 `TLE.js`、禁用状态导入 JSON 与 `CHANGELOG.md`；当前 Loader 目录仅含 Loader 源码与 `CHANGELOG.md`。

清理之后必须运行 `npm test` 和远端发布校验，确保主清单、更新链和未来 `scripts/release.mjs` 的模板选取均保持正常。

## 模块化前的源码边界

- `development/organizer/TLE.js` 当前是完整 TLE Core 单体源码，不是 Organizer 单独模块；模块化前不得按目录名推断它只包含整理侠。
- `development/organizer/batch/`、`development/avatar-engine/avatar-engine.js` 与 `development/gallery-home/gallery-home.js` 是独立权威组件源码；Core 中的嵌入区由 `scripts/build-core.mjs` 统一生成。
- `npm run build:core` 是唯一正式构建入口，负责 Batch 打包、Avatar/Gallery 源码装配与版本适配；`--check` 模式不写文件。旧 Organizer 构建命令只保留兼容转发。
- Gallery 源码的组件版本号与 Core 发布版本不是同一概念；构建时只把内嵌副本的 `VERSION` 调整为开发 Core 版本，独立组件源码不被改写。
- `tests/tle-core-build.test.mjs` 对开发 Core、正式 Core 与组件权威源码进行逐字节核验；发布 stage 还会核对候选发布源码是否由开发 Core 生成。
- 后续模块化必须把源码构建、模块清单、版本与哈希校验纳入统一流程；不得手工维护两份互不校验的同名实现.

## 固定 Bootstrap 的紧急修复

Bootstrap 不由 Core/Loader 两份更新清单自动替换。修复 Bootstrap 时必须创建新的不可变版本 JS + 完整匹配的酒馆助手导入 JSON，推进 `release-plan.json.bootstrap`、更新 README/CHANGELOG 并进行所有回归。旧版仅以测试样本形式归档，不能覆盖历史固定源码。引导用户停用旧 Bootstrap、重新导入新版本一次。
