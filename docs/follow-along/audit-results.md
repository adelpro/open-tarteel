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
the aggregate timed/total word count across those surahs is at least 85%. The
aggregate is deliberate: surah 114 has six ayat, so one un-timed ayah alone
gives 83%, which the app's per-ayah fallback handles. A recitation is skipped
when a sampled surah has no word-timing endpoint or its aggregate falls below
the threshold. The probe paces requests at 500 per minute against the staging
host's 600-per-minute ceiling and exits non-zero on transport or HTTP errors,
so a partial run cannot publish a truncated allowlist.

The resulting IDs are checked in at
`src/services/reciters/follow-along-v4-ids.generated.ts` and consumed by
`canUseFollowAlong`. This is availability verification, not a full-census
accuracy audit; the 99.99% figure above applies only to the original 12.

## What is not proven

- Timing _accuracy_: no ground truth exists. Only coverage and index validity.
- Tajweed rule _correctness_: scholarly, not computable here.
- v4 catalogue beyond the 12 curated recitations: 223 Hafs recitations unproven,
  so they are not exposed.
- Translation licence: the API exposes no licence field; CC BY-ND is recorded
  from the gallery page.
- Current tanzil.net release vs the pinned 2017 copy: not byte-diffed yet.
