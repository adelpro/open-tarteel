# Audit results

Method: compare provider output against the reference index, per ayah, using the
interval repair from [timing-alignment.md](timing-alignment.md). Scripts are
throwaway probes; the numbers below are what the plan is based on.

## Text, tajweed, translation

| Check                              | Result                                     |
| ---------------------------------- | ------------------------------------------ |
| Stored ayahs vs pinned Tanzil copy | 6,236 / 6,236 byte-identical               |
| Per-surah counts                   | 1:7, 2:286, 9:129, 112:4, 114:6, all exact |
| Whitespace hygiene                 | only U+0020, single, no edges, 0 anomalies |
| Annotations inside the text        | 0 out of bounds (60,057 checked)           |
| Annotation ordering                | ascending by `start`, 0 inversions         |
| Overlapping annotations            | 40 pairs (later wins)                      |
| English rows vs ayah ids           | 6,236 / 6,236 identical                    |
| English per-surah counts           | exact, all 114 surahs                      |

Lesson worth keeping: the first download of the pinned Tanzil file arrived
truncated at 50:6, 4,636 of 6,236 ayahs, and still parsed perfectly. A digest
check is the only thing that catches that.

## Quran Foundation: full catalogue

14 chapter reciters × 114 surahs = 1,596 requests, 0 failures. Id 168 excluded
(repeats for children: 95.94%, 5,516 malformed rows).

Locked set: 13 reciters, 81,068 verses, 1,006,590 words.

| Metric                    | Value                 |
| ------------------------- | --------------------- |
| Words with a timing       | 1,001,089, **99.45%** |
| Verses below 85% coverage | 564, **0.70%**        |
| Malformed rows discarded  | 107                   |
| Per-reciter range         | 97.63% – 100.00%      |

Best: al-Afasy Streaming 100.00%, Yasser ad-Dussary 99.98%, al-Husary 100.00%.
Weakest kept: Abdul Basit (id 2) 97.63%.

### How the Quran Foundation set is applied

Unlike v4, this provider has no generated allowlist. The reciter catalogue is
fetched from `/content/api/v4/resources/chapter_reciters` with OAuth2 client
credentials, and each entry's `riwaya` comes from `qirat.name` (defaulting to
Hafs). The locked set is the 13 reciters left after id 168 is excluded; there is
no sampled probe because the full 14 × 114 = 1,596-request audit covered every
recitation.

The exclusion is about data quality, not capability. Id 168 repeats every phrase
for children: 95.94% of words timed, 5,516 malformed rows, 51 verses with no
timing at all. It is hardcoded as `quran.foundation:168` in
`FOLLOW_ALONG_EXCLUDED_IDS` (`src/services/reciters/capabilities.ts`) and
`canUseFollowAlong` returns the `'unaudited'` block reason for it. Every other
reciter in the locked set is enabled, subject to the same runtime checks as v4:
the provider must publish word timings (it does), the riwaya must be Hafs, and
`hasTimings` must not be `false`.

At playback, timings come from
`/content/api/v4/chapter_recitations/{id}/{chapter}?segments=true`, whose shape
is `audio_file.timestamps[].segments = [[word, start, end]]` per verse.
`parseQuranFoundationWords` keeps repeated segments but drops malformed rows,
non-integer word numbers, non-finite times and `end <= start`. `repairAyah` then
drops word numbers outside `1..wordCount`, keeps every occurrence of a repeated
word, and computes coverage as **distinct timed words / reference word count**.
Below `MIN_WORD_COVERAGE = 0.85` the ayah sets `fallback: true` and is highlighted
at ayah level instead. That is what the 564 verses (0.70%) use. OAuth returns
floats and a negative `duration`; only `start`/`end` are trusted.

So the 99.45% figure is a full-census coverage measurement, not a sample, and it
applies only to the 13 locked reciters. It still does not prove timing accuracy.

## MP3Quran v4: probe then curated audit

No production host: `api.mp3quran.net/v4` is 404; only `api-staging` answers. The
catalogue object has no word-timing flag, so availability was probed.

Probe: 235 Hafs recitations × 3 surahs (1, 36, 112) = 705 requests.

| Metric                           | Value |
| -------------------------------- | ----- |
| Endpoints returning 404          | 108   |
| Recitations with data            | 216   |
| Complete on all 3 surahs at 100% | 171   |
| Malformed rows                   | 0     |
| Estimated words                  | 0     |

