# TLE Remote Loader — Headless Test Build 0.3.0

This is a test-only Tavern Helper `type: script` bootstrapper. It has no panel, launcher, Shadow DOM, CSS, floating button or viewport positioning code.

## Architecture

1. Tavern Helper runs the small bootstrapper in its script realm.
2. The bootstrapper reads the test manifest from GitHub.
3. It fetches the immutable release source and verifies UTF-8 byte size and SHA-256.
4. For the remote candidate, it injects a classic `<script src="immutable-raw-github-url">` element into the same Tavern Helper script document. The browser applies a matching `sha256-...` Subresource Integrity value with `crossorigin="anonymous"`.
5. If the external script request fails (network/CORS/SRI), the loader uses a classic Blob script built from the already verified source. This is a compatibility/recovery fallback, not an ES module import.
6. The loader checks the TLE instance, host references and destroy interface before accepting the candidate.

The TLE source is a self-executing classic-script IIFE, not an ES module. Running the injected script in the Tavern Helper script realm preserves the existing TLE contract where `window.parent` is the Tavern host window.

## What is retained

- IndexedDB database `TLE_Remote_Loader_Test_Cache`, object store `records`, slots `lkg` and `previous`.
- Existing localStorage keys `tle.loader.test.lastKnownGood.v1`, `tle.loader.test.previousKnownGood.v1` and `tle.loader.test.autoRestore.v1`.
- One-time migration of legacy full-source localStorage records after IndexedDB readback and SHA-256/byte-size verification.
- Verified Previous backup before replacing a healthy current TLE. The cached LKG version must also match the active TLE version; a mismatch is treated as an unsafe state and the loader refuses replacement.
- Automatic rollback only when the candidate itself fails execution/health checks.
- Cache persistence and auto-restore authorization failures after a healthy startup are warnings; they do not destroy the healthy TLE.
- Existing user auto-restore authorization. New version changes still require an explicit native browser confirmation.

## Status and control

There is no Loader UI. Status is written to the browser console and, when available, Tavern's toast service. Inspect:

```js
window.__TLE_REMOTE_LOADER_DIAGNOSTICS__
```

The Loader API is available at:

```js
window.__TLE_REMOTE_LOADER_TEST_V1__
```

Useful methods:

- `checkRemote()`: fetch/verify the test manifest and prompt before loading a new candidate.
- `loadRemote()`: load the already verified candidate, with confirmation.
- `rollback()`: restore the Previous Known Good cache, with confirmation.
- `setAutoRestore(false)`: disable startup restoration without deleting cached source.
- `destroy()`: stop the bootstrapper; it does not destroy the active TLE instance.

## Upgrade from Loader 0.2.2

1. Disable Loader 0.2.2 first. Do not run two Loader versions at the same time.
2. Import `TLE-Remote-Loader-Test-0.3.0.json`. The Tavern Helper script ID is preserved: `8f994fad-ea17-49f8-93af-ebe8ba4f6c67`.
3. Enable Loader 0.3.0 and refresh the Tavern page.
4. It reads the same IndexedDB database and existing LKG/Previous slots. No manual storage clearing or migration is required.
5. If auto-restore was previously authorized, it restores the verified LKG from IndexedDB. If not, it leaves the current page untouched until you confirm the first load.
6. It checks the test manifest and asks before installing/updating TLE v0.3.193.
7. Keep the original local TLE script disabled but do not delete it.

## Safety and limits

- No silent updates. A new TLE version always requires a native browser confirmation.
- If a healthy current TLE exists but no verified LKG is available, the loader refuses to replace it.
- If both IndexedDB and legacy localStorage cannot safely preserve a rollback copy, the update is refused.
- If the candidate passes health checks but final cache persistence fails, it remains running for the current session and a warning is reported.
- SHA-256 and SRI detect byte mismatch; they do not constitute a publisher signature. The pinned GitHub repository/commit remains the trust root.
- The external script-src + SRI path and Blob fallback require runtime validation in ST and TT. Do not promote this test build until both hosts are checked.
