# Phase 2 Integration Validation · 2026-11-29

## Test-only candidate

- Core: v0.3.305
- Test Core path: `test-releases/v0.3.305/TLE.js`
- Test Loader: 0.3.1
- Test Loader path: `loader/TLE-Remote-Loader-Test-0.3.1.js`
- Test manifest: `channels/test.json`
- Test manifest is pinned to integration commit `f34e4c79e85d4e5efd5641426c0f9a9bee1a2ad3`.
- Core SHA-256: `1e10cf18cb0495124d2ed918cb806fb9d869f3fb34ac59a793e06e44ee8be447`; UTF-8 bytes: `1205446`.
- Test Loader SHA-256: `1b9c00c89f31a747a912286def398ce456db6e4e7df94508d7acb472ed533af3`; UTF-8 bytes: `39876`.

## Safety boundaries

- Published Stable Core v0.3.304 is unchanged.
- `latest.json` remains on v0.3.304.
- Stable Loader 0.3.6 and Bootstrap 1.0.6 are unchanged.
- The test candidate lives only under `test-releases/`; Test Loader refuses stable `releases/` paths.
- Stable Manifest for remote modules remains empty. HD Avatar is test-only until ST / TT validation passes.

## Required real-device checks

1. ST: Test Loader 0.3.1 loads Core v0.3.305 and the `avatar.hd` module.
2. TT: native avatar bypass remains intact.
3. Disable, re-enable, update and uninstall the module without affecting Core or other modules.
4. Disconnect the network and verify IndexedDB Last Known Good recovery.
5. Reject wrong hash, wrong byte count and failed module initialization.
6. Verify module cleanup after Core unload and repeated startup.
