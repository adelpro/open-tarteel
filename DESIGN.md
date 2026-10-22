---
version: alpha
name: open-tarteel-design-system
description: Open Tarteel is a free, open-source Quran recitation player built with Next.js and Tailwind CSS. The atmosphere is quiet and devotional, a warm zinc canvas lit by a soft sky-blue glow, and at night a blue-black surface under a brighter cyan accent. Roles live in CSS custom properties that the dark class swaps whole, corners are soft, and motion stays short and functional.

colors:
  primary: "#0190dd"
  primary-dark: "#0190dd"
  primary-foreground: "#ffffff"
  background: "#f4f4f5"
  background-dark: "#0f1117"
  surface: "#ffffff"
  surface-dark: "#1a1f2e"
  card: "#ffffff"
  card-dark: "#1a1f2e"
  foreground: "#18181b"
  foreground-dark: "#f1f5f9"
  muted: "#71717a"
  muted-dark: "#64748b"
  border: "#e4e4e7"
  border-dark: "#1e293b"
  accent: "#0ea5e9"
  accent-dark: "#38bdf8"
  accent-hover: "#0284c7"
  accent-hover-dark: "#7dd3fc"
  brand-cta-blue-500: "#0190dd"
  brand-cta-blue-600: "#07507f"
  brand-cta-green-500: "#10B981"
  brand-cta-green-600: "#059669"
  brand-cta-red-500: "#FF4B4B"
  brand-cta-red-600: "#DB2727"
  brand-dark-100: "#f5f6f7"
  brand-cta-dark-200: "#e5e7eb"
  brand-cta-dark-500: "#6B7280"
  brand-cta-dark-600: "#222222"
  brand-success: "#4BB543"
  brand-info: "#4D71F9"
  brand-warning: "#FFA800"
  brand-danger: "#FF4B4B"
  spectrum-meter: "#0191e2"

typography:
  display:
    fontFamily: "Tajawal, ui-sans-serif, sans-serif"
    fontSize: "60px"
    fontWeight: 900
    lineHeight: 1
  title:
    fontFamily: "Tajawal, ui-sans-serif, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Tajawal, ui-sans-serif, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Tajawal, ui-sans-serif, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.43
  caption:
    fontFamily: "Tajawal, ui-sans-serif, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: 1.33
---

## Overview

Open Tarteel is a browser based Quran recitation player. It lists reciters from several audio sources, keeps a per reciter playlist of surahs, plays them from a fixed control panel, and caches whole playlists in Cache Storage for offline listening behind an app shell service worker. The interface is Arabic first, with English and German locales, and it installs as a progressive web app.

Visually the product is quiet. A warm off-white canvas (`#f4f4f5`) carries two very soft radial washes, one sky blue and one indigo, bleeding in from opposite corners, so the page has depth without ornament. Surfaces are white with a hairline border and almost no shadow. The single blue accent does the pointing, and at night the canvas becomes blue black (`#0f1117`) with navy cards and a lighter cyan accent, which keeps the recitation controls legible in a dark room.

## Color System

Every role is a CSS custom property declared twice in `globals.css`, once under `:root` and once under `.dark`, so components are written once and recomposed by the class on the document element. The Tailwind layer maps the same names to utilities (`background: var(--background)` and so on in `tailwind.config.ts`), which means `bg-card`, `text-foreground` and `border-border` always resolve per theme. `tailwind.config.ts` sets `darkMode: 'class'`, so the class is the only switch.

