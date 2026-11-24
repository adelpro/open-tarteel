# Offline-first boot + tri-state offline mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the app open and play downloaded recitations with zero network after one online visit, with a three-level Auto/On/Offline mode and locale-preserving offline shell.

**Architecture:** A single derived "effectively offline" value (setting + connectivity) drives the existing downloads-only UI. The service worker is registered explicitly on every build, precaches the locale app shells, and serves cached documents/audio on navigation failures. Locale is carried through canonical reciter URLs as a `lang` query parameter so the interface language does not reset. Search matches both the localized and the stored offline reciter name.

**Tech Stack:** Next.js App Router, Jotai + `atomWithStorage`, Serwist service worker, Vitest + Testing Library, Playwright, `nuqs` for URL filter state.

**Spec:** `docs/superpowers/specs/2026-11-23-offline-first-design.md`

## Global Constraints

- Default offline mode is `auto`; legacy `forced-offline: true` maps to `on`, `false` to `auto`.
- Auto requires two consecutive failed probes to enter offline; one success leaves it. `navigator.onLine === false` is immediate offline. Probe throttle stays at 10 s.
- `/offline-check` remains `NetworkOnly` in the service worker.
- Reciter documents stay canonically Arabic at bare paths; only the UI locale may travel in a `lang=en|de` query parameter. Server output and `generateMetadata` canonical URLs do not change.
- Existing audio caches (`quran-offline-downloads`, `quran-audio-v2`) and the `RangeRequestsPlugin` behaviour must keep working.
- Commands: unit tests `yarn test:run <file>`; Playwright `yarn build && yarn test:offline <file>`; types `yarn type-check`; lint `yarn lint`.

## Review Focus

- Legacy stored `forced-offline: true` on an existing device → must still force downloads-only after upgrade. Test: Task 1, migration assertions.
- One transient failed connectivity probe on a flaky connection → Auto must not flip the UI to offline. Test: Task 2, hysteresis assertions.
- Mode `off` while the network is genuinely down → no downloads-only filtering, but cached shell/audio still served by the SW. Test: Task 2 derivation assertion + Task 4 offline e2e.
- Offline cold start on `/en` or `/de` → locale shell, not Arabic `/`, and the prefix/locale survives navigation into the player. Tests: Task 5 unit + e2e.
- Downloaded reciter whose localized name is Arabic but whose stored name is English (or vice versa) with `?query=Ibrahim` → the reciter is found in the Downloaded tab. Tests: Task 6 unit + e2e.

---

### Task 1: Tri-state offline mode atom + legacy migration

**Files:**

- Create: `src/jotai/offline-mode.ts`
- Modify: `src/jotai/atom.ts` (remove `forcedOfflineAtom`, lines 23–26)
- Test: `src/jotai/offline-mode.test.ts`

**Interfaces:**

- Consumes: `createAtomWithStorage` from `src/jotai/create-atom-with-storage.ts`.
- Produces: `OfflineMode = 'auto' | 'on' | 'off'`; `offlineModeAtom` (key `offline-mode`, default `'auto'`, `getOnInit: true`, validating guard `isOfflineMode`); `isEffectivelyOffline(mode: OfflineMode, online: boolean): boolean` returning `mode === 'on' || (mode === 'auto' && !online)`; `migrateLegacyForcedOffline(): void` run once at module init.

- [ ] **Step 1: Write the failing tests** in `src/jotai/offline-mode.test.ts`:
  - with `localStorage['forced-offline'] = 'true'`, after importing the module, `localStorage['offline-mode'] === '"on"'` and the legacy key is removed;
  - with `'false'`, migrated value is `'"auto"'`;
  - with no legacy key, `offline-mode` is absent and the atom default is `'auto'`;
  - `isEffectivelyOffline` table: `('on', true) → true`, `('auto', false) → true`, `('auto', true) → false`, `('off', false) → false`.
  - Use `vi.resetModules()` + dynamic `import()` so migration runs fresh in each case.

- [ ] **Step 2: Run them** — `yarn test:run src/jotai/offline-mode.test.ts` — expected FAIL (module not found).

- [ ] **Step 3: Implement `src/jotai/offline-mode.ts`**. `migrateLegacyForcedOffline()` is guarded by `typeof window !== 'undefined'`, reads the raw legacy string, writes the mapped mode under `offline-mode`, removes the legacy key, and is idempotent. Call it before creating the atom. Delete `forcedOfflineAtom` from `src/jotai/atom.ts`.

- [ ] **Step 4: Run tests** — `yarn test:run src/jotai/offline-mode.test.ts` — expected PASS. Run `yarn type-check` and fix any unresolved imports of `forcedOfflineAtom` by pointing them at the new module in the next tasks (temporary type errors from Tasks 2–3 are expected until those tasks land).

