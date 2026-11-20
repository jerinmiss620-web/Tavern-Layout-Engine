# TLE Remote Loader — Test Build 0.2.2

This is a **test-only** Tavern Helper `type: script` loader. It retains the 0.2.1 storage and rollback fixes and adds a mobile-safe, CSS-isolated control panel.

## What changed in 0.2.2

The 0.2.1 panel was a generic `section` appended directly to `document.body`. Although it used fixed positioning and a high z-index, SillyTavern themes and mobile media queries could still target the element and its descendants. The user reproduced the panel disappearing both on iPhone and in desktop Chrome's mobile viewport emulation, while it remained visible in fullscreen desktop layout.

Version 0.2.2 changes the UI mount:

- Creates a dedicated `tle-remote-loader-root` host and mounts it under `document.documentElement`, rather than inside the theme-controlled body layout.
- Uses an open Shadow DOM for panel contents. Host-page theme selectors cannot select or restyle nodes inside the shadow tree; the Loader supplies its own compact stylesheet.
- Hardens the host's fixed positioning, display, visibility, opacity, pointer events, stacking level, dimensions and overflow behavior.
- Uses a responsive width and viewport-constrained panel height, with iOS safe-area insets.
- Tracks `VisualViewport` resize/scroll changes and adjusts the bottom offset when the visual viewport shrinks (for example, when a software keyboard appears).
- The close control now collapses the panel rather than destroying the Loader. A small **TLE** floating launcher remains available to reopen it.
- Exposes `window.__TLE_REMOTE_LOADER_DIAGNOSTICS__` with Loader version, mount mode, mounted/visible/rendered flags, mount error, geometry, computed host style, viewport snapshot, module-probe status and last status. A console message is emitted at startup.

## Storage and rollback behavior retained from 0.2.1

- Full TLE source records remain in IndexedDB (`TLE_Remote_Loader_Test_Cache`, object store `records`).
- `localStorage` retains only small metadata pointers when IndexedDB is available.
- Legacy full-source records are migrated only after IndexedDB readback and SHA-256/UTF-8 byte-size verification.
- A verified previous-version backup is required before replacing a healthy current TLE.
- Once the candidate TLE passes its health check, a later cache-write failure is a warning and does not destroy the healthy candidate.
- Only the two Loader-owned cache keys are migrated/replaced. No unrelated storage is cleared or enumerated.

## Upgrade from 0.2.1

1. Disable Remote Loader 0.2.1. Do not run both Loader versions at once.
2. Import `TLE-Remote-Loader-Test-0.2.2.json` into Tavern Helper. The script ID is unchanged: `8f994fad-ea17-49f8-93af-ebe8ba4f6c67`.
3. Enable Loader 0.2.2 and confirm that its panel appears at both desktop and narrow/mobile widths.
4. Close the panel once; confirm the small **TLE** launcher remains and reopens it.
5. Check that the panel reports Loader 0.2.2, module probe passes, and the current TLE remains healthy.
6. Then test the TLE v0.3.192 update through the normal manual-confirmation flow.

Keep the original local TLE recovery script disabled but do not delete it.

## Runtime validation

The source passes JavaScript syntax validation and the Tavern Helper JSON wrapper parses successfully. The Shadow DOM and responsive mount have not been executed inside the user's ST/TT runtime in this build environment. Verify both desktop narrow viewport emulation and the actual iPhone client before promoting the loader beyond TEST.