- **Canvas and surfaces**: `--background` is zinc toned rather than white (`#f4f4f5` light, `#0f1117` dark), while `--surface` and `--card` are the same value (`#ffffff` light, `#1a1f2e` dark). Body text is `--foreground` (`#18181b` light, `#f1f5f9` dark), secondary text and placeholders are `--muted` (`#71717a` light, `#64748b` dark), and `--border` is `#e4e4e7` light against `#1e293b` dark, though most components bypass it with raw `gray-200` and `gray-700` utilities.
- **Accent**: `--accent` is sky blue (`#0ea5e9` light, `#38bdf8` dark) with `--accent-hover` (`#0284c7` light, `#7dd3fc` dark) and a translucent `--accent-ring` for focus, `rgba(14, 165, 233, 0.25)` in light and `rgba(56, 189, 248, 0.2)` in dark. The accent appears in focus rings, the search field, and the theme toggle.
- **Brand ramp and ambient light**: `brand-CTA-blue-500` (`#0190dd`) is the action and wordmark colour, with `brand-CTA-blue-600` (`#07507f`) as its darker companion; the config also declares green, red, neutral and status entries that no component uses. The body gradient and the three blurred orbs in `layout.tsx` use `rgba(14, 165, 233, ...)` and indigo and violet at 4 to 7 per cent alpha, and the spectrum bars use `#0191e2`.
- **Shadows**: `--shadow-sm` and `--shadow-md` are declared in both themes (`0 1px 3px rgba(0, 0, 0, 0.06)` and `0 4px 12px rgba(0, 0, 0, 0.08)` in light, heavier in dark) and no component consumes them.
- **Light values**: `background` `#f4f4f5`, `surface` and `card` `#ffffff`, `foreground` `#18181b`, `muted` `#71717a`, `border` `#e4e4e7`, `accent` `#0ea5e9`, `brand-CTA-blue-500` `#0190dd`, `spectrum-meter` `#0191e2`.
- **Dark values**: `background` `#0f1117`, `surface` and `card` `#1a1f2e`, `foreground` `#f1f5f9`, `muted` `#64748b`, `border` `#1e293b`, `accent` `#38bdf8`, `brand-CTA-blue-500` unchanged at `#0190dd`, `spectrum-meter` unchanged at `#0191e2`.

## Typography

One family ships, Tajawal, loaded through `next/font/google` with weights 400, 700 and 900 for the Arabic subset and applied as a class on `<body>`. There is no `fontFamily` extension in the Tailwind config, so any element outside that inheritance falls back to Tailwind's default sans stack, and monospaced or tabular figures are never requested.

The scale is entirely Tailwind utilities. The hero heading climbs `text-3xl` to `text-6xl` across breakpoints and is the only display moment (30px mobile, 60px at `lg`). Page headings sit at `text-3xl` or `text-4xl`, section headings at `text-2xl` with `font-black`, card titles at `text-lg font-bold`, body at the 16px default, metadata and controls at `text-sm`, badges and timestamps at `text-xs`, and two micro sizes are hard-coded as `text-[10px]` and `text-[8px]`. Headings ask for `font-extrabold` (800), a weight Tajawal does not ship, so the browser lands on 900. Line heights are Tailwind's defaults, not project decisions.

## Layout

The shell is a full height flex column, `min-h-dvh`, centred, with a fixed decorative layer of three blurred circles behind everything at `-z-10`. Content widths are set per surface rather than by a global container: the reciter page is `max-w-lg` (512px), the player panel `max-w-xl` (576px), the reciter grid dialog `max-w-4xl` (896px), and settings, about and privacy `max-w-2xl` (672px).

Rhythm is tight and utility driven. Padding steps in halves and small integers (`p-1`, `p-2`, `p-3`, `p-4`, `p-8`, `p-10`), gaps are `gap-2` to `gap-4` inside controls and `gap-6` between grid cards, and the playlist stacks rows with `gap-3`. The reciter grid is one column, then `sm:grid-cols-2`, then `lg:grid-cols-3`. Breakpoints are Tailwind defaults (`sm` 640px, `md` 768px, `lg` 1024px) because the config declares no `screens`.

## Components

### Buttons

Filled mode switches in the player use `rounded-lg px-4 py-3 text-sm font-semibold`; the selected state is `bg-blue-600 text-white` with `hover:bg-blue-700`, the resting state `bg-gray-200 text-gray-700` with `hover:bg-gray-300` and dark counterparts. Transport icon buttons are `h-9 w-9` (36px) with `rounded` (4px) and hover only adds a grey wash, with no border and no colour change. Riwaya filter chips are `rounded-lg border px-4 py-2 text-sm font-semibold`, the active one replacing the border with a `from-brand-CTA-blue-600 to-brand-CTA-blue-500` gradient and a tinted shadow. Press feedback appears once, on the reciter selector bar, which scales to 95 per cent via `active:scale-95`. Focus is a 2px ring, usually `focus-visible:ring-2 focus-visible:ring-brand-CTA-blue-500`, with `ring-offset-2` on cards.

