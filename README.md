
# Tavern Layout Engine (TLE)

A modular layout and interface enhancement engine for SillyTavern and TauriTavern.

酒馆布局引擎 · 由小松鼠 & ChatGPT（小松7）共同开发。

## Project

TLE enhances the Tavern interface with customizable navigation, workspace layouts, chat utilities, diagnostics and optional visual modules.

## Supported Hosts

- SillyTavern (ST)
- TauriTavern (TT)

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

Stable TLE v0.3.203 and Stable Loader 0.3.1 are published; Test Loader 0.3.0 remains test-only. See `latest.json`, `releases/v0.3.203/CHANGELOG.md`, `loader/CHANGELOG-Stable-0.3.1.md`, `tests/tle-loader-stable.test.mjs` and `loader/verify-stable-release.mjs`.

## Release records and script documentation

- Keep one `CHANGELOG.md` per TLE release under `releases/vX.Y.Z/`. Append later corrections to that release's history; do not rewrite or discard previous entries.
- Keep loader and auxiliary-script histories under `loader/` or their own versioned folders. Record feature additions, behavior changes, bug fixes, compatibility changes, and release-metadata corrections.
- Every Tavern Helper `type: script` package must include a single-line Markdown `info` value with the script name, a concise function summary, usage steps, cautions, and author name. The `info` value must contain no line breaks and no escaped `\n` sequences.
- Before publishing a stable pointer, run `node loader/verify-stable-release.mjs`; after pushing the release, run `node loader/verify-stable-release.mjs --remote`.

