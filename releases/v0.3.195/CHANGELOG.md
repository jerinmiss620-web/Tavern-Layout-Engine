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
