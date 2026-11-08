# Redesign Plan — Themes, Tags, Player, Settings

Status: Phase 0 approved. Phases 1–2 implemented, awaiting validation.

Progress:

- Phase 0 — themes, tokens, primitives: done, screenshots in `docs/previews/phase-0/`.
- Phase 1 — Tag primitive: revised after feedback (8px corners, roomier, grouped,
  optical centring).
- Phase 2 — selector hierarchy: done as part of the Phase 1 revision. Chip rows
  are gone; scope is segmented and filters live in a grouped multi-select sheet.
- Phase 3 — offline strip: done.
- Phase 4 — `⋯` sheet + download relocation: done. Sheet on mobile, compact
  dialog on desktop; download control lives in the sheet; floating progress
  pill; the permanent card under the player is gone.
- Phase 5 — settings: done. Grouped cards, palette + mode, source switches,
  language select, offline switch, download management.
- Palette decision: `warm` is the default; `classic` and `night` remain
  selectable.
- Post-review fixes: `/offline-check` route restored (was a private `_`
  folder), connectivity probe deduped into one shared store, desktop playlist
  and fullscreen rows removed from the More sheet, and the spectrum replaced
  with the open-tilawa canvas models (Bars / Peaks / Waves).
- Next: redeploy to staging after the fixes.

## Decisions locked for this plan

### 1. Three palettes × two modes

Theme selection becomes two independent choices instead of one toggle:

| Palette   | Mode         | Character                                                                                                                    |
| --------- | ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `classic` | light / dark | The existing zinc + sky-blue identity, kept but cleaned of hard-coded blues. Nothing visually breaks for people who like it. |
| `warm`    | light / dark | Warm paper `#F6F2E9` + ink, emerald `#0C6B53`, brass marks.                                                                  |
| `night`   | light / dark | Dark-first green-black `#0A0D0C` + mint `#6FE3B8`, brass marks. Light mode is a cool paper secondary.                        |

Implementation: `data-theme="classic|warm|night"` on `<html>` alongside the
existing `light`/`dark` class. Tokens are declared per `data-theme` in
`globals.css`; components stay palette-agnostic. Persist palette in a new
`theme-palette` key and keep `theme-preference` for the mode, so existing users
keep their choice. An inline script sets both before first paint (no flash).
Palette and mode are independent; choosing `night` does not force dark mode.

Settings exposes it as a 3-up palette picker with live swatches + a separate
Light / System / Dark segmented control, so users understand these are two axes.

### 2. One Tag component everywhere

A single primitive replaces every pill, chip, badge, and source label:

- `filter` — selectable (scope, riwaya, source). Rest / hover / selected /
  disabled. Selected uses `primary-soft` + `primary` text, never a filled blue.
- `static` — non-interactive label (provider, riwaya, "New").
- `status` — downloaded, offline, error; icon + text, functional colour only.
- `count` — numeric metadata, tabular figures.

One size on mobile (`h-9` visual, 44px hit area via padding), one on desktop.
The tag never owns hierarchy by itself: the reciter selector has exactly one
filter row, everything else moves into a Filters sheet.

### 3. Download placement — consistent rule

**All secondary player actions live in the `⋯` sheet. All background status
lives in one transient floating layer.** No permanent download card anywhere.

- `⋯` sheet gains an **Offline** group: `Download all surahs (12 of 114)`,
  live progress while downloading, `Remove downloads`, `Manage storage`.
- Idle: no download UI under the player at all.
- Downloading: a 36px floating pill above the footer — `Downloading 34/114`,
  thin progress ring, tap opens the sheet. Dismissible.
- Error: the same pill in danger colour with `Retry`.
- Saved: nothing; the check already sits in the reciter trigger.
- Per-surah download/remove stays on playlist rows.
- `DownloadAllButton` becomes the sheet row + the pill, sharing one state hook.

### 4. Offline strip

Docked full-width strip at the top of the player column, 44px, `surface-sunken`,
1px bottom border, 13px text, 16px icon. Passive offline is neutral (no amber,
no animation). Forced offline adds a 2px warning edge and a static dot.
`Go online` is a 44px text button. No `animate-ping`, no truncation.

---

## Phases and validation gates

