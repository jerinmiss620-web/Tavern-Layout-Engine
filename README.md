
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

The Remote Loader TEST 0.3.0 is headless: it loads TLE through an immutable classic script URL with Subresource Integrity, retains IndexedDB rollback caches, and uses native confirmation for updates. The test channel offers TLE v0.3.194 with window-capture diagnostic click handling, a visible non-Popover fallback, a wired mobile debugger action, and a self-repairing button lifecycle. The release manifest is checked for exact 40-character immutable commit paths and source integrity. Critical mobile controls must never be placed in unverified bottom-corner or host-controlled dead zones. The release remains test-only; the stable pointer is unchanged until ST and TT validation is complete.

## Repository Structure

```text
Tavern-Layout-Engine/
├── README.md
├── latest.json
├── loader/
└── releases/
```

## Development Status

Remote update infrastructure (headless Loader 0.3.0) and TLE Host Diagnostics 2.0 reliability fixes are in test validation. See `loader/README.md`, `loader/CHANGELOG-0.3.0.md`, `releases/v0.3.194/CHANGELOG.md` and `tests/tle-regression.test.mjs` for details.

The existing stable installation remains unchanged until the new loader passes compatibility tests.
