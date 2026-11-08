---
version: alpha
name: open-tarteel-themes
description: Open Tarteel is a quiet, Arabic-first Quran listening app with three selectable palettes — classic (zinc and sky blue), warm (paper, emerald, brass), and night (green-black and mint). Mode is a separate axis. Surfaces are flat, separated by hairline borders, and the player gives the recitation every spare pixel.
colors:
  # Default palette: classic
  canvas: '#F4F4F5'
  canvas-dark: '#0F1117'
  surface: '#FFFFFF'
  surface-dark: '#1A1F2E'
  surface-raised: '#FFFFFF'
  surface-raised-dark: '#222A3B'
  surface-sunken: '#ECECEE'
  surface-sunken-dark: '#0B0D12'
  ink: '#18181B'
  ink-dark: '#F1F5F9'
  ink-muted: '#71717A'
  ink-muted-dark: '#94A3B8'
  ink-subtle: '#A1A1AA'
  ink-subtle-dark: '#64748B'
  border: '#E4E4E7'
  border-dark: '#1E293B'
  border-strong: '#D4D4D8'
  border-strong-dark: '#334155'
  primary: '#0EA5E9'
  primary-dark: '#38BDF8'
  primary-hover: '#0284C7'
  primary-hover-dark: '#7DD3FC'
  on-primary: '#FFFFFF'
  on-primary-dark: '#06202E'
  primary-soft: '#E0F2FE'
  primary-soft-dark: '#0B2F42'
  mark: '#A16207'
  mark-dark: '#FBBF24'
  success: '#15803D'
  success-dark: '#4ADE80'
  warning: '#B45309'
  warning-dark: '#FBBF24'
  danger: '#DC2626'
  danger-dark: '#F87171'
  # Palette: warm
  warm-canvas: '#F6F2E9'
  warm-canvas-dark: '#0B110F'
  warm-surface: '#FFFCF6'
  warm-surface-dark: '#121A17'
  warm-surface-sunken: '#EFEADD'
  warm-surface-sunken-dark: '#0E1512'
  warm-ink: '#1A1813'
  warm-ink-dark: '#EDE9DF'
  warm-ink-muted: '#6A6558'
  warm-ink-muted-dark: '#A5A196'
  warm-border: '#E3DCCB'
  warm-border-dark: '#26332E'
  warm-primary: '#0C6B53'
  warm-primary-dark: '#63C9A6'
  warm-primary-soft: '#DCEBE3'
  warm-primary-soft-dark: '#14322A'
  warm-mark: '#8A6420'
  warm-mark-dark: '#D8B26B'
  # Palette: night
  night-canvas: '#F3F4F1'
  night-canvas-dark: '#0A0D0C'
  night-surface: '#FFFFFF'
  night-surface-dark: '#121614'
  night-surface-sunken: '#E9EBE6'
  night-surface-sunken-dark: '#0D100F'
  night-ink: '#16181A'
  night-ink-dark: '#F1F0EA'
  night-ink-muted: '#626862'
  night-ink-muted-dark: '#9BA097'
  night-border: '#E0E3DC'
  night-border-dark: '#242B27'
  night-primary: '#0B6B52'
  night-primary-dark: '#6FE3B8'
  night-primary-soft: '#DCEFE7'
  night-primary-soft-dark: '#12332A'
  night-mark: '#7A5718'
  night-mark-dark: '#E3C27E'

typography:
  display:
    fontFamily: 'Tajawal, ui-sans-serif, sans-serif'
    fontSize: '28px'
    fontWeight: 900
    lineHeight: '1.25'
  title:
    fontFamily: 'Tajawal, ui-sans-serif, sans-serif'
    fontSize: '24px'
    fontWeight: 700
    lineHeight: '1.3'
  section:
    fontFamily: 'Tajawal, ui-sans-serif, sans-serif'
    fontSize: '18px'
    fontWeight: 700
    lineHeight: '1.4'
  body:
    fontFamily: 'Tajawal, ui-sans-serif, sans-serif'
    fontSize: '15px'
    fontWeight: 400
    lineHeight: '1.7'
  label:
    fontFamily: 'Tajawal, ui-sans-serif, sans-serif'
    fontSize: '15px'
    fontWeight: 700
    lineHeight: '1.4'
  meta:
    fontFamily: 'Tajawal, ui-sans-serif, sans-serif'
    fontSize: '13px'
    fontWeight: 400
    lineHeight: '1.5'
  micro:
    fontFamily: 'Tajawal, ui-sans-serif, sans-serif'
    fontSize: '12px'
    fontWeight: 400
    lineHeight: '1.4'
  quran:
    fontFamily: 'Amiri, Scheherazade New, serif'
    fontSize: '28px'
    fontWeight: 400
    lineHeight: '1.9'

