
# Tavern Layout Engine (TLE)

A modular layout and interface enhancement engine for SillyTavern and TauriTavern.

酒馆布局引擎 · 由小松鼠 & ChatGPT（小松7）共同开发。

## Project

TLE enhances the Tavern interface with customizable navigation, workspace layouts, chat utilities, diagnostics and optional visual modules.

## Supported Hosts

- SillyTavern (ST)
- TauriTavern (TT)

## Optional Preview — Permanent Bootstrap for Loader Self-Updates

The installed standalone Stable Loader cannot rewrite its own Tavern Helper script. To end repeated Loader JSON imports, the **opt-in Bootstrap 1.0.0** is now available at [loader/bootstrap/TLE-Permanent-Bootstrap-1.0.0.json](loader/bootstrap/TLE-Permanent-Bootstrap-1.0.0.json).

**One-time migration:** keep old scripts as disabled backups; disable the standalone Stable/Test Loader and standalone Core, enable the Bootstrap, and refresh. The Bootstrap verifies and retrieves the latest Loader Runtime through [loader/latest.json](loader/latest.json). The Loader Runtime then manages TLE Core through the independent root [latest.json](latest.json). Both update layers share the default-enabled auto-install preference; complete checks and rollback are retained.

The Bootstrap and Loader runtime are **testing candidates**, with ST/TT/iOS runtime validation outstanding. The stable TLE Core pointer remains v0.3.203. See [Bootstrap instructions](loader/bootstrap/README.md) and [Loader v0.3.3 changelog](loader/runtime/v0.3.3/CHANGELOG.md). Do not run old Loader and Bootstrap simultaneously.

## Distribution

TLE **v0.3.203** is the current stable release, published through `latest.json` with immutable Git commit, SHA-256 and UTF-8 size verification. **Stable Loader 0.3.1** restores the requested in-panel version and update workflow without adding a separate Loader floating panel.

- Install once: `loader/TLE-Remote-Loader-Stable-0.3.1.json` in Tavern Helper; disable the old Test Loader 0.3.0 before enabling the stable one. It uses the previously established IndexedDB LKG/Previous caches for safe migration.
- TLE stable source: `releases/v0.3.203/TLE.js`; optional one-time manual bootstrap import: `releases/v0.3.203/TLE-0.3.203-import.json`.
- TLE panel now displays the current **running** version, Stable Loader connection, "检查更新", and a green "可更新 · vX" action next to the version; Engine Hub shows a green update dot when an update is available.
- Startup performs **silent checks only**. Downloading, SHA-256 verification, cached rollback and immutable script loading remain Loader-owned. **Installation requires a user click and browser confirmation; never silent auto-install.**
- A previously imported standalone TLE can be handed to the Stable Loader using the in-panel "启用 Loader 接管" action when its version matches the verified remote version. The user must then disable the standalone TLE script to avoid duplicate startup; keep a backup copy disabled.
- **First-time bootstrap note:** a Loader with no verified last-known-good cache will not replace a live standalone TLE of another version. Bring standalone TLE to the current release once, then click "启用 Loader 接管"; or initialize through Loader when no standalone TLE is active. This preserves the rollback safety gate.
- The headless Test Loader 0.3.0 is still test-channel-only (`channels/test.json`); it should not run alongside Stable Loader 0.3.1.

The mobile diagnostics button remains anchored top-right using Top Layer / fixed document-root fallback, unchanged by this release. Static and isolated update checks have passed; live ST/TT/iPhone migration still requires maintainer validation.

### Migration from older Test Loader / Core v0.3.198

Test channel currently provides **TLE v0.3.204 TEST**, while the stable channel remains **v0.3.203** pending user runtime validation. The previous Test Loader 0.3.0 restores a verified older TLE from IndexedDB before checking the test manifest. A toast about restoring v0.3.198 is **not** evidence that an update completed, and Core v0.3.198 does not contain the new in-panel update controls.

To request the already-installed Test Loader to verify and install v0.3.204, open the Tavern host DevTools console and run:

```js
window.__TLE_REMOTE_LOADER_TEST_V1__?.checkRemote()
```

This prompts through the old Loader after source verification; no new TLE JSON import is needed if its LKG cache and upgrade checks succeed. If no confirmation appears, inspect `window.__TLE_REMOTE_LOADER_TEST_V1__?.diagnostics?.lastStatus` for a concrete failure. TLE v0.3.204 adds in-panel handling for both legacy Test Loader and Stable Loader. The legacy Test Loader may prompt when checking; Stable Loader checks silently. Do not run both loaders at once.

## Repository Structure

```text
Tavern-Layout-Engine/
├── README.md
├── latest.json
├── channels/
├── loader/
├── releases/
└── tests/
```

## Development Status

Stable TLE v0.3.203 and Stable Loader 0.3.1 are published; the test channel now offers TLE v0.3.204 compatible with existing Test Loader 0.3.0. See `latest.json`, `releases/v0.3.203/CHANGELOG.md`, `loader/CHANGELOG-Stable-0.3.1.md`, `tests/tle-loader-stable.test.mjs` and `loader/verify-stable-release.mjs`.

## Release records and script documentation

- Keep one `CHANGELOG.md` per TLE release under `releases/vX.Y.Z/`. Append later corrections to that release's history; do not rewrite or discard previous entries.
- Keep loader and auxiliary-script histories under `loader/` or their own versioned folders. Record feature additions, behavior changes, bug fixes, compatibility changes, and release-metadata corrections.
- Every Tavern Helper `type: script` package must include a single-line Markdown `info` value with the script name and explicitly marked **简介 / 使用方式 / 注意事项 / 作者** sections. The `info` value must contain no line breaks and no escaped `\n` sequences.
- The CI release-metadata check (`node tests/tle-release-metadata.test.mjs`) requires a per-version changelog and all four `info` sections for current stable/test TLE packages and Stable Loader.
- Before publishing a stable pointer, run `node loader/verify-stable-release.mjs`; after pushing the release, run `node loader/verify-stable-release.mjs --remote`.

