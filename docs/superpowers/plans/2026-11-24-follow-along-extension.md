# Follow-along Extension Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend follow-along to every MP3Quran v4 Hafs recitation with usable word timings, expose it as a provider capability and reciter-list filter, credit the API providers on the About page, and update the feature docs.

**Architecture:** A probe script validates sampled surahs and emits a checked-in allowlist that replaces the hard-coded 12 IDs. `capabilities.ts` gains a provider-level display flag while `canUseFollowAlong()` remains the per-reciter gate. The reciter filter and About-page credits are thin UI layers over those two sources of truth.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest + Testing Library, react-intl, react-icons, Tailwind.

**Spec:** `docs/superpowers/specs/2026-11-24-follow-along-extension-design.md`

## Global Constraints

- Hafs ʿan ʿĀṣim only; every other riwayah stays blocked.
- Only providers publishing word-level timings can serve the mode.
- `NEXT_PUBLIC_ENABLE_FOLLOW_ALONG` is the master kill switch; `NEXT_PUBLIC_ENABLE_MP3QURAN_V4` must be on for v4 reciters to exist at all.
- No production v4 host: use `https://api-staging.mp3quran.net/v4`.
- `hasTimings` comes from an ayah-timing flag and must never gate word timings.
- Per-surah fallback stays at 85% coverage (`MIN_WORD_COVERAGE = 0.85`).
- Provider `followAlong` capability is display-only; per-reciter truth is `canUseFollowAlong(source, moshaf)`.
- Logos are bundled locally; the app is offline-first.
- ar, en and de locale files stay in sync for every new string.
- Conventional commits (commitlint), scope `follow-along`.

## Review Focus

- A partial probe must never publish a truncated allowlist → Task 1 adds `--self-test` fixtures for malformed rows, out-of-range words and sub-85% coverage, and the live run exits non-zero on any failed request.
- A provider badge must not imply every reciter works → Task 2 asserts `getCapabilities(MP3QURAN_V4).followAlong === true` while `canUseFollowAlong(MP3QURAN_V4, '999') === false`.
- The filter must exclude un-audited and non-Hafs recitations even when the provider badge is shown → Task 3 tests a mixed reciter fixture through `canUseFollowAlong`.
- Broken logo assets or wrong provider links must be caught → Task 4 asserts four names and exact hrefs render, and verifies all four asset files exist.
- Stale "twelve audited" copy must not survive the change → Task 5 greps locales and docs for the old phrase and asserts none remain.

---

### Task 1: Probe v4 and generate the follow-along allowlist

**Files:**

- Create: `scripts/follow-along/probe-v4.mjs`
- Create: `src/services/reciters/follow-along-v4-ids.generated.ts`
- Modify: `src/services/reciters/capabilities.ts:142-162` and `:203-208`
- Modify: `src/services/reciters/capabilities.test.ts:131-134`

**Interfaces:**

- Consumes: `public/data/quran/{surah}.json` (`ayahs[i].w` word count, `.b` basmala words), `MP3QURAN_V4_SPLITS` from `src/services/quran-text/words.ts:91-95`.
- Produces: `FOLLOW_ALONG_V4_RECITER_IDS: ReadonlySet<string>` exported from `follow-along-v4-ids.generated.ts` and re-exported from `capabilities.ts`.

- [ ] **Step 1: Create `scripts/follow-along/probe-v4.mjs` with only the `--self-test` block**

Define fixture assertions for a not-yet-written `validateSurah(ayahs, rows, splits)` covering: valid rows pass; a row with `endMs <= startMs` is dropped; a provider word resolving outside `1..ayah.w` is dropped; a surah whose distinct valid words / total words is below `0.85` fails. Also assert the `storedFromMp3quranV4` mapping for `2:181` word 4 → 3. No implementation yet.

- [ ] **Step 2: Run the self-test to verify it fails**

Run: `node scripts/follow-along/probe-v4.mjs --self-test`
Expected: FAIL with `validateSurah is not defined`.

- [ ] **Step 3: Implement `validateSurah(ayahs, rows, splits)`**

Use the basmala offsets and `MP3QURAN_V4_SPLITS` mapping described in Interfaces. Drop basmala rows, malformed rows and word indices outside `1..ayah.w`; compute distinct valid words / total words and compare with `MIN_COVERAGE = 0.85`.

