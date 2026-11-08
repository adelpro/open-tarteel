# Open Tarteel — Design Directions

Three complete directions for the same product. Each one fixes the same six
complaints; they differ in mood, palette, and how much of the current UI is
thrown away. Read the diagnosis first, then pick a path.

---

## Diagnosis: why the current UI feels wrong

| Complaint                           | Actual cause in the code                                                                                                                                                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `⋯` menu hidden / clipped on mobile | `player-controls.tsx` renders an absolutely-positioned dropdown at `absolute bottom-10 end-0 w-52`. It opens upward, has no max-height or scroll, and sits inside the player card. On a phone the top of the menu leaves the viewport and gets cut.                 |
| Reciter tag hierarchy               | `reciters-list.tsx` stacks three identical chip rows — sources, riwayat, scope — plus sort and count, all at the same `text-xs` / pill weight. Every filter looks equally important, so none reads as primary, and the list is pushed below the fold.               |
| Offline message                     | A fixed amber pill, `h-8`, `text-xs`, with a pinging dot. Amber says _error_, but offline is a normal state. A permanent `animate-ping` is alarm motion. Padding is 12px horizontal and 32px tall, which is under the 44px touch target for its "Go online" button. |
| Download all under player           | `track-info.tsx` reserves a permanent `min-h-[72px]` coloured card under the transport, four lines tall, in every state including "all saved". A secondary maintenance task owns the most valuable space in the app.                                                |
| Theme colours                       | Four competing blues (`sky-500`, `#0190dd`, `blue-600`, `#2563eb`), plus indigo and violet decorative orbs, plus amber and green status blocks. No single hue owns "action". Dark mode is a blue-black navy, which reads like a developer dashboard.                |
| Settings UI/UX                      | Three heading sizes, black "Select all" button, bare checkboxes, sections that only get a border from `md` up, `m-1` margins, and no back affordance. It reads as a debug page, not a product surface.                                                              |

---

## Path 1 — **Mihrab** (recommended)

**The idea.** A quiet reading room: warm paper by day, green-black at night,
one deep emerald for action and a restrained brass for devotion-adjacent marks
(favourites, active recitation). No decorative gradients, no glow orbs, no
second blue. The interface behaves like a well-set book — it gets out of the
way of the recitation.

**Why it fits.** Quran listening is long-session, low-urgency, and Arabic-first.
Warm neutrals hold Arabic text better than cold zinc, emerald carries cultural
resonance without literal iconography, and brass gives the one warm accent the
current sky-blue can't. It is the biggest visual change but the smallest
conceptual one: same layout, new skin and hierarchy.

**Palette (light)**

| Token                      | Value                             | Role                         |
| -------------------------- | --------------------------------- | ---------------------------- |
| canvas                     | `#F6F2E9`                         | page, warm paper             |
| surface                    | `#FFFCF6`                         | cards, sheets                |
| surface-sunken             | `#EFEADD`                         | inset rows, offline strip    |
| border                     | `#E3DCCB`                         | hairlines                    |
| ink                        | `#1A1813`                         | primary text                 |
| ink-muted                  | `#6A6558`                         | secondary text               |
| primary                    | `#0C6B53`                         | action, focus, progress      |
| on-primary                 | `#FFFCF6`                         | text on emerald              |
| primary-soft               | `#DCEBE3`                         | selected row, active chip    |
| mark                       | `#8A6420`                         | favourite, active recitation |
| success / warning / danger | `#2E7D5B` / `#A9690A` / `#B23A2E` | status only                  |

**Palette (dark)** canvas `#0B110F`, surface `#121A17`, raised `#18231F`,
border `#26332E`, ink `#EDE9DF`, muted `#A5A196`, primary `#63C9A6`,
on-primary `#06211A`, mark `#D8B26B`.

**Type.** Tajawal 400/700/900 for UI (never 500/600 — not loaded). Amiri,
optional, only for surah names and ayah text. Line height 1.7 for Arabic body.

**Risk.** Warm palettes are easy to make muddy. Keep borders one step, never
tint the canvas twice.

**Effort.** Medium: new tokens in `globals.css` + `tailwind.config.ts`, then
component pass.

---

## Path 2 — **Night Qari**

**The idea.** Dark-first and player-forward. Near-black green canvas, one
luminous mint accent, everything else recedes. Light mode is a cool paper
secondary theme, not the primary one.