- [ ] **Step 5: Commit** — `git add src/jotai/offline-mode.ts src/jotai/offline-mode.test.ts src/jotai/atom.ts && git commit -m "feat: tri-state offline mode atom with legacy migration"`

### Task 2: Connectivity hysteresis and derived network status

**Files:**

- Modify: `src/hooks/use-network-status.ts`
- Modify: `src/hooks/use-network-status.test.ts`
- Modify: `src/hooks/use-network-status.ssr.test.tsx` (only if the changed import requires it)

**Interfaces:**

- Consumes: `offlineModeAtom`, `isEffectivelyOffline` from Task 1.
- Produces: `useNetworkStatus(): boolean` (same signature as today, now derived); `retryConnectivityCheck(): Promise<void>`; `resetNetworkStatusForTests(): void` (clears module-level state, listeners and `wired` flag).

- [ ] **Step 1: Write the failing tests** in `src/hooks/use-network-status.test.ts`:
  - replace the `forcedOfflineAtom` test with three cases using a fresh Jotai store: mode `'on'` → `false` even while `navigator.onLine` is true; mode `'off'` → `true` even after an `offline` event; mode `'auto'` → follows online/offline events.
  - hysteresis case: enable `vi.useFakeTimers()`, stub `navigator.serviceWorker` with a truthy `controller` and `globalThis.fetch` with `vi.fn()`; first rejected `/offline-check` fetch leaves the result `true`, a second rejected fetch (after `vi.advanceTimersByTime(11_000)`) makes it `false`; a resolved fetch makes it `true` again. Call `resetNetworkStatusForTests()` in `beforeEach` and restore stubs/timers in `afterEach`.

- [ ] **Step 2: Run them** — `yarn test:run src/hooks/use-network-status.test.ts` — expected FAIL (missing exports/behaviour).

- [ ] **Step 3: Implement** in `src/hooks/use-network-status.ts`: add a module-level `failedChecks` counter; in `check()`, on a failed probe increment it and emit offline only when it reaches 2, on success reset it to 0 and emit online; `navigator.onLine === false` still emits offline immediately and sets the counter to 2. `useNetworkStatus()` subscribes to the store as before but returns `!isEffectivelyOffline(mode, online)`; export `retryConnectivityCheck()` calling `check(true)` and `resetNetworkStatusForTests()` for tests.

- [ ] **Step 4: Run tests** — `yarn test:run src/hooks/use-network-status.test.ts src/hooks/use-network-status.ssr.test.tsx` — expected PASS.

- [ ] **Step 5: Commit** — `git add src/hooks/use-network-status.ts src/hooks/use-network-status.test.ts src/hooks/use-network-status.ssr.test.tsx && git commit -m "feat: derive offline status from setting and connectivity with hysteresis"`

### Task 3: Settings tri-state control and context-aware offline banner

**Files:**

- Modify: `src/app/(ar)/settings/page.tsx` (offline-mode row, lines ~215–238)
- Modify: `src/components/network-status-indicator.tsx`
- Modify: `src/locales/en.json`, `src/locales/ar.json`, `src/locales/de.json` (settings block ~221–224, offline block ~236–241)
- Test: `tests/offline-mode.spec.ts`

**Interfaces:**

- Consumes: `offlineModeAtom`, `OfflineMode` (Task 1); `retryConnectivityCheck` (Task 2); `Segmented` from `src/components/ui/segmented.tsx`.
- Produces: Settings control with three options whose `aria-pressed` reflects the mode; banner action that switches `on → auto` or retries the probe in `auto`.

- [ ] **Step 1: Write the failing Playwright test** in `tests/offline-mode.spec.ts`: replace the switch test with one that opens `/settings`, finds the group named "Offline mode", asserts `Auto` is pressed by default, clicks `On` and asserts its `aria-pressed`, checks the description mentions downloaded content only, then clicks `Off` and asserts the offline banner is hidden and downloads-only UI absent. Keep the existing selector check but drive it by clicking `On` rather than a switch.

- [ ] **Step 2: Run it** — `yarn build && yarn test:offline tests/offline-mode.spec.ts` — expected FAIL (no segmented control).

- [ ] **Step 3: Replace the Settings switch** with `Segmented<OfflineMode>` (options `auto`, `on`, `off`); make the description text depend on the selected mode.

- [ ] **Step 4: Update `network-status-indicator.tsx`**: read `offlineModeAtom`; show the warning tone only for mode `on`; render "Go online" for `on` (sets `auto`) and "Retry" for `auto` (calls `retryConnectivityCheck()`).

- [ ] **Step 5: Add locale keys** `settings.offlineModeAuto|On|Off`, `settings.offlineModeDescriptionAuto|On|Off`, `offline.retry` in all three JSON files with natural ar/en/de copy.