- [ ] **Step 4: Run the self-test to verify it passes**

Run: `node scripts/follow-along/probe-v4.mjs --self-test`
Expected: PASS.

- [ ] **Step 5: Implement the live probe in the same file**

Constants: `BASE = 'https://api-staging.mp3quran.net/v4'`, `SAMPLE_SURAHS = [1, 2, 9, 18, 36, 49, 55, 67, 87, 114]`, `MIN_COVERAGE = 0.85`, 3 retries, 60s per request. Paginate `/recitations?locale=en` via `links.next`; keep recitations whose `riwayahs[0].code === 'hafs_an_asim'`. For each sampled surah fetch `/recitations/{id}/surahs/{n}/word-timings`; a recitation passes only if all 10 requests succeed and every surah validates. Any failed request aborts with a non-zero exit and writes nothing.

- [ ] **Step 6: Run the live probe and inspect the generated list**

Run: `node scripts/follow-along/probe-v4.mjs`
Expected: a generated TS file with more than 12 IDs containing every original ID (`4, 5, 24, 29, 30, 49, 52, 86, 89, 107, 113, 118`). Record the ID count and probe date in the generated comment.

- [ ] **Step 7: Wire the generated set into `capabilities.ts` and update its test**

Import `FOLLOW_ALONG_V4_RECITER_IDS` from the generated file and re-export it; delete the hard-coded set. Replace the `size === 12` assertion with: size >= 12, contains all 12 original IDs, and contains `'118'`. Keep `FOLLOW_ALONG_EXCLUDED_IDS` unchanged.

- [ ] **Step 8: Verify**

Run: `yarn test:run src/services/reciters/capabilities.test.ts && yarn type-check`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add scripts/follow-along src/services/reciters/follow-along-v4-ids.generated.ts src/services/reciters/capabilities.ts src/services/reciters/capabilities.test.ts
git commit -m "feat(follow-along): probe v4 word timings and generate reciter allowlist"
```

### Task 2: Add the follow-along provider capability and badge

**Files:**

- Modify: `src/services/reciters/capabilities.ts:6-24` and `:28-120`
- Modify: `src/components/provider-badge.tsx:26-104`
- Modify: `src/components/provider-badge.test.tsx`
- Modify: `src/locales/ar.json`, `src/locales/en.json`, `src/locales/de.json`

**Interfaces:**

- Consumes: nothing new.
- Produces: `ProviderCapabilities.followAlong: boolean`, badge key `'follow-along'`, message id `provider.badge.followAlong`.

- [ ] **Step 1: Write the failing badge tests**

In `provider-badge.test.tsx`, assert exact key arrays: Quran Foundation → `['follow-along', 'timing', 'word']`; MP3Quran v4 → `['beta', 'follow-along', 'timing', 'word']`; MP3Quran, Itqan and Qurani.ai arrays unchanged. Add an assertion that `getCapabilities(LinkSource.MP3QURAN_V4).followAlong === true` while `canUseFollowAlong(LinkSource.MP3QURAN_V4, { id: '999', riwaya: Riwaya.Hafs } as never) === false`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test:run src/components/provider-badge.test.tsx`
Expected: FAIL on the missing badge key and field.

- [ ] **Step 3: Add the capability field and badge**

Add `followAlong: boolean` to `ProviderCapabilities`; set `true` only for QURAN_FOUNDATION and MP3QURAN_V4. Add `FOLLOW_ALONG` via `badge('follow-along', 'provider.badge.followAlong', 'Follow-along', <FiPlay size={11} aria-hidden="true" />, 'success')` and push it in `getProviderBadges` immediately after the beta check, before download/timing.

- [ ] **Step 4: Add locale strings**

Add `provider.badge.followAlong` in all three locale files with Arabic "تتبّع التلاوة", English "Follow-along", German "Mitlesen".

- [ ] **Step 5: Verify**

Run: `yarn test:run src/components/provider-badge.test.tsx src/services/reciters/capabilities.test.ts && yarn type-check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/services/reciters/capabilities.ts src/components/provider-badge.tsx src/components/provider-badge.test.tsx src/locales
git commit -m "feat(follow-along): expose follow-along provider capability and badge"
```

