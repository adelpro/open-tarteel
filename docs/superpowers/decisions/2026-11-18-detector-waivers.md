# Detector waivers (2026-11-18)

Recorded when `DESIGN.md` was locked as the authoritative spec. These are
deliberate, scoped waivers for detector rules that would otherwise flag the
intended design. A waiver is not a blanket exemption: each applies only under
the condition stated below, and each is re-checked when the token block or the
rendered component changes.

| Rule                          | Status               | Scope / condition                                                                                                                                                                                                                                                |
| ----------------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cream-palette`               | Waived               | The warm canvas is an explicit token (`warm-canvas: #F6F2E9`, dark `#0B110F`), not a detector-recognised "cream" preset. It is intentional and named; do not "fix" it to a neutral preset.                                                                       |
| `gpt-thin-border-wide-shadow` | Waived conditionally | Waived only when the computed `boxShadow` does not actually reproduce a thin-border/wide-shadow look. The system uses hairline `border-border` with no card shadows; if a computed shadow reappears, the waiver no longer applies and the finding must be fixed. |

## Rationale

- **`cream-palette`** — the warm palette's paper canvas is a core part of the
  brand and is declared explicitly as `warm-canvas` in the token block (and
  documented in Colors and the Agent Prompt Guide). The detector's cream-palette
  heuristic assumes an accidental near-white fill; here the warm tone is the
  deliberate choice, so the finding is suppressed.
- **`gpt-thin-border-wide-shadow`** — the detector flags a pattern associated
  with generic AI-generated cards (1px border plus a broad soft shadow). Open
  Tarteel uses the hairline border but deliberately no card shadow; shadows are
  allowed only on a bottom sheet and a desktop popover. The waiver is valid only
  while the computed `boxShadow` confirms no such shadow is present on cards,
  buttons, inputs, or the player. If it does reproduce, the waiver is void and
  the component must be corrected.

- **Final fix wave (2026-11-21)** — four shadow declarations that had crept
  back into `about-page.tsx` (two card blocks), `privacy-page.tsx` (card
  block), `player-controls.tsx` (download-status chip) and `root-shell.tsx`
  (skip-link focus) were removed. No card, button, input, player or skip-link
  shadow remains in `src/`; the only `box-shadow` rules left in `globals.css`
  are 1px focus rings. The waiver condition is true again, not merely intended.

Reviewing: re-run the detector after any change to the palette tokens or to the
elevation rules in `DESIGN.md`. Add a new row here (with a reason and a scope)
before suppressing any other rule.
