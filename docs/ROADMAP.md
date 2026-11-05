# Open Tarteel — Production Hardening & Provider Roadmap

Last updated: 2026-11-05
Owner: maintainers
Status: active

This is the single traceable plan for hardening, provider work, staging, and UI
cleanup. Each stage maps to one or more small PRs. Stages are ordered by risk
and dependency, not by importance.

---

## 0. Current state

### Already implemented (uncommitted on the hardening branch)

- Build/deploy safety: `NEXT_PUBLIC_APP_URL` is the single origin source
  (legacy `NEXT_PUBLIC_TARTEEL_APP_URL` still accepted), production build warns
  when the origin is missing or localhost, `productionBrowserSourceMaps` off,
  security headers, SW no-cache headers.
- `output: 'standalone'`, non-root `Dockerfile`, `.dockerignore`,
  `GET /api/health`.
- Feedback API hardening: body/field limits, lazy mail transport (503 when
  unconfigured), bounded in-memory rate limiter.
- PWA update flow: `skipWaiting: false` + `PwaUpdater` posts
  `{ type: 'SKIP_WAITING' }`. Rationale: a waiting worker keeps the current
  caches alive until the user accepts, so an in-flight audio download or
  playback is never swapped underneath. `skipWaiting: true` would make the
  prompt unreachable.
- Error pages: valid `error.tsx`, new `global-error.tsx`, dead `_error.tsx`
  removed.
- SEO/manifest fixes: correct OG image path, deduped sitemap, ISR, manifest
  origin/scope, no malformed `scope_extensions`.
- Dependency cleanup and CI fixes (Node 22, Codecov v5, real actions).
- Server-side `unstable_cache` (1 h) around reciter adapters.

### Verified baseline

| Check                        | Result                                                             |
| ---------------------------- | ------------------------------------------------------------------ |
| `tsc` / ESLint / Prettier    | pass                                                               |
| Tests                        | **342 pass** (20 files)                                            |
| Production build             | **416 pages**                                                      |
| Docker image                 | 250 MB, non-root, health `healthy`                                 |
| `/api/reciters` payload      | **4,460,979 B** (535: 299 MP3Quran, 72 Itqan, 164 Qurani.ai)       |
| `/api/reciters` cold latency | **14.7 s local / 24 s preview** (Qurani.ai probes; Itqan now lazy) |
| `/api/reciters` cache        | **silently fails**: 4.46 MB > Next's 2 MB limit                    |
| `/api/health`                | 19 ms                                                              |
| Itqan lazy detail            | 13,891 B / 1.6 s cold (preview), 114 tracks, `c=` preserved        |

Known defect in the current hardening: `src/services/reciters/cached.ts` caches
the combined list, which is above Next's 2 MB `unstable_cache` limit. The cache
never persists. Fix in 5c/5d; do not rely on the current cache layer.

### Netlify staging (ready)

- URL: **https://staging--open-tarteel.netlify.app** (branch `staging`,
  fast-forwarded to the hardening branch).
- Site: `open-tarteel` (`523478b8-4d28-4a59-9415-53f739567f92`). Production is
  `tarteel.quran.us.kg` and was not touched.
- Verified: `/`, `/api/health`, `/manifest.webmanifest`, `/sw.js`, `/offline`,
  `/reciter/mp3quran.net-1` all 200; `/sw.js` has
  `Cache-Control: no-cache,no-store,must-revalidate`.
- `/api/reciters` on staging: **4,487,109 B / 27 s cold**, 483 reciters. This
  confirms the payload/cache work (5c/5d) is the top priority.
- Preview origin: Netlify's site env sets `NEXT_PUBLIC_APP_URL` to the
  production origin, so preview metadata/sitemap currently point at
  production. Fixed in `next.config.ts` by preferring `DEPLOY_PRIME_URL` when
  `CONTEXT` is `deploy-preview` or `branch-deploy`.
- Local `netlify deploy` fails at the blob upload step
  (`403 Request has expired`, a 30 s signed URL). Use Git branch deploys or a
  PR deploy preview instead; do not retry the local upload.

### Temporary tunnel (optional)

- URL: **https://bright-sheep-28.loca.lt** (localtunnel → `next start :3001`).
- Useful only for quick device tests; it dies with the tunnel process and the
  URL changes on restart.

### Rebase status (done)

The hardening work is rebased onto `origin/develop` on branch
`chore/production-hardening` (commit `02dd03f`). Conflicts resolved in
`.env.example`, `next.config.ts`, `package.json`, both reciter routes,
`layout.tsx`, `manifest.ts`, `html-wrapper.tsx`, `pwa-updater.tsx`, `sw.ts`,
`yarn.lock`, and the deleted `pwa-updater` type.

Resolution decisions:

- Kept develop's SW (offline cache, Qurani.ai/QF hosts, navigation fallback) and
  added `cdn.mp3quran.net` matching, `skipWaiting: false`, and the
  `SKIP_WAITING` message handler.
- Kept develop's three-language `Language` type in the reciter routes and
  routed both through the server cache.
- Kept develop's theme bootstrap in `html-wrapper.tsx`.
- Removed the duplicate `PwaUpdater` from the reciter page (layout owns it).
- Added `@testing-library/dom`, which develop's tests need but the rebased
  dependency tree was missing.

