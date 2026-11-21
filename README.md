
# Tavern Layout Engine (TLE)

A modular layout and interface enhancement engine for SillyTavern and TauriTavern.

酒馆布局引擎 · 由小松鼠 & ChatGPT（小松7）共同开发。

## Project

TLE enhances the Tavern interface with customizable navigation, workspace layouts, chat utilities, diagnostics and optional visual modules.

## Supported Hosts

- SillyTavern (ST)
- TauriTavern (TT)

## Distribution

TLE v0.3.202 is the latest **stable** release, pinned in `latest.json` to an immutable Git commit with SHA-256 and UTF-8 byte count.

- Stable source: `releases/v0.3.202/TLE.js`.
- Manual Tavern Helper import: `releases/v0.3.202/TLE-0.3.202-import.json` (disabled by default; do not enable it alongside another TLE instance).
- Release notes: `releases/v0.3.202/CHANGELOG.md`.
- Test channel: `channels/test.json` points to the same verified v0.3.202 release. The headless Remote Loader 0.3.0 remains test-only; it has not been promoted to a stable loader.

v0.3.202 merges the ChatSurface-compatible Fade Engine, the improved floor-range controls and native chat shortcuts with an **opt-in** navigation repair for themes that hide or distort native drawer icons. Icon opacity is adjustable from 40% to 100% (default 70%) only when that compatibility repair is enabled; ordinary themes retain their own icon opacity. The diagnostic button remains fixed in the upper-right on mobile, using Top Layer when possible and a document-root fallback otherwise.

Validation includes source/package checks, isolated compatibility toggle and chat-range command tests, and static integrity/diagnostic regressions. The earlier navigation hitbox repair was manually confirmed under the problem theme. Full v0.3.202 cross-device ST/TT runtime regression is not yet exhaustive.

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

Stable TLE v0.3.202 is published; older releases remain versioned under `releases/`. Remote Loader 0.3.0 remains test-only. See `latest.json`, `channels/test.json`, `releases/v0.3.202/CHANGELOG.md`, `loader/README.md`, `tests/tle-regression.test.mjs` and `loader/verify-stable-release.mjs`.

## Release records and script documentation

- Keep one `CHANGELOG.md` per TLE release under `releases/vX.Y.Z/`. Append later corrections to that release's history; do not rewrite or discard previous entries.
- Keep loader and auxiliary-script histories under `loader/` or their own versioned folders. Record feature additions, behavior changes, bug fixes, compatibility changes, and release-metadata corrections.
- Every Tavern Helper `type: script` package must include a single-line Markdown `info` value with the script name, a concise function summary, usage steps, cautions, and author name. The `info` value must contain no line breaks and no escaped `\n` sequences.
- Before publishing a stable pointer, run `node loader/verify-stable-release.mjs`; after pushing the release, run `node loader/verify-stable-release.mjs --remote`.

