# TLE Remote Loader — Test Build 0.1.0

This is a **test-only** Tavern Helper script loader. It does not change the stable `latest.json` pointer and does not silently replace the installed TLE.

## Test channel

- Manifest: `channels/test.json`
- Baseline: TLE `0.3.191`
- Source is pinned to an immutable Git commit URL.
- The loader validates manifest fields, UTF-8 byte length, and SHA-256 before offering execution.

## Runtime protocol

1. Import the test JSON with `enabled: false`; keep the existing TLE script installed and enabled.
2. Enable the loader. It downloads and verifies the test-channel source but does not execute it.
3. Click **Test module loading**. This imports a tiny Blob module and verifies that it executes in the loader's JavaScript realm. It does not touch the current TLE instance.
4. Only after the probe passes, click **Load remote TLE**. This is a user-initiated action with a confirmation prompt.
5. The loader verifies the TLE instance API and host references after module evaluation.
6. If a previous version is cached, a failed upgrade attempts to restore that different cached version.

## Cache and rollback

The test loader stores its last-known-good source under `tle.loader.test.lastKnownGood.v1` in the Tavern host's `localStorage`. It does not alter existing TLE settings keys. The candidate replaces the cache only after the TLE health check passes.

On first migration, when the currently running TLE version matches the downloaded baseline version, the verified source is seeded as the initial rollback cache. If there is no matching active TLE and no valid cache, loading is disabled.

## Security and limitations

- The manifest accepts only HTTPS raw GitHub URLs in this repository and immutable commit-path format.
- The source is SHA-256 checked before execution.
- Source is executed using `import(blobUrl)` so the code runs in the same JavaScript realm as the Tavern Helper loader; no `eval` or `Function` constructor is used.
- Blob module loading may be blocked by a host Content Security Policy. The loader includes a non-destructive module probe; if it fails, do not attempt to load TLE remotely.
- SHA-256 detects mismatch/corruption but is not a publisher signature. The GitHub repository remains the trust root.
- ST and TT runtime behavior still requires manual testing in both hosts. This repository artifact is not a stable release.

## Recovery

If a test fails before remote TLE execution, the existing TLE remains active. If an execution failure occurs after the old instance has been destroyed and no distinct cached source can be restored, re-enable the original Tavern Helper TLE script and refresh the Tavern page.