**Palette.** canvas `#0A0D0C`, surface `#121614`, raised `#1A201D`,
border `#242B27`, ink `#F1F0EA`, muted `#9BA097`, primary `#6FE3B8`,
mark `#E3C27E`. Light: canvas `#F3F4F1`, surface `#FFFFFF`, primary `#0B6B52`.

**Why it fits.** Most listening happens at night, in bed, with the screen dim.
A dark default is honest about the use case. It also gives the visualiser and
progress a stage.

**Risk.** Dark-only products feel like utilities, not sanctuaries. Needs the
serif/Amiri display moment and generous spacing to stay warm. Also: a light
theme that is an afterthought always looks like the afterthought.

**Effort.** High: inverts the default theme and rewrites every `dark:` pair.

---

## Path 3 — **Quiet Index**

**The idea.** Neutral, high-contrast, dense, product-y. Warm grey canvas, ink
text, a single deep teal. Think Linear/Overcast: no ornament, perfect
alignment, 44px rows, real hierarchy from type weight and spacing alone.

**Palette.** canvas `#F7F7F5`, surface `#FFFFFF`, border `#E5E5E1`,
ink `#161715`, muted `#6B6F6A`, primary `#0F6B5C`, mark `#8A6420`.
Dark: canvas `#101211`, surface `#181B19`, border `#2A2E2B`, ink `#ECEDE9`,
primary `#5FC7B2`.

**Why it fits.** Lowest risk, fastest to ship, best information density for a
114-row playlist and a 300-reciter list. No cultural styling to get wrong.

**Risk.** It has no memory. Swap the logo and it could be any audio app. For a
devotional product that is a real cost.

**Effort.** Low: mostly hierarchy, spacing, and replacing the blue ramp.

---

## Comparison

|                              | Mihrab | Night Qari | Quiet Index |
| ---------------------------- | ------ | ---------- | ----------- |
| Identity                     | strong | strong     | weak        |
| Arabic readability           | best   | good       | good        |
| Dark-mode quality            | strong | best       | good        |
| Migration cost               | medium | high       | low         |
| Risk of looking generic      | low    | low        | high        |
| Fits long listening sessions | best   | best       | good        |

**Recommendation: Mihrab.** It fixes the colour system at the root, keeps the
existing component structure, and gives the product an identity the current
sky-blue/zinc system does not have. `DESIGN.md` in the repo root specifies it.

---

## The six fixes (apply in any path)

### 1. `⋯` menu → action sheet on mobile, popover on desktop

One component, two presentations, never a clipped dropdown.

- **Mobile (< 1024px):** a `<dialog>` bottom sheet, `max-height: 72dvh`, top
  radius 20px, drag handle, scrim `rgba(0,0,0,.32)`, inner scroll, bottom
  padding `env(safe-area-inset-bottom)`. Groups as labelled sections:
  **Playback** (Listening / Tahfeez), **Sleep timer** (15 / 30 / 45 / 60 / End),
  **Player** (visualiser, speed), **App** (fullscreen, playlist).
  Rows are 48px, icon 20px, label 15px, check on the right.
- **Desktop (≥ 1024px):** an anchored popover above the trigger, `min-width:
280px`, `max-height: min(70dvh, 520px)`, scroll, `shadow-lg`, collision-aware
  so it flips below when there is no room.
- Never render the menu with `position: absolute` inside the player card again.

### 2. Reciter selector hierarchy

Replace three equal chip rows with one primary axis and one disclosure.

```
┌──────────────────────────────────────────────┐
│  Select a Reciter                        ✕   │  56px header
├──────────────────────────────────────────────┤
│  ⌕  Search reciter                           │  48px, sticky
├──────────────────────────────────────────────┤
│  (All)  Recent  Favourites  Downloaded       │  one scope row, scrolls
│                        Filters ·2     A–Z ▾  │  32px secondary row
├──────────────────────────────────────────────┤
│  Mishary Rashid Alafasy              ★       │  64px row
│  Murattal · mp3quran            ⬇  1.2k plays│
└──────────────────────────────────────────────┘
```

- **Primary axis:** scope (All / Recent / Favourites / Downloaded) as a single
  horizontally scrollable row. Selected = `primary-soft` fill, `primary` text,
  no border. This is the only always-visible filter.
