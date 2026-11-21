# TLE v0.3.195 — TT ChatSurface Compatibility and Fade Engine Refactor

## ChatSurface / TT virtualized chat compatibility

- Remove TLE-owned direct child nodes from `#chat` for the Fade Engine wallpaper mirror and floor-zero clearance. This avoids adding unmanaged elements to TT's bounded ChatSurface.
- Render the wallpaper mirror through a CSS pseudo-element on `#chat` when an available pseudo-element can be used safely.
- Retain guarded fallback modes for themes that already use both `#chat::before` and `#chat::after`: transparent chat-background rendering where safe, otherwise mask-only fade without overwriting theme decoration.
- Synchronize wallpaper styles and geometry with MutationObserver and ResizeObserver.
- Clear TLE-owned classes, CSS custom properties, observers and animation frames when Fade Engine is disabled or TLE is destroyed.
- Replace the floor-zero spacer node with calculated `#chat` block-start padding. The calculation accounts for the existing chat padding, resident message margin and flex/grid row gap.
- Reduce redundant inline style writes when synchronized values have not changed.
- Keep the existing quick-return-to-bottom behavior unchanged in this release.

## Recovery and lifecycle correction

- Restore the Fade Engine bottom-padding lifecycle helpers required by initialization, settings changes, disable and destroy paths.
- Keep the engine teardown path able to remove Fade Engine state and continue restoring the rest of the TLE layout.
- The first standalone 0.3.195 test package omitted these helpers and must not be used. The published source and release manifest refer to the corrected package that was manually verified.

## Runtime validation

The maintainer's manual regression pass in TauriTavern confirmed:

- TT ChatSurface virtualization remains active without the unmanaged-child stop warning.
- Fade Engine renders and the wallpaper/fade presentation is visible.
- Chat scrolling and new-message generation continue to work.
- Switching chats and themes does not produce the tested layout regressions.
- Disabling/unloading TLE restores the host layout, including the recovery path.

These are manual tests in the maintainer's environment, not an automated certification of every TT/ST version, browser or mobile device.

## Release integrity

- Stable release source is pinned to an immutable Git commit.
- SHA-256 and UTF-8 byte-size values are recorded in `latest.json`.
- The test-channel manifest remains separate; this stable publication does not silently advance the test channel or modify the v0.3.194 release.

## Post-release maintenance — 2026-11-21

### Stable manifest checksum correction

- Corrected `latest.json` `release.sha256` to `8baaf1b92be312eb93e7454787d15a8c7d08627920f2efe64aecf1b4e1aa1f52`. The immutable source commit and URL remain pinned to `5dde2ca7ff2c0b9992be458cf3f802807b8397bf`; the recorded UTF-8 source size remains `454562` bytes.
- The initial stable manifest contained a checksum that did not match the published source, causing the first bootstrap attempt to fail integrity verification. The source and strict verification were not weakened; the release metadata was corrected.
- Maintainer-side browser Web Crypto SHA-256 and UTF-8 byte-size checks passed. The verified v0.3.195 source then executed through a classic Blob script without refreshing Tavern. The running instance reported v0.3.195, and the Tavern Helper script enable/disable control was manually confirmed to work.

### Documentation and release-record policy

- Keep detailed development history in versioned GitHub changelogs, including post-release corrections; never replace earlier release notes.
- Every Tavern Helper script package must have a concise, single-line Markdown `info` field containing the script name, function summary, usage steps, cautions, and author. Do not place line breaks or escaped `\\n` sequences in the `info` value.

