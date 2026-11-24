# Offline-first boot + tri-state offline mode — design

Date: 2026-11-23

## Intent

Open Tarteel should open with zero network after having been used once online, play reciters/surahs the user downloaded, and let the user download more reciters while connected. The manual "Offline mode" switch should no longer be the only thing that decides whether the downloads-only UI appears.

The v2 Cloudflare Worker test (`.gstack/browse-reports/2026-11-23-offline-v2/REPORT.md`) showed the download/playback path works, but exposed three blocking gaps: the service worker did not register itself, the precached shell only covers bare Arabic paths, and offline behaviour is driven by a manual flag rather than real connectivity.

## Goals

1. Fix SW registration on the Cloudflare/OpenNext build; verify the worker actually controls the page.
2. Cold-start the app offline in Arabic, English and German, from cached shell + cached Quran text.
3. Play any explicitly downloaded surah offline (already works — keep it working), including seeking.
4. Keep the manual download flow for reciters and surahs.
5. Make offline behaviour automatic by default, with explicit user override.
6. Fix the `?query=Ibrahim` case: an English query must still find a downloaded reciter when offline (report issue 4, now in scope).

## Non-goals / out of scope

- Issue 5 from the report: "new version available" on every fresh load. Only fix if the reproduction shows the same registration root cause; otherwise file it separately.
- Full offline support for every remote provider URL not already matched in `src/sw.ts`.

## Constraints / current state

- `src/sw.ts` already precaches `/`, `/offline`, `/about`, `/settings`, all 114 `/data/quran/*.json` files, and build assets into Serwist's precache plus a separate `pages` cache. Runtime caching covers the reciter catalog (`api-reciters-v3`, 30 days), app assets, audio (`quran-offline-downloads` for explicit downloads, `quran-audio-v2` for incidental plays), and navigation with a document fallback.
- `next.config.ts` uses `@serwist/next` with `register: isProduction`. In the Cloudflare Worker test the worker never registered (`getRegistrations()` empty); manually registering `/sw.js` made it active and controlling.
- `forcedOfflineAtom` (`src/jotai/atom.ts`, key `forced-offline`, boolean, default `false`) is read by `use-network-status.ts`, `offline-redirect.tsx`, and the Settings page. `useNetworkStatus()` returns `forcedOffline ? false : isOnline`, and its consumers (player, player-controls, playlist, reciters-list, network-status-indicator, exit-fullscreen) already implement the downloads-only UI. So the clean approach is to change what this one hook returns, not to rewrite those components.
- The shared connectivity store in `use-network-status.ts` already dedupes probes; it throttles to one check per 10 s and probes `/offline-check?t=...` only when a SW controls the page.
- Locale URLs: Arabic is bare, English/German use `/en` and `/de` prefixes (`src/lib/seo/routes.ts`). Client navigation currently drops the prefix on some reciter links (report issue 3).
- i18n labels live in the app's message catalogue and need ar/en/de updates.

## Approaches considered

1. **Tri-state setting: Auto / On / Off, default Auto (chosen).** Auto derives offline from connectivity; On forces downloads-only; Off forces online behaviour. Keeps user control for the cases where automatic detection is wrong (captive portals, deliberate data saving) and needs one extra setting. The user explicitly chose this shape.
2. **Pure auto, remove the toggle.** Simpler model and smallest settings surface, but no way to force downloads-only while connected, and persisted `forced-offline: true` would need discarding. Rejected: loses deliberate control.
3. **Auto-flip the existing boolean toggle.** Smallest code change, but the setting would change behind the user's back and could override a deliberate choice. Rejected.

All three require fixes 1–2; they differ only in how offline state is decided.

## Decisions (how it gets built)

### State model

- Replace `forcedOfflineAtom` with `offlineModeAtom: 'auto' | 'on' | 'off'`, persisted under a new key, default `'auto'`.
- One-time migration from the legacy boolean `forced-offline`: `true` → `'on'`, `false` → `'auto'`; remove the old key afterwards. Invalid/missing values fall back to `'auto'`.
- `useNetworkStatus()` returns effective online state:
  - `'on'` → always offline;
  - `'off'` → always online (no filtering; real network failures still fall back to cached SW responses);
  - `'auto'` → the connectivity store's state.
- Hysteresis in the connectivity store: two consecutive failed probes before flipping to offline, one successful probe to flip back; keep the 10 s throttle and `navigator.onLine === false` as immediate offline. `offline-check` stays `NetworkOnly` in the SW.
- The offline banner action becomes context-aware: in `'on'` it switches to `'auto'`; in `'auto'` while offline it re-runs the probe ("Retry") without changing the setting.
- Settings shows a three-way control (Auto / On / Off) with new localized labels in ar, en and de; replace the current checkbox.