- **Secondary:** a `Filters` button with an active-count badge opens a sheet
  with two labelled groups, _Sources_ and _Riwayat_, using check rows. This
  removes 15–25 chips from the default view.
- **Tertiary:** sort as a compact `A–Z ▾` trigger; the result count moves to
  the far right of the same row at 12px muted.
- **Rows:** name 16/700, moshaf 13 muted, source as 11px plain text not a chip,
  favourite star as a 44px target. Social counts collapse into one muted meta
  line. Selected row gets a 3px inset `primary` bar plus `primary-soft`
  background — never bold text alone.
- Empty state: one sentence + a `Show all sources` action.

### 3. Offline message

Offline is a state, not an error.

- **Shape:** full-width strip docked to the top of the player column (not a
  floating pill), 44px min height, `surface-sunken` background, 1px bottom
  border, 16px horizontal padding, 13px text, 16px icon.
- **Colour:** passive offline (no network) uses ink-muted icon and ink text,
  no amber. Forced offline adds a 2px `warning` left border and a static
  warning dot — amber is reserved for "you turned something on".
- **Action:** `Go online` as a 44px text button in `primary`, never a tiny
  underlined 10px pill.
- **Motion:** remove `animate-ping`. The strip may fade/slide in over 180ms on
  transition only.
- Copy: "Offline — showing downloads" (13 words max, no truncation).

### 4. Download-all under the player

Demote it to a single quiet row, and let it disappear.

- **Idle:** one 40px row — cloud icon 16 muted, `12 of 114 saved` 12px muted,
  `Download` as a 13/700 `primary` text button on the right. No background, no
  border, no progress track.
- **Downloading:** the same 40px height. Label becomes `Downloading 34 of 114`
  at 13px, a 2px progress line replaces the bottom edge of the row, and the
  action becomes a 40px cancel icon. Height never changes.
- **Saved:** hide the row entirely. The check already exists in the reciter
  selector trigger. Full management (size, remove all) lives in the playlist
  sheet header or Settings → Offline downloads.
- **Unavailable/error:** one inline sentence in `danger` at 12px; no filled
  red box.
- Keep the playlist-sheet banner, but make it the same component so the two
  never disagree.

### 5. Theme colours

- **One action hue.** Emerald owns buttons, links, focus, progress, selected
  states. Brass is a _mark_, not an action: favourites and the active recitation
  indicator only. Status colours never decorate.
- **Delete the decorative layer.** Remove the indigo/violet orbs and the body
  radial gradients. Depth comes from a 1px border and one surface step.
- **Kill the blue zoo.** Replace `sky-*`, `blue-*`, `#0190dd`, `#2563eb`,
  `#3b82f6` with `primary` / `primary-hover` / `primary-soft`.
- **Dark is green-black, not navy.** Surfaces step `#0B110F → #121A17 →
#18231F`; borders carry elevation instead of shadows.
- Contrast targets: body ≥ 7:1, muted ≥ 4.5:1, primary on canvas ≥ 4.5:1.

### 6. Settings

```
┌──────────────────────────────────────────┐
│  ←  Settings                             │  24px page title
│     Language, appearance, and downloads  │
│                                          │
│  Appearance                              │  12/700 label, muted
│  ┌────────────────────────────────────┐  │
│  │ Theme        Light System Dark     │  │  64px rows, 1px dividers
│  │ Language     العربية        ▾      │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Reciter sources                    All │
│  ┌────────────────────────────────────┐  │
│  │ ● mp3quran                    [on] │  │
│  │   Everyayah · 300+ reciters         │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

- One `max-w-xl` column, 24px gutters, 32px between groups.
- Group = one bordered `surface` card, radius 16px, rows separated by 1px
  dividers. No per-section outside margins, no border that appears only on
  desktop.
- Row anatomy: label 15/700 + description 13 muted on the left, control on the
  right, min-height 64px, full row padding 16px.
- Theme becomes a 3-up segmented control (Light / System / Dark) instead of an
  icon toggle.
- Sources become switches with provider badges beneath the label; "Select all"
  is a 13/700 text button in the group header, not a black pill.
- Offline mode is a real 44×26 switch.
- Downloads group shows `1.8 GB of 12 GB used`, a 4px bar, and `Clear downloads`
  as a danger text button.
- Add a back affordance to the player. Settings is a page, not a dead end.
