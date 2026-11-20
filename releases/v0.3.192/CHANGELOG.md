# TLE v0.3.192 — Host Diagnostics 2.0 (TEST)

## One-click report

- The floating diagnostic button now captures the pre-click page state and copies the complete JSON report in one click.
- The original mobile debugger remains available from the TLE engine panel.

## Environment and host

- Device class, touch capability, and explicit model only when exposed by User-Agent Client Hints.
- Browser/version/engine, OS/version with source and confidence, full UA, and available high-entropy Client Hints.
- SillyTavern vs TauriTavern runtime signals; host and Tavern Helper versions only when explicitly exposed by runtime globals/context.
- Screen, viewport, VisualViewport, DPR, orientation, fullscreen, safe-area insets, focus metadata, and a heuristic keyboard-height estimate.
- Network/hardware summaries and CSS/API feature support.

## TLE feature and layout diagnostics

- TLE navigation, global search, workspaces, information station, quick switch, optional folds, chat tools, chat shortcut, fade, scroll-bottom, compatibility repairs, observers and required-node status.
- Slash-command executor API availability and TLE command list (`/chat-jump`, `/hide`, `/unhide`). No commands are executed; registry-level confirmation is not claimed.
- Key DOM geometry/computed styles, ancestor stacking contexts, hit-test occlusion, visual-effect candidates, long-task count and JS heap summary where supported.
- Recent 30 page errors with URL query strings and common credential patterns redacted.

## Privacy and limits

No chat/message content, character cards, world-book text, prompts, input/textarea/form values, raw localStorage/sessionStorage, API keys, tokens, cookies or passwords are collected. The reasoning selector's selected label is retained because it is an existing targeted diagnostic. OS/browser details parsed from UA are explicitly marked with source/confidence; model and host versions are unavailable when not exposed. Keyboard height is a viewport-difference estimate, not a direct OS keyboard measurement. FPS is not sampled to avoid adding diagnostic overhead.

This is a test release. Validate in both SillyTavern and TauriTavern before promoting to stable.