spacing:
  xxs: '4px'
  xs: '8px'
  sm: '12px'
  md: '16px'
  lg: '20px'
  xl: '24px'
  '2xl': '32px'
  '3xl': '40px'
  '4xl': '48px'
  '5xl': '64px'

rounded:
  control: '10px'
  row: '12px'
  card: '16px'
  sheet: '20px'
  tag: '8px'
---

## Overview

Open Tarteel is a listening room, not a dashboard. The product ships three
selectable palettes over one identical layout: **classic** (the original zinc
canvas and sky-blue action), **warm** (paper `#F6F2E9`, ink, deep emerald, brass
marks), and **night** (green-black `#0A0D0C` with mint and brass, dark-first but
with a full light mode). Palette and light/dark mode are separate choices; every
combination is designed and none is an afterthought.

Everything is flat in every palette. There are no decorative gradients, no
blurred colour orbs, no glass panels, no drop shadows on cards, and no
illustration. Separation is one 1px border plus at most one surface step. The
product is closer to a printed mushaf or a well-set book than to a music
streaming app: calm, dense where it is informational, and generous where it is
devotional. Restraint is the brand; ornament of any kind reads as a mistake.

Arabic is the primary language, not a translation layer. Layout, line height,
icon direction, and number formatting are designed for Arabic first and degrade
gracefully into English and German.

## Colors

Two axes, both on `<html>`: `data-theme="classic|warm|night"` selects the
palette, and the `light`/`dark` class selects the mode. Each role is a CSS
custom property declared once per palette and mode in `globals.css`, then mapped
to Tailwind in `tailwind.config.ts`. Components read semantic utilities only
(`bg-surface`, `text-ink-muted`, `border-border`, `bg-primary`); no component
hard-codes a hex, and no component branches on the palette name.

**Palette identity.** `warm` is the default palette; `classic` and `night` are
alternates. Each palette owns one action hue and one mark hue; the roles below
are identical across all three.

| Palette              | Canvas (light / dark) | Action                        | Mark                        | Character              |
| -------------------- | --------------------- | ----------------------------- | --------------------------- | ---------------------- |
| `warm` **(default)** | `#F6F2E9` / `#0B110F` | emerald `#0C6B53` / `#63C9A6` | brass `#8A6420` / `#D8B26B` | Paper, ink, devotional |
| `classic`            | `#F4F4F5` / `#0F1117` | sky `#0EA5E9` / `#38BDF8`     | amber `#A16207` / `#FBBF24` | Familiar, neutral      |
| `night`              | `#F3F4F1` / `#0A0D0C` | emerald `#0B6B52` / `#6FE3B8` | brass `#7A5718` / `#E3C27E` | Dark-first, low light  |

- **Canvas** (`--background`) is the page floor. Never pure white, never a
  neutral grey in `warm` or `night`, never navy. Only `classic` dark carries a
  blue tint.
- **Surface** (`--surface`) is for cards, sheets, and the player.
  **Surface-raised** is only for something floating above a surface: an open
  sheet, a popover, a modal. **Surface-sunken** is for inset bands such as the
  offline strip, progress tracks, and disabled rows. Never stack more than two
  in one view.
- **Ink** (`--foreground`) is all primary text. **Ink-muted** (`--muted`)
  carries descriptions, metadata, timestamps, and placeholders.
  **Ink-subtle** is for disabled and separator text only — never for
  information a user needs.
- **Primary** (`--accent`) is reserved for interactive meaning: buttons, links,
  focus rings, the selected segment, the active row marker, seek fill, and
  download progress. It never appears as a decorative background wash, a
  heading colour, or a brand flourish. **Primary-hover** is the only hover
  shift. **Primary-soft** (`--accent-soft`) is the single selected-state fill;
  nothing else uses a tinted primary.
