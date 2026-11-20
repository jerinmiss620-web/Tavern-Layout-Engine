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


## Publication guard and immutable source validation

Before publishing a test-channel change, run from the repository root:

```sh
node loader/verify-test-channel.mjs
node loader/verify-test-channel.mjs --remote
```

The guard verifies:
- The TLE and Loader commit pins are exactly 40 lowercase hexadecimal characters.
- Each immutable raw URL matches the expected repository, commit and file path exactly.
- Local source byte sizes and SHA-256 values match the test manifest.
- The importable Tavern Helper JSON contains exactly the pinned Loader source.
- The Loader keeps its strict raw-GitHub/commit trust checks.
- The diagnostic button keeps its Top Layer, top-right, VisualViewport and native-dialog regression contract, and does not return to a bottom-corner anchor.
- With `--remote`, the pinned GitHub artifacts and installer are downloaded and checked again.

### Corrected v0.3.193 manifest failure

The first v0.3.193 test manifest accidentally omitted one hexadecimal character from the TLE source commit, leaving a 39-character value. Loader 0.3.0 correctly rejected it before downloading or modifying the running TLE. The manifest now points to the verified 40-character commit:

`ddb8da7b2e55759fbb2bfa4807ff7d6f9d629309`

Do not weaken the Loader's 40-character commit validation to work around a malformed manifest.

## Confirm the TLE version actually running

After Loader reports a successful update, run this in the host page console:

```js
window.__TAVERN_LAYOUT_ENGINE_V02__?.version
```

The diagnostic Top Layer change is in TLE v0.3.193. If the returned value is still an older version, the new diagnostic-button implementation has not yet been loaded.

If the floating button is still missing or cannot be clicked after v0.3.193 is confirmed, use the TLE panel's existing **复制诊断报告** action. Host Diagnostics 2.0 records the button's Popover support/open state, computed position, bounding rectangle, hit-test target, and the debugger dialog's open/mount state. This distinguishes a rendering/positioning failure from an input interception or event-routing failure.