### Header

There is no app-level header component: every page opens with its own `Hero`, so the nearest thing to a header is the reciter selector bar, a `max-w-lg` row with a grey gradient fill (`from-gray-100 to-gray-200/80`), `rounded-xl`, `p-3`, a 200px truncated reciter name and share, favourite and search glyphs between 22 and 30px. Pages that are not the player (`about`, `contact`, `privacy`) carry an in-page `headerRow` instead of a chrome bar. Do not introduce a sticky site header: the layout has none, and a page that needs orientation uses the hero.

### Cards & Containers

Reciter cards are `rounded-2xl` (16px) with a `border-gray-100` hairline, white fill, `p-4` and no shadow; hover lifts them to 103 per cent over 300ms and tints the border. Playlist rows are denser at `rounded-xl` (12px), `p-3`, `shadow-sm`, and lift 1 per cent over 200ms into a blue to white gradient. The player panel is deliberately squarer, `rounded-md` (6px) with `border-gray-200` and `p-2`, so controls read as a tool rather than a promo card. Dialogs wrap their content in `rounded-2xl` with `shadow-2xl`, at 98 per cent width up to `max-w-4xl`, over a `backdrop:bg-zinc-500/50` scrim (`dark:backdrop:bg-zinc-900/50`). Settings sections only become bordered white surfaces from `md` upwards.

### Navigation & Menu

Two mechanisms, never both at once. The player collapses five secondary controls (fullscreen, visualiser toggle, speed, sleep timer, playlist) into a `⋯` menu, so the transport row keeps only what is needed mid-recitation; the same disclosure pattern opens the advanced search options and the riwaya picker. Settings and the language switch are separate links rather than entries in a menu.

The `⋯` menu itself is a dropdown, not a dialog: `absolute bottom-10 left-0 z-10 w-52`, `rounded-lg bg-white p-2 shadow-lg` with a dark counterpart, its rows `rounded px-3 py-2 text-sm`. The overlays it or any other trigger opens are dialogs, `w-[98%]` at every breakpoint and capped at `max-w-4xl`, never a slide-over. Mode switches use the 44px segmented control, and the disclosure triggers themselves are 32px, which is below the target this system should hold.

### Footer

The footer is the app's navigation on a phone and a credit line on a desktop. Below `sm` it is a fixed bottom bar: `fixed bottom-0 left-0 z-50`, `w-full`, `bg-background/80`, `backdrop-blur-md`, `border-t border-zinc-200/80` (`dark:border-slate-800/80`), `p-2`, holding five icon links (home, about, contact, privacy, settings) spaced with `gap-8`, each icon `h-5 w-5` (the settings glyph is `size-6`) with an `sr-only` label. From `sm` it becomes `sm:static`, `sm:flex-col`, `sm:mt-5`, `sm:border-0`, `sm:bg-transparent`, `sm:backdrop-blur-none`, centred with visible labels, so the bar stops floating once there is room to lay it out. The blur exists so the fixed bar stays legible over artwork scrolled beneath it, and it is the one translucent surface in the system.

### Input Fields

Search is one full width pill, `rounded-full border border-border bg-surface p-3`, with `focus:border-accent` and `focus-visible:ring-2 focus-visible:ring-accent/20`, plus a muted placeholder. Four filter buttons overlay its trailing edge, each `rounded-full p-2.5` around a 20px icon. Tahfeez number inputs are compact, `w-20 rounded-lg border-gray-300 bg-gray-100 px-3 py-1.5 text-sm font-medium`, with `focus:ring-2 focus:ring-blue-500` and values clamped in JavaScript. Settings checkboxes are `h-4 w-4 rounded border-gray-300 text-brand-CTA-blue-600` with a matching focus ring. Range inputs are styled twice over, which is recorded under Known Gaps.

