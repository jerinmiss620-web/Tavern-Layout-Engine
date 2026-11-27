# TLE v0.3.290 · TEST ONLY

> This is an isolated test-channel build based on the v0.3.289 stable baseline. It does not modify `latest.json` or the stable release.

## Companion: character-specific preset prompt-entry states

- Save only `identifier -> enabled` state for each role.
- Keep the preset as the only source of prompt bodies, names, and order.
- Reordering entries or editing their names/bodies does not break identifier matching.
- Newly added identifiers remain native and are not enrolled until the user explicitly re-collects and saves the plan.
- Deleted or locked entries are reported independently; available entries still apply.
- When roles share one global preset, restore the native preset baseline before switching overlays.
- If the previous role's baseline cannot be restored, stop the new plan rather than risk cross-role state leakage.
- Native prompt-manager saves restore the preset baseline before persisting; unsafe saves are cancelled.

## Validation

- Automated repository regression suite passed on the development branch.
- ST / TT runtime acceptance is still pending and must be completed with this dedicated Test Loader.
