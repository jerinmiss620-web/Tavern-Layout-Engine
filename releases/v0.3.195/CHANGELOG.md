# TLE v0.3.195 TEST — TT ChatSurface compatibility experiment

> **Test branch only.** This build has not been validated in a running TauriTavern, SillyTavern or iPhone WebView. Do not promote to stable until live regression tests pass.

## Changes from v0.3.194

- **渐隐侠 / fade wallpaper:** removed the TLE-owned `#chat` direct-child wallpaper anchor and mirror layer. The experimental renderer paints via a CSS pseudo-element when available, with guarded background or mask-only fallback when the theme already owns both pseudo-elements.
- **Floor-0 clearance:** removed the TLE-owned direct-child spacer. The clearance is now calculated through `#chat` block-start padding, accounting for theme padding, message margin and column/grid row gap.
- **Wallpaper synchronization:** retain wallpaper mutation tracking; add ResizeObserver for wallpaper and chat geometry; clean up observers and CSS variables on shutdown.
- **Observers:** reduce unnecessary full layout rescans when TT mounts/unmounts ordinary message nodes.
- **Diagnostics:** include TT ChatSurface API presence, protocol version, ownership status, scroll API availability and a bounded sample of actual direct children; report the fade rendering mode.
- **回底侠:** preserve the v0.3.194 click and scroll behavior. TT's official `scrollChatSurfaceTo` is documented but not yet used by this test build; it requires a separate, targeted runtime regression.

## Known limitations / required tests

1. Confirm TT's bounded ChatSurface stays running after toggling fade, switching chats and scrolling across mount/unmount boundaries.
2. Confirm wallpaper alignment, sticky/fixed pseudo rendering and preserved theme blur on TT desktop, TT mobile and upstream ST.
3. Confirm the floor-0 gap is correct for flex-column, grid and themed layouts, and does not accumulate on repeated theme changes.
4. Confirm disabling fade and unloading the engine fully restores theme styling.
5. Check quick return-to-bottom, floor navigation and diagnostic UI for regressions.
6. Test the fallback when both `#chat::before` and `#chat::after` are already in use by the theme.

## Release safety

The stable channel and v0.3.194 release remain unchanged. The test channel manifest is intentionally **not** advanced to v0.3.195 until the immutable source commit is verified against its SHA-256 and size. This file records implementation work, not a compatibility certification.