### Distinctive Components

The reciter selector is the entry point, a `max-w-lg` bar with a grey gradient fill (`from-gray-100 to-gray-200/80`), `rounded-xl`, `p-3`, a 200px truncated name, and share, favourite and search glyphs between 22 and 30px; it is the only surface with press feedback, `active:scale-95`.

The player stacks a listening or tahfeez mode switch, a transport row, a seek bar and track info, and holds the download status area at a fixed `min-h-[52px]` so the card never jumps mid download. Progress is drawn at two levels, an overall `h-1.5` bar and a per surah `h-1` bar, both on `rounded-full bg-blue-200` tracks.

The spectrum visualiser is a 90px tall canvas, at most 400px wide, with 10px meters and 4px gaps in `#0191e2`; it mounts only after the first play and is thereafter hidden with `visibility`, never unmounted, because the Web Audio API allows one source node per media element. Tahfeez adds a segmented control, `rounded-lg bg-gray-200 p-1` housing `rounded-md px-4 py-1.5` buttons, for the per ayah or whole range strategy.

## Motion & Interaction

### Durations & Easings

`tailwind.config.ts` declares four keyframes and five animations. `slideIn` travels from `translateY(-100%)` to `0` and runs at `300ms ease-out`; `fadeIn` runs at `0.4s ease-out`; `slideInWithFade` composes both at `0.2s` and `0.5s` with `ease-out`; `appear` lifts `4rem` over `0.5s ease-in-out`; `spinOnce` rotates 0 to 180 degrees over `0.5s ease-in-out`. `animate-fade-up` is not in the config at all, it comes from the `tailwindcss-animated` plugin at its default `1s ease both`.

Every other timing is hard-coded in class strings, never tokenised: `duration-200` appears 25 times, `duration-300` eight times, `duration-700` three times, and the body adds `background-color 0.35s ease` and `color 0.35s ease` in CSS. The config extends no `transitionDuration` or `transitionTimingFunction`, so there is no easing token to reuse.

### Motion Roles

Entering content fades up, cards lift on hover (1 per cent for rows, 3 per cent for reciter cards), the selector bar presses in to 95 per cent, dialogs rise with `slideInWithFade`, and the hero logo scales 105 per cent over 700ms with a pulsing decorative dot. State changes on icons and text use `transition-colors`. Progress bars use `transition-all` so widths ease. Loading uses Tailwind `animate-spin` for inline spinners and `animate-pulse` for skeletons and placeholders. The play glyph picks up `animate-slideInWithFade` while audio is playing. Nothing animates on scroll and nothing loops except pulse and spin.

### Reduced Motion

The source contains no `prefers-reduced-motion` query, no `motion-reduce` and no `motion-safe` utility anywhere in `src`. This is a gap, not a decision. Any implementation of this system should add `motion-reduce:transition-none motion-reduce:animate-none` to the card lifts, the selector press, the dialog entrance and the fade-up entrances, keep the progress bars (they carry information), and keep the visualiser silent rather than animated when the preference is set.

### Banned Motion

No bounce, spring or elastic easing, because the product is reading material and overshoot reads as playful. No scroll triggered reveals, parallax or sticky scroll effects. No perpetual ambient animation beyond the skeleton pulse, the loading spinner and the decorative hero dot. No transitions longer than 700ms, which is the ceiling already used by the logo hover. No motion on the audio bars beyond the audio itself.

## Responsive

The layout is mobile first and every breakpoint is Tailwind's default. Below `sm` the footer is a fixed bottom bar with icon only links, the player collapses five secondary controls (fullscreen, visualiser toggle, speed, sleep timer and playlist) into a `⋯` menu, and the playlist is a single column. From `sm` the footer becomes a static centred row with visible labels, the transport row exposes the full control set, and the reciter grid becomes two columns; `lg` adds a third column and the 60px hero heading. The dialog is `w-[98%]` at every size, capped at `max-w-4xl`, and the visualiser measures itself as `min(80vw, 400px)` on resize.