### Fix 1 — SW registration

- Turn off `@serwist/next`'s own `register` and register `/sw.js` from a dedicated client component mounted in the root layout, with `updateViaCache: 'none'` and an explicit `/` scope.
- Await `navigator.serviceWorker.ready` and confirm `navigator.serviceWorker.controller` (or a `controllerchange`) before considering the worker active; keep the existing `PwaUpdater` waiting-worker flow for updates.
- Re-verify in a real browser on the Cloudflare Worker deploy: registration, control, cold-start offline, audio range requests. The 456-byte hashed `swe-worker-*.js` is Serwist's helper stub, not the app worker — do not treat it as the SW.

### Fix 2 — locale-aware shell

- Precache the locale shell documents at install: bare `/` plus `/en`, `/de`, and the same set for `/offline`, `/about`, `/settings` (and their absolute-URL keys).
- Make the navigation fallback locale-aware: for a navigation under `/en` or `/de`, try that locale's cached shell first, then the bare `/` shell, then the inline HTML fallback. Preserve query-independent matching.
- Preserve the UI locale through player navigation. Reciter documents are intentionally canonicalized to bare Arabic URLs (`/en/reciter/[id]` and `/de/reciter/[id]` redirect there, and `generateMetadata` pins the canonical to the bare path), so changing the page tree is out of scope. Instead carry the interface locale in a `lang=en|de` query parameter on those redirects and on the `reciter-route` cookie; `IntlProviderWrapper` reads that parameter in its client layout effect when the path has no locale prefix, and `useLocalePath()` then keeps generating prefixed links. No SSR output or canonical URL changes: the server still renders the Arabic document and `omitLanguages: true` stays.
- Keep the existing app-assets scraping at install, but ensure it covers assets referenced by the locale shells too.

### Fix 3 — derived state

- After the state-model change, `forcedOfflineAtom`/`offlineModeAtom` should be read only by Settings and the migration; all filtering continues to flow through `useNetworkStatus()`.
- Update `offline-redirect.tsx` so its "returning online" logic uses effective online state (it must stay on `/offline` while forced offline).

### Fix 4 — `?query=Ibrahim` in the Downloaded tab

- Root-cause hypothesis: `?query=...` is read into the filter via `nuqs`, and `fuzzySearch` only matches `reciter.name`. The catalog is fetched with `?language=<locale>`, so when a client navigation drops the `/en` prefix the app switches to Arabic, gets Arabic names, and an English query matches nothing. Fix 2's locale-prefix preservation may therefore fix this case directly.
- Verify that hypothesis in the browser. Regardless of the outcome, harden the filter so a query matches against both the currently localized name and the canonical/Arabic name stored in the offline download record (`OfflineDownloadRecord.reciterName`), with the existing Arabic-aware normalization (`normalizeArabicText`, case/spaceless/tashkeel handling) applied to both sides.
- Do not special-case one reciter or one spelling: the fix must work for any English/Arabic name pair that was downloaded.
- Add a regression test: on `/en`, with a downloaded reciter whose English name is "Ibrahim Al-Akdar" and Arabic name is "إبراهيم الأكدار", `?query=Ibrahim` returns that reciter in the Downloaded tab while offline.

## Testing

- Unit: mode derivation (all three states), legacy boolean migration, hysteresis (two failures to enter offline, one success to leave), 10 s throttle, SSR-safe first render.
- Component: Settings three-way control and the context-aware banner action; existing tests that mock `forcedOfflineAtom` updated.
- Browser (Cloudflare Worker deploy): after one online visit, cut the network, open `/`, `/en`, `/de`; verify shell renders, Quran text loads, a downloaded surah plays and seeks, the downloads-only UI appears in Auto, On keeps it when online, Off removes it, and returning online recovers in Auto.
- Browser regression for the query case: on `/en` offline with `?query=Ibrahim`, the Downloaded tab lists the downloaded reciter and the `/en` prefix survives navigation into the player.

## Risks

- The Cloudflare/OpenNext build may serve `sw.js` from a different asset path or with different headers than the Next build. `next.config.ts` already sets `Cache-Control: no-cache` and `Service-Worker-Allowed: /`; verify on the deployed worker before assuming the config is enough.
- With `skipWaiting: false` in production, existing users must accept the update prompt before they get the new shell precache. The QA pass must accept the update first.
- Auto detection can still be wrong on captive portals; the On/Off override is the escape hatch.
