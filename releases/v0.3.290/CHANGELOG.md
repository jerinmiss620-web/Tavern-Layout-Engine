# TLE v0.3.290 · TEST ONLY

> This is an isolated test-channel build based on the v0.3.289 stable baseline. It does not modify \`latest.json\` or the stable release.

## Companion: character-specific preset prompt-entry states

- Save only \`identifier -> enabled\` state for each role.
- Keep the preset as the only source of prompt bodies, names, and order.
- Reordering entries or editing their names/bodies does not break identifier matching.
- Newly added identifiers remain native and are not enrolled until the user explicitly re-collects and saves the plan.
- Deleted or locked entries are reported independently; available entries still apply.
- When roles share one global preset, restore the native preset baseline before switching overlays.
- If the previous role's baseline cannot be restored, stop the new plan rather than risk cross-role state leakage.
- Native prompt-manager saves restore the preset baseline before persisting; unsafe saves are cancelled.
- Baseline restoration is preflighted before other plan fields are applied; missing identifiers or locked state mismatches stop the plan.

- 预设正文、名称和排序始终以酒馆原始预设为准；角色方案只保存稳定条目标识与启用状态。

## Validation

- Focused regression coverage now checks identifier matching, missing baseline identifiers, locked-state mismatches, and initialization isolation.
- Full GitHub Actions regression result is pending confirmation; this candidate must not be treated as accepted until the branch workflow passes.
- ST / TT runtime acceptance remains pending and must be completed with this dedicated Test Loader.