Touch targets are inconsistent, with 36px transport buttons, 32px download buttons, 32px theme and language buttons, a 32px seek thumb and riwaya chips near 38px, so only the 44px mode switches are comfortable. Hold 44px for primary touch targets rather than copying the 32px rows.

## Do's and Don'ts

**Do:**

- Read colour from the CSS variables and their Tailwind aliases, let the `dark` class swap them, and keep the accent single (use `accent` for focus and `brand-CTA-blue-500` for action, never a new hue).
- Use `rounded-xl` for playlist rows, `rounded-2xl` for reciter cards and dialogs, `rounded-md` for the player panel.
- Give every icon only button an `aria-label`, and a `title` where the tooltip component is not used.
- Preserve the fixed `min-h-[52px]` status slot so the player card does not resize during downloads.
- Keep entrance motion at or under 500ms and hover transitions at 200ms, with the logo hover 700ms as the absolute ceiling.
- Respect right to left. Use logical properties (`ms-2`, `start`, `end`) as the components do.

**Don't:**

- Don't add new keyframes or springs, don't exceed 700ms, and never animate layout properties such as width or height.
- Don't animate anything on scroll, and don't add parallax or sticky reveal effects.
- Don't loop decorative animation beyond the existing pulse and spinner.
- Don't hard-code a hex in a component. `range.tsx` and the volume slider already do, and they read as foreign.
- Don't reference brand ramp steps that do not exist. Only 500 and 600 are defined.
- Don't introduce a second dark mode strategy. `dark:` overrides and the `.dark` variable set must not compete.

## Known Gaps

- Spacing is untokenised. There is no `spacing` extension; padding and gaps are raw Tailwind steps.
- Radius is untokenised. No `borderRadius` extension exists, so the corner vocabulary is whatever utilities each component picked.
- Typography is untokenised. No `fontSize` or `fontFamily` extension; Tajawal arrives only through the `next/font` class on `<body>`, and two sizes are arbitrary values (`text-[10px]`, `text-[8px]`).
- Shadows and timing are untokenised. `--shadow-sm` and `--shadow-md` exist in both themes and no component consumes them (components use Tailwind `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-2xl`), and no `transitionDuration` or `transitionTimingFunction` is extended either.
- The brand ramp is incomplete. `brand-CTA-blue-50` through `400` and `700` through `900` are referenced 35 times but only `500` and `600` are defined, so those classes resolve to nothing; the green, red, neutral, status and all four `brand-CTA-dark-*` entries are declared and never used.
- Engine chrome bypasses the token layer. The mode switcher uses `blue-600`/`blue-700`, the seek bar `#2563eb` to `#93c5fd`, the volume slider `#3b82f6` and `#cbd5e1`, the scrollbar greys `rgba(156, 163, 175, 0.45)`, and the slider thumb is defined twice, at 32px with `#d3d3d3` and a `#aaa` border in `globals.css` and at 16px in `range.tsx`, where the globals rule loads later and wins.
- `appear` and `spinOnce` are declared in the config and used nowhere.
- Dark mode is handled twice, by the `.dark` variable set and by 296 `dark:` utility occurrences across the components, and there is no reduced motion support, no container query and no z-index scale (`z-10`, `z-40`, `z-50` are literal).

## Agent Prompt Guide

When generating UI in this system, write the CSS variable pair first (`:root` and `.dark`), map them into Tailwind the way `tailwind.config.ts` does, then build with semantic utilities only. Use Tajawal at 400, 700 and 900 with a single display moment per page, keep the canvas off-white or blue-black and never pure white behind the page, and let the blue accent carry focus and action alone.

Corners come from the container role (12px rows, 16px cards and dialogs, 6px player panel), shadows stay at `shadow-sm` on rows and `shadow-2xl` on dialogs, and motion stays under 500ms with no bounce. Every control needs an accessible label, and every fixed slot (the download status especially) keeps its height so the player never reflows.