- [ ] **Step 6: Run tests** — `yarn build && yarn test:offline tests/offline-mode.spec.ts` — expected PASS. Then `yarn test:run src/components/offline-redirect.test.tsx` — expected PASS.

- [ ] **Step 7: Commit** — `git add src/app/'(ar)'/settings/page.tsx src/components/network-status-indicator.tsx src/locales tests/offline-mode.spec.ts && git commit -m "feat: three-level offline mode settings and banner actions"`

### Task 4: Explicit service-worker registration on every build

**Files:**

- Modify: `next.config.ts` (`withSerwistInit` options, lines 35–44)
- Create: `src/components/service-worker-register.tsx`
- Modify: `src/components/root-shell.tsx` (mount next to `PwaUpdater`)
- Test: `src/components/service-worker-register.test.tsx`

**Interfaces:**

- Consumes: browser `navigator.serviceWorker`.
- Produces: a client component that registers `/sw.js` with `{ scope: '/', updateViaCache: 'none' }`, awaits `navigator.serviceWorker.ready`, and resolves a `controllerchange` if no controller is present.

- [ ] **Step 1: Write the failing component test** in `src/components/service-worker-register.test.tsx`: stub `navigator.serviceWorker` with `register`, `ready`, `controller: null`, and `addEventListener`; render the component; assert `register` was called once with `/sw.js` and `{ scope: '/', updateViaCache: 'none' }`, and that a dispatched `controllerchange` event settles without an unhandled rejection.

- [ ] **Step 2: Run it** — `yarn test:run src/components/service-worker-register.test.tsx` — expected FAIL (module not found).

- [ ] **Step 3: Implement**: set `register: false` in `withSerwistInit`; create the client component with a single mount effect (no re-registration on re-render) and a `console.warn` on registration failure; mount it in `RootShell`. Keep `PwaUpdater` and `ServiceWorkerRefresh` untouched.

- [ ] **Step 4: Run tests** — `yarn test:run src/components/service-worker-register.test.tsx` and `yarn build && yarn test:offline tests/offline.spec.ts` — expected PASS. The existing cold-offline test must still pass with no manual registration step added.

- [ ] **Step 5: Verify on the Cloudflare Worker deploy** (`yarn build:cf && yarn deploy:cf`, or the current Worker URL if redeployed): in a fresh browser context, confirm `getRegistrations()` contains `/sw.js`, the worker controls the page after load, and a cached surah plays after going offline. Acceptance: no empty registration list, no `ERR_INTERNET_DISCONNECTED` on the second load.

- [ ] **Step 6: Commit** — `git add next.config.ts src/components/service-worker-register.tsx src/components/service-worker-register.test.tsx src/components/root-shell.tsx && git commit -m "fix: register the service worker explicitly on all builds"`

### Task 5: Locale-preserving player navigation and locale-aware offline shell

**Files:**

- Modify: `src/sw.ts`
- Modify: `src/components/intl-provider-wrapper.tsx`
- Modify: `src/lib/reciter-route.ts`
- Modify: `src/components/reciter-route-cookie.tsx`
- Modify: `src/app/(en)/en/reciter/[id]/page.tsx`, `src/app/(de)/de/reciter/[id]/page.tsx`
- Test: `src/lib/reciter-route.test.ts`, `src/components/reciter-route-cookie.test.tsx`, create `src/components/intl-provider-wrapper.test.tsx`, modify `tests/offline.spec.ts`

**Interfaces:**

- Consumes: `localeFromPath`, `withLocale` from `src/lib/seo/routes.ts`; `useIntl().locale`.
- Produces: `reciterRouteFor(reciter, locale?: Language): string` appending `lang=<locale>` for non-Arabic locales; `isReciterRoute(value: string): boolean` accepting the optional `lang=en|de` parameter and rejecting other values; `IntlProviderWrapper` choosing `lang` over the bare pathname on the client.

- [ ] **Step 1: Write failing unit tests**:
  - `src/lib/reciter-route.test.ts`: `reciterRouteFor(reciter, 'en') === '/reciter/mp3quran.net-1?moshafId=1&lang=en'`; `isReciterRoute` accepts that string and rejects `lang=fr`, `//evil.test/...`, and a missing `moshafId`.
  - `src/components/reciter-route-cookie.test.tsx`: with `IntlProvider locale="en"`, the written cookie is the `lang=en` route.
  - `src/components/intl-provider-wrapper.test.tsx`: mock `usePathname` to return `/reciter/x`, set `window.location.href` to `/reciter/x?moshafId=1&lang=en`, and assert a child renders English copy from `en.json` after effects; with no `lang`, assert Arabic copy.

- [ ] **Step 2: Run them** — `yarn test:run src/lib/reciter-route.test.ts src/components/reciter-route-cookie.test.tsx src/components/intl-provider-wrapper.test.tsx` — expected FAIL.

