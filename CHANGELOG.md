# Changelog

All notable changes to this project will be documented in this file.

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
