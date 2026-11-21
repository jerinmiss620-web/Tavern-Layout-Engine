# TLE v0.3.195 TEST — TT ChatSurface compatibility experiment

> **Test branch only.** This build has not been validated in a running TauriTavern, SillyTavern or iPhone WebView. Do not promote to stable until live regression tests pass.

## Changes from v0.3.194

- **渐隐侠 / fade wallpaper:** removed the TLE-owned `#chat` direct-child wallpaper anchor and mirror layer. The experimental renderer paints via a CSS pseudo-element when available, with guarded background or mask-only fallback when the theme already owns both pseudo-elements.
- **Floor-0 clearance:** removed the TLE-owned direct-child spacer. The clearance is now calculated through `#chat` block-start padding, accounting for theme padding, message margin and column/grid row gap.
- **Wallpaper synchronization:** retain wallpaper mutation tracking; add ResizeObserver for wallpaper and chat geometry; clean up observers and CSS variables on shutdown.
- **Observers:** reduce unnecessary full layout rescans when TT mounts/unmounts ordinary message nodes.
- **Diagnostics:** include TT ChatSurface API presence, protocol version, ownership status, scroll API availability and a bounded sample of actual direct children; report the fade rendering mode.
- **回底侠:** preserve the v0.3.194 click and scroll behavior. TT's official `scrollChatSurfaceTo` is documented but not yet used by this test build; it requires a separate, targeted runtime regression.

## Additional code review

- Fixed a real `ReferenceError` in `syncFloorZeroClearance`: `chatStyle` was originally scoped inside a `try` block but used afterward to calculate grid/flex row gaps. This would break the clearance calculation at runtime even though JS syntax checking passed. Corrected in commit `c969ea088c1681aace7f626fbd8f9a8265cf33fc`.
- A successful syntax check is **not** runtime verification. The CSS pseudo-element mirror may differ from the original DOM mirror in stacking, sticky behavior, clipping, backdrop-filter and scroll performance.
- The test manifest currently still points to v0.3.193. Testing v0.3.195 requires explicitly loading the test branch source; no automatic channel rollout has occurred.

## Additional observer audit

- Avoid redundant writes to TLE-owned inline CSS variables on `#chat` and `body` when their values have not changed. This reduces unnecessary mutation records during wallpaper and floor-clearance refreshes.
- Retain detection of theme-originated `#chat` inline style changes; do not suppress these records just because fade is active.
- These optimizations are static source changes, not measured FPS improvements.

## Critical lifecycle correction after first test package

- The first packaged TEST JSON omitted three required fade bottom-padding lifecycle functions: `syncChatFadeBottomPadding`, `clearChatFadeBottomPadding`, and `setChatFadeBottomPaddingEnabled`.
- This caused enabling fade to throw before renderer initialization, and caused `destroy()` / emergency restore to throw at `clearChatFadeBottomPadding()` before the remaining teardown steps. This directly explains the reported missing fade and failed in-session restoration.
- Restored all three functions from the v0.3.194 lifecycle contract, adapted to the current CSS-class clearance implementation. Rebuilt the standalone import package and repinned its source checksum.
- **Do not use the first package commit `209632a97b50d7cfb37850e70c8432cca5e27569`.** Use only the corrected package commit recorded in `TEST-MANIFEST.json`.

## Experimental navigation hitbox compatibility (test branch only)

- Added a **manual, session-only** “修复导航图标点击区域 / 对齐” control under Compatibility Repair, disabled by default, reset on UI theme changes.
- For themes with `.drawer-toggle/.drawer-icon { width:100% }`, an empty absolutely positioned `::before`, and transparent native icons, reserve a stable 44px-or-row-height slot for both native elements. Both the icon and its parent remain valid hit targets, independent of glyph content.
- **Visibility correction:** while TLE navigation is active, its native `.drawer-icon` container is always `opacity: 1 !important`. This defeats themes that otherwise hide all image-based `::before` art through parent opacity. The pseudo-element artwork, mask and background remain theme-defined.
- In text/info navigation modes, keep the TLE label after that icon slot and left-aligned. Preserve theme `::before` art and backgrounds while enforcing visible native icon containers; do not use `width:fit-content` for native hit targets.
- Isolated Chromium mock regression verified icons, labels and info modes: 44×44px hitboxes, icon→toggle click propagation, label beginning after icon slot. Live ST/TT/mobile validation is still required.
- Does not touch the stable branch, bottom bar, or chat virtualization; does not enable automatically.

## Known limitations / required tests

1. Confirm TT's bounded ChatSurface stays running after toggling fade, switching chats and scrolling across mount/unmount boundaries.
2. Confirm wallpaper alignment, sticky/fixed pseudo rendering and preserved theme blur on TT desktop, TT mobile and upstream ST.
3. Confirm the floor-0 gap is correct for flex-column, grid and themed layouts, and does not accumulate on repeated theme changes.
4. Confirm disabling fade and unloading the engine fully restores theme styling.
5. Check quick return-to-bottom, floor navigation and diagnostic UI for regressions.
6. Test the fallback when both `#chat::before` and `#chat::after` are already in use by the theme.

## Release safety

The stable channel and v0.3.194 release remain unchanged. The test channel manifest is intentionally **not** advanced to v0.3.195 until the immutable source commit is verified against its SHA-256 and size. This file records implementation work, not a compatibility certification.
