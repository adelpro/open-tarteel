# Changelog

All notable changes to this project will be documented in this file.

## [0.5.0-rc.6] - 2026-11-10

### Added

- server-rendered home and reciter pages with canonical URLs, hreflang and
  localized metadata for crawlers

### Changed

- returning listeners are sent to their last reciter from the home page; the
  redirect is cookie-based, so first-time visitors and crawlers still get the
  server-rendered home
- Tahfeez controls follow the active theme (palette and light/dark) instead of
  hard-coded colours
- develop and staging are tested locally; Netlify deploy budgets are reserved
  for production (`main`)

### Fixed

- selected reciter: hydrated on first read, shape-validated, and a corrupt
  `selected-reciter` value no longer breaks the app
- player: no layout jump or empty control row while it mounts; the skeleton
  mirrors the final card and the spectrum slot keeps its height
- player: a stored reciter with an empty cached playlist no longer traps the
  page on the loading skeleton
- player: the playback position is session-only (no stale time, no writes four
  times a second), and the audio play/pause listener is registered once
- service worker: a first install no longer reloads the page
- reciters: an in-flight catalog refresh cannot replace a newer selection or
  switch the stored moshaf

## [0.5.0-rc.5] - 2026-11-08

### Fixed

- stale Itqan playlist cache no longer hides per-track timing availability;
  the cache version is bumped and an older cached reciter is refreshed once
- Tahfeez is disabled for Itqan recitations without ayah timings, with the
  reason shown on the row

## [0.5.0-rc.4] - 2026-11-08

### Fixed

- Itqan timing coverage is now reported as partial and the provider badge says
  "Some timings" instead of claiming every recitation has ayah timings
- Itqan lazy playlists mark each surah with its real timing availability and the
  API folds that into `moshaf.hasTimings`; Tahfeez is disabled with an explicit
  "This recitation has no ayah timings" reason instead of a provider-level
  message

## [0.5.0-rc.3] - 2026-11-08

### Fixed

- connectivity probe restored at `/offline-check` (the old `_`-prefixed route
  was private and always returned 404, causing an endless request loop after
  changing reciter sources)
- one shared network-status store: one probe per 10s instead of one per mounted
  consumer, and the probe bypasses the service worker cache
- settings no longer renders a block element inside a paragraph, removing the
  hydration mismatch on that page
- desktop no longer shows Playlist and Fullscreen in both the quick actions and
  the More sheet

### Changed

- spectrum replaced with the open-tilawa canvas models: Bars, Peaks, and Waves,
  all reading log-spaced 90–4500 Hz bands so every bar moves; style switch in
  the More sheet
- `react-audio-spectrum` dependency removed

## [0.5.0-rc.2] - 2026-11-08

### Changed

- three selectable palettes (`warm` default, `classic`, `night`) with an
  independent light/system/dark mode, applied before first paint
- one 8px Tag primitive with grouped labels; filter chip rows replaced by a
  segmented scope control and a grouped multi-select Filters sheet
- reciter rows rebuilt: plain provider text, aligned favourite/view counts,
  selected-row tint, and a border-only selector trigger
- offline strip docked above the reciter trigger; neutral passive state and a
  forced variant with a warning edge and `Go online`
- player `⋯` menu is now a bottom sheet on mobile and a compact dialog on
  desktop; download-all moved into its Offline group with a floating progress
  pill and no permanent card under the player
- settings rebuilt as grouped cards with a palette picker, language select,
  source switches, offline switch, and download management
- player, playlist, seek slider, and hero retokenised
- DESIGN.md, redesign plan, and validation screenshots added

### Removed

- unused `download-error.tsx` and `theme-switcher.tsx`
- gradient/pill chip styling and the permanent download status card

## [0.5.0-rc.1] - 2026-11-07

### Features

- reciter picker rebuilt as the open-tilawa sheet: mobile bottom sheet with
  drag-to-dismiss, docked desktop panel, pinned search/filters, compact rows
  and incremental loading
- manual offline mode with a persisted switch, banner and "Go online" action
- Tahfeez offline gating, 2x2 panel and repeat/delay presets
- settings groups language/theme under Preferences
- SEO canonicals, WebApplication/Organization/Breadcrumb JSON-LD and stable
  sitemap dates
- skip-to-content link, reduced-motion support and lazy mobile visualizer
- opt-in live provider contract suite and weekly workflow

### Fixes

- download controls keep a stable height and hide offline actions
- provider 429 responses propagate `Retry-After`
- Tahfeez attaches listeners to the live audio element
- RTL logical positioning for header, settings link and language menu

### Tests

- 377 unit tests, 2 Playwright offline tests, 6 opt-in live contract tests

## [0.4.0]

### Features

- provider capability registry and badges
- MP3Quran v4 beta provider behind `NEXT_PUBLIC_ENABLE_MP3QURAN_V4`
- lazy catalog playlists with per-reciter detail hydration
- ayah timings for MP3Quran v3/v4, Itqan, Qurani.ai and Quran Foundation
- Tahfeez/range engine with live range, repeat and delay updates
- multi-select provider filter tags on the reciter list
- Listening/Tahfeez modes in the player `(...)` menu
- locale-aware player controls (RTL/LTR)
- permanent staging at `staging-tarteel.quran.us.kg`

### Fixes

- remove the fake spectrum for providers without CORS audio
- start the spectrum on the first play
- keep player controls inside the card
- white-background PWA install icons; transparent browser favicon
- health check reports the package version
- CI formatting and dependency fixes

## [0.3.0-athar]

### Features

- feat(reciters): add quran.foundation as a new audio provider

### Fixes

- fix: correct privacy page content
- fix: Open Graph metadata for proper SEO/social sharing
- fix: remove cookie-based logic from reciter sources (production-safe)
- fix: replace cookies with Jotai atom state management
- fix: handle null riwaya in Itqan source, fallback to default (Hafs)
- fix: Vitest type definitions

### Improvements

- perf(player): optimize player component rendering and state handling
- feat(playlist): add keyboard navigation support
- feat(fullscreen): introduce FullscreenController for better control
- feat(api): extend getAllReciters with explicit enabledSources param
- feat(react): enable React Compiler (experimental)
- perf(bundle): lazy load PlaylistDialog via dynamic import
- refactor(theme): remove client-side script, use useEffect

## [0.2.3]

### Features

- Add audio files caching (up to 20 audio files)

## [0.2.2]

### Features

- Add Playback speed toggle
- Add "Shuffle / Repeat / off" mode toggle
- Add tooltips for all player controls
- Add "More options" menu
- Add "Sleep timer" menu

### Fix

- Fix Language toggle left marging
- Clean up player controls component

## [0.2.1]

### Features

- Add share button
- Add fullscreen mode

### Fixes

- Chore: replace escape-html by sanitize-html
- Fixed player reload in reciter page
- Fixed generate changelog for releases
- Fixed mainfest errors
- Fixed performance issues in reciter-list

## [0.2.0]

### Fixes

- Fixed selected riwaya default value in reciter list

## [0.1.0]

### Features

- Player controls
- Visualizer
- Volume control
- Audio visualizer
- Media session integration in the player

### Refactors

- Favorite support in reciter selector aria
- Search input refactored in reciter list dialog

### Fixes

- Tachkeel bug in track info
- Reciter name display in reciter selector
- RTL layout when switching between Arabic and English

## [0.0.1]

### Features

- GunDB database integration
- Favorite counters
- Views counters
