# Changelog

All notable changes to this project will be documented in this file.

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