Verification: `tsc`, ESLint, Prettier, 342 tests, and the production build all
pass. `/api/reciters` is still the top risk (4.49 MB, 118 s cold).

---

## Stage 0 — Land the baseline

Goal: get the current hardening into `develop` without mixing features.

| PR  | Title                                            | Scope                                               |
| --- | ------------------------------------------------ | --------------------------------------------------- |
| 0a  | `chore(build): production deploy safety`         | env origin, headers, standalone, Docker, health, CI |
| 0b  | `fix(api): harden feedback and error boundaries` | feedback limits, `global-error`, remove `_error`    |
| 0c  | `fix(pwa): wire real waiting update flow`        | `skipWaiting:false`, `PwaUpdater`, SW headers       |
| 0d  | `chore(seo): fix metadata, manifest and sitemap` | OG image, dedupe, ISR, manifest                     |
| 0e  | `chore(deps): remove unused dependencies`        | deps + lockfile                                     |

Acceptance: CI green, Docker smoke test, no localhost in production bundle,
`NEXT_PUBLIC_APP_URL` required in production.

---

## Stage 1 — Dead code & hygiene

Goal: remove confirmed dead code, add a guard so it does not return.

### Confirmed findings (main)

- `src/components/tags.tsx` — no importers.
- `src/hooks/use-escape-key-hook.ts` — no importers.
- Unused SVGs: `activity`, `checked`, `connection-animated`, `connection`,
  `download`, `file`, `fullscreen`, `image-place-holder`, `music-repeat`,
  `peer`, `progress`, `saved`, `spinner`, `underconstruction`, `upload`.
- `LinkSource.ISLAMHOUSE`, `INTERNETARCHIVE`, `UNKNOWN` — no producers.
- Already removed: `src/app/_error.tsx`, `opengraph-image copy.png`,
  `wavesurfer.js`, `jotai-devtools`, `@svgr/webpack`, unused ESLint plugins,
  `@types/escape-html`, `@types/webtorrent`.
- Re-check on `develop` after merge: `merged-reciters.ts` may make some
  `LinkSource` values live.

### Work

| PR  | Title                                             | Scope                                   |
| --- | ------------------------------------------------- | --------------------------------------- |
| 1a  | `chore: remove dead components, hooks and assets` | delete above, verify no dynamic imports |
| 1b  | `chore: add knip guard`                           | `knip` dev dep + config + CI job        |

Acceptance: `knip` clean (or documented allowlist), build/tests unchanged,
zero visual diff.

---

## Stage 2 — Player flash on reciter change

Goal: remove the flash/layout jump when switching reciter, without redesign.

### Verified root causes

1. `Player` is not remounted or reset when `playlist` changes. `currentTrack`
   persists and can be out of range for the new playlist.
2. `TrackInfo` returns `null` when the track is out of range, so the player
   card collapses and then grows again (layout shift).
3. `duration` and `currentTime` are stale from the previous reciter, so `Range`
   keeps the old `max`/value until `durationchange`.
4. `isPlaying` persists across the change; the play effect runs before the new
   `src` has metadata, causing autoplay rejection and an icon/state mismatch.
5. `TrackInfo` reads `selectedReciterAtom` while `Player` receives a `playlist`
   prop, so title and audio can briefly disagree.
6. `AudioBarsVisualizer` mounts/unmounts a 90 px block, adding vertical shift.

### Work

| PR  | Title                                                 | Scope                                                                                               |
| --- | ----------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| 2a  | `fix(player): reset playback state on reciter change` | derive safe track index, reset duration/time, gate play on `canplay`, fixed-height info placeholder |
| 2b  | `fix(player): keep track info in sync with playlist`  | pass track/reciter data down instead of reading the atom, or key `Player` by `reciterId:moshafId`   |
| 2c  | `test(player): reciter-switch regression`             | RTL test: switch playlist, assert no null track, no stale duration                                  |

Preferred minimal fix: key the player (`key={reciterId:moshafId}`) and pass an
`initialTrackId` so the same surah can be preserved. This removes the whole
class of stale-state bugs and is smaller than deriving every field.

Acceptance: CLS 0 on reciter switch, no `0:00 / 0:00` flash, correct play icon,
audio starts once, tested with MP3Quran + Itqan + Quran Foundation.

---

## Stage 2b — Spectrum visualizer port from `adelpro/open-tilawa`

Goal: replace `react-audio-spectrum` with the dependency-free canvas
visualizer from `adelpro/open-tilawa`: three models (`bars`, `peaks`,
`ribbon`), 28 bars, a 56-point four-layer ribbon, DPR-aware rendering,
`ResizeObserver`, theme-aware tints, reduced-motion support, and a 30 Hz data
read. It is smaller, smoother, and drops a runtime dependency.

### Source files (open-tilawa, `main`)

