# TLE v0.3.193 — Host Diagnostics 2.0 Mobile Overlay Regression Fix (TEST)

## Diagnostic floating button

- Restore the diagnostic escape hatch to the top-right viewport region at every viewport size; the 52px top offset keeps it below existing top-right chat controls.
- Promote the button with the browser Popover API `showPopover()`, placing it in the browser Top Layer so transformed roots, zero-height containing blocks, clipping and ordinary stacking contexts cannot move it behind the Tavern UI.
- Recalculate top/right offsets from `VisualViewport` resize/scroll events, with safe-area insets.
- Keep an absolute top-right fallback for browsers without Popover API support.
- Remove the diagnostic button from the `data-tle-external-surface` suppression rule. External-surface detection may suppress navigation toggles, but must not remove the diagnostic escape hatch.
- Extend the one-click report with positioning mode, Popover support/open state, computed top/right, geometry, external-surface flag and hit-test target.

## Mobile debugger panel

- Replace the generic section overlay with a native modal `<dialog>` opened through `showModal()`, placing the debugger itself in the browser Top Layer.
- Preserve mounting inside an already-open Advanced Formatting drawer where available, retaining the event path required by TauriTavern's native drawer dismissal logic.
- Constrain the dialog to safe viewport bounds; keep the header fixed and the report/editor area independently scrollable.
- Preserve the existing debugger actions and one-click report behavior.

## Permanent mobile layout regression rule

**Do not anchor critical buttons, panels, launchers or diagnostic tools in bottom-left or bottom-right corners, or in any other host-controlled region that has not been empirically validated on mobile.**

- Prefer a proven top-right/top-layer anchor for persistent diagnostic controls.
- Do not assume a high `z-index` fixes transformed containing blocks, clipping, zero-height roots or native host overlays.
- For critical floating controls, inspect actual geometry and hit testing, not only computed `z-index`.
- Every change to a mobile floating control must be checked at desktop fullscreen, desktop 390×844 responsive emulation, and an actual iPhone before being promoted beyond TEST.
- Code cleanup must preserve the working Top Layer / viewport-positioning implementation and its regression checks; do not replace it with a generic bottom-corner `position:fixed` rule.

## Validation status

- JavaScript syntax check: passed.
- Source and test manifest integrity fields: generated from the published immutable source.
- PC fullscreen, 390×844 emulation and actual iPhone runtime validation: pending user verification. This is a test release, not yet marked mobile-verified.
