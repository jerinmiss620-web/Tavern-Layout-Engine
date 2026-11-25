# TLE Core v0.3.222 · 整理侠第十个原生导航抽屉

This is a branch-only test build. It is not a stable release.

- Rebuild Organizer as the tenth first-level sidebar drawer, placed immediately after Tavern's nine native drawers and below Character Management.
- The Organizer entry now has its own `.drawer-toggle` and `.drawer-content`, and participates in the same native `openDrawer / closedDrawer` behavior as the other sidebar icons.
- Move the existing global search and resource-management views inside that `.drawer-content`. Global search remains the default page and retains its existing search/indexing behavior.
- Remove the centered popup/modal overlay and its scrim. The Organizer panel now uses the native drawer position, width, height, and mobile navigation transitions.
- Count Organizer as the tenth drawer in rail sizing and compact two-column layout; keep the TLE Engine Hub in its existing bottom position.
- World Info catalog, binding classification, stable group keys, opt-in shallow-card scan, native deletion, and extra-book reference cleanup remain in this test build.

Test channel: `feature/organizer-nav-worldbooks-20261125`.