- **On-primary** is the text and icon colour inside a primary fill. It is not
  always white: use the token, especially in `night` dark.
- **Mark** (`--mark`) is a devotional mark, not an action: the filled favourite
  star and the "now reciting" indicator. It is never a button colour and never
  a background.
- **Border** (`--border`) draws every hairline: card edges, row dividers, input
  outlines. **Border-strong** is for the focused input and the selected card
  only. Borders are always 1px.
- **Success / Warning / Danger** are functional and never decorative.
  Success is download-complete and saved. Warning is _forced_ offline and
  storage pressure. Danger is failed downloads and destructive actions.
  Passive offline is **not** a warning — it uses ink-muted.

Contrast rules: body text at least 7:1 on canvas, muted text at least 4.5:1,
primary on canvas at least 4.5:1, and every primary-filled control at least
4.5:1 against its on-primary. The mark colour is never used for text below
16px; when mark text is needed, use the darker light-mode value.

## Typography

One UI family, one optional scripture family. **Tajawal** ships through
`next/font/google` at weights **400, 700, and 900 only** — 500 and 600 do not
exist in the loaded set and must never be requested. **Amiri** (or Scheherazade
New) is allowed for surah names and ayah text only; it is never used for
buttons, labels, or navigation.

The scale is small and deliberate:

- **Display** — 28px / 900, one per screen at most (the hero wordmark or a
  fullscreen reciter name).
- **Title** — 24px / 700, page titles only.
- **Section** — 18px / 700, group headings and the now-playing surah name.
- **Label** — 15px / 700, row titles, button text, reciter names.
- **Body** — 15px / 400, line height 1.7. Arabic needs the extra leading; never
  go below 1.6 for a paragraph.
- **Meta** — 13px / 400, descriptions, moshaf names, provider labels.
- **Micro** — 12px / 400, counts, timestamps, progress captions. This is the
  floor; `10px` and `8px` are banned.

Arabic text takes **no letter-spacing**. Tracking utilities are only for Latin
all-caps micro labels (maximum `0.02em`). Times, durations, counts, and
percentages use tabular figures (`tnum`) so digits do not shift during playback.

## Layout

The shell is a single centred column per surface, not a global container: the
player column is `max-w-lg` (512px), the reciter sheet is `max-w-[520px]` on
mobile and a 360px docked panel from `lg`, and settings is `max-w-xl` (576px).
Horizontal page gutters are 16px on mobile and 24px from `md`.

Vertical rhythm is 4px based: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Use 16px
inside a card, 32px between groups, and 64px for a settings row's minimum
height. No `m-1`/`m-2` section margins and no breakpoint-dependent padding that
changes a card's identity.

Corners come from role, never mood: **10px** controls and inputs, **12px**
list rows, **16px** cards and the player, **20px** the top of a bottom sheet,
**999px** chips and the scope pills. A single view uses at most three radii.

Safe areas are honoured: bottom sheets pad with `env(safe-area-inset-bottom)`,
the mobile footer includes it, and nothing important sits within 16px of a
notch.

## Elevation

There is no elevation system in light mode beyond a border. Cards, rows, and
the player are flat: `bg-surface` + `1px border-border`. Shadows are allowed in
exactly two places: a bottom sheet (`0 -12px 40px rgba(20,17,10,.18)`) and a
desktop popover (`0 8px 24px rgba(20,17,10,.12)`). Never put a shadow on a card,
a button, an input, or the player. In dark mode shadows disappear entirely and
surface steps carry the hierarchy.

## Components

### Tags

There is exactly one tag primitive in the app. It has four roles and every
chip, pill, badge, and count in the product must use it. Do not write a
`rounded-full border px-3` string in a component again.

- **`filter`** — selectable. A 36px visual pill with a 44px hit area (the
  pseudo-element extends the target vertically). Rest: `border-border
bg-surface text-ink-muted`, hover `bg-surface-sunken`. Selected:
  `border-primary/30 bg-primary-soft text-primary`. Disabled: 50% opacity and
  no pointer. It is always a `<button>` with `aria-pressed`.
