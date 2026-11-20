# TLE Remote Loader — Test Build 0.2.1

This is a **test-only** Tavern Helper script loader. It does not change the stable release pointer and does not silently replace a working TLE.

## What changed in 0.2.1

The 0.2.0 loader stored the complete TLE source in two \`localStorage\` entries. A quota exception while writing \`previousKnownGood\` was caught as though TLE startup had failed, so a healthy new instance could be destroyed and rolled back because cache persistence failed.

Version 0.2.1 fixes both problems:

- Full TLE source records are stored in IndexedDB (\`TLE_Remote_Loader_Test_Cache\`, object store \`records\`).
- The existing \`tle.loader.test.lastKnownGood.v1\` and \`tle.loader.test.previousKnownGood.v1\` localStorage keys now contain only small metadata pointers when IndexedDB is available.
- Existing 0.2.0 full-source localStorage records are migrated only after the IndexedDB copy is read back and passes SHA-256 and UTF-8 byte-size verification. The old value is not removed before verification.
- If IndexedDB cannot be opened, the loader falls back to the legacy full-source localStorage format.
- If IndexedDB opens but its write transaction fails, the loader does not create a competing localStorage copy that could be shadowed by an older IndexedDB record.
- Before replacing a healthy current TLE, the loader stores and reads back the previous known-good source. If this preflight fails, the update is refused and the current TLE remains untouched.
- After the candidate passes TLE instance/host health checks, cache persistence and auto-restore authorization are handled separately. A cache write failure is a warning; it does not destroy the healthy candidate.
- Only the two Loader-owned cache keys are migrated/replaced. No unrelated localStorage entries are enumerated or cleared.

## Upgrade from 0.2.0

1. Keep the original local TLE recovery script disabled; do not delete it.
2. Disable Remote Loader 0.2.0 before importing 0.2.1 so two loader instances do not race.
3. Import \`TLE-Remote-Loader-Test-0.2.1.json\` into Tavern Helper. Its script ID is preserved from 0.2.0.
4. Enable Loader 0.2.1 and wait for the module probe and startup restoration.
5. It reads the existing 0.2.0 LKG record. If IndexedDB is available, it migrates the record and replaces the large localStorage payload with a small pointer.
6. Confirm the panel reports Loader 0.2.1 and the previous TLE version is restored.
7. Click **Check update**, verify TLE v0.3.192, then manually confirm **Load remote TLE**.
8. If the pre-upgrade backup cannot be written and read back, the loader refuses to replace the current TLE. If the new TLE starts successfully but the final LKG write fails, it remains running and reports a cache warning.

## Storage keys

- \`tle.loader.test.lastKnownGood.v1\`: small IndexedDB pointer, or a legacy full-source record when IndexedDB cannot be opened.
- \`tle.loader.test.previousKnownGood.v1\`: small IndexedDB pointer, or a legacy full-source record when IndexedDB cannot be opened.
- \`tle.loader.test.autoRestore.v1\`: explicit auto-restore authorization.
- IndexedDB database \`TLE_Remote_Loader_Test_Cache\`, store \`records\`: full verified source payloads.

Existing TLE settings keys are not changed.

## Safety and limitations

- The loader only accepts HTTPS raw GitHub source URLs from this repository with an immutable 40-character commit path and matching version directory.
- It checks UTF-8 byte length and SHA-256 before execution and after IndexedDB readback.
- Dynamic module loading uses \`import(blobUrl)\`; no \`eval\` or \`Function\` constructor is used in the installed loader.
- An already-running TLE instance causes startup auto-restore to be skipped. Keep the original local TLE script disabled after migration.
- If IndexedDB is unavailable, localStorage fallback can still hit quota. In that case the loader refuses to replace the current TLE rather than risking an update without a verified rollback copy.
- If the candidate is healthy but final cache persistence fails, the candidate stays active for the current session. The previous LKG remains available, so a later refresh may restore that previous version until cache storage is repaired.
- SHA-256 detects corruption or mismatch; it is not a publisher signature. The GitHub repository remains the trust root.
- ST and TT must be tested separately. This remains a test build, not a stable release.

## Recovery

Keep the original local TLE script disabled but available as a manual recovery copy. If backup preflight fails, do not repeatedly retry; the current TLE remains untouched. Resolve browser IndexedDB/storage availability first. If both remote cache slots fail to restore, re-enable the original local TLE script and refresh the Tavern page.