Curated set: ids 4, 5, 24, 29, 30, 49, 52, 86, 89, 107, 113, 118, Al-Shatri,
Al-Ajamy, Al-Tunaiji, Al-Ghamdi, Al-Shuraym, Abdul Basit, As-Sudais, Hani
ar-Rifai, Yasser ad-Dussary, Al-Minshawi, Al-Husary, Al-Afasy.

Full audit: 12 recitations × 114 surahs = 1,368 requests, 0 failures.

| Metric                              | Value                         |
| ----------------------------------- | ----------------------------- |
| Words                               | 929,160                       |
| Timed                               | **99.99%**                    |
| Verses below 85% coverage           | 5                             |
| Malformed rows                      | 0                             |
| Repeat segments (kept as intervals) | 36,585                        |
| Out-of-range segments               | 36 = 3 ayahs × 12 recitations |

The 36 are the segmentation divergence documented in
[reference-index.md](reference-index.md), not data errors. Earlier runs counted
48 because 37:130 was measured with the basmala join applied; the corrected
index keeps four words there, so that verse no longer produces an out-of-range
row. Coverage percentages are unchanged.

## MP3Quran v4: ten-surah probe (2026-11-24)

The original 12-recitation audit above remains the gold standard. To widen
coverage without re-running 1,368 requests per recitation, the whole Hafs
catalogue was probed on ten surahs — 1, 2, 9, 18, 36, 49, 55, 67, 87 and 114.

| Metric                          | Value                                   |
| ------------------------------- | --------------------------------------- |
| Hafs recitations in the catalogue | 235                                     |
| Sampled surahs                  | 10                                      |
| Maximum word-timing requests    | 2,350 (fewer: missing surahs short-circuit) |
| Recitations passing             | **168**                                 |
| Original 12 still included      | yes                                     |
| Blocked                         | 67                                      |

A recitation passes only if every sampled surah returns word-timing data and
the aggregate timed/total word count across those surahs is at least 85%.

### How the 85% is applied

For each surah, `validateSurah` counts two numbers against the local reference
index. `total` is the sum of every ayah's word count (`w`); `timed` is the
number of **distinct** provider word indices that land inside an ayah's `1..w`
bounds after the split-verse remap (`2:181`, `8:6`, `13:37`) and the ayah offset
(`b`). Malformed, out-of-range and duplicate rows are dropped or collapsed, so
`timed` counts words, not rows.

`passesProbe` pools those numbers across all ten surahs and compares
`sum(timed) / sum(total)` with `MIN_COVERAGE = 0.85`. Each surah is weighted by
its word count. The ten surahs hold **12,102 reference words** (Al-Baqarah
alone 6,120, An-Nas 24).

The pool is deliberate: surah 114 has six ayat of `[8, 2, 2, 4, 5, 3]` words.
If the four-word ayah is un-timed, that surah alone scores 20/24 = 83.33% and
would fail — but in the pool it costs four words out of 12,102, giving 99.97%,
so the recitation passes. Short surahs are noisy, and an ayah with no timing is
already handled during playback by the per-ayah fallback. Judging each surah on
its own would reject good recitations over one small, recoverable gap.

The only per-surah failure that short-circuits is a missing `data.words` array:
a surah with no word-timing endpoint disqualifies the recitation before the
pool is counted. The per-surah `ok` flag is computed but not used by the live
probe; it exists for the offline `--self-test` fixtures, which pin both a
passing mixed sample (5/6 plus 760/760) and a failing 50/100 sample.

Result: **168 passed, 67 blocked** out of 235 Hafs candidates. The probe paces
requests at 500 per minute against the staging host's 600-per-minute ceiling
and exits non-zero on transport or HTTP errors, so a partial run cannot publish
a truncated allowlist.

The resulting IDs are checked in at
`src/services/reciters/follow-along-v4-ids.generated.ts` and consumed by
`canUseFollowAlong`. This is availability verification, not a full-census
accuracy audit; the 99.99% figure above applies only to the original 12.

## What is not proven

- Timing _accuracy_: no ground truth exists. Only coverage and index validity.
- Tajweed rule _correctness_: scholarly, not computable here.
- v4 catalogue beyond the 168 probe-verified recitations: 67 Hafs recitations
  were blocked or remain unproven, so they are not exposed. The original 12
  below were fully audited; the rest were checked on ten surahs only.
- Translation licence: the API exposes no licence field; CC BY-ND is recorded
  from the gallery page.
- Current tanzil.net release vs the pinned 2017 copy: not byte-diffed yet.