- **`static`** — non-interactive label: provider, riwaya, "New". 28px tall,
  `bg-surface-sunken text-ink-muted`, no border.
- **`status`** — icon + text in one functional tone (`success`, `warning`,
  `danger`, `primary`), transparent fill with the neutral `border-border`
  hairline. Used for saved, offline, failed. Never a filled coloured block.
- **`count`** — numeric metadata only, 12px, muted, tabular figures, no chrome.

Sizes: `xs` (24px) for inline metadata inside dense rows, `sm` (32px) for
static and status tags, `md` (40px visual, 44px hit) for compact toggles.
Corners are **8px**, never a full pill. Horizontal padding is generous
(`px-2.5` / `px-3` / `px-4`) and text uses a normal `leading-5`, not
`leading-none`, so it sits optically centred. Tags never carry more than two
words; longer labels belong in a filter sheet row. Selection is expressed by
fill **and** `aria-pressed`, never by colour alone.

**Filters are not tags.** A stack of chip rows is not a filter system. Source
and riwaya selection live in one Filters sheet as grouped multi-select lists;
scope (All / Recent / Favourites / Downloaded) is a `Segmented` control. Use
`filter` tags only for a single compact inline toggle, never to build rows of
options. When several tag roles share a surface, separate the groups with a
12px muted label and a 1px `border-border` rule — no boxes.

### Reciter selector trigger

A 64px row: `bg-surface`, `border border-border`, `rounded-2xl`, `px-4`.
Left: reciter name at 17/700, moshaf at 13 muted. Right: download-complete icon
(18px, success), share (20px, muted), favourite (20px, mark when active), and a
chevron (18px, muted) as the affordance to open. The whole row is the button;
nested icon buttons stop propagation. No gradient fill, no `active:scale-95` —
press feedback is a `bg-surface-sunken` flash over 120ms.

### Reciter sheet

One primary filter axis, one disclosure.

- Header 56px with title and close. Search 48px, sticky, `bg-surface-sunken`,
  `rounded-xl`, 16px icon and 15px placeholder.
- Scope is one `Segmented` control (All / Recent / Favourites / Downloaded),
  not a row of pills. Offline disables every option except Downloaded.
- Secondary row: `Filters` (with a count badge when active) on the start side,
  sort (`A–Z ▾`) on the end side, result count as 12px muted at the end.
- Sources, riwayat, and the downloadable-only switch live inside the Filters
  sheet as labelled groups separated by 1px rules. They never appear as chip
  rows in the default view. Rows are 44px checkbox rows, not tags.
- List rows are 64px. Name 16/400 (16/700 only on the selected row), moshaf 13
  muted, provider as 11px plain muted text after a `·` (not a pill), social
  counts in one meta column with a fixed icon box and right-aligned tabular
  numbers. Favourite is a 44px target. The selected row gets `bg-primary-soft`.
- Empty state: one sentence at 13px muted plus one primary text action.

### Player

Flat `bg-surface` card with `border border-border`, `rounded-2xl`, 16px padding.
Order, top to bottom: now-playing header (surah 18/700, reciter 13 muted),
visualiser, seek bar, transport, one metadata line. The surah identity belongs
above the controls, not below them.

- Transport: play is a 56px circle in primary with a 24px on-primary glyph.
  Previous, next, volume, and more are 44px ghost buttons with muted icons and
  a `bg-surface-sunken` hover. Nothing in the row is smaller than 44px.
- Seek: 4px track on `surface-sunken`, primary fill, 14px thumb that only
  appears on hover, focus, or drag. Times are 12px tabular muted.
- The `⋯` control opens a bottom sheet below 1024px and a compact centred
  dialog above it. Never an absolutely positioned dropdown inside the card.
  Groups: Playback, Sleep timer, Player, Offline, App. Rows 48px, 20px icon,
  15px label, check at the end.
- Secondary controls (speed, visualiser, sleep) are visible only while active
  or inside the sheet; the transport row never exceeds five items.
- Spectrum: a 72px canvas with three styles — Bars, Peaks, and Waves (four
  trailing silhouettes). Bands are log-spaced 90–4500 Hz, so every column
  carries a real band even on low-bitrate recitations; x index 0 is the right
  edge, keeping the bass under the eye in both LTR and RTL. The style switch
  lives under the Visualizer row in the More sheet.

