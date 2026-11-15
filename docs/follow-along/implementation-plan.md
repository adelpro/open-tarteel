# Implementation plan

Branch: `feat/follow-along` from `develop`. Two stacked PRs: data + timing
plumbing first (no UI), then the mode.

## Phase 0: research (done)

Audits, reference index, provenance, capability gate, badge correction. Output:
this folder.

## Phase 1: data build

- `scripts/build-quran-text.mjs`: pinned inputs → per-surah JSON with verbatim
  text, annotations, `wordCount`, `basmalaWords`; refuses to run on hash
  mismatch; writes `manifest.json` (sources, hashes, totals, percentages).
- `scripts/verify-quran-data.mjs`: CI check: regenerate and compare digests,
  assert the five invariants in [reference-index.md](reference-index.md).
- `src/services/quran-text/index.ts`: typed loader, no React, no fetching
  policy: takes the surah number, returns words with absolute spans.

Exit: regeneration is byte-identical; 77,878 words; 448 basmala words; corpus
hash `379fc74a…`; CI red on drift.

## Phase 2: word timings pipeline (server)

- `src/services/timings/word-timings.ts`: interval map, repair, v4 shift table,
  85% fallback. Pure.
- `src/services/timings/quranfoundation.word-timings.ts`: keep `t.segments`
  instead of dropping them; drop id 168.
- `src/services/timings/mp3quran-v4.word-timings.ts`: `/word-timings`, keep
  `ayah: 0` separately.
- `src/services/timings/index.ts`: dispatch `getSurahWordTimings`.
- `src/app/api/timings/[source]/[moshafId]/[surah]/route.ts`: return
  `{ timings, words }`.
- `src/services/reciters/cached.ts`: cache word timings, bump `CACHE_VERSION`.

Exit: fixture tests for all four segment shapes; live contract test opt-in;
`/api/timings/...` returns words for both providers.

## Phase 3: logic (no DOM)

- `src/services/follow-along/index.ts`: `wordAt(intervals, t)`,
  `ayahAt(ayahs, t)`, `buildLineStates`, `coverage()`.

Exit: unit tests with hand-built intervals, including a replay and a gap.

## Phase 4: primitives

- `src/components/quran-line.tsx`: words with `chars[{ch, rule}]`, one measure
  then scale, theme tokens, `aria-current`.
- `src/components/ayah-marker.tsx`: design 012, tinted by `currentColor`.
- `src/components/pitch-contour.tsx`: canvas, rolling window, clarity gate,
  median of 5, silence by RMS.
- `src/components/tajweed-legend.tsx`: colour plus pattern.
- `src/utils/audio-analyser.ts`: add a second analyser node (fft 2048,
  smoothing 0) on the existing context; never close the context.
- `/design-preview`: render the four in isolation.

Exit: components render without the player; no provider or fetching imports.

## Phase 5: mode and toggles

- `src/components/follow-along-controls.tsx`: fetch, map time → word, mount
  line + contour + legend, optional English line, empty/fallback states.
- `src/components/player-controls.tsx`: third `activeMode`, menu row with
  pressed/disabled/title, dot indicator.
- `src/components/player.tsx`: mount once, outside the fullscreen branches.
- `src/services/reciters/capabilities.ts`: `canUseFollowAlong` (done here).
- `src/services/reciters/flags.ts`: `isFollowAlongEnabled`.
- `src/locales/{ar,en,de}.json`: mode, intro, disabled reasons, translation
  toggle.

Exit: mode disabled with the right reason for every failing term; leaving the
mode cancels rAF and disconnects only the pitch node.

## Phase 6: ship

- About page: the copy in [README.md](README.md) + the hash table, percentages
  read from the manifest.
- Badge fix (done here): "Word-by-word" only for word timings; "Word audio" for
  Qurani.ai.
- `NEXT_PUBLIC_ENABLE_FOLLOW_ALONG`, off in production until staging passes.
- Archive the pitch-contour Vite repo as a reference demo.

## Done in this branch (phase 0)

- `docs/follow-along/*`: this documentation.
- `canUseFollowAlong` + `FOLLOW_ALONG_V4_RECITER_IDS` in capabilities.
- Provider badge split: word timing vs word audio.
- Locale key `provider.badge.wordAudio` in ar/en/de.

## Conventions

- Conventional commits, scope `follow-along` or `providers`.
- Every percentage and hash in the UI comes from the manifest.
- No Arabic text edits, ever: the pinned text is read-only input.

## Not done

- Optional English line: the CC BY-ND transport decision (bundle verbatim vs
  proxy on demand) is still open.
- Archiving the pitch-contour prototype repo.
- Coverage figures in the About block are typed; move them into the manifest
  once the build can compute them.
