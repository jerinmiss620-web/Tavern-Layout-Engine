# TLE Core v0.3.221 · Organizer Branch Test

This is a branch-only test build. It is not a stable release.

- Adds a dedicated Organizer entry in the TLE side navigation; the original global search remains the default page.
- Unifies the World Info catalog with global selection, primary character bindings, extra-book bindings, unbound status, and suspected orphan references.
- Uses worldbook names as stable grouping keys and migrates existing index-based group assignments.
- Adds an opt-in scan for shallow-loaded character cards.
- Keeps worldbook deletion on the Tavern's native delete API and removes stale extra-book links before deletion.
- Includes the current Organizer navigation and resource-manager development work for PC/mobile host testing.

Test channel only: `feature/organizer-nav-worldbooks-20261125`.