### Download status

The player has no permanent download surface. The rule is: **management lives
in the `⋯` sheet, status lives in one transient floating layer.**

- The `⋯` sheet has an **Offline** group: `Download all surahs (12 of 114)`,
  live progress while downloading, `Remove downloads`, and `Manage storage`.
  These are 48px rows with a 20px icon, not a card.
- **Downloading:** a 36px floating pill above the footer (above the safe area)
  reads `Downloading 34 of 114` with a 16px progress ring. Tapping it opens the
  `⋯` sheet. It is the only download surface on screen.
- **Error:** the same pill in the danger tone with a `Retry` action.
- **Idle and saved:** nothing is shown. The reciter trigger already carries a
  success check when the whole playlist is cached.
- Per-surah download, cancel, and remove stay on the playlist rows.
- The old coloured status card and the fixed `min-h-[72px]` reserve are retired.

### Offline strip

Full width of the player column, sitting directly above the reciter trigger:
`min-h-11` (44px), `bg-surface-sunken`, 1px `border-border`, `rounded-[10px]`,
`px-3 py-2`, 13px text, 16px icon. Passive offline is neutral: muted icon, ink
text, no animation, no action. Forced offline adds a 3px `border-s` in warning
and tints the icon; `Go online` becomes a 44px primary text button at the end.
The same component is pinned above the content in fullscreen. No
`animate-ping`, no amber fill, no truncation — the message wraps if needed.

### Settings

One `max-w-xl` column, 24px gutters, 32px between groups. A group is one
`bg-surface` card with `rounded-2xl border border-border`; rows inside are
separated by `1px border-border` and are at least 64px tall with 16px padding.
Row anatomy: label 15/700 + description 13 muted on the start side, control on
the end side. Section eyebrows are 12/700 muted above the card.

Theme is two rows. **Palette** is a three-up picker of swatch cards (Classic /
Warm / Night); the selected card uses a `border-primary` + `ring-2
ring-primary/25`, and the swatch strip previews the palette in three bands.
**Mode** is a three-up segmented control (Light / System / Dark). The two are
independent: choosing Night does not force dark mode. Sources are 44×26
switches with provider badges under the label; "All" is a 13/700 primary text
button in the group header, not a filled black pill. Offline mode is a switch.
Downloads shows `1.8 GB of 12 GB used`, a 4px bar, and a danger text button to
clear. The page opens with a back affordance to the player.

### Buttons

Primary: `h-11 rounded-[10px] bg-primary px-5 text-[15px] font-bold
text-on-primary`, hover `bg-primary-hover`. Secondary: `h-11 rounded-[10px]
border border-border bg-surface px-5 text-[15px] font-bold text-ink`, hover
`bg-surface-sunken`. Text: 13/700 primary with a 44px hit area and no
underline. Destructive: danger text, never a red fill. Icon buttons are 44×44
with a `rounded-[10px]` hover wash. Focus is `ring-2 ring-primary/35
ring-offset-2 ring-offset-background` on every interactive element.

### Toggles and inputs

Switches are 44×26, `rounded-full`, primary when on, `border-strong` when off,
with a 20px thumb and a 180ms transition. Inputs are 44px tall, `rounded-[10px]`,
`bg-surface-sunken`, 1px border, 15px text, and a `border-strong` + primary ring
on focus. Selects reuse the input shape and always show a chevron.

## Motion

Motion explains a change and then stops. Durations: **120ms** for hover and
press, **180ms** for state swaps and the offline strip, **240ms** for sheets and
popovers. Easing is `cubic-bezier(0.2, 0, 0, 1)` throughout. The bottom sheet
may use a spring only while it is being dragged, with no overshoot on release.

Allowed: colour and background transitions, opacity fades, sheet translate,
progress width, the play glyph swapping. Forbidden: bounce and elastic easing,
scroll-triggered reveals, parallax, looping decoration (including `animate-ping`
and pulsing dots), hover lift on cards, and any transition above 300ms.
`prefers-reduced-motion` removes all transforms and entrances and keeps only
progress fill.

## Do's and Don'ts

**Do**

