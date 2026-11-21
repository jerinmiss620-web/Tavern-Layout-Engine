
# Tavern Layout Engine (TLE)

A modular layout and interface enhancement engine for SillyTavern and TauriTavern.

酒馆布局引擎 · 由小松鼠 & ChatGPT（小松7）共同开发。

## Project

TLE enhances the Tavern interface with customizable navigation, workspace layouts, chat utilities, diagnostics and optional visual modules.

## Supported Hosts

- SillyTavern (ST)
- TauriTavern (TT)

## Distribution

A versioned remote-update system based on Tavern Helper scripts is now in test.

The headless Remote Loader 0.3.0 remains a test-channel bootstrapper. Stable TLE v0.3.195 is published through `latest.json` and adds TT ChatSurface-compatible Fade Engine rendering without inserting unmanaged direct-child nodes into `#chat`. The release also replaces the floor-zero spacer node with calculated chat padding and retains the existing quick-return-to-bottom behavior. The maintainer manually verified TT virtualized-chat operation, fade rendering, chat scrolling, message generation, chat/theme switching and layout restoration. On 2026-11-21, the stable manifest SHA-256 metadata was corrected and the fixed-commit source was verified in-browser; the no-refresh Blob bootstrap and Tavern Helper enable/disable behavior were manually confirmed. The separate test channel is advanced to v0.3.196 for chat-tool UX and optional navigation-compatibility testing; this does not change the stable v0.3.195 pointer. The v0.3.196 runtime regression pass is pending. The stable source is pinned to an immutable Git commit and verified by SHA-256 and UTF-8 byte size.

## Repository Structure

```text
Tavern-Layout-Engine/
├── README.md
├── latest.json
├── loader/
└── releases/
```

## Development Status

Stable TLE v0.3.195 remains available; test-channel TLE v0.3.196 is available for runtime validation. The headless Remote Loader 0.3.0 remains test-only and is not promoted by this release. See `latest.json`, `releases/v0.3.195/CHANGELOG.md`, `loader/README.md` and `tests/tle-regression.test.mjs` for release details.

## Release records and script documentation

- Keep one `CHANGELOG.md` per TLE release under `releases/vX.Y.Z/`. Append later corrections to that release's history; do not rewrite or discard previous entries.
- Keep loader and auxiliary-script histories under `loader/` or their own versioned folders. Record feature additions, behavior changes, bug fixes, compatibility changes, and release-metadata corrections.
- Every Tavern Helper `type: script` package must include a single-line Markdown `info` value with the script name, a concise function summary, usage steps, cautions, and author name. The `info` value must contain no line breaks and no escaped `\n` sequences.
- Before publishing a stable pointer, run `node loader/verify-stable-release.mjs`; after pushing the release, run `node loader/verify-stable-release.mjs --remote`.

