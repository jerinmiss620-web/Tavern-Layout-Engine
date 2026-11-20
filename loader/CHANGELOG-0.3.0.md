# TLE Remote Loader TEST 0.3.0 — Headless Remote Script Bootstrapper

- Remove the Loader panel, launcher, Shadow DOM, CSS and all mobile positioning code.
- Load the TLE as a classic external `<script src>` from an immutable raw GitHub commit URL.
- Verify downloaded source SHA-256 and UTF-8 byte length before loading; apply browser Subresource Integrity to the external script request.
- Use the same Tavern Helper script realm so the TLE's `window.parent` host reference remains valid.
- If the external script request fails (for example CORS/SRI/network), fall back to a classic Blob script built from the already-verified source.
- Preserve IndexedDB LKG/Previous records, legacy localStorage migration, verified pre-upgrade rollback, startup health checks and automatic rollback.
- Keep new-version replacement behind a browser-native confirmation; only previously authorized Last Known Good restoration runs automatically.
- Keep post-start cache persistence separate from TLE health so a cache warning cannot destroy a healthy running instance.
- Expose status through console, optional Tavern toast and `window.__TLE_REMOTE_LOADER_DIAGNOSTICS__`; no Loader UI is created.

- Add a final safety gate: when a TLE is already active, its version must match the verified LKG before replacement; otherwise the loader refuses the update rather than backing up a different version.
