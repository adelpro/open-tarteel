# Follow-along: extend MP3Quran v4 and credit API providers

Date: 2026-11-24

## Intent

Follow-along currently covers 13 Quran Foundation reciters and 12 MP3Quran v4
recitations out of 235 Hafs. The 12 come from a full 114-surah audit. The About
page credits text and tajweed sources but never names or thanks the API
providers. This change widens v4 with a probe-based allowlist, adds a simple
provider-credits section to the About page, exposes follow-along support as a
first-class capability, and adds a reciter-list filter for it.

## Goals

- Enable follow-along on every v4 Hafs recitation that publishes usable word
  timings (~171 candidates).
- Keep the "never light the wrong word" guarantee via the existing per-surah
  coverage fallback.
- Thank all four API providers by name and logo on the About page.
- Add `followAlong` to the provider capability registry and surface it as a
  provider badge.
- Let users filter the reciter list down to recitations that support
  follow-along.
- Update the follow-along feature documentation to match the new scope.

## Non-goals

- Full 114-surah accuracy audit of every recitation (~19k requests).
- Reciter portraits or reciter-level logos.
- Adding new providers or changing the timing engine / player UI.

## Constraints

- The v4 catalogue has no word-timing flag, so only a probe can establish
  availability.
- The v4 host is `api-staging.mp3quran.net` — no production host; it is slow and
  rate-limited. A single catalogue page took 20s to fetch during inspection.
- `hasTimings` comes from the catalogue's ayah-timing flag, so it cannot gate
  word timings.
- The About page is a client component; provider catalogues are fetched
  server-side and are not embedded in the page.
- There are no provider or reciter logo assets in the repo today. Logos must be
  bundled locally because the app is offline-first.
- Locale strings exist in ar, en and de and all must stay in sync.

## Approaches

1. **Probe-based allowlist (chosen).** Re-probe the Hafs recitations on a sample
   of surahs, allowlist IDs with valid in-range word indices and >=85% coverage,
   and keep the runtime per-surah fallback as the safety net. A few thousand
   requests instead of ~19k. Trade-off: less certainty than a full audit, but a
   bad surah degrades to whole-ayah highlighting rather than a wrong word.
2. Trust the existing 3-surah probe in `audit-results.md` — rejected: that
   document records only the 12 curated IDs, not the 171 that passed.
3. Full 114-surah audit of every recitation — rejected as disproportionate for
   this mode given the slow staging host.

For the About page, a simple section with four provider cards (local logo, name,
external link) and a thank-you line. Hotlinked logos are rejected (offline-first,
unstable URLs); reciter portraits are out of scope.

## Decisions

- Add `scripts/follow-along/probe-v4.mjs`: fetch the v4 catalogue, keep Hafs,
  probe a sample of surahs, validate rows with `parseMp3quranV4Words`,
  `repairAyah` and `storedFromMp3quranV4`, then emit the allowlist.
- Replace the hard-coded 12-entry `FOLLOW_ALONG_V4_RECITER_IDS` with the
  generated list, checked in as source, so the gate stays deterministic.
- Keep `FOLLOW_ALONG_EXCLUDED_IDS` (QF 168) and the 85% fallback unchanged.
- Update `capabilities.test.ts` — the `size === 12` assertion becomes an
  invariant check on the generated list.
- Add `src/components/provider-credits.tsx` and render it in `about-page.tsx`
  directly after the existing "مصادر تلاوة متعددة" paragraphs as one simple
  section: heading, thank-you line, and a small responsive grid of four cards
  (logo, name, external link with `rel="noopener noreferrer"`).
- Bundle four local logo files under `public/images/providers/`.
- Rewrite `about.followAlong.hafs`, `about.followAlong.accuracy` and
  `settings.followAlongAvailabilityProviders` in ar/en/de so they no longer
  claim "twelve audited" or quote the v4 99.99% figure; describe probe-based
  verification instead.
- Add `followAlong: boolean` to `ProviderCapabilities` in `capabilities.ts`, set
  it true for QF and v4 only, and render a badge for it in `provider-badge.tsx`.
  This is a provider-level display flag; the actual per-reciter decision stays
  `canUseFollowAlong(source, moshaf)` so the two are never confused.
- Add `showFollowAlongOnly` state to `reciters-list.tsx`, pass it with an
  `onFollowAlongOnlyChange` callback into `reciter-filters.tsx`, add a Switch row
  there matching the existing "Downloadable" row, and filter with
  `canUseFollowAlong(r.source, r.moshaf)`. Update `activeCount` and `clearAll`.
- Add filter label/hint strings in ar/en/de, and update `provider-badge.test.tsx`
  and `capabilities.test.ts` for the new field and badge.
- Update `docs/follow-along/README.md` (Scope, Locked sources, Honest accuracy),
  `audit-results.md` and `data-sources.md` with the new count, capability and
  filter.

## Left to the builder

- Final probe sample size (recommend 10 surahs) and the resulting ID count.
- Logo sourcing and a short attribution note for each provider.

## Status

Awaiting approval.