| File                                      | Lines | Purpose                                                                          |
| ----------------------------------------- | ----- | -------------------------------------------------------------------------------- |
| `apps/web/src/components/visualiser.tsx`  | 282   | canvas component and three draw models                                           |
| `apps/web/src/utils/audio-analyser.ts`    | 116   | singleton `AudioContext`/`AnalyserNode`, same-origin gate, output gain           |
| `apps/web/src/utils/visualiser-models.ts` | 121   | `downsample`, `follow`, `logBands`, `mixHex`, `waveTints`, `normaliseVisualiser` |
| `apps/web/test/visualiser-models.test.ts` | 115   | unit tests for the models                                                        |

License note: `open-tilawa` currently has no root `LICENSE` file (GitHub
license API returns 404). It is the same owner, but confirm the license and add
an attribution note before copying if other contributors are involved.

### Adaptation for open-tarteel

1. **Paths**: `src/components/visualizer.tsx`,
   `src/utils/audio-analyser.ts`, `src/utils/visualiser-models.ts`.
2. **Theme**: open-tarteel toggles `.dark` on `<html>`, not `data-theme`.
   Replace the `data-theme` `MutationObserver` with a class observer or the
   existing `themeAtom`; read the current blue (`#0191e2`) or Tailwind tokens
   instead of `--wave-front` / `--wave-back`.
3. **State**: replace `playing`/`model` props with `isPlaying` and a new
   `visualizerModelAtom` (persisted). Keep `showVisualizerAtom`.
4. **Audio safety (critical)**: `createMediaElementSource()` on a cross-origin
   element without CORS can mute playback. open-tarteel already sets
   `crossOrigin="anonymous"`; MP3Quran CDN sends `Access-Control-Allow-Origin:
*`, but Itqan (`storage.cms.itqan.dev`) does not. Gate the analyser on an
   explicit `canAnalyse(src)` check (same-origin or known CORS hosts) and never
   connect the graph otherwise. Render a flat shelf for unsupported providers
   and keep audio untouched.
5. **Volume**: the WebAudio graph bypasses `audio.volume`. Route `volumeAtom`
   through `setOutputGain`, and keep the iOS read-only-volume probe
   (`canSetElementVolume`).
6. **Layout**: keep the canvas mounted with a fixed height and fade opacity
   when paused/hidden, so the controls never jump. This also fixes the
   visualizer contribution to the Stage 2 flash.
7. **Performance**: stop `requestAnimationFrame` when paused or the tab is
   hidden; cap DPR at 2; keep the 30 Hz data read.
8. **Dependency removal**: remove `react-audio-spectrum` after parity.

### PRs

| PR   | Title                                                     | Scope                                              |
| ---- | --------------------------------------------------------- | -------------------------------------------------- |
| 2b-1 | `feat(player): port visualizer models and tests`          | pure utils + unit tests, no UI                     |
| 2b-2 | `feat(player): port canvas visualizer with three models`  | component, theme, reduced motion, fixed height     |
| 2b-3 | `fix(player): gate analyser on CORS and wire volume gain` | same-origin/CORS check, `setOutputGain`, iOS probe |
| 2b-4 | `chore(deps): remove react-audio-spectrum`                | dependency + bundle check + screenshot             |

Acceptance:

- Bars, peaks and ribbon switch without a reload or a new request.
- No layout shift; the canvas keeps its height when paused.
- MP3Quran audio stays audible and animates; Itqan audio stays audible with a
  flat shelf (no analyser data).
- Volume still works on desktop and iOS.
- `prefers-reduced-motion` stops the animation but keeps the layout.
- `react-audio-spectrum` removed; bundle does not grow.
- Model tests cover `downsample`, `follow`, `logBands`, `normaliseVisualiser`,
  `mixHex`, `waveTints`.

Risks:

- Routing cross-origin audio through WebAudio can silence it; the CORS gate is
  non-negotiable.
- iOS requires the `AudioContext` to be created on a user gesture (first play).
- Theme tokens differ between the two apps; verify light and dark screenshots.

---

## Stage 3 — Provider capability registry & badges

Goal: one source of truth for what each provider can do, used by UI and by
range/tahfeez logic.

### New module

`src/services/reciters/capabilities.ts`

```ts
export type TimingLevel = 'none' | 'ayah' | 'word' | 'letter' | 'phoneme';

export type ProviderCapabilities = {
  id: LinkSource;
  label: { ar: string; en: string };
  beta: boolean;
  timing: TimingLevel;
  timingCoverage: 'all' | 'partial' | 'none';
  names: 'ar' | 'ar+en';
  riwayah: { multiple: boolean; qiraah: boolean };
  audioTiers: Array<'original' | 'mp3_64' | 'opus_48'>;
  auth: 'none' | 'oauth2';
  cors: 'open' | 'restricted';
  download: boolean;
  rateLimit?: string;
  docsUrl: string;
};
```

### Badge rules (minimal UI)

Show at most 2 badges on a card, then `+N` with a tooltip.

| Badge       | When                         | Arabic     |
| ----------- | ---------------------------- | ---------- |
| Timing      | `timing !== 'none'`          | توقيت      |
| Word        | `timing` is `word` or deeper | كلمة بكلمة |
| Beta        | `beta`                       | تجريبي     |
| No download | `download === false`         | لا تحميل   |
| Riwayah     | multiple riwayah available   | رواية      |

Do not use color alone; pair icon + text. Badges must be RTL-safe and truncate
before the reciter name.

