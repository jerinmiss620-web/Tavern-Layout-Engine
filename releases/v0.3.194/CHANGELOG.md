# TLE v0.3.194 — Diagnostic Control Reliability and Loader Release Integrity (TEST)

## Root causes confirmed

- The previous test manifest's v0.3.193 `source_commit` and immutable source URL contained a 39-character commit identifier. The Loader correctly requires exactly 40 lowercase hexadecimal characters, so it rejected the release before downloading or changing the active TLE.
- The separate `open-debugger` control was present in the engine panel markup but missing from the delegated `onClick()` action dispatcher, making the button inert.
- The floating diagnostic action was handled at document capture. In TauriTavern, an earlier host-level outside-tap/capture listener could consume the click before TLE's handler. The direct button listener was downstream of document capture as well.
- The Popover fallback retained `popover="manual"` after `showPopover()` was unavailable or threw. A closed popover remains UA-hidden; changing its position alone cannot make it visible.
- The report capture temporarily removed the floating button's inline `display` declaration rather than restoring the original value and priority, which could leave a non-Popover fallback hidden after capture.

## Diagnostic button

- Move diagnostic click interception to the host window's capture phase and consume only clicks whose target is the TLE diagnostic button. This runs before document-level host outside-tap handlers.
- Use `stopImmediatePropagation()` for the diagnostic gesture only, while preserving normal default activation and unrelated page interactions.
- Keep Popover Top Layer as the preferred positioning mode.
- On Popover failure/unsupported browsers, remove the `popover` attribute before fallback. Move the button to the document root and use a fixed top-right position; do not leave it as a closed, invisible popover.
- Add a dedicated fallback display selector so the button remains visible without Popover support.
- Preserve the original inline display value and priority during report capture.
- Add a lightweight direct-child MutationObserver on `body` and `documentElement` to recreate the diagnostic button if the host replaces its direct parent or removes the button.
- Expand the report with Popover attribute, fallback reason, disabled/hidden state, pointer-events, positioning mode, geometry and hit-test information.
- Keep the button at the top-right with a 52px offset plus safe-area/VisualViewport offsets. No bottom-corner placement.

## Mobile debugger

- Wire the engine panel's existing `open-debugger` action to `openMobileDebugger()`. The control was previously rendered but not handled by `onClick()`.
- Keep the native `<dialog>` Top Layer implementation and existing Advanced Formatting drawer mount behavior.

## Permanent regression rules

- Never place critical diagnostic controls or panels in unverified mobile dead zones or bottom corners.
- Do not assume `z-index` alone escapes transforms, clipping, host overlays or capture-phase event handlers.
- Keep the fallback path visible when Popover API is missing or throws; a failed Popover must have its `popover` attribute removed.
- Keep diagnostic click handling ahead of document-capture host handlers.
- Any cleanup/refactor must retain the window-capture handler, fallback display selector, fallback attribute removal, debugger action dispatch, button lifetime observer and report-capture style restoration.
- Validate PC fullscreen, 390×844 responsive emulation, actual iPhone, ST and TT before promoting beyond TEST.

## Validation status

- TLE JavaScript syntax: passed before publication.
- Release manifest commit path: corrected to the exact 40-character GitHub commit SHA.
- SHA-256 and UTF-8 byte-size fields: generated from the published source.
- Repository regression tests and GitHub Actions workflow: added.
- Actual PC, ST, TT and iPhone runtime validation: pending; this release is not yet marked device-verified.