- Read colour from the CSS variables and their Tailwind aliases; let the
  `data-theme` and `light`/`dark` axes swap the whole set.
- Keep one action hue and one mark hue per palette. Never mix hues across
  palettes.
- Reach for the `Tag` primitive for every pill, chip, badge, and count.
- Separate surfaces with a 1px border before reaching for a shadow.
- Use logical properties (`ms-`, `me-`, `start-`, `end-`, `border-s`) so RTL is
  correct by construction.
- Hold 44px minimum for every touch target, including icon buttons and chips.
- Keep the floating download pill and the offline strip at a fixed height so
  the player never reflows.
- Use tabular figures for time, counts, and percentages.
- Write Arabic at line-height 1.7 and with no letter-spacing.
- Give every icon-only control an `aria-label` and visible focus.

**Don't**

- Don't add a fourth palette, or a palette-specific branch in a component.
  Components read roles, only the token blocks know hex values.
- Don't introduce a second action hue, a gradient button, or a coloured card
  background. The old blue ramp (`sky-*`, `blue-*`, `#0190dd`, `#2563eb`) is
  retired inside components.
- Don't write a one-off pill or badge. Use `Tag`.
- Don't build filter rows out of tags. Use the Filters sheet for multi-select
  and `Segmented` for scope.
- Don't use decorative gradients, blurred colour orbs, glass/blur panels, or
  background imagery. `warm` and `night` explicitly remove the ambient orbs.
- Don't put shadows on cards, buttons, inputs, or the player.
- Don't use `animate-ping`, looping pulses, or any perpetual decorative motion.
- Don't animate layout properties (`width`, `height`, `top`, `margin`).
- Don't use `text-[10px]`, `text-[8px]`, or any size below 12px.
- Don't request Tajawal weights 500 or 600 — they are not loaded.
- Don't put a dropdown menu inside a scrolling or clipped card. Use a sheet on
  mobile and a collision-aware popover on desktop.
- Don't show a coloured status box for a normal state; saved and passive
  offline have no tint.
- Don't mix `m-1`-style section margins with padded cards. One gutter system.
- Don't make the user scroll past filters to see results. One filter axis,
  one disclosure.

## Agent Prompt Guide

When building UI here, write the token block first (three `[data-theme]` sets,
each with light and `.dark` in `globals.css`), map it in `tailwind.config.ts`,
then use semantic utilities only. A component that needs a new colour adds a
role, not a hex, and never checks `data-theme`.

Quick reference, warm (default): canvas `#F6F2E9` / `#0B110F`; surface
`#FFFCF6` / `#121A17`; ink `#1A1813` / `#EDE9DF`; muted `#6A6558` / `#A5A196`;
border `#E3DCCB` / `#26332E`; primary `#0C6B53` / `#63C9A6`; primary-soft
`#DCEBE3` / `#14322A`; mark `#8A6420` / `#D8B26B`.

Classic: canvas `#F4F4F5` / `#0F1117`; surface `#FFFFFF` / `#1A1F2E`; ink
`#18181B` / `#F1F5F9`; muted `#71717A` / `#94A3B8`; border `#E4E4E7` /
`#1E293B`; primary `#0EA5E9` / `#38BDF8`; primary-soft `#E0F2FE` / `#0B2F42`;
mark `#A16207` / `#FBBF24`.

Night: canvas `#F3F4F1` / `#0A0D0C`; surface `#FFFFFF` / `#121614`; ink
`#16181A` / `#F1F0EA`; muted `#626862` / `#9BA097`; border `#E0E3DC` /
`#242B27`; primary `#0B6B52` / `#6FE3B8`; primary-soft `#DCEFE7` / `#12332A`;
mark `#7A5718` / `#E3C27E`.

Type: Tajawal 400/700/900 for UI, Amiri only for scripture. Radii 10 / 12 / 16 / 20. Motion 120 / 180 / 240ms, `cubic-bezier(0.2,0,0,1)`.

Before shipping a screen, check: one action hue per palette, no decorative
gradient, no card shadow, every target ≥ 44px, every state expresses itself
with text not only colour, the player's height does not change between download
states, the layout still reads with `dir="rtl"`, and the screen holds up in all
three palettes × both modes.