### Task 3: Add the reciter-list follow-along filter

**Files:**

- Modify: `src/components/reciters-list.tsx:34`, `:62`, `:136-161`, `:163-171`, `:354-363`
- Modify: `src/components/reciter-filters.tsx:16-26`, `:55-72`, `:172-195`
- Modify: `src/locales/ar.json`, `src/locales/en.json`, `src/locales/de.json`
- Create: `src/components/reciter-filters.test.tsx`

**Interfaces:**

- Consumes: `canUseFollowAlong` from `src/services/reciters/capabilities.ts`.
- Produces: `ReciterFilters` props `followAlongOnly: boolean` and `onFollowAlongOnlyChange: (value: boolean) => void`.

- [ ] **Step 1: Write the failing component test**

Create `src/components/reciter-filters.test.tsx`. Mock `HTMLDialogElement.prototype.showModal` and `.close` with `vi.fn()`. Render inside `IntlProvider locale="en" messages={en}` with all required props including `followAlongOnly: false`. Assert: a switch labelled "Follow-along" exists; clicking it calls `onFollowAlongOnlyChange(true)`; with `followAlongOnly: true` the filter button's badge shows `1`; clicking "Clear all" calls `onSourcesChange([])`, `onRiwiyatChange([])`, `onDownloadableOnlyChange(false)` and `onFollowAlongOnlyChange(false)`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test:run src/components/reciter-filters.test.tsx`
Expected: FAIL — no Follow-along switch.

- [ ] **Step 3: Implement the filter row**

Add the two props to `Props` and the destructuring, count it in `activeCount`, reset it in `clearAll`, and add a Switch row after the Downloadable row with label `filter.followAlong` and hint `filters.followAlongHint`.

- [ ] **Step 4: Run the component test to verify it passes**

Run: `yarn test:run src/components/reciter-filters.test.tsx`
Expected: PASS.

- [ ] **Step 5: Wire the filter into the list**

In `reciters-list.tsx`: import `canUseFollowAlong`, add `const [showFollowAlongOnly, setShowFollowAlongOnly] = useState(false)`, add `if (showFollowAlongOnly) result = result.filter((r) => canUseFollowAlong(r.source, r.moshaf));` inside the existing `filteredReciters` memo and its dependency array, add `showFollowAlongOnly` to the `setVisibleCount` effect deps, and pass both new props to `<ReciterFilters>`.

- [ ] **Step 6: Add locale strings**

Add `filter.followAlong` ("Follow-along" / "تتبّع التلاوة" / "Mitlesen") and `filters.followAlongHint` ("Only recitations with word-level timings" / "التلاوات التي توفّر توقيتًا على مستوى الكلمة" / "Nur Rezitationen mit Wort-Timings") in ar, en and de.

- [ ] **Step 7: Verify**

Run: `yarn test:run src/components/reciter-filters.test.tsx && yarn type-check && yarn lint`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/components/reciter-filters.tsx src/components/reciter-filters.test.tsx src/components/reciters-list.tsx src/locales
git commit -m "feat(follow-along): filter reciters by follow-along support"
```

### Task 4: Credit the API providers on the About page

**Files:**

- Create: `src/components/provider-credits.tsx`
- Create: `src/components/provider-credits.test.tsx`
- Create: `public/images/providers/mp3quran.svg`, `public/images/providers/quran-foundation.svg`, `public/images/providers/itqan.svg`, `public/images/providers/qurani-ai.svg`
- Modify: `src/components/pages/about-page.tsx:80-86`
- Modify: `src/locales/ar.json`, `src/locales/en.json`, `src/locales/de.json`

**Interfaces:**

- Consumes: nothing new.
- Produces: `<ProviderCredits />` with no props.

- [ ] **Step 1: Write the failing component test**

Create `src/components/provider-credits.test.tsx`. Render `<ProviderCredits />` inside `IntlProvider locale="en" messages={en}`. Assert four links with exact hrefs (`https://mp3quran.net`, `https://quran.foundation`, `https://itqan.dev`, `https://qurani.ai`), each with `rel="noopener noreferrer"`, each showing the provider name and an `<img>` with a local `/images/providers/*.svg` src. Assert the section has a non-empty thank-you line.