| PR  | Title                                  | Scope                                      |
| --- | -------------------------------------- | ------------------------------------------ |
| 3a  | `feat(providers): capability registry` | types, data, `getCapabilities`, unit tests |
| 3b  | `feat(ui): provider badges`            | card badges + tooltip + i18n               |

Acceptance: matrix unit-tested; badge overflow works in ar/en; no layout shift.

---

## Stage 4 — MP3Quran v4 beta provider

Goal: add v4 as a separate, selectable provider with a visible beta label. Keep
v3 untouched.

### API facts (verified 2026-11-05)

- Base: `https://api-staging.mp3quran.net/v4` (staging).
- Docs: `https://docs-staging.mp3quran.net` + `/openapi.json` (23 endpoints).
- CORS: `*`; no key.
- `GET /reciters`: 13 KB, `name` + `name_latin`, stable `code` (slug).
- `GET /recitations`: 46 KB; `riwayahs[]` (`code`, `qiraah`, `name`),
  `tariq`, `wajh`, `style`, `has_ayah_timings`, `coverage.surahs`,
  `total_duration_ms`, `audio.base` + `audio.files` tiers
  (`original`, `mp3_64`, `opus_48`), torrents.
- `GET /recitations/{code}/surahs/{n}`: ready URLs + `bytes` + `sha256` +
  `bitrate_kbps`; `timings` lists available levels.
- Timings: `ayah-timings`, `word-timings`, `letter-timings`,
  `phoneme-timings` (beta). Ayah `0` = basmalah, `-1` = isti'adhah.
  `include=text` adds rasm/plain words. `estimated[]` flags computed times.
- Locale: `?locale=en` or `Accept-Language`; 3-letter v3 codes also resolve.
- Pagination: cursor; `sort`; `ETag` / `If-None-Match`.
- Errors: real HTTP status + `{ error: { code, message, field } }`.

### Design decisions

- New `mp3quran-v4.adapter.ts` + `mp3quran-v4.types.ts`; v3 stays.
- Never use v4 numeric `id` in URLs; keep the existing `source:id` scheme and
  store the stable `code`.
- Build playlists from `audio.base` + `audio.files.original`; never fetch 114
  surah endpoints.
- Default tier: `original`; choose `mp3_64` when `navigator.connection.saveData`
  or `effectiveType` is 2g/3g; expose `opus_48` only if `canPlayType` passes.
- Feature flag: `NEXT_PUBLIC_ENABLE_MP3QURAN_V4` (default `false`) and
  `MP3QURAN_V4_BASE_URL`.
- Availability probe: if v4 is down, hide the source and log once; never break
  the reciter list.
- Dedupe against v3 when both are enabled: normalized name + riwayah + style;
  prefer v4 only when the flag is on, otherwise label both.

| PR  | Title                                           | Scope                                                        |
| --- | ----------------------------------------------- | ------------------------------------------------------------ |
| 4a  | `feat(providers): mp3quran v4 types and client` | types, fetch with retry/timeout, ETag, pagination            |
| 4b  | `feat(providers): mp3quran v4 adapter`          | map to `Reciter`/`Moshaf`/`Playlist`, riwayah mapping, tests |
| 4c  | `feat(ui): mp3quran v4 beta source`             | flag, source label, beta badge, settings toggle              |
| 4d  | `test(providers): v4 contract fixtures`         | recorded fixtures for reciters/recitations/surah/timings     |

Acceptance: flag off = zero change; flag on = playback + 114 surahs + riwayah
label; no v3 regression; graceful fallback when staging is unreachable.

Risk: staging API can change without notice. Keep the adapter isolated and
pin the contract tests so breakage is obvious.

---

## Stage 5 — Timing providers for range navigation

Goal: enable repeat-range for every provider that has timings, in this order:
MP3Quran v4 → MP3Quran v3 → Itqan → Qurani.ai → Quran Foundation.

### Interface

```ts
export type AyahTiming = { ayah: number; startMs: number; endMs: number };

export type TimingProvider = {
  supports(source: LinkSource, moshaf: Moshaf): boolean;
  getSurahTimings(input: {
    source: LinkSource;
    reciterId: string;
    moshafId: string;
    surah: number;
  }): Promise<AyahTiming[]>;
  getWordTimings?(input: unknown): Promise<unknown[]>;
};
```

### Provider notes

- **MP3Quran v4** (first): `/recitations/{code}/surahs/{n}/ayah-timings`.
  Cache forever (files are immutable). Handle `ayah 0`/`-1`; surface
  `estimated[]`. Word/letter/phoneme only when the surah item lists them.
- **MP3Quran v3** (second): `GET /api/v3/ayat_timing/reads` (38 KB) tells which
  reads have timings; then `/ayat_timing?surah=&read=`. Cache the reads map for
  24 h. Only enable the mode when the current `moshaf` has a matching read.
- **Itqan** (third): timings already come with recitation tracks
  (`ayahs_timings`); do not add a second request. Fix the N+1 first (Stage 5c).
- **Qurani.ai** (fourth): `includeTimings=true` on the surah endpoint; map
  `narratorIdentifier` to riwayah. Verify CORS before enabling downloads.
