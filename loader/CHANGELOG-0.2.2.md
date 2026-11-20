# Remote Loader TEST 0.2.2

- Fix mobile/narrow viewport panel visibility by moving the mount to a top-level custom host and isolating the panel in Shadow DOM.
- Add hardened host styles, responsive width/height, safe-area insets and VisualViewport-aware bottom positioning.
- Change close action to collapse the panel and leave a TLE floating reopen control.
- Expose mount/render diagnostics on `window.__TLE_REMOTE_LOADER_DIAGNOSTICS__`.
- Preserve IndexedDB cache, verified pre-upgrade backup, legacy migration, auto-restore authorization and rollback behavior from 0.2.1.
- No changes to TLE v0.3.192 or the stable release pointer.