- [ ] **Step 2: Run the test to verify it fails**

Run: `yarn test:run src/components/provider-credits.test.tsx`
Expected: FAIL — component does not exist.

- [ ] **Step 3: Build the component and assets**

Create `provider-credits.tsx` as a server-safe component: a `<section>` with a heading, a thank-you paragraph, and a responsive grid of four cards. Each card has a local SVG logo (`width`/`height` set, `alt` = provider name), the name, and an external `<a target="_blank" rel="noopener noreferrer">`. Source each official wordmark from the provider's public site where one is published; where none is available, draw a typographic wordmark in the app's visual style. Keep note of each logo's source URL for Task 5.

- [ ] **Step 4: Render it on the About page**

In `about-page.tsx`, insert `<ProviderCredits />` immediately after the two paragraphs in the "مصادر تلاوة متعددة" block and before the closing `</div>` at line 86.

- [ ] **Step 5: Add locale strings**

Add `about.providers.creditsTitle` and `about.providers.thanks` in ar, en and de.

- [ ] **Step 6: Verify assets and tests**

Run: `yarn test:run src/components/provider-credits.test.tsx && yarn type-check`
Expected: PASS. Additionally run `ls public/images/providers` and confirm four SVG files exist.

- [ ] **Step 7: Commit**

```bash
git add src/components/provider-credits.tsx src/components/provider-credits.test.tsx src/components/pages/about-page.tsx src/locales public/images/providers
git commit -m "feat(follow-along): credit API providers on the About page"
```

### Task 5: Rewrite follow-along copy and feature docs

**Files:**

- Modify: `src/components/follow-along-about.tsx:45-57`
- Modify: `src/locales/ar.json`, `src/locales/en.json`, `src/locales/de.json`
- Modify: `docs/follow-along/README.md:26`, `:44-45`, `:58-63`
- Modify: `docs/follow-along/audit-results.md:41-75`
- Modify: `docs/follow-along/data-sources.md` (logo source URLs)
- Modify: `README.md:17-23`

**Interfaces:**

- Consumes: the final allowlist size and probe date from Task 1.
- Produces: no code interfaces.

- [ ] **Step 1: Write the failing stale-copy check**

Add a temporary shell assertion (run inline, not committed): `grep -RniE 'twelve audited|الاثنتي عشرة المدققة|99\.99%|size\)\.toBe\(12\)' src/locales src/components/follow-along-about.tsx docs/follow-along README.md` must find no matches after this task. Run it now and confirm it FAILS with matches.

- [ ] **Step 2: Rewrite the About strings**

In `about.followAlong.hafs` and `about.followAlong.accuracy` for ar/en/de, replace "twelve audited MP3Quran v4 recitations" and the 99.99% figure with: "recitations verified by a sampled word-timing probe" plus the actual count from Task 1, and keep the Quran Foundation 99.45% figure and the 85% fallback explanation. In `settings.followAlongAvailabilityProviders`, replace the "twelve audited" wording with the same phrasing.

- [ ] **Step 3: Update the docs**

In `docs/follow-along/README.md`: Scope → "recitations that pass the v4 word-timing probe"; Locked sources → replace "12 audited recitations" with the probed count; Honest accuracy → state the Quran Foundation 99.45% figure as still audited and the v4 figure as probe-verified, not a full-census number. In `audit-results.md`, add a dated section recording the new probe (sample surahs, request count, passing count, failures for missing data) without deleting the original 12-recitation audit history. In `data-sources.md`, record each provider logo's source URL (or "local wordmark"). Add a "Follow-along" bullet to the Features section of the root `README.md`.

- [ ] **Step 4: Run the stale-copy check again**

Run the same `grep` from Step 1.
Expected: PASS with no matches.

- [ ] **Step 5: Verify and commit**

Run: `yarn type-check && yarn test:run src/services/reciters/capabilities.test.ts src/components/provider-credits.test.tsx`
Expected: PASS.

```bash
git add src/components/follow-along-about.tsx src/locales docs/follow-along README.md
git commit -m "docs(follow-along): update scope, accuracy and provider credits"
```
