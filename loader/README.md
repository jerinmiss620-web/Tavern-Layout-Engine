# TLE Remote Loader — Test Build 0.2.0

This is a **test-only** Tavern Helper script loader. It does not change the stable release pointer and does not silently replace a working TLE.

## What changed in 0.2.0

- After the user explicitly authorizes automatic restoration, the loader restores the verified Last Known Good (LKG) source on subsequent startup.
- A 900 ms startup grace period lets Tavern Helper's other scripts initialize first. If a TLE instance is already active, automatic restoration is skipped to avoid replacing it.
- The test-channel manifest is checked in the background after startup restoration.
- New TLE versions are downloaded and verified, but loading still requires a user click and confirmation.
- The loader keeps two verified slots: current LKG and one previous known-good version.
- A failed candidate startup attempts to restore the previous LKG. The previous-version button can also restore the previous slot manually.
- Automatic restoration can be disabled or re-enabled from the status panel.

## Installation / migration from 0.1.0

1. Keep the original local TLE script installed as a recovery copy, but leave it **disabled**.
2. Disable the old Remote Loader 0.1.0 script to prevent two loader versions racing at startup.
3. Import `TLE-Remote-Loader-Test-0.2.0.json` with its default disabled state, then enable it.
4. If the verified remote TLE is already running and the LKG cache exists, click **Enable auto restore** in the panel. If no TLE is running, let the loader check the test channel, then manually load the verified candidate once.
5. Refresh the Tavern page. The loader should run the module probe, wait for startup scripts, detect no local TLE instance, and automatically restore the cached version.
6. Confirm TLE navigation, panels, quick switching, settings, and console output. Do not delete the local recovery script.

## Storage keys

- `tle.loader.test.lastKnownGood.v1`: current verified source.
- `tle.loader.test.previousKnownGood.v1`: one previous verified source.
- `tle.loader.test.autoRestore.v1`: explicit auto-restore authorization.

Existing TLE settings keys are not changed.

## Safety and limitations

- The loader only accepts HTTPS raw GitHub source URLs from this repository with an immutable 40-character commit path and matching version directory.
- It checks UTF-8 byte length and SHA-256 before execution.
- Dynamic module loading uses `import(blobUrl)`; no `eval` or `Function` constructor is used.
- An already-running TLE instance causes startup auto-restore to be skipped. Keep the original local TLE script disabled after migration; the grace period is a conflict check, not a guarantee against a deliberately delayed third-party script.
- SHA-256 detects corruption or mismatch; it is not a publisher signature. The GitHub repository is the trust root.
- ST and TT must be tested separately. This remains a test build, not a stable release.

## Recovery

If auto-restore fails, the loader tries the previous verified slot. If both cached sources fail, re-enable the original local TLE script and refresh the Tavern page. Keep that recovery script until the loader has been validated in both ST and TT.
