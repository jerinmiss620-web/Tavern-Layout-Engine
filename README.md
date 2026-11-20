
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

The Remote Loader TEST 0.2.0 supports user-authorized startup restoration from a verified Last Known Good cache and manual-confirmed updates. The test channel now offers TLE v0.3.192 with Host Diagnostics 2.0: one-click pre-interaction environment/layout capture and clipboard export. Both remain test-only; the stable release pointer is unchanged until ST and TT validation is complete.

## Repository Structure

```text
Tavern-Layout-Engine/
├── README.md
├── latest.json
├── loader/
└── releases/
```

## Development Status

Remote update infrastructure and TLE Host Diagnostics 2.0 are in test validation. See `loader/README.md` and `releases/v0.3.192/CHANGELOG.md` for details.

The existing stable installation remains unchanged until the new loader passes compatibility tests.
