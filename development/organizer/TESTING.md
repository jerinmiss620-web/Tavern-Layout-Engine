# Organizer branch test instructions

Development branch: `feature/organizer-nav-worldbooks-20261125`

Current test Core: `v0.3.222`

## Import once

Download the [Organizer Branch Test Loader JSON](https://raw.githubusercontent.com/jerinmiss620-web/Tavern-Layout-Engine/08527064995cc13ce39d64f53528ffdc163a66a1/loader/TLE-Remote-Loader-Test-0.3.0.json).

The installer is disabled by default. It reads the test manifest from this development branch and uses a separate IndexedDB database and separate cache keys. It does not read or modify the stable `latest.json`, Bootstrap manifest, or stable Loader cache.

## Switch from stable to test

1. In Tavern Helper, disable the currently enabled **TLE Permanent Bootstrap 1.0.6**. Do not delete it.
2. Fully refresh the SillyTavern/TauriTavern host page once. This lets Bootstrap destroy the stable Loader and its managed Core before the test Loader starts.
3. Import the downloaded test Loader JSON into Tavern Helper. It should appear disabled.
4. Enable **TLE Organizer Branch Test Loader 0.3.0**.
5. Confirm the native prompt to install **TLE Core v0.3.222**.
6. Open TLE → **版本与更新**. The update channel should say **Test · Loader v0.3.0** and the current Core should be **v0.3.222**.

Do not enable the stable Bootstrap while the test Loader is enabled. Do not run an older Test Loader alongside this one.

## Test the current build

- Confirm **整理侠** is the tenth `.drawer` directly below **角色管理**, with its own `.drawer-toggle` and `.drawer-content`; it must not open a centered popup or modal.
- Confirm the tenth icon participates in icon-only, icon+label, compact two-column, and mobile hamburger navigation modes. Clicking it opens/closes the drawer like the other native icons; on mobile, the rail folds away while the opened drawer remains visible.
- Confirm the original global search is still the default page and uses the same search field.
- Open the resource manager's **世界书** category. Check global selection, primary character bindings, extra-book bindings, unbound books, and suspected orphan references.
- Confirm shallow-loaded character cards are marked **待核对** until the optional scan is run.
- Use **扫描绑定** only when you want to load the remaining character-card metadata. It is opt-in and may increase session memory use.
- Test grouping, searching, selection, and batch deletion only on disposable test resources first. Verify native Tavern behavior and the remaining bindings after each deletion.
- Check PC and mobile layouts separately, then repeat in ST and TT as applicable.

## Return to stable

1. Disable **TLE Organizer Branch Test Loader 0.3.0**.
2. Re-enable the original **TLE Permanent Bootstrap 1.0.6**.
3. Fully refresh the host page.

The stable Bootstrap/Loader uses its own independent Last Known Good cache and should restore the stable Core (currently v0.3.220). Verify TLE → **版本与更新** reports the Stable channel and Core v0.3.220. Keep the test Loader imported but disabled as a backup; do not delete either script.

## Updating the branch build

The test Loader is imported only once. When the development Core changes, the branch maintainer publishes a new incremented test Core version and updates the branch's `channels/test.json`. Then open TLE → **版本与更新** → **检查更新** → install the offered Test build. The stable manifest and stable release remain unchanged.
