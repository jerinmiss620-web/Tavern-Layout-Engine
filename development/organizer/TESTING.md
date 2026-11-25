# Organizer branch test instructions

Development branch: `feature/organizer-nav-worldbooks-20261125`

Current test Core: `v0.3.229`

## Import once

Download the [Organizer Branch Test Loader JSON](https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/08527064995cc13ce39d64f53528ffdc163a66a1/loader/TLE-Remote-Loader-Test-0.3.0.json).

The installer is disabled by default. It reads the test manifest from this development branch and uses a separate IndexedDB database and separate cache keys. It does not read or modify the stable `latest.json`, Bootstrap manifest, or stable Loader cache.

## Switch from stable to test

1. In Tavern Helper, disable the currently enabled **TLE Permanent Bootstrap 1.0.6**. Do not delete it.
2. Fully refresh the SillyTavern/TauriTavern host page once. This lets Bootstrap destroy the stable Loader and its managed Core before the test Loader starts.
3. Import the downloaded test Loader JSON into Tavern Helper. It should appear disabled.
4. Enable **TLE Organizer Branch Test Loader 0.3.0**.
5. Confirm the native prompt to install **TLE Core v0.3.229**.
6. Open TLE → **版本与更新**. The update channel should say **Test · Loader v0.3.0** and the current Core should be **v0.3.229**.

Do not enable the stable Bootstrap while the test Loader is enabled. Do not run an older Test Loader alongside this one.

## Test the current build

- Confirm the original **全局搜索** button is restored in the workspace header in every navigation mode. It opens its own centered modal and retains the original search index, search field, result navigation, and clear behavior.
- Confirm the global-search modal contains a compact **整理侠** jump entry. Activating it closes the search modal and opens the Organizer drawer; it must not switch the search modal into a resource-management tab.
- Confirm this candidate does not merge search and replacement workflows; that follow-up remains a separate Codex integration task.
- Confirm **整理侠** is the tenth `.drawer` directly below **角色管理**, with its own `.drawer-toggle` and `.drawer-content`; it opens/closes like a native drawer, not a centered popup. Its resource filter input and manager state are independent from global search.
- Confirm the Organizer's `.drawer-content` is the direct content root: the heading, resource filter and resource list are direct children; there is no nested `.tle-search-surface` wrapper.
- Click the Organizer icon, then the navigation text label to open and close the native drawer. Each action must add/remove `openDrawer / closedDrawer` and update `aria-expanded` correctly; the Organizer heading has no duplicate X close button.
- From the global-search modal, click **整理侠**. The search modal should close and the same Organizer `.drawer-content` should open; verify this works on both desktop and mobile.
- Confirm the tenth icon participates in icon-only, icon+label, compact two-column, and mobile hamburger navigation modes. On mobile, the rail folds away while the opened drawer remains visible.
- Open the Organizer's **世界书** category. Verify quick filters for **全部 / 已绑定 / 未绑定 / 疑似孤儿 / 全局启用** and their counts. Primary/extra character bindings define **已绑定**; global enablement is independent and may overlap either bound state.
- Verify a globally enabled book with no character binding appears in both **未绑定** and **全局启用**. Verify stale extra-book references are marked **疑似孤儿** (or **含遗留关联** when the book also has a current character binding).
- Use **扫描绑定** only when you want to load the remaining character-card metadata. It is opt-in and may increase session memory use.
- Test grouping, searching, selection, and batch deletion only on disposable test resources first. Verify native Tavern behavior and the remaining bindings after each deletion.
- On PC (viewport wider than 1000px), confirm the Organizer has three columns: **资源类型** at left, **分组目录** in the middle, and **资源列表** at right. Selecting a resource type refreshes the middle group list; selecting **未分组** or a named group filters only the right-hand list.
- Confirm the resource search field is inside the right-hand resource column; worldbook status filters, target-group selection and batch actions remain in that column. The left category list, middle group list and right resource list must scroll independently without horizontal overflow.
- At 1000px and narrower, confirm the three pane wrappers flatten back into the original single-column mobile flow; category/group navigation remains available and no desktop sidebars consume the resource list height.
- On mobile, confirm the Organizer title and short description stay on one line; the description reads only **资源分组 · 批量管理**.
- Confirm category tabs and group filters remain horizontally swipeable and show a persistent **3px** scroll indicator; no 15px native scrollbar is reserved.
- Confirm the header has no redundant close X. The **同步 / 导入 / 导出** controls sit together at the right side of the title row; the sync control appears only in the UI theme category.
- Confirm the target-group selector shares a row with **管理分组 / 自动分组**.
- Confirm batch actions use a compact **three-column** layout; buttons are 30px high with no default margins or oversized row gaps, and the resource list expands into the remaining panel height.
- On desktop, confirm the original three-column workspace remains unchanged and pane tint uses `rgb(from var(--SmartThemeQuoteColor) r g b / .12)`.
- Check PC and mobile layouts separately, then repeat in ST and TT as applicable.

## Return to stable

1. Disable **TLE Organizer Branch Test Loader 0.3.0**.
2. Re-enable the original **TLE Permanent Bootstrap 1.0.6**.
3. Fully refresh the host page.

The stable Bootstrap/Loader uses its own independent Last Known Good cache and should restore the stable Core (currently v0.3.220). Verify TLE → **版本与更新** reports the Stable channel and Core v0.3.220. Keep the test Loader imported but disabled as a backup; do not delete either script.

## Updating the branch build

The test Loader is imported only once. When the development Core changes, the branch maintainer publishes a new incremented test Core version and updates the branch's `channels/test.json`. Then open TLE → **版本与更新** → **检查更新** → install the offered Test build. The stable manifest and stable release remain unchanged.