- **Quran Foundation** (last): harden the existing route. Validate
  `1..114` and positive ids, add `unstable_cache`, handle `429` +
  `Retry-After`, and reuse `segments` for word-level ranges.

### Payload + cache fix (blocking for Stage 5)

Two compounding problems:

1. `/api/reciters` embeds a full 114-item playlist in every reciter. 319
   entries produce **2,494,310 B**.
2. `unstable_cache` refuses entries over 2 MB. The server log shows
   `Failed to set Next.js data cache ... 2727756 bytes`, so the cache is
   **silently not working**. The 0.56 s "warm" measurement is upstream luck,
   not a cache hit.
3. `/api/reciters/[id]/[moshafId]` re-fetches the whole list and filters in
   memory, so it has the same cost as the list route.

Fix:

- Split `Reciter` (list DTO) from `ReciterDetail` (with playlist).
- `/api/reciters` returns metadata only (name, source, riwayah, moshaf id/name,
  surah count, capability flags). Target < 100 KB.
- Add `getReciter(id, moshafId)` to `ReciterSource`; the detail route returns
  one playlist.
- Fetch the detail on selection and prefetch on hover; show a skeleton in the
  player.
- Cache each adapter separately so no entry crosses 2 MB.
- Itqan: remove the 214 KB-per-reciter N+1 by lazy-loading tracks or using the
  recitation-tracks list with `page_size` up to 1000 and only needed fields
  (`id`, `surah`, `audio_url`, `ayahs_timings`). Send `Accept-Language`.

| PR  | Title                                                          | Scope                                                                   |
| --- | -------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 5a  | `feat(timings): timing provider interface + registry`          | interface, resolution, cache, tests                                     |
| 5b  | `feat(timings): mp3quran v4 ayah/word timings`                 | adapter + cache + basmalah handling                                     |
| 5c  | `perf(reciters): slim list DTO and detail endpoint`            | split DTO, `getReciter`, per-adapter cache                              |
| 5d  | `perf(itqan): remove N+1 detail fetches`                       | **Itqan done** (lazy tracks); payload split for other providers remains |
| 5e  | `feat(timings): mp3quran v3 timing api`                        | reads map + per-surah timings                                           |
| 5f  | `feat(timings): qurani.ai timings`                             | `includeTimings`, narrator mapping                                      |
| 5g  | `fix(timings): harden quran foundation route`                  | validation, cache, 429, auth                                            |
| 5h  | `test(providers): localization, env matrix and live contracts` | unit gaps, opt-in contract suite, weekly workflow                       |

### Itqan API v1 (implemented for Itqan)

The official API is paginated at 20 rows per page for both the catalog and the
track list, and the catalog is 72 recitations, not 20. The adapter now:

- sends `X-API-Key` when `ITQAN_API_KEY` is set, plus `X-Client-Name`,
  `X-Client-Version`, and `Accept-Language: ar|en|de→en`; also sends the
  `language` query parameter because the gateway caches by URL and otherwise
  reuses the first language response;
- paginates `/recitations/` (`page_size=100`, 72 rows) and `/recitations/{id}`
  (`page_size=200`, 114 tracks);
- returns an empty playlist from `getReciters` and loads the 114 tracks lazily
  through `getReciterPlaylist` on selection, cached for 1 h;
- preserves the `c=<app-slug>` query parameter on every audio URL, which Itqan
  uses for usage accounting.

Measured: catalog 271 KB / 1.6 s; one full track list 555 KB / 2.8 s.
Remaining: apply the same list/detail split to MP3Quran and Qurani.ai, which
still dominate `/api/reciters`.

Acceptance: tahfeez/range mode is enabled by capability, not by a hard-coded
source check; unsupported reciters show a disabled state with a reason;
duration vs last `endMs` mismatch is detected and reported.

---

## Stage 6 — Tahfeez / repeat-range review

Reviewed `origin/develop`: `tahfeez-mode-controls.tsx`,
`use-tahfeez-session.ts`, `player-controls.tsx`, and the QF route.

### P0 — correctness

1. **Mode switch does not stop the loop.** Clicking "listening" only calls
   `setActiveMode`; the session keeps playing. Call `session.stop()` on switch.
2. **Ayah index vs array index.** `computeRanges` uses
   `segments.slice(fromAyah - 1, toAyah)`. This assumes the array index equals
   the ayah number; basmalah entries (`ayah 0`) or missing ayahs break it.
   Filter by `seg.ayah` instead.
3. **Stale response race.** `fetchTimestamps` has no `AbortController` or
   request id; fast reciter/chapter switching can apply the previous chapter's
   segments.
4. **Invalid range is silent.** `toAyah < fromAyah` yields `null` ranges and no
   message.
5. **Off-by-one + bad defaults.** `fromAyah` max is `segments.length - 1`, so
   the last ayah cannot be a start; `toAyah` defaults to `5` on short surahs
   (e.g. Al-Kawthar has 3). Clamp on load.
6. **Audio bleed.** `timeupdate` fires about every 250 ms, so playback
   overshoots `endTime` into the next ayah. Use a `requestAnimationFrame` loop
   or schedule at `endTime - 50 ms`.

### P1 — UX and robustness