- [ ] **Step 3: Extend `src/lib/reciter-route.ts`** so `reciterRouteFor` appends `lang=<locale>` for non-Arabic locales and `isReciterRoute` accepts only that optional parameter shape.

- [ ] **Step 4: Carry the locale through navigation**: pass `useIntl().locale` from `ReciterRouteCookie`; append `lang=en`/`lang=de` in the English/German reciter redirects; in `IntlProviderWrapper`'s client layout effect, when `localeFromPath(pathname)` is Arabic, use a valid `lang` query value if present, otherwise the pathname locale. Do not change SSR initial state or metadata.

- [ ] **Step 5: Implement the SW shell**: extend `APP_SHELL_URLS` in `src/sw.ts` to include `/en`, `/de`, `/en/offline`, `/de/offline`, `/en/about`, `/de/about`, `/en/settings`, `/de/settings` (plus their absolute-URL keys). In the navigation handler's fallback, when the URL has `lang=en|de` or an `/en|/de` prefix, try that locale's cached shell before bare `/`. Run `cacheOfflinePageAssets` for each precached shell so locale documents get their CSS/JS/fonts cached too.

- [ ] **Step 6: Run unit tests** — `yarn test:run src/lib/reciter-route.test.ts src/components/reciter-route-cookie.test.tsx src/components/intl-provider-wrapper.test.tsx` — expected PASS.

- [ ] **Step 7: Add and run the e2e locale check** in `tests/offline.spec.ts`: after going offline, open `/en?moshafId=1`, assert the English UI label and English offline banner, click Playlist, then navigate into the player and assert the URL still carries `lang=en` and the UI stays English. Run `yarn build && yarn test:offline tests/offline.spec.ts` — expected PASS.

- [ ] **Step 8: Commit** — `git add src/sw.ts src/components/intl-provider-wrapper.tsx src/lib/reciter-route.ts src/components/reciter-route-cookie.tsx src/app/'(en)' src/app/'(de)' tests && git commit -m "fix: preserve interface locale in offline shell and player navigation"`

### Task 6: Offline search matches localized and stored reciter names

**Files:**

- Modify: `src/utils/search.ts`
- Modify: `src/hooks/use-filter-sort.ts`
- Modify: `src/components/reciters-list.tsx`
- Test: `src/utils/search.test.ts`, modify `tests/offline.spec.ts`

**Interfaces:**

- Consumes: `OfflineDownloadRecord.reciterName` from `useOfflineDownload().records`; `generateFavId`.
- Produces: `withNameAliases<T extends { id: string; name: string }>(items: T[], aliases: Record<string, string[]>): T[]` — copies an item and appends its aliases to `name` so `fuzzySearch` matches either language; `useFilterSort` accepts optional `nameAliases: Record<string, string[]>`.

- [ ] **Step 1: Write the failing unit tests** in `src/utils/search.test.ts`: an item with `name: 'إبراهيم الأكدار'` and alias `'Ibrahim Al-Akdar'` is returned by `fuzzySearch(withNameAliases([item], { x: ['Ibrahim Al-Akdar'] }), 'Ibrahim')`; without the alias it is not returned.

- [ ] **Step 2: Run them** — `yarn test:run src/utils/search.test.ts` — expected FAIL (missing export).

- [ ] **Step 3: Implement `withNameAliases`** in `src/utils/search.ts` and add the optional `nameAliases` parameter to `useFilterSort`; run the existing `fuzzySearch` on the alias-augmented list, then map results back to the original reciter objects (match by `generateFavId`).

- [ ] **Step 4: Wire the alias map in `RecitersList`** from `useOfflineDownload().records`, keyed by `generateFavId` of each reciter (associate records by `reciterId`/`moshafId`), and pass it to `useFilterSort`.

- [ ] **Step 5: Run tests** — `yarn test:run src/utils/search.test.ts src/components/reciters-list.test.tsx` — expected PASS (ignore the second file if absent).

- [ ] **Step 6: Add the e2e query check** to `tests/offline.spec.ts` after the existing offline assertions: with the network still off, open `/en?query=Ibrahim`, open the reciter selector, assert the downloaded reciter is listed (not "No downloaded reciters found"), and assert the URL still carries `lang=en` after entering the player. Run `yarn build && yarn test:offline tests/offline.spec.ts` — expected PASS.

- [ ] **Step 7: Commit** — `git add src/utils/search.ts src/hooks/use-filter-sort.ts src/components/reciters-list.tsx tests/offline.spec.ts && git commit -m "fix: match offline downloads by localized and stored reciter names"`

## Final verification

- `yarn type-check && yarn lint && yarn test:run` — all green.
- `yarn build && yarn test:offline` — full Playwright suite green.
- Deploy to the Cloudflare Worker and repeat the manual smoke check from Task 4, plus the `/en?query=Ibrahim` case from Task 6.