Every phase ends with PNG screenshots committed to `docs/previews/`, taken at
**390×844** and **1280×800**, in the palettes/modes the phase touches. I will
show them in the Review pane and stop for your approval before the next phase.
If a phase changes layout, the screenshots include the previous implementation
for comparison.

### Phase 0 — Foundations (no visible redesign yet)

- Theme engine: `themePaletteAtom`, `colorSchemeAtom`, `data-theme`, pre-paint
  script, migration of the old `theme-preference` key.
- `globals.css`: three palettes × light/dark, semantic names, legacy aliases so
  nothing breaks while components migrate.
- `tailwind.config.ts`: `canvas`, `surface(-raised|sunken)`, `ink(-muted|subtle)`,
  `primary(-hover|soft)`, `on-primary`, `mark`, status colours, `rounded` scale,
  motion tokens.
- Shared primitives: `Tag`, `Segmented`, `Switch`, `Row`.
- **Screenshot:** theme token sheet — all 3 palettes × light/dark, plus the new
  palette picker.
- **Gate:** `current` renders pixel-equivalent except for intended token fixes;
  no flash on reload; you approve the 6 frames.

### Phase 1 — Tag system unification

- Build `src/components/ui/tag.tsx` and replace chips/badges in the reciter
  list, provider badge, playlist header, playlist rows, and status labels.
- Tags are 8px corners, not pills; generous padding; `leading-5` for optical
  centring; grouped with a micro label + 1px rule when roles share a surface.
- Filter rows are retired in favour of the Phase 2 multi-select sheet.
- **Screenshot:** tag matrix (grouped, 3 palettes) and the reciter sheet
  before/after.
- **Gate:** one component per role; 44px hit areas; no visual regressions in RTL.

### Phase 2 — Reciter selector hierarchy

- Sticky search, one scope row, Filters sheet (sources + riwayat), sort trigger,
  result count, re-cut rows (16/700 name, 13 muted moshaf, 11 muted provider,
  one meta line, 44px star).
- **Screenshot:** mobile sheet (warm light, classic light, night dark),
  desktop docked panel, Filters sheet, empty state.
- **Gate:** results visible without scrolling past filters; only one filter row;
  keyboard + screen-reader order is sane.

### Phase 3 — Offline strip

- Rewrite `network-status-indicator.tsx`; dock it to the player column; add
  forced/passive variants; remove ping; 44px action.
- **Screenshot:** passive, forced, and fullscreen states × mobile/desktop.
- **Gate:** no amber for passive offline; message never truncates at 320px;
  contrast ≥ 4.5:1; reduced-motion safe.

### Phase 4 — `⋯` sheet + download relocation

- New `ActionSheet` (mobile) / `Popover` (desktop) with grouped rows and
  collision handling; remove the in-card absolute dropdown.
- Move download-all into the Offline group; add the floating status pill;
  delete the permanent `min-h-[72px]` card under the player.
- **Screenshot:** sheet open at 320px and 390px, desktop popover, four download
  states (idle / downloading / error / saved).
- **Gate:** menu never clips; player height identical across states; download
  remains discoverable in one tap.

### Phase 5 — Settings page

- Rebuild: `max-w-xl`, grouped cards, 64px rows, back to player, segmented
  mode, palette picker with swatches, source switches with badges, offline
  switch, downloads usage + clear.
- **Screenshot:** settings at 390 and 1280 in all three palettes (light + dark).
- **Gate:** every target ≥ 44px; no dead end; RTL and 320px pass.

### Phase 6 — DESIGN.md v2 + QA

- Update `DESIGN.md`: three palettes, theme engine, Tag specs, floating status
  pattern, offline strip, settings anatomy. Run `designmd_lint`.
- Run type-check, lint, unit tests, a11y sweep, RTL, reduced motion, 3 palettes
  × 2 modes.
- **Screenshot:** final contact sheet of home, selector, player, sheet,
  settings in all palettes.
- **Gate:** lint clean, tests green, your final sign-off.

---

## What I need from you

1. Approve the `classic` / `warm` / `night` palettes.
2. Confirm the download pattern: sheet owns the action, floating pill owns
   progress, nothing permanent under the player.
3. Confirm the screenshot gate: one approval stop per phase.

Once approved I start Phase 0 and bring back the 6-frame theme sheet first.