7. **Every settings change stops playback.** Inputs call `onCleanup()` →
   `session.stop()` → pause + seek to 0. Update ranges live instead.
8. **Fragile listener attach.** `useTahfeezSession` retries with
   `setTimeout(0)` to find `audioRef.current`. Use a callback ref or re-run the
   effect when the element changes.
9. **Debug logging** in `fetchTimestamps` (`console.log`).
10. **Possible double mount.** Two `TahfeezModeControls` render paths exist
    (mobile/desktop). Confirm only one mounts, otherwise timestamps are fetched
    twice and both call `onRangesReady`.
11. **Route hardening.** No cache, no range validation, no `Retry-After`
    handling.
12. **Accessibility.** Inputs use a `<span>` instead of `<label htmlFor>`;
    strategy is two buttons, not a radiogroup; loading/error lack `aria-live`.

### P2 — polish (only if minimal)

13. Presets for repeat (3/5/7/10) and delay (0/1/2/3 s).
14. "Repeat current ayah once" quick action.
15. Persist settings per reciter only if it stays minimal.

| PR  | Title                                                          | Scope                   |
| --- | -------------------------------------------------------------- | ----------------------- |
| 6a  | `fix(tahfeez): stop session on mode change and validate range` | P0.1, P0.4, P0.5        |
| 6b  | `fix(tahfeez): map ranges by ayah and cancel stale fetches`    | P0.2, P0.3              |
| 6c  | `fix(tahfeez): remove audio bleed at range end`                | P0.6 + fake-timer tests |
| 6d  | `fix(tahfeez): live settings updates and a11y`                 | P1.7, P1.12             |
| 6e  | `perf(tahfeez): cache timestamps and harden route`             | P1.11                   |

Acceptance: no bleed on 3 surahs, settings change does not pause, switching to
listening stops audio, invalid ranges explain themselves, keyboard + screen
reader usable.

---

## Stage 7 — Offline & service worker

Goal: make downloaded audio actually work offline.

### Findings

- SW matcher only matches `server\d+.mp3quran.net`, but v3 now serves
  `cdn.mp3quran.net/audio/...` → runtime caching misses nearly all audio.
- Downloads go to `quran-offline-downloads`; streaming goes to `quran-audio`.
  Two caches, no shared lookup, no range support.
- No `RangeRequestsPlugin`, so offline seeking fails.
- `useOfflineDownload` keeps per-instance state; navigating away loses progress.
- Itqan audio (`storage.cms.itqan.dev`) has **no `Access-Control-Allow-Origin`**
  and `OPTIONS` returns 403, so CORS downloads fail. Streaming still works.
- MP3Quran CDN supports `206`, `Accept-Ranges`, exposes
  `Content-Length`/`Content-Range`, and sends `Cache-Control: immutable`.
- Catalog caching was keyed incorrectly: a 3 s NetworkFirst timeout fell back
  to **any** `/api/reciters` entry, so one language/source was served for every
  request, and detail requests received the list. Fixed with an exact-URL
  `api-reciters-v2` cache, a 30 s timeout, cache deletion on activation, and
  `private, no-store` route responses.

### Work

| PR  | Title                                                       | Scope                                                                |
| --- | ----------------------------------------------------------- | -------------------------------------------------------------------- |
| 7a  | `fix(sw): match cdn.mp3quran.net and unify audio cache`     | matcher, one cache, range plugin                                     |
| 7b  | `fix(offline): shared download state + storage persistence` | atom/singleton, `navigator.storage.persist()`, quota errors          |
| 7c  | `fix(offline): itqan download strategy`                     | same-origin range proxy with allowlist, or mark download unsupported |
| 7d  | `test(offline): cold-start offline navigation`              | install → download → airplane mode → play/seek/next                  |

Acceptance: 3 downloaded surahs play and seek offline; no 404; quota errors are
handled; Itqan never fails silently.

---

## Stage 8 — Netlify + permanent staging

Goal: replace the temporary tunnel with deploy previews.

### Config

`netlify.toml`:

```toml
[build]
  command = "corepack yarn build"
  publish = ".next"

[build.environment]
  NODE_VERSION = "22"
  NETLIFY_NEXT_SKEW_PROTECTION = "true"

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"
    Service-Worker-Allowed = "/"
```

- Netlify's OpenNext adapter handles SSR/ISR/API routes. It does not need
  `output: 'standalone'`; keep standalone for Docker and make it conditional
  (`process.env.NETLIFY ? {} : { output: 'standalone' }`), then validate in a
  deploy preview.
