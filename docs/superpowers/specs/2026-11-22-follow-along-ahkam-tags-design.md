# Follow-along ahkam tags: typographic rule key

Short design for a small change. No implementation yet.

## Intent and why

The follow-along view's tajweed legend reads as primitive AI-style UI: small colored circles inside rounded chips. It should instead feel like a quiet annotation layer of the Quran line. The user chose direction A: a typographic rule key.

## Goals

- Remove the "dots on top of the tags" (the `AhkamRail` strip) entirely.
- Show each tajweed rule as a plain Arabic label with a 2px colored underline, no pill, no circle, no background box.
- When the current word contains several rules, highlight every matching rule at once.
- Move follow-along show/hide into the ⋯ More menu; keep only the ahkam-tags show/hide switch in Settings.
- With ahkam tags off, enabling follow-along in More shows the Quran line only.

## Non-goals

- No new palette or typeface; use existing `TAJWEED_COLORS`, Tajawal and DESIGN.md tokens.
- No coloring of individual scripture characters (direction B was rejected as fragile with multi-rule words and RTL wrapping).
- No card, shadow, gradient, or rounded-chip container.

## Constraints

- Arabic first, RTL with logical properties.
- Minimum 12px text; no `rounded-full` circles.
- Flat surfaces, hairline separation, restrained motion (120/180ms, standard easing).
- Active state must not rely on color alone: bold label plus thicker underline.
- Existing atoms: `followAlongLineAtom` (persisted visibility), `ahkamTagsAtom` (persisted tag visibility).

## Approaches

- **A. Typographic rule key (chosen):** label + colored underline, active label bold and underline thicker. Smallest change, matches the design system.
- **B. Underline/color the word itself:** rejected because multi-rule words and RTL line wrapping make it fragile and could clutter scripture text.
- **C. Hairline legend tabs:** rejected as still widget-like.

## Decisions

- Delete `src/components/ahkam-rail.tsx` and its render from `src/components/follow-along-panel.tsx`.
- Replace the legend's `Tag` chips with a `<ul>` of `<li>` items: label in `text-xs text-ink-muted`, a bottom border in `TAJWEED_COLORS[group]`, no chip chrome.
- For active groups: `font-bold text-ink`, underline width 3px instead of 2px. Multiple items can be active simultaneously.
- Compute active groups from every character of the word currently in `state === 'current'`, using `ruleGroup(char.rule)`.
- Add a single toggle row in the More menu bound to `followAlongLineAtom`, separate from the mutually exclusive listening/tahfeez mode rows.
- In Settings, remove the Quran-line toggle and availability disclosure; keep only the ahkam-tags switch.
- Gate the new rule key with `ahkamTagsAtom`; when off, the panel renders only the Quran line.

## What is left to the builder

- Implement the component changes and locale keys for the More-menu row.
- Add a focused unit test for extracting multiple rule groups from one word.
- Verify on desktop and 375px mobile, then merge to `develop`/`staging` and redeploy to the Cloudflare worker only after approval.