- Env scopes: Production, Deploy Preview, Branch deploy.
  - `NEXT_PUBLIC_APP_URL` = `$URL` (Netlify's deploy URL) for previews, the
    canonical domain for production.
  - Feedback vars optional; QF credentials only when QF is enabled.
- Deploy preview per PR = live staging. No `netlify deploy` from CI until a
  token exists.

| PR  | Title                                        | Scope                                                    |
| --- | -------------------------------------------- | -------------------------------------------------------- |
| 8a  | `chore(deploy): netlify config and env docs` | `netlify.toml`, `docs/DEPLOY.md`, conditional standalone |
| 8b  | `ci(deploy): preview smoke test`             | curl `/api/health`, sitemap origin, SW headers           |

Acceptance: preview URL green, health 200, sitemap origin = preview origin, SW
registers, no localhost in the bundle.

Blocked: Netlify CLI/token not available in this environment. Config can be
written now; the first deploy needs the repo connected in Netlify or a token.

---

## Stage 9 — Google web best practices

| Area            | Finding                                                         | Action                                                                             |
| --------------- | --------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Metadata        | title/description/OG/Twitter present; no canonical              | add `alternates.canonical` per page                                                |
| Structured data | none                                                            | `WebApplication`, `Organization`, `BreadcrumbList`, `AudioObject` on reciter pages |
| Fonts           | `next/font`, Arabic subset, 3 weights                           | keep, verify `display: swap`, consider variable font                               |
| Images          | `next/image` used                                               | enforce width/height, verify OG dimensions, add `sizes`                            |
| A11y            | icon buttons mostly labelled; contrast borderline; no skip link | skip link, focus-visible, contrast pass, form labels                               |
| Motion          | animations ignore reduced motion                                | `prefers-reduced-motion`                                                           |
| Performance     | 2.49 MB `/api/reciters`; spectrum on mobile                     | payload budget, split providers, lazy spectrum                                     |
| PWA             | manifest valid                                                  | add `maskable` icon, `display_override`, verify installability                     |
| Security        | no CSP                                                          | report-only CSP first                                                              |
| SEO             | sitemap `lastModified` = now                                    | use data timestamps                                                                |

| PR  | Title                                               | Scope                          |
| --- | --------------------------------------------------- | ------------------------------ |
| 9a  | `feat(seo): canonical, JSON-LD, sitemap timestamps` | metadata + structured data     |
| 9b  | `fix(a11y): focus, labels, reduced motion`          | audit fixes                    |
| 9c  | `perf: reciter payload budget and lazy visualizer`  | split/paginate, dynamic import |

Acceptance: Lighthouse mobile ≥ 90 perf, 100 a11y, 100 SEO, installable;
Rich Results test passes; CLS 0.

---

## Stage 10 — Minimal UI cleanup

Rules: no redesign, no new component library, no token rewrite. Only
consistency and reduction.

| PR  | Title                                               | Scope                                              |
| --- | --------------------------------------------------- | -------------------------------------------------- |
| 10a | `style: unify control sizes, radius and icon scale` | h-9/h-10, `rounded-lg`, `ICON_SIZE`                |
| 10b | `style: reduce player chrome on small screens`      | hide visualizer by default, one-line download area |
| 10c | `style: reciter card density`                       | 1 badge row, truncate name, riwayah secondary      |
| 10d | `style: tahfeez panel 2x2 + presets`                | minimal, keep behavior                             |
| 10e | `style: dark mode and RTL parity`                   | logical properties, contrast                       |

Acceptance: screenshot diff (ar/en, light/dark, mobile/desktop), no functional
change, bundle not larger.

---

## Provider matrix

Values verified against official docs and live endpoints on 2026-11-05.
"Verify" means the field exists but was not confirmed in a live response.

| Provider               | Timing                                                     | AR / EN names                                   | Riwayah                                      | Audio                         | Auth                                             | CORS                              | Download               | Badge                                  |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------- | -------------------------------------------- | ----------------------------- | ------------------------------------------------ | --------------------------------- | ---------------------- | -------------------------------------- |
| **MP3Quran v3**        | Ayah, via separate `/api/v3/ayat_timing` (subset of reads) | AR only                                         | Yes, via moshaf; multiple moshaf per reciter | MP3                           | None                                             | `*`                               | Yes                    | `توقيت` only when the read has timings |
| **MP3Quran v4 (beta)** | Ayah + word + letter + phoneme                             | AR + EN (`locale`, `Accept-Language`)           | Yes: riwayah + qiraah + tariq + wajh + style | MP3 original / 64k / Opus 48k | None                                             | `*`                               | Yes (Range, immutable) | `تجريبي` + `توقيت` + `كلمة بكلمة`      |
| **Itqan**              | Ayah (`ayahs_timings` on tracks)                           | AR + EN (`Accept-Language`)                     | Yes: riwayah + qiraah                        | MP3                           | Optional `X-API-Key`                             | **No** on `storage.cms.itqan.dev` | **No** (CORS)          | `توقيت` + `لا تحميل`                   |
| **Qurani.ai**          | Ayah (`includeTimings=true`)                               | AR + EN (`name` / `englishName`)                | Yes (`narratorIdentifier`)                   | MP3 + word-by-word            | Free; key for advanced                           | Verify                            | Verify                 | `توقيت` + `كلمة بكلمة`                 |
| **Quran Foundation**   | Ayah + word `segments`                                     | EN on the public fallback; AR `name` with OAuth | Verify                                       | MP3                           | OAuth2 optional; public `api.quran.com` fallback | Server-side                       | Verify                 | `توقيت دقيق` + `رسمي`                  |

### Suggested badge priority

1. `Beta` — only MP3Quran v4 until it leaves staging.
2. `Timing` — any provider with ayah timings.
3. `Word` — word-level timings (v4, Qurani.ai, QF).
4. `No download` — Itqan until a proxy exists.
5. `Riwayah` — show the riwayah name as secondary text, not a badge, when the
   provider has one; use a badge only when multiple riwayah are available.

### Provider test strategy & env

Current coverage is all unit-level with a mocked `fetch`. No test calls a real
provider.

| Provider         | Existing unit tests                | Env required                                      | Live test needs             | Remaining gap                                    |
| ---------------- | ---------------------------------- | ------------------------------------------------- | --------------------------- | ------------------------------------------------ |
| MP3Quran v3      | 14 adapter + 18 helpers            | none                                              | none                        | contract test; `de` now covered                  |
| Itqan            | 15                                 | optional `ITQAN_API_KEY`                          | a key for higher limits     | contract test; pagination covered                |
| Qurani.ai        | 34 adapter + 22 helpers            | none (public)                                     | none                        | contract test; 164 probe requests                |
| Quran Foundation | 23 adapter + 3 client + 4 provider | optional `QURAN_FOUNDATION_CLIENT_ID` + `_SECRET` | credentials for OAuth paths | public fallback; 429/`Retry-After`, token expiry |
| MP3Quran v4      | none yet                           | flag + `MP3QURAN_V4_BASE_URL`                     | none                        | fixtures from staging                            |

Layers:

1. **Unit (every PR, no env).** Keep the mocked tests. Add the missing
   localization and env-matrix cases.
2. **Contract (`LIVE_PROVIDER_TESTS=1`).** Opt-in, skipped by default. Assert
   response shape, field names, non-empty lists, CORS headers and a playable
   URL. Quran Foundation uses the public `api.quran.com` endpoints when
   credentials are absent, and the OAuth paths when they are set. Live tests
   that check OAuth behaviour must skip, not fail, without credentials.
3. **Fixtures.** Store sanitized real responses and assert the mapping against
   them, so upstream shape drift fails without a network call.
4. **API integration.** Cover `/api/reciters` with `sources` filtering,
   per-language names, and the >2 MB cache bypass.

Run contract tests in a weekly scheduled workflow with repo secrets, never in
the PR job. A provider outage should open an issue, not block a merge.

| PR  | Title                                                          | Scope                                             |
| --- | -------------------------------------------------------------- | ------------------------------------------------- |
| 5h  | `test(providers): localization, env matrix and live contracts` | unit gaps, opt-in contract suite, weekly workflow |

### Provider optimization backlog

- **MP3Quran v3**: 167 KB list; 299 moshafs, 297 already on
  `cdn.mp3quran.net` (2 still on `server15`). Cache 1 h; never refetch per
  request; use the CDN host directly.
- **MP3Quran v4**: 13 KB reciters / 46 KB recitations. Fetch once, build
  playlists locally, use `If-None-Match`, prefer `mp3_64` on slow networks.
- **Itqan**: remove the 214 KB-per-reciter N+1 (2.49 MB total). Lazy-load
  tracks; send `Accept-Language`.
- **Qurani.ai**: 208 audio editions / 151 reciters; avoid probing every
  edition, cache probes, request timings only for the selected surah.
- **Quran Foundation**: cache token and responses; respect `429` +
  `Retry-After`; request `segments` only when word-level is needed. Without
  OAuth credentials, use the public `api.quran.com/api/v4` fallback (14
  chapter reciters, 114 tracks, no auth) and accept English names.

---

## Issue list for GitHub

`gh` (2.103.3) is installed and authenticated as `adelpro`. Use it for all
GitHub operations instead of raw API calls:

```bash
gh pr view 91 --repo adelpro/open-tarteel
gh pr checks 91 --repo adelpro/open-tarteel
gh pr diff 91 --repo adelpro/open-tarteel
gh pr merge 91 --repo adelpro/open-tarteel --squash --delete-branch
```

Create the issues above one by one, or bulk-create from a title/label list:

```bash
gh issue create --repo adelpro/open-tarteel \
  --title "perf(reciters): slim list DTO and detail endpoint" \
  --body "See docs/ROADMAP.md stage 5c." \
  --label "area:provider,type:perf,stage:5"
```

Labels: `area:build`, `area:provider`, `area:player`, `area:offline`,
`area:ui`, `area:a11y`, `area:seo`, `type:bug`, `type:feature`, `type:perf`,
`stage:1` … `stage:10`.

Dependency order:

```
0a–0e → merge develop
      → 1a, 1b
      → 2a–2c, 2b-1…2b-4
      → 3a, 3b
      → 4a–4d
      → 5a, 5c, 5d, 5b, 5e, 5f, 5g, 5h
      → 6a–6e
      → 7a–7d
      → 8a, 8b
      → 9a–9c
      → 10a–10e
```

---

## Decisions log

- `skipWaiting: false`: keep the current caches until the user accepts the
  update, so playback/downloads are never swapped mid-flight. The alternative
  is `true` + delete `PwaUpdater`.
- MP3Quran v4: separate provider, beta label, flag off by default, v3 kept.
- Tahfeez: review and fix the existing `develop` implementation; do not
  reimplement.
- UI cleanup: incremental, token-based, no redesign.
- Provider order for range navigation: v4 → v3 → Itqan → Qurani.ai → QF.
- Netlify: deploy previews are the staging model; the tunnel is temporary.
